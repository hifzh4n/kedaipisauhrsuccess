<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Item;
use App\Models\StockMovement;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the main dashboard.
     */
    public function index(): Response
    {
        // Get overall statistics
        $stats = [
            'totalItems' => Item::count(),
            'totalCost' => Item::sum('cost_price'),
            'lowStock' => Item::where('status', 'low_stock')->count(),
            'outOfStock' => Item::where('status', 'out_of_stock')->count(),
        ];

        // Get monthly trends data for the last 6 months
        $monthlyTrends = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $monthName = $date->format('M');
            
            $stockIn = StockMovement::where('type', 'in')
                ->whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->sum('quantity');
                
            $stockOut = StockMovement::where('type', 'out')
                ->whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->sum('quantity');
            
            $monthlyTrends[] = [
                'month' => $monthName,
                'stockIn' => $stockIn,
                'stockOut' => $stockOut,
            ];
        }

        // Get brand and model distribution data
        $brandModelData = Item::selectRaw('brand, model, COUNT(*) as count')
            ->groupBy('brand', 'model')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'brand' => $item->brand,
                    'model' => $item->model,
                    'count' => $item->count,
                ];
            });

        // Get recent activity data (last 3 activities)
        $recentActivity = ActivityLog::with(['item', 'user'])
            ->orderBy('created_at', 'desc')
            ->limit(3)
            ->get()
            ->map(function ($activity) {
                return [
                    'id' => $activity->id,
                    'type' => $activity->type,
                    'description' => $activity->description,
                    'metadata' => $activity->metadata,
                    'created_at' => $activity->created_at,
                    'item' => $activity->item ? [
                        'item_id' => $activity->item->item_id,
                        'item_name' => $activity->item->item_name,
                        'brand' => $activity->item->brand,
                        'model' => $activity->item->model,
                    ] : ($activity->metadata ? [
                        'item_id' => $activity->metadata['item_id'] ?? null,
                        'item_name' => $activity->metadata['item_name'] ?? 'Unknown Item',
                        'brand' => $activity->metadata['brand'] ?? null,
                        'model' => $activity->metadata['model'] ?? null,
                    ] : null),
                    'user' => [
                        'name' => $activity->user ? $activity->user->name : 'System',
                    ],
                ];
            });

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'monthlyTrends' => $monthlyTrends,
            'brandModelData' => $brandModelData,
            'recentActivity' => $recentActivity,
        ]);
    }
}
