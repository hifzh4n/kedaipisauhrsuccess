<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class AuditLogService
{
    /**
     * Log a user action
     */
    public static function log($action, $description, $modelType = null, $modelId = null, $changes = null): void
    {
        $user = auth()->user();

        Log::channel('audit')->info('User Action', [
            'user_id' => $user?->id,
            'user_name' => $user?->name,
            'ip_address' => request()->ip(),
            'action' => $action,
            'description' => $description,
            'model_type' => $modelType,
            'model_id' => $modelId,
            'changes' => $changes,
            'user_agent' => request()->userAgent(),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Log an API request
     */
    public static function logApiRequest($method, $endpoint, $statusCode, $responseTime, $userId = null): void
    {
        Log::channel('api')->info('API Request', [
            'method' => $method,
            'endpoint' => $endpoint,
            'status_code' => $statusCode,
            'response_time_ms' => $responseTime,
            'user_id' => $userId,
            'ip_address' => request()->ip(),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Log an error
     */
    public static function logError($errorType, $message, $exception = null): void
    {
        Log::channel('errors')->error("$errorType Error", [
            'message' => $message,
            'exception' => $exception ? $exception->getMessage() : null,
            'trace' => $exception ? $exception->getTraceAsString() : null,
            'user_id' => auth()->id(),
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
