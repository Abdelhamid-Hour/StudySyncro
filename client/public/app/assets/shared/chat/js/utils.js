import { emojiCategories } from "./emoji-list.js";

import {
  clearTooltipWithTimeOut,
  db,
  formatHoursMinutes,
  getUUID,
  registerPageListener,
  runWhenDbReady,
  showTooltip,
  fetchData,
  sendData,
  showMessageBlock,
  throttling,
  t,
} from "../../../global/js/utils.js";

import {
  selectedFiles,
  PLAYBACK_RATE,
  FILE_ALLOWED_TYPES,
  MAXFILESIZE,
} from "./dom-variables.js";
import {
  globalTooltip,
  PENDING_ONLINE_SYNC_OPS,
  MESSAGE_MAX_LENGTH,
} from "../../../global/js/variables.js";
import { Loader } from "../../loader/js/utils.js";

let inputMessage,
  imageInput,
  fileInput,
  sendBtn,
  messagesContainer,
  inputChatContainer,
  emojiList,
  emojiesSearch,
  dragLeaveTimer,
  chatContainer,
  emojiesSearchResultContainer;

const storeMsgIntoIndexedDB = ({ localId, timestamp, ...message }) => {
  return new Promise((resolve, reject) => {
    runWhenDbReady(() => {
      const tx = db.transaction("messages", "readwrite");
      const store = tx.objectStore("messages");
      const req = store.add({
        id: localId,
        timestamp: Number(timestamp),
        ...message,
      });
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  });
};

const removeMsgFromIndexedDB = (localId) => {
  return new Promise((resolve, reject) => {
    runWhenDbReady(() => {
      const tx = db.transaction("messages", "readwrite");
      const store = tx.objectStore("messages");
      const req = store.delete(localId);
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  });
};

const getMsgFromIndexedDB = (localId) => {
  return new Promise((resolve, reject) => {
    runWhenDbReady(() => {
      const tx = db.transaction("messages", "readonly");
      const store = tx.objectStore("messages");
      const req = store.get(localId);
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  });
};

export const getLastSeenMessage = async (groupId, sessionId = "") => {
  if (sessionId || !groupId) return null;
  try {
    const res = await fetchData(`/chat/state/${groupId}`);
    if (res && res.lastSeenTimestamp) {
      return {
        chatId: groupId,
        messageId: res.lastSeenMessageId || null,
        timestamp: res.lastSeenTimestamp,
      };
    }
  } catch (err) {
    console.error("Error getting lastSeenMessage from API:", err);
  }
  return null;
};

export const updateLastSeenFromDOM = async (groupId, sessionId = "") => {
  if (sessionId || !groupId || !messagesContainer) return;
  const newestEl =
    messagesContainer.querySelector(
      ".message-sent:last-child [data-message-id]:last-child, .message-received:last-child [data-message-id]:last-child",
    ) || messagesContainer.querySelector("[data-message-id]:last-of-type");
  if (!newestEl) return;
  const messageId = newestEl.dataset.messageId || "";
  const timestamp = Number(newestEl.dataset.timestamp || Date.now());

  try {
    await sendData(
      "/api/chat/mark-read",
      { groupId, messageId, timestamp },
      "POST",
    );
  } catch (err) {
    console.error("Failed to mark chat as read on server:", err);
  }
};

const getMessagesByTimeRange = async (from, to) => {
  return new Promise((resolve, reject) => {
    runWhenDbReady(() => {
      const tx = db.transaction("messages", "readonly");
      const store = tx.objectStore("messages");
      const index = store.index("timestamp");
      const range = IDBKeyRange.bound(Number(from), Number(to));
      const result = [];
      index.openCursor(range).onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          const message = {
            sender: {
              id: "self",
            },
            content: {},
            isSender: true,
            localId: cursor.value.id,
            timestamp: cursor.value.timestamp,
            isLocalMsg: true,
          };
          if (cursor.value.message) message.content.text = cursor.value.message;
          if (cursor.value.file) {
            message.content.file = cursor.value.file;
          }

          result.push(message);
          cursor.continue();
        } else {
          resolve(result);
        }
      };
      tx.onerror = (e) => reject(e.target.error);
    });
  });
};

const initDOMVariables = () => {
  inputMessage = document.querySelector(".input-message");
  if (inputMessage) inputMessage.maxLength = MESSAGE_MAX_LENGTH;
  imageInput = document.getElementById("image-upload");
  fileInput = document.getElementById("file-upload");
  sendBtn = document.querySelector(".send-btn");
  messagesContainer = document.querySelector(".chat-messages");
  inputChatContainer = document.querySelector(".input-message-container");
  emojiList = document.querySelector(".emoji-list");
  emojiesSearch = document.querySelector(".emojis-search-input");
  emojiesSearchResultContainer = document.querySelector("#search-result");
  chatContainer = document.querySelector(".chat");
};

export const getEmojiPickerHTML = () => `
  <div class="emoji-picker">
    <button
      type="button"
      class="exclude-btn should-fill emoji-button open-drop-down-btn"
    >
      <i class="bi bi-emoji-smile"></i>
    </button>
    <div class="emoji-list overlay">
      <div class="categories">
        <a data-section-id="recent" class="recent should-fill">
          <i class="bi bi-clock"></i>
        </a>
        <a data-section-id="people" class="should-fill">
          <i class="bi bi-emoji-smile"></i>
        </a>
        <a data-section-id="animals_nature" class="should-fill">
          <i class="bi bi-tree"></i>
        </a>
        <a data-section-id="food_drink" class="should-fill">
          <i class="bi bi-cup"></i>
        </a>
        <a data-section-id="activity" class="should-fill">
          <i class="bi bi-calendar"></i>
        </a>
        <a data-section-id="objects" class="should-fill">
          <i class="bi bi-box"></i>
        </a>
        <a data-section-id="symbols" class="should-fill">
          <i class="bi bi-heart"></i>
        </a>
        <a data-section-id="travel_places" class="should-fill">
          <i class="bi bi-geo-alt"></i>
        </a>
        <a data-section-id="flags" class="should-fill">
          <i class="bi bi-flag"></i>
        </a>
      </div>
      <div class="emoji-search-container">
        <div class="search-icon-container">
          <i class="bi bi-search"></i>
        </div>
        <input
          type="search"
          placeholder="${t("common:shared_chat.emojis.search_placeholder")}"
          class="emojis-search-input"
        />
      </div>
      <div class="emojies-sections">
        <section id="recent">
          <h5>${t("common:shared_chat.emojis.categories.recent")}</h5>
          <div class="recent-emojies"></div>
        </section>
        <section id="people">
          <h5>${t("common:shared_terms.people")}</h5>
          <div class="people-emojies"></div>
        </section>
        <section id="animals_nature">
          <h5>${t("common:shared_terms.animals_nature")}</h5>
          <div class="animals-nature-emojies"></div>
        </section>
        <section id="food_drink">
          <h5>${t("common:shared_terms.food_drink")}</h5>
          <div class="food-drink-emojies"></div>
        </section>
        <section id="activity">
          <h5>${t("common:shared_terms.activity")}</h5>
          <div class="activity-emojies"></div>
        </section>
        <section id="objects">
          <h5>${t("common:shared_terms.objects")}</h5>
          <div class="objects-emojies"></div>
        </section>
        <section id="symbols">
          <h5>${t("common:shared_terms.symbols")}</h5>
          <div class="symbols-emojies"></div>
        </section>
        <section id="travel_places">
          <h5>${t("common:shared_terms.travel_places")}</h5>
          <div class="travel-places-emojies"></div>
        </section>
        <section id="flags">
          <h5>${t("common:shared_terms.flags")}</h5>
          <div class="flags-emojies"></div>
        </section>
      </div>
      <div id="search-result"></div>
    </div>
  </div>
`;

export const initializeEmojiPicker = (emojiList) => {
  const initSection = (emojisWrapper) => {
    emojisWrapper.style.backgroundImage = "initial";
    emojisWrapper.style.backgroundColor = "initial";
    emojisWrapper.style.animation = "initial";
    emojisWrapper.style.height = "fit-content";
  };
  setTimeout(() => {
    updateRecentUsedEmojis(emojiList);
    initSection(emojiList.querySelector(`#recent > div`));
    Object.keys(emojiCategories).forEach((category) => {
      const fr = document.createDocumentFragment();
      Object.values(emojiCategories[category]).forEach((keyword) => {
        keyword.forEach((emoji) => {
          const emojiItemBtn = createEmojiBtn(emoji);
          fr.appendChild(emojiItemBtn);
        });
      });

      const emojisWrapper = emojiList.querySelector(
        `#${category.toLowerCase()} > div`,
      );
      initSection(emojisWrapper);
      emojisWrapper.appendChild(fr);
    });
  }, 500);
};

export const handleEmojisSearch = (e, emojiesSearchResultContainer) => {
  const searchValue = e.currentTarget.value.trim();
  if (searchValue) {
    emojiesSearchResultContainer.classList.add("search-result");
    const filtredEmojies = document.createDocumentFragment();
    Object.keys(emojiCategories).forEach((category) => {
      Object.keys(emojiCategories[category]).forEach((keyword) => {
        if (keyword.includes(searchValue)) {
          emojiCategories[category][keyword].forEach((emoji) => {
            const emojiItemBtn = createEmojiBtn(emoji);
            filtredEmojies.appendChild(emojiItemBtn);
          });
        }
      });
    });
    if (!filtredEmojies.children.length) {
      const noMatchMessage = document.createElement("span");
      noMatchMessage.className = "no-match-message";
      noMatchMessage.textContent = t("common:shared_chat.emojis.no_match");
      return emojiesSearchResultContainer.replaceChildren(noMatchMessage);
    }
    emojiesSearchResultContainer.replaceChildren(filtredEmojies);
  } else {
    emojiesSearchResultContainer.innerHTML = "";
    emojiesSearchResultContainer.classList.remove("search-result");
  }
};

const updateRecentUsedEmojis = (emojiList) => {
  const fr = document.createDocumentFragment();
  const recentEmojisSection = emojiList.querySelector(`#recent > div`);
  const recentUsedIcons = JSON.parse(localStorage.getItem("recent-used-icons"));
  if (recentUsedIcons) {
    recentUsedIcons.forEach((emoji) => {
      const emojiItemBtn = createEmojiBtn(emoji);
      fr.appendChild(emojiItemBtn);
    });
    recentEmojisSection.replaceChildren(fr);
  }
};

const createEmojiBtn = (emoji) => {
  const emojiItemBtn = document.createElement("button");
  emojiItemBtn.className = "exclude-btn emoji-btn";
  emojiItemBtn.textContent = emoji;
  return emojiItemBtn;
};

export const handleEmojiListClick = (e, inputMessage, emojiList) => {
  const emojibtn = e.target.closest(".emoji-btn");
  if (emojibtn) {
    const pickedEmoji = emojibtn.textContent;
    inputMessage.value += pickedEmoji;
    let recentUsedIcons = JSON.parse(localStorage.getItem("recent-used-icons"));
    if (!recentUsedIcons) {
      recentUsedIcons = [];
    }
    recentUsedIcons.unshift(pickedEmoji);
    recentUsedIcons = [...new Set(recentUsedIcons)];
    if (recentUsedIcons.length > 11) {
      recentUsedIcons.pop();
    }
    localStorage.setItem("recent-used-icons", JSON.stringify(recentUsedIcons));
    updateRecentUsedEmojis(emojiList);
  }
};

export const setupEmojiPickerListeners = ({
  emojiList,
  inputEl,
  emojiesSearch,
  searchResultContainer,
}) => {
  if (emojiList) {
    initializeEmojiPicker(emojiList);
    emojiList.addEventListener("click", (e) => {
      handleEmojiListClick(e, inputEl, emojiList);
      handleCategoryClick(e);
    });
  }
  if (emojiesSearch && searchResultContainer) {
    emojiesSearch.addEventListener("input", (e) => {
      handleEmojisSearch(e, searchResultContainer);
    });
  }
};

const scrollToBottom = (container) => {
  const scrollHeight = container.scrollHeight;
  container.scroll({
    top: scrollHeight,
    behavior: "instant",
  });
};

const setFileURL = async (file, mediaElement, mediaLoader = false) => {
  try {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    const URL = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
    });
    mediaElement.src = URL;
    if (mediaLoader) {
      const loader = mediaElement
        .closest(".media-preview")
        ?.querySelector(".three-body");
      if (loader) loader.remove();
    }
  } catch (error) {
    console.error("Error reading image file:", error);
    return "";
  }
};

const createDownloadLinkButton = (file) => {
  const downloadLinkBtn = document.createElement("a");
  downloadLinkBtn.className = "download-btn button";
  downloadLinkBtn.href = file.URL || "";
  downloadLinkBtn.download = file.name;
  const downloadIcon = document.createElement("i");
  downloadIcon.className = "bi bi-download";
  downloadLinkBtn.append(downloadIcon);
  return downloadLinkBtn;
};

const getMediaBtn = (expand = true, reSend = false) => {
  const expandBtn = document.createElement("button");
  expandBtn.type = "button";
  expandBtn.className = expand
    ? "expand-btn"
    : `${reSend ? "re-send" : "retry"}-btn small-btn`;
  const expandIcon = document.createElement("i");
  expandIcon.className = expand
    ? "bi bi-arrows-fullscreen"
    : "bi bi-arrow-clockwise";
  expandBtn.append(expandIcon);
  return expandBtn;
};

const getCircleLoader = () => {
  const wrapper = document.createElement("div");
  wrapper.className = "pulsar";
  return wrapper;
};

const getMediaLoader = () => {
  const wrapper = document.createElement("div");
  wrapper.className = "three-body";
  wrapper.innerHTML = `
    <!-- From Uiverse.io by dovatgabriel -->
        <div class="three-body__dot"></div>
        <div class="three-body__dot"></div>
        <div class="three-body__dot"></div>
    `;
  return wrapper;
};

const handleSendMessageSuccess = async (result, wrapper, formData, isFile) => {
  wrapper.dataset.messageId = result.messageId;
  const Icon = wrapper.querySelector(".message-info i");
  Icon.className = "bi bi-check";
  await removeMsgFromIndexedDB(formData.get("localId"));

  if (isFile) {
    const file = formData.get("file");
    file.URL = result.filePath;
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const mediaContainer = wrapper.querySelector(".message-media-preview");
      mediaContainer.classList.remove("uploading");

      mediaContainer.append(getMediaBtn(true));
      mediaContainer.querySelector("video, img").src = file.URL;
      const video = mediaContainer.querySelector("video");
      if (video) video.controls = true;
    } else if (file.type.startsWith("audio/")) {
      wrapper.querySelector("audio").src = file.URL;
    }
    wrapper.querySelector(".three-body")?.remove();
    wrapper.querySelector(".pulsar")?.remove();
    wrapper
      .querySelector(".file-preview, .audio-player, .message-media-preview")
      ?.appendChild(createDownloadLinkButton(file));
  }
};

const sendMessage = async (formData, wrapper, isFile = false) => {
  try {
    const result = await sendData("/api/send-message", formData, "POST");
    handleSendMessageSuccess(result, wrapper, formData, isFile);
  } catch (error) {
    handleSendMessageError(error, wrapper, formData, isFile);
  }
};

const handleSendMessageError = (error, wrapper, formData, isFile) => {
  const file = formData.get("file");
  console.error(error);
  wrapper.dataset.messageId = error.data?.messageId;
  const Icon = wrapper.querySelector(".message-info i");
  Icon.className = "bi bi-exclamation-circle";
  if (isFile) {
    const loader =
      wrapper.querySelector(".three-body") || wrapper.querySelector(".pulsar");
    loader.remove();
    const retryBtn = getMediaBtn(false);
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      retryBtn.append("Retry");
    }
    wrapper
      .querySelector(".file-preview, .audio-player, .message-media-preview")
      ?.appendChild(retryBtn);
    retryBtn.addEventListener(
      "click",
      throttling(2000, () => {
        retryBtn.replaceWith(loader);
        const Icon = wrapper.querySelector(".message-info i");
        Icon.className = "bi bi-clock";
        Icon.style.color = "";
        formData.delete("file");
        formData.append("file", file);

        sendMessage(formData, wrapper, isFile);
      }),
    );
  }
  showMessageBlock(
    error.message || t("common:shared_chat.alerts.send_failed"),
    "error",
  );
};

