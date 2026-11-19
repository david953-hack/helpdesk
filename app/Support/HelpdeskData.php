<?php

namespace App\Support;

use App\Models\Category;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

class HelpdeskData
{
    public const STATUSES = ['Abierto', 'En progreso', 'En espera', 'Resuelto', 'Cerrado'];

    public const PRIORITIES = ['Baja', 'Media', 'Alta', 'Crítica'];

    public static function accounts(): array
    {
        return [
            ['id' => 'acc_admin', 'name' => 'Alejandro Suárez', 'email' => 'admin@helpdesk.com', 'password' => 'admin123', 'role' => 'Administrador'],
            ['id' => 'acc_agent', 'name' => 'Sofía Ramírez', 'email' => 'agente@helpdesk.com', 'password' => 'agente123', 'role' => 'Técnico'],
        ];
    }

    public static function categories(): array
    {
        return [
            ['id' => 'cat_redes', 'name' => 'Redes y conectividad', 'color' => '#4f7df3', 'defaultPriority' => 'Alta'],
            ['id' => 'cat_software', 'name' => 'Soporte de software', 'color' => '#6f5cf0', 'defaultPriority' => 'Media'],
            ['id' => 'cat_hardware', 'name' => 'Hardware y equipos', 'color' => '#e08a00', 'defaultPriority' => 'Media'],
            ['id' => 'cat_accesos', 'name' => 'Accesos y cuentas', 'color' => '#1a9c6b', 'defaultPriority' => 'Alta'],
            ['id' => 'cat_correo', 'name' => 'Correo corporativo', 'color' => '#d9603b', 'defaultPriority' => 'Media'],
            ['id' => 'cat_impresoras', 'name' => 'Impresoras', 'color' => '#8b919c', 'defaultPriority' => 'Baja'],
        ];
    }

    public static function technicians(): array
    {
        if (Schema::hasTable('users')) {
            return User::query()
                ->whereIn('role', ['admin', 'tecnico'])
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => [
                    'id' => (string) $user->id,
                    'name' => $user->name,
                    'specialty' => $user->role === 'admin' ? 'Administración' : 'Soporte técnico',
                    'status' => 'Activo',
                ])
                ->all();
        }

