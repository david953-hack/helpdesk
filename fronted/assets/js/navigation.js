(function () {
  "use strict";

  window.HD = window.HD || {};

  var Storage = window.HD.Storage;
  var UI = window.HD.UI;
  var config = window.HD.config;

  var NAV_GROUPS = [
    {
      label: "General",
      items: [
        { key: "dashboard", file: "dashboard.html", label: "Panel", icon: "layout-dashboard" },
        { key: "tickets", file: "tickets.html", label: "Solicitudes", icon: "ticket", badge: true }
      ]
    },
    {
      label: "Administración",
      items: [
        { key: "technicians", file: "technicians.html", label: "Técnicos", icon: "wrench" },
        { key: "users", file: "users.html", label: "Usuarios", icon: "users" },
        { key: "categories", file: "categories.html", label: "Categorías", icon: "tags" }
      ]
    },
    {
      label: "Análisis",
      items: [
        { key: "reports", file: "reports.html", label: "Reportes", icon: "bar-chart-3" }
      ]
    }
  ];

  var sidebar = null;
  var topbar = null;

  function sidebarHTML(session, activeKey, openCount) {
    var user = session.user;
    return (
      '<div class="sidebar-brand">' +
      '<a class="brand" href="dashboard.html" aria-label="HelpDesk, ir al panel">' +
      '<span class="brand-mark"><i data-lucide="life-buoy"></i></span>' +
      '<span class="brand-name">HelpDesk</span>' +
      '<span class="brand-badge">Pro</span>' +
      "</a>" +
      '<button type="button" class="sidebar-close" id="sidebar-close" aria-label="Cerrar menú">' +
      '<i data-lucide="x"></i>' +
      "</button>" +
      "</div>" +
      '<nav class="sidebar-nav" aria-label="Navegación principal">' +
      NAV_GROUPS.map(function (group) {
        return (
          '<span class="nav-label">' + UI.escape(group.label) + "</span>" +
          group.items
            .map(function (item) {
              var active = item.key === activeKey;
              var badge =
                item.badge && openCount > 0
                  ? '<span class="nav-badge">' + openCount + "</span>"
                  : "";
              return (
                '<a class="nav-item' + (active ? " is-active" : "") + '" href="' + item.file +
                '" data-nav="' + item.key + '"' + (active ? ' aria-current="page"' : "") + ">" +
                '<i data-lucide="' + item.icon + '"></i>' +
                "<span>" + UI.escape(item.label) + "</span>" +
                badge +
                "</a>"
              );
            })
            .join("")
        );
      }).join("") +
      "</nav>" +
      '<div class="sidebar-footer">' +
      '<div class="sidebar-user">' +
      UI.avatar(user.name) +
      '<div class="sidebar-user-info">' +
      '<p class="sidebar-user-name">' + UI.escape(user.name) + "</p>" +
      '<p class="sidebar-user-role">' + UI.escape(user.role) + "</p>" +
      "</div>" +
      '<button type="button" class="sidebar-logout" data-logout aria-label="Cerrar sesión" title="Cerrar sesión">' +
      '<i data-lucide="log-out"></i>' +
      "</button>" +
      "</div></div>"
    );
  }

  function topbarHTML(session, meta) {
    var user = session.user;
    return (
      '<button type="button" class="icon-btn mobile-menu" id="menu-toggle" aria-label="Abrir menú">' +
      '<i data-lucide="menu"></i>' +
      "</button>" +
      '<div class="topbar-title">' +
      '<h1 id="topbar-page-title">' + UI.escape(meta.title) + "</h1>" +
      '<p id="topbar-page-subtitle">' + UI.escape(meta.subtitle) + "</p>" +
      "</div>" +
      '<div class="topbar-actions">' +
      '<form class="topbar-search" id="global-search" role="search">' +
      '<div class="search-field" style="max-width:none;min-width:0">' +
      '<i data-lucide="search"></i>' +
      '<input class="input" id="global-search-input" type="search" placeholder="Buscar solicitudes…" aria-label="Buscar solicitudes" />' +
      "</div></form>" +
      '<a class="btn btn--primary btn--sm" href="tickets.html?new=1">' +
      '<i data-lucide="plus"></i><span class="btn-label">Nueva solicitud</span>' +
      "</a>" +
      '<div class="topbar-divider"></div>' +
      '<div class="user-menu">' +
      '<button type="button" class="user-chip" id="user-menu-btn" aria-haspopup="true" aria-expanded="false">' +
      UI.avatar(user.name) +
      '<span class="user-chip-meta">' +
      '<span class="user-chip-name">' + UI.escape(user.name) + "</span>" +
      '<span class="user-chip-role">' + UI.escape(user.role) + "</span>" +
      "</span>" +
      '<i data-lucide="chevron-down"></i>' +
      "</button>" +
      '<div class="dropdown" id="user-dropdown" hidden>' +
      '<div class="dropdown-header">' +
      '<p class="dropdown-name">' + UI.escape(user.name) + "</p>" +
      '<p class="dropdown-mail">' + UI.escape(user.email) + "</p>" +
      "</div>" +
      '<button type="button" class="dropdown-item" data-reset-demo>' +
      '<i data-lucide="refresh-cw"></i>Restablecer datos demo' +
      "</button>" +
      '<div class="dropdown-sep"></div>' +
      '<button type="button" class="dropdown-item dropdown-item--danger" data-logout>' +
      '<i data-lucide="log-out"></i>Cerrar sesión' +
      "</button>" +
      "</div></div></div>"
    );
  }

  function openMobileNav() {
    document.body.classList.add("nav-open");
  }

  function closeMobileNav() {
    document.body.classList.remove("nav-open");
  }

  async function logout() {
    await window.HD.services.auth.logout();
    window.location.href = "login.html";
  }

  async function resetDemo() {
    var accepted = await UI.confirm({
      title: "Restablecer datos de demostración",
      message:
        "Se eliminarán los cambios guardados localmente y se restaurarán los datos originales. Las sesiones activas se mantendrán.",
      confirmText: "Restablecer datos",
      tone: "danger",
      icon: "refresh-cw"
    });
    if (!accepted) return;
    Storage.reset();
    UI.toast("Datos de demostración restablecidos correctamente.", "success");
    setTimeout(function () {
      window.location.reload();
    }, 700);
  }

  function bind(session) {
    var menuToggle = document.getElementById("menu-toggle");
    var sidebarClose = document.getElementById("sidebar-close");
    var overlay = document.getElementById("app-overlay");
    var userMenuBtn = document.getElementById("user-menu-btn");
    var userDropdown = document.getElementById("user-dropdown");
    var globalSearch = document.getElementById("global-search");
    var globalSearchInput = document.getElementById("global-search-input");

    if (menuToggle) menuToggle.addEventListener("click", openMobileNav);
    if (sidebarClose) sidebarClose.addEventListener("click", closeMobileNav);
    if (overlay) overlay.addEventListener("click", closeMobileNav);

    sidebar.querySelectorAll(".nav-item").forEach(function (link) {
      link.addEventListener("click", closeMobileNav);
    });

    document.querySelectorAll("[data-logout]").forEach(function (button) {
      button.addEventListener("click", logout);
    });

    document.querySelectorAll("[data-reset-demo]").forEach(function (button) {
      button.addEventListener("click", resetDemo);
    });

    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        var isHidden = userDropdown.hidden;
        userDropdown.hidden = !isHidden;
        userMenuBtn.setAttribute("aria-expanded", isHidden ? "true" : "false");
        if (isHidden) UI.refreshIcons();
      });
      document.addEventListener("click", function (event) {
        if (!event.target.closest(".user-menu")) {
          userDropdown.hidden = true;
          userMenuBtn.setAttribute("aria-expanded", "false");
        }
      });
    }

    if (globalSearch && globalSearchInput) {
      globalSearch.addEventListener("submit", function (event) {
        event.preventDefault();
        var value = globalSearchInput.value.trim();
        if (!value) {
          globalSearchInput.focus();
          return;
        }
        window.location.href = "tickets.html?q=" + encodeURIComponent(value);
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && document.body.classList.contains("nav-open")) {
        closeMobileNav();
      }
    });
  }

  var Nav = {
    async render() {
      var session = await window.HD.services.auth.getSession();
      if (!session) return null;

      var page = document.body.getAttribute("data-page") || "dashboard";
      var meta = config.pageMeta[page] || config.pageMeta.dashboard;
      var activeKey = meta.nav || page;

      var openCount = 0;
      try {
        openCount = await window.HD.services.tickets.countOpen();
      } catch (error) {
        openCount = 0;
      }

      sidebar = document.getElementById("sidebar");
      topbar = document.getElementById("topbar");

      if (sidebar) {
        sidebar.innerHTML = sidebarHTML(session, activeKey, openCount);
      }
      if (topbar) {
        topbar.innerHTML = topbarHTML(session, meta);
      }

      document.title = meta.title + " · HelpDesk";
      UI.refreshIcons();
      bind(session);
      return session;
    },

    setTitle(title, subtitle) {
      var titleNode = document.getElementById("topbar-page-title");
      var subtitleNode = document.getElementById("topbar-page-subtitle");
      if (titleNode && title) titleNode.textContent = title;
      if (subtitleNode && subtitle) subtitleNode.textContent = subtitle;
      if (title) document.title = title + " · HelpDesk";
    },

    closeMobileNav: closeMobileNav
  };

  window.HD.Nav = Nav;
})();
