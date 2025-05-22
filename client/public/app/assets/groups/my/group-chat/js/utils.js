import {
  fetchData,
  showMessageBlock,
} from '../../../../../../main_assets/js/utils.js';
import {
  globalTooltip,
  hoverTooltip,
} from '../../../../global/js/dom-variables.js';
import {
  getLoader,
  showTooltip,
  resetTooltip,
  getDebounceFunc,
  showConfirmationBox,
} from '../../../../global/js/utils.js';
import {
  groupLeftSideBar,
  levelValues,
  showInfoBtn,
  subjectMenuObject,
  groupInfoElementsMap,
  maxMembersLimit,
  visibilityValues,
  groupLeftSideBarContent,
  groupLeftSideBarTitle,
} from './dom-variables.js';

export const handleLeavingGroup = async () => {
  await showConfirmationBox(
    'exclamation',
    'Leave Group',
    'Are you sure you want to leave this group?',
    'Cancel',
    'Leave'
  );
};

export const handleShowInfoBtnClick = async () => {
  if (groupLeftSideBar.classList.contains('close')) {
    await openGroupLeftSideBar('/group-info');
    setUpRemoveGroupBtn('.remove-group-btn');
  } else {
    closeGroupLeftSideBar();
  }
};

export const checkSubject = (subject) => {
  for (const [, subjects] of Object.entries(subjectMenuObject)) {
    if (subjects.includes(subject)) {
      return true;
    }
  }
  return false;
};

export const setUpSubjectSelectMenu = (container, selectMenuClassName) => {
  const selectMenu = container.querySelector(`.${selectMenuClassName}`);
  if (!selectMenu) return;

  selectMenu.innerHTML = createSubjectSelectMenu();
  const searchInput = selectMenu.querySelector('.select-search input');
  const selectButtonValue = container.querySelector('.subject-value');
  const otherSubjectInput = selectMenu.querySelector('.other-subject-input');

  // Debounced search input handler
  searchInput.addEventListener('input', (e) => {
    getDebounceFunc(handleSubjectSearchInput, 200)(e, selectMenu);
  });

  // Handle subject selection from the list
  selectMenu.addEventListener('click', (e) =>
    HandleSubjectSelection(e, selectButtonValue)
  );

  // Handle custom subject input
  otherSubjectInput.addEventListener('keydown', (e) =>
    handleOtherSubjectInputKeydown(e, selectButtonValue, selectMenu)
  );
};

