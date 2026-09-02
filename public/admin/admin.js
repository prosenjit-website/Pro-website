/* =========================================================
   PROSENJIT RAY — ULTRA PRO MAX ADMIN JS
   ========================================================= */

const API = "/api";

let siteData = {};
let diaryData = [];
let projectData = [];

let loggedIn = false;


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (id) => document.getElementById(id);

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function api(url, options = {}) {
  const response = await fetch(API + url, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return data;
}

function message(text, type = "success") {
  let box = $("adminMessage");

  if (!box) {
    box = document.createElement("div");
    box.id = "adminMessage";
    document.body.prepend(box);
  }

  box.textContent = text;
  box.className = `admin-message ${type}`;

  clearTimeout(window.__msgTimer);

  window.__msgTimer = setTimeout(() => {
    box.className = "admin-message";
  }, 3000);
}


/* =========================================================
   INITIAL START
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  bindLogin();

  bindLogout();

  bindNavigation();

  await checkSession();

});


/* =========================================================
   LOGIN
   ========================================================= */

function bindLogin() {

  const form = $("loginForm");

  if (!form) return;

  form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const username =
      $("username")?.value.trim() || "admin";

    const password =
      $("password")?.value || "";

    const button =
      form.querySelector("button[type='submit']");

    if (button) {
      button.disabled = true;
      button.textContent = "লগইন হচ্ছে...";
    }

    try {

      const result = await api("/admin/login", {
        method: "POST",

        body: JSON.stringify({
          username,
          password
        })
      });

      if (result.success) {

        loggedIn = true;

        hideLogin();

        await loadEverything();

        message("✅ সফলভাবে লগইন হয়েছে");

      } else {

        throw new Error(
          result.error || "Login failed"
        );

      }

    } catch (error) {

      message(
        "❌ " + error.message,
        "error"
      );

    } finally {

      if (button) {
        button.disabled = false;
        button.textContent = "লগইন করুন →";
      }

    }

  });

}


/* =========================================================
   SESSION CHECK
   ========================================================= */

async function checkSession() {

  try {

    const result =
      await api("/admin/session");

    if (result.loggedIn) {

      loggedIn = true;

      hideLogin();

      await loadEverything();

    } else {

      loggedIn = false;

      showLogin();

    }

  } catch {

    showLogin();

  }

}


/* =========================================================
   LOGIN / DASHBOARD VISIBILITY
   ========================================================= */

function showLogin() {

  const login =
    $("loginSection");

  const dashboard =
    $("dashboardSection");

  if (login) {
    login.style.display = "";
  }

  if (dashboard) {
    dashboard.style.display = "none";
  }

}


function hideLogin() {

  const login =
    $("loginSection");

  const dashboard =
    $("dashboardSection");

  if (login) {
    login.style.display = "none";
  }

  if (dashboard) {
    dashboard.style.display = "";
  }

}


/* =========================================================
   LOGOUT
   ========================================================= */

