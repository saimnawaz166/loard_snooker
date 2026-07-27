<?php

use App\Http\Controllers\CueboardController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::prefix('cueboard')->name('cueboard.')->group(function () {
        Route::get('/', [CueboardController::class, 'index'])->name('index');
        Route::get('/api/tables', [CueboardController::class, 'getTables'])->name('api.tables');
        Route::get('/api/stock', [CueboardController::class, 'getStock'])->name('api.stock');
        Route::get('/api/sessions', [CueboardController::class, 'getActiveSessions'])->name('api.sessions');
        Route::get('/api/stock', [CueboardController::class, 'getStock']);
        Route::post('/api/stock', [CueboardController::class, 'storeStock']);
        Route::put('/api/stock/{id}', [CueboardController::class, 'updateStock']);
        Route::delete('/api/stock/{id}', [CueboardController::class, 'deleteStock']);
        // Game Types
        Route::get('/api/game-types', [CueboardController::class, 'getGameTypes']);
        Route::post('/api/game-types', [CueboardController::class, 'storeGameType']);
        Route::put('/api/game-types/{id}', [CueboardController::class, 'updateGameType']);
        Route::delete('/api/game-types/{id}', [CueboardController::class, 'deleteGameType']);

        // Game Sessions
        Route::post('/api/start-game', [CueboardController::class, 'startGame']);
        Route::get('/api/active-session/{tableId}', [CueboardController::class, 'getActiveSession']);
        Route::post('/api/add-order', [CueboardController::class, 'addOrder']);
        Route::post('/api/end-game', [CueboardController::class, 'endGame']);
    });
});


require __DIR__ . '/auth.php';
