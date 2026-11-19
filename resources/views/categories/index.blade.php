@extends('layouts.app')

@section('title', 'Categorías')

@section('content')
  <div class="page-head">
    <div>
      <h2>Categorías</h2>
      <p>Administra las categorías disponibles para clasificar los tickets.</p>
    </div>
    <a class="btn btn--primary" href="{{ route('categories.create') }}">
      <i data-lucide="plus"></i>Nueva categoría
    </a>
  </div>

  @if ($errors->any())
    <div class="info-banner" role="alert">
      <i data-lucide="alert-circle"></i>
      <span>{{ $errors->first() }}</span>
    </div>
  @endif

  <div class="card table-card">
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Tickets</th>
            <th class="th-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          @forelse ($categories as $category)
            <tr>
              <td><span class="code-chip">#{{ $category->id }}</span></td>
              <td><span class="cell-main">{{ $category->name }}</span></td>
              <td>{{ $category->tickets()->count() }}</td>
              <td class="td-actions">
                <div class="row-actions">
                  <a class="icon-btn" href="{{ route('categories.show', $category) }}" title="Ver" aria-label="Ver">
                    <i data-lucide="eye"></i>
                  </a>
                  <a class="icon-btn" href="{{ route('categories.edit', $category) }}" title="Editar" aria-label="Editar">
                    <i data-lucide="pencil"></i>
                  </a>
                  <form action="{{ route('categories.destroy', $category) }}" method="POST" onsubmit="return confirm('¿Eliminar la categoría {{ $category->name }}?');">
                    @csrf
                    @method('DELETE')
                    <button type="submit" class="icon-btn icon-btn--danger" title="Eliminar" aria-label="Eliminar">
                      <i data-lucide="trash-2"></i>
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          @empty
            <tr>
              <td colspan="4">
                <div class="empty-state">
                  <span class="empty-state-icon"><i data-lucide="folder"></i></span>
                  <p class="empty-state-title">No hay categorías</p>
                  <p class="empty-state-text">Crea la primera categoría para clasificar las solicitudes.</p>
                </div>
              </td>
            </tr>
          @endforelse
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      {{ $categories->links() }}
    </div>
  </div>
@endsection
