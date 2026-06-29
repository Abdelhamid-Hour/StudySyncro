import { fetchData } from "../../../../../main_assets/js/utils.js";
import { openOverlayModal } from "../../../global/js/utils.js";
import { Loader } from "../../../shared/loader/js/utils.js";
import { joinSession } from "../../../shared/session/js/utils.js";
import { handletTasksListners } from "../../../shared/tasks/js/utils.js";
import { sessionsContainer } from "./dom-variables.js";

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
    .setAttribute("data-session-id", session.UID || session.id || "");

  return card;
};

export const initSessionsLoader = () => {
  const loader = new Loader(
    sessionsContainer,
    createSessionCard,
    "/active-sessions?",
    getSessionLoader(),
    {
      loadersCount: 1,
    }
  );
};
