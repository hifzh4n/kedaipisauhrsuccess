<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Current Stock Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            color: #333;
        }
        .header p {
            margin: 5px 0;
            font-size: 14px;
            color: #666;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        .low-stock {
            background-color: #fff3cd;
        }
        .out-of-stock {
            background-color: #f8d7da;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Current Stock Report</h1>
        <p>Generated on: {{ now()->format('F j, Y \a\t g:i A') }}</p>
        <p>Total Items: {{ count($data) }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Item Name</th>
                <th>SKU</th>
                <th>Barcode</th>
                <th>Current Stock</th>
                <th>Total Batches</th>
                <th>Oldest Batch Date</th>
                <th>Last Updated</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $item)
            <tr class="@if($item['current_stock'] == 0) out-of-stock @elseif($item['current_stock'] <= 10) low-stock @endif">
                <td>{{ $item['item_name'] }}</td>
                <td>{{ $item['sku_id'] }}</td>
                <td>{{ $item['barcode'] ?? 'N/A' }}</td>
                <td>{{ $item['current_stock'] }}</td>
                <td>{{ $item['total_batches'] }}</td>
                <td>{{ $item['oldest_batch_date'] }}</td>
                <td>{{ $item['last_updated'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        <p>This report was generated automatically by the Stock Management System</p>
        <p>Low stock items (≤10) are highlighted in yellow, out of stock items in red</p>
    </div>
</body>
</html>