class ChatMessage {
  constructor(
    text,
    attachments = [],
    senderId,
    timestamp,
    chatContainer,
    {
      isSender = false,
      avatarSrc = "",
      senderName = "",
      messageId = "",
      localId = "",
      send = false,
      isLocalMsg = false,
      groupId = "",
    },
  ) {
    this.text = text;
    this.messageId = messageId;
    this.localId = localId;
    this.isLocalMsg = isLocalMsg;
    this.groupId = groupId;
    this.attachments = attachments;
    this.isSender = isSender;
    this.avatarSrc = avatarSrc;
    this.senderName = senderName;
    this.senderId = senderId;
    this.timestamp = timestamp;
    this.chatContainer = chatContainer;
    this.wrappers = {
      files: [],
      text: null,
    };
    this.send = send;
  }

  appendBaseData(formData, baseData) {
    Object.entries(baseData).forEach(([k, v]) => formData.append(k, v));
  }

  async sendMessages({ groupId, sessionId }) {
    try {
      const baseData = {
        sessionId: sessionId || "",
        groupId: groupId || "",
        timestamp: this.timestamp,
      };
      if (
        this.text &&
        typeof this.text === "string" &&
        this.text.trim().length > 0
      ) {
        const formData = new FormData();
        this.appendBaseData(formData, baseData);
        formData.append("message", this.text);
        formData.append("localId", getUUID());
        const message = Object.fromEntries(formData.entries());
        await storeMsgIntoIndexedDB(message);
        if (navigator.onLine) await sendMessage(formData, this.wrappers.text);
        else
          PENDING_ONLINE_SYNC_OPS.push(() =>
            sendMessage(formData, this.wrappers.text),
          );
      }
      if (this.attachments.length > 0) {
        for (let i = 0; i < this.attachments.length; i++) {
          const formData = new FormData();
          this.appendBaseData(formData, baseData);
          formData.append("localId", getUUID());
          formData.append("file", this.attachments[i]);
          const message = Object.fromEntries(formData.entries());
          await storeMsgIntoIndexedDB(message);
          if (navigator.onLine)
            await sendMessage(formData, this.wrappers.files[i], true);
          else {
            PENDING_ONLINE_SYNC_OPS.push(() =>
              sendMessage(formData, this.wrappers.files[i], true),
            );
          }
        }
      }
      if (groupId && !sessionId) {
        const banner = messagesContainer.querySelector(
          ".unread-messages-banner",
        );
        if (banner) banner.remove();
        if (!navigator.onLine) {
          PENDING_ONLINE_SYNC_OPS.push(() =>
            updateLastSeenFromDOM(groupId, sessionId),
          );
        } else {
          updateLastSeenFromDOM(groupId, sessionId);
        }
      }
    } catch (error) {
      console.error(error);
      showMessageBlock(
        error.message || t("common:shared_chat.alerts.send_failed"),
        "error",
      );
    }
  }

