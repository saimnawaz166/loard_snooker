<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArcadePackage extends Model
{
    protected $fillable = ['name', 'tokens', 'price', 'status'];
}
