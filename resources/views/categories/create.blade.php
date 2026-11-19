@extends('layouts.app')

@section('title', 'Nueva categoría')

@section('content')
  <div class="page-head">
    <div>
      <h2>Nueva categoría</h2>
      <p>Registra una categoría para clasificar las solicitudes.</p>
    </div>
    <a class="btn btn--secondary" href="{{ route('categories.index') }}">
      <i data-lucide="arrow-left"></i>Volver a categorías
    </a>
  </div>

  <div class="card">
    <div class="card-body" style="max-width: 520px">
      @if ($errors->any())
        <div class="info-banner" role="alert">
          <i data-lucide="alert-circle"></i>
          <span>{{ $errors->first() }}</span>
        </div>
      @endif

      <form action="{{ route('categories.store') }}" method="POST">
        @csrf
        <div class="field">
          <label for="category-name">Nombre <span class="req">*</span></label>
          <input class="input" id="category-name" name="name" type="text" value="{{ old('name') }}" placeholder="Ej. Hardware" required />
          @error('name')<span class="field-error">{{ $message }}</span>@enderror
        </div>
        <div class="modal-footer" style="padding-left: 0; padding-right: 0">
          <a class="btn btn--secondary" href="{{ route('categories.index') }}">Cancelar</a>
          <button type="submit" class="btn btn--primary"><i data-lucide="check"></i>Crear categoría</button>
        </div>
      </form>
    </div>
  </div>
@endsection
