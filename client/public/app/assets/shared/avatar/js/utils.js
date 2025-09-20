export const handleFileAndvisuallyShowAvatar = (file, container) => {
  if (file) {
    const sizeKB = file.size / 1024;
    if (sizeKB > MAX_FILE_SIZE) {
      showAvatarError(`File size exceeds the limit of ${MAX_FILE_SIZE}.`);
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
