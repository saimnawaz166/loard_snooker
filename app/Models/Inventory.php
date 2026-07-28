<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    protected $fillable = ['item_name', 'quantity', 'price', 'description', 'category_id'];

    public function category()
    {
        return $this->belongsTo(InventoryCategory::class, 'category_id');
    }
}
