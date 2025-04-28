import { redirectTo } from "../../main_assets/js/domFunctions.js";

const logOut = async (url) => {
    try {
        await fetch(url, {
            method: 'POST',
            credentials: 'include',
        });
        redirectTo('/login');
    } catch (error) {
        console.log(error.message);
    }
};

export { logOut };