  renderMessage() {
    const threshold = 50;
    const isScrolledUp =
      !this.isSender &&
      Boolean(this.groupId) &&
      Boolean(this.chatContainer) &&
      this.chatContainer.scrollHeight -
        this.chatContainer.scrollTop -
        this.chatContainer.clientHeight >
        threshold;

    if (isScrolledUp) {
      const existingBanner = this.chatContainer.querySelector(
        ".unread-messages-banner",
      );
      if (!existingBanner) {
        const banner = document.createElement("div");
        banner.className = "unread-messages-banner";
        banner.innerHTML = `<span>${t("common:shared_chat.unread_messages")}</span>`;
        this.chatContainer.append(banner);
      }
    }

    if (this.attachments.length > 0) {
      this.renderAttachments();
    }
    if (this.text) {
      this.renderTextMessage();
    }

    if (!isScrolledUp) {
      scrollToBottom(this.chatContainer);
    }
    if (this.isSender && this.chatContainer) {
      const banner = this.chatContainer.querySelector(
        ".unread-messages-banner",
      );
      if (banner) banner.remove();
    }
    return this;
  }

  appendToChat(messageBubble, file = null) {
    const emptyStateUI = document.querySelector(".icon-wrapper");
    if (emptyStateUI) emptyStateUI.remove();
    let messageContainer = null;
    const isFirstMessage = this.isFirstMessage();
    if (isFirstMessage) {
      messageContainer = this.createMessageContainer(messageBubble, file);
      this.chatContainer.append(messageContainer);
    } else {
      messageContainer = this.createMessageWrapper(messageBubble, false, file);
      this.chatContainer.lastElementChild
        .querySelector(".messages")
        .append(messageContainer);
    }
    const wrapper = isFirstMessage
      ? messageContainer.querySelector(".first-message-sent-text")
      : messageContainer;
    if (!file) {
      if (this.isLocalMsg) {
        wrapper.appendChild(getMediaBtn(false, true));
      }
      this.wrappers.text = wrapper;
    } else {
      this.wrappers.files.push(wrapper);
    }
  }

