import { showMessageBlock } from '../../../../../main_assets/js/utils.js';
import {
  DESCRIPTION_MAX_LENGTH,
  hoverTooltip,
} from '../../../global/js/dom-variables.js';
import { getDebounceFunc } from '../../../global/js/utils.js';
import {
  levelValues,
  subjectMenuObject,
  visibilityValues,
} from './dom-variables.js';

export const checkSubject = (subject) => {
  for (const [, subjects] of Object.entries(subjectMenuObject)) {
    if (subjects.includes(subject)) {
      return true;
    }
  }
  return false;
};

export const setUpSelectMenu = (
  container,
  getSelectMenuHtml,
  isGlobalSelect,
  onSelect
) => {
  const selectMenu = container.querySelector(`.select-menu`);
  if (!selectMenu) return;

  selectMenu.innerHTML = getSelectMenuHtml() || createSubjectSelectMenu();
  const searchInput = selectMenu.querySelector('.select-search input');
  const selectButtonValue = container.querySelector(
    '.subject-value, .quiz-value'
  );

  // Debounced search input handler
  searchInput.addEventListener('input', (e) => {
    getDebounceFunc(handleSelectSearchInput, 200)(e, selectMenu);
  });

  // Handle subject selection from the list
  selectMenu.addEventListener('click', (e) =>
    HandleSelection(e, selectButtonValue, isGlobalSelect, onSelect)
  );

  // Handle custom subject input
  if (!isGlobalSelect) {
    const otherSubjectInput = selectMenu.querySelector('.other-subject-input');
    otherSubjectInput.addEventListener('keydown', (e) =>
      handleOtherSubjectInputKeydown(e, selectButtonValue, selectMenu)
    );
  }
};

const HandleSelection = (e, selectButtonValue, isGlobalSelect, onSelect) => {
  const selectedItem = e.target.closest('.select-item');
  if (!selectedItem) return;

  if (!selectButtonValue.style.color) {
    selectButtonValue.style.color = 'var(--primary-text-color)';
  }

  const selectedValue = selectedItem?.dataset.value;
  if (checkSubject(selectedValue) || isGlobalSelect) {
    if (onSelect) {
      onSelect(selectButtonValue, selectedItem, selectedValue);
    } else {
      setSelectValue(selectButtonValue, selectedValue);
    }
  } else {
    showMessageBlock(
      'Please select a valid subject from the list or specify a new one.',
      'error'
    );
  }
};

export const createSubjectSelectMenu = () => {
  let html = `
    <div class="select-search">
      <input id="select-search" type="search" />
    </div>
  `;

  Object.entries(subjectMenuObject).forEach(
    ([group, subjects], groupIdx, arr) => {
      html += createSubjectSelectMenuGroup(group, subjects);

      // Add separator between groups except after the last group
      if (groupIdx < arr.length - 1) {
        html += `<hr class="separator">`;
      }
    }
  );

  return html;
};

const createSubjectSelectMenuGroup = (group, subjects) => {
  let groupHtml = `<div class="select-group drop-down-group">`;
  groupHtml += `<div class="select-group-label drop-down-group-label">${group}</div>`;
  groupHtml += `<hr class="separator">`;

  if (group === 'Other') {
    groupHtml += `<input type="text" id="other-subject-input" class="other-subject-input" placeholder="${subjects[0]}" />`;
  } else {
    groupHtml += subjects
      .map(
        (subject) =>
          `<div class="select-item drop-down-item" data-value="${subject}">${subject}</div>`
      )
      .join('');
  }

  groupHtml += `</div>`;
  return groupHtml;
};

const handleOtherSubjectInputKeydown = (e, selectButtonValue, selectMenu) => {
  if (e.key === 'Enter') {
    const selectedValue = toCapitalizeFirstLetter(e.currentTarget.value.trim());
    if (selectedValue.length > 1 && selectedValue.length <= 50) {
      setSelectValue(selectButtonValue, selectedValue);
      clearOtherSubjectInput(e.currentTarget, selectMenu);
      removeErrorMessage();
    } else {
      showSubjectInputError(e.currentTarget);
    }
  }
};

const setSelectValue = (selectButtonValue, value) => {
  selectButtonValue.textContent = value;
  if (selectButtonValue.nextElementSibling.matches('input[type="hidden"]')) {
    selectButtonValue.nextElementSibling.value = value;
  } else {
    selectButtonValue.dataset.value = value;
  }
};

const clearOtherSubjectInput = (input, selectMenu) => {
  input.value = '';
  selectMenu.classList.remove('open-overlay');
  document.body.style.pointerEvents = 'auto';
};

const removeErrorMessage = () => {
  const errorMessage = document.querySelector('.error-message');
  if (errorMessage) {
    errorMessage.remove();
  }
};

const showSubjectInputError = (input) => {
  let errorMessage = document.querySelector('.error-message');
  if (!errorMessage) {
    errorMessage = document.createElement('p');
    errorMessage.className = 'error-message';
    errorMessage.textContent =
      'Please enter a valid subject name (2-50 characters).';
    input.before(errorMessage);
    input.scrollIntoView({ block: 'nearest' });
  }
};

