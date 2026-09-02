// =====================================================
// PROSENJIT ADMIN PANEL
// =====================================================

const API = "";


// =====================================================
// API HELPER
// =====================================================

async function api(
  url,
  options = {}
) {

  const response =
    await fetch(
      API + url,
      {
        credentials: "same-origin",

        headers: {
          "Content-Type":
            "application/json",

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

    if (
      response.status === 401
    ) {

      throw new Error(
        "SESSION_EXPIRED"
      );

    }


    throw new Error(
      data.error ||
      "Something went wrong"
    );

  }


  return data;
}


// =====================================================
// ELEMENTS
// =====================================================

const loginBox =
  document.getElementById("login");

const appBox =
  document.getElementById("app");


// =====================================================
// LOGIN
// =====================================================

async function login() {

  const username =
    document.getElementById("user")?.value
    .trim();

  const password =
    document.getElementById("pass")?.value;


  if (!username || !password) {

    alert(
      "Username এবং Password দিন।"
    );

    return;
  }


  try {

    const data =
      await api(
        "/api/login",
        {
          method: "POST",

          body: JSON.stringify({
            username,
            password
          })
        }
      );


    if (
      data.success ||
      data.ok
    ) {

      // Important: session cookie is now saved

      showAdmin();

      await loadAll();

    } else {

      alert(
        data.error ||
        "Login failed"
      );

    }

  } catch (error) {

    alert(
      error.message ||
      "Login failed"
    );

  }

}


// =====================================================
// SHOW ADMIN
// =====================================================

function showAdmin() {

  if (loginBox) {

    loginBox.style.display =
      "none";

  }


  if (appBox) {

    appBox.classList.remove(
      "hidden"
    );

    appBox.style.display =
      "block";

  }

}


// =====================================================
// SHOW LOGIN
// =====================================================

function showLogin() {

  if (loginBox) {

    loginBox.style.display =
      "flex";

  }


  if (appBox) {

    appBox.classList.add(
      "hidden"
    );

    appBox.style.display =
      "none";

  }

}


// =====================================================
// CHECK SESSION
// =====================================================

async function checkSession() {

  try {

    const data =
      await api(
        "/api/me"
      );


    if (data.loggedIn) {

      showAdmin();

      await loadAll();

    } else {

      showLogin();

    }

  } catch {

    showLogin();

  }

}


// =====================================================
// LOGOUT
// =====================================================

async function logout() {

  try {

    await api(
      "/api/logout",
      {
        method: "POST"
      }
    );

  } catch {}

  location.reload();

}


// =====================================================
// SECTION SWITCH
// =====================================================

function show(section) {

  const sections = [
    "content",
    "buttons",
    "diary",
    "projects"
  ];


  sections.forEach(
    name => {

      const el =
        document.getElementById(
          name
        );

      if (!el) return;


      if (name === section) {

        el.classList.remove(
          "hidden"
        );

        el.style.display =
          "block";

      } else {

        el.classList.add(
          "hidden"
        );

        el.style.display =
          "none";

      }

    }
  );


  const title =
    document.getElementById(
      "title"
    );


  const titles = {

    content:
      "Site Content",

    buttons:
      "Button Manager",

    diary:
      "Diary",

    projects:
      "Projects"

  };


  if (title) {

    title.textContent =
      titles[section] ||
      "Admin Panel";

  }

}


// =====================================================
// LOAD EVERYTHING
// =====================================================

async function loadAll() {

  try {

    await loadContent();

  } catch (e) {

    handleError(e);

  }


  try {

    await loadButtons();

  } catch (e) {

    handleError(e);

  }


  try {

    await loadDiary();

  } catch (e) {

    handleError(e);

  }


  try {

    await loadProjects();

  } catch (e) {

    handleError(e);

  }

}


// =====================================================
// ERROR HANDLER
// =====================================================

function handleError(error) {

  if (
    error.message ===
    "SESSION_EXPIRED"
  ) {

    alert(
      "Login session শেষ হয়েছে। আবার Login করুন।"
    );

    showLogin();

    return;

  }

  console.error(error);

}


// =====================================================
// CONTENT
// =====================================================

async function loadContent() {

  const data =
    await api(
      "/api/admin/content"
    );


  const box =
    document.getElementById(
      "content"
    );


  if (!box) return;


  box.innerHTML = `

    <div class="panel">

      <h2>⚙️ Site Information</h2>

      <p class="muted">
        এখান থেকে website-এর সব basic information edit করুন।
      </p>


      ${input(
        "name",
        "নাম",
        data.name
      )}

      ${input(
        "tagline",
        "Tagline",
        data.tagline
      )}

      ${input(
        "college",
        "কলেজ",
        data.college
      )}

      ${input(
        "education",
        "শিক্ষা",
        data.education
      )}

      ${input(
        "profile",
        "Profile Photo",
        data.profile
      )}

      ${textarea(
        "intro",
        "Intro",
        data.intro
      )}

      ${textarea(
        "about",
        "আমার সম্পর্কে",
        data.about
      )}

      <h3>🔗 Social Links</h3>

      ${input(
        "facebook",
        "Facebook",
        data.facebook
      )}

      ${input(
        "instagram",
        "Instagram",
        data.instagram
      )}

      ${input(
        "whatsapp",
        "WhatsApp",
        data.whatsapp
      )}

      ${input(
        "github",
        "GitHub",
        data.github
      )}

      ${input(
        "gmail",
        "Gmail",
        data.gmail
      )}

      ${input(
        "phone",
        "Phone",
        data.phone
      )}


      <button
        class="primary-btn"
        onclick="saveContent()"
      >
        💾 Save Information
      </button>

    </div>

  `;

}


// =====================================================
// INPUT
// =====================================================

function input(
  id,
  label,
  value = ""
) {

  return `

    <label>
      ${label}

      <input
        id="content_${id}"
        value="${escapeAttr(value)}"
        placeholder="${label}"
      >

    </label>

  `;

}


// =====================================================
// TEXTAREA
// =====================================================

function textarea(
  id,
  label,
  value = ""
) {

  return `

    <label>
      ${label}

      <textarea
        id="content_${id}"
        rows="5"
        placeholder="${label}"
      >${escapeHtml(value)}</textarea>

    </label>

  `;

}


// =====================================================
// SAVE CONTENT
// =====================================================

async function saveContent() {

  const fields = [

    "name",
    "tagline",
    "college",
    "education",
    "profile",
    "intro",
    "about",
    "facebook",
    "instagram",
    "whatsapp",
    "github",
    "gmail",
    "phone"

  ];


  const data = {};


  fields.forEach(
    key => {

      const el =
        document.getElementById(
          "content_" + key
        );

      if (el) {

        data[key] =
          el.value;

      }

    }
  );


  try {

    await api(
      "/api/admin/content",
      {
        method: "PUT",

        body:
          JSON.stringify(data)
      }
    );


    alert(
      "✅ Information saved!"
    );

  } catch (error) {

    handleError(error);

  }

}


// =====================================================
// BUTTONS
// =====================================================

async function loadButtons() {

  const buttons =
    await api(
      "/api/admin/buttons"
    );


  const box =
    document.getElementById(
      "buttons"
    );


  if (!box) return;


  box.innerHTML = `

    <div class="panel">

      <h2>🔘 Button Manager</h2>

      <p class="muted">
        Button Edit / Add / Delete / Show / Hide / Order
      </p>


      <button
        class="primary-btn"
        onclick="addButtonForm()"
      >
        ＋ নতুন Button
      </button>


      <div id="buttonList">

        ${
          buttons.length
            ? buttons.map(
                buttonCard
              ).join("")
            : "<p>কোনো Button নেই।</p>"
        }

      </div>

    </div>

  `;

}


function buttonCard(b) {

  return `

    <div class="item-card">

      <input
        id="btn_label_${b.id}"
        value="${escapeAttr(b.label)}"
        placeholder="Button name"
      >

      <input
        id="btn_url_${b.id}"
        value="${escapeAttr(b.url)}"
        placeholder="URL"
      >

      <input
        id="btn_icon_${b.id}"
        value="${escapeAttr(b.icon || "→")}"
        placeholder="Icon"
      >

      <input
        id="btn_location_${b.id}"
        value="${escapeAttr(b.location || "home")}"
        placeholder="Location"
      >

      <input
        id="btn_order_${b.id}"
        type="number"
        value="${Number(b.sort_order) || 0}"
        placeholder="Order"
      >

      <label class="check">
        <input
          id="btn_visible_${b.id}"
          type="checkbox"
          ${b.visible ? "checked" : ""}
        >
        Show
      </label>


      <button
        class="primary-btn"
        onclick="updateButton(${b.id})"
      >
        ✏️ Edit
      </button>


      <button
        onclick="deleteButton(${b.id})"
      >
        🗑️ Delete
      </button>

    </div>

  `;

}


// =====================================================
// ADD BUTTON
// =====================================================

async function addButtonForm() {

  const label =
    prompt(
      "Button name:"
    );

  if (!label) return;


  const url =
    prompt(
      "Button URL:"
    );

  if (!url) return;


  const icon =
    prompt(
      "Icon:",
      "→"
    ) || "→";


  try {

    await api(
      "/api/admin/buttons",
      {
        method: "POST",

        body:
          JSON.stringify({

            label,

            url,

            icon,

            location: "home",

            visible: true,

            sort_order: 0

          })
      }
    );


    await loadButtons();

    alert(
      "✅ Button added!"
    );

  } catch (error) {

    handleError(error);

  }

}


// =====================================================
// UPDATE BUTTON
// =====================================================

async function updateButton(id) {

  const data = {

    label:
      document.getElementById(
        `btn_label_${id}`
      ).value,

    url:
      document.getElementById(
        `btn_url_${id}`
      ).value,

    icon:
      document.getElementById(
        `btn_icon_${id}`
      ).value,

    location:
      document.getElementById(
        `btn_location_${id}`
      ).value,

    sort_order:
      Number(
        document.getElementById(
          `btn_order_${id}`
        ).value
      ) || 0,

    visible:
      document.getElementById(
        `btn_visible_${id}`
      ).checked

  };


  try {

    await api(
      `/api/admin/buttons/${id}`,
      {
        method: "PUT",

        body:
          JSON.stringify(data)
      }
    );


    alert(
      "✅ Button updated!"
    );

    await loadButtons();

  } catch (error) {

    handleError(error);

  }

}


// =====================================================
// DELETE BUTTON
// =====================================================

async function deleteButton(id) {

  if (
    !confirm(
      "এই Button delete করবেন?"
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

  } catch (error) {

    handleError(error);

  }

}


// =====================================================
// DIARY
// =====================================================

async function loadDiary() {

  const diary =
    await api(
      "/api/admin/diary"
    );


  const box =
    document.getElementById(
      "diary"
    );


  if (!box) return;


  box.innerHTML = `

    <div class="panel">

      <h2>📖 Diary Manager</h2>

      <p class="muted">
        নতুন chapter add করুন অথবা পুরোনো chapter edit করুন।
      </p>


      <button
        class="primary-btn"
        onclick="addDiary()"
      >
        ＋ নতুন অধ্যায়
      </button>


      <div>

        ${
          diary.length
            ? diary.map(
                diaryCard
              ).join("")
            : "<p>এখনো কোনো diary নেই।</p>"
        }

      </div>

    </div>

  `;

}


function diaryCard(d) {

  return `

    <div class="item-card">

      <input
        id="diary_chapter_${d.id}"
        value="${escapeAttr(d.chapter)}"
        placeholder="Chapter"
      >

      <input
        id="diary_title_${d.id}"
        value="${escapeAttr(d.title)}"
        placeholder="Title"
      >

      <input
        id="diary_excerpt_${d.id}"
        value="${escapeAttr(d.excerpt || "")}"
        placeholder="Short description"
      >

      <textarea
        id="diary_body_${d.id}"
        rows="6"
        placeholder="Diary content"
      >${escapeHtml(d.body || "")}</textarea>

      <input
        id="diary_date_${d.id}"
        value="${escapeAttr(d.date_text || "")}"
        placeholder="Date"
      >

      <input
        id="diary_order_${d.id}"
        type="number"
        value="${Number(d.sort_order) || 0}"
        placeholder="Order"
      >

      <label class="check">

        <input
          id="diary_visible_${d.id}"
          type="checkbox"
          ${d.visible ? "checked" : ""}
        >

        Show

      </label>


      <button
        class="primary-btn"
        onclick="updateDiary(${d.id})"
      >
        ✏️ Edit
      </button>


      <button
        onclick="deleteDiary(${d.id})"
      >
        🗑️ Delete
      </button>

    </div>

  `;

}


// =====================================================
// ADD DIARY
// =====================================================

async function addDiary() {

  const chapter =
    prompt(
      "Chapter name:",
      "CHAPTER 01"
    );

  if (!chapter) return;


  const title =
    prompt(
      "Diary title:"
    );

  if (!title) return;


  const body =
    prompt(
      "Diary content:"
    ) || "";


  try {

    await api(
      "/api/admin/diary",
      {
        method: "POST",

        body:
          JSON.stringify({

            chapter,

            title,

            excerpt: "",

            body,

            date_text:
              new Date()
                .getFullYear()
                .toString(),

            visible: true,

            sort_order: 0

          })
      }
    );


    await loadDiary();

    alert(
      "✅ Diary added!"
    );

  } catch (error) {

    handleError(error);

  }

}


// =====================================================
// UPDATE DIARY
// =====================================================

async function updateDiary(id) {

  const data = {

    chapter:
      document.getElementById(
        `diary_chapter_${id}`
      ).value,

    title:
      document.getElementById(
        `diary_title_${id}`
      ).value,

    excerpt:
      document.getElementById(
        `diary_excerpt_${id}`
      ).value,

    body:
      document.getElementById(
        `diary_body_${id}`
      ).value,

    date_text:
      document.getElementById(
        `diary_date_${id}`
      ).value,

    sort_order:
      Number(
        document.getElementById(
          `diary_order_${id}`
        ).value
      ) || 0,

    visible:
      document.getElementById(
        `diary_visible_${id}`
      ).checked

  };


  try {

    await api(
      `/api/admin/diary/${id}`,
      {
        method: "PUT",

        body:
          JSON.stringify(data)
      }
    );


    alert(
      "✅ Diary updated!"
    );

    await loadDiary();

  } catch (error) {

    handleError(error);

  }

}


// =====================================================
// DELETE DIARY
// =====================================================

async function deleteDiary(id) {

  if (
    !confirm(
      "এই Diary delete করবেন?"
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

    handleError(error);

  }

}


// =====================================================
// PROJECTS
// =====================================================

async function loadProjects() {

  const projects =
    await api(
      "/api/admin/projects"
    );


  const box =
    document.getElementById(
      "projects"
    );


  if (!box) return;


  box.innerHTML = `

    <div class="panel">

      <h2>🚀 Project Manager</h2>

      <p class="muted">
        Project Add / Edit / Delete / Show / Hide / Order
      </p>


      <button
        class="primary-btn"
        onclick="addProject()"
      >
        ＋ নতুন Project
      </button>


      <div>

        ${
          projects.length
            ? projects.map(
                projectCard
              ).join("")
            : "<p>এখনো কোনো project নেই।</p>"
        }

      </div>

    </div>

  `;

}


function projectCard(p) {

  return `

    <div class="item-card">

      <input
        id="project_title_${p.id}"
        value="${escapeAttr(p.title)}"
        placeholder="Project name"
      >

      <textarea
        id="project_description_${p.id}"
        rows="5"
        placeholder="Description"
      >${escapeHtml(p.description || "")}</textarea>

      <input
        id="project_url_${p.id}"
        value="${escapeAttr(p.url || "")}"
        placeholder="Project link"
      >

      <input
        id="project_image_${p.id}"
        value="${escapeAttr(p.image || "")}"
        placeholder="Image link"
      >

      <input
        id="project_order_${p.id}"
        type="number"
        value="${Number(p.sort_order) || 0}"
        placeholder="Order"
      >

      <label class="check">

        <input
          id="project_visible_${p.id}"
          type="checkbox"
          ${p.visible ? "checked" : ""}
        >

        Show

      </label>


      <button
        class="primary-btn"
        onclick="updateProject(${p.id})"
      >
        ✏️ Edit
      </button>


      <button
        onclick="deleteProject(${p.id})"
      >
        🗑️ Delete
      </button>

    </div>

  `;

}


// =====================================================
// ADD PROJECT
// =====================================================

async function addProject() {

  const title =
    prompt(
      "Project name:"
    );

  if (!title) return;


  const description =
    prompt(
      "Project description:"
    ) || "";


  const url =
    prompt(
      "Project link:"
    ) || "";


  const image =
    prompt(
      "Image link:"
    ) || "";


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

            visible: true,

            sort_order: 0

          })
      }
    );


    await loadProjects();

    alert(
      "✅ Project added!"
    );

  } catch (error) {

    handleError(error);

  }

}


