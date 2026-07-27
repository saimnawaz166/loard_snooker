<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pool_game_session_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pool_game_session_id')->constrained('pool_game_sessions')->onDelete('cascade');
            $table->foreignId('player_id')->constrained('pool_game_session_players')->onDelete('cascade');
            $table->foreignId('inventory_id')->constrained('inventories')->onDelete('cascade');
            $table->integer('quantity')->default(1);
            $table->integer('unit_price')->default(0);
            $table->integer('total')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pool_game_session_orders');
    }
};
