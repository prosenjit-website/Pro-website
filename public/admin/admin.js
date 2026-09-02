/* =========================================================
   PROSENJIT RAY — ADMIN PANEL JS
   Full Admin Controller
========================================================= */

"use strict";

/* =========================================================
   HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

const qs = (selector, parent = document) =>
  parent.querySelector(selector);

const qsa = (selector, parent = document) =>
  [...parent.querySelectorAll(selector)];

function escapeHTML(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showMessage(message, type = "success") {
  let box = $("adminMessage");

  if (!box) {
    box = document.createElement("div");
    box.id = "adminMessage";
    document.body.appendChild(box);
  }

  box.className = `admin-message ${type}`;
  box.textContent = message;

  clearTimeout(window.__msgTimer);

  window.__msgTimer = setTimeout(() => {
    box.classList.remove("show");
  }, 3500);

  requestAnimationFrame(() => {
    box.classList.add("show");
  });
}

function setLoading(button, loading, text = "Processing...") {
  if (!button) return;

  if (loading) {
    button.dataset.oldText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = text;
  } else {
    button.disabled = false;
    button.innerHTML =
      button.dataset.oldText || button.innerHTML;
  }
}


/* =========================================================
   API HELPER
========================================================= */

async function api(url, options = {}) {
  const config = {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  };

  const response = await fetch(url, config);

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(
      data.error ||
      data.message ||
      `Request failed (${response.status})`
    );

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}


/* =========================================================
   GLOBAL STATE
========================================================= */

let siteData = null;
let diaryData = [];
let projectData = [];

let isLoggedIn = false;


/* =========================================================
   PAGE ELEMENTS
========================================================= */

const loginSection =
  $("loginSection") ||
  qs(".login-section");

const dashboardSection =
  $("dashboardSection") ||
  qs(".dashboard");

const loginForm =
  $("loginForm");

const logoutBtn =
  $("logoutBtn");

const loginBtn =
  $("loginBtn");


/* =========================================================
   LOGIN
========================================================= */

async function checkSession() {
  try {
    const data = await api(
      "/api/admin/session",
      {
        method: "GET"
      }
    );

    isLoggedIn = data.loggedIn === true;

    if (isLoggedIn) {
      await openDashboard();
    } else {
      openLogin();
    }

  } catch (error) {
    console.error(error);
    openLogin();
  }
}


function openLogin() {

  isLoggedIn = false;

  if (loginSection) {
    loginSection.style.display = "";
  }

  if (dashboardSection) {
    dashboardSection.style.display = "none";
  }
}


async function openDashboard() {

  isLoggedIn = true;

  if (loginSection) {
    loginSection.style.display = "none";
  }

  if (dashboardSection) {
    dashboardSection.style.display = "";
  }

  try {

    await loadSite();

    await loadDiary();

    await loadProjects();

    renderAll();

  } catch (error) {

    console.error(error);

    if (error.status === 401) {
      isLoggedIn = false;
      openLogin();

      showMessage(
        "সেশন শেষ হয়েছে। আবার Login করুন।",
        "error"
      );

      return;
    }

    showMessage(
      error.message || "Data load failed",
      "error"
    );
  }
}


if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const usernameInput =
        $("username") ||
        $("adminUsername") ||
        qs('input[name="username"]');

      const passwordInput =
        $("password") ||
        $("adminPassword") ||
        qs('input[name="password"]');

      const username =
        usernameInput?.value.trim() || "";

      const password =
        passwordInput?.value || "";

      if (!username || !password) {

        showMessage(
          "Username এবং Password দিন।",
          "error"
        );

        return;
      }

      setLoading(
        loginBtn,
        true,
        "Login হচ্ছে..."
      );

      try {

        const data = await api(
          "/api/admin/login",
          {
            method: "POST",
            body: JSON.stringify({
              username,
              password
            })
          }
        );

        if (!data.success) {
          throw new Error(
            data.error ||
            "Login failed"
          );
        }

        isLoggedIn = true;

        showMessage(
          "Login সফল হয়েছে ✓",
          "success"
        );

        await openDashboard();

      } catch (error) {

        console.error(error);

        showMessage(
          error.message ||
          "Username অথবা Password ভুল।",
          "error"
        );

      } finally {

        setLoading(
          loginBtn,
          false
        );

      }

    }
  );
}


