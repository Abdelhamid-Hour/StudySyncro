import { topSideBarMiddle } from "../../../global/js/variables.js";
import { initFiltersInputListener, Loader } from "../../loader/js/utils.js";

export const createLoadingCard = (userGroup) => {
  const loadingCard = document.createElement("div");
  loadingCard.className = "group-card loading-animation loading-card";
  loadingCard.innerHTML = `
      <header>
        <span class="badge loading-opacity-animation" style="width: 5rem; height: 1.5rem;"></span>
        <span class="badge loading-opacity-animation" style="width: 5rem; height: 1.5rem;"></span>
      </header>
      <div class="group-meta">
        <h3 class="group-name loading-opacity-animation" style="width: 60%; height: 1.4rem; border-radius: 0.4rem;"></h3>
        <span class="subject-value badge simple-badge loading-opacity-animation" style="width: 4rem; height: 1.4rem;"></span>
      </div>
      <div class="group-description">
        <div class="loading-opacity-animation" style="width: 100%; height: 0.9rem; margin-bottom: 0.4rem; border-radius: 0.3rem;"></div>
        <div class="loading-opacity-animation" style="width: 80%; height: 0.9rem; border-radius: 0.3rem;"></div>
      </div>
      <footer class="group-footer">
        ${
          userGroup
            ? '<span class="level-value badge loading-opacity-animation" style="width: 6rem; height: 1.5rem;"></span>'
            : ""
        }
        <div class="avatars">
          <div class="avatar loading-opacity-animation"></div>
          <div class="avatar loading-opacity-animation"></div>
          <div class="avatar loading-opacity-animation"></div>
        </div>
        ${
          !userGroup
            ? '<button class="btn-join loading-btn loading-opacity-animation" disabled style="width: 7rem; height: 2.2rem; border: none;"></button>'
            : ""
        }
      </footer>
  `;

  return loadingCard;
};

export const getcreateGroupCardFunc = (userGroup) => {
  return (group) => {
    const groupCard = document.createElement("a");
    groupCard.href = `/app/groups/my/${group.id}/chat`;
    groupCard.className = "group-card route-link card-item";
    groupCard.dataset.id = group.id;
    const groupLevel = `<span class="level-value badge ${
      group.level === "Intermediate"
        ? "blue-badge"
        : group.level === "Advanced"
        ? "orange-badge"
        : "gray-badge"
    }">${group.level}</span>`;

    groupCard.innerHTML = `
    <header>
        <span class="badge ${
          group.visibility.charAt(0).toLowerCase() + group.visibility.slice(1)
        }-badge">
            ${group.visibility}
        </span>
        ${
          userGroup
            ? `<span class="badge ${
                group.isHost ? "orange-badge" : "blue-badge"
              }">
                ${group.isHost ? "Host" : "Member"}
            </span>`
            : groupLevel
        }
    </header>
    <div class="group-meta">
        <h3 class="group-name"></h3>
        <span class="subject-value badge simple-badge"></span>
    </div>
    <div class="group-description has-tooltip"></div>
    <footer class="group-footer">
        ${userGroup ? groupLevel : ""}
        <div class="avatars">
        ${group.avatars
          .map(
            ({ photoURL, fullName }) =>
              `<div class="avatar">${
                photoURL
                  ? `<img src="${photoURL}" alt="avatar" />`
                  : `<h4>${fullName.charAt(0).toUpperCase()}</h4>`
              }</div>`
          )
          .join("")}
        ${
          group.extraMembersCount > 0
            ? `<div class="member-count">+${group.extraMembersCount}</div>`
            : ""
        }
          </div>
        ${
          !userGroup
            ? `<button class="btn-join">${
                group.visibility === "Public"
                  ? '<i class="bi bi-send"></i>Join Now '
                  : '<i class="bi bi-lock"></i>Request to Join'
              }</button>`
            : ""
        }
    </footer>
`;

    const groupDesc = groupCard.querySelector(".group-description");
    groupDesc.setAttribute("data-tooltip", group.description);
    groupDesc.textContent = group.description;
    groupCard.querySelector(".group-name").textContent = group.name;
    groupCard.querySelector(".subject-value").textContent = group.subject;

    return groupCard;
  };
};

export const initLazyLoadingLoader = (userGroup = false) => {
  const route = userGroup ? `/user-groups?` : `/available-groups?`;
  const loader = new Loader(
    document.querySelector(".groups-list"),
    getcreateGroupCardFunc(userGroup),
    route,
    createLoadingCard(userGroup),
    {
      getCriteria: () => getCriteria(userGroup),
      emptyState: {
        noFilter: userGroup
          ? {
              icon: "bi-people-fill",
              title: "No Groups Joined",
              desc: "You are not a member of any study groups yet. Create or join a group to begin collaborating!",
            }
          : {
              icon: "bi-people-fill",
              title: "No Groups Available",
              desc: "There are currently no public study groups available to join. Check back later!",
            },
        filtered: {
          icon: "bi-people-fill",
          title: "No Groups Found",
          desc: "No study groups match your search or filter criteria.",
        },
      },
    }
  );

  initFiltersInputListener(loader, topSideBarMiddle);
  return loader;
};

const getCriteria = (isUserGroups) => {
  let creteria = "";
  const sortDate = topSideBarMiddle.querySelector("#sort-checkbox")?.checked;
  const search = topSideBarMiddle.querySelector("#search-input")?.value;
  const advancedLevel = topSideBarMiddle.querySelector("#advanced")?.checked;
  const intermediateLevel =
    topSideBarMiddle.querySelector("#intermediate")?.checked;
  const beginnerLevel = topSideBarMiddle.querySelector("#beginner")?.checked;
  const privateVisibility = topSideBarMiddle.querySelector("#private")?.checked;
  const publicVisibility = topSideBarMiddle.querySelector("#public")?.checked;

  const sort = sortDate ? "asc" : "desc";
  creteria += `sort=${sort}`;
  const searchTerm = search ? search.toLowerCase().trim() : "";
  creteria += `&searchTerm=${searchTerm}`;

  const level = [];
  if (advancedLevel) level.push("Advanced");
  if (intermediateLevel) level.push("Intermediate");
  if (beginnerLevel) level.push("Beginner");
  creteria += `&level=${level.join(",")}`;

  const visibility = [];
  if (privateVisibility) visibility.push("Private");
  if (publicVisibility) visibility.push("Public");
  creteria += `&visibility=${visibility.join(",")}`;

  if (isUserGroups) {
    const adminRole = topSideBarMiddle.querySelector("#admin")?.checked;
    const memberRole = topSideBarMiddle.querySelector("#member")?.checked;
    const role = [];
    if (adminRole) role.push("admin");
    if (memberRole) role.push("member");
    creteria += `&role=${role.join(",")}`;
  }

  if (!isUserGroups) {
    const joinableOnly =
      topSideBarMiddle.querySelector("#joinable-only")?.checked;
    creteria += `&joinableOnly=${joinableOnly}`;
  }

  return creteria;
};
