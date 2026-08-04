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
            $table->string('payment_method', 30)->nullable()->after('amount_paid');
            $table->string('payment_note', 255)->nullable()->after('payment_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pool_game_sessions', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'payment_note']);
        });
    }
};
