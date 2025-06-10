import { expandAndShrinkDescription, Session } from './utils.js';
import {
  expandDescriptionBtn,
  initDomVariables,
} from './dom-variables.js';
import { handletTasksListners } from '../../../shared/tasks/js/utils.js';
import { iniChatMessageInput } from '../../../shared/chat/js/utils.js';

export const init = () => {

  initDomVariables();

  expandDescriptionBtn.addEventListener('click', expandAndShrinkDescription);
  
  handletTasksListners('completed-tasks', 'ongoing-tasks');

  new Session().startSession();

  iniChatMessageInput();
  
};

init();
