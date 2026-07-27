import { Loader } from "../../shared/loader/js/utils.js";
import { handleApiAction, t } from "./utils.js";
import { sendData } from "../../../../main_assets/js/utils.js";
import { INITIALE_LOADERS_COUNT } from "./variables.js";

const categoriesState = {
  All: { cardsHtml: [], lastVisible: null, isLoaded: false },
  "Join Request": { cardsHtml: [], lastVisible: "", isLoaded: false },
  Groups: { cardsHtml: [], lastVisible: "", isLoaded: false },
  Sessions: { cardsHtml: [], lastVisible: "", isLoaded: false },
};

let notifLoader = null;
let notifEventSource = null;

const updateBadgeCount = (delta) => {
  const badges = document.querySelectorAll(".notification-badge");
  if (!badges.length) return;

  badges.forEach((badge) => {
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
  });
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
      if (
        demandeId &&
        cDemandeId &&
        cDemandeId === demandeId &&
        (!groupId || !cGroupId || cGroupId === groupId)
      ) {
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

    if (
      actionType &&
      (actionType === "accepted" || actionType === "rejected")
    ) {
      const isInvite =
        c.getAttribute("data-is-invite") === "true" ||
        c.getAttribute("data-type") === "join_invite";

      let newType =
        actionType === "accepted"
          ? "join_request_accepted"
          : "join_request_rejected";
      if (isInvite) {
        newType =
          actionType === "accepted"
            ? "join_invite_accepted"
            : "join_invite_rejected";
      }

      c.setAttribute("data-type", newType);
      if (document.contains(c)) {
        c.classList.add(
          actionType === "accepted"
            ? "transitioning-accepted"
            : "transitioning-rejected",
        );
        setTimeout(() => {
          c.classList.remove(
            "transitioning-accepted",
            "transitioning-rejected",
          );
        }, 800);
      }

      const iconElem = c.querySelector(".notif-icon");
      if (iconElem) {
        iconElem.className = `notif-icon ${newType}`;
        iconElem.innerHTML =
          actionType === "accepted"
            ? `<i class="bi bi-link-45deg"></i>`
            : `<i class="bi bi-x-lg"></i>`;
      }

      let senderName = c.getAttribute("data-sender-name");
      let groupName = c.getAttribute("data-group-name");
      if (!senderName || !groupName) {
        const rawText = c.querySelector(".notif-message")?.textContent || "";
        if (rawText.includes(" has requested to join your group ")) {
          const parts = rawText.split(" has requested to join your group ");
          if (parts[0] && !senderName) senderName = parts[0].trim();
          if (parts[1] && !groupName)
            groupName = parts[1].replace(/\.$/, "").trim();
        }
      }
      senderName = senderName || "User";
      groupName = groupName || "group";

      const newMsg = t(`notifications:messages.${newType}.message`, {
        senderName,
        groupName,
      });
      const formattedMsg = formatNotificationMessage({
        message: newMsg,
        metadata: { senderName, groupName },
      });

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
};

const bindCardActions = (card) => {
  const acceptBtn = card.querySelector(".accept-btn:not(.join-session)");
  const rejectBtn = card.querySelector(".reject-btn");

  if (acceptBtn) {
    acceptBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const demandeId = card.getAttribute("data-demande-id");
      const groupId = card.getAttribute("data-group-id");
      handleApiAction("/accept-demande", { demandeId, groupId }, acceptBtn, {
        successMsg: t("notifications:alerts.demande_accepted"),
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
        successMsg: t("notifications:alerts.demande_rejected"),
        onSuccess: () => {
          markSingleCardReadAndRemoveActions(card, "rejected");
        },
      });
    });
  }

  const joinInviteBtn = card.querySelector(".join-invite-btn");
  if (joinInviteBtn) {
    joinInviteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const groupId = card.getAttribute("data-group-id");
      handleApiAction(
        "/join-group",
        { groupId, isInvite: true },
        joinInviteBtn,
        {
          successMsg: t("notifications:alerts.joined_group_success"),
          onSuccess: () => {
            markSingleCardReadAndRemoveActions(card, "accepted");
          },
        },
      );
    });
  }

  const rejectInviteBtn = card.querySelector(".reject-invite-btn");
  if (rejectInviteBtn) {
    rejectInviteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const groupId = card.getAttribute("data-group-id");
      handleApiAction("/reject-invite", { groupId }, rejectInviteBtn, {
        successMsg: t("notifications:alerts.invitation_rejected"),
        onSuccess: () => {
          markSingleCardReadAndRemoveActions(card, "rejected");
        },
      });
    });
  }

  const joinSessionBtn = card.querySelector(".join-session");
  if (joinSessionBtn) {
    joinSessionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const sessionId = card.getAttribute("data-session-id");
      if (sessionId) {
        handleApiAction("/join-session", { sessionId }, joinSessionBtn, {
          onSuccess: () => {
            markSingleCardReadAndRemoveActions(card, "joined");
            const notifsList = document.getElementById("notifications-list");
            if (notifsList) {
              notifsList.setAttribute("data-current-session", sessionId);
            }
            document
              .querySelectorAll(
                `.notif-card[data-session-id="${sessionId}"] .join-session`,
              )
              .forEach((btn) => {
                const c = btn.closest(".notif-card");
                if (c) markSingleCardReadAndRemoveActions(c, "joined");
              });
            history.pushState({}, "", "/app/home");
            window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
          },
          successMsg: t("notifications:alerts.joined_session_success"),
        });
      }
    });
  }
};

