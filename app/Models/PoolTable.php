<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PoolTable extends Model
{
    protected $fillable = ['name', 'status'];


    public function sessions()
    {
        return $this->hasMany(PoolGameSession::class);
    }

    public function activeSession()
    {
        return $this->hasOne(PoolGameSession::class)->where('status', 'active');
    }
}
