/* =========================================================
   PROSENJIT RAY — ADMIN PANEL
========================================================= */

let diaryData = [];
let projectData = [];
let buttonData = [];


/* =========================================================
   ELEMENTS
========================================================= */

const loginSection =
  document.getElementById("loginSection");

const adminApp =
  document.getElementById("adminApp");

const loginBtn =
  document.getElementById("loginBtn");

const logoutBtn =
  document.getElementById("logoutBtn");


/* =========================================================
   LOGIN
========================================================= */

loginBtn.addEventListener("click", async () => {

  const username =
    document.getElementById("username").value.trim();

  const password =
    document.getElementById("password").value;

  const message =
    document.getElementById("loginMessage");

  if(!username || !password){

    message.textContent =
      "ইউজারনেম ও পাসওয়ার্ড দিন।";

    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "লগইন হচ্ছে...";

  try{

    const response = await fetch(
      "/api/admin/login",
      {
        method:"POST",

        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify({
          username,
          password
        })
      }
    );

    const data = await response.json();

    if(!response.ok){

      message.textContent =
        data.error || "লগইন ব্যর্থ হয়েছে।";

      return;
    }

    showAdmin();

  }catch(error){

    message.textContent =
      "সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।";

  }finally{

    loginBtn.disabled = false;
    loginBtn.textContent = "লগইন করুন";

  }

});


/* ENTER KEY LOGIN */

document
  .getElementById("password")
  .addEventListener("keydown", e => {

    if(e.key === "Enter"){
      loginBtn.click();
    }

  });


/* =========================================================
   SHOW ADMIN
========================================================= */

async function showAdmin(){

  loginSection.style.display = "none";

  adminApp.style.display = "block";

  await Promise.all([
    loadContent(),
    loadButtons(),
    loadDiary(),
    loadProjects()
  ]);

}


/* =========================================================
   CHECK LOGIN
========================================================= */

async function checkLogin(){

  try{

    const response =
      await fetch("/api/admin/content");

    if(response.ok){

      showAdmin();

    }

  }catch(error){

    console.log(error);

  }

}

checkLogin();


/* =========================================================
   LOGOUT
========================================================= */

logoutBtn.addEventListener("click", async () => {

  try{

    await fetch(
      "/api/admin/logout",
      {
        method:"POST"
      }
    );

  }catch(error){}

  location.reload();

});


/* =========================================================
   SITE CONTENT
========================================================= */

async function loadContent(){

  try{

    const response =
      await fetch("/api/admin/content");

    if(!response.ok) return;

    const data =
      await response.json();

    setValue("content_name", data.name);
    setValue("content_tagline", data.tagline);
    setValue("content_college", data.college);
    setValue("content_education", data.education);
    setValue("content_photo", data.photo);
    setValue("content_about", data.about);
    setValue(
      "content_skills",
      Array.isArray(data.skills)
        ? data.skills.join(", ")
        : data.skills
    );

  }catch(error){

    console.log("Content load error:",error);

  }

}


function setValue(id,value){

  const el =
    document.getElementById(id);

  if(el){

    el.value =
      value ?? "";

  }

}


/* =========================================================
   SAVE CONTENT
========================================================= */

async function saveContent(){

  const data = {

    name:
      getValue("content_name"),

    tagline:
      getValue("content_tagline"),

    college:
      getValue("content_college"),

    education:
      getValue("content_education"),

    photo:
      getValue("content_photo"),

    about:
      getValue("content_about"),

    skills:
      getValue("content_skills")
        .split(",")
        .map(x => x.trim())
        .filter(Boolean)

  };

  try{

    const response =
      await fetch(
        "/api/admin/content",
        {
          method:"PUT",

          headers:{
            "Content-Type":"application/json"
          },

          body:JSON.stringify(data)
        }
      );

    const result =
      await response.json();

    const message =
      document.getElementById(
        "contentMessage"
      );

    if(!response.ok){

      message.textContent =
        result.error ||
        "তথ্য সংরক্ষণ করা যায়নি।";

      return;
    }

    message.textContent =
      "✓ তথ্য সফলভাবে সংরক্ষণ হয়েছে।";

  }catch(error){

    document.getElementById(
      "contentMessage"
    ).textContent =
      "সার্ভার সমস্যা হয়েছে।";

  }

}


function getValue(id){

  const el =
    document.getElementById(id);

  return el
    ? el.value.trim()
    : "";

}


/* =========================================================
   BUTTONS
========================================================= */

async function loadButtons(){

  try{

    const response =
      await fetch("/api/admin/content");

    if(!response.ok) return;

    const data =
      await response.json();

    buttonData =
      data.buttons || [];

    renderButtons();

  }catch(error){

    console.log(error);

  }

}


function renderButtons(){

  const container =
    document.getElementById("buttonsList");

  if(!buttonData.length){

    container.innerHTML =
      `<div class="empty">
        এখন কোনো বাটন নেই।
      </div>`;

    return;
  }

  container.innerHTML =
    buttonData.map((item,index) => `

      <div class="item">

        <div class="item-info">

          <h3>${escapeHtml(item.label || "বাটন")}</h3>

          <p>${escapeHtml(item.link || "")}</p>

        </div>

        <div class="item-actions">

          <button
            class="action"
            onclick="editButton(${index})"
          >
            ✏️
          </button>

          <button
            class="action delete"
            onclick="deleteButton(${index})"
          >
            🗑
          </button>

        </div>

      </div>

    `).join("");

}


async function addButton(){

  const label =
    document
      .getElementById("newButtonLabel")
      .value.trim();

  const link =
    document
      .getElementById("newButtonLink")
      .value.trim();

  if(!label){

    alert("বাটনের নাম দিন।");
    return;

  }

  const updated =
    [...buttonData,{
      label,
      link
    }];

  await updateButtons(updated);

}


async function editButton(index){

  const item =
    buttonData[index];

  const label =
    prompt(
      "বাটনের নাম:",
      item.label || ""
    );

  if(label === null) return;

  const link =
    prompt(
      "বাটনের লিংক:",
      item.link || ""
    );

  if(link === null) return;

  buttonData[index] = {
    ...item,
    label,
    link
  };

  await updateButtons(buttonData);

}


async function deleteButton(index){

  if(!confirm(
    "এই বাটনটি মুছে ফেলতে চান?"
  )) return;

  buttonData.splice(index,1);

  await updateButtons(buttonData);

}


async function updateButtons(buttons){

  try{

    const response =
      await fetch(
        "/api/admin/content",
        {
          method:"PUT",

          headers:{
            "Content-Type":"application/json"
          },

          body:JSON.stringify({
            buttons
          })
        }
      );

    if(!response.ok){

      alert("বাটন পরিবর্তন করা যায়নি।");
      return;

    }

    buttonData = buttons;

    renderButtons();

    document.getElementById(
      "newButtonLabel"
    ).value = "";

    document.getElementById(
      "newButtonLink"
    ).value = "";

  }catch(error){

    alert("সার্ভার সমস্যা হয়েছে।");

  }

}


/* =========================================================
   DIARY
========================================================= */

async function loadDiary(){

  try{

    const response =
      await fetch("/api/admin/diary");

    if(!response.ok) return;

    diaryData =
      await response.json();

    renderDiary();

  }catch(error){

    console.log(error);

  }

}


function renderDiary(){

  const container =
    document.getElementById("diaryList");

  if(!diaryData.length){

    container.innerHTML =
      `<div>এখন কোনো অধ্যায় নেই।</div>`;

    return;

  }

  container.innerHTML =
    diaryData.map((item,index) => `

      <div class="item">

        <div class="item-info">

          <h3>
            ${escapeHtml(item.title || "")}
          </h3>

          <p>
            ${escapeHtml(
              item.short ||
              item.description ||
              item.text ||
              ""
            )}
          </p>

        </div>

        <div class="item-actions">

          <button
            class="action"
            onclick="editDiary(${index})"
          >
            ✏️
          </button>

          <button
            class="action delete"
            onclick="deleteDiary(${item.id})"
          >
            🗑
          </button>

        </div>

      </div>

    `).join("");

}


async function addDiary(){

  const title =
    document
      .getElementById("newDiaryTitle")
      .value.trim();

  const text =
    document
      .getElementById("newDiaryText")
      .value.trim();

  const short =
    document
      .getElementById("newDiaryShort")
      .value.trim();

  if(!title || !text){

    alert("অধ্যায়ের নাম ও বিস্তারিত লেখা দিন।");
    return;

  }

  try{

    const response =
      await fetch(
        "/api/admin/diary",
        {
          method:"POST",

          headers:{
            "Content-Type":"application/json"
          },

          body:JSON.stringify({
            title,
            text,
            short
          })
        }
      );

    if(!response.ok){

      alert("অধ্যায় যোগ করা যায়নি।");
      return;

    }

    document.getElementById(
      "newDiaryTitle"
    ).value = "";

    document.getElementById(
      "newDiaryText"
    ).value = "";

    document.getElementById(
      "newDiaryShort"
    ).value = "";

    await loadDiary();

  }catch(error){

    alert("সার্ভার সমস্যা হয়েছে।");

  }

}


async function editDiary(index){

  const item =
    diaryData[index];

  const title =
    prompt(
      "অধ্যায়ের নাম:",
      item.title || ""
    );

  if(title === null) return;

  const text =
    prompt(
      "অধ্যায়ের বিস্তারিত:",
      item.text ||
      item.description ||
      ""
    );

  if(text === null) return;

  const short =
    prompt(
      "ছোট বিবরণ:",
      item.short ||
      ""
    );

  if(short === null) return;

  try{

    const response =
      await fetch(
        `/api/admin/diary/${item.id}`,
        {
          method:"PUT",

          headers:{
            "Content-Type":"application/json"
          },

          body:JSON.stringify({
            title,
            text,
            short
          })
        }
      );

    if(!response.ok){

      alert("অধ্যায় পরিবর্তন করা যায়নি।");
      return;

    }

    await loadDiary();

  }catch(error){

    alert("সার্ভার সমস্যা হয়েছে।");

  }

}


async function deleteDiary(id){

  if(!confirm(
    "এই অধ্যায়টি মুছে ফেলতে চান?"
  )) return;

  try{

    const response =
      await fetch(
        `/api/admin/diary/${id}`,
        {
          method:"DELETE"
        }
      );

    if(!response.ok){

      alert("মুছে ফেলা যায়নি.");
      return;

    }

    await loadDiary();

  }catch(error){

    alert("সার্ভার সমস্যা হয়েছে।");

  }

}


/* =========================================================
   PROJECTS
========================================================= */

async function loadProjects(){

  try{

    const response =
      await fetch("/api/admin/projects");

    if(!response.ok) return;

    projectData =
      await response.json();

    renderProjects();

  }catch(error){

    console.log(error);

  }

}


function renderProjects(){

  const container =
    document.getElementById("projectsList");

  if(!projectData.length){

    container.innerHTML =
      `<div>এখন কোনো প্রকল্প নেই।</div>`;

    return;

  }

  container.innerHTML =
    projectData.map((item,index) => `

      <div class="item">

        <div class="item-info">

          <h3>
            ${escapeHtml(
              item.name ||
              item.title ||
              ""
            )}
          </h3>

          <p>
            ${escapeHtml(
              item.description ||
              item.text ||
              ""
            )}
          </p>

        </div>

        <div class="item-actions">

          <button
            class="action"
            onclick="editProject(${index})"
          >
            ✏️
          </button>

          <button
            class="action delete"
            onclick="deleteProject(${item.id})"
          >
            🗑
          </button>

        </div>

      </div>

    `).join("");

}


async function addProject(){

  const name =
    document
      .getElementById("newProjectName")
      .value.trim();

  const type =
    document
      .getElementById("newProjectType")
      .value.trim();

  const description =
    document
      .getElementById("newProjectDescription")
      .value.trim();

  const link =
    document
      .getElementById("newProjectLink")
      .value.trim();

  if(!name){

    alert("প্রকল্পের নাম দিন।");
    return;

  }

  try{

    const response =
      await fetch(
        "/api/admin/projects",
        {
          method:"POST",

          headers:{
            "Content-Type":"application/json"
          },

          body:JSON.stringify({
            name,
            type,
            description,
            link
          })
        }
      );

    if(!response.ok){

      alert("প্রকল্প যোগ করা যায়নি।");
      return;

    }

    document.getElementById(
      "newProjectName"
    ).value = "";

    document.getElementById(
      "newProjectType"
    ).value = "";

    document.getElementById(
      "newProjectDescription"
    ).value = "";

    document.getElementById(
      "newProjectLink"
    ).value = "";

    await loadProjects();

  }catch(error){

    alert("সার্ভার সমস্যা হয়েছে।");

  }

}


async function editProject(index){

  const item =
    projectData[index];

  const name =
    prompt(
      "প্রকল্পের নাম:",
      item.name ||
      item.title ||
      ""
    );

  if(name === null) return;

  const type =
    prompt(
      "ধরন:",
      item.type || ""
    );

  if(type === null) return;

  const description =
    prompt(
      "প্রকল্পের বিবরণ:",
      item.description ||
      item.text ||
      ""
    );

  if(description === null) return;

  const link =
    prompt(
      "লিংক:",
      item.link || ""
    );

  if(link === null) return;

  try{

    const response =
      await fetch(
        `/api/admin/projects/${item.id}`,
        {
          method:"PUT",

          headers:{
            "Content-Type":"application/json"
          },

          body:JSON.stringify({
            name,
            type,
            description,
            link
          })
        }
      );

    if(!response.ok){

      alert("প্রকল্প পরিবর্তন করা যায়নি।");
      return;

    }

    await loadProjects();

  }catch(error){

    alert("সার্ভার সমস্যা হয়েছে।");

  }

}


async function deleteProject(id){

  if(!confirm(
    "এই প্রকল্পটি মুছে ফেলতে চান?"
  )) return;

  try{

    const response =
      await fetch(
        `/api/admin/projects/${id}`,
        {
          method:"DELETE"
        }
      );

    if(!response.ok){

      alert("মুছে ফেলা যায়নি।");
      return;

    }

    await loadProjects();

  }catch(error){

    alert("সার্ভার সমস্যা হয়েছে।");

  }

}


/* =========================================================
   SECURITY / HTML ESCAPE
========================================================= */

function escapeHtml(value){

  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");

}
