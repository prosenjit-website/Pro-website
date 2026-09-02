"use strict";

let siteData = null;
let diaryData = [];
let projectData = [];

const $ = (id) => document.getElementById(id);


/* =====================================================
   API HELPER
===================================================== */

async function api(url, options = {}) {

  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  let data = {};

  try {
    data = await response.json();
  } catch (e) {}

  if (!response.ok) {

    if (response.status === 401) {
      showLogin();
    }

    throw new Error(
      data.error || "Something went wrong"
    );
  }

  return data;
}


/* =====================================================
   TOAST
===================================================== */

function toast(message) {

  const box = $("toast");

  box.textContent = message;

  box.classList.add("show");

  setTimeout(() => {
    box.classList.remove("show");
  }, 2500);
}


/* =====================================================
   LOGIN / SESSION
===================================================== */

async function checkSession() {

  try {

    const data =
      await api("/api/admin/session");

    if (data.loggedIn) {

      showAdmin();

      await loadEverything();

    } else {

      showLogin();

    }

  } catch (error) {

    showLogin();

  }

}


function showLogin() {

  $("loginSection").classList.remove("hidden");

  $("adminSection").classList.add("hidden");

}


function showAdmin() {

  $("loginSection").classList.add("hidden");

  $("adminSection").classList.remove("hidden");

}


/* =====================================================
   LOGIN
===================================================== */

$("loginForm").addEventListener(
  "submit",
  async function(e) {

    e.preventDefault();

    const username =
      $("username").value.trim();

    const password =
      $("password").value;

    const message =
      $("loginMessage");

    message.textContent = "লগইন হচ্ছে...";
    message.classList.remove("error");

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

      message.textContent = "";

      showAdmin();

      await loadEverything();

      toast("লগইন সফল হয়েছে ✓");

    } catch (error) {

      message.textContent =
        error.message || "লগইন ব্যর্থ";

      message.classList.add("error");

    }

  }
);


/* =====================================================
   LOGOUT
===================================================== */

$("logoutBtn").addEventListener(
  "click",
  async function() {

    try {

      await api(
        "/api/admin/logout",
        {
          method: "POST"
        }
      );

    } catch (error) {}

    showLogin();

    toast("লগআউট হয়েছে");

  }
);


/* =====================================================
   LOAD EVERYTHING
===================================================== */

async function loadEverything() {

  try {

    siteData =
      await api("/api/admin/content");

    fillSiteForm();

  } catch (error) {

    toast(error.message);

  }


  try {

    diaryData =
      await api("/api/admin/diary");

    renderDiary();

  } catch (error) {

    console.error(error);

  }


  try {

    projectData =
      await api("/api/admin/projects");

    renderProjects();

  } catch (error) {

    console.error(error);

  }

}


/* =====================================================
   SITE FORM
===================================================== */

function fillSiteForm() {

  if (!siteData) return;

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

  $("email").value =
    social.email || "";


  renderButtons();

}


/* =====================================================
   SAVE SITE
===================================================== */

$("siteForm").addEventListener(
  "submit",
  async function(e) {

    e.preventDefault();

    const skills =
      $("siteSkills")
        .value
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean);


    const newData = {

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
            body: JSON.stringify(newData)
          }
        );

      siteData =
        result.data;

      fillSiteForm();

      toast("সাইটের তথ্য সংরক্ষণ হয়েছে ✓");

    } catch (error) {

      toast(error.message);

    }

  }
);


/* =====================================================
   BUTTON MANAGER
===================================================== */

