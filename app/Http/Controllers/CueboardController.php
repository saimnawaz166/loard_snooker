<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Inventory;
use App\Models\InventoryCategory;
use App\Models\PoolGameSession;
use App\Models\PoolGameSessionOrder;
use App\Models\PoolGameSessionPlayer;
use App\Models\PoolGameType;
use App\Models\PoolTable;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;


class CueboardController extends Controller
{
    public function index()
    {
        return view('cueboard.dashboard');
    }

    // API for Tables
    public function getTables()
    {
        $tables = PoolTable::all();
        return response()->json($tables);
    }

    // API for Stock
    public function getStock()
    {
        return response()->json(
            Inventory::with('category')->orderBy('item_name')->get()
        );
    }

    public function storeStock(Request $request)
    {
        $validated = $request->validate([
            'item_name'   => 'required|string|max:255',
            'price'       => 'required|integer|min:0',
            'quantity'    => 'required|integer|min:0',
            'description' => 'nullable|string|max:500',
            'category_id' => 'required|exists:inventory_categories,id',
        ]);

        $item = Inventory::create($validated);

        return response()->json($item, 201);
    }

    public function updateStock(Request $request, $id)
    {
        $item = Inventory::findOrFail($id);

        $validated = $request->validate([
            'item_name'   => 'sometimes|string|max:255',
            'price'       => 'sometimes|integer|min:0',
            'quantity'    => 'sometimes|integer|min:0',
            'description' => 'nullable|string|max:500',
            'category_id' => 'nullable|exists:inventory_categories,id',
        ]);

        $item->update($validated);

        return response()->json($item);
    }

