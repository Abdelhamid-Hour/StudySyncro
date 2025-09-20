import { emojiCategories } from "./emoji-list.js";

import {
  clearTooltipWithTimeOut,
  formatHoursMinutes,
  getDebounceFunc,
  resetTooltip,
  showTooltip,
} from "../../../global/js/utils.js";

import {
  sendData,
  showMessageBlock,
  throttling,
} from "../../../../../main_assets/js/utils.js";

import {
  selectedFiles,
  PLAYBACK_RATE,
  FileTypes,
  MAXFILESIZE,
} from "./dom-variables.js";
import { globalTooltip } from "../../../global/js/dom-variables.js";

let inputMessage,
  imageInput,
  fileInput,
  sendBtn,
  messagesContainer,
  inputChatContainer,
  emojiButton,
  emojiList,
  emojiesSearch,
  dragLeaveTimer,
  chatContainer,
  emojiesSearchResultContainer;

const initDOMVariables = () => {
  inputMessage = document.querySelector(".input-message");
  imageInput = document.getElementById("image-upload");
  fileInput = document.getElementById("file-upload");
  sendBtn = document.querySelector(".send-btn");
  messagesContainer = document.querySelector(".chat-messages");
  inputChatContainer = document.querySelector(".input-message-container");
  emojiButton = document.querySelector(".emoji-button");
  emojiList = document.querySelector(".emoji-list");
  emojiesSearch = document.querySelector(".emojis-search-input");
  emojiesSearchResultContainer = document.querySelector("#search-result");
  chatContainer = document.querySelector(".chat");
};

const initializeEmojiPicker = (emojiList) => {
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
        `#${category.toLowerCase()} > div`
      );
      initSection(emojisWrapper);
      emojisWrapper.appendChild(fr);
    });
  }, 500);
};

