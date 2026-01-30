<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Models\Item;
use App\Models\ExportNotification;
use Barryvdh\DomPDF\Facade\Pdf;

class ExportItemsPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 300; // 5 minutes
    public $tries = 3;

    protected $filters;
    protected $userId;
    protected $filename;

    /**
     * Create a new job instance.
     */
    public function __construct(array $filters, int $userId, string $filename)
    {
        $this->filters = $filters;
        $this->userId = $userId;
        $this->filename = $filename;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Create notification record
        $notification = ExportNotification::create([
            'user_id' => $this->userId,
            'filename' => $this->filename,
            'type' => 'pdf',
            'filters' => $this->filters,
            'status' => 'pending',
        ]);

        try {
            Log::info('Starting PDF export job', ['filters' => $this->filters, 'user_id' => $this->userId]);

            // Build query with filters
            $query = Item::query();

            if (!empty($this->filters['brand'])) {
                $query->where('brand', $this->filters['brand']);
            }

            if (!empty($this->filters['status'])) {
                $query->where('status', $this->filters['status']);
            }

            // Get total count for progress tracking
            $totalItems = $query->count();
            Log::info("Total items to export: {$totalItems}");

            if ($totalItems === 0) {
                Log::info('No items found for export');
                $notification->markAsFailed('No items found matching the specified criteria');
                return;
            }

            // Process in chunks to avoid memory issues
            $chunkSize = 1000; // Process 1000 items at a time
            $processed = 0;
            $items = collect();

            $query->orderBy('created_at', 'desc')->chunk($chunkSize, function ($chunkItems) use (&$items, &$processed, $totalItems) {
                $items = $items->merge($chunkItems);
                $processed += $chunkItems->count();

                Log::info("Processed chunk: {$processed}/{$totalItems} items");

                // Give other processes a chance to run
                if ($processed % 5000 === 0) {
                    sleep(1);
                }
            });

            Log::info('All items loaded, generating PDF');

            // Generate PDF with the collected items
            $pdf = Pdf::loadView('exports.items', compact('items'))
                ->setPaper('a4', 'landscape')
                ->setOptions([
                    'defaultFont' => 'Arial',
                    'isHtml5ParserEnabled' => true,
                    'isRemoteEnabled' => true,
                    'chroot' => storage_path('app'),
                ]);

            // Save to storage
            $filePath = 'exports/' . $this->filename;
            Storage::put($filePath, $pdf->output());

            $fileSize = Storage::size($filePath);

            // Mark notification as completed
            $notification->markAsCompleted($filePath, $fileSize);

            Log::info('PDF export completed successfully', [
                'file_path' => $filePath,
                'file_size' => $fileSize,
                'total_items' => $totalItems
            ]);
        } catch (\Exception $e) {
            Log::error('PDF export job failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'filters' => $this->filters,
                'user_id' => $this->userId
            ]);

            // Mark notification as failed
            $notification->markAsFailed($e->getMessage());

            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('PDF export job failed permanently', [
            'error' => $exception->getMessage(),
            'filters' => $this->filters,
            'user_id' => $this->userId
        ]);
    }
}
