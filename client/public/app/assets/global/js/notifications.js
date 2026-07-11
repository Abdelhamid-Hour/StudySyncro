import { Loader } from "../../shared/loader/js/utils.js";
import { toReadableDate, handleApiAction } from "./utils.js";
import { sendData } from "../../../../main_assets/js/utils.js";
import { INITIALE_LOADERS_COUNT } from "./variables.js";

const categoriesState = {
  "All": { cardsHtml: [], lastVisible: null, isLoaded: false },
  "Join Request": { cardsHtml: [], lastVisible: "", isLoaded: false },
  "Groups": { cardsHtml: [], lastVisible: "", isLoaded: false },
  "Sessions": { cardsHtml: [], lastVisible: "", isLoaded: false },
};

let notifLoader = null;
let notifEventSource = null;

const updateBadgeCount = (delta) => {
  const badge = document.querySelector(".notification-badge");
  if (!badge) return;

  let count = parseInt(badge.textContent, 10);
  if (isNaN(count)) count = 0;
  count += delta;

  if (count <= 0) {
    count = 0;
    badge.classList.add("hidden");
  } else {
    badge.classList.remove("hidden");
  }
  badge.textContent = count > 99 ? "99+" : count;
};

const markSingleCardReadAndRemoveActions = (card, actionType = null) => {
  const notifId = card.getAttribute("data-id");
  const demandeId = card.getAttribute("data-demande-id");
  const groupId = card.getAttribute("data-group-id");

  const matchingCards = new Set([card]);

  const matches = (c) => {
    if (!c || !c.getAttribute) return false;
    if (c === card) return true;
    const cId = c.getAttribute("data-id");
    if (notifId && cId && cId === notifId) {
      return true;
    }
    if (!notifId) {
      const cDemandeId = c.getAttribute("data-demande-id");
      const cGroupId = c.getAttribute("data-group-id");
      if (demandeId && cDemandeId && cDemandeId === demandeId && (!groupId || !cGroupId || cGroupId === groupId)) {
        return true;
      }
    }
    return false;
  };

  document.querySelectorAll(".notif-card").forEach((c) => {
    if (matches(c)) matchingCards.add(c);
  });

  Object.values(categoriesState).forEach((state) => {
    if (state && state.cardsHtml) {
      state.cardsHtml.forEach((c) => {
        if (matches(c)) matchingCards.add(c);
      });
    }
  });

  let anyUnread = false;
  const idsToMark = new Set();
  if (notifId) idsToMark.add(notifId);

  matchingCards.forEach((c) => {
    const cId = c.getAttribute("data-id");
    if (cId) idsToMark.add(cId);

    if (c.classList && c.classList.contains("unread")) {
      anyUnread = true;
      c.classList.remove("unread");
    }

    if (actionType && (actionType === "accepted" || actionType === "rejected")) {
      const newType = actionType === "accepted" ? "join_accepted" : "join_rejected";
      c.setAttribute("data-type", newType);
      if (document.contains(c)) {
        c.classList.add(actionType === "accepted" ? "transitioning-accepted" : "transitioning-rejected");
        setTimeout(() => {
          c.classList.remove("transitioning-accepted", "transitioning-rejected");
        }, 800);
      }

      const iconElem = c.querySelector(".notif-icon");
      if (iconElem) {
        iconElem.className = `notif-icon ${newType}`;
        iconElem.innerHTML = actionType === "accepted" ? `<i class="bi bi-link-45deg"></i>` : `<i class="bi bi-x-lg"></i>`;
      }

      let senderName = c.getAttribute("data-sender-name");
      let groupName = c.getAttribute("data-group-name");
      if (!senderName || !groupName) {
        const rawText = c.querySelector(".notif-message")?.textContent || "";
        if (rawText.includes(" has requested to join your group ")) {
          const parts = rawText.split(" has requested to join your group ");
          if (parts[0] && !senderName) senderName = parts[0].trim();
          if (parts[1] && !groupName) groupName = parts[1].replace(/\.$/, "").trim();
        }
      }
      senderName = senderName || "User";
      groupName = groupName || "group";

      const statusWord = actionType === "accepted" ? "accepted" : "rejected";
      const newMsg = `Join request from ${senderName} for group ${groupName} was ${statusWord}.`;
      const formattedMsg = formatNotificationMessage({ message: newMsg, metadata: { senderName, groupName } });

      const msgElem = c.querySelector(".notif-message");
      if (msgElem) {
        msgElem.style.transition = "opacity 0.2s ease";
        msgElem.style.opacity = "0";
        setTimeout(() => {
          msgElem.innerHTML = formattedMsg;
          msgElem.style.opacity = "1";
        }, 150);
      }
    }

    const actions = c.querySelector(".notif-actions");
    if (actions) actions.remove();
  });

  if (anyUnread) {
    updateBadgeCount(-1);
    const ids = Array.from(idsToMark).filter(Boolean);
    if (ids.length > 0) {
      sendData("/api/notifications/mark-read", { notificationIds: ids }, "POST").catch(() => {});
    }
  }
};

