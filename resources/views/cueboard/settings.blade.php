<section class="view" id="view-settings">
  <div class="page-head">
    <div>
      <h2>Settings</h2>
      <p>Configure game types, rates and club details.</p>
    </div>
    <button class="btn btn-primary" onclick="openAddGameType()">+ Add Game Type</button>
  </div>

  <div class="panel" style="padding:0; overflow:hidden;">
    <table class="data-table">
      <thead>
        <tr>
          <th>Table</th>
          <th>Game Name</th>
          <th>Time</th>
          <th>Price</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="settings-rates"></tbody>
    </table>
  </div>
</section>