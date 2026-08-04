<section class="view" id="view-live">
  <div class="live-header">
    <div class="left">
      <div class="tname-big" id="live-tname">Table 1</div>
      <div class="meta" id="live-meta">Game • Started at</div>
    </div>
    <div class="scoreboard" id="live-timer">00:00:00</div>
  </div>

  <div class="grid-2">
    <!-- Player 1 Bill -->
    <div class="panel">
      <h4 id="player1-title">Player 1</h4>
      <div id="player1-orders" class="order-list"></div>
      <div class="bill-totals">
        <div class="row grand"><span>Total</span><span id="player1-total">Rs 0</span></div>
      </div>
      <button class="btn btn-outline btn-block" style="margin-top:12px;" onclick="openAddOrder(1)">+ Add Item</button>
    </div>

    <!-- Player 2 Bill -->
    <div class="panel">
      <h4 id="player2-title">Player 2</h4>
      <div id="player2-orders" class="order-list"></div>
      <div class="bill-totals">
        <div class="row grand"><span>Total</span><span id="player2-total">Rs 0</span></div>
      </div>
      <button class="btn btn-outline btn-block" style="margin-top:12px;" onclick="openAddOrder(2)">+ Add Item</button>
    </div>
  </div>

  <div style="display:flex; gap:12px; margin-top:24px;">
    <button class="btn btn-outline" style="flex:1" onclick="switchView('tables')">Back to Tables</button>
    <button class="btn btn-outline" style="flex:1" onclick="cancelActiveGame()">Cancel Game</button>
    <button class="btn btn-danger" style="flex:1" onclick="openEndGame()">End & Bill</button>
  </div>
</section>