<?php

namespace App\Http\Controllers;

use App\Support\HelpdeskData;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Str;

class HelpdeskController extends Controller
{
    public function showLogin(Request $request)
    {
        if ($request->session()->has('helpdesk.user')) {
            return redirect()->route('dashboard');
        }

        return view('login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        foreach (HelpdeskData::accounts() as $account) {
            if ($account['email'] === $credentials['email'] && $account['password'] === $credentials['password']) {
                $request->session()->put('helpdesk.user', [
                    'id' => $account['id'],
                    'name' => $account['name'],
                    'email' => $account['email'],
                    'role' => $account['role'],
                ]);

                return redirect()->route('dashboard');
            }
        }

        return back()->withInput()->withErrors([
            'password' => 'Las credenciales no son correctas.',
        ]);
    }

    public function logout(Request $request)
    {
        $request->session()->forget('helpdesk.user');

        return redirect()->route('login');
    }

    public function dashboard(Request $request)
    {
        if ($redirect = $this->requireAuth($request)) {
            return $redirect;
        }

        $days = (int) $request->query('range', 14);
        $days = in_array($days, [7, 14, 30], true) ? $days : 14;

        $tickets = HelpdeskData::tickets();
        $stats = HelpdeskData::stats($tickets);
        $trend = HelpdeskData::trend($tickets, $days);
        $recent = collect($tickets)->sortByDesc('updatedAt')->take(6)->values()->all();
        $statCards = $this->statCards($stats);

        return view('dashboard', array_merge(compact('days', 'stats', 'statCards', 'trend', 'recent'), [
            'active' => 'dashboard',
            'title' => 'Panel',
            'subtitle' => 'Resumen general del servicio de soporte',
        ]));
    }

    public function tickets(Request $request)
    {
        if ($redirect = $this->requireAuth($request)) {
            return $redirect;
        }

        $filters = [
            'q' => trim((string) $request->query('q', '')),
            'status' => (string) $request->query('status', ''),
            'priority' => (string) $request->query('priority', ''),
            'category' => (string) $request->query('category', ''),
            'technician' => (string) $request->query('technician', ''),
            'sort' => (string) $request->query('sort', 'updatedAt'),
            'direction' => (string) $request->query('direction', 'desc'),
        ];

        $items = HelpdeskData::filter(HelpdeskData::tickets(), $filters);
        $perPage = 10;
        $page = max(1, (int) $request->query('page', 1));
        $paginator = new LengthAwarePaginator(
            $items->forPage($page, $perPage)->values()->all(),
            $items->count(),
            $perPage,
            $page,
            ['path' => route('tickets.index')]
        );
        $paginator->withQueryString();

        return view('tickets.index', [
            'active' => 'tickets',
            'title' => 'Solicitudes',
            'subtitle' => 'Gestiona y da seguimiento a los tickets',
            'tickets' => $paginator,
            'filters' => $filters,
            'categories' => HelpdeskData::categories(),
            'technicians' => HelpdeskData::technicians(),
            'users' => HelpdeskData::users(),
            'statuses' => HelpdeskData::STATUSES,
            'priorities' => HelpdeskData::PRIORITIES,
            'showCreate' => $request->query('new') === '1' || old('title') !== null,
        ]);
    }

    public function store(Request $request)
    {
        if ($redirect = $this->requireAuth($request)) {
            return $redirect;
        }

        $data = $request->validate($this->rules());
        $tickets = HelpdeskData::tickets();
        $now = now()->toIso8601String();
        $number = 1061 + count($tickets);
        $user = $request->session()->get('helpdesk.user');

        $ticket = [
            'id' => 'tkt_'.Str::lower(Str::random(8)),
            'code' => 'HD-'.$number,
            'title' => $data['title'],
            'description' => $data['description'],
            'categoryId' => $data['category_id'],
            'userId' => $data['user_id'],
            'technicianId' => $data['technician_id'] ?: null,
            'priority' => $data['priority'],
            'status' => $data['status'],
            'dueDate' => $data['due_date'] ? Carbon::parse($data['due_date'])->toIso8601String() : null,
            'resolvedAt' => in_array($data['status'], ['Resuelto', 'Cerrado'], true) ? $now : null,
            'createdAt' => $now,
            'updatedAt' => $now,
            'comments' => [],
            'history' => [
                [
                    'action' => 'Solicitud creada',
                    'detail' => 'Solicitud registrada por '.$user['name'].'.',
                    'author' => $user['name'],
                    'createdAt' => $now,
                ],
            ],
        ];

        array_unshift($tickets, $ticket);
        HelpdeskData::saveTickets($tickets);

        return redirect()->route('tickets.show', $ticket['id'])
            ->with('status', 'Solicitud creada correctamente.');
    }

