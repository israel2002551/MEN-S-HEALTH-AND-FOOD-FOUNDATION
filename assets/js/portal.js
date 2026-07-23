(async function () {
  const store = window.MHFFStore;
  const session = await store.getSession();
  if (!session || session.role !== "volunteer") {
    location.href = "login.html";
    return;
  }

  const name = document.querySelector("[data-volunteer-name]");
  if (name) name.textContent = session.name;

  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", async () => {
      await store.clearSession();
      location.href = "login.html";
    });
  });

  const db = await store.read();
  const myApps = document.querySelector("[data-my-applications]");
  if (myApps) {
    const rows = db.applications.filter((item) => item.user_id === session.id || item.userEmail === session.email || item.email === session.email);
    myApps.innerHTML = rows.length ? rows.map((item) => `<tr><td>${item.role || "Volunteer"}</td><td>${item.availability || ""}</td><td>${item.status}</td></tr>`).join("") : `<tr><td colspan="3">No applications yet.</td></tr>`;
  }

  const myHelp = document.querySelector("[data-my-help]");
  if (myHelp) {
    const rows = db.helpRequests.filter((item) => item.user_id === session.id || item.userEmail === session.email);
    myHelp.innerHTML = rows.length ? rows.map((item) => `<tr><td>${item.request_type || item.requestType}</td><td>${item.community}</td><td>${item.status}</td></tr>`).join("") : `<tr><td colspan="3">No help requests yet.</td></tr>`;
  }
})();