const HandleSubjectSelection = (e, selectButtonValue) => {
  const selectedItem = e.target.closest('.select-item');
  if (!selectedItem) return;

  if (!selectButtonValue.style.color) {
    selectButtonValue.style.color = 'var(--primary-text-color)';
  }

  const selectedValue = selectedItem.dataset.value;
  if (checkSubject(selectedValue)) {
    setSubjectValue(selectButtonValue, selectedValue);
  } else {
    showMessageBlock(
      'Please select a valid subject from the list or specify a new one.',
      true
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

export const handleOtherSubjectInputKeydown = (
  e,
  selectButtonValue,
  selectMenu
) => {
  if (e.key === 'Enter') {
    const selectedValue = toCapitalizeFirstLetter(e.currentTarget.value.trim());
    if (selectedValue.length > 1 && selectedValue.length <= 50) {
      console.log('heeee');

      setSubjectValue(selectButtonValue, selectedValue);
      clearOtherSubjectInput(e.currentTarget, selectMenu);
      removeErrorMessage();
    } else {
      showSubjectInputError(e.currentTarget);
    }
  }
};

const setSubjectValue = (selectButtonValue, value) => {
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

export const handleSubjectSearchInput = (e, selectMenu) => {
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

export let groupInfo;

export const openGroupLeftSideBar = async (route) => {
  groupLeftSideBarContent.innerHTML = getLoader();
  groupLeftSideBar.classList.remove('close');

  showInfoBtn
    .querySelector('i')
    .classList.replace('bi-info-circle', 'bi-x-circle');
  showInfoBtn.setAttribute('data-tooltip', 'Close group info');

  try {
    const groupId = groupLeftSideBarContent.dataset.groupId;
    const { template, title, count, info } = await fetchData(
      `${route}/${groupId}`
    );

    if (info) {
      groupInfo = info;
    }

    groupLeftSideBarContent.innerHTML = template;
    groupLeftSideBarTitle.textContent = title;
    if (count) {
      const badge = document.createElement('span');
      badge.className = 'badge simple-badge';
      badge.textContent = count;
      groupLeftSideBarTitle.appendChild(badge);
    }
  } catch (error) {
    console.log(error);
    showMessageBlock(error.message, true);
  }
};

export const closeGroupLeftSideBar = () => {
  groupLeftSideBar.classList.add('close');
  showInfoBtn
    .querySelector('i')
    .classList.replace('bi-x-circle', 'bi-info-circle');
  showInfoBtn.setAttribute('data-tooltip', 'Show group info');
};

const createShowInSearchLabel = () => {
  const showInSearchLabel = document.createElement('label');
  showInSearchLabel.className = 'show-in-search-label container';
  showInSearchLabel.innerHTML = `
              <input type="checkbox" id="show-in-search">
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
      : valueElement.dataset.value;
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
        : valueElement.dataset.value;
      const checkedIndex = validValues.indexOf(currentValue);

      if (checkedIndex !== -1) {
        const newIndex = (checkedIndex + 1) % validValues.length;
        valueElement.textContent = validValues[newIndex];
        if (wrapper.querySelector('.visibility-input')) {
          if (validValues[newIndex] === 'Private') {
            // Create the label element for "Show in Search Results"
            const showInSearchLabel = createShowInSearchLabel();
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

const dashedToCamelCase = (value) => {
  return value.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
};

const swapMode = (infoBox, modeFuncName, updatedValue, showInSearchValue) => {
  const editBoxClass = infoBox.className
    .split(' ')
    .find((c) => c.includes('-info-box'));
  const value = updatedValue
    ? updatedValue
    : groupInfo[dashedToCamelCase(editBoxClass.split('-info-box')[0])];
  const showInSearchInput =
    showInSearchValue !== null
      ? showInSearchValue
      : null
  const infoBoxClone = infoBox.cloneNode();

  infoBoxClone.innerHTML = groupInfoElementsMap[editBoxClass][modeFuncName](
    value,
    showInSearchInput
  );
  if (modeFuncName === 'getEditMode') {
    if (editBoxClass === 'subject-info-box') {
      setUpSubjectSelectMenu(infoBoxClone, 'group-subject-select-menu');
    }
    if (['visibility-info-box', 'level-info-box'].includes(editBoxClass)) {
      setUpSwitchBtn(infoBoxClone);
    }
  }
  infoBox.replaceWith(infoBoxClone);
  resetTooltip(hoverTooltip);
};

export const handleViewAllMembersBtn = (e) => {
  const viewAllMembersBtn = e.target.closest(
    '.view-all-btn, .manage-members-btn'
  );
  if (viewAllMembersBtn) {
    openGroupLeftSideBar('/members-list');
  }
};

export const setUpDatePicker = () => {
  const dateInput = groupLeftSideBarContent.querySelector('input[type="date"]');
  dateInput.onclick = (e) => {
    e.currentTarget.showPicker();
  };
};

export const setUpRemoveGroupBtn = (BtnClassName) => {
  const removeGroupBtn = document.querySelector(BtnClassName);
  removeGroupBtn?.addEventListener('click', () => {
    showConfirmationBox(
      'exclamation',
      'Remove group',
      'Are you sure you want to remove this group?',
      'Cancel',
      'Remove'
    );
  });
};

export const handleDemandesBtn = async (e) => {
  const demandesBtn = e.target.closest('.demandes-btn');
  if (demandesBtn) {
    await openGroupLeftSideBar('/demandes-list');
    setUpDatePicker();
  }
};

export const handleEditBtn = (e) => {
  const editBtn = e.target.closest('.edit-btn');
  if (editBtn) {
    const infoBox = editBtn.closest('.info-box');
    swapMode(infoBox, 'getEditMode');
  }
};

// Helper: Get info box conditions
const getInfoBoxConditions = (editBoxClass, input) => ({
  isVisbilityBox: editBoxClass === 'visibility-info-box',
  isLevelBox: editBoxClass === 'level-info-box',
  isSubjectBox: editBoxClass === 'subject-info-box',
  isGroupDescriptionBox: editBoxClass === 'group-description-info-box',
  isGroupNameBox: editBoxClass === 'group-name-info-box',
  isMaxMembersBox: editBoxClass === 'max-members-info-box',
  isInputElement: ['INPUT', 'TEXTAREA'].includes(input.tagName),
});

// Helper: Check if value has changed
const isValueUnchanged = (
  input,
  oldValue,
  CONDITIONS,
  showInSearchInput,
  oldValueShowInSearchInput
) => {
  if (CONDITIONS.isInputElement) {
    return input.value === oldValue;
  } else {
    const valueUnchanged = input.dataset.value === oldValue;
    const showInSearchUnchanged =
      CONDITIONS.isVisbilityBox && input.dataset.value === 'Private'
        ? showInSearchInput.checked === oldValueShowInSearchInput
        : true;
    return valueUnchanged && showInSearchUnchanged;
  }
};

// Handle cancel button: revert to view mode
const handleCancelBtn = (cancellBtn) => {
  const infoBox = cancellBtn.closest('.info-box');
  swapMode(infoBox, 'getViewMode');
};

// Handle save button logic
const handleSaveBtn = (saveBtn) => {
  const infoBox = saveBtn.closest('.info-box');
  const infoWrapper = infoBox.querySelector('.info-container');
  const actionsBtns = infoBox.querySelector('.action-btns');
  const editBoxClass = infoBox.className
    .split(' ')
    .find((c) => c.includes('-info-box'));
  const oldValue =
    groupInfo[dashedToCamelCase(editBoxClass.split('-info-box')[0])];
  const oldValueShowInSearchInput = groupInfo['showInSearch'];

  const input = infoBox.querySelector('.value');
  const showInSearchInput = infoBox.querySelector('#show-in-search');

  const CONDITIONS = getInfoBoxConditions(editBoxClass, input);

  if (
    isValueUnchanged(
      input,
      oldValue,
      CONDITIONS,
      showInSearchInput,
      oldValueShowInSearchInput
    )
  ) {
    swapMode(infoBox, 'getViewMode');
    return;
  }

  const isValid = checkValidity(input, CONDITIONS);

  if (!isValid) {
    infoWrapper.classList.add('error');
  } else {
    infoWrapper.classList.remove('error');
    handleSaveAction(
      input,
      infoBox,
      CONDITIONS,
      actionsBtns,
      showInSearchInput
    );
  }
};

// Handles save and cancel button actions in the group info sidebar
export const handleSaveAndCancellBtns = (e) => {
  const saveBtn = e.target.closest('.save-btn');
  const cancellBtn = e.target.closest('.cancell-btn');

  if (cancellBtn) {
    handleCancelBtn(cancellBtn);
    return;
  }

  if (saveBtn) {
    handleSaveBtn(saveBtn);
  }
};

const handleSaveAction = async (
  input,
  infoBox,
  CONDITIONS,
  actionsBtns,
  showInSearchInput
) => {
  try {
    actionsBtns.outerHTML = getLoader();
    resetTooltip(hoverTooltip);
    await updateGroupInfo(input, infoBox, CONDITIONS);
    const updatedValue = CONDITIONS.isInputElement
      ? input.value
      : input.dataset.value;
    const showInSearchValue = CONDITIONS.isVisbilityBox && input.dataset.value === 'Private'
      ? showInSearchInput.checked
      : null;

    swapMode(infoBox, 'getViewMode', updatedValue, showInSearchValue);
    showMessageBlock('Group info updated successfully', false);
  } catch (error) {
    showMessageBlock(error.message, true);
  }
};

const initAndDiplayTooltip = (input, message) => {
  input.dataset.tooltip = message;
  showTooltip(input, globalTooltip);
  setTimeout(() => {
    resetTooltip(globalTooltip);
    input.dataset.tooltip = '';
  }, 2000);
};

const validateMaxMembers = (input, value) => {
  const maxMembers = parseInt(value);
  if (isNaN(maxMembers) || maxMembers < 2 || maxMembers > maxMembersLimit) {
    initAndDiplayTooltip(
      input,
      'Max members should be a number between 1 and 1000'
    );
    return false;
  }
  return true;
};

const validateGroupName = (input, value) => {
  if (value.length < 5 || value.length > 50) {
    initAndDiplayTooltip(
      input,
      'Group name should be between 5 and 50 characters'
    );
    return false;
  }
  return true;
};

const validateGroupDescription = (input, value) => {
  if (value.length < 30) {
    initAndDiplayTooltip(
      input,
      'Group description should be at least 30 characters'
    );
    return false;
  }else if (value.length > 500) {
    initAndDiplayTooltip(
      input,
      'Group description should be less than 500 characters'
    );
    return false;
  }
  return true;
};

const checkValidity = (input, CONDITIONS) => {
  if (CONDITIONS.isInputElement) {
    const value = input.value.trim();
    if (value) {
      if (CONDITIONS.isMaxMembersBox) {
        return validateMaxMembers(input, value);
      } else if (CONDITIONS.isGroupNameBox) {
        return validateGroupName(input, value);
      } else {
        return validateGroupDescription(input, value);
      }
    }
    return false;
  } else if (CONDITIONS.isVisbilityBox) {
    return checkRadioValidity(input, visibilityValues);
  } else if (CONDITIONS.isLevelBox) {
    return checkRadioValidity(input, levelValues);
  } else if (CONDITIONS.isSubjectBox) {
    return true;
  }
};

const checkRadioValidity = (input, valideValues) => {
  if (!valideValues.includes(input.dataset.value)) {
    initAndDiplayTooltip(input, 'Please select a valid option');
    return false;
  }

  return true;
};

const updateGroupInfo = async (input, infoBox, CONDITIONS) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (CONDITIONS.isGroupNameBox) {
      } else if (CONDITIONS.isGroupDescriptionBox) {
      } else if (CONDITIONS.isMaxMembersBox) {
      } else if (CONDITIONS.isVisbilityBox) {
      } else if (CONDITIONS.isLevelBox) {
      } else if (CONDITIONS.isSubjectBox) {
      }
      resolve();
    }, 1000);
  });
};
