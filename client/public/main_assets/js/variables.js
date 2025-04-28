export const passwordRegex = /[\w.-]{8,}/;
export const emailRegex = /^[a-z0-9]+@[a-z0-9]+\.[a-z0-9]+$/;
export const userNameRegex = /^[A-Za-z]+( [A-Za-z]+)*$/;
export const tooltipSetup = () => {
  document.addEventListener("mouseover", (e)=>{
    const tooltipTarget = e.target.closest(".has-tooltip");
    if (tooltipTarget) {
        const positionInfo = tooltipTarget.getBoundingClientRect();
        const tooltip = document.getElementById("tooltip");
        tooltip.innerText = tooltipTarget.getAttribute("data-tooltip");
        tooltip.style.left = positionInfo.left + "px";
        tooltip.style.top = positionInfo.top + "px";
        tooltip.classList.add("show");
    }
  })
  document.addEventListener("mouseout", (e)=>{
    const tooltipTarget = e.target.closest(".has-tooltip");
    if (tooltipTarget) {
        const positionInfo = tooltipTarget.getBoundingClientRect();
        const tooltip = document.getElementById("tooltip");
        tooltip.innerText = tooltipTarget.getAttribute("data-tooltip");
        tooltip.style.left = positionInfo.left + "px";
        tooltip.style.top = positionInfo.top + "px";
        tooltip.classList.remove("show");
    }
  })
}