/* =========================================================
   LOGOUT
========================================================= */

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      try {

        await api(
          "/api/admin/logout",
          {
            method: "POST"
          }
        );

      } catch (error) {

        console.error(error);

      }

      isLoggedIn = false;

      openLogin();

      showMessage(
        "Logout হয়েছে।",
        "success"
      );
    }
  );
}


/* =========================================================
   SITE CONTENT
========================================================= */

async function loadSite() {

  const data = await api(
    "/api/admin/content",
    {
      method: "GET"
    }
  );

  siteData = data || {};

  return siteData;
}


function fillSiteForm() {

  if (!siteData) return;

  const map = {

    name: siteData.name,

    tagline: siteData.tagline,

    college: siteData.college,

    education: siteData.education,

    photo: siteData.photo,

    about: siteData.about

  };

  Object.entries(map).forEach(
    ([key, value]) => {

      const input =
        $(key) ||
        qs(`[name="${key}"]`);

      if (input) {
        input.value = value || "";
      }

    }
  );


  /* Skills */

  const skillsInput =
    $("skills") ||
    qs('[name="skills"]');

  if (skillsInput) {

    skillsInput.value =
      Array.isArray(siteData.skills)
        ? siteData.skills.join("\n")
        : "";

  }


  /* Social */

  const social =
    siteData.social || {};

  const socialMap = {

    facebook: social.facebook,

    instagram: social.instagram,

    whatsapp: social.whatsapp,

    github: social.github,

    email: social.email

  };

  Object.entries(socialMap).forEach(
    ([key, value]) => {

      const input =
        $(key) ||
        qs(`[name="${key}"]`);

      if (input) {
        input.value = value || "";
      }

    }
  );


  renderButtons();
}


async function saveSite() {

  if (!isLoggedIn) {
    showMessage(
      "আগে Login করুন।",
      "error"
    );
    return;
  }

  const getValue = (key) => {

    const input =
      $(key) ||
      qs(`[name="${key}"]`);

    return input
      ? input.value.trim()
      : undefined;
  };


  const skillsInput =
    $("skills") ||
    qs('[name="skills"]');


  const skills =
    skillsInput
      ? skillsInput.value
          .split("\n")
          .map(x => x.trim())
          .filter(Boolean)
      : (
          Array.isArray(siteData?.skills)
            ? siteData.skills
            : []
        );


  const updated = {

    ...siteData,

    name:
      getValue("name") ??
      siteData.name,

    tagline:
      getValue("tagline") ??
      siteData.tagline,

    college:
      getValue("college") ??
      siteData.college,

    education:
      getValue("education") ??
      siteData.education,

    photo:
      getValue("photo") ??
      siteData.photo,

    about:
      getValue("about") ??
      siteData.about,

    skills

  };


  /* Social */

  updated.social = {
    ...(siteData.social || {})
  };

  [
    "facebook",
    "instagram",
    "whatsapp",
    "github",
    "email"
  ].forEach(key => {

    const value = getValue(key);

    if (value !== undefined) {
      updated.social[key] = value;
    }

  });


  const saveButton =
    $("saveSiteBtn") ||
    qs('[data-action="save-site"]');


  setLoading(
    saveButton,
    true,
    "সংরক্ষণ হচ্ছে..."
  );


  try {

    const result = await api(
      "/api/admin/content",
      {
        method: "PUT",
        body: JSON.stringify(updated)
      }
    );

    siteData =
      result.data || updated;

    fillSiteForm();

    showMessage(
      "সাইটের তথ্য সফলভাবে Save হয়েছে ✓",
      "success"
    );

  } catch (error) {

    console.error(error);

    if (error.status === 401) {
      openLogin();
      showMessage(
        "Login session শেষ হয়েছে। আবার Login করুন।",
        "error"
      );
    } else {
      showMessage(
        error.message ||
        "Save করা যায়নি।",
        "error"
      );
    }

  } finally {

    setLoading(
      saveButton,
      false
    );

  }
}


