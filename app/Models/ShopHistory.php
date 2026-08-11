<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShopHistory extends Model
{
    protected $fillable = [
        'customer_name', 'total', 'items', 'payment_method', 'sold_at',
    ];

    protected $casts = [
        'items'   => 'array',
        'sold_at' => 'datetime',
    ];
}