@php
  $tones = [
    'Baja' => 'neutral',
    'Media' => 'info',
    'Alta' => 'warning',
    'Crítica' => 'danger',
  ];
  $tone = $tones[$priority] ?? 'neutral';
@endphp
<span class="badge badge--{{ $tone }}"><i data-lucide="flag"></i>{{ $priority }}</span>
