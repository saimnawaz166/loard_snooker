<!-- ================= START GAME MODAL ================= -->
<div class="modal-backdrop" id="setup-modal">
  <div class="modal" style="width:560px;">
    <h3 id="setup-title">Start Frame</h3>
    <div class="sub">Select game type and enter player names.</div>

    <input type="hidden" id="setup-table-id">

    <div class="field">
      <label>Game Type</label>
      <select id="setup-game-type">
        <option value="">-- Select Game Type --</option>
      </select>
    </div>

    <div class="field-row">
      <div class="field">
        <label>Player 1 Name</label>
        <input type="text" id="player1-name" placeholder="Player 1">
      </div>
      <div class="field">
        <label>Player 2 Name</label>
        <input type="text" id="player2-name" placeholder="Player 2">
      </div>
    </div>

    <div class="modal-actions">
      <button class="btn btn-outline" style="flex:1" onclick="closeModal('setup-modal')">Cancel</button>
      <button class="btn btn-primary" style="flex:1" onclick="startGame()">Start Timer</button>
    </div>
  </div>
</div>

<!-- ================= ADD STOCK MODAL ================= -->
<div class="modal-backdrop" id="stock-modal">
  <div class="modal">
    <h3>Add Stock Item</h3>
    <div class="sub">Add a new snack or drink to the inventory.</div>

    <div class="field">
      <label>Item Name</label>
      <input type="text" id="ns-name" placeholder="e.g. Chips, Cold Drink">
    </div>

    <div class="field">
      <label>Price (Rs)</label>
      <input type="number" id="ns-price" placeholder="100">
    </div>

    <div class="field">
      <label> Stock</label>
      <input type="number" id="ns-stock" placeholder="30">
    </div>

    <div class="field">
      <label>Description (optional)</label>
      <input type="text" id="ns-desc" placeholder="e.g. Soft Drink">
    </div>

    <div class="modal-actions">
      <button class="btn btn-outline" style="flex:1" onclick="closeModal('stock-modal')">Cancel</button>
      <button class="btn btn-primary" style="flex:1" onclick="addStockItem()">Add Item</button>
    </div>
  </div>
</div>

<!-- ================= GAME TYPE MODAL ================= -->
<div class="modal-backdrop" id="game-type-modal">
  <div class="modal">
    <h3 id="game-type-title">Add Game Type</h3>
    <div class="sub">Set game name, time and price.</div>

    <input type="hidden" id="gt-id">

    <div class="field">
      <label>Select Table</label>
      <select id="gt-table">
        <option value="">-- Select Table --</option>
      </select>
    </div>

    <div class="field">
      <label>Game Name</label>
      <input type="text" id="gt-name" placeholder="e.g. 10 Red Ball">
    </div>

    <div class="field">
      <label>Time (minutes)</label>
      <input type="number" id="gt-time" placeholder="e.g. 30" min="1">
    </div>

    <div class="field">
      <label>Price (Rs)</label>
      <input type="number" id="gt-price" placeholder="300">
    </div>

    <div class="field">
      <label>Status</label>
      <select id="gt-status">
        <option value="1">Active</option>
        <option value="0">Inactive</option>
      </select>
    </div>

    <div class="modal-actions">
      <button class="btn btn-outline" style="flex:1" onclick="closeModal('game-type-modal')">Cancel</button>
      <button class="btn btn-primary" style="flex:1" onclick="saveGameType()">Save</button>
    </div>
  </div>
</div>

<!-- ================= ADD ORDER MODAL ================= -->
<div class="modal-backdrop" id="order-modal">
  <div class="modal">
    <h3>Add Item to <span id="order-player-name">Player</span></h3>
    <div class="sub">Select item and quantity.</div>

    <input type="hidden" id="order-player-id">
    <input type="hidden" id="order-session-id">

    <div class="field">
      <label>Item</label>
      <select id="order-item">
        <option value="">-- Select Item --</option>
      </select>
    </div>

    <div class="field">
      <label>Quantity</label>
      <input type="number" id="order-qty" value="1" min="1">
    </div>

    <div class="modal-actions">
      <button class="btn btn-outline" style="flex:1" onclick="closeModal('order-modal')">Cancel</button>
      <button class="btn btn-primary" style="flex:1" onclick="saveOrder()">Add</button>
    </div>
  </div>
</div>


<!-- ================= END GAME MODAL ================= -->
<div class="modal-backdrop" id="end-game-modal">
  <div class="modal">
    <h3>End Game</h3>
    <div class="sub">Select the player who lost. Game price will be added to their bill.</div>

    <div class="field">
      <label>Who Lost?</label>
      <select id="loser-select">
        <option value="">-- Select Loser --</option>
      </select>
    </div>

    <div class="modal-actions">
      <button class="btn btn-outline" style="flex:1" onclick="closeModal('end-game-modal')">Cancel</button>
      <button class="btn btn-danger" style="flex:1" onclick="confirmEndGame()">End Game</button>
    </div>
  </div>
</div>