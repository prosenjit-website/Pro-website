"use strict";


// =====================================================
// HELPERS
// =====================================================

const $ = (id) => document.getElementById(id);

let siteData = {
  name: "",
  tagline: "",
  college: "",
  education: "",
  photo: "",
  about: "",
  skills: [],
  social: {},
  buttons: []
};

let diaryItems = [];
let projectItems = [];


// =====================================================
// API HELPER
// =====================================================

async function api(
  url,
  options = {}
) {
  const response = await fetch(
    url,
    {
      credentials: "same-origin",

      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },

      ...options
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const error =
      data.error ||
      `Request failed (${response.status})`;

    throw new Error(error);
  }

  return data;
}


// =====================================================
// MESSAGE
// =====================================================

function message(
  element,
  text,
  type = "success"
) {
  if (!element) return;

  element.textContent = text;

  element.className =
    `message ${type}`;

  setTimeout(() => {
    element.textContent = "";
  }, 4000);
}


// =====================================================
// LOGIN
// =====================================================

async function checkSession() {
  try {
    const data =
      await api("/api/admin/session");

    if (data.loggedIn) {
      showDashboard();
    } else {
      showLogin();
    }

  } catch (error) {
    console.error(error);

    showLogin();

    message(
      $("loginMessage"),
      "Server connection পাওয়া যাচ্ছে না।",
      "error"
    );
  }
}


function showLogin() {
  $("loginBox")
    .classList.remove("hidden");

  $("dashboard")
    .classList.add("hidden");

  $("logoutBtn")
    .classList.add("hidden");
}


async function showDashboard() {
  $("loginBox")
    .classList.add("hidden");

  $("dashboard")
    .classList.remove("hidden");

  $("logoutBtn")
    .classList.remove("hidden");

  await loadEverything();
}


// =====================================================
// LOGIN FORM
// =====================================================

$("loginForm").addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const username =
      $("username").value.trim();

    const password =
      $("password").value;

    try {

      const data =
        await api(
          "/api/admin/login",
          {
            method: "POST",

            body: JSON.stringify({
              username,
              password
            })
          }
        );

      if (data.success) {
        message(
          $("loginMessage"),
          "Login successful!",
          "success"
        );

        await showDashboard();
      }

    } catch (error) {

      message(
        $("loginMessage"),
        error.message,
        "error"
      );
    }
  }
);


// =====================================================
// LOGOUT
// =====================================================

$("logoutBtn").addEventListener(
  "click",
  async () => {

    try {

      await api(
        "/api/admin/logout",
        {
          method: "POST"
        }
      );

      location.reload();

    } catch (error) {

      alert(error.message);
    }
  }
);


// =====================================================
// LOAD EVERYTHING
// =====================================================

async function loadEverything() {

  await Promise.all([
    loadSite(),
    loadDiary(),
    loadProjects()
  ]);

  renderButtons();
}


// =====================================================
// SITE
// =====================================================

async function loadSite() {

  try {

    siteData =
      await api("/api/admin/content");

    fillSiteForm();

  } catch (error) {

    console.error(
      "SITE ERROR:",
      error
    );

    message(
      $("siteMessage"),
      error.message,
      "error"
    );
  }
}


function fillSiteForm() {

  $("siteName").value =
    siteData.name || "";

  $("siteTagline").value =
    siteData.tagline || "";

  $("siteCollege").value =
    siteData.college || "";

  $("siteEducation").value =
    siteData.education || "";

  $("sitePhoto").value =
    siteData.photo || "";

  $("siteAbout").value =
    siteData.about || "";

  $("siteSkills").value =
    Array.isArray(siteData.skills)
      ? siteData.skills.join("\n")
      : "";

  const social =
    siteData.social || {};

  $("facebook").value =
    social.facebook || "";

  $("instagram").value =
    social.instagram || "";

  $("whatsapp").value =
    social.whatsapp || "";

  $("github").value =
    social.github || "";

  $("email").value =
    social.email || "";
}


// =====================================================
// SAVE SITE
// =====================================================