const bindCardActions = (card) => {
  const acceptBtn = card.querySelector(".accept-btn");
  const rejectBtn = card.querySelector(".reject-btn");

  if (acceptBtn) {
    acceptBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const demandeId = card.getAttribute("data-demande-id");
      const groupId = card.getAttribute("data-group-id");
      handleApiAction("/accept-demande", { demandeId, groupId }, acceptBtn, {
        successMsg: "Demande accepted",
        onSuccess: () => {
          markSingleCardReadAndRemoveActions(card, "accepted");
        },
      });
    });
  }

  if (rejectBtn) {
    rejectBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const demandeId = card.getAttribute("data-demande-id");
      const groupId = card.getAttribute("data-group-id");
      handleApiAction("/reject-demande", { demandeId, groupId }, rejectBtn, {
        successMsg: "Demande rejected",
        onSuccess: () => {
          markSingleCardReadAndRemoveActions(card, "rejected");
        },
      });
    });
  }

  const joinSessionBtn = card.querySelector(".join-session-btn");
  if (joinSessionBtn) {
    joinSessionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const sessionId = card.getAttribute("data-session-id");
      if (sessionId) {
        handleApiAction("/join-session", { sessionId }, joinSessionBtn, {
          onSuccess: () => {
            markSingleCardReadAndRemoveActions(card, "joined");
            history.pushState({}, "", "/app/home");
            window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
          },
          successMsg: "Joined the session successfully",
        });
      }
    });
  }
};

const formatNotificationMessage = (notif) => {
  let msg = notif.message || "";
  if (msg.startsWith("Admin role") || msg.includes("Admin role")) {
    msg = msg.replace("Admin role", "<strong>Admin</strong> role");
  }

  const termsMap = [
    { term: "successfully joined", cls: "bold-success" },
    { term: "accepted", cls: "bold-success" },
    { term: "started", cls: "bold-success" },
    { term: "ended", cls: "bold-success" },
    { term: "rejected", cls: "bold-danger" },
    { term: "removed", cls: "bold-danger" },
    { term: "deleted", cls: "bold-danger" },
    { term: "demoted from Admin", cls: "bold-danger" },
    { term: "demoted", cls: "bold-danger" },
    { term: "pending approval", cls: "bold-warning" },
    { term: "transferred", cls: "bold-warning" },
    { term: notif.metadata?.senderName, cls: "" },
    { term: notif.metadata?.groupName, cls: "" },
    { term: notif.metadata?.sessionName, cls: "" }
  ].filter(item => item.term && typeof item.term === "string");

  termsMap.sort((a, b) => b.term.length - a.term.length);

  termsMap.forEach(({ term, cls }) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<!>|<strong class="[^"]*">)(${escaped})(?!<\\/strong>)`, 'g');
    const classAttr = cls ? ` class="${cls}"` : "";
    msg = msg.replace(regex, `<strong${classAttr}>$1</strong>`);
  });

  return msg;
};

