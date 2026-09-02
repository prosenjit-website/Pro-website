"use strict";

let siteData = {
  buttons: [],
  social: {},
  skills: []
};


// ==========================================
// HELPERS
// ==========================================

const $ = (id) => document.getElementById(id);

function showMessage(id, text, success = true) {

  const el = $(id);

  if (!el) return;

  el.textContent = text;

  el.className =
    "message " + (success ? "success" : "error");

  setTimeout(() => {
    el.textContent = "";
    el.className = "message";
  }, 3500);
}


async function api(url, options = {}) {

  const response = await fetch(url, {
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

    throw new Error(
      data.error || "Something went wrong"
    );

  }

  return data;
}


// ==========================================
// SESSION CHECK
// ==========================================

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

  }
}


// ==========================================
// LOGIN
// ==========================================

const loginForm = $("loginForm");

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      const username =
        $("username").value.trim();

      const password =
        $("password").value;

      if (!username || !password) {

        showMessage(
          "loginMessage",
          "ইউজারনেম ও পাসওয়ার্ড দিন।",
          false
        );

        return;
      }


      const button =
        loginForm.querySelector(
          "button[type='submit']"
        );

      const oldText =
        button.textContent;

      button.disabled = true;

      button.textContent =
        "⏳ লগইন হচ্ছে...";


      try {

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


        showMessage(
          "loginMessage",
          "✅ Login সফল হয়েছে।",
          true
        );


        setTimeout(() => {

          showDashboard();

        }, 400);


      } catch (error) {

        showMessage(
          "loginMessage",
          "❌ " + error.message,
          false
        );

      } finally {

        button.disabled = false;

        button.textContent =
          oldText;

      }

    }
  );

}


// ==========================================
// SHOW / HIDE
// ==========================================

function showDashboard() {

  $("loginSection")
    ?.classList.add("hidden");

  $("dashboard")
    ?.classList.remove("hidden");

  loadAll();

}


function showLogin() {

  $("dashboard")
    ?.classList.add("hidden");

  $("loginSection")
    ?.classList.remove("hidden");

}


// ==========================================
// LOGOUT
// ==========================================

const logoutBtn =
  $("logoutBtn");

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async function () {

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

}


// ==========================================
// NAVIGATION
// ==========================================

document
  .querySelectorAll(
    ".admin-nav button"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const target =
          button.dataset.target;

        document
          .querySelectorAll(
            ".panel"
          )
          .forEach(panel => {

            if (
              panel.id === target ||
              panel.classList.contains(
                "help-panel"
              )
            ) {

              panel.style.display =
                "block";

            } else {

              panel.style.display =
                "none";

            }

          });

        const targetElement =
          $(target);

        targetElement?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }
    );

  });


// ==========================================
// LOAD ALL
// ==========================================

async function loadAll() {

  try {

    await loadSite();

    await loadDiary();

    await loadProjects();

    renderButtons();

  } catch (error) {

    console.error(error);

  }

}


// ==========================================
// SITE CONTENT
// ==========================================

async function loadSite() {

  try {

    siteData =
      await api("/api/admin/content");


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


    $("facebook").value =
      siteData.social?.facebook || "";

    $("instagram").value =
      siteData.social?.instagram || "";

    $("whatsapp").value =
      siteData.social?.whatsapp || "";

    $("email").value =
      siteData.social?.email || "";


  } catch (error) {

    showMessage(
      "siteMessage",
      "❌ তথ্য লোড হয়নি: " +
      error.message,
      false
    );

  }

}


// ==========================================
// SAVE SITE
// ==========================================

$("siteForm")?.addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();


    const skills =
      $("siteSkills")
        .value
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean);


    const updated = {

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

      skills,

      social: {

        facebook:
          $("facebook").value.trim(),

        instagram:
          $("instagram").value.trim(),

        whatsapp:
          $("whatsapp").value.trim(),

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
            body: JSON.stringify(updated)
          }
        );


      siteData =
        result.data;


      showMessage(
        "siteMessage",
        "✅ তথ্য সফলভাবে সংরক্ষণ হয়েছে।"
      );


    } catch (error) {

      showMessage(
        "siteMessage",
        "❌ " + error.message,
        false
      );

    }

  }
);


// ==========================================
// BUTTON MANAGER
// ==========================================

function renderButtons() {

  const container =
    $("buttonsList");

  if (!container) return;

  container.innerHTML = "";


  const buttons =
    Array.isArray(siteData.buttons)
      ? siteData.buttons
      : [];


  buttons
    .sort(
      (a, b) =>
        (a.order || 0) -
        (b.order || 0)
    )
    .forEach((button, index) => {

      const card =
        document.createElement("div");

      card.className =
        "item-card";


      card.innerHTML = `

        <div class="item-head">

          <strong>
            বাটন ${index + 1}
          </strong>

          <button
            type="button"
            class="danger small"
            onclick="deleteButton(${index})"
          >
            🗑️
          </button>

        </div>


        <label>বাটনের নাম</label>

        <input
          id="btnLabel${index}"
          value="${escapeHtml(button.label || "")}"
          type="text"
        >


        <label>লিংক</label>

        <input
          id="btnUrl${index}"
          value="${escapeHtml(button.url || "")}"
          type="text"
        >


        <label class="check-row">

          <input
            id="btnVisible${index}"
            type="checkbox"
            ${button.visible !== false ? "checked" : ""}
          >

          ওয়েবসাইটে দেখাবে

        </label>


        <button
          type="button"
          class="save-small"
          onclick="saveButton(${index})"
        >
          💾 Save
        </button>

      `;


      container.appendChild(card);

    });

}