export const toCapitalizeFirstLetter = (str) => {
  return str
    .trim()
    .split(' ')
    .map((word) => {
      return word.slice(0, 1).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

export const handleSelectSearchInput = (e, selectMenu) => {
  const searchValue = e.target.value.trim().toLowerCase();
  const items = document.querySelectorAll(
    '.group-subject-select-menu .select-item'
  );
  items.forEach((item) => {
    const itemText = item.textContent.toLowerCase();
    if (itemText.includes(searchValue)) {
      // Highlight the matched text
      const regex = new RegExp(`(${searchValue})`, 'gi');
      item.innerHTML = item.textContent.replace(regex, '<mark>$1</mark>');

      // Add margin so the item is not hidden behind the search bar
      const searchRect = e.target.getBoundingClientRect();
      const margin = searchRect.height + 8; // 8px extra margin
      selectMenu.scrollTop = item.offsetTop - margin;
      return;
    } else {
      item.innerHTML = item.textContent;
    }
  });
  if (!searchValue) {
    selectMenu.scrollTo(0, 0);
  }
};

export const createShowInSearchLabel = (checked, disabled) => {
  const showInSearchLabel = document.createElement('label');
  showInSearchLabel.className = 'show-in-search-label container';
  showInSearchLabel.innerHTML = `
              <input type="checkbox" name="show-in-search" id="show-in-search" ${
                checked ? 'checked' : ''
              } ${disabled ? 'disabled' : ''} />
                <svg viewBox="0 0 64 64" height="2em" width="2em">
                <path d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16" pathLength="575.0541381835938" class="path"></path>
              </svg>
              Show in Search Results
            `;
  return showInSearchLabel;
};

export const setUpSwitchBtn = (wrapper) => {
  const btn = wrapper.querySelector('.switch-btn');
  if (btn) {
    const validValues = wrapper.querySelector('.visibility-input')
      ? visibilityValues
      : levelValues;
    const valueElement = wrapper.querySelector('.input');

    const updateTooltip = (nextIndex) => {
      const nextValue = validValues[nextIndex];
      btn.setAttribute('data-tooltip', `Switch to ${nextValue}`);
      hoverTooltip.textContent = `Switch to ${nextValue}`;
    };

    // Set initial tooltip
    const currentValue = valueElement.nextElementSibling?.matches(
      'input[type="hidden"]'
    )
      ? valueElement.nextElementSibling.value
      : valueElement?.dataset.value;
    const currentIndex = validValues.indexOf(currentValue);
    if (currentIndex !== -1) {
      updateTooltip((currentIndex + 1) % validValues.length);
    } else {
      console.error('Invalid value:', currentValue);
    }

    const cycleRadioSelection = () => {
      const currentValue = valueElement.nextElementSibling?.matches(
        'input[type="hidden"]'
      )
        ? valueElement.nextElementSibling.value
        : valueElement?.dataset.value;
      const checkedIndex = validValues.indexOf(currentValue);

      if (checkedIndex !== -1) {
        const newIndex = (checkedIndex + 1) % validValues.length;
        valueElement.textContent = validValues[newIndex];
        if (wrapper.querySelector('.visibility-input')) {
          if (validValues[newIndex] === 'Private') {
            // Create the label element for "Show in Search Results"
            const showInSearchLabel = createShowInSearchLabel(true);
            wrapper.appendChild(showInSearchLabel);
          } else {
            const showInSearchLabel = wrapper.querySelector(
              '.show-in-search-label'
            );
            if (showInSearchLabel) {
              showInSearchLabel.remove();
            }
          }
        }
        if (valueElement.nextElementSibling?.matches('input[type="hidden"]')) {
          valueElement.nextElementSibling.value = validValues[newIndex];
        } else {
          valueElement.dataset.value = validValues[newIndex];
        }
        updateTooltip((newIndex + 1) % validValues.length);
      } else {
        console.error('Invalid value:', currentValue);
      }
    };

    btn.addEventListener('click', cycleRadioSelection);
  }
};

export const countCharsTextarea = (e) => {
  const textarea = e.target;
  const currentLength = textarea.value.length;

  const counterElement = textarea.nextElementSibling;
  counterElement.textContent = `${currentLength}/${DESCRIPTION_MAX_LENGTH}`;
};

// Generic form validation handler
const handleFormSubmission = (e, form, validateFn, onSuccess) => {
  e.preventDefault();

  if (validateFn()) {
    const formData = new FormData(form);

    let data = Object.fromEntries(formData.entries());

    Object.entries(data).forEach(([key, value]) => {
      if (value === 'on') {
        data[key] = true;
      }
      if (value === 'off') {
        data[key] = false;
      }
    });

    onSuccess && onSuccess(data);
  }
};

export const handleFormSubmit = (form, validateFn, onSuccess) => {
  form.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('input')) {
      handleFormSubmission(e, form, validateFn, onSuccess);
    }
  });
  form.addEventListener('submit', (e) => {
    handleFormSubmission(e, form, validateFn, onSuccess);
  });
};
