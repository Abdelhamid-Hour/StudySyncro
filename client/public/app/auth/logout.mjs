import { redirectTo } from "../../main_assets/js/utils.mjs";

const logOut = async () => {
  try {
    await fetch("/logout", {
      method: "POST",
      credentials: "include",
    });
    redirectTo("/login");
  } catch (error) {
    console.log(error.message);
  }
};

export { logOut };
