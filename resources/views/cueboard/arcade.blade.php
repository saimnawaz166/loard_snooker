<section class="view" id="view-arcade">
  <div class="page-head">
    <div>
      <h2>Arcade Tokens</h2>
      <p>Sell token packages and track sales.</p>
    </div>
    <div style="display:flex; gap:8px;">
      <button class="btn btn-outline" onclick="openAddArcadePackage()">+ Package</button>
      <button class="btn btn-primary" onclick="openSellArcade()">Sell Tokens</button>
    </div>
  </div>

  <div class="stat-strip" style="grid-template-columns:1fr 1fr; margin-bottom:20px;">
    <div class="stat-card">
      <div class="num" id="arcade-today-total">Rs 0</div>
      <div class="lbl">Today Sales</div>
    </div>
    <div class="stat-card">
      <div class="num" id="arcade-today-tokens">0</div>
      <div class="lbl">Tokens Sold Today</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="panel">
      <h4>Packages</h4>
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Tokens</th>
            <th>Price</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="arcade-packages-body"></tbody>
      </table>
    </div>

    <div class="panel">
      <h4>Recent Sales</h4>
      <table class="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Package</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Pay</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="arcade-sales-body"></tbody>
      </table>
    </div>
  </div>
</section>