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
        Schema::table('pool_game_session_players', function (Blueprint $table) {
            $table->string('payment_status', 20)->default('unpaid')->after('total_amount');
            $table->unsignedInteger('amount_paid')->default(0)->after('payment_status');
            $table->string('payment_method', 30)->nullable()->after('amount_paid');
            $table->string('payment_note', 255)->nullable()->after('payment_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pool_game_session_players', function (Blueprint $table) {
            $table->dropColumn(['payment_status', 'amount_paid', 'payment_method', 'payment_note']);
        });
    }
};
