<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'description',
        'item_id',
        'metadata',
        'user_id',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
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
     * Create an activity log entry
     */
    public static function log($type, $description, $itemId = null, $metadata = null, $userId = null)
    {
        return self::create([
            'type' => $type,
            'description' => $description,
            'item_id' => $itemId,
            'metadata' => $metadata,
            'user_id' => $userId ?: auth()->id(),
        ]);
    }
}