    public function show(Request $request, string $ticketId)
    {
        if ($redirect = $this->requireAuth($request)) {
            return $redirect;
        }

        $ticket = HelpdeskData::find($ticketId);

        return view('tickets.show', [
            'active' => 'tickets',
            'title' => 'Detalle de solicitud',
            'subtitle' => 'Seguimiento, historial y comentarios',
            'ticket' => $ticket,
            'categories' => HelpdeskData::categories(),
            'technicians' => HelpdeskData::technicians(),
            'users' => HelpdeskData::users(),
            'statuses' => HelpdeskData::STATUSES,
            'priorities' => HelpdeskData::PRIORITIES,
        ]);
    }

    public function update(Request $request, string $ticketId)
    {
        if ($redirect = $this->requireAuth($request)) {
            return $redirect;
        }

        $index = HelpdeskData::index($ticketId);
        if ($index === null) {
            abort(404);
        }

        $data = $request->validate($this->rules(true));
        $tickets = HelpdeskData::tickets();
        $ticket = $tickets[$index];
        $now = now()->toIso8601String();
        $user = $request->session()->get('helpdesk.user');

        $fields = [
            'title' => 'title',
            'description' => 'description',
            'user_id' => 'userId',
            'category_id' => 'categoryId',
            'technician_id' => 'technicianId',
            'priority' => 'priority',
            'status' => 'status',
        ];

        $oldStatus = $ticket['status'];
        $statusChanged = array_key_exists('status', $data) && $data['status'] !== $oldStatus;
        $technicianChanged = array_key_exists('technician_id', $data) && $data['technician_id'] !== ($ticket['technicianId'] ?? '');

        foreach ($fields as $input => $attribute) {
            if (array_key_exists($input, $data)) {
                $ticket[$attribute] = $attribute === 'technicianId'
                    ? ($data[$input] ?: null)
                    : $data[$input];
            }
        }

        if (array_key_exists('due_date', $data)) {
            $ticket['dueDate'] = $data['due_date'] ? Carbon::parse($data['due_date'])->toIso8601String() : null;
        }

        if ($statusChanged) {
            $ticket['resolvedAt'] = in_array($data['status'], ['Resuelto', 'Cerrado'], true) ? $now : null;
            $ticket['history'][] = [
                'action' => 'Estado actualizado',
                'detail' => $oldStatus.' → '.$data['status'],
                'author' => $user['name'],
                'createdAt' => $now,
            ];
        }

        if ($technicianChanged) {
            $ticket['history'][] = [
                'action' => 'Técnico asignado',
                'detail' => 'Asignada a '.HelpdeskData::technicianName($ticket['technicianId']).'.',
                'author' => $user['name'],
                'createdAt' => $now,
            ];
        }

        $ticket['updatedAt'] = $now;
        $tickets[$index] = $ticket;
        HelpdeskData::saveTickets($tickets);

        return redirect()->route('tickets.show', $ticketId)
            ->with('status', 'Solicitud actualizada correctamente.');
    }

    public function destroy(Request $request, string $ticketId)
    {
        if ($redirect = $this->requireAuth($request)) {
            return $redirect;
        }

        $index = HelpdeskData::index($ticketId);
        if ($index === null) {
            abort(404);
        }

        $tickets = HelpdeskData::tickets();
        array_splice($tickets, $index, 1);
        HelpdeskData::saveTickets($tickets);

        return redirect()->route('tickets.index')
            ->with('status', 'Solicitud eliminada correctamente.');
    }

    public function comment(Request $request, string $ticketId)
    {
        if ($redirect = $this->requireAuth($request)) {
            return $redirect;
        }

        $data = $request->validate([
            'message' => ['required', 'string', 'min:3', 'max:1000'],
        ]);

        $index = HelpdeskData::index($ticketId);
        if ($index === null) {
            abort(404);
        }

        $tickets = HelpdeskData::tickets();
        $ticket = $tickets[$index];
        $now = now()->toIso8601String();
        $user = $request->session()->get('helpdesk.user');

        $ticket['comments'][] = [
            'authorName' => $user['name'],
            'role' => $user['role'],
            'message' => $data['message'],
            'createdAt' => $now,
        ];
        $ticket['history'][] = [
            'action' => 'Comentario agregado',
            'detail' => $user['name'].' añadió un comentario.',
            'author' => $user['name'],
            'createdAt' => $now,
        ];
        $ticket['updatedAt'] = $now;

        $tickets[$index] = $ticket;
        HelpdeskData::saveTickets($tickets);

        return redirect()->route('tickets.show', $ticketId)
            ->with('status', 'Comentario publicado correctamente.');
    }

