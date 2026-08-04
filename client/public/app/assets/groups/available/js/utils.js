import {
  handleApiAction,
  showConfirmationBox,
  showMessageBlock,
  t
} from "../../../global/js/utils.js";

export const handleJoinGroupClick = async (joinGroupBtn) => {
  joinGroupBtn.disabled = true;

  const result = await showConfirmationBox(
    "confirmation",
    t("groups:modals.join_group_title"),
    t("groups:modals.join_group_desc"),
    t("common:modals.cancel"),
    t("common:shared_terms.join"),
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
          joinGroupBtn,
        );
      },
    },
  );
};

const getResultElement = (status, groupId) => {
  return status === "joined"
    ? `<a href="/app/groups/my/${groupId}/chat" class="view-group-link">
                             <i class="bi bi-box-arrow-right"></i><span>${t("groups:actions.view_group")}</span>
                     </a>`
    : `<span class="pending-text"><i class="bi bi-hourglass-split"></i>${t("common:shared_terms.pending")}</span>`;
};

const getSuccessMessage = (status, groupName) => {
  const cover = document.createElement("div");
  cover.innerHTML =
    status === "joined"
      ? t("groups:alerts.joined_group_success_html")
      : t("groups:alerts.join_request_sent_html");

  cover.querySelector("b").textContent = groupName;
  return cover.innerHTML;
};

export const JoinGroupButtonHandler = (e) => {
  const joinGroupBtn = e.target.closest(".btn-join");
  if (!joinGroupBtn) return;
  handleJoinGroupClick(joinGroupBtn);
};
