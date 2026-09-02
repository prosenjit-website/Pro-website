let portfolio = {};

async function loadData() {

  try {

    const response = await fetch("/api/portfolio");

    if (!response.ok) {
      throw new Error("Data load failed");
    }

    portfolio = await response.json();

    renderAll();

  } catch (error) {

    showMessage("তথ্য লোড করা যায়নি");

    console.error(error);
  }
}


/* =========================
   Navigation
========================= */

function showPanel(name) {

  document.querySelectorAll(".panel").forEach(panel => {
    panel.classList.remove("active");
  });

  const panel = document.getElementById(`panel-${name}`);

  if (panel) {
    panel.classList.add("active");
  }
}


/* =========================
   Render Everything
========================= */

function renderAll() {

  portfolio.site ||= {};
  portfolio.sections ||= {};
  portfolio.buttons ||= {};
  portfolio.about ||= {};
  portfolio.education ||= [];
  portfolio.skills ||= [];
  portfolio.diary ||= [];
  portfolio.hobbies ||= [];
  portfolio.projects ||= [];
  portfolio.vision ||= {};
  portfolio.contact ||= {};

  renderSite();
  renderSections();
  renderButtons();
  renderAbout();
  renderEducation();
  renderSkills();
  renderDiary();
  renderHobbies();
  renderProjects();
  renderVision();
  renderContact();
  updateStats();
}


/* =========================
   Site
========================= */

function renderSite() {

  document.getElementById("siteName").value =
    portfolio.site.name || "";

  document.getElementById("siteTitle").value =
    portfolio.site.title || "";

  document.getElementById("siteDescription").value =
    portfolio.site.description || "";

  document.getElementById("siteShow").checked =
    portfolio.site.show !== false;
}

async function saveSite() {

  portfolio.site.name =
    document.getElementById("siteName").value;

  portfolio.site.title =
    document.getElementById("siteTitle").value;

  portfolio.site.description =
    document.getElementById("siteDescription").value;

  portfolio.site.show =
    document.getElementById("siteShow").checked;

  await savePortfolio("সাইট তথ্য Save হয়েছে");
}


/* =========================
   Sections
========================= */

function renderSections() {

  const box = document.getElementById("sectionManager");

  box.innerHTML = "";

  const names = {
    about: "আমার সম্পর্কে",
    education: "শিক্ষাজীবন",
    skills: "দক্ষতা",
    diary: "দিনলিপি",
    hobbies: "শখ",
    projects: "প্রজেক্ট",
    vision: "ভবিষ্যৎ ভাবনা",
    contact: "যোগাযোগ"
  };

  Object.entries(names).forEach(([key, name]) => {

    const checked =
      portfolio.sections[key] !== false;

    box.innerHTML += `
      <div class="section-row">

        <strong>${name}</strong>

        <label class="switch">
          <input
            type="checkbox"
            ${checked ? "checked" : ""}
            onchange="toggleSection('${key}', this.checked)"
          >

          <span>${checked ? "ON" : "OFF"}</span>
        </label>

      </div>
    `;
  });
}

function toggleSection(key, value) {

  portfolio.sections[key] = value;

  savePortfolio("Section আপডেট হয়েছে");
}


/* =========================
   Buttons
========================= */

function renderButtons() {

  const box = document.getElementById("buttonManager");

  box.innerHTML = "";

  Object.entries(portfolio.buttons).forEach(([key, button]) => {

    box.innerHTML += `
      <div class="manager-card">

        <label>Button Text</label>

        <input
          value="${escapeHTML(button.text || "")}"
          onchange="updateButton('${key}', 'text', this.value)"
        >

        <label>URL</label>

        <input
          value="${escapeHTML(button.url || "")}"
          onchange="updateButton('${key}', 'url', this.value)"
        >

        <label class="switch">
          <input
            type="checkbox"
            ${button.show !== false ? "checked" : ""}
            onchange="updateButton('${key}', 'show', this.checked)"
          >
          <span>দেখাবে</span>
        </label>

      </div>
    `;
  });
}

function updateButton(key, field, value) {

  if (!portfolio.buttons[key]) {
    portfolio.buttons[key] = {};
  }

  portfolio.buttons[key][field] = value;

  savePortfolio("Button আপডেট হয়েছে");
}


