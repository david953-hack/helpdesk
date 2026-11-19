<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@yield('title', 'Iniciar sesión') · HelpDesk</title>
    <link rel="icon" href="{{ asset('assets/images/favicon.svg') }}" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;550;600;650;700&display=swap" rel="stylesheet" />
    @foreach (['variables.css', 'main.css', 'components.css', 'layout.css', 'responsive.css'] as $stylesheet)
      <link rel="stylesheet" href="{{ asset('assets/css/' . $stylesheet) }}" />
    @endforeach
    @stack('styles')
  </head>
  <body class="login-body" data-page="login" data-public="true">
    @yield('content')

    <script src="https://unpkg.com/lucide@latest"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function () {
        if (window.lucide) {
          window.lucide.createIcons();
        }
      });
    </script>
    @stack('scripts')
  </body>
</html>