const escapeHtmlStr = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const formatNotificationMessage = (notif) => {
  let msg = escapeHtmlStr(notif.message || "");
  const adminRoleTerm = t("notifications:styling_terms.admin_role", {
    defaultValue: "Admin role",
  });
  if (msg.includes(adminRoleTerm)) {
    msg = msg.replace(adminRoleTerm, `<strong>${adminRoleTerm}</strong>`);
  }
  if (msg.startsWith("Admin role") || msg.includes("Admin role")) {
    msg = msg.replace("Admin role", "<strong>Admin</strong> role");
  }

  const termsMap = [
    {
      term: t("notifications:styling_terms.invited_you_to_join"),
      cls: "bold-success",
    },
    { term: "invited you to join", cls: "bold-success" },
    {
      term: t("notifications:styling_terms.invited_you_to_join_suffix"),
      cls: "bold-success",
    },
    {
      term: t("notifications:styling_terms.successfully_joined"),
      cls: "bold-success",
    },
    { term: "successfully joined", cls: "bold-success" },
    { term: t("notifications:styling_terms.accepted"), cls: "bold-success" },
    { term: "accepted", cls: "bold-success" },
    { term: t("notifications:styling_terms.started"), cls: "bold-success" },
    { term: "started", cls: "bold-success" },
    { term: t("notifications:styling_terms.ended"), cls: "bold-danger" },
    { term: "ended", cls: "bold-danger" },
    { term: t("notifications:styling_terms.rejected"), cls: "bold-danger" },
    { term: "rejected", cls: "bold-danger" },
    { term: t("notifications:styling_terms.declined"), cls: "bold-danger" },
    { term: "declined", cls: "bold-danger" },
    { term: t("notifications:styling_terms.removed"), cls: "bold-danger" },
    { term: "removed", cls: "bold-danger" },
    { term: t("notifications:styling_terms.deleted"), cls: "bold-danger" },
    { term: "deleted", cls: "bold-danger" },
    {
      term: t("notifications:styling_terms.demoted_from_admin"),
      cls: "bold-danger",
    },
    { term: "demoted from Admin", cls: "bold-danger" },
    { term: t("notifications:styling_terms.demoted"), cls: "bold-danger" },
    { term: "demoted", cls: "bold-danger" },
    {
      term: t("notifications:styling_terms.pending_approval"),
      cls: "bold-warning",
    },
    { term: "pending approval", cls: "bold-warning" },
    { term: t("notifications:styling_terms.transferred"), cls: "bold-warning" },
    { term: "transferred", cls: "bold-warning" },
    { term: t("common:shared_groups.badges.host"), cls: "" },
    { term: "Host", cls: "" },
    { term: notif.metadata?.senderName, cls: "" },
    { term: notif.metadata?.groupName, cls: "" },
    { term: notif.metadata?.sessionName, cls: "" },
  ].filter(
    (item) =>
      item.term &&
      typeof item.term === "string" &&
      !item.term.startsWith("notifications:styling_terms."),
  );

  termsMap.sort((a, b) => b.term.length - a.term.length);

  termsMap.forEach(({ term, cls }) => {
    const escapedTerm = escapeHtmlStr(term);
    const regexStr = escapedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `(?<!>|<strong class="[^"]*">)(${regexStr})(?!<\\/strong>)`,
      "g",
    );
    const classAttr = cls ? ` class="${cls}"` : "";
    msg = msg.replace(regex, `<strong${classAttr}>$1</strong>`);
  });

  return msg;
};