$("siteForm").addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const updated = {

      ...siteData,

      name:
        $("siteName").value.trim(),

      tagline:
        $("siteTagline").value.trim(),

      college:
        $("siteCollege").value.trim(),

      education:
        $("siteEducation").value.trim(),

      photo:
        $("sitePhoto").value.trim(),

      about:
        $("siteAbout").value.trim(),

      skills:
        $("siteSkills")
          .value
          .split("\n")
          .map(x => x.trim())
          .filter(Boolean),

      social: {

        ...(siteData.social || {}),

        facebook:
          $("facebook").value.trim(),

        instagram:
          $("instagram").value.trim(),

        whatsapp:
          $("whatsapp").value.trim(),

        github:
          $("github").value.trim(),

        email:
          $("email").value.trim()
      }
    };

    try {

      const result =
        await api(
          "/api/admin/content",
          {
            method: "PUT",

            body:
              JSON.stringify(updated)
          }
        );

      siteData =
        result.data;

      message(
        $("siteMessage"),
        "✅ সাইটের তথ্য সফলভাবে সংরক্ষণ হয়েছে।",
        "success"
      );

    } catch (error) {

      message(
        $("siteMessage"),
        error.message,
        "error"
      );
    }
  }
);


// =====================================================
// BUTTON MANAGER
// =====================================================

function renderButtons() {

  const container =
    $("buttonsList");

  container.innerHTML = "";

  const buttons =
    Array.isArray(siteData.buttons)
      ? [...siteData.buttons]
      : [];

  buttons.sort(
    (a, b) =>
      Number(a.order || 0) -
      Number(b.order || 0)
  );

  if (!buttons.length) {

    container.innerHTML =
      `<div class="item">
        এখনো কোনো Button নেই।
      </div>`;

    return;
  }

  buttons.forEach(
    (button, index) => {

      const div =
        document.createElement("div");

      div.className =
        `item ${
          button.visible === false
            ? "hidden-item"
            : ""
        }`;

      div.innerHTML = `
        <div class="item-head">

          <div>
            <div class="item-title">
              ${escapeHtml(button.label || "Untitled")}
            </div>

            <div class="item-meta">
              ${escapeHtml(button.url || "")}
              · Order ${button.order || index + 1}
            </div>
          </div>

          <div>
            ${
              button.visible === false
                ? "🙈 Hidden"
                : "👁️ Visible"
            }
          </div>

        </div>

        <div class="item-actions">

          <button
            class="small-btn edit"
            onclick="editButton('${button.id}')"
          >
            ✏️ Edit
          </button>

          <button
            class="small-btn toggle"
            onclick="toggleButton('${button.id}')"
          >
            ${
              button.visible === false
                ? "👁️ Show"
                : "🙈 Hide"
            }
          </button>

          <button
            class="small-btn delete"
            onclick="deleteButton('${button.id}')"
          >
            🗑️ Delete
          </button>

        </div>
      `;

      container.appendChild(div);
    }
  );
}


// =====================================================
// ADD BUTTON
// =====================================================

$("addButtonBtn").addEventListener(
  "click",
  () => {

    openModal(`
      <div class="modal-title">
        + নতুন বাটন
      </div>

      <label>
        Button Name
        <input id="modalButtonLabel">
      </label>

      <label>
        Link / URL
        <input
          id="modalButtonUrl"
          placeholder="/about.html"
        >
      </label>

      <label>
        Order
        <input
          id="modalButtonOrder"
          type="number"
          value="${siteData.buttons.length + 1}"
        >
      </label>

      <button
        class="gold-btn"
        onclick="saveNewButton()"
      >
        💾 Add Button
      </button>
    `);
  }
);


window.saveNewButton =
  async function () {

    const label =
      $("modalButtonLabel")
        .value
        .trim();

    const url =
      $("modalButtonUrl")
        .value
        .trim();

    const order =
      Number(
        $("modalButtonOrder")
          .value || 1
      );

    if (!label) {
      alert("Button name দিন");
      return;
    }

    const button = {
      id:
        "btn-" +
        Date.now(),

      label,
      url,

      visible: true,

      order
    };

    siteData.buttons =
      Array.isArray(siteData.buttons)
        ? siteData.buttons
        : [];

    siteData.buttons.push(button);

    await saveButtons();

    closeModal();
  };


