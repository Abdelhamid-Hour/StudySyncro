import {
  showMessageBlock,
  sendData,
} from '../../../../../main_assets/js/utils.js';
import { getLoader, showConfirmationBox } from '../../../global/js/utils.js';

export const handleJoinGroupClick = async (joinGroupBtn) => {
  joinGroupBtn.disabled = true;

  const result = await showConfirmationBox(
    'confirmation',
    'Join Group',
    'Are you sure you want to join this group?',
    'Cancel',
    'Join'
  );

  joinGroupBtn.disabled = false;

  if (!result) return;

  const groupCard = joinGroupBtn.closest('.group-card');
  const groupId = groupCard?.dataset.id;
  const groupName = groupCard.querySelector('.group-name').textContent;
  const groupFooter = groupCard.querySelector('.group-footer');

  const loaderDiv = createLoaderDiv();
  groupFooter.replaceChild(loaderDiv, joinGroupBtn);
  try {
    const { status } = await sendData('/api/join-group', { groupId });

    const resultElement = getResultElement(status, groupId);
    groupFooter.replaceChild(
      document.createRange().createContextualFragment(resultElement),
      loaderDiv
    );
    const successMessage = getSuccessMessage(status, groupName);
    showMessageBlock(successMessage, 'success');
  } catch (error) {
    console.error('Error joining group:', error);
    showMessageBlock(error.message, 'error');
    groupFooter.replaceChild(joinGroupBtn, loaderDiv);
  }
};

const createLoaderDiv = () => {
  const loaderDiv = document.createElement('div');
  loaderDiv.className = 'loader-container';
  loaderDiv.innerHTML = getLoader();
  return loaderDiv;
};

const getResultElement = (status, groupId) => {
  return status === 'joined'
    ? `<a href="/app/groups/my/${groupId}/chat" class="view-group-link">
                             <i class="bi bi-box-arrow-right"></i><span>View Group</span>
                     </a>`
    : '<span class="pending-text"><i class="bi bi-hourglass-split"></i>Pending</span>';
};

const getSuccessMessage = (status, groupName) => {
  return status === 'joined'
    ? `You’ve successfully joined Group <b>${groupName}</b>`
    : `Your request to join Group <b>${groupName}</b> has been sent`;
};

export const JoinGroupButtonHandler = (e) => {
  const joinGroupBtn = e.target.closest('.btn-join');
  if (!joinGroupBtn) return;
  handleJoinGroupClick(joinGroupBtn);
};
