import {
  handleApiAction,
  redirectTo,
  resetTooltip,
  showConfirmationBox,
  showErrorTooltip,
  t,
} from "../../global/js/utils.js";
import {
  EMAIL_MAX_LENGTH,
  EMAIL_MIN_LENGTH,
  emailRegex,
  globalTooltip,
  NAME_TITLE_MAX_LENGTH,
  NAME_TITLE_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordRegex,
  PROFILE_ALLOWED_TYPES,
  userNameRegex,
} from "../../global/js/variables.js";
import { handleFormSubmit } from "../../shared/forms/js/utils.js";
import { getFreshTokenId } from "./auth.js";
import {
  avatarCaption,
  avatarContainer,
  avatarHover,
  avatarInput,
  confirmPasswordInput,
  currentPasswordInput,
  deleteAccountConfirmation,
  emailInput,
  fullNameInput,
  newPasswordInput,
  passwordCheckContainer,
  passwordDeleteInput,
  passwordEmailInput,
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
        ${t("settings:buttons.save_changes")}
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
  oldValues.avatar = avatarContainer.querySelector("img").src;
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
        ${t("common:modals.cancel")}
      `;
  profileModifyBtn.before(cancelBtn);
  toSubmitBtn(profileModifyBtn);
  cancelBtn.addEventListener("click", (e) => {
    disableProfileMode(profileModifyBtn);
    fullNameInput.value = oldValues.fullName;
    avatarInput.value = "";
    avatarContainer.querySelector("img").src = oldValues.avatar;
    avatarContainer.querySelector(".error").innerHTML = "";
  });
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
      ${t("common:skeletons.settings.modify_btn")}
    `;
  toModifyBtn(profileSaveBtn);
  resetTooltip(globalTooltip);
};

const checkValidation = () => {
  const fullName = fullNameInput.value.trim();
  const avatarFile = avatarInput.files[0];

  if (!fullName) {
    showErrorTooltip(t("settings:validation.fullname_empty"), fullNameInput);
    return false;
  } else if (
    (fullName.split(" ").length < 2 && fullName.split(" ").length > 3) ||
    fullName.length < NAME_TITLE_MIN_LENGTH ||
    fullName.length > NAME_TITLE_MAX_LENGTH ||
    !userNameRegex.test(fullName)
  ) {
    showErrorTooltip(
      t("settings:validation.fullname_invalid", {
        min: NAME_TITLE_MIN_LENGTH * 2,
        max: NAME_TITLE_MAX_LENGTH,
      }),
      fullNameInput,
    );
    return false;
  } else {
    resetTooltip(globalTooltip, fullNameInput.closest(".field-container"));
  }

  if (avatarFile && !PROFILE_ALLOWED_TYPES.includes(avatarFile.type)) {
    showErrorTooltip(
      t("settings:validation.avatar_type"),
      avatarInput,
      "avatar",
    );
    return false;
  } else if (avatarFile && avatarFile.size > MAX_AVATAR_SIZE) {
    showErrorTooltip(
      t("shared:alerts.avatar_size_exceeded", {
        size: MAX_AVATAR_SIZE / (1024 * 1024),
      }),
      avatarInput,
      "avatar",
    );
    return false;
  } else {
    resetTooltip(globalTooltip, avatarInput.closest(".avatar"));
  }

  if (fullName === oldValues.fullName && !avatarFile) {
    showErrorTooltip(t("settings:validation.no_changes"), fullNameInput);
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
      successMsg: t("settings:alerts.profile_updated_success"),
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
        ${t("common:modals.cancel")}
      `;
  emailModifyBtn.before(cancelBtn);
  toSubmitBtn(emailModifyBtn);
  cancelBtn.addEventListener("click", (e) => {
    disableEmailEditMode(emailModifyBtn);
    emailInput.value = oldValues.email;
  });
  emailInput.focus();
};

const disableEmailEditMode = (emailSaveBtn) => {
  if (!emailSaveBtn) return;
  emailInput.readOnly = true;
  passwordCheckContainer.classList.add("hidden");
  emailSaveBtn.innerHTML = `
          <i class="bi bi-pencil"></i>
          ${t("settings:buttons.modify_email")}
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
    showErrorTooltip(t("settings:validation.email_empty"), emailInput);
    return false;
  } else if (
    !emailRegex.test(email) ||
    email.length < EMAIL_MIN_LENGTH ||
    email.length > EMAIL_MAX_LENGTH
  ) {
    showErrorTooltip(
      t("settings:validation.email_invalid", {
        min: EMAIL_MIN_LENGTH,
        max: EMAIL_MAX_LENGTH,
      }),
      emailInput,
    );
    return false;
  } else {
    resetTooltip(globalTooltip, emailInput.closest(".field-container"));
  }

  if (passwordEmailInput) {
    if (!password) {
      showErrorTooltip(
        t("settings:validation.password_empty"),
        passwordEmailInput,
      );
      return false;
    } else {
      resetTooltip(
        globalTooltip,
        passwordEmailInput.closest(".field-container"),
      );
    }
  }

  if (oldValues.email === email) {
    showErrorTooltip(t("settings:validation.email_same"), emailInput);
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
          successMsg: t("settings:alerts.email_updated_check_inbox"),
          onSuccess: () => {
            if (emailSaveBtn) disableEmailEditMode(emailSaveBtn);
            setTimeout(() => {
              redirectTo("/login");
            }, 3500);
          },
          method: "PATCH",
          toOldBtn: emailSubmitBtn ? true : false,
          getExtraData: async () => await getFreshTokenId(data["password"]),
        },
      );

    if (emailAddBtn)
      return handleApiAction(
        "/add-email",
        {
          email: data["email"],
        },
        emailAddBtn,
        {
          successMsg: t("settings:alerts.email_added_check_inbox"),
          onSuccess: () => {
            setTimeout(() => {
              redirectTo("/login");
            }, 3500);
          },
          method: "POST",
          getExtraData: async () => await getFreshTokenId(data["password"]),
        },
      );
  });
};