  renderAttachments() {
    const renderers = {
      image: (img) => this.createMediaTemplate(img, "img"),
      video: (vid) => this.createMediaTemplate(vid, "video"),
      audio: (aud) => this.createAudioPlayer(aud),
      document: (doc) =>
        this.createFilePreviewTemplate(
          doc,
          `bi bi-filetype-${doc.name.split(".").pop()}`,
        ),
    };
    this.attachments.forEach((attachment) => {
      const kind = attachment.type.startsWith("image/")
        ? "image"
        : attachment.type.startsWith("video/")
          ? "video"
          : attachment.type.startsWith("audio/")
            ? "audio"
            : "document";
      const wrapper = renderers[kind](attachment);
      this.appendToChat(wrapper, attachment);
    });
  }

  renderTextMessage() {
    this.appendToChat(this.createMessageBubble(this.text));
  }

  formatFileSize(sizeInBytes) {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} bytes`;
    }
    const kb = sizeInBytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    }
    const mb = kb / 1024;
    if (mb < 1024) {
      return `${mb.toFixed(2)} MB`;
    }
  }

  isFirstMessage() {
    const lastMessage = this.chatContainer.lastElementChild;
    if (!lastMessage) return true;
    const lastUserId =
      lastMessage.querySelector(".username")?.dataset.senderId || "self";

    return lastUserId !== this.senderId;
  }

  createAudioPlayer(file) {
    const audioPreview = document.createElement("div");
    audioPreview.className = "media-message audio-player";

    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.className = "play-btn exclude-btn should-fill";
    const playIcon = document.createElement("i");
    playIcon.className = "bi bi-play";
    playButton.appendChild(playIcon);

    const progressContainer = document.createElement("div");
    progressContainer.className = "progress-container";
    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";
    progressContainer.appendChild(progressBar);

    const timeSpan = document.createElement("span");
    timeSpan.className = "time";
    timeSpan.textContent = "00:00";

    const playBackRate = document.createElement("button");
    playBackRate.className = "exclude-btn play-back-rate";
    playBackRate.textContent = "1x";

    const audioElement = document.createElement("audio");
    audioElement.src = file.URL || "";

    audioPreview.append(
      playButton,
      progressContainer,
      timeSpan,
      playBackRate,
      audioElement,
    );

    if (this.send) {
      audioPreview.appendChild(getCircleLoader());
      setFileURL(file, audioElement);
    } else if (this.isLocalMsg || !file.URL) {
      audioPreview.appendChild(getMediaBtn(false, true));
    } else audioPreview.appendChild(createDownloadLinkButton(file));

    return audioPreview;
  }

  createFilePreviewTemplate(file, iconClass) {
    const filePreview = document.createElement("div");
    filePreview.className = "media-message file-preview";

    const fileThumbnail = document.createElement("div");
    fileThumbnail.className = "file-thumbnail";
    const icon = document.createElement("i");
    icon.className = iconClass;
    fileThumbnail.appendChild(icon);

    const fileDetails = document.createElement("div");
    fileDetails.className = "file-details";
    const fileNameBtn = document.createElement("button");
    fileNameBtn.className = "exclude-btn file-name";
    fileNameBtn.innerHTML = `<bdi>${file.name}</bdi>`;
    const fileSizeSpan = document.createElement("span");
    fileSizeSpan.className = "file-size";
    fileSizeSpan.textContent = this.formatFileSize(file.size);
    fileDetails.append(fileNameBtn, fileSizeSpan);

    filePreview.append(fileThumbnail, fileDetails);
    if (this.send) {
      filePreview.appendChild(getCircleLoader());
    } else if (this.isLocalMsg || !file.URL) {
      filePreview.appendChild(getMediaBtn(false, true));
    } else filePreview.appendChild(createDownloadLinkButton(file));

    return filePreview;
  }

  createMediaTemplate(file, type) {
    const mediaContainer = document.createElement("div");
    mediaContainer.className = "media-message message-media-preview";
    const mediaElement = document.createElement(type);
    if (type === "img")
      mediaElement.src =
        file.URL || "/app/assets/shared/chat/imgs/img-placeholder.png";
    else mediaElement.src = file.URL || "";

    if (type === "img") mediaElement.alt = file.name;
    if (type === "video") mediaElement.controls = !this.send;

    const mediaDiv = document.createElement("div");
    mediaDiv.className = "media-div";
    mediaDiv.appendChild(mediaElement);

    mediaContainer.append(mediaDiv);
    if (this.send) {
      mediaContainer.classList.add("uploading");
      mediaContainer.appendChild(getMediaLoader());
      setFileURL(file, mediaElement);
    } else if (this.isLocalMsg || !file.URL) {
      const reSendBtn = getMediaBtn(false, true);
      reSendBtn.append("Retry");
      mediaContainer.appendChild(reSendBtn);
      if (file instanceof File) setFileURL(file, mediaElement);
    } else {
      mediaContainer.append(getMediaBtn(true), createDownloadLinkButton(file));
    }

    return mediaContainer;
  }

  createMessageBubble(text) {
    const p = document.createElement("p");
    p.innerHTML = `<bdi>${text}</bdi>`;
    return p;
  }

  createMessageWrapper(messageBubble, isFirstMessage, file) {
    const messageWrapper = document.createElement("div");
    messageWrapper.className = `${isFirstMessage ? "first-" : ""}message-${
      this.isSender ? "sent" : "received"
    }-text`;

    messageWrapper.dataset.messageId = this.messageId || "";
    messageWrapper.dataset.timestamp = this.timestamp || "";
    if (
      this.localId &&
      this.isSender &&
      (this.isLocalMsg || (file && !file.URL))
    ) {
      messageWrapper.dataset.localId = this.localId || "";
    }

    if (!this.isSender && isFirstMessage) {
      const usernameSpan = document.createElement("span");
      usernameSpan.className = "username";
      usernameSpan.dataset.senderId = this.senderId;
      usernameSpan.innerHTML = `<bdi>${this.senderName || ""}</bdi>`;
      messageWrapper.appendChild(usernameSpan);
    }

    messageWrapper.appendChild(messageBubble);

    const messageInfo = document.createElement("span");
    messageInfo.className = "message-info";
    messageInfo.textContent = formatHoursMinutes(Number(this.timestamp));

    if (this.send) {
      const clockIcon = document.createElement("i");
      clockIcon.className = "bi bi-clock";
      messageInfo.appendChild(clockIcon);
    } else if ((file && !file.URL) || this.isLocalMsg) {
      const checkIcon = document.createElement("i");
      checkIcon.className = "bi bi-exclamation-circle";
      messageInfo.appendChild(checkIcon);
    } else if (this.isSender) {
      const checkIcon = document.createElement("i");
      checkIcon.className = "bi bi-check";
      messageInfo.appendChild(checkIcon);
    }
    messageWrapper.appendChild(messageInfo);

    return messageWrapper;
  }

  createMessageContainer(messageBubble, file) {
    const messageContainer = document.createElement("div");
    messageContainer.className = `message-${
      this.isSender ? "sent" : "received"
    }`;

    if (!this.isSender) {
      const avatarDiv = document.createElement("div");
      avatarDiv.className = "avatar";
      if (this.avatarSrc) {
        const avatarImg = document.createElement("img");
        avatarImg.src = this.avatarSrc;
        avatarImg.alt = t("common:avatar_alt");
        avatarDiv.appendChild(avatarImg);
      } else {
        const avatarIcon = document.createElement("i");
        avatarIcon.className = "bi bi-person-circle";
        avatarDiv.appendChild(avatarIcon);
      }
      messageContainer.appendChild(avatarDiv);
    }

    const messagesDiv = document.createElement("div");
    messagesDiv.className = "messages";
    messagesDiv.appendChild(
      this.createMessageWrapper(messageBubble, true, file),
    );
    messageContainer.appendChild(messagesDiv);

    return messageContainer;
  }
}

const clearChatInputs = () => {
  inputMessage.value = "";
  fileInput.value = "";
  imageInput.value = "";
  selectedFiles.items.clear();
  const filesView = document.querySelector(".files-view");
  if (filesView) {
    filesView.remove();
  }
};

export const handleFiles = (
  files,
  container = inputChatContainer,
  dataTransfer = selectedFiles,
) => {
  for (const f of Array.from(files)) {
    if (dataTransfer.items.length >= 5) {
      return showMessageBlock(t("common:alerts.max_files_exceeded"), "error");
    }
    const isSupportedType = Object.values(FILE_ALLOWED_TYPES).find((types) =>
      types.includes(f.type),
    );
    if (!isSupportedType) {
      showMessageBlock(t("common:alerts.invalid_file_type"), "error");
      continue;
    }
    if (f.size > MAXFILESIZE) {
      showMessageBlock(
        t("common:alerts.file_too_large", {
          name: f.name,
          max: Math.round(MAXFILESIZE / (1024 * 1024)),
        }),
        "error",
      );
      continue;
    }
    dataTransfer.items.add(f);
    displayFile(f, container, dataTransfer);
  }
};

export const displayFile = async (
  file,
  container = inputChatContainer,
  dataTransfer = selectedFiles,
) => {
  let filesView =
    container?.querySelector(".files-view") ||
    document.querySelector(".files-view");
  if (!filesView) {
    filesView = document.createElement("div");
    filesView.className = "files-view";
    (container || inputChatContainer).append(filesView);
    filesView.addEventListener("click", (e) => {
      const btn = e.target.closest(".remove-file-btn");
      if (btn) {
        const targetFileName = btn.previousElementSibling?.dataset.fileName;
        const fileIndex = Array.from(dataTransfer.items).findIndex((f) => {
          return (
            f.name === targetFileName ||
            f.getAsFile?.()?.name === targetFileName
          );
        });

        if (fileIndex !== -1) {
          dataTransfer.items.remove(fileIndex);
        }
        btn.parentElement.remove();
      }
      if (!dataTransfer.items.length) {
        filesView.remove();
      }
    });
  }
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "exclude-btn remove-file-btn";
  const closIcon = document.createElement("i");
  closIcon.className = "bi bi-x-circle-fill";
  closeBtn.append(closIcon);
  const isImgOrVideo =
    file.type.startsWith("image/") || file.type.startsWith("video/");
  if (isImgOrVideo) {
    const elementName = file.type.startsWith("image/") ? "img" : "video";
    const mediaContainer = document.createElement("div");
    mediaContainer.className = "media-preview";
    const mediaElement = document.createElement(elementName);
    mediaElement.dataset.fileName = file.name;
    mediaElement.src = "/app/assets/shared/chat/imgs/img-placeholder.png";
    mediaContainer.appendChild(getMediaLoader());
    setFileURL(file, mediaElement, true);
    if (file.type.startsWith("image/")) mediaElement.alt = file.name;
    mediaContainer.append(mediaElement, closeBtn);

    filesView.append(mediaContainer);
  } else {
    const filePreview = document.createElement("div");
    filePreview.className = "file";
    const typeBadge = document.createElement("span");
    typeBadge.className = "badge badge-type";
    typeBadge.textContent = file.name.split(".").pop().toUpperCase();
    const fileName = document.createElement("span");
    fileName.className = "file-name";
    fileName.innerHTML = `<bdi>${file.name}</bdi>`;
    fileName.dataset.fileName = file.name;

    filePreview.append(typeBadge, fileName, closeBtn);
    filesView.append(filePreview);
  }
};

export const setupChatFileInputListeners = ({
  imageInput,
  fileInput,
  container = inputChatContainer,
  dataTransfer = selectedFiles,
}) => {
  if (imageInput) {
    imageInput.addEventListener("change", () => {
      if (imageInput.files.length) {
        handleFiles(imageInput.files, container, dataTransfer);
      }
      imageInput.value = "";
    });
  }
  if (fileInput) {
    fileInput.addEventListener("change", () => {
      if (fileInput.files.length) {
        handleFiles(fileInput.files, container, dataTransfer);
      }
      fileInput.value = "";
    });
  }
};

export const sendChatMessagePayload = async ({
  groupId = "",
  sessionId = "",
  message = null,
  file = null,
  timestamp = Date.now(),
}) => {
  const formData = new FormData();
  if (groupId) formData.append("groupId", groupId);
  if (sessionId) formData.append("sessionId", sessionId);
  formData.append("timestamp", timestamp);
  formData.append("localId", getUUID());
  if (message) formData.append("message", message);
  if (file) formData.append("file", file);
  return await sendData("/api/send-message", formData, "POST");
};

const handleChatInput = async (sessionId, groupId) => {
  let files = [];

  // Handle image input
  if (selectedFiles.items.length) {
    files = Array.from(selectedFiles.items).map((f) => f.getAsFile());
  }
  // Check if there is a message or files to send
  const inputValue = inputMessage.value.trim();
  if (inputValue.length > MESSAGE_MAX_LENGTH) {
    showMessageBlock(
      t("common:shared_chat.alerts.message_max_length", {
        max: MESSAGE_MAX_LENGTH,
      }),
      "info",
    );
    return;
  }
  if (inputValue || files.length > 0) {
    new ChatMessage(inputValue, files, "self", Date.now(), messagesContainer, {
      isSender: true,
      send: true,
      groupId: groupId || "",
    })
      .renderMessage()
      .sendMessages({ sessionId, groupId });

    clearChatInputs();
  }
};

const handleDragEnter = (e) => {
  // ? relatedTarget will reference the element that the drag operation
  // ? is leaving as it enters a new element.
  if (dragLeaveTimer) {
    clearTimeout(dragLeaveTimer);
  }
  if (!document.querySelector(".drop-area")) {
    const dropArea = document.createElement("div");
    dropArea.className = "drop-area";
    const icon = document.createElement("i");
    icon.className = "bi bi-plus-circle";
    const text = document.createElement("span");
    text.textContent = t("common:shared_chat.drop_files");
    dropArea.append(icon, text);
    inputChatContainer.append(dropArea);
  }
  setTimeout(() => {
    inputChatContainer.classList.add("drop-start");
  }, 0);
};

export const initAndDiplayErrorTooltip = (inputContainer, message) => {
  inputContainer.querySelector(".input, input")?.focus();
  inputContainer.classList.add("error-input", "error-animation");
  showTooltip(inputContainer, globalTooltip, message, true);
  clearTooltipWithTimeOut(inputContainer);
};

export const handleEnterKeyWithTooltip = function (e) {
  if (e.key === "Enter" && !e.ctrlKey) {
    e.preventDefault();
    sendBtn.click();
  }

  if (e.key === "Enter" && e.ctrlKey) {
    e.preventDefault();
    this.value += "\n";
    this.scrollTop = this.scrollHeight;
  }
};

const togglePlay = async (playButton, audio) => {
  try {
    const icon = playButton.querySelector("i");
    if (icon.className.includes("play")) {
      icon.className = icon.className.replace("play", "pause");
      await audio.play();
    } else {
      audio.pause();
      icon.className = icon.className.replace("pause", "play");
    }
  } catch (error) {
    return;
  }
};

const seek = (e, audio, progressContainer) => {
  try {
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
  } catch (error) {
    return;
  }
};

const handleMessagesContainerClick = async (e) => {
  const target = e.target;

  const reSendBtn = target.closest(".re-send-btn");
  if (reSendBtn) {
    try {
      const messageContainer = reSendBtn.closest(
        ".message-sent-text, .first-message-sent-text",
      );
      const messageId = messageContainer?.dataset.messageId;
      const localId = messageContainer?.dataset.localId;
      if (!localId)
        return showMessageBlock(t("common:alerts.local_id_not_found"), "error");
      const message = await getMsgFromIndexedDB(localId);
      if (!message)
        return showMessageBlock(
          t("common:alerts.msg_not_found_local"),
          "error",
        );
      reSendBtn.remove();
      const Icon = messageContainer.querySelector(".message-info i");
      Icon.className = "bi bi-clock";
      if (message.file) {
        const mediaContainer = messageContainer.querySelector(
          ".message-media-preview",
        );
        if (mediaContainer) {
          mediaContainer.classList.add("uploading");
          mediaContainer.appendChild(getMediaLoader());
        } else {
          const doc_AudioPlayer = messageContainer.querySelector(
            ".audio-player, .file-preview",
          );
          if (doc_AudioPlayer) doc_AudioPlayer.appendChild(getCircleLoader());
        }
      }
      const formData = new FormData();
      formData.append("sessionId", message.sessionId);
      formData.append("groupId", message.groupId);
      if (messageId) formData.append("messageId", messageId);
      if (message.message) formData.append("message", message.message);
      if (message.file) formData.append("file", message.file);
      formData.append("localId", localId);
      message.timestamp = Date.now();
      formData.append("timestamp", message.timestamp);
      sendMessage(formData, messageContainer, Boolean(message.file));
    } catch (error) {
      console.error(error);
    }
  }

  const btn = target.closest(".expand-btn");
  if (btn || target.matches("img, video")) {
    handleFullscreen(target, btn);
  }

  const fileNameButton = target.closest(".file-details .file-name");
  if (fileNameButton) {
    handleFilePreview(fileNameButton);
  }

  const playButton = target.closest(".play-btn");
  if (playButton) {
    handleAudioPlay(playButton);
  }

  const progressContainer = target.closest(".progress-container");
  if (progressContainer) {
    handleAudioSeek(e, progressContainer);
  }

  const playbackRate = target.closest(".play-back-rate");
  if (playbackRate) {
    handleplaybackRate(playbackRate);
  }
};

const onAudioEnd = (progressBar, audioElement, playIcon, timeSpan) => {
  audioElement.currentTime = 0;
  updateAudioProgress(progressBar, audioElement, timeSpan);
  playIcon.className = playIcon.className.replace("pause", "play");
};

const updateAudioProgress = (progressBar, audioElement, timeSpan) => {
  const progress = (audioElement.currentTime / audioElement.duration) * 100;
  progressBar.style.width = `${progress}%`;

  timeSpan.textContent = formatTime(
    audioElement.duration - audioElement.currentTime,
  );
};

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours >= 1 ? hours + ":" : ""}${mins}:${secs
    .toString()
    .padStart(2, "0")}`;
};

