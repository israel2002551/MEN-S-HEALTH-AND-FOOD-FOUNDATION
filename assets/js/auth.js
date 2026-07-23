(function () {
  const store = window.MHFFStore;
  const page = document.body.dataset.authPage;
  const role = document.body.dataset.role;

  function redirectFor(user) {
    location.href = user.role === "admin" ? "dashboard.html" : "dashboard.html";
  }

  document.querySelectorAll("[data-login-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const user = store.login(data.email, data.password, role);
      const note = form.querySelector(".form-note");
      if (!user) {
        note.textContent = "Login failed. Check your email, password, and account type.";
        return;
      }
      redirectFor(user);
    });
  });

  document.querySelectorAll("[data-register-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const note = form.querySelector(".form-note");
      try {
        store.registerVolunteer(Object.fromEntries(new FormData(form).entries()));
        location.href = "dashboard.html";
      } catch (error) {
        note.textContent = error.message;
      }
    });
  });

  document.querySelectorAll("[data-forgot-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      store.requestPasswordReset(data.email, role);
      form.querySelector(".form-note").textContent = "Password reset request saved. In production, an email reset link will be sent.";
      form.reset();
    });
  });

  if (page === "logout") {
    store.clearSession();
    location.href = "login.html";
  }
})();
