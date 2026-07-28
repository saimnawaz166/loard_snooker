<section class="view" id="view-categories">
  <div class="page-head">
    <div>
      <h2>Inventory Categories</h2>
      <p>Manage categories for stock items.</p>
    </div>
    <button class="btn btn-primary" onclick="openAddCategory()">+ Add Category</button>
  </div>

  <div class="panel" style="padding:0; overflow:hidden;">
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="categories-body"></tbody>
    </table>
  </div>
</section>