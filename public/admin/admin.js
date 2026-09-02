"use strict";

let portfolio = {};
let saving = false;

/* =========================================================
   API
========================================================= */

async function apiSave(message = "তথ্য সংরক্ষণ হয়েছে") {
  if (saving) return;

  saving = true;

  try {
    const response = await fetch("/api/portfolio", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(portfolio)
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Save failed");
    }

    portfolio = result.data || portfolio;

    renderAll();
    showMessage(message, "success");

  } catch (error) {
    console.error(error);
    showMessage("তথ্য সংরক্ষণ করা যায়নি", "error");
  } finally {
    saving = false;
  }
}

async function loadData() {
  try {
    const response = await fetch("/api/portfolio", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Data load failed");
    }

    portfolio = await response.json();

    normalizeData();
    renderAll();

  } catch (error) {
    console.error(error);
    showMessage("তথ্য লোড করা যায়নি", "error");
  }
}


/* =========================================================
   DATA NORMALIZE
========================================================= */

function normalizeData() {

  portfolio.site = portfolio.site || {
    name: "প্রসেনজিৎ রায়",
    title: "",
    description: "",
    show: true
  };

  portfolio.sections = portfolio.sections || {};

  portfolio.buttons = portfolio.buttons || {};

  portfolio.about = portfolio.about || {
    title: "আমার সম্পর্কে",
    text: "",
    show: true
  };

  portfolio.education = Array.isArray(portfolio.education)
    ? portfolio.education
    : [];

  portfolio.skills = Array.isArray(portfolio.skills)
    ? portfolio.skills
    : [];

  portfolio.diary = Array.isArray(portfolio.diary)
    ? portfolio.diary
    : [];

  portfolio.hobbies = Array.isArray(portfolio.hobbies)
    ? portfolio.hobbies
    : [];

  portfolio.projects = Array.isArray(portfolio.projects)
    ? portfolio.projects
    : [];

  portfolio.vision = portfolio.vision || {
    title: "আমার ভবিষ্যৎ ভাবনা",
    text: "",
    show: true
  };

  portfolio.contact = portfolio.contact || {
    email: "",
    facebook: "",
    instagram: "",
    github: "",
    show: true
  };

  /* Default sections */

  const sectionNames = [
    "about",
    "education",
    "skills",
    "diary",
    "hobbies",
    "projects",
    "vision",
    "contact"
  ];

  sectionNames.forEach(key => {
    if (portfolio.sections[key] === undefined) {
      portfolio.sections[key] = true;
    }
  });
}


/* =========================================================
   NAVIGATION
========================================================= */

