export let groupLeftSideBar,
  showInfoBtn,
  groupLeftSideBarContent,
  visibilityValues,
  levelValues,
  maxMembersLimit,
  groupLeftSideBarTitle,
  groupInfoElementsMap,
  subjectMenuObject,
  membersListMenuBtn,
  sessionInfoMenuBtn,
  quizzesListMenuBtn,
  removeGroupBtn,
  manageDemanesMenuBtn,
  leaveGroupMenuBtn,
  copyUIDMenuBtn,
  groupInfoMenuBtn;

visibilityValues = ['Private', 'Public'];
levelValues = ['Beginner', 'Intermediate', 'Advanced'];
maxMembersLimit = 1000;
groupInfoElementsMap = {
  'group-name-info-box': {
    getEditMode: (value) => `<div class="action-btns">
                    <button
                      type="button"
                      data-tooltip="Save"
                      class="exclude-btn save-btn action-btn has-tooltip should-fill"
                    >
                      <i class="bi bi-floppy"></i>
                    </button>
                    <button
                      type="button"
                      data-tooltip="Cancell"
                      class="exclude-btn cancell-btn action-btn has-tooltip"
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
                      Group Name
                    </label>
                    <input
                    id="group-name-input"
                      type="text"
                      value="${value}"
                      class="group-name-value value"
                    />
                  </div>`,
    getViewMode: (
      value
    ) => `<button type="button" class="exclude-btn edit-btn action-btn should-fill">
                    <i class="bi bi-pencil"></i>
                    Edit
                  </button>
                  <div class="group-name-container info-container">
                    <span class="label" id="group-name-label-view">
                      <span class="group-info-icon icon-box">
                        <i class="bi bi-people-fill"></i>
                        <i class="bi bi-info-circle"></i>
                      </span>
                      Group Name
                    </span>
                    <span class="group-name-value value content">
                    ${value}
                    </span>
                  </div>`,
  },
  'group-description-info-box': {
    getEditMode: (value) => `<div class="action-btns">
                    <button
                      type="button"
                      data-tooltip="Save"
                      class="exclude-btn save-btn action-btn has-tooltip should-fill"
                    >
                      <i class="bi bi-floppy"></i>
                    </button>
                    <button
                      type="button"
                      data-tooltip="Cancell"
                      class="exclude-btn cancell-btn action-btn has-tooltip"
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
                      Group Description
                    </label>
                    <textarea
                      id="group-description-input"
                      type="text"
                      class="group-description-value value"
                      rows="3">${value}</textarea>
                  </div>`,
    getViewMode: (
      value
    ) => `<button type="button" class="exclude-btn edit-btn action-btn should-fill">
                    <i class="bi bi-pencil"></i>
                    Edit
                  </button>
                  <div class="group-description-container info-container">
                    <span class="label">
                      <span class="group-description-icon icon-box">
                        <i class="bi bi-people-fill"></i>
                        <i class="bi bi-info-circle"></i>
                      </span>
                      Group Description
                    </span>
                    <p data-tooltip="${value}" class="group-description-value value has-tooltip">${value}</p>
                  </div>`,
  },
  'subject-info-box': {
    getEditMode: (value) => `<div class="action-btns">
                      <button
                        type="button"
                        data-tooltip="Save"
                        class="exclude-btn save-btn action-btn has-tooltip should-fill"
                      >
                        <i class="bi bi-floppy"></i>
                      </button>
                      <button
                        type="button"
                        data-tooltip="Cancell"
                        class="exclude-btn cancell-btn action-btn has-tooltip"
                      >
                        <i class="bi bi-x-lg"></i>
                      </button>
                    </div>
                    <div class="subject-container info-container info-edit-wrapper">
                      <span class="label" for="subject-input">
                        <span class="subject-icon icon-box">
                          <i class="bi bi-journal-text"></i>
                        </span>
                        Subject
                      </span>
                      <div class="select-trigger input">
                        <button type="button" class="exclude-btn open-select-btn" id="subject-input">
                          <span data-value="${value}" class="subject-value value">${value}</span>
                          <i class="bi bi-chevron-down"></i>
                        </button>
                      </div>
                      <div class="select-menu group-subject-select-menu drop-down-menu overlay">
                      </div>
                    </div>`,
    getViewMode: (
      value
    ) => `<button type="button" class="exclude-btn edit-btn action-btn should-fill">
                      <i class="bi bi-pencil"></i>
                      Edit
                    </button>
                    <div class="subject-container info-container">
                      <span class="label" >
                        <span class="subject-icon icon-box">
                          <i class="bi bi-journal-text"></i>
                        </span>
                        Subject
                      </span>
                      <span class="subject-value value content">${value}</span>
                    </div>`,
  },
  'level-info-box': {
    getEditMode: (value) => `<div class="action-btns">
                      <button
                        type="button"
                        data-tooltip="Save"
                        class="exclude-btn save-btn action-btn has-tooltip should-fill"
                      >
                        <i class="bi bi-floppy"></i>
                      </button>
                      <button
                        type="button"
                        data-tooltip="Cancell"
                        class="exclude-btn cancell-btn action-btn has-tooltip"
                      >
                        <i class="bi bi-x-lg"></i>
                      </button>
                    </div>
                    <div class="level-container info-container info-edit-wrapper">
                      <label class="label" for="level">
                        <span class="level-icon icon-box">
                          <i class="bi bi-graph-up"></i>
                        </span>
                        Level
                      </label>
                      <button
                        type="button"
                        data-tooltip=""
                        class="exclude-btn switch-btn action-btn has-tooltip"
                        id="level"
                      >
                        <i class="bi bi-arrow-left-right"></i>
                      </button>
                      <span data-value="${value}" class="level-input input value content">${value}</span>
                    </div>
                  </div>`,
    getViewMode: (
      value
    ) => `<button type="button" class="exclude-btn edit-btn action-btn should-fill">
                      <i class="bi bi-pencil"></i>
                      Edit
                    </button>
                    <div class="level-container info-container">
                      <span class="label">
                        <span class="level-icon icon-box">
                          <i class="bi bi-graph-up"></i>
                        </span>
                        Level
                      </span>
                      <span class="level-value value content">${value}</span>
                    </div>`,
  },
  'visibility-info-box': {
    getEditMode: (value, showInSearchInput) => `<div class="action-btns">
                      <button
                        type="button"
                        data-tooltip="Save"
                        class="exclude-btn save-btn action-btn has-tooltip should-fill"
                      >
                        <i class="bi bi-floppy"></i>
                      </button>
                      <button
                        type="button"
                        data-tooltip="Cancell"
                        class="exclude-btn cancell-btn action-btn has-tooltip"
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
                        Visibility
                      </label>
                      <button
                        type="button"
                        data-tooltip=""
                        class="exclude-btn switch-btn action-btn has-tooltip"
                        id="visibility"
                      >
                        <i class="bi bi-arrow-left-right"></i>
                      </button>
                      <span data-value="${value}" class="visibility-input input value content">${value}
                      </span>
                    </div>
                    ${
                      value === 'Private'
                        ? `<label class="show-in-search-label container" id="show-in-search-label-view" for="show-in-search">
                      <input type="checkbox" id="show-in-search" ${
                        showInSearchInput ? 'checked' : ''
                      }>
                       <svg viewBox="0 0 64 64" height="2em" width="2em">
                        <path d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16" pathLength="575.0541381835938" class="path"></path>
                      </svg>
                      Show in Search Results
                    </label>`
                        : ''
                    }`,
    getViewMode: (
      value,
      showInSearchInput
    ) => `<button type="button" class="exclude-btn edit-btn action-btn should-fill">
                      <i class="bi bi-pencil"></i>
                      Edit
                    </button>
                    <div class="visibility-container info-container">
                      <span class="label" id="visibility-label-view">
                        <span class="visibility-icon icon-box">
                          <i class="bi bi-eye-fill"></i>
                        </span>
                        Visibility
                      </span>
                      <span class="visibility-value value content">${value}</span>
                    </div>
                    ${
                      value === 'Private'
                        ? `<label class="show-in-search-label container" id="show-in-search-label-view" for="show-in-search">
                      <input type="checkbox" id="show-in-search" ${
                        showInSearchInput ? 'checked' : ''
                      } disabled>
                       <svg viewBox="0 0 64 64" height="2em" width="2em">
                        <path d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16" pathLength="575.0541381835938" class="path"></path>
                      </svg>
                      Show in Search Results
                    </label>`
                        : ''
                    }`,
  },
  'max-members-info-box': {
    getEditMode: (value) => `<div class="action-btns">
                      <button
                        type="button"
                        data-tooltip="Save"
                        class="exclude-btn save-btn action-btn has-tooltip should-fill"
                      >
                        <i class="bi bi-floppy"></i>
                      </button>
                      <button
                        type="button"
                        data-tooltip="Cancell"
                        class="exclude-btn cancell-btn action-btn has-tooltip"
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
                        Max Members
                      </label>
                      <input
                        id="max-members-input"
                        type="number"
                        value="${value}"
                        min="1"
                        max="200"
                        class="max-members-value value"
                      />
                    </div>`,
    getViewMode: (
      value
    ) => ` <button type="button" class="exclude-btn edit-btn action-btn should-fill">
                      <i class="bi bi-pencil"></i>
                      Edit
                    </button>
                    <div class="max-members-container info-container">
                      <span class="label">
                        <span class="max-members-icon icon-box">
                          <i class="bi bi-person-plus-fill"></i>
                        </span>
                        Max Members
                      </span>
                      <span class="max-members-value value content">${value}</span>
                    </div>`,
  },
};
subjectMenuObject = {
  'Fundamental Sciences': [
    'Mathematics',
    'Linear Algebra',
    'Real Analysis',
    'Complex Analysis',
    'Topology',
    'General Physics',
    'Classical Mechanics',
    'Thermodynamics',
    'Electromagnetism',
    'Optics',
    'General Chemistry',
    'Organic Chemistry',
    'Inorganic Chemistry',
    'Cell Biology',
    'Genetics',
    'Ecology',
    'Earth and Life Sciences',
    'Environmental Science',
    'Statistics',
    'Probability',
  ],
  'Computer Science & Engineering': [
    'General Computer Science',
    'Imperative Programming',
    'Object-Oriented Programming',
    'Algorithms',
    'Data Structures',
    'Databases',
    'Operating Systems',
    'Computer Networks',
    'Information Security',
    'Cybersecurity',
    'Artificial Intelligence',
    'Machine Learning',
    'Data Science',
    'Big Data',
    'Internet of Things (IoT)',
    'Robotics',
    'Control Systems',
    'Electronics',
    'Mechanics',
    'Civil Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'JavaScript',
    'Node.js',
    'HTML & CSS',
    'Front-end Frameworks (React, Vue, Angular)',
    'DevOps',
    'Docker & Kubernetes',
  ],
  'Humanities & Social Sciences': [
    'Ancient History',
    'Medieval History',
    'Modern History',
    'Contemporary History',
    'Physical Geography',
    'Human Geography',
    'Economics',
    'Microeconomics',
    'Macroeconomics',
    'Sociology',
    'Anthropology',
    'Psychology',
    'Political Science',
    'Philosophy',
    'Constitutional Law',
    'Civil Law',
    'Criminal Law',
    'International Relations',
    'Gender Studies',
    'Pedagogy',
    'Education Sciences',
  ],
  'Languages & Literature': [
    'French',
    'French Literature',
    'Comparative Literature',
    'English',
    'English Literature',
    'Spanish',
    'German',
    'Italian',
    'Arabic',
    'Chinese',
    'Russian',
    'Latin',
    'Ancient Greek',
    'Translation',
    'Linguistics',
    'Phonetics',
    'Semiotics',
  ],
  'Arts & Culture': [
    'Visual Arts',
    'Drawing',
    'Painting',
    'Sculpture',
    'Art History',
    'Photography',
    'Cinema',
    'Theater',
    'Dance',
    'Music',
    'Music Composition',
    'Instrumental Practice',
    'Digital Arts',
    'Graphic Design',
    'Architecture',
    'Cultural Studies',
  ],
  'Education & Sports': [
    'Physical Education (PE)',
    'Exercise Science',
    'Kinesiology',
    'Sports Nutrition',
    'Pedagogy',
    'Didactics',
    'Education Sciences',
    'Psychoeducation',
    'Academic Counseling',
    'Special Education',
  ],
  'Business & Management': [
    'Management',
    'Accounting',
    'Finance',
    'Marketing',
    'Business Management',
    'Entrepreneurship',
    'International Business',
    'Corporate Strategy',
    'Human Resources',
    'Audit',
    'Management Control',
    'Logistics',
    'Supply Chain Management',
    'Behavioral Economics',
  ],
  'Health & Life Sciences': [
    'Anatomy',
    'Physiology',
    'Biotechnology',
    'Pharmacy',
    'Nursing',
    'Nutrition',
    'Microbiology',
    'Immunology',
    'Pathology',
    'Psychiatry',
    'Public Health',
    'Epidemiology',
    'Dentistry',
    'Physical Therapy',
  ],
  'Specialties & Interdisciplinary': [
    'Sustainable Development',
    'Renewable Energy',
    'Smart Cities',
    'Gender Studies',
    'International Relations',
    'Environmental Studies',
    'Neuroscience',
    'Bioinformatics',
    'Cognitive Science',
    'Social Innovation',
    'Design Thinking',
    'Urban Planning',
    'Biomedical Engineering',
  ],
  Other: ['Specify and press Enter'],
};
export const initDomVariables = () => {
  quizzesListMenuBtn = document.querySelector('.quizzes-list-menu-btn');
  membersListMenuBtn = document.querySelector('.members-list-menu-btn');
  sessionInfoMenuBtn = document.querySelector('.session-info-menu-btn');
  groupInfoMenuBtn = document.querySelector('.group-info-menu-btn');
  manageDemanesMenuBtn = document.querySelector('.manage-demanes-menu-btn');
  removeGroupBtn = document.querySelector('.remove-group-menu-btn');
  copyUIDMenuBtn = document.querySelector('.copy-uid-menu-btn');
  leaveGroupMenuBtn = document.querySelector('.leave-group-menu-btn');
  groupLeftSideBar = document.querySelector('.group-left-side-bar');
  showInfoBtn = document.querySelector('.show-info-btn');
  groupLeftSideBarContent = document.querySelector('.left-side-bar-content');
  groupLeftSideBarTitle = groupLeftSideBar.querySelector('.side-bar-title');
};
