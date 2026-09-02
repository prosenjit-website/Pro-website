/* =========================================================
   PROSENJIT RAY — ADMIN PANEL
========================================================= */

let currentButtons = [];
let currentDiary = [];
let currentProjects = [];

let editingId = null;


/* =========================================================
   BASIC API
========================================================= */

async function api(url, options = {}) {

  const response = await fetch(url, {
    credentials: "include",
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
    throw new Error(
      data.error || "কাজটি সম্পন্ন করা যায়নি"
    );
  }

  return data;
}


/* =========================================================
   LOGIN CHECK
========================================================= */

async function checkLogin() {

  try {

    const data = await api("/api/me");

    if (data.loggedIn) {

      document
        .getElementById("loginScreen")
        .classList.add("hidden");

      document
        .getElementById("dashboard")
        .classList.remove("hidden");

      await loadContent();

    }

  } catch (error) {

    console.log(error);

  }

}


/* =========================================================
   LOGIN
========================================================= */

async function login() {

  const username =
    document.getElementById("loginUser").value.trim();

  const password =
    document.getElementById("loginPass").value;

  const errorBox =
    document.getElementById("loginError");

  errorBox.textContent = "";

  if (!username || !password) {

    errorBox.textContent =
      "ইউজারনেম এবং পাসওয়ার্ড দিন।";

    return;

  }

  try {

    await api("/api/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        password
      })
    });

    document
      .getElementById("loginScreen")
      .classList.add("hidden");

    document
      .getElementById("dashboard")
      .classList.remove("hidden");

    await loadContent();

    toast("লগইন সফল হয়েছে ✓");

  } catch (error) {

    errorBox.textContent =
      error.message;

  }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

  try {

    await api("/api/logout", {
      method: "POST"
    });

  } catch {}

  location.reload();

}


/* =========================================================
   PANEL SWITCH
========================================================= */

function showPanel(name, button) {

  const panels = [
    "content",
    "buttons",
    "diary",
    "projects"
  ];

  panels.forEach(item => {

    const panel =
      document.getElementById(
        item + "Panel"
      );

    if (panel) {
      panel.classList.add("hidden");
    }

  });

  document
    .getElementById(name + "Panel")
    .classList.remove("hidden");


  document
    .querySelectorAll(".nav-btn")
    .forEach(btn => {

      btn.classList.remove("active");

    });

  if (button) {
    button.classList.add("active");
  }


  const titles = {

    content: "সাইটের তথ্য",
    buttons: "বাটন",
    diary: "ডায়েরি",
    projects: "প্রজেক্ট"

  };

  document
    .getElementById("pageTitle")
    .textContent =
      titles[name] || "অ্যাডমিন";


  if (name === "buttons") {
    loadButtons();
  }

  if (name === "diary") {
    loadDiary();
  }

  if (name === "projects") {
    loadProjects();
  }

}


/* =========================================================
   CONTENT
========================================================= */

async function loadContent() {

  try {

    const data =
      await api("/api/admin/content");

    setValue("c_name", data.name);
    setValue("c_tagline", data.tagline);
    setValue("c_college", data.college);
    setValue("c_education", data.education);
    setValue("c_photo", data.photo);
    setValue("c_about", data.about);
    setValue("c_skills", data.skills);
    setValue("c_facebook", data.facebook);
    setValue("c_instagram", data.instagram);
    setValue("c_whatsapp", data.whatsapp);
    setValue("c_email", data.email);

  } catch (error) {

    toast(error.message);

  }

}


function setValue(id, value) {

  const element =
    document.getElementById(id);

  if (element) {

    element.value =
      value || "";

  }

}


/* =========================================================
   SAVE CONTENT
========================================================= */

