// ===============================
// PROSENJIT RAY — PREMIUM APP JS
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  loadSite();
  setupMobileMenu();
  setupRevealAnimation();
});

// ===============================
// LOAD SITE CONTENT
// ===============================

async function loadSite() {
  try {
    const response = await fetch("/api/site");

    if (!response.ok) {
      throw new Error("Site API unavailable");
    }

    const data = await response.json();

    // Text fields
    setText("[data-site='name']", data.name);
    setText("[data-site='tagline']", data.tagline);
    setText("[data-site='college']", data.college);
    setText("[data-site='education']", data.education);
    setText("[data-site='about']", data.about);

    // Profile photo
    document.querySelectorAll("[data-site-photo]").forEach((img) => {
      if (data.photo) {
        img.src = data.photo;
      }
    });

    // Skills
    const skillsBox = document.querySelector("[data-skills]");

    if (skillsBox && Array.isArray(data.skills)) {
      skillsBox.innerHTML = "";

      data.skills.forEach((skill) => {
        const item = document.createElement("span");
        item.className = "skill";
        item.textContent = skill;
        skillsBox.appendChild(item);
      });
    }

    // Social links
    if (data.social) {
      document.querySelectorAll("[data-social]").forEach((link) => {
        const key = link.dataset.social;

        if (data.social[key]) {
          link.href = data.social[key];
        } else {
          link.style.display = "none";
        }
      });
    }

    // Homepage buttons
    if (Array.isArray(data.buttons)) {
      data.buttons.forEach((button, index) => {
        const element = document.querySelector(
          `[data-button="${index}"]`
        );

        if (!element) return;

        if (button.show === false) {
          element.style.display = "none";
          return;
        }

        if (button.text) {
          element.textContent = button.text;
        }

        if (button.link) {
          element.href = button.link;
        }
      });
    }

    document.dispatchEvent(
      new CustomEvent("siteLoaded", {
        detail: data
      })
    );

  } catch (error) {
    console.log("Using default website content.");
  }
}

// ===============================
// TEXT HELPER
// ===============================

function setText(selector, value) {
  if (!value) return;

  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
}

// ===============================
// MOBILE MENU
// ===============================

function setupMobileMenu() {
  const menuButton = document.querySelector(".menu-btn");
  const mobileMenu = document.querySelector(".mobile-menu");

  if (!menuButton || !mobileMenu) return;

  menuButton.addEventListener("click", () => {
    mobileMenu.classList.toggle("active");

    const isOpen = mobileMenu.classList.contains("active");

    menuButton.setAttribute("aria-expanded", isOpen);

    menuButton.textContent = isOpen ? "×" : "☰";
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("active");
      menuButton.textContent = "☰";
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

// ===============================
// SCROLL REVEAL
// ===============================

function setupRevealAnimation() {
  const elements = document.querySelectorAll(".reveal");

  if (!elements.length) return;

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => {
      element.classList.add("show");
    });

    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12
    }
  );

  elements.forEach((element) => {
    observer.observe(element);
  });
}

// ===============================
// ACTIVE NAVIGATION
// ===============================

function setActiveNav() {
  const currentPage =
    window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".nav-links a").forEach((link) => {
    const linkPage = link.getAttribute("href");

    if (
      linkPage === currentPage ||
      (currentPage === "" && linkPage === "index.html")
    ) {
      link.classList.add("active");
    }
  });
}

setActiveNav();

// ===============================
// SMOOTH ANCHOR
// ===============================

document.querySelectorAll("a[href^='#']").forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");

    if (!targetId || targetId === "#") return;

    const target = document.querySelector(targetId);

    if (target) {
      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });
});

// ===============================
// YEAR
// ===============================

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

// ===============================
// PAGE LOADER
// ===============================

window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});
