import {
  fetchData,
  sendData,
  showMessageBlock,
} from '../../../../../main_assets/js/utils.js';
import {
  CHOICE_TEXT_MAX_LENGTH,
  globalTooltip,
  QUESTION_TEXT_MAX_LENGTH,
  QUESTION_TEXT_MIN_LENGTH,
  hoverTooltip,
  NAME_TITLE_MAX_LENGTH,
  NAME_TITLE_MIN_LENGTH,
} from '../../../global/js/dom-variables.js';
import {
  getLoader,
  resetTooltip,
  scrollToView,
  showConfirmationBox,
  showErrorTooltip,
} from '../../../global/js/utils.js';
import { setUpSubjectSelectMenu } from '../../../shared/forms/js/utils.js';
import {
  editorQuestionsList,
  metaInfoEl,
  questionsPanelList,
  saveQuizBtn,
} from './dom-variables.js';

export let initialData = {
  title: '',
  subject: '',
  questions: [],
}; // ! This will be used to store the initial questions data

export let updatedData = {
  deletedQuestions: [],
  newQuestions: [],
  updatedQuestions: [],
};
const getQuizId = () => {
  const match = window.location.pathname.match(/\/quizzes\/([^/]+)\/edit/);
  const quizId = match ? match[1] : null;
  if (!quizId) throw new Error('Quiz ID not found');
  return quizId;
};

export const handleTextarea = (e) => {
  const textarea = e.target.closest('textarea');
  if (textarea) {
    autoResizeTextarea(textarea);
    const questionId = textarea.closest('.question-editor-box').id;
    const questionText = textarea.value.trim();
    const questionCard = document.querySelector(
      `.question-card[href="#${questionId}"] .question-text`
    );
    if (questionCard) {
      questionCard.textContent = questionText || 'A simple question text here.';
    }
  }
};
const autoResizeTextarea = (textarea) => {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
};

export const handleEditorListDragEnd = () => {
  // Callback after drag and drop ends
  const questionEditorBoxes = Array.from(
    editorQuestionsList.querySelectorAll('.question-editor-box')
  );
  questionEditorBoxes.forEach((box) => {
    box.remove();
  });
  const questionCards = questionsPanelList.querySelectorAll('.question-card');
  questionCards.forEach((card, index) => {
    const box = questionEditorBoxes.find((box) => {
      return box.id === card.href.split('#')[1];
    });
    box.querySelector('.counter').textContent = `Question ${index + 1}`;
    editorQuestionsList.lastElementChild.before(box);
  });
};