// =====================================================
// EDIT BUTTON
// =====================================================

window.editButton =
  function (id) {

    const button =
      siteData.buttons.find(
        x => x.id === id
      );

    if (!button) return;

    openModal(`
      <div class="modal-title">
        ✏️ Button Edit
      </div>

      <label>
        Button Name
        <input
          id="modalButtonLabel"
          value="${escapeAttr(button.label || "")}"
        >
      </label>

      <label>
        Link / URL
        <input
          id="modalButtonUrl"
          value="${escapeAttr(button.url || "")}"
        >
      </label>

      <label>
        Order
        <input
          id="modalButtonOrder"
          type="number"
          value="${button.order || 1}"
        >
      </label>

      <button
        class="gold-btn"
        onclick="updateButton('${id}')"
      >
        💾 Save Changes
      </button>
    `);
  };


window.updateButton =
  async function (id) {

    const button =
      siteData.buttons.find(
        x => x.id === id
      );

    if (!button) return;

    button.label =
      $("modalButtonLabel")
        .value
        .trim();

    button.url =
      $("modalButtonUrl")
        .value
        .trim();

    button.order =
      Number(
        $("modalButtonOrder")
          .value || 1
      );

    await saveButtons();

    closeModal();
  };


// =====================================================
// TOGGLE BUTTON
// =====================================================

window.toggleButton =
  async function (id) {

    const button =
      siteData.buttons.find(
        x => x.id === id
      );

    if (!button) return;

    button.visible =
      button.visible === false;

    await saveButtons();
  };


// =====================================================
// DELETE BUTTON
// =====================================================

window.deleteButton =
  async function (id) {

    if (
      !confirm(
        "এই Button টি Delete করবেন?"
      )
    ) return;

    siteData.buttons =
      siteData.buttons.filter(
        x => x.id !== id
      );

    await saveButtons();
  };


async function saveButtons() {

  try {

    const result =
      await api(
        "/api/admin/content",
        {
          method: "PUT",

          body:
            JSON.stringify({
              buttons:
                siteData.buttons
            })
        }
      );

    siteData =
      result.data;

    renderButtons();

  } catch (error) {

    alert(error.message);
  }
}


// =====================================================
// DIARY
// =====================================================

async function loadDiary() {

  try {

    const data =
      await api(
        "/api/admin/diary"
      );

    diaryItems =
      data.items || [];

    renderDiary();

  } catch (error) {

    console.error(
      "DIARY ERROR:",
      error
    );

    $("diaryList").innerHTML =
      `
      <div class="item">
        <div class="item-title">
          ❌ Diary Load Error
        </div>

        <div class="item-content">
          ${escapeHtml(error.message)}
        </div>
      </div>
      `;
  }
}


function renderDiary() {

  const container =
    $("diaryList");

  container.innerHTML = "";

  if (!diaryItems.length) {

    container.innerHTML =
      `
      <div class="item">
        এখনো কোনো Diary নেই।
      </div>
      `;

    return;
  }

  diaryItems.forEach(
    item => {

      const div =
        document.createElement("div");

      div.className =
        `item ${
          item.visible === false
            ? "hidden-item"
            : ""
        }`;

      div.innerHTML = `

        <div class="item-head">

          <div>

            <div class="item-title">
              ${escapeHtml(item.title)}
            </div>

            <div class="item-meta">
              ${escapeHtml(item.date || "")}
            </div>

          </div>

          <div>
            ${
              item.visible === false
                ? "🙈 Hidden"
                : "👁️ Visible"
            }
          </div>

        </div>

        <div class="item-content">
          ${escapeHtml(item.content)}
        </div>

        <div class="item-actions">

          <button
            class="small-btn edit"
            onclick="editDiary(${item.id})"
          >
            ✏️ Edit
          </button>

          <button
            class="small-btn toggle"
            onclick="toggleDiary(${item.id})"
          >
            ${
              item.visible === false
                ? "👁️ Show"
                : "🙈 Hide"
            }
          </button>

          <button
            class="small-btn delete"
            onclick="deleteDiary(${item.id})"
          >
            🗑️ Delete
          </button>

        </div>
      `;

      container.appendChild(div);
    }
  );
}


