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
        Schema::create('pool_game_session_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pool_game_session_id')->constrained('pool_game_sessions')->onDelete('cascade');
            $table->string('player_name');
            $table->integer('total_amount')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pool_game_session_players');
    }
};
