<section class="view" id="view-billing">
  <div class="page-head">
    <div>
      <h2>Billing History</h2>
      <p>Every closed frame and its bill, most recent first.</p>
    </div>
  </div>

  <!-- Filters -->
  <div style="display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap;">
   <input type="text" id="billing-search" placeholder="Search table, player, game..." 
       oninput="loadBilling(1)"
       style="flex:1; min-width:200px; background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px 14px; color:var(--cream);">

<select id="billing-status-filter" onchange="loadBilling(1)"
        style="background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px 14px; color:var(--cream);">
  <option value="">All Status</option>
  <option value="unpaid">Unpaid</option>
  <option value="paid">Paid</option>
</select>
    <button class="btn btn-primary" onclick="loadBilling(1)">Search</button>
  </div>

  <div class="panel" style="padding:0; overflow:hidden;">
    <table class="data-table">
      <thead>
        <tr>
          <th>Table</th>
          <th>Game</th>
          <th>Players</th>
          <th>Total</th>
          <th>Status</th>
          <th>Closed At</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody id="billing-body"></tbody>
    </table>
  </div>

  <!-- Pagination -->
  <div id="billing-pagination" style="display:flex; justify-content:center; gap:8px; margin-top:20px;"></div>
</section>
