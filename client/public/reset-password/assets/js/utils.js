import { passwordRegex } from '../../../main_assets/js/dom-variables.js';
import { main, passwordField, confirmPasswordField } from './dom-variables.js';
export const splitUrlParams = (paramName) => {
  const searchParams = new URLSearchParams(location.search);
  return searchParams.get(paramName);
};

export const clearInputFields = () => {
  passwordField.value = '';
  confirmPasswordField.value = '';
};
const hideErrors = (...elements) => {
  elements.forEach((element) => {
    const container = element.parentElement.parentElement;
    container.classList.remove('error');
    container.classList.remove('error-animation');
    void container.offsetWidth;
    container.nextElementSibling.firstElementChild.innerHTML = '';
  });
};

export const showError = (errorMessage, element) => {
  const container = element.parentElement.parentElement;
  container.nextElementSibling.firstElementChild.innerHTML = `<span>&#xF333;</span> ${errorMessage}`;
  container.classList.add('error');
  container.classList.add('error-animation');
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
  main.style.backgroundColor = 'var(--error-block-background-color)';
  main.style.borderColor = 'var(--error-block-border-color)';
};

export const verifyPasswordFields = () => {
  hideErrors(passwordField, confirmPasswordField);
  const password = passwordField.value.trim();
  const confirmPassword = confirmPasswordField.value.trim();
  if (password !== confirmPassword) {
    showError('Passwords do not match', confirmPasswordField);
  }

  if (!passwordRegex.test(password)) {
    showError('The password must be at least 8 characters', passwordField);
  }

  if (!passwordRegex.test(password) || password !== confirmPassword) {
    return false;
  }
  return true;
};
