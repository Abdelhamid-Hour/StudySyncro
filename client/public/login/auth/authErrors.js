const authErrors = {
  CANCELLED_POPUP_REQUEST: {
    code: 'auth/cancelled-popup-request',
    message:
      'It looks like you closed the popup before completing the action. Please try again.',
  },
  EMAIL_ALREADY_IN_USE: {
    code: 'auth/email-already-in-use',
    message:
      'The email address you entered is already associated with an account. Try logging in or use a different email.',
  },
  WRONG_PASSWORD: {
    code: 'auth/wrong-password',
    message:
      'Oops! The password you entered is incorrect. Please double-check and try again.',
  },
  POPUP_BLOCKED: {
    code: 'auth/popup-blocked',
    message:
      'It seems like the popup was blocked by your browser. Please allow popups and try again.',
  },
  POPUP_CLOSED_BY_USER: {
    code: 'auth/popup-closed-by-user',
    message:
      'It looks like you closed the popup before completing the action. Please open it again and try.',
  },
  REDIRECT_CANCELLED_BY_USER: {
    code: 'auth/redirect-cancelled-by-user',
    message:
      'It seems you cancelled the redirect action. Please try again to complete the process.',
  },
  USER_NOT_FOUND: {
    code: 'auth/user-not-found',
    message:
      "We couldn't find an account with that email address. Please check your email or create a new account.",
  },
};

/**
 * Checks the error object and updates the message property
 * @param {Error} error - The error object
 */
export const checkError = function (error) {
  if (!error.code) {
    return;
  }
  for (const key in authErrors) {
    if (authErrors[key].code === error.code) {
      error.message = authErrors[key].message;
      return;
    }
  }
  const code = error.code.split('/')[1];
  const message = code.split('-').join(' ');
  error.message = message;
  return;
};
