(function () {
  "use strict";

  window.HD = window.HD || {};

  var DB_KEY = "helpdesk.db.v1";
  var SESSION_KEY = "helpdesk.session.v1";
  var DB_VERSION = 1;

  function nowISO() {
    return new Date().toISOString();
  }

  function uid(prefix) {
    return (
      (prefix || "id") +
      "_" +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 7)
    );
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readDb() {
    try {
      var raw = localStorage.getItem(DB_KEY);
      if (!raw) return null;
      var db = JSON.parse(raw);
      if (!db || !Array.isArray(db.tickets) || !Array.isArray(db.accounts)) return null;
      return db;
    } catch (error) {
      return null;
    }
  }

  function writeDb(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function daysAgo(days, extraHours) {
    return new Date(
      Date.now() - days * 86400000 - (extraHours || 0) * 3600000
    ).toISOString();
  }

  function plusHours(iso, hours) {
    return new Date(new Date(iso).getTime() + hours * 3600000).toISOString();
  }

  function clampToNow(iso) {
    return new Date(Math.min(Date.now(), new Date(iso).getTime())).toISOString();
  }

  function createSeed() {
    var categories = [
      {
        id: "cat_redes",
        name: "Redes y conectividad",
        description: "Incidencias de red, VPN, wifi, cableado y acceso a internet.",
        color: "#4f7df3",
        defaultPriority: "Alta",
        createdAt: daysAgo(180, 3)
      },
      {
        id: "cat_software",
        name: "Soporte de software",
        description: "Aplicaciones corporativas, instalaciones, errores y licencias.",
        color: "#6f5cf0",
        defaultPriority: "Media",
        createdAt: daysAgo(178, 4)
      },
      {
        id: "cat_hardware",
        name: "Hardware y equipos",
        description: "Ordenadores, portátiles, monitores, periféricos y movilidad.",
        color: "#e08a00",
        defaultPriority: "Media",
        createdAt: daysAgo(176, 2)
      },
      {
        id: "cat_accesos",
        name: "Accesos y cuentas",
        description: "Altas, bajas, contraseñas, permisos y directorio corporativo.",
        color: "#1a9c6b",
        defaultPriority: "Alta",
        createdAt: daysAgo(174, 5)
      },
      {
        id: "cat_correo",
        name: "Correo corporativo",
        description: "Sincronización, buzones, firmas, spam y distribución.",
        color: "#d9603b",
        defaultPriority: "Media",
        createdAt: daysAgo(172, 1)
      },
      {
        id: "cat_impresoras",
        name: "Impresoras",
        description: "Impresoras de red, consumibles, escaneo y digitalización.",
        color: "#8b919c",
        defaultPriority: "Baja",
        createdAt: daysAgo(170, 6)
      }
    ];

    var technicians = [
      {
        id: "tech_1",
        name: "Sofía Ramírez",
        email: "sofia.ramirez@helpdesk.com",
        phone: "+34 612 345 891",
        specialty: "Redes y conectividad",
        status: "Activo",
        createdAt: daysAgo(320, 2)
      },
      {
        id: "tech_2",
        name: "Diego Torres",
        email: "diego.torres@helpdesk.com",
        phone: "+34 623 118 402",
        specialty: "Soporte de software",
        status: "Activo",
        createdAt: daysAgo(290, 4)
      },
      {
        id: "tech_3",
        name: "Valeria Gómez",
        email: "valeria.gomez@helpdesk.com",
        phone: "+34 634 776 210",
        specialty: "Hardware y equipos",
        status: "Activo",
        createdAt: daysAgo(250, 5)
      },
      {
        id: "tech_4",
        name: "Andrés Molina",
        email: "andres.molina@helpdesk.com",
        phone: "+34 645 220 987",
        specialty: "Accesos y cuentas",
        status: "Activo",
        createdAt: daysAgo(210, 3)
      },
      {
        id: "tech_5",
        name: "Lucía Fernández",
        email: "lucia.fernandez@helpdesk.com",
        phone: "+34 656 903 174",
        specialty: "Soporte general",
        status: "Inactivo",
        createdAt: daysAgo(190, 6)
      }
    ];

    var users = [
      {
        id: "usr_1",
        name: "Laura Martín",
        email: "laura.martin@empresa.com",
        phone: "+34 611 204 588",
        department: "Administración",
        role: "Usuario",
        status: "Activo",
        createdAt: daysAgo(330, 1)
      },
      {
        id: "usr_2",
        name: "Carlos Ruiz",
        email: "carlos.ruiz@empresa.com",
        phone: "+34 622 771 043",
        department: "Finanzas",
        role: "Supervisor",
        status: "Activo",
        createdAt: daysAgo(310, 3)
      },
      {
        id: "usr_3",
        name: "Ana Castro",
        email: "ana.castro@empresa.com",
        phone: "+34 633 880 215",
        department: "Recursos Humanos",
        role: "Usuario",
        status: "Activo",
        createdAt: daysAgo(280, 2)
      },
      {
        id: "usr_4",
        name: "Marcos Vidal",
        email: "marcos.vidal@empresa.com",
        phone: "+34 644 552 176",
        department: "Comercial",
        role: "Usuario",
        status: "Activo",
        createdAt: daysAgo(260, 5)
      },
      {
        id: "usr_5",
        name: "Elena Navarro",
        email: "elena.navarro@empresa.com",
        phone: "+34 655 431 908",
        department: "Marketing",
        role: "Usuario",
        status: "Activo",
        createdAt: daysAgo(240, 4)
      },
      {
        id: "usr_6",
        name: "Javier Ortega",
        email: "javier.ortega@empresa.com",
        phone: "+34 666 219 340",
        department: "Operaciones",
        role: "Supervisor",
        status: "Activo",
        createdAt: daysAgo(220, 6)
      },
      {
        id: "usr_7",
        name: "Paula Iglesias",
        email: "paula.iglesias@empresa.com",
        phone: "+34 677 104 882",
        department: "Legal",
        role: "Usuario",
        status: "Activo",
        createdAt: daysAgo(200, 1)
      },
      {
        id: "usr_8",
        name: "Pablo Serrano",
        email: "pablo.serrano@empresa.com",
        phone: "+34 688 330 517",
        department: "Desarrollo",
        role: "Usuario",
        status: "Inactivo",
        createdAt: daysAgo(180, 2)
      }
    ];

    var accounts = [
      {
        id: "acc_admin",
        name: "Alejandro Suárez",
        email: "admin@helpdesk.com",
        password: "admin123",
        role: "Administrador",
        createdAt: daysAgo(360, 1)
      },
      {
        id: "acc_agent",
        name: "Sofía Ramírez",
        email: "agente@helpdesk.com",
        password: "agente123",
        role: "Técnico",
        createdAt: daysAgo(300, 3)
      }
    ];

    var templates = [
      ["No puedo conectarme a la VPN corporativa", "La conexión se queda en «Conectando» y termina fallando. Ocurre desde esta mañana y afecta al acceso a los recursos internos.", "cat_redes", "Alta"],
      ["El correo no sincroniza en el móvil", "Desde la última actualización del sistema, el correo corporativo no se sincroniza en el dispositivo móvil. El buzón web funciona correctamente.", "cat_correo", "Media"],
      ["Solicitud de acceso al ERP de finanzas", "Necesito permisos de consulta y edición sobre el módulo de facturación para cubrir una ausencia temporal en el departamento.", "cat_accesos", "Alta"],
      ["La impresora de recepción no imprime", "La impresora muestra el trabajo en cola pero no emite documentos. Ya se reinició el equipo sin éxito.", "cat_impresoras", "Baja"],
      ["Equipo de escritorio muy lento", "El ordenador tarda más de cinco minutos en iniciar sesión y las aplicaciones se bloquean de forma intermitente.", "cat_hardware", "Media"],
      ["Error al generar el reporte mensual", "Al exportar el informe de cierre de mes aparece un error inesperado y se pierde el progreso del documento.", "cat_software", "Alta"],
      ["Wi-Fi intermitente en la sala de reuniones", "La conexión inalámbrica se corta durante las videollamadas. Afecta a la sala grande del segundo piso.", "cat_redes", "Alta"],
      ["Restablecer contraseña de la cuenta de dominio", "He olvidado la contraseña de mi cuenta corporativa y no puedo iniciar sesión en el equipo de trabajo.", "cat_accesos", "Media"],
      ["Instalación de Microsoft 365 en portátil nuevo", "El portátil asignado al nuevo incorporado necesita la suite ofimática y la configuración de correo corporativo.", "cat_software", "Media"],
      ["Monitor secundario no detectado", "El monitor externo no se detecta al conectarlo por HDMI. Se ha probado otro cable con el mismo resultado.", "cat_hardware", "Media"],
      ["La impresora imprime documentos borrosos", "Los documentos salen con manchas y texto poco definido. Es posible que sea necesario cambiar el tóner.", "cat_impresoras", "Baja"],
      ["No llegan correos de clientes externos", "Los clientes indican que sus mensajes rebotan. El problema afecta a varias cuentas del equipo comercial.", "cat_correo", "Crítica"],
      ["Solicitud de alta de nuevo empleado en sistemas", "Es necesario crear la cuenta de correo, el acceso al ERP y la cuenta de dominio para la nueva incorporación del lunes.", "cat_accesos", "Media"],
      ["El servidor de archivos responde lento", "El acceso a las carpetas compartidas tarda varios minutos y en ocasiones se pierde la conexión.", "cat_redes", "Alta"],
      ["Aplicación de facturación se cierra inesperadamente", "La aplicación se cierra sin mostrar error al intentar emitir facturas con más de veinte líneas.", "cat_software", "Crítica"],
      ["Teclado inalámbrico sin respuesta", "El teclado dejó de responder después de cambiar las pilas. El receptor USB está conectado correctamente.", "cat_hardware", "Baja"],
      ["Configurar firma corporativa en Outlook", "Necesito ayuda para configurar la firma corporativa en Outlook con el logotipo y los datos de contacto actualizados.", "cat_correo", "Baja"],
      ["Acceso remoto denegado al escritorio de trabajo", "Desde casa no puedo acceder al escritorio remoto. La autenticación se rechaza con un mensaje de permisos insuficientes.", "cat_accesos", "Alta"],
      ["Actualización de antivirus bloqueada", "La actualización del antivirus falla constantemente y el equipo muestra un aviso de protección desactualizada.", "cat_software", "Media"],
      ["Cambio de tóner en impresora de dirección", "La impresora de dirección indica nivel de tóner bajo. Es necesario sustituirlo y verificar la configuración.", "cat_impresoras", "Baja"],
      ["Cortes de conexión en la oficina de Madrid", "La conexión principal se cae varias veces al día. El router muestra reinicios automáticos en los registros.", "cat_redes", "Crítica"],
      ["Duplicado de cuenta en el directorio activo", "Aparecen dos cuentas con mi nombre y los correos internos llegan a la cuenta antigua. Es necesario unificar el acceso.", "cat_accesos", "Media"],
      ["Portátil no carga la batería", "El portátil funciona conectado a la corriente pero la batería no se carga. El indicador permanece en cero.", "cat_hardware", "Media"],
      ["Correos marcados como spam incorrectamente", "Los mensajes de un proveedor habitual se clasifican como spam. Necesito añadir una regla de confianza.", "cat_correo", "Media"],
      ["Solicitud de licencia para herramienta de diseño", "El equipo de marketing necesita una licencia adicional para la herramienta de diseño gráfico aprobada por dirección.", "cat_software", "Baja"],
      ["Revisión de cableado del puesto 14", "El puesto 14 pierde conexión al mover la mesa. Es necesario revisar el cableado y el punto de red.", "cat_redes", "Media"]
    ];

    var schedule = [0, 1, 2, 3, 5, 6, 8, 10, 12, 15, 18, 22, 27, 33, 40, 48, 57, 66, 78, 90, 103, 118, 135, 150, 170, 200];
    var statusPlan = [
      "En progreso", "Abierto", "En espera", "En progreso", "Abierto", "En espera",
      "En progreso", "Abierto", "En espera", "Resuelto", "Resuelto", "En progreso",
      "Resuelto", "Resuelto", "Resuelto", "Resuelto", "Resuelto", "Resuelto",
      "Cerrado", "Cerrado", "Cerrado", "Cerrado", "Cerrado", "Cerrado", "Cerrado", "Cerrado"
    ];

    var techByCategory = {
      cat_redes: "tech_1",
      cat_software: "tech_2",
      cat_hardware: "tech_3",
      cat_accesos: "tech_4",
      cat_correo: "tech_2",
      cat_impresoras: "tech_3"
    };

    var userMessages = [
      "He vuelto a probar esta mañana y el problema continúa. ¿Podéis revisarlo con prioridad?",
      "Gracias por la respuesta. Sigo a la espera de la solución.",
      "El problema ha empeorado desde ayer y afecta a más compañeros.",
      "Quedo atento a cualquier actualización. Gracias."
    ];

    var techMessages = [
      "Estamos revisando el caso. Te mantendré informado por este medio.",
      "He aplicado una primera solución. ¿Puedes confirmar si el servicio vuelve a funcionar?",
      "Se ha identificado la causa y estamos trabajando en ello.",
      "El servicio ya está restablecido. Cerramos el caso si no hay incidencias."
    ];

    function byId(list, id) {
      for (var i = 0; i < list.length; i += 1) {
        if (list[i].id === id) return list[i];
      }
      return null;
    }

    var tickets = templates.map(function (tpl, index) {
      var user = users[index % users.length];
      var category = byId(categories, tpl[2]);
      var status = statusPlan[index];
      var createdAt = daysAgo(schedule[index], (index % 6) * 2 + 1);
      var unassigned = index === 1 || index === 8 || index === 12 || index === 17;
      var technicianId = unassigned ? null : techByCategory[category.id];
      var technician = technicianId ? byId(technicians, technicianId) : null;
      var isResolved = status === "Resuelto" || status === "Cerrado";
      var resolvedAt = isResolved ? plusHours(createdAt, 10 + (index % 5) * 7) : null;
      var number = 1040 + (templates.length - index);
      var history = [];
      var comments = [];
      var eventTime = createdAt;

      history.push({
        id: "hst_" + index + "_1",
        action: "Solicitud creada",
        detail: "Solicitud registrada por " + user.name + ".",
        author: user.name,
        createdAt: createdAt
      });

      if (technician) {
        eventTime = plusHours(createdAt, 1);
        history.push({
          id: "hst_" + index + "_2",
          action: "Técnico asignado",
          detail: "Asignada a " + technician.name + ".",
          author: "Sistema",
          createdAt: eventTime
        });
      }

      if (status !== "Abierto") {
        eventTime = isResolved ? resolvedAt : plusHours(createdAt, 2);
        history.push({
          id: "hst_" + index + "_3",
          action: "Estado actualizado",
          detail: "Abierto → " + status + ".",
          author: technician ? technician.name : "Sistema",
          createdAt: eventTime
        });
      }

      var hasComments = index % 3 === 0 || index === 4 || index === 13 || index === 20;
      if (hasComments) {
        var firstAuthor = technician || { name: "Equipo de soporte", role: "Sistema" };
        var firstTime = plusHours(createdAt, 3);
        comments.push({
          id: "cmt_" + index + "_1",
          authorName: firstAuthor.name,
          role: technician ? "Técnico" : "Sistema",
          message: techMessages[index % techMessages.length],
          createdAt: firstTime
        });
        history.push({
          id: "hst_" + index + "_4",
          action: "Comentario agregado",
          detail: firstAuthor.name + " añadió un comentario.",
          author: firstAuthor.name,
          createdAt: firstTime
        });

        if (index % 2 === 0) {
          var secondTime = plusHours(createdAt, 5);
          comments.push({
            id: "cmt_" + index + "_2",
            authorName: user.name,
            role: "Usuario",
            message: userMessages[index % userMessages.length],
            createdAt: secondTime
          });
          history.push({
            id: "hst_" + index + "_5",
            action: "Comentario agregado",
            detail: user.name + " añadió un comentario.",
            author: user.name,
            createdAt: secondTime
          });
        }
      }

      var lastEvent = history.reduce(function (latest, item) {
        return new Date(item.createdAt) > new Date(latest) ? item.createdAt : latest;
      }, createdAt);

      return {
        id: "tkt_" + (index + 1),
        number: number,
        code: "HD-" + number,
        title: tpl[0],
        description: tpl[1],
        categoryId: category.id,
        userId: user.id,
        technicianId: technicianId,
        priority: tpl[3],
        status: status,
        dueDate: plusHours(createdAt, 72 + (index % 4) * 24),
        resolvedAt: resolvedAt,
        comments: comments,
        history: history,
        createdAt: createdAt,
        updatedAt: clampToNow(lastEvent)
      };
    });

    return {
      version: DB_VERSION,
      accounts: accounts,
      categories: categories,
      technicians: technicians,
      users: users,
      tickets: tickets
    };
  }

  function init() {
    var existing = readDb();
    if (existing) return clone(existing);
    var seeded = createSeed();
    writeDb(seeded);
    return clone(seeded);
  }

  function reset() {
    localStorage.removeItem(DB_KEY);
    var seeded = createSeed();
    writeDb(seeded);
    return clone(seeded);
  }

  function getAll(collection) {
    var db = readDb() || init();
    return clone(db[collection] || []);
  }

  function getById(collection, id) {
    if (!id) return null;
    var items = getAll(collection);
    for (var i = 0; i < items.length; i += 1) {
      if (items[i].id === id) return items[i];
    }
    return null;
  }

  function insert(collection, data) {
    var db = readDb() || init();
    if (!Array.isArray(db[collection])) db[collection] = [];
    var record = Object.assign(
      { id: uid(collection.slice(0, 3)), createdAt: nowISO() },
      data
    );
    db[collection].push(record);
    writeDb(db);
    return clone(record);
  }

  function update(collection, id, patch) {
    var db = readDb() || init();
    var list = db[collection] || [];
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].id === id) {
        var merged = Object.assign({}, list[i], patch, {
          id: list[i].id,
          createdAt: list[i].createdAt,
          updatedAt: nowISO()
        });
        list[i] = merged;
        writeDb(db);
        return clone(merged);
      }
    }
    return null;
  }

  function remove(collection, id) {
    var db = readDb() || init();
    var list = db[collection] || [];
    var next = list.filter(function (item) {
      return item.id !== id;
    });
    if (next.length === list.length) return false;
    db[collection] = next;
    writeDb(db);
    return true;
  }

  function getSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function setSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms || 90);
    });
  }

  window.HD.Storage = {
    keys: { db: DB_KEY, session: SESSION_KEY },
    init: init,
    reset: reset,
    getAll: getAll,
    getById: getById,
    insert: insert,
    update: update,
    remove: remove,
    getSession: getSession,
    setSession: setSession,
    clearSession: clearSession,
    wait: wait,
    uid: uid,
    nowISO: nowISO,
    clone: clone
  };
})();
