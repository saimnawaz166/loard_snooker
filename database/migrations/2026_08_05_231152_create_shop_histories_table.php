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
        Schema::create('shop_histories', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name')->nullable();
            $table->unsignedInteger('total')->default(0);
            $table->json('items'); // [{inventory_id, item_name, qty, unit_price, total}, ...]
            $table->string('payment_method', 30)->nullable(); // cash, easypaisa...
            $table->timestamp('sold_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shop_histories');
    }
};
