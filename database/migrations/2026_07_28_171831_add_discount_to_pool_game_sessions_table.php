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
        Schema::table('pool_game_sessions', function (Blueprint $table) {
            $table->integer('discount_percent')->default(0)->after('game_price');
            $table->integer('discounted_game_price')->nullable()->after('discount_percent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pool_game_sessions', function (Blueprint $table) {
            $table->dropColumn(['discount_percent', 'discounted_game_price']);
        });
    }
};