/* =========================
   About
========================= */

function renderAbout() {

  document.getElementById("aboutTitle").value =
    portfolio.about.title || "";

  document.getElementById("aboutText").value =
    portfolio.about.text || "";

  document.getElementById("aboutShow").checked =
    portfolio.about.show !== false;
}

async function saveAbout() {

  portfolio.about = {

    title: document.getElementById("aboutTitle").value,

    text: document.getElementById("aboutText").value,

    show: document.getElementById("aboutShow").checked
  };

  await savePortfolio("About Save হয়েছে");
}


/* =========================
   Education
========================= */

function renderEducation() {

  const box = document.getElementById("educationManager");

  box.innerHTML = "";

  portfolio.education.forEach((item, index) => {

    box.innerHTML += `
      <div class="manager-card">

        <label>শিরোনাম</label>
        <input
          value="${escapeHTML(item.title || "")}"
          onchange="portfolio.education[${index}].title=this.value"
        >

        <label>প্রতিষ্ঠান</label>
        <input
          value="${escapeHTML(item.place || "")}"
          onchange="portfolio.education[${index}].place=this.value"
        >

        <label>সময়কাল</label>
        <input
          value="${escapeHTML(item.year || "")}"
          onchange="portfolio.education[${index}].year=this.value"
        >

        <label>বিবরণ</label>
        <textarea
          onchange="portfolio.education[${index}].description=this.value"
        >${escapeHTML(item.description || "")}</textarea>

        <label class="switch">
          <input
            type="checkbox"
            ${item.show !== false ? "checked" : ""}
            onchange="portfolio.education[${index}].show=this.checked"
          >
          <span>দেখাবে</span>
        </label>

        <div class="manager-actions">

          <button
            class="primary"
            onclick="savePortfolio('Education Save হয়েছে')"
          >
            Save
          </button>

          <button
            class="danger"
            onclick="deleteEducation(${index})"
          >
            Delete
          </button>

        </div>

      </div>
    `;
  });
}

function addEducation() {

  portfolio.education.push({
    id: Date.now(),
    title: "নতুন শিক্ষা",
    place: "",
    year: "",
    description: "",
    show: true
  });

  renderEducation();
}

function deleteEducation(index) {

  if (!confirm("এই শিক্ষা মুছে ফেলবেন?")) return;

  portfolio.education.splice(index, 1);

  savePortfolio("Education Delete হয়েছে");
}


/* =========================
   Skills
========================= */

function renderSkills() {

  const box = document.getElementById("skillsManager");

  box.innerHTML = "";

  portfolio.skills.forEach((item, index) => {

    box.innerHTML += `
      <div class="manager-card">

        <label>দক্ষতার নাম</label>

        <input
          value="${escapeHTML(item.name || "")}"
          onchange="portfolio.skills[${index}].name=this.value"
        >

        <label>Percentage</label>

        <input
          type="number"
          min="0"
          max="100"
          value="${Number(item.level) || 0}"
          onchange="portfolio.skills[${index}].level=Number(this.value)"
        >

        <label class="switch">
          <input
            type="checkbox"
            ${item.show !== false ? "checked" : ""}
            onchange="portfolio.skills[${index}].show=this.checked"
          >
          <span>দেখাবে</span>
        </label>

        <div class="manager-actions">

          <button
            class="primary"
            onclick="savePortfolio('Skill Save হয়েছে')"
          >
            Save
          </button>

          <button
            class="danger"
            onclick="deleteSkill(${index})"
          >
            Delete
          </button>

        </div>

      </div>
    `;
  });
}

function addSkill() {

  portfolio.skills.push({
    id: Date.now(),
    name: "নতুন দক্ষতা",
    level: 50,
    show: true
  });

  renderSkills();
}

function deleteSkill(index) {

  if (!confirm("এই দক্ষতা মুছে ফেলবেন?")) return;

  portfolio.skills.splice(index, 1);

  savePortfolio("Skill Delete হয়েছে");
}


/* =========================
   Diary
========================= */

