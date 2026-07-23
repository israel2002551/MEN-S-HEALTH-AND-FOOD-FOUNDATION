(function () {
  const store = window.MHFFStore;
  const role = document.body.dataset.role;

  function redirectFor(user) {
    location.href = user.role === "admin" ? "../admin/dashboard.html" : "../portal/dashboard.html";
  }

  document.querySelectorAll("[data-login-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const note = form.querySelector(".form-note");
      note.textContent = "Signing in...";
      try {
        const user = await store.login(data.email, data.password, role);
        if (!user) {
          note.textContent = "Login failed. Check your email, password, and account type.";
          return;
        }
        redirectFor(user);
      } catch (error) {
        note.textContent = error.message;
      }
    });
  });

  document.querySelectorAll("[data-register-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const note = form.querySelector(".form-note");
      note.textContent = "Creating account...";
      try {
        await store.registerVolunteer(Object.fromEntries(new FormData(form).entries()));
        note.textContent = store.isSupabaseEnabled ? "Account created. Check your email if confirmation is enabled, then log in." : "";
        if (!store.isSupabaseEnabled) location.href = "dashboard.html";
      } catch (error) {
        note.textContent = error.message;
      }
    });
  });

  document.querySelectorAll("[data-forgot-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const note = form.querySelector(".form-note");
      note.textContent = "Sending reset request...";
      try {
        const data = Object.fromEntries(new FormData(form).entries());
        await store.requestPasswordReset(data.email, role);
        form.reset();
        note.textContent = "If that account exists, a password reset email will be sent.";
      } catch (error) {
        note.textContent = error.message;
      }
    });
  });
})();