// ==========================================
// SAVE BUTTON
// ==========================================

window.saveButton =
  async function(index) {

    const buttons =
      siteData.buttons || [];


    const button =
      buttons[index];


    if (!button) return;


    button.label =
      $(`btnLabel${index}`).value.trim();

    button.url =
      $(`btnUrl${index}`).value.trim();

    button.visible =
      $(`btnVisible${index}`).checked;

    button.order =
      index + 1;


    try {

      const result =
        await api(
          "/api/admin/content",
          {
            method: "PUT",

            body: JSON.stringify({
              buttons
            })
          }
        );


      siteData =
        result.data;


      renderButtons();


      showMessage(
        "buttonMessage",
        "✅ বাটন আপডেট হয়েছে।"
      );


    } catch (error) {

      showMessage(
        "buttonMessage",
        "❌ " + error.message,
        false
      );

    }

  };


// ==========================================
// ADD BUTTON
// ==========================================

$("addButtonBtn")
  ?.addEventListener(
    "click",
    async function () {

      if (!Array.isArray(siteData.buttons)) {

        siteData.buttons = [];

      }


      siteData.buttons.push({

        id:
          "button-" +
          Date.now(),

        label:
          "নতুন বাটন",

        url:
          "/",

        visible:
          true,

        order:
          siteData.buttons.length + 1

      });


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


        showMessage(
          "buttonMessage",
          "✅ নতুন বাটন যোগ হয়েছে।"
        );


      } catch (error) {

        showMessage(
          "buttonMessage",
          "❌ " + error.message,
          false
        );

      }

    }
  );


// ==========================================
// DELETE BUTTON
// ==========================================

window.deleteButton =
  async function(index) {

    if (
      !confirm(
        "এই বাটনটি মুছে ফেলবেন?"
      )
    ) return;


    siteData.buttons.splice(
      index,
      1
    );


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

  };


// ==========================================
// DIARY
// ==========================================

async function loadDiary() {

  try {

    const diaries =
      await api(
        "/api/admin/diary"
      );


    renderDiary(diaries);

  } catch (error) {

    console.error(error);

  }

}


function renderDiary(items) {

  const container =
    $("diaryList");

  if (!container) return;

  container.innerHTML = "";


  if (!items.length) {

    container.innerHTML =
      `<div class="empty">
        এখনো কোনো ডায়েরি নেই।
      </div>`;

    return;

  }


  items.forEach(item => {

    const card =
      document.createElement("div");

    card.className =
      "item-card";


    card.innerHTML = `

      <div class="item-head">

        <strong>
          ${escapeHtml(item.title)}
        </strong>

        <button
          type="button"
          class="danger small"
          onclick="deleteDiary(${item.id})"
        >
          🗑️
        </button>

      </div>


      <input
        id="diaryTitle${item.id}"
        value="${escapeHtml(item.title)}"
        type="text"
      >


      <input
        id="diaryDate${item.id}"
        value="${escapeHtml(item.date || "")}"
        type="text"
        placeholder="তারিখ"
      >


      <textarea
        id="diaryContent${item.id}"
        rows="6"
      >${escapeHtml(item.content)}</textarea>


      <label class="check-row">

        <input
          id="diaryVisible${item.id}"
          type="checkbox"
          ${item.visible ? "checked" : ""}
        >

        ওয়েবসাইটে দেখাবে

      </label>


      <button
        type="button"
        class="save-small"
        onclick="saveDiary(${item.id})"
      >
        💾 Save
      </button>

    `;


    container.appendChild(card);

  });

}


// ==========================================
// ADD DIARY
// ==========================================

$("addDiaryBtn")
  ?.addEventListener(
    "click",
    async function () {

      const title =
        prompt(
          "অধ্যায়ের নাম লিখুন:"
        );


      if (!title) return;


      const content =
        prompt(
          "অধ্যায়ের লেখা লিখুন:"
        );


      if (!content) return;


      try {

        await api(
          "/api/admin/diary",
          {
            method: "POST",

            body: JSON.stringify({

              title,

              content,

              date:
                new Date()
                  .toLocaleDateString(
                    "bn-BD"
                  )

            })
          }
        );


        await loadDiary();


        showMessage(
          "diaryMessage",
          "✅ নতুন অধ্যায় যোগ হয়েছে।"
        );


      } catch (error) {

        showMessage(
          "diaryMessage",
          "❌ " + error.message,
          false
        );

      }

    }
  );


