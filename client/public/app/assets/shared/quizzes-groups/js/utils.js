import {
  fetchData,
  showMessageBlock,
} from "../../../../../main_assets/js/utils.js";
import {
  boxRowCount,
  boxTotalCount,
  topSideBarMiddle,
} from "../../../global/js/dom-variables.js";
import { getDebounceFunc } from "../../../global/js/utils.js";

const encodeCriteria = (criteria) => {
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
    rootMargin,
    createCard,
    route,
    loadingBox,
    getCreteria,
    loadersCount = boxRowCount,
    afterAppendRes = () => {}
  ) {
    this.getCreteria = () => {
      const criteria = getCreteria() || "";
      return encodeCriteria(criteria);
    };
    this.afterAppendRes = afterAppendRes;
    this.creteria = this.getCreteria();
    this.rootMargin = rootMargin;
    this.createCard = createCard;
    this.route = route;
    this.loading = false;
    this.io = null;
    this.container = container;
    this.loadersCount = loadersCount;
    this.loadingBox = loadingBox;
    this.lastVisible = this.container?.dataset.lastVisible;
    this.count = boxTotalCount;
    const cardsCount = this.container.children.length;
    this.container.removeAttribute("data-last-visible");
    if (cardsCount >= 20) {
      this.initLoadingBoxes();
      this.initObserver();
    }
  }

  reset() {
    this.loading = false;
    this.lastVisible = "";
    this.count = 20;
    if (this.io) {
      this.io.disconnect();
    }
    clearLoadersBoxes();
    this.sentinel = null;
    this.container.innerHTML = "";
    this.creteria = this.getCreteria();
    this.initLoadingBoxes();
    this.initObserver();
  }

  initObserver() {
    this.io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            !this.loading &&
            this.lastVisible !== null
          ) {
            this.loadMore();
          }
        });
      },
      {
        root: this.container,
        rootMargin: this.rootMargin,
      }
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
    this.container.appendChild(frag);
    this.sentinel = document.querySelector(".first-loading-card");
  }

  async loadMore() {
    this.loading = true;

    const endPoint = `${this.route}?lastVisible=${this.lastVisible}&count=${this.count}&${this.creteria}`;

    try {
      const { cards, lastVisible } = await fetchData(endPoint);

      this.lastVisible = lastVisible;

      const frag = document.createDocumentFragment();
      console.log({ cards, lastVisible });

      cards.forEach((item) => {
        const card = this.createCard(item, this.creteria.split("=")[1]);
        frag.appendChild(card);
      });

      // insert the new cards before the last loader
      this.sentinel.before(frag);

      this.afterAppendRes({ cards, lastVisible });

      if (!lastVisible) {
        this.io.unobserve(this.sentinel);
        clearLoadersBoxes();
      }
    } catch (error) {
      console.error("Error loading more items:", error);
      // Optionally, you can show an error message to the user
      showMessageBlock(
        "Error loading more items. Please try again later.",
        "error"
      );
    }

    this.loading = false;
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
    if (isInput) resetLoader();
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
