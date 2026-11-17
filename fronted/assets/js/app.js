(function () {
  "use strict";

  window.HD = window.HD || {};
  window.HD.pages = window.HD.pages || {};

  document.addEventListener("DOMContentLoaded", async function () {
    var Storage = window.HD.Storage;
    var UI = window.HD.UI;

    Storage.init();
    UI.initGlobal();

    var isPublic = document.body.getAttribute("data-public") === "true";
    var page = document.body.getAttribute("data-page") || "";
    var session = await window.HD.services.auth.getSession();

    if (isPublic) {
      if (session) {
        window.location.replace("dashboard.html");
        return;
      }
    } else {
      if (!session) {
        window.location.replace("login.html");
        return;
      }
      await window.HD.Nav.render();
    }

    try {
      if (window.HD.pages[page] && typeof window.HD.pages[page] === "function") {
        await window.HD.pages[page]();
      }
    } catch (error) {
      console.error(error);
      UI.toast(error.message || "Se produjo un error inesperado al cargar la página.", "error");
    }

    UI.refreshIcons();
  });
})();
