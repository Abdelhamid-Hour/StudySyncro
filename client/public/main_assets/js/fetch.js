/**
 * Sends data to the server
 * @param {Auth} auth - The Auth instance
 * @param {String} url - The URL to send data to
 * @param {Object} data - The data to send
 */
export const sendData = async function (url, data) {
  console.log(data)
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });
  if (!response.ok) {
    const responseData = await response.json();
    const error = new Error(responseData.message);
    console.error(error)
    error.data = responseData;
    throw error;
  }
  return response.json();
};

/**
 * Sends the ID token to the server
 * @param {Auth} auth 
 * @param {String} url 
 * @returns The response from the server
 */
export const sendIdToken = async function (auth, url) {
  const idToken = await auth.currentUser.getIdToken();
  // Send the ID token to the server
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ idToken }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    const responseData = await response.json();
    const error = new Error(responseData.message);
    error.data = responseData;
    throw error;
  }
  return response.json();
}

/**
 * Get CSRF token
 * @param {String} name 
 * @returns Cookie value
 */
export const getCookie = (name) => {
  const cookies = document.cookie.split('; ');
  const cookie = cookies.find((c) => c.startsWith(name));
  return cookie ? cookie.split('=')[1] : null;
}



