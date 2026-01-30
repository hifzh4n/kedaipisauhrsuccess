<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Stock Movements Report</title>
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
    </style>
</head>
<body>
    <div class="header">
        <h1>Stock Movements Report</h1>
        <p>Generated on: {{ now()->format('F j, Y \a\t g:i A') }}</p>
        <p>Total Records: {{ count($data) }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Item Name</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Batch Number</th>
                <th>Date</th>
                <th>User</th>
            </tr>
        </thead>
        <tbody>
            @forelse($data as $movement)
            <tr>
                <td>{{ $movement['item_name'] ?? 'N/A' }}</td>
                <td>{{ $movement['type'] ?? 'N/A' }}</td>
                <td>{{ $movement['quantity'] ?? '0' }}</td>
                <td>{{ $movement['reason'] ?? 'N/A' }}</td>
                <td>{{ $movement['batch_number'] ?? 'N/A' }}</td>
                <td>{{ $movement['date'] ?? 'N/A' }}</td>
                <td>{{ $movement['user'] ?? 'N/A' }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px; color: #666;">
                    No stock movements found for the selected criteria.
                </td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        <p>This report was generated automatically by the Stock Management System</p>
    </div>
</body>
</html>
