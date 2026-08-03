import { t } from "../../../../../main_assets/js/i18n.js";
import {
  MAX_AVATAR_SIZE,
  PROFILE_ALLOWED_TYPES,
} from "../../../../../main_assets/js/variables.js";

const handleFileAndvisuallyShowAvatar = (file, container) => {
  if (file) {
    const reader = new FileReader();
    container.querySelector(".error").innerHTML = "";
    reader.readAsDataURL(file);
    reader.onloadend = function () {
      container.querySelector("img").src = reader.result;
    };
  }
};

const showAvatarError = (message, container) => {
  container.querySelector(".error").innerHTML =
    `<i class="bi bi-exclamation-circle"></i>${message}`;
};

const handleFileInput = (file, avatarContainer) => {
  const fileInput = avatarContainer.querySelector("input");
  if (fileInput.disabled) return;
  
  if (!file) {
    // User cancelled dialog or input was cleared programmatically
    fileInput.value = "";
    avatarContainer.querySelector("img").src = "/login/assets/images/user.webp"; // fallback 
    avatarContainer.querySelector(".error").innerHTML = "";
    // Hide clear button if it exists in the DOM alongside the container
    const clearBtn = avatarContainer.nextElementSibling;
    if (clearBtn && clearBtn.id === "clear-avatar-btn") clearBtn.style.display = "none";
    return;
  }

  if (!PROFILE_ALLOWED_TYPES.includes(file.type)) {
    fileInput.value = ""; // Clear bad file
    avatarContainer.querySelector("img").src = "/login/assets/images/user.webp"; // Reset preview
    const clearBtn = avatarContainer.nextElementSibling;
    if (clearBtn && clearBtn.id === "clear-avatar-btn") clearBtn.style.display = "none";
    return showAvatarError(
      t("shared:alerts.invalid_file_type"),
      avatarContainer,
    );
  }

  if (file.size > MAX_AVATAR_SIZE) {
    fileInput.value = ""; // Clear bad file
    avatarContainer.querySelector("img").src = "/login/assets/images/user.webp"; // Reset preview
    const clearBtn = avatarContainer.nextElementSibling;
    if (clearBtn && clearBtn.id === "clear-avatar-btn") clearBtn.style.display = "none";
    return showAvatarError(
      t("shared:alerts.avatar_size_exceeded", {
        size: MAX_AVATAR_SIZE / (1024 * 1024),
      }),
      avatarContainer,
    );
  }

  handleFileAndvisuallyShowAvatar(file, avatarContainer);
  // Show clear button if it exists
  const clearBtn = avatarContainer.nextElementSibling;
  if (clearBtn && clearBtn.id === "clear-avatar-btn") clearBtn.style.display = "flex";
};

export const setUpFileInputListeners = (avatarContainer, avatarAside) => {
  const fileinput = avatarContainer.querySelector("input");

  fileinput.addEventListener("change", function () {
    const file = this.files[0];
    handleFileInput(file, avatarContainer, avatarAside);
  });

  avatarContainer.addEventListener("dragenter", (e) => {
    if (
      e.target === avatarContainer &&
      !avatarContainer.contains(e.relatedTarget)
    ) {
      avatarContainer.classList.add("file-drag-start");
    }
  });

  avatarContainer.addEventListener("dragleave", (e) => {
    if (
      e.target === avatarContainer &&
      !avatarContainer.contains(e.relatedTarget)
    ) {
      avatarContainer.classList.remove("file-drag-start");
    }
  });

  avatarContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    avatarContainer.classList.remove("file-drag-start");
    
    if (file) {
      fileinput.files = e.dataTransfer.files;
      // Dispatch change event so other listeners (like clear button) can react
      fileinput.dispatchEvent(new Event('change'));
    }
  });

  avatarContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
  });
};
