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

export const redirectTo = (url) => {
  location.href = url;
};

export const removeBlock = function () {
  this.parentElement.remove();
};

/**
 * Shows a message block in the DOM.
 * @param {String} message - The message to show in the DOM.
 * @param {Boolean} error - Indicates if the message is an error (true) or success (false).
 */
export const showMessageBlock = (message, error) => {
  let messagesBlocksWrapper = document.querySelector(
    '.messages-blocks-wrapper'
  );
  if (!messagesBlocksWrapper) {
    messagesBlocksWrapper = document.createElement('div');
    messagesBlocksWrapper.className = 'messages-blocks-wrapper';
    document.body.appendChild(messagesBlocksWrapper);
  }
  const msgBlock = document.createElement('div');
  msgBlock.className = `${error ? 'error' : 'success'}-block`;
  msgBlock.innerHTML = `
    <p>
      <i class="bi bi-${error ? 'exclamation' : 'check'}-circle-fill"></i>
      ${message}
    </p>
    <i class="bi bi-x"></i>
    <div>
      <hr>
    </div>
  `;
  msgBlock.querySelector('.bi-x').addEventListener('click', removeBlock);
  const firstMsgBlockChild = messagesBlocksWrapper.firstElementChild;
  messagesBlocksWrapper.insertBefore(msgBlock, firstMsgBlockChild);
  setTimeout(() => {
    msgBlock.remove();
  }, 11200);
};
