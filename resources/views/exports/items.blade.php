<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Items Export Report</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            font-size: 12px; 
            margin: 0;
            padding: 20px;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #333;
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .summary {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
        }
        .summary-item {
            text-align: center;
        }
        .summary-item .number {
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }
        .summary-item .label {
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            font-size: 10px;
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
            vertical-align: top;
        }
        th { 
            background-color: #f8f9fa; 
            font-weight: bold;
            color: #333;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .status-badge { 
            padding: 2px 6px; 
            border-radius: 10px; 
            font-size: 9px;
            font-weight: bold;
            text-align: center;
        }
        .out-of-stock { 
            background-color: #fee2e2; 
            color: #991b1b; 
        }
        .low-stock { 
            background-color: #fef3c7; 
            color: #92400e; 
        }
        .ready-stock { 
            background-color: #dcfce7; 
            color: #166534; 
        }
        .price {
            text-align: right;
            font-weight: bold;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Items Inventory Report</h1>
        <p><strong>Generated on:</strong> {{ now()->format('F j, Y \a\t g:i A') }}</p>
        <p><strong>Total Items:</strong> {{ $items->count() }}</p>
        @if(request('brand'))
            <p><strong>Brand Filter:</strong> {{ request('brand') }}</p>
        @endif
        @if(request('status'))
            <p><strong>Status Filter:</strong> {{ ucwords(str_replace('_', ' ', request('status'))) }}</p>
        @endif
    </div>

    <div class="summary">
        <div class="summary-grid">
            <div class="summary-item">
                <div class="number">{{ $items->where('status', 'ready_stock')->count() }}</div>
                <div class="label">Ready Stock</div>
            </div>
            <div class="summary-item">
                <div class="number">{{ $items->where('status', 'low_stock')->count() }}</div>
                <div class="label">Low Stock</div>
            </div>
            <div class="summary-item">
                <div class="number">{{ $items->where('status', 'out_of_stock')->count() }}</div>
                <div class="label">Out of Stock</div>
            </div>
            <div class="summary-item">
                <div class="number">RM {{ number_format($items->sum('retail_price'), 2) }}</div>
                <div class="label">Total Value</div>
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 8%;">Item ID</th>
                <th style="width: 10%;">SKU</th>
                <th style="width: 10%;">Barcode</th>
                <th style="width: 20%;">Item Name</th>
                <th style="width: 8%;">Brand</th>
                <th style="width: 8%;">Model</th>
                <th style="width: 6%;">Color</th>
                <th style="width: 8%;">Cost (RM)</th>
                <th style="width: 8%;">Retail (RM)</th>
                <th style="width: 5%;">Qty</th>
                <th style="width: 7%;">Status</th>
                <th style="width: 8%;">Created</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $item)
            <tr>
                <td>{{ $item->item_id }}</td>
                <td>{{ $item->sku_id }}</td>
                <td>{{ $item->barcode ?? '-' }}</td>
                <td><strong>{{ $item->item_name }}</strong></td>
                <td>{{ $item->brand }}</td>
                <td>{{ $item->model }}</td>
                <td>{{ $item->color }}</td>
                <td class="price">{{ number_format($item->cost_price, 2) }}</td>
                <td class="price">{{ number_format($item->retail_price, 2) }}</td>
                <td style="text-align: center;">{{ $item->quantity }}</td>
                <td>
                    <span class="status-badge {{ str_replace('_', '-', $item->status) }}">
                        {{ ucwords(str_replace('_', ' ', $item->status)) }}
                    </span>
                </td>
                <td>{{ $item->created_at->format('M j, Y') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    @if($items->count() == 0)
        <div style="text-align: center; padding: 40px; color: #666;">
            <p>No items found matching the specified criteria.</p>
        </div>
    @endif

    <div class="footer">
        <p>This report was generated automatically by the Item Management System.</p>
        <p>© {{ date('Y') }} {{ config('app.name') }} - Confidential</p>
    </div>
</body>
</html>