/* =========================================================
   BUTTON MANAGER
========================================================= */

function renderButtons() {

  const container =
    $("buttonsList") ||
    $("buttonList") ||
    qs(".buttons-list");

  if (!container) return;

  const buttons =
    Array.isArray(siteData?.buttons)
      ? [...siteData.buttons]
          .sort(
            (a, b) =>
              Number(a.order || 0) -
              Number(b.order || 0)
          )
      : [];


  if (!buttons.length) {

    container.innerHTML = `
      <div class="empty-state">
        এখনো কোনো Button নেই।
      </div>
    `;

    return;
  }


  container.innerHTML =
    buttons.map(
      (button, index) => `

      <div
        class="manager-card button-card"
        data-button-id="${escapeHTML(button.id || index)}"
      >

        <div class="manager-number">
          ${String(index + 1).padStart(2, "0")}
        </div>

        <div class="manager-content">

          <input
            class="button-label"
            type="text"
            value="${escapeHTML(button.label || "")}"
            placeholder="Button text"
          >

          <input
            class="button-url"
            type="text"
            value="${escapeHTML(button.url || "")}"
            placeholder="Button link"
          >

        </div>

        <div class="manager-actions">

          <button
            type="button"
            class="btn small"
            data-button-up="${index}"
            ${index === 0 ? "disabled" : ""}
          >
            ↑
          </button>

          <button
            type="button"
            class="btn small"
            data-button-down="${index}"
            ${index === buttons.length - 1 ? "disabled" : ""}
          >
            ↓
          </button>

          <button
            type="button"
            class="btn small ${
              button.visible === false
                ? "danger"
                : "success"
            }"
            data-button-toggle="${index}"
          >
            ${
              button.visible === false
                ? "Show"
                : "Hide"
            }
          </button>

          <button
            type="button"
            class="btn small danger"
            data-button-delete="${index}"
          >
            Delete
          </button>

        </div>

      </div>
    `
    ).join("");
}


/* Button Manager events */

document.addEventListener(
  "input",
  event => {

    if (
      event.target.classList.contains(
        "button-label"
      )
    ) {

      const card =
        event.target.closest(
          ".button-card"
        );

      const index =
        [...qsa(".button-card")]
          .indexOf(card);

      if (
        siteData?.buttons?.[index]
      ) {

        siteData.buttons[index].label =
          event.target.value;

      }

    }


    if (
      event.target.classList.contains(
        "button-url"
      )
    ) {

      const card =
        event.target.closest(
          ".button-card"
        );

      const index =
        [...qsa(".button-card")]
          .indexOf(card);

      if (
        siteData?.buttons?.[index]
      ) {

        siteData.buttons[index].url =
          event.target.value;

      }

    }

  }
);


document.addEventListener(
  "click",
  async event => {

    const up =
      event.target.closest(
        "[data-button-up]"
      );

    const down =
      event.target.closest(
        "[data-button-down]"
      );

    const toggle =
      event.target.closest(
        "[data-button-toggle]"
      );

    const del =
      event.target.closest(
        "[data-button-delete]"
      );


    if (up) {

      const index =
        Number(
          up.dataset.buttonUp
        );

      moveButton(index, index - 1);

    }


    if (down) {

      const index =
        Number(
          down.dataset.buttonDown
        );

      moveButton(index, index + 1);

    }


    if (toggle) {

      const index =
        Number(
          toggle.dataset.buttonToggle
        );

      if (siteData?.buttons?.[index]) {

        siteData.buttons[index].visible =
          siteData.buttons[index].visible === false;

        renderButtons();

      }

    }


    if (del) {

      const index =
        Number(
          del.dataset.buttonDelete
        );

      if (
        !confirm(
          "এই Button টি Delete করবেন?"
        )
      ) return;

      siteData.buttons.splice(
        index,
        1
      );

      normalizeButtonOrder();

      renderButtons();

      showMessage(
        "Button মুছে ফেলা হয়েছে। Save চাপুন।",
        "success"
      );

    }

  }
);


