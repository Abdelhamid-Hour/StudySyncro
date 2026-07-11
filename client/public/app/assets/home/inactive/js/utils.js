import { fetchData, sendData } from "../../../../../main_assets/js/utils.js";
import { openOverlayModal } from "../../../global/js/utils.js";
import { Loader } from "../../../shared/loader/js/utils.js";
import { joinSession } from "../../../shared/session/js/utils.js";
import { handletTasksListners } from "../../../shared/tasks/js/utils.js";
import { sessionsContainer, messagesContainer } from "./dom-variables.js";
import {
  initializeEmojiPicker,
  handleEmojiListClick,
  handleCategoryClick,
  handleEmojisSearch,
} from "../../../shared/chat/js/utils.js";

export const handleSessionBtns = async (e) => {
  const sessionId = e.target
    .closest(".action-buttons")
    .getAttribute("data-session-id");
  const viewDetailsBtn = e.target.closest(".view-details");
  if (viewDetailsBtn) {
    openOverlayModal(
      "session-view-overlay",
      [".close-session-view-overlay"],
      async () => {
        const { overlay } = await fetchData("/session-details/" + sessionId);
        return overlay;
      },
      () => handletTasksListners("session-tasks")
    );
  }

  const joinBtn = e.target.closest(".join-session");
  if (joinBtn) {    
    joinSession(sessionId, joinBtn);
  }
};

const getSessionLoader = () => {
  const loader = document.createElement("div");
  loader.className = "active-session loading-animation loading-card";
  loader.innerHTML = `<header>
    <div class="session-info" style="width: 50%">
      <h3 class="session-name" style="">
        <span
          class="loading-opacity-animation"
          style="height: 1.4rem; width: 50%"
        ></span>
        <span
          class="joined-count badge simple-badge loading-opacity-animation"
          style="height: 1.3rem; width: 30%; border-radius: 5rem"
        ></span>
      </h3>
      <span
        class="group badge loading-opacity-animation"
        style="width: 30%; margin-top: 0.2rem; justify-content: left"
      ></span>
    </div>
    <div class="meta-info" style="width: 50%">
      <span
        class="badge simple-badge loading-opacity-animation"
        style="height: 1.3rem; width: 30%; border-radius: 5rem"
      ></span>
      <span
        class="badge simple-badge loading-opacity-animation"
        style="height: 1.3rem; width: 20%; border-radius: 5rem"
      ></span>
    </div>
  </header>
  <p
    class="session-description loading-opacity-animation"
    style="width: 80%; height: 1rem"
  ></p>
  <p
    class="session-description loading-opacity-animation"
    style="width: 30%; height: 1rem"
  ></p>
  <footer class="footer">
    <div class="footer-meta-info" style="width: 50%">
      <span
        class="badge simple-badge loading-opacity-animation"
        style="height: 1.3rem; width: 30%; border-radius: 5rem"
      ></span>
      <span
        class="badge simple-badge loading-opacity-animation"
        style="height: 1.3rem; width: 30%; border-radius: 5rem"
      ></span>
    </div>
    <div
      class="action-buttons"
      data-session-id="IniGoJHQ1eLAVpUcux0D"
      style="width: 35%"
    >
      <div
        class="loading-opacity-animation"
        style="width: 50%; height: 2.3rem"
      ></div>
      <div
        class="should-fill loading-opacity-animation"
        style="width: 50%; height: 2.3rem"
      ></div>
    </div>
  </footer>`;
  return loader;
};

