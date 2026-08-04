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
        Schema::table('pool_game_types', function (Blueprint $table) {
            $table->string('billing_mode', 20)->default('fixed')->after('price');
            $table->unsignedInteger('price_per_minute')->nullable()->after('billing_mode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pool_game_types', function (Blueprint $table) {
            $table->dropColumn(['billing_mode', 'price_per_minute']);
        });
    }
};