const getQuestionEls = (questionId, questionCount) => {
  const questionEditorBox = document.createElement('div');
  questionEditorBox.className = 'question-editor-box';
  questionEditorBox.id = questionId;
  questionEditorBox.innerHTML = `<header class="question-header">
                <h4>
                  <span class="icon-box">
                    <i class="bi bi-patch-question"></i>
                  </span>
                  <span class="question-count counter">Question ${questionCount}</span>
                </h4>
                <button
                  type="button"
                  class="delete-question-btn exclude-btn has-tooltip"
                  data-tooltip="Delete Choice"
                >
                  <i class="bi bi-trash3"></i>
                </button>
              </header>
              <textarea
                class="question-input input"
                placeholder="Enter question text here..."
                id="question-text"
              ></textarea>
              <div class="choices-section">
                <h5 class="choices-title section-title">
                  <span class="icon-box">
                    <i class="bi bi-list-ol"></i>
                  </span>
                  Choices
                </h5>
                <div class="choices-list">
                  <div data-choice-id="0" class="choice correct-answer">
                    <span class="choice-label">A</span>
                    <input
                      type="text"
                      class="choice-input input"
                      placeholder="Enter choice A"
                    />
                    <button
                      type="button"
                      class="delete-choice-btn exclude-btn has-tooltip"
                      data-tooltip="Delete Choice"
                    >
                      <i class="bi bi-trash3"></i>
                    </button>
                  </div>
                  <div data-choice-id="1" class="choice">
                    <span class="choice-label">B</span>
                    <input
                      type="text"
                      class="choice-input input"
                      placeholder="Enter choice B"
                    />
                    <button
                      type="button"
                      class="delete-choice-btn exclude-btn has-tooltip"
                      data-tooltip="Delete Choice"
                    >
                      <i class="bi bi-trash3"></i>
                    </button>
                  </div>
                </div>
                <button type="button" class="add-choice-btn small-btn">
                  <i class="bi bi-plus-circle"></i>
                  Add Choice
                </button>
                <hr />
                <h5 class="correct-answer-title section-title">
                  <span class="icon-box">
                    <i class="bi bi-check-circle"></i>
                  </span>
                  Correct Answer
                </h5>
                <div class="correct-answer-select">
                  <div class="icon-box">
                    <i class="bi bi-check-circle"></i>
                  </div>
                  <div class="select-trigger input">
                    <button
                      type="button"
                      class="exclude-btn open-drop-down-btn"
                    >
                      <span class="correct-answer-value">A</span>
                      <input type="hidden" name="correct-answer" value="0" />
                      <i class="bi bi-chevron-down"></i>
                    </button>
                    <div
                      class="select-menu group-subject-select-menu drop-down-menu overlay"
                    >
                      <label class="drop-down-item">
                        <input type="radio" name="correct-answer" value="0" checked />
                        A
                      </label>
                      <label class="drop-down-item">
                        <input type="radio" name="correct-answer" value="1" />
                        B
                      </label>
                    </div>
                  </div>
                </div>
              </div>`;
  const questionPanelItem = document.createElement('div');
  questionPanelItem.className = 'question';
  questionPanelItem.innerHTML = `
              ${questionCount === 1 ? '<div class="drop-target"></div>' : ''}
              <a draggable="false" href="#${questionId}" class="question-card">
                <header class="question-card-header">
                  <h4>
                    <span class="icon-box">
                      <i class="bi bi-patch-question"></i>
                    </span>
                    <span class="question-count counter">Question ${questionCount}</span>
                  </h4>
                  <button type="button" class="exclude-btn drag-handle has-tooltip" data-tooltip="Drag to Reorder">
                    <i class="drag-icon"></i>
                  </button>
                </header>
                <p class="question-text">
                  A simple question text here.
                </p>
                <footer class="question-card-footer">
                  <span class="choices-count">2 Choices</span>
                  <button type="button" class="delete-question-btn exclude-btn has-tooltip" data-tooltip="Delete Question">
                    <i class="bi bi-trash3"></i>
                  </button>
                </footer>
              </a>
              <div class="drop-target"></div>`;
  return { questionEditorBox, questionPanelItem };
};

const handleSelectCorrectAnswer = (radioInput) => {
  const choiceValue = radioInput.value;
  const selectTrigger = radioInput.closest('.select-trigger');
  const hiddenInput = selectTrigger.querySelector('input[type="hidden"]');
  if (hiddenInput.value === choiceValue) return;

  // Update correct answer visually
  const choicesList = selectTrigger
    .closest('.choices-section')
    .querySelector('.choices-list');
  choicesList
    .querySelectorAll('.choice')
    .forEach((choice) => choice.classList.remove('correct-answer'));
  const selectedChoice = choicesList.querySelector(
    `.choice[data-choice-id="${choiceValue}"]`
  );
  if (selectedChoice) {
    selectedChoice.classList.add('correct-answer');
  }

  // Update hidden input and display value
  hiddenInput.value = choiceValue;
  const dropDownItem = radioInput.closest('.drop-down-item');
  const answerLabel = dropDownItem.textContent.trim();
  selectTrigger.querySelector('.correct-answer-value').textContent =
    answerLabel;
};

