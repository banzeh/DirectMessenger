const ipcRenderer = electron.ipcRenderer

const selectors = {
  searchInput: null,

  usersList: null,

  messagesList: null,
  messagesTitle: null,

  menuButton: null,
  menuDropdown: null
}

function getLoggedInUser () {
  ipcRenderer.send('getLoggedInUser')
}

function getChat (id, cursor) {
  window.currentChatId = id
  ipcRenderer.send('getChat', id, cursor)
}

function getChatList () {
  ipcRenderer.send('getChatList')
}

function getUnfollowers () {
  ipcRenderer.send('getUnfollowers')
}

function unfollow (userId) {
  ipcRenderer.send('unfollow', userId)
}

// This code runs once the DOM is loaded (just in case you missed it).
document.addEventListener('DOMContentLoaded', () => {

  selectors.searchInput = document.querySelector('.app-search__input')
  selectors.usersList = document.querySelector('.app-users__list')
  selectors.messagesTitle = document.querySelector('.app-messages__title')
  selectors.messagesList = document.querySelector('.app-messages__list')

  selectors.menuButton = document.querySelector('.app-menu')
  selectors.menuDropdown = document.querySelector('.app-dropdown')

  selectors.menuButton.addEventListener('click', (e) => {
    selectors.menuDropdown.classList.add('__active')
  })

  selectors.menuDropdown.addEventListener('mouseleave', (e) => {
    selectors.menuDropdown.classList.remove('__active')
  })

  ipcRenderer.on('loggedInUser', (evt, user) => {
    window.loggedInUserId = user.id
    window.loggedInUser = user
  })

  ipcRenderer.on('chatList', (evt, chats_) => {
    if (!window.chats.length || window.chats[0].items[0].id !== chats_[0].items[0].id) {
      window.chats = chats_
      renderChatList(window.chats)
    }
  })

  ipcRenderer.on('chat', (evt, chat_) => {
    let isNewMessage = (
      !window.chat.items || !window.chat.items.length ||
      !chat_.items.length || window.chat.items[0].id != chat_.items[0].id ||
      getIsSeenText(chat_) != getIsSeenText(window.chat)
    )

    if (chat_._params && chat_._params.hasNewer) {
      renderChatOlderMessages(chat_)
      return
    }

    if (isNewMessage && isCurrentChat(chat_)) renderChat(chat_)
  })

  ipcRenderer.on('searchResult', (evt, users) => {
    renderSearchResult(users)
  })

  ipcRenderer.on('focusNotifiedChat', (evt) => {
    document.querySelector(`#${window.notifiedChatId}`).click()
  })

  ipcRenderer.on('unfollowers', (evt, users) => {
    renderUnfollowers(users)
  })

  document.querySelector('.app-input__emoji').onclick = () => {
    const onEmojiSelected = (emoji) => {
      document.querySelector(MSG_INPUT_SELECTOR).value += emoji
      document.querySelector('.emojis').classList.add('hide')
      document.querySelector(MSG_INPUT_SELECTOR).focus()
    }
    window.showEmojis(
      document.querySelector('.emojis-header'),
      document.querySelector('.emojis-body'),
      onEmojiSelected
    )
  }

  selectors.searchInput.onkeyup = (e) => {
    const value = e.target.value
    const trimmedValue = value.trim()

    console.log(trimmedValue.length)

    if (trimmedValue.length > 3) {
      console.log('searching')
      ipcRenderer.send('searchUsers', e.target.value)
    } else if (trimmedValue.length === 0) {
      renderChatList(window.chats)
    }
  }

  document.querySelector('#unfollowers').onclick = () => getUnfollowers()
  document.querySelector('#logout').onclick = () => ipcRenderer.send('logout')

  document.querySelector('#seen-flagger').onclick = (e) => {
    window.shouldSendSeenFlags = !window.shouldSendSeenFlags
    e.target.innerText = window.shouldSendSeenFlags ? `DON'T SEND "SEEN" RECEIPTS` : `SEND "SEEN" RECEIPTS`
  }

  // close modal viewer when esc is pressed
  document.onkeyup = (e) => {
    if (e.keyCode === 27) { // ESC keycode
      document.querySelector('.viewer').classList.remove('active')
    }
  }

  getLoggedInUser()
  getChatList()
})
