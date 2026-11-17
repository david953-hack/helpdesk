(function () {
  "use strict";

  window.HD = window.HD || {};
  window.HD.services = window.HD.services || {};

  var Storage = window.HD.Storage;

  function normalize(value) {
    return String(value || "").trim();
  }

  function ensureEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalize(email).toLowerCase());
  }

  function decorate(user) {
    var tickets = Storage.getAll("tickets");
    var own = tickets.filter(function (ticket) {
      return ticket.userId === user.id;
    });
    return Object.assign({}, user, {
      ticketCount: own.length,
      activeTicketCount: own.filter(function (ticket) {
        return window.HD.config.activeStatuses.indexOf(ticket.status) !== -1;
      }).length
    });
  }

  function sortValue(user, key) {
    switch (key) {
      case "tickets":
        return user.ticketCount;
      case "email":
        return (user.email || "").toLowerCase();
      case "department":
        return (user.department || "").toLowerCase();
      case "role":
        return (user.role || "").toLowerCase();
      case "createdAt":
        return new Date(user.createdAt).getTime();
      default:
        return (user.name || "").toLowerCase();
    }
  }

  var users = {
    async list(query) {
      await Storage.wait(60);
      query = query || {};
      var search = normalize(query.search).toLowerCase();
      var items = Storage.getAll("users").map(decorate);

      if (query.role && query.role !== "all") {
        items = items.filter(function (user) {
          return user.role === query.role;
        });
      }
      if (query.status && query.status !== "all") {
        items = items.filter(function (user) {
          return user.status === query.status;
        });
      }
      if (search) {
        items = items.filter(function (user) {
          return [user.name, user.email, user.department, user.role]
            .join(" ")
            .toLowerCase()
            .indexOf(search) !== -1;
        });
      }

      var direction = query.sortDir === "asc" ? 1 : -1;
      var key = query.sortBy || "name";
      items.sort(function (a, b) {
        var va = sortValue(a, key);
        var vb = sortValue(b, key);
        if (typeof va === "number" && typeof vb === "number") return (va - vb) * direction;
        return String(va).localeCompare(String(vb), "es") * direction;
      });

      return items;
    },

    async get(id) {
      var user = Storage.getById("users", id);
      return user ? decorate(user) : null;
    },

    async create(data) {
      await Storage.wait(120);
      var name = normalize(data.name);
      var email = normalize(data.email);
      if (name.length < 3) throw new Error("El nombre debe tener al menos 3 caracteres.");
      if (!ensureEmail(email)) throw new Error("Introduce un correo electrónico válido.");

      var exists = Storage.getAll("users").some(function (user) {
        return user.email.toLowerCase() === email.toLowerCase();
      });
      if (exists) throw new Error("Ya existe un usuario con ese correo electrónico.");

      var record = Storage.insert("users", {
        name: name,
        email: email,
        phone: normalize(data.phone),
        department: data.department || "Administración",
        role: data.role || "Usuario",
        status: data.status || "Activo"
      });
      return decorate(record);
    },

    async update(id, data) {
      await Storage.wait(120);
      var current = Storage.getById("users", id);
      if (!current) throw new Error("El usuario no existe.");

      var name = normalize(data.name);
      var email = normalize(data.email);
      if (name.length < 3) throw new Error("El nombre debe tener al menos 3 caracteres.");
      if (!ensureEmail(email)) throw new Error("Introduce un correo electrónico válido.");

      var exists = Storage.getAll("users").some(function (user) {
        return user.id !== id && user.email.toLowerCase() === email.toLowerCase();
      });
      if (exists) throw new Error("Ya existe otro usuario con ese correo electrónico.");

      var updated = Storage.update("users", id, {
        name: name,
        email: email,
        phone: normalize(data.phone),
        department: data.department || current.department,
        role: data.role || current.role,
        status: data.status || current.status
      });
      return decorate(updated);
    },

    async remove(id) {
      await Storage.wait(100);
      var user = Storage.getById("users", id);
      if (!user) throw new Error("El usuario no existe.");
      var count = Storage.getAll("tickets").filter(function (ticket) {
        return ticket.userId === id;
      }).length;
      if (count > 0) {
        throw new Error(
          "No se puede eliminar a " + user.name + ": tiene " + count +
          " solicitud" + (count === 1 ? "" : "es") + " asociada" + (count === 1 ? "" : "s") + "."
        );
      }
      Storage.remove("users", id);
      return true;
    }
  };

  window.HD.services.users = users;
})();
