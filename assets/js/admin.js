(function () {
  const store = window.MHFFStore;
  const session = store.getSession();
  if (!session || session.role !== "admin") location.href = "login.html";

  const db = store.read();
  const adminName = document.querySelector("[data-admin-name]");
  if (adminName) adminName.textContent = session.name;

  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      store.clearSession();
      location.href = "login.html";
    });
  });

  const stats = document.querySelector("[data-admin-stats]");
  if (stats) {
    stats.innerHTML = `
      <article><strong>${db.activities.length}</strong><span>Activities</span></article>
      <article><strong>${db.applications.length}</strong><span>Volunteer Applications</span></article>
      <article><strong>${db.helpRequests.length}</strong><span>Help Requests</span></article>
      <article><strong>${db.passwordResets.length}</strong><span>Password Reset Requests</span></article>`;
  }

  function renderActivityAdmin() {
    const list = document.querySelector("[data-admin-activities]");
    if (!list) return;
    const latest = store.read().activities;
    list.innerHTML = latest.map((item) => `
      <tr>
        <td><strong>${item.title}</strong><br><small>${item.category}</small></td>
        <td>${item.date}</td>
        <td>${item.location}</td>
        <td><button class="btn btn-danger" type="button" data-delete-activity="${item.id}">Delete</button></td>
      </tr>`).join("");
    list.querySelectorAll("[data-delete-activity]").forEach((button) => {
      button.addEventListener("click", () => {
        store.deleteActivity(button.dataset.deleteActivity);
        renderActivityAdmin();
      });
    });
  }

  document.querySelectorAll("[data-activity-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      store.saveActivity(Object.fromEntries(new FormData(form).entries()));
      form.reset();
      form.querySelector(".form-note").textContent = "Activity published. It now appears on the public activities section.";
      renderActivityAdmin();
    });
  });

  function renderTable(selector, items, columns) {
    const target = document.querySelector(selector);
    if (!target) return;
    target.innerHTML = items.map((item) => `<tr>${columns.map((column) => `<td>${column(item)}</td>`).join("")}</tr>`).join("");
  }

  renderActivityAdmin();
  renderTable("[data-admin-applications]", db.applications, [
    (item) => `<strong>${item.name}</strong><br>${item.userEmail || item.email || ""}`,
    (item) => item.role || item.skill || "Volunteer",
    (item) => item.availability || "Not provided",
    (item) => item.status
  ]);
  renderTable("[data-admin-help]", db.helpRequests, [
    (item) => `<strong>${item.name}</strong><br>${item.phone || ""}`,
    (item) => item.requestType || "Help request",
    (item) => item.community || "Not provided",
    (item) => item.status
  ]);
})();
