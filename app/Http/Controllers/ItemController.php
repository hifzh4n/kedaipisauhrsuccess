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
use Spatie\SimpleExcel\SimpleExcelReader;
use Spatie\SimpleExcel\SimpleExcelWriter;

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

        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');

        if ($sortField === 'retail_price') {
            $query->orderBy('retail_price', $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $items = $query->paginate(10)
            ->withQueryString();

        $brands = Brand::orderBy('name')->get();
        $models = ItemModel::orderBy('name')->get();
        $colors = Color::orderBy('name')->get();

        return Inertia::render('ItemManagement/Index', [
            'items' => $items,
            'filters' => $request->only(['search', 'brand', 'status', 'sort_field', 'sort_direction']),
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
            // Upload new picture first
            $picturePath = $this->photoService->uploadPhoto($request->file('picture'), 'items');
            if ($picturePath) {
                // Set new picture path
                $data['picture'] = $picturePath;
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
            $this->applyPdfRuntimeLimits();

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

            // Queue only very large datasets; this server does not run queue workers by default.
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
        $this->applyPdfRuntimeLimits();

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

    /**
     * Increase runtime limits for memory-intensive PDF generation.
     */
    private function applyPdfRuntimeLimits(): void
    {
        @ini_set('memory_limit', '512M');
        @ini_set('max_execution_time', '180');
        @set_time_limit(180);
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
                    $this->formatBarcodeForCsv($item->barcode),
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

    public function exportXlsx(Request $request)
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
        $rows = $this->buildItemExportRows($items, false);

        if (!is_dir(storage_path('app/temp'))) {
            mkdir(storage_path('app/temp'), 0755, true);
        }

        $tempBase = tempnam(storage_path('app/temp'), 'items-export-');
        $filepath = $tempBase . '.xlsx';
        @unlink($tempBase);

        $writer = SimpleExcelWriter::create($filepath);
        $writer->addRows($rows);
        $writer->close();

        $filename = 'items-export-' . now()->format('Y-m-d-H-i-s') . '.xlsx';

        return response()->download($filepath, $filename)->deleteFileAfterSend(true);
    }

    public function bulkImport(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:csv,txt,xlsx|max:5120'
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: '');
        $rows = [];

        if ($extension === 'xlsx') {
            try {
                // Parse XLSX file without assuming a fixed header schema.
                $rows = SimpleExcelReader::create($file->getPathname(), 'xlsx')
                    ->noHeaderRow()
                    ->getRows()
                    ->map(function (array $row) {
                        return array_values($row);
                    })
                    ->toArray();
            } catch (\Throwable $e) {
                Log::error('XLSX import parse failed', [
                    'error' => $e->getMessage(),
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'extension' => $extension,
                ]);

                return back()->with('error', 'Unable to read the Excel file. Please use a valid .xlsx file generated from the template.');
            }
        } else {
            // Parse CSV file
            $csvData = file_get_contents($file->getPathname());
            $csvData = str_replace(["\r\n", "\r"], "\n", $csvData);
            $rows = array_map('str_getcsv', explode("\n", $csvData));
        }

        // Remove empty rows
        $rows = array_filter($rows, function ($row) {
            return !empty(array_filter($row, function ($cell) {
                return $this->normalizeImportCellValue($cell) !== '';
            }));
        });

        if (empty($rows)) {
            return back()->with('error', 'CSV file is empty or invalid. Please ensure your file has headers and at least one data row. Download the template from the import dialog for the correct format.');
        }

        $header = array_shift($rows);
        $originalHeader = $header;

        // Normalize headers: lowercase and remove all non-alphanumeric characters
        $normalizedHeaders = array_map(function ($h) {
            return preg_replace('/[^a-z0-9]/', '', strtolower($this->normalizeImportCellValue($h)));
        }, $header);

        // Map of normalized keys to field names
        $requiredHeadersMap = [
            'itemid' => 'item_id',
            'skuid' => 'sku_id',
            'barcode' => 'barcode',
            'itemname' => 'item_name',
            'brand' => 'brand',
            'model' => 'model',
            'color' => 'color',
            'description' => 'description',
            'costprice' => 'cost_price',
            'costpricerm' => 'cost_price',
            'retailprice' => 'retail_price',
            'retailpricerm' => 'retail_price',
            'quantity' => 'quantity',
            'qty' => 'quantity',
        ];

        // Create mapping from original header positions to field names
        $headerMapping = [];
        foreach ($normalizedHeaders as $i => $normalized) {
            if (isset($requiredHeadersMap[$normalized])) {
                $headerMapping[$i] = $requiredHeadersMap[$normalized];
            }
        }

        if (empty($headerMapping)) {
            $foundHeaders = array_filter($originalHeader, function($h) {
                return $this->normalizeImportCellValue($h) !== '';
            });
            $headerInfo = !empty($foundHeaders)
                ? 'Found columns: ' . implode(', ', $foundHeaders) . '. '
                : 'No valid column headers found. ';
            return back()->with('error', $headerInfo . 'No supported import columns found. Please use the export/template format.');
        }

        $imported = 0;
        $errors = [];

        // Track item IDs within the CSV to prevent duplicate updates in the same file.
        $csvItemIds = [];

        foreach ($rows as $index => $row) {
            if (empty(array_filter($row))) continue;

            try {
                // Build data array using the mapping
                $data = [];
                foreach ($row as $i => $value) {
                    if (isset($headerMapping[$i])) {
                        $data[$headerMapping[$i]] = $this->normalizeImportCellValue($value);
                    }
                }

                if (array_key_exists('barcode', $data)) {
                    $data['barcode'] = $this->normalizeBarcodeValue($data['barcode']);
                }
                if (array_key_exists('cost_price', $data)) {
                    $data['cost_price'] = $this->normalizeDecimalValue($data['cost_price']);
                }
                if (array_key_exists('retail_price', $data)) {
                    $data['retail_price'] = $this->normalizeDecimalValue($data['retail_price']);
                }
                if (array_key_exists('quantity', $data)) {
                    $data['quantity'] = $this->normalizeIntegerValue($data['quantity']);
                }

                // Skip row if we couldn't map any headers
                if (empty($data)) {
                    $errors[] = "Row " . ($index + 2) . ": No valid column data found.";
                    continue;
                }

                // Validate fields only when provided, and default missing values.
                $validationErrors = [];

                if (!empty($data['item_id']) && strlen($data['item_id']) > 255) {
                    $validationErrors[] = "Item ID must not exceed 255 characters";
                }

                if (!empty($data['sku_id']) && strlen($data['sku_id']) > 255) {
                    $validationErrors[] = "SKU ID must not exceed 255 characters";
                }

                if (!empty($data['barcode']) && strlen($data['barcode']) > 255) {
                    $validationErrors[] = "Barcode must not exceed 255 characters";
                }

                if (!empty($data['item_name']) && strlen($data['item_name']) > 255) {
                    $validationErrors[] = "Item name must not exceed 255 characters";
                }

                if (!empty($data['brand']) && strlen($data['brand']) > 255) {
                    $validationErrors[] = "Brand must not exceed 255 characters";
                }

                if (!empty($data['model']) && strlen($data['model']) > 255) {
                    $validationErrors[] = "Model must not exceed 255 characters";
                }

                if (!empty($data['color']) && strlen($data['color']) > 255) {
                    $validationErrors[] = "Color must not exceed 255 characters";
                }

                // Validate numeric fields
                if (isset($data['cost_price']) && $data['cost_price'] !== '' && !is_numeric($data['cost_price'])) {
                    $validationErrors[] = "Cost price must be a valid number";
                } elseif (isset($data['cost_price']) && $data['cost_price'] !== '' && floatval($data['cost_price']) < 0) {
                    $validationErrors[] = "Cost price must be greater than or equal to 0";
                } elseif (isset($data['cost_price']) && $data['cost_price'] !== '' && floatval($data['cost_price']) > 99999999.99) {
                    $validationErrors[] = "Cost price is too large (maximum: 99,999,999.99)";
                }

                if (isset($data['retail_price']) && $data['retail_price'] !== '' && !is_numeric($data['retail_price'])) {
                    $validationErrors[] = "Retail price must be a valid number";
                } elseif (isset($data['retail_price']) && $data['retail_price'] !== '' && floatval($data['retail_price']) < 0) {
                    $validationErrors[] = "Retail price must be greater than or equal to 0";
                } elseif (isset($data['retail_price']) && $data['retail_price'] !== '' && floatval($data['retail_price']) > 99999999.99) {
                    $validationErrors[] = "Retail price is too large (maximum: 99,999,999.99)";
                }

                if (isset($data['quantity']) && $data['quantity'] !== '' && !is_numeric($data['quantity'])) {
                    $validationErrors[] = "Quantity must be a valid number";
                } elseif (isset($data['quantity']) && $data['quantity'] !== '' && floatval($data['quantity']) < 0) {
                    $validationErrors[] = "Quantity must be greater than or equal to 0";
                }

                // Validate that brand, model, and color exist in attribute management
                if (!empty($data['brand'])) {
                    $brandExists = Brand::where('name', $data['brand'])->exists();
                    if (!$brandExists) {
                        $validationErrors[] = "Brand '{$data['brand']}' does not exist in attribute management";
                    }
                }

                if (!empty($data['model'])) {
                    $modelExists = ItemModel::where('name', $data['model'])->exists();
                    if (!$modelExists) {
                        $validationErrors[] = "Model '{$data['model']}' does not exist in attribute management";
                    }
                }

                if (!empty($data['color'])) {
                    $colorExists = Color::where('name', $data['color'])->exists();
                    if (!$colorExists) {
                        $validationErrors[] = "Color '{$data['color']}' does not exist in attribute management";
                    }
                }

                // If there are validation errors, add them and continue to next row
                if (!empty($validationErrors)) {
                    $errors[] = "Row " . ($index + 2) . ": " . implode(', ', $validationErrors);
                    continue;
                }

                $resolvedItemId = isset($data['item_id']) && $data['item_id'] !== '' ? $data['item_id'] : null;
                $resolvedSkuId = isset($data['sku_id']) && $data['sku_id'] !== '' ? $data['sku_id'] : null;
                $resolvedBarcode = isset($data['barcode']) && $data['barcode'] !== '' ? $data['barcode'] : null;

                // Use Item ID as the only identifier for update/create operations.
                if ($resolvedItemId === null) {
                    $errors[] = "Row " . ($index + 2) . ": Missing Item ID.";
                    continue;
                }

                // Check for duplicate item IDs within the same CSV file.
                if (in_array($resolvedItemId, $csvItemIds)) {
                    $errors[] = "Row " . ($index + 2) . ": Item ID '{$resolvedItemId}' is duplicated in the CSV file";
                    continue;
                }

                $csvItemIds[] = $resolvedItemId;

                // Find existing item by Item ID only.
                $existingItem = Item::where('item_id', $resolvedItemId)->first();

                // Convert numeric fields if provided
                $costPrice = isset($data['cost_price']) && $data['cost_price'] !== '' ? floatval($data['cost_price']) : null;
                $retailPrice = isset($data['retail_price']) && $data['retail_price'] !== '' ? floatval($data['retail_price']) : null;
                $quantity = isset($data['quantity']) && $data['quantity'] !== '' ? (int)floatval($data['quantity']) : null;

                if ($existingItem) {
                    // Update only provided fields; preserve existing values for missing columns.
                    $existingItem->item_id = $resolvedItemId ?? $existingItem->item_id;
                    $existingItem->sku_id = $resolvedSkuId ?? $existingItem->sku_id;
                    $existingItem->barcode = $resolvedBarcode ?? $existingItem->barcode;
                    if (isset($data['item_name']) && $data['item_name'] !== '') {
                        $existingItem->item_name = $data['item_name'];
                    }
                    if (isset($data['brand']) && $data['brand'] !== '') {
                        $existingItem->brand = $data['brand'];
                    }
                    if (isset($data['model']) && $data['model'] !== '') {
                        $existingItem->model = $data['model'];
                    }
                    if (isset($data['color']) && $data['color'] !== '') {
                        $existingItem->color = $data['color'];
                    }
                    if (array_key_exists('description', $data)) {
                        $existingItem->description = $data['description'] !== '' ? $data['description'] : null;
                    }
                    if ($costPrice !== null) {
                        $existingItem->cost_price = $costPrice;
                    }
                    if ($retailPrice !== null) {
                        $existingItem->retail_price = $retailPrice;
                    }
                    if ($quantity !== null) {
                        $existingItem->quantity = $quantity;
                    }

                    $existingItem->save();
                } else {
                    // Create new item only when minimum required fields are available.
                    $fallbackSuffix = str_pad((string)($index + 1), 6, '0', STR_PAD_LEFT);

                    $itemData = [
                        'item_id' => $resolvedItemId ?? ('ITM-AUTO-' . $fallbackSuffix),
                        'sku_id' => $resolvedSkuId ?? ('SKU-AUTO-' . $fallbackSuffix),
                        'barcode' => $resolvedBarcode,
                        'item_name' => (isset($data['item_name']) && $data['item_name'] !== '') ? $data['item_name'] : ('Imported Item ' . ($index + 1)),
                        'brand' => (isset($data['brand']) && $data['brand'] !== '') ? $data['brand'] : 'Unknown',
                        'model' => (isset($data['model']) && $data['model'] !== '') ? $data['model'] : 'Unknown',
                        'color' => (isset($data['color']) && $data['color'] !== '') ? $data['color'] : 'No Color',
                        'description' => array_key_exists('description', $data) ? ($data['description'] !== '' ? $data['description'] : null) : null,
                        'cost_price' => $costPrice ?? 0,
                        'retail_price' => $retailPrice ?? 0,
                        'quantity' => $quantity ?? 0,
                    ];

                    Item::create($itemData);
                }

                $imported++;
            } catch (\Throwable $e) {
                $errors[] = "Row " . ($index + 2) . ": " . $e->getMessage();
            }
        }

        $totalRows = count($rows);

        if (!empty($errors)) {
            Log::warning('Item bulk import row validation errors', [
                'user_id' => auth()->id(),
                'total_rows' => $totalRows,
                'imported_rows' => $imported,
                'failed_rows' => count($errors),
                'errors' => $errors,
            ]);
        }

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
        // Template columns used for import. Status and timestamps are system-managed.
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
            'retail_price',
            'quantity',
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
                '5999.00',
                '10',
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
                '4299.00',
                '5',
            ]
        ];

        $downloadName = 'items-import-template.xlsx';
        
        // Create temp directory if it doesn't exist
        if (!is_dir(storage_path('app/temp'))) {
            mkdir(storage_path('app/temp'), 0755, true);
        }

        // Use a unique temp file path to avoid stale permission issues.
        $tempBase = tempnam(storage_path('app/temp'), 'items-import-template-');
        $filepath = $tempBase . '.xlsx';
        @unlink($tempBase);

        // Create XLSX template using SimpleExcel.
        $writer = SimpleExcelWriter::create($filepath);

        // Write associative rows so the header row uses actual field names.
        $rows = [];
        foreach ($sampleData as $row) {
            $rows[] = array_combine($headers, $row);
        }
        $writer->addRows($rows);

        $writer->close();

        return response()->download($filepath, $downloadName)->deleteFileAfterSend(true);
    }

    private function normalizeBarcodeValue(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $barcode = trim((string) $value);

        if ($barcode === '') {
            return null;
        }

        if (preg_match('/^="?(.*?)"?$/', $barcode, $matches)) {
            $barcode = $matches[1];
        }

        if (preg_match('/^[0-9]+(?:\.0+)?e[\+\-]?[0-9]+$/i', $barcode)) {
            return sprintf('%.0f', (float) $barcode);
        }

        if (is_numeric($barcode) && str_contains($barcode, '.')) {
            $floatValue = (float) $barcode;

            if (floor($floatValue) === $floatValue) {
                return sprintf('%.0f', $floatValue);
            }
        }

        return $barcode;
    }

    private function formatBarcodeForCsv(?string $barcode): string
    {
        if ($barcode === null || $barcode === '') {
            return '';
        }

        return '="' . $this->normalizeBarcodeValue($barcode) . '"';
    }

    private function buildItemExportRows($items, bool $forCsv = false): array
    {
        return $items->map(function ($item) use ($forCsv) {
            return [
                'Item ID' => $item->item_id,
                'SKU ID' => $item->sku_id,
                'Barcode' => $forCsv
                    ? $this->formatBarcodeForCsv($item->barcode)
                    : $this->normalizeBarcodeValue($item->barcode),
                'Item Name' => $item->item_name,
                'Brand' => $item->brand,
                'Model' => $item->model,
                'Color' => $item->color,
                'Description' => $item->description,
                'Cost Price (RM)' => number_format($item->cost_price, 2),
                'Retail Price (RM)' => number_format($item->retail_price, 2),
                'Quantity' => $item->quantity,
                'Status' => ucwords(str_replace('_', ' ', $item->status)),
                'Created Date' => $item->created_at->format('Y-m-d H:i:s'),
            ];
        })->all();
    }

    private function normalizeDecimalValue(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = trim((string) $value);

        if ($normalized === '') {
            return null;
        }

        $normalized = str_ireplace(['rm', 'myr'], '', $normalized);
        $normalized = preg_replace('/[^0-9.\-]/', '', $normalized);

        return $normalized === '' ? null : $normalized;
    }

    private function normalizeIntegerValue(mixed $value): ?string
    {
        $normalized = $this->normalizeDecimalValue($value);

        if ($normalized === null) {
            return null;
        }

        if (is_numeric($normalized) && str_contains($normalized, '.')) {
            $floatValue = (float) $normalized;

            if (floor($floatValue) === $floatValue) {
                return sprintf('%.0f', $floatValue);
            }
        }

        return $normalized;
    }

    private function normalizeImportCellValue(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d H:i:s');
        }

        if (is_scalar($value)) {
            return trim((string) $value);
        }

        if (is_object($value) && method_exists($value, '__toString')) {
            return trim((string) $value);
        }

        return '';
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