const formatNotifDate = (ts) => {
  try {
    const d = new Date(ts || Date.now());
    if (isNaN(d.getTime()))
      return t("common:shared_chat.emojis.categories.recent");
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return t("common:shared_chat.emojis.categories.recent");
  }
};

const createNotificationCard = (notif) => {
  const card = document.createElement("div");
  const isUnread =
    notif.read === false || notif.read === "false" ? "unread" : "";
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

  card.setAttribute("data-is-invite", notif.metadata?.isInvite || "");

  let iconHtml = `<i class="bi bi-bell-fill"></i>`;
  if (
    notif.metadata?.senderPhotoURL &&
    (type === "join_request" ||
      type === "member_removed" ||
      type === "join_invite" ||
      notif.metadata?.isInvite)
  ) {
    iconHtml = `<img src="${escapeHtmlStr(notif.metadata.senderPhotoURL)}" alt="avatar" />`;
  } else if (
    type === "join_request" ||
    type === "join_invite" ||
    notif.metadata?.isInvite
  ) {
    iconHtml = `<i class="bi bi-person-fill"></i>`;
  } else if (
    type === "join_accepted" ||
    type === "join_request_accepted" ||
    type === "join_invite_accepted"
  ) {
    iconHtml = `<i class="bi bi-link-45deg"></i>`;
  } else if (type === "join_pending") {
    iconHtml = `<i class="bi bi-three-dots"></i>`;
  } else if (
    type === "join_rejected" ||
    type === "join_request_rejected" ||
    type === "join_invite_rejected"
  ) {
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

  const timeStr = formatNotifDate(notif.timestamp);
  const categoryLabel = t(
    `notifications:categories.${notif.category || "General"}`,
  );

  const notifsContainer = document.getElementById("notifications-list");
  const currentSession = notifsContainer
    ? notifsContainer.getAttribute("data-current-session")
    : "";
  const currentUserId = notifsContainer
    ? notifsContainer.getAttribute("data-current-user-id")
    : "";
  const isAdmin = Boolean(
    notif.metadata?.isAdmin ||
    (currentUserId &&
      notif.metadata?.creatorId &&
      currentUserId === notif.metadata.creatorId),
  );
  const isJoined = Boolean(
    typeof notif.metadata?.joined === "boolean"
      ? notif.metadata.joined
      : currentSession && currentSession === notif.metadata?.sessionId,
  );

  let actionsHtml = "";
  if (type === "join_request" && !notif.metadata?.isInvite) {
    actionsHtml = `
      <div class="notif-actions">
        <button type="button" class="reject-btn exclude-btn small-btn" data-action="reject"><i class="bi bi-slash-circle"></i> ${t("common:shared_terms.reject")}</button>
        <button type="button" class="accept-btn exclude-btn small-btn" data-action="accept"><i class="bi bi-check-circle"></i> ${t("common:shared_terms.accept")}</button>
      </div>
    `;
  } else if (
    type === "join_invite" ||
    (type === "join_request" && notif.metadata?.isInvite)
  ) {
    actionsHtml = `
      <div class="notif-actions">
        <button type="button" class="reject-invite-btn exclude-btn small-btn" data-action="reject"><i class="bi bi-slash-circle"></i> ${t("common:shared_terms.reject")}</button>
        <button type="button" class="join-invite-btn exclude-btn small-btn" data-action="join"><i class="bi bi-box-arrow-in-right"></i> ${t("common:shared_terms.join")}</button>
      </div>
    `;
  } else if (
    type === "session_started" &&
    !notif.metadata?.sessionEnded &&
    !isAdmin &&
    !isJoined
  ) {
    actionsHtml = `
      <div class="notif-actions">
        <button type="button" class="join-session exclude-btn small-btn"><i class="bi bi-box-arrow-in-right"></i> ${t("common:shared_terms.join")}</button>
      </div>
    `;
  }

  let notifForMessage = notif;
  if (type && notif.metadata) {
    const translatedMsg = t(
      `notifications:messages.${type}.message`,
      notif.metadata,
    );
    if (translatedMsg && !translatedMsg.startsWith("notifications:messages.")) {
      notifForMessage = { ...notif, message: translatedMsg };
    }
  }

  card.innerHTML = `
    <div class="notif-icon ${type}">
      ${iconHtml}
    </div>
    <div class="notif-content">
      <div class="notif-message">${formatNotificationMessage(notifForMessage)}</div>
      <div class="notif-footer">
        <span class="notif-meta">${timeStr} • ${categoryLabel}</span>
        ${actionsHtml}
      </div>
    </div>
  `;

  bindCardActions(card);
  return card;
};

export const clearAllNotifCardsUnreadState = () => {
  document
    .querySelectorAll("#notifications-list .notif-card.unread")
    .forEach((card) => card.classList.remove("unread"));
  Object.values(categoriesState).forEach((state) => {
    if (state && state.cardsHtml) {
      state.cardsHtml.forEach((card) => card.classList.remove("unread"));
    }
  });
};

const handleMarkAllAsRead = async (
  silent = false,
  removeUnreadClass = true,
) => {
  const activeBtn = document.querySelector(".notif-category-btn.active");
  const category = activeBtn ? activeBtn.getAttribute("data-category") : "All";

  if (removeUnreadClass) {
    if (!category || category === "All") {
      document
        .querySelectorAll("#notifications-list .notif-card.unread")
        .forEach((card) => card.classList.remove("unread"));
      Object.values(categoriesState).forEach((state) => {
        if (state.cardsHtml)
          state.cardsHtml.forEach((card) => card.classList.remove("unread"));
      });
    } else {
      document
        .querySelectorAll("#notifications-list .notif-card.unread")
        .forEach((card) => {
          if (card.getAttribute("data-category") === category) {
            card.classList.remove("unread");
          }
        });
      if (categoriesState[category] && categoriesState[category].cardsHtml) {
        categoriesState[category].cardsHtml.forEach((card) => {
          if (card.classList) card.classList.remove("unread");
        });
      }
      if (categoriesState["All"] && categoriesState["All"].cardsHtml) {
        categoriesState["All"].cardsHtml.forEach((card) => {
          if (
            card.getAttribute &&
            card.getAttribute("data-category") === category
          ) {
            if (card.classList) card.classList.remove("unread");
          }
        });
      }
    }
  }

  updateBadgeCount(-99999);

  try {
    sendData("/api/notifications/mark-read", {}, "POST").catch((err) => {
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
    const bellBtns = document.querySelectorAll(
      ".notification-btn, .mobile-notif-btn",
    );
    bellBtns.forEach((bellBtn) => {
      bellBtn.addEventListener(
        "click",
        () => {
          if (Notification.permission === "default") {
            Notification.requestPermission().catch(() => {});
          }
        },
        { once: true },
      );
    });
  }

  notifEventSource = new EventSource("/api/notifications/stream");
  notifEventSource.onmessage = (event) => {
    try {
      const notif = JSON.parse(event.data);
      if (!notif || !notif.id) return;

      if (
        (notif.type === "session_ended" || notif.metadata?.sessionEnded) &&
        notif.metadata?.sessionId
      ) {
        document
          .querySelectorAll(
            `.notif-card[data-session-id="${notif.metadata.sessionId}"] .notif-actions`,
          )
          .forEach((el) => el.remove());
        Object.values(categoriesState).forEach((state) => {
          if (state.cardsHtml) {
            state.cardsHtml.forEach((cardEl) => {
              if (
                cardEl.getAttribute &&
                cardEl.getAttribute("data-session-id") ===
                  notif.metadata.sessionId
              ) {
                const act = cardEl.querySelector(".notif-actions");
                if (act) act.remove();
              }
            });
          }
        });
      }

      if (
        window.Notification &&
        Notification.permission === "granted" &&
        notif.changeType === "added" &&
        (!notif.read || notif.read === "false" || notif.read === false)
      ) {
        new Notification(notif.title || "StudyHype Notification", {
          body: notif.message || "",
          icon: "/app/assets/global/images/logo.png",
        });
      }

      const existingDomCard = document.querySelector(
        `#notifications-list .notif-card[data-id="${notif.id}"]`,
      );

      const isUnreadInvite =
        notif.type === "join_invite" &&
        (!notif.read || notif.read === "false" || notif.read === false);

      if (
        notif.changeType === "modified" &&
        !existingDomCard &&
        !isUnreadInvite
      ) {
        return;
      }

      const isCurrentlyUnread =
        !notif.read || notif.read === "false" || notif.read === false;
      if (
        isCurrentlyUnread &&
        (!existingDomCard || !existingDomCard.classList.contains("unread"))
      ) {
        updateBadgeCount(1);
      }

      const newCard = createNotificationCard(notif);
      const isOverlayOpen =
        document.querySelector(".notifications-overlay.open-overlay") !== null;
      if (
        isOverlayOpen &&
        existingDomCard &&
        existingDomCard.classList.contains("unread")
      ) {
        newCard.classList.add("unread");
      }
      const category = notif.category || "All";

      const activeBtn = document.querySelector(".notif-category-btn.active");
      const activeCategory = activeBtn
        ? activeBtn.getAttribute("data-category")
        : "All";

      const emptyMsg = document.querySelector(
        "#notifications-list .icon-wrapper, #notifications-list .notifications-empty",
      );
      if (emptyMsg) emptyMsg.remove();

      const upsertIntoState = (catName, cardEl) => {
        const state = categoriesState[catName];
        if (!state || !state.cardsHtml) return;
        const idx = state.cardsHtml.findIndex(
          (c) => c.getAttribute && c.getAttribute("data-id") === notif.id,
        );
        if (idx !== -1) {
          if (isUnreadInvite) {
            state.cardsHtml.splice(idx, 1);
            state.cardsHtml.unshift(cardEl);
          } else {
            state.cardsHtml[idx] = cardEl;
          }
        } else {
          state.cardsHtml.unshift(cardEl);
        }
        bindCardActions(cardEl);
      };

      if (activeCategory === "All" || activeCategory === category) {
        if (existingDomCard) {
          if (isUnreadInvite) {
            existingDomCard.remove();
            const container = document.getElementById("notifications-list");
            if (container)
              container.insertBefore(newCard, container.firstChild);
          } else {
            existingDomCard.replaceWith(newCard);
          }
        } else {
          const container = document.getElementById("notifications-list");
          if (container) container.insertBefore(newCard, container.firstChild);
        }
      }

      upsertIntoState("All", newCard.cloneNode(true));
      if (category !== "All") {
        upsertIntoState(category, newCard.cloneNode(true));
      }
    } catch (err) {
      console.warn("Error processing stream notification:", err);
    }
  };

  notifEventSource.onerror = () => {};
};

export const initNotificationsManager = () => {
  const container = document.getElementById("notifications-list");
  if (!container) return;

  const initialCards = Array.from(container.querySelectorAll(".notif-card"));
  const initialLastVisible = container.getAttribute("data-last-visible") || "";

  const isAllDbLoaded =
    initialCards.length < INITIALE_LOADERS_COUNT && !initialLastVisible;

  if (initialCards.length > 0 || initialLastVisible) {
    Object.keys(categoriesState).forEach((cat) => {
      if (cat === "All") {
        categoriesState["All"].cardsHtml = initialCards;
        categoriesState["All"].lastVisible = initialLastVisible;
        categoriesState["All"].isLoaded = true;
        initialCards.forEach((card) => bindCardActions(card));
      } else {
        const matching = initialCards.filter(
          (c) => c.getAttribute("data-category") === cat,
        );
        if (isAllDbLoaded) {
          categoriesState[cat].cardsHtml = matching.map((c) => {
            const clone = c.cloneNode(true);
            bindCardActions(clone);
            return clone;
          });
          categoriesState[cat].lastVisible = "";
          categoriesState[cat].isLoaded = true;
        } else if (matching.length > 0) {
          categoriesState[cat].cardsHtml = matching.map((c) => {
            const clone = c.cloneNode(true);
            bindCardActions(clone);
            return clone;
          });
          const lastCard = matching[matching.length - 1];
          categoriesState[cat].lastVisible =
            lastCard.getAttribute("data-id") || "";
          categoriesState[cat].isLoaded = true;
        } else {
          categoriesState[cat].cardsHtml = [];
          categoriesState[cat].lastVisible = "";
          categoriesState[cat].isLoaded = false;
        }
      }
    });
  } else {
    Object.keys(categoriesState).forEach((cat) => {
      categoriesState[cat].isLoaded = true;
      categoriesState[cat].cardsHtml = [];
      categoriesState[cat].lastVisible = "";
    });
  }

  const createLoadingCard = () => {
    const div = document.createElement("div");
    div.className = "notif-card card-item loading-animation loading-card";
    div.style.minHeight = "fit-content";
    div.style.pointerEvents = "none";
    div.style.display = "flex";
    div.style.alignItems = "flex-start";
    div.style.gap = "12px";
    div.style.padding = "14px 16px";
    div.innerHTML = `
      <div class="loading-opacity-animation" style="width: 2.6rem; height: 2.6rem; border-radius: 50%; flex-shrink: 0;"></div>
      <div style="width: 100%; flex: 1; display: flex; flex-direction: column; gap: 8px;">
        <div class="loading-opacity-animation" style="height: 1rem; width: 85%; border-radius: 0.3rem;"></div>
        <div class="loading-opacity-animation" style="height: 1rem; width: 50%; border-radius: 0.3rem;"></div>
        <div class="loading-opacity-animation" style="height: 0.8rem; width: 35%; border-radius: 0.3rem; margin-top: 4px;"></div>
      </div>
    `;
    return div;
  };

  const getCriteria = () => {
    const activeBtn = document.querySelector(".notif-category-btn.active");
    const category = activeBtn
      ? activeBtn.getAttribute("data-category")
      : "All";
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
          title: t("notifications:skeletons.no_notifications_yet_title"),
          desc: t("notifications:skeletons.no_notifications_yet_desc"),
        },
        filtered: {
          icon: "bi-bell-slash",
          title: t("notifications:skeletons.no_notifications_found_title"),
          desc: t("notifications:skeletons.no_notifications_found_desc"),
        },
      },
    },
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
        const currentCards = Array.from(
          container.querySelectorAll(".notif-card:not(.loading-card)"),
        );
        currentCards.forEach((c) =>
          c.classList.remove(
            "transitioning-accepted",
            "transitioning-rejected",
          ),
        );
        categoriesState[oldCategory].cardsHtml = currentCards;
        categoriesState[oldCategory].lastVisible =
          notifLoader.lastVisible || "";
        categoriesState[oldCategory].isLoaded = true;
      }

      if (oldBtn) oldBtn.classList.remove("active");
      btn.classList.add("active");

      container.innerHTML = "";

      if (
        categoriesState[newCategory] &&
        categoriesState[newCategory].isLoaded
      ) {
        categoriesState[newCategory].cardsHtml.forEach((card) => {
          card.classList.remove(
            "transitioning-accepted",
            "transitioning-rejected",
          );
          container.appendChild(card);
        });
        notifLoader.lastVisible = categoriesState[newCategory].lastVisible;
        if (!categoriesState[newCategory].cardsHtml.length) {
          if (notifLoader.io) notifLoader.io.disconnect();
          container.innerHTML = "";

          notifLoader.checkEmptyState();
        } else if (notifLoader.lastVisible) {
          notifLoader.creteria = getCriteria();
          notifLoader.initLoadingBoxes();
          notifLoader.initObserver();
        } else if (notifLoader.io) {
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

  const bellBtns = document.querySelectorAll(
    ".notification-btn, .mobile-notif-btn",
  );

  bellBtns.forEach((bellBtn) => {
    bellBtn.addEventListener("click", () => {
      const badge = document.querySelector(".notification-badge");
      if (badge && !badge.classList.contains("hidden")) {
        handleMarkAllAsRead(false, false);
      }
    });
  });

  window.clearAllNotifCardsUnreadState = clearAllNotifCardsUnreadState;
  initRealtimeNotifications();
};
