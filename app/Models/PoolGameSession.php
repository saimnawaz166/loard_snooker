<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PoolGameSession extends Model
{
   protected $fillable = [
        'pool_table_id',
        'pool_game_type_id',
        'start_time',
        'end_time',
        'status',
        'loser_player_id',
        'game_price',
        'payment_status',
        'discount_percent',
        'discounted_game_price',
        'bill_group_id',
        'amount_paid',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time'   => 'datetime',
    ];

    public function table()
    {
        return $this->belongsTo(PoolTable::class, 'pool_table_id');
    }

    public function gameType()
    {
        return $this->belongsTo(PoolGameType::class, 'pool_game_type_id');
    }

    public function players()
    {
        return $this->hasMany(PoolGameSessionPlayer::class);
    }

    public function orders()
    {
        return $this->hasMany(PoolGameSessionOrder::class);
    }

    public function loser()
    {
        return $this->belongsTo(PoolGameSessionPlayer::class, 'loser_player_id');
    }
}
