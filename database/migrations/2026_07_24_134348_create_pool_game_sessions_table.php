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
        Schema::create('pool_game_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pool_table_id')->constrained('pool_tables')->onDelete('cascade');
            $table->foreignId('pool_game_type_id')->constrained('pool_game_types')->onDelete('cascade');
            $table->timestamp('start_time')->nullable();
            $table->timestamp('end_time')->nullable();
            $table->string('status')->default('active'); // active / completed
            $table->unsignedBigInteger('loser_player_id')->nullable(); // jisko game price lagega
            $table->integer('game_price')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pool_game_sessions');
    }
};
