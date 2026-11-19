@extends('layouts.app')

@section('title', 'Nueva solicitud')

@section('content')
  <div class="page-head">
    <div>
      <h2>Nueva solicitud</h2>
      <p>Registra una incidencia o petición de soporte.</p>
    </div>
    <a class="btn btn--secondary" href="{{ route('tickets.index') }}">
      <i data-lucide="arrow-left"></i>Volver a solicitudes
    </a>
  </div>

  <div class="card">
    <div class="card-body">
      @include('tickets._form', [
        'action' => route('tickets.store'),
        'method' => 'POST',
        'submitLabel' => 'Crear solicitud',
      ])
    </div>
  </div>
@endsection
