<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\TestController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\ItemModelController;
use App\Http\Controllers\ColorController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/desktop/health', function () {
    try {
        DB::connection()->getPdo();

        return response()->json([
            'ok' => true,
            'app' => 'ready',
            'database' => 'connected',
            'timestamp' => now()->toIso8601String(),
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'ok' => false,
            'app' => 'booted',
            'database' => 'failed',
            'error' => $e->getMessage(),
        ], 500);
    }
});

Route::get('/', function () {
    // If user is authenticated, redirect to dashboard
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    // If not authenticated, redirect to login
    return redirect()->route('login');
});

// Download routes (without Inertia middleware)
Route::middleware(['download', 'auth', 'staff'])->group(function () {
    Route::get('items/download-pdf/{filename}', [ItemController::class, 'downloadPdf'])->name('items.download-pdf');
    Route::get('stocks/download-pdf/{filename}', [StockController::class, 'downloadPdf'])->name('stocks.download-pdf');
});

Route::get('/dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->middleware(['auth', 'staff'])->name('dashboard');

// Development-only test routes
if (app()->isLocal()) {
    Route::get('/test-image-deletion', [TestController::class, 'testImageDeletion'])->middleware('auth');

    // Test database backup functionality
    Route::get('/test-backup', function () {
        try {
            $backupService = new \App\Services\DatabaseBackupService();
            $result = $backupService->createBackup();

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    })->middleware('auth');

    // Test route for debugging database
    Route::get('/test-db', function () {
        try {
            $itemCount = \App\Models\Item::count();
            $stockMovementCount = \App\Models\StockMovement::count();
            $stockBatchCount = \App\Models\StockBatch::count();

            return response()->json([
                'success' => true,
                'data' => [
                    'items' => $itemCount,
                    'stock_movements' => $stockMovementCount,
                    'stock_batches' => $stockBatchCount,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    });

    // Test route for debugging stock controller
    Route::get('/test-stock-controller', function () {
        try {
            // Test basic database operations
            $itemCount = \App\Models\Item::count();
            $stockMovementCount = \App\Models\StockMovement::count();
            $stockBatchCount = \App\Models\StockBatch::count();

            // Test basic queries
            $testMovement = \App\Models\StockMovement::with('item')->first();
            $testBatch = \App\Models\StockBatch::with('item')->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'items' => $itemCount,
                    'stock_movements' => $stockMovementCount,
                    'stock_batches' => $stockBatchCount,
                    'test_movement' => $testMovement ? [
                        'id' => $testMovement->id,
                        'has_item' => $testMovement->item ? 'yes' : 'no',
                        'item_id' => $testMovement->item_id
                    ] : null,
                    'test_batch' => $testBatch ? [
                        'id' => $testBatch->id,
                        'has_item' => $testBatch->item ? 'yes' : 'no',
                        'item_id' => $testBatch->item_id
                    ] : null
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    });

}


Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Database backup routes
    Route::post('/profile/database/backup', [ProfileController::class, 'createDatabaseBackup'])->name('profile.database.backup');
    Route::get('/profile/database/backup/{filename}/download', [ProfileController::class, 'downloadDatabaseBackup'])->name('profile.database.backup.download');
    Route::delete('/profile/database/backup/{filename}', [ProfileController::class, 'deleteDatabaseBackup'])->name('profile.database.backup.delete');
});

// Admin-only routes (User Management)
Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/users', [UserManagementController::class, 'index'])->name('users.index');
    Route::get('/users/create', [UserManagementController::class, 'create'])->name('users.create');
    Route::post('/users', [UserManagementController::class, 'store'])->name('users.store');
    Route::patch('/users/{user}', [UserManagementController::class, 'update'])->name('users.update');
    Route::patch('/users/{user}/toggle-status', [UserManagementController::class, 'toggleStatus'])->name('users.toggle-status');
    Route::patch('/users/{user}/make-admin', [UserManagementController::class, 'makeAdmin'])->name('users.make-admin');
    Route::delete('/users/{user}', [UserManagementController::class, 'destroy'])->name('users.destroy');
});

// Item Management Routes (Staff and Admin)
Route::middleware(['auth', 'staff'])->group(function () {
    // Custom routes must come before resource routes
    Route::get('items/download-template', [ItemController::class, 'downloadTemplate'])->name('items.download-template');
    Route::post('items/export-pdf', [ItemController::class, 'exportPdf'])->name('items.export-pdf');
    Route::get('items/export-status', [ItemController::class, 'checkExportStatus'])->name('items.export-status');
    Route::post('items/export-csv', [ItemController::class, 'exportCsv'])->name('items.export-csv');
    Route::post('items/export-xlsx', [ItemController::class, 'exportXlsx'])->name('items.export-xlsx');
    Route::post('items/bulk-import', [ItemController::class, 'bulkImport'])->name('items.bulk-import');
    Route::get('items/import-errors', [ItemController::class, 'importErrors'])->name('items.import-errors');

    // Resource routes
    Route::resource('items', ItemController::class);

    // Additional route for file uploads (accepts POST with method spoofing)
    Route::post('items/{item}', [ItemController::class, 'update'])->name('items.update.post');

    // Brand, Model, Color Routes
    Route::post('brands', [BrandController::class, 'store'])->name('brands.store');
    Route::post('models', [ItemModelController::class, 'store'])->name('models.store');
    Route::post('colors', [ColorController::class, 'store'])->name('colors.store');

    // Attribute Management Routes
    Route::get('attributes', [App\Http\Controllers\AttributeController::class, 'index'])->name('attributes.index');
    Route::post('attributes/brands', [App\Http\Controllers\AttributeController::class, 'storeBrand'])->name('attributes.brands.store');
    Route::put('attributes/brands/{brand}', [App\Http\Controllers\AttributeController::class, 'updateBrand'])->name('attributes.brands.update');
    Route::delete('attributes/brands/{brand}', [App\Http\Controllers\AttributeController::class, 'destroyBrand'])->name('attributes.brands.destroy');
    Route::post('attributes/models', [App\Http\Controllers\AttributeController::class, 'storeModel'])->name('attributes.models.store');
    Route::put('attributes/models/{model}', [App\Http\Controllers\AttributeController::class, 'updateModel'])->name('attributes.models.update');
    Route::delete('attributes/models/{model}', [App\Http\Controllers\AttributeController::class, 'destroyModel'])->name('attributes.models.destroy');
    Route::post('attributes/colors', [App\Http\Controllers\AttributeController::class, 'storeColor'])->name('attributes.colors.store');
    Route::put('attributes/colors/{color}', [App\Http\Controllers\AttributeController::class, 'updateColor'])->name('attributes.colors.update');
    Route::delete('attributes/colors/{color}', [App\Http\Controllers\AttributeController::class, 'destroyColor'])->name('attributes.colors.destroy');
});

// Stock Management Routes (Staff and Admin)
Route::middleware(['auth', 'staff'])->group(function () {
    // Stock history (main landing page)
    Route::get('stocks', [StockController::class, 'index'])->name('stocks.index');

    // Current stock levels
    Route::get('stocks/current', [StockController::class, 'currentStock'])->name('stocks.current');

    // Stock history (legacy route)
    Route::get('stocks/history', [StockController::class, 'history'])->name('stocks.history');

    // Stock In/Out operations
    Route::post('stocks/in', [StockController::class, 'stockIn'])->name('stocks.in');
    Route::post('stocks/out', [StockController::class, 'stockOut'])->name('stocks.out');

    // Stock aging report
    Route::get('stocks/aging', [StockController::class, 'aging'])->name('stocks.aging');

    // Damaged items report
    Route::get('stocks/damaged', [StockController::class, 'damagedItems'])->name('stocks.damaged');

    // Export functionality
    Route::get('stocks/export', [StockController::class, 'export'])->name('stocks.export');
    Route::post('stocks/export', [StockController::class, 'export'])->name('stocks.export.post');
    Route::get('stocks/export-status', [StockController::class, 'checkExportStatus'])->name('stocks.export-status');
    Route::delete('stocks/batch/{id}', [StockController::class, 'deleteBatch'])->name('stocks.batch.delete');

    // API endpoints for modals
    Route::get('stocks/items/search', [StockController::class, 'searchItems'])->name('stocks.items.search');
});

require __DIR__ . '/auth.php';
