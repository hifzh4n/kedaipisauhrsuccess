<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Item;
use App\Models\StockMovement;
use App\Models\StockBatch;
use App\Models\ActivityLog;
use App\Models\DamagedItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StockController extends Controller
{
    /**
     * Display stock movement history (main landing page)
     */
    public function index(Request $request)
    {
        try {
            // Build stock history query - exclude damage transactions
            $stockHistoryQuery = StockMovement::with(['item', 'user'])
                ->whereNotIn('reason', ['damage']) // Exclude damage transactions
                ->orderBy('created_at', 'desc');

            // Apply filters for stock history
            if ($request->filled('search')) {
                $search = $request->get('search');
                $stockHistoryQuery->whereHas('item', function ($query) use ($search) {
                    $query->where('item_name', 'like', "%{$search}%")
                        ->orWhere('sku_id', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%");
                });
            }

            if ($request->filled('type')) {
                $stockHistoryQuery->where('type', $request->get('type'));
            }

            if ($request->filled('reason')) {
                if ($request->get('reason') === 'other') {
                    // For "other", show all reasons that are NOT in the predefined list
                    $predefinedReasons = [
                        'purchase',
                        'sale',
                        'return',
                        'transfer',
                        'damage',
                        'loss'
                    ];
                    $stockHistoryQuery->whereNotIn('reason', $predefinedReasons);
                } else {
                    $stockHistoryQuery->where('reason', $request->get('reason'));
                }
            }

            if ($request->filled('date_from')) {
                $stockHistoryQuery->whereDate('created_at', '>=', $request->get('date_from'));
            }

            if ($request->filled('date_to')) {
                $stockHistoryQuery->whereDate('created_at', '<=', $request->get('date_to'));
            }

            // Paginate stock history
            $stockHistory = $stockHistoryQuery->paginate(15);

            // Debug: Log stock history data
            Log::info('Stock History Query Result', [
                'total' => $stockHistory->total(),
                'count' => $stockHistory->count(),
                'current_page' => $stockHistory->currentPage(),
                'last_page' => $stockHistory->lastPage(),
                'has_data' => $stockHistory->count() > 0
            ]);

            // Build stock aging query
            $stockAgingQuery = StockBatch::with('item')
                ->orderBy('created_at', 'desc');

            // Apply filters for stock aging
            if ($request->filled('aging_search')) {
                $search = $request->get('aging_search');
                $stockAgingQuery->whereHas('item', function ($query) use ($search) {
                    $query->where('item_name', 'like', "%{$search}%")
                        ->orWhere('sku_id', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%");
                });
            }

            if ($request->filled('aging_status')) {
                $status = $request->get('aging_status');
                if ($status === 'active') {
                    $stockAgingQuery->where('status', '!=', 'empty');
                } elseif ($status === 'empty') {
                    $stockAgingQuery->where('status', 'empty');
                }
            }

            if ($request->filled('aging_date_from')) {
                $stockAgingQuery->whereDate('created_at', '>=', $request->get('aging_date_from'));
            }

            if ($request->filled('aging_date_to')) {
                $stockAgingQuery->whereDate('created_at', '<=', $request->get('aging_date_to'));
            }

            // Paginate stock aging
            $stockAging = $stockAgingQuery->paginate(15);

            // Debug: Log stock aging data
            Log::info('Stock Aging Query Result', [
                'total' => $stockAging->total(),
                'count' => $stockAging->count(),
                'current_page' => $stockAging->currentPage(),
                'last_page' => $stockAging->lastPage(),
                'has_data' => $stockAging->count() > 0
            ]);

            return Inertia::render('StockManagement/Index', [
                'stockHistory' => $stockHistory,
                'stockAging' => $stockAging,
                'filter' => $request->get('filter'),
                'tab' => $request->get('tab'),
                'auth' => [
                    'user' => auth()->user()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('StockController index method failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);

            // Return empty paginators on error
            $emptyStockHistory = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 15, 1);
            $emptyStockAging = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 15, 1);

            return Inertia::render('StockManagement/Index', [
                'stockHistory' => $emptyStockHistory,
                'stockAging' => $emptyStockAging,
                'filter' => $request->get('filter'),
                'tab' => $request->get('tab'),
                'error' => 'Failed to load stock data. Please try again.',
                'auth' => [
                    'user' => auth()->user()
                ]
            ]);
        }
    }

    /**
     * Display current stock levels
     */
    public function currentStock(Request $request)
    {
        $query = Item::query();

        // Apply search filter
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('sku_id', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // Apply status filter
        if ($request->has('status') && $request->status) {
            switch ($request->status) {
                case 'in_stock':
                    $query->where('quantity', '>', 10);
                    break;
                case 'low_stock':
                    $query->where('quantity', '>', 0)->where('quantity', '<=', 10);
                    break;
                case 'out_of_stock':
                    $query->where('quantity', 0);
                    break;
            }
        }

        $items = $query->orderBy('updated_at', 'desc')->paginate(15);

        // Transform items to stock format with batch info
        $stocks = $items->through(function ($item) {
            $totalBatches = StockBatch::where('item_id', $item->item_id)
                ->where('quantity_remaining', '>', 0)
                ->count();

            $oldestBatch = StockBatch::where('item_id', $item->item_id)
                ->where('quantity_remaining', '>', 0)
                ->orderBy('created_at', 'asc')
                ->first();

            return [
                'id' => $item->id,
                'item_id' => $item->id,
                'quantity' => $item->quantity,
                'updated_at' => $item->updated_at,
                'batch_info' => [
                    'total_batches' => $totalBatches,
                    'oldest_batch_date' => $oldestBatch ? $oldestBatch->created_at : null,
                ],
                'item' => [
                    'id' => $item->item_id,
                    'item_name' => $item->item_name,
                    'sku_id' => $item->sku_id,
                    'brand' => $item->brand,
                    'picture_url' => $item->picture_url,
                ]
            ];
        });

        return Inertia::render('StockManagement/CurrentStock', [
            'stocks' => $stocks,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
            ],
        ]);
    }

    /**
     * Display stock movement history
     */
    public function history(Request $request)
    {
        $query = StockMovement::with(['item', 'user'])
            ->whereNotIn('reason', ['damage']); // Exclude damage transactions

        // Apply search filter
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('item', function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('sku_id', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // Apply type filter
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }

        // Apply reason filter
        if ($request->has('reason') && $request->reason) {
            if ($request->reason === 'other') {
                // For "other", show all reasons that are NOT in the predefined list
                $predefinedReasons = [
                    'purchase',
                    'sale',
                    'return',
                    'transfer',
                    'damage',
                    'loss'
                ];
                $query->whereNotIn('reason', $predefinedReasons);
            } else {
                $query->where('reason', $request->reason);
            }
        }

        // Apply date range filter
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $movements = $query->orderBy('created_at', 'desc')->paginate(15);

        // Transform movements to display format
        $stockHistory = $movements->through(function ($movement) {
            return [
                'id' => $movement->id,
                'type' => $movement->type,
                'quantity' => $movement->quantity,
                'reason' => $movement->reason,
                'balance_after' => $movement->balance_after,
                'created_at' => $movement->created_at,
                'user' => $movement->user ? [
                    'name' => $movement->user->first_name . ' ' . $movement->user->last_name,
                ] : null,
                'item' => [
                    'id' => $movement->item->item_id,
                    'item_name' => $movement->item->item_name,
                    'sku_id' => $movement->item->sku_id,
                    'brand' => $movement->item->brand,
                    'picture_url' => $movement->item->picture_url,
                ]
            ];
        });

        return Inertia::render('StockManagement/History', [
            'stockHistory' => $stockHistory,
            'filters' => [
                'search' => $request->search ?? '',
                'type' => $request->type ?? '',
                'reason' => $request->reason ?? '',
                'date_from' => $request->date_from ?? '',
                'date_to' => $request->date_to ?? '',
            ],
        ]);
    }

    /**
     * Handle stock in operation
     */
    public function stockIn(Request $request)
    {
        $request->validate([
            'item_id' => 'required|exists:items,item_id',
            'quantity' => 'required|integer|min:1',
            'reason' => 'required|string|in:purchase,return,transfer,other',
            'other_reason' => 'required_if:reason,other|string|max:255',
        ]);

        try {
            $item = Item::where('item_id', $request->item_id)->firstOrFail();
            $originalQuantity = $item->quantity;

            // Determine the reason to store
            $reasonToStore = $request->reason === 'other' ? $request->other_reason : $request->reason;

            DB::transaction(function () use ($request, $item, $reasonToStore) {
                // Update item quantity
                $item->quantity += $request->quantity;
                $item->save();

                // Generate unique batch number
                do {
                    $randomNumbers = str_pad(rand(10, 99), 2, '0', STR_PAD_LEFT);
                    $batchNumber = "{$item->item_id}{$randomNumbers}";
                } while (StockBatch::where('batch_number', $batchNumber)->exists());

                // Create stock batch for FIFO tracking
                StockBatch::create([
                    'item_id' => $item->item_id,
                    'batch_number' => $batchNumber,
                    'quantity_received' => $request->quantity,
                    'quantity_remaining' => $request->quantity,
                    'reason' => $reasonToStore,
                    'user_id' => auth()->id(),
                ]);

                // Create stock movement record for audit trail
                StockMovement::create([
                    'item_id' => $item->item_id,
                    'type' => 'in',
                    'quantity' => $request->quantity,
                    'reason' => $reasonToStore,
                    'balance_after' => $item->quantity,
                    'batch_number' => $batchNumber,
                    'user_id' => auth()->id(),
                ]);

                // Log the activity
                ActivityLog::log(
                    'stock_in',
                    "Stock added to '{$item->item_name}' - {$request->quantity} units",
                    $item->item_id,
                    [
                        'quantity' => $request->quantity,
                        'reason' => $reasonToStore,
                        'balance_after' => $item->quantity,
                        'batch_number' => $batchNumber
                    ]
                );
            });

            return redirect()->route('stocks.index')->with(
                'success',
                "Successfully added {$request->quantity} units to {$item->item_name}. New stock: {$item->quantity}"
            );
        } catch (\Exception $e) {
            return redirect()->route('stocks.index')->with('error', 'Failed to add stock: ' . $e->getMessage());
        }
    }

    /**
     * Handle stock out operation
     */
    public function stockOut(Request $request)
    {
        $request->validate([
            'item_id' => 'required|exists:items,item_id',
            'quantity' => 'required|integer|min:1',
            'reason' => 'required|string|in:sale,damage,loss,transfer,return,other',
            'other_reason' => 'required_if:reason,other|string|max:255',
            'damage_reason' => 'required_if:reason,damage|string|max:255',
        ]);

        try {
            $item = Item::where('item_id', $request->item_id)->firstOrFail();

            // Determine the reason to store
            $reasonToStore = $request->reason;
            if ($request->reason === 'other') {
                $reasonToStore = $request->other_reason;
            } elseif ($request->reason === 'damage') {
                $reasonToStore = $request->damage_reason;
            }

            DB::transaction(function () use ($request, $item, $reasonToStore) {
                // Check if sufficient stock is available
                if ($item->quantity < $request->quantity) {
                    throw new \Exception("Insufficient stock for {$item->item_name}. Available: {$item->quantity}, Requested: {$request->quantity}");
                }

                // Implement FIFO: Get oldest batches first
                $remainingQuantity = $request->quantity;
                $batches = StockBatch::where('item_id', $item->item_id)
                    ->where('quantity_remaining', '>', 0)
                    ->where('status', 'active')
                    ->orderBy('created_at', 'asc') // FIFO: First In, First Out
                    ->get();

                foreach ($batches as $batch) {
                    if ($remainingQuantity <= 0) break;

                    $quantityToTake = min($remainingQuantity, $batch->quantity_remaining);

                    // Update batch remaining quantity
                    $batch->quantity_remaining -= $quantityToTake;

                    // Mark batch as empty if quantity reaches 0
                    if ($batch->quantity_remaining == 0) {
                        $batch->status = 'empty';
                    }

                    $batch->save();

                    $remainingQuantity -= $quantityToTake;
                }

                // Update item quantity
                $item->quantity -= $request->quantity;
                $item->save();

                // Create stock movement record for audit trail (but NOT for damage)
                if ($request->reason !== 'damage') {
                    StockMovement::create([
                        'item_id' => $item->item_id,
                        'type' => 'out',
                        'quantity' => $request->quantity,
                        'reason' => $reasonToStore,
                        'balance_after' => $item->quantity,
                        'batch_number' => $batches->first()->batch_number ?? 'N/A',
                        'user_id' => auth()->id(),
                    ]);
                }

                // If reason is damage, create damaged item record instead
                if ($request->reason === 'damage') {
                    DamagedItem::create([
                        'item_id' => $item->item_id,
                        'quantity' => $request->quantity,
                        'damage_reason' => $request->damage_reason,
                        'batch_number' => $batches->first()->batch_number ?? 'N/A',
                        'user_id' => auth()->id(),
                    ]);
                }

                // Log the activity
                ActivityLog::log(
                    'stock_out',
                    "Stock removed from '{$item->item_name}' - {$request->quantity} units",
                    $item->item_id,
                    [
                        'quantity' => $request->quantity,
                        'reason' => $reasonToStore,
                        'balance_after' => $item->quantity,
                        'batch_number' => $batches->first()->batch_number ?? 'N/A'
                    ]
                );
            });

            return redirect()->route('stocks.index')->with(
                'success',
                "Successfully removed {$request->quantity} units from {$item->item_name}. Remaining stock: {$item->quantity}"
            );
        } catch (\Exception $e) {
            return redirect()->route('stocks.index')->with('error', 'Failed to remove stock: ' . $e->getMessage());
        }
    }



    /**
     * Get damaged items data
     */
    public function damagedItems(Request $request)
    {
        $query = DamagedItem::with(['item', 'user']);

        // Apply search filter
        if ($request->has('search') && $request->search) {
            $search = $request->get('search');
            $query->whereHas('item', function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('sku_id', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // Apply date range filter
        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $damagedItems = $query->orderBy('created_at', 'desc')->paginate(15);

        // Transform data for display
        $damagedItemsData = $damagedItems->through(function ($damagedItem) {
            return [
                'id' => $damagedItem->id,
                'quantity' => $damagedItem->quantity,
                'damage_reason' => $damagedItem->damage_reason,
                'batch_number' => $damagedItem->batch_number,
                'created_at' => $damagedItem->created_at,
                'user' => $damagedItem->user ? [
                    'name' => $damagedItem->user->first_name . ' ' . $damagedItem->user->last_name,
                ] : null,
                'item' => [
                    'id' => $damagedItem->item->item_id,
                    'item_name' => $damagedItem->item->item_name,
                    'sku_id' => $damagedItem->item->sku_id,
                    'brand' => $damagedItem->item->brand,
                    'picture_url' => $damagedItem->item->picture_url,
                ]
            ];
        });

        return response()->json($damagedItemsData);
    }

    /**
     * Get stock aging data
     */
    public function aging(Request $request)
    {
        $query = StockBatch::with(['item']);

        // Apply search filter
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('item', function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('item_id', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // Apply status filter
        if ($request->has('status') && $request->status) {
            switch ($request->status) {
                case 'active':
                    $query->where('status', '!=', 'empty');
                    break;
                case 'empty':
                    $query->where('status', 'empty');
                    break;
            }
        }

        $batches = $query->orderBy('created_at', 'desc')->get();

        $agingData = $batches->map(function ($batch) {
            $status = 'good';

            // Check batch status first
            if ($batch->status === 'empty') {
                $status = 'empty';
            } else {
                $status = 'good';
            }

            return [
                'id' => $batch->id,
                'item_name' => $batch->item->item_name,
                'item_id' => $batch->item->item_id,
                'batch_number' => $batch->batch_number,
                'quantity' => $batch->quantity_remaining,
                'date_added' => $batch->created_at->format('Y-m-d'),
                'days_in_stock' => $batch->created_at->diffInDays(now()),
                'status' => $status,
                'batch_status' => $batch->status,
                'picture_url' => $batch->item->picture_url,
            ];
        });

        return response()->json($agingData);
    }

    /**
     * Export stock data
     */
    public function export(Request $request)
    {
        $request->validate([
            'format' => 'required|in:pdf,excel,csv',
            'report_type' => 'required|in:current_stock,stock_movements,aging_report,damaged_items,low_stock,valuation',
        ]);

        // Handle columns parameter (can be JSON string from GET request)
        $columns = $request->columns;
        if (is_string($columns)) {
            $columns = json_decode($columns, true);
        }
        if (!$columns || !is_array($columns)) {
            $columns = ['item_name', 'batch_number', 'quantity', 'date_added', 'days_in_stock', 'status'];
        }

        try {
            if ($request->report_type === 'aging_report') {
                return $this->exportAgingReport($request);
            } elseif ($request->report_type === 'stock_movements') {
                return $this->exportStockMovements($request);
            } elseif ($request->report_type === 'damaged_items') {
                return $this->exportDamagedItems($request);
            } elseif ($request->report_type === 'current_stock') {
                return $this->exportCurrentStock($request);
            }

            // Default to JSON for now
            return redirect()->route('stocks.index')->with('error', 'Report type not yet implemented!');
        } catch (\Exception $e) {
            return redirect()->route('stocks.index')->with('error', 'Export failed: ' . $e->getMessage());
        }
    }

    /**
     * Export aging report
     */
    private function exportAgingReport(Request $request)
    {
        $query = StockBatch::with(['item']);

        // Apply filters
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('item', function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('sku_id', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($request->has('status') && $request->status) {
            switch ($request->status) {
                case 'good':
                    $query->where('status', '!=', 'empty');
                    break;
                case 'empty':
                    $query->where('status', 'empty');
                    break;
            }
        }

        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $batches = $query->orderBy('created_at', 'desc')->get();

        $agingData = $batches->map(function ($batch) {
            $status = 'good';
            if ($batch->status === 'empty') {
                $status = 'empty';
            }

            return [
                'item_name' => $batch->item->item_name,
                'batch_number' => $batch->batch_number,
                'quantity' => $batch->quantity_remaining,
                'date_added' => $batch->created_at->format('Y-m-d'),
                'days_in_stock' => $batch->created_at->diffInDays(now()),
                'status' => $status,
            ];
        });

        if ($request->format === 'pdf') {
            return $this->generateAgingPdf($agingData);
        }

        // Generate PDF if format is pdf
        if ($request->format === 'pdf') {
            return $this->generateAgingPdf($agingData);
        }

        // Default to JSON for other formats
        return response()->json($agingData);
    }

    /**
     * Export stock movements report
     */
    private function exportStockMovements(Request $request)
    {
        $query = StockMovement::with(['item', 'user'])
            ->whereNotIn('reason', ['damage']); // Exclude damage transactions

        // Apply filters
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('item', function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('sku_id', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($request->has('movement_type') && $request->movement_type) {
            $query->where('type', $request->movement_type);
        }

        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $movements = $query->orderBy('created_at', 'desc')->get();

        $movementData = $movements->map(function ($movement) {
            return [
                'item_name' => $movement->item->item_name,
                'type' => $movement->type === 'in' ? 'Stock In' : 'Stock Out',
                'quantity' => $movement->quantity,
                'reason' => $movement->reason,
                'batch_number' => $movement->batch_number ?? 'N/A',
                'date' => $movement->created_at->format('Y-m-d'),
                'user' => $movement->user ? $movement->user->first_name . ' ' . $movement->user->last_name : 'System',
            ];
        });

        if ($request->format === 'pdf') {
            return $this->generateMovementsPdf($movementData);
        }

        // Generate PDF if format is pdf
        if ($request->format === 'pdf') {
            return $this->generateMovementsPdf($movementData);
        }

        return response()->json($movementData);
    }

    /**
     * Export current stock report
     */
    private function exportCurrentStock(Request $request)
    {
        $query = Item::query();

        // Apply filters
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('sku_id', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        $items = $query->orderBy('updated_at', 'desc')->get();

        $stockData = $items->map(function ($item) {
            $totalBatches = StockBatch::where('item_id', $item->item_id)
                ->where('quantity_remaining', '>', 0)
                ->count();

            $oldestBatch = StockBatch::where('item_id', $item->item_id)
                ->where('quantity_remaining', '>', 0)
                ->orderBy('created_at', 'asc')
                ->first();

            return [
                'item_name' => $item->item_name,
                'sku_id' => $item->sku_id,
                'barcode' => $item->barcode,
                'current_stock' => $item->quantity,
                'total_batches' => $totalBatches,
                'oldest_batch_date' => $oldestBatch ? $oldestBatch->created_at->format('Y-m-d') : 'N/A',
                'last_updated' => $item->updated_at->format('Y-m-d'),
            ];
        });

        if ($request->format === 'pdf') {
            return $this->generateCurrentStockPdf($stockData);
        }

        // Generate PDF if format is pdf
        if ($request->format === 'pdf') {
            return $this->generateCurrentStockPdf($stockData);
        }

        return response()->json($stockData);
    }

    /**
     * Generate PDF for aging report
     */
    private function generateAgingPdf($data)
    {
        // Ensure data is a collection or array
        if (!$data) {
            $data = collect([]);
        }

        $html = view('exports.stock-aging', compact('data'))->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
        $pdf->setPaper('A4', 'landscape');

        return $pdf->stream('stock-aging-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate PDF for stock movements report
     */
    private function generateMovementsPdf($data)
    {
        // Ensure data is a collection or array
        if (!$data) {
            $data = collect([]);
        }

        $html = view('exports.stock-movements', compact('data'))->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
        $pdf->setPaper('A4', 'landscape');

        return $pdf->stream('stock-movements-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate PDF for current stock report
     */
    private function generateCurrentStockPdf($data)
    {
        $html = view('exports.current-stock', compact('data'))->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
        $pdf->setPaper('A4', 'landscape');

        return $pdf->stream('current-stock-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Export damaged items report
     */
    private function exportDamagedItems(Request $request)
    {
        $query = DamagedItem::with(['item', 'user']);

        // Apply filters
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('item', function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('sku_id', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($request->has('date_from') && $request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $damagedItems = $query->orderBy('created_at', 'desc')->get();

        $damagedData = $damagedItems->map(function ($damagedItem) {
            return [
                'item_name' => $damagedItem->item->item_name,
                'sku_id' => $damagedItem->item->sku_id,
                'barcode' => $damagedItem->item->barcode,
                'quantity' => $damagedItem->quantity,
                'damage_reason' => $damagedItem->damage_reason,
                'batch_number' => $damagedItem->batch_number ?? 'N/A',
                'date' => $damagedItem->created_at->format('Y-m-d'),
                'user' => $damagedItem->user ? $damagedItem->user->first_name . ' ' . $damagedItem->user->last_name : 'System',
                'notes' => $damagedItem->notes ?? 'N/A',
            ];
        });

        if ($request->format === 'pdf') {
            return $this->generateDamagedItemsPdf($damagedData);
        }

        return response()->json($damagedData);
    }

    /**
     * Generate PDF for damaged items report
     */
    private function generateDamagedItemsPdf($data)
    {
        // Ensure data is a collection or array
        if (!$data) {
            $data = collect([]);
        }

        $html = view('exports.damaged-items', compact('data'))->render();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html);
        $pdf->setPaper('A4', 'landscape');

        return $pdf->stream('damaged-items-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Delete a stock batch
     */
    public function deleteBatch($id)
    {
        try {
            $batch = StockBatch::findOrFail($id);

            // Check if the batch has remaining quantity
            if ($batch->quantity_remaining > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete batch with remaining quantity. Please ensure the quantity is 0 before deletion.'
                ], 400);
            }

            $batch->delete();

            return response()->json(['success' => true, 'message' => 'Batch deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to delete batch'], 500);
        }
    }

    /**
     * Search items for stock operations
     */
    public function searchItems(Request $request)
    {
        $search = $request->get('search', '');

        // If search is empty or less than 2 characters (except for wildcard), return empty structure
        if (strlen($search) < 2 && $search !== '*') {
            if ($request->filled('page')) {
                return response()->json([
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 15,
                    'total' => 0,
                    'from' => null,
                    'to' => null,
                    'links' => [],
                    'data' => []
                ]);
            }
            return response()->json([]);
        }

        // Build query
        $query = Item::query();

        // If not a wildcard search, apply search filters
        if ($search !== '*') {
            $query->where(function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('sku_id', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // Apply brand filter if provided
        if ($request->filled('brand') && $request->get('brand') !== '') {
            $query->where('brand', $request->get('brand'));
        }

        // Apply model filter if provided
        if ($request->filled('model') && $request->get('model') !== '') {
            $query->where('model', $request->get('model'));
        }

        // Check if this is a paginated request (for calculator)
        if ($request->filled('page')) {
            // Return paginated results for calculator
            $items = $query->paginate(15);

            // Transform the data while preserving Laravel's standard pagination structure
            $items->getCollection()->transform(function ($item) {
                return [
                    'id' => $item->item_id,
                    'item_name' => $item->item_name,
                    'sku_id' => $item->sku_id,
                    'barcode' => $item->barcode,
                    'current_stock' => $item->quantity,
                    'picture_url' => $item->picture_url,
                    'purchase_price' => $item->cost_price ?? 0,
                    'selling_price' => $item->retail_price ?? 0,
                    'category' => $item->category ?? 0,
                    'brand' => $item->brand ?? '',
                    'model' => $item->model ?? '',
                ];
            });

            // Ensure links array is always present for frontend compatibility
            $response = $items->toArray();

            // Generate proper pagination links
            $links = [];

            // Previous link
            if ($items->currentPage() > 1) {
                $links[] = [
                    'url' => $items->url($items->currentPage() - 1),
                    'label' => '&laquo; Previous',
                    'active' => false
                ];
            } else {
                $links[] = [
                    'url' => null,
                    'label' => '&laquo; Previous',
                    'active' => false
                ];
            }

            // Page numbers
            $startPage = max(1, $items->currentPage() - 2);
            $endPage = min($items->lastPage(), $items->currentPage() + 2);

            for ($i = $startPage; $i <= $endPage; $i++) {
                $links[] = [
                    'url' => $items->url($i),
                    'label' => (string) $i,
                    'active' => $i === $items->currentPage()
                ];
            }

            // Next link
            if ($items->currentPage() < $items->lastPage()) {
                $links[] = [
                    'url' => $items->url($items->currentPage() + 1),
                    'label' => 'Next &raquo;',
                    'active' => false
                ];
            } else {
                $links[] = [
                    'url' => null,
                    'label' => 'Next &raquo;',
                    'active' => false
                ];
            }

            $response['links'] = $links;

            return response()->json($response);
        } else {
            // Return simple array for search (stock in/out forms)
            $items = $query->limit($search === '*' ? 50 : 10)->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->item_id,
                        'item_name' => $item->item_name,
                        'sku_id' => $item->sku_id,
                        'barcode' => $item->barcode,
                        'current_stock' => $item->quantity,
                        'picture_url' => $item->picture_url,
                        'purchase_price' => $item->cost_price ?? 0,
                        'selling_price' => $item->retail_price ?? 0,
                        'category' => $item->category ?? 'other',
                    ];
                });

            return response()->json($items);
        }
    }
}
