<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PoolGameType extends Model
{
    protected $fillable = ['pool_table_id', 'game_name', 'time', 'price', 'status'];


    public function sessions()
    {
        return $this->hasMany(PoolGameSession::class);
    }
}
