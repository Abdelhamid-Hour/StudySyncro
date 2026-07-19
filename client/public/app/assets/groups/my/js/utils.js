import {
  fetchData,
  sendData,
  showMessageBlock,
  isNativeDomainCondition,
} from "../../../../../main_assets/js/utils.js";
import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  globalTooltip,
  MAX_MEMBERS,
  MIN_MEMBERS,
  NAME_TITLE_MAX_LENGTH,
  NAME_TITLE_MIN_LENGTH,
} from "../../../global/js/variables.js";
import {
  openOverlayModal,
  resetTooltip,
  showErrorTooltip,
  navigateTo,
  updateMain,
  getLoader,
} from "../../../global/js/utils.js";
import {
  levelValues,
  visibilityValues,
} from "../../../shared/forms/js/dom-variables.js";
import {
  countCharsTextarea,
  handleFormSubmit,
  setUpSelectMenu,
  setUpSwitchBtn,
} from "../../../shared/forms/js/utils.js";
import { groupCreateBtn } from "./dom-variables.js";

export const getGroupOverlay = () => `
<div class="create-group-overlay overlay-model">
    <header>
        <h3>Create New Group</h3>
        <button type="button" class="exclude-btn close-group-overlay">
            <i class="bi bi-x-lg"></i>
        </button>
    </header>
    <div class="create-group-form">
        <form novalidate autocomplete="off" id="create-group-form">
            <div class="field-container group-name-field">
                <div class="field-icon-container">
                    <span class="icon-box">
                        <i class="bi bi-people"></i>
                        <i class="bi bi-info-circle"></i>
                    </span>
                </div>
                <input
                    type="text"
                    id="group-name"
                    name="group-name"
                    minlength="${NAME_TITLE_MIN_LENGTH}"
                    maxlength="${NAME_TITLE_MAX_LENGTH}"
                    class="input"
                    placeholder="Group Name"
                />
            </div>
            <div class="field-container group-description-field">
                <div class="field-icon-container">
                    <span class="icon-box">
                        <i class="bi bi-people"></i>
                        <i class="bi bi-info-circle"></i>
                    </span>
                </div>
                <textarea
                    
                    id="group-description"
                    name="group-description"
                    class="input"
                    maxlength="${DESCRIPTION_MAX_LENGTH}"
                    minlength="${DESCRIPTION_MIN_LENGTH}"
                    placeholder="Describe your group (e.g. purpose, topics, goals)"
                ></textarea>
                <span class="chars-limit">0/${DESCRIPTION_MAX_LENGTH}</span>
            </div>
            <div class="dual-container">
                <div class="field-container group-subject-field">
                    <div class="field-icon-container">
                        <i class="bi bi-journal-text"></i>
                    </div>
                    <div class="select-trigger input">
                        <button type="button" class="exclude-btn open-drop-down-btn">
                            <span class="subject-value">Subject</span>
                            <input type="hidden" name="subject" value="" />
                            <i class="bi bi-chevron-down"></i>
                        </button>
                        <div
                            class="select-menu group-subject-select-menu drop-down-menu overlay"
                        ></div>
                    </div>
                </div>
                <div class="field-container group-level-field">
                    <div class="field-icon-container">
                        <i class="bi bi-graph-up"></i>
                    </div>
                    <span class="level-input input">Beginner</span>
                    <input type="hidden" name="level" value="Beginner" />
                    <button
                        type="button"
                        data-tooltip=""
                        class="exclude-btn switch-btn has-tooltip"
                    >
                        <i class="bi bi-arrow-left-right"></i>
                    </button>
                </div>
            </div>
            <div class="dual-container">
                <div class="field-container group-max-members-field">
                    <div class="field-icon-container">
                        <i class="bi bi-lock"></i>
                    </div>
                    <input
                        
                        type="number"
                        class="input"
                        placeholder="Max Members"
                        name="max-members"
                    />
                </div>
                <div class="field-container group-visibility-field">
                    <div class="field-icon-container">
                        <i class="bi bi-eye"></i>
                    </div>
                        <span class="visibility-input input">Public</span>
                    <input type="hidden" name="visibility" value="Public" />
                    <button
                        type="button"
                        data-tooltip=""
                        class="exclude-btn switch-btn has-tooltip"
                    >
                        <i class="bi bi-arrow-left-right"></i>
                    </button>
                </div>
            </div>
            <button type="submit" class="blue-btn create-btn">Create</button>
        </form>
    </div>
</div>
`;