function renderButtons() {

  const container =
    $("buttonsList");

  container.innerHTML = "";

  if (!siteData) return;

  if (!Array.isArray(siteData.buttons)) {
    siteData.buttons = [];
  }


  const buttons =
    [...siteData.buttons]
      .sort(
        (a,b) =>
          Number(a.order || 0) -
          Number(b.order || 0)
      );


  if (buttons.length === 0) {

    container.innerHTML = `
      <div class="item-card">
        কোনো বাটন নেই।
      </div>
    `;

    return;
  }


  buttons.forEach(
    (button,index) => {

      const card =
        document.createElement("div");

      card.className = "item-card";

      card.innerHTML = `

        <div class="item-head">

          <h3>
            🔘 বাটন ${index + 1}
          </h3>

          <div class="item-actions">

            <button
              class="edit-btn"
              onclick="saveButton('${escapeAttr(button.id)}')"
            >
              💾 Save
            </button>

            <button
              class="secondary-btn"
              onclick="moveButton('${escapeAttr(button.id)}',-1)"
            >
              ↑
            </button>

            <button
              class="secondary-btn"
              onclick="moveButton('${escapeAttr(button.id)}',1)"
            >
              ↓
            </button>

            <button
              class="danger-btn"
              onclick="deleteButton('${escapeAttr(button.id)}')"
            >
              🗑️
            </button>

          </div>

        </div>


        <label>
          Button Label
          <input
            id="btn-label-${escapeAttr(button.id)}"
            value="${escapeAttr(button.label || "")}"
          >
        </label>


        <label>
          Button Link
          <input
            id="btn-url-${escapeAttr(button.id)}"
            value="${escapeAttr(button.url || "")}"
            placeholder="/about.html"
          >
        </label>


        <label class="hidden-label">

          <input
            id="btn-visible-${escapeAttr(button.id)}"
            type="checkbox"
            ${button.visible !== false ? "checked" : ""}
          >

          ওয়েবসাইটে দেখাবেন

        </label>

      `;

      container.appendChild(card);

    }
  );

}


/* =====================================================
   SAVE BUTTON
===================================================== */

window.saveButton =
  async function(id) {

    const button =
      siteData.buttons.find(
        x => String(x.id) === String(id)
      );

    if (!button) return;


    button.label =
      $(`btn-label-${id}`).value.trim();

    button.url =
      $(`btn-url-${id}`).value.trim();

    button.visible =
      $(`btn-visible-${id}`).checked;


    await saveButtons();

  };


async function saveButtons() {

  siteData.buttons =
    siteData.buttons.map(
      (button,index) => ({
        ...button,
        order:index + 1
      })
    );


  try {

    const result =
      await api(
        "/api/admin/content",
        {
          method:"PUT",

          body:JSON.stringify({
            buttons:
              siteData.buttons
          })
        }
      );

    siteData =
      result.data;

    renderButtons();

    toast("বাটন আপডেট হয়েছে ✓");

  } catch(error) {

    toast(error.message);

  }

}


/* =====================================================
   ADD BUTTON
===================================================== */

$("addButtonBtn").addEventListener(
  "click",
  async function() {

    const label =
      prompt(
        "নতুন বাটনের নাম লিখুন:"
      );

    if (!label) return;


    const url =
      prompt(
        "বাটনের Link লিখুন:",
        "/"
      );


    const id =
      "button_" +
      Date.now();


    siteData.buttons =
      Array.isArray(siteData.buttons)
        ? siteData.buttons
        : [];


    siteData.buttons.push({

      id,

      label,

      url: url || "/",

      visible:true,

      order:
        siteData.buttons.length + 1

    });


    await saveButtons();

  }
);


/* =====================================================
   DELETE BUTTON
===================================================== */

window.deleteButton =
  async function(id) {

    if (
      !confirm(
        "এই বাটনটি মুছে ফেলবেন?"
      )
    ) return;


    siteData.buttons =
      siteData.buttons.filter(
        x => String(x.id) !== String(id)
      );


    await saveButtons();

  };


/* =====================================================
   MOVE BUTTON
===================================================== */

window.moveButton =
  async function(id,direction) {

    const arr =
      [...siteData.buttons]
        .sort(
          (a,b) =>
            Number(a.order || 0) -
            Number(b.order || 0)
        );


    const index =
      arr.findIndex(
        x => String(x.id) === String(id)
      );


    const newIndex =
      index + direction;


    if (
      index < 0 ||
      newIndex < 0 ||
      newIndex >= arr.length
    ) return;


    [
      arr[index],
      arr[newIndex]
    ] =
    [
      arr[newIndex],
      arr[index]
    ];


    arr.forEach(
      (x,i) => x.order = i + 1
    );


    siteData.buttons = arr;

    await saveButtons();

  };


/* =====================================================
   DIARY
===================================================== */

async function loadDiary() {

  diaryData =
    await api("/api/admin/diary");

  renderDiary();

}


