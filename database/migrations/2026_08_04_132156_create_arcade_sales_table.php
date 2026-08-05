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
        Schema::create('arcade_sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('arcade_package_id')->nullable()->constrained('arcade_packages')->nullOnDelete();
            $table->string('package_name');         // snapshot
            $table->unsignedInteger('tokens');
            $table->unsignedInteger('qty')->default(1); // kitni packages
            $table->unsignedInteger('unit_price');
            $table->unsignedInteger('total');
            $table->string('payment_method', 30)->nullable(); // cash, easypaisa...
            $table->string('note', 255)->nullable();
            $table->timestamp('sold_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('arcade_sales');
    }
};
