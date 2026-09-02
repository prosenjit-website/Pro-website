// ========================================
// PROSENJIT RAY — ADMIN CONTROL SYSTEM
// ========================================

let siteData = {
  name: "",
  tagline: "",
  college: "",
  education: "",
  about: "",
  photo: "",
  skills: [],
  social: {},
  buttons: []
};

let diaryData = [];
let projectsData = [];


// ========================================
// DOM READY
// ========================================

document.addEventListener("DOMContentLoaded", () => {

  setupLogin();
  setupNavigation();
  setupLogout();
  setupForms();
  checkLogin();

});


// ========================================
// LOGIN
// ========================================

function setupLogin() {

  const form =
    document.getElementById("loginForm");

  if (!form) return;

  form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const username =
      document.getElementById("username").value.trim();

    const password =
      document.getElementById("password").value;

    const message =
      document.getElementById("loginMessage");

    message.textContent = "Signing in...";
    message.className = "message";

    try {

      const response = await fetch(
        "/api/admin/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username,
            password
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Login failed"
        );
      }

      showDashboard();

      await loadEverything();

    } catch (error) {

      message.textContent =
        error.message || "Login failed";

      message.className =
        "message error";

    }

  });

}


// ========================================
// CHECK LOGIN
// ========================================

async function checkLogin() {

  try {

    const response =
      await fetch("/api/admin/content");

    if (response.ok) {

      showDashboard();

      await loadEverything();

    }

  } catch (error) {

    // User is not logged in.

  }

}


// ========================================
// SHOW DASHBOARD
// ========================================

function showDashboard() {

  const login =
    document.getElementById("loginScreen");

  const dashboard =
    document.getElementById("dashboard");

  if (login) {
    login.classList.add("hidden");
  }

  if (dashboard) {
    dashboard.classList.remove("hidden");
  }

}


// ========================================
// NAVIGATION
// ========================================

function setupNavigation() {

  document
    .querySelectorAll(".tab-btn")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          openTab(
            button.dataset.tab
          );

        }
      );

    });


  document
    .querySelectorAll("[data-go-tab]")
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          openTab(
            button.dataset.goTab
          );

        }
      );

    });

}


function openTab(tabName) {

  document
    .querySelectorAll(".tab-btn")
    .forEach((button) => {

      button.classList.toggle(
        "active",
        button.dataset.tab === tabName
      );

    });


  document
    .querySelectorAll(".tab-content")
    .forEach((section) => {

      section.classList.toggle(
        "active",
        section.id ===
          "tab-" + tabName
      );

    });


  const titles = {
    overview: "Overview",
    profile: "Profile",
    buttons: "Buttons",
    diary: "Diary",
    projects: "Projects"
  };

  const title =
    document.getElementById("pageTitle");

  if (title) {
    title.textContent =
      titles[tabName] || "Dashboard";
  }

}


// ========================================
// LOGOUT
// ========================================

function setupLogout() {

  const button =
    document.getElementById("logoutBtn");

  if (!button) return;

  button.addEventListener(
    "click",
    async () => {

      try {

        await fetch(
          "/api/admin/logout",
          {
            method: "POST"
          }
        );

      } catch (error) {}

      window.location.reload();

    }
  );

}


// ========================================
// LOAD EVERYTHING
// ========================================

async function loadEverything() {

  await loadSite();
  await loadDiary();
  await loadProjects();

}


// ========================================
// LOAD SITE
// ========================================

async function loadSite() {

  try {

    const response =
      await fetch("/api/admin/content");

    if (!response.ok) {
      throw new Error("Unable to load site");
    }

    siteData =
      await response.json();

    fillProfile();

    renderButtons();

  } catch (error) {

    console.log(error);

  }

}


// ========================================
// FILL PROFILE
// ========================================

function fillProfile() {

  setValue(
    "siteName",
    siteData.name
  );

  setValue(
    "siteTagline",
    siteData.tagline
  );

  setValue(
    "siteCollege",
    siteData.college
  );

  setValue(
    "siteEducation",
    siteData.education
  );

  setValue(
    "sitePhoto",
    siteData.photo
  );

  setValue(
    "siteAbout",
    siteData.about
  );


  setValue(
    "siteSkills",
    Array.isArray(siteData.skills)
      ? siteData.skills.join(", ")
      : ""
  );


  const social =
    siteData.social || {};

  setValue(
    "socialFacebook",
    social.facebook
  );

  setValue(
    "socialInstagram",
    social.instagram
  );

  setValue(
    "socialGithub",
    social.github
  );

}


// ========================================
// PROFILE FORM
// ========================================

function setupForms() {

  const profileButton =
    document.getElementById(
      "saveProfileBtn"
    );

  if (profileButton) {

    profileButton.addEventListener(
      "click",
      saveProfile
    );

  }


  const buttonsButton =
    document.getElementById(
      "saveButtonsBtn"
    );

  if (buttonsButton) {

    buttonsButton.addEventListener(
      "click",
      saveButtons
    );

  }


  const diaryForm =
    document.getElementById(
      "diaryForm"
    );

  if (diaryForm) {

    diaryForm.addEventListener(
      "submit",
      addDiary
    );

  }


  const projectForm =
    document.getElementById(
      "projectForm"
    );

  if (projectForm) {

    projectForm.addEventListener(
      "submit",
      addProject
    );

  }

}


