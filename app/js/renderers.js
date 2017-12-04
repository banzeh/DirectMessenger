const renderers = {
  mediaShare: renderMessageAsPost,
  text: renderMessageAsText,
  like: renderMessageAsLike,
  media: renderMessageAsImage,
  reel_share: renderMessageAsUserStory,
  link: renderMessageAsLink,
  placeholder: renderMessageAsPlaceholder,
  actionLog: renderMessageAsAction
}

function renderMessages(messages, newMessages) {
  messages.forEach((message) => {
    if (message._params.accountId == window.loggedInUserId) var direction = 'outward';
    else var direction = 'inward';

    var div = renderMessage(message, direction,
      message._params.created, message._params.type);
    newMessages ? selectors.messagesList.appendChild(div) :
      selectors.messagesList.insertBefore(div, selectors.messagesList.firstChild);
  });
}

function renderMessage(message, direction, time, type) {

  var div = dom(`<div class="app-messages__item app-messages__item_${direction}"></div>`);
  var divContent = dom(`<div class="app-message app-message_${direction}"></div>`);

  if (!type && typeof message === 'string') type = 'text';

  if (window.isGroupChat && type !== 'actionLog') {
    let author = getLastMessageUser(message);
    if (author) divContent.appendChild(dom(author));
  }

  if (renderers[type]) {
    renderers[type](divContent, message)
  } else {
    renderMessageAsText(divContent, '<unsupported message format>', true);
  }

  divContent.appendChild(dom(
    `<div class="app-message__time">
      ${time ? formatTime(time) : 'Sending...'}
    </div>`)
  );
  div.appendChild(divContent);

  return div
}

function renderMessageAsPost (container, message) {
  var post = message.mediaShare._params;

  if (post.images) {
    // carousels have nested arrays before getting to image url
    var img = dom(`<img src="${post.images[0].url || post.images[0][0].url}">`);
    // img.onload = () => scrollToChatBottom();
    container.appendChild(img);
  }

  if (post.caption) {
    container.appendChild(dom(`<p class="post-caption">${truncate(post.caption, 30)}</p>`));
  }
  container.classList.add('ig-media');
  container.onclick = () => renderPost(post)
}

function renderPost (post) {
  const postDom = dom('<div class="center"></div>');
  if (post.videos) {
    postDom.appendChild(dom(`<video width="${post.videos[0].width}" controls>
                                <source src="${post.videos[0].url}" type="video/mp4">
                              </video>`));
  } else if (post.carouselMedia && post.carouselMedia.length) {
    window.carouselInit(postDom, post.images.map((el) => el[0].url))
  } else {
    postDom.appendChild(dom(`<img src="${post.images[0].url}"/>`));
  }
  if (post.caption) {
    postDom.appendChild(dom(`<p class="post-caption">${post.caption}</p>`));
  }
  const browserLink = dom('<button class="view-on-ig">View on Instagram</button>')
  browserLink.onclick = () => openInBrowser(post.webLink)
  postDom.appendChild(browserLink);
  showInViewer(postDom);
}

function renderMessageAsUserStory (container, message) {
  if (message._params.reelShare.media.image_versions2) {
    var url = message._params.reelShare.media.image_versions2.candidates[0].url
    var img = dom(`<img src="${url}">`);
    // img.onload = () => scrollToChatBottom();
    container.appendChild(img);
    container.classList.add('ig-media');

    container.addEventListener('click', () => {
      if (message._params.reelShare.media.video_versions) {
        const videoUrl = message._params.reelShare.media.video_versions[0].url;
        showInViewer(dom(`<video controls src="${videoUrl}">`));
      } else {
        showInViewer(dom(`<img src="${url}">`));
      }
    })
  }

  if (message._params.reelShare.text) {
    container.appendChild(dom(`<div class="app-message__text">${message._params.reelShare.text}</div>`));
  }
}

function renderMessageAsImage (container, message) {
  var url = typeof message === 'string' ? message : message._params.media[0].url
  var img = dom(`<img src="${url}">`);
  // img.onload = () => scrollToChatBottom();
  container.appendChild(img);
  container.classList.add('ig-media');

  container.addEventListener('click', () => {
    showInViewer(dom(`<img src="${url}">`));
  })
}

function renderMessageAsLike (container) {
  container.appendChild(dom(`<div class="app-message__like"><svg><use xlink:href="#icon-like"></use></svg></div>`));
}

function renderMessageAsPlaceholder(container, message) {
  var params = message.placeholder._params;
  container.classList.add('app-message__placeholder');
  var div = dom(`<div class="app-message__text"><div class="title">${params.title}</div><div class="placeholder">${params.message}</div></div>`)
  container.appendChild(div);
}

function renderMessageAsText (container, message, noContext) {
  var text = typeof message === 'string' ? message : message._params.text;
  
  if(text.length == 1) {
    container.appendChild(dom(`<div class="app-message__text app-message__text_short">${text}</div>`));
  } else {
    container.appendChild(dom(`<div class="app-message__text">${text}</div>`));
  }

  if (!noContext) container.oncontextmenu = () => renderContextMenu(text);
}

function renderMessageAsLink (container, message) {
  const { link } = message.link._params;
  const text = message.link._params.text;
  if (link.image && link.image.url) {
    var img = dom(`<img src="${link.image.url}">`);
    // img.onload = () => scrollToChatBottom();
    container.appendChild(img);
  }
  // replace all contained links with anchor tags
  container.innerHTML += text.replace(URL_REGEX, (url) => {
    return `<a class="link-in-message">${url}</a>`;
  });
  container.classList.add('ig-media');
  container.onclick = () => {
    // for links that don't have protocol included
    const url = /^(http|https):\/\//.test(link.url) ? link.url : `http://${link.url}`;
    openInBrowser(url);
  }
}

