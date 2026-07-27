<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use App\Models\PoolGameSession;
use App\Models\PoolGameSessionOrder;
use App\Models\PoolGameSessionPlayer;
use App\Models\PoolGameType;
use App\Models\PoolTable;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
        return response()->json(Inventory::orderBy('item_name')->get());
    }

    public function storeStock(Request $request)
    {
        $validated = $request->validate([
            'item_name'   => 'required|string|max:255',
            'price'       => 'required|integer|min:0',
            'quantity'    => 'required|integer|min:0',
            'description' => 'nullable|string|max:500',
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
            'session_id'      => 'required|exists:pool_game_sessions,id',
            'loser_player_id' => 'required|exists:pool_game_session_players,id',
        ]);

        $session = PoolGameSession::with('players')->findOrFail($validated['session_id']);

        if ($session->status !== 'active') {
            return response()->json(['message' => 'Session already completed'], 422);
        }

        DB::beginTransaction();
        try {
            // Add game price to loser
            $loser = PoolGameSessionPlayer::find($validated['loser_player_id']);
            $loser->increment('total_amount', $session->game_price);

            // Update session
            $session->update([
                'end_time'        => Carbon::now(),
                'status'          => 'completed',
                'loser_player_id' => $validated['loser_player_id'],
            ]);

            // Free the table
            PoolTable::where('id', $session->pool_table_id)->update(['status' => 0]);

            DB::commit();

            $session->load(['players.orders.inventory', 'gameType', 'table', 'loser']);

            return response()->json($session);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to end game'], 500);
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
}
