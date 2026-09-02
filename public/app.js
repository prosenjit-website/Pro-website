/* =========================================
   PROSENJIT RAY — MAIN APP
========================================= */


/* NAVBAR */

const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {

  if (window.scrollY > 40) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }

});


/* MOBILE MENU */

const menuButton =
  document.getElementById("menuButton");

const mobileMenu =
  document.getElementById("mobileMenu");


if (menuButton && mobileMenu) {

  menuButton.addEventListener("click", () => {

    mobileMenu.classList.toggle("open");

  });

}


document
  .querySelectorAll(".mobile-menu a")
  .forEach(link => {

    link.addEventListener("click", () => {

      mobileMenu.classList.remove("open");

    });

  });


/* REVEAL ANIMATION */

const revealElements =
  document.querySelectorAll(".reveal");


const revealObserver =
  new IntersectionObserver(

    entries => {

      entries.forEach(entry => {

        if (entry.isIntersecting) {

          entry.target.classList.add("show");

          revealObserver.unobserve(
            entry.target
          );

        }

      });

    },

    {
      threshold: 0.10
    }

  );


revealElements.forEach(element => {

  revealObserver.observe(element);

});


/* DIARY READER */

const reader =
  document.getElementById("reader");

const readerTitle =
  document.getElementById("readerTitle");

const readerText =
  document.getElementById("readerText");

const readerChapter =
  document.getElementById("readerChapter");

const closeReader =
  document.getElementById("closeReader");


document
  .querySelectorAll(".diary-open")
  .forEach(button => {

    button.addEventListener("click", () => {

      readerTitle.textContent =
        button.dataset.title;

      readerText.textContent =
        button.dataset.text;

      const card =
        button.closest(".diary-card");

      readerChapter.textContent =
        card.querySelector(".diary-date").textContent;

      reader.classList.add("open");

      document.body.style.overflow =
        "hidden";

    });

  });


function closeDiary() {

  reader.classList.remove("open");

  document.body.style.overflow = "";

}


if (closeReader) {

  closeReader.addEventListener(
    "click",
    closeDiary
  );

}


if (reader) {

  reader.addEventListener("click", event => {

    if (event.target === reader) {

      closeDiary();

    }

  });

}


/* ESCAPE */

document.addEventListener("keydown", event => {

  if (event.key === "Escape") {

    closeDiary();

  }

});


/* CURRENT YEAR */

const year =
  document.getElementById("year");


if (year) {

  year.textContent =
    new Date().getFullYear();

}


/* =========================================
   OPTIONAL BACKEND CONNECTION
========================================= */

async function loadSiteData() {

  try {

    const response =
      await fetch("/api/site");

    if (!response.ok) return;

    const data =
      await response.json();

    /*
      Admin panel-এর data থাকলে
      ভবিষ্যতে এখান থেকে homepage
      automatically update করা যাবে।
    */

    console.log(
      "Site data loaded:",
      data
    );

  } catch (error) {

    console.log(
      "Site API unavailable:",
      error
    );

  }

}


loadSiteData();
