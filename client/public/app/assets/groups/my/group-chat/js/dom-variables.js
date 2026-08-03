import { t } from "../../../../../../main_assets/js/i18n.js";
import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  MAX_MEMBERS,
  MIN_MEMBERS,
  NAME_TITLE_MAX_LENGTH,
  NAME_TITLE_MIN_LENGTH,
} from "../../../../global/js/variables.js";
import { createShowInSearchLabel } from "../../../../shared/forms/js/utils.js";

export let groupLeftSideBar,
  showInfoBtn,
  groupLeftSideBarContent,
  groupLeftSideBarTitle,
  groupInfoElementsMap,
  membersListMenuBtn,
  sessionInfoMenuBtn,
  quizzesListMenuBtn,
  removeGroupMenuBtn,
  leaveGroupBtn,
  manageDemanesMenuBtn,
  leaveGroupMenuBtn,
  copyUIDMenuBtn,
  createSessionBtn,
  joinSessionBtn,
  endSessionBtn,
  addMembersMenuBtn,
  drawerSection,
  actionsList,
  leaveSessionBtn,
  groupInfoMenuBtn;

groupInfoElementsMap = {
  "group-name-info-box": {
    getEditMode: (value) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
            <div class="action-btns">
            <button
              type="button"
              data-tooltip="${t("common:modals.save")}"
              class="exclude-btn save-btn action-btn has-tooltip should-fill"
            >
              <i class="bi bi-floppy"></i>
            </button>
            <button
              type="button"
              data-tooltip="${t("common:modals.cancel")}"
              class="exclude-btn cancel-btn action-btn has-tooltip"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div
            class="group-name-container info-container info-edit-wrapper"
          >
            <label for="group-name-input" class="label">
              <span class="group-info-icon icon-box">
                <i class="bi bi-people-fill"></i>
                <i class="bi bi-info-circle"></i>
              </span>
              ${t("common:quiz_card.group_name")}
            </label>
            <input
            name="name"
            id="group-name-input"
              type="text"
              class="group-name-value value"
              minlength="${NAME_TITLE_MIN_LENGTH}"
              maxlength="${NAME_TITLE_MAX_LENGTH}"
            />
          </div>
          `;
      const input = wrapper.querySelector("#group-name-input");
      input.setAttribute("value", value);
      return wrapper.innerHTML;
    },
    getViewMode: (value) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
            <button type="button" class="exclude-btn edit-btn action-btn should-fill">
              <i class="bi bi-pencil"></i>
              ${t("common:shared_terms.edit")}
            </button>
            <div class="group-name-container info-container">
              <span class="label" id="group-name-label-view">
                <span class="group-info-icon icon-box">
                  <i class="bi bi-people-fill"></i>
                  <i class="bi bi-info-circle"></i>
                </span>
                ${t("common:quiz_card.group_name")}
              </span>
              <span class="group-name-value value content">
              </span>
            </div>
          `;
      const content = wrapper.querySelector(".group-name-value.content");
      content.textContent = value;
      return wrapper.innerHTML;
    },
  },

  "group-description-info-box": {
    getEditMode: (value) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
            <div class="action-btns">
            <button
              type="button"
              data-tooltip="${t("common:modals.save")}"
              class="exclude-btn save-btn action-btn has-tooltip should-fill"
            >
              <i class="bi bi-floppy"></i>
            </button>
            <button
              type="button"
              data-tooltip="${t("common:modals.cancel")}"
              class="exclude-btn cancel-btn action-btn has-tooltip"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div
            class="group-description-container info-container info-edit-wrapper"
          >
            <label class="label" for="group-description-input">
              <span class="group-info-icon icon-box">
                <i class="bi bi-people-fill"></i>
                <i class="bi bi-info-circle"></i>
              </span>
              ${t("group-chat:info.group_description")}
            </label>
            <textarea
            name="description"
              id="group-description-input"
              maxlength="${DESCRIPTION_MAX_LENGTH}"
              minlength="${DESCRIPTION_MIN_LENGTH}"
              type="text"
              class="group-description-value value"
              rows="3"></textarea>
          </div>
          `;
      const textarea = wrapper.querySelector("#group-description-input");
      textarea.textContent = value;
      return wrapper.innerHTML;
    },
    getViewMode: (value) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
            <button type="button" class="exclude-btn edit-btn action-btn should-fill">
              <i class="bi bi-pencil"></i>
              ${t("common:shared_terms.edit")}
            </button>
            <div class="group-description-container info-container">
              <span class="label">
                <span class="group-description-icon icon-box">
                  <i class="bi bi-people-fill"></i>
                  <i class="bi bi-info-circle"></i>
                </span>
                ${t("group-chat:info.group_description")}
              </span>
              <p data-tooltip="" class="group-description-value value has-tooltip"></p>
            </div>
          `;
      const p = wrapper.querySelector(".group-description-value");
      p.textContent = value;
      p.setAttribute("data-tooltip", value);
      return wrapper.innerHTML;
    },
  },

  "subject-info-box": {
    getEditMode: (value) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
            <div class="action-btns">
            <button
              type="button"
              data-tooltip="${t("common:modals.save")}"
              class="exclude-btn save-btn action-btn has-tooltip should-fill"
            >
              <i class="bi bi-floppy"></i>
            </button>
            <button
              type="button"
              data-tooltip="${t("common:modals.cancel")}"
              class="exclude-btn cancel-btn action-btn has-tooltip"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="subject-container info-container info-edit-wrapper">
            <span class="label" for="subject-input">
              <span class="subject-icon icon-box">
                <i class="bi bi-journal-text"></i>
              </span>
              ${t("common:quiz_card.subject")}
            </span>
            <div class="select-trigger input">
              <button type="button" class="exclude-btn open-drop-down-btn" id="subject-input">
                <span name="subject" class="subject-value value"></span>
                <i class="bi bi-chevron-down"></i>
              </button>
              <div class="select-menu group-subject-select-menu drop-down-menu overlay">
              </div>
            </div>
          </div>
          `;
      const span = wrapper.querySelector(".subject-value.value");
      span.textContent = t(`common:subjects.${value}`, { defaultValue: value });
      span.setAttribute("data-value", value);
      return wrapper.innerHTML;
    },
    getViewMode: (value) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
            <button type="button" class="exclude-btn edit-btn action-btn should-fill">
              <i class="bi bi-pencil"></i>
              ${t("common:shared_terms.edit")}
            </button>
            <div class="subject-container info-container">
              <span class="label" >
                <span class="subject-icon icon-box">
                  <i class="bi bi-journal-text"></i>
                </span>
                ${t("common:quiz_card.subject")}
              </span>
              <span class="subject-value value content"></span>
            </div>
          `;
      const content = wrapper.querySelector(".subject-value.content");
      content.textContent = t(`common:subjects.${value}`, { defaultValue: value });
      return wrapper.innerHTML;
    },
  },

  "level-info-box": {
    getEditMode: (value) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
            <div class="action-btns">
              <button
                type="button"
                data-tooltip="${t("common:modals.save")}"
                class="exclude-btn save-btn action-btn has-tooltip should-fill"
              >
                <i class="bi bi-floppy"></i>
              </button>
              <button
                type="button"
                data-tooltip="${t("common:modals.cancel")}"
                class="exclude-btn cancel-btn action-btn has-tooltip"
              >
                <i class="bi bi-x-lg"></i>
              </button>
            </div>
            <div class="level-container info-container info-edit-wrapper">
              <label class="label" for="level">
                <span class="level-icon icon-box">
                  <i class="bi bi-graph-up"></i>
                </span>
                ${t("common:filters.level")}
              </label>
              <button
                type="button"
                data-tooltip=""
                class="exclude-btn switch-btn action-btn has-tooltip"
                id="level"
              >
                <i class="bi bi-arrow-left-right"></i>
              </button>
              <span name="level" data-value="" class="level-input input value content"></span>
            </div>
          </div>
          `;
      const span = wrapper.querySelector(".level-input");
      span.textContent = t(`common:forms.levels.${value}`, {
        defaultValue: value,
      });
      span.setAttribute("data-value", value);
      return wrapper.innerHTML;
    },
    getViewMode: (value) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
           <button type="button" class="exclude-btn edit-btn action-btn should-fill">
              <i class="bi bi-pencil"></i>
              ${t("common:shared_terms.edit")}
            </button>
            <div class="level-container info-container">
              <span class="label">
                <span class="level-icon icon-box">
                  <i class="bi bi-graph-up"></i>
                </span>
                ${t("common:filters.level")}
              </span>
              <span class="level-value value content"></span>
            </div>
          `;
      const content = wrapper.querySelector(".level-value.content");
      content.textContent = t(`common:forms.levels.${value}`, {
        defaultValue: value,
      });
      return wrapper.innerHTML;
    },
  },

  "visibility-info-box": {
    getEditMode: (value, showInSearchInput) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
            <div class="action-btns">
            <button
              type="button"
              data-tooltip="${t("common:modals.save")}"
              class="exclude-btn save-btn action-btn has-tooltip should-fill"
            >
              <i class="bi bi-floppy"></i>
            </button>
            <button
              type="button"
              data-tooltip="${t("common:modals.cancel")}"
              class="exclude-btn cancel-btn action-btn has-tooltip"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div
            class="visibility-container info-container info-edit-wrapper"
          >
            <label class="label" for="visibility">
              <span class="visibility-icon icon-box">
                <i class="bi bi-eye-fill"></i>
              </span>
              ${t("common:filters.visibility")}
            </label>
            <button
              type="button"
              data-tooltip=""
              class="exclude-btn switch-btn action-btn has-tooltip"
              id="visibility"
            >
              <i class="bi bi-arrow-left-right"></i>
            </button>
            <span name="visibility" data-value="" class="visibility-input input value content">
            </span>
          </div>
          `;
      const span = wrapper.querySelector(".visibility-input");
      span.textContent = t(`common:forms.visibility.${value}`, {
        defaultValue: value,
      });
      span.setAttribute("data-value", value);
      if (value === "Private") {
        const label = createShowInSearchLabel(showInSearchInput);
        wrapper.appendChild(label);
      }
      return wrapper.innerHTML;
    },
    getViewMode: (value, showInSearchInput) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
            <button type="button" class="exclude-btn edit-btn action-btn should-fill">
              <i class="bi bi-pencil"></i>
              ${t("common:shared_terms.edit")}
            </button>
            <div class="visibility-container info-container">
              <span class="label" id="visibility-label-view">
                <span class="visibility-icon icon-box">
                  <i class="bi bi-eye-fill"></i>
                </span>
                ${t("common:filters.visibility")}
              </span>
              <span class="visibility-value value content"></span>
            </div>
          `;
      const content = wrapper.querySelector(".visibility-value.content");
      content.textContent = t(`common:forms.visibility.${value}`, {
        defaultValue: value,
      });
      if (value === "Private") {
        const label = createShowInSearchLabel(showInSearchInput, true);
        wrapper.appendChild(label);
      }
      return wrapper.innerHTML;
    },
  },

  "max-members-info-box": {
    getEditMode: (value) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
            <div class="action-btns">
            <button
              type="button"
              data-tooltip="${t("common:modals.save")}"
              class="exclude-btn save-btn action-btn has-tooltip should-fill"
            >
              <i class="bi bi-floppy"></i>
            </button>
            <button
              type="button"
              data-tooltip="${t("common:modals.cancel")}"
              class="exclude-btn cancel-btn action-btn has-tooltip"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div
            class="group-name-container info-container info-edit-wrapper"
          >
            <label class="label" for="max-members-input">
              <span class="group-info-icon icon-box">
                <i class="bi bi-people-fill"></i>
                <i class="bi bi-info-circle"></i>
              </span>
              ${t("common:shared_terms.max_members")}
            </label>
            <input
            name="max-members"
              id="max-members-input"
              type="number"
              value=""
              min="${MIN_MEMBERS}"
              max="${MAX_MEMBERS}"
              class="max-members-value value"
            />
          </div>
          `;
      const input = wrapper.querySelector("#max-members-input");
      input.setAttribute("value", value);
      return wrapper.innerHTML;
    },
    getViewMode: (value) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = `
            <button type="button" class="exclude-btn edit-btn action-btn should-fill">
              <i class="bi bi-pencil"></i>
              ${t("common:shared_terms.edit")}
            </button>
            <div class="max-members-container info-container">
              <span class="label">
                <span class="max-members-icon icon-box">
                  <i class="bi bi-person-plus-fill"></i>
                </span>
                ${t("common:shared_terms.max_members")}
              </span>
              <span class="max-members-value value content"></span>
            </div>
          `;
      const content = wrapper.querySelector(".max-members-value.content");
      content.textContent = value;
      return wrapper.innerHTML;
    },
  },
};

export const initDomVariables = () => {
  quizzesListMenuBtn = document.querySelector(".quizzes-list-menu-btn");
  membersListMenuBtn = document.querySelector(".members-list-menu-btn");
  sessionInfoMenuBtn = document.querySelector(".session-info-menu-btn");
  removeGroupMenuBtn = document.querySelector(".remove-group-menu-btn");
  leaveGroupMenuBtn = document.querySelector(".leave-group-menu-btn");
  addMembersMenuBtn = document.querySelector(".add-members-menu-btn");
  groupInfoMenuBtn = document.querySelector(".group-info-menu-btn");
  manageDemanesMenuBtn = document.querySelector(".manage-demanes-menu-btn");
  copyUIDMenuBtn = document.querySelector(".copy-uid-menu-btn");
  groupLeftSideBar = document.querySelector(".group-left-side-bar");
  showInfoBtn = document.querySelector(".show-info-btn");
  createSessionBtn = document.querySelector(".create-session");
  groupLeftSideBarContent = document.querySelector(".left-side-bar-content");
  groupLeftSideBarTitle = groupLeftSideBar.querySelector(".side-bar-title");
  drawerSection = document.querySelector(".mobile-group-chat-actions");
  actionsList = document.getElementById("mobile-drawer-group-actions-list");
};