const getAudioElements = (audioEl) => {
  const playerEl = audioEl.closest(".audio-player");
  if (!playerEl) return null;
  const progressBar = playerEl.querySelector(".progress-bar");
  const timeSpan = playerEl.querySelector(".time");
  const playIcon = playerEl.querySelector(".play-btn i");
  return {
    progressBar,
    timeSpan,
    playIcon,
  };
};

export const handleLoadedMetadataCapture = (e) => {
  if (e.target.tagName !== "AUDIO") return;
  const audioElement = e.target;
  const audioElements = getAudioElements(audioElement);
  if (!audioElements) return;
  const { timeSpan } = audioElements;
  if (timeSpan) {
    timeSpan.textContent = formatTime(audioElement.duration);
  }
};

export const handleEndedCapture = (e) => {
  if (e.target.tagName !== "AUDIO") return;
  const audioElement = e.target;
  const audioElements = getAudioElements(audioElement);
  if (!audioElements) return;
  const { progressBar, timeSpan, playIcon } = audioElements;
  if (progressBar && playIcon && timeSpan) {
    onAudioEnd(progressBar, audioElement, playIcon, timeSpan);
  }
};

export const handleTimeUpdateCapture = (e) => {
  if (e.target.tagName !== "AUDIO") return;
  const audioElement = e.target;
  const audioElements = getAudioElements(audioElement);
  if (!audioElements) return;
  const { progressBar, timeSpan } = audioElements;
  if (progressBar && timeSpan)
    updateAudioProgress(progressBar, audioElement, timeSpan);
};

