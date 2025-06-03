export let editorQuestionsList,
  panelAddQuestionBtn,
  questionsPanelList,
  saveQuizBtn,
  editSubjectBtn,
  editTitleBtn,
  saveSubjectBtn,
  editorHeader,
  sidebarTitleLink,
  saveTitleBtn;

export const metaInfoEl = {
  subject: {
    getEditMode: (value) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'container';
      wrapper.innerHTML = `<div class="select-trigger input">
            <button type="button" class="exclude-btn open-drop-down-btn">
              <span class="subject-value"></span>
              <input type="hidden" name="sebject" value="" />
              <i class="bi bi-chevron-down"></i>
            </button>
            <div class="select-menu drop-down-menu overlay"></div>
          </div>
          <button
            class="exclude-btn save-subject-btn has-tooltip"
            data-tooltip="Save"
            type="button"
          >
            <i class="bi bi-floppy"></i>
          </button>`;

      wrapper.querySelector('.subject-value').textContent = value;
      wrapper
        .querySelector('input[name="sebject"]')
        .setAttribute('value', value);
      return wrapper;
    },
    getViewMode: (value) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'container';
      wrapper.innerHTML = `<span class="subject-label label">
            <span class="icon-box">
              <i class="bi bi-book"></i>
            </span>
            Subject:
          </span>
          <span class="subject-value value"></span>
          <button
            class="exclude-btn edit-subject-btn has-tooltip"
            data-tooltip="Edit Subject"
            type="button"
          >
            <i class="bi bi-pencil-square"></i>
          </button>`;
      wrapper.querySelector('.subject-value').textContent = value;
      return wrapper;
    },
  },
  title: {
    getEditMode: (value) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'container';
      wrapper.innerHTML = `<input
          type="text"
          id="quiz-title-input"
          class="input"
          placeholder="Enter Quiz Title"
          value=""
        />
        <button
          class="exclude-btn save-title-btn has-tooltip"
          data-tooltip="Save"
          type="button"
        >
          <i class="bi bi-floppy"></i>
        </button>`;
      wrapper.querySelector('input').setAttribute('value', value);
      return wrapper;
    },
    getViewMode: (value) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'container';
      wrapper.innerHTML = `<h4 class="title-text"></h4>
          <button
            class="exclude-btn edit-title-btn has-tooltip"
            data-tooltip="Edit Title"
            type="button"
          >
            <i class="bi bi-pencil-square"></i>
          </button>`;
      wrapper.querySelector('.title-text').textContent = value;
      return wrapper;
    },
  },
};

export const initDomVariables = () => {
  editorQuestionsList = document.querySelector(
    '.question-editor-panel .questions-list'
  );

  questionsPanelList = document.querySelector(
    '.questions-panel .questions-list'
  );

  panelAddQuestionBtn = document.querySelector(
    '.questions-panel .add-question-btn'
  );

  sidebarTitleLink = document.querySelector('.sidebar-title a');

  editorHeader = document.querySelector('.editor-header');

  saveQuizBtn = document.querySelector('.save-quiz-btn');

  editSubjectBtn = document.querySelector('.edit-subject-btn');

  editTitleBtn = document.querySelector('.edit-title-btn');
};
