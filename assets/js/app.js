(function () {
  const store = window.MHFFStore;
  const body = document.body;
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const open = body.classList.toggle("menu-open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });
    navLinks.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        body.classList.remove("menu-open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  function activityCard(activity) {
    return `
      <article class="activity-card">
        <img src="${store.publicImage(activity.image)}" alt="${activity.title}">
        <div>
          <div class="activity-meta"><span class="badge">${activity.category}</span><span class="badge">${activity.date}</span></div>
          <h3>${activity.title}</h3>
          <p>${activity.summary}</p>
          <div class="activity-actions"><a class="btn btn-outline" href="${body.dataset.page === "home" ? "pages/" : ""}activities.html#${activity.id}">Read More</a></div>
        </div>
      </article>`;
  }

  async function renderActivities() {
    const preview = document.querySelector("[data-activities-preview]");
    const list = document.querySelector("[data-activities-list]");
    if (!preview && !list) return;
    try {
      const db = await store.read();
      if (preview) preview.innerHTML = db.activities.slice(0, 3).map(activityCard).join("");
      if (list) {
        list.innerHTML = db.activities.map((activity) => `
          <article class="activity-card" id="${activity.id}">
            <img src="${store.publicImage(activity.image)}" alt="${activity.title}">
            <div>
              <div class="activity-meta"><span class="badge">${activity.category}</span><span class="badge">${activity.date}</span><span class="badge">${activity.location}</span></div>
              <h3>${activity.title}</h3>
              <p>${activity.body || activity.summary}</p>
            </div>
          </article>`).join("");
      }
    } catch (error) {
      const target = preview || list;
      target.innerHTML = `<p class="form-note">Unable to load activities: ${error.message}</p>`;
    }
  }

  function animateCounters() {
    const counters = document.querySelectorAll("[data-count]");
    if (!counters.length) return;
    const observer = new IntersectionObserver((entries, watcher) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const node = entry.target;
        const end = Number(node.dataset.count);
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / 1100, 1);
          node.textContent = Math.floor(end * (1 - Math.pow(1 - progress, 3))).toLocaleString();
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        watcher.unobserve(node);
      });
    }, { threshold: .35 });
    counters.forEach((counter) => observer.observe(counter));
  }

  function wireForms() {
    document.querySelectorAll("[data-help-form]").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const note = form.querySelector(".form-note");
        note.textContent = "Submitting...";
        try {
          const data = Object.fromEntries(new FormData(form).entries());
          const session = await store.getSession();
          await store.submitHelpRequest({ ...data, userEmail: session ? session.email : data.email });
          form.reset();
          note.textContent = "Help request submitted. The team can review it from the admin dashboard.";
        } catch (error) {
          note.textContent = error.message;
        }
      });
    });

    document.querySelectorAll("[data-application-form]").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const note = form.querySelector(".form-note");
        note.textContent = "Submitting...";
        try {
          const data = Object.fromEntries(new FormData(form).entries());
          const session = await store.getSession();
          await store.submitApplication({ ...data, userEmail: session ? session.email : data.email });
          form.reset();
          note.textContent = "Application submitted. Thank you for volunteering.";
        } catch (error) {
          note.textContent = error.message;
        }
      });
    });
  }

  renderActivities();
  animateCounters();
  wireForms();
})();