const createNotificationCard = (notif) => {  
  const card = document.createElement("div");
  const isUnread = notif.read === false || notif.read === "false" ? "unread" : "";
  const type = notif.type || "general";
  const demandeId = notif.metadata?.demandeId || "";
  const groupId = notif.metadata?.groupId || "";
  const category = notif.category || "All";

  card.className = `notif-card card-item ${isUnread}`;
  card.setAttribute("data-id", notif.id || "");
  card.setAttribute("data-type", type);
  card.setAttribute("data-category", category);
  card.setAttribute("data-demande-id", demandeId);
  card.setAttribute("data-group-id", groupId);
  card.setAttribute("data-sender-name", notif.metadata?.senderName || "");
  card.setAttribute("data-group-name", notif.metadata?.groupName || "");
  card.setAttribute("data-session-id", notif.metadata?.sessionId || "");

  let iconHtml = `<i class="bi bi-bell-fill"></i>`;
  if (notif.metadata?.senderPhotoURL && (type === "join_request" || type === "member_removed")) {
    iconHtml = `<img src="${notif.metadata.senderPhotoURL}" alt="avatar" />`;
  } else if (type === "join_request") {
    iconHtml = `<i class="bi bi-person-fill"></i>`;
  } else if (type === "join_accepted") {
    iconHtml = `<i class="bi bi-link-45deg"></i>`;
  } else if (type === "join_pending") {
    iconHtml = `<i class="bi bi-three-dots"></i>`;
  } else if (type === "join_rejected") {
    iconHtml = `<i class="bi bi-x-lg"></i>`;
  } else if (type === "member_removed") {
    iconHtml = `<i class="bi bi-person-dash-fill"></i>`;
  } else if (type === "role_transferred") {
    iconHtml = `<i class="bi bi-arrow-left-right"></i>`;
  } else if (type === "role_demoted") {
    iconHtml = `<i class="bi bi-person-down"></i>`;
  } else if (type === "group_deleted") {
    iconHtml = `<i class="bi bi-people-fill"></i>`;
  } else if (type === "session_started") {
    iconHtml = `<i class="bi bi-clock-fill"></i>`;
  } else if (type === "session_ended") {
    iconHtml = `<i class="bi bi-check-lg"></i>`;
  }

  const timeStr = typeof toReadableDate === "function" ? toReadableDate(notif.timestamp) : new Date(notif.timestamp || Date.now()).toLocaleDateString();
  const categoryLabel = notif.category || "General";

  let actionsHtml = "";
  if (type === "join_request") {
    actionsHtml = `
      <div class="notif-actions">
        <button type="button" class="reject-btn exclude-btn small-btn" data-action="reject"><i class="bi bi-slash-circle"></i> Reject</button>
        <button type="button" class="accept-btn exclude-btn small-btn" data-action="accept"><i class="bi bi-check-circle"></i> Accept</button>
      </div>
    `;
  } else if (type === "session_started" && !notif.metadata?.sessionEnded) {
    actionsHtml = `
      <div class="notif-actions">
        <button type="button" class="join-session-btn accept-btn exclude-btn small-btn"><i class="bi bi-box-arrow-in-right"></i> Join</button>
      </div>
    `;
  }

  card.innerHTML = `
    <div class="notif-icon ${type}">
      ${iconHtml}
    </div>
    <div class="notif-content">
      <div class="notif-message">${formatNotificationMessage(notif)}</div>
      <div class="notif-footer">
        <span class="notif-meta">${timeStr} • ${categoryLabel}</span>
        ${actionsHtml}
      </div>
    </div>
  `;

  bindCardActions(card);
  return card;
};

const handleMarkAllAsRead = async (silent = false) => {
  const activeBtn = document.querySelector(".notif-category-btn.active");
  const category = activeBtn ? activeBtn.getAttribute("data-category") : "All";

  if (!category || category === "All") {
    document.querySelectorAll("#notifications-list .notif-card.unread").forEach(card => card.classList.remove("unread"));
    Object.values(categoriesState).forEach(state => {
      if (state.cardsHtml) state.cardsHtml.forEach(card => card.classList.remove("unread"));
    });
    updateBadgeCount(-99999);
  } else {
    let removedCount = 0;
    document.querySelectorAll("#notifications-list .notif-card.unread").forEach(card => {
      if (card.getAttribute("data-category") === category) {
        card.classList.remove("unread");
        removedCount++;
      }
    });
    if (categoriesState[category] && categoriesState[category].cardsHtml) {
      categoriesState[category].cardsHtml.forEach(card => {
        if (card.classList && card.classList.contains("unread")) removedCount++;
        if (card.classList) card.classList.remove("unread");
      });
    }
    if (categoriesState["All"] && categoriesState["All"].cardsHtml) {
      categoriesState["All"].cardsHtml.forEach(card => {
        if (card.getAttribute && card.getAttribute("data-category") === category) {
          if (card.classList) card.classList.remove("unread");
        }
      });
    }
    if (removedCount > 0) {
      updateBadgeCount(-removedCount);
    }
  }

  try {
    sendData("/api/notifications/mark-read", { category }, "POST").catch(err => {
      if (!silent) console.error("Error marking notifications read:", err);
    });
  } catch (err) {
    if (!silent) console.error("Error marking notifications read:", err);
  }
};