async function saveContent() {

  const content = {

    name:
      getValue("c_name"),

    tagline:
      getValue("c_tagline"),

    college:
      getValue("c_college"),

    education:
      getValue("c_education"),

    photo:
      getValue("c_photo"),

    about:
      getValue("c_about"),

    skills:
      getValue("c_skills"),

    facebook:
      getValue("c_facebook"),

    instagram:
      getValue("c_instagram"),

    whatsapp:
      getValue("c_whatsapp"),

    email:
      getValue("c_email")

  };


  try {

    await api("/api/admin/content", {

      method: "PUT",

      body:
        JSON.stringify(content)

    });

    document
      .getElementById("contentStatus")
      .textContent =
      "✓ তথ্য সফলভাবে সংরক্ষণ হয়েছে";

    toast("তথ্য সংরক্ষণ হয়েছে ✓");

  } catch (error) {

    document
      .getElementById("contentStatus")
      .textContent =
      "✕ " + error.message;

  }

}


function getValue(id) {

  const element =
    document.getElementById(id);

  return element
    ? element.value.trim()
    : "";

}


/* =========================================================
   BUTTONS
========================================================= */

async function loadButtons() {

  const list =
    document.getElementById("buttonsList");

  list.innerHTML =
    `<div class="loading">লোড হচ্ছে...</div>`;

  try {

    currentButtons =
      await api("/api/admin/buttons");

    renderButtons();

  } catch (error) {

    list.innerHTML =
      `<div class="empty">
        ${escapeHtml(error.message)}
      </div>`;

  }

}


function renderButtons() {

  const list =
    document.getElementById("buttonsList");

  if (!currentButtons.length) {

    list.innerHTML = `
      <div class="empty">
        এখনো কোনো বাটন নেই।
        <br><br>
        উপরের “＋ নতুন বাটন” চাপুন।
      </div>
    `;

    return;

  }


  list.innerHTML =
    currentButtons
      .map(button => buttonCard(button))
      .join("");

}


function buttonCard(button) {

  return `

    <div class="item-card">

      <div class="item-top">

        <div>

          <span class="item-number">
            #${button.sort_order || 0}
          </span>

          <h3>
            ${escapeHtml(button.label || "নামহীন বাটন")}
          </h3>

          <p class="item-url">
            ${escapeHtml(button.url || "")}
          </p>

        </div>

        <span class="${
          button.visible
            ? "badge show"
            : "badge hide"
        }">

          ${
            button.visible
              ? "● দেখা যাচ্ছে"
              : "● লুকানো"
          }

        </span>

      </div>


      <div class="item-actions">

        <button
          class="edit-btn"
          onclick="editButton(${button.id})"
        >
          ✏️ Edit
        </button>

        <button
          class="toggle-btn"
          onclick="toggleButton(${button.id})"
        >
          ${
            button.visible
              ? "👁️ Hide"
              : "👁️ Show"
          }
        </button>

        <button
          class="delete-btn"
          onclick="deleteButton(${button.id})"
        >
          🗑️ Delete
        </button>

      </div>

    </div>

  `;

}


/* =========================================================
   NEW BUTTON
========================================================= */

function newButton() {

  editingId = null;

  document
    .getElementById("modalTitle")
    .textContent =
      "নতুন বাটন যোগ করুন";


  document
    .getElementById("modalBody")
    .innerHTML = `

      <div class="field">
        <label>বাটনের নাম</label>
        <input id="m_label"
          placeholder="আমার সম্পর্কে">
      </div>

      <div class="field">
        <label>লিংক</label>
        <input id="m_url"
          placeholder="/about.html">
      </div>

      <div class="field">
        <label>আইকন</label>
        <input id="m_icon"
          value="→"
          placeholder="→">
      </div>

      <div class="field">
        <label>অবস্থান</label>
        <input id="m_location"
          value="custom"
          placeholder="custom">
      </div>

      <div class="field">
        <label>ক্রম</label>
        <input id="m_order"
          type="number"
          value="0">
      </div>

      <label class="switch-row">
        <input id="m_visible"
          type="checkbox"
          checked>
        <span>ওয়েবসাইটে দেখাবেন</span>
      </label>

      <button
        class="gold-btn full"
        onclick="saveNewButton()"
      >
        💾 বাটন যোগ করুন
      </button>

    `;

  openModal();

}


/* =========================================================
   EDIT BUTTON
========================================================= */