function moveButton(from, to) {

  if (!siteData?.buttons) return;

  if (
    from < 0 ||
    to < 0 ||
    from >= siteData.buttons.length ||
    to >= siteData.buttons.length
  ) return;

  const item =
    siteData.buttons.splice(
      from,
      1
    )[0];

  siteData.buttons.splice(
    to,
    0,
    item
  );

  normalizeButtonOrder();

  renderButtons();
}


function normalizeButtonOrder() {

  if (!Array.isArray(siteData?.buttons)) {
    return;
  }

  siteData.buttons.forEach(
    (button, index) => {
      button.order = index + 1;
    }
  );
}


/* Add new button */

const addButtonBtn =
  $("addButtonBtn") ||
  qs('[data-action="add-button"]');

if (addButtonBtn) {

  addButtonBtn.addEventListener(
    "click",
    () => {

      if (!siteData) return;

      if (!Array.isArray(siteData.buttons)) {
        siteData.buttons = [];
      }

      const newButton = {

        id:
          "button-" +
          Date.now(),

        label:
          "New Button",

        url:
          "/",

        visible:
          true,

        order:
          siteData.buttons.length + 1

      };

      siteData.buttons.push(
        newButton
      );

      renderButtons();

      showMessage(
        "নতুন Button যোগ হয়েছে। এখন Edit করে Save করুন।",
        "success"
      );

    }
  );
}


/* =========================================================
   DIARY
========================================================= */

async function loadDiary() {

  const data = await api(
    "/api/admin/diary",
    {
      method: "GET"
    }
  );

  diaryData =
    Array.isArray(data)
      ? data
      : [];

  return diaryData;
}


function renderDiary() {

  const container =
    $("diaryList") ||
    qs(".diary-list");

  if (!container) return;


  if (!diaryData.length) {

    container.innerHTML = `
      <div class="empty-state">
        এখনো কোনো Diary Chapter নেই।
      </div>
    `;

    return;
  }


  container.innerHTML =
    diaryData.map(
      diary => `

      <div
        class="manager-card diary-card"
        data-diary-id="${diary.id}"
      >

        <div class="manager-content">

          <input
            class="diary-title"
            value="${escapeHTML(diary.title)}"
            placeholder="অধ্যায়ের নাম"
          >

          <input
            class="diary-date"
            value="${escapeHTML(diary.date || "")}"
            placeholder="তারিখ"
          >

          <textarea
            class="diary-content"
            placeholder="অধ্যায়ের বিস্তারিত লেখা"
          >${escapeHTML(diary.content)}</textarea>

        </div>

        <div class="manager-actions">

          <button
            type="button"
            class="btn small ${
              diary.visible
                ? "success"
                : "danger"
            }"
            data-diary-toggle="${diary.id}"
          >
            ${
              diary.visible
                ? "Hide"
                : "Show"
            }
          </button>

          <button
            type="button"
            class="btn small"
            data-diary-save="${diary.id}"
          >
            Save
          </button>

          <button
            type="button"
            class="btn small danger"
            data-diary-delete="${diary.id}"
          >
            Delete
          </button>

        </div>

      </div>
    `
    ).join("");
}


/* Add diary */

const diaryForm =
  $("diaryForm");

