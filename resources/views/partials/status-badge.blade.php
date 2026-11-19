@php
  $tones = [
    'Abierto' => ['accent', 'circle-dot'],
    'En progreso' => ['info', 'loader'],
    'En espera' => ['warning', 'clock'],
    'Resuelto' => ['success', 'check-circle'],
    'Cerrado' => ['neutral', 'archive'],
  ];
  [$tone, $icon] = $tones[$status] ?? ['neutral', 'circle'];
@endphp
<span class="badge badge--{{ $tone }}"><i data-lucide="{{ $icon }}"></i>{{ $status }}</span>