export const handleSettingsWrapperClick = (e) => {
  const tab = e.target.closest(".tab");
  if (tab) {
    const emailSaveBtn = document.querySelector(".email-tab-content .save-btn");
    const profileSaveBtn = document.querySelector(
      ".profile-tab-content .save-btn",
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
      showErrorTooltip(
        t("settings:validation.current_password_required"),
        currentPasswordInput,
      );
      return false;
    } else {
      resetTooltip(
        globalTooltip,
        currentPasswordInput.closest(".field-container"),
      );
    }
  }

  if (!newPassword) {
    showErrorTooltip(
      t("settings:validation.new_password_required"),
      newPasswordInput,
    );
    return false;
  } else if (!passwordRegex.test(newPassword)) {
    showErrorTooltip(
      t("settings:validation.new_password_invalid", {
        min: PASSWORD_MIN_LENGTH,
        max: PASSWORD_MAX_LENGTH,
      }),
      newPasswordInput,
    );
    return false;
  } else {
    resetTooltip(globalTooltip, newPasswordInput.closest(".field-container"));
  }

  if (!confirmPassword) {
    showErrorTooltip(
      t("settings:validation.confirm_password_required"),
      confirmPasswordInput,
    );
    return false;
  } else if (!passwordRegex.test(confirmPassword)) {
    showErrorTooltip(
      t("settings:validation.confirm_password_invalid", {
        min: PASSWORD_MIN_LENGTH,
        max: PASSWORD_MAX_LENGTH,
      }),
      confirmPasswordInput,
    );
    return false;
  } else if (newPassword !== confirmPassword) {
    showErrorTooltip(
      t("settings:validation.passwords_dont_match"),
      confirmPasswordInput,
    );
    return false;
  } else {
    resetTooltip(
      globalTooltip,
      confirmPasswordInput.closest(".field-container"),
    );
  }

  if (currentPassword === newPassword) {
    showErrorTooltip(
      t("settings:validation.new_password_same_as_current"),
      newPasswordInput,
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
          successMsg: t("settings:alerts.password_updated_success"),
          onSuccess: () => {
            clearPasswordFields();
            redirectTo("/login");
          },
          method: "PATCH",
          getExtraData: async () =>
            await getFreshTokenId(data["current-password"]),
        },
      );

    if (passAddBtn)
      return handleApiAction(
        "/add-password",
        {
          password: data["new-password"],
        },
        passAddBtn,
        {
          successMsg: t("settings:alerts.password_added_success"),
          onSuccess: () => redirectTo("/login"),
          method: "POST",
          getExtraData: async () =>
            await getFreshTokenId(data["current-password"]),
        },
      );
  });
};

const checkDeleteInputsValidity = () => {
  const passwordDelete = passwordDeleteInput?.value.trim();
  const isConfirme = deleteAccountConfirmation.checked;

  if (passwordDeleteInput) {
    if (!passwordDelete) {
      showErrorTooltip(
        t("settings:validation.password_required_to_delete"),
        passwordDeleteInput,
      );
      return false;
    } else {
      resetTooltip(
        globalTooltip,
        passwordDeleteInput.closest(".field-container"),
      );
    }
  }
  if (!isConfirme) {
    showErrorTooltip(
      t("settings:validation.confirm_delete"),
      deleteAccountConfirmation,
      "container",
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
      t("settings:modals.delete_account_confirm_title"),
      t("settings:modals.delete_account_confirm_desc"),
      t("common:modals.cancel"),
      t("settings:modals.delete_account_confirm_btn"),
    );

    if (!res) return;

    const deleteAccountBtn = form.querySelector(".delete-account-btn");

    return handleApiAction("/close-account", {}, deleteAccountBtn, {
      successMsg: t("settings:alerts.account_closed_success"),
      method: "POST",
      getExtraData: async () => await getFreshTokenId(data["password"]),
    });
  });
};