    public function deleteStock($id)
    {
        $item = Inventory::findOrFail($id);
        $item->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // API for Active Sessions
    public function getActiveSessions()
    {
        $sessions = PoolGameSession::with(['players', 'gameType', 'table'])
            ->where('status', 'active')
            ->get();
        return response()->json($sessions);
    }
    public function getGameTypes()
    {
        return response()->json(PoolGameType::orderBy('pool_table_id')->get());
    }
    public function storeGameType(Request $request)
    {
        $validated = $request->validate([
            'game_name' => 'required|string|max:255',
            'time'           => 'required|integer|min:1',
            'price'     => 'required|integer|min:0',
            'status'    => 'nullable|boolean',
            'pool_table_id' => 'required|exists:pool_tables,id'
        ]);
        $validated['time'] = gmdate('H:i:s', $validated['time'] * 60); // Convert minutes to H:i:s format


        $validated['status'] = $request->status ?? 1;

        $game = PoolGameType::create($validated);
        return response()->json($game, 201);
    }
    public function updateGameType(Request $request, $id)
    {
        $game = PoolGameType::findOrFail($id);

        $validated = $request->validate([
            'game_name' => 'required|string|max:255',
            'time'           => 'required|integer|min:1',
            'price'     => 'required|integer|min:0',
            'status'    => 'nullable|boolean',
        ]);
        $validated['time'] = gmdate('H:i:s', $validated['time'] * 60); // Convert minutes to H:i:s format

        $game->update($validated);
        return response()->json($game);
    }
    public function deleteGameType($id)
    {
        $game = PoolGameType::findOrFail($id);
        $game->delete();
        return response()->json(['message' => 'Deleted']);
    }


    public function startGame(Request $request)
    {
        $validated = $request->validate([
            'pool_table_id'      => 'required|exists:pool_tables,id',
            'pool_game_type_id'  => 'required|exists:pool_game_types,id',
            'player1_name'       => 'required|string|max:100',
            'player2_name'       => 'required|string|max:100',
        ]);

        // Check if table already has active session
        $existing = PoolGameSession::where('pool_table_id', $validated['pool_table_id'])
            ->where('status', 'active')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'This table already has an active game'], 422);
        }

        $gameType = PoolGameType::findOrFail($validated['pool_game_type_id']);

        DB::beginTransaction();
        try {
            // Create Session
            $session = PoolGameSession::create([
                'pool_table_id'     => $validated['pool_table_id'],
                'pool_game_type_id' => $validated['pool_game_type_id'],
                'start_time'        => Carbon::now(),
                'status'            => 'active',
                'game_price'        => $gameType->price,
            ]);

            // Create 2 Players
            $player1 = PoolGameSessionPlayer::create([
                'pool_game_session_id' => $session->id,
                'player_name'          => $validated['player1_name'],
                'total_amount'         => 0,
            ]);

            $player2 = PoolGameSessionPlayer::create([
                'pool_game_session_id' => $session->id,
                'player_name'          => $validated['player2_name'],
                'total_amount'         => 0,
            ]);

            // Update table status
            PoolTable::where('id', $validated['pool_table_id'])->update(['status' => 1]);

            DB::commit();

            // Load full data
            $session->load(['players', 'gameType', 'table']);

            return response()->json($session, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to start game', 'error' => $e->getMessage()], 500);
        }
    }

    // ================= GET ACTIVE SESSION BY TABLE =================
    public function getActiveSession($tableId)
    {
        $session = PoolGameSession::with(['players.orders.inventory', 'gameType', 'table'])
            ->where('pool_table_id', $tableId)
            ->where('status', 'active')
            ->first();

        if (!$session) {
            return response()->json(['message' => 'No active session'], 404);
        }

        return response()->json($session);
    }

    // ================= ADD ORDER (Stock item to a player) =================
    public function addOrder(Request $request)
    {
        $validated = $request->validate([
            'session_id'   => 'required|exists:pool_game_sessions,id',
            'player_id'    => 'required|exists:pool_game_session_players,id',
            'inventory_id' => 'required|exists:inventories,id',
            'quantity'     => 'required|integer|min:1',
        ]);

        $inventory = Inventory::findOrFail($validated['inventory_id']);

        if ($inventory->quantity < $validated['quantity']) {
            return response()->json(['message' => 'Not enough stock'], 422);
        }

        DB::beginTransaction();
        try {
            $total = $inventory->price * $validated['quantity'];

            $order = PoolGameSessionOrder::create([
                'pool_game_session_id' => $validated['session_id'],
                'player_id'            => $validated['player_id'],
                'inventory_id'         => $validated['inventory_id'],
                'quantity'             => $validated['quantity'],
                'unit_price'           => $inventory->price,
                'total'                => $total,
            ]);

            // Reduce stock
            $inventory->decrement('quantity', $validated['quantity']);

            // Update player total
            $player = PoolGameSessionPlayer::find($validated['player_id']);
            $player->increment('total_amount', $total);

            DB::commit();

            return response()->json($order, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to add order'], 500);
        }
    }

    // ================= END GAME =================
    public function endGame(Request $request)
    {
        $validated = $request->validate([
            'session_id'        => 'required|exists:pool_game_sessions,id',
            'loser_player_id'   => 'required|exists:pool_game_session_players,id',
            'discount_percent'  => 'nullable|integer|min:0|max:100',
        ]);

        $session = PoolGameSession::with('players')->findOrFail($validated['session_id']);

        if ($session->status !== 'active') {
            return response()->json(['message' => 'Session already completed'], 422);
        }

        $discount = (int) ($validated['discount_percent'] ?? 0);
        $gamePrice = (int) $session->game_price;
        $discountedPrice = (int) round($gamePrice * (100 - $discount) / 100);

        DB::beginTransaction();
        try {
            // Add discounted game price to loser only
            $loser = PoolGameSessionPlayer::find($validated['loser_player_id']);
            $loser->increment('total_amount', $discountedPrice);

            $session->update([
                'end_time'              => Carbon::now(),
                'status'                => 'completed',
                'loser_player_id'       => $validated['loser_player_id'],
                'discount_percent'      => $discount,
                'discounted_game_price' => $discountedPrice,
            ]);

            PoolTable::where('id', $session->pool_table_id)->update(['status' => 0]);

            DB::commit();

            $session->load(['players.orders.inventory', 'gameType', 'table', 'loser']);

            return response()->json($session);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to end game', 'error' => $e->getMessage()], 500);
        }
    }


    // Billing History (with pagination + search)
    public function getBillingHistory(Request $request)
    {
        $query = PoolGameSession::with(['players', 'gameType', 'table', 'loser'])
            ->where('status', 'completed')
            ->orderBy('end_time', 'desc');

        // Search
        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('table', fn($t) => $t->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('players', fn($p) => $p->where('player_name', 'like', "%{$search}%"))
                    ->orWhereHas('gameType', fn($g) => $g->where('game_name', 'like', "%{$search}%"));
            });
        }

        // Filter by payment status
        if ($status = $request->get('payment_status')) {
            $query->where('payment_status', $status);
        }

        $bills = $query->paginate(10);

        return response()->json($bills);
    }

    // Single bill details
    public function getBillDetails($id)
    {
        $session = PoolGameSession::with(['players.orders.inventory', 'gameType', 'table', 'loser'])
            ->findOrFail($id);

        return response()->json($session);
    }

    // Mark as Paid
    public function markAsPaid($id)
    {
        $session = PoolGameSession::findOrFail($id);
        $session->update(['payment_status' => 'paid']);
        return response()->json($session);
    }
    public function markAsUnpaid($id)
    {
        $session = PoolGameSession::findOrFail($id);
        $session->update(['payment_status' => 'unpaid']);
        return response()->json($session);
    }
    public function profile()
    {
        return view('cueboard.profile', [
            'user' => auth()->user()
        ]);
    }
    public function getDashboardStats()
    {
        $today = Carbon::today();

        // Tables Running
        $tablesRunning = PoolTable::where('status', 1)->count();

        // Frames Today (completed sessions today)
        $framesToday = PoolGameSession::where('status', 'completed')
            ->whereDate('end_time', $today)
            ->count();

        // Revenue Today (sum of all player totals from completed sessions today)
        $revenueToday = PoolGameSessionPlayer::whereHas('session', function ($q) use ($today) {
            $q->where('status', 'completed')
                ->whereDate('end_time', $today);
        })
            ->sum('total_amount');

        // Low Stock Items
        $lowStock = Inventory::where('quantity', '<', 10)
            ->orderBy('quantity')
            ->get();

        return response()->json([
            'tables_running' => $tablesRunning,
            'frames_today'   => $framesToday,
            'revenue_today'  => $revenueToday,
            'low_stock_count' => $lowStock->count(),
            'low_stock_items' => $lowStock,
        ]);
    }
    public function getReports(Request $request)
    {
        $now = Carbon::now();
        $today = $now->copy()->startOfDay();
        $weekStart = $now->copy()->startOfWeek();
        $monthStart = $now->copy()->startOfMonth();
        $yearStart = $now->copy()->startOfYear();

        // Helper: player totals from completed sessions in range
        $revenueBetween = function ($from, $to = null) {
            $q = PoolGameSessionPlayer::whereHas('session', function ($s) use ($from, $to) {
                $s->where('status', 'completed')
                    ->where('end_time', '>=', $from);
                if ($to) {
                    $s->where('end_time', '<=', $to);
                }
            });
            return (int) $q->sum('total_amount');
        };

        $expenseBetween = function ($from, $to = null) {
            $q = Expense::where('expense_date', '>=', $from->toDateString());
            if ($to) {
                $q->where('expense_date', '<=', $to->toDateString());
            }
            return (int) $q->sum('amount');
        };

        $revDay   = $revenueBetween($today);
        $revWeek  = $revenueBetween($weekStart);
        $revMonth = $revenueBetween($monthStart);
        $revYear  = $revenueBetween($yearStart);

        $expDay   = $expenseBetween($today);
        $expWeek  = $expenseBetween($weekStart);
        $expMonth = $expenseBetween($monthStart);
        $expYear  = $expenseBetween($yearStart);

        // Best / Low selling items
        $itemSales = PoolGameSessionOrder::select(
            'inventory_id',
            DB::raw('SUM(quantity) as total_sold')
        )
            ->groupBy('inventory_id')
            ->with('inventory')
            ->get()
            ->map(fn($r) => [
                'name' => $r->inventory?->item_name ?? 'Unknown',
                'sold' => (int) $r->total_sold,
            ])
            ->sortByDesc('sold')
            ->values();

        $bestSelling = $itemSales->take(3)->values();
        $lowSelling  = $itemSales->sortBy('sold')->take(3)->values();

        // Revenue split helper (game_price sum vs orders sum) for period
        $splitBetween = function ($from) {
            $game = (int) PoolGameSession::where('status', 'completed')
                ->where('end_time', '>=', $from)
                ->sum(DB::raw('COALESCE(discounted_game_price, game_price)'));

            $snacks = (int) PoolGameSessionOrder::whereHas('session', function ($s) use ($from) {
                $s->where('status', 'completed')->where('end_time', '>=', $from);
            })->sum('total');

            // Fallback if discounted_game_price column missing:
            // $game = (int) PoolGameSession::where(...)->sum('game_price');

            return ['game' => $game, 'snacks' => $snacks];
        };

        // If discounted_game_price may not exist, safer:
        $splitBetween = function ($from) {
            $sessions = PoolGameSession::where('status', 'completed')
                ->where('end_time', '>=', $from)
                ->get();

            $game = $sessions->sum(function ($s) {
                return $s->discounted_game_price ?? $s->game_price ?? 0;
            });

            $snacks = (int) PoolGameSessionOrder::whereIn(
                'pool_game_session_id',
                $sessions->pluck('id')
            )->sum('total');

            return ['game' => (int) $game, 'snacks' => $snacks];
        };

        // Calendar month data (optional query param)
        $calYear  = (int) ($request->get('cal_year') ?: $now->year);
        $calMonth = (int) ($request->get('cal_month') ?: $now->month);
        $calStart = Carbon::create($calYear, $calMonth, 1)->startOfDay();
        $calEnd   = $calStart->copy()->endOfMonth();

        $dailyMap = [];
        // Revenue per day
        $sessions = PoolGameSession::with('players')
            ->where('status', 'completed')
            ->whereBetween('end_time', [$calStart, $calEnd])
            ->get();

        foreach ($sessions as $s) {
            $d = Carbon::parse($s->end_time)->format('Y-m-d');
            $sum = $s->players->sum('total_amount');
            $dailyMap[$d]['revenue'] = ($dailyMap[$d]['revenue'] ?? 0) + $sum;
        }

        $exps = Expense::whereBetween('expense_date', [$calStart->toDateString(), $calEnd->toDateString()])->get();
        foreach ($exps as $e) {
            $d = Carbon::parse($e->expense_date)->format('Y-m-d');
            $dailyMap[$d]['expense'] = ($dailyMap[$d]['expense'] ?? 0) + $e->amount;
        }

        return response()->json([
            'revenue' => [
                'day' => $revDay,
                'week' => $revWeek,
                'month' => $revMonth,
                'year' => $revYear,
            ],
            'expense' => [
                'day' => $expDay,
                'week' => $expWeek,
                'month' => $expMonth,
                'year' => $expYear,
            ],
            'profit' => [
                'day' => $revDay - $expDay,
                'week' => $revWeek - $expWeek,
                'month' => $revMonth - $expMonth,
                'year' => $revYear - $expYear,
            ],
            'best_selling' => $bestSelling,
            'low_selling'  => $lowSelling,
            'split' => [
                'day'   => $splitBetween($today),
                'week'  => $splitBetween($weekStart),
                'month' => $splitBetween($monthStart),
                'year'  => $splitBetween($yearStart),
            ],
            'calendar' => [
                'year'  => $calYear,
                'month' => $calMonth,
                'days'  => $dailyMap,
            ],
        ]);
    }
    public function getReportByDate(Request $request)
    {
        $date = $request->get('date'); // Y-m-d
        if (!$date) {
            return response()->json(['message' => 'Date required'], 422);
        }

        $start = Carbon::parse($date)->startOfDay();
        $end   = Carbon::parse($date)->endOfDay();

        $revenue = (int) PoolGameSessionPlayer::whereHas('session', function ($s) use ($start, $end) {
            $s->where('status', 'completed')->whereBetween('end_time', [$start, $end]);
        })->sum('total_amount');

        $expense = (int) Expense::whereDate('expense_date', $date)->sum('amount');

        $frames = PoolGameSession::where('status', 'completed')
            ->whereBetween('end_time', [$start, $end])
            ->count();

        $items = PoolGameSessionOrder::select('inventory_id', DB::raw('SUM(quantity) as sold'), DB::raw('SUM(total) as amount'))
            ->whereHas('session', fn($s) => $s->where('status', 'completed')->whereBetween('end_time', [$start, $end]))
            ->groupBy('inventory_id')
            ->with('inventory')
            ->get()
            ->map(fn($r) => [
                'name' => $r->inventory?->item_name ?? 'Unknown',
                'sold' => (int) $r->sold,
                'amount' => (int) $r->amount,
            ]);

        $expenseList = Expense::whereDate('expense_date', $date)->get();

        return response()->json([
            'date' => $date,
            'revenue' => $revenue,
            'expense' => $expense,
            'profit' => $revenue - $expense,
            'frames' => $frames,
            'items' => $items,
            'expense_list' => $expenseList,
        ]);
    }

    public function getCategories()
    {
        return response()->json(
            InventoryCategory::orderBy('name')->get()
        );
    }

    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'nullable|boolean',
        ]);

        $validated['status'] = $request->status ?? 1;
        $cat = InventoryCategory::create($validated);

        return response()->json($cat, 201);
    }

    public function updateCategory(Request $request, $id)
    {
        $cat = InventoryCategory::findOrFail($id);

        $validated = $request->validate([
            'name'   => 'required|string|max:255',
            'status' => 'nullable|boolean',
        ]);

        $cat->update($validated);
        return response()->json($cat);
    }

    public function deleteCategory($id)
    {
        $cat = InventoryCategory::findOrFail($id);
        $cat->delete();
        return response()->json(['message' => 'Deleted']);
    }


    public function getExpenses()
    {
        return response()->json(
            Expense::orderBy('expense_date', 'desc')->orderBy('id', 'desc')->get()
        );
    }

    public function storeExpense(Request $request)
    {
        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'amount'       => 'required|integer|min:1',
            'category'     => 'nullable|string|max:100',
            'description'  => 'nullable|string|max:500',
            'expense_date' => 'required|date',
        ]);

        $expense = Expense::create($validated);
        return response()->json($expense, 201);
    }

    public function updateExpense(Request $request, $id)
    {
        $expense = Expense::findOrFail($id);

        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'amount'       => 'required|integer|min:1',
            'category'     => 'nullable|string|max:100',
            'description'  => 'nullable|string|max:500',
            'expense_date' => 'required|date',
        ]);

        $expense->update($validated);
        return response()->json($expense);
    }

    public function deleteExpense($id)
    {
        $expense = Expense::findOrFail($id);
        $expense->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
