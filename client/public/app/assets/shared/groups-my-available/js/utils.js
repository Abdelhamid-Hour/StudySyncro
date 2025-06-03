import { boxRowCount } from '../../../global/js/dom-variables.js';
import { Loader } from '../../quizzes-groups/js/utils.js';

export const createLoadingCard = (userGroup) => {
  const div = document.createElement('div');
  div.className = 'loading-animation loading-card';

  const header = document.createElement('header');
  const badgePublic = document.createElement('span');
  badgePublic.className = 'badge loading-opacity-animation';
  if (userGroup) {
    const badgeBlue = document.createElement('span');
    badgeBlue.className = 'badge loading-opacity-animation';
    header.appendChild(badgeBlue);
  }
  header.appendChild(badgePublic);

  const loadingMeta = document.createElement('div');
  loadingMeta.className = 'loading-meta';
  const loadingTitle = document.createElement('h3');
  loadingTitle.className = 'loading-title loading-opacity-animation';
  const loadingSubject = document.createElement('div');
  loadingSubject.className = 'loading-subject';
  loadingSubject.innerHTML =
    'Subject: <span class="subject-value loading-opacity-animation"></span>';
  loadingMeta.appendChild(loadingTitle);
  loadingMeta.appendChild(loadingSubject);

  const loadingDescription = document.createElement('div');
  loadingDescription.className = 'loading-description';
  for (let i = 0; i < 3; i++) {
    const descDiv = document.createElement('div');
    descDiv.className = 'loading-opacity-animation';
    loadingDescription.appendChild(descDiv);
  }

  const footer = document.createElement('footer');
  footer.className = 'loading-footer';
  const loadingLevel = document.createElement('div');
  loadingLevel.className = 'loading-level';
  loadingLevel.innerHTML =
    '<span class="level-label">Level:</span><span class="level-value loading-opacity-animation"></span>';
  const avatars = document.createElement('div');
  avatars.className = 'avatars';
  for (let i = 0; i < 3; i++) {
    const avatar = document.createElement('div');
    avatar.className = 'avatar loading-opacity-animation';
    avatars.appendChild(avatar);
  }
  footer.appendChild(loadingLevel);
  footer.appendChild(avatars);

  div.appendChild(header);
  div.appendChild(loadingMeta);
  div.appendChild(loadingDescription);
  div.appendChild(footer);

  return div;
};

export const getcreateGroupCardFunc = (userGroup) => {
  return (group) => {
    const groupCard = document.createElement('div');
    groupCard.className = 'group-card route-link';
    groupCard.dataset.id = group.id;
    const groupLevel = `<span class="level-value badge ${
      group.level === 'Intermediate'
        ? 'blue-badge'
        : group.level === 'Advanced'
        ? 'orange-badge'
        : 'gray-badge'
    }">${group.level}</span>`;

    groupCard.innerHTML = `
          <header>
              <span class="badge ${
                group.isPublic ? 'public-badge' : 'private-badge'
              }">
                  ${group.isPublic ? 'Public' : 'Private'}
              </span>
              ${
                userGroup
                  ? `<span class="badge ${
                      group.isHost ? 'orange-badge' : 'blue-badge'
                    }">
                      ${group.isHost ? 'Host' : 'Member'}
                  </span>`
                  : groupLevel
              }
          </header>
          <div class="group-meta">
              <h3 class="group-title">${group.title}</h3>
              <span class="subject-value badge simple-badge">${
                group.subject
              }</span>
          </div>
          <div data-tooltip="${
            group.description
          }" class="group-description has-tooltip">${group.description}</div>
          <footer class="group-footer">
              ${userGroup ? groupLevel : ''}
              <div class="avatars">
              ${group.avatars
                .map(
                  (avatar) =>
                    `<div class="avatar"><img src="${avatar}" /></div>`
                )
                .join('')}
              ${
                group.extraMembersCount > 0
                  ? `<div class="member-count">+${group.extraMembersCount}</div>`
                  : ''
              }
                </div>
              ${
                !userGroup
                  ? `<button class="btn-join">${
                      group.isPublic ? 'Join This Group' : 'Request to Join'
                    }</button>`
                  : ''
              }
          </footer>
      `;

    return groupCard;
  };
};

export const initLazyLoadingLoader = (userGroup = false) => {
  const endPoint = userGroup ? `/user-groups` : `/available-groups`;
  const loader = new Loader(
    document.querySelector('.groups-list'),
    '200px',
    getcreateGroupCardFunc(userGroup),
    endPoint
  );

  loader.initLoadingBoxes(boxRowCount, createLoadingCard(userGroup));

  loader.initObserver();

  return loader;
};
