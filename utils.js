const fs = require('fs')
const Client = require('instagram-private-api').V1
const path = require('path')

const cookiesDirectory = path.join(__dirname, 'cookies')

const canUseFileStorage = () => {
  try {
    fs.accessSync(cookiesDirectory, fs.W_OK)
    return true
  } catch (error) {
    return false
  }
}

const guessUsername = () => {
  let username
  if (canUseFileStorage()) {
    const files = fs.readdirSync(cookiesDirectory)
    if (files.length && files[0].endsWith('.json')) {
      username = files[0].slice(0, -5)
    }
  }
  return username
}

const getCookieStorage = (filePath) => {
  let storage
  let username

  if (canUseFileStorage()) {
    if (!filePath && (username = guessUsername())) {
      filePath = path.join(cookiesDirectory, `${username}.json`)
    }

    if (filePath) storage = new Client.CookieFileStorage(filePath)
  } else {
    storage = new Client.CookieMemoryStorage()
  }

  return storage
}

const clearCookieFiles = () => {
  if (canUseFileStorage()) {
    fs.readdirSync(cookiesDirectory).forEach((filename) => {
      fs.unlinkSync(path.join(cookiesDirectory, filename))
    })
  }
}

const getDevice = (username) => {
  let device
  username = username || guessUsername()
  if (username) {
    device = new Client.Device(username)
  }
  return device
}

const getById = function (session, id, cursor) {
  return new Client.Request(session)
    .setMethod('GET')
    .generateUUID()
    .setResource('threadsShow', {
      threadId: id,
      cursor: cursor
    })
    .send()
    .then(function (json) {
      return new Client.Thread(session, json.thread)
    })
}

module.exports = {
  canUseFileStorage,
  guessUsername,
  getCookieStorage,
  clearCookieFiles,
  getDevice,
  getById
}
