import {
  DESCRIPTION_MAX_LENGTH,
  hoverTooltip,
} from "../../../global/js/variables.js";
import {
  getDebounceFunc,
  t,
  showMessageBlock,
} from "../../../global/js/utils.js";
import {
  levelValues,
  subjectMenuObject,
  visibilityValues,
} from "./dom-variables.js";

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
  onSelect,
) => {
  const selectMenu = container.querySelector(`.select-menu`);
  if (!selectMenu) return;

  if (getSelectMenuHtml) {
    selectMenu.innerHTML = getSelectMenuHtml();
  } else {
    selectMenu.innerHTML = createSubjectSelectMenu();
  }
  const searchInput = selectMenu.querySelector(".select-search input");
  const selectButtonValue = container.querySelector(
    ".subject-value, .quiz-value",
  );

  const closeMenuBtn = selectMenu.querySelector(".close-select-menu-btn");
  if (closeMenuBtn) {
    closeMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      selectMenu.classList.remove("open-overlay");
      document.body.style.pointerEvents = "auto";
    });
  }

  // Debounced search input handler
  searchInput.addEventListener("input", (e) => {
    getDebounceFunc(handleSelectSearchInput, 200)(e, selectMenu);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const otherSubjectInput = selectMenu.querySelector(
        ".other-subject-input",
      );
      if (otherSubjectInput && otherSubjectInput.value.trim().length > 1) {
        handleOtherSubjectInputKeydown(
          { key: "Enter", currentTarget: otherSubjectInput },
          selectButtonValue,
          selectMenu,
        );
        selectMenu.classList.remove("open-overlay");
        document.body.style.pointerEvents = "auto";
      }
    }
  });

  // Handle subject selection from the list
  selectMenu.addEventListener("click", (e) =>
    HandleSelection(e, selectButtonValue, isGlobalSelect, onSelect),
  );

  // Handle custom subject input
  if (!isGlobalSelect) {
    const otherSubjectInput = selectMenu.querySelector(".other-subject-input");
    otherSubjectInput?.addEventListener("keydown", (e) =>
      handleOtherSubjectInputKeydown(e, selectButtonValue, selectMenu),
    );
  }
};

const HandleSelection = (e, selectButtonValue, isGlobalSelect, onSelect) => {
  const selectedItem = e.target.closest(".select-item");
  if (
    !selectedItem ||
    selectedItem.classList.contains("loading-card") ||
    e.target.closest(".loading-card")
  )
    return;

  if (!selectButtonValue.style.color) {
    selectButtonValue.style.color = "var(--primary-text-color)";
  }

  const selectedValue = selectedItem?.dataset.value;
  if (checkSubject(selectedValue) || isGlobalSelect) {
    if (onSelect) {
      onSelect(selectButtonValue, selectedItem, selectedValue);
    } else {
      setSelectValue(selectButtonValue, selectedValue);
    }
  } else {
    showMessageBlock(t("common:alerts.select_subject_error"), "error");
  }
};

export const createSubjectSelectMenu = () => {
  let html = `
    <div class="mobile-select-menu-header">
      <h3>${t("common:modals.select_subject")}</h3>
      <button type="button" class="exclude-btn close-select-menu-btn" title="${t("common:modals.close")}"><i class="bi bi-x-lg"></i></button>
    </div>
    <div class="select-search">
      <input id="select-search" type="search" placeholder="${t("common:modals.search_subject")}" />
    </div>
  `;

  Object.entries(subjectMenuObject).forEach(
    ([group, subjects], groupIdx, arr) => {
      html += createSubjectSelectMenuGroup(group, subjects);

      // Add separator between groups except after the last group
      if (groupIdx < arr.length - 1) {
        html += `<hr class="separator">`;
      }
    },
  );

  return html;
};

const createSubjectSelectMenuGroup = (group, subjects) => {
  let groupHtml = `<div class="select-group drop-down-group">`;
  const translatedGroup = group === "Other" ? t("common:forms.other") : t("common:subject_categories." + group, { defaultValue: group });
  groupHtml += `<div class="select-group-label drop-down-group-label">${translatedGroup}</div>`;
  groupHtml += `<hr class="separator">`;

  if (group === "Other") {
    groupHtml += `<input type="text" id="other-subject-input" class="other-subject-input" placeholder="${t("common:forms.specify_and_enter")}" />`;
  } else {
    groupHtml += subjects
      .map(
        (subject) =>
          `<div class="select-item drop-down-item" data-value="${subject}">${t("common:subjects." + subject, { defaultValue: subject })}</div>`,
      )
      .join("");
  }

  groupHtml += `</div>`;
  return groupHtml;
};

