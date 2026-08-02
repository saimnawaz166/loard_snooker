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
            $table->string('bill_group_id', 36)->nullable()->index()->after('id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pool_game_sessions', function (Blueprint $table) {
            $table->dropColumn('bill_group_id');
        });
    }
};