function showPanel(name) {

  document.querySelectorAll(".panel").forEach(panel => {
    panel.classList.remove("active");
  });

  const target = document.getElementById(`panel-${name}`);

  if (!target) return;

  target.classList.add("active");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

  normalizeData();

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


/* =========================================================
   SITE
========================================================= */

function renderSite() {

  setValue("siteName", portfolio.site.name);
  setValue("siteTitle", portfolio.site.title);
  setValue("siteDescription", portfolio.site.description);

  setChecked(
    "siteShow",
    portfolio.site.show !== false
  );
}

async function saveSite() {

  portfolio.site.name =
    getValue("siteName");

  portfolio.site.title =
    getValue("siteTitle");

  portfolio.site.description =
    getValue("siteDescription");

  portfolio.site.show =
    getChecked("siteShow");

  await apiSave("সাইট তথ্য সংরক্ষণ হয়েছে");
}


/* =========================================================
   SECTION MANAGER
========================================================= */

function renderSections() {

  const box = document.getElementById("sectionManager");

  if (!box) return;

  const sections = {
    about: "আমার সম্পর্কে",
    education: "শিক্ষাজীবন",
    skills: "দক্ষতা",
    diary: "দিনলিপি",
    hobbies: "শখ",
    projects: "প্রজেক্ট",
    vision: "ভবিষ্যৎ ভাবনা",
    contact: "যোগাযোগ"
  };

  box.innerHTML = "";

  Object.entries(sections).forEach(([key, name]) => {

    const enabled =
      portfolio.sections[key] !== false;

    const row = document.createElement("div");

    row.className = "section-row";

    row.innerHTML = `
      <strong>${escapeHTML(name)}</strong>

      <label class="switch">
        <input
          type="checkbox"
          ${enabled ? "checked" : ""}
          data-section="${escapeHTML(key)}"
        >

        <span>
          ${enabled ? "ON" : "OFF"}
        </span>
      </label>
    `;

    const checkbox = row.querySelector("input");

    checkbox.addEventListener("change", async function () {

      portfolio.sections[key] = this.checked;

      this.nextElementSibling.textContent =
        this.checked ? "ON" : "OFF";

      await apiSave("Section আপডেট হয়েছে");
    });

    box.appendChild(row);
  });
}


/* =========================================================
   BUTTON MANAGER
========================================================= */

function renderButtons() {

  const box = document.getElementById("buttonManager");

  if (!box) return;

  box.innerHTML = "";

  const entries = Object.entries(portfolio.buttons);

  if (!entries.length) {

    box.innerHTML = `
      <div class="manager-card">
        <p>কোনো Button নেই।</p>

        <button
          class="primary"
          onclick="addButton()"
        >
          + Button Add করুন
        </button>
      </div>
    `;

    return;
  }

  entries.forEach(([key, button]) => {

    const card = document.createElement("div");

    card.className = "manager-card";

    card.innerHTML = `
      <label>Button নাম</label>

      <input
        value="${escapeHTML(key)}"
        disabled
      >

      <label>Button Text</label>

      <input
        value="${escapeHTML(button.text || "")}"
        data-field="text"
      >

      <label>Button URL</label>

      <input
        value="${escapeHTML(button.url || "")}"
        data-field="url"
      >

      <label class="switch">
        <input
          type="checkbox"
          data-field="show"
          ${button.show !== false ? "checked" : ""}
        >

        <span>
          ${button.show !== false ? "দেখাবে" : "লুকানো"}
        </span>
      </label>

      <div class="manager-actions">

        <button
          class="primary"
          data-action="save"
        >
          Save
        </button>

        <button
          class="danger"
          data-action="delete"
        >
          Delete
        </button>

      </div>
    `;

    card
      .querySelector('[data-action="save"]')
      .addEventListener("click", async () => {

        portfolio.buttons[key].text =
          card.querySelector('[data-field="text"]').value;

        portfolio.buttons[key].url =
          card.querySelector('[data-field="url"]').value;

        portfolio.buttons[key].show =
          card.querySelector('[data-field="show"]').checked;

        await apiSave("Button সংরক্ষণ হয়েছে");
      });

    card
      .querySelector('[data-field="show"]')
      .addEventListener("change", function () {

        this.nextElementSibling.textContent =
          this.checked ? "দেখাবে" : "লুকানো";
      });

    card
      .querySelector('[data-action="delete"]')
      .addEventListener("click", async () => {

        if (!confirm("এই Button মুছে ফেলবেন?")) {
          return;
        }

        delete portfolio.buttons[key];

        await apiSave("Button মুছে ফেলা হয়েছে");
      });

    box.appendChild(card);
  });

  const addBox = document.createElement("div");

  addBox.innerHTML = `
    <button
      class="primary"
      onclick="addButton()"
    >
      + নতুন Button
    </button>
  `;

  box.appendChild(addBox);
}

function addButton() {

  let key = "button";

  let number = 1;

  while (portfolio.buttons[key]) {
    key = `button${number++}`;
  }

  portfolio.buttons[key] = {
    text: "নতুন Button",
    url: "#",
    show: true
  };

  renderButtons();

  showMessage("নতুন Button তৈরি হয়েছে। এখন Edit করে Save করুন");
}


/* =========================================================
   ABOUT
========================================================= */

function renderAbout() {

  setValue("aboutTitle", portfolio.about.title);
  setValue("aboutText", portfolio.about.text);

  setChecked(
    "aboutShow",
    portfolio.about.show !== false
  );
}

async function saveAbout() {

  portfolio.about.title =
    getValue("aboutTitle");

  portfolio.about.text =
    getValue("aboutText");

  portfolio.about.show =
    getChecked("aboutShow");

  await apiSave("About সংরক্ষণ হয়েছে");
}


/* =========================================================
   EDUCATION
========================================================= */

function renderEducation() {

  const box =
    document.getElementById("educationManager");

  if (!box) return;

  box.innerHTML = "";

  if (!portfolio.education.length) {

    box.innerHTML = `
      <div class="manager-card">
        <p>কোনো শিক্ষা তথ্য নেই।</p>
      </div>
    `;

    return;
  }

  portfolio.education.forEach((item, index) => {

    const card = document.createElement("div");

    card.className = "manager-card";

    card.innerHTML = `
      <label>শিরোনাম</label>

      <input
        data-field="title"
        value="${escapeHTML(item.title || "")}"
      >

      <label>প্রতিষ্ঠান</label>

      <input
        data-field="place"
        value="${escapeHTML(item.place || "")}"
      >

      <label>সময়কাল</label>

      <input
        data-field="year"
        value="${escapeHTML(item.year || "")}"
      >

      <label>বিবরণ</label>

      <textarea data-field="description">${escapeHTML(
        item.description || ""
      )}</textarea>

      <label class="switch">

        <input
          type="checkbox"
          data-field="show"
          ${item.show !== false ? "checked" : ""}
        >

        <span>
          ${item.show !== false ? "দেখাবে" : "লুকানো"}
        </span>

      </label>

      <div class="manager-actions">

        <button
          class="primary"
          data-action="save"
        >
          Save
        </button>

        <button
          class="danger"
          data-action="delete"
        >
          Delete
        </button>

      </div>
    `;

    bindItemShowLabel(card);

    card
      .querySelector('[data-action="save"]')
      .addEventListener("click", async () => {

        portfolio.education[index] =
          readEducationCard(card, item);

        await apiSave("Education সংরক্ষণ হয়েছে");
      });

    card
      .querySelector('[data-action="delete"]')
      .addEventListener("click", async () => {

        if (!confirm("এই শিক্ষা তথ্য মুছে ফেলবেন?")) {
          return;
        }

        portfolio.education.splice(index, 1);

        await apiSave("Education মুছে ফেলা হয়েছে");
      });

    box.appendChild(card);
  });
}

function readEducationCard(card, oldItem) {

  return {
    ...oldItem,

    id: oldItem.id || Date.now(),

    title:
      card.querySelector('[data-field="title"]').value,

    place:
      card.querySelector('[data-field="place"]').value,

    year:
      card.querySelector('[data-field="year"]').value,

    description:
      card.querySelector('[data-field="description"]').value,

    show:
      card.querySelector('[data-field="show"]').checked
  };
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

  showMessage("নতুন Education তৈরি হয়েছে।");
}


/* =========================================================
   SKILLS
========================================================= */

function renderSkills() {

  const box =
    document.getElementById("skillsManager");

  if (!box) return;

  box.innerHTML = "";

  if (!portfolio.skills.length) {

    box.innerHTML = `
      <div class="manager-card">
        <p>কোনো Skill নেই।</p>
      </div>
    `;

    return;
  }

  portfolio.skills.forEach((item, index) => {

    const card = document.createElement("div");

    card.className = "manager-card";

    card.innerHTML = `
      <label>দক্ষতার নাম</label>

      <input
        data-field="name"
        value="${escapeHTML(item.name || "")}"
      >

      <label>দক্ষতার শতাংশ</label>

      <input
        type="number"
        min="0"
        max="100"
        data-field="level"
        value="${Number(item.level) || 0}"
      >

      <label class="switch">

        <input
          type="checkbox"
          data-field="show"
          ${item.show !== false ? "checked" : ""}
        >

        <span>
          ${item.show !== false ? "দেখাবে" : "লুকানো"}
        </span>

      </label>

      <div class="manager-actions">

        <button
          class="primary"
          data-action="save"
        >
          Save
        </button>

        <button
          class="danger"
          data-action="delete"
        >
          Delete
        </button>

      </div>
    `;

    bindItemShowLabel(card);

    card
      .querySelector('[data-action="save"]')
      .addEventListener("click", async () => {

        portfolio.skills[index] = {
          ...item,

          name:
            card.querySelector('[data-field="name"]').value,

          level:
            clamp(
              Number(
                card.querySelector('[data-field="level"]').value
              ),
              0,
              100
            ),

          show:
            card.querySelector('[data-field="show"]').checked
        };

        await apiSave("Skill সংরক্ষণ হয়েছে");
      });

    card
      .querySelector('[data-action="delete"]')
      .addEventListener("click", async () => {

        if (!confirm("এই Skill মুছে ফেলবেন?")) {
          return;
        }

        portfolio.skills.splice(index, 1);

        await apiSave("Skill মুছে ফেলা হয়েছে");
      });

    box.appendChild(card);
  });
}

function addSkill() {

  portfolio.skills.push({
    id: Date.now(),
    name: "নতুন Skill",
    level: 50,
    show: true
  });

  renderSkills();

  showMessage("নতুন Skill তৈরি হয়েছে।");
}


/* =========================================================
   DIARY
========================================================= */

function renderDiary() {

  const box =
    document.getElementById("diaryManager");

  if (!box) return;

  box.innerHTML = "";

  if (!portfolio.diary.length) {

    box.innerHTML = `
      <div class="manager-card">
        <p>কোনো Diary নেই।</p>
      </div>
    `;

    return;
  }

  portfolio.diary.forEach((item, index) => {

    const card = document.createElement("div");

    card.className = "manager-card";

    card.innerHTML = `
      <label>শিরোনাম</label>

      <input
        data-field="title"
        value="${escapeHTML(item.title || "")}"
      >

      <label>তারিখ</label>

      <input
        data-field="date"
        value="${escapeHTML(item.date || "")}"
      >

      <label>দিনলিপি</label>

      <textarea data-field="text">${escapeHTML(
        item.text || ""
      )}</textarea>

      <label class="switch">

        <input
          type="checkbox"
          data-field="show"
          ${item.show !== false ? "checked" : ""}
        >

        <span>
          ${item.show !== false ? "দেখাবে" : "লুকানো"}
        </span>

      </label>

      <div class="manager-actions">

        <button
          class="primary"
          data-action="save"
        >
          Save
        </button>

        <button
          class="danger"
          data-action="delete"
        >
          Delete
        </button>

      </div>
    `;

    bindItemShowLabel(card);

    card
      .querySelector('[data-action="save"]')
      .addEventListener("click", async () => {

        portfolio.diary[index] = {
          ...item,

          title:
            card.querySelector('[data-field="title"]').value,

          date:
            card.querySelector('[data-field="date"]').value,

          text:
            card.querySelector('[data-field="text"]').value,

          show:
            card.querySelector('[data-field="show"]').checked
        };

        await apiSave("Diary সংরক্ষণ হয়েছে");
      });

    card
      .querySelector('[data-action="delete"]')
      .addEventListener("click", async () => {

        if (!confirm("এই Diary মুছে ফেলবেন?")) {
          return;
        }

        portfolio.diary.splice(index, 1);

        await apiSave("Diary মুছে ফেলা হয়েছে");
      });

    box.appendChild(card);
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

  showMessage("নতুন Diary তৈরি হয়েছে।");
}


/* =========================================================
   HOBBIES
========================================================= */

function renderHobbies() {

  const box =
    document.getElementById("hobbiesManager");

  if (!box) return;

  box.innerHTML = "";

  if (!portfolio.hobbies.length) {

    box.innerHTML = `
      <div class="manager-card">
        <p>কোনো Hobby নেই।</p>
      </div>
    `;

    return;
  }

  portfolio.hobbies.forEach((item, index) => {

    const card = document.createElement("div");

    card.className = "manager-card";

    card.innerHTML = `
      <label>শখের নাম</label>

      <input
        data-field="name"
        value="${escapeHTML(item.name || "")}"
      >

      <label>Icon</label>

      <input
        data-field="icon"
        value="${escapeHTML(item.icon || "")}"
      >

      <label class="switch">

        <input
          type="checkbox"
          data-field="show"
          ${item.show !== false ? "checked" : ""}
        >

        <span>
          ${item.show !== false ? "দেখাবে" : "লুকানো"}
        </span>

      </label>

      <div class="manager-actions">

        <button
          class="primary"
          data-action="save"
        >
          Save
        </button>

        <button
          class="danger"
          data-action="delete"
        >
          Delete
        </button>

      </div>
    `;

    bindItemShowLabel(card);

    card
      .querySelector('[data-action="save"]')
      .addEventListener("click", async () => {

        portfolio.hobbies[index] = {
          ...item,

          name:
            card.querySelector('[data-field="name"]').value,

          icon:
            card.querySelector('[data-field="icon"]').value,

          show:
            card.querySelector('[data-field="show"]').checked
        };

        await apiSave("Hobby সংরক্ষণ হয়েছে");
      });

    card
      .querySelector('[data-action="delete"]')
      .addEventListener("click", async () => {

        if (!confirm("এই Hobby মুছে ফেলবেন?")) {
          return;
        }

        portfolio.hobbies.splice(index, 1);

        await apiSave("Hobby মুছে ফেলা হয়েছে");
      });

    box.appendChild(card);
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

  showMessage("নতুন Hobby তৈরি হয়েছে।");
}


/* =========================================================
   PROJECTS
========================================================= */

function renderProjects() {

  const box =
    document.getElementById("projectsManager");

  if (!box) return;

  box.innerHTML = "";

  if (!portfolio.projects.length) {

    box.innerHTML = `
      <div class="manager-card">
        <p>কোনো Project নেই।</p>
      </div>
    `;

    return;
  }

  portfolio.projects.forEach((item, index) => {

    const card = document.createElement("div");

    card.className = "manager-card";

    card.innerHTML = `
      <label>Project Name</label>

      <input
        data-field="title"
        value="${escapeHTML(item.title || "")}"
      >

      <label>Description</label>

      <textarea data-field="description">${escapeHTML(
        item.description || ""
      )}</textarea>

      <label>Project URL</label>

      <input
        data-field="url"
        value="${escapeHTML(item.url || "")}"
      >

      <label class="switch">

        <input
          type="checkbox"
          data-field="show"
          ${item.show !== false ? "checked" : ""}
        >

        <span>
          ${item.show !== false ? "দেখাবে" : "লুকানো"}
        </span>

      </label>

      <div class="manager-actions">

        <button
          class="primary"
          data-action="save"
        >
          Save
        </button>

        <button
          class="danger"
          data-action="delete"
        >
          Delete
        </button>

      </div>
    `;

    bindItemShowLabel(card);

    card
      .querySelector('[data-action="save"]')
      .addEventListener("click", async () => {

        portfolio.projects[index] = {
          ...item,

          title:
            card.querySelector('[data-field="title"]').value,

          description:
            card.querySelector('[data-field="description"]').value,

          url:
            card.querySelector('[data-field="url"]').value,

          show:
            card.querySelector('[data-field="show"]').checked
        };

        await apiSave("Project সংরক্ষণ হয়েছে");
      });

    card
      .querySelector('[data-action="delete"]')
      .addEventListener("click", async () => {

        if (!confirm("এই Project মুছে ফেলবেন?")) {
          return;
        }

        portfolio.projects.splice(index, 1);

        await apiSave("Project মুছে ফেলা হয়েছে");
      });

    box.appendChild(card);
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

  showMessage("নতুন Project তৈরি হয়েছে।");
}


/* =========================================================
   VISION
========================================================= */

function renderVision() {

  setValue(
    "visionTitle",
    portfolio.vision.title
  );

  setValue(
    "visionText",
    portfolio.vision.text
  );

  setChecked(
    "visionShow",
    portfolio.vision.show !== false
  );
}

async function saveVision() {

  portfolio.vision.title =
    getValue("visionTitle");

  portfolio.vision.text =
    getValue("visionText");

  portfolio.vision.show =
    getChecked("visionShow");

  await apiSave("Vision সংরক্ষণ হয়েছে");
}


/* =========================================================
   CONTACT
========================================================= */

function renderContact() {

  setValue(
    "contactEmail",
    portfolio.contact.email
  );

  setValue(
    "contactFacebook",
    portfolio.contact.facebook
  );

  setValue(
    "contactInstagram",
    portfolio.contact.instagram
  );

  setValue(
    "contactGithub",
    portfolio.contact.github
  );

  setChecked(
    "contactShow",
    portfolio.contact.show !== false
  );
}

async function saveContact() {

  portfolio.contact.email =
    getValue("contactEmail");

  portfolio.contact.facebook =
    getValue("contactFacebook");

  portfolio.contact.instagram =
    getValue("contactInstagram");

  portfolio.contact.github =
    getValue("contactGithub");

  portfolio.contact.show =
    getChecked("contactShow");

  await apiSave("Contact সংরক্ষণ হয়েছে");
}


/* =========================================================
   SAVE EVERYTHING
========================================================= */

async function saveAll() {

  /* Site */

  portfolio.site.name =
    getValue("siteName");

  portfolio.site.title =
    getValue("siteTitle");

  portfolio.site.description =
    getValue("siteDescription");

  portfolio.site.show =
    getChecked("siteShow");


  /* About */

  portfolio.about.title =
    getValue("aboutTitle");

  portfolio.about.text =
    getValue("aboutText");

  portfolio.about.show =
    getChecked("aboutShow");


  /* Vision */

  portfolio.vision.title =
    getValue("visionTitle");

  portfolio.vision.text =
    getValue("visionText");

  portfolio.vision.show =
    getChecked("visionShow");


  /* Contact */

  portfolio.contact.email =
    getValue("contactEmail");

  portfolio.contact.facebook =
    getValue("contactFacebook");

  portfolio.contact.instagram =
    getValue("contactInstagram");

  portfolio.contact.github =
    getValue("contactGithub");

  portfolio.contact.show =
    getChecked("contactShow");


  await apiSave("সব তথ্য সফলভাবে সংরক্ষণ হয়েছে");
}


/* =========================================================
   DASHBOARD
========================================================= */

function updateStats() {

  setText(
    "statEducation",
    portfolio.education.length
  );

  setText(
    "statSkills",
    portfolio.skills.length
  );

  setText(
    "statDiary",
    portfolio.diary.length
  );

  setText(
    "statProjects",
    portfolio.projects.length
  );
}


/* =========================================================
   SHOW/HIDE HELPER
========================================================= */

function bindItemShowLabel(card) {

  const checkbox =
    card.querySelector('[data-field="show"]');

  if (!checkbox) return;

  checkbox.addEventListener("change", function () {

    const label =
      this.nextElementSibling;

    if (label) {
      label.textContent =
        this.checked
          ? "দেখাবে"
          : "লুকানো";
    }
  });
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(text, type = "success") {

  const box =
    document.getElementById("message");

  if (!box) return;

  const toast =
    document.createElement("div");

  toast.className =
    `toast ${type}`;

  toast.textContent = text;

  box.appendChild(toast);

  setTimeout(() => {

    toast.style.opacity = "0";

    setTimeout(() => {
      toast.remove();
    }, 300);

  }, 2200);
}


/* =========================================================
   HELPERS
========================================================= */

function getValue(id) {

  const element =
    document.getElementById(id);

  return element
    ? element.value
    : "";
}

function setValue(id, value) {

  const element =
    document.getElementById(id);

  if (element) {
    element.value = value ?? "";
  }
}

function getChecked(id) {

  const element =
    document.getElementById(id);

  return element
    ? element.checked
    : false;
}

function setChecked(id, value) {

  const element =
    document.getElementById(id);

  if (element) {
    element.checked = Boolean(value);
  }
}

function setText(id, value) {

  const element =
    document.getElementById(id);

  if (element) {
    element.textContent = value ?? "";
  }
}

function clamp(value, min, max) {

  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(
    Math.max(value, min),
    max
  );
}

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   START
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  loadData();

});
