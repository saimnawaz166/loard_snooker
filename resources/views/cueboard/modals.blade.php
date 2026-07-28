<!-- ================= START GAME MODAL ================= -->
<div class="modal-backdrop" id="setup-modal">
  <div class="modal" style="width:560px;">
    <h3 id="setup-title">Start Frame</h3>
    <div class="sub">Select game type and enter player names.</div>

    <input type="hidden" id="setup-table-id">
    <input type="hidden" id="setup-game-type-id">

    <!-- Game Type Cards -->
    <div class="game-options" id="setup-game-options" style="margin-bottom:18px;">
      <!-- JS se cards aayenge -->
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
      <label>Category</label>
      <select id="ns-category">
        <option value="">-- Select Category --</option>
      </select>
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
  <div class="modal" style="width:560px;">
    <h3 id="order-modal-title">Add Item to <span id="order-player-name">Player</span></h3>
    <div class="sub" id="order-modal-sub">Select a category first.</div>

    <input type="hidden" id="order-player-id">
    <input type="hidden" id="order-session-id">
    <input type="hidden" id="order-item-id">
    <input type="hidden" id="order-category-id">

    <!-- STEP 1: Categories -->
    <div id="order-step-category">
      <div class="item-grid" id="order-category-grid" style="margin-bottom:16px; max-height:280px; overflow-y:auto;">
        <!-- JS se category cards -->
      </div>
    </div>

    <!-- STEP 2: Items of selected category -->
    <div id="order-step-items" style="display:none;">
      <div style="margin-bottom:10px;">
        <button class="btn btn-outline btn-sm" onclick="backToCategories()">← Back to Categories</button>
      </div>
      <div class="item-grid" id="order-item-grid" style="margin-bottom:16px; max-height:240px; overflow-y:auto;">
        <!-- JS se items -->
      </div>
      <div class="field">
        <label>Quantity</label>
        <input type="number" id="order-qty" value="1" min="1">
      </div>
    </div>

    <div class="modal-actions">
      <button class="btn btn-outline" style="flex:1" onclick="closeModal('order-modal')">Cancel</button>
      <button class="btn btn-primary" style="flex:1; display:none;" id="order-add-btn" onclick="saveOrder()">Add</button>
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
    <div class="field">
      <label>Discount on Game Price (%)</label>
      <input type="number" id="end-discount" value="0" min="0" max="100" placeholder="0">
    </div>

    <div class="sub" id="end-discount-preview" style="margin-top:4px; color:var(--brass);">
      <!-- JS se preview -->
    </div>

    <div class="modal-actions">
      <button class="btn btn-outline" style="flex:1" onclick="closeModal('end-game-modal')">Cancel</button>
      <button class="btn btn-danger" style="flex:1" onclick="confirmEndGame()">End Game</button>
    </div>
  </div>
</div>


<!-- ================= BILL DETAILS MODAL ================= -->
<div class="modal-backdrop" id="bill-detail-modal">
  <div class="modal" style="width:520px; max-height:90vh; overflow-y:auto;">
    <h3>Bill Details</h3>
    <div id="bill-detail-content"></div>
    <div class="modal-actions" style="margin-top:16px;">
      <button class="btn btn-outline" style="flex:1" onclick="closeModal('bill-detail-modal')">Close</button>
      <button class="btn btn-primary" style="flex:1" onclick="window.print()">Print</button>
    </div>
  </div>
</div>


<!-- ================= CATEGORY MODAL ================= -->
<div class="modal-backdrop" id="category-modal">
  <div class="modal">
    <h3 id="cat-title">Add Category</h3>
    <div class="sub">Create or edit inventory category.</div>

    <input type="hidden" id="cat-id">

    <div class="field">
      <label>Category Name</label>
      <input type="text" id="cat-name" placeholder="e.g. Drinks">
    </div>

    <div class="field">
      <label>Status</label>
      <select id="cat-status">
        <option value="1">Active</option>
        <option value="0">Inactive</option>
      </select>
    </div>

    <div class="modal-actions">
      <button class="btn btn-outline" style="flex:1" onclick="closeModal('category-modal')">Cancel</button>
      <button class="btn btn-primary" style="flex:1" onclick="saveCategory()">Save</button>
    </div>
  </div>
</div>


<!-- ================= EXPENSE MODAL ================= -->
<div class="modal-backdrop" id="expense-modal">
  <div class="modal">
    <h3 id="exp-title">Add Expense</h3>
    <div class="sub">Record a club expense.</div>

    <input type="hidden" id="exp-id">

    <div class="field">
      <label>Title</label>
      <input type="text" id="exp-name" placeholder="e.g. Electricity Bill">
    </div>

    <div class="field-row">
      <div class="field">
        <label>Amount (Rs)</label>
        <input type="number" id="exp-amount" placeholder="5000" min="1">
      </div>
      <div class="field">
        <label>Date</label>
        <input type="date" id="exp-date">
      </div>
    </div>

    <div class="field">
      <label>Category</label>
      <select id="exp-category">
        <option value="">-- Select --</option>
        <option value="Rent">Rent</option>
        <option value="Utilities">Utilities</option>
        <option value="Maintenance">Maintenance</option>
        <option value="Salaries">Salaries</option>
        <option value="Supplies">Supplies</option>
        <option value="Other">Other</option>
      </select>
    </div>

    <div class="field">
      <label>Description (optional)</label>
      <input type="text" id="exp-desc" placeholder="Optional notes">
    </div>

    <div class="modal-actions">
      <button class="btn btn-outline" style="flex:1" onclick="closeModal('expense-modal')">Cancel</button>
      <button class="btn btn-primary" style="flex:1" onclick="saveExpense()">Save</button>
    </div>
  </div>
</div>