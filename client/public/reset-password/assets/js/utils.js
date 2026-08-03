import { t } from "../../../main_assets/js/i18n.js";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordRegex,
} from "../../../main_assets/js/variables.js";
import { confirmPasswordField, main, passwordField } from "./dom-variables.js";
export const splitUrlParams = (paramName) => {
  const searchParams = new URLSearchParams(location.search);
  return searchParams.get(paramName);
};

export const clearInputFields = () => {
  passwordField.value = "";
  confirmPasswordField.value = "";
};
const hideErrors = (...elements) => {
  elements.forEach((element) => {
    const container = element.parentElement.parentElement;
    container.classList.remove("error-input");
    container.classList.remove("error-animation");
    void container.offsetWidth;
    container.nextElementSibling.firstElementChild.innerHTML = "";
  });
};

export const showError = (errorMessage, element) => {
  const container = element.parentElement.parentElement;
  container.nextElementSibling.firstElementChild.innerHTML = `<span>&#xF333;</span> ${errorMessage}`;
  container.classList.add("error-input");
  container.classList.add("error-animation");
  element.focus();
};

export const showErrorMsg = (title, message) => {
  main.innerHTML = `
  <div class="error-container">
  <h2>
    <i class="bi bi-exclamation-circle-fill"></i>
    ${title}
  </h2>
  <span class="error-msg">
    ${message}
  </span>
  </div>
        `;
  main.style.backgroundColor = "var(--error-block-background-color)";
  main.style.borderColor = "var(--error-block-border-color)";
};

export const verifyPasswordFields = () => {
  hideErrors(passwordField, confirmPasswordField);
  const password = passwordField.value.trim();
  const confirmPassword = confirmPasswordField.value.trim();
  if (password !== confirmPassword) {
    showError(
      t("common:shared_terms.passwords_do_not_match"),
      confirmPasswordField,
    );
  }

  if (!passwordRegex.test(password)) {
    showError(
      t(
        "common:shared_terms.the_password_must_be_between_min_and_max_characters",
        { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH },
      ),
      passwordField,
    );
  }

  if (!passwordRegex.test(password) || password !== confirmPassword) {
    return false;
  }
  return true;
};
