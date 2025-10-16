import {
  showMessageBlock,
  sendData,
} from "../../../../../main_assets/js/utils.js";
import {
  getLoader,
  handleApiAction,
  showConfirmationBox,
} from "../../../global/js/utils.js";

export const handleJoinGroupClick = async (joinGroupBtn) => {
  joinGroupBtn.disabled = true;

  const result = await showConfirmationBox(
    "confirmation",
    "Join Group",
    "Are you sure you want to join this group?",
    "Cancel",
    "Join"
  );

  joinGroupBtn.disabled = false;

  if (!result) return;

  const groupCard = joinGroupBtn.closest(".group-card");
  const groupId = groupCard?.dataset.id;
  const groupName = groupCard.querySelector(".group-name").textContent;
  const groupFooter = groupCard.querySelector(".group-footer");
  handleApiAction(
    "/join-group",
    {
      groupId,
    },
    joinGroupBtn,
    {
      onSuccess: (data) => {
        const successMessage = getSuccessMessage(data.status, groupName);
        showMessageBlock(successMessage, "success");
        const resultElement = getResultElement(data.status, groupId);
        groupFooter.replaceChild(
          document.createRange().createContextualFragment(resultElement),
          joinGroupBtn
        );
      },
    }
  );
};

const createLoaderDiv = () => {
  const loaderDiv = document.createElement("div");
  loaderDiv.className = "loader-container";
  loaderDiv.innerHTML = getLoader();
  return loaderDiv;
};

const getResultElement = (status, groupId) => {
  return status === "joined"
    ? `<a href="/app/groups/my/${groupId}/chat" class="view-group-link">
                             <i class="bi bi-box-arrow-right"></i><span>View Group</span>
                     </a>`
    : '<span class="pending-text"><i class="bi bi-hourglass-split"></i>Pending</span>';
};

const getSuccessMessage = (status, groupName) => {
  const cover = document.createElement("div");
  cover.innerHTML =
    status === "joined"
      ? `You’ve successfully joined Group <b></b>`
      : `Your request to join Group <b></b> has been sent`;

  cover.querySelector("b").textContent = groupName;
  return cover.innerHTML;
};

export const JoinGroupButtonHandler = (e) => {
  const joinGroupBtn = e.target.closest(".btn-join");
  if (!joinGroupBtn) return;
  handleJoinGroupClick(joinGroupBtn);
};
