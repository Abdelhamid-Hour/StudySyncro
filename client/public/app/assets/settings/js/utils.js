import { redirectTo } from "../../../../main_assets/js/utils.js";
import {
  emailRegex,
  passwordRegex,
  userNameRegex,
} from "../../../../main_assets/js/variables.js";
import {
  avatarMaxSize,
  globalTooltip,
  profileAllowedFileTypes,
} from "../../global/js/dom-variables.js";
import {
  handleApiAction,
  resetTooltip,
  showConfirmationBox,
  showErrorTooltip,
} from "../../global/js/utils.js";
import { handleFormSubmit } from "../../shared/forms/js/utils.js";
import { getFreshTokenId } from "./auth.js";
import {
  avatarCaption,
  avatarHover,
  avatarInput,
  fullNameInput,
  passwordCheckContainer,
  passwordEmailInput,
  confirmPasswordInput,
  currentPasswordInput,
  newPasswordInput,
  passwordDeleteInput,
  deleteAccountConfirmation,
  emailInput,
} from "./dom-variables.js";

const oldValues = {
  fullName: "",
  email: "",
  password: "", // only at submit
};

const toSubmitBtn = (btn) => {
  btn.type = "submit";
  btn.className = "blue-btn save-btn";
  btn.innerHTML = `
        <i class="bi bi-floppy"></i>
        Save Changes
      `;
};

const toModifyBtn = (btn) => {
  btn.type = "button";
  btn.className = "blue-btn modify-btn";
};

export const initOldValues = () => {
  oldValues.fullName = fullNameInput.value.trim();
  oldValues.email = emailInput.value.trim();
  oldValues.password = currentPasswordInput?.value; // only at submit
};

export const handlEyeIconsClick = (eyeIcon) => {
  const isChecked = eyeIcon.querySelector("input").checked;
  const input = eyeIcon.previousElementSibling;
  if (isChecked) {
    input.setAttribute("type", "text");
  } else {
    input.setAttribute("type", "password");
  }
};

export const enableProfileEditMode = (profileModifyBtn, e) => {
  e.preventDefault();
  fullNameInput.readOnly = false;
  avatarInput.disabled = false;
  avatarHover.classList.remove("hidden");
  fullNameInput.focus();
  avatarCaption.classList.remove("hidden");
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "gray-btn cancel-btn";
  cancelBtn.innerHTML = `
        <i class="bi bi-x-lg"></i>
        Cancel
      `;
  profileModifyBtn.before(cancelBtn);
  toSubmitBtn(profileModifyBtn);
  cancelBtn.addEventListener("click", (e) =>
    disableProfileMode(profileModifyBtn)
  );
};

const disableProfileMode = (profileSaveBtn) => {
  if (!profileSaveBtn) return;
  fullNameInput.readOnly = true;
  avatarInput.disabled = true;
  avatarCaption.classList.add("hidden");
  avatarHover.classList.add("hidden");
  document.querySelector(".profile-tab-content .cancel-btn")?.remove();
  profileSaveBtn.innerHTML = `
      <i class="bi bi-pencil"></i >
      Modify Profile
    `;
  toModifyBtn(profileSaveBtn);
  resetTooltip(globalTooltip);
};

const checkValidation = () => {
  const fullName = fullNameInput.value.trim();
  const avatarFile = avatarInput.files[0];

  if (!fullName) {
    showErrorTooltip("Full name cannot be empty.", fullNameInput);
    return false;
  } else if (
    (fullName.split(" ").length < 2 && fullName.split(" ").length > 3) ||
    fullName.length < 6 ||
    fullName.length > 50 ||
    !userNameRegex.test(fullName)
  ) {
    showErrorTooltip(
      "Full name must be 6-50 characters long, contain only letters and spaces, and include at least a first and last name.",
      fullNameInput
    );
    return false;
  } else {
    resetTooltip(globalTooltip, fullNameInput.closest(".field-container"));
  }

  if (avatarFile && !profileAllowedFileTypes.includes(avatarFile.type)) {
    showErrorTooltip(
      "Invalid file type. Allowed types: JPEG, PNG, GIF, WEBP.",
      avatarInput,
      "avatar"
    );
    return false;
  } else if (avatarFile && avatarFile.size > avatarMaxSize) {
    showErrorTooltip(
      `File size exceeds ${avatarMaxSize / (1024 * 1024)} MB.`,
      avatarInput,
      "avatar"
    );
    return false;
  } else {
    resetTooltip(globalTooltip, avatarInput.closest(".avatar"));
  }

  if (fullName === oldValues.fullName && !avatarFile) {
    showErrorTooltip("No changes made to save.", fullNameInput);
    return false;
  }

  return true;
};

