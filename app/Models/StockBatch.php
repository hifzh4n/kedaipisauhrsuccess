<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'batch_number',
        'quantity_received',
        'quantity_remaining',
        'reason',
        'user_id',
        'expiry_date',
        'manufacture_date',
        'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'expiry_date' => 'date',
        'manufacture_date' => 'date',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class, 'item_id', 'item_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get batches for FIFO processing (oldest first)
     */
    public static function getFifoBatches($itemId, $quantityNeeded)
    {
        return self::where('item_id', $itemId)
            ->where('quantity_remaining', '>', 0)
            ->orderBy('created_at', 'asc') // FIFO: First In, First Out
            ->get()
            ->filter(function ($batch) use (&$quantityNeeded) {
                if ($quantityNeeded <= 0) return false;
                $quantityNeeded -= $batch->quantity_remaining;
                return true;
            });
    }
}
