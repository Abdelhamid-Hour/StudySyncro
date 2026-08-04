import {
  fetchData,
  getDebounceFunc,
  getLoadersCount,
  isAsync,
  showMessageBlock,
  t,
} from "../../../global/js/utils.js";
import {
  INITIALE_LOADERS_COUNT,
  LOADER_COUNT,
} from "../../../global/js/variables.js";

const encodeCriteria = (criteria) => {
  if (!criteria) return "";
  return criteria
    .split("&")
    .map((param) => {
      const [key, value] = param.split("=");
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join("&");
};

export class Loader {
  constructor(
    container,
    createCard,
    route,
    loadingBox,
    {
      chat = false,
      rootMargin = "30px",
      getCriteria = () => "",
      loadersCount = getLoadersCount(),
      afterAppendRes = () => {},
      append = true,
      firstLoadFunc = () => {},
      emptyState = null,
      threshold = 0,
    },
  ) {
    this.getCriteria = () => {
      const criteria = getCriteria() || "";
      return encodeCriteria(criteria);
    };
    this.firstLoadFunc = firstLoadFunc;
    this.afterAppendRes = afterAppendRes;
    this.emptyState = emptyState;
    this.creteria = this.getCriteria();
    this.append = append;
    this.rootMargin = rootMargin;
    this.threshold = threshold;
    this.chat = chat;
    this.createCard = createCard;
    this.route = route;
    this.loading = false;
    this.currentRequestId = 0;
    this.io = null;
    this.container = container;
    this.loadersCount = loadersCount;
    this.loadingBox = loadingBox;
    this.lastVisible = this.container?.dataset.lastVisible || "";
    this.count = LOADER_COUNT;
    const cardsCount = this.container.querySelectorAll(".card-item").length;
    this.container.removeAttribute("data-last-visible");
    if (cardsCount >= INITIALE_LOADERS_COUNT) {
      this.initLoadingBoxes();
      this.initObserver();
    }
  }

  reset() {
    this.loadersCount = this.loadersCount === 1 ? 1 : getLoadersCount();
    this.loading = false;
    this.lastVisible = "";
    this.count = LOADER_COUNT;
    if (this.io) {
      this.io.disconnect();
    }
    clearLoadersBoxes();
    this.sentinel = null;
    this.container.innerHTML = "";
    this.creteria = this.getCriteria();
    this.initLoadingBoxes();
    this.initObserver();
  }

  initObserver() {
    let isFirstLoad = true;
    this.io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            !this.loading &&
            this.lastVisible !== null
          ) {
            this.loadMore(isFirstLoad);
            if (isFirstLoad) isFirstLoad = false;
          }
        });
      },
      {
        root: this.container,
        rootMargin: this.rootMargin,
        threshold: this.threshold,
      },
    );

    if (this.sentinel) {
      this.io.observe(this.sentinel);
    }
  }

  initLoadingBoxes() {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < this.loadersCount; i++) {
      const loadingBox = this.loadingBox.cloneNode(true);
      if (i === 0) loadingBox.classList.add("first-loading-card");

      frag.appendChild(loadingBox);
    }
    if (this.append) this.container.appendChild(frag);
    else this.container.prepend(frag);
    this.sentinel = document.querySelector(".first-loading-card");
  }

  async loadMore(isFirstLoad = false) {
    this.loading = true;
    const requestId = ++this.currentRequestId;

    let endPoint = `${this.route}lastVisible=${this.lastVisible}&count=${this.count}`;

    if (this.creteria) {
      endPoint += `&${this.creteria}`;
    }

    try {
      let { cards, lastVisible } = await fetchData(endPoint);

      if (requestId !== this.currentRequestId) {
        return;
      }

      this.lastVisible = lastVisible;

      if (!cards.length || cards[0]?.length === 0) {
        this.io.unobserve(this.sentinel);
        clearLoadersBoxes();
        this.checkEmptyState();
        this.loading = false;
        return;
      }

      const frag = document.createDocumentFragment();

      const initialHeight = this.container.scrollHeight;

      if (isFirstLoad) {
        const res = this.firstLoadFunc(cards);
        if (res && res.cards) cards = res.cards;
        if (res && res.lastVisible)
          lastVisible = res.lastVisible || lastVisible;
      }

      let cardElements;
      if (isAsync(this.createCard)) {
        const promises = cards.map((item) =>
          this.createCard(item, this.creteria.split("=")[1]),
        );
        cardElements = await Promise.all(promises);
      } else {
        cardElements = cards.map((item) =>
          this.createCard(item, this.creteria.split("=")[1]),
        );
      }

      frag.append(...cardElements);

      if (this.chat) {
        const msgContainer = frag.querySelector(
          ".message-received:last-child, .message-sent:last-child",
        );
        const firstMsgContainer = document.querySelector(
          ".chat-messages > .message-received, .chat-messages > .message-sent",
        );

        const msgContainerMessages = msgContainer?.querySelector(".messages");

        if (
          firstMsgContainer &&
          msgContainer &&
          msgContainerMessages &&
          firstMsgContainer.className === msgContainer.className
        ) {
          const messages = firstMsgContainer.querySelector(".messages");
          const firstMessage =
            messages.firstChild ||
            messages.querySelector(".first-message-received-text");
          if (firstMessage) {
            firstMessage.className = firstMessage.className.replace(
              "first-",
              "",
            );
            firstMessage.querySelector("span.username")?.remove();
          }
          msgContainerMessages.append(...messages.children);
          firstMsgContainer.remove();
        }
      }
      // insert the new cards before the last loader
      if (this.append) this.sentinel.before(frag);
      else this.sentinel.after(frag);

      this.afterAppendRes({ cards, lastVisible, initialHeight, isFirstLoad });
      if (!lastVisible) {
        this.io.unobserve(this.sentinel);
        clearLoadersBoxes();
        this.checkEmptyState();
      }
    } catch (error) {
      console.error("Error loading more items:", error);
      // Optionally, you can show an error message to the user
      showMessageBlock(t("common:alerts.error_loading_more"), "error");
    }

    this.loading = false;
  }

  checkEmptyState() {
    const existingEmpty = this.container.querySelector(".icon-wrapper");
    if (existingEmpty) existingEmpty.remove();

    if (this.container.children.length === 0) {
      const iconWrapper = document.createElement("div");
      iconWrapper.className = "icon-wrapper";

      let icon = "bi-search";
      let title = t("common:skeletons.no_results_title");
      let desc = t("common:skeletons.no_results_desc");

      if (this.emptyState) {
        let isFiltered = false;
        if (this.creteria) {
          const params = new URLSearchParams(this.creteria);
          for (const [key, value] of params.entries()) {
            const val = value.trim();
            if (
              key !== "sort" &&
              key !== "groupId" &&
              key !== "sessionId" &&
              key !== "userId" &&
              val !== "" &&
              val !== "false"
            ) {
              isFiltered = true;
              break;
            }
          }
        }

        const stateObj = isFiltered
          ? this.emptyState.filtered || null
          : this.emptyState.noFilter || null;
        if (stateObj) {
          icon = stateObj.icon || icon;
          title = stateObj.title || title;
          desc = stateObj.desc || desc;
        }
      }

      iconWrapper.innerHTML = `
        <div class="empty-icon-container">
          <i class="bi ${icon}"></i>
        </div>
        <h3><bdi>${title}</bdi></h3>
        <p><bdi>${desc}</bdi></p>
      `;
      this.container.appendChild(iconWrapper);
    }
  }
}