const createSessionCard = (session) => {
  const card = document.createElement("div");
  card.className = "active-session card-item";

  card.innerHTML = `
    <header>
      <div class="session-info">
        <h3 class="session-name">
          <span class="session-title"></span>
          <span class="joined-count badge simple-badge">
            <span class="joined-count-value"></span> Joined Users
          </span>
        </h3>
        <span class="group badge">
          <i class="bi bi-book-fill"></i>
          <span class="group-name"></span>
        </span>
      </div>
      <div class="meta-info">
        <span class="badge blue-badge">
          <i class="bi bi-clock-fill"></i>
          Duration
          <span class="duration"></span>
        </span>
        <span class="badge simple-badge">
          <i class="bi bi-list-task"></i>
          <span class="tasks-count"></span> Tasks
        </span>
      </div>
    </header>
    <p class="session-description"></p>
    <footer class="footer">
      <div class="footer-meta-info">
        <span class="badge green-badge">
          <i class="bi bi-play-circle"></i>
          Start At:
          <span class="duration"></span>
        </span>
        <span class="badge orange-badge">
          <i class="bi bi-stopwatch"></i>
          End At:
          <span class="duration"></span>
        </span>
      </div>
      <div class="action-buttons" data-session-id="">
        <button type="button" class="join-session blue-btn">
          <i class="bi bi-box-arrow-in-right"></i>
          Join Session
        </button>
        <button type="button" class="should-fill view-details">
          <i class="bi bi-info-circle"></i>
          View Details
        </button>
      </div>
    </footer>
  `;
  

  card.querySelector(".session-title").textContent = session.name || "";
  card.querySelector(".joined-count-value").textContent =
    session.joinedCount ?? 0;
  card.querySelector(".group-name").textContent = session.groupName || "N/A";
  card.querySelector(".meta-info .blue-badge .duration").textContent =
    session.duration || "N/A";
  card.querySelector(".meta-info .tasks-count").textContent =
    session.tasksCount ?? 0;
  card.querySelector(".session-description").textContent =
    session.description || "";
  card.querySelector(".footer-meta-info .green-badge .duration").textContent =
    session.startTime || "N/A";
  card.querySelector(".footer-meta-info .orange-badge .duration").textContent =
    session.endTime || "N/A";
  card
    .querySelector(".action-buttons")
    .setAttribute("data-session-id", session.id || "");

  return card;
};

import { initFiltersInputListener } from "../../../shared/loader/js/utils.js";

const getSearchCriteria = () => {
  const searchInput = document.querySelector("#active-sessions-search-input");
  const search = searchInput ? searchInput.value.toLowerCase().trim() : "";
  return search ? `search=${search}` : "";
};

export const initSessionsLoader = () => {
  const loader = new Loader(
    sessionsContainer,
    createSessionCard,
    "/active-sessions?",
    getSessionLoader(),
    {
      loadersCount: 1,
      getCriteria: getSearchCriteria,
      emptyState: {
        noFilter: {
          icon: "bi-clock-history",
          title: "No Active Sessions",
          desc: "There are no study sessions currently active. You can start one or wait for others to join.",
        },
        filtered: {
          icon: "bi-clock-history",
          title: "No Active Sessions Found",
          desc: "We couldn't find any active sessions matching your search query.",
        },
      },
    }
  );
  
  const searchContainer = document.querySelector(".active-sessions-search");
  if (searchContainer) {
    initFiltersInputListener(loader, searchContainer);
  }

  initActiveSessionsStream();
};

let sessionsEventSource = null;

const initActiveSessionsStream = () => {
  if (sessionsEventSource) {
    sessionsEventSource.close();
  }

  const lastQueryTime = new Date().toISOString();
  sessionsEventSource = new EventSource(`/api/stream-sessions?lastQueryTime=${lastQueryTime}`);
  
  sessionsEventSource.onmessage = (event) => {
    try {
      
      const data = JSON.parse(event.data);
      
      if (data.newSession) {
        // Apply current search filter
        const searchInput = document.querySelector("#active-sessions-search-input");
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";
        
        if (searchTerm && (!data.newSession.name || !data.newSession.name.toLowerCase().includes(searchTerm))) {
          return; // Skip prepending if it doesn't match the current search
        }

        const existingCard = sessionsContainer.querySelector(`.action-buttons[data-session-id="${data.newSession.id}"]`);
        if (!existingCard) {
          const card = createSessionCard(data.newSession);
          const emptyState = sessionsContainer.querySelector(".icon-wrapper");
          if (emptyState) emptyState.remove();
          sessionsContainer.prepend(card);
        }
      }

      if (data.modifiedSession) {
        const cardActionButtons = sessionsContainer.querySelector(`.action-buttons[data-session-id="${data.modifiedSession.id}"]`);
        if (cardActionButtons) {
          const card = cardActionButtons.closest(".active-session");
          if (card) {
            card.querySelector(".joined-count-value").textContent = data.modifiedSession.joinedCount ?? 0;
          }
        }
      }

      if (data.removedSession) {
        const cardActionButtons = sessionsContainer.querySelector(`.action-buttons[data-session-id="${data.removedSession}"]`);
        if (cardActionButtons) {
          const card = cardActionButtons.closest(".active-session");
          if (card) card.remove();
        }
      }
    } catch (e) {
      // Ignore heartbeat/parsing errors
    }
  };

  sessionsEventSource.onerror = (error) => {
    console.error("SSE stream error:", error);
    sessionsEventSource.close();
    // Reconnect after 5 seconds
    setTimeout(initActiveSessionsStream, 5000);
  };
};

