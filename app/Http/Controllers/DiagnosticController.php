<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class DiagnosticController extends Controller
{
    public function checkImageSupport()
    {
        $diagnostics = [];

        // Check PHP version
        $diagnostics['php_version'] = PHP_VERSION;

        // Check GD extension
        $diagnostics['gd_enabled'] = extension_loaded('gd');
        if ($diagnostics['gd_enabled']) {
            $diagnostics['gd_info'] = gd_info();
        }

        // Check Imagick extension
        $diagnostics['imagick_enabled'] = extension_loaded('imagick');
        if ($diagnostics['imagick_enabled']) {
            $imagick = new \Imagick();
            $diagnostics['imagick_version'] = $imagick->getVersion();
        }

        // Check Intervention Image driver
        try {
            $diagnostics['intervention_driver'] = config('image.driver', 'gd');
        } catch (\Exception $e) {
            $diagnostics['intervention_error'] = $e->getMessage();
        }

        // Check filesystem configuration
        $diagnostics['filesystem_default'] = config('filesystems.default');
        $diagnostics['spaces_config'] = [
            'endpoint' => config('filesystems.disks.spaces.endpoint'),
            'bucket' => config('filesystems.disks.spaces.bucket'),
            'region' => config('filesystems.disks.spaces.region'),
            'url' => config('filesystems.disks.spaces.url'),
            'key_exists' => !empty(config('filesystems.disks.spaces.key')),
            'secret_exists' => !empty(config('filesystems.disks.spaces.secret')),
        ];

        // Test DigitalOcean Spaces connection
        try {
            $disk = Storage::disk('spaces');
            
            // Try to create a test file
            $testContent = 'Test file created at ' . now();
            $testPath = 'diagnostics/test_' . time() . '.txt';
            
            $uploaded = $disk->put($testPath, $testContent);
            $diagnostics['spaces_upload_test'] = $uploaded ? 'SUCCESS' : 'FAILED';
            
            if ($uploaded) {
                // Check if file exists
                $exists = $disk->exists($testPath);
                $diagnostics['spaces_file_exists'] = $exists;
                
                // Try to delete it
                $deleted = $disk->delete($testPath);
                $diagnostics['spaces_delete_test'] = $deleted ? 'SUCCESS' : 'FAILED';
            }
        } catch (\Exception $e) {
            $diagnostics['spaces_connection_error'] = $e->getMessage();
            $diagnostics['spaces_error_trace'] = $e->getTraceAsString();
        }

        // Check memory limit
        $diagnostics['memory_limit'] = ini_get('memory_limit');
        $diagnostics['upload_max_filesize'] = ini_get('upload_max_filesize');
        $diagnostics['post_max_size'] = ini_get('post_max_size');

        return response()->json($diagnostics, 200, [], JSON_PRETTY_PRINT);
    }

    public function testImageProcessing(Request $request)
    {
        if (!$request->hasFile('image')) {
            return response()->json(['error' => 'No image provided'], 400);
        }

        $file = $request->file('image');
        $results = [];

        try {
            // Test basic image manipulation
            $image = \Intervention\Image\Facades\Image::make($file->getRealPath());
            
            $results['original_dimensions'] = [
                'width' => $image->width(),
                'height' => $image->height(),
            ];

            // Test resize
            $image->resize(100, 100);
            $results['resize_test'] = 'SUCCESS';

            // Test encode
            $encoded = $image->encode('jpg', 90)->encode();
            $results['encode_test'] = 'SUCCESS';
            $results['encoded_size'] = strlen($encoded);

        } catch (\Exception $e) {
            $results['image_processing_error'] = $e->getMessage();
            $results['error_trace'] = $e->getTraceAsString();
        }

        return response()->json($results, 200, [], JSON_PRETTY_PRINT);
    }
}