// ========================================
// SAVE PROFILE
// ========================================

async function saveProfile() {

  const button =
    document.getElementById(
      "saveProfileBtn"
    );

  const message =
    document.getElementById(
      "profileMessage"
    );

  button.disabled = true;
  button.textContent = "Saving...";


  const skillsText =
    document.getElementById(
      "siteSkills"
    ).value;


  const updated = {

    name:
      getValue("siteName"),

    tagline:
      getValue("siteTagline"),

    college:
      getValue("siteCollege"),

    education:
      getValue("siteEducation"),

    photo:
      getValue("sitePhoto"),

    about:
      getValue("siteAbout"),

    skills:
      skillsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),

    social: {

      facebook:
        getValue("socialFacebook"),

      instagram:
        getValue("socialInstagram"),

      github:
        getValue("socialGithub")

    }

  };


  try {

    const response =
      await fetch(
        "/api/admin/content",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify(updated)
        }
      );


    const data =
      await response.json();


    if (!response.ok) {
      throw new Error(
        data.error ||
        "Could not save"
      );
    }


    siteData = data;


    message.textContent =
      "✓ Profile saved successfully.";

    message.className =
      "message success";


  } catch (error) {

    message.textContent =
      error.message;

    message.className =
      "message error";

  } finally {

    button.disabled = false;
    button.textContent =
      "Save Changes";

  }

}


// ========================================
// BUTTONS
// ========================================

function renderButtons() {

  const container =
    document.getElementById(
      "buttonsList"
    );

  if (!container) return;

  const buttons =
    Array.isArray(siteData.buttons)
      ? siteData.buttons
      : [];


  document.getElementById(
    "buttonCount"
  ).textContent =
    buttons.length;


  container.innerHTML = "";


  if (buttons.length === 0) {

    container.innerHTML =
      '<div class="form-card">No buttons configured.</div>';

    return;

  }


  buttons.forEach(
    (button, index) => {

      const row =
        document.createElement("div");

      row.className =
        "button-row";


      row.innerHTML = `
        <div class="button-number">
          BUTTON ${String(index + 1).padStart(2, "0")}
        </div>

        <div>
          <label>Button Text</label>
          <input
            type="text"
            class="button-text"
            value="${escapeAttribute(button.text || "")}"
          >
        </div>

        <div>
          <label>Button Link</label>
          <input
            type="text"
            class="button-link"
            value="${escapeAttribute(button.link || "")}"
          >
        </div>

        <div class="checkbox-wrap">
          <input
            type="checkbox"
            class="button-show"
            ${button.show !== false ? "checked" : ""}
          >
          <label>Show</label>
        </div>
      `;


      container.appendChild(row);

    }
  );

}


// ========================================
// SAVE BUTTONS
// ========================================

async function saveButtons() {

  const rows =
    document.querySelectorAll(
      ".button-row"
    );


  const buttons =
    Array.from(rows)
      .map((row) => {

        return {

          text:
            row.querySelector(
              ".button-text"
            ).value.trim(),

          link:
            row.querySelector(
              ".button-link"
            ).value.trim(),

          show:
            row.querySelector(
              ".button-show"
            ).checked

        };

      });


  const message =
    document.getElementById(
      "buttonsMessage"
    );


  try {

    const response =
      await fetch(
        "/api/admin/content",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify({
              buttons
            })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {
      throw new Error(
        data.error ||
        "Could not save buttons"
      );
    }


    siteData = data;

    message.textContent =
      "✓ Buttons updated.";

    message.className =
      "message success";


  } catch (error) {

    message.textContent =
      error.message;

    message.className =
      "message error";

  }

}


// ========================================
// DIARY — LOAD
// ========================================

async function loadDiary() {

  try {

    const response =
      await fetch(
        "/api/admin/diary"
      );


    if (!response.ok) {
      throw new Error();
    }


    diaryData =
      await response.json();


    document.getElementById(
      "diaryCount"
    ).textContent =
      diaryData.length;


    renderDiary();


  } catch (error) {

    console.log(
      "Diary loading failed"
    );

  }

}


// ========================================
// DIARY — RENDER
// ========================================

function renderDiary() {

  const container =
    document.getElementById(
      "diaryList"
    );

  if (!container) return;

  container.innerHTML = "";


  if (diaryData.length === 0) {

    container.innerHTML =
      '<div class="form-card">No diary chapters yet.</div>';

    return;

  }


  diaryData.forEach(
    (item) => {

      const element =
        document.createElement(
          "div"
        );

      element.className =
        "list-item";


      element.innerHTML = `

        <div class="list-info">

          <small>
            ${escapeHTML(item.date || "Diary")}
          </small>

          <h3>
            ${escapeHTML(item.title || "Untitled")}
          </h3>

          <p>
            ${escapeHTML(item.content || "")}
          </p>

        </div>

        <button
          class="delete-btn"
          data-delete-diary="${item.id}"
        >
          Delete
        </button>

      `;


      container.appendChild(
        element
      );

    }
  );


  container
    .querySelectorAll(
      "[data-delete-diary]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          deleteDiary(
            button.dataset.deleteDiary
          );

        }
      );

    });

}


