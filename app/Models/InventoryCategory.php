<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryCategory extends Model
{
    protected $fillable = ['name', 'status'];

    public function items()
    {
        return $this->hasMany(Inventory::class, 'category_id');
    }
}
