<section class="view" id="view-shop">
  <div class="page-head">
    <div>
      <h2>Shop</h2>
      <p>Walk-in sales from inventory.</p>
    </div>
    <button class="btn btn-primary" onclick="openShopModal()">+ Shop Sale</button>
  </div>

  <div class="stat-card" style="max-width:220px; margin-bottom:16px;">
    <div class="num" id="shop-today-total">Rs 0</div>
    <div class="lbl">Today Sales</div>
  </div>

  <div class="panel">
    <table class="data-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Customer</th>
          <th>Items</th>
          <th>Total</th>
          <th>Pay</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="shop-history-body"></tbody>
    </table>
  </div>
</section>