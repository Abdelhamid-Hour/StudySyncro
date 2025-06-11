const handelTaskBtns = (className, scroll) => {
  const taskListElement = document.querySelector(`.${className} .tasks-list`);
  if (scroll) {
    return taskListElement.scroll(0, 0);
  }
  for (const element of taskListElement.children) {
    element.classList.remove("show-task-details");
  }
};

const handelTaskDetailsBtn = (e) => {
  if (e.target.closest(".task-down-icon")) {
    const task = e.target.closest(".task-wrapper, .show-task-details");

    if (task) {
      task.classList.toggle("show-task-details");
    }
  }
};

const addTaskListButtonListeners = (className) => {
  const selector = className ? `.${className}` : "";
  const scrollToTop = document.querySelector(`${selector} .scroll-to-top`);
  const collapseAll = document.querySelector(`${selector} .collapse-all`);

  scrollToTop?.addEventListener("click", () => handelTaskBtns(className, true));
  collapseAll?.addEventListener("click", () => handelTaskBtns(className));
};

export const handletTasksListners = (...wrapperClasses) => {
  if (wrapperClasses.length) {
    wrapperClasses.forEach((className) => {
      const tasksList = document.querySelector(`.${className} .tasks-list`);
      addTaskListButtonListeners(className);
      tasksList.addEventListener("click", handelTaskDetailsBtn);
    });
  }
};

export class Task {
  constructor({
    title,
    description,
    durationInMins,
    isQuiz,
    isBreak,
    status,
    UID,
  }) {
    this.title = title;
    this.status = status;
    this.UID = UID || null; // Unique identifier for the task
    this.durationInMins = durationInMins;
    this.isQuiz = isQuiz || false;
    this.isBreak = isBreak || false;
    if (!isBreak) this.description = description;
  }
}
// ! ------------------------------------
let dragging = {};
let container = null;
const PROXIMITY = 10; // Distance in pixels to trigger a drop
const SCROLLPROXIMITY = 30; // Distance in pixels to trigger scroll
let MAX_SCROLL = 0; // Maximum scroll value for the container
let afterDragEnd = () => {};
let draggableElSelector = "";

function onTaskListMouseDown(e) {
  const handle = e.target.closest(".drag-handle");
  const draggableEl = e.target.closest(draggableElSelector);
  if (!handle || !draggableEl) return;

  document.body.style.userSelect = "none";

  dragging.dragEl = draggableEl;
  const dragElRect = draggableEl.getBoundingClientRect();
  const listRect = container.getBoundingClientRect();
  dragging.initialScrollTop = container.scrollTop;
  dragging.offsetX = e.clientX - dragElRect.left;
  dragging.offsetY = e.clientY - dragElRect.top;

  dragging.dragEl.style.width = `${dragElRect.width}px`;
  dragging.dragEl.style.position = "absolute";
  dragging.dragEl.style.zIndex = "1000";

  const offsetY =
    e.clientY + container.scrollTop - listRect.top - dragging.offsetY;

  const offsetX = e.clientX - listRect.left - dragging.offsetX;
  dragging.dragEl.style.top = `${offsetY}px`;
  dragging.dragEl.style.left = `${offsetX}px`;

  dragging.dragEl.classList.add("dragging");
}

function stopScrollAnimation() {
  if (dragging.scrollRef) {
    cancelAnimationFrame(dragging.scrollRef);
    dragging.scrollRef = null;
  }
}

function updateCounters() {
  const tasks = container.querySelectorAll(draggableElSelector);
  const padCounter = tasks.length.toString().length;
  tasks.forEach((draggableEl, idx) => {
    const counter = draggableEl.querySelector(".counter");
    if (counter) {
      counter.textContent = counter.textContent.replace(
        /\d+/g,
        (idx + 1).toString().padStart(padCounter, "0")
      );
    }
  });
}

function resetDragState() {
  Object.assign(dragging.dragEl.style, {
    zIndex: "",
    width: "",
    position: "",
    top: "",
    left: "",
  });
  document.body.style.userSelect = "";
  dragging.dragEl.classList.remove("dragging");
  dragging = {};
}

function handleFirstTaskDrop() {
  const firstTask = container.querySelector(draggableElSelector);
  if (firstTask === dragging.dragEl) {
    const secondTask = container.querySelector(
      draggableElSelector + ":not(:first-child)"
    );
    if (secondTask) {
      secondTask.firstElementChild.before(dragging.dragEl.firstElementChild);
    }
  }
}