// =====================================================
// ADD DIARY
// =====================================================

$("addDiaryBtn").addEventListener(
  "click",
  () => {

    openModal(`

      <div class="modal-title">
        + নতুন ডায়েরি অধ্যায়
      </div>

      <label>
        অধ্যায়ের নাম
        <input id="modalDiaryTitle">
      </label>

      <label>
        তারিখ
        <input
          id="modalDiaryDate"
          type="date"
        >
      </label>

      <label>
        বিস্তারিত লেখা
        <textarea
          id="modalDiaryContent"
          rows="8"
        ></textarea>
      </label>

      <button
        class="gold-btn"
        onclick="saveNewDiary()"
      >
        💾 অধ্যায় যোগ করুন
      </button>

    `);
  }
);


window.saveNewDiary =
  async function () {

    const title =
      $("modalDiaryTitle")
        .value
        .trim();

    const date =
      $("modalDiaryDate")
        .value;

    const content =
      $("modalDiaryContent")
        .value
        .trim();

    if (!title || !content) {
      alert(
        "অধ্যায়ের নাম ও লেখা দিতে হবে"
      );
      return;
    }

    try {

      await api(
        "/api/admin/diary",
        {
          method: "POST",

          body:
            JSON.stringify({
              title,
              content,
              date,
              visible: true
            })
        }
      );

      closeModal();

      await loadDiary();

    } catch (error) {

      alert(error.message);
    }
  };


// =====================================================
// EDIT DIARY
// =====================================================

window.editDiary =
  function (id) {

    const item =
      diaryItems.find(
        x => x.id === id
      );

    if (!item) return;

    openModal(`

      <div class="modal-title">
        ✏️ Diary Edit
      </div>

      <label>
        অধ্যায়ের নাম
        <input
          id="modalDiaryTitle"
          value="${escapeAttr(item.title)}"
        >
      </label>

      <label>
        তারিখ
        <input
          id="modalDiaryDate"
          value="${escapeAttr(item.date || "")}"
          type="date"
        >
      </label>

      <label>
        বিস্তারিত লেখা
        <textarea
          id="modalDiaryContent"
          rows="9"
        >${escapeHtml(item.content)}</textarea>
      </label>

      <button
        class="gold-btn"
        onclick="updateDiary(${id})"
      >
        💾 Save Changes
      </button>

    `);
  };


window.updateDiary =
  async function (id) {

    const item =
      diaryItems.find(
        x => x.id === id
      );

    if (!item) return;

    const title =
      $("modalDiaryTitle")
        .value
        .trim();

    const date =
      $("modalDiaryDate")
        .value;

    const content =
      $("modalDiaryContent")
        .value
        .trim();

    try {

      await api(
        `/api/admin/diary/${id}`,
        {
          method: "PUT",

          body:
            JSON.stringify({
              title,
              content,
              date,
              visible:
                item.visible !== false
            })
        }
      );

      closeModal();

      await loadDiary();

    } catch (error) {

      alert(error.message);
    }
  };


// =====================================================
// TOGGLE DIARY
// =====================================================

window.toggleDiary =
  async function (id) {

    const item =
      diaryItems.find(
        x => x.id === id
      );

    if (!item) return;

    try {

      await api(
        `/api/admin/diary/${id}`,
        {
          method: "PUT",

          body:
            JSON.stringify({
              title: item.title,
              content: item.content,
              date: item.date || "",
              visible:
                item.visible === false
            })
        }
      );

      await loadDiary();

    } catch (error) {

      alert(error.message);
    }
  };


// =====================================================
// DELETE DIARY
// =====================================================

