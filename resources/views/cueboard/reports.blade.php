<section class="view" id="view-reports">
  <div class="page-head">
    <div>
      <h2>Reports</h2>
      <p>Revenue, expenses, profit and item performance.</p>
    </div>
  </div>

  <!-- Row 1: Revenue -->
  <div class="stat-strip" style="margin-bottom:14px;">
    <div class="stat-card"><div class="num" id="rep-rev-day">Rs 0</div><div class="lbl">Daily Revenue</div></div>
    <div class="stat-card"><div class="num" id="rep-rev-week">Rs 0</div><div class="lbl">Weekly Revenue</div></div>
    <div class="stat-card"><div class="num" id="rep-rev-month">Rs 0</div><div class="lbl">Monthly Revenue</div></div>
    <div class="stat-card"><div class="num" id="rep-rev-year">Rs 0</div><div class="lbl">Yearly Revenue</div></div>
  </div>

  <!-- Row 2: Expenses -->
  <div class="stat-strip" style="margin-bottom:14px;">
    <div class="stat-card warn"><div class="num" id="rep-exp-day">Rs 0</div><div class="lbl">Daily Expense</div></div>
    <div class="stat-card warn"><div class="num" id="rep-exp-week">Rs 0</div><div class="lbl">Weekly Expense</div></div>
    <div class="stat-card warn"><div class="num" id="rep-exp-month">Rs 0</div><div class="lbl">Monthly Expense</div></div>
    <div class="stat-card warn"><div class="num" id="rep-exp-year">Rs 0</div><div class="lbl">Yearly Expense</div></div>
  </div>

  <!-- Row 3: Profit -->
  <div class="stat-strip">
    <div class="stat-card"><div class="num" id="rep-profit-day">Rs 0</div><div class="lbl">Daily Profit</div></div>
    <div class="stat-card"><div class="num" id="rep-profit-week">Rs 0</div><div class="lbl">Weekly Profit</div></div>
    <div class="stat-card"><div class="num" id="rep-profit-month">Rs 0</div><div class="lbl">Monthly Profit</div></div>
    <div class="stat-card"><div class="num" id="rep-profit-year">Rs 0</div><div class="lbl">Yearly Profit</div></div>
  </div>

    <!-- Row 4: Arcade -->
  <div class="stat-strip" style="margin-top:14px;">
    <div class="stat-card">
      <div class="num" id="rep-arc-day">Rs 0</div>
      <div class="lbl">Arcade Daily</div>
    </div>
    <div class="stat-card">
      <div class="num" id="rep-arc-week">Rs 0</div>
      <div class="lbl">Arcade Weekly</div>
    </div>
    <div class="stat-card">
      <div class="num" id="rep-arc-month">Rs 0</div>
      <div class="lbl">Arcade Monthly</div>
    </div>
    <div class="stat-card">
      <div class="num" id="rep-arc-year">Rs 0</div>
      <div class="lbl">Arcade Yearly</div>
    </div>
  </div>

  <div class="grid-2" style="margin-top:24px;">
    <div class="panel">
      <h4>Best Selling Items (Top 3)</h4>
      <div id="rep-best-selling"></div>
    </div>
    <div class="panel">
      <h4>Low Selling Items (Bottom 3)</h4>
      <div id="rep-low-selling"></div>
    </div>
  </div>

  <div class="panel" style="margin-top:20px;">
    <h4>Revenue Split (Game vs Snacks)</h4>
    <div id="rep-revenue-split"></div>
  </div>

  <!-- Calendar -->
  <div class="panel" style="margin-top:20px;">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <h4 style="margin:0;">Daily Report Calendar</h4>
      <div style="display:flex; gap:8px; align-items:center;">
        <button class="btn btn-outline btn-sm" onclick="calPrev()">←</button>
        <span id="cal-month-label" style="font-family:'JetBrains Mono'; font-size:13px; min-width:120px; text-align:center;"></span>
        <button class="btn btn-outline btn-sm" onclick="calNext()">→</button>
      </div>
    </div>
    <div id="reports-calendar" class="cal-grid"></div>
    <div id="cal-day-detail" style="margin-top:18px; display:none;"></div>
  </div>
</section>