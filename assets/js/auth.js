(function () {
  const store = window.MHFFStore;
  const role = document.body.dataset.role;

  document.querySelectorAll('input[type="password"]').forEach((input) => {
    const label = input.closest("label");
    if (!label || label.querySelector(".password-toggle")) return;
    const control = document.createElement("span");
    control.className = "password-control";
    input.parentNode.insertBefore(control, input);
    control.appendChild(input);

    const button = document.createElement("button");
    button.className = "password-toggle";
    button.type = "button";
    button.textContent = "Show";
    button.setAttribute("aria-label", "Show password");
    control.appendChild(button);

    button.addEventListener("click", () => {
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      button.textContent = isHidden ? "Hide" : "Show";
      button.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
    });
  });

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
