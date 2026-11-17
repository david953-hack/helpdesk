(function () {
  "use strict";

  window.HD = window.HD || {};

  var config = {
    statuses: ["Abierto", "En progreso", "En espera", "Resuelto", "Cerrado"],
    priorities: ["Baja", "Media", "Alta", "Crítica"],
    activeStatuses: ["Abierto", "En progreso", "En espera"],
    resolvedStatuses: ["Resuelto", "Cerrado"],
    roles: ["Usuario", "Supervisor", "Administrador"],
    departments: [
      "Administración",
      "Finanzas",
      "Recursos Humanos",
      "Comercial",
      "Marketing",
      "Operaciones",
      "Legal",
      "Desarrollo",
      "Soporte"
    ],
    specialties: [
      "Redes y conectividad",
      "Soporte de software",
      "Hardware y equipos",
      "Accesos y cuentas",
      "Soporte general"
    ],
    statusMeta: {
      Abierto: { tone: "accent", color: "#5b5bd6", icon: "circle-dot" },
      "En progreso": { tone: "info", color: "#2f80ed", icon: "loader" },
      "En espera": { tone: "warning", color: "#d99a06", icon: "clock" },
      Resuelto: { tone: "success", color: "#1a9c6b", icon: "check-circle" },
      Cerrado: { tone: "neutral", color: "#8b919c", icon: "archive" }
    },
    priorityMeta: {
      Baja: { tone: "neutral", color: "#8b919c" },
      Media: { tone: "info", color: "#2f80ed" },
      Alta: { tone: "warning", color: "#d99a06" },
      Crítica: { tone: "danger", color: "#d04444" }
    },
    pageMeta: {
      dashboard: {
        title: "Panel",
        subtitle: "Resumen general del servicio de soporte",
        nav: "dashboard"
      },
      tickets: {
        title: "Solicitudes",
        subtitle: "Gestiona y da seguimiento a los tickets",
        nav: "tickets"
      },
      "ticket-detail": {
        title: "Detalle de solicitud",
        subtitle: "Seguimiento, historial y comentarios",
        nav: "tickets"
      },
      technicians: {
        title: "Técnicos",
        subtitle: "Equipo de soporte y carga de trabajo",
        nav: "technicians"
      },
      users: {
        title: "Usuarios",
        subtitle: "Solicitantes registrados en la plataforma",
        nav: "users"
      },
      categories: {
        title: "Categorías",
        subtitle: "Organiza las solicitudes por área",
        nav: "categories"
      },
      reports: {
        title: "Reportes",
        subtitle: "Análisis y métricas del servicio",
        nav: "reports"
      }
    },
    categoryColors: [
      "#4f7df3",
      "#6f5cf0",
      "#e08a00",
      "#1a9c6b",
      "#d9603b",
      "#8b919c",
      "#2f9ec4",
      "#c14d8b",
      "#7a8b3f",
      "#9b6b3f"
    ]
  };

  window.HD.config = config;
})();
