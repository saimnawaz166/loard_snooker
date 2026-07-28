
    <section class="view" id="view-stock">
      <div class="page-head">
        <div>
            <h2>Stock &amp; Inventory</h2>
            <p>Track snacks and drinks levels across the club.</p>
        </div>
        <button class="btn btn-primary" onclick="openAddStock()">+ Add Item</button>
      </div>

      <div class="panel" style="padding:0; overflow:hidden;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Description</th>
              <th>Price</th>
              <th>In Stock</th>
              <th>Status</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody id="stock-body"></tbody>
        </table>
      </div>
    </section>
