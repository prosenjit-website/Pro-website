// ==========================================
// PROSENJIT ADMIN PANEL
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

  const loginForm = document.getElementById("loginForm");
  const loginBox = document.getElementById("loginBox");
  const adminPanel = document.getElementById("adminPanel");

  // ========================================
  // CHECK LOGIN
  // ========================================

  checkSession();


  async function checkSession() {

    try {

      const res = await fetch("/api/admin/session", {
        credentials: "same-origin"
      });

      const data = await res.json();

      if (data.loggedIn) {
        showAdmin();
      } else {
        showLogin();
      }

    } catch (error) {

      console.error(error);
      showLogin();

    }

  }


  // ========================================
  // SHOW LOGIN
  // ========================================

  function showLogin() {

    if (loginBox) {
      loginBox.style.display = "block";
    }

    if (adminPanel) {
      adminPanel.style.display = "none";
    }

  }


  // ========================================
  // SHOW ADMIN
  // ========================================

  function showAdmin() {

    if (loginBox) {
      loginBox.style.display = "none";
    }

    if (adminPanel) {
      adminPanel.style.display = "block";
    }

    loadAll();

  }


  // ========================================
  // LOGIN
  // ========================================

  if (loginForm) {

    loginForm.addEventListener("submit", async function (e) {

      // VERY IMPORTANT
      e.preventDefault();

      const usernameInput =
        document.getElementById("username");

      const passwordInput =
        document.getElementById("password");

      const username =
        usernameInput ? usernameInput.value.trim() : "";

      const password =
        passwordInput ? passwordInput.value : "";


      if (!username || !password) {

        alert("Username এবং Password দিন।");

        return;

      }


      try {

        const response = await fetch(
          "/api/admin/login",
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json"
            },

            credentials: "same-origin",

            body: JSON.stringify({
              username: username,
              password: password
            })
          }
        );


        const data =
          await response.json();


        if (!response.ok || !data.success) {

          alert(
            data.error ||
            "Login failed"
          );

          return;

        }


        // Login successful
        showAdmin();


      } catch (error) {

        console.error(error);

        alert(
          "Server-এর সাথে যোগাযোগ করা যাচ্ছে না।"
        );

      }

    });

  }


  // ========================================
  // LOGOUT
  // ========================================

  const logoutBtn =
    document.getElementById("logoutBtn");


  if (logoutBtn) {

    logoutBtn.addEventListener(
      "click",
      async function () {

        try {

          await fetch(
            "/api/admin/logout",
            {
              method: "POST",
              credentials: "same-origin"
            }
          );

        } catch (error) {

          console.error(error);

        }

        location.reload();

      }
    );

  }


  // ========================================
  // LOAD EVERYTHING
  // ========================================

  async function loadAll() {

    await loadSite();

    await loadDiary();

    await loadProjects();

    renderButtons();

  }


  // ========================================
  // SITE CONTENT
  // ========================================

  async function loadSite() {

    try {

      const response =
        await fetch(
          "/api/admin/content",
          {
            credentials: "same-origin"
          }
        );


      if (response.status === 401) {

        showLogin();

        return;

      }


      const data =
        await response.json();


      setValue("siteName", data.name);
      setValue("tagline", data.tagline);
      setValue("college", data.college);
      setValue("education", data.education);
      setValue("photo", data.photo);
      setValue("about", data.about);


      const skills =
        document.getElementById("skills");

      if (skills) {

        skills.value =
          Array.isArray(data.skills)
            ? data.skills.join("\n")
            : "";

      }


      setValue(
        "facebook",
        data.social?.facebook || ""
      );

      setValue(
        "instagram",
        data.social?.instagram || ""
      );

      setValue(
        "whatsapp",
        data.social?.whatsapp || ""
      );

      setValue(
        "email",
        data.social?.email || ""
      );


      window.siteData = data;


    } catch (error) {

      console.error(
        "Site load error:",
        error
      );

    }

  }


  // ========================================
  // SAVE SITE
  // ========================================

  const siteForm =
    document.getElementById("siteForm");


  if (siteForm) {

    siteForm.addEventListener(
      "submit",
      async function (e) {

        e.preventDefault();


        const oldData =
          window.siteData || {};


        const finalData = {

          ...oldData,

          name:
            getValue("siteName"),

          tagline:
            getValue("tagline"),

          college:
            getValue("college"),

          education:
            getValue("education"),

          photo:
            getValue("photo"),

          about:
            getValue("about"),

          skills:
            getValue("skills")
              .split("\n")
              .map(x => x.trim())
              .filter(Boolean),

          social: {

            ...(oldData.social || {}),

            facebook:
              getValue("facebook"),

            instagram:
              getValue("instagram"),

            whatsapp:
              getValue("whatsapp"),

            email:
              getValue("email")

          }

        };


        try {

          const response =
            await fetch(
              "/api/admin/content",
              {
                method: "PUT",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                credentials:
                  "same-origin",

                body:
                  JSON.stringify(
                    finalData
                  )
              }
            );


          const data =
            await response.json();


          if (!response.ok) {

            alert(
              data.error ||
              "তথ্য সংরক্ষণ করা যায়নি।"
            );

            return;

          }


          window.siteData =
            data.data;


          alert(
            "✅ সাইটের তথ্য সফলভাবে সংরক্ষণ হয়েছে।"
          );


        } catch (error) {

          console.error(error);

          alert(
            "Server error!"
          );

        }

      }
    );

  }


  // ========================================
  // DIARY
  // ========================================

  async function loadDiary() {

    const container =
      document.getElementById(
        "diaryList"
      );


    if (!container) return;


    try {

      const response =
        await fetch(
          "/api/admin/diary",
          {
            credentials:
              "same-origin"
          }
        );


      const items =
        await response.json();


      container.innerHTML = "";


      items.forEach(item => {

        const box =
          document.createElement("div");

        box.className =
          "admin-item";


        box.innerHTML = `

          <input
            class="diary-title"
            value="${escapeHTML(item.title)}"
          >

          <textarea
            class="diary-content"
          >${escapeHTML(item.content)}</textarea>

          <input
            class="diary-date"
            value="${escapeHTML(item.date || "")}"
          >

          <label>
            <input
              type="checkbox"
              class="diary-visible"
              ${item.visible ? "checked" : ""}
            >
            Show
          </label>

          <button
            type="button"
            class="saveDiary"
          >
            💾 Save
          </button>

          <button
            type="button"
            class="deleteDiary"
          >
            🗑️ Delete
          </button>

        `;


        box.querySelector(
          ".saveDiary"
        ).addEventListener(
          "click",
          async () => {

            await updateDiary(
              item.id,
              box
            );

          }
        );


        box.querySelector(
          ".deleteDiary"
        ).addEventListener(
          "click",
          async () => {

            await deleteDiary(
              item.id
            );

          }
        );


        container.appendChild(box);

      });


    } catch (error) {

      console.error(error);

    }

  }


  // ========================================
  // ADD DIARY
  // ========================================

  const addDiaryBtn =
    document.getElementById(
      "addDiaryBtn"
    );


  if (addDiaryBtn) {

    addDiaryBtn.addEventListener(
      "click",
      async () => {

        const title =
          prompt("অধ্যায়ের নাম:");

        if (!title) return;


        const content =
          prompt("অধ্যায়ের বিস্তারিত লেখা:");

        if (!content) return;


        const date =
          prompt(
            "তারিখ:",
            new Date().toLocaleDateString("bn-BD")
          );


        try {

          const response =
            await fetch(
              "/api/admin/diary",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                credentials:
                  "same-origin",

                body:
                  JSON.stringify({
                    title,
                    content,
                    date
                  })
              }
            );


          const data =
            await response.json();


          if (!response.ok) {

            alert(
              data.error ||
              "Diary যোগ করা যায়নি।"
            );

            return;

          }


          await loadDiary();

          alert(
            "✅ নতুন অধ্যায় যোগ হয়েছে।"
          );


        } catch (error) {

          console.error(error);

          alert("Server error!");

        }

      }
    );

  }


  // ========================================
  // UPDATE DIARY
  // ========================================

  async function updateDiary(
    id,
    box
  ) {

    const title =
      box.querySelector(
        ".diary-title"
      ).value.trim();


    const content =
      box.querySelector(
        ".diary-content"
      ).value.trim();


    const date =
      box.querySelector(
        ".diary-date"
      ).value.trim();


    const visible =
      box.querySelector(
        ".diary-visible"
      ).checked;


    try {

      const response =
        await fetch(
          `/api/admin/diary/${id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json"
            },

            credentials:
              "same-origin",

            body:
              JSON.stringify({
                title,
                content,
                date,
                visible
              })
          }
        );


      if (!response.ok) {

        alert(
          "Diary update হয়নি।"
        );

        return;

      }


      alert(
        "✅ Diary update হয়েছে।"
      );


    } catch (error) {

      console.error(error);

      alert("Server error!");

    }

  }


  // ========================================
  // DELETE DIARY
  // ========================================

  async function deleteDiary(id) {

    if (
      !confirm(
        "এই Diary মুছে ফেলতে চান?"
      )
    ) return;


    try {

      await fetch(
        `/api/admin/diary/${id}`,
        {
          method: "DELETE",
          credentials:
            "same-origin"
        }
      );


      await loadDiary();


    } catch (error) {

      console.error(error);

    }

  }


  // ========================================
  // PROJECTS
  // ========================================

  async function loadProjects() {

    const container =
      document.getElementById(
        "projectsList"
      );


    if (!container) return;


    try {

      const response =
        await fetch(
          "/api/admin/projects",
          {
            credentials:
              "same-origin"
          }
        );


      const items =
        await response.json();


      container.innerHTML = "";


      items.forEach(item => {

        const box =
          document.createElement("div");

        box.className =
          "admin-item";


        box.innerHTML = `

          <input
            class="project-title"
            placeholder="প্রজেক্টের নাম"
            value="${escapeHTML(item.title)}"
          >

          <textarea
            class="project-description"
            placeholder="প্রজেক্টের বিবরণ"
          >${escapeHTML(item.description || "")}</textarea>

          <input
            class="project-url"
            placeholder="Link"
            value="${escapeHTML(item.url || "")}"
          >

          <input
            class="project-image"
            placeholder="Image URL"
            value="${escapeHTML(item.image || "")}"
          >

          <input
            class="project-order"
            type="number"
            value="${item.sort_order || 0}"
          >

          <label>
            <input
              type="checkbox"
              class="project-visible"
              ${item.visible ? "checked" : ""}
            >
            Show
          </label>

          <button
            type="button"
            class="saveProject"
          >
            💾 Save
          </button>

          <button
            type="button"
            class="deleteProject"
          >
            🗑️ Delete
          </button>

        `;


        box.querySelector(
          ".saveProject"
        ).addEventListener(
          "click",
          async () => {

            await updateProject(
              item.id,
              box
            );

          }
        );


        box.querySelector(
          ".deleteProject"
        ).addEventListener(
          "click",
          async () => {

            await deleteProject(
              item.id
            );

          }
        );


        container.appendChild(box);

      });


    } catch (error) {

      console.error(error);

    }

  }


  // ========================================
  // ADD PROJECT
  // ========================================

  const addProjectBtn =
    document.getElementById(
      "addProjectBtn"
    );


  if (addProjectBtn) {

    addProjectBtn.addEventListener(
      "click",
      async () => {

        const title =
          prompt("প্রজেক্টের নাম:");

        if (!title) return;


        const description =
          prompt(
            "প্রজেক্টের বিবরণ:"
          ) || "";


        const url =
          prompt(
            "প্রজেক্ট Link:"
          ) || "";


        const image =
          prompt(
            "Image URL:"
          ) || "";


        try {

          const response =
            await fetch(
              "/api/admin/projects",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                credentials:
                  "same-origin",

                body:
                  JSON.stringify({
                    title,
                    description,
                    url,
                    image
                  })
              }
            );


          const data =
            await response.json();


          if (!response.ok) {

            alert(
              data.error ||
              "Project যোগ করা যায়নি।"
            );

            return;

          }


          await loadProjects();


          alert(
            "🚀 নতুন Project যোগ হয়েছে।"
          );


        } catch (error) {

          console.error(error);

          alert("Server error!");

        }

      }
    );

  }


  // ========================================
  // UPDATE PROJECT
  // ========================================

  async function updateProject(
    id,
    box
  ) {

    const data = {

      title:
        box.querySelector(
          ".project-title"
        ).value.trim(),

      description:
        box.querySelector(
          ".project-description"
        ).value.trim(),

      url:
        box.querySelector(
          ".project-url"
        ).value.trim(),

      image:
        box.querySelector(
          ".project-image"
        ).value.trim(),

      sort_order:
        Number(
          box.querySelector(
            ".project-order"
          ).value || 0
        ),

      visible:
        box.querySelector(
          ".project-visible"
        ).checked

    };


    try {

      const response =
        await fetch(
          `/api/admin/projects/${id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json"
            },

            credentials:
              "same-origin",

            body:
              JSON.stringify(data)
          }
        );


      if (!response.ok) {

        alert(
          "Project update হয়নি।"
        );

        return;

      }


      alert(
        "✅ Project update হয়েছে।"
      );


      await loadProjects();


    } catch (error) {

      console.error(error);

      alert("Server error!");

    }

  }


  // ========================================
  // DELETE PROJECT
  // ========================================

  async function deleteProject(id) {

    if (
      !confirm(
        "এই Project মুছে ফেলতে চান?"
      )
    ) return;


    try {

      await fetch(
        `/api/admin/projects/${id}`,
        {
          method: "DELETE",
          credentials:
            "same-origin"
        }
      );


      await loadProjects();


    } catch (error) {

      console.error(error);

    }

  }


  // ========================================
  // BUTTON MANAGER
  // ========================================

  function renderButtons() {

    const container =
      document.getElementById(
        "buttonsList"
      );


    if (!container) return;


    const data =
      window.siteData || {};


    const buttons =
      Array.isArray(data.buttons)
        ? data.buttons
        : [];


    container.innerHTML = "";


    buttons
      .sort(
        (a, b) =>
          Number(a.order || 0) -
          Number(b.order || 0)
      )
      .forEach((button, index) => {

        const box =
          document.createElement("div");

        box.className =
          "admin-item";


        box.innerHTML = `

          <input
            class="button-label"
            placeholder="Button name"
            value="${escapeHTML(button.label || "")}"
          >

          <input
            class="button-url"
            placeholder="Button link"
            value="${escapeHTML(button.url || "")}"
          >

          <input
            class="button-order"
            type="number"
            value="${button.order || index + 1}"
          >

          <label>
            <input
              type="checkbox"
              class="button-visible"
              ${button.visible !== false ? "checked" : ""}
            >
            Show
          </label>

          <button
            type="button"
            class="saveButton"
          >
            💾 Save
          </button>

          <button
            type="button"
            class="deleteButton"
          >
            🗑️ Delete
          </button>

        `;


        box.querySelector(
          ".saveButton"
        ).addEventListener(
          "click",
          async () => {

            const current =
              window.siteData.buttons ||
              [];


            current[index] = {

              ...current[index],

              label:
                box.querySelector(
                  ".button-label"
                ).value.trim(),

              url:
                box.querySelector(
                  ".button-url"
                ).value.trim(),

              order:
                Number(
                  box.querySelector(
                    ".button-order"
                  ).value || index + 1
                ),

              visible:
                box.querySelector(
                  ".button-visible"
                ).checked

            };


            await saveButtons(current);

          }
        );


        box.querySelector(
          ".deleteButton"
        ).addEventListener(
          "click",
          async () => {

            const current =
              window.siteData.buttons ||
              [];


            current.splice(index, 1);


            await saveButtons(current);

          }
        );


        container.appendChild(box);

      });

  }


  // ========================================
  // SAVE BUTTONS
  // ========================================

  async function saveButtons(buttons) {

    try {

      const response =
        await fetch(
          "/api/admin/content",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json"
            },

            credentials:
              "same-origin",

            body:
              JSON.stringify({
                buttons
              })
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        alert(
          data.error ||
          "Button save হয়নি।"
        );

        return;

      }


      window.siteData =
        data.data;


      renderButtons();


      alert(
        "✅ Button saved!"
      );


    } catch (error) {

      console.error(error);

      alert("Server error!");

    }

  }


  // ========================================
  // ADD NEW BUTTON
  // ========================================

  const addButtonBtn =
    document.getElementById(
      "addButtonBtn"
    );


  if (addButtonBtn) {

    addButtonBtn.addEventListener(
      "click",
      async () => {

        const label =
          prompt(
            "নতুন Button-এর নাম:"
          );


        if (!label) return;


        const url =
          prompt(
            "Button কোথায় যাবে? Link:"
          );


        if (!url) return;


        const current =
          window.siteData.buttons ||
          [];


        current.push({

          id:
            "button-" +
            Date.now(),

          label,

          url,

          visible: true,

          order:
            current.length + 1

        });


        await saveButtons(
          current
        );

      }
    );

  }


  // ========================================
  // HELPERS
  // ========================================

  function getValue(id) {

    const el =
      document.getElementById(id);

    return el
      ? el.value.trim()
      : "";

  }


  function setValue(id, value) {

    const el =
      document.getElementById(id);

    if (el) {
      el.value =
        value || "";
    }

  }


  function escapeHTML(value) {

    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }

});