// =====================================================
// UPDATE PROJECT
// =====================================================

async function updateProject(id) {

  const data = {

    title:
      document.getElementById(
        `project_title_${id}`
      ).value,

    description:
      document.getElementById(
        `project_description_${id}`
      ).value,

    url:
      document.getElementById(
        `project_url_${id}`
      ).value,

    image:
      document.getElementById(
        `project_image_${id}`
      ).value,

    sort_order:
      Number(
        document.getElementById(
          `project_order_${id}`
        ).value
      ) || 0,

    visible:
      document.getElementById(
        `project_visible_${id}`
      ).checked

  };


  try {

    await api(
      `/api/admin/projects/${id}`,
      {
        method: "PUT",

        body:
          JSON.stringify(data)
      }
    );


    alert(
      "✅ Project updated!"
    );

    await loadProjects();

  } catch (error) {

    handleError(error);

  }

}


// =====================================================
// DELETE PROJECT
// =====================================================

async function deleteProject(id) {

  if (
    !confirm(
      "এই Project delete করবেন?"
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

    handleError(error);

  }

}


// =====================================================
// SECURITY HELPERS
// =====================================================

function escapeHtml(value) {

  return String(
    value ?? ""
  )
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
// ENTER KEY LOGIN
// =====================================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      document.activeElement?.id === "pass"
    ) {

      login();

    }

  }
);


// =====================================================
// START
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  () => {

    showLogin();

    checkSession();

  }
);
