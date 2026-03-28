<?php

namespace App\Http\Controllers;

use App\Services\PhotoService;
use Illuminate\Http\Request;

class TestController extends Controller
{
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
