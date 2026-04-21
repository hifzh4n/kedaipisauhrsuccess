<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Import Row Errors</title>
    <style>
        body {
            margin: 0;
            padding: 24px;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            background: #0b1220;
            color: #e5e7eb;
        }

        .container {
            max-width: 1100px;
            margin: 0 auto;
        }

        .card {
            background: #111b2f;
            border: 1px solid #24334d;
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 16px;
        }

        h1 {
            margin-top: 0;
            margin-bottom: 8px;
            font-size: 24px;
        }

        .meta {
            color: #9fb0cb;
            font-size: 14px;
            margin-bottom: 8px;
        }

        .summary {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            font-size: 14px;
        }

        .summary span {
            background: #16243d;
            border: 1px solid #2b3d5d;
            border-radius: 8px;
            padding: 6px 10px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }

        th, td {
            text-align: left;
            border-bottom: 1px solid #223250;
            padding: 10px;
            vertical-align: top;
            font-size: 14px;
        }

        th {
            color: #9fb0cb;
            font-weight: 600;
        }

        .empty {
            color: #9fb0cb;
            font-size: 14px;
            padding: 8px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>Item Import Row Errors</h1>
            <div class="meta">Latest import error report for your account</div>
            <div class="meta">Generated at: {{ $generatedAt ?? 'No recent failed import found' }}</div>
            <div class="summary">
                <span>Total rows: {{ $totalRows }}</span>
                <span>Imported: {{ $importedRows }}</span>
                <span>Failed: {{ $failedRows }}</span>
            </div>
        </div>

        <div class="card">
            @if (empty($errors))
                <div class="empty">No import row errors recorded for your latest import.</div>
            @else
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>CSV Row</th>
                            <th>Error</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($errors as $error)
                            <tr>
                                <td>{{ $error['index'] }}</td>
                                <td>{{ $error['row'] ?? '-' }}</td>
                                <td>{{ $error['message'] }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>
    </div>
</body>
</html>