function renderMessageAsAction(container, message) {
  var text = message._params.actionLog.description;
  container.classList.add('action');
  container.appendChild(document.createTextNode(text));
}

function renderContextMenu (text) {
  const menu = new Menu();
  const menuItem = new MenuItem({
    label: 'Quote Message',
    click: () => quoteText(text)
  });
  menu.append(menuItem);
  menu.popup();
}

function renderChatListItem (username, msgPreview, thumbnail, id) {
  var li = document.createElement('li');
  li.classList.add('app-users__item');
  li.appendChild(dom(`<div class="app-user"><div class="app-user__thumb"><img src="${thumbnail}" class="app-user__img"/></div><div class="app-user__info"><div class="app-user__name">${username}</div><div class="app-user__message">${msgPreview}</div></div></div>`));
  if (id) li.setAttribute("id", `chatlist-${id}`);

  return li;
}

function renderSearchResult (users) {

  selectors.usersList.innerHTML = "";

  users.forEach((user) => {
    var li = renderChatListItem(user._params.username, 'send a message', user._params.picture);
    li.onclick = () => {
      setActive(li);
      if (window.chatUsers[user.id]) {
        getChat(window.chatUsers[user.id]);
      } else {
        window.currentChatId = DUMMY_CHAT_ID;
        renderChat({items: [], accounts: [user]});
      }
    }
    selectors.usersList.appendChild(li);
  })
  
}

function renderChatList(chatList) {
  selectors.usersList.innerHTML = "";
  chatList.forEach((chat_) => {
    var msgPreview = getMsgPreview(chat_);
    var usernames = getUsernames(chat_, true);
    var thumbnail = getThumbnail(chat_);

    var li = renderChatListItem(usernames, msgPreview, thumbnail, chat_.id);

    registerChatUser(chat_);
    if (isActive(chat_)) setActive(li);
    // don't move this down!
    addNotification(li, chat_);
    chatsHash[chat_.id] = chat_;

    li.onclick = () => {
      markAsRead(chat_.id, li);
      setActive(li);
      getChat(chat_.id);
    }
    selectors.usersList.appendChild(li);
  })
}

function renderChatHeader(chat_) {

  account = chat_.accounts[0] ? chat_.accounts[0]._params : chat_._params.inviter._params;

  const _user = {
    fullName: account.fullName ? account.fullName : account.username,
    username: account.username
  }

  let node = document.createElement("span");
  let nodeText = document.createTextNode(_user.fullName);
  node.appendChild(nodeText);

  if (_user.username.length > 1) {
    node.addEventListener('click', () => {
      openInBrowser(`https://instagram.com/${_user.username}`)
    });
  }

  selectors.messagesTitle.innerHTML = '';
  selectors.messagesTitle.appendChild(node);
}

function renderGroupChatHeader(chat_) {

    name = getUsernames(chat_);

    let node = document.createElement("span");
    let nodeText = document.createTextNode(name);
    node.appendChild(nodeText);

    selectors.messagesTitle.innerHTML = '';
    selectors.messagesTitle.appendChild(node);
  }

function renderChat (chat_) {
  if (window.chat.id !== chat_.id || chat_.id === DUMMY_CHAT_ID) {
    window.chat = chat_;
    selectors.messagesList.innerHTML = '';
    window.isGroupChat = chat_.accounts.length > 1;
  }

  if (chat_._params && chat_._params.hasOlder) {
    renderOlderMessagesButton(chat_);
  }

  window.isGroupChat ? renderGroupChatHeader(chat_) : renderChatHeader(chat_);
  var messages = chat_.items.slice().reverse();
  renderMessages(messages, true);
  renderMessageSeenText(selectors.messagesList, chat_);
  scrollToChatBottom();

  addSubmitHandler(chat_);
  document.querySelector(MSG_INPUT_SELECTOR).focus();
}

function renderChatOlderMessages(chat_) {
  var messages = chat_.items.slice();

  renderMessages(messages);

  if (chat_._params.hasOlder) {
    renderOlderMessagesButton(chat_);
  }
}

function renderOlderMessagesButton(chat_) {
  var div = dom('<div class="app-messages__item"><div class="app-messages__load"><span>Click here to load previous messages</span></div></div>');
  div.addEventListener('click', (e) => {
    ipcRenderer.send('getChat', chat_.id, chat_._params.oldestCursor);
    selectors.messagesList.removeChild(div);
  });
  selectors.messagesList.insertBefore(div, selectors.messagesList.firstChild);
}

function renderMessageSeenText (container, chat_) {
  container.appendChild(dom(`<div class="outward">${getIsSeenText(chat_)}</div>`));
}

function renderUnfollowers (users) {
  var ul = dom(`<ul class="unfollowers"></ul>`);
  users.forEach((user) => {
    var li = dom(
      `<li>
        <img class="thumb" src="${user._params.picture}">
        <div class="">${user._params.username}</div>
      </li>`
    );
    var unfollowButton = dom(`<button class="unfollow-button">UNFOLLOW</button>`);
    unfollowButton.onclick = () => {
      unfollow(user.id);
      li.remove();
    }
    li.appendChild(unfollowButton);
    ul.appendChild(li);
  })

  showInViewer(ul);
}