$("addDiaryBtn").addEventListener(
  "click",
  async function() {

    const title =
      $("newDiaryTitle").value.trim();

    const content =
      $("newDiaryContent").value.trim();

    const date =
      $("newDiaryDate").value.trim();


    if (!title || !content) {

      toast(
        "অধ্যায়ের নাম ও লেখা দিন"
      );

      return;

    }


    try {

      await api(
        "/api/admin/diary",
        {
          method:"POST",

          body:JSON.stringify({
            title,
            content,
            date
          })
        }
      );


      $("newDiaryTitle").value = "";
      $("newDiaryContent").value = "";
      $("newDiaryDate").value = "";


      await loadDiary();

      toast("নতুন অধ্যায় যোগ হয়েছে ✓");

    } catch(error) {

      toast(error.message);

    }

  }
);


/* =====================================================
   RENDER DIARY
===================================================== */

function renderDiary() {

  const container =
    $("diaryList");

  container.innerHTML = "";


  if (!diaryData.length) {

    container.innerHTML = `
      <div class="item-card">
        এখনো কোনো ডায়েরি নেই।
      </div>
    `;

    return;
  }


  diaryData.forEach(
    diary => {

      const card =
        document.createElement("div");

      card.className = "item-card";


      card.innerHTML = `

        <div class="item-head">

          <h3>
            📖 ${escapeHtml(diary.title)}
          </h3>

          <div class="item-actions">

            <button
              class="edit-btn"
              onclick="updateDiary(${diary.id})"
            >
              💾 Save
            </button>

            <button
              class="danger-btn"
              onclick="deleteDiary(${diary.id})"
            >
              🗑️ Delete
            </button>

          </div>

        </div>


        <label>
          অধ্যায়ের নাম

          <input
            id="diary-title-${diary.id}"
            value="${escapeAttr(diary.title)}"
          >

        </label>


        <label>
          বিস্তারিত

          <textarea
            id="diary-content-${diary.id}"
            rows="6"
          >${escapeHtml(diary.content)}</textarea>

        </label>


        <label>
          তারিখ

          <input
            id="diary-date-${diary.id}"
            value="${escapeAttr(diary.date || "")}"
          >

        </label>


        <label class="hidden-label">

          <input
            id="diary-visible-${diary.id}"
            type="checkbox"
            ${diary.visible !== false ? "checked" : ""}
          >

          ওয়েবসাইটে দেখাবেন

        </label>

      `;


      container.appendChild(card);

    }
  );

}


/* =====================================================
   UPDATE DIARY
===================================================== */

window.updateDiary =
  async function(id) {

    try {

      await api(
        `/api/admin/diary/${id}`,
        {
          method:"PUT",

          body:JSON.stringify({

            title:
              $(`diary-title-${id}`).value.trim(),

            content:
              $(`diary-content-${id}`).value.trim(),

            date:
              $(`diary-date-${id}`).value.trim(),

            visible:
              $(`diary-visible-${id}`).checked

          })
        }
      );


      await loadDiary();

      toast("ডায়েরি আপডেট হয়েছে ✓");

    } catch(error) {

      toast(error.message);

    }

  };


/* =====================================================
   DELETE DIARY
===================================================== */

window.deleteDiary =
  async function(id) {

    if (
      !confirm(
        "এই ডায়েরি মুছে ফেলবেন?"
      )
    ) return;


    try {

      await api(
        `/api/admin/diary/${id}`,
        {
          method:"DELETE"
        }
      );


      await loadDiary();

      toast("ডায়েরি মুছে ফেলা হয়েছে");

    } catch(error) {

      toast(error.message);

    }

  };


/* =====================================================
   PROJECT
===================================================== */

async function loadProjects() {

  projectData =
    await api("/api/admin/projects");

  renderProjects();

}


$("addProjectBtn").addEventListener(
  "click",
  async function() {

    const title =
      $("newProjectTitle").value.trim();

    const description =
      $("newProjectDescription").value.trim();

    const url =
      $("newProjectUrl").value.trim();

    const image =
      $("newProjectImage").value.trim();


    if (!title) {

      toast("প্রজেক্টের নাম দিন");

      return;

    }


    try {

      await api(
        "/api/admin/projects",
        {
          method:"POST",

          body:JSON.stringify({

            title,

            description,

            url,

            image

          })
        }
      );


      $("newProjectTitle").value = "";
      $("newProjectType").value = "";
      $("newProjectDescription").value = "";
      $("newProjectUrl").value = "";
      $("newProjectImage").value = "";


      await loadProjects();

      toast("নতুন প্রজেক্ট যোগ হয়েছে ✓");

    } catch(error) {

      toast(error.message);

    }

  }
);


