import { navigateTo } from "../../global/js/utils.js";

const homeBtn = document.querySelector(".error-page-card .home-btn");
if (homeBtn) {
  homeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    navigateTo("/home");
  });
}
