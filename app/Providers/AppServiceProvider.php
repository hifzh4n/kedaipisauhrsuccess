<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Add security headers for production
        if (app()->environment('production')) {
            Response::macro('withSecurityHeaders', function () {
                return $this->withHeaders([
                    'X-Frame-Options' => 'SAMEORIGIN',
                    'X-Content-Type-Options' => 'nosniff',
                    'X-XSS-Protection' => '1; mode=block',
                    'Referrer-Policy' => 'strict-origin-when-cross-origin',
                    'Permissions-Policy' => 'geolocation=(), microphone=(), camera=()',
                ]);
            });
        }
    }
}
