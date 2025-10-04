import {
  MAX_AVATAR_SIZE,
  PROFILE_ALLOWED_TYPES,
} from "../../../../../main_assets/js/variables.js";

const handleFileAndvisuallyShowAvatar = (file, container) => {
  if (file) {
    const sizeKB = file.size;
    if (sizeKB > MAX_AVATAR_SIZE) {
      showAvatarError(
        `File size exceeds the limit of ${MAX_AVATAR_SIZE}.`,
        container
      );
      return;
    }
    const reader = new FileReader();
    container.querySelector(".error").innerHTML = "";
    reader.readAsDataURL(file);
    reader.onloadend = function () {
      container.querySelector("img").src = reader.result;
    };
  }
};

const showAvatarError = (message, container) => {
  container.querySelector(
    ".error"
  ).innerHTML = `<i class="bi bi-exclamation-circle"></i>${message}`;
};

const handleFileInput = (file, avatarContainer, avatarAside = null) => {
  const fileInput = avatarContainer.querySelector("input");
  if (fileInput.disabled) return;
  if (!(file && PROFILE_ALLOWED_TYPES.includes(file.type)))
    return showAvatarError(
      "Invalid file type. Please select a valid image file.",
      avatarContainer
    );
  handleFileAndvisuallyShowAvatar(file, avatarContainer);
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
      console.log("drag enter");

      avatarContainer.classList.add("file-drag-start");
    }
  });

  avatarContainer.addEventListener("dragleave", (e) => {
    if (
      e.target === avatarContainer &&
      !avatarContainer.contains(e.relatedTarget)
    ) {
      console.log("drag leave");

      avatarContainer.classList.remove("file-drag-start");
    }
  });

  avatarContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    avatarContainer.classList.remove("file-drag-start");
    handleFileInput(file, avatarContainer, avatarAside);
  });

  avatarContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
  });
};
