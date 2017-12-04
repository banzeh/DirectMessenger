const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;
const config = require('../config');

window.AppLogin = new Vue({
  el: config.app.mountElement,
  data: {
    credentials: {
      username: '',
      password: ''
    },
    error: false,
    errorMessage: null,
    button: 'Login'
  },

  methods: {
    login: function() {

      this.button = 'Please wait...'

      if(this.credentials.username.length === 0 || this.credentials.username.length === 0) {
        this.showError('Please enter all required fields')
      } else {
        ipcRenderer.send('login', {
          username: this.credentials.username,
          password: this.credentials.password
        })
      }

    },

    showError: function(message) {
      this.error = false

      setTimeout(() => {
        this.error = true
        this.errorMessage = message
        this.button = 'Login'
      }, 100);
    }
  }
})

ipcRenderer.on('loginError', (e, errorMessage) => {
  AppLogin.showError(errorMessage)
})