const updateChoiceLabelsAndIds = (choicesList) => {
  choicesList.querySelectorAll('.choice').forEach((choice, index) => {
    choice.querySelector('.choice-label').textContent = String.fromCharCode(
      65 + index
    ); // A, B, C, ...
    choice.setAttribute('data-choice-id', index);
    choice.querySelector(
      '.choice-input'
    ).placeholder = `Enter choice ${String.fromCharCode(65 + index)}`;
  });
};

const updateSelectMenuItems = (selectMenu) => {
  selectMenu.querySelectorAll('.drop-down-item').forEach((item, index) => {
    item.querySelector('input').value = index;
    item.innerHTML = `
                <input type="radio" name="correct-answer" value="${index}" />
                ${String.fromCharCode(65 + index)}
              `;
  });
};

const setFirstChoiceAsCorrect = (choicesList, selectMenu) => {
  const firstChoice = choicesList.querySelector('.choice');
  if (firstChoice) {
    firstChoice.classList.add('correct-answer');
    selectMenu.querySelector('input[type="hidden"]').value = '0';
    selectMenu.querySelector('.correct-answer-value').textContent =
      firstChoice.querySelector('.choice-label').textContent;
    selectMenu.querySelector('input[type="radio"][value="0"]').checked = true;
  }
};

const updateCurrentCorrectAnswer = (choicesList, selectMenu) => {
  const currentCorrectAnswer = choicesList.querySelector('.correct-answer');
  if (currentCorrectAnswer) {
    const choiceId = currentCorrectAnswer?.dataset.choiceId;
    selectMenu.querySelector('input[type="hidden"]').value = choiceId;
    selectMenu.querySelector('.correct-answer-value').textContent =
      currentCorrectAnswer.querySelector('.choice-label').textContent;
    selectMenu.querySelector(
      `input[type="radio"][value="${choiceId}"]`
    ).checked = true;
  }
};

const updateChoicesCountInPanel = (choicesList) => {
  const questionEditorBox = choicesList.closest('.question-editor-box');
  const questionId = questionEditorBox ? questionEditorBox.id : null;
  const questionCard = document.querySelector(
    `.question-card[href="#${questionId}"]`
  );
  if (questionCard) {
    const choiceCount = choicesList.children.length;
    questionCard.querySelector(
      '.choices-count'
    ).textContent = `${choiceCount} Choices`;
  }
};

const handleDeleteChoice = (deleteChoiceBtn) => {
  const choice = deleteChoiceBtn.closest('.choice');
  const choicesList = choice.closest('.choices-list');
  if (choicesList.children.length > 2) {
    const selectMenu = choicesList
      .closest('.choices-section')
      .querySelector('.correct-answer-select');
    const choiceInDropdown = selectMenu.querySelector(
      `.drop-down-item:has(input[value="${choice?.dataset.choiceId}"])`
    );
    choice.remove();
    choiceInDropdown.remove();
    resetTooltip(hoverTooltip);
    updateChoiceLabelsAndIds(choicesList);
    updateSelectMenuItems(selectMenu);

    if (!choicesList.querySelector('.correct-answer')) {
      setFirstChoiceAsCorrect(choicesList, selectMenu);
    } else {
      updateCurrentCorrectAnswer(choicesList, selectMenu);
    }

    updateChoicesCountInPanel(choicesList);
  } else {
    showMessageBlock('You must have at least two choices.', 'error');
  }
};

const createChoiceElement = (choiceCount) => {
  const newChoice = document.createElement('div');
  newChoice.className = 'choice';
  newChoice.setAttribute('data-choice-id', choiceCount);
  newChoice.innerHTML = `
    <span class="choice-label">${String.fromCharCode(65 + choiceCount)}</span>
    <input type="text" class="choice-input input" placeholder="Enter choice ${String.fromCharCode(
      65 + choiceCount
    )}" />
    <button type="button" class="delete-choice-btn exclude-btn has-tooltip" data-tooltip="Delete Choice">
      <i class="bi bi-trash3"></i>
    </button>
  `;
  return newChoice;
};

