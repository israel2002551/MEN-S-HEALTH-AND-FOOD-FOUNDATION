(async function () {
  const store = window.MHFFStore;
  const session = await store.getSession();
  if (!session || session.role !== "admin") {
    location.href = "login.html";
    return;
  }

  const adminName = document.querySelector("[data-admin-name]");
  if (adminName) adminName.textContent = session.name;

  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", async () => {
      await store.clearSession();
      location.href = "login.html";
    });
  });

  async function getDb() {
    return store.read();
  }

  async function renderStats() {
    const db = await getDb();
    const stats = document.querySelector("[data-admin-stats]");
    if (!stats) return;
    stats.innerHTML = `
      <article><strong>${db.activities.length}</strong><span>Activities</span></article>
      <article><strong>${(db.programs || []).length}</strong><span>Programs</span></article>
      <article><strong>${db.applications.length}</strong><span>Volunteer Applications</span></article>
      <article><strong>${db.helpRequests.length}</strong><span>Help Requests</span></article>`;
  }

  function mediaStatus(item) {
    const image = item.image ? "Image" : "";
    const video = item.video ? "Video" : "";
    return [image, video].filter(Boolean).join(" + ") || "None";
  }

  async function renderActivityAdmin() {
    const list = document.querySelector("[data-admin-activities]");
    if (!list) return;
    const latest = (await getDb()).activities;
    list.innerHTML = latest.map((item) => `
      <tr>
        <td><strong>${item.title}</strong><br><small>${item.category}</small></td>
        <td>${item.date}</td>
        <td>${item.location}</td>
        <td>${mediaStatus(item)}</td>
        <td><button class="btn btn-danger" type="button" data-delete-activity="${item.id}">Delete</button></td>
      </tr>`).join("");
    list.querySelectorAll("[data-delete-activity]").forEach((button) => {
      button.addEventListener("click", async () => {
        await store.deleteActivity(button.dataset.deleteActivity);
        await renderActivityAdmin();
        await renderStats();
      });
    });
  }

  document.querySelectorAll("[data-activity-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const note = form.querySelector(".form-note");
      note.textContent = "Publishing...";
      try {
        await store.saveActivity(Object.fromEntries(new FormData(form).entries()));
        form.reset();
        note.textContent = "Activity published. It now appears on the public activities section.";
        await renderActivityAdmin();
        await renderStats();
      } catch (error) {
        note.textContent = error.message;
      }
    });
  });

  async function renderProgramAdmin() {
    const list = document.querySelector("[data-admin-programs]");
    if (!list) return;
    const programs = (await getDb()).programs || [];
    list.innerHTML = programs.length ? programs.map((item) => `
      <tr>
        <td><strong>${item.title}</strong><br><small>${item.summary}</small></td>
        <td>${item.category}</td>
        <td>${mediaStatus(item)}</td>
        <td><button class="btn btn-danger" type="button" data-delete-program="${item.id}">Delete</button></td>
      </tr>`).join("") : `<tr><td colspan="4">No programs yet.</td></tr>`;
    list.querySelectorAll("[data-delete-program]").forEach((button) => {
      button.addEventListener("click", async () => {
        await store.deleteProgram(button.dataset.deleteProgram);
        await renderProgramAdmin();
        await renderStats();
      });
    });
  }

  document.querySelectorAll("[data-program-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const note = form.querySelector(".form-note");
      note.textContent = "Publishing...";
      try {
        await store.saveProgram(Object.fromEntries(new FormData(form).entries()));
        form.reset();
        note.textContent = "Program published. It now appears on the public programs section.";
        await renderProgramAdmin();
        await renderStats();
      } catch (error) {
        note.textContent = error.message;
      }
    });
  });

  function renderTable(selector, items, columns) {
    const target = document.querySelector(selector);
    if (!target) return;
    target.innerHTML = items.length
      ? items.map((item) => `<tr>${columns.map((column) => `<td>${column(item)}</td>`).join("")}</tr>`).join("")
      : `<tr><td colspan="${columns.length}">No records yet.</td></tr>`;
  }

  async function renderRequests() {
    const db = await getDb();
    renderTable("[data-admin-applications]", db.applications, [
      (item) => `<strong>${item.name}</strong><br>${item.email || item.userEmail || ""}`,
      (item) => item.role || item.skill || "Volunteer",
      (item) => item.availability || "Not provided",
      (item) => item.status
    ]);
    renderTable("[data-admin-help]", db.helpRequests, [
      (item) => `<strong>${item.name}</strong><br>${item.phone || ""}`,
      (item) => item.request_type || item.requestType || "Help request",
      (item) => item.community || "Not provided",
      (item) => item.status
    ]);
  }

  await renderStats();
  await renderActivityAdmin();
  await renderProgramAdmin();
  await renderRequests();
})();