if (diaryForm) {

  diaryForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const title =
        $("diaryTitle")?.value.trim() ||
        qs('[name="diaryTitle"]')?.value.trim() ||
        "";

      const content =
        $("diaryContent")?.value.trim() ||
        qs('[name="diaryContent"]')?.value.trim() ||
        "";

      const date =
        $("diaryDate")?.value.trim() ||
        qs('[name="diaryDate"]')?.value.trim() ||
        "";


      if (!title || !content) {

        showMessage(
          "Diary title এবং content দিন।",
          "error"
        );

        return;
      }


      const button =
        qs(
          'button[type="submit"]',
          diaryForm
        );


      setLoading(
        button,
        true,
        "যোগ হচ্ছে..."
      );


      try {

        await api(
          "/api/admin/diary",
          {
            method: "POST",

            body: JSON.stringify({
              title,
              content,
              date
            })
          }
        );


        diaryForm.reset();

        await loadDiary();

        renderDiary();

        showMessage(
          "নতুন Diary Chapter যোগ হয়েছে ✓",
          "success"
        );

      } catch (error) {

        console.error(error);

        showMessage(
          error.message ||
          "Diary যোগ করা যায়নি।",
          "error"
        );

      } finally {

        setLoading(
          button,
          false
        );

      }

    }
  );
}


/* Diary actions */

document.addEventListener(
  "click",
  async event => {

    const save =
      event.target.closest(
        "[data-diary-save]"
      );

    const toggle =
      event.target.closest(
        "[data-diary-toggle]"
      );

    const del =
      event.target.closest(
        "[data-diary-delete]"
      );


    if (save) {

      const id =
        save.dataset.diarySave;

      const card =
        qs(
          `.diary-card[data-diary-id="${id}"]`
        );

      if (!card) return;


      const title =
        qs(".diary-title", card)
          ?.value.trim() || "";

      const date =
        qs(".diary-date", card)
          ?.value.trim() || "";

      const content =
        qs(".diary-content", card)
          ?.value.trim() || "";


      if (!title || !content) {

        showMessage(
          "Title এবং Content খালি রাখা যাবে না।",
          "error"
        );

        return;
      }


      setLoading(
        save,
        true,
        "Saving..."
      );


      try {

        const item =
          diaryData.find(
            x => String(x.id) === String(id)
          );


        await api(
          `/api/admin/diary/${id}`,
          {
            method: "PUT",

            body: JSON.stringify({

              title,

              content,

              date,

              visible:
                item
                  ? item.visible !== false
                  : true

            })
          }
        );


        await loadDiary();

        renderDiary();

        showMessage(
          "Diary আপডেট হয়েছে ✓",
          "success"
        );

      } catch (error) {

        console.error(error);

        showMessage(
          error.message ||
          "Diary update failed",
          "error"
        );

      } finally {

        setLoading(
          save,
          false
        );

      }

    }


    if (toggle) {

      const id =
        toggle.dataset.diaryToggle;

      const item =
        diaryData.find(
          x => String(x.id) === String(id)
        );

      if (!item) return;


      try {

        await api(
          `/api/admin/diary/${id}`,
          {
            method: "PUT",

            body: JSON.stringify({

              title:
                item.title,

              content:
                item.content,

              date:
                item.date || "",

              visible:
                !item.visible

            })
          }
        );


        await loadDiary();

        renderDiary();

        showMessage(
          item.visible
            ? "Diary Hide হয়েছে।"
            : "Diary Show হয়েছে।",
          "success"
        );

      } catch (error) {

        showMessage(
          error.message ||
          "Visibility change failed",
          "error"
        );

      }

    }


    if (del) {

      const id =
        del.dataset.diaryDelete;

      if (
        !confirm(
          "এই Diary Chapter স্থায়ীভাবে Delete করবেন?"
        )
      ) return;


      setLoading(
        del,
        true,
        "Deleting..."
      );


      try {

        await api(
          `/api/admin/diary/${id}`,
          {
            method: "DELETE"
          }
        );


        await loadDiary();

        renderDiary();

        showMessage(
          "Diary Delete হয়েছে ✓",
          "success"
        );

      } catch (error) {

        showMessage(
          error.message ||
          "Delete failed",
          "error"
        );

      } finally {

        setLoading(
          del,
          false
        );

      }

    }

  }
);