const createDropDownItem = (choiceCount) => {
  const newDropDownItem = document.createElement('label');
  newDropDownItem.className = 'drop-down-item';
  newDropDownItem.innerHTML = `
    <input type="radio" name="correct-answer" value="${choiceCount}" />
    ${String.fromCharCode(65 + choiceCount)}
  `;
  return newDropDownItem;
};

const handleAddChoice = (addChoiceBtn) => {
  const choicesList = addChoiceBtn.previousElementSibling;
  const choiceCount = choicesList.children.length;
  if (choiceCount < 6) {
    const newChoice = createChoiceElement(choiceCount);
    choicesList.appendChild(newChoice);

    const selectMenu = choicesList
      .closest('.choices-section')
      .querySelector('.correct-answer-select');
    const newDropDownItem = createDropDownItem(choiceCount);
    selectMenu.querySelector('.select-menu').appendChild(newDropDownItem);

    updateChoicesCountInPanel(choicesList);
  } else {
    showMessageBlock('You can only have up to 6 choices.', 'error');
  }
};

const updateQuestionCounts = () => {
  const questionCount = questionsPanelList.children.length;
  questionsPanelList.previousElementSibling.querySelector(
    '.count'
  ).textContent = `${questionCount}`;
};

const recountQuestionNumbers = (questionId) => {
  [
    { list: editorQuestionsList, elClassName: '.question-editor-box' },
    { list: questionsPanelList, elClassName: '.question-card' },
  ].forEach(({ list, elClassName }) => {
    Array.from(list.querySelectorAll(elClassName)).map(function (box, index) {
      const id = box.id || box.href.split('#')[1];

      if (id === questionId) {
        this.index = index;
      }
      if (index > this.index) {
        box.querySelector('.counter').textContent = `Question ${index}`;
      }
    }, {});
  });
};

const handleDeleteQuestion = (questionId) => {
  if (questionId) {
    const questionCard = document
      .querySelector(`.question-card[href="#${questionId}"]`)
      ?.closest('.question');
    const questionEditor = document.getElementById(questionId);
    if (questionEditor.nextElementSibling) {
      // If there is a next sibling, recount the question numbers
      recountQuestionNumbers(questionId);
    }
    if (questionEditor) {
      questionEditor.remove();
    }
    if (questionCard) {
      if (
        questionCard === questionsPanelList.firstElementChild &&
        questionCard.nextElementSibling
      ) {
        // If it's the first question, remove the drop target
        const dropTarget = questionsPanelList.querySelector('.drop-target');
        questionCard.nextElementSibling.firstElementChild.before(dropTarget);
      }
      questionCard.remove();
    }
    updateQuestionCounts();
    resetTooltip(hoverTooltip);
  }
};

export const handleAddQuestion = () => {
  const { questionEditorBox, questionPanelItem } = getQuestionEls(
    `question-${Date.now()}`,
    editorQuestionsList.children.length
  );
  editorQuestionsList.lastElementChild.before(questionEditorBox);
  questionsPanelList.appendChild(questionPanelItem);
  questionEditorBox.scrollIntoView({
    behavior: 'smooth',
  });
  questionPanelItem.scrollIntoView({
    behavior: 'smooth',
  });
  updateQuestionCounts();
};

export const handleQuestionsPanelListClick = (e) => {
  const questionLink = e.target.closest('.question-card');
  if (questionLink) scrollToView(e, questionLink);

  const deleteQuestionBtn = e.target.closest('.delete-question-btn');
  if (deleteQuestionBtn) {
    const questionId = deleteQuestionBtn
      .closest('.question-card')
      ?.href.split('#')[1];
    handleDeleteQuestion(questionId);
  }
};

