export const handelIconsHover = (e) => {
  const target = e.target.closest('.should-fill:not(.active)');
  if (target) {
    target.querySelectorAll('i:not(.exclude-icon)').forEach((icon) => {
      animateFillIcon(icon);
    });
  }
};

export const closeAndOpenLeftSideBar = () => {
  const shouldHideElements = document.querySelectorAll('.should-hide');

  shouldHideElements.forEach((element) => {
    element.classList.toggle('hidden');
  });
};
export const openOverlay = function (
  e,
  BtnByOverlay = [{ buttonClassName: null, overlay: null }]
) {
  BtnByOverlay.forEach((pair) => {
    
    if (e.target.closest(`.${pair.buttonClassName}`)) {
      toggleClass([pair.overlay], 'open-overlay');
    }
  });
};
export const toggleClass = (array, className) => {
  array.forEach((e) => {
    e.classList.toggle(className);
  });
};
const animateFillIcon = (icon) => {
  const IconClass = getIconClassName(icon);
  icon.classList.toggle(`${IconClass}`);
  icon.classList.toggle(`${IconClass}-fill`);
};

const getIconClassName = (icon) => {
  const IconClass = Object.values(icon.classList)
    .find((e) => e.includes('bi-'))
    .split('-')
    .filter((e) => !e.includes('fill'))
    .join('-');
  return IconClass;
};

export const initActiveIcon = (IconContainer) => {
  const icon = IconContainer.firstElementChild;
  const IconClass = getIconClassName(icon);
  icon.classList.remove(`${IconClass}`);
  icon.classList.add(`${IconClass}-fill`);
};

export const formatHoursMinutes = (TimeOrDate) => {
  const date = new Date(TimeOrDate);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
export const initCloseOverlayListner = (
  ClassListOverLays = [],
  OverlayContainer = { 1: [] }
) => {
  document.addEventListener('click', (e) => {
    ClassListOverLays.forEach((className) => {
      const overlay = document.querySelector(`.${className}`);
      if (!overlay) {
        return;
      }
      const isOverlay = overlay.classList.contains('open-overlay');
      const ignore = OverlayContainer[className].find((cls) =>
      {
        return e.target.closest(`.${cls}`)
      }
      );
    
      if (isOverlay && !ignore) {
        document.querySelector(`.${className}`).classList.remove("open-overlay");
      }
    });
  });
};

export const tooltipSetup = () => {
  document.addEventListener('mouseover', (e) => {
    const tooltipTarget = e.target.closest('.has-tooltip');
    if (tooltipTarget) {
      const positionInfo = tooltipTarget.getBoundingClientRect();
      const tooltip = document.getElementById('tooltip');
      tooltip.innerText = tooltipTarget.getAttribute('data-tooltip');
      tooltip.style.left = positionInfo.left + 'px';
      tooltip.style.top = positionInfo.top + 'px';
      tooltip.style.translate = `calc(-50% + ${
        parseFloat(positionInfo.width) / 2
      }px) -130%`;
      tooltip.classList.add('show');
    }
  });
  document.addEventListener('mouseout', (e) => {
    const tooltipTarget = e.target.closest('.has-tooltip');
    if (tooltipTarget) {
      const positionInfo = tooltipTarget.getBoundingClientRect();
      const tooltip = document.getElementById('tooltip');
      tooltip.innerText = tooltipTarget.getAttribute('data-tooltip');
      tooltip.style.left = positionInfo.left + 'px';
      tooltip.style.top = positionInfo.top + 'px';
      tooltip.classList.remove('show');
    }
  });
};