function renderDiary() {

  const box = document.getElementById("diaryManager");

  box.innerHTML = "";

  portfolio.diary.forEach((item, index) => {

    box.innerHTML += `
      <div class="manager-card">

        <label>শিরোনাম</label>

        <input
          value="${escapeHTML(item.title || "")}"
          onchange="portfolio.diary[${index}].title=this.value"
        >

        <label>তারিখ</label>

        <input
          value="${escapeHTML(item.date || "")}"
          onchange="portfolio.diary[${index}].date=this.value"
        >

        <label>লেখা</label>

        <textarea
          onchange="portfolio.diary[${index}].text=this.value"
        >${escapeHTML(item.text || "")}</textarea>

        <label class="switch">
          <input
            type="checkbox"
            ${item.show !== false ? "checked" : ""}
            onchange="portfolio.diary[${index}].show=this.checked"
          >
          <span>দেখাবে</span>
        </label>

        <div class="manager-actions">

          <button
            class="primary"
            onclick="savePortfolio('Diary Save হয়েছে')"
          >
            Save
          </button>

          <button
            class="danger"
            onclick="deleteDiary(${index})"
          >
            Delete
          </button>

        </div>

      </div>
    `;
  });
}

function addDiary() {

  portfolio.diary.push({
    id: Date.now(),
    title: "নতুন দিনলিপি",
    date: "",
    text: "",
    show: true
  });

  renderDiary();
}

function deleteDiary(index) {

  if (!confirm("এই দিনলিপি মুছে ফেলবেন?")) return;

  portfolio.diary.splice(index, 1);

  savePortfolio("Diary Delete হয়েছে");
}


/* =========================
   Hobbies
========================= */

function renderHobbies() {

  const box = document.getElementById("hobbiesManager");

  box.innerHTML = "";

  portfolio.hobbies.forEach((item, index) => {

    box.innerHTML += `
      <div class="manager-card">

        <label>নাম</label>

        <input
          value="${escapeHTML(item.name || "")}"
          onchange="portfolio.hobbies[${index}].name=this.value"
        >

        <label>Icon</label>

        <input
          value="${escapeHTML(item.icon || "")}"
          onchange="portfolio.hobbies[${index}].icon=this.value"
        >

        <label class="switch">
          <input
            type="checkbox"
            ${item.show !== false ? "checked" : ""}
            onchange="portfolio.hobbies[${index}].show=this.checked"
          >
          <span>দেখাবে</span>
        </label>

        <div class="manager-actions">

          <button
            class="primary"
            onclick="savePortfolio('Hobby Save হয়েছে')"
          >
            Save
          </button>

          <button
            class="danger"
            onclick="deleteHobby(${index})"
          >
            Delete
          </button>

        </div>

      </div>
    `;
  });
}

function addHobby() {

  portfolio.hobbies.push({
    id: Date.now(),
    name: "নতুন শখ",
    icon: "⭐",
    show: true
  });

  renderHobbies();
}

function deleteHobby(index) {

  if (!confirm("এই শখ মুছে ফেলবেন?")) return;

  portfolio.hobbies.splice(index, 1);

  savePortfolio("Hobby Delete হয়েছে");
}


/* =========================
   Projects
========================= */

function renderProjects() {

  const box = document.getElementById("projectsManager");

  box.innerHTML = "";

  portfolio.projects.forEach((item, index) => {

    box.innerHTML += `
      <div class="manager-card">

        <label>Project Name</label>

        <input
          value="${escapeHTML(item.title || "")}"
          onchange="portfolio.projects[${index}].title=this.value"
        >

        <label>Description</label>

        <textarea
          onchange="portfolio.projects[${index}].description=this.value"
        >${escapeHTML(item.description || "")}</textarea>

        <label>Project URL</label>

        <input
          value="${escapeHTML(item.url || "")}"
          onchange="portfolio.projects[${index}].url=this.value"
        >

        <label class="switch">
          <input
            type="checkbox"
            ${item.show !== false ? "checked" : ""}
            onchange="portfolio.projects[${index}].show=this.checked"
          >
          <span>দেখাবে</span>
        </label>

        <div class="manager-actions">

          <button
            class="primary"
            onclick="savePortfolio('Project Save হয়েছে')"
          >
            Save
          </button>

          <button
            class="danger"
            onclick="deleteProject(${index})"
          >
            Delete
          </button>

        </div>

      </div>
    `;
  });
}

