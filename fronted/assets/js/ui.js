(function () {
  "use strict";

  window.HD = window.HD || {};

  var config = window.HD.config;
  var modalStack = [];

  function escapeHTML(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
    }
  }

  function initials(name) {
    var parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return "?";
    var first = parts[0].charAt(0);
    var second = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
    return (first + second).toUpperCase();
  }

  function hashHue(text) {
    var hash = 0;
    var value = String(text || "user");
    for (var i = 0; i < value.length; i += 1) {
      hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
  }

  function avatar(name, extra) {
    return (
      '<span class="avatar ' + (extra || "") + '" style="--avatar-h:' + hashHue(name) + '">' +
      escapeHTML(initials(name)) +
      "</span>"
    );
  }

  function safeColor(value, fallback) {
    return /^#[0-9a-fA-F]{6}$/.test(String(value || "")) ? value : fallback || "#5b5bd6";
  }

  function formatDate(value, options) {
    if (!value) return "—";
    var date = new Date(value);
    if (isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat(
      "es-ES",
      options || { day: "numeric", month: "short", year: "numeric" }
    )
      .format(date)
      .replace(".", "");
  }

  function formatDateTime(value) {
    return formatDate(value, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatShortDate(value) {
    return formatDate(value, { day: "2-digit", month: "short" });
  }

  function relativeTime(value) {
    if (!value) return "—";
    var time = new Date(value).getTime();
    if (isNaN(time)) return "—";
    var diff = Date.now() - time;
    if (diff < -60000) return formatDate(value);
    if (diff < 45000) return "ahora mismo";
    var minutes = Math.round(diff / 60000);
    if (minutes < 60) return "hace " + minutes + " min";
    var hours = Math.round(minutes / 60);
    if (hours < 24) return "hace " + hours + " h";
    var days = Math.round(hours / 24);
    if (days < 30) return "hace " + days + " día" + (days === 1 ? "" : "s");
    var months = Math.round(days / 30);
    if (months < 12) return "hace " + months + " mes" + (months === 1 ? "" : "es");
    var years = Math.round(months / 12);
    return "hace " + years + " año" + (years === 1 ? "" : "s");
  }

  function formatHours(hours) {
    if (hours === null || hours === undefined || isNaN(Number(hours))) return "—";
    var value = Number(hours);
    if (value <= 0) return "—";
    if (value < 24) return (Math.round(value * 10) / 10) + " h";
    var days = value / 24;
    return (Math.round(days * 10) / 10) + " d";
  }

  function badge(label, tone) {
    return (
      '<span class="badge badge--' + (tone || "neutral") + '">' +
      '<span class="badge-dot"></span>' +
      escapeHTML(label) +
      "</span>"
    );
  }

  function statusBadge(status) {
    var meta = config.statusMeta[status];
    return badge(status, meta ? meta.tone : "neutral");
  }

  function priorityBadge(priority) {
    var meta = config.priorityMeta[priority];
    return badge(priority, meta ? meta.tone : "neutral");
  }

  function openModal(modal) {
    if (!modal || modal.classList.contains("is-open")) return;
    modalStack.push({ el: modal, previous: document.activeElement });
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    refreshIcons();
    setTimeout(function () {
      var target = modal.querySelector("[autofocus], input:not([type='hidden']), select, textarea, button");
      if (target) target.focus();
    }, 60);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    for (var i = modalStack.length - 1; i >= 0; i -= 1) {
      if (modalStack[i].el === modal) {
        var previous = modalStack[i].previous;
        modalStack.splice(i, 1);
        if (previous && typeof previous.focus === "function") {
          try {
            previous.focus();
          } catch (error) {
            /* noop */
          }
        }
        break;
      }
    }
    if (!modalStack.length) document.body.style.overflow = "";
  }

  function closeTopModal() {
    if (!modalStack.length) return false;
    closeModal(modalStack[modalStack.length - 1].el);
    return true;
  }

  function initGlobal() {
    if (initGlobal.done) return;
    initGlobal.done = true;

    document.addEventListener("click", function (event) {
      var closer = event.target.closest("[data-modal-close]");
      if (closer) {
        closeModal(closer.closest(".modal-backdrop"));
        return;
      }
      if (event.target.classList && event.target.classList.contains("modal-backdrop")) {
        closeModal(event.target);
      }
    });

    document.addEventListener("keydown", function (event) {
      var current = modalStack.length ? modalStack[modalStack.length - 1].el : null;
      if (!current) return;

      if (event.key === "Escape") {
        closeModal(current);
        return;
      }

      if (event.key === "Tab") {
        var focusable = current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }

  function confirmAction(options) {
    var opts = Object.assign(
      {
        title: "Confirmar acción",
        message: "Esta acción no se puede deshacer.",
        confirmText: "Confirmar",
        cancelText: "Cancelar",
        tone: "danger",
        icon: "alert-triangle"
      },
      options || {}
    );

    return new Promise(function (resolve) {
      var backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";
      backdrop.setAttribute("aria-hidden", "true");
      backdrop.innerHTML =
        '<div class="modal modal--sm" role="alertdialog" aria-modal="true">' +
        '<div class="confirm-body">' +
        '<div class="confirm-icon confirm-icon--' + (opts.tone === "danger" ? "danger" : "accent") + '">' +
        '<i data-lucide="' + opts.icon + '"></i>' +
        "</div>" +
        '<div style="min-width:0">' +
        '<p class="confirm-title">' + escapeHTML(opts.title) + "</p>" +
        '<p class="confirm-text">' + escapeHTML(opts.message) + "</p>" +
        "</div>" +
        "</div>" +
        '<div class="modal-footer" style="padding:0 22px 18px;border:0;margin:0">' +
        '<button type="button" class="btn btn--secondary" data-cancel>' + escapeHTML(opts.cancelText) + "</button>" +
        '<button type="button" class="btn ' + (opts.tone === "danger" ? "btn--danger" : "btn--primary") + '" data-confirm>' + escapeHTML(opts.confirmText) + "</button>" +
        "</div>" +
        "</div>";

      document.body.appendChild(backdrop);

      var settled = false;
      function finish(result) {
        if (settled) return;
        settled = true;
        document.removeEventListener("keydown", onKey);
        closeModal(backdrop);
        setTimeout(function () {
          if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        }, 180);
        resolve(result);
      }

      function onKey(event) {
        if (event.key === "Escape") finish(false);
      }

      backdrop.querySelector("[data-confirm]").addEventListener("click", function () {
        finish(true);
      });
      backdrop.querySelector("[data-cancel]").addEventListener("click", function () {
        finish(false);
      });
      backdrop.addEventListener("click", function (event) {
        if (event.target === backdrop) finish(false);
      });
      backdrop.querySelector(".modal").addEventListener("click", function (event) {
        if (event.target.closest("[data-modal-close]")) finish(false);
      });
      document.addEventListener("keydown", onKey);
      openModal(backdrop);
      setTimeout(function () {
        var button = backdrop.querySelector("[data-confirm]");
        if (button) button.focus();
      }, 80);
    });
  }

  function toast(message, type, title) {
    var tone = type || "success";
    var icons = {
      success: "check-circle",
      error: "alert-circle",
      warning: "alert-triangle",
      info: "info"
    };
    var titles = {
      success: "Listo",
      error: "No se pudo completar",
      warning: "Atención",
      info: "Información"
    };
    var container = document.getElementById("toast-stack");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-stack";
      container.className = "toast-stack";
      container.setAttribute("aria-live", "polite");
      document.body.appendChild(container);
    }

    var element = document.createElement("div");
    element.className = "toast toast--" + tone;
    element.setAttribute("role", "status");
    element.innerHTML =
      '<span class="toast-icon"><i data-lucide="' + (icons[tone] || "info") + '"></i></span>' +
      '<div class="toast-content">' +
      '<p class="toast-title">' + escapeHTML(title === undefined ? titles[tone] : title) + "</p>" +
      '<p class="toast-message">' + escapeHTML(message) + "</p>" +
      "</div>" +
      '<button type="button" class="toast-close" aria-label="Cerrar notificación"><i data-lucide="x"></i></button>';

    container.appendChild(element);
    refreshIcons();

    var timer = setTimeout(dismiss, 4300);

    function dismiss() {
      clearTimeout(timer);
      element.classList.remove("is-visible");
      setTimeout(function () {
        if (element.parentNode) element.parentNode.removeChild(element);
      }, 220);
    }

    element.querySelector(".toast-close").addEventListener("click", dismiss);
    requestAnimationFrame(function () {
      element.classList.add("is-visible");
    });
  }

  function emptyState(icon, title, text, action) {
    return (
      '<div class="empty-state">' +
      '<span class="empty-state-icon"><i data-lucide="' + (icon || "inbox") + '"></i></span>' +
      '<p class="empty-state-title">' + escapeHTML(title) + "</p>" +
      '<p class="empty-state-text">' + escapeHTML(text || "") + "</p>" +
      (action || "") +
      "</div>"
    );
  }

  function tableEmpty(colspan, title, text, icon) {
    return (
      '<tr><td colspan="' + colspan + '">' +
      '<div class="table-empty">' +
      '<i data-lucide="' + (icon || "inbox") + '"></i>' +
      '<span class="table-empty-title">' + escapeHTML(title) + "</span>" +
      '<span class="table-empty-text">' + escapeHTML(text || "") + "</span>" +
      "</div>" +
      "</td></tr>"
    );
  }

  function pageItems(page, pages) {
    if (pages <= 7) {
      var all = [];
      for (var i = 1; i <= pages; i += 1) all.push(i);
      return all;
    }
    var items = [1];
    if (page > 3) items.push("...");
    var start = Math.max(2, page - 1);
    var end = Math.min(pages - 1, page + 1);
    for (var index = start; index <= end; index += 1) items.push(index);
    if (page < pages - 2) items.push("...");
    items.push(pages);
    return items;
  }

  function pagination(options) {
    var page = options.page;
    var pages = options.pages;
    var total = options.total;
    var pageSize = options.pageSize;
    var label = options.label || "registros";
    var start = total ? (page - 1) * pageSize + 1 : 0;
    var end = Math.min(page * pageSize, total);
    var sizes = options.pageSizes || [10, 20, 50];
    var numbers = pageItems(page, pages);

    return (
      '<div class="pagination-info">Mostrando <strong>' + start + "–" + end +
      "</strong> de <strong>" + total + "</strong> " + escapeHTML(label) + "</div>" +
      '<div class="pagination-controls">' +
      '<select class="select select--sm" data-page-size aria-label="Registros por página">' +
      sizes
        .map(function (size) {
          return (
            '<option value="' + size + '"' + (size === pageSize ? " selected" : "") + ">" +
            size + " / pág.</option>"
          );
        })
        .join("") +
      "</select>" +
      '<div class="pager">' +
      '<button type="button" class="icon-btn" data-goto="' + (page - 1) + '"' +
      (page <= 1 ? " disabled" : "") + ' aria-label="Página anterior"><i data-lucide="chevron-left"></i></button>' +
      numbers
        .map(function (number) {
          if (number === "...") return '<span class="page-ellipsis">…</span>';
          return (
            '<button type="button" class="page-btn' + (number === page ? " is-active" : "") +
            '" data-goto="' + number + '"' + (number === page ? ' aria-current="page"' : "") + ">" +
            number + "</button>"
          );
        })
        .join("") +
      '<button type="button" class="icon-btn" data-goto="' + (page + 1) + '"' +
      (page >= pages ? " disabled" : "") + ' aria-label="Página siguiente"><i data-lucide="chevron-right"></i></button>' +
      "</div></div>"
    );
  }

  function bindPagination(container, state, onChange) {
    if (!container || container.dataset.paginationBound === "true") return;
    container.dataset.paginationBound = "true";
    container.addEventListener("click", function (event) {
      var button = event.target.closest("[data-goto]");
      if (!button || button.disabled) return;
      var page = Number(button.getAttribute("data-goto"));
      if (!page || page < 1 || page > state.pages || page === state.page) return;
      onChange({ page: page });
    });
    container.addEventListener("change", function (event) {
      if (!event.target.matches("[data-page-size]")) return;
      onChange({ page: 1, pageSize: Number(event.target.value) });
    });
  }

  function options(values, selected, placeholder) {
    var html = placeholder
      ? '<option value="">' + escapeHTML(placeholder) + "</option>"
      : "";
    return (
      html +
      values
        .map(function (value) {
          var isSelected = String(value) === String(selected || "");
          return (
            '<option value="' + escapeHTML(value) + '"' + (isSelected ? " selected" : "") + ">" +
            escapeHTML(value) + "</option>"
          );
        })
        .join("")
    );
  }

  function setFieldError(input, message) {
    if (!input) return;
    var field = input.closest(".field");
    if (!field) return;
    field.classList.toggle("has-error", Boolean(message));
    var error = field.querySelector(".field-error");
    if (error) error.textContent = message || "";
  }

  function clearFormErrors(form) {
    if (!form) return;
    form.querySelectorAll(".field.has-error").forEach(function (field) {
      field.classList.remove("has-error");
    });
    form.querySelectorAll(".field-error").forEach(function (error) {
      error.textContent = "";
    });
  }

  function setLoading(button, loading, label) {
    if (!button) return;
    if (loading) {
      if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.innerHTML =
        '<i data-lucide="loader" class="is-spinning"></i> ' +
        escapeHTML(label || "Procesando…");
      refreshIcons();
    } else {
      if (button.dataset.originalHtml) {
        button.innerHTML = button.dataset.originalHtml;
        delete button.dataset.originalHtml;
      }
      button.disabled = false;
      refreshIcons();
    }
  }

  function downloadCSV(filename, rows) {
    var csv = rows
      .map(function (row) {
        return row
          .map(function (cell) {
            return '"' + String(cell === undefined || cell === null ? "" : cell).replace(/"/g, '""') + '"';
          })
          .join(",");
      })
      .join("\r\n");
    var blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 500);
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments;
      var context = this;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, wait || 250);
    };
  }

  function initChartDefaults() {
    if (!window.Chart) return;
    window.Chart.defaults.font.family =
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    window.Chart.defaults.font.size = 12;
    window.Chart.defaults.color = "#8c93a0";
    window.Chart.defaults.borderColor = "#eef0f3";
    window.Chart.defaults.plugins.legend.labels.usePointStyle = true;
    window.Chart.defaults.plugins.legend.labels.boxWidth = 8;
    window.Chart.defaults.plugins.legend.labels.boxHeight = 8;
    window.Chart.defaults.plugins.legend.labels.padding = 16;
    window.Chart.defaults.plugins.tooltip.backgroundColor = "#15171c";
    window.Chart.defaults.plugins.tooltip.titleFont = { size: 12, weight: "600" };
    window.Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };
    window.Chart.defaults.plugins.tooltip.padding = 10;
    window.Chart.defaults.plugins.tooltip.cornerRadius = 8;
    window.Chart.defaults.plugins.tooltip.displayColors = true;
    window.Chart.defaults.plugins.tooltip.boxPadding = 4;
  }

  window.HD.UI = {
    escape: escapeHTML,
    refreshIcons: refreshIcons,
    initials: initials,
    avatar: avatar,
    safeColor: safeColor,
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    formatShortDate: formatShortDate,
    relativeTime: relativeTime,
    formatHours: formatHours,
    statusBadge: statusBadge,
    priorityBadge: priorityBadge,
    badge: badge,
    openModal: openModal,
    closeModal: closeModal,
    closeTopModal: closeTopModal,
    initGlobal: initGlobal,
    confirm: confirmAction,
    toast: toast,
    emptyState: emptyState,
    tableEmpty: tableEmpty,
    pagination: pagination,
    bindPagination: bindPagination,
    options: options,
    setFieldError: setFieldError,
    clearFormErrors: clearFormErrors,
    setLoading: setLoading,
    downloadCSV: downloadCSV,
    debounce: debounce,
    initChartDefaults: initChartDefaults
  };
})();
