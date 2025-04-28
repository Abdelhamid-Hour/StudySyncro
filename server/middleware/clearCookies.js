const clearCookies = (res, cookies) => {
  cookies.forEach((cookie) => res.clearCookie(cookie));
};

module.exports = { clearCookies };