window.deleteDiary =
  async function (id) {

    if (
      !confirm(
        "এই Diary chapter টি Delete করবেন?"
      )
    ) return;

    try {

      await api(
        `/api/admin/diary/${id}`,
        {
          method: "DELETE"
        }
      );

      await loadDiary();

    } catch (error) {

      alert(error.message);
    }
  };


// =====================================================
// PROJECTS
// =====================================================

async function loadProjects() {

  try {

    const data =
      await api(
        "/api/admin/projects"
      );

    projectItems =
      data.items || [];

    renderProjects();

  } catch (error) {

    console.error(
      "PROJECT ERROR:",
      error
    );

    $("projectsList").innerHTML =
      `
      <div class="item">
        <div class="item-title">
          ❌ Project Load Error
        </div>

        <div class="item-content">
          ${escapeHtml(error.message)}
        </div>
      </div>
      `;
  }
}


function renderProjects() {

  const container =
    $("projectsList");

  container.innerHTML = "";

  if (!projectItems.length) {

    container.innerHTML =
      `
      <div class="item">
        এখনো কোনো Project নেই।
      </div>
      `;

    return;
  }

  projectItems.forEach(
    item => {

      const div =
        document.createElement("div");

      div.className =
        `item ${
          item.visible === false
            ? "hidden-item"
            : ""
        }`;

      div.innerHTML = `

        <div class="item-head">

          <div>

            <div class="item-title">
              ${escapeHtml(item.title)}
            </div>

            <div class="item-meta">
              Order: ${item.sort_order || 0}
            </div>

          </div>

          <div>
            ${
              item.visible === false
                ? "🙈 Hidden"
                : "👁️ Visible"
            }
          </div>

        </div>

        <div class="item-content">
          ${escapeHtml(item.description || "")}
        </div>

        <div class="item-actions">

          <button
            class="small-btn edit"
            onclick="editProject(${item.id})"
          >
            ✏️ Edit
          </button>

          <button
            class="small-btn toggle"
            onclick="toggleProject(${item.id})"
          >
            ${
              item.visible === false
                ? "👁️ Show"
                : "🙈 Hide"
            }
          </button>

          <button
            class="small-btn delete"
            onclick="deleteProject(${item.id})"
          >
            🗑️ Delete
          </button>

        </div>

      `;

      container.appendChild(div);
    }
  );
}


// =====================================================
// ADD PROJECT
// =====================================================

$("addProjectBtn").addEventListener(
  "click",
  () => {

    openModal(`

      <div class="modal-title">
        + নতুন প্রজেক্ট
      </div>

      <label>
        Project Name
        <input id="modalProjectTitle">
      </label>

      <label>
        Description
        <textarea
          id="modalProjectDescription"
          rows="6"
        ></textarea>
      </label>

      <label>
        Project Link
        <input
          id="modalProjectUrl"
          placeholder="https://..."
        >
      </label>

      <label>
        Image Link
        <input
          id="modalProjectImage"
          placeholder="https://..."
        >
      </label>

      <label>
        Order
        <input
          id="modalProjectOrder"
          type="number"
          value="0"
        >
      </label>

      <button
        class="gold-btn"
        onclick="saveNewProject()"
      >
        💾 Project যোগ করুন
      </button>

    `);
  }
);


window.saveNewProject =
  async function () {

    const title =
      $("modalProjectTitle")
        .value
        .trim();

    const description =
      $("modalProjectDescription")
        .value
        .trim();

    const url =
      $("modalProjectUrl")
        .value
        .trim();

    const image =
      $("modalProjectImage")
        .value
        .trim();

    const sort_order =
      Number(
        $("modalProjectOrder")
          .value || 0
      );

    if (!title) {
      alert("Project name দিন");
      return;
    }

    try {

      await api(
        "/api/admin/projects",
        {
          method: "POST",

          body:
            JSON.stringify({
              title,
              description,
              url,
              image,
              sort_order,
              visible: true
            })
        }
      );

      closeModal();

      await loadProjects();

    } catch (error) {

      alert(error.message);
    }
  };


// =====================================================
// EDIT PROJECT
// =====================================================

