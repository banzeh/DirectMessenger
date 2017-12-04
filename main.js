const electron = require('electron');
const app = electron.app;
const Menu = electron.Menu;
const BrowserWindow = electron.BrowserWindow;
const path = require('path');
const url = require('url');
const instagram = require('./instagram');
const notifier = require('node-notifier');
const RATE_LIMIT_DELAY = 60000;
let pollingInterval = 10000;
let shouldNotify = false;

const config = require('./config');

// OSX needs custom notifier for custom notification icons
if (process.platform === 'darwin') {
  notifier.options.customPath = path.join(__dirname,
    'vendor/terminal-notifier.app/Contents/MacOS/terminal-notifier')
}

notifier.on('click', () => {
  app.focus();
  mainWindow.webContents.send('focusNotifiedChat');
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let session

function createWindow () {
  if (!mainWindow) {
    mainWindow = new BrowserWindow({
      width: config.app.width,
      height: config.app.height,
      icon: `${__dirname}/app/img/icon.png`,
      minWidth: config.app.min_width,
      title: config.app.name
    })
  }

  instagram.checkAuth(session).then((result) => {
    let view = result.isLoggedIn ? 'app/index.html' : 'app/login.html'
    session = result.session || session

    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, view),
      protocol: 'file:',
      slashes: true
    }))
  })

  mainWindow.on('closed', () => mainWindow = null)
}

function getChatList () {
  instagram.getChatList(session).then((chats) => {
    mainWindow.webContents.send('chatList', chats)

    setTimeout(getChatList, pollingInterval);
  }).catch(() => setTimeout(getChatList, RATE_LIMIT_DELAY))
}

let timeoutObj;
function getChat (evt, id, cursor) {
  instagram.getChat(session, id, cursor).then((chat) => {
    mainWindow.webContents.send('chat', chat);

    if (timeoutObj) clearTimeout(timeoutObj)

    timeoutObj = setTimeout(getChat, pollingInterval, {}, id);
  }).catch(() => setTimeout(getChat, RATE_LIMIT_DELAY, evt, id))
}

app.on('ready', () => {
  createWindow();
  mainWindow.setMenu(null);
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  // only call createWindow afeter mainWindow is set to null at
  // mainWindow.on('closed')
  if (mainWindow === null) createWindow()
})

// reduce polling frequency when app is not active.
app.on('browser-window-blur', () => {
  pollingInterval = 30000;
  shouldNotify = true;
})

app.on('browser-window-focus', () => {
  pollingInterval = 10000;
  shouldNotify = false;
  app.setBadgeCount(0);
})

electron.ipcMain.on('login', (e, data) => {
  console.log(data)
  instagram.login(data.username, data.password).then((session_) => {
    session = session_
    createWindow()
  }).catch((error) => {
    mainWindow.webContents.send('loginError', error.message);
  })
})

electron.ipcMain.on('logout', (evt, data) => {
  instagram.logout()
  session = null
  createWindow()
})

electron.ipcMain.on('getLoggedInUser', (evt) => {
  instagram.getLoggedInUser(session).then((user) => {
    mainWindow.webContents.send('loggedInUser', user);
  })
})

electron.ipcMain.on('getChatList', getChatList)

electron.ipcMain.on('getChat', getChat)

electron.ipcMain.on('message', (evt, data) => {
  instagram.sendMessage(session, data.message, data.users).then((chat) => {
    if (data.isNewChat) getChat(null, chat[0].id)
  })
})

electron.ipcMain.on('searchUsers', (evt, search) => {
  instagram.searchUsers(session, search).then((users) => {
    mainWindow.webContents.send('searchResult', users);
  })
})

electron.ipcMain.on('markAsRead', (evt, thread) => {
  instagram.seen(session, thread)
})

electron.ipcMain.on('notify', (evt, message) => {
  // OSX uses the default terminal notifier icon
  let icon = process.platform !== 'darwin' ? path.join(__dirname, '/app/img/icon.png') : undefined
  if (shouldNotify) {
    notifier.notify({
      title: config.app.name,
      sound: true,
      message, icon,
      wait: true
    });
    app.setBadgeCount(app.getBadgeCount() + 1);
  }
})

electron.ipcMain.on('getUnfollowers', (evt) => {
  instagram.getUnfollowers(session).then((users) => {
    mainWindow.webContents.send('unfollowers', users)
  })
})

electron.ipcMain.on('unfollow', (evt, userId) => {
  instagram.unfollow(session, userId)
})