const handleplaybackRate = (playbackRate) => {
  const playerEl = playbackRate.closest(".audio-player");
  const audio = playerEl.querySelector("audio");
  const currentRate = parseFloat(playbackRate.textContent);
  let currentRateIndex = PLAYBACK_RATE.indexOf(currentRate);
  if (++currentRateIndex === PLAYBACK_RATE.length) currentRateIndex = 0;
  playbackRate.textContent = PLAYBACK_RATE[currentRateIndex] + "x";
  audio.playbackRate = PLAYBACK_RATE[currentRateIndex];
};

const handleFullscreen = (target, btn) => {
  if (btn && btn.previousElementSibling) {
    btn.previousElementSibling.requestFullscreen();
  } else {
    target.requestFullscreen();
  }
};

const handleFilePreview = (fileNameButton) => {
  const objectViewer = document.createElement("object");

  const URL = fileNameButton.parentElement.nextElementSibling.href;

  if (!URL) return;

  objectViewer.data = URL;
  objectViewer.style.width = 0;
  document.body.append(objectViewer);
  objectViewer.requestFullscreen();
  objectViewer.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      objectViewer.remove();
    }
  });
};

const handleAudioPlay = (playButton) => {
  const playerEl = playButton.closest(".audio-player");
  const audio = playerEl.querySelector("audio");
  togglePlay(playButton, audio);
};

