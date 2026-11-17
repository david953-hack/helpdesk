(function () {
  "use strict";

  window.HD = window.HD || {};
  window.HD.pages = window.HD.pages || {};

  var Storage = window.HD.Storage;
  var UI = window.HD.UI;

  function showError(message) {
    var box = document.getElementById("login-error");
    var text = document.getElementById("login-error-text");
    if (!box || !text) return;
    text.textContent = message;
    box.classList.add("is-visible");
  }

  function hideError() {
    var box = document.getElementById("login-error");
    if (box) box.classList.remove("is-visible");
  }

  window.HD.pages.login = async function () {
    var form = document.getElementById("login-form");
    var emailInput = document.getElementById("login-email");
    var passwordInput = document.getElementById("login-password");
    var submit = document.getElementById("login-submit");
    var toggle = document.getElementById("toggle-password");

    document.getElementById("login-stat-tickets").textContent =
      Storage.getAll("tickets").length;
    document.getElementById("login-stat-technicians").textContent =
      Storage.getAll("technicians").length;
    document.getElementById("login-stat-categories").textContent =
      Storage.getAll("categories").length;

    document.querySelectorAll("[data-demo-email]").forEach(function (button) {
      button.addEventListener("click", function () {
        emailInput.value = button.getAttribute("data-demo-email");
        passwordInput.value = button.getAttribute("data-demo-password");
        UI.clearFormErrors(form);
        hideError();
        UI.toast("Credenciales de demostración cargadas. Pulsa «Entrar al panel».", "info");
        submit.focus();
      });
    });

    toggle.addEventListener("click", function () {
      var isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      toggle.setAttribute("aria-label", isPassword ? "Ocultar contraseña" : "Mostrar contraseña");
      toggle.innerHTML = '<i data-lucide="' + (isPassword ? "eye-off" : "eye") + '"></i>';
      UI.refreshIcons();
      passwordInput.focus();
    });

    emailInput.addEventListener("input", function () {
      UI.setFieldError(emailInput, "");
      hideError();
    });
    passwordInput.addEventListener("input", function () {
      UI.setFieldError(passwordInput, "");
      hideError();
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      UI.clearFormErrors(form);
      hideError();

      var email = emailInput.value.trim();
      var password = passwordInput.value;
      var valid = true;

      if (!email) {
        UI.setFieldError(emailInput, "Introduce tu correo corporativo.");
        valid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        UI.setFieldError(emailInput, "El correo no tiene un formato válido.");
        valid = false;
      }
      if (!password) {
        UI.setFieldError(passwordInput, "Introduce tu contraseña.");
        valid = false;
      } else if (password.length < 6) {
        UI.setFieldError(passwordInput, "La contraseña debe tener al menos 6 caracteres.");
        valid = false;
      }

      if (!valid) {
        var firstError = form.querySelector(".field.has-error .input");
        if (firstError) firstError.focus();
        return;
      }

      UI.setLoading(submit, true, "Verificando…");
      try {
        var session = await window.HD.services.auth.login(email, password);
        UI.toast("Bienvenido, " + session.user.name + ".", "success");
        setTimeout(function () {
          window.location.href = "dashboard.html";
        }, 400);
      } catch (error) {
        UI.setLoading(submit, false);
        showError(error.message || "No se pudo iniciar sesión. Inténtalo de nuevo.");
        passwordInput.focus();
        passwordInput.select();
      }
    });

    if (!emailInput.value) {
      setTimeout(function () {
        emailInput.focus();
      }, 250);
    }
  };
})();
