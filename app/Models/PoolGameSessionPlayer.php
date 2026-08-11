<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PoolGameSessionPlayer extends Model
{
    protected $fillable = [
        'pool_game_session_id',
        'player_name',
        'total_amount',
        'payment_status', 'amount_paid', 'payment_method', 'payment_note',
    ];

    public function session()
    {
        return $this->belongsTo(PoolGameSession::class, 'pool_game_session_id');
    }

    public function orders()
    {
        return $this->hasMany(PoolGameSessionOrder::class, 'player_id');
    }
}