export const handleEditorQuestionsListClick = (e) => {
  // Handle Select Correct Answer
  const radioInput = e.target.closest('input[type="radio"]');
  if (radioInput) handleSelectCorrectAnswer(radioInput);

  // Handle Delete Choice
  const deleteChoiceBtn = e.target.closest('.delete-choice-btn');
  if (deleteChoiceBtn) handleDeleteChoice(deleteChoiceBtn);

  // Handle Add Choice
  const addChoiceBtn = e.target.closest('.add-choice-btn');
  if (addChoiceBtn) handleAddChoice(addChoiceBtn);

  // Handle Delete Question
  const deleteQuestionBtn = e.target.closest('.delete-question-btn');
  if (deleteQuestionBtn) {
    const questionId = deleteQuestionBtn.closest('.question-editor-box')?.id;
    handleDeleteQuestion(questionId);
  }

  // Handle Add Question
  const addQuestionBtn = e.target.closest('.add-question-btn');
  if (addQuestionBtn) handleAddQuestion(addQuestionBtn);
};

export const getQuestionObject = (question) => {
  const id = question.id;
  const text = question.querySelector('textarea').value.trim();
  const correctAnswerIndex = question.querySelector(
    '.correct-answer-select input[type="hidden"]'
  ).value;
  const choices = Array.from(question.querySelectorAll('.choice-input')).map(
    (choice) => choice.value.trim()
  );

  return new Question(id, text, choices, correctAnswerIndex);
};

export const initializeInitialData = async () => {
  try {
    initialData = await fetchData('/quiz-details/' + getQuizId());
  } catch (error) {
    showMessageBlock(error.message, 'error');
    console.log('Error: ', error);
  }
};

export class Question {
  constructor(id, text = '', choices = [], correctAnswerIndex = 0) {
    this.id = id;
    this.text = text;
    this.choices = choices;
    this.correctAnswerIndex = correctAnswerIndex;
  }
}

export const swapMode = (mode, type, value) => {
  const template = metaInfoEl[type][mode](value);
  const contaier = document.querySelector(`.${type} .container`);
  contaier.replaceWith(template);
  resetTooltip(hoverTooltip);
};

export const handleEditBtn = (type) => {
  const value = initialData[type] || '';
  swapMode('getEditMode', type, value);
  const container = document.querySelector(`.${type} .container`);
  if (type === 'subject') {
    setUpSubjectSelectMenu(container);
  } else {
    container.querySelector('input').focus();
  }
};

export const handleSaveBtn = async (type, btn) => {
  const input = document.querySelector(`.${type} input`);
  const value = input?.value.trim() || '';
  const oldValue = initialData[type] || '';

  if (value === oldValue) {
    swapMode('getViewMode', type, value);
    return;
  }

  if (type === 'title' && !checkTitleValidity(value, input)) return; // If title is invalid, do not proceed

  if (btn.isSaving) return;

  try {
    btn.isSaving = true;
    btn.innerHTML = getLoader();
    btn.disabled = true;
    const quizId = getQuizId();
    await sendData('/api/update-quiz/' + quizId, { [type]: value }, 'PATCH');
    initialData[type] = value; // Update the initial data with the new value
    swapMode('getViewMode', type, value);
  } catch (error) {
    console.error(`Failed to update ${type}:`, error);
    showMessageBlock(`Failed to update ${type}. Please try again.`, 'error');
    return;
  } finally {
    btn.isSaving = false;
    btn.innerHTML = '<i class="bi bi-floppy"></i>';
    btn.disabled = false;
  }
};

const checkTitleValidity = (value, input) => {
  if (!value) {
    showErrorTooltip('Title is required.', input, 'input');
    return;
  } else if (
    value.length < NAME_TITLE_MIN_LENGTH ||
    value.length > NAME_TITLE_MAX_LENGTH
  ) {
    showErrorTooltip(
      `Title must be between ${NAME_TITLE_MIN_LENGTH} and ${NAME_TITLE_MAX_LENGTH} characters.`,
      input,
      'input'
    );
    return;
  } else {
    resetTooltip(hoverTooltip, input.closest('.input'));
  }

  return true;
};

