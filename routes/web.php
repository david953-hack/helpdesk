<?php

use App\Http\Controllers\HelpdeskController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route('login'));

Route::get('/login', [HelpdeskController::class, 'showLogin'])->name('login');
Route::post('/login', [HelpdeskController::class, 'login'])->name('login.store');
Route::post('/logout', [HelpdeskController::class, 'logout'])->name('logout');

Route::get('/dashboard', [HelpdeskController::class, 'dashboard'])->name('dashboard');

Route::get('/tickets/export', [HelpdeskController::class, 'export'])->name('tickets.export');
Route::get('/tickets', [HelpdeskController::class, 'tickets'])->name('tickets.index');
Route::post('/tickets', [HelpdeskController::class, 'store'])->name('tickets.store');
Route::post('/tickets/{ticket}/comments', [HelpdeskController::class, 'comment'])->name('tickets.comments.store');
Route::get('/tickets/{ticket}', [HelpdeskController::class, 'show'])->name('tickets.show');
Route::put('/tickets/{ticket}', [HelpdeskController::class, 'update'])->name('tickets.update');
Route::delete('/tickets/{ticket}', [HelpdeskController::class, 'destroy'])->name('tickets.destroy');
