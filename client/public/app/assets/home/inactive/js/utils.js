import {
  enableMobileTabs,
  openOverlayModal,
  t,
  fetchData,
  sendData,
} from "../../../global/js/utils.js";
import { Loader } from "../../../shared/loader/js/utils.js";
import { joinSession } from "../../../shared/session/js/utils.js";
import { handletTasksListners } from "../../../shared/tasks/js/utils.js";
import { sessionsContainer, messagesContainer } from "./dom-variables.js";
import {
  setupEmojiPickerListeners,
  setupChatFileInputListeners,
  sendChatMessagePayload,
  getEmojiPickerHTML,
} from "../../../shared/chat/js/utils.js";
import { initFiltersInputListener } from "../../../shared/loader/js/utils.js";

export const sessionViewSkeleton =
  () => `<div class="loading-animation overlay-model session-view-overlay">
  <header>
    <h3>${t("home:session_details")}</h3>
    <button
      type="button"
      class="exclude-btn close-session-view-overlay should-fill"
    >
      <i class="bi bi-x-circle"></i>
    </button>
  </header>
  <div class="session-overlay-content">
    <div class="overlay-top">
      <div class="group-name-wrapper">
        <span
          class="loading-opacity-animation badge blue-badge"
          style="width: 7rem"
        >
        </span>
      </div>
      <div>
        <h3 class="session-name">
          <div class="loading-opacity-animation" style="width: 9rem"></div>
          <span
            class="loading-opacity-animation badge simple-badge users-count"
            style="width: 6rem"
          ></span>
        </h3>
      </div>
      <p class="loading-opacity-animation session-description"></p>
      <p
        class="loading-opacity-animation session-description"
        style="width: 60%"
      ></p>
      <div class="session-info">
        <span
          class="loading-opacity-animation badge green-badge start-badge"
          style="width: 5rem"
        ></span>
        <span
          class="loading-opacity-animation badge orange-badge end-badge"
          style="width: 5rem"
        ></span>
        <span
          class="loading-opacity-animation badge blue-badge duration-badge"
          style="width: 5rem"
        ></span>
      </div>
    </div>

    <div class="session-tasks">
      <header>
        <h3 class="title"><i class="bi bi-ui-checks"></i>${t("common:shared_terms.tasks")}</h3>
        <div class="btns">
          <button
            type="button"
            data-tooltip="${t("common:actions.scroll_to_top")}"
            class="exclude-btn scroll-to-top has-tooltip"
          >
            <i class="bi bi-arrow-up-short"></i>
          </button>
          <button
            type="button"
            data-tooltip="${t("common:actions.collapse_all")}"
            class="exclude-btn collapse-all has-tooltip"
          >
            <i class="bi bi-arrows-expand"></i>
          </button>
        </div>
      </header>
      <!-- ongoing tasks list is just for get the same style as in the active page -->
      <div class="tasks-list">
        <div class="task-wrapper">
          <div class="loading-opacity-animation task-box"></div>
        </div>

        <div class="task-wrapper">
          <div class="loading-opacity-animation task-box"></div>
        </div>
        <div class="task-wrapper">
          <div class="loading-opacity-animation task-box"></div>
        </div>
        <div class="task-wrapper">
          <div class="loading-opacity-animation task-box"></div>
        </div>
        <div class="task-wrapper">
          <div class="loading-opacity-animation task-box"></div>
        </div>
        <div class="task-wrapper">
          <div class="loading-opacity-animation task-box"></div>
        </div>
      </div>
    </div>
  </div>
  <button
    type="button"
    class="loading-opacity-animation"
    style="width: 40%; height: 2rem; margin-inline-start: auto"
  ></button>
</div>
`;