const validateQuestionText = (questionText, questionTextValue) => {
  if (!questionTextValue) {
    showErrorTooltip(
      'Question text is required.',
      questionText,
      'question-input'
    );
    questionText.focus();
    return false;
  } else if (
    questionTextValue.length < QUESTION_TEXT_MIN_LENGTH ||
    questionTextValue.length > QUESTION_TEXT_MAX_LENGTH
  ) {
    showErrorTooltip(
      `Question text must be between ${QUESTION_TEXT_MIN_LENGTH} and ${QUESTION_TEXT_MAX_LENGTH} characters.`,
      questionText,
      'question-input'
    );
    questionText.focus();
    return false;
  } else {
    resetTooltip(globalTooltip, questionText.closest('.question-input'));
  }
  return true;
};

const validateChoices = (choices, choicesValues) => {
  for (const [index, choice] of choicesValues.entries()) {
    const choiceInput = choices[index];
    if (!choice) {
      showErrorTooltip('Choice text is required.', choiceInput);
      return false;
    } else if (choice.length > CHOICE_TEXT_MAX_LENGTH) {
      showErrorTooltip(
        `Choice text must be less than ${CHOICE_TEXT_MAX_LENGTH} characters.`,
        choiceInput
      );
      return false;
    } else {
      resetTooltip(globalTooltip, choiceInput.closest('.choice'));
    }
  }

  if (choicesValues.length < 2) {
    showErrorTooltip('At least two choices are required.', choices[0]);
    return false;
  } else {
    resetTooltip(globalTooltip, choices[0].closest('.choice'));
  }
  return true;
};

const validateCorrectAnswer = (
  correctAnswerIndex,
  correctAnswerIndexValue,
  choicesLength
) => {
  if (correctAnswerIndexValue === '') {
    showErrorTooltip(
      'Correct answer is required.',
      correctAnswerIndex,
      'correct-answer-select'
    );
    return false;
  } else if (
    correctAnswerIndexValue < 0 ||
    correctAnswerIndexValue >= choicesLength
  ) {
    showErrorTooltip(
      'Correct answer index is invalid.',
      correctAnswerIndex,
      'correct-answer-select'
    );
    return false;
  } else {
    resetTooltip(
      globalTooltip,
      correctAnswerIndex.closest('.correct-answer-select')
    );
  }
  return true;
};

const checkQuestionValidity = (inputs) => {
  const { questionText, choices, correctAnswerIndex } = inputs;
  const questionTextValue = questionText?.value?.trim() ?? '';
  const choicesValues = choices.map((choice) => choice.value.trim());
  const correctAnswerIndexValue = correctAnswerIndex.value.trim();

  if (!validateQuestionText(questionText, questionTextValue)) return false;
  if (!validateChoices(choices, choicesValues)) return false;
  if (
    !validateCorrectAnswer(
      correctAnswerIndex,
      correctAnswerIndexValue,
      choicesValues.length
    )
  )
    return false;

  return true;
};

const getQuestionInputs = (question) => {
  const questionText = question.querySelector('textarea');
  const choices = Array.from(question.querySelectorAll('.choice input'));
  const correctAnswerIndex = question.querySelector(
    '.correct-answer-select input[type="hidden"]'
  );
  return { questionText, choices, correctAnswerIndex };
};

const normalizeQuestionId = (question) => {
  if (question.id.includes('question-')) {
    const questionId = question.id.replace('question-', '');
    document.querySelector(`a[href="#${question.id}"]`).href = `#${questionId}`;
    question.id = questionId;
    return questionId;
  }
  return question.id;
};

const collectQuestionsFromDOM = (checkValidity) => {
  const questionElements = Array.from(editorQuestionsList.children);
  questionElements.pop(); // Remove the last child (the button)
  let questions = [];
  for (const question of questionElements) {
    const { questionText, choices, correctAnswerIndex } =
      getQuestionInputs(question);
    if (
      checkValidity &&
      !checkQuestionValidity({ questionText, choices, correctAnswerIndex })
    ) {
      return null; // Stop saving if any question is invalid
    }
    const questionObject = getQuestionObject(question);
    normalizeQuestionId(question);
    if (questionObject) {
      questions.push(questionObject);
    }
  }
  return questions;
};

