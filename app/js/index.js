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
    if (!AppMessenger.chats.length || AppMessenger.chats[0].items[0].id !== chats_[0].items[0].id) {
      AppMessenger.chats = chats_
    }
  })

  ipcRenderer.on('chat', (evt, chat_) => {
    console.log('chat')
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
    AppMessenger.searchResults = users
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

  getLoggedInUser()
  getChatList()
})
