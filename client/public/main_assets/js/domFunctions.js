// Add Event listener for eye icon click to toggle password visibility
export const handlEyeIconsClick = (eyeIcons) => {
  eyeIcons.forEach((e) => {
    e.addEventListener('click', () => {
      e.lastElementChild.classList.toggle('show');
      if (e.previousElementSibling.getAttribute('type') === 'password') {
        e.previousElementSibling.setAttribute('type', 'text');
      } else {
        e.previousElementSibling.setAttribute('type', 'password');
      }
    });
  });
};