function bindLogout() {

  const buttons =
    document.querySelectorAll(
      "#logoutBtn, .logout-btn"
    );

  buttons.forEach(button => {

    button.addEventListener("click", async () => {

      try {

        await api("/admin/logout", {
          method: "POST"
        });

      } catch {}

      loggedIn = false;

      showLogin();

      message("লগআউট সম্পন্ন হয়েছে");

    });

  });

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function bindNavigation() {

  document.addEventListener("click", (event) => {

    const button =
      event.target.closest("[data-admin-section]");

    if (!button) return;

    const section =
      button.dataset.adminSection;

    document
      .querySelectorAll("[data-admin-panel]")
      .forEach(panel => {

        panel.style.display =
          panel.dataset.adminPanel === section
            ? ""
            : "none";

      });

  });

}


/* =========================================================
   LOAD EVERYTHING
   ========================================================= */

async function loadEverything() {

  if (!loggedIn) return;

  try {

    await loadSiteContent();

  } catch (error) {

    message(
      "❌ Site data: " + error.message,
      "error"
    );

  }

  try {

    await loadDiary();

  } catch (error) {

    message(
      "❌ Diary: " + error.message,
      "error"
    );

  }

  try {

    await loadProjects();

  } catch (error) {

    message(
      "❌ Project: " + error.message,
      "error"
    );

  }

}


/* =========================================================
   SITE CONTENT
   ========================================================= */

async function loadSiteContent() {

  siteData =
    await api("/admin/content");

  if (!siteData.social) {
    siteData.social = {};
  }

  if (!Array.isArray(siteData.skills)) {
    siteData.skills = [];
  }

  if (!Array.isArray(siteData.buttons)) {
    siteData.buttons = [];
  }

  fillSiteForm();

  renderButtons();

}


/* =========================================================
   FILL SITE FORM
   ========================================================= */

function setValue(ids, value) {

  const idList =
    Array.isArray(ids)
      ? ids
      : [ids];

  for (const id of idList) {

    const element = $(id);

    if (element) {

      element.value =
        value ?? "";

      return;

    }

  }

}


function fillSiteForm() {

  setValue(
    ["name", "siteName"],
    siteData.name
  );

  setValue(
    ["tagline", "siteTagline"],
    siteData.tagline
  );

  setValue(
    ["college", "siteCollege"],
    siteData.college
  );

  setValue(
    ["education", "siteEducation"],
    siteData.education
  );

  setValue(
    ["photo", "profilePhoto"],
    siteData.photo
  );

  setValue(
    ["about", "aboutText"],
    siteData.about
  );

  const skills =
    Array.isArray(siteData.skills)
      ? siteData.skills.join("\n")
      : "";

  setValue(
    ["skills", "skillsInput"],
    skills
  );

  setValue(
    ["facebook", "facebookLink"],
    siteData.social?.facebook
  );

  setValue(
    ["instagram", "instagramLink"],
    siteData.social?.instagram
  );

  setValue(
    ["whatsapp", "whatsappLink"],
    siteData.social?.whatsapp
  );

  setValue(
    ["github", "githubLink"],
    siteData.social?.github
  );

  setValue(
    ["email", "gmail", "emailLink"],
    siteData.social?.email
  );

}


/* =========================================================
   SAVE SITE CONTENT
   ========================================================= */

async function saveSiteContent() {

  if (!loggedIn) {
    message(
      "আগে Login করুন",
      "error"
    );
    return;
  }

  const skillsText =
    $("skills")?.value ||
    $("skillsInput")?.value ||
    "";

  const skills =
    skillsText
      .split("\n")
      .map(x => x.trim())
      .filter(Boolean);

  const data = {

    name:
      $("name")?.value.trim() ||
      $("siteName")?.value.trim() ||
      siteData.name,

    tagline:
      $("tagline")?.value.trim() ||
      $("siteTagline")?.value.trim() ||
      siteData.tagline,

    college:
      $("college")?.value.trim() ||
      $("siteCollege")?.value.trim() ||
      siteData.college,

    education:
      $("education")?.value.trim() ||
      $("siteEducation")?.value.trim() ||
      siteData.education,

    photo:
      $("photo")?.value.trim() ||
      $("profilePhoto")?.value.trim() ||
      siteData.photo,

    about:
      $("about")?.value.trim() ||
      $("aboutText")?.value.trim() ||
      siteData.about,

    skills,

    social: {

      facebook:
        $("facebook")?.value.trim() ||
        $("facebookLink")?.value.trim() ||
        "",

      instagram:
        $("instagram")?.value.trim() ||
        $("instagramLink")?.value.trim() ||
        "",

      whatsapp:
        $("whatsapp")?.value.trim() ||
        $("whatsappLink")?.value.trim() ||
        "",

      github:
        $("github")?.value.trim() ||
        $("githubLink")?.value.trim() ||
        "",

      email:
        $("email")?.value.trim() ||
        $("gmail")?.value.trim() ||
        $("emailLink")?.value.trim() ||
        ""

    },

    buttons:
      siteData.buttons || []

  };


  try {

    const result =
      await api("/admin/content", {

        method: "PUT",

        body: JSON.stringify(data)

      });

    siteData =
      result.data || data;

    fillSiteForm();

    renderButtons();

    message(
      "✅ ওয়েবসাইটের তথ্য Save হয়েছে"
    );

  } catch (error) {

    message(
      "❌ Save হয়নি: " +
      error.message,
      "error"
    );

  }

}


/* =========================================================
   AUTO FIND SAVE BUTTON
   ========================================================= */

document.addEventListener("click", event => {

  const button =
    event.target.closest(
      "#saveSiteBtn, #saveContentBtn, .save-site"
    );

  if (!button) return;

  event.preventDefault();

  saveSiteContent();

});


/* =========================================================
   BUTTON MANAGER
   ========================================================= */

function renderButtons() {

  const container =
    $("buttonManager") ||
    $("buttonsList") ||
    $("buttonList");

  if (!container) return;

  container.innerHTML = "";

  const buttons =
    [...(siteData.buttons || [])]
      .sort(
        (a, b) =>
          Number(a.order || 0) -
          Number(b.order || 0)
      );

  if (buttons.length === 0) {

    container.innerHTML = `
      <div class="empty-state">
        এখনো কোনো Button নেই।
      </div>
    `;

    return;
  }


  buttons.forEach((button, index) => {

    const card =
      document.createElement("div");

    card.className =
      "admin-item button-item";

    card.innerHTML = `

      <div class="item-top">

        <strong>
          🔘 Button ${index + 1}
        </strong>

        <span class="status">
          ${
            button.visible !== false
              ? "● Visible"
              : "○ Hidden"
          }
        </span>

      </div>

      <input
        class="button-label"
        data-id="${esc(button.id)}"
        value="${esc(button.label || "")}"
        placeholder="Button এর নাম"
      >

      <input
        class="button-url"
        data-id="${esc(button.id)}"
        value="${esc(button.url || "")}"
        placeholder="Button Link"
      >

      <div class="item-actions">

        <button
          type="button"
          class="edit-button"
          data-id="${esc(button.id)}"
        >
          ✏️ Edit
        </button>

        <button
          type="button"
          class="toggle-button"
          data-id="${esc(button.id)}"
        >
          ${
            button.visible !== false
              ? "👁️ Hide"
              : "👁️ Show"
          }
        </button>

        <button
          type="button"
          class="delete-button"
          data-id="${esc(button.id)}"
        >
          🗑️ Delete
        </button>

      </div>

    `;

    container.appendChild(card);

  });

}


/* =========================================================
   BUTTON EDIT
   ========================================================= */

document.addEventListener("click", event => {

  const button =
    event.target.closest(".edit-button");

  if (!button) return;

  const id =
    button.dataset.id;

  const item =
    siteData.buttons.find(
      x => String(x.id) === String(id)
    );

  if (!item) return;

  const label =
    button
      .closest(".button-item")
      ?.querySelector(".button-label")
      ?.value.trim();

  const url =
    button
      .closest(".button-item")
      ?.querySelector(".button-url")
      ?.value.trim();

  item.label =
    label || item.label;

  item.url =
    url || item.url;

  saveButtons();

});


/* =========================================================
   BUTTON SHOW / HIDE
   ========================================================= */

document.addEventListener("click", event => {

  const button =
    event.target.closest(".toggle-button");

  if (!button) return;

  const id =
    button.dataset.id;

  const item =
    siteData.buttons.find(
      x => String(x.id) === String(id)
    );

  if (!item) return;

  item.visible =
    item.visible === false;

  saveButtons();

});


/* =========================================================
   BUTTON DELETE
   ========================================================= */

document.addEventListener("click", event => {

  const button =
    event.target.closest(".delete-button");

  if (!button) return;

  const id =
    button.dataset.id;

  if (
    !confirm(
      "এই Button টি Delete করতে চান?"
    )
  ) {
    return;
  }

  siteData.buttons =
    siteData.buttons.filter(
      x => String(x.id) !== String(id)
    );

  saveButtons();

});


/* =========================================================
   ADD NEW BUTTON
   ========================================================= */

document.addEventListener("click", event => {

  const button =
    event.target.closest(
      "#addButtonBtn, .add-button"
    );

  if (!button) return;

  const id =
    "button-" +
    Date.now();

  siteData.buttons.push({

    id,

    label:
      "নতুন Button",

    url:
      "/",

    visible:
      true,

    order:
      siteData.buttons.length + 1

  });

  saveButtons();

});


/* =========================================================
   SAVE BUTTONS
   ========================================================= */

async function saveButtons() {

  try {

    const result =
      await api("/admin/content", {

        method: "PUT",

        body: JSON.stringify({

          buttons:
            siteData.buttons

        })

      });

    siteData =
      result.data || siteData;

    renderButtons();

    message(
      "✅ Button Manager Update হয়েছে"
    );

  } catch (error) {

    message(
      "❌ Button update হয়নি: " +
      error.message,
      "error"
    );

  }

}


/* =========================================================
   DIARY LOAD
   ========================================================= */

async function loadDiary() {

  diaryData =
    await api("/admin/diary");

  renderDiary();

}


/* =========================================================
   DIARY RENDER
   ========================================================= */

function renderDiary() {

  const container =
    $("diaryList");

  if (!container) return;

  container.innerHTML = "";

  if (!diaryData.length) {

    container.innerHTML = `
      <div class="empty-state">
        এখনো কোনো Diary Chapter নেই।
      </div>
    `;

    return;
  }


  diaryData.forEach(item => {

    const card =
      document.createElement("div");

    card.className =
      "admin-item diary-item";

    card.innerHTML = `

      <div class="item-top">

        <strong>
          📖 ${esc(item.title)}
        </strong>

        <span>
          ${
            item.visible
              ? "● Visible"
              : "○ Hidden"
          }
        </span>

      </div>

      <input
        class="diary-title"
        value="${esc(item.title)}"
        placeholder="অধ্যায়ের নাম"
      >

      <input
        class="diary-date"
        value="${esc(item.date || "")}"
        placeholder="তারিখ"
      >

      <textarea
        class="diary-content"
        placeholder="অধ্যায়ের বিস্তারিত লেখা"
      >${esc(item.content)}</textarea>

      <div class="item-actions">

        <button
          type="button"
          class="save-diary"
          data-id="${item.id}"
        >
          💾 Save
        </button>

        <button
          type="button"
          class="toggle-diary"
          data-id="${item.id}"
        >
          ${
            item.visible
              ? "👁️ Hide"
              : "👁️ Show"
          }
        </button>

        <button
          type="button"
          class="delete-diary"
          data-id="${item.id}"
        >
          🗑️ Delete
        </button>

      </div>

    `;

    container.appendChild(card);

  });

}


/* =========================================================
   ADD DIARY
   ========================================================= */

document.addEventListener("click", async event => {

  const button =
    event.target.closest(
      "#addDiaryBtn, .add-diary"
    );

  if (!button) return;

  const title =
    prompt(
      "নতুন অধ্যায়ের নাম লিখুন:"
    );

  if (!title?.trim()) return;

  const content =
    prompt(
      "অধ্যায়ের বিস্তারিত লিখুন:"
    );

  if (!content?.trim()) return;

  const date =
    prompt(
      "তারিখ লিখুন:",
      new Date().toLocaleDateString("bn-BD")
    ) || "";

  try {

    await api("/admin/diary", {

      method: "POST",

      body: JSON.stringify({

        title:
          title.trim(),

        content:
          content.trim(),

        date:
          date.trim()

      })

    });

    await loadDiary();

    message(
      "✅ নতুন Diary Chapter যোগ হয়েছে"
    );

  } catch (error) {

    message(
      "❌ Diary যোগ হয়নি: " +
      error.message,
      "error"
    );

  }

});


/* =========================================================
   SAVE DIARY
   ========================================================= */

document.addEventListener("click", async event => {

  const button =
    event.target.closest(".save-diary");

  if (!button) return;

  const card =
    button.closest(".diary-item");

  if (!card) return;

  const id =
    button.dataset.id;

  const title =
    card.querySelector(
      ".diary-title"
    )?.value.trim();

  const date =
    card.querySelector(
      ".diary-date"
    )?.value.trim();

  const content =
    card.querySelector(
      ".diary-content"
    )?.value.trim();

  try {

    await api(
      `/admin/diary/${id}`,
      {

        method: "PUT",

        body: JSON.stringify({

          title,

          content,

          date,

          visible:
            diaryData.find(
              x =>
                String(x.id) ===
                String(id)
            )?.visible !== false

        })

      }
    );

    await loadDiary();

    message(
      "✅ Diary update হয়েছে"
    );

  } catch (error) {

    message(
      "❌ Diary update হয়নি: " +
      error.message,
      "error"
    );

  }

});


/* =========================================================
   DIARY SHOW / HIDE
   ========================================================= */

document.addEventListener("click", async event => {

  const button =
    event.target.closest(
      ".toggle-diary"
    );

  if (!button) return;

  const id =
    button.dataset.id;

  const item =
    diaryData.find(
      x =>
        String(x.id) ===
        String(id)
    );

  if (!item) return;

  try {

    await api(
      `/admin/diary/${id}`,
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

    message(
      item.visible
        ? "👁️ Diary Hide হয়েছে"
        : "👁️ Diary Show হয়েছে"
    );

  } catch (error) {

    message(
      "❌ পরিবর্তন হয়নি: " +
      error.message,
      "error"
    );

  }

});


/* =========================================================
   DELETE DIARY
   ========================================================= */

document.addEventListener("click", async event => {

  const button =
    event.target.closest(
      ".delete-diary"
    );

  if (!button) return;

  const id =
    button.dataset.id;

  if (
    !confirm(
      "এই Diary Chapter টি Delete করতে চান?"
    )
  ) {
    return;
  }

  try {

    await api(
      `/admin/diary/${id}`,
      {
        method: "DELETE"
      }
    );

    await loadDiary();

    message(
      "🗑️ Diary Delete হয়েছে"
    );

  } catch (error) {

    message(
      "❌ Delete হয়নি: " +
      error.message,
      "error"
    );

  }

});


/* =========================================================
   PROJECT LOAD
   ========================================================= */

async function loadProjects() {

  projectData =
    await api("/admin/projects");

  renderProjects();

}


/* =========================================================
   PROJECT RENDER
   ========================================================= */

function renderProjects() {

  const container =
    $("projectList");

  if (!container) return;

  container.innerHTML = "";

  if (!projectData.length) {

    container.innerHTML = `
      <div class="empty-state">
        এখনো কোনো Project নেই।
      </div>
    `;

    return;
  }


  projectData.forEach(item => {

    const card =
      document.createElement("div");

    card.className =
      "admin-item project-item";

    card.innerHTML = `

      <div class="item-top">

        <strong>
          🚀 ${esc(item.title)}
        </strong>

        <span>
          ${
            item.visible
              ? "● Visible"
              : "○ Hidden"
          }
        </span>

      </div>

      <input
        class="project-title"
        value="${esc(item.title)}"
        placeholder="প্রজেক্টের নাম"
      >

      <input
        class="project-type"
        value="${esc(item.type || "")}"
        placeholder="ধরন"
      >

      <textarea
        class="project-description"
        placeholder="প্রজেক্টের বিবরণ"
      >${esc(item.description || "")}</textarea>

      <input
        class="project-url"
        value="${esc(item.url || "")}"
        placeholder="Project Link"
      >

      <input
        class="project-image"
        value="${esc(item.image || "")}"
        placeholder="Image Link"
      >

      <input
        class="project-order"
        type="number"
        value="${Number(item.sort_order || 0)}"
        placeholder="Order"
      >

      <div class="item-actions">

        <button
          type="button"
          class="save-project"
          data-id="${item.id}"
        >
          💾 Save
        </button>

        <button
          type="button"
          class="toggle-project"
          data-id="${item.id}"
        >
          ${
            item.visible
              ? "👁️ Hide"
              : "👁️ Show"
          }
        </button>

        <button
          type="button"
          class="delete-project"
          data-id="${item.id}"
        >
          🗑️ Delete
        </button>

      </div>

    `;

    container.appendChild(card);

  });

}


/* =========================================================
   ADD PROJECT
   ========================================================= */

document.addEventListener("click", async event => {

  const button =
    event.target.closest(
      "#addProjectBtn, .add-project"
    );

  if (!button) return;

  const title =
    prompt(
      "নতুন Project এর নাম:"
    );

  if (!title?.trim()) return;

  const description =
    prompt(
      "Project এর বিবরণ:"
    ) || "";

  const url =
    prompt(
      "Project Link:"
    ) || "";

  const image =
    prompt(
      "Project Image Link:"
    ) || "";

  try {

    await api("/admin/projects", {

      method: "POST",

      body: JSON.stringify({

        title:
          title.trim(),

        description:
          description.trim(),

        url:
          url.trim(),

        image:
          image.trim()

      })

    });

    await loadProjects();

    message(
      "🚀 নতুন Project যোগ হয়েছে"
    );

  } catch (error) {

    message(
      "❌ Project যোগ হয়নি: " +
      error.message,
      "error"
    );

  }

});


/* =========================================================
   SAVE PROJECT
   ========================================================= */

document.addEventListener("click", async event => {

  const button =
    event.target.closest(
      ".save-project"
    );

  if (!button) return;

  const id =
    button.dataset.id;

  const card =
    button.closest(
      ".project-item"
    );

  if (!card) return;

  const old =
    projectData.find(
      x =>
        String(x.id) ===
        String(id)
    );

  try {

    await api(
      `/admin/projects/${id}`,
      {

        method: "PUT",

        body: JSON.stringify({

          title:
            card.querySelector(
              ".project-title"
            )?.value.trim(),

          description:
            card.querySelector(
              ".project-description"
            )?.value.trim(),

          url:
            card.querySelector(
              ".project-url"
            )?.value.trim(),

          image:
            card.querySelector(
              ".project-image"
            )?.value.trim(),

          visible:
            old?.visible !== false,

          sort_order:
            Number(
              card.querySelector(
                ".project-order"
              )?.value || 0
            )

        })

      }
    );

    await loadProjects();

    message(
      "✅ Project update হয়েছে"
    );

  } catch (error) {

    message(
      "❌ Project update হয়নি: " +
      error.message,
      "error"
    );

  }

});


/* =========================================================
   PROJECT SHOW / HIDE
   ========================================================= */

document.addEventListener("click", async event => {

  const button =
    event.target.closest(
      ".toggle-project"
    );

  if (!button) return;

  const id =
    button.dataset.id;

  const item =
    projectData.find(
      x =>
        String(x.id) ===
        String(id)
    );

  if (!item) return;

  try {

    await api(
      `/admin/projects/${id}`,
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

    message(
      item.visible
        ? "👁️ Project Hide হয়েছে"
        : "👁️ Project Show হয়েছে"
    );

  } catch (error) {

    message(
      "❌ পরিবর্তন হয়নি: " +
      error.message,
      "error"
    );

  }

});


/* =========================================================
   DELETE PROJECT
   ========================================================= */

document.addEventListener("click", async event => {

  const button =
    event.target.closest(
      ".delete-project"
    );

  if (!button) return;

  const id =
    button.dataset.id;

  if (
    !confirm(
      "এই Project টি Delete করতে চান?"
    )
  ) {
    return;
  }

  try {

    await api(
      `/admin/projects/${id}`,
      {
        method: "DELETE"
      }
    );

    await loadProjects();

    message(
      "🗑️ Project Delete হয়েছে"
    );

  } catch (error) {

    message(
      "❌ Delete হয়নি: " +
      error.message,
      "error"
    );

  }

});


/* =========================================================
   QUICK ADD BUTTONS
   ========================================================= */

window.addNewButton = function () {

  const id =
    "button-" + Date.now();

  siteData.buttons.push({

    id,

    label:
      "নতুন Button",

    url:
      "/",

    visible:
      true,

    order:
      siteData.buttons.length + 1

  });

  saveButtons();

};


window.addNewDiary = function () {

  const button =
    document.querySelector(
      "#addDiaryBtn, .add-diary"
    );

  if (button) {
    button.click();
  }

};


window.addNewProject = function () {

  const button =
    document.querySelector(
      "#addProjectBtn, .add-project"
    );

  if (button) {
    button.click();
  }

};


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.saveSiteContent =
  saveSiteContent;

window.loadEverything =
  loadEverything;

window.renderButtons =
  renderButtons;

window.renderDiary =
  renderDiary;

window.renderProjects =
  renderProjects;


/* =========================================================
   END
   ========================================================= */

console.log(
  "🚀 Prosenjit Ultra Pro Max Admin JS Loaded"
);