const classifyQuestions = (questions) => {
  const newQuestions = [];
  const updatedQuestions = [];
  questions.forEach((question) => {
    const isNewQuestion = initialData.questions.every(
      (q) => q.id !== question.id
    );
    const isUpdatedQuestion = initialData.questions.some(
      (q) =>
        q.id === question.id &&
        (question.text !== q.text ||
          question.choices.length !== q.choices.length ||
          question.choices.some(
            (choice, index) => choice !== q.choices[index]
          ) ||
          question.correctAnswerIndex !== q.correctAnswerIndex)
    );
    if (isNewQuestion) newQuestions.push(question);
    else if (isUpdatedQuestion) updatedQuestions.push(question);
  });
  return { newQuestions, updatedQuestions };
};

const getDeletedQuestionIds = (questions) => {
  return initialData.questions
    .filter((q) => !questions.some((newQ) => newQ.id === q.id))
    .map((q) => q.id);
};

const saveQuizToServer = async (questions) => {
  if (saveQuizBtn.isSaving) return; // Prevent multiple clicks

  try {
    saveQuizBtn.innerHTML = getLoader();
    saveQuizBtn.disabled = true;
    saveQuizBtn.isSaving = true;
    // Extract quizId from URL: /app/quizzes/anything-here/edit (Firebase UID can contain chars)

    const quizId = getQuizId();
    await sendData('/api/update-quiz/' + quizId, updatedData, 'PUT');
    showMessageBlock('Quiz saved successfully!', 'success');
    // update the initialData with the new questions
    initialData.questions = questions;
  } catch (error) {
    console.error('Failed to save quiz:', error);
    showMessageBlock('Failed to save quiz. Please try again.', 'error');
  } finally {
    saveQuizBtn.innerHTML = `<i class="bi bi-floppy"></i><span>Save</span>`;
    saveQuizBtn.disabled = false;
    saveQuizBtn.isSaving = false;
  }
};

export const prepareQuizData = (checkValidity) => {
  updatedData.deletedQuestions = [];
  updatedData.newQuestions = [];
  updatedData.updatedQuestions = [];

  const questions = collectQuestionsFromDOM(checkValidity);
  if (!questions) return null;

  if (questions.length === 0) {
    showMessageBlock('Please add at least one valid question.', 'error');
    return null;
  }

  const { newQuestions, updatedQuestions } = classifyQuestions(questions);
  updatedData.newQuestions = newQuestions;
  updatedData.updatedQuestions = updatedQuestions;
  updatedData.deletedQuestions = getDeletedQuestionIds(questions);

  return questions;
};

export const saveQuiz = async () => {
  const questions = prepareQuizData(true);
  if (!questions) return new Error('Invalid questions data.');

  if (
    updatedData.newQuestions.length === 0 &&
    updatedData.updatedQuestions.length === 0 &&
    updatedData.deletedQuestions.length === 0
  ) {
    showMessageBlock('No changes to save.', 'info');
    return null;
  }

  await saveQuizToServer(questions);
};

export const handleSidebarTitleLinkClick = async (e) => {
  if (e.target.leave) return;
  else e.target.leave = false;
  try {
    const questions = prepareQuizData();
    if (
      updatedData.newQuestions.length === 0 &&
      updatedData.updatedQuestions.length === 0 &&
      updatedData.deletedQuestions.length === 0
    ) {
      return;
    }
    if (!questions) return e.preventDefault();

    e.preventDefault();

    const res = await showConfirmationBox(
      'exclamation',
      'Are you sure you want to leave?',
      'You will lose all unsaved changes.',
      'Leave',
      'Save & Leave'
    );

    if (res) {
      const error = await saveQuiz();
      if (!error) {
        e.target.leave = true;
        e.target.click();
      }
    } else {
      e.target.leave = true;
      e.target.click();
    }
  } catch (error) {
    console.error('Error', error);
  }
};
