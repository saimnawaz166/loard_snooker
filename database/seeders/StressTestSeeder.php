<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Inventory;
use App\Models\PoolGameSession;
use App\Models\PoolGameSessionPlayer;
use App\Models\ShopHistory;
use App\Models\Expense;
// jo models use kar rahe ho

class StressTestSeeder extends Seeder
{
    public function run(): void
    {
        // --- Stock: 500 items ---
        for ($i = 1; $i <= 500; $i++) {
            Inventory::create([
                'item_name'   => "Item $i",
                'price'       => rand(10, 500),
                'quantity'    => rand(0, 200),
                'category_id' => 1, // apni real category id
                'description' => "Test item $i",
            ]);
        }

        // --- Completed sessions / bills: 2000 ---
        for ($i = 1; $i <= 2000; $i++) {
    $sid = DB::table('pool_game_sessions')->insertGetId([
        'pool_table_id'      => 1,
        'pool_game_type_id'  => 1,   // ← sahi column
        'status'             => 'completed',
        'start_time'         => now()->subDays(rand(0, 90)),
        'end_time'           => now()->subDays(rand(0, 90)),
        'game_price'         => 100,
        'payment_status'     => ['paid', 'pending', 'unpaid'][rand(0, 2)],
        'created_at'         => now(),
        'updated_at'         => now(),
    ]);

    DB::table('pool_game_session_players')->insert([
        [
            'pool_game_session_id' => $sid,
            'player_name'   => 'Player A' . $i,
            'total_amount'  => rand(0, 500),
            'payment_status'=> 'unpaid',
            'amount_paid'   => 0,
            'created_at'    => now(),
            'updated_at'    => now(),
        ],
        [
            'pool_game_session_id' => $sid,
            'player_name'   => 'Player B' . $i,
            'total_amount'  => rand(0, 300),
            'payment_status'=> 'unpaid',
            'amount_paid'   => 0,
            'created_at'    => now(),
            'updated_at'    => now(),
        ],
    ]);
}

        // --- Shop history: 1000 ---
        for ($i = 1; $i <= 1000; $i++) {
            ShopHistory::create([
                'customer_name'  => 'Cust '.$i,
                'total'          => rand(50, 2000),
                'items'          => [
                    ['inventory_id' => 1, 'item_name' => 'chips', 'qty' => 2, 'unit_price' => 10, 'total' => 20],
                ],
                'payment_method' => 'cash',
                'sold_at'        => now()->subDays(rand(0, 60)),
            ]);
        }

        // --- Expenses: 500 ---
        for ($i = 1; $i <= 500; $i++) {
            Expense::create([
                'title' => "Expense $i",
                'amount' => rand(100, 5000),
                'expense_date' => now()->subDays(rand(0, 90))->toDateString(),
                // apne columns ke mutabiq
            ]);
        }
    }
}