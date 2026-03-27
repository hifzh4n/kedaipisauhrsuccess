<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Image Driver
    |--------------------------------------------------------------------------
    |
    | Intervention Image supports "GD Library" and "Imagick" to process images
    | internally. You may choose one of them according to your PHP
    | configuration. By default PHP's "GD Library" is used.
    |
    | Supported: "gd", "imagick"
    |
    */

    'driver' => env('IMAGE_DRIVER', 'gd'),

    /*
    |--------------------------------------------------------------------------
    | Image Cache
    |--------------------------------------------------------------------------
    |
    | This option controls the default cache driver used by Intervention Image.
    | You can change this option at any time.
    |
    | Supported: "file", "redis", "memcached"
    |
    */

    'cache' => env('IMAGE_CACHE', 'file'),

    /*
    |--------------------------------------------------------------------------
    | Image Cache Path
    |--------------------------------------------------------------------------
    |
    | This option controls the default cache path used by Intervention Image.
    | You can change this option at any time.
    |
    */

    'cache_path' => env('IMAGE_CACHE_PATH', storage_path('framework/cache/image')),

    /*
    |--------------------------------------------------------------------------
    | Image Cache Lifetime
    |--------------------------------------------------------------------------
    |
    | This option controls the default cache lifetime used by Intervention Image.
    | You can change this option at any time.
    |
    */

    'cache_lifetime' => env('IMAGE_CACHE_LIFETIME', 43200), // 12 hours

];
