<?php

namespace App\Http\Controllers;

use App\Services\PhotoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TestController extends Controller
{
    public function testR2Connection(PhotoService $photoService)
    {
        try {
            // Test R2 connection
            $disk = Storage::disk('r2');

            // Try to list files in the bucket
            $files = $disk->files('items');

            return response()->json([
                'status' => 'success',
                'message' => 'R2 connection successful',
                'files_count' => count($files),
                'files' => array_slice($files, 0, 5), // Show first 5 files
                'public_url' => env('R2_PUBLIC_URL'),
                'bucket' => env('R2_BUCKET'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'R2 connection failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function testImageDeletion(PhotoService $photoService, Request $request)
    {
        try {
            $imagePath = $request->get('path');
            if (!$imagePath) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Image path is required',
                ], 400);
            }

            // Test if file exists
            $exists = $photoService->fileExists($imagePath);

            if (!$exists) {
                return response()->json([
                    'status' => 'info',
                    'message' => 'File does not exist',
                    'path' => $imagePath,
                ]);
            }

            // Try to delete the file
            $deleted = $photoService->forceDeletePhoto($imagePath);

            return response()->json([
                'status' => $deleted ? 'success' : 'error',
                'message' => $deleted ? 'File deleted successfully' : 'Failed to delete file',
                'path' => $imagePath,
                'deleted' => $deleted,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Test failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
