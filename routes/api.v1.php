<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1 Routes
|--------------------------------------------------------------------------
|
| Versioned API routes for future compatibility and maintenance
|
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

// Health check endpoint (public)
Route::get('/health', function () {
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        return response()->json([
            'ok' => true,
            'status' => 'healthy',
            'timestamp' => now()->toIso8601String(),
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'ok' => false,
            'status' => 'unhealthy',
            'error' => $e->getMessage(),
            'timestamp' => now()->toIso8601String(),
        ], 503);
    }
});