/* =====================================================
   RENDER PROJECTS
===================================================== */

function renderProjects() {

  const container =
    $("projectList");

  container.innerHTML = "";


  if (!projectData.length) {

    container.innerHTML = `
      <div class="item-card">
        এখনো কোনো প্রজেক্ট নেই।
      </div>
    `;

    return;
  }


  projectData.forEach(
    project => {

      const card =
        document.createElement("div");

      card.className = "item-card";


      card.innerHTML = `

        <div class="item-head">

          <h3>
            🚀 ${escapeHtml(project.title)}
          </h3>

          <div class="item-actions">

            <button
              class="edit-btn"
              onclick="updateProject(${project.id})"
            >
              💾 Save
            </button>

            <button
              class="danger-btn"
              onclick="deleteProject(${project.id})"
            >
              🗑️ Delete
            </button>

          </div>

        </div>


        <label>
          প্রজেক্টের নাম

          <input
            id="project-title-${project.id}"
            value="${escapeAttr(project.title)}"
          >

        </label>


        <label>
          ধরন

          <input
            id="project-type-${project.id}"
            value="${escapeAttr(project.type || "")}"
          >

        </label>


        <label>
          বিবরণ

          <textarea
            id="project-description-${project.id}"
            rows="5"
          >${escapeHtml(project.description || "")}</textarea>

        </label>


        <label>
          প্রজেক্ট লিংক

          <input
            id="project-url-${project.id}"
            value="${escapeAttr(project.url || "")}"
            placeholder="https://..."
          >

        </label>


        <label>
          ছবির লিংক

          <input
            id="project-image-${project.id}"
            value="${escapeAttr(project.image || "")}"
            placeholder="https://..."
          >

        </label>


        <label>
          Sort Order

          <input
            id="project-order-${project.id}"
            type="number"
            value="${Number(project.sort_order || 0)}"
          >

        </label>


        <label class="hidden-label">

          <input
            id="project-visible-${project.id}"
            type="checkbox"
            ${project.visible !== false ? "checked" : ""}
          >

          ওয়েবসাইটে দেখাবেন

        </label>

      `;


      container.appendChild(card);

    }
  );

}


/* =====================================================
   UPDATE PROJECT
===================================================== */

window.updateProject =
  async function(id) {

    try {

      await api(
        `/api/admin/projects/${id}`,
        {
          method:"PUT",

          body:JSON.stringify({

            title:
              $(`project-title-${id}`).value.trim(),

            description:
              $(`project-description-${id}`).value.trim(),

            url:
              $(`project-url-${id}`).value.trim(),

            image:
              $(`project-image-${id}`).value.trim(),

            visible:
              $(`project-visible-${id}`).checked,

            sort_order:
              Number(
                $(`project-order-${id}`).value || 0
              )

          })
        }
      );


      await loadProjects();

      toast("প্রজেক্ট আপডেট হয়েছে ✓");

    } catch(error) {

      toast(error.message);

    }

  };


/* =====================================================
   DELETE PROJECT
===================================================== */

window.deleteProject =
  async function(id) {

    if (
      !confirm(
        "এই প্রজেক্ট মুছে ফেলবেন?"
      )
    ) return;


    try {

      await api(
        `/api/admin/projects/${id}`,
        {
          method:"DELETE"
        }
      );


      await loadProjects();

      toast("প্রজেক্ট মুছে ফেলা হয়েছে");

    } catch(error) {

      toast(error.message);

    }

  };


/* =====================================================
   NAVIGATION
===================================================== */

document
  .querySelectorAll(".nav-btn")
  .forEach(
    button => {

      button.addEventListener(
        "click",
        function() {

          document
            .querySelectorAll(".nav-btn")
            .forEach(
              x =>
                x.classList.remove("active")
            );


          this.classList.add("active");


          document
            .querySelectorAll(".panel")
            .forEach(
              panel =>
                panel.classList.add("hidden")
            );


          const target =
            this.dataset.target;

          $(target)
            .classList.remove("hidden");

        }
      );

    }
  );


/* =====================================================
   SECURITY HELPERS
===================================================== */

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

}


function escapeAttr(value) {

  return escapeHtml(value);

}


/* =====================================================
   START
===================================================== */

checkSession();