const handleOtherSubjectInputKeydown = (e, selectButtonValue, selectMenu) => {
  if (e.key === "Enter") {
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

const clearOtherSubjectInput = (otherSubjectInput, selectMenu) => {
  otherSubjectInput.value = "";
  const searchInput = selectMenu.querySelector(".select-search input");
  if (searchInput) {
    searchInput.value = "";
  }
};

const showSubjectInputError = (otherSubjectInput) => {
  otherSubjectInput.style.borderColor = "var(--error-color)";
  showMessageBlock(t("common:alerts.subject_input_error"), "error");
};

const removeErrorMessage = () => {
  const errorBox = document.querySelector(".error-box");
  if (errorBox) {
    errorBox.remove();
  }
};

export const toCapitalizeFirstLetter = (str) => {
  return str
    .trim()
    .split(" ")
    .map((word) => {
      return word.slice(0, 1).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

export const handleSelectSearchInput = (e, selectMenu) => {
  const searchValue = e.target.value.trim().toLowerCase();
  const rawSearchValue = e.target.value;
  const items = selectMenu.querySelectorAll(".select-item");
  let foundMatch = false;

  items.forEach((item) => {
    const itemText = item.textContent.toLowerCase();
    if (searchValue && itemText.includes(searchValue)) {
      if (!foundMatch) {
        foundMatch = true;
        const searchRect = e.target.getBoundingClientRect();
        const margin = searchRect.height + 8;
        selectMenu.scrollTop = Math.max(0, item.offsetTop - margin);
      }
      const regex = new RegExp(`(${searchValue})`, "gi");
      item.innerHTML = item.textContent.replace(regex, "<mark>$1</mark>");
    } else {
      item.innerHTML = item.textContent;
    }
  });

  const otherInput = selectMenu.querySelector(".other-subject-input");

  if (!searchValue) {
    selectMenu.scrollTo(0, 0);
    if (otherInput) {
      otherInput.value = "";
    }
  } else if (!foundMatch && otherInput) {
    otherInput.value = rawSearchValue;
    const searchRect = e.target.getBoundingClientRect();
    const margin = searchRect.height + 8;
    selectMenu.scrollTop = Math.max(0, otherInput.offsetTop - margin);
  }
};

export const createShowInSearchLabel = (checked, disabled) => {
  const showInSearchLabel = document.createElement("label");
  showInSearchLabel.className = "show-in-search-label container";
  showInSearchLabel.innerHTML = `
              <input type="checkbox" name="show-in-search" id="show-in-search" ${
                checked ? "checked" : ""
              } ${disabled ? "disabled" : ""} />
                <svg viewBox="0 0 64 64" height="2em" width="2em">
                <path d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16" pathLength="575.0541381835938" class="path"></path>
              </svg>
              <span>${t("common:forms.show_in_search")}</span>
            `;
  return showInSearchLabel;
};

export const setUpSwitchBtn = (wrapper) => {
  const btn = wrapper.querySelector(".switch-btn");
  if (btn) {
    const validValues = wrapper.querySelector(".visibility-input")
      ? visibilityValues
      : levelValues;
    const valueElement = wrapper.querySelector(".input");

    const getLocalizedValue = (val) => {
      const typeKey = wrapper.querySelector(".visibility-input")
        ? "visibility"
        : "levels";
      return t(`common:forms.${typeKey}.${val}`, { defaultValue: val });
    };

    const updateTooltip = (nextIndex) => {
      const nextValue = validValues[nextIndex];
      const localizedNext = getLocalizedValue(nextValue);
      btn.setAttribute(
        "data-tooltip",
        t("common:forms.switch_to", { value: localizedNext }),
      );
      hoverTooltip.textContent = t("common:forms.switch_to", {
        value: localizedNext,
      });
    };

    // Set initial tooltip
    const currentValue = valueElement.nextElementSibling?.matches(
      'input[type="hidden"]',
    )
      ? valueElement.nextElementSibling.value
      : valueElement?.dataset.value;
    const currentIndex = validValues.indexOf(currentValue);
    if (currentIndex !== -1) {
      valueElement.textContent = getLocalizedValue(validValues[currentIndex]);
      updateTooltip((currentIndex + 1) % validValues.length);
    } else {
      console.error("Invalid value:", currentValue);
    }

    const cycleRadioSelection = () => {
      const currentValue = valueElement.nextElementSibling?.matches(
        'input[type="hidden"]',
      )
        ? valueElement.nextElementSibling.value
        : valueElement?.dataset.value;
      const checkedIndex = validValues.indexOf(currentValue);

      if (checkedIndex !== -1) {
        const newIndex = (checkedIndex + 1) % validValues.length;
        valueElement.textContent = getLocalizedValue(validValues[newIndex]);
        if (wrapper.querySelector(".visibility-input")) {
          if (validValues[newIndex] === "Private") {
            // Create the label element for "Show in Search Results"
            const showInSearchLabel = createShowInSearchLabel(true);
            wrapper.appendChild(showInSearchLabel);
          } else {
            const showInSearchLabel = wrapper.querySelector(
              ".show-in-search-label",
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
        console.error("Invalid value:", currentValue);
      }
    };

    btn.addEventListener("click", cycleRadioSelection);
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
      if (value === "on") {
        data[key] = true;
      }
      if (value === "off") {
        data[key] = false;
      }
    });

    onSuccess && onSuccess(data);
  }
};

export const handleFormSubmit = (form, validateFn, onSuccess) => {
  form.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.matches("input")) {
      handleFormSubmission(e, form, validateFn, onSuccess);
    }
  });
  form.addEventListener("submit", (e) => {
    handleFormSubmission(e, form, validateFn, onSuccess);
  });
};