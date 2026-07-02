import {
  fetchData,
  showMessageBlock,
} from "../../../../../main_assets/js/utils.js";
import {
  INITIALE_LOADERS_COUNT,
  LOADER_COUNT,
  LOADERS_COUNT,
} from "../../../global/js/variables.js";
import { getDebounceFunc, isAsync } from "../../../global/js/utils.js";

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
      rootMargin = "30px",
      getCriteria = () => "",
      loadersCount = LOADERS_COUNT,
      afterAppendRes = () => {},
      append = true,
      firstLoadFunc = () => {},
      emptyState = null,
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

      const frag = document.createDocumentFragment();

      const initialHeight = this.container.scrollHeight;

      if (isFirstLoad) {
        const res = this.firstLoadFunc(cards);
        if (res && res.cards) cards = res.cards;
        if (res && res.lastVisible) lastVisible = res.lastVisible || lastVisible;
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

      // insert the new cards before the last loader
      if (this.append) this.sentinel.before(frag);
      else this.sentinel.after(frag);

      this.afterAppendRes({ cards, lastVisible, initialHeight });
      if (!lastVisible) {
        this.io.unobserve(this.sentinel);
        clearLoadersBoxes();
        this.checkEmptyState();
      }
    } catch (error) {
      console.error("Error loading more items:", error);
      // Optionally, you can show an error message to the user
      showMessageBlock(
        "Error loading more items. Please try again later.",
        "error",
      );
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
      let title = "No Results Found";
      let desc = "No matches found for your search or filters.";

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

        const stateObj = isFiltered ? (this.emptyState.filtered || null) : (this.emptyState.noFilter || null);
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
        <h3>${title}</h3>
        <p>${desc}</p>
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
      console.log(" resetLoader();");
      
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
  badge.appendChild(removeBtn);
  badge.appendChild(textSpan);
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
    dateBadge.querySelector(".text").innerText = selectedDate;
  });
};
