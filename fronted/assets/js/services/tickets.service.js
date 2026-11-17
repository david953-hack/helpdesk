(function () {
  "use strict";

  window.HD = window.HD || {};
  window.HD.services = window.HD.services || {};

  var Storage = window.HD.Storage;
  var config = window.HD.config;

  function normalize(value) {
    return String(value || "").trim();
  }

  function hydrate(ticket) {
    return Object.assign({}, ticket, {
      user: Storage.getById("users", ticket.userId),
      category: Storage.getById("categories", ticket.categoryId),
      technician: Storage.getById("technicians", ticket.technicianId)
    });
  }

  function historyEntry(action, detail, author) {
    return {
      id: Storage.uid("hst"),
      action: action,
      detail: detail,
      author: author || "Sistema",
      createdAt: Storage.nowISO()
    };
  }

  function sortValue(ticket, key) {
    switch (key) {
      case "code":
        return Number(ticket.number) || 0;
      case "title":
        return (ticket.title || "").toLowerCase();
      case "status":
        return config.statuses.indexOf(ticket.status);
      case "priority":
        return config.priorities.indexOf(ticket.priority);
      case "createdAt":
        return new Date(ticket.createdAt).getTime();
      case "updatedAt":
        return new Date(ticket.updatedAt || ticket.createdAt).getTime();
      case "user":
        return (ticket.user && ticket.user.name ? ticket.user.name : "").toLowerCase();
      case "technician":
        return (ticket.technician && ticket.technician.name ? ticket.technician.name : "\uffff").toLowerCase();
      case "category":
        return (ticket.category && ticket.category.name ? ticket.category.name : "").toLowerCase();
      default:
        return "";
    }
  }

  function matchesSearch(ticket, search) {
    var haystack = [
      ticket.title,
      ticket.code,
      ticket.description,
      ticket.user ? ticket.user.name : "",
      ticket.user ? ticket.user.email : "",
      ticket.category ? ticket.category.name : "",
      ticket.technician ? ticket.technician.name : ""
    ]
      .join(" ")
      .toLowerCase();
    return haystack.indexOf(search) !== -1;
  }

  var tickets = {
    async list(query) {
      await Storage.wait(80);
      query = query || {};
      var search = normalize(query.search).toLowerCase();
      var items = Storage.getAll("tickets").map(hydrate);

      if (query.status && query.status !== "all") {
        items = items.filter(function (ticket) {
          return ticket.status === query.status;
        });
      }
      if (query.priority && query.priority !== "all") {
        items = items.filter(function (ticket) {
          return ticket.priority === query.priority;
        });
      }
      if (query.categoryId && query.categoryId !== "all") {
        items = items.filter(function (ticket) {
          return ticket.categoryId === query.categoryId;
        });
      }
      if (query.technicianId && query.technicianId !== "all") {
        if (query.technicianId === "unassigned") {
          items = items.filter(function (ticket) {
            return !ticket.technicianId;
          });
        } else {
          items = items.filter(function (ticket) {
            return ticket.technicianId === query.technicianId;
          });
        }
      }
      if (query.from) {
        var fromTime = new Date(query.from).getTime();
        items = items.filter(function (ticket) {
          return new Date(ticket.createdAt).getTime() >= fromTime;
        });
      }
      if (search) {
        items = items.filter(function (ticket) {
          return matchesSearch(ticket, search);
        });
      }

      var direction = query.sortDir === "asc" ? 1 : -1;
      var key = query.sortBy || "updatedAt";
      items.sort(function (a, b) {
        var va = sortValue(a, key);
        var vb = sortValue(b, key);
        if (typeof va === "number" && typeof vb === "number") {
          if (va === vb) return 0;
          return (va - vb) * direction;
        }
        var result = String(va).localeCompare(String(vb), "es");
        return result === 0 ? 0 : result * direction;
      });

      var total = items.length;
      var pageSize = Number(query.pageSize) || 10;
      var pages = Math.max(1, Math.ceil(total / pageSize));
      var page = Math.min(Math.max(1, Number(query.page) || 1), pages);
      var start = (page - 1) * pageSize;

      return {
        items: items.slice(start, start + pageSize),
        total: total,
        page: page,
        pages: pages,
        pageSize: pageSize
      };
    },

    async get(id) {
      await Storage.wait(40);
      var ticket = Storage.getById("tickets", id);
      return ticket ? hydrate(ticket) : null;
    },

    async recent(limit) {
      var items = Storage.getAll("tickets")
        .map(hydrate)
        .sort(function (a, b) {
          return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        });
      return items.slice(0, limit || 6);
    },

    async countOpen() {
      return Storage.getAll("tickets").filter(function (ticket) {
        return config.activeStatuses.indexOf(ticket.status) !== -1;
      }).length;
    },

    async countByUser(userId) {
      return Storage.getAll("tickets").filter(function (ticket) {
        return ticket.userId === userId;
      }).length;
    },

    async countByCategory(categoryId) {
      return Storage.getAll("tickets").filter(function (ticket) {
        return ticket.categoryId === categoryId;
      }).length;
    },

    async create(data, meta) {
      await Storage.wait(180);
      meta = meta || {};
      var title = normalize(data.title);
      var description = normalize(data.description);
      if (title.length < 5) throw new Error("El título debe tener al menos 5 caracteres.");
      if (description.length < 10) throw new Error("La descripción debe tener al menos 10 caracteres.");
      if (!data.userId) throw new Error("Selecciona un solicitante.");
      if (!data.categoryId) throw new Error("Selecciona una categoría.");

      var user = Storage.getById("users", data.userId);
      if (!user) throw new Error("El solicitante seleccionado no existe.");
      var category = Storage.getById("categories", data.categoryId);
      if (!category) throw new Error("La categoría seleccionada no existe.");
      var technician = data.technicianId
        ? Storage.getById("technicians", data.technicianId)
        : null;

      var status = data.status || "Abierto";
      if (config.statuses.indexOf(status) === -1) status = "Abierto";
      var priority = data.priority || "Media";
      if (config.priorities.indexOf(priority) === -1) priority = "Media";

      var all = Storage.getAll("tickets");
      var maxNumber = all.reduce(function (max, ticket) {
        return Math.max(max, Number(ticket.number) || 1000);
      }, 1000);
      var number = maxNumber + 1;
      var now = Storage.nowISO();
      var author = meta.author || "Sistema";
      var isResolved = config.resolvedStatuses.indexOf(status) !== -1;

      var history = [
        historyEntry(
          "Solicitud creada",
          "Solicitud registrada por " + author + " para " + user.name + ".",
          author
        )
      ];

      if (technician) {
        history.push(
          historyEntry("Técnico asignado", "Asignada a " + technician.name + ".", author)
        );
      }
      if (isResolved) {
        history.push(
          historyEntry("Estado actualizado", "Solicitud marcada como " + status + ".", author)
        );
      }

      var saved = Storage.insert("tickets", {
        number: number,
        code: "HD-" + number,
        title: title,
        description: description,
        categoryId: category.id,
        userId: user.id,
        technicianId: technician ? technician.id : null,
        priority: priority,
        status: status,
        dueDate: data.dueDate || null,
        resolvedAt: isResolved ? now : null,
        comments: [],
        history: history,
        createdAt: now,
        updatedAt: now
      });

      return hydrate(saved);
    },

    async update(id, data, meta) {
      await Storage.wait(150);
      meta = meta || {};
      var current = Storage.getById("tickets", id);
      if (!current) throw new Error("La solicitud no existe.");

      var patch = {};
      var author = meta.author || "Sistema";
      var history = (current.history || []).slice();

      if (data.title !== undefined) {
        var title = normalize(data.title);
        if (title.length < 5) throw new Error("El título debe tener al menos 5 caracteres.");
        patch.title = title;
      }
      if (data.description !== undefined) {
        var description = normalize(data.description);
        if (description.length < 10) throw new Error("La descripción debe tener al menos 10 caracteres.");
        patch.description = description;
      }
      if (data.userId !== undefined && data.userId !== current.userId) {
        var user = Storage.getById("users", data.userId);
        if (!user) throw new Error("El solicitante seleccionado no existe.");
        patch.userId = user.id;
        history.push(
          historyEntry("Solicitante actualizado", "Ahora la solicitud pertenece a " + user.name + ".", author)
        );
      }
      if (data.categoryId !== undefined && data.categoryId !== current.categoryId) {
        var category = Storage.getById("categories", data.categoryId);
        if (!category) throw new Error("La categoría seleccionada no existe.");
        patch.categoryId = category.id;
        history.push(
          historyEntry("Categoría actualizada", "Categoría cambiada a " + category.name + ".", author)
        );
      }
      if (data.priority !== undefined && data.priority !== current.priority) {
        if (config.priorities.indexOf(data.priority) === -1) throw new Error("Prioridad no válida.");
        patch.priority = data.priority;
        history.push(
          historyEntry(
            "Prioridad actualizada",
            current.priority + " → " + data.priority + ".",
            author
          )
        );
      }
      if (data.technicianId !== undefined && data.technicianId !== current.technicianId) {
        var technicianId = data.technicianId || null;
        var technician = technicianId ? Storage.getById("technicians", technicianId) : null;
        if (technicianId && !technician) throw new Error("El técnico seleccionado no existe.");
        patch.technicianId = technician ? technician.id : null;
        history.push(
          historyEntry(
            "Técnico actualizado",
            technician ? "Asignada a " + technician.name + "." : "La solicitud queda sin asignar.",
            author
          )
        );
      }
      if (data.status !== undefined && data.status !== current.status) {
        if (config.statuses.indexOf(data.status) === -1) throw new Error("Estado no válido.");
        patch.status = data.status;
        history.push(
          historyEntry("Estado actualizado", current.status + " → " + data.status + ".", author)
        );
        if (config.resolvedStatuses.indexOf(data.status) !== -1) {
          patch.resolvedAt = Storage.nowISO();
        } else {
          patch.resolvedAt = null;
        }
      }
      if (data.dueDate !== undefined) {
        patch.dueDate = data.dueDate || null;
      }

      patch.history = history;
      var updated = Storage.update("tickets", id, patch);
      return hydrate(updated);
    },

    async changeStatus(id, status, author) {
      return tickets.update(id, { status: status }, { author: author });
    },

    async assign(id, technicianId, author) {
      return tickets.update(id, { technicianId: technicianId || null }, { author: author });
    },

    async addComment(id, data) {
      await Storage.wait(120);
      var current = Storage.getById("tickets", id);
      if (!current) throw new Error("La solicitud no existe.");
      var message = normalize(data.message);
      if (message.length < 2) throw new Error("Escribe un comentario antes de enviarlo.");

      var now = Storage.nowISO();
      var authorName = normalize(data.authorName) || "Usuario";
      var role = data.role || "Usuario";
      var comment = {
        id: Storage.uid("cmt"),
        authorName: authorName,
        role: role,
        message: message,
        createdAt: now
      };
      var history = (current.history || []).concat([
        {
          id: Storage.uid("hst"),
          action: "Comentario agregado",
          detail: authorName + " añadió un comentario.",
          author: authorName,
          createdAt: now
        }
      ]);

      var updated = Storage.update("tickets", id, {
        comments: (current.comments || []).concat([comment]),
        history: history,
        updatedAt: now
      });
      return hydrate(updated);
    },

    async remove(id) {
      await Storage.wait(120);
      var ticket = Storage.getById("tickets", id);
      if (!ticket) throw new Error("La solicitud no existe.");
      Storage.remove("tickets", id);
      return true;
    }
  };

  window.HD.services.tickets = tickets;
})();
