var electron = require('electron');
var ipcRenderer = electron.ipcRenderer;
const config = require('../config');

window.AppLogin = new Vue({
  el: config.app.mountElement,
  data: {
    credentials: {
      username: null,
      password: null
    },
    error: null,
    button: 'Login'
  },

  methods: {
    login: function() {

      this.button = 'Please wait...'

      ipcRenderer.send('login', {
        username: this.credentials.username,
        password: this.credentials.password
      })
    }
  }
})

ipcRenderer.on('loginError', (evt, errorMessage) => {
  AppLogin.error = errorMessage
  AppLogin.button = 'Login'
})