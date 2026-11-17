(function () {
  "use strict";

  window.HD = window.HD || {};
  window.HD.services = window.HD.services || {};

  var Storage = window.HD.Storage;
  var config = window.HD.config;

  function normalize(value) {
    return String(value || "").trim();
  }

  function decorate(category) {
    var tickets = Storage.getAll("tickets").filter(function (ticket) {
      return ticket.categoryId === category.id;
    });
    return Object.assign({}, category, {
      ticketCount: tickets.length,
      activeTicketCount: tickets.filter(function (ticket) {
        return config.activeStatuses.indexOf(ticket.status) !== -1;
      }).length
    });
  }

  function sortValue(category, key) {
    switch (key) {
      case "tickets":
        return category.ticketCount;
      case "priority":
        return config.priorities.indexOf(category.defaultPriority);
      case "createdAt":
        return new Date(category.createdAt).getTime();
      default:
        return (category.name || "").toLowerCase();
    }
  }

  var categories = {
    async list(query) {
      await Storage.wait(50);
      query = query || {};
      var search = normalize(query.search).toLowerCase();
      var items = Storage.getAll("categories").map(decorate);

      if (search) {
        items = items.filter(function (category) {
          return [category.name, category.description, category.defaultPriority]
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
      var category = Storage.getById("categories", id);
      return category ? decorate(category) : null;
    },

    async create(data) {
      await Storage.wait(110);
      var name = normalize(data.name);
      if (name.length < 3) throw new Error("El nombre de la categoría debe tener al menos 3 caracteres.");
      var exists = Storage.getAll("categories").some(function (category) {
        return category.name.toLowerCase() === name.toLowerCase();
      });
      if (exists) throw new Error("Ya existe una categoría con ese nombre.");

      var record = Storage.insert("categories", {
        name: name,
        description: normalize(data.description),
        color: data.color || config.categoryColors[0],
        defaultPriority: data.defaultPriority || "Media"
      });
      return decorate(record);
    },

    async update(id, data) {
      await Storage.wait(110);
      var current = Storage.getById("categories", id);
      if (!current) throw new Error("La categoría no existe.");

      var name = normalize(data.name);
      if (name.length < 3) throw new Error("El nombre de la categoría debe tener al menos 3 caracteres.");
      var exists = Storage.getAll("categories").some(function (category) {
        return category.id !== id && category.name.toLowerCase() === name.toLowerCase();
      });
      if (exists) throw new Error("Ya existe otra categoría con ese nombre.");

      var updated = Storage.update("categories", id, {
        name: name,
        description: normalize(data.description),
        color: data.color || current.color,
        defaultPriority: data.defaultPriority || current.defaultPriority
      });
      return decorate(updated);
    },

    async remove(id) {
      await Storage.wait(100);
      var category = Storage.getById("categories", id);
      if (!category) throw new Error("La categoría no existe.");
      var count = Storage.getAll("tickets").filter(function (ticket) {
        return ticket.categoryId === id;
      }).length;
      if (count > 0) {
        throw new Error(
          "No se puede eliminar «" + category.name + "»: tiene " + count +
          " solicitud" + (count === 1 ? "" : "es") + " asociada" + (count === 1 ? "" : "s") + "."
        );
      }
      Storage.remove("categories", id);
      return true;
    }
  };

  window.HD.services.categories = categories;
})();