export const handleSessionBtns = async (e) => {
  const actionBtns = e.target.closest(".action-buttons");
  if (!actionBtns) return;
  const sessionId = actionBtns.getAttribute("data-session-id");
  const viewDetailsBtn = e.target.closest(".view-details");
  if (viewDetailsBtn) {
    openOverlayModal(
      "session-view-overlay",
      [".close-session-view-overlay"],
      async () => {
        const { overlay } = await fetchData("/session-details/" + sessionId);
        return overlay;
      },
      (overlayContainer) => {
        handletTasksListners("session-tasks");
        const joinOverlayBtn = overlayContainer.querySelector(".join-session");
        if (joinOverlayBtn) {
          joinOverlayBtn.addEventListener("click", () =>
            joinSession(sessionId, joinOverlayBtn),
          );
        }
      },
      sessionViewSkeleton(),
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
            <span class="joined-count-value"></span> ${t("home:session_card.joined_users")}
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
          ${t("common:shared_terms.duration")}
          <span class="duration"></span>
        </span>
        <span class="badge simple-badge">
          <i class="bi bi-list-task"></i>
          <span class="tasks-count"></span> ${t("common:shared_terms.tasks")}
        </span>
      </div>
    </header>
    <p class="session-description"></p>
    <footer class="footer">
      <div class="footer-meta-info">
        <span class="badge green-badge">
          <i class="bi bi-play-circle"></i>
          ${t("home:session_card.start_at")}
          <span class="duration"></span>
        </span>
        <span class="badge orange-badge">
          <i class="bi bi-stopwatch"></i>
          ${t("home:session_card.end_at")}
          <span class="duration"></span>
        </span>
      </div>
      <div class="action-buttons" data-session-id="">
        <button type="button" class="join-session blue-btn">
          <i class="bi bi-box-arrow-in-right"></i>
          ${t("common:shared_terms.join_session")}
        </button>
        <button type="button" class="should-fill view-details">
          <i class="bi bi-info-circle"></i>
          ${t("home:session_card.view_details")}
        </button>
      </div>
    </footer>
  `;

  card.querySelector(".session-title").innerHTML =
    `<bdi>${session.name || ""}</bdi>`;
  card.querySelector(".joined-count-value").innerHTML =
    `<bdi>${session.joinedCount ?? 0}</bdi>`;
  card.querySelector(".group-name").innerHTML =
    `<bdi>${session.groupName || t("common:not_available")}</bdi>`;
  card.querySelector(".meta-info .blue-badge .duration").innerHTML =
    `<bdi>${session.duration || t("common:not_available")}</bdi>`;
  card.querySelector(".meta-info .tasks-count").innerHTML =
    `<bdi>${session.tasksCount ?? 0}</bdi>`;
  card.querySelector(".session-description").innerHTML =
    `<bdi>${session.description || ""}</bdi>`;
  card.querySelector(".footer-meta-info .green-badge .duration").innerHTML =
    `<bdi>${session.startTime || t("common:not_available")}</bdi>`;
  card.querySelector(".footer-meta-info .orange-badge .duration").innerHTML =
    `<bdi>${session.endTime || t("common:not_available")}</bdi>`;
  card
    .querySelector(".action-buttons")
    .setAttribute("data-session-id", session.id || "");

  return card;
};

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
          title: t("home:skeletons.no_active_sessions_title"),
          desc: t("home:skeletons.no_active_sessions_desc"),
        },
        filtered: {
          icon: "bi-clock-history",
          title: t("common:shared_terms.no_active_sessions_found"),
          desc: t(
            "common:shared_terms.we_couldn_t_find_any_active_sessions_matching_your_search_query",
          ),
        },
      },
    },
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
  sessionsEventSource = new EventSource(
    `/api/stream-sessions?lastQueryTime=${lastQueryTime}`,
  );

  sessionsEventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.newSession) {
        if (data.newSession.isAdmin) location.reload();
        // Apply current search filter
        const searchInput = document.querySelector(
          "#active-sessions-search-input",
        );
        const searchTerm = searchInput
          ? searchInput.value.trim().toLowerCase()
          : "";

        if (
          searchTerm &&
          (!data.newSession.name ||
            !data.newSession.name.toLowerCase().includes(searchTerm))
        ) {
          return; // Skip prepending if it doesn't match the current search
        }

        const existingCard = sessionsContainer.querySelector(
          `.action-buttons[data-session-id="${data.newSession.id}"]`,
        );
        if (!existingCard) {
          const card = createSessionCard(data.newSession);
          const emptyState = sessionsContainer.querySelector(".icon-wrapper");
          if (emptyState) emptyState.remove();
          sessionsContainer.prepend(card);
        }
      }

      if (data.modifiedSession) {
        const cardActionButtons = sessionsContainer.querySelector(
          `.action-buttons[data-session-id="${data.modifiedSession.id}"]`,
        );
        if (cardActionButtons) {
          const card = cardActionButtons.closest(".active-session");
          if (card) {
            card.querySelector(".joined-count-value").textContent =
              data.modifiedSession.joinedCount ?? 0;
          }
        }
      }

      if (data.removedSession) {
        const cardActionButtons = sessionsContainer.querySelector(
          `.action-buttons[data-session-id="${data.removedSession}"]`,
        );
        if (cardActionButtons) {
          const card = cardActionButtons.closest(".active-session");
          if (card) card.remove();
        }
        if (
          sessionsContainer &&
          sessionsContainer.querySelectorAll(".active-session").length === 0
        ) {
          const existingEmptyState =
            sessionsContainer.querySelector(".icon-wrapper");
          if (!existingEmptyState) {
            sessionsContainer.innerHTML = `
              <div class="icon-wrapper">
                <div class="empty-icon-container">
                  <i class="bi bi-clock-history"></i>
                </div>
                <h3>${t("home:skeletons.no_active_sessions_title")}</h3>
                <p>${t("home:skeletons.no_active_sessions_desc")}</p>
              </div>
            `;
          }
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
  if (seconds < 60) return t("home:recent.time.just_now");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return t("home:recent.time.ago_minutes", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("home:recent.time.ago_hours", { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("home:recent.time.ago_days", { count: days });
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

    const prevBtn = document.querySelector(
      ".recent-message .reply.active-reply",
    );

    if (prevBtn) {
      prevBtn.classList.remove("active-reply");
      prevBtn.removeAttribute("data-reply-open");
      prevBtn.innerHTML =
        '<i class="bi bi-reply"></i> ' + t("home:recent.reply");
    }

    if (replyBtn == prevBtn) {
      const sharedReplyBox = document.querySelector(
        ".shared-recent-messages-reply",
      );
      if (sharedReplyBox) {
        const textarea = sharedReplyBox.querySelector(".shared-reply-input");
        if (textarea) textarea.value = "";
        sharedReplyBox.style.display = "none";
      }
      return;
    }

    replyBtn.classList.add("active-reply");
    replyBtn.setAttribute("data-reply-open", "true");
    replyBtn.innerHTML =
      '<i class="bi bi-x-circle"></i> ' + t("common:modals.close");

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
    ".shared-recent-messages-reply",
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
    <div class="input-message-container">
      <span class="newline-hint">${t("common:shared_chat.newline_hint")}</span>
      <div class="icons">
        <label for="shared-image-upload" class="should-fill">
          <i class="bi bi-image"></i>
        </label>
        <label for="shared-file-upload">
          <i class="bi bi-paperclip"></i>
        </label>
        ${getEmojiPickerHTML()}
      </div>
      <textarea placeholder="${t("home:recent.type_message_placeholder")}" class="input-message shared-reply-input"></textarea>
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
    ".input-message-container",
  );
  const sendBtn = sharedReplyBox.querySelector(".shared-send-btn");
  const textarea = sharedReplyBox.querySelector(".shared-reply-input");
  const emojiList = sharedReplyBox.querySelector(".emoji-list");
  const emojiesSearch = sharedReplyBox.querySelector(".emojis-search-input");
  const emojiesSearchResultContainer =
    sharedReplyBox.querySelector("#search-result");
  const imageInput = sharedReplyBox.querySelector("#shared-image-upload");
  const fileInput = sharedReplyBox.querySelector("#shared-file-upload");

  setupEmojiPickerListeners({
    emojiList,
    inputEl: textarea,
    emojiesSearch,
    searchResultContainer: emojiesSearchResultContainer,
  });

  setupChatFileInputListeners({
    imageInput,
    fileInput,
    container: inputMessageContainer,
    dataTransfer: sharedFilesInstance,
  });

  const closeSharedReplyBox = () => {
    textarea.value = "";
    const filesViewEl = inputMessageContainer.querySelector(".files-view");
    if (filesViewEl) filesViewEl.remove();
    sharedFilesInstance.items.clear();
    sharedReplyBox.style.display = "none";
    document.querySelectorAll(".recent-message .reply").forEach((btn) => {
      btn.classList.remove("active-reply");
      btn.removeAttribute("data-reply-open");
      btn.innerHTML = '<i class="bi bi-reply"></i> ' + t("home:recent.reply");
    });
  };

  const sendSharedReply = async () => {
    const groupId = sharedReplyBox.dataset.activeGroupId;
    if (!groupId) return;

    const text = textarea.value.trim();
    const filesToSend = Array.from(sharedFilesInstance.items).map((f) =>
      f.getAsFile ? f.getAsFile() : f,
    );
    if (!text && filesToSend.length === 0) return;

    closeSharedReplyBox();

    const card = document.querySelector(
      `.recent-message[data-group-id="${groupId}"]`,
    );
    const textMsgEl = card?.querySelector(".text-message");
    const originalContent = textMsgEl ? textMsgEl.innerHTML : "";

    const displaySummary =
      text ||
      (filesToSend.length
        ? t("home:recent.attachment", { count: filesToSend.length })
        : "");
    if (textMsgEl) {
      textMsgEl.innerHTML = `<span class="icon-box"><i class="bi bi-clock"></i></span> ${displaySummary}`;
    }

    try {
      if (text) {
        await sendChatMessagePayload({ groupId, message: text });
      }

      for (const file of filesToSend) {
        await sendChatMessagePayload({ groupId, file });
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
      <div class="profile-info" >
        <span class="icon loading-opacity-animation" style="width: 2.5rem; height: 2.5rem; border-radius: 50%;"></span>
        <div class="details" style="min-height: 100%; height: 100%; gap: calc(var(--primary-gap) / 2); ">
          <span class="user loading-opacity-animation" style="width: 120px; height: 1.1em; border-radius: 0.5em;"></span>
          <span class="group loading-opacity-animation" style="width: 80px; height: 0.9em; border-radius: 0.5em;"></span>
        </div>
      </div>
      <div class="meta-info">
        <span class="timestamp loading-opacity-animation" style="width: 60px; height: 0.9em; border-radius: 0.5em;"></span>
      </div>
    </header>
    <p class="text-message loading-opacity-animation" style="width: 100%;height: 1.2em;border-radius: 0.5em;"></p>
    <p class="text-message loading-opacity-animation" style="width: 50%;height: 1.2em;border-radius: 0.5em;"></p>
    <div class="action-buttons">
      <button type="button" class="should-fill reply-group loading-opacity-animation" style="height: 2rem; width: 130px;border-color: transparent;"></button>
      <button type="button" class="should-fill reply loading-opacity-animation" style="height: 2rem; width: 80px; border-color: transparent;"></button>
    </div>`;
  return loader;
};

const createRecentMessageCard = (data) => {
  const card = document.createElement("div");
  const hasUnread = data.hasUnreadMessages && data.unreadCount > 0;
  card.className = `recent-message card-item ${hasUnread ? "has-unread" : ""}`;
  card.setAttribute("data-group-id", data.groupId || "");
  card.setAttribute("data-last-update", data.lastUpdate || 0);
  card.setAttribute("data-unread-count", data.unreadCount || 0);

  const unreadBadgeHtml = hasUnread
    ? `<span class="unread-count blue-badge badge">${t("home:recent.new_messages", { count: data.unreadCount })}</span>`
    : "";

  const markReadBtnHtml = hasUnread
    ? `<button type="button" class="mark-read">
        <i class="bi bi-check2-all"></i>
        ${t("home:recent.mark_as_read")}
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
          <span class="user"><bdi>${data.lastMessage?.senderName || data.lastMessageSender || t("home:recent.someone")}</bdi></span>
          <span class="group"><bdi>${data.groupName || t("home:recent.study_group")}</bdi></span>
        </div>
      </div>
      <div class="meta-info">
        <span class="timestamp">${formatTimeAgo(data.lastUpdate)}</span>
        ${unreadBadgeHtml}
      </div>
    </header>
    <p class="text-message">
      <bdi>${data.lastMessage?.text || data.lastMessageText || t("home:skeletons.no_messages_yet_title")}</bdi>
    </p>
    <div class="action-buttons" data-group-id="${data.groupId}">
      <button type="button" class="should-fill reply-group">
        <i class="bi bi-reply"></i>
        ${t("home:recent.reply_in_group")}
      </button>
      <button type="button" class="should-fill reply">
        <i class="bi bi-reply"></i>
        ${t("home:recent.reply")}
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
  const allCards = Array.from(
    messagesContainer.querySelectorAll(".recent-message"),
  ).filter((c) => c !== card);
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
          title: t("home:skeletons.no_messages_yet_title"),
          desc: t("home:skeletons.no_messages_yet_desc"),
        },
      },
    },
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

      const existingCard = messagesContainer.querySelector(
        `.recent-message[data-group-id="${data.groupId}"]`,
      );
      if (existingCard) {
        if (!data.removed) {
          const oldTime = Number(
            existingCard.getAttribute("data-last-update") || 0,
          );
          const oldUnread = Number(
            existingCard.getAttribute("data-unread-count") || 0,
          );
          const newTime = Number(data.lastUpdate || 0);
          const newUnread = Number(data.unreadCount || 0);
          if (oldTime === newTime && oldUnread === newUnread) {
            return;
          }
        }
        existingCard.remove();
      }

      if (data.removed) {
        if (
          messagesContainer &&
          messagesContainer.querySelectorAll(".recent-message").length === 0
        ) {
          const existingEmptyState =
            messagesContainer.querySelector(".icon-wrapper");
          if (!existingEmptyState) {
            messagesContainer.innerHTML = `
              <div class="icon-wrapper">
                <div class="empty-icon-container">
                  <i class="bi bi-chat-text-fill"></i>
                </div>
                <h3>${t("home:skeletons.no_messages_yet_title")}</h3>
                <p>${t("home:skeletons.no_messages_yet_desc")}</p>
              </div>
            `;
          }
        }
        return;
      }

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

export const initMobileTabs = () => {
  const activeSessionsSection = document.querySelector(
    ".content-blocks .active-sessions",
  );
  const recentMessagesSection = document.querySelector(
    ".content-blocks .recent-messages",
  );
  const mobileSearchBtn = document.querySelector(".mobile-search-btn");
  const mobileSearchBox = document.getElementById("mobile-search-box");
  const headerContainer = document.getElementById("mobile-tabs-container");

  const isMobile = window.matchMedia("(max-width: 48rem)").matches;

  if (!isMobile) {
    activeSessionsSection.style.display = "";
    recentMessagesSection.style.display = "";
    return;
  }

  enableMobileTabs();

  const tabsBar = headerContainer?.querySelector(".mobile-inactive-tabs");
  if (!tabsBar) return;

  tabsBar.querySelectorAll(".tab").forEach((t, i) => {
    if (i == 0) t.classList.add("active-tab");
    else t.classList.remove("active-tab");
  });

  if (mobileSearchBtn) {
    mobileSearchBtn.classList.remove("hidden");
  }

  if (tabsBar.dataset.handlersAttached) return;
  tabsBar.dataset.handlersAttached = "true";

  tabsBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;

    tabsBar
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active-tab"));
    btn.classList.add("active-tab");

    const currActiveSessions = document.querySelector(
      ".content-blocks .active-sessions",
    );
    const currRecentMessages = document.querySelector(
      ".content-blocks .recent-messages",
    );

    const target = btn.getAttribute("data-target");
    if (target === "active-sessions") {
      if (currActiveSessions) currActiveSessions.style.display = "flex";
      if (currRecentMessages) currRecentMessages.style.display = "none";
      if (mobileSearchBtn) mobileSearchBtn.classList.remove("hidden");
    } else {
      if (currActiveSessions) currActiveSessions.style.display = "none";
      if (currRecentMessages)
        currRecentMessages.style.setProperty("display", "flex", "important");
      if (mobileSearchBtn) mobileSearchBtn.classList.add("hidden");
      if (mobileSearchBox) mobileSearchBox.classList.add("hidden");
    }
  });
};