const handleAudioSeek = (e, progressContainer) => {
  const playerEl = progressContainer.closest(".audio-player");
  const audio = playerEl.querySelector("audio");
  seek(e, audio, progressContainer);
};

export const handleCategoryClick = (e) => {
  const categoryLink = e.target.closest("a[data-section-id]");
  if (categoryLink) {
    e.preventDefault(); // stop the browser from adding #sectionX
    const id = categoryLink.getAttribute("data-section-id");
    const targetEl = document.getElementById(id);
    if (targetEl) {
      targetEl.scrollIntoView();
    }
  }
};

const handleDrop = (e) => {
  e.preventDefault();
  inputChatContainer.classList.remove("drop-start");
  setTimeout(() => {
    document.querySelector(".drop-area")?.remove();
  }, 300);
  const files = e.dataTransfer.files;
  if (files.length) {
    handleFiles(files);
  }
};

const handleDragLeave = (e) => {
  if (e.relatedTarget?.matches(":not(.chat *)")) {
    inputChatContainer.classList.remove("drop-start");
    dragLeaveTimer = setTimeout(() => {
      document.querySelector(".drop-area")?.remove();
    }, 300);
  }
};

const openChatStream = (groupId, sessionId) => {
  const route = `/api/chat-stream?sessionId=${sessionId}&groupId=${groupId}`;
  const eventSource = new EventSource(route, {
    withCredentials: true,
  });

  eventSource.addEventListener("message", (e) => {
    const message = JSON.parse(e.data);
    const file = message.content.text
      ? null
      : {
          URL: message.content.filePath,
          name: message.content.fileName,
          size: message.content.fileSize,
          type: message.content.fileType,
        };

    new ChatMessage(
      message.content.text,
      file ? [file] : [],
      message.sender.id,
      message.timestamp,
      messagesContainer,
      {
        messageId: message.id,
        avatarSrc: message.sender.photoURL,
        senderName: message.sender.fullName,
        groupId: groupId || "",
      },
    ).renderMessage();
    if (groupId && !sessionId) {
      updateLastSeenFromDOM(groupId, sessionId);
    }
  });

  eventSource.addEventListener("error", (e) => {
    console.error("SSE error", e);
  });

  return eventSource;
};

const createChatFrag = async (messages) => {
  try {
    let unsentMessages = await getMessagesByTimeRange(
      messages[0].timestamp,
      messagesContainer.children.length <= 1
        ? Date.now()
        : messages[messages.length - 1].timestamp,
    );
    unsentMessages = unsentMessages.filter((unSentMsg) => {
      return !messages.some((msg) => {
        const isAlreadyExists = msg.localId === unSentMsg.localId;
        if (isAlreadyExists && msg.content.filePath === "") {
          msg.content.file = unSentMsg.content.file;
        } else if (
          isAlreadyExists &&
          (msg.content.filePath || msg.content.text)
        ) {
          removeMsgFromIndexedDB(unSentMsg.localId);
        }
        return isAlreadyExists;
      });
    }); // remove duplicates
    if (unsentMessages.length) messages = messages.concat(unsentMessages);

    messages.sort((a, b) => a.timestamp - b.timestamp);

    const tempContainer = document.createElement("div");
    messages.forEach((message) => {
      const file = message.content.text
        ? null
        : message.content.file
          ? message.content.file
          : {
              URL: message.content.filePath,
              name: message.content.fileName,
              size: message.content.fileSize,
              type: message.content.fileType,
            };

      new ChatMessage(
        message.content.text,
        file ? [file] : [],
        message.sender.id,
        message.timestamp,
        tempContainer,
        {
          isSender: message.isSender,
          avatarSrc: message.sender.photoURL || "",
          senderName: message.sender.fullName || t("common:unknown_user"),
          localId: message.isSender ? message.localId : "",
          messageId: message.id || "",
          isLocalMsg: message.isLocalMsg || false,
        },
      ).renderMessage();
    });

    const fragment = document.createDocumentFragment();
    fragment.append(...tempContainer.children);
    return fragment;
  } catch (error) {
    console.error(error);
    return document.createDocumentFragment();
  }
};