function editButton(id) {

  const button =
    currentButtons.find(
      item => Number(item.id) === Number(id)
    );

  if (!button) return;

  editingId = id;

  document
    .getElementById("modalTitle")
    .textContent =
      "বাটন সম্পাদনা করুন";


  document
    .getElementById("modalBody")
    .innerHTML = `

      <div class="field">
        <label>বাটনের নাম</label>
        <input id="m_label"
          value="${escapeAttr(button.label)}">
      </div>

      <div class="field">
        <label>লিংক</label>
        <input id="m_url"
          value="${escapeAttr(button.url)}">
      </div>

      <div class="field">
        <label>আইকন</label>
        <input id="m_icon"
          value="${escapeAttr(button.icon || "→")}">
      </div>

      <div class="field">
        <label>অবস্থান</label>
        <input id="m_location"
          value="${escapeAttr(button.location || "custom")}">
      </div>

      <div class="field">
        <label>ক্রম</label>
        <input id="m_order"
          type="number"
          value="${Number(button.sort_order) || 0}">
      </div>

      <label class="switch-row">
        <input id="m_visible"
          type="checkbox"
          ${button.visible ? "checked" : ""}>
        <span>ওয়েবসাইটে দেখাবেন</span>
      </label>

      <button
        class="gold-btn full"
        onclick="saveButtonEdit()"
      >
        💾 পরিবর্তন সংরক্ষণ করুন
      </button>

    `;

  openModal();

}


/* =========================================================
   SAVE NEW BUTTON
========================================================= */

async function saveNewButton() {

  const data = getButtonForm();

  if (!data.label || !data.url) {

    toast("বাটনের নাম এবং লিংক দিন");

    return;

  }

  try {

    await api("/api/admin/buttons", {

      method: "POST",

      body:
        JSON.stringify(data)

    });

    closeModal();

    await loadButtons();

    toast("নতুন বাটন যোগ হয়েছে ✓");

  } catch (error) {

    toast(error.message);

  }

}


/* =========================================================
   SAVE BUTTON EDIT
========================================================= */

async function saveButtonEdit() {

  const data =
    getButtonForm();

  try {

    await api(
      `/api/admin/buttons/${editingId}`,
      {
        method: "PUT",
        body: JSON.stringify(data)
      }
    );

    closeModal();

    await loadButtons();

    toast("বাটন পরিবর্তন হয়েছে ✓");

  } catch (error) {

    toast(error.message);

  }

}


function getButtonForm() {

  return {

    label:
      getValue("m_label"),

    url:
      getValue("m_url"),

    icon:
      getValue("m_icon") || "→",

    location:
      getValue("m_location") || "custom",

    visible:
      document.getElementById("m_visible")
        ?.checked ?? true,

    sort_order:
      Number(getValue("m_order")) || 0

  };

}


/* =========================================================
   TOGGLE BUTTON
========================================================= */

async function toggleButton(id) {

  const button =
    currentButtons.find(
      item => Number(item.id) === Number(id)
    );

  if (!button) return;

  try {

    await api(
      `/api/admin/buttons/${id}`,
      {
        method: "PUT",
        body: JSON.stringify({

          label: button.label,
          url: button.url,
          icon: button.icon,
          location: button.location,
          visible: !button.visible,
          sort_order: button.sort_order

        })
      }
    );

    await loadButtons();

    toast(
      button.visible
        ? "বাটন লুকানো হয়েছে"
        : "বাটন দেখানো হয়েছে"
    );

  } catch (error) {

    toast(error.message);

  }

}


/* =========================================================
   DELETE BUTTON
========================================================= */

async function deleteButton(id) {

  if (
    !confirm(
      "এই বাটনটি মুছে ফেলতে চান?"
    )
  ) return;

  try {

    await api(
      `/api/admin/buttons/${id}`,
      {
        method: "DELETE"
      }
    );

    await loadButtons();

    toast("বাটন মুছে ফেলা হয়েছে ✓");

  } catch (error) {

    toast(error.message);

  }

}


/* =========================================================
   DIARY
========================================================= */