function moveDraggedElement() {
  if (dragging.dragArea.nextElementSibling) {
    dragging.dragArea.parentElement.before(dragging.dragEl);
    dragging.dragEl.firstElementChild.before(dragging.dragArea);
  } else {
    dragging.dragArea.parentElement.after(dragging.dragEl);
  }
}

function onMouseUp() {
  stopScrollAnimation();

  if (!dragging.dragEl) return;

  if (dragging.dragArea) {
    handleFirstTaskDrop();
    moveDraggedElement();
    updateCounters();
    if (afterDragEnd) {
      afterDragEnd();
    }
    dragging.dragArea.classList.remove("drag-over");
    dragging.dragArea = null;
  }

  resetDragState();
}

function onTaskListScroll() {
  if (container.scrollTop >= MAX_SCROLL + container.scrollHeight) {
    container.scrollTop = MAX_SCROLL + container.scrollHeight;
  }
  if (dragging.dragEl && dragging.initialScrollTop !== container.scrollTop) {
    const currentTop = parseFloat(dragging.dragEl.style.top) || 0;
    dragging.dragEl.style.top =
      currentTop - dragging.initialScrollTop + container.scrollTop + "px";
    dragging.initialScrollTop = container.scrollTop;
  }
}

function handleScroll(direction, speed) {
  if (dragging.scrollRef) {
    cancelAnimationFrame(dragging.scrollRef);
    dragging.scrollRef = null;
  }
  dragging.scrollRef = requestAnimationFrame(() => {
    if (dragging.scrollRef) {
      if (container.scrollTop >= MAX_SCROLL + container.scrollHeight) {
        container.scrollTop = MAX_SCROLL + container.scrollHeight;
        return;
      }
      container.scrollTop += direction * speed * 5;
    }
  });
}

function handleDropTargets() {
  const dropTargets = container.querySelectorAll(".drop-target");
  dropTargets.forEach((target) => {
    const targetTask = target.closest(draggableElSelector);
    if (targetTask === dragging.dragEl) return;
    const targetRect = target.getBoundingClientRect();
    const dragElRect = dragging.dragEl.getBoundingClientRect();
    const isOverTarget =
      dragElRect.left >= targetRect.left - PROXIMITY &&
      dragElRect.left <= targetRect.right + PROXIMITY &&
      dragElRect.top >= targetRect.top - PROXIMITY &&
      dragElRect.top <= targetRect.bottom + PROXIMITY;

    if (isOverTarget) {
      dragging.dragArea = target;
      target.classList.add("drag-over");
    } else {
      target.classList.remove("drag-over");
    }
  });
}

function updateDraggedElementPosition(e) {
  const rect = container.getBoundingClientRect();
  const scrollTop = container.scrollTop;
  const offsetX = e.clientX - rect.left - dragging.offsetX;
  const offsetY = e.clientY + scrollTop - rect.top - dragging.offsetY;
  dragging.dragEl.style.top = offsetY + "px";
  dragging.dragEl.style.left = offsetX + "px";
}

function handleAutoScroll() {
  const taskListRect = container.getBoundingClientRect();
  const dragElRect = dragging.dragEl.getBoundingClientRect();
  const bottomOffset = taskListRect.bottom - dragElRect.bottom;
  const topOffset = dragElRect.top - taskListRect.top;

  if (bottomOffset <= SCROLLPROXIMITY) {
    const speed = Math.max(SCROLLPROXIMITY - bottomOffset, 1);
    handleScroll(1, speed);
  } else if (topOffset <= SCROLLPROXIMITY) {
    const speed = Math.max(SCROLLPROXIMITY - topOffset, 1);
    handleScroll(-1, speed);
  } else {
    if (dragging.scrollRef) {
      cancelAnimationFrame(dragging.scrollRef);
      dragging.scrollRef = null;
    }
  }
}

function onTaskListMouseMove(e) {
  if (!dragging.dragEl) return;

  updateDraggedElementPosition(e);
  handleDropTargets();
  handleAutoScroll();
}

export const setUpDragAndDrop = (
  ContainerSelector,
  draggableSelector,
  afterDragEndCallback
) => {
  container = document.querySelector(ContainerSelector);
  draggableElSelector = draggableSelector;
  MAX_SCROLL = 0;
  afterDragEnd = afterDragEndCallback;

  container.addEventListener("mousedown", onTaskListMouseDown);
  document.addEventListener("mouseup", onMouseUp);
  container.addEventListener("scroll", onTaskListScroll);
  container.addEventListener("mousemove", onTaskListMouseMove);
};
