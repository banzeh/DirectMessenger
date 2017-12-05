const config = require('../config')

const AppMessenger = new Vue({
  el: config.app.mountElement,
  data: {
    chats: [],
    activeChat: {},
    activeChatUsers: {},
    searchString: '',
    searchResults: [],
    searchActive: false
  },

  computed: {},

  methods: {
    logout: function () {
      ipcRenderer.send('logout')
    },

    unfollowers: function () {
      ipcRenderer.send('getUnfollowers')
    },

    getChatThumbnail: function (chat) {
      let account = chat.accounts[0]
      if (account && account._params.picture) {
        return account._params.picture
      }
      return chat._params.inviter._params.picture
    },

    getChatTitle: function (chat) {
      let usernames
      if (chat.accounts.length > 1) {
        usernames = this.getChatGroupTitle(chat)
      } else {
        usernames = chat.accounts[0] ? chat.accounts[0]._params.username : chat._params.inviter._params.fullName;
      }
      return usernames
    },

    getChatGroupTitle: function (chat) {
      if (chat._params.title) {
        return chat._params.title
      }
      return chat.accounts.map((acc) => acc._params.username).join(', ')
    },

    getChatPreview: function (chat) {
      const message = chat.items[0]._params.text || 'Media message'
      return truncate(message, 25)
    },

    activateChat: function (chat) {
      this.setActiveChat(chat)
      getChat(chat.id)
    },

    setActiveChat: function (chat) {
      this.activeChat = chat
    },

    searchChats: function () {
      const str = this.searchString.trim()

      if (str.length > 3) {
        this.searchActive = true
        ipcRenderer.send('searchUsers', str)
      } else if (str.length === 0) {
        this.searchActive = false
      }
    }
  }
})