const initRealtimeNotifications = () => {
  if (notifEventSource) {
    notifEventSource.close();
  }
  
  if (window.Notification && Notification.permission === "default") {
    const bellBtn = document.querySelector(".open-drop-down-btn[data-tooltip='Notifications']");
    if (bellBtn) {
      bellBtn.addEventListener("click", () => {
        if (Notification.permission === "default") {
          Notification.requestPermission().catch(() => {});
        }
      }, { once: true });
    }
  }

  notifEventSource = new EventSource("/api/notifications/stream");
  notifEventSource.onmessage = (event) => {
    try {
      const notif = JSON.parse(event.data);
      if (!notif || !notif.id) return;

      if ((notif.type === "session_ended" || notif.metadata?.sessionEnded) && notif.metadata?.sessionId) {
        document
          .querySelectorAll(`.notif-card[data-session-id="${notif.metadata.sessionId}"] .notif-actions`)
          .forEach((el) => el.remove());
        Object.values(categoriesState).forEach((state) => {
          if (state.cardsHtml) {
            state.cardsHtml.forEach((cardEl) => {
              if (cardEl.getAttribute && cardEl.getAttribute("data-session-id") === notif.metadata.sessionId) {
                const act = cardEl.querySelector(".notif-actions");
                if (act) act.remove();
              }
            });
          }
        });
      }

      if (window.Notification && Notification.permission === "granted") {
        new Notification(notif.title || "StudyHype Notification", {
          body: notif.message || "",
          icon: "/app/assets/global/images/logo.png"
        });
      }

      if (!notif.read || notif.read === "false") {
        updateBadgeCount(1);
      }

      const newCard = createNotificationCard(notif);
      const category = notif.category || "All";

      const activeBtn = document.querySelector(".notif-category-btn.active");
      const activeCategory = activeBtn ? activeBtn.getAttribute("data-category") : "All";

      const emptyMsg = document.querySelector("#notifications-list .icon-wrapper, #notifications-list .notifications-empty");
      if (emptyMsg) emptyMsg.remove();

      if (activeCategory === "All") {
        const container = document.getElementById("notifications-list");
        if (container) container.insertBefore(newCard, container.firstChild);
        if (category !== "All" && categoriesState[category] && categoriesState[category].cardsHtml) {
          const clone = newCard.cloneNode(true);
          categoriesState[category].cardsHtml.unshift(clone);
          bindCardActions(clone);
        }
      } else if (activeCategory === category) {
        const container = document.getElementById("notifications-list");
        if (container) container.insertBefore(newCard, container.firstChild);
        if (categoriesState["All"].cardsHtml) {
          const clone = newCard.cloneNode(true);
          categoriesState["All"].cardsHtml.unshift(clone);
          bindCardActions(clone);
        }
      } else {
        if (categoriesState["All"].cardsHtml) {
          const clone = newCard.cloneNode(true);
          categoriesState["All"].cardsHtml.unshift(clone);
          bindCardActions(clone);
        }
        if (category !== "All" && categoriesState[category] && categoriesState[category].cardsHtml) {
          const clone = newCard.cloneNode(true);
          categoriesState[category].cardsHtml.unshift(clone);
          bindCardActions(clone);
        }
      }
    } catch (err) {
      console.warn("Error processing stream notification:", err);
    }
  };

  notifEventSource.onerror = () => {
  };
};