window.editProject =
  function (id) {

    const item =
      projectItems.find(
        x => x.id === id
      );

    if (!item) return;

    openModal(`

      <div class="modal-title">
        ✏️ Project Edit
      </div>

      <label>
        Project Name
        <input
          id="modalProjectTitle"
          value="${escapeAttr(item.title)}"
        >
      </label>

      <label>
        Description
        <textarea
          id="modalProjectDescription"
          rows="7"
        >${escapeHtml(item.description || "")}</textarea>
      </label>

      <label>
        Project Link
        <input
          id="modalProjectUrl"
          value="${escapeAttr(item.url || "")}"
        >
      </label>

      <label>
        Image Link
        <input
          id="modalProjectImage"
          value="${escapeAttr(item.image || "")}"
        >
      </label>

      <label>
        Order
        <input
          id="modalProjectOrder"
          type="number"
          value="${item.sort_order || 0}"
        >
      </label>

      <button
        class="gold-btn"
        onclick="updateProject(${id})"
      >
        💾 Save Changes
      </button>

    `);
  };


window.updateProject =
  async function (id) {

    const item =
      projectItems.find(
        x => x.id === id
      );

    if (!item) return;

    try {

      await api(
        `/api/admin/projects/${id}`,
        {
          method: "PUT",

          body:
            JSON.stringify({

              title:
                $("modalProjectTitle")
                  .value
                  .trim(),

              description:
                $("modalProjectDescription")
                  .value
                  .trim(),

              url:
                $("modalProjectUrl")
                  .value
                  .trim(),

              image:
                $("modalProjectImage")
                  .value
                  .trim(),

              sort_order:
                Number(
                  $("modalProjectOrder")
                    .value || 0
                ),

              visible:
                item.visible !== false
            })
        }
      );

      closeModal();

      await loadProjects();

    } catch (error) {

      alert(error.message);
    }
  };


// =====================================================
// TOGGLE PROJECT
// =====================================================

window.toggleProject =
  async function (id) {

    const item =
      projectItems.find(
        x => x.id === id
      );

    if (!item) return;

    try {

      await api(
        `/api/admin/projects/${id}`,
        {
          method: "PUT",

          body:
            JSON.stringify({

              title: item.title,

              description:
                item.description || "",

              url:
                item.url || "",

              image:
                item.image || "",

              sort_order:
                item.sort_order || 0,

              visible:
                item.visible === false
            })
        }
      );

      await loadProjects();

    } catch (error) {

      alert(error.message);
    }
  };


// =====================================================
// DELETE PROJECT
// =====================================================

window.deleteProject =
  async function (id) {

    if (
      !confirm(
        "এই Project টি Delete করবেন?"
      )
    ) return;

    try {

      await api(
        `/api/admin/projects/${id}`,
        {
          method: "DELETE"
        }
      );

      await loadProjects();

    } catch (error) {

      alert(error.message);
    }
  };


// =====================================================
// TABS
// =====================================================

document
  .querySelectorAll(".tab")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".tab")
          .forEach(
            x =>
              x.classList.remove(
                "active"
              )
          );

        button.classList.add("active");

        document
          .querySelectorAll(
            '[id^="section-"]'
          )
          .forEach(
            x =>
              x.classList.add("hidden")
          );

        const section =
          button.dataset.section;

        $(
          `section-${section}`
        )
          .classList
          .remove("hidden");
      }
    );
  });


// =====================================================
// MODAL
// =====================================================

function openModal(html) {

  $("modalContent").innerHTML =
    html;

  $("modal")
    .classList
    .remove("hidden");
}


function closeModal() {

  $("modal")
    .classList
    .add("hidden");
}


$("closeModal")
  .addEventListener(
    "click",
    closeModal
  );


$("modal")
  .addEventListener(
    "click",
    event => {

      if (
        event.target ===
        $("modal")
      ) {
        closeModal();
      }
    }
  );


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeAttr(value) {
  return escapeHtml(value);
}


// =====================================================
// START
// =====================================================

checkSession();
