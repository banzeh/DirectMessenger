const Client = require('instagram-private-api').V1
const utils = require('./utils')

exports.checkAuth = function (session) {
  return new Promise((resolve, reject) => {
    if (!session) {
      const device = utils.getDevice()
      const storage = utils.getCookieStorage()
      if (!device || !storage) {
        return resolve({ isLoggedIn: false })
      }
      session = new Client.Session(device, storage)
    }

    session.getAccountId()
      .then(() => resolve({ isLoggedIn: true, session }))
      .catch(Client.Exceptions.CookieNotValidError, () => resolve({ isLoggedIn: false }))
  })
}

exports.login = function (username, password) {
  utils.clearCookieFiles()
  return new Promise((resolve, reject) => {
    const device = utils.getDevice(username)
    const storage = utils.getCookieStorage(`${__dirname}/cookies/${username}.json`)
    Client.Session.create(device, storage, username, password).then(resolve).catch(reject)
  })
}

exports.logout = function () {
  utils.clearCookieFiles()
}

exports.getChatList = function (session) {
  return new Promise((resolve, reject) => {
    var feed = new Client.Feed.Inbox(session, 10)
    feed.all().then(resolve).catch(reject)
  })
}

exports.getChat = function (session, chatId, cursor) {
  return new Promise((resolve, reject) => {
    utils.getById(session, chatId, cursor).then(resolve).catch(reject)
  })
}

exports.sendMessage = function (session, message, recipients) {
  return new Promise((resolve, reject) => {
    Client.Thread.configureText(session, recipients, message).then(resolve).catch(reject)
  })
}

exports.searchUsers = function (session, search) {
  return new Promise((resolve, reject) => {
    Client.Account.search(session, search).then(resolve).catch(reject)
  })
}

exports.seen = function (session, thread) {
  (new Client.Thread(session, thread)).seen()
}

exports.getUnfollowers = function (session) {
  return new Promise((resolve, reject) => {
    let followers = []
    let following = []
    const accountId = session._cookiesStore.storage.idx['i.instagram.com']['/'].ds_user_id.value

    const compare = () => {
      let hashedFollowers = {}
      followers.forEach((user) => {
        hashedFollowers[user.id] = true
      })

      let unfollowers = following.filter((user) => !hashedFollowers[user.id])
      resolve(unfollowers)
    }

    const getUsers = (newUsers, allUsers, usersGetter, otherUsersGetter) => {
      newUsers.forEach((user) => allUsers.push(user))
      // moreAvailable maybe null. We are dodging that.
      if (usersGetter.moreAvailable === false && otherUsersGetter.moreAvailable === false) {
        compare()
      } else if (usersGetter.moreAvailable !== false) {
        usersGetter.get()
          .then((users) => getUsers(users, allUsers, usersGetter, otherUsersGetter))
          .catch(reject)
      }
    }

    const followersGetter = new Client.Feed.AccountFollowers(session, accountId)
    const followingGetter = new Client.Feed.AccountFollowing(session, accountId)

    getUsers([], followers, followersGetter, followingGetter)
    getUsers([], following, followingGetter, followersGetter)
  })
}

exports.unfollow = function (session, userId) {
  Client.Relationship.destroy(session, userId)
}

exports.getLoggedInUser = function (session) {
  return new Promise((resolve, reject) => {
    session.getAccountId().then((id) => {
      Client.Account.getById(session, id).then(resolve).catch(reject)
    })
  })
}
