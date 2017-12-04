const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;
const config = require('../config');

window.AppLogin = new Vue({
  el: config.app.mountElement,
  data: {
    credentials: {
      username: null,
      password: null
    },
    error: false,
    errorMessage: null,
    button: 'Login'
  },

  methods: {
    login: function() {

      this.button = 'Please wait...'

      ipcRenderer.send('login', {
        username: this.credentials.username,
        password: this.credentials.password
      })
    },

    showError: function(message) {
      this.error = true
      this.errorMessage = message
      this.button = 'Login'
    }
  }
})

ipcRenderer.on('loginError', (evt, errorMessage) => {
  AppLogin.showError(errorMessage)
})