function addProject() {

  portfolio.projects.push({
    id: Date.now(),
    title: "নতুন প্রজেক্ট",
    description: "",
    url: "#",
    show: true
  });

  renderProjects();
}

function deleteProject(index) {

  if (!confirm("এই প্রজেক্ট মুছে ফেলবেন?")) return;

  portfolio.projects.splice(index, 1);

  savePortfolio("Project Delete হয়েছে");
}


/* =========================
   Vision
========================= */

function renderVision() {

  document.getElementById("visionTitle").value =
    portfolio.vision.title || "";

  document.getElementById("visionText").value =
    portfolio.vision.text || "";

  document.getElementById("visionShow").checked =
    portfolio.vision.show !== false;
}

async function saveVision() {

  portfolio.vision = {

    title: document.getElementById("visionTitle").value,

    text: document.getElementById("visionText").value,

    show: document.getElementById("visionShow").checked
  };

  await savePortfolio("Vision Save হয়েছে");
}


/* =========================
   Contact
========================= */

function renderContact() {

  document.getElementById("contactEmail").value =
    portfolio.contact.email || "";

  document.getElementById("contactFacebook").value =
    portfolio.contact.facebook || "";

  document.getElementById("contactInstagram").value =
    portfolio.contact.instagram || "";

  document.getElementById("contactGithub").value =
    portfolio.contact.github || "";

  document.getElementById("contactShow").checked =
    portfolio.contact.show !== false;
}

async function saveContact() {

  portfolio.contact = {

    email: document.getElementById("contactEmail").value,

    facebook: document.getElementById("contactFacebook").value,

    instagram: document.getElementById("contactInstagram").value,

    github: document.getElementById("contactGithub").value,

    show: document.getElementById("contactShow").checked
  };

  await savePortfolio("Contact Save হয়েছে");
}


/* =========================
   Delete helpers
========================= */

function deleteProject(index) {

  if (!confirm("এই প্রজেক্ট মুছে ফেলবেন?")) return;

  portfolio.projects.splice(index, 1);

  savePortfolio("Project Delete হয়েছে");
}

function deleteEducation(index) {

  if (!confirm("এই শিক্ষা মুছে ফেলবেন?")) return;

  portfolio.education.splice(index, 1);

  savePortfolio("Education Delete হয়েছে");
}

function deleteSkill(index) {

  if (!confirm("এই দক্ষতা মুছে ফেলবেন?")) return;

  portfolio.skills.splice(index, 1);

  savePortfolio("Skill Delete হয়েছে");
}

function deleteDiary(index) {

  if (!confirm("এই দিনলিপি মুছে ফেলবেন?")) return;

  portfolio.diary.splice(index, 1);

  savePortfolio("Diary Delete হয়েছে");
}

function deleteHobby(index) {

  if (!confirm("এই শখ মুছে ফেলবেন?")) return;

  portfolio.hobbies.splice(index, 1);

  savePortfolio("Hobby Delete হয়েছে");
}


/* =========================
   Save
========================= */

async function savePortfolio(message = "সব তথ্য Save হয়েছে") {

  try {

    const response = await fetch("/api/portfolio", {

      method: "PUT",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(portfolio)
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    showMessage(message);

    renderAll();

  } catch (error) {

    console.error(error);

    showMessage("Save করা যায়নি");
  }
}

async function saveAll() {

  await savePortfolio("সব তথ্য সফলভাবে Save হয়েছে");
}


/* =========================
   Dashboard
========================= */

function updateStats() {

  document.getElementById("statEducation").textContent =
    portfolio.education.length;

  document.getElementById("statSkills").textContent =
    portfolio.skills.length;

  document.getElementById("statDiary").textContent =
    portfolio.diary.length;

  document.getElementById("statProjects").textContent =
    portfolio.projects.length;
}


/* =========================
   Message
========================= */

function showMessage(text) {

  const box = document.getElementById("message");

  const toast = document.createElement("div");

  toast.className = "toast";
  toast.textContent = text;

  box.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2500);
}


/* =========================
   Security helper
========================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================
   Start
========================= */

loadData();