async function loadDiary() {

  const list =
    document.getElementById("diaryList");

  list.innerHTML =
    `<div class="loading">ডায়েরি লোড হচ্ছে...</div>`;

  try {

    currentDiary =
      await api("/api/admin/diary");

    renderDiary();

  } catch (error) {

    list.innerHTML =
      `<div class="empty">${escapeHtml(error.message)}</div>`;

  }

}


function renderDiary() {

  const list =
    document.getElementById("diaryList");

  if (!currentDiary.length) {

    list.innerHTML = `
      <div class="empty">
        এখনো কোনো ডায়েরি অধ্যায় নেই।
        <br><br>
        “＋ নতুন অধ্যায়” চাপুন।
      </div>
    `;

    return;

  }


  list.innerHTML =
    currentDiary
      .map(item => diaryCard(item))
      .join("");

}


function diaryCard(item) {

  return `

    <div class="item-card">

      <div class="item-top">

        <div>

          <span class="item-number">
            ${escapeHtml(item.chapter || "")}
          </span>

          <h3>
            ${escapeHtml(item.title || "")}
          </h3>

          <p>
            ${escapeHtml(item.excerpt || "")}
          </p>

        </div>

        <span class="${
          item.visible
            ? "badge show"
            : "badge hide"
        }">

          ${
            item.visible
              ? "● দেখা যাচ্ছে"
              : "● লুকানো"
          }

        </span>

      </div>


      <div class="item-actions">

        <button
          class="edit-btn"
          onclick="editDiary(${item.id})"
        >
          ✏️ Edit
        </button>

        <button
          class="toggle-btn"
          onclick="toggleDiary(${item.id})"
        >
          ${
            item.visible
              ? "👁️ Hide"
              : "👁️ Show"
          }
        </button>

        <button
          class="delete-btn"
          onclick="deleteDiary(${item.id})"
        >
          🗑️ Delete
        </button>

      </div>

    </div>

  `;

}


/* =========================================================
   NEW DIARY
========================================================= */

function newDiary() {

  editingId = null;

  document
    .getElementById("modalTitle")
    .textContent =
      "নতুন অধ্যায় যোগ করুন";


  document
    .getElementById("modalBody")
    .innerHTML = `

      <div class="field">
        <label>অধ্যায়</label>
        <input id="m_chapter"
          placeholder="অধ্যায় ০১">
      </div>

      <div class="field">
        <label>শিরোনাম</label>
        <input id="m_title"
          placeholder="আমার নতুন অধ্যায়">
      </div>

      <div class="field">
        <label>ছোট বিবরণ</label>
        <input id="m_excerpt"
          placeholder="এই অধ্যায়ের সংক্ষিপ্ত বিবরণ">
      </div>

      <div class="field">
        <label>বিস্তারিত লেখা</label>
        <textarea id="m_body"
          placeholder="অধ্যায়ের বিস্তারিত লিখুন..."></textarea>
      </div>

      <div class="field">
        <label>তারিখ</label>
        <input id="m_date"
          placeholder="০২ সেপ্টেম্বর ২০২৬">
      </div>

      <div class="field">
        <label>ক্রম</label>
        <input id="m_order"
          type="number"
          value="0">
      </div>

      <label class="switch-row">
        <input id="m_visible"
          type="checkbox"
          checked>
        <span>ওয়েবসাইটে দেখাবেন</span>
      </label>

      <button
        class="gold-btn full"
        onclick="saveNewDiary()"
      >
        💾 অধ্যায় যোগ করুন
      </button>

    `;

  openModal();

}


/* =========================================================
   EDIT DIARY
========================================================= */