// ========================================
// ADD DIARY
// ========================================

async function addDiary(event) {

  event.preventDefault();


  const message =
    document.getElementById(
      "diaryMessage"
    );


  const payload = {

    date:
      getValue("diaryDate"),

    title:
      getValue("diaryTitle"),

    content:
      getValue("diaryContent")

  };


  try {

    const response =
      await fetch(
        "/api/admin/diary",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify(payload)
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Could not add diary"
      );

    }


    document.getElementById(
      "diaryForm"
    ).reset();


    message.textContent =
      "✓ Diary chapter added.";

    message.className =
      "message success";


    await loadDiary();


  } catch (error) {

    message.textContent =
      error.message;

    message.className =
      "message error";

  }

}


// ========================================
// DELETE DIARY
// ========================================

async function deleteDiary(id) {

  if (
    !confirm(
      "Delete this diary chapter?"
    )
  ) {
    return;
  }


  try {

    const response =
      await fetch(
        "/api/admin/diary/" +
        encodeURIComponent(id),
        {
          method: "DELETE"
        }
      );


    if (!response.ok) {
      throw new Error(
        "Could not delete diary"
      );
    }


    await loadDiary();


  } catch (error) {

    alert(
      error.message
    );

  }

}


// ========================================
// PROJECTS — LOAD
// ========================================

async function loadProjects() {

  try {

    const response =
      await fetch(
        "/api/admin/projects"
      );


    if (!response.ok) {
      throw new Error();
    }


    projectsData =
      await response.json();


    document.getElementById(
      "projectCount"
    ).textContent =
      projectsData.length;


    renderProjects();


  } catch (error) {

    console.log(
      "Projects loading failed"
    );

  }

}


// ========================================
// PROJECTS — RENDER
// ========================================

function renderProjects() {

  const container =
    document.getElementById(
      "projectsList"
    );

  if (!container) return;

  container.innerHTML = "";


  if (projectsData.length === 0) {

    container.innerHTML =
      '<div class="form-card">No projects yet.</div>';

    return;

  }


  projectsData.forEach(
    (item) => {

      const element =
        document.createElement(
          "div"
        );

      element.className =
        "list-item";


      element.innerHTML = `

        <div class="list-info">

          <small>
            PROJECT
          </small>

          <h3>
            ${escapeHTML(item.title || "Untitled")}
          </h3>

          <p>
            ${escapeHTML(item.description || "")}
          </p>

        </div>

        <button
          class="delete-btn"
          data-delete-project="${item.id}"
        >
          Delete
        </button>

      `;


      container.appendChild(
        element
      );

    }
  );


  container
    .querySelectorAll(
      "[data-delete-project]"
    )
    .forEach((button) => {

      button.addEventListener(
        "click",
        () => {

          deleteProject(
            button.dataset.deleteProject
          );

        }
      );

    });

}


// ========================================
// ADD PROJECT
// ========================================

async function addProject(event) {

  event.preventDefault();


  const message =
    document.getElementById(
      "projectsMessage"
    );


  const payload = {

    title:
      getValue("projectTitle"),

    description:
      getValue("projectDescription"),

    link:
      getValue("projectLink")

  };


  try {

    const response =
      await fetch(
        "/api/admin/projects",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify(payload)
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      throw new Error(
        data.error ||
        "Could not add project"
      );

    }


    document.getElementById(
      "projectForm"
    ).reset();


    message.textContent =
      "✓ Project added.";

    message.className =
      "message success";


    await loadProjects();


  } catch (error) {

    message.textContent =
      error.message;

    message.className =
      "message error";

  }

}


// ========================================
// DELETE PROJECT
// ========================================

async function deleteProject(id) {

  if (
    !confirm(
      "Delete this project?"
    )
  ) {
    return;
  }


  try {

    const response =
      await fetch(
        "/api/admin/projects/" +
        encodeURIComponent(id),
        {
          method: "DELETE"
        }
      );


    if (!response.ok) {
      throw new Error(
        "Could not delete project"
      );
    }


    await loadProjects();


  } catch (error) {

    alert(
      error.message
    );

  }

}


// ========================================
// HELPERS
// ========================================

function getValue(id) {

  const element =
    document.getElementById(id);

  return element
    ? element.value.trim()
    : "";

}


function setValue(id, value) {

  const element =
    document.getElementById(id);

  if (element) {
    element.value =
      value || "";
  }

}


function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

  return escapeHTML(value);

}