const clearLoadersBoxes = () => {
  const loaders = document.querySelectorAll(".loading-card");
  loaders.forEach((loader) => {
    loader.remove();
  });
};

export const initFiltersInputListener = (loader, container) => {
  const resetLoader = getDebounceFunc(() => loader.reset(), 300);
  const handleInputChange = (e) => {
    const isInput = e.target.tagName === "INPUT";
    if (isInput) {
      resetLoader();
    }
  };
  container.addEventListener("input", handleInputChange);
};

const createDateBadge = (dateInput) => {
  const badge = document.createElement("span");
  badge.className = "badge gray-badge date-badge";
  const textSpan = document.createElement("span");
  textSpan.className = "text";
  const removeBtn = document.createElement("button");
  removeBtn.className = "exclude-btn remove-btn should-fill";
  removeBtn.innerHTML = '<i class="bi bi-x-circle"></i>';
  removeBtn.addEventListener("click", () => {
    badge.remove();
    dateInput.value = "";
    dateInput.dispatchEvent(new Event("input", { bubbles: true }));
  });
  badge.appendChild(textSpan);
  badge.appendChild(removeBtn);
  return badge;
};

export const setUpDatePicker = (container) => {
  const dateInput = container.querySelector('input[type="date"]');
  dateInput.onclick = (e) => {
    e.currentTarget.showPicker();
  };
  dateInput.addEventListener("change", (e) => {
    const selectedDate = e.target.value;
    const searchContainer = e.target.closest(".search");
    let dateBadge = searchContainer.querySelector(".date-badge");
    if (!dateBadge) {
      dateBadge = createDateBadge(dateInput);
      searchContainer.appendChild(dateBadge);
    }
    if (!selectedDate) dateBadge.remove();
    else dateBadge.querySelector(".text").innerText = selectedDate;
  });
};
