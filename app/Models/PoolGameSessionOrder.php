<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PoolGameSessionOrder extends Model
{
    protected $fillable = [
        'pool_game_session_id',
        'player_id',
        'inventory_id',
        'quantity',
        'unit_price',
        'total',
    ];

    public function session()
    {
        return $this->belongsTo(PoolGameSession::class, 'pool_game_session_id');
    }

    public function player()
    {
        return $this->belongsTo(PoolGameSessionPlayer::class, 'player_id');
    }

    public function inventory()
    {
        return $this->belongsTo(Inventory::class, 'inventory_id');
    }
}