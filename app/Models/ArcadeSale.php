<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArcadeSale extends Model
{
    protected $fillable = [
        'arcade_package_id', 'package_name', 'tokens', 'qty',
        'unit_price', 'total', 'payment_method', 'note', 'sold_at',
    ];

    protected $casts = [
        'sold_at' => 'datetime',
    ];

    public function package()
    {
        return $this->belongsTo(ArcadePackage::class, 'arcade_package_id');
    }
}
