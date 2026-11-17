(function () {
  "use strict";

  window.HD = window.HD || {};
  window.HD.services = window.HD.services || {};

  var Storage = window.HD.Storage;

  var auth = {
    async login(email, password) {
      await Storage.wait(320);
      var cleanEmail = String(email || "").trim().toLowerCase();
      var cleanPassword = String(password || "");
      var accounts = Storage.getAll("accounts");
      var account = accounts.find(function (item) {
        return item.email.toLowerCase() === cleanEmail && item.password === cleanPassword;
      });

      if (!account) {
        throw new Error("Correo o contraseña incorrectos. Revisa tus credenciales.");
      }

      var session = {
        token: Storage.uid("sess"),
        user: {
          id: account.id,
          name: account.name,
          email: account.email,
          role: account.role
        },
        loggedAt: Storage.nowISO()
      };

      Storage.setSession(session);
      return session;
    },

    async logout() {
      await Storage.wait(80);
      Storage.clearSession();
    },

    async getSession() {
      return Storage.getSession();
    }
  };

  window.HD.services.auth = auth;
})();
