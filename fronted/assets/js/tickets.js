(function () {
  "use strict";

  window.HD = window.HD || {};
  window.HD.pages = window.HD.pages || {};

  var UI = window.HD.UI;
  var config = window.HD.config;

  var state = {
    page: 1,
    pageSize: 10,
    pages: 1,
    sortBy: "updatedAt",
    sortDir: "desc",
    search: "",
    status: "all",
    priority: "all",
    categoryId: "all",
    technicianId: "all"
  };

  var refs = {};
  var session = null;
  var lastResult = null;
  var loadToken = 0;

  function toDateInput(value) {
    if (!value) return "";
    var date = new Date(value);
    if (isNaN(date.getTime())) return "";
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
  }

  function fromDateInput(value) {
    return value ? new Date(value + "T12:00:00").toISOString() : null;
  }

  function userCell(user, fallback) {
    if (!user) return '<span class="text-muted">' + UI.escape(fallback || "No disponible") + "</span>";
    return (
      '<div class="cell-user">' +
      UI.avatar(user.name, "avatar--sm") +
      '<div class="cell-user-text">' +
      '<span class="cell-user-name">' + UI.escape(user.name) + "</span>" +
      '<span class="cell-user-sub">' + UI.escape(user.department || "—") + "</span>" +
      "</div></div>"
    );
  }

  function technicianCell(technician) {
    if (!technician) return '<span class="text-muted">Sin asignar</span>';
    return (
      '<div class="cell-user">' +
      UI.avatar(technician.name, "avatar--sm") +
      '<div class="cell-user-text">' +
      '<span class="cell-user-name">' + UI.escape(technician.name) + "</span>" +
      '<span class="cell-user-sub">' + UI.escape(technician.specialty || "Soporte") + "</span>" +
      "</div></div>"
    );
  }

  function buildOptions(items, placeholder, labelFn) {
    return (
      '<option value="">' + UI.escape(placeholder) + "</option>" +
      items
        .map(function (item) {
          return (
            '<option value="' + UI.escape(item.id) + '">' + UI.escape(labelFn(item)) + "</option>"
          );
        })
        .join("")
    );
  }

  function renderRows(result) {
    if (!result.items.length) {
      refs.body.innerHTML = UI.tableEmpty(
        8,
        "No hay solicitudes",
        "Ajusta los filtros o crea una nueva solicitud para empezar.",
        "search"
      );
      UI.refreshIcons();
      return;
    }

    refs.body.innerHTML = result.items
      .map(function (ticket) {
        var category = ticket.category;
        var color = UI.safeColor(category ? category.color : "", "#8b919c");
        return (
          '<tr class="is-clickable" data-id="' + UI.escape(ticket.id) + '">' +
          '<td><span class="code-chip">' + UI.escape(ticket.code) + "</span></td>" +
          "<td>" +
          '<span class="cell-main" title="' + UI.escape(ticket.title) + '">' + UI.escape(ticket.title) + "</span>" +
          '<span class="cell-sub"><span class="dot" style="background:' + color + '"></span>' +
          UI.escape(category ? category.name : "Sin categoría") + "</span>" +
          "</td>" +
          "<td>" + userCell(ticket.user, "Usuario eliminado") + "</td>" +
          "<td>" + technicianCell(ticket.technician) + "</td>" +
          "<td>" + UI.priorityBadge(ticket.priority) + "</td>" +
          "<td>" + UI.statusBadge(ticket.status) + "</td>" +
          '<td class="text-muted nowrap" title="' + UI.escape(UI.formatDateTime(ticket.updatedAt)) + '">' +
          UI.escape(UI.relativeTime(ticket.updatedAt)) + "</td>" +
          '<td class="td-actions"><div class="row-actions">' +
          '<button type="button" class="icon-btn" data-action="view" data-id="' + UI.escape(ticket.id) + '" title="Ver detalle" aria-label="Ver detalle">' +
          '<i data-lucide="eye"></i></button>' +
          '<button type="button" class="icon-btn" data-action="edit" data-id="' + UI.escape(ticket.id) + '" title="Editar" aria-label="Editar">' +
          '<i data-lucide="pencil"></i></button>' +
          '<button type="button" class="icon-btn icon-btn--danger" data-action="delete" data-id="' + UI.escape(ticket.id) + '" title="Eliminar" aria-label="Eliminar">' +
          '<i data-lucide="trash-2"></i></button>' +
          "</div></td>" +
          "</tr>"
        );
      })
      .join("");
    UI.refreshIcons();
  }

  function updateSortIndicators() {
    refs.table.querySelectorAll("th.sortable").forEach(function (th) {
      var key = th.getAttribute("data-sort");
      var sorted = key === state.sortBy;
      th.classList.toggle("is-sorted", sorted);
      var indicator = th.querySelector(".sort-indicator");
      if (indicator) {
        var icon = sorted ? (state.sortDir === "asc" ? "arrow-up" : "arrow-down") : "chevrons-up-down";
        indicator.innerHTML = '<i data-lucide="' + icon + '"></i>';
      }
    });
    UI.refreshIcons();
  }

  async function load() {
    var token = ++loadToken;
    refs.body.style.opacity = "0.45";

    try {
      var result = await window.HD.services.tickets.list(state);
      if (token !== loadToken) return;
      lastResult = result;
      state.page = result.page;
      state.pageSize = result.pageSize;
      state.pages = result.pages;

      renderRows(result);
      refs.footer.innerHTML = UI.pagination({
        page: result.page,
        pages: result.pages,
        total: result.total,
        pageSize: result.pageSize,
        label: "solicitudes"
      });
      UI.refreshIcons();
      updateSortIndicators();
    } catch (error) {
      UI.toast(error.message || "No se pudieron cargar las solicitudes.", "error");
    } finally {
      if (token === loadToken) refs.body.style.opacity = "";
    }
  }

  function fillStaticOptions(categories, technicians, users) {
    refs.filterStatus.innerHTML =
      '<option value="all">Todos los estados</option>' +
      config.statuses
        .map(function (status) {
          return '<option value="' + UI.escape(status) + '">' + UI.escape(status) + "</option>";
        })
        .join("");

    refs.filterPriority.innerHTML =
      '<option value="all">Todas las prioridades</option>' +
      config.priorities
        .map(function (priority) {
          return '<option value="' + UI.escape(priority) + '">' + UI.escape(priority) + "</option>";
        })
        .join("");

    refs.filterCategory.innerHTML =
      '<option value="all">Todas las categorías</option>' +
      categories
        .map(function (category) {
          return '<option value="' + UI.escape(category.id) + '">' + UI.escape(category.name) + "</option>";
        })
        .join("");

    refs.filterTechnician.innerHTML =
      '<option value="all">Todos los técnicos</option>' +
      '<option value="unassigned">Sin asignar</option>' +
      technicians
        .map(function (technician) {
          return (
            '<option value="' + UI.escape(technician.id) + '">' + UI.escape(technician.name) + "</option>"
          );
        })
        .join("");

    refs.formUser.innerHTML = buildOptions(users, "Selecciona un usuario", function (user) {
      return user.name + (user.status === "Inactivo" ? " (inactivo)" : "");
    });
    refs.formCategory.innerHTML = buildOptions(categories, "Selecciona una categoría", function (category) {
      return category.name;
    });
    refs.formTechnician.innerHTML = buildOptions(technicians, "Sin asignar", function (technician) {
      return technician.name + (technician.status === "Inactivo" ? " (inactivo)" : "");
    });
    refs.formPriority.innerHTML = UI.options(config.priorities, "Media");
    refs.formStatus.innerHTML = UI.options(config.statuses, "Abierto");
  }

  function applyUrlState(params, categories, technicians) {
    var query = params.get("q");
    if (query) {
      state.search = query;
      refs.search.value = query;
    }

    var status = params.get("status");
    if (status && config.statuses.indexOf(status) !== -1) {
      state.status = status;
      refs.filterStatus.value = status;
    }

    var priority = params.get("priority");
    if (priority && config.priorities.indexOf(priority) !== -1) {
      state.priority = priority;
      refs.filterPriority.value = priority;
    }

    var category = params.get("category");
    if (category && categories.some(function (item) { return item.id === category; })) {
      state.categoryId = category;
      refs.filterCategory.value = category;
    }

    var technician = params.get("technician");
    if (
      technician &&
      (technician === "unassigned" ||
        technicians.some(function (item) { return item.id === technician; }))
    ) {
      state.technicianId = technician;
      refs.filterTechnician.value = technician;
    }
  }

  function resetFormState() {
    refs.form.reset();
    UI.clearFormErrors(refs.form);
    refs.form.dataset.editingId = "";
    refs.form.querySelectorAll(".input, .select, .textarea").forEach(function (input) {
      input.classList.remove("is-invalid");
    });
  }

  function openForm(ticket) {
    resetFormState();
    refs.modalTitle.textContent = ticket ? "Editar solicitud" : "Nueva solicitud";
    refs.modalSubtitle.textContent = ticket
      ? "Actualiza la información de " + ticket.code + "."
      : "Registra una nueva incidencia o petición de soporte.";
    refs.submit.innerHTML = ticket
      ? '<i data-lucide="check"></i>Guardar cambios'
      : '<i data-lucide="plus"></i>Crear solicitud';

    if (ticket) {
      refs.form.dataset.editingId = ticket.id;
      refs.formTitle.value = ticket.title;
      refs.formDescription.value = ticket.description;
      refs.formUser.value = ticket.userId || "";
      refs.formCategory.value = ticket.categoryId || "";
      refs.formPriority.value = ticket.priority;
      refs.formStatus.value = ticket.status;
      refs.formTechnician.value = ticket.technicianId || "";
      refs.formDue.value = toDateInput(ticket.dueDate);
    } else {
      refs.formPriority.value = "Media";
      refs.formStatus.value = "Abierto";
      refs.formTechnician.value = "";
    }

    UI.openModal(refs.modal);
    UI.refreshIcons();
    setTimeout(function () {
      refs.formTitle.focus();
    }, 80);
  }

  async function editTicket(id) {
    var ticket =
      lastResult && lastResult.items.find(function (item) { return item.id === id; });
    if (!ticket) ticket = await window.HD.services.tickets.get(id);
    if (ticket) openForm(ticket);
  }

  async function deleteTicket(id) {
    var ticket =
      lastResult && lastResult.items.find(function (item) { return item.id === id; });
    if (!ticket) ticket = await window.HD.services.tickets.get(id);
    if (!ticket) return;

    var accepted = await UI.confirm({
      title: "Eliminar solicitud",
      message:
        "Se eliminará la solicitud " + ticket.code + " «" + ticket.title +
        "». Esta acción no se puede deshacer.",
      confirmText: "Eliminar solicitud",
      tone: "danger"
    });
    if (!accepted) return;

    try {
      await window.HD.services.tickets.remove(id);
      UI.toast("Solicitud eliminada correctamente.", "success");
      if (lastResult && lastResult.items.length === 1 && state.page > 1) state.page -= 1;
      await load();
    } catch (error) {
      UI.toast(error.message || "No se pudo eliminar la solicitud.", "error");
    }
  }

  function bindForm() {
    refs.form.addEventListener("input", function (event) {
      if (event.target.matches(".input, .select, .textarea")) {
        UI.setFieldError(event.target, "");
      }
    });

    refs.form.addEventListener("submit", async function (event) {
      event.preventDefault();
      UI.clearFormErrors(refs.form);

      var title = refs.formTitle.value.trim();
      var description = refs.formDescription.value.trim();
      var valid = true;

      if (title.length < 5) {
        UI.setFieldError(refs.formTitle, "El título debe tener al menos 5 caracteres.");
        valid = false;
      }
      if (description.length < 10) {
        UI.setFieldError(refs.formDescription, "La descripción debe tener al menos 10 caracteres.");
        valid = false;
      }
      if (!refs.formUser.value) {
        UI.setFieldError(refs.formUser, "Selecciona un solicitante.");
        valid = false;
      }
      if (!refs.formCategory.value) {
        UI.setFieldError(refs.formCategory, "Selecciona una categoría.");
        valid = false;
      }

      if (!valid) {
        var firstError = refs.form.querySelector(".field.has-error .input, .field.has-error .select, .field.has-error .textarea");
        if (firstError) firstError.focus();
        return;
      }

      var editingId = refs.form.dataset.editingId;
      var payload = {
        title: title,
        description: description,
        userId: refs.formUser.value,
        categoryId: refs.formCategory.value,
        priority: refs.formPriority.value,
        status: refs.formStatus.value,
        technicianId: refs.formTechnician.value || null,
        dueDate: fromDateInput(refs.formDue.value)
      };
      var author = session && session.user ? session.user.name : "Sistema";

      UI.setLoading(refs.submit, true, "Guardando…");
      try {
        if (editingId) {
          await window.HD.services.tickets.update(editingId, payload, { author: author });
          UI.toast("Solicitud actualizada correctamente.", "success");
        } else {
          await window.HD.services.tickets.create(payload, { author: author });
          UI.toast("Solicitud creada correctamente.", "success");
          state.page = 1;
          state.sortBy = "updatedAt";
          state.sortDir = "desc";
          updateSortIndicators();
        }
        UI.closeModal(refs.modal);
        await load();
      } catch (error) {
        UI.toast(error.message || "No se pudo guardar la solicitud.", "error");
      } finally {
        UI.setLoading(refs.submit, false);
        refs.submit.innerHTML = refs.form.dataset.editingId
          ? '<i data-lucide="check"></i>Guardar cambios'
          : '<i data-lucide="plus"></i>Crear solicitud';
        UI.refreshIcons();
      }
    });
  }

  function bindFilters() {
    refs.search.addEventListener(
      "input",
      UI.debounce(function () {
        state.search = refs.search.value;
        state.page = 1;
        load();
      }, 300)
    );

    var map = [
      [refs.filterStatus, "status"],
      [refs.filterPriority, "priority"],
      [refs.filterCategory, "categoryId"],
      [refs.filterTechnician, "technicianId"]
    ];
    map.forEach(function (entry) {
      entry[0].addEventListener("change", function () {
        state[entry[1]] = entry[0].value;
        state.page = 1;
        load();
      });
    });

    refs.clear.addEventListener("click", function () {
      state.search = "";
      state.status = "all";
      state.priority = "all";
      state.categoryId = "all";
      state.technicianId = "all";
      state.page = 1;
      refs.search.value = "";
      refs.filterStatus.value = "all";
      refs.filterPriority.value = "all";
      refs.filterCategory.value = "all";
      refs.filterTechnician.value = "all";
      load();
    });
  }

  function bindTable() {
    refs.table.querySelector("thead").addEventListener("click", function (event) {
      var th = event.target.closest("th[data-sort]");
      if (!th) return;
      var key = th.getAttribute("data-sort");
      if (state.sortBy === key) {
        state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
      } else {
        state.sortBy = key;
        state.sortDir = ["code", "title", "user", "technician"].indexOf(key) !== -1 ? "asc" : "desc";
      }
      state.page = 1;
      load();
    });

    refs.body.addEventListener("click", function (event) {
      var actionButton = event.target.closest("[data-action]");
      if (actionButton) {
        event.stopPropagation();
        var id = actionButton.getAttribute("data-id");
        var action = actionButton.getAttribute("data-action");
        if (action === "view") {
          window.location.href = "ticket-detail.html?id=" + encodeURIComponent(id);
        } else if (action === "edit") {
          editTicket(id);
        } else if (action === "delete") {
          deleteTicket(id);
        }
        return;
      }
      var row = event.target.closest("tr[data-id]");
      if (row) {
        window.location.href = "ticket-detail.html?id=" + encodeURIComponent(row.getAttribute("data-id"));
      }
    });
  }

  function bindExport() {
    refs.export.addEventListener("click", async function () {
      UI.setLoading(refs.export, true, "Exportando…");
      try {
        var data = await window.HD.services.tickets.list(
          Object.assign({}, state, { page: 1, pageSize: 10000 })
        );
        if (!data.items.length) {
          UI.toast("No hay solicitudes que coincidan con los filtros.", "warning");
          return;
        }
        var rows = [
          ["Código", "Título", "Estado", "Prioridad", "Categoría", "Solicitante", "Técnico", "Creado", "Actualizado"]
        ];
        data.items.forEach(function (ticket) {
          rows.push([
            ticket.code,
            ticket.title,
            ticket.status,
            ticket.priority,
            ticket.category ? ticket.category.name : "",
            ticket.user ? ticket.user.name : "",
            ticket.technician ? ticket.technician.name : "Sin asignar",
            UI.formatDateTime(ticket.createdAt),
            UI.formatDateTime(ticket.updatedAt)
          ]);
        });
        var stamp = new Date().toISOString().slice(0, 10);
        UI.downloadCSV("solicitudes-" + stamp + ".csv", rows);
        UI.toast(data.items.length + " solicitudes exportadas.", "success");
      } catch (error) {
        UI.toast(error.message || "No se pudo exportar el archivo.", "error");
      } finally {
        UI.setLoading(refs.export, false);
      }
    });
  }

  window.HD.pages.tickets = async function () {
    refs = {
      search: document.getElementById("ticket-search"),
      filterStatus: document.getElementById("filter-status"),
      filterPriority: document.getElementById("filter-priority"),
      filterCategory: document.getElementById("filter-category"),
      filterTechnician: document.getElementById("filter-technician"),
      clear: document.getElementById("clear-filters"),
      export: document.getElementById("export-tickets"),
      table: document.getElementById("tickets-table"),
      body: document.getElementById("tickets-body"),
      footer: document.getElementById("tickets-footer"),
      modal: document.getElementById("ticket-modal"),
      form: document.getElementById("ticket-form"),
      formTitle: document.getElementById("ticket-title"),
      formDescription: document.getElementById("ticket-description"),
      formUser: document.getElementById("ticket-user"),
      formCategory: document.getElementById("ticket-category"),
      formPriority: document.getElementById("ticket-priority"),
      formStatus: document.getElementById("ticket-status"),
      formTechnician: document.getElementById("ticket-technician"),
      formDue: document.getElementById("ticket-due"),
      submit: document.getElementById("ticket-submit"),
      modalTitle: document.getElementById("ticket-modal-title"),
      modalSubtitle: document.getElementById("ticket-modal-subtitle")
    };

    session = await window.HD.services.auth.getSession();

    var collections = await Promise.all([
      window.HD.services.categories.list(),
      window.HD.services.technicians.list(),
      window.HD.services.users.list()
    ]);
    var categories = collections[0];
    var technicians = collections[1];
    var users = collections[2];

    fillStaticOptions(categories, technicians, users);
    applyUrlState(new URLSearchParams(window.location.search), categories, technicians);
    bindFilters();
    bindTable();
    bindForm();
    bindExport();

    UI.bindPagination(refs.footer, state, function (patch) {
      Object.assign(state, patch);
      load();
    });

    document.getElementById("new-ticket-btn").addEventListener("click", function () {
      openForm(null);
    });

    await load();
    updateSortIndicators();

    if (new URLSearchParams(window.location.search).get("new") === "1") {
      openForm(null);
    }
  };
})();