        return [
            ['id' => 'tech_1', 'name' => 'Sofía Ramírez', 'specialty' => 'Redes y conectividad', 'status' => 'Activo'],
            ['id' => 'tech_2', 'name' => 'Diego Torres', 'specialty' => 'Soporte de software', 'status' => 'Activo'],
        ];
    }

    public static function users(): array
    {
        return [
            ['id' => 'usr_1', 'name' => 'Laura Martín', 'department' => 'Administración', 'status' => 'Activo'],
            ['id' => 'usr_2', 'name' => 'Carlos Ruiz', 'department' => 'Finanzas', 'status' => 'Activo'],
            ['id' => 'usr_3', 'name' => 'Ana Castro', 'department' => 'Recursos Humanos', 'status' => 'Activo'],
            ['id' => 'usr_4', 'name' => 'Marcos Vidal', 'department' => 'Comercial', 'status' => 'Activo'],
            ['id' => 'usr_5', 'name' => 'Elena Navarro', 'department' => 'Marketing', 'status' => 'Activo'],
            ['id' => 'usr_6', 'name' => 'Javier Ortega', 'department' => 'Operaciones', 'status' => 'Activo'],
            ['id' => 'usr_7', 'name' => 'Paula Iglesias', 'department' => 'Legal', 'status' => 'Activo'],
            ['id' => 'usr_8', 'name' => 'Pablo Serrano', 'department' => 'Desarrollo', 'status' => 'Inactivo'],
        ];
    }

    public static function tickets(): array
    {
        $tickets = session('helpdesk.tickets');

        if (! is_array($tickets)) {
            $tickets = self::seedTickets();
            self::saveTickets($tickets);
        }

        return $tickets;
    }

    public static function saveTickets(array $tickets): void
    {
        session(['helpdesk.tickets' => $tickets]);
    }

    public static function index(?string $id): ?int
    {
        foreach (self::tickets() as $index => $ticket) {
            if ($ticket['id'] === $id) {
                return $index;
            }
        }

        return null;
    }

    public static function find(?string $id): ?array
    {
        $index = self::index($id);

        return $index === null ? null : self::tickets()[$index];
    }

    public static function categoryName(?string $id): string
    {
        $name = self::nameFor(self::categories(), $id);
        if ($name !== 'No disponible') {
            return $name;
        }

        return Schema::hasTable('categories') ? (Category::find($id)?->name ?? 'No disponible') : 'No disponible';
    }

    public static function categoryColor(?string $id): string
    {
        foreach (self::categories() as $category) {
            if ($category['id'] === $id) {
                return $category['color'];
            }
        }

        $palette = ['#5b5bd6', '#4f7df3', '#1a9c6b', '#e08a00', '#d9603b'];

        return $palette[abs(crc32((string) $id)) % count($palette)];
    }

    public static function userName(?string $id): string
    {
        $name = self::nameFor(self::users(), $id);
        if ($name !== 'No disponible') {
            return $name;
        }

        return Schema::hasTable('users') ? (User::find($id)?->name ?? 'No disponible') : 'No disponible';
    }

    public static function userDepartment(?string $id): string
    {
        foreach (self::users() as $user) {
            if ($user['id'] === $id) {
                return $user['department'];
            }
        }

        if (! Schema::hasTable('users')) {
            return '—';
        }

        return match (User::find($id)?->role) {
            'admin' => 'Administración',
            'tecnico' => 'Soporte técnico',
            'usuario' => 'Usuario',
            default => '—',
        };
    }

    public static function technicianName(?string $id): string
    {
        if (! $id) {
            return 'Sin asignar';
        }

        $name = self::nameFor(self::technicians(), $id);

        return $name !== 'No disponible'
            ? $name
            : (Schema::hasTable('users') ? (User::find($id)?->name ?? 'Sin asignar') : 'Sin asignar');
    }

    public static function stats(array $tickets): array
    {
        $byStatus = array_fill_keys(self::STATUSES, 0);
        $active = 0;
        $resolved = 0;
        $criticalActive = 0;
        $unassigned = 0;
        $resolvedHours = [];
        $createdThisMonth = 0;
        $createdLastMonth = 0;
        $now = now();

        foreach ($tickets as $ticket) {
            $status = $ticket['status'];
            if (isset($byStatus[$status])) {
                $byStatus[$status] += 1;
            }

            $isActive = in_array($status, ['Abierto', 'En progreso', 'En espera'], true);
            $isResolved = in_array($status, ['Resuelto', 'Cerrado'], true);

            if ($isActive) {
                $active += 1;
                if ($ticket['priority'] === 'Crítica') {
                    $criticalActive += 1;
                }
                if (! $ticket['technicianId']) {
                    $unassigned += 1;
                }
            }

            if ($isResolved) {
                $resolved += 1;
                $created = Carbon::parse($ticket['createdAt']);
                $end = $ticket['resolvedAt'] ? Carbon::parse($ticket['resolvedAt']) : $created;
                $resolvedHours[] = max(0, $created->diffInHours($end));
            }

            $created = Carbon::parse($ticket['createdAt']);
            if ($created->greaterThanOrEqualTo($now->copy()->startOfMonth())) {
                $createdThisMonth += 1;
            }
            if ($created->between($now->copy()->subMonth()->startOfMonth(), $now->copy()->subMonth()->endOfMonth())) {
                $createdLastMonth += 1;
            }
        }

        $total = count($tickets);
        $rate = $total > 0 ? (int) round($resolved / $total * 100) : 0;
        $monthDelta = $createdLastMonth > 0
            ? (int) round(($createdThisMonth - $createdLastMonth) / $createdLastMonth * 100)
            : ($createdThisMonth > 0 ? 100 : 0);

        return [
            'total' => $total,
            'active' => $active,
            'resolved' => $resolved,
            'rate' => $rate,
            'open' => $byStatus['Abierto'],
            'inProgress' => $byStatus['En progreso'],
            'waiting' => $byStatus['En espera'],
            'byStatus' => $byStatus,
            'criticalActive' => $criticalActive,
            'unassigned' => $unassigned,
            'avgHours' => $resolvedHours ? (int) round(array_sum($resolvedHours) / count($resolvedHours)) : 0,
            'createdThisMonth' => $createdThisMonth,
            'monthDelta' => $monthDelta,
            'technicians' => self::workload($tickets),
        ];
    }

    public static function trend(array $tickets, int $days): array
    {
        $labels = [];
        $created = [];
        $resolved = [];

        for ($offset = $days - 1; $offset >= 0; $offset -= 1) {
            $day = now()->subDays($offset)->startOfDay();
            $key = $day->toDateString();
            $labels[] = $day->format('d/m');
            $created[$key] = 0;
            $resolved[$key] = 0;
        }

        foreach ($tickets as $ticket) {
            $createdKey = Carbon::parse($ticket['createdAt'])->toDateString();
            if (array_key_exists($createdKey, $created)) {
                $created[$createdKey] += 1;
            }
            if ($ticket['resolvedAt']) {
                $resolvedKey = Carbon::parse($ticket['resolvedAt'])->toDateString();
                if (array_key_exists($resolvedKey, $resolved)) {
                    $resolved[$resolvedKey] += 1;
                }
            }
        }

        return [
            'labels' => array_values($labels),
            'created' => array_values($created),
            'resolved' => array_values($resolved),
        ];
    }

    public static function filter(array $tickets, array $filters): Collection
    {
        $search = mb_strtolower(trim((string) ($filters['q'] ?? '')));
        $status = (string) ($filters['status'] ?? '');
        $priority = (string) ($filters['priority'] ?? '');
        $category = (string) ($filters['category'] ?? '');
        $technician = (string) ($filters['technician'] ?? '');

        $items = collect($tickets)->filter(function (array $ticket) use ($search, $status, $priority, $category, $technician) {
            if ($search !== '') {
                $haystack = mb_strtolower(
                    $ticket['code'].' '.$ticket['title'].' '.self::userName($ticket['userId']).' '.self::technicianName($ticket['technicianId'])
                );
                if (! str_contains($haystack, $search)) {
                    return false;
                }
            }

            if ($status !== '' && $ticket['status'] !== $status) {
                return false;
            }
            if ($priority !== '' && $ticket['priority'] !== $priority) {
                return false;
            }
            if ($category !== '' && $ticket['categoryId'] !== $category) {
                return false;
            }
            if ($technician === 'unassigned' && $ticket['technicianId']) {
                return false;
            }
            if ($technician !== '' && $technician !== 'unassigned' && $ticket['technicianId'] !== $technician) {
                return false;
            }

            return true;
        });

        $sort = (string) ($filters['sort'] ?? 'updatedAt');
        $direction = ($filters['direction'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        $value = function (array $ticket) use ($sort) {
            return match ($sort) {
                'code' => $ticket['code'],
                'title' => mb_strtolower($ticket['title']),
                'user' => mb_strtolower(self::userName($ticket['userId'])),
                'technician' => mb_strtolower(self::technicianName($ticket['technicianId'])),
                'priority' => (int) array_search($ticket['priority'], self::PRIORITIES, true),
                'status' => (int) array_search($ticket['status'], self::STATUSES, true),
                default => $ticket['updatedAt'],
            };
        };

        return $direction === 'asc' ? $items->sortBy($value)->values() : $items->sortByDesc($value)->values();
    }

    private static function workload(array $tickets): array
    {
        $workload = [];

        foreach (self::technicians() as $technician) {
            $active = 0;
            $resolved = 0;

            foreach ($tickets as $ticket) {
                if ($ticket['technicianId'] !== $technician['id']) {
                    continue;
                }
                if (in_array($ticket['status'], ['Abierto', 'En progreso', 'En espera'], true)) {
                    $active += 1;
                }
                if (in_array($ticket['status'], ['Resuelto', 'Cerrado'], true)) {
                    $resolved += 1;
                }
            }

            $workload[] = $technician + ['active' => $active, 'resolved' => $resolved];
        }

        usort($workload, fn (array $a, array $b) => $b['active'] <=> $a['active']);

        return $workload;
    }

    private static function nameFor(array $items, ?string $id): string
    {
        foreach ($items as $item) {
            if ($item['id'] === $id) {
                return $item['name'];
            }
        }

        return 'No disponible';
    }

    private static function seedTickets(): array
    {
        $templates = [
            ['No puedo conectarme a la VPN corporativa', 'La conexión se queda en «Conectando» y termina fallando. Ocurre desde esta mañana y afecta al acceso a los recursos internos.', 'cat_redes', 'Alta', 'En progreso', 'tech_1', 0],
            ['El correo no sincroniza en el móvil', 'Desde la última actualización el correo corporativo no se sincroniza en el dispositivo móvil. El buzón web funciona correctamente.', 'cat_correo', 'Media', 'Abierto', null, 1],
            ['Solicitud de acceso al ERP de finanzas', 'Necesito permisos de consulta y edición sobre el módulo de facturación para cubrir una ausencia temporal en el departamento.', 'cat_accesos', 'Alta', 'En espera', 'tech_4', 2],
            ['La impresora de recepción no imprime', 'La impresora muestra el trabajo en cola pero no emite documentos. Ya se reinició el equipo sin éxito.', 'cat_impresoras', 'Baja', 'Abierto', 'tech_3', 3],
            ['Equipo de escritorio muy lento', 'El ordenador tarda más de cinco minutos en iniciar sesión y las aplicaciones se bloquean de forma intermitente.', 'cat_hardware', 'Media', 'En progreso', 'tech_3', 5],
            ['Error al generar el reporte mensual', 'Al exportar el informe de cierre de mes aparece un error inesperado y se pierde el progreso del documento.', 'cat_software', 'Alta', 'Resuelto', 'tech_2', 8],
            ['Wi-Fi intermitente en la sala de reuniones', 'La conexión inalámbrica se corta durante las videollamadas. Afecta a la sala grande del segundo piso.', 'cat_redes', 'Alta', 'Resuelto', 'tech_1', 12],
            ['Restablecer contraseña de la cuenta de dominio', 'He olvidado la contraseña de mi cuenta corporativa y no puedo iniciar sesión en el equipo de trabajo.', 'cat_accesos', 'Media', 'Cerrado', 'tech_4', 18],
            ['Instalación de Microsoft 365 en portátil nuevo', 'El portátil asignado al nuevo incorporado necesita la suite ofimática y la configuración de correo corporativo.', 'cat_software', 'Media', 'Cerrado', 'tech_2', 27],
            ['Cortes de conexión en la oficina de Madrid', 'La conexión principal se cae varias veces al día. El router muestra reinicios automáticos en los registros.', 'cat_redes', 'Crítica', 'En progreso', 'tech_1', 40],
        ];

        $users = self::users();
        $tickets = [];

        foreach ($templates as $index => $template) {
            [$title, $description, $categoryId, $priority, $status, $technicianId, $daysAgo] = $template;
            $user = $users[$index % count($users)];
            $createdAt = self::daysAgo($daysAgo, 3);
            $resolvedAt = in_array($status, ['Resuelto', 'Cerrado'], true)
                ? self::plusHours($createdAt, 14 + $index * 3)
                : null;
            $updatedAt = $resolvedAt ?: self::plusHours($createdAt, 2 + ($index % 6));
            $number = 1060 - $index;

            $history = [
                ['action' => 'Solicitud creada', 'detail' => 'Solicitud registrada por '.$user['name'].'.', 'author' => $user['name'], 'createdAt' => $createdAt],
            ];

            if ($technicianId) {
                $history[] = [
                    'action' => 'Técnico asignado',
                    'detail' => 'Asignada a '.self::technicianName($technicianId).'.',
                    'author' => 'Sistema',
                    'createdAt' => self::plusHours($createdAt, 1),
                ];
            }

            if ($status !== 'Abierto') {
                $history[] = [
                    'action' => 'Estado actualizado',
                    'detail' => 'Abierto → '.$status.'.',
                    'author' => $technicianId ? self::technicianName($technicianId) : 'Sistema',
                    'createdAt' => $updatedAt,
                ];
            }

            $comments = [];
            if ($index % 3 === 0 || $index === 4) {
                $commentTime = self::plusHours($createdAt, 4);
                $comments[] = [
                    'authorName' => $technicianId ? self::technicianName($technicianId) : 'Equipo de soporte',
                    'role' => $technicianId ? 'Técnico' : 'Sistema',
                    'message' => 'Estamos revisando el caso. Te mantendré informado por este medio.',
                    'createdAt' => $commentTime,
                ];
                $history[] = [
                    'action' => 'Comentario agregado',
                    'detail' => 'Se añadió un comentario a la solicitud.',
                    'author' => $technicianId ? self::technicianName($technicianId) : 'Equipo de soporte',
                    'createdAt' => $commentTime,
                ];
            }

            $tickets[] = [
                'id' => 'tkt_'.($index + 1),
                'code' => 'HD-'.$number,
                'title' => $title,
                'description' => $description,
                'categoryId' => $categoryId,
                'userId' => $user['id'],
                'technicianId' => $technicianId,
                'priority' => $priority,
                'status' => $status,
                'dueDate' => self::plusHours($createdAt, 72),
                'resolvedAt' => $resolvedAt,
                'createdAt' => $createdAt,
                'updatedAt' => $updatedAt,
                'comments' => $comments,
                'history' => $history,
            ];
        }

        return $tickets;
    }

    private static function daysAgo(int $days, int $hours = 0): string
    {
        return now()->subDays($days)->subHours($hours)->toIso8601String();
    }

    private static function plusHours(string $date, int $hours): string
    {
        return Carbon::parse($date)->addHours($hours)->toIso8601String();
    }
}
