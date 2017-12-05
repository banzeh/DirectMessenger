const ipcRenderer = require('electron').ipcRenderer
const shell = require('electron').shell
const config = require('../config')

const AppLogin = new Vue({
  el: config.app.mountElement,
  data: {
    credentials: {
      username: '',
      password: ''
    },
    error: false,
    errorMessage: null,
    button: 'Login',
    links: config.instagram.links.login
  },

  methods: {
    login: function () {
      this.button = 'Please wait...'

      if (this.credentials.username.length === 0 || this.credentials.username.length === 0) {
        this.showError('Please enter all required fields')
      } else {
        ipcRenderer.send('login', {
          username: this.credentials.username,
          password: this.credentials.password
        })
      }
    },

    showError: function (message) {
      this.hideError()

      setTimeout(() => {
        this.error = true
        this.errorMessage = message
        this.button = 'Login'
      }, 150)
    },

    hideError: function () {
      this.error = false
    },

    openLink: function (link) {
      shell.openExternal(link)
    }
  }
})

ipcRenderer.on('loginError', (e, errorMessage) => {
  AppLogin.showError(errorMessage)
})
