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
            'game_name'        => 'required|string|max:255',
            'pool_table_id'    => 'required|exists:pool_tables,id',
            'billing_mode'     => 'required|in:fixed,per_minute',
            'time'             => 'nullable|integer|min:1',
            'price'            => 'nullable|integer|min:0',
            'price_per_minute' => 'nullable|integer|min:1',
            'status'           => 'nullable|boolean',
        ]);

        if ($validated['billing_mode'] === 'fixed') {
            if (empty($validated['time']) || !isset($validated['price'])) {
                return response()->json(['message' => 'Time and price required for fixed mode'], 422);
            }
            $validated['time'] = gmdate('H:i:s', (int) $validated['time'] * 60);
            $validated['price_per_minute'] = null;
        } else {
            if (empty($validated['price_per_minute'])) {
                return response()->json(['message' => 'Price per minute required'], 422);
            }
            $validated['time']  = null;
            $validated['price'] = 0;
        }

        $validated['status'] = $request->status ?? 1;

        $game = PoolGameType::create($validated);
        return response()->json($game, 201);
    }
    public function updateGameType(Request $request, $id)
    {
        $game = PoolGameType::findOrFail($id);

        $validated = $request->validate([
            'game_name'        => 'required|string|max:255',
            'pool_table_id'    => 'required|exists:pool_tables,id',
            'billing_mode'     => 'required|in:fixed,per_minute',
            'time'             => 'nullable|integer|min:1',
            'price'            => 'nullable|integer|min:0',
            'price_per_minute' => 'nullable|integer|min:1',
            'status'           => 'nullable|boolean',
        ]);

        if ($validated['billing_mode'] === 'fixed') {
            if (empty($validated['time']) || !isset($validated['price'])) {
                return response()->json(['message' => 'Time and price required for fixed mode'], 422);
            }
            $validated['time'] = gmdate('H:i:s', (int) $validated['time'] * 60);
            $validated['price_per_minute'] = null;
        } else {
            if (empty($validated['price_per_minute'])) {
                return response()->json(['message' => 'Price per minute required'], 422);
            }
            $validated['time']  = null;
            $validated['price'] = 0;
        }

        $validated['status'] = $request->status ?? 1;

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
            'pool_table_id'     => 'required|exists:pool_tables,id',
            'pool_game_type_id' => 'required|exists:pool_game_types,id',
            'player1_name'      => 'required|string|max:100',
            'player2_name'      => 'required|string|max:100',
            'bill_group_id'     => 'nullable|string|max:36',
        ]);

        $existing = PoolGameSession::where('pool_table_id', $validated['pool_table_id'])
            ->where('status', 'active')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'This table already has an active game'], 422);
        }

        $gameType = PoolGameType::findOrFail($validated['pool_game_type_id']);
        // $billGroupId = $validated['bill_group_id'] ?: (string) \Illuminate\Support\Str::uuid();
        $billGroupId = !empty($validated['bill_group_id'])
            ? $validated['bill_group_id']
            : uniqid('bill_', true);


        DB::beginTransaction();
        try {
            $session = PoolGameSession::create([
                'bill_group_id'     => $billGroupId,
                'pool_table_id'     => $validated['pool_table_id'],
                'pool_game_type_id' => $validated['pool_game_type_id'],
                'start_time'        => Carbon::now(),
                'status'            => 'active',
                'game_price'        => $gameType->price,
            ]);

            PoolGameSessionPlayer::create([
                'pool_game_session_id' => $session->id,
                'player_name'          => $validated['player1_name'],
                'total_amount'         => 0,
            ]);

            PoolGameSessionPlayer::create([
                'pool_game_session_id' => $session->id,
                'player_name'          => $validated['player2_name'],
                'total_amount'         => 0,
            ]);

            PoolTable::where('id', $validated['pool_table_id'])->update(['status' => 1]);

            DB::commit();

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
            'session_id'       => 'required|exists:pool_game_sessions,id',
            'loser_player_id'  => 'required|exists:pool_game_session_players,id',
            'discount_amount'  => 'nullable|integer|min:0',
        ]);

        $session = PoolGameSession::with(['players', 'gameType'])->findOrFail($validated['session_id']);

        if ($session->status !== 'active') {
            return response()->json(['message' => 'Session already completed'], 422);
        }

        $gameType = $session->gameType;
        $start = Carbon::parse($session->start_time);
        $elapsedMinutes = max(1, (int) ceil($start->diffInSeconds(now()) / 60));

        if (($gameType->billing_mode ?? 'fixed') === 'per_minute') {
            $rate = (int) ($gameType->price_per_minute ?? 0);
            $gamePrice = $elapsedMinutes * $rate;
        } else {
            $gamePrice = (int) $session->game_price;
        }

        $discAmt = (int) ($validated['discount_amount'] ?? 0);
        $discountedPrice = max(0, $gamePrice - $discAmt);
        $discountPercent = $gamePrice > 0 ? (int) round(($discAmt / $gamePrice) * 100) : 0;

        DB::beginTransaction();
        try {
            $loser = PoolGameSessionPlayer::findOrFail($validated['loser_player_id']);
            $loser->increment('total_amount', $discountedPrice);

            $session->update([
                'end_time'              => now(),
                'status'                => 'completed',
                'loser_player_id'       => $validated['loser_player_id'],
                'game_price'            => $gamePrice,
                'discount_percent'      => $discountPercent,
                'discounted_game_price' => $discountedPrice,
                'payment_status'        => 'unpaid',
                'amount_paid'           => 0,
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
    public function updatePayment(Request $request, $id)
    {
        $validated = $request->validate([
            'payment_status'  => 'required|in:unpaid,pending,paid',
            'amount_paid'     => 'nullable|integer|min:0',
            'payment_method'  => 'nullable|in:cash,easypaisa,jazzcash,bank',
            'payment_note'    => 'nullable|string|max:255',
        ]);

        if ($validated['payment_status'] === 'paid' && empty($validated['payment_method'])) {
            return response()->json(['message' => 'Payment method is required when marking as Paid'], 422);
        }

        $session = PoolGameSession::findOrFail($id);

        $q = PoolGameSession::where('status', 'completed');
        if ($session->bill_group_id) {
            $q->where('bill_group_id', $session->bill_group_id);
        } else {
            $q->where('id', $id);
        }

        $amountPaid = (int) ($validated['amount_paid'] ?? 0);
        $method = $validated['payment_method'] ?? null;
        $note   = $validated['payment_note'] ?? null;

        if ($validated['payment_status'] === 'unpaid') {
            $amountPaid = 0;
            $method = null;
            // $note = null;
        }

        // if ($validated['payment_status'] === 'pending') {
        //     $method = null; // method sirf paid pe
        // }

        $q->update([
            'payment_status'  => $validated['payment_status'],
            'amount_paid'     => $amountPaid,
            'payment_method'  => $method,
            'payment_note'    => $note,
        ]);

        return response()->json(['message' => 'Payment updated']);
    }

    // Billing History (with pagination + search)
    public function getBillingHistory(Request $request)
    {
        $search = $request->get('search');
        $status = $request->get('payment_status');

        $sessions = PoolGameSession::with(['table', 'gameType', 'players'])
            ->where('status', 'completed')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q2) use ($search) {
                    $q2->whereHas('players', fn($p) => $p->where('player_name', 'like', "%{$search}%"))
                        ->orWhereHas('table', fn($t) => $t->where('name', 'like', "%{$search}%"));
                });
            })
            ->orderByDesc('end_time')
            ->get();

        $groups = $sessions->groupBy(fn($s) => $s->bill_group_id ?: ('single_' . $s->id));

        $bills = $groups->map(function ($group, $groupId) {
            $first = $group->sortBy('start_time')->first();
            $last  = $group->sortByDesc('end_time')->first();

            $total = $group->sum(fn($s) => $s->players->sum('total_amount'));

            $statuses = $group->pluck('payment_status')->unique();
            if ($statuses->every(fn($s) => $s === 'paid')) {
                $payStatus = 'paid';
            } elseif ($statuses->contains('pending') || $group->sum('amount_paid') > 0) {
                $payStatus = 'pending';
            } else {
                $payStatus = 'unpaid';
            }

            $amountPaid = (int) $group->max('amount_paid');

            $playerNames = $group->flatMap(fn($s) => $s->players->pluck('player_name'))
                ->unique()
                ->values()
                ->implode(' / ');

            $gameNames = $group->map(fn($s) => $s->gameType?->game_name)
                ->filter()
                ->unique()
                ->values()
                ->implode(', ');

            return [
                'bill_group_id'  => $groupId,
                'session_ids'    => $group->pluck('id')->values(),
                'frames_count'   => $group->count(),
                'table'          => $first->table,
                'game_names'     => $gameNames,
                'players_label'  => $playerNames,
                'total'          => $total,
                'payment_status' => $payStatus,
                'amount_paid'    => $amountPaid,
                'start_time'     => $first->start_time,
                'end_time'       => $last->end_time,
                'id'             => $last->id,
            ];
        })->values();

        if (in_array($status, ['paid', 'unpaid', 'pending'], true)) {
            $bills = $bills->where('payment_status', $status)->values();
        }

        $page = max(1, (int) $request->get('page', 1));
        $perPage = 15;
        $total = $bills->count();
        $slice = $bills->forPage($page, $perPage)->values();

        return response()->json([
            'data'         => $slice,
            'current_page' => $page,
            'last_page'    => max(1, (int) ceil($total / $perPage)),
            'prev_page_url' => $page > 1 ? true : null,
            'next_page_url' => $page * $perPage < $total ? true : null,
        ]);
    }

    // Single bill details
    public function getBillDetails($id)
    {
        $session = PoolGameSession::findOrFail($id);
        $groupId = $session->bill_group_id;

        $sessions = PoolGameSession::with([
            'table',
            'gameType',
            'players.orders.inventory',
        ])
            ->where('status', 'completed')
            ->when($groupId, fn($q) => $q->where('bill_group_id', $groupId))
            ->when(!$groupId, fn($q) => $q->where('id', $id))
            ->orderBy('start_time')
            ->get();

        $allPaid    = $sessions->every(fn($s) => $s->payment_status === 'paid');
        $anyPending = $sessions->contains(fn($s) => $s->payment_status === 'pending');
        $amountPaid = (int) $sessions->max('amount_paid');

        $payStatus = $allPaid
            ? 'paid'
            : (($anyPending || $amountPaid > 0) ? 'pending' : 'unpaid');

        return response()->json([
            'bill_group_id'  => $groupId,
            'payment_status' => $payStatus,
            'amount_paid'    => $amountPaid,
            'sessions'       => $sessions,
            'id'             => $sessions->last()?->id,
            'table'          => $sessions->first()?->table,
            'start_time'     => $sessions->first()?->start_time,
            'end_time'       => $sessions->last()?->end_time,
            'payment_method' => $sessions->first()?->payment_method,
            'payment_note'   => $sessions->first()?->payment_note,
        ]);
    }

    // Mark as Paid
    public function markAsPaid($id)
    {
        $session = PoolGameSession::findOrFail($id);
        $q = PoolGameSession::query()->where('status', 'completed');

        if ($session->bill_group_id) {
            $q->where('bill_group_id', $session->bill_group_id);
        } else {
            $q->where('id', $id);
        }

        $q->update(['payment_status' => 'paid']);
        return response()->json(['message' => 'Paid']);
    }
    public function markAsUnpaid($id)
    {
        $session = PoolGameSession::findOrFail($id);
        $q = PoolGameSession::query()->where('status', 'completed');

        if ($session->bill_group_id) {
            $q->where('bill_group_id', $session->bill_group_id);
        } else {
            $q->where('id', $id);
        }

        $q->update(['payment_status' => 'unpaid']);
        return response()->json(['message' => 'Unpaid']);
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

    // ================= REMOVE ORDER =================
    public function removeOrder($orderId)
    {
        $order = PoolGameSessionOrder::with('session')->findOrFail($orderId);

        if ($order->session?->status !== 'active') {
            return response()->json(['message' => 'Can only remove items from active game'], 422);
        }

        DB::beginTransaction();
        try {
            // Stock wapas
            Inventory::where('id', $order->inventory_id)
                ->increment('quantity', $order->quantity);

            // Player total kam
            PoolGameSessionPlayer::where('id', $order->player_id)
                ->decrement('total_amount', $order->total);

            $order->delete();

            DB::commit();
            return response()->json(['message' => 'Order removed']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to remove order'], 500);
        }
    }

    // ================= CANCEL ACTIVE GAME =================
    public function cancelGame(Request $request)
    {
        $validated = $request->validate([
            'session_id' => 'required|exists:pool_game_sessions,id',
        ]);

        $session = PoolGameSession::with(['players.orders'])->findOrFail($validated['session_id']);

        if ($session->status !== 'active') {
            return response()->json(['message' => 'Only active games can be cancelled'], 422);
        }

        DB::beginTransaction();
        try {
            // Saari orders ka stock wapas
            foreach ($session->players as $player) {
                foreach ($player->orders as $order) {
                    Inventory::where('id', $order->inventory_id)
                        ->increment('quantity', $order->quantity);
                }
            }

            // Orders delete
            PoolGameSessionOrder::where('pool_game_session_id', $session->id)->delete();

            // Players delete
            PoolGameSessionPlayer::where('pool_game_session_id', $session->id)->delete();

            // Table free
            PoolTable::where('id', $session->pool_table_id)->update(['status' => 0]);

            // Session delete
            $session->delete();

            DB::commit();
            return response()->json(['message' => 'Game cancelled']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to cancel game', 'error' => $e->getMessage()], 500);
        }
    }
}
