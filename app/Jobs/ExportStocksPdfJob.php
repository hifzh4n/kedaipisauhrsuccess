<?php

namespace App\Jobs;

use App\Models\DamagedItem;
use App\Models\ExportNotification;
use App\Models\Item;
use App\Models\StockBatch;
use App\Models\StockMovement;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ExportStocksPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 900;
    public $tries = 3;

    protected array $filters;
    protected int $userId;
    protected string $filename;
    protected string $reportType;

    public function __construct(array $filters, int $userId, string $filename, string $reportType)
    {
        $this->filters = $filters;
        $this->userId = $userId;
        $this->filename = $filename;
        $this->reportType = $reportType;
    }

    public function handle(): void
    {
        $notification = ExportNotification::create([
            'user_id' => $this->userId,
            'filename' => $this->filename,
            'type' => 'stock_pdf',
            'filters' => array_merge($this->filters, ['report_type' => $this->reportType]),
            'status' => 'pending',
        ]);

        try {
            @ini_set('memory_limit', '1024M');
            @set_time_limit(900);

            $data = $this->buildReportData();

            $view = $this->resolveViewName();
            $html = view($view, ['data' => $data])->render();

            $pdf = Pdf::loadHTML($html)
                ->setPaper('A4', 'landscape')
                ->setOptions([
                    'defaultFont' => 'Arial',
                    'isHtml5ParserEnabled' => true,
                    'isRemoteEnabled' => false,
                ]);

            $filePath = 'exports/' . $this->filename;
            Storage::put($filePath, $pdf->output());

            $notification->markAsCompleted($filePath, Storage::size($filePath));

            Log::info('Stock PDF export completed', [
                'user_id' => $this->userId,
                'report_type' => $this->reportType,
                'file' => $filePath,
            ]);
        } catch (\Throwable $e) {
            Log::error('Stock PDF export failed', [
                'user_id' => $this->userId,
                'report_type' => $this->reportType,
                'error' => $e->getMessage(),
            ]);

            $notification->markAsFailed($e->getMessage());
            throw $e;
        }
    }

    private function resolveViewName(): string
    {
        return match ($this->reportType) {
            'aging_report' => 'exports.stock-aging',
            'damaged_items' => 'exports.damaged-items',
            'current_stock' => 'exports.current-stock',
            default => 'exports.stock-movements',
        };
    }

    private function buildReportData()
    {
        return match ($this->reportType) {
            'aging_report' => $this->buildAgingData(),
            'damaged_items' => $this->buildDamagedData(),
            'current_stock' => $this->buildCurrentStockData(),
            default => $this->buildMovementData(),
        };
    }

    private function buildAgingData()
    {
        $query = StockBatch::with('item');

        if (!empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->whereHas('item', function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('sku_id', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if (!empty($this->filters['date_from'])) {
            $query->whereDate('created_at', '>=', $this->filters['date_from']);
        }

        if (!empty($this->filters['date_to'])) {
            $query->whereDate('created_at', '<=', $this->filters['date_to']);
        }

        $rows = collect();
        $query->orderBy('created_at', 'desc')->chunk(1000, function ($batches) use (&$rows) {
            foreach ($batches as $batch) {
                $rows->push([
                    'item_name' => optional($batch->item)->item_name ?? 'Unknown Item',
                    'batch_number' => $batch->batch_number,
                    'quantity' => $batch->quantity_remaining,
                    'date_added' => $batch->created_at->format('Y-m-d'),
                    'days_in_stock' => $batch->created_at->diffInDays(now()),
                    'status' => $batch->status === 'empty' ? 'empty' : 'good',
                ]);
            }
        });

        return $rows;
    }

    private function buildMovementData()
    {
        $query = StockMovement::with(['item', 'user'])
            ->whereNotIn('reason', ['damage']);

        if (!empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->whereHas('item', function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('sku_id', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if (!empty($this->filters['movement_type'])) {
            $query->where('type', $this->filters['movement_type']);
        }

        if (!empty($this->filters['date_from'])) {
            $query->whereDate('created_at', '>=', $this->filters['date_from']);
        }

        if (!empty($this->filters['date_to'])) {
            $query->whereDate('created_at', '<=', $this->filters['date_to']);
        }

        $rows = collect();
        $query->orderBy('created_at', 'desc')->chunk(1000, function ($movements) use (&$rows) {
            foreach ($movements as $movement) {
                $rows->push([
                    'item_name' => optional($movement->item)->item_name ?? 'Unknown Item',
                    'type' => $movement->type === 'in' ? 'Stock In' : 'Stock Out',
                    'quantity' => $movement->quantity,
                    'reason' => $movement->reason,
                    'batch_number' => $movement->batch_number ?? 'N/A',
                    'date' => $movement->created_at->format('Y-m-d'),
                    'user' => $movement->user
                        ? trim(($movement->user->first_name ?? '') . ' ' . ($movement->user->last_name ?? ''))
                        : 'System',
                ]);
            }
        });

        return $rows;
    }

    private function buildCurrentStockData()
    {
        $query = Item::query();

        if (!empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('sku_id', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        $items = $query->orderBy('updated_at', 'desc')->get();
        $itemIds = $items->pluck('item_id')->filter()->values();

        $batchCounts = StockBatch::select('item_id', DB::raw('COUNT(*) as total_batches'))
            ->whereIn('item_id', $itemIds)
            ->where('quantity_remaining', '>', 0)
            ->groupBy('item_id')
            ->pluck('total_batches', 'item_id');

        $oldestDates = StockBatch::select('item_id', DB::raw('MIN(created_at) as oldest_batch_date'))
            ->whereIn('item_id', $itemIds)
            ->where('quantity_remaining', '>', 0)
            ->groupBy('item_id')
            ->pluck('oldest_batch_date', 'item_id');

        return $items->map(function ($item) use ($batchCounts, $oldestDates) {
            $oldestRaw = $oldestDates->get($item->item_id);

            return [
                'item_name' => $item->item_name,
                'sku_id' => $item->sku_id,
                'barcode' => $item->barcode,
                'current_stock' => $item->quantity,
                'total_batches' => (int) ($batchCounts->get($item->item_id) ?? 0),
                'oldest_batch_date' => $oldestRaw ? date('Y-m-d', strtotime($oldestRaw)) : 'N/A',
                'last_updated' => $item->updated_at->format('Y-m-d'),
            ];
        });
    }

    private function buildDamagedData()
    {
        $query = DamagedItem::with(['item', 'user']);

        if (!empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->whereHas('item', function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('sku_id', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if (!empty($this->filters['date_from'])) {
            $query->whereDate('created_at', '>=', $this->filters['date_from']);
        }

        if (!empty($this->filters['date_to'])) {
            $query->whereDate('created_at', '<=', $this->filters['date_to']);
        }

        return $query->orderBy('created_at', 'desc')->get()->map(function ($damagedItem) {
            return [
                'item_name' => optional($damagedItem->item)->item_name ?? 'Unknown Item',
                'sku_id' => optional($damagedItem->item)->sku_id ?? 'N/A',
                'barcode' => optional($damagedItem->item)->barcode ?? 'N/A',
                'quantity' => $damagedItem->quantity,
                'damage_reason' => $damagedItem->damage_reason,
                'batch_number' => $damagedItem->batch_number ?? 'N/A',
                'date' => $damagedItem->created_at->format('Y-m-d'),
                'user' => $damagedItem->user
                    ? trim(($damagedItem->user->first_name ?? '') . ' ' . ($damagedItem->user->last_name ?? ''))
                    : 'System',
                'notes' => $damagedItem->notes ?? 'N/A',
            ];
        });
    }
}
