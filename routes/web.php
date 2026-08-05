<?php

use App\Http\Controllers\CueboardController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/dashboard', function () {
    return redirect('/cueboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('cueboard/profile', [CueboardController::class, 'profile'])->name('cueboard.profile');
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


        // Payment Status
        Route::get('/api/billing', [CueboardController::class, 'getBillingHistory']);
        Route::get('/api/billing/{id}', [CueboardController::class, 'getBillDetails']);
        Route::post('/api/billing/{id}/pay', [CueboardController::class, 'markAsPaid']);
        Route::post('/api/billing/{id}/unpay', [CueboardController::class, 'markAsUnpaid']);


        Route::get('/api/dashboard-stats', [CueboardController::class, 'getDashboardStats']);
        Route::get('/api/reports', [CueboardController::class, 'getReports']);
        Route::get('/api/reports/day', [CueboardController::class, 'getReportByDate']);


        Route::get('/api/categories', [CueboardController::class, 'getCategories']);
        Route::post('/api/categories', [CueboardController::class, 'storeCategory']);
        Route::put('/api/categories/{id}', [CueboardController::class, 'updateCategory']);
        Route::delete('/api/categories/{id}', [CueboardController::class, 'deleteCategory']);



        Route::get('/api/expenses', [CueboardController::class, 'getExpenses']);
        Route::post('/api/expenses', [CueboardController::class, 'storeExpense']);
        Route::put('/api/expenses/{id}', [CueboardController::class, 'updateExpense']);
        Route::delete('/api/expenses/{id}', [CueboardController::class, 'deleteExpense']);

        Route::post('/api/billing/{id}/payment', [CueboardController::class, 'updatePayment']);



        Route::delete('/api/orders/{orderId}', [CueboardController::class, 'removeOrder']);
        Route::post('/api/cancel-game', [CueboardController::class, 'cancelGame']);



        // Arcade
        Route::get('/api/arcade/packages', [CueboardController::class, 'getArcadePackages']);
        Route::post('/api/arcade/packages', [CueboardController::class, 'storeArcadePackage']);
        Route::put('/api/arcade/packages/{id}', [CueboardController::class, 'updateArcadePackage']);
        Route::delete('/api/arcade/packages/{id}', [CueboardController::class, 'deleteArcadePackage']);

        Route::get('/api/arcade/sales', [CueboardController::class, 'getArcadeSales']);
        Route::post('/api/arcade/sales', [CueboardController::class, 'storeArcadeSale']);
        Route::delete('/api/arcade/sales/{id}', [CueboardController::class, 'deleteArcadeSale']);
    });
});


require __DIR__ . '/auth.php';
