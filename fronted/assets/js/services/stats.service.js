(function () {
  "use strict";

  window.HD = window.HD || {};
  window.HD.services = window.HD.services || {};

  var Storage = window.HD.Storage;
  var config = window.HD.config;
  var MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

  function round1(value) {
    return Math.round(value * 10) / 10;
  }

  function avgResolutionHours(list) {
    var resolved = list.filter(function (ticket) {
      return ticket.resolvedAt && new Date(ticket.resolvedAt) >= new Date(ticket.createdAt);
    });
    if (!resolved.length) return 0;
    var total = resolved.reduce(function (sum, ticket) {
      return sum + (new Date(ticket.resolvedAt) - new Date(ticket.createdAt)) / 3600000;
    }, 0);
    return round1(total / resolved.length);
  }

  function countStatuses(list) {
    var counts = {};
    config.statuses.forEach(function (status) {
      counts[status] = 0;
    });
    list.forEach(function (ticket) {
      if (counts[ticket.status] === undefined) counts[ticket.status] = 0;
      counts[ticket.status] += 1;
    });
    return counts;
  }

  function countPriorities(list) {
    var counts = {};
    config.priorities.forEach(function (priority) {
      counts[priority] = 0;
    });
    list.forEach(function (ticket) {
      if (counts[ticket.priority] === undefined) counts[ticket.priority] = 0;
      counts[ticket.priority] += 1;
    });
    return counts;
  }

  function enrich(ticket) {
    var user = Storage.getById("users", ticket.userId);
    var category = Storage.getById("categories", ticket.categoryId);
    var technician = Storage.getById("technicians", ticket.technicianId);
    return Object.assign({}, ticket, {
      userName: user ? user.name : "Usuario eliminado",
      categoryName: category ? category.name : "Sin categoría",
      technicianName: technician ? technician.name : "Sin asignar"
    });
  }

  async function overview() {
    await Storage.wait(70);
    var tickets = Storage.getAll("tickets");
    var technicians = Storage.getAll("technicians");
    var categories = Storage.getAll("categories");
    var statusCounts = countStatuses(tickets);
    var priorityCounts = countPriorities(tickets);

    var open = statusCounts["Abierto"] || 0;
    var inProgress = statusCounts["En progreso"] || 0;
    var waiting = statusCounts["En espera"] || 0;
    var active = open + inProgress + waiting;
    var resolved = (statusCounts["Resuelto"] || 0) + (statusCounts["Cerrado"] || 0);
    var total = tickets.length;
    var rate = total ? Math.round((resolved / total) * 100) : 0;
    var avgHours = avgResolutionHours(tickets);
    var criticalActive = tickets.filter(function (ticket) {
      return config.activeStatuses.indexOf(ticket.status) !== -1 && ticket.priority === "Crítica";
    }).length;
    var unassigned = tickets.filter(function (ticket) {
      return !ticket.technicianId && config.activeStatuses.indexOf(ticket.status) !== -1;
    }).length;

    var now = new Date();
    var thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    var lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    var createdThisMonth = tickets.filter(function (ticket) {
      return new Date(ticket.createdAt).getTime() >= thisMonthStart;
    }).length;
    var createdLastMonth = tickets.filter(function (ticket) {
      var time = new Date(ticket.createdAt).getTime();
      return time >= lastMonthStart && time < thisMonthStart;
    }).length;
    var monthDelta = createdLastMonth
      ? Math.round(((createdThisMonth - createdLastMonth) / createdLastMonth) * 100)
      : createdThisMonth
        ? 100
        : 0;

    var technicianLoad = technicians
      .map(function (technician) {
        var assigned = tickets.filter(function (ticket) {
          return ticket.technicianId === technician.id;
        });
        return {
          id: technician.id,
          name: technician.name,
          specialty: technician.specialty,
          status: technician.status,
          active: assigned.filter(function (ticket) {
            return config.activeStatuses.indexOf(ticket.status) !== -1;
          }).length,
          resolved: assigned.filter(function (ticket) {
            return config.resolvedStatuses.indexOf(ticket.status) !== -1;
          }).length,
          total: assigned.length
        };
      })
      .sort(function (a, b) {
        return b.active - a.active || b.total - a.total;
      });

    var categoryBreakdown = categories
      .map(function (category) {
        return {
          id: category.id,
          name: category.name,
          color: category.color,
          count: tickets.filter(function (ticket) {
            return ticket.categoryId === category.id;
          }).length
        };
      })
      .sort(function (a, b) {
        return b.count - a.count;
      });

    return {
      total: total,
      open: open,
      inProgress: inProgress,
      waiting: waiting,
      active: active,
      resolved: resolved,
      rate: rate,
      avgHours: avgHours,
      criticalActive: criticalActive,
      unassigned: unassigned,
      createdThisMonth: createdThisMonth,
      createdLastMonth: createdLastMonth,
      monthDelta: monthDelta,
      byStatus: statusCounts,
      byPriority: priorityCounts,
      technicians: technicianLoad,
      categories: categoryBreakdown
    };
  }

  async function trend(days) {
    await Storage.wait(50);
    var totalDays = Number(days) || 14;
    var tickets = Storage.getAll("tickets");
    var buckets = [];

    for (var i = totalDays - 1; i >= 0; i -= 1) {
      var date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      buckets.push({
        key: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        label:
          new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" })
            .format(date)
            .replace(".", ""),
        created: 0,
        resolved: 0
      });
    }

    var index = {};
    buckets.forEach(function (bucket, position) {
      index[bucket.key] = position;
    });

    tickets.forEach(function (ticket) {
      var created = new Date(ticket.createdAt);
      var createdKey = created.getFullYear() + "-" + (created.getMonth() + 1) + "-" + created.getDate();
      if (index[createdKey] !== undefined) buckets[index[createdKey]].created += 1;

      if (ticket.resolvedAt) {
        var resolved = new Date(ticket.resolvedAt);
        var resolvedKey = resolved.getFullYear() + "-" + (resolved.getMonth() + 1) + "-" + resolved.getDate();
        if (index[resolvedKey] !== undefined) buckets[index[resolvedKey]].resolved += 1;
      }
    });

    return {
      labels: buckets.map(function (bucket) {
        return bucket.label;
      }),
      created: buckets.map(function (bucket) {
        return bucket.created;
      }),
      resolved: buckets.map(function (bucket) {
        return bucket.resolved;
      }),
      totalCreated: buckets.reduce(function (sum, bucket) {
        return sum + bucket.created;
      }, 0),
      totalResolved: buckets.reduce(function (sum, bucket) {
        return sum + bucket.resolved;
      }, 0)
    };
  }

  function monthBuckets(count, items) {
    var now = new Date();
    var buckets = [];
    for (var i = count - 1; i >= 0; i -= 1) {
      var date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var label = MONTHS[date.getMonth()];
      buckets.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        year: date.getFullYear(),
        month: date.getMonth(),
        created: 0,
        resolved: 0
      });
    }

    function position(date) {
      var diff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
      if (diff < 0 || diff >= count) return -1;
      return count - 1 - diff;
    }

    items.forEach(function (ticket) {
      var created = new Date(ticket.createdAt);
      var createdIndex = position(created);
      if (createdIndex >= 0) buckets[createdIndex].created += 1;

      if (ticket.resolvedAt) {
        var resolved = new Date(ticket.resolvedAt);
        var resolvedIndex = position(resolved);
        if (resolvedIndex >= 0) buckets[resolvedIndex].resolved += 1;
      }
    });

    return buckets;
  }

  async function report(days) {
    await Storage.wait(80);
    var rangeDays = Number(days) || 0;
    var from = rangeDays > 0 ? Date.now() - rangeDays * 86400000 : null;
    var all = Storage.getAll("tickets");
    var items = all.filter(function (ticket) {
      return !from || new Date(ticket.createdAt).getTime() >= from;
    });
    var technicians = Storage.getAll("technicians");
    var categories = Storage.getAll("categories");
    var statusCounts = countStatuses(items);
    var priorityCounts = countPriorities(items);
    var resolved = items.filter(function (ticket) {
      return config.resolvedStatuses.indexOf(ticket.status) !== -1;
    }).length;
    var total = items.length;
    var rate = total ? Math.round((resolved / total) * 100) : 0;
    var avgHours = avgResolutionHours(items);
    var critical = items.filter(function (ticket) {
      return ticket.priority === "Crítica";
    }).length;
    var unassigned = items.filter(function (ticket) {
      return !ticket.technicianId;
    }).length;

    var byStatus = config.statuses.map(function (status) {
      return {
        label: status,
        value: statusCounts[status] || 0,
        color: config.statusMeta[status].color
      };
    });

    var byPriority = config.priorities.map(function (priority) {
      return {
        label: priority,
        value: priorityCounts[priority] || 0,
        color: config.priorityMeta[priority].color
      };
    });

    var byCategory = categories
      .map(function (category) {
        return {
          label: category.name,
          value: items.filter(function (ticket) {
            return ticket.categoryId === category.id;
          }).length,
          color: category.color
        };
      })
      .filter(function (entry) {
        return entry.value > 0;
      })
      .sort(function (a, b) {
        return b.value - a.value;
      });

    var technicianRows = technicians
      .map(function (technician) {
        var assigned = items.filter(function (ticket) {
          return ticket.technicianId === technician.id;
        });
        var techResolved = assigned.filter(function (ticket) {
          return config.resolvedStatuses.indexOf(ticket.status) !== -1;
        });
        return {
          id: technician.id,
          name: technician.name,
          specialty: technician.specialty,
          status: technician.status,
          total: assigned.length,
          active: assigned.filter(function (ticket) {
            return config.activeStatuses.indexOf(ticket.status) !== -1;
          }).length,
          resolved: techResolved.length,
          avgHours: avgResolutionHours(techResolved),
          rate: assigned.length ? Math.round((techResolved.length / assigned.length) * 100) : 0
        };
      })
      .sort(function (a, b) {
        return b.resolved - a.resolved || b.total - a.total;
      });

    var monthsCount = rangeDays === 0 ? 12 : rangeDays <= 90 ? 3 : rangeDays <= 180 ? 6 : 12;
    var monthly = monthBuckets(monthsCount, items);

    return {
      days: rangeDays,
      total: total,
      resolved: resolved,
      open: total - resolved,
      rate: rate,
      avgHours: avgHours,
      critical: critical,
      unassigned: unassigned,
      byStatus: byStatus,
      byPriority: byPriority,
      byCategory: byCategory,
      technicians: technicianRows,
      monthly: {
        labels: monthly.map(function (bucket) {
          return bucket.label;
        }),
        created: monthly.map(function (bucket) {
          return bucket.created;
        }),
        resolved: monthly.map(function (bucket) {
          return bucket.resolved;
        })
      },
      items: items.map(enrich)
    };
  }

  window.HD.services.stats = {
    overview: overview,
    trend: trend,
    report: report
  };
})();