    public function export(Request $request)
    {
        if ($redirect = $this->requireAuth($request)) {
            return $redirect;
        }

        $filters = $request->only(['q', 'status', 'priority', 'category', 'technician', 'sort', 'direction']);
        $tickets = HelpdeskData::filter(HelpdeskData::tickets(), $filters);

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="solicitudes-helpdesk.csv"',
            'Cache-Control' => 'no-store',
        ];

        return response()->stream(function () use ($tickets) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['Código', 'Título', 'Estado', 'Prioridad', 'Categoría', 'Solicitante', 'Técnico', 'Creado', 'Actualizado']);

            foreach ($tickets as $ticket) {
                fputcsv($handle, [
                    $ticket['code'],
                    $ticket['title'],
                    $ticket['status'],
                    $ticket['priority'],
                    HelpdeskData::categoryName($ticket['categoryId']),
                    HelpdeskData::userName($ticket['userId']),
                    HelpdeskData::technicianName($ticket['technicianId']),
                    Carbon::parse($ticket['createdAt'])->format('d/m/Y H:i'),
                    Carbon::parse($ticket['updatedAt'])->format('d/m/Y H:i'),
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }

    private function requireAuth(Request $request)
    {
        if (! $request->session()->has('helpdesk.user')) {
            return redirect()->route('login');
        }

        return null;
    }

    private function rules(bool $partial = false): array
    {
        $prefix = $partial ? 'sometimes|' : '';
        $userId = implode(',', array_column(HelpdeskData::users(), 'id'));
        $categoryId = implode(',', array_column(HelpdeskData::categories(), 'id'));
        $technicianId = implode(',', array_column(HelpdeskData::technicians(), 'id'));

        return [
            'title' => $prefix.'required|string|min:5|max:150',
            'description' => $prefix.'required|string|min:10',
            'user_id' => $prefix.'required|in:'.$userId,
            'category_id' => $prefix.'required|in:'.$categoryId,
            'technician_id' => $prefix.'nullable|in:'.$technicianId,
            'priority' => $prefix.'required|in:'.implode(',', HelpdeskData::PRIORITIES),
            'status' => $prefix.'required|in:'.implode(',', HelpdeskData::STATUSES),
            'due_date' => 'nullable|date',
        ];
    }

    private function statCards(array $stats): array
    {
        $deltaTone = $stats['monthDelta'] > 0 ? 'up' : ($stats['monthDelta'] < 0 ? 'down' : 'flat');
        $deltaIcon = $stats['monthDelta'] > 0 ? 'trending-up' : ($stats['monthDelta'] < 0 ? 'trending-down' : 'minus');
        $deltaText = ($stats['monthDelta'] > 0 ? '+' : '').$stats['monthDelta'].'% mes';

        return [
            [
                'tone' => 'accent',
                'icon' => 'inbox',
                'value' => (string) $stats['total'],
                'label' => 'Total de solicitudes',
                'foot' => $stats['createdThisMonth'].' creadas este mes',
                'badge' => ['tone' => $deltaTone, 'icon' => $deltaIcon, 'text' => $deltaText],
            ],
            [
                'tone' => 'warning',
                'icon' => 'clock',
                'value' => (string) $stats['active'],
                'label' => 'Solicitudes activas',
                'foot' => $stats['open'].' abiertas · '.$stats['inProgress'].' en progreso · '.$stats['waiting'].' en espera',
                'badge' => $stats['criticalActive'] > 0
                    ? ['tone' => 'down', 'icon' => 'alert-triangle', 'text' => $stats['criticalActive'].' críticas']
                    : ['tone' => 'up', 'icon' => 'check', 'text' => 'Al día'],
            ],
            [
                'tone' => 'success',
                'icon' => 'check-circle',
                'value' => (string) $stats['resolved'],
                'label' => 'Solicitudes resueltas',
                'foot' => 'Tasa de resolución del '.$stats['rate'].'%',
                'badge' => ['tone' => 'up', 'icon' => 'check-circle', 'text' => $stats['rate'].'%'],
            ],
            [
                'tone' => 'info',
                'icon' => 'timer',
                'value' => $stats['avgHours'].' h',
                'label' => 'Tiempo medio de resolución',
                'foot' => 'Desde la creación hasta la resolución',
                'badge' => $stats['unassigned'] > 0
                    ? ['tone' => 'flat', 'icon' => 'user-x', 'text' => $stats['unassigned'].' sin asignar']
                    : ['tone' => 'flat', 'icon' => 'check', 'text' => 'Todo asignado'],
            ],
        ];
    }
}
