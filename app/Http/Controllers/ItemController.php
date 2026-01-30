<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Brand;
use App\Models\ItemModel;
use App\Models\Color;
use App\Models\ActivityLog;
use App\Models\ExportNotification; // Added this import
use App\Services\PhotoService;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Barryvdh\DomPDF\Facade\Pdf;

class ItemController extends Controller
{
    protected $photoService;
    public function __construct(PhotoService $photoService)
    {
        $this->photoService = $photoService;
    }

    public function index(Request $request): Response
    {
        $query = Item::query();

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('item_name', 'like', "%{$search}%")
                    ->orWhere('sku_id', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%");
            });
        }

        // Filter by brand
        if ($request->filled('brand')) {
            $query->where('brand', $request->get('brand'));
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        $items = $query->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        $brands = Brand::orderBy('name')->get();
        $models = ItemModel::orderBy('name')->get();
        $colors = Color::orderBy('name')->get();

        return Inertia::render('ItemManagement/Index', [
            'items' => $items,
            'filters' => $request->only(['search', 'brand', 'status']),
            'brands' => $brands,
            'models' => $models,
            'colors' => $colors,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'item_id' => 'required|string',
            'sku_id' => 'required|string|unique:items,sku_id',
            'barcode' => 'required|string|unique:items,barcode',
            'item_name' => 'required|string|max:255',
            'brand' => 'required|string',
            'model' => 'required|string',
            'color' => 'required|string',
            'description' => 'required|string',
            'picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'cost_price' => 'required|numeric|min:0',
            'retail_price' => 'required|numeric|min:0',
        ]);



        $data = $request->all();
        $data['quantity'] = 0; // Default quantity

        // Handle file upload
        if ($request->hasFile('picture')) {
            $picturePath = $this->photoService->uploadPhoto($request->file('picture'), 'items');
            if ($picturePath) {
                $data['picture'] = $picturePath;
            } else {
                return back()->withErrors(['picture' => 'Failed to upload image. Please try again.']);
            }
        }

        $item = Item::create($data);

        // Log the activity
        ActivityLog::log(
            'item_created',
            "Item '{$item->item_name}' was created",
            $item->item_id,
            [
                'brand' => $item->brand,
                'model' => $item->model,
                'sku_id' => $item->sku_id,
                'quantity' => $item->quantity
            ]
        );

        return back()->with('success', 'Item created successfully.');
    }

    public function update(Request $request, Item $item)
    {
        $request->validate([
            'item_id' => 'required|string',
            'sku_id' => 'required|string|unique:items,sku_id,' . $item->id,
            'barcode' => 'required|string|unique:items,barcode,' . $item->id,
            'item_name' => 'required|string|max:255',
            'brand' => 'required|string',
            'model' => 'required|string',
            'color' => 'required|string',
            'description' => 'required|string',
            'picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'cost_price' => 'required|numeric|min:0',
            'retail_price' => 'required|numeric|min:0',
        ]);

        $data = $request->all();

        // Handle file upload
        if ($request->hasFile('picture')) {
            // Store old picture path for deletion after successful upload
            $oldPicturePath = $item->picture;

            // Upload new picture first
            $picturePath = $this->photoService->uploadPhoto($request->file('picture'), 'items');
            if ($picturePath) {
                // Set new picture path
                $data['picture'] = $picturePath;

                // Delete old picture from R2 if it exists and upload was successful
                if ($oldPicturePath) {
                    // Use force delete with retry mechanism for better reliability
                    $deleted = $this->photoService->forceDeletePhoto($oldPicturePath);
                    if (!$deleted) {
                        // Log warning but don't fail the update - new image is already uploaded
                        Log::warning("Failed to delete old image after multiple attempts: {$oldPicturePath}");
                    }
                }
            } else {
                return back()->withErrors(['picture' => 'Failed to upload image. Please try again.']);
            }
        } else {
            // No new picture uploaded - preserve the existing picture
            if ($item->picture) {
                $data['picture'] = $item->picture;
                Log::info("Preserving existing picture: {$item->picture}");
            }
        }

        $item->update($data);

        // Log the activity
        ActivityLog::log(
            'item_updated',
            "Item '{$item->item_name}' was updated",
            $item->item_id,
            [
                'brand' => $item->brand,
                'model' => $item->model,
                'sku_id' => $item->sku_id,
                'quantity' => $item->quantity
            ]
        );

        return back()->with('success', 'Item updated successfully.');
    }

    public function destroy(Item $item)
    {
        // Store item data for logging before deletion
        $itemData = [
            'item_name' => $item->item_name,
            'item_id' => $item->item_id,
            'brand' => $item->brand,
            'model' => $item->model,
            'sku_id' => $item->sku_id,
            'quantity' => $item->quantity
        ];

        // Delete picture file
        if ($item->picture) {
            $deleted = $this->photoService->forceDeletePhoto($item->picture);
            if (!$deleted) {
                Log::warning("Failed to delete image when deleting item {$item->id}: {$item->picture}");
            }
        }

        $item->delete();

        // Log the activity after deletion (without item_id foreign key reference)
        ActivityLog::log(
            'item_deleted',
            "Item '{$itemData['item_name']}' was deleted",
            null, // Don't reference the deleted item
            $itemData
        );

        return back()->with('success', 'Item deleted successfully.');
    }

    public function exportPdf(Request $request)
    {
        try {
            // Check if this is a large export (more than 1000 items)
            $query = Item::query();

            // Apply filters - handle both JSON and form data
            $brand = $request->input('brand') ?? $request->json('brand');
            $status = $request->input('status') ?? $request->json('status');

            if ($brand) {
                $query->where('brand', $brand);
            }

            if ($status) {
                $query->where('status', $status);
            }

            $itemCount = $query->count();

            // For large datasets, use queued job
            if ($itemCount > 1000) {
                return $this->exportPdfQueued($request);
            }

            // For smaller datasets, use direct export
            $items = $query->orderBy('created_at', 'desc')->get();

            $pdf = Pdf::loadView('exports.items', compact('items'))
                ->setPaper('a4', 'landscape')
                ->setOptions([
                    'defaultFont' => 'Arial',
                    'isHtml5ParserEnabled' => true,
                    'isRemoteEnabled' => true,
                ]);

            // For all requests, return the PDF directly with proper headers
            $filename = 'items-export-' . now()->format('Y-m-d-H-i-s') . '.pdf';

            return response($pdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0'
            ]);
        } catch (\Exception $e) {
            Log::error('PDF export error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            if ($request->header('X-Inertia')) {
                return back()->with('error', 'PDF export failed: ' . $e->getMessage());
            }

            return response()->json([
                'error' => 'PDF generation failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export PDF using queued job for large datasets
     */
    public function exportPdfQueued(Request $request)
    {
        $filters = [];

        // Handle both JSON and form data
        $brand = $request->input('brand') ?? $request->json('brand');
        $status = $request->input('status') ?? $request->json('status');

        if ($brand) {
            $filters['brand'] = $brand;
        }

        if ($status) {
            $filters['status'] = $status;
        }

        $filename = 'items-export-' . now()->format('Y-m-d-H-i-s') . '.pdf';

        try {
            // Debug logging
            $userId = auth()->id() ?? 1; // Default to user ID 1 if not authenticated
            Log::info('ExportPdfQueued called', [
                'filters' => $filters,
                'filename' => $filename,
                'user_id' => $userId,
                'request_data' => $request->all(),
                'json_data' => $request->json()->all()
            ]);

            // Dispatch the job
            \App\Jobs\ExportItemsPdfJob::dispatch($filters, $userId, $filename);

            return response()->json([
                'message' => 'PDF export has been queued. You will be notified when it\'s ready.',
                'filename' => $filename,
                'status' => 'queued'
            ]);
        } catch (\Exception $e) {
            Log::error('ExportPdfQueued error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Failed to queue export: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download a completed PDF export
     */
    public function downloadPdf(Request $request, $filename)
    {
        // Check both temp and exports directories
        $tempPath = 'temp/' . $filename;
        $exportPath = 'exports/' . $filename;

        // Debug logging
        \Log::info('Download PDF request', [
            'filename' => $filename,
            'temp_path' => $tempPath,
            'export_path' => $exportPath,
            'temp_exists' => Storage::exists($tempPath),
            'export_exists' => Storage::exists($exportPath)
        ]);

        if (Storage::exists($tempPath)) {
            $file = Storage::get($tempPath);
            Storage::delete($tempPath); // Clean up temp file after download
            return response($file, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"'
            ]);
        } elseif (Storage::exists($exportPath)) {
            return Storage::download($exportPath);
        }

        abort(404, 'Export file not found');
    }

    public function exportCsv(Request $request)
    {
        $query = Item::query();

        // Apply filters
        if ($request->filled('brand')) {
            $query->where('brand', $request->get('brand'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }

        $items = $query->orderBy('created_at', 'desc')->get();

        $filename = 'items-export-' . now()->format('Y-m-d-H-i-s') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($items) {
            $file = fopen('php://output', 'w');

            // Add CSV headers
            fputcsv($file, [
                'Item ID',
                'SKU ID',
                'Barcode',
                'Item Name',
                'Brand',
                'Model',
                'Color',
                'Description',
                'Cost Price (RM)',
                'Retail Price (RM)',
                'Quantity',
                'Status',
                'Created Date'
            ]);

            // Add data rows
            foreach ($items as $item) {
                fputcsv($file, [
                    $item->item_id,
                    $item->sku_id,
                    $item->barcode,
                    $item->item_name,
                    $item->brand,
                    $item->model,
                    $item->color,
                    $item->description,
                    number_format($item->cost_price, 2),
                    number_format($item->retail_price, 2),
                    $item->quantity,
                    ucwords(str_replace('_', ' ', $item->status)),
                    $item->created_at->format('Y-m-d H:i:s')
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function bulkImport(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:csv,txt|max:2048'
        ]);

        $file = $request->file('file');
        $csvData = file_get_contents($file);

        // Handle different line endings
        $csvData = str_replace(["\r\n", "\r"], "\n", $csvData);
        $rows = array_map('str_getcsv', explode("\n", $csvData));

        // Remove empty rows
        $rows = array_filter($rows, function ($row) {
            return !empty(array_filter($row, function ($cell) {
                return trim($cell) !== '';
            }));
        });

        if (empty($rows)) {
            return back()->with('error', 'CSV file is empty or invalid.');
        }

        $header = array_shift($rows);

        // Trim header values
        $header = array_map('trim', $header);

        // Validate required headers
        $requiredHeaders = ['item_id', 'sku_id', 'barcode', 'item_name', 'brand', 'model', 'color', 'description', 'cost_price', 'retail_price'];
        $missingHeaders = array_diff($requiredHeaders, $header);

        if (!empty($missingHeaders)) {
            return back()->with('error', 'Missing required columns: ' . implode(', ', $missingHeaders));
        }

        $imported = 0;
        $errors = [];

        // Track items within the CSV to prevent duplicates in the same file
        // Only SKU ID and Barcode need to be unique
        $csvSkuIds = [];
        $csvBarcodes = [];

        foreach ($rows as $index => $row) {
            if (empty(array_filter($row))) continue;

            try {
                // Ensure row has same number of columns as header
                if (count($row) !== count($header)) {
                    $errors[] = "Row " . ($index + 2) . ": Column count mismatch. Expected " . count($header) . " columns, got " . count($row);
                    continue;
                }

                $data = array_combine($header, $row);

                // Trim whitespace from all values
                $data = array_map('trim', $data);

                // Validate required fields (same as individual item validation)
                $validationErrors = [];

                // Check required fields with string length validation
                if (empty($data['item_id'])) {
                    $validationErrors[] = "Item ID is required";
                } elseif (strlen($data['item_id']) > 255) {
                    $validationErrors[] = "Item ID must not exceed 255 characters";
                }

                if (empty($data['sku_id'])) {
                    $validationErrors[] = "SKU ID is required";
                } elseif (strlen($data['sku_id']) > 255) {
                    $validationErrors[] = "SKU ID must not exceed 255 characters";
                }

                if (empty($data['barcode'])) {
                    $validationErrors[] = "Barcode is required";
                } elseif (strlen($data['barcode']) > 255) {
                    $validationErrors[] = "Barcode must not exceed 255 characters";
                }

                if (empty($data['item_name'])) {
                    $validationErrors[] = "Item name is required";
                } elseif (strlen($data['item_name']) > 255) {
                    $validationErrors[] = "Item name must not exceed 255 characters";
                }

                if (empty($data['brand'])) {
                    $validationErrors[] = "Brand is required";
                } elseif (strlen($data['brand']) > 255) {
                    $validationErrors[] = "Brand must not exceed 255 characters";
                }

                if (empty($data['model'])) {
                    $validationErrors[] = "Model is required";
                } elseif (strlen($data['model']) > 255) {
                    $validationErrors[] = "Model must not exceed 255 characters";
                }

                if (empty($data['color'])) {
                    $validationErrors[] = "Color is required";
                } elseif (strlen($data['color']) > 255) {
                    $validationErrors[] = "Color must not exceed 255 characters";
                } else {
                    // Validate against allowed colors for CSV import
                    $allowedColors = ['Black', 'Red', 'Blue', 'Green', 'Yellow', 'Maroon', 'Orange', 'Pink', 'Turquoise', 'No Color'];
                    if (!in_array($data['color'], $allowedColors)) {
                        $validationErrors[] = "Color must be one of: " . implode(', ', $allowedColors);
                    }
                }

                if (empty($data['description'])) {
                    $validationErrors[] = "Description is required";
                }

                // Validate numeric fields with proper constraints (decimal 10,2)
                if (empty($data['cost_price'])) {
                    $validationErrors[] = "Cost price is required";
                } elseif (!is_numeric($data['cost_price'])) {
                    $validationErrors[] = "Cost price must be a valid number";
                } elseif (floatval($data['cost_price']) < 0) {
                    $validationErrors[] = "Cost price must be greater than or equal to 0";
                } elseif (floatval($data['cost_price']) > 99999999.99) {
                    $validationErrors[] = "Cost price is too large (maximum: 99,999,999.99)";
                }

                if (empty($data['retail_price'])) {
                    $validationErrors[] = "Retail price is required";
                } elseif (!is_numeric($data['retail_price'])) {
                    $validationErrors[] = "Retail price must be a valid number";
                } elseif (floatval($data['retail_price']) < 0) {
                    $validationErrors[] = "Retail price must be greater than or equal to 0";
                } elseif (floatval($data['retail_price']) > 99999999.99) {
                    $validationErrors[] = "Retail price is too large (maximum: 99,999,999.99)";
                }

                // If there are validation errors, add them and continue to next row
                if (!empty($validationErrors)) {
                    $errors[] = "Row " . ($index + 2) . ": " . implode(', ', $validationErrors);
                    continue;
                }



                // Check for duplicates within the CSV file (only SKU ID and Barcode)
                if (in_array($data['sku_id'], $csvSkuIds)) {
                    $errors[] = "Row " . ($index + 2) . ": SKU ID '{$data['sku_id']}' is duplicated in the CSV file";
                    continue;
                }
                if (in_array($data['barcode'], $csvBarcodes)) {
                    $errors[] = "Row " . ($index + 2) . ": Barcode '{$data['barcode']}' is duplicated in the CSV file";
                    continue;
                }

                // Check for duplicates in the database (only SKU ID and Barcode)
                if (Item::where('sku_id', $data['sku_id'])->exists()) {
                    $errors[] = "Row " . ($index + 2) . ": SKU ID '{$data['sku_id']}' already exists in database";
                    continue;
                }

                if (Item::where('barcode', $data['barcode'])->exists()) {
                    $errors[] = "Row " . ($index + 2) . ": Barcode '{$data['barcode']}' already exists in database";
                    continue;
                }

                // Add to CSV tracking arrays (only SKU ID and Barcode)
                $csvSkuIds[] = $data['sku_id'];
                $csvBarcodes[] = $data['barcode'];

                // Convert validated numeric fields
                $costPrice = floatval($data['cost_price']);
                $retailPrice = floatval($data['retail_price']);

                $itemData = [
                    'item_id' => $data['item_id'],
                    'sku_id' => $data['sku_id'],
                    'barcode' => $data['barcode'],
                    'item_name' => $data['item_name'],
                    'brand' => $data['brand'],
                    'model' => $data['model'],
                    'color' => $data['color'],
                    'description' => $data['description'],
                    'cost_price' => $costPrice,
                    'retail_price' => $retailPrice,
                    'quantity' => 0,
                ];

                // Create item in database
                $item = Item::create($itemData);

                $imported++;
            } catch (\Exception $e) {
                $errors[] = "Row " . ($index + 2) . ": " . $e->getMessage();
            }
        }

        $totalRows = count($rows);

        if ($imported > 0) {
            $message = "Successfully imported {$imported} out of {$totalRows} items.";
            if (!empty($errors)) {
                $errorCount = count($errors);
                $message .= " {$errorCount} rows had validation errors.";

                // Show first few errors for reference
                if ($errorCount <= 3) {
                    $message .= " Errors: " . implode(' | ', $errors);
                } else {
                    $message .= " First 3 errors: " . implode(' | ', array_slice($errors, 0, 3));
                    $message .= " (and " . ($errorCount - 3) . " more errors)";
                }
            }
            return back()->with('success', $message);
        } else {
            $errorMessage = "Import failed. No items were imported from {$totalRows} rows.";
            if (!empty($errors)) {
                $errorCount = count($errors);

                // Show first few errors for debugging
                if ($errorCount <= 5) {
                    $errorMessage .= " Errors: " . implode(' | ', $errors);
                } else {
                    $errorMessage .= " First 5 errors: " . implode(' | ', array_slice($errors, 0, 5));
                    $errorMessage .= " (and " . ($errorCount - 5) . " more errors)";
                }
            }
            return back()->with('error', $errorMessage);
        }
    }

    public function downloadTemplate()
    {
        $headers = [
            'item_id',
            'sku_id',
            'barcode',
            'item_name',
            'brand',
            'model',
            'color',
            'description',
            'cost_price',
            'retail_price'
        ];

        $sampleData = [
            [
                'ITM-000001',
                'APL-IP15-BLK-001',
                '1234567890123',
                'iPhone 15 Pro Max',
                'Apple',
                'iPhone 15',
                'Black',
                'Latest iPhone with advanced features',
                '4500.00',
                '5999.00'
            ],
            [
                'ITM-000002',
                'SAM-GAL-RED-002',
                '2345678901234',
                'Samsung Galaxy S24',
                'Samsung',
                'Galaxy S24',
                'Red',
                'Premium Android smartphone',
                '3200.00',
                '4299.00'
            ]
        ];

        $filename = 'items-import-template.csv';
        $handle = fopen('php://temp', 'w+');

        // Add headers
        fputcsv($handle, $headers);

        // Add comment row about allowed colors
        fputcsv($handle, [
            '# NOTE: Color field must be one of: Black, Red, Blue, Green, Yellow, Maroon, Orange, Pink, Turquoise, No Color',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            ''
        ]);

        // Add sample data
        foreach ($sampleData as $row) {
            fputcsv($handle, $row);
        }

        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);

        return response($content)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    /**
     * Check export status
     */
    public function checkExportStatus(Request $request)
    {
        $notifications = ExportNotification::where('user_id', auth()->id())
            ->where('type', 'pdf')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'notifications' => $notifications,
            'pending_count' => $notifications->where('status', 'pending')->count(),
            'completed_count' => $notifications->where('status', 'completed')->count(),
        ]);
    }
}
