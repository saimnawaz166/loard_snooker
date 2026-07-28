<section class="view" id="view-expenses">
  <div class="page-head">
    <div>
      <h2>Expenses</h2>
      <p>Track club expenses — rent, utilities, maintenance, etc.</p>
    </div>
    <button class="btn btn-primary" onclick="openAddExpense()">+ Add Expense</button>
  </div>

  <div class="panel" style="padding:0; overflow:hidden;">
    <table class="data-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Title</th>
          <th>Category</th>
          <th>Amount</th>
          <th>Description</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="expenses-body"></tbody>
    </table>
  </div>
</section>