function editDiary(id) {

  const item =
    currentDiary.find(
      x => Number(x.id) === Number(id)
    );

  if (!item) return;

  editingId = id;

  document
    .getElementById("modalTitle")
    .textContent =
      "অধ্যায় সম্পাদনা করুন";


  document
    .getElementById("modalBody")
    .innerHTML = `

      <div class="field">
        <label>অধ্যায়</label>
        <input id="m_chapter"
          value="${escapeAttr(item.chapter)}">
      </div>

      <div class="field">
        <label>শিরোনাম</label>
        <input id="m_title"
          value="${escapeAttr(item.title)}">
      </div>

      <div class="field">
        <label>ছোট বিবরণ</label>
        <input id="m_excerpt"
          value="${escapeAttr(item.excerpt)}">
      </div>

      <div class="field">
        <label>বিস্তারিত লেখা</label>
        <textarea id="m_body">${escapeHtml(item.body || "")}</textarea>
      </div>

      <div class="field">
        <label>তারিখ</label>
        <input id="m_date"
          value="${escapeAttr(item.date_text || "")}">
      </div>

      <div class="field">
        <label>ক্রম</label>
        <input id="m_order"
          type="number"
          value="${Number(item.sort_order) || 0}">
      </div>

      <label class="switch-row">
        <input id="m_visible"
          type="checkbox"
          ${item.visible ? "checked" : ""}>
        <span>ওয়েবসাইটে দেখাবেন</span>
      </label>

      <button
        class="gold-btn full"
        onclick="saveDiaryEdit()"
      >
        💾 পরিবর্তন সংরক্ষণ করুন
      </button>

    `;

  openModal();

}


/* =========================================================
   DIARY FORM
========================================================= */

function getDiaryForm() {

  return {

    chapter:
      getValue("m_chapter"),

    title:
      getValue("m_title"),

    excerpt:
      getValue("m_excerpt"),

    body:
      getValue("m_body"),

    date_text:
      getValue("m_date"),

    visible:
      document.getElementById("m_visible")
        ?.checked ?? true,

    sort_order:
      Number(getValue("m_order")) || 0

  };

}


/* =========================================================
   SAVE NEW DIARY
========================================================= */

async function saveNewDiary() {

  const data =
    getDiaryForm();

  if (!data.chapter || !data.title) {

    toast("অধ্যায় এবং শিরোনাম দিন");

    return;

  }

  try {

    await api("/api/admin/diary", {

      method: "POST",

      body:
        JSON.stringify(data)

    });

    closeModal();

    await loadDiary();

    toast("নতুন অধ্যায় যোগ হয়েছে ✓");

  } catch (error) {

    toast(error.message);

  }

}


/* =========================================================
   SAVE DIARY EDIT
========================================================= */

async function saveDiaryEdit() {

  const data =
    getDiaryForm();

  try {

    await api(
      `/api/admin/diary/${editingId}`,
      {
        method: "PUT",
        body: JSON.stringify(data)
      }
    );

    closeModal();

    await loadDiary();

    toast("অধ্যায় পরিবর্তন হয়েছে ✓");

  } catch (error) {

    toast(error.message);

  }

}


/* =========================================================
   TOGGLE DIARY
========================================================= */

async function toggleDiary(id) {

  const item =
    currentDiary.find(
      x => Number(x.id) === Number(id)
    );

  if (!item) return;

  try {

    await api(
      `/api/admin/diary/${id}`,
      {
        method: "PUT",

        body:
          JSON.stringify({

            chapter: item.chapter,
            title: item.title,
            excerpt: item.excerpt,
            body: item.body,
            date_text: item.date_text,
            visible: !item.visible,
            sort_order: item.sort_order

          })
      }
    );

    await loadDiary();

    toast(
      item.visible
        ? "অধ্যায় লুকানো হয়েছে"
        : "অধ্যায় দেখানো হয়েছে"
    );

  } catch (error) {

    toast(error.message);

  }

}


/* =========================================================
   DELETE DIARY
========================================================= */

