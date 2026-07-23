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

  function videoEmbedUrl(url) {
    if (!url) return "";
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("youtube.com")) {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }
      if (parsed.hostname.includes("youtu.be")) {
        return `https://www.youtube.com/embed/${parsed.pathname.replace("/", "")}`;
      }
      if (parsed.hostname.includes("vimeo.com")) {
        return `https://player.vimeo.com/video/${parsed.pathname.replace("/", "")}`;
      }
      return url;
    } catch (error) {
      return url;
    }
  }

  function mediaMarkup(item, alt) {
    if (item.video) {
      return `<div class="media-frame"><iframe src="${videoEmbedUrl(item.video)}" title="${alt}" loading="lazy" allowfullscreen></iframe></div>`;
    }
    return `<img src="${store.publicImage(item.image)}" alt="${alt}">`;
  }

  function activityCard(activity) {
    return `
      <article class="activity-card">
        ${mediaMarkup(activity, activity.title)}
        <div>
          <div class="activity-meta"><span class="badge">${activity.category}</span><span class="badge">${activity.date}</span></div>
          <h3>${activity.title}</h3>
          <p>${activity.summary}</p>
          <div class="activity-actions"><a class="btn btn-outline" href="${body.dataset.page === "home" ? "pages/" : ""}activities.html#${activity.id}">Read More</a></div>
        </div>
      </article>`;
  }

  function programCard(program) {
    return `
      <article class="image-card">
        ${mediaMarkup(program, program.title)}
        <div>
          <div class="activity-meta"><span class="badge">${program.category}</span></div>
          <h3>${program.title}</h3>
          <p>${program.summary}</p>
        </div>
      </article>`;
  }

  async function renderPrograms() {
    const preview = document.querySelector("[data-programs-preview]");
    const list = document.querySelector("[data-programs-list]");
    if (!preview && !list) return;
    try {
      const db = await store.read();
      const programs = db.programs || [];
      if (preview) preview.innerHTML = programs.slice(0, 3).map(programCard).join("");
      if (list) list.innerHTML = programs.map(programCard).join("");
    } catch (error) {
      const target = preview || list;
      target.innerHTML = `<p class="form-note">Unable to load programs: ${error.message}</p>`;
    }
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
            ${mediaMarkup(activity, activity.title)}
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

  renderPrograms();
  renderActivities();
  animateCounters();
  wireForms();
})();
