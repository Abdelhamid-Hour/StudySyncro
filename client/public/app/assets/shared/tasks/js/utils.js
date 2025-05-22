const handelTaskBtns = (className, scroll) => {
  const taskListElement = document.querySelector(`.${className} .tasks-list`);
  if (scroll) {
    return taskListElement.scroll(0, 0);
  }
  for (const element of taskListElement.children) {
    element.classList.remove('show-task-details');
  }
};

const handelTaskDetailsBtn = (e) => {
  if (e.target.closest('.task-down-icon')) {
    const task = e.target.closest('[class$="-task"], .show-task-details');

    if (task) {
      task.classList.toggle('show-task-details');
    }
  }
};

const addTaskListButtonListeners = (className) => {
  const selector = className ? `.${className}` : '';
  const scrollToTop = document.querySelector(`${selector} .scroll-to-top`);
  const collapseAll = document.querySelector(`${selector} .collapse-all`);

  scrollToTop.addEventListener('click', () => handelTaskBtns(className, true));
  collapseAll.addEventListener('click', () => handelTaskBtns(className));
};

export const handletTasksListners = (...wrapperClasses) => {
  const tasksList = document.querySelector('.tasks-list');

  if (wrapperClasses.length) {
    wrapperClasses.forEach((className) => {
      addTaskListButtonListeners(className);
    });
  } else {
    addTaskListButtonListeners('session-info');
  }

  tasksList.addEventListener('click', handelTaskDetailsBtn);
};