const chechGroupValues = (inputs) => {
  const { groupName, description, subject, level, maxMembers, visibility } =
    inputs;
  const groupNameValue = groupName?.value ?? "";
  const descriptionValue = description?.value ?? "";
  const subjectValue = subject?.value ?? "";
  const levelValue = level?.value ?? "";
  const maxMembersValue = maxMembers?.value ?? "";
  const visibilityValue = visibility?.value ?? "";
  if (!groupNameValue.trim()) {
    showErrorTooltip("Group name is required.", groupName);
    return false;
  } else if (
    groupNameValue.length < NAME_TITLE_MIN_LENGTH ||
    groupNameValue.length > NAME_TITLE_MAX_LENGTH
  ) {
    showErrorTooltip(
      `Group name must be between ${NAME_TITLE_MIN_LENGTH} and ${NAME_TITLE_MAX_LENGTH} characters.`,
      groupName
    );
    return false;
  } else {
    resetTooltip(globalTooltip, groupName.closest(".field-container"));
  }

  if (!descriptionValue.trim()) {
    showErrorTooltip("Description is required.", description);
    return false;
  } else if (
    descriptionValue.length < DESCRIPTION_MIN_LENGTH ||
    descriptionValue.length > DESCRIPTION_MAX_LENGTH
  ) {
    showErrorTooltip(
      `Description must be between ${DESCRIPTION_MIN_LENGTH} and ${DESCRIPTION_MAX_LENGTH} characters.`,
      description
    );
    return false;
  } else {
    resetTooltip(globalTooltip, description.closest(".field-container"));
  }

  if (!subjectValue.trim()) {
    showErrorTooltip("Subject is required.", subject);
    return false;
  } else {
    resetTooltip(globalTooltip, subject.closest(".field-container"));
  }

  if (!levelValues.includes(levelValue)) {
    showErrorTooltip("Level is not valid.", level);
    return false;
  } else {
    resetTooltip(globalTooltip, level.closest(".field-container"));
  }

  if (
    isNaN(Number(maxMembersValue)) ||
    Number(maxMembersValue) < 2 ||
    Number(maxMembersValue) > 1000
  ) {
    showErrorTooltip(
      `Max members must be a number between ${MIN_MEMBERS} and ${MAX_MEMBERS}.`,
      maxMembers
    );
    return false;
  } else {
    resetTooltip(globalTooltip, maxMembers.closest(".field-container"));
  }

  if (!visibilityValues.includes(visibilityValue)) {
    showErrorTooltip("Visibility is not valid.", visibility);
    return false;
  } else {
    resetTooltip(globalTooltip, visibility.closest(".field-container"));
  }
  return true;
};

export const handleGroupCreateClick = () => {
  openOverlayModal(
    "create-group-overlay",
    [".close-group-overlay"],
    getGroupOverlay,
    setUpGroupOverlay
  );
};

const setUpGroupOverlay = (backdropElement) => {
  setUpSelectMenu(backdropElement.querySelector(".group-subject-field"));
  const visibilityField = backdropElement.querySelector(
    ".group-visibility-field"
  );
  const levelField = backdropElement.querySelector(".group-level-field");
  setUpSwitchBtn(visibilityField);
  setUpSwitchBtn(levelField);
  initGroupForm();
};

const handleCreateGroupSubmit = async (groupData, form, createBtn) => {
  if (form.isCreating) return;
  try {
    form.isCreating = true;
    createBtn.disabled = true;
    createBtn.innerHTML = getLoader();
    await sendData("/api/create-group", { groupData });
    showMessageBlock("Group created successfully", "success");
    navigateTo("/groups/my");
  } catch (error) {
    const isNative = error.isNative || error.data?.isNative || isNativeDomainCondition(error);
    const notifType = error.type || error.data?.type || (isNative ? "info" : "error");
    if (!isNative) console.error("Error: ", error);
    showMessageBlock(error.message, notifType);
  } finally {
    form.isCreating = false;
    createBtn.disabled = false;
    createBtn.innerHTML = "Create";
  }
  // ? its not necessary to reset the form here, as the overlay will be closed
};

export const initGroupForm = () => {
  const form = document.getElementById("create-group-form");
  const groupName = form.querySelector(".group-name-field input");
  const description = form.querySelector(".group-description-field textarea");
  const subject = form.querySelector(".group-subject-field input");
  const level = form.querySelector(".group-level-field input");
  const maxMembers = form.querySelector(".group-max-members-field input");
  const visibility = form.querySelector(".group-visibility-field input");
  const createBtn = form.querySelector(".create-btn");

  description.addEventListener("input", countCharsTextarea);

  handleFormSubmit(
    form,
    () =>
      chechGroupValues({
        groupName,
        description,
        subject,
        level,
        maxMembers,
        visibility,
      }),
    (groupData) => handleCreateGroupSubmit(groupData, form, createBtn)
  );
};