export const initNotificationsManager = () => {
  const container = document.getElementById("notifications-list");
  if (!container) return;

  const initialCards = Array.from(container.querySelectorAll(".notif-card"));
  const initialLastVisible = container.getAttribute("data-last-visible") || "";

  const isAllDbLoaded = initialCards.length < INITIALE_LOADERS_COUNT && !initialLastVisible;

  if (initialCards.length > 0 || initialLastVisible) {
    Object.keys(categoriesState).forEach(cat => {
      if (cat === "All") {
        categoriesState["All"].cardsHtml = initialCards;
        categoriesState["All"].lastVisible = initialLastVisible;
        categoriesState["All"].isLoaded = true;
        initialCards.forEach(card => bindCardActions(card));
      } else {
        const matching = initialCards.filter(c => c.getAttribute("data-category") === cat);
        if (isAllDbLoaded) {
          categoriesState[cat].cardsHtml = matching.map(c => {
            const clone = c.cloneNode(true);
            bindCardActions(clone);
            return clone;
          });
          categoriesState[cat].lastVisible = "";
          categoriesState[cat].isLoaded = true;
        } else if (matching.length > 0) {
          categoriesState[cat].cardsHtml = matching.map(c => {
            const clone = c.cloneNode(true);
            bindCardActions(clone);
            return clone;
          });
          const lastCard = matching[matching.length - 1];
          categoriesState[cat].lastVisible = lastCard.getAttribute("data-id") || "";
          categoriesState[cat].isLoaded = true;
        } else {
          categoriesState[cat].cardsHtml = [];
          categoriesState[cat].lastVisible = "";
          categoriesState[cat].isLoaded = false;
        }
      }
    });
  } else {
    Object.keys(categoriesState).forEach(cat => {
      categoriesState[cat].isLoaded = true;
      categoriesState[cat].cardsHtml = [];
      categoriesState[cat].lastVisible = "";
    });
  }

  const createLoadingCard = () => {
    const div = document.createElement("div");
    div.className = "notif-card card-item loading-animation loading-card";
    div.style.minHeight = "4.5rem";
    div.style.pointerEvents = "none";
    div.style.display = "flex";
    div.style.alignItems = "flex-start";
    div.style.gap = "12px";
    div.style.padding = "14px 16px";
    div.innerHTML = `
      <div class="loading-opacity-animation" style="width: 2.6rem; height: 2.6rem; border-radius: 50%; flex-shrink: 0;"></div>
      <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
        <div class="loading-opacity-animation" style="height: 1rem; width: 85%; border-radius: 0.3rem;"></div>
        <div class="loading-opacity-animation" style="height: 1rem; width: 50%; border-radius: 0.3rem;"></div>
        <div class="loading-opacity-animation" style="height: 0.8rem; width: 35%; border-radius: 0.3rem; margin-top: 4px;"></div>
      </div>
    `;
    return div;
  };

  const getCriteria = () => {
    const activeBtn = document.querySelector(".notif-category-btn.active");
    const category = activeBtn ? activeBtn.getAttribute("data-category") : "All";
    if (!category || category === "All") return "";
    return `category=${category}`;
  };

  notifLoader = new Loader(
    container,
    createNotificationCard,
    `/notifications?`,
    createLoadingCard(),
    {
      getCriteria,
      loadersCount: 4,
      emptyState: {
        noFilter: {
          icon: "bi-bell-slash",
          title: "No notifications yet",
          desc: "You don't have any notifications right now.",
        },
        filtered: {
          icon: "bi-bell-slash",
          title: "No notifications found",
          desc: "There are no notifications in this category.",
        },
      },
    }
  );

  if (categoriesState["All"].isLoaded) {
    notifLoader.lastVisible = categoriesState["All"].lastVisible;
    if (isAllDbLoaded && notifLoader.io) {
      notifLoader.io.disconnect();
    }
  } else {
    notifLoader.reset();
  }

  const categoryBtns = document.querySelectorAll(".notif-category-btn");
  categoryBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (btn.classList.contains("active")) return;

      const oldBtn = document.querySelector(".notif-category-btn.active");
      const oldCategory = oldBtn ? oldBtn.getAttribute("data-category") : "All";
      const newCategory = btn.getAttribute("data-category") || "All";

      if (oldCategory && categoriesState[oldCategory]) {
        const currentCards = Array.from(container.querySelectorAll(".notif-card:not(.loading-card)"));
        currentCards.forEach((c) => c.classList.remove("transitioning-accepted", "transitioning-rejected"));
        categoriesState[oldCategory].cardsHtml = currentCards;
        categoriesState[oldCategory].lastVisible = notifLoader.lastVisible || "";
        categoriesState[oldCategory].isLoaded = true;
      }

      if (oldBtn) oldBtn.classList.remove("active");
      btn.classList.add("active");

      container.innerHTML = "";

      if (categoriesState[newCategory] && categoriesState[newCategory].isLoaded) {
        categoriesState[newCategory].cardsHtml.forEach((card) => {
          card.classList.remove("transitioning-accepted", "transitioning-rejected");
          container.appendChild(card);
        });
        notifLoader.lastVisible = categoriesState[newCategory].lastVisible;
        if (!categoriesState[newCategory].cardsHtml.length) {
          notifLoader.checkEmptyState();
        } else if (notifLoader.lastVisible && notifLoader.sentinel) {
          notifLoader.io.observe(notifLoader.sentinel);
        } else if (!notifLoader.lastVisible && notifLoader.io) {
          notifLoader.io.disconnect();
        }
      } else {
        notifLoader.reset();
        if (categoriesState[newCategory]) {
          categoriesState[newCategory].isLoaded = true;
        }
      }
    });
  });

  const bellBtn = document.querySelector(".open-drop-down-btn[data-tooltip='Notifications']");
  if (bellBtn) {
    bellBtn.addEventListener("click", () => {
      const badge = document.querySelector(".notification-badge");
      if (badge && !badge.classList.contains("hidden")) {
        handleMarkAllAsRead();
      }
    });
  }

  initRealtimeNotifications();
};
