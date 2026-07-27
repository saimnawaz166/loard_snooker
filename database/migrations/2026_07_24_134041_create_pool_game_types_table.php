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
        Schema::create('pool_game_types', function (Blueprint $table) {
            $table->id();
            $table->integer('pool_table_id')->nullable();
            $table->string('game_name')->nullable();
            $table->time('time')->nullable();
            $table->integer('price')->nullable();
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pool_game_types');
    }
};