async function deleteDiary(id) {

  if (
    !confirm(
      "এই অধ্যায়টি মুছে ফেলতে চান?"
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

    toast("অধ্যায় মুছে ফেলা হয়েছে ✓");

  } catch (error) {

    toast(error.message);

  }

}


/* =========================================================
   PROJECTS
========================================================= */

async function loadProjects() {

  const list =
    document.getElementById("projectsList");

  list.innerHTML =
    `<div class="loading">প্রজেক্ট লোড হচ্ছে...</div>`;

  try {

    currentProjects =
      await api("/api/admin/projects");

    renderProjects();

  } catch (error) {

    list.innerHTML =
      `<div class="empty">${escapeHtml(error.message)}</div>`;

  }

}


function renderProjects() {

  const list =
    document.getElementById("projectsList");

  if (!currentProjects.length) {

    list.innerHTML = `
      <div class="empty">
        এখনো কোনো প্রজেক্ট নেই।
        <br><br>
        “＋ নতুন প্রজেক্ট” চাপুন।
      </div>
    `;

    return;

  }


  list.innerHTML =
    currentProjects
      .map(item => projectCard(item))
      .join("");

}


function projectCard(item) {

  return `

    <div class="item-card">

      <div class="item-top">

        <div>

          <span class="item-number">
            ${escapeHtml(item.type || "PROJECT")}
          </span>

          <h3>
            ${escapeHtml(item.title || item.name || "")}
          </h3>

          <p>
            ${escapeHtml(
              item.description ||
              item.excerpt ||
              ""
            )}
          </p>

        </div>

        <span class="${
          item.visible
            ? "badge show"
            : "badge hide"
        }">

          ${
            item.visible
              ? "● দেখা যাচ্ছে"
              : "● লুকানো"
          }

        </span>

      </div>


      <div class="item-actions">

        <button
          class="edit-btn"
          onclick="editProject(${item.id})"
        >
          ✏️ Edit
        </button>

        <button
          class="toggle-btn"
          onclick="toggleProject(${item.id})"
        >
          ${
            item.visible
              ? "👁️ Hide"
              : "👁️ Show"
          }
        </button>

        <button
          class="delete-btn"
          onclick="deleteProject(${item.id})"
        >
          🗑️ Delete
        </button>

      </div>

    </div>

  `;

}


/* =========================================================
   NEW PROJECT
========================================================= */

function newProject() {

  editingId = null;

  document
    .getElementById("modalTitle")
    .textContent =
      "নতুন প্রজেক্ট যোগ করুন";


  document
    .getElementById("modalBody")
    .innerHTML = `

      <div class="field">
        <label>প্রজেক্টের নাম</label>
        <input id="m_projectTitle"
          placeholder="আমার নতুন প্রজেক্ট">
      </div>

      <div class="field">
        <label>ধরন</label>
        <input id="m_projectType"
          placeholder="Personal Project">
      </div>

      <div class="field">
        <label>প্রজেক্টের বিবরণ</label>
        <textarea id="m_projectDescription"
          placeholder="প্রজেক্ট সম্পর্কে লিখুন..."></textarea>
      </div>

      <div class="field">
        <label>লিংক</label>
        <input id="m_projectUrl"
          placeholder="https://...">
      </div>

      <div class="field">
        <label>ক্রম</label>
        <input id="m_projectOrder"
          type="number"
          value="0">
      </div>

      <label class="switch-row">
        <input id="m_projectVisible"
          type="checkbox"
          checked>
        <span>ওয়েবসাইটে দেখাবেন</span>
      </label>

      <button
        class="gold-btn full"
        onclick="saveNewProject()"
      >
        💾 প্রজেক্ট যোগ করুন
      </button>

    `;

  openModal();

}


/* =========================================================
   EDIT PROJECT
========================================================= */

function editProject(id) {

  const item =
    currentProjects.find(
      x => Number(x.id) === Number(id)
    );

  if (!item) return;

  editingId = id;

  document
    .getElementById("modalTitle")
    .textContent =
      "প্রজেক্ট সম্পাদনা করুন";


  document
    .getElementById("modalBody")
    .innerHTML = `

      <div class="field">
        <label>প্রজেক্টের নাম</label>
        <input id="m_projectTitle"
          value="${escapeAttr(
            item.title || item.name || ""
          )}">
      </div>

      <div class="field">
        <label>ধরন</label>
        <input id="m_projectType"
          value="${escapeAttr(
            item.type || ""
          )}">
      </div>

      <div class="field">
        <label>প্রজেক্টের বিবরণ</label>
        <textarea id="m_projectDescription">${escapeHtml(
          item.description ||
          item.excerpt ||
          ""
        )}</textarea>
      </div>

      <div class="field">
        <label>লিংক</label>
        <input id="m_projectUrl"
          value="${escapeAttr(
            item.url || item.link || ""
          )}">
      </div>

      <div class="field">
        <label>ক্রম</label>
        <input id="m_projectOrder"
          type="number"
          value="${Number(item.sort_order) || 0}">
      </div>

      <label class="switch-row">
        <input id="m_projectVisible"
          type="checkbox"
          ${item.visible ? "checked" : ""}>
        <span>ওয়েবসাইটে দেখাবেন</span>
      </label>

      <button
        class="gold-btn full"
        onclick="saveProjectEdit()"
      >
        💾 পরিবর্তন সংরক্ষণ করুন
      </button>

    `;

  openModal();

}


/* =========================================================
   PROJECT DATA
========================================================= */

function getProjectForm() {

  return {

    title:
      getValue("m_projectTitle"),

    type:
      getValue("m_projectType"),

    description:
      getValue("m_projectDescription"),

    url:
      getValue("m_projectUrl"),

    visible:
      document.getElementById(
        "m_projectVisible"
      )?.checked ?? true,

    sort_order:
      Number(
        getValue("m_projectOrder")
      ) || 0

  };

}


/* =========================================================
   SAVE NEW PROJECT
========================================================= */

async function saveNewProject() {

  const data =
    getProjectForm();

  if (!data.title) {

    toast("প্রজেক্টের নাম দিন");

    return;

  }

  try {

    await api("/api/admin/projects", {

      method: "POST",

      body:
        JSON.stringify(data)

    });

    closeModal();

    await loadProjects();

    toast("নতুন প্রজেক্ট যোগ হয়েছে ✓");

  } catch (error) {

    toast(error.message);

  }

}


/* =========================================================
   SAVE PROJECT EDIT
========================================================= */

async function saveProjectEdit() {

  const data =
    getProjectForm();

  try {

    await api(
      `/api/admin/projects/${editingId}`,
      {
        method: "PUT",
        body: JSON.stringify(data)
      }
    );

    closeModal();

    await loadProjects();

    toast("প্রজেক্ট পরিবর্তন হয়েছে ✓");

  } catch (error) {

    toast(error.message);

  }

}


/* =========================================================
   TOGGLE PROJECT
========================================================= */

async function toggleProject(id) {

  const item =
    currentProjects.find(
      x => Number(x.id) === Number(id)
    );

  if (!item) return;

  const data = {

    title:
      item.title || item.name || "",

    type:
      item.type || "",

    description:
      item.description ||
      item.excerpt ||
      "",

    url:
      item.url ||
      item.link ||
      "",

    visible:
      !item.visible,

    sort_order:
      item.sort_order || 0

  };

  try {

    await api(
      `/api/admin/projects/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data)
      }
    );

    await loadProjects();

    toast(
      item.visible
        ? "প্রজেক্ট লুকানো হয়েছে"
        : "প্রজেক্ট দেখানো হয়েছে"
    );

  } catch (error) {

    toast(error.message);

  }

}


/* =========================================================
   DELETE PROJECT
========================================================= */

async function deleteProject(id) {

  if (
    !confirm(
      "এই প্রজেক্টটি মুছে ফেলতে চান?"
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

    toast("প্রজেক্ট মুছে ফেলা হয়েছে ✓");

  } catch (error) {

    toast(error.message);

  }

}


/* =========================================================
   MODAL
========================================================= */

function openModal() {

  document
    .getElementById("modal")
    .classList.remove("hidden");

  document.body.style.overflow =
    "hidden";

}


function closeModal() {

  document
    .getElementById("modal")
    .classList.add("hidden");

  document.body.style.overflow =
    "";

}


/* =========================================================
   TOAST
========================================================= */

function toast(message) {

  const box =
    document.getElementById("toast");

  box.textContent =
    message;

  box.classList.add("show");

  clearTimeout(
    window.toastTimer
  );

  window.toastTimer =
    setTimeout(() => {

      box.classList.remove("show");

    }, 2500);

}


/* =========================================================
   ESCAPE
========================================================= */

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


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      closeModal();

    }

  }
);


/* =========================================================
   START
========================================================= */

checkLogin();
