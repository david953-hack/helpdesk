(function () {
  "use strict";

  window.HD = window.HD || {};
  window.HD.services = window.HD.services || {};

  var Storage = window.HD.Storage;
  var config = window.HD.config;

  function normalize(value) {
    return String(value || "").trim();
  }

  function ensureEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalize(email).toLowerCase());
  }

  function decorate(technician) {
    var tickets = Storage.getAll("tickets");
    var assigned = tickets.filter(function (ticket) {
      return ticket.technicianId === technician.id;
    });
    return Object.assign({}, technician, {
      totalTickets: assigned.length,
      activeTickets: assigned.filter(function (ticket) {
        return config.activeStatuses.indexOf(ticket.status) !== -1;
      }).length,
      resolvedTickets: assigned.filter(function (ticket) {
        return config.resolvedStatuses.indexOf(ticket.status) !== -1;
      }).length
    });
  }

  function sortValue(technician, key) {
    switch (key) {
      case "activeTickets":
        return technician.activeTickets;
      case "totalTickets":
        return technician.totalTickets;
      case "specialty":
        return (technician.specialty || "").toLowerCase();
      case "status":
        return technician.status || "";
      case "createdAt":
        return new Date(technician.createdAt).getTime();
      default:
        return (technician.name || "").toLowerCase();
    }
  }

  var technicians = {
    async list(query) {
      await Storage.wait(60);
      query = query || {};
      var search = normalize(query.search).toLowerCase();
      var items = Storage.getAll("technicians").map(decorate);

      if (query.status && query.status !== "all") {
        items = items.filter(function (technician) {
          return technician.status === query.status;
        });
      }
      if (query.specialty && query.specialty !== "all") {
        items = items.filter(function (technician) {
          return technician.specialty === query.specialty;
        });
      }
      if (search) {
        items = items.filter(function (technician) {
          return [technician.name, technician.email, technician.specialty, technician.phone]
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
      var technician = Storage.getById("technicians", id);
      return technician ? decorate(technician) : null;
    },

    async create(data) {
      await Storage.wait(120);
      var name = normalize(data.name);
      var email = normalize(data.email);
      if (name.length < 3) throw new Error("El nombre debe tener al menos 3 caracteres.");
      if (!ensureEmail(email)) throw new Error("Introduce un correo electrónico válido.");

      var exists = Storage.getAll("technicians").some(function (technician) {
        return technician.email.toLowerCase() === email.toLowerCase();
      });
      if (exists) throw new Error("Ya existe un técnico con ese correo electrónico.");

      var record = Storage.insert("technicians", {
        name: name,
        email: email,
        phone: normalize(data.phone),
        specialty: data.specialty || "Soporte general",
        status: data.status || "Activo"
      });
      return decorate(record);
    },

    async update(id, data) {
      await Storage.wait(120);
      var current = Storage.getById("technicians", id);
      if (!current) throw new Error("El técnico no existe.");

      var name = normalize(data.name);
      var email = normalize(data.email);
      if (name.length < 3) throw new Error("El nombre debe tener al menos 3 caracteres.");
      if (!ensureEmail(email)) throw new Error("Introduce un correo electrónico válido.");

      var exists = Storage.getAll("technicians").some(function (technician) {
        return technician.id !== id && technician.email.toLowerCase() === email.toLowerCase();
      });
      if (exists) throw new Error("Ya existe otro técnico con ese correo electrónico.");

      var updated = Storage.update("technicians", id, {
        name: name,
        email: email,
        phone: normalize(data.phone),
        specialty: data.specialty || current.specialty,
        status: data.status || current.status
      });
      return decorate(updated);
    },

    async remove(id) {
      await Storage.wait(120);
      var technician = Storage.getById("technicians", id);
      if (!technician) throw new Error("El técnico no existe.");

      var affected = Storage.getAll("tickets").filter(function (ticket) {
        return ticket.technicianId === id;
      });

      affected.forEach(function (ticket) {
        var history = (ticket.history || []).concat([
          {
            id: Storage.uid("hst"),
            action: "Técnico desasignado",
            detail: technician.name + " fue eliminado del equipo. La solicitud queda sin asignar.",
            author: "Sistema",
            createdAt: Storage.nowISO()
          }
        ]);
        Storage.update("tickets", ticket.id, {
          technicianId: null,
          history: history
        });
      });

      Storage.remove("technicians", id);
      return { unassigned: affected.length };
    }
  };

  window.HD.services.technicians = technicians;
})();
