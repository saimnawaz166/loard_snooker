<aside>
  <div class="brand">
    <div class="ball"></div>
    <div>
      <h1>CUE<span>BOARD</span></h1>
      <div class="tag">Club Manager</div>
    </div>
  </div>
  <nav class="side-nav">
    <button class="active" data-view="dashboard"><span class="ico">▦</span> Dashboard</button>
    <button data-view="tables"><span class="ico">●</span> Tables</button>
    <button data-view="billing"><span class="ico">🧾</span> Billing History</button>
    <button data-view="categories"><span class="ico">🏷</span>Stock Categories</button>
    <button data-view="stock"><span class="ico">▤</span> Stock &amp; Inventory <span class="side-badge" id="nav-lowstock">2</span></button>
    
    <button data-view="expenses"><span class="ico">💸</span> Expenses</button>
    <button data-view="reports"><span class="ico">📈</span> Reports</button>
    <button data-view="settings"><span class="ico">⚙</span> Settings</button>
  </nav>
  <div class="sidebar-footer">
  <div class="biz-card">
    <div class="biz-avatar">🎱</div>
    <div>
      <div class="biz-name">{{ Auth::user()->name ?? 'Manager' }}</div>
      <div class="biz-role">{{ Auth::user()->email ?? '' }}</div>
    </div>
  </div>

  <div style="margin-top:12px; display:flex; gap:8px;">
    <button type="button" class="btn btn-outline" style="flex:1; font-size:12px;" 
        onclick="switchView('profile')">
  Profile
</button>

    <form method="POST" action="{{ route('logout') }}" style="flex:1;">
      @csrf
      <button type="submit" class="btn btn-outline" style="width:100%; font-size:12px;">
        Logout
      </button>
    </form>
  </div>
</div>
</aside>