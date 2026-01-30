<?php

namespace App\Models;

use App\Services\PhotoService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'sku_id',
        'barcode',
        'item_name',
        'brand',
        'model',
        'color',
        'description',
        'picture',
        'cost_price',
        'retail_price',
        'quantity',
        'status'
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'retail_price' => 'decimal:2',
    ];

    protected $appends = [
        'picture_url'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($item) {
            $item->updateStatus();
        });

        static::updating(function ($item) {
            $item->updateStatus();
        });
    }

    public function updateStatus()
    {
        if ($this->quantity == 0) {
            $this->status = 'out_of_stock';
        } elseif ($this->quantity < 10) {
            $this->status = 'low_stock';
        } else {
            $this->status = 'ready_stock';
        }
    }

    public function getStatusBadgeClass()
    {
        return match($this->status) {
            'out_of_stock' => 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            'low_stock' => 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            'ready_stock' => 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            default => 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
        };
    }

    public function getFormattedCostPrice()
    {
        return 'RM ' . number_format($this->cost_price, 2);
    }

    public function getFormattedRetailPrice()
    {
        return 'RM ' . number_format($this->retail_price, 2);
    }

    /**
     * Get the photo URL accessor
     */
    public function getPictureUrlAttribute()
    {
        if (!$this->picture) {
            return null;
        }

        $photoService = app(PhotoService::class);
        $baseUrl = $photoService->getPhotoUrl($this->picture);
        
        // Add cache busting parameter based on updated_at timestamp
        $timestamp = $this->updated_at ? $this->updated_at->timestamp : time();
        return $baseUrl . '?v=' . $timestamp;
    }

    /**
     * Get the photo URL
     */
    public function getPhotoUrl()
    {
        return $this->picture_url;
    }
}