const handleEmojisSearch = (e, emojiesSearchResultContainer) => {
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
      noMatchMessage.textContent = "No matching emojis found.";
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

const handleEmojiListClick = (e, inputMessage, emojiList) => {
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

class ChatMessage {
  constructor(
    text,
    attachments = [],
    isSender,
    avatarSrc,
    senderName,
    timestamp,
    chatContainer,
    send = false
  ) {
    this.text = text;
    this.attachments = attachments;
    this.isSender = isSender;
    this.avatarSrc = avatarSrc;
    this.senderName = senderName;
    this.timestamp = timestamp;
    this.chatContainer = chatContainer;
    this.wrappers = {
      files: [],
      text: null,
    };
    this.send = send;
  }

  async sendMessages({ groupId, sessionId }) {
    try {
      const formData = new FormData();
      formData.append("sessionId", sessionId || "");
      formData.append("groupId", groupId || "");
      formData.append("timestamp", this.timestamp);
      if (this.text) {
        formData.append("message", this.text);
        this.sendMessage(formData);
      }
      if (this.attachments.length > 0) {
        formData.delete("message");
        for (let i = 0; i < this.attachments.length; i++) {
          formData.append("file", this.attachments[i]);
          this.sendMessage(formData, i);
          formData.delete("file");
        }
      }
    } catch (error) {
      console.error();
      showMessageBlock(
        error.message || "Failed to send message. Please try again.",
        "error"
      );
    }
  }

  async sendMessage(formData, fileIndex = null) {
    const wrapper =
      fileIndex !== null ? this.wrappers.files[fileIndex] : this.wrappers.text;
    try {
      const result = await sendData("/api/send-message", formData, "POST");
      wrapper.dataset.messageId = result.messageId;
      const Icon = wrapper.querySelector(".message-info i");
      Icon.className = "bi bi-check";
      Icon.style.fontSize = "x-large";

      if (fileIndex !== null) {
        const file = this.attachments[fileIndex];
        file.URL = result.filePath;
        if (
          FileTypes.IMAGE.includes(file.type) ||
          FileTypes.VIDEO.includes(file.type)
        ) {
          const mediaContainer = wrapper.querySelector(
            ".message-media-preview"
          );
          mediaContainer.classList.remove("uploading");

          mediaContainer.append(this.getBtn(true));
          mediaContainer.querySelector("video, img").src = file.URL;
          const video = mediaContainer.querySelector("video");
          if (video) video.controls = true;
        } else if (FileTypes.AUDIO.includes(file.type)) {
          wrapper.querySelector("audio").src = file.URL;
        }
        wrapper.querySelector(".three-body")?.remove();
        wrapper.querySelector(".pulsar")?.remove();
        wrapper
          .querySelector(".file-preview, .audio-player, .message-media-preview")
          ?.appendChild(this.createDownloadLinkButton(file));
      }
    } catch (error) {
      console.error(error);
      wrapper.dataset.messageId = error.data?.messageId;
      const Icon = wrapper.querySelector(".message-info i");
      Icon.className = "bi bi-exclamation-circle";
      Icon.style.color = "red";
      if (fileIndex !== null) {
        const loader =
          wrapper.querySelector(".three-body") ||
          wrapper.querySelector(".pulsar");
        loader.remove();
        const retryBtn = this.getBtn(false);
        if (
          FileTypes.IMAGE.includes(this.attachments[fileIndex].type) ||
          FileTypes.VIDEO.includes(this.attachments[fileIndex].type)
        ) {
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
            this.sendMessage(formData, fileIndex);
          })
        );
      }
      showMessageBlock(
        error.message || "Failed to send message. Please try again.",
        "error"
      );
    }
  }

  renderMessage() {
    if (this.attachments.length > 0) {
      this.renderAttachments();
    }
    if (this.text) {
      this.renderTextMessage();
    }
    this.scrollToBottom();
    return this;
  }

  scrollToBottom() {
    const scrollHeight = this.chatContainer.scrollHeight;
    this.chatContainer.scrollTo(0, scrollHeight);
  }

  appendToChat(messageBubble, isText) {
    let messageContainer = null;
    const isFirstMessage = this.isFirstMessage();
    if (isFirstMessage) {
      messageContainer = this.createMessageContainer(messageBubble);
      this.chatContainer.append(messageContainer);
    } else {
      messageContainer = this.createMessageWrapper(messageBubble, false);
      this.chatContainer.lastElementChild
        .querySelector(".messages")
        .append(messageContainer);
    }
    const wrapper = isFirstMessage
      ? messageContainer.querySelector(".first-message-sent-text")
      : messageContainer;
    if (isText) this.wrappers.text = wrapper;
    else this.wrappers.files.push(wrapper);
  }

  renderAttachments() {
    const renderers = {
      image: (img) => this.createMediaTemplate(img, "img"),
      video: (vid) => this.createMediaTemplate(vid, "video"),
      audio: (aud) => this.createAudioPlayer(aud),
      document: (doc) =>
        this.createFilePreviewTemplate(
          doc,
          `bi bi-filetype-${doc.name.split(".")[1]}`
        ),
    };
    this.attachments.forEach((attachment) => {
      const kind = FileTypes.IMAGE.includes(attachment.type)
        ? "image"
        : FileTypes.VIDEO.includes(attachment.type)
        ? "video"
        : FileTypes.AUDIO.includes(attachment.type)
        ? "audio"
        : "document";
      const wrapper = renderers[kind](attachment);
      this.appendToChat(wrapper, false);
    });
  }

  renderTextMessage() {
    this.appendToChat(this.createMessageBubble(this.text), true);
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
    const lastUser = lastMessage.querySelector(".username")?.textContent;

    return lastUser && lastUser !== this.senderName;
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

    audioElement.addEventListener("loadedmetadata", () => {
      timeSpan.textContent = this.formatTime(audioElement.duration);
    });

    audioElement.addEventListener("ended", () =>
      this.onAudioEnd(progressBar, audioElement, playIcon, timeSpan)
    );
    audioElement.addEventListener("timeupdate", () =>
      this.updateAudioProgress(progressBar, audioElement, timeSpan)
    );

    audioPreview.append(
      playButton,
      progressContainer,
      timeSpan,
      playBackRate,
      audioElement
    );

    if (this.send) {
      audioPreview.appendChild(this.getCircleLoader());
      this.getObjectURL(file, audioElement);
    } else audioPreview.appendChild(this.createDownloadLinkButton(file));

    return audioPreview;
  }

  onAudioEnd(progressBar, audioElement, playIcon, timeSpan) {
    audioElement.currentTime = 0;
    this.updateAudioProgress(progressBar, audioElement, timeSpan);
    playIcon.className = playIcon.className.replace("pause", "play");
  }

  updateAudioProgress(progressBar, audioElement, timeSpan) {
    const progress = (audioElement.currentTime / audioElement.duration) * 100;
    progressBar.style.width = `${progress}%`;

    timeSpan.textContent = this.formatTime(
      audioElement.duration - audioElement.currentTime
    );
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
    fileNameBtn.textContent = file.name;
    const fileSizeSpan = document.createElement("span");
    fileSizeSpan.className = "file-size";
    fileSizeSpan.textContent = this.formatFileSize(file.size);
    fileDetails.append(fileNameBtn, fileSizeSpan);

    filePreview.append(fileThumbnail, fileDetails);
    if (this.send) {
      filePreview.appendChild(this.getCircleLoader());
    } else filePreview.appendChild(this.createDownloadLinkButton(file));

    return filePreview;
  }

  createDownloadLinkButton(file) {
    const downloadLinkBtn = document.createElement("a");
    downloadLinkBtn.className = "download-btn button";
    downloadLinkBtn.href = file.URL || "";
    downloadLinkBtn.download = file.name;
    const downloadIcon = document.createElement("i");
    downloadIcon.className = "bi bi-download";
    downloadLinkBtn.append(downloadIcon);
    return downloadLinkBtn;
  }

  getBtn(expand = true) {
    const expandBtn = document.createElement("button");
    expandBtn.type = "button";
    expandBtn.className = expand ? "expand-btn" : "retry-btn";
    const expandIcon = document.createElement("i");
    expandIcon.className = expand
      ? "bi bi-arrows-fullscreen"
      : "bi bi-arrow-clockwise";
    expandBtn.append(expandIcon);
    return expandBtn;
  }

  getMediaLoader() {
    const wrapper = document.createElement("div");
    wrapper.className = "three-body";
    wrapper.innerHTML = `
    <!-- From Uiverse.io by dovatgabriel -->
        <div class="three-body__dot"></div>
        <div class="three-body__dot"></div>
        <div class="three-body__dot"></div>
    `;
    return wrapper;
  }

  getCircleLoader() {
    const wrapper = document.createElement("div");
    wrapper.className = "pulsar";
    return wrapper;
  }

  createMediaTemplate(file, type) {
    const mediaContainer = document.createElement("div");
    mediaContainer.className = "media-message message-media-preview";
    const mediaElement = document.createElement(type);
    mediaElement.src = file.URL || "";

    if (type === "img") mediaElement.alt = file.name;
    if (type === "video") mediaElement.controls = !this.send;

    const mediaDiv = document.createElement("div");
    mediaDiv.className = "media-div";
    mediaDiv.appendChild(mediaElement);

    mediaContainer.append(mediaDiv);

    if (this.send) {
      mediaContainer.classList.add("uploading");
      mediaContainer.appendChild(this.getMediaLoader());
      this.getObjectURL(file, mediaElement);
    } else {
      mediaContainer.append(
        this.getBtn(true),
        this.createDownloadLinkButton(file)
      );
    }

    return mediaContainer;
  }

  async getObjectURL(file, mediaElement) {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      const URL = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
      });
      mediaElement.src = URL;
    } catch (error) {
      console.error("Error reading image file:", error);
      return "";
    }
  }

  createMessageBubble(text) {
    const p = document.createElement("p");
    p.textContent = text;
    return p;
  }

  createMessageWrapper(messageBubble, isFirstMessage) {
    const messageWrapper = document.createElement("div");
    messageWrapper.className = `${isFirstMessage ? "first-" : ""}message-${
      this.isSender ? "sent" : "received"
    }-text`;

    messageWrapper.dataset.messageId = "";

    if (!this.isSender && isFirstMessage) {
      const usernameSpan = document.createElement("span");
      usernameSpan.className = "username";
      usernameSpan.textContent = this.senderName;
      messageWrapper.appendChild(usernameSpan);
    }

    messageWrapper.appendChild(messageBubble);

    const messageInfo = document.createElement("span");
    messageInfo.className = "message-info";
    messageInfo.textContent = formatHoursMinutes(this.timestamp);

    if (this.send) {
      const clockIcon = document.createElement("i");
      clockIcon.className = "bi bi-clock";
      messageInfo.appendChild(clockIcon);
    } else if (this.isSender) {
      const checkIcon = document.createElement("i");
      checkIcon.className = "bi bi-check";
      messageInfo.appendChild(checkIcon);
    }
    messageWrapper.appendChild(messageInfo);

    return messageWrapper;
  }

  createMessageContainer(messageBubble) {
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
        avatarImg.alt = "User Avatar";
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
    messagesDiv.appendChild(this.createMessageWrapper(messageBubble, true));
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

const handleFiles = (files) => {
  for (const f of Array.from(files)) {
    if (selectedFiles.items.length >= 5) {
      return showMessageBlock(
        "You can only upload a maximum of 5 files",
        "error"
      );
    }
    const isSupportedType = Object.values(FileTypes).find((types) =>
      types.includes(f.type)
    );
    if (!isSupportedType) {
      showMessageBlock("Invalid file type. Please select other file.", "error");
      continue;
    }
    if (f.size > MAXFILESIZE) {
      showMessageBlock(
        `File "${f.name}" size exceeds the maximum limit of ${
          MAXFILESIZE / (1024 * 1024)
        } MB.`,
        "error"
      );
      continue;
    }
    selectedFiles.items.add(f);
    displayFile(f);
  }
};

const displayFile = async (file) => {
  let filesView = document.querySelector(".files-view");
  if (!filesView) {
    filesView = document.createElement("div");
    filesView.className = "files-view";
    inputChatContainer.append(filesView);
    filesView.addEventListener("click", (e) => {
      const btn = e.target.closest(".remove-file-btn");
      if (e.target.closest(".remove-file-btn")) {
        const targetFileName = btn.previousElementSibling?.dataset.fileName;
        const fileIndex = Array.from(selectedFiles.items).findIndex((f) => {
          return f.getAsFile().name === targetFileName;
        });

        selectedFiles.items.remove(fileIndex);
        btn.parentElement.remove();
      }
      if (!selectedFiles.items.length) {
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
  const isImg = FileTypes.IMAGE.includes(file.type);
  const isVid = FileTypes.VIDEO.includes(file.type);
  if (isImg || isVid) {
    const elementName = isImg ? "img" : "video";
    const mediaContainer = document.createElement("div");
    mediaContainer.className = "media-preview";
    const mediaElement = document.createElement(elementName);
    mediaElement.dataset.fileName = file.name;
    const r = new FileReader();
    r.readAsDataURL(file);
    const mediaURL = await new Promise((res, rej) => {
      r.onload = () => {
        return res(r.result);
      };
      r.onerror = () => {
        return rej(r.error);
      };
    });
    mediaElement.src = mediaURL;
    if (isImg) mediaElement.alt = file.name;
    mediaContainer.append(mediaElement, closeBtn);

    filesView.append(mediaContainer);
  } else {
    const filePreview = document.createElement("div");
    filePreview.className = "file";
    const typeBadge = document.createElement("span");
    typeBadge.className = "badge badge-type";
    typeBadge.textContent = file.name.split(".")[1].toUpperCase();
    const fileName = document.createElement("span");
    fileName.className = "file-name";
    fileName.textContent = file.name;
    fileName.dataset.fileName = file.name;

    filePreview.append(typeBadge, fileName, closeBtn);
    filesView.append(filePreview);
  }
};
// !
const handleChatInput = async (sessionId, groupId) => {
  let files = [];

  // Handle image input
  if (selectedFiles.items.length) {
    files = Array.from(selectedFiles.items).map((f) => f.getAsFile());
  }
  // Check if there is a message or files to send
  const inputValue = inputMessage.value.trim();
  if (inputValue || files.length > 0) {
    new ChatMessage(
      inputValue,
      files,
      true,
      "",
      "Abdelwahed",
      new Date(),
      messagesContainer,
      true
    )
      .renderMessage()
      .sendMessages({
        sessionId,
        groupId,
      });

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
    text.textContent = "Drop files here to add to your message.";
    dropArea.append(icon, text);
    inputChatContainer.append(dropArea);
  }
  setTimeout(() => {
    inputChatContainer.classList.add("drop-start");
  }, 0);
};

const showEnterTooltip = (target) => {
  showTooltip(target, globalTooltip, "To add a new line, press Ctrl + Enter");
  clearTooltipWithTimeOut(target);
};

export const initAndDiplayErrorTooltip = (inputContainer, message) => {
  inputContainer.querySelector(".input, input")?.focus();
  inputContainer.classList.add("error-input", "error-animation");
  showTooltip(inputContainer, globalTooltip, message, true);
  clearTooltipWithTimeOut(inputContainer);
};

export const handleEnterKeyWithTooltip = (function () {
  let clickCount = 0;
  return function (e) {
    if (e.key === "Enter" && !e.ctrlKey) {
      e.preventDefault();
      sendBtn.click();
      clickCount++;
    }

    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      this.value += "\n";
      this.scrollTop = this.scrollHeight;
    }

    if (clickCount >= 5) {
      showEnterTooltip(inputMessage);
      clickCount = 0;
    }
  };
})();

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

const handleMessagesContainerClick = (e) => {
  const target = e.target;

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

const handleCategoryClick = (e) => {
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

export const iniChatMessageInput = (groupId = "", sessionId = "") => {
  initDOMVariables();

  chatContainer.addEventListener("dragenter", handleDragEnter);

  chatContainer.addEventListener("dragleave", handleDragLeave);

  document.addEventListener("drop", handleDrop);

  sendBtn.addEventListener("click", () => handleChatInput(sessionId, groupId));

  inputMessage.addEventListener("keydown", handleEnterKeyWithTooltip);

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) {
      handleFiles(fileInput.files);
    }
  });

  imageInput.addEventListener("change", () => {
    if (imageInput.files.length) {
      handleFiles(imageInput.files);
    }
  });

  messagesContainer.addEventListener("click", handleMessagesContainerClick);

  initializeEmojiPicker(emojiList);

  emojiList.addEventListener("click", (e) => {
    handleEmojiListClick(e, inputMessage, emojiList);
    handleCategoryClick(e);
  });

  emojiesSearch.addEventListener("input", (e) => {
    handleEmojisSearch(e, emojiesSearchResultContainer);
  });
};