export const handleProfileSaveBtn = () => {
  const form = document.querySelector(".profile-form");
  handleFormSubmit(form, checkValidation, async (data) => {
    const avatarFile = avatarInput.files[0];

    const profileSaveBtn = form.querySelector(".save-btn");

    const formData = new FormData();
    if (data["full-name"] !== oldValues.fullName)
      formData.append("fullName", data["full-name"]);

    if (avatarFile) formData.append("file", avatarFile);

    return handleApiAction("/update-profile", formData, profileSaveBtn, {
      successMsg: "Profile updated successfully.",
      onSuccess: () => disableProfileMode(profileSaveBtn),
      method: "PATCH",
      toOldBtn: false,
    });
  });
};

const enableEmailEditMode = (emailModifyBtn, e) => {
  e.preventDefault();
  emailInput.readOnly = false;
  passwordCheckContainer.classList.remove("hidden");
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "gray-btn cancel-btn";
  cancelBtn.innerHTML = `
        <i class="bi bi-x-lg"></i>
        Cancel
      `;
  emailModifyBtn.before(cancelBtn);
  toSubmitBtn(emailModifyBtn);
  cancelBtn.addEventListener("click", (e) =>
    disableEmailEditMode(emailModifyBtn)
  );
  emailInput.focus();
};

const disableEmailEditMode = (emailSaveBtn) => {
  if (!emailSaveBtn) return;
  emailInput.readOnly = true;
  passwordCheckContainer.classList.add("hidden");
  emailSaveBtn.innerHTML = `
          <i class="bi bi-pencil"></i>
          Modify Email
  `;
  toModifyBtn(emailSaveBtn);
  document.querySelector(".email-tab-content .cancel-btn")?.remove();
  clearEmailInputs();
  resetTooltip(globalTooltip);
};

const clearEmailInputs = () => {
  passwordEmailInput.value = "";
};

const checkEmailValidation = () => {
  const email = emailInput.value.trim();
  const password = passwordEmailInput?.value.trim();

  if (!email) {
    showErrorTooltip("Email cannot be empty.", emailInput);
    return false;
  } else if (!emailRegex.test(email)) {
    showErrorTooltip("Invalid email format.", emailInput);
    return false;
  } else {
    resetTooltip(globalTooltip, emailInput.closest(".field-container"));
  }

  if (passwordEmailInput) {
    if (!password) {
      showErrorTooltip("Password cannot be empty.", passwordEmailInput);
      return false;
    } else if (!passwordRegex.test(password)) {
      showErrorTooltip(
        "Password must be between 8 and 16 characters and can include letters, numbers, and special characters.",
        passwordEmailInput
      );
      return false;
    } else {
      resetTooltip(
        globalTooltip,
        passwordEmailInput.closest(".field-container")
      );
    }
  }

  if (oldValues.email === email) {
    showErrorTooltip(
      "New email cannot be the same as the current email.",
      emailInput
    );
    return false;
  }

  return true;
};

export const handleEmailSaveBtn = () => {
  const form = document.querySelector(".email-form");
  handleFormSubmit(form, checkEmailValidation, async (data) => {
    const emailSaveBtn = form.querySelector(".save-btn");
    const emailSubmitBtn = form.querySelector(".submit-modification-btn");
    const emailAddBtn = form.querySelector(".add-btn");

    if (emailSaveBtn || emailSubmitBtn)
      return handleApiAction(
        "/update-email",
        {
          newEmail: data["email"],
        },
        emailSaveBtn,
        {
          successMsg: "Email updated successfully. Please log in again.",
          onSuccess: () => {
            if (emailSaveBtn) disableEmailEditMode(emailSaveBtn);
            redirectTo("/login");
          },
          method: "PATCH",
          toOldBtn: emailSubmitBtn ? true : false,
          getExtraData: async () => await getFreshTokenId(data["password"]),
        }
      );

    if (emailAddBtn)
      return handleApiAction(
        "/add-email",
        {
          email: data["email"],
        },
        emailAddBtn,
        {
          successMsg: "Email added successfully. Please log in again.",
          onSuccess: () => redirectTo("/login"),
          method: "POST",
          getExtraData: async () => await getFreshTokenId(data["password"]),
        }
      );
  });
};

export const handleSettingsWrapperClick = (e) => {
  const tab = e.target.closest(".tab");
  if (tab) {
    const emailSaveBtn = document.querySelector(".email-tab-content .save-btn");
    const profileSaveBtn = document.querySelector(
      ".profile-tab-content .save-btn"
    );
    disableEmailEditMode(emailSaveBtn);
    disableProfileMode(profileSaveBtn);
    clearPasswordFields();
  }

  const eyeIcon = e.target.closest(".eye-icon");
  if (eyeIcon) handlEyeIconsClick(eyeIcon);

  const profileModifyBtn = e.target.closest(".profile-tab-content .modify-btn");
  if (profileModifyBtn) enableProfileEditMode(profileModifyBtn, e);

  const emailModifyBtn = e.target.closest(".email-tab-content .modify-btn");
  if (emailModifyBtn) enableEmailEditMode(emailModifyBtn, e);
};