export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return "";
  const diff = Date.now() - Number(timestamp);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const date = new Date(Number(timestamp));
  return date.toLocaleDateString();
};

export const handleRecentMessageBtns = async (e) => {
  const markReadBtn = e.target.closest(".mark-read");
  if (markReadBtn) {
    const card = markReadBtn.closest(".recent-message");
    if (!card || !card.classList.contains("has-unread")) return;
    const groupId = card.getAttribute("data-group-id");
    if (!groupId) return;

    try {
      const badge = card.querySelector(".unread-count");
      if (badge) badge.remove();
      card.classList.remove("has-unread");
      markReadBtn.remove();
      await sendData("/api/chat/mark-read", { groupId }, "POST");
    } catch (err) {
      console.error("Error marking chat as read:", err);
    }
    return;
  }

  const replyGroupBtn = e.target.closest(".reply-group");
  if (replyGroupBtn) {
    const card = replyGroupBtn.closest(".recent-message");
    const groupId = card?.getAttribute("data-group-id");
    if (groupId) {
      window.location.href = `/app/groups/my/${groupId}/chat`;
    }
    return;
  }

  const replyBtn = e.target.closest(".reply");
  if (replyBtn) {
    const card = replyBtn.closest(".recent-message");
    const groupId = card?.getAttribute("data-group-id");
    if (!groupId || !card) return;

    if (replyBtn.classList.contains("active-reply")) {
      replyBtn.classList.remove("active-reply");
      replyBtn.removeAttribute("data-reply-open");
      replyBtn.innerHTML = '<i class="bi bi-reply"></i> Reply';

      const sharedReplyBox = document.querySelector(
        ".shared-recent-messages-reply"
      );
      if (sharedReplyBox) {
        const textarea = sharedReplyBox.querySelector(".shared-reply-input");
        if (textarea) textarea.value = "";
        sharedReplyBox.style.display = "none";
      }
      return;
    }

    document.querySelectorAll(".recent-message .reply").forEach((btn) => {
      btn.classList.remove("active-reply");
      btn.removeAttribute("data-reply-open");
      btn.innerHTML = '<i class="bi bi-reply"></i> Reply';
    });

    replyBtn.classList.add("active-reply");
    replyBtn.setAttribute("data-reply-open", "true");
    replyBtn.innerHTML = '<i class="bi bi-x-circle"></i> Close';

    document
      .querySelectorAll(".card-reply-container")
      .forEach((el) => el.remove());

    const sharedReplyBox = ensureSharedRecentMessagesReplyBox();
    if (!sharedReplyBox) return;

    sharedReplyBox.dataset.activeGroupId = groupId;
    sharedReplyBox.style.display = "block";
    const textarea = sharedReplyBox.querySelector(".shared-reply-input");
    if (textarea) {
      textarea.focus();
    }
    if (window.innerWidth > 768) {
      sharedReplyBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }
};

let sharedFilesInstance = null;

const ensureSharedRecentMessagesReplyBox = () => {
  const recentMessagesSection =
    document.querySelector(".content-blocks .recent-messages") ||
    document.querySelector(".recent-messages");
  if (!recentMessagesSection) return null;

  let sharedReplyBox = recentMessagesSection.querySelector(
    ".shared-recent-messages-reply"
  );
  if (sharedReplyBox) return sharedReplyBox;

  if (!sharedFilesInstance) {
    sharedFilesInstance = new DataTransfer();
  }

  sharedReplyBox = document.createElement("div");
  sharedReplyBox.className = "shared-recent-messages-reply";
  sharedReplyBox.style.display = "none";
  sharedReplyBox.style.width = "100%";
  sharedReplyBox.innerHTML = `
    <div class="input-message-container" style="border: none;">
      <div class="icons">
        <label for="shared-image-upload" class="should-fill">
          <i class="bi bi-image"></i>
        </label>
        <label for="shared-file-upload">
          <i class="bi bi-paperclip"></i>
        </label>
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
                placeholder="Search for emoji"
                class="emojis-search-input"
              />
            </div>
            <div class="emojies-sections">
              <section id="recent">
                <h5>Recent</h5>
                <div class="recent-emojies"></div>
              </section>
              <section id="people">
                <h5>People</h5>
                <div class="people-emojies"></div>
              </section>
              <section id="animals_nature">
                <h5>Animals &amp; Nature</h5>
                <div class="animals-nature-emojies"></div>
              </section>
              <section id="food_drink">
                <h5>Food &amp; Drink</h5>
                <div class="food-drink-emojies"></div>
              </section>
              <section id="activity">
                <h5>Activity</h5>
                <div class="activity-emojies"></div>
              </section>
              <section id="objects">
                <h5>Objects</h5>
                <div class="objects-emojies"></div>
              </section>
              <section id="symbols">
                <h5>Symbols</h5>
                <div class="symbols-emojies"></div>
              </section>
              <section id="travel_places">
                <h5>Travel &amp; Places</h5>
                <div class="travel-places-emojies"></div>
              </section>
              <section id="flags">
                <h5>Flags</h5>
                <div class="flags-emojies"></div>
              </section>
            </div>
            <div id="search-result"></div>
          </div>
        </div>
      </div>
      <textarea placeholder="Type a message..." class="input-message shared-reply-input"></textarea>
      <button type="button" class="send-btn exclude-btn should-fill shared-send-btn">
        <i class="bi bi-send"></i>
      </button>
    </div>
    <input
      type="file"
      id="shared-image-upload"
      class="file-input"
      style="display: none;"
      accept="image/png,image/jpeg,image/jpg,image/gif,video/mp4"
      multiple
    />
    <input
      multiple
      type="file"
      id="shared-file-upload"
      class="file-input"
      style="display: none;"
      accept=".pdf,.mp3,.doc,.docx,.xls,.xlsx,.zip,.txt"
    />
  `;

  recentMessagesSection.appendChild(sharedReplyBox);

  const inputMessageContainer = sharedReplyBox.querySelector(
    ".input-message-container"
  );
  const sendBtn = sharedReplyBox.querySelector(".shared-send-btn");
  const textarea = sharedReplyBox.querySelector(".shared-reply-input");
  const emojiList = sharedReplyBox.querySelector(".emoji-list");
  const emojiesSearch = sharedReplyBox.querySelector(".emojis-search-input");
  const emojiesSearchResultContainer =
    sharedReplyBox.querySelector("#search-result");
  const imageInput = sharedReplyBox.querySelector("#shared-image-upload");
  const fileInput = sharedReplyBox.querySelector("#shared-file-upload");

  if (emojiList) {
    initializeEmojiPicker(emojiList);
    emojiList.addEventListener("click", (e) => {
      handleEmojiListClick(e, textarea, emojiList);
      handleCategoryClick(e);
    });
  }

  if (emojiesSearch) {
    emojiesSearch.addEventListener("input", (e) => {
      handleEmojisSearch(e, emojiesSearchResultContainer);
    });
  }

  const displaySharedFile = (file) => {
    let filesView = inputMessageContainer.querySelector(".files-view");
    if (!filesView) {
      filesView = document.createElement("div");
      filesView.className = "files-view";
      inputMessageContainer.append(filesView);
      filesView.addEventListener("click", (e) => {
        const btn = e.target.closest(".remove-file-btn");
        if (btn) {
          const targetFileName = btn.previousElementSibling?.dataset.fileName;
          const fileIndex = Array.from(sharedFilesInstance.items).findIndex(
            (f) =>
              f.name === targetFileName ||
              f.getAsFile?.()?.name === targetFileName
          );
          if (fileIndex !== -1) {
            sharedFilesInstance.items.remove(fileIndex);
          }
          btn.parentElement.remove();
        }
        if (!sharedFilesInstance.items.length) {
          filesView.remove();
        }
      });
    }

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "exclude-btn remove-file-btn";
    removeBtn.innerHTML = `<i class="bi bi-x-circle-fill"></i>`;

    const isImg = file.type.startsWith("image/");
    if (isImg) {
      const mediaContainer = document.createElement("div");
      mediaContainer.className = "media-preview";
      const mediaElement = document.createElement(
        file.type.startsWith("video/") ? "video" : "img"
      );
      mediaElement.dataset.fileName = file.name;
      mediaElement.src = URL.createObjectURL(file);
      if (isImg) mediaElement.alt = file.name;
      mediaContainer.append(mediaElement, removeBtn);
      filesView.append(mediaContainer);
    } else {
      const filePreview = document.createElement("div");
      filePreview.className = "file";
      const typeBadge = document.createElement("span");
      typeBadge.className = "badge badge-type";
      typeBadge.textContent = file.name.split(".").pop().toUpperCase();
      const fileName = document.createElement("span");
      fileName.className = "file-name";
      fileName.textContent = file.name;
      fileName.dataset.fileName = file.name;
      filePreview.append(typeBadge, fileName, removeBtn);
      filesView.append(filePreview);
    }
  };

  const handleSharedFiles = (files) => {
    for (const f of Array.from(files)) {
      if (sharedFilesInstance.items.length >= 5) {
        alert("You can only upload a maximum of 5 files");
        return;
      }
      if (f.size > 50 * 1024 * 1024) {
        alert(`File "${f.name}" size exceeds 50MB.`);
        continue;
      }
      sharedFilesInstance.items.add(f);
      displaySharedFile(f);
    }
  };

  if (imageInput) {
    imageInput.addEventListener("change", () => {
      if (imageInput.files.length) handleSharedFiles(imageInput.files);
      imageInput.value = "";
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", () => {
      if (fileInput.files.length) handleSharedFiles(fileInput.files);
      fileInput.value = "";
    });
  }

  const closeSharedReplyBox = () => {
    textarea.value = "";
    const filesViewEl = inputMessageContainer.querySelector(".files-view");
    if (filesViewEl) filesViewEl.remove();
    sharedFilesInstance.items.clear();
    sharedReplyBox.style.display = "none";
    document.querySelectorAll(".recent-message .reply").forEach((btn) => {
      btn.classList.remove("active-reply");
      btn.removeAttribute("data-reply-open");
      btn.innerHTML = '<i class="bi bi-reply"></i> Reply';
    });
  };

  const sendSharedReply = async () => {
    const groupId = sharedReplyBox.dataset.activeGroupId;
    if (!groupId) return;

    const text = textarea.value.trim();
    const filesToSend = Array.from(sharedFilesInstance.items).map((f) =>
      f.getAsFile ? f.getAsFile() : f
    );
    if (!text && filesToSend.length === 0) return;

    closeSharedReplyBox();

    const card = document.querySelector(
      `.recent-message[data-group-id="${groupId}"]`
    );
    const textMsgEl = card?.querySelector(".text-message");
    const originalContent = textMsgEl ? textMsgEl.innerHTML : "";

    const displaySummary =
      text || (filesToSend.length ? `Attachment (${filesToSend.length})` : "");
    if (textMsgEl) {
      textMsgEl.innerHTML = `<span class="icon-box"><i class="bi bi-clock"></i></span> ${displaySummary}`;
    }

    try {
      if (text) {
        const formData = new FormData();
        formData.append("groupId", groupId);
        formData.append("message", text);
        formData.append("timestamp", Date.now());
        formData.append(
          "localId",
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString()
        );
        await sendData("/api/send-message", formData, "POST");
      }

      for (const file of filesToSend) {
        const formData = new FormData();
        formData.append("groupId", groupId);
        formData.append("file", file);
        formData.append("timestamp", Date.now());
        formData.append(
          "localId",
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString()
        );
        await sendData("/api/send-message", formData, "POST");
      }

      if (textMsgEl && textMsgEl.isConnected) {
        textMsgEl.textContent = displaySummary;
      }
    } catch (err) {
      console.error("Error sending reply:", err);
      if (textMsgEl && textMsgEl.isConnected) {
        textMsgEl.innerHTML = originalContent;
      }
    }
  };

  sendBtn.addEventListener("click", sendSharedReply);
  textarea.addEventListener("keydown", (evt) => {
    if (evt.key === "Enter" && !evt.shiftKey) {
      evt.preventDefault();
      sendSharedReply();
    }
  });

  return sharedReplyBox;
};

const getRecentMessageLoader = () => {
  const loader = document.createElement("div");
  loader.className = "recent-message card-item loading-animation loading-card";
  loader.innerHTML = `
    <header>
      <div class="profile-info" style="width: 60%">
        <span class="loading-opacity-animation icon" style="height: 2.5rem; width: 2.5rem; border-radius: 50%;"></span>
        <div class="details" style="width: 80%">
          <span class="loading-opacity-animation" style="height: 1rem; width: 60%; display: block; margin-bottom: 0.4rem;"></span>
          <span class="loading-opacity-animation" style="height: 0.8rem; width: 40%; display: block;"></span>
        </div>
      </div>
      <div class="meta-info" style="width: 30%; justify-content: flex-end;">
        <span class="loading-opacity-animation" style="height: 1rem; width: 50px;"></span>
      </div>
    </header>
    <p class="loading-opacity-animation" style="height: 1.2rem; width: 90%; margin: 1rem 0;"></p>
    <div class="action-buttons">
      <span class="loading-opacity-animation button" style="height: 2rem; width: 120px;"></span>
      <span class="loading-opacity-animation button" style="height: 2rem; width: 80px;"></span>
    </div>
  `;
  return loader;
};

const createRecentMessageCard = (data) => {
  const card = document.createElement("div");
  const hasUnread = data.hasUnreadMessages && data.unreadCount > 0;
  card.className = `recent-message card-item ${hasUnread ? "has-unread" : ""}`;
  card.setAttribute("data-group-id", data.groupId || "");
  card.setAttribute("data-last-update", data.lastUpdate || 0);

  const unreadBadgeHtml = hasUnread
    ? `<span class="unread-count blue-badge badge">${data.unreadCount} New Message${data.unreadCount > 1 ? "s" : ""}</span>`
    : "";

  const markReadBtnHtml = hasUnread
    ? `<button type="button" class="mark-read">
        <i class="bi bi-check2-all"></i>
        Mark as read
      </button>`
    : "";

  const photoURL =
    data.lastMessage?.senderPhotoURL ||
    data.lastMessage?.photoURL ||
    data.senderPhotoURL ||
    data.photoURL;

  const avatarHtml = photoURL
    ? `<img src="${photoURL}" alt="avatar" class="icon" />`
    : `<i class="bi bi-person-circle icon"></i>`;

  card.innerHTML = `
    <header>
      <div class="profile-info">
        ${avatarHtml}
        <div class="details">
          <span class="user">${data.lastMessage?.senderName || data.lastMessageSender || "Someone"}</span>
          <span class="group">${data.groupName || "Study Group"}</span>
        </div>
      </div>
      <div class="meta-info">
        <span class="timestamp">${formatTimeAgo(data.lastUpdate)}</span>
        ${unreadBadgeHtml}
      </div>
    </header>
    <p class="text-message">
      ${data.lastMessage?.text || data.lastMessageText || "No messages yet"}
    </p>
    <div class="action-buttons" data-group-id="${data.groupId}">
      <button type="button" class="should-fill reply-group">
        <i class="bi bi-reply"></i>
        Reply In Group
      </button>
      <button type="button" class="should-fill reply">
        <i class="bi bi-reply"></i>
        Reply
      </button>
      ${markReadBtnHtml}
    </div>
  `;
  return card;
};

const insertCardInOrder = (card) => {
  const emptyState = messagesContainer.querySelector(".icon-wrapper");
  if (emptyState) emptyState.remove();

  const cardTime = Number(card.getAttribute("data-last-update") || 0);
  const allCards = Array.from(messagesContainer.querySelectorAll(".recent-message")).filter(c => c !== card);
  let inserted = false;

  for (const existing of allCards) {
    const existingTime = Number(existing.getAttribute("data-last-update") || 0);
    if (cardTime > existingTime) {
      existing.before(card);
      inserted = true;
      break;
    }
  }

  if (!inserted) {
    const loaderCard = messagesContainer.querySelector(".loading-card");
    if (loaderCard) {
      loaderCard.before(card);
    } else {
      messagesContainer.appendChild(card);
    }
  }
};

export const initRecentMessagesLoader = () => {
  if (!messagesContainer) return;
  const loader = new Loader(
    messagesContainer,
    createRecentMessageCard,
    "/recent-messages?",
    getRecentMessageLoader(),
    {
      loadersCount: 1,
      emptyState: {
        noFilter: {
          icon: "bi-chat-text-fill",
          title: "No Messages Yet",
          desc: "No recent messages yet. Join or create a study group to start collaborating and sharing messages!",
        },
      },
    }
  );

  initRecentMessagesStream();
};

let recentMessagesEventSource = null;

const initRecentMessagesStream = () => {
  if (!messagesContainer) return;
  if (recentMessagesEventSource) {
    recentMessagesEventSource.close();
  }

  recentMessagesEventSource = new EventSource(`/api/recent-messages/stream`);

  recentMessagesEventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (!data || !data.groupId) return;

      const existingCard = messagesContainer.querySelector(`.recent-message[data-group-id="${data.groupId}"]`);
      if (existingCard) {
        existingCard.remove();
      }

      if (data.removed) return;

      const newCard = createRecentMessageCard(data);
      insertCardInOrder(newCard);
    } catch (e) {
      // Ignore heartbeat/parsing errors
    }
  };

  recentMessagesEventSource.onerror = (error) => {
    console.error("SSE recent messages stream error:", error);
    recentMessagesEventSource.close();
    setTimeout(initRecentMessagesStream, 5000);
  };
};

