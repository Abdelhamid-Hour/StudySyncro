import {
  expandAndShrinkDescription,
  FlipTimer,
  handelTaskBtns,
  handelTaskDetailsBtn,
} from './domFunctions.js';
import {
  collapseAllCom,
  collapseAllOn,
  expandDescriptionBtn,
  scrollToTopCom,
  scrollToTopOn,
  tasksContainer,
} from './getNodes.js';

expandDescriptionBtn.addEventListener('click', expandAndShrinkDescription);
collapseAllCom.addEventListener('click', () =>
  handelTaskBtns('completed-tasks')
);
collapseAllOn.addEventListener('click', () => handelTaskBtns('ongoing-tasks'));
scrollToTopCom.addEventListener('click', () =>
  handelTaskBtns('completed-tasks', true)
);
scrollToTopOn.addEventListener('click', () =>
  handelTaskBtns('ongoing-tasks', true)
);

tasksContainer.addEventListener('click', handelTaskDetailsBtn);



// const Timer = new FlipTimer(70);