const checkPasswordFields = () => {
  const currentPassword = currentPasswordInput?.value.trim();
  const newPassword = newPasswordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  if (currentPasswordInput) {
    if (!currentPassword) {
      showErrorTooltip("Current password is required.", currentPasswordInput);
      return false;
    } else if (!passwordRegex.test(currentPassword)) {
      showErrorTooltip(
        "New password must be between 8 and 16 characters long.",
        currentPasswordInput
      );
      return false;
    } else {
      resetTooltip(
        globalTooltip,
        currentPasswordInput.closest(".field-container")
      );
    }
  }

  if (!newPassword) {
    showErrorTooltip("New password is required.", newPasswordInput);
    return false;
  } else if (!passwordRegex.test(newPassword)) {
    showErrorTooltip(
      "New password must be between 8 and 16 characters long.",
      newPasswordInput
    );
    return false;
  } else {
    resetTooltip(globalTooltip, newPasswordInput.closest(".field-container"));
  }

  if (!confirmPassword) {
    showErrorTooltip("Confirm password is required.", confirmPasswordInput);
    return false;
  } else if (!passwordRegex.test(confirmPassword)) {
    showErrorTooltip(
      "Confirm password must be between 8 and 16 characters long.",
      confirmPasswordInput
    );
    return false;
  } else if (newPassword !== confirmPassword) {
    showErrorTooltip(
      "New password and confirm password do not match.",
      confirmPasswordInput
    );
    return false;
  } else {
    resetTooltip(
      globalTooltip,
      confirmPasswordInput.closest(".field-container")
    );
  }

  if (currentPassword === newPassword) {
    showErrorTooltip(
      "New password must be different from the current password.",
      newPasswordInput
    );
    return false;
  }

  return true;
};

const clearPasswordFields = () => {
  if (currentPasswordInput) {
    currentPasswordInput.value = "";
  }
  newPasswordInput.value = "";
  confirmPasswordInput.value = "";
};

export const handlePasswordModifyClick = () => {
  const form = document.querySelector(".password-form");
  handleFormSubmit(form, checkPasswordFields, async (data) => {
    const passModifyBtn = form.querySelector(".modify-btn");
    const passAddBtn = form.querySelector(".add-btn");

    if (passModifyBtn)
      return handleApiAction(
        "/update-password",
        {
          newPassword: data["new-password"],
        },
        passModifyBtn,
        {
          successMsg: "Password updated successfully. Please log in again.",
          onSuccess: () => {
            clearPasswordFields();
            redirectTo("/login");
          },
          method: "PATCH",
          getExtraData: async () =>
            await getFreshTokenId(data["current-password"]),
        }
      );

    if (passAddBtn)
      return handleApiAction(
        "/add-password",
        {
          password: data["new-password"],
        },
        passAddBtn,
        {
          successMsg: "Password added successfully. Please log in again.",
          onSuccess: () => redirectTo("/login"),
          method: "POST",
          getExtraData: async () =>
            await getFreshTokenId(data["current-password"]),
        }
      );
  });
};

const checkDeleteInputsValidity = () => {
  const passwordDelete = passwordDeleteInput?.value.trim();
  const isConfirme = deleteAccountConfirmation.checked;

  if (passwordDeleteInput) {
    if (!passwordDelete) {
      showErrorTooltip(
        "Password is required to delete account.",
        passwordDeleteInput
      );
      return false;
    } else if (!passwordRegex.test(passwordDelete)) {
      showErrorTooltip(
        "Password must be between 8 and 16 characters long.",
        passwordDeleteInput
      );
      return false;
    } else {
      resetTooltip(
        globalTooltip,
        passwordDeleteInput.closest(".field-container")
      );
    }
  }
  if (!isConfirme) {
    showErrorTooltip(
      "You must confirm account deletion.",
      deleteAccountConfirmation,
      "container"
    );
    return false;
  } else {
    resetTooltip(globalTooltip, deleteAccountConfirmation);
  }

  return true;
};

export const handleCloseAccountBtn = () => {
  const form = document.querySelector(".delete-account-form");
  handleFormSubmit(form, checkDeleteInputsValidity, async (data) => {
    const res = await showConfirmationBox(
      "exclamation",
      "Are you sure you want to delete your account?",
      "This action is irreversible and will result in the loss of all your data.",
      "Cancel",
      "Yes, delete my account"
    );

    if (!res) return;

    const deleteAccountBtn = form.querySelector(".delete-account-btn");

    return handleApiAction("/close-account", {}, deleteAccountBtn, {
      successMsg: "Account closed successfully. Bye!👋",
      method: "POST",
      getExtraData: async () => await getFreshTokenId(data["password"]),
    });
  });
};
