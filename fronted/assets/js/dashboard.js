(function () {
  "use strict";

  window.HD = window.HD || {};
  window.HD.pages = window.HD.pages || {};

  var UI = window.HD.UI;
  var config = window.HD.config;
  var trendChart = null;
  var statusChart = null;

  function statCard(options) {
    var badge = "";
    if (options.badge) {
      badge =
        '<span class="trend trend--' + options.badge.tone + '">' +
        '<i data-lucide="' + options.badge.icon + '"></i>' +
        UI.escape(options.badge.text) +
        "</span>";
    }
    return (
      '<article class="stat-card">' +
      '<div class="stat-top">' +
      '<span class="stat-icon stat-icon--' + options.tone + '">' +
      '<i data-lucide="' + options.icon + '"></i></span>' +
      badge +
      "</div>" +
      "<div>" +
      '<p class="stat-value">' + UI.escape(options.value) + "</p>" +
      '<p class="stat-label">' + UI.escape(options.label) + "</p>" +
      "</div>" +
      '<p class="stat-foot">' + UI.escape(options.foot) + "</p>" +
      "</article>"
    );
  }

  function renderStats(stats) {
    var delta = stats.monthDelta;
    var deltaTone = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
    var deltaIcon = delta > 0 ? "trending-up" : delta < 0 ? "trending-down" : "minus";
    var deltaText = (delta > 0 ? "+" : "") + delta + "% mes";

    var cards = [
      statCard({
        tone: "accent",
        icon: "inbox",
        value: String(stats.total),
        label: "Total de solicitudes",
        foot: stats.createdThisMonth + " creadas este mes",
        badge: { tone: deltaTone, icon: deltaIcon, text: deltaText }
      }),
      statCard({
        tone: "warning",
        icon: "clock",
        value: String(stats.active),
        label: "Solicitudes activas",
        foot: stats.open + " abiertas · " + stats.inProgress + " en progreso · " + stats.waiting + " en espera",
        badge:
          stats.criticalActive > 0
            ? { tone: "down", icon: "alert-triangle", text: stats.criticalActive + " críticas" }
            : { tone: "up", icon: "check", text: "Al día" }
      }),
      statCard({
        tone: "success",
        icon: "check-circle",
        value: String(stats.resolved),
        label: "Solicitudes resueltas",
        foot: "Tasa de resolución del " + stats.rate + "%",
        badge: { tone: "up", icon: "check-circle", text: stats.rate + "%" }
      }),
      statCard({
        tone: "info",
        icon: "timer",
        value: UI.formatHours(stats.avgHours),
        label: "Tiempo medio de resolución",
        foot: "Desde la creación hasta la resolución",
        badge:
          stats.unassigned > 0
            ? { tone: "flat", icon: "user-x", text: stats.unassigned + " sin asignar" }
            : null
      })
    ];

    document.getElementById("stats-grid").innerHTML = cards.join("");
    UI.refreshIcons();
  }

  function renderRecent(items) {
    var body = document.getElementById("recent-body");
    if (!items.length) {
      body.innerHTML = UI.tableEmpty(
        4,
        "Sin solicitudes todavía",
        "Crea la primera solicitud para empezar a dar seguimiento.",
        "inbox"
      );
      UI.refreshIcons();
      return;
    }

    body.innerHTML = items
      .map(function (ticket) {
        var category = ticket.category;
        var color = UI.safeColor(category ? category.color : "", "#8b919c");
        var categoryName = category ? category.name : "Sin categoría";
        return (
          '<tr class="is-clickable" data-href="ticket-detail.html?id=' + encodeURIComponent(ticket.id) + '">' +
          "<td><span class=\"code-chip\">" + UI.escape(ticket.code) + "</span></td>" +
          "<td>" +
          '<span class="cell-main">' + UI.escape(ticket.title) + "</span>" +
          '<span class="cell-sub"><span class="dot" style="background:' + color + '"></span>' +
          UI.escape(categoryName) + "</span>" +
          "</td>" +
          "<td>" + UI.statusBadge(ticket.status) + "</td>" +
          '<td class="text-muted nowrap">' + UI.escape(UI.relativeTime(ticket.updatedAt)) + "</td>" +
          "</tr>"
        );
      })
      .join("");
    UI.refreshIcons();
  }

  function renderWorkload(technicians) {
    var list = document.getElementById("workload-list");
    if (!technicians.length) {
      list.innerHTML = UI.emptyState(
        "wrench",
        "Sin técnicos registrados",
        "Añade técnicos al equipo para poder asignar solicitudes."
      );
      UI.refreshIcons();
      return;
    }

    var maxActive = Math.max.apply(
      null,
      technicians.map(function (technician) {
        return technician.active;
      }).concat([1])
    );

    list.innerHTML = technicians
      .map(function (technician) {
        var width = Math.round((technician.active / maxActive) * 100);
        var color = technician.status === "Inactivo" ? "#c4c9d2" : "#5b5bd6";
        return (
          '<a class="workload-item" href="tickets.html?technician=' + encodeURIComponent(technician.id) + '">' +
          UI.avatar(technician.name) +
          '<div class="workload-info">' +
          '<div class="workload-head">' +
          '<span class="workload-name">' + UI.escape(technician.name) + "</span>" +
          '<span class="workload-count">' + technician.active + " activa" + (technician.active === 1 ? "" : "s") + "</span>" +
          "</div>" +
          '<div class="progress"><span class="progress-bar" style="width:' + width + "%;background:" + color + '"></span></div>' +
          '<p class="workload-meta">' + UI.escape(technician.specialty) + " · " +
          technician.resolved + " resueltas</p>" +
          "</div></a>"
        );
      })
      .join("");
    UI.refreshIcons();
  }

  function buildTrendChart(data) {
    var canvas = document.getElementById("chart-trend");
    if (!canvas || !window.Chart) return;
    var context = canvas.getContext("2d");

    if (trendChart) trendChart.destroy();
    trendChart = new window.Chart(context, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Creadas",
            data: data.created,
            borderColor: config.statusMeta.Abierto.color,
            backgroundColor: "rgba(91, 91, 214, 0.08)",
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: config.statusMeta.Abierto.color,
            pointHoverBorderColor: "#ffffff",
            pointHoverBorderWidth: 2
          },
          {
            label: "Resueltas",
            data: data.resolved,
            borderColor: "#178f63",
            backgroundColor: "rgba(23, 143, 99, 0.06)",
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: "#178f63",
            pointHoverBorderColor: "#ffffff",
            pointHoverBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: { usePointStyle: true, pointStyle: "circle" }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 7 }
          },
          y: {
            beginAtZero: true,
            grid: { color: "#eef0f3" },
            border: { display: false },
            ticks: { precision: 0, maxTicksLimit: 5 }
          }
        }
      }
    });
  }

  function buildStatusChart(stats) {
    var canvas = document.getElementById("chart-status");
    if (!canvas || !window.Chart) return;
    var context = canvas.getContext("2d");

    var entries = config.statuses
      .map(function (status) {
        return {
          label: status,
          value: stats.byStatus[status] || 0,
          color: config.statusMeta[status].color
        };
      })
      .filter(function (entry) {
        return entry.value > 0;
      });

    if (statusChart) statusChart.destroy();
    if (!entries.length) {
      canvas.style.display = "none";
      return;
    }
    canvas.style.display = "block";

    statusChart = new window.Chart(context, {
      type: "doughnut",
      data: {
        labels: entries.map(function (entry) {
          return entry.label;
        }),
        datasets: [
          {
            data: entries.map(function (entry) {
              return entry.value;
            }),
            backgroundColor: entries.map(function (entry) {
              return entry.color;
            }),
            borderColor: "#ffffff",
            borderWidth: 2,
            hoverOffset: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { usePointStyle: true, pointStyle: "circle", padding: 14 }
          }
        }
      }
    });
  }

  window.HD.pages.dashboard = async function () {
    UI.initChartDefaults();

    var result = await Promise.all([
      window.HD.services.stats.overview(),
      window.HD.services.tickets.recent(6),
      window.HD.services.stats.trend(14)
    ]);

    var stats = result[0];
    var recent = result[1];
    var trend = result[2];

    renderStats(stats);
    renderRecent(recent);
    renderWorkload(stats.technicians);
    buildTrendChart(trend);
    buildStatusChart(stats);

    var range = document.getElementById("trend-range");
    range.addEventListener("change", async function () {
      var data = await window.HD.services.stats.trend(Number(range.value));
      if (!trendChart) {
        buildTrendChart(data);
        return;
      }
      trendChart.data.labels = data.labels;
      trendChart.data.datasets[0].data = data.created;
      trendChart.data.datasets[1].data = data.resolved;
      trendChart.update();
    });

    var recentBody = document.getElementById("recent-body");
    recentBody.addEventListener("click", function (event) {
      var row = event.target.closest("tr[data-href]");
      if (row) window.location.href = row.getAttribute("data-href");
    });
  };
})();