/* =========================================================
   PROJECTS
========================================================= */

async function loadProjects() {

  const data = await api(
    "/api/admin/projects",
    {
      method: "GET"
    }
  );

  projectData =
    Array.isArray(data)
      ? data
      : [];

  return projectData;
}


function renderProjects() {

  const container =
    $("projectsList") ||
    qs(".projects-list");

  if (!container) return;


  if (!projectData.length) {

    container.innerHTML = `
      <div class="empty-state">
        এখনো কোনো Project নেই।
      </div>
    `;

    return;
  }


  container.innerHTML =
    projectData.map(
      project => `

      <div
        class="manager-card project-card"
        data-project-id="${project.id}"
      >

        <div class="manager-content">

          <input
            class="project-title"
            value="${escapeHTML(project.title)}"
            placeholder="Project name"
          >

          <input
            class="project-url"
            value="${escapeHTML(project.url || "")}"
            placeholder="Project link"
          >

          <input
            class="project-image"
            value="${escapeHTML(project.image || "")}"
            placeholder="Image URL"
          >

          <textarea
            class="project-description"
            placeholder="Project description"
          >${escapeHTML(project.description || "")}</textarea>

          <input
            class="project-order"
            type="number"
            value="${Number(project.sort_order || 0)}"
            placeholder="Order"
          >

        </div>

        <div class="manager-actions">

          <button
            type="button"
            class="btn small ${
              project.visible
                ? "success"
                : "danger"
            }"
            data-project-toggle="${project.id}"
          >
            ${
              project.visible
                ? "Hide"
                : "Show"
            }
          </button>

          <button
            type="button"
            class="btn small"
            data-project-save="${project.id}"
          >
            Save
          </button>

          <button
            type="button"
            class="btn small danger"
            data-project-delete="${project.id}"
          >
            Delete
          </button>

        </div>

      </div>
    `
    ).join("");
}


/* Add project */

const projectForm =
  $("projectForm");

if (projectForm) {

  projectForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const title =
        $("projectTitle")?.value.trim() ||
        qs('[name="projectTitle"]')?.value.trim() ||
        "";

      const description =
        $("projectDescription")?.value.trim() ||
        qs('[name="projectDescription"]')?.value.trim() ||
        "";

      const url =
        $("projectUrl")?.value.trim() ||
        qs('[name="projectUrl"]')?.value.trim() ||
        "";

      const image =
        $("projectImage")?.value.trim() ||
        qs('[name="projectImage"]')?.value.trim() ||
        "";


      if (!title) {

        showMessage(
          "Project name দিন।",
          "error"
        );

        return;
      }


      const button =
        qs(
          'button[type="submit"]',
          projectForm
        );


      setLoading(
        button,
        true,
        "যোগ হচ্ছে..."
      );


      try {

        await api(
          "/api/admin/projects",
          {
            method: "POST",

            body: JSON.stringify({

              title,

              description,

              url,

              image

            })
          }
        );


        projectForm.reset();

        await loadProjects();

        renderProjects();

        showMessage(
          "নতুন Project যোগ হয়েছে ✓",
          "success"
        );

      } catch (error) {

        console.error(error);

        showMessage(
          error.message ||
          "Project যোগ করা যায়নি।",
          "error"
        );

      } finally {

        setLoading(
          button,
          false
        );

      }

    }
  );
}


/* Project actions */

