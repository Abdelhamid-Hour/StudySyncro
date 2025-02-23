const logOut = async (url) => {
    try {
        await fetch(url, {
            method: 'POST',
            credentials: 'include',
        });
        window.location.href = '/login';
    } catch (error) {
        console.log(error.message);
    }
};

export { logOut };