// ==========================================
// SAVE DIARY
// ==========================================

window.saveDiary =
  async function(id) {

    try {

      await api(
        `/api/admin/diary/${id}`,
        {
          method: "PUT",

          body: JSON.stringify({

            title:
              $(`diaryTitle${id}`).value.trim(),

            date:
              $(`diaryDate${id}`).value.trim(),

            content:
              $(`diaryContent${id}`).value.trim(),

            visible:
              $(`diaryVisible${id}`).checked

          })
        }
      );


      await loadDiary();


      showMessage(
        "diaryMessage",
        "✅ ডায়েরি আপডেট হয়েছে।"
      );


    } catch (error) {

      showMessage(
        "diaryMessage",
        "❌ " + error.message,
        false
      );

    }

  };


// ==========================================
// DELETE DIARY
// ==========================================

window.deleteDiary =
  async function(id) {

    if (
      !confirm(
        "এই অধ্যায়টি মুছে ফেলবেন?"
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


// ==========================================
// PROJECTS
// ==========================================

async function loadProjects() {

  try {

    const projects =
      await api(
        "/api/admin/projects"
      );


    renderProjects(projects);

  } catch (error) {

    console.error(error);

  }

}


function renderProjects(items) {

  const container =
    $("projectList");

  if (!container) return;

  container.innerHTML = "";


  if (!items.length) {

    container.innerHTML =
      `<div class="empty">
        এখনো কোনো প্রজেক্ট নেই।
      </div>`;

    return;

  }


  items.forEach(item => {

    const card =
      document.createElement("div");

    card.className =
      "item-card";


    card.innerHTML = `

      <div class="item-head">

        <strong>
          ${escapeHtml(item.title)}
        </strong>

        <button
          type="button"
          class="danger small"
          onclick="deleteProject(${item.id})"
        >
          🗑️
        </button>

      </div>


      <label>প্রজেক্টের নাম</label>

      <input
        id="projectTitle${item.id}"
        value="${escapeHtml(item.title)}"
      >


      <label>বিবরণ</label>

      <textarea
        id="projectDescription${item.id}"
        rows="5"
      >${escapeHtml(item.description || "")}</textarea>


      <label>লিংক</label>

      <input
        id="projectUrl${item.id}"
        value="${escapeHtml(item.url || "")}"
        placeholder="https://..."
      >


      <label>ছবির লিংক</label>

      <input
        id="projectImage${item.id}"
        value="${escapeHtml(item.image || "")}"
        placeholder="https://..."
      >


      <label class="check-row">

        <input
          id="projectVisible${item.id}"
          type="checkbox"
          ${item.visible ? "checked" : ""}
        >

        ওয়েবসাইটে দেখাবে

      </label>


      <button
        type="button"
        class="save-small"
        onclick="saveProject(${item.id})"
      >
        💾 Save
      </button>

    `;


    container.appendChild(card);

  });

}


// ==========================================
// ADD PROJECT
// ==========================================

$("addProjectBtn")
  ?.addEventListener(
    "click",
    async function () {

      const title =
        prompt(
          "প্রজেক্টের নাম লিখুন:"
        );


      if (!title) return;


      const description =
        prompt(
          "প্রজেক্টের বিবরণ লিখুন:"
        ) || "";


      try {

        await api(
          "/api/admin/projects",
          {
            method: "POST",

            body: JSON.stringify({

              title,

              description,

              url: "",

              image: ""

            })
          }
        );


        await loadProjects();


        showMessage(
          "projectMessage",
          "✅ নতুন প্রজেক্ট যোগ হয়েছে।"
        );


      } catch (error) {

        showMessage(
          "projectMessage",
          "❌ " + error.message,
          false
        );

      }

    }
  );


// ==========================================
// SAVE PROJECT
// ==========================================

window.saveProject =
  async function(id) {

    try {

      await api(
        `/api/admin/projects/${id}`,
        {
          method: "PUT",

          body: JSON.stringify({

            title:
              $(`projectTitle${id}`).value.trim(),

            description:
              $(`projectDescription${id}`).value.trim(),

            url:
              $(`projectUrl${id}`).value.trim(),

            image:
              $(`projectImage${id}`).value.trim(),

            visible:
              $(`projectVisible${id}`).checked,

            sort_order:
              0

          })
        }
      );


      await loadProjects();


      showMessage(
        "projectMessage",
        "✅ প্রজেক্ট আপডেট হয়েছে।"
      );


    } catch (error) {

      showMessage(
        "projectMessage",
        "❌ " + error.message,
        false
      );

    }

  };


// ==========================================
// DELETE PROJECT
// ==========================================

window.deleteProject =
  async function(id) {

    if (
      !confirm(
        "এই প্রজেক্টটি মুছে ফেলবেন?"
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


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(value) {

  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ==========================================
// START
// ==========================================

checkSession();
