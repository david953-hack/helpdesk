@extends('layouts.app')

@section('title', 'Detalle de categoría')

@section('content')
  <div class="page-head">
    <div>
      <h2>{{ $category->name }}</h2>
      <p>Información de la categoría y sus solicitudes asociadas.</p>
    </div>
    <a class="btn btn--secondary" href="{{ route('categories.index') }}">
      <i data-lucide="arrow-left"></i>Volver a categorías
    </a>
  </div>

  <div class="card">
    <div class="card-body">
      <div class="detail-props">
        <div class="detail-prop"><span class="detail-prop-label"><i data-lucide="hash"></i>ID</span><span class="detail-prop-value">{{ $category->id }}</span></div>
        <div class="detail-prop"><span class="detail-prop-label"><i data-lucide="tag"></i>Nombre</span><span class="detail-prop-value">{{ $category->name }}</span></div>
        <div class="detail-prop"><span class="detail-prop-label"><i data-lucide="ticket"></i>Tickets</span><span class="detail-prop-value">{{ $category->tickets()->count() }}</span></div>
      </div>
      <div class="modal-footer" style="padding-left: 0; padding-right: 0">
        <a class="btn btn--secondary" href="{{ route('categories.edit', $category) }}"><i data-lucide="pencil"></i>Editar</a>
        <a class="btn btn--primary" href="{{ route('tickets.index', ['category' => $category->id]) }}"><i data-lucide="ticket"></i>Ver tickets</a>
      </div>
    </div>
  </div>
@endsection
