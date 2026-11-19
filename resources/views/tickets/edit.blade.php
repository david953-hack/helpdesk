@extends('layouts.app')

@section('title', 'Editar solicitud')

@section('content')
  <div class="page-head">
    <div>
      <h2>Editar solicitud</h2>
      <p>Actualiza la información de {{ $ticket['code'] }}.</p>
    </div>
    <a class="btn btn--secondary" href="{{ route('tickets.show', $ticket['id']) }}">
      <i data-lucide="arrow-left"></i>Volver al detalle
    </a>
  </div>

  <div class="card">
    <div class="card-body">
      @include('tickets._form', [
        'action' => route('tickets.update', $ticket['id']),
        'method' => 'PUT',
        'submitLabel' => 'Guardar cambios',
      ])
    </div>
  </div>
@endsection
