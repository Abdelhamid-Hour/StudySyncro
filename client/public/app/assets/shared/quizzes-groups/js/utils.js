import {
  fetchData,
  showMessageBlock,
} from '../../../../../main_assets/js/utils.js';
import {
  boxRowCount,
  boxTotalCount,
  topSideBarMiddle,
} from '../../../global/js/dom-variables.js';
import { getDebounceFunc } from '../../../global/js/utils.js';

export class Loader {
  constructor(
    container,
    rootMargin,
    createCard,
    route,
    loadingBox,
    getCreteria,
    loadersCount = boxRowCount
  ) {
    this.container = container;
    const cardsCount = this.container.children.length;
    this.getCreteria = getCreteria;
    this.creteria = this.getCreteria();
    this.rootMargin = rootMargin;
    this.createCard = createCard;
    this.route = route;
    this.lastVisible = this.container?.dataset.lastVisible;
    this.loading = false;
    this.io = null;
    console.log(this.creteria);
    this.container.removeAttribute('data-next-last-id');
    if (cardsCount > 20) {
    this.initLoadingBoxes(loadersCount, loadingBox);
    this.initObserver();
    }
  }

  reset() {
    this.loading = false;
    this.lastVisible = '';
    if (this.io) {
      this.io.disconnect();
    }
    clearLoadersBoxes();
    this.sentinel = null;
    this.container.innerHTML = '';
    this.creteria = this.getCreteria();
    this.initLoadingBoxes(boxRowCount, this.createCard);
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

  initLoadingBoxes(loadersCount, loadingBox) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < loadersCount; i++) {
      if (i === 0) {
        const firstLoader = loadingBox.cloneNode(true);
        firstLoader.classList.add('first-loading-card');
        frag.appendChild(firstLoader);
        continue;
      }
      const loader = loadingBox.cloneNode(true);
      frag.appendChild(loader);
    }
    this.container.appendChild(frag);
    this.sentinel = document.querySelector('.first-loading-card');
  }

  async loadMore() {
    this.loading = true;

    const endPoint = `${this.route}?lastVisible=${this.lastVisible}&count=${boxTotalCount}`;

    try {
      const { cards, lastVisible } = await fetchData(endPoint);

      this.lastVisible = lastVisible;

      const frag = document.createDocumentFragment();
      cards.forEach((item) => {
        const card = this.createCard(item);
        frag.appendChild(card);
      });
      // insert the new cards before the last loader
      this.sentinel.before(frag);

      if (!lastVisible) {
        this.io.unobserve(this.sentinel);
        clearLoadersBoxes();
      }
    } catch (error) {
      console.error('Error loading more items:', error);
      // Optionally, you can show an error message to the user
      showMessageBlock(
        'Error loading more items. Please try again later.',
        'error'
      );
    }

    this.loading = false;
  }
}

const clearLoadersBoxes = () => {
  const loaders = document.querySelectorAll('.loading-card');
  loaders.forEach((loader) => {
    loader.remove();
  });
};

export const initFiltersInputListener = (loader) => {
  console.log('initFiltersInputListener', loader.getCreteria);
  
  const resetLoader = getDebounceFunc(() => loader.reset(), 200);
  const handleInputChange = (e) => {
    const isInput = e.target.tagName === 'INPUT';
    if (isInput) resetLoader();
  };
  topSideBarMiddle.addEventListener('input', handleInputChange);
};
