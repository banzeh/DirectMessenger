function openInBrowser (url) {
  electron.shell.openExternal(url);
}

function format (number) {
  return number > 9 ? "" + number: "0" + number;
}

function formatTime (time) {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let date = new Date(time);
  let hours = format(date.getHours());
  let minutes = format(date.getMinutes());
  let day = format(date.getDate());
  let month = MONTHS[date.getMonth()];
  return `${day}, ${month}.  ${hours}:${minutes}`
}

function truncate (text, length) {
  return text.length > length ? `${text.substr(0, length)} ...` : text;
}

function dom(content) {
  var template = document.createElement('template');
  template.innerHTML = content;
  return template.content.firstChild;
}

function getUsernames (chat_, shouldTruncate) {
  let usernames;
  if (chat_.accounts.length > 1) {
    usernames = getGroupName(chat_);
  } else {
    usernames = chat_.accounts[0] ? chat_.accounts[0]._params.username : chat_._params.inviter._params.fullName;
  }
  return shouldTruncate ? truncate(usernames, 20) : usernames;
}

function getGroupName (chat_) {
  if (chat_._params.title) {
    return chat_._params.title;
  }
  return chat_.accounts.map((acc) => acc._params.username).join(', ');
}

function getThumbnail (chat_) {
  let account = chat_.accounts[0];
  if(account && account._params.picture) {
    return account._params.picture;
  } else {
    return chat_._params.inviter._params.picture;
  }
}

function isCurrentChat (chat_) {
  if (window.currentChatId === DUMMY_CHAT_ID) {
    return  !chatsHash[chat_.id];
  } else {
    return chat_.id === window.currentChatId;
  }
}

function setActive (el) {
  let currentActive = document.querySelector('.app-users__item.__active');
  if (currentActive) currentActive.classList.remove('__active');
  el.classList.add('__active');

  // close opened emoji pane
  document.querySelector('.emojis').classList.add('hide');
}

function scrollToChatBottom () {
  let msgContainer = document.querySelector('.app-messages__list');
  msgContainer.scrollTop = msgContainer.scrollHeight;
}

function getMsgPreview (chat_) {
  var msgPreview = chat_.items[0]._params.text || 'Media message';
  return truncate(msgPreview, 25);
}

function isActive (chat_) {
  return chat_.id === window.chat.id;
}

function markAsRead (id, li) {
  let chat_ = unreadChats[id];
  if (chat_) {
    chat_.thread_id = chat_.id;
    if (window.shouldSendSeenFlags) {
      ipcRenderer.send('markAsRead', chat_);
    }

    delete unreadChats[id];
  }
  li.classList.remove('notification'); // or whatever
}

function sendMessage (message, accounts, isNewChat) {
  var users = accounts.map((account) => account.id);
  ipcRenderer.send('message', { message, isNewChat, users })
}

function submitMessage (chat_) {
  var input = document.querySelector(MSG_INPUT_SELECTOR);
  var message = input.value;
  if (message.trim()) {
    sendMessage(message, chat_.accounts, !chat_.id);
    input.value = '';
    var div = renderMessage(message, 'outward');
    var msgContainer = document.querySelector('.app-messages__list');

    msgContainer.appendChild(div);
    scrollToChatBottom();
  }
}

function addSubmitHandler (chat_) {
  const input = document.querySelector(MSG_INPUT_SELECTOR);
  input.onkeyup = (evt) => {
    // allow new line when shift key is pressed
    if (evt.keyCode == 13 && !evt.shiftKey) {
      evt.preventDefault();
      submitMessage(chat_);
    }
  }
}

function addNotification (el, chat_) {
  if (chat_.items[0]._params.accountId == window.loggedInUserId) {
    return
  }

  const isNew = (chatsHash && chatsHash[chat_.id] &&
    chatsHash[chat_.id].items[0].id !== chat_.items[0].id
  );
  if (isNew) unreadChats[chat_.id] = chat_;

  if (unreadChats[chat_.id]) {
    if (chat_.id === window.chat.id && document.hasFocus()) {
      markAsRead(chat_.id, el);
    } else {
      el.classList.add('notification');
      window.notifiedChatId = el.getAttribute("id");
      if (isNew) ipcRenderer.send('notify', `new message from ${getUsernames(chat_)}`);
    }
  }
}

function registerChatUser (chat_) {
  if (chat_.accounts.length === 1) {
    window.chatUsers[chat_.accounts[0].id] = chat_.id;
  } else {
    window.chatUsers[chat_.id] = chat_.accounts;
  }
}

function getIsSeenText (chat_) {
  var text = '';
  if (!chat_.items || !chat_.items.length || chat_.items[0]._params.accountId != window.loggedInUserId) {
    return '';
  }

  var seenBy = chat_.accounts.filter((account) => {
    return (
      chat_._params.itemsSeenAt[account.id] &&
      chat_._params.itemsSeenAt[account.id].itemId === chat_.items[0].id
    )
  })

  if (seenBy.length === chat_.accounts.length) {
    text = 'Seen'
  } else if (seenBy.length) {
    text = `👁 ${getUsernames({accounts: seenBy})}`
  }
  return text;
}

function getLastMessageUser(message) {
  if (!window.lastMessageUserId || window.lastMessageUserId != message._params.accountId) {
    window.lastMessageUserId = message._params.accountId;
    if (window.lastMessageUserId === window.loggedInUserId) {
      return '';
    }
    let author = window.chatUsers[currentChatId].find(x => x.id === window.lastMessageUserId);
    if (author) {
      return `<span>${author._params.username}</span>`;
    }
  }
}

function showInViewer (dom) {
  const viewer = document.querySelector('.viewer');
  const viewerContent = viewer.querySelector('.content');
  viewer.classList.add('active');

  viewerContent.innerHTML = '';
  viewerContent.appendChild(dom);
}

function quoteText (text) {
  var input = document.querySelector(MSG_INPUT_SELECTOR);
  input.value = `${text}\n==================\n${input.value}`
  input.focus();
}