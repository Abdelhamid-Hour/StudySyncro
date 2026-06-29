export let activeSessions, scrollToTopOn, collapseAllOn, scrollToTopCom, collapseAllCom, expandDescriptionBtn, sessionsContainer;

export const initDomVariables = () => {
  activeSessions = document.querySelector('.active-sessions');
  scrollToTopOn = document.querySelector('.ongoing-tasks .scroll-to-top');
  collapseAllOn = document.querySelector('.ongoing-tasks .collapse-all');
  scrollToTopCom = document.querySelector('.completed-tasks .scroll-to-top');
  collapseAllCom = document.querySelector('.completed-tasks .collapse-all');
  expandDescriptionBtn = document.querySelector('.expande-desc-btn');
  sessionsContainer = document.querySelector('.sessions-container');
};
