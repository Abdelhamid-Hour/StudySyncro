import { fetchData } from '../../../../../main_assets/js/utils.js';
import { boxRowCount, boxTotalCount } from '../../../global/js/dom-variables.js';

export class Loader {
  constructor(container, rootMargin, createCard, endPoint) {
    this.loading = false;
    this.io = null;
    this.container = container;
    this.rootMargin = rootMargin;
    this.createCard = createCard;
    // get the nextLastId from the container's data attribute
    this.nextLastId = this.container.dataset.nextLastId;
    // remove the data attribute from the container
    this.container.removeAttribute('data-next-last-id');
    this.endPoint = endPoint;
  }

  initObserver() {
    this.io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            !this.loading &&
            this.nextLastId !== null
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

    const endPoint = `${this.endPoint}?nextLastId=${this.nextLastId}&count=${boxTotalCount}`;

    const { cards, nextLastId } = await fetchData(endPoint);

    this.nextLastId = nextLastId;


    
    const frag = document.createDocumentFragment();
    cards.forEach((item) => {
      const card = this.createCard(item);
      frag.appendChild(card);
    });
    // insert the new cards before the last loader
    this.sentinel.before(frag);
    
    if (!nextLastId) {
      this.io.unobserve(this.sentinel);
      clearLoadersBoxes();
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