document.addEventListener(
  "click",
  async event => {

    const save =
      event.target.closest(
        "[data-project-save]"
      );

    const toggle =
      event.target.closest(
        "[data-project-toggle]"
      );

    const del =
      event.target.closest(
        "[data-project-delete]"
      );


    if (save) {

      const id =
        save.dataset.projectSave;

      const card =
        qs(
          `.project-card[data-project-id="${id}"]`
        );

      if (!card) return;


      const title =
        qs(".project-title", card)
          ?.value.trim() || "";

      const description =
        qs(".project-description", card)
          ?.value.trim() || "";

      const url =
        qs(".project-url", card)
          ?.value.trim() || "";

      const image =
        qs(".project-image", card)
          ?.value.trim() || "";

      const sort_order =
        Number(
          qs(".project-order", card)
            ?.value || 0
        );


      const item =
        projectData.find(
          x => String(x.id) === String(id)
        );


      setLoading(
        save,
        true,
        "Saving..."
      );


      try {

        await api(
          `/api/admin/projects/${id}`,
          {
            method: "PUT",

            body: JSON.stringify({

              title,

              description,

              url,

              image,

              visible:
                item
                  ? item.visible !== false
                  : true,

              sort_order

            })
          }
        );


        await loadProjects();

        renderProjects();

        showMessage(
          "Project আপডেট হয়েছে ✓",
          "success"
        );

      } catch (error) {

        console.error(error);

        showMessage(
          error.message ||
          "Project update failed",
          "error"
        );

      } finally {

        setLoading(
          save,
          false
        );

      }

    }


    if (toggle) {

      const id =
        toggle.dataset.projectToggle;

      const item =
        projectData.find(
          x => String(x.id) === String(id)
        );

      if (!item) return;


      try {

        await api(
          `/api/admin/projects/${id}`,
          {
            method: "PUT",

            body: JSON.stringify({

              title:
                item.title,

              description:
                item.description || "",

              url:
                item.url || "",

              image:
                item.image || "",

              visible:
                !item.visible,

              sort_order:
                Number(
                  item.sort_order || 0
                )

            })
          }
        );


        await loadProjects();

        renderProjects();

        showMessage(
          item.visible
            ? "Project Hide হয়েছে।"
            : "Project Show হয়েছে।",
          "success"
        );

      } catch (error) {

        showMessage(
          error.message ||
          "Visibility change failed",
          "error"
        );

      }

    }


    if (del) {

      const id =
        del.dataset.projectDelete;


      if (
        !confirm(
          "এই Project স্থায়ীভাবে Delete করবেন?"
        )
      ) return;


      setLoading(
        del,
        true,
        "Deleting..."
      );


      try {

        await api(
          `/api/admin/projects/${id}`,
          {
            method: "DELETE"
          }
        );


        await loadProjects();

        renderProjects();

        showMessage(
          "Project Delete হয়েছে ✓",
          "success"
        );

      } catch (error) {

        showMessage(
          error.message ||
          "Delete failed",
          "error"
        );

      } finally {

        setLoading(
          del,
          false
        );

      }

    }

  }
);


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderAll() {

  fillSiteForm();

  renderButtons();

  renderDiary();

  renderProjects();
}


/* =========================================================
   SAVE SITE BUTTON
========================================================= */

const saveSiteBtn =
  $("saveSiteBtn") ||
  qs('[data-action="save-site"]');

if (saveSiteBtn) {

  saveSiteBtn.addEventListener(
    "click",
    event => {

      event.preventDefault();

      saveSite();

    }
  );
}


/* =========================================================
   NAVIGATION
========================================================= */

document.addEventListener(
  "click",
  event => {

    const tab =
      event.target.closest(
        "[data-admin-tab]"
      );

    if (!tab) return;

    const target =
      tab.dataset.adminTab;

    qsa(
      "[data-admin-tab]"
    ).forEach(
      item =>
        item.classList.remove(
          "active"
        )
    );

    tab.classList.add("active");


    qsa(
      "[data-admin-section]"
    ).forEach(
      section => {

        section.style.display =
          section.dataset.adminSection === target
            ? ""
            : "none";

      }
    );

  }
);


/* =========================================================
   WEBSITE BUTTON
========================================================= */

const websiteBtn =
  $("websiteBtn") ||
  qs('[data-action="website"]');

if (websiteBtn) {

  websiteBtn.addEventListener(
    "click",
    () => {

      window.location.href = "/";

    }
  );
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    checkSession();

  }
);