export const initMobileInactiveTabs = (forceReset = false) => {
  const contentBlocks = document.querySelector(".overview-session-inactive .content-blocks");
  const activeSessionsSection = document.querySelector(".content-blocks .active-sessions");
  const recentMessagesSection = document.querySelector(".content-blocks .recent-messages");
  const mobileSearchBtn = document.querySelector(".mobile-search-btn");
  const mobileSearchBox = document.getElementById("mobile-search-box");
  const headerContainer = document.getElementById("mobile-tabs-container");

  if (!contentBlocks || !activeSessionsSection || !recentMessagesSection) {
    if (headerContainer) {
      headerContainer.classList.add("hidden");
      headerContainer.innerHTML = "";
    }
    return;
  }

  const isMobile = window.matchMedia("(max-width: 48rem)").matches;

  if (!isMobile) {
    if (headerContainer) {
      headerContainer.classList.add("hidden");
      headerContainer.innerHTML = "";
    }
    const existingTabs = document.querySelector(".mobile-inactive-tabs");
    existingTabs?.remove();
    activeSessionsSection.style.display = "";
    recentMessagesSection.style.display = "";
    return;
  }

  if (!forceReset && headerContainer.querySelector(".mobile-inactive-tabs")) {
    return;
  }

  if (mobileSearchBtn) {
    mobileSearchBtn.classList.remove("hidden");
  }

  if (headerContainer) {
    headerContainer.classList.remove("hidden");
    headerContainer.innerHTML = `
      <div class="mobile-inactive-tabs navigation-tabs" style="width: 100%;">
        <button type="button" class="tab active-tab" data-target="active-sessions">Active Sessions</button>
        <button type="button" class="tab" data-target="recent-messages">Recent Messages</button>
      </div>
    `;
    const tabsBar = headerContainer.querySelector(".mobile-inactive-tabs");

    activeSessionsSection.style.display = "flex";
    recentMessagesSection.style.display = "none";

    tabsBar?.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab");
      if (!btn) return;

      tabsBar.querySelectorAll(".tab").forEach((t) => t.classList.remove("active-tab"));
      btn.classList.add("active-tab");

      const currActiveSessions = document.querySelector(".content-blocks .active-sessions");
      const currRecentMessages = document.querySelector(".content-blocks .recent-messages");

      const target = btn.getAttribute("data-target");
      if (target === "active-sessions") {
        if (currActiveSessions) currActiveSessions.style.display = "flex";
        if (currRecentMessages) currRecentMessages.style.display = "none";
        if (mobileSearchBtn) mobileSearchBtn.classList.remove("hidden");
      } else {
        if (currActiveSessions) currActiveSessions.style.display = "none";
        if (currRecentMessages) currRecentMessages.style.display = "flex";
        if (mobileSearchBtn) mobileSearchBtn.classList.add("hidden");
        if (mobileSearchBox) mobileSearchBox.classList.add("hidden");
      }
    });
  }
};