const getMessageLoader = () => {
  const loaderWrapper = document.createElement("div");
  loaderWrapper.className = "loading-card";
  loaderWrapper.innerHTML = `<div style="display: flex; flex-direction: column">
  <div class="message-sent">
    <div class="messages">
      <div class="first-message-sent-text loading-animation">
        <p class="loading-opacity-animation" style="width: 5rem"></p>

        <span
          class="message-info loading-opacity-animation"
          style="width: 2rem"
        ></span>
      </div>
    </div>
  </div>
  <div class="message-received">
    <div class="avatar loading-opacity-animation"></div>

    <div class="messages">
      <div class="first-message-received-text loading-animation">
        <span
          class="username loading-opacity-animation"
          style="width: 60%"
        ></span>

        <div class="media-message message-media-preview">
          <div
            class="media-div loading-opacity-animation"
            style="width: 100%; height: auto; aspect-ratio: 16/9"
          ></div>

          <button
            type="button"
            class="expand-btn loading-opacity-animation"
            style="width: 2rem"
            disabled
          ></button>
          <a
            class="download-btn button loading-opacity-animation"
            style="width: 2rem"
            disabled
          ></a>
        </div>

        <span
          class="message-info loading-opacity-animation"
          style="width: 10%"
        ></span>
      </div>

      <div class="message-received-text card-item">
        <p class="loading-opacity-animation" style="width: 5rem"></p>
        <span
          class="message-info loading-opacity-animation"
          style="width: 2rem"
        ></span>
      </div>
    </div>
  </div>
</div>
`;
  return loaderWrapper;
};

const getMessagesIds = () => {
  const messageIds = Array.from(
    messagesContainer.querySelectorAll(
      ".message-sent-text, .first-message-sent-text, .message-received-text, .first-message-received-text",
    ),
  ).map((message) => {
    return message.dataset.messageId || "";
  });

  return messageIds;
};

const firstLoadFunc = (cards, groupId, sessionId) => {
  openChatStream(groupId, sessionId);
  const messageIds = getMessagesIds();

  // Remove cards that already exist in the chat container based on messageId
  cards = cards.filter((card) => !messageIds.includes(card.id));

  let lastVisible;
  // if the chat stream add new messages that are already in the chat container and > cards.length, that mean we need to update the lastVisible variable
  if (cards.length === 0) {
    const lastVisibleMessage = messagesContainer.querySelector(
      ".message-sent-text[data-message-id], .first-message-sent-text[data-message-id], .message-received-text[data-message-id], .first-message-received-text[data-message-id]",
    );
    lastVisible = lastVisibleMessage
      ? lastVisibleMessage.dataset.messageId
      : "";
  }
  return {
    cards: [cards],
    lastVisible,
  };
};

let lastSeenMsg = null;

const handleInitialUnreadBannerAndScroll = async (
  groupId,
  isFirstLoad,
  cards = [],
  sessionId = "",
) => {
  if (!groupId || sessionId) {
    scrollToBottom(messagesContainer);
    return;
  }

  if (!cards.length) {
    scrollToBottom(messagesContainer);
    await updateLastSeenFromDOM(groupId, sessionId);
    return;
  }

  if (isFirstLoad) {
    lastSeenMsg = await getLastSeenMessage(groupId, sessionId);
  }

  if (!lastSeenMsg) {
    scrollToBottom(messagesContainer);
    await updateLastSeenFromDOM(groupId, sessionId);
    return;
  }

  let firstUnseenMsg = null;
  const lastSeenIdx = cards.findIndex((c) => c.id === lastSeenMsg.messageId);
  if (lastSeenIdx !== -1 && lastSeenIdx + 1 < cards.length) {
    firstUnseenMsg = cards[lastSeenIdx + 1];
  } else if (lastSeenIdx === -1) {
    firstUnseenMsg = cards.find(
      (c) => Number(c.timestamp) > lastSeenMsg.timestamp,
    );
  }

  if (firstUnseenMsg) {
    const firstUnseenEl = messagesContainer.querySelector(
      `[data-message-id="${firstUnseenMsg.id}"]`,
    );
    if (firstUnseenEl) {
      const existingBanner = messagesContainer.querySelector(
        ".unread-messages-banner",
      );
      if (existingBanner) existingBanner.remove();

      const banner = document.createElement("div");
      banner.className = "unread-messages-banner";
      banner.innerHTML = `<span>${t("common:shared_chat.unread_messages")}</span>`;

      const bubbleContainer =
        firstUnseenEl.closest(".message-sent, .message-received") ||
        firstUnseenEl;
      bubbleContainer.before(banner);

      const bannerTop = banner.offsetTop;
      messagesContainer.scroll({
        top: Math.max(0, bannerTop - 20),
        behavior: "instant",
      });
      if (isFirstLoad) await updateLastSeenFromDOM(groupId, sessionId);
      return;
    }
  }

  if (isFirstLoad) {
    scrollToBottom(messagesContainer);
    await updateLastSeenFromDOM(groupId, sessionId);
  }
};

const afterAppendRes = (data, groupId, sessionId = "") => {
  if (!data.isFirstLoad) {
    const targetScroll = messagesContainer.scrollHeight - data.initialHeight;
    messagesContainer.scroll({
      top: targetScroll,
      behavior: "instant",
    });
  }
  handleInitialUnreadBannerAndScroll(
    groupId,
    data.isFirstLoad,
    data.cards[0] || [],
    sessionId,
  );
};

const initChatLoader = async (groupId, sessionId) => {
  const loader = new Loader(
    messagesContainer,
    createChatFrag,
    `/messages?sessionId=${sessionId}&groupId=${groupId}&`,
    getMessageLoader(),
    {
      chat: true,
      loadersCount: 1,
      append: false,
      afterAppendRes: (data) => afterAppendRes(data, groupId, sessionId),
      firstLoadFunc: (cards) => firstLoadFunc(cards[0], groupId, sessionId),
      rootMargin: "0px",
      threshold: 0.15,
      emptyState: {
        noFilter: {
          icon: "bi-chat",
          title: t("group-chat:skeletons.no_messages_title"),
          desc: t("group-chat:skeletons.no_messages_desc"),
        },
      },
    },
  ).reset();
  return loader;
};

export const iniChat = (groupId = "", sessionId = "") => {
  initDOMVariables();

  initChatLoader(groupId, sessionId);

  chatContainer.addEventListener("dragenter", handleDragEnter);

  chatContainer.addEventListener("dragleave", handleDragLeave);

  registerPageListener(document, "drop", handleDrop);

  sendBtn.addEventListener("click", () => handleChatInput(sessionId, groupId));

  inputMessage.addEventListener("keydown", handleEnterKeyWithTooltip);

  setupChatFileInputListeners({ imageInput, fileInput });

  messagesContainer.addEventListener("click", handleMessagesContainerClick);

  messagesContainer.addEventListener(
    "loadedmetadata",
    handleLoadedMetadataCapture,
    true,
  );

  messagesContainer.addEventListener("ended", handleEndedCapture, true);

  messagesContainer.addEventListener(
    "timeupdate",
    handleTimeUpdateCapture,
    true,
  );

  setupEmojiPickerListeners({
    emojiList,
    inputEl: inputMessage,
    emojiesSearch,
    searchResultContainer: emojiesSearchResultContainer,
  });
};
