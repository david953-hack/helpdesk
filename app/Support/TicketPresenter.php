<?php

namespace App\Support;

use App\Models\Ticket;
use Illuminate\Support\Collection;

class TicketPresenter
{
    public const ACTIVE_STATUSES = ['Abierto', 'En progreso', 'En espera'];

    public const RESOLVED_STATUSES = ['Resuelto', 'Cerrado'];

    public static function toArray(Ticket $ticket): array
    {
        $createdAt = $ticket->created_at?->toIso8601String() ?? now()->toIso8601String();
        $updatedAt = $ticket->updated_at?->toIso8601String() ?? $createdAt;
        $resolved = in_array($ticket->status, self::RESOLVED_STATUSES, true);

        return [
            'id' => $ticket->id,
            'code' => 'HD-'.str_pad((string) $ticket->id, 4, '0', STR_PAD_LEFT),
            'title' => $ticket->title,
            'description' => $ticket->description,
            'status' => $ticket->status,
            'priority' => $ticket->priority,
            'categoryId' => (string) $ticket->category_id,
            'userId' => (string) $ticket->user_id,
            'technicianId' => $ticket->assigned_to === null ? null : (string) $ticket->assigned_to,
            'createdAt' => $createdAt,
            'updatedAt' => $updatedAt,
            'dueDate' => null,
            'resolvedAt' => $resolved ? $updatedAt : null,
            'comments' => [],
            'history' => [
                [
                    'action' => 'Solicitud creada',
                    'detail' => 'Solicitud registrada en el sistema.',
                    'author' => 'Sistema',
                    'createdAt' => $createdAt,
                ],
            ],
        ];
    }

    public static function collection(Collection $tickets): array
    {
        return $tickets->map(fn (Ticket $ticket) => self::toArray($ticket))->all();
    }
}
