<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Facades\Image;

class PhotoService
{
    private $disk;
    private $publicUrl;

    public function __construct()
    {
        $this->disk = Storage::disk('r2');
        $this->publicUrl = config('app.env') === 'production'
            ? env('R2_PUBLIC_URL')
            : env('R2_PUBLIC_URL'); // Use public URL for both environments
    }

    /**
     * Upload a photo to Cloudflare R2
     *
     * @param UploadedFile $file
     * @param string $folder
     * @return string|null The file path on success, null on failure
     */
    public function uploadPhoto(UploadedFile $file, string $folder = 'items'): ?string
    {
        try {
            // Validate file
            if (!$this->isValidImage($file)) {
                return null;
            }

            // Process image to square format
            $processedImage = $this->processImageToSquare($file);
            if (!$processedImage) {
                return null;
            }

            // Generate unique filename
            $filename = $this->generateUniqueFilename($file);

            // Full path in R2 bucket
            $path = $folder . '/' . $filename;

            // Upload to R2
            \Log::info("Uploading processed photo to R2: {$path}");
            $uploaded = $this->disk->put($path, $processedImage, [
                'ContentType' => $file->getMimeType(),
                'CacheControl' => 'max-age=31536000', // 1 year cache
            ]);

            if ($uploaded) {
                \Log::info("Successfully uploaded processed photo to R2: {$path}");
                return $path;
            } else {
                \Log::error("Failed to upload processed photo to R2: {$path}");
                return null;
            }
        } catch (\Exception $e) {
            \Log::error('Photo upload failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Process image to square 1:1 format
     *
     * @param UploadedFile $file
     * @param int $squareSize The desired square size (default: auto-detect)
     * @return string|null The processed image data as string, null on failure
     */
    private function processImageToSquare(UploadedFile $file, int $squareSize = null): ?string
    {
        try {
            // Create image instance
            $image = Image::make($file->getRealPath());

            // Get original dimensions
            $width = $image->width();
            $height = $image->height();

            // Determine the size for the square (use the larger dimension or specified size)
            if ($squareSize === null) {
                $squareSize = max($width, $height);
            }

            // Calculate the crop dimensions to center the image
            if ($width > $height) {
                // Landscape image - crop from center
                $cropWidth = $height;
                $cropHeight = $height;
                $cropX = ($width - $height) / 2;
                $cropY = 0;
            } elseif ($height > $width) {
                // Portrait image - crop from center
                $cropWidth = $width;
                $cropHeight = $width;
                $cropX = 0;
                $cropY = ($height - $width) / 2;
            } else {
                // Already square
                $cropWidth = $width;
                $cropHeight = $height;
                $cropX = 0;
                $cropY = 0;
            }

            // Crop to square first (if not already square)
            if ($width !== $height) {
                $image->crop($cropWidth, $cropHeight, $cropX, $cropY);
            }

            // Now resize to the target square size
            $image->resize($squareSize, $squareSize);

            // Convert to the original format and get as string
            $extension = strtolower($file->getClientOriginalExtension());

            // Determine output format based on original file
            switch ($extension) {
                case 'jpg':
                case 'jpeg':
                    return $image->encode('jpg', 90)->encode();
                case 'png':
                    return $image->encode('png')->encode();
                case 'gif':
                    return $image->encode('gif')->encode();
                case 'webp':
                    return $image->encode('webp', 90)->encode();
                default:
                    // Default to JPEG if format not recognized
                    return $image->encode('jpg', 90)->encode();
            }
        } catch (\Exception $e) {
            \Log::error('Image processing failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Process image to square 1:1 format with custom crop position
     *
     * @param UploadedFile $file
     * @param int $squareSize The desired square size (default: auto-detect)
     * @param string $cropPosition The crop position: 'center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
     * @return string|null The processed image data as string, null on failure
     */
    private function processImageToSquareWithPosition(UploadedFile $file, int $squareSize = null, string $cropPosition = 'center'): ?string
    {
        try {
            // Create image instance
            $image = Image::make($file->getRealPath());

            // Get original dimensions
            $width = $image->width();
            $height = $image->height();

            // Determine the size for the square (use the larger dimension or specified size)
            if ($squareSize === null) {
                $squareSize = max($width, $height);
            }

            // Calculate the crop dimensions based on position preference
            if ($width > $height) {
                // Landscape image - crop from specified position
                $cropWidth = $height;
                $cropHeight = $height;

                switch ($cropPosition) {
                    case 'top-left':
                        $cropX = 0;
                        $cropY = 0;
                        break;
                    case 'top-right':
                        $cropX = $width - $height;
                        $cropY = 0;
                        break;
                    case 'bottom-left':
                        $cropX = 0;
                        $cropY = 0;
                        break;
                    case 'bottom-right':
                        $cropX = $width - $height;
                        $cropY = 0;
                        break;
                    default: // center
                        $cropX = ($width - $height) / 2;
                        $cropY = 0;
                        break;
                }
            } elseif ($height > $width) {
                // Portrait image - crop from specified position
                $cropWidth = $width;
                $cropHeight = $width;

                switch ($cropPosition) {
                    case 'top-left':
                        $cropX = 0;
                        $cropY = 0;
                        break;
                    case 'top-right':
                        $cropX = 0;
                        $cropY = 0;
                        break;
                    case 'bottom-left':
                        $cropX = 0;
                        $cropY = $height - $width;
                        break;
                    case 'bottom-right':
                        $cropX = 0;
                        $cropY = $height - $width;
                        break;
                    default: // center
                        $cropX = 0;
                        $cropY = ($height - $width) / 2;
                        break;
                }
            } else {
                // Already square
                $cropWidth = $width;
                $cropHeight = $height;
                $cropX = 0;
                $cropY = 0;
            }

            // Crop to square first (if not already square)
            if ($width !== $height) {
                $image->crop($cropWidth, $cropHeight, $cropX, $cropY);
            }

            // Now resize to the target square size
            $image->resize($squareSize, $squareSize);

            // Convert to the original format and get as string
            $extension = strtolower($file->getClientOriginalExtension());

            // Determine output format based on original file
            switch ($extension) {
                case 'jpg':
                case 'jpeg':
                    return $image->encode('jpg', 90)->encode();
                case 'png':
                    return $image->encode('png')->encode();
                case 'gif':
                    return $image->encode('gif')->encode();
                case 'webp':
                    return $image->encode('webp', 90)->encode();
                default:
                    // Default to JPEG if format not recognized
                    return $image->encode('jpg', 90)->encode();
            }
        } catch (\Exception $e) {
            \Log::error('Image processing failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Upload a photo with custom square size and crop position
     *
     * @param UploadedFile $file
     * @param string $folder
     * @param int $squareSize The desired square size
     * @param string $cropPosition The crop position preference
     * @return string|null The file path on success, null on failure
     */
    public function uploadPhotoWithPosition(UploadedFile $file, string $folder = 'items', int $squareSize = null, string $cropPosition = 'center'): ?string
    {
        try {
            // Validate file
            if (!$this->isValidImage($file)) {
                return null;
            }

            // Process image to square format with specified size and position
            $processedImage = $this->processImageToSquareWithPosition($file, $squareSize, $cropPosition);
            if (!$processedImage) {
                return null;
            }

            // Generate unique filename
            $filename = $this->generateUniqueFilename($file);

            // Full path in R2 bucket
            $path = $folder . '/' . $filename;

            // Upload to R2
            \Log::info("Uploading processed photo to R2: {$path}");
            $uploaded = $this->disk->put($path, $processedImage, [
                'ContentType' => $file->getMimeType(),
                'CacheControl' => 'max-age=31536000', // 1 year cache
            ]);

            if ($uploaded) {
                \Log::info("Successfully uploaded processed photo to R2: {$path}");
                return $path;
            } else {
                \Log::error("Failed to upload processed photo to R2: {$path}");
                return null;
            }
        } catch (\Exception $e) {
            \Log::error('Photo upload failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Delete a photo from Cloudflare R2
     *
     * @param string $path
     * @return bool
     */
    public function deletePhoto(string $path): bool
    {
        try {
            \Log::info("Attempting to delete photo: {$path}");

            if ($this->disk->exists($path)) {
                $deleted = $this->disk->delete($path);
                if ($deleted) {
                    \Log::info("Successfully deleted photo from R2: {$path}");
                    return true;
                } else {
                    \Log::error("Failed to delete photo from R2: {$path}");
                    return false;
                }
            } else {
                \Log::info("Photo does not exist in R2, considering as deleted: {$path}");
                return true; // File doesn't exist, consider it deleted
            }
        } catch (\Exception $e) {
            \Log::error("Photo deletion failed for {$path}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Get the public URL for a photo
     *
     * @param string|null $path
     * @return string|null
     */
    public function getPhotoUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        // If R2 is not configured, try to use local storage as fallback
        if (empty($this->publicUrl)) {
            // Check if file exists in local storage
            if (Storage::disk('local')->exists($path)) {
                return Storage::disk('local')->url($path);
            }

            // If not in local storage, return a placeholder image or null
            return null;
        }

        return $this->publicUrl . '/' . $path;
    }

    /**
     * Get image dimensions
     *
     * @param UploadedFile $file
     * @return array|null Array with 'width' and 'height' keys, null on failure
     */
    public function getImageDimensions(UploadedFile $file): ?array
    {
        try {
            $image = Image::make($file->getRealPath());
            return [
                'width' => $image->width(),
                'height' => $image->height(),
                'aspect_ratio' => $image->width() / $image->height(),
                'is_square' => $image->width() === $image->height()
            ];
        } catch (\Exception $e) {
            \Log::error('Failed to get image dimensions: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Validate if the uploaded file is a valid image
     *
     * @param UploadedFile $file
     * @return bool
     */
    private function isValidImage(UploadedFile $file): bool
    {
        // Check file size (max 5MB)
        if ($file->getSize() > 5 * 1024 * 1024) {
            \Log::warning('Image file too large: ' . $file->getSize() . ' bytes');
            return false;
        }

        // Check mime type
        $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            \Log::warning('Invalid image mime type: ' . $file->getMimeType());
            return false;
        }

        // Check file extension
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, $allowedExtensions)) {
            \Log::warning('Invalid image extension: ' . $extension);
            return false;
        }

        // Try to create an image instance to verify it's actually a valid image
        try {
            $image = Image::make($file->getRealPath());
            $width = $image->width();
            $height = $image->height();

            // Check if dimensions are reasonable
            if ($width < 10 || $height < 10 || $width > 10000 || $height > 10000) {
                \Log::warning('Image dimensions out of reasonable range: ' . $width . 'x' . $height);
                return false;
            }

            return true;
        } catch (\Exception $e) {
            \Log::warning('Failed to create image instance: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Generate a unique filename for the uploaded file
     *
     * @param UploadedFile $file
     * @return string
     */
    private function generateUniqueFilename(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $timestamp = now()->format('Y-m-d_H-i-s');
        $random = Str::random(8);

        return "item_{$timestamp}_{$random}.{$extension}";
    }

    /**
     * Get file info from R2
     *
     * @param string $path
     * @return array|null
     */
    public function getFileInfo(string $path): ?array
    {
        try {
            if (!$this->disk->exists($path)) {
                return null;
            }

            return [
                'path' => $path,
                'url' => $this->getPhotoUrl($path),
                'size' => $this->disk->size($path),
                'last_modified' => $this->disk->lastModified($path),
            ];
        } catch (\Exception $e) {
            \Log::error('Failed to get file info: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Check if a file exists in R2
     *
     * @param string $path
     * @return bool
     */
    public function fileExists(string $path): bool
    {
        try {
            return $this->disk->exists($path);
        } catch (\Exception $e) {
            \Log::error('Failed to check file existence: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Verify that a file was actually deleted from R2
     *
     * @param string $path
     * @return bool
     */
    public function verifyDeleted(string $path): bool
    {
        try {
            // Wait a moment for R2 to process the deletion
            sleep(1);

            $exists = $this->disk->exists($path);
            if (!$exists) {
                \Log::info("Verified: Photo successfully deleted from R2: {$path}");
                return true;
            } else {
                \Log::warning("Verification failed: Photo still exists in R2: {$path}");
                return false;
            }
        } catch (\Exception $e) {
            \Log::error("Failed to verify deletion for {$path}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Force delete a photo with retry mechanism
     *
     * @param string $path
     * @param int $maxRetries
     * @return bool
     */
    public function forceDeletePhoto(string $path, int $maxRetries = 3): bool
    {
        for ($i = 0; $i < $maxRetries; $i++) {
            if ($this->deletePhoto($path)) {
                // Verify the deletion
                if ($this->verifyDeleted($path)) {
                    return true;
                }
                \Log::warning("Deletion attempt " . ($i + 1) . " failed verification for: {$path}");
            }

            if ($i < $maxRetries - 1) {
                sleep(2); // Wait before retry
            }
        }

        \Log::error("Failed to delete photo after {$maxRetries} attempts: {$path}");
        return false;
    }

    /**
     * Get crop preview information for an image
     *
     * @param UploadedFile $file
     * @param int $squareSize The desired square size
     * @param string $cropPosition The crop position preference
     * @return array|null Array with crop information, null on failure
     */
    public function getCropPreview(UploadedFile $file, int $squareSize = null, string $cropPosition = 'center'): ?array
    {
        try {
            // Create image instance
            $image = Image::make($file->getRealPath());

            // Get original dimensions
            $width = $image->width();
            $height = $image->height();

            // Determine the size for the square
            if ($squareSize === null) {
                $squareSize = max($width, $height);
            }

            // Calculate crop dimensions
            if ($width > $height) {
                // Landscape image
                $cropWidth = $height;
                $cropHeight = $height;

                switch ($cropPosition) {
                    case 'top-left':
                        $cropX = 0;
                        $cropY = 0;
                        break;
                    case 'top-right':
                        $cropX = $width - $height;
                        $cropY = 0;
                        break;
                    case 'bottom-left':
                        $cropX = 0;
                        $cropY = 0;
                        break;
                    case 'bottom-right':
                        $cropX = $width - $height;
                        $cropY = 0;
                        break;
                    default: // center
                        $cropX = ($width - $height) / 2;
                        $cropY = 0;
                        break;
                }

                $cropArea = 'center horizontal';
            } elseif ($height > $width) {
                // Portrait image
                $cropWidth = $width;
                $cropHeight = $width;

                switch ($cropPosition) {
                    case 'top-left':
                        $cropX = 0;
                        $cropY = 0;
                        break;
                    case 'top-right':
                        $cropX = 0;
                        $cropY = 0;
                        break;
                    case 'bottom-left':
                        $cropX = 0;
                        $cropY = $height - $width;
                        break;
                    case 'bottom-right':
                        $cropX = 0;
                        $cropY = $height - $width;
                        break;
                    default: // center
                        $cropX = 0;
                        $cropY = ($height - $width) / 2;
                        break;
                }

                $cropArea = 'center vertical';
            } else {
                // Already square
                $cropWidth = $width;
                $cropHeight = $height;
                $cropX = 0;
                $cropY = 0;
                $cropArea = 'no crop needed';
            }

            return [
                'original_dimensions' => [
                    'width' => $width,
                    'height' => $height,
                    'aspect_ratio' => round($width / $height, 2)
                ],
                'crop_info' => [
                    'crop_width' => $cropWidth,
                    'crop_height' => $cropHeight,
                    'crop_x' => $cropX,
                    'crop_y' => $cropY,
                    'crop_area' => $cropArea
                ],
                'final_dimensions' => [
                    'width' => $squareSize,
                    'height' => $squareSize
                ],
                'crop_position' => $cropPosition,
                'will_be_cropped' => $width !== $height
            ];
        } catch (\Exception $e) {
            \Log::error('Failed to get crop preview: ' . $e->getMessage());
            return null;
        }
    }
}
