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
            if (!Schema::hasColumn('pool_game_sessions', 'amount_paid')) {
                $table->integer('amount_paid')->default(0)->after('payment_status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pool_game_sessions', function (Blueprint $table) {
            $table->dropColumn('amount_paid');
            
        });
    }
};
