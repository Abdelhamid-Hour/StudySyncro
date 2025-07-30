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

/**
 * Throttles a function to prevent it from being called too frequently.
 * @param {Number} TimeInterval - The time interval in milliseconds to wait before executing the callback function again.
 * @param {Function} callback - The function to be executed after the specified time interval.
 * @returns {Function} - The throttled function.
 */
export const throttling = function (TimeInterval, callback, notFireFirstTime) {
  let inAction = false;
  return function (...args) {
    if (!inAction) {
      inAction = true;
      if (!notFireFirstTime) callback.apply(this, args);
      setTimeout(() => {
        if (notFireFirstTime) callback.apply(this, args);
        inAction = false;
      }, TimeInterval);
    }
  };
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
export const showMessageBlock = (message, type) => {
  let messagesBlocksWrapper = document.querySelector(
    '.messages-blocks-wrapper'
  );
  if (!messagesBlocksWrapper) {
    messagesBlocksWrapper = document.createElement('div');
    messagesBlocksWrapper.className = 'messages-blocks-wrapper';
    document.body.appendChild(messagesBlocksWrapper);
  }
  const msgBlock = document.createElement('div');
  msgBlock.className = `${type}-block`;
  msgBlock.innerHTML = `
    <p>
      <i class="bi bi-${
        type === 'error' ? 'exclamation' : type === 'info' ? 'info' : 'check'
      }-circle-fill"></i>
      <span>${message}</span>
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

const fetchStructure = async (url, method, options, extraHeaders) => {
  const csrfToken = getCookie('csrfToken');
  const response = await fetch(url, {
    method: method,
    headers: {
      ...extraHeaders,
      csrfToken: csrfToken,
    },
    credentials: 'include',
    ...options,
  });
  if (!response.ok) {
    if (response.status === 401) {
      // Handle unauthorized access
      showMessageBlock(
        '🚫 You are not authorized to access this resource. Please log in.',
        'error'
      );
      setTimeout(() => {
        redirectTo('/login');
      }, 2000);
      return;
    }

    // if the responce is for redirection
    if (response.status === 301) {
      history.back();
    }

    const responseData = await response.json();
    const error = new Error(responseData.message);
    error.data = responseData;
    throw error;
  }
  return response.json();
};

/**
 * Sends data to the server
 * @param {Auth} auth - The Auth instance
 * @param {String} url - The URL to send data to
 * @param {Object} data - The data to send
 */
export const sendData = async (url, data, method = 'POST') => {
  const response = await fetchStructure(
    url,
    method,
    { body: JSON.stringify(data) },
    { 'Content-Type': 'application/json' }
  );
  return response;
};

export const fetchTemplate = async (url) => {
  const response = await fetchStructure(
    url,
    'GET',
    {},
    { 'x-requested-with': 'fetch' }
  );
  return response;
};

export const fetchData = async (url) => {
  const response = await fetchStructure(`/api${url}`, 'GET', {}, {});
  return response;
};
/**
 * Get CSRF token
 * @param {String} name
 * @returns Cookie value
 */
export const getCookie = (name) => {
  const cookies = document.cookie.split('; ');
  const cookie = cookies.find((c) => c.startsWith(name));
  return cookie ? cookie.split('=')[1] : null;
};
