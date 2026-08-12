/* ================= SWEET ALERT HELPERS ================= */
function showSuccess(msg) {
  Swal.fire({
    icon: 'success',
    title: 'Success',
    text: msg,
    timer: 1000,
    showConfirmButton: false,
    background: '#1a1f1c',
    color: '#f0ebe0',
    iconColor: '#2f6f3e'
  });
}

function showError(msg) {
  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: msg,
    background: '#1a1f1c',
    color: '#f0ebe0',
    iconColor: '#c1453a',
    confirmButtonColor: '#0f5132'
  });
}

function showConfirm(msg) {
  return Swal.fire({
    title: 'Are you sure?',
    text: msg,
    icon: 'warning',
    showCancelButton: true,
    background: '#1a1f1c',
    color: '#f0ebe0',
    iconColor: '#d4a72c',
    confirmButtonColor: '#0f5132',
    cancelButtonColor: '#c1453a',
    confirmButtonText: 'Yes',
    cancelButtonText: 'Cancel'
  });
}


/* ================= CUEBOARD JS - FULL BACKEND READY ================= */

let tables = [];
let stock = [];
let activeSessions = [];

let activeTableId = null;
let timerInterval = null;

/* HELPERS */
function fmtTime(ms) {
  let s = Math.max(0, Math.floor(ms / 1000));
  let h = String(Math.floor(s / 3600)).padStart(2, '0');
  let m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  let sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

function money(n) {
  return 'Rs ' + Math.round(n || 0).toLocaleString('en-IN');
}

/* API CALLS */
async function loadData() {
  try {
    const [tablesRes, stockRes, sessionsRes] = await Promise.all([
      fetch('/cueboard/api/tables'),
      fetch('/cueboard/api/stock'),
      fetch('/cueboard/api/sessions')
    ]);

    tables = await tablesRes.json();
    stock = await stockRes.json();
    activeSessions = await sessionsRes.json();

    console.log("Data Loaded:", { tables, stock, activeSessions });

    await loadGameTypes();
    await loadCategories();
    await loadExpenses();

    renderDashboard();
    renderTables();
    renderStock();
  } catch (error) {
    console.error("Data loading failed:", error);
  }
}

/* RENDER FUNCTIONS */
async function renderDashboard() {
  try {
    const res = await fetch('/cueboard/api/dashboard-stats');
    const data = await res.json();

    // Stats
    document.getElementById('stat-active').textContent = data.tables_running || 0;
    document.getElementById('stat-games').textContent = data.frames_today || 0;
    document.getElementById('stat-rev').textContent = money(data.revenue_today || 0);
    document.getElementById('stat-low').textContent = data.low_stock_count || 0;

    // Nav badge
    const badge = document.getElementById('nav-lowstock');
    if (badge) badge.textContent = data.low_stock_count || 0;

    // Floor Snapshot (mini tables)
    const miniGrid = document.getElementById('mini-table-grid');
    if (miniGrid) {
      miniGrid.innerHTML = tables.map(t => `
        <div class="table-card ${t.status == 0 ? 'idle' : ''}">
          <div class="felt-top">
            <span class="tname">${t.name}</span>
            <span class="status-dot ${t.status == 1 ? 'live' : 'idle'}">
              <span class="dot"></span>${t.status == 1 ? 'Live' : 'Free'}
            </span>
          </div>
          <div class="body">
            <div class="sub-row"><span>Status</span><b>${t.status == 1 ? 'Running' : 'Available'}</b></div>
          </div>
        </div>
      `).join('');
    }

    // Stock Alerts
    const alertsBox = document.getElementById('dash-stock-alerts');
    if (alertsBox) {
      const items = data.low_stock_items || [];
      if (items.length === 0) {
        alertsBox.innerHTML = `<div style="color:#888; padding:12px;">All stock levels are healthy.</div>`;
      } else {
        alertsBox.innerHTML = items.map(item => `
          <div class="alert-row" style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border);">
            <span><strong>${item.item_name}</strong></span>
            <span class="badge ${item.quantity <= 0 ? 'out' : 'low'}">
              ${item.quantity <= 0 ? 'Out of Stock' : item.quantity + ' left'}
            </span>
          </div>
        `).join('');
      }
    }
  } catch (e) {
    console.error('Dashboard stats failed', e);
  }
}
function renderTables() {
  const grid = document.getElementById('table-grid');
  if (!grid) return;

  grid.innerHTML = tables.map(t => {
    const session = activeSessions.find(s => s.pool_table_id == t.id && s.status === 'active');

    let playersHtml = '';
    let gameInfo = '';
    let timeHtml = '';
    let isTimeOver = false;
    let cardExtraClass = t.status == 0 ? 'idle' : '';

    if (session) {
      const players = session.players || [];
      const playerNames = players.map(p => p.player_name).join(' vs ');
      const gameName = session.game_type?.game_name || 'Game';
      const mode = session.game_type?.billing_mode || 'fixed';
      const start = new Date(session.start_time).getTime();

      playersHtml = `<div class="sub-row"><span>Players</span><b>${playerNames || '—'}</b></div>`;
      gameInfo = `<div class="game-badge">🔴 ${gameName}</div>`;

      if (mode === 'per_minute') {
        const rate = session.game_type?.price_per_minute || 0;
        const elapsedMs = Date.now() - start;
        timeHtml = `
          <div class="timer-display table-timer"
               data-start="${start}"
               data-mode="per_minute"
               data-rate="${rate}"
               style="font-size:20px;">
            ${fmtTime(elapsedMs)}
          </div>
          <div class="sub-row"><span>Rate</span><b>${money(rate)}/min</b></div>
        `;
      } else {
        const gameTimeMin = timeToMinutes(session.game_type?.time) || 0;
        const gameTimeMs = gameTimeMin * 60 * 1000;
        const remainingMs = Math.max(0, gameTimeMs - (Date.now() - start));
        isTimeOver = remainingMs <= 0;
        if (isTimeOver) cardExtraClass += ' time-over';

        timeHtml = `
          <div class="timer-display table-timer"
               data-start="${start}"
               data-limit="${gameTimeMs}"
               data-mode="fixed"
               style="font-size:20px; ${isTimeOver ? 'color:#e8837a;' : ''}">
            ${isTimeOver ? '00:00:00' : fmtTime(remainingMs)}
          </div>
          <div class="sub-row"><span>Limit</span><b>${gameTimeMin} min</b></div>
        `;
      }
    }
    return `
      <div class="table-card ${cardExtraClass}" data-table-id="${t.id}">
        <div class="felt-top">
          <span class="tname">${t.name}</span>
          <span class="status-dot ${t.status == 1 ? 'live' : 'idle'}">
            <span class="dot"></span>${t.status == 1 ? 'In Play' : 'Free'}
          </span>
        </div>
        <div class="body">
          ${gameInfo}
          ${playersHtml}
          ${timeHtml}
          <div style="margin-top:auto; padding-top:10px;">
            ${t.status == 1
        ? `<button class="btn btn-primary btn-block" onclick="openLive(${t.id})">Manage Table</button>`
        : `<button class="btn btn-primary btn-block" onclick="openSetup(${t.id})">Start Frame</button>`}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderStock() {
  const tbody = document.getElementById('stock-body');
  if (!tbody) return;

  if (stock.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:30px; color:#888;">
          No stock items found. Click "+ Add Item" to add.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = stock.map(item => {
    const status = item.quantity <= 0 ? 'out' : (item.quantity < 10 ? 'low' : 'ok');
    const statusText = item.quantity <= 0 ? 'Out of Stock' : (item.quantity < 10 ? 'Low Stock' : 'In Stock');
    const catName = item.category?.name || '—';

    return `
      <tr>
        <td><strong>${item.item_name}</strong></td>
        <td>${catName}</td>
        <td>${item.description || '—'}</td>
        <td>${money(item.price)}</td>
        <td>${item.quantity} units</td>
        <td><span class="badge ${status}">${statusText}</span></td>
        <td>
          <div class="stock-qty-ctrl" style="display:inline-flex; gap:4px; margin-right:8px;">
            <button onclick="adjustStock(${item.id}, -1)">−</button>
            <button onclick="adjustStock(${item.id}, 1)">+1</button>
          </div>
          <button class="btn btn-sm btn-outline" onclick="editStock(${item.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteStock(${item.id})">Delete</button>
        </td>
      </tr>`;
  }).join('');
}
function editStock(id) {
  const item = stock.find(s => s.id === id);
  if (!item) return;

  document.getElementById('ns-name').value = item.item_name;
  document.getElementById('ns-price').value = item.price;
  document.getElementById('ns-stock').value = item.quantity;
  document.getElementById('ns-desc').value = item.description || '';

  let hidden = document.getElementById('ns-id');
  if (!hidden) {
    hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.id = 'ns-id';
    document.getElementById('stock-modal').querySelector('.modal').appendChild(hidden);
  }
  hidden.value = item.id;

  fillCategorySelect(item.category_id);

  const saveBtn = document.querySelector('#stock-modal .btn-primary');
  if (saveBtn) saveBtn.textContent = 'Update Item';

  openModal('stock-modal');
}

async function deleteStock(id) {
  // if (!confirm('Are you sure you want to delete this item?')) return;
  const result = await showConfirm('Are you sure you want to delete this item?');
  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`/cueboard/api/stock/${id}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      }
    });

    if (res.ok) {
      stock = stock.filter(s => s.id !== id);
      renderStock();
      showSuccess('Item deleted successfully')
      // alert('Item deleted successfully');
    } else {
      showError('Failed to delete item');
    }
  } catch (e) {
    console.error(e);
    showError('Error deleting item');
  }
}

async function adjustStock(id, delta) {
  const item = stock.find(s => s.id === id);
  if (!item) return;

  const newQty = Math.max(0, item.quantity + delta);

  try {
    const res = await fetch(`/cueboard/api/stock/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({ quantity: newQty })
    });

    if (res.ok) {
      item.quantity = newQty;
      renderStock();
      // Dashboard low stock count update
      if (document.getElementById('stat-low')) {
        document.getElementById('stat-low').textContent = stock.filter(s => s.quantity < 10).length;
      }
    } else {
      showError('Failed to update stock');
    }
  } catch (e) {
    console.error(e);
    showError('Error updating stock');
  }
}

/* Navigation */
function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  const activeView = document.getElementById('view-' + view);
  if (activeView) activeView.classList.add('active');

  // Nav active pehle
  document.querySelectorAll('nav.side-nav button').forEach(b => b.classList.remove('active'));
  const navBtn = document.querySelector(`nav.side-nav button[data-view="${view}"]`);
  if (navBtn) navBtn.classList.add('active');

  // Breadcrumb
  const breadcrumb = document.getElementById('breadcrumb');
  if (breadcrumb) breadcrumb.textContent = view.charAt(0).toUpperCase() + view.slice(1);

  // Render functions baad mein
  if (view === 'dashboard') renderDashboard();
  if (view === 'tables') renderTables();
  if (view === 'stock') renderStock();
  // if (view === 'billing') loadBilling(1);
  if (view === 'billing') openBillingProtected();
  if (view === 'reports') renderReports();
  if (view === 'settings') renderSettings();
  if (view === 'categories') renderCategories();
  if (view === 'expenses') renderExpenses();

  if (view === 'arcade') loadArcade();
  if (view === 'shop') loadShop();
}

/* INIT */
document.addEventListener('DOMContentLoaded', () => {
  loadData().then(() => {
    debugData();
    // Jo bhi view currently active hai wahi render karo, sirf dashboard nahi
    const activeBtn = document.querySelector('nav.side-nav button.active');
    const currentView = activeBtn ? activeBtn.dataset.view : 'dashboard';
    switchView(currentView);
  });

  // Live countdown for tables tab (every 1 second)
   setInterval(() => {
    document.querySelectorAll('.table-timer').forEach(el => {
      const start = parseInt(el.dataset.start);
      if (!start) return;

      if (el.dataset.mode === 'per_minute') {
        el.textContent = fmtTime(Date.now() - start);
        return;
      }

      const limit = parseInt(el.dataset.limit);
      if (!limit) return;

      const remainingMs = Math.max(0, limit - (Date.now() - start));
      el.textContent = remainingMs <= 0 ? '00:00:00' : fmtTime(remainingMs);

      if (remainingMs <= 0) {
        el.style.color = '#e8837a';
        el.closest('.table-card')?.classList.add('time-over');
      }
    });
  }, 1000);

  document.querySelectorAll('nav.side-nav button[data-view]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(btn.dataset.view);
    });
  });
});

function debugData() {
  console.log("=== DEBUG INFO ===");
  console.log("Tables Array:", tables);
  console.log("Number of Tables:", tables.length);
  console.log("Stock Array:", stock);
}

async function forceRender() {
  await loadData();
  debugData();
  renderDashboard();
  renderTables();
  renderStock();
  console.log("Force Render Done!");
}

/* ================= MODAL HELPERS ================= */
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

function openAddStock() {
  // Safe clear
  const name = document.getElementById('ns-name');
  const price = document.getElementById('ns-price');
  const qty = document.getElementById('ns-stock');
  const desc = document.getElementById('ns-desc');
  const hidden = document.getElementById('ns-id');

  if (name) name.value = '';
  if (price) price.value = '';
  if (qty) qty.value = '';
  if (desc) desc.value = '';
  if (hidden) hidden.value = '';
  fillCategorySelect();

  const saveBtn = document.querySelector('#stock-modal .btn-primary');
  if (saveBtn) saveBtn.textContent = 'Add Item';

  openModal('stock-modal');
}

async function addStockItem() {
  const name = document.getElementById('ns-name').value.trim();
  const price = parseInt(document.getElementById('ns-price').value) || 0;
  const quantity = parseInt(document.getElementById('ns-stock').value) || 0;
  const description = document.getElementById('ns-desc').value.trim();
  const categoryId = document.getElementById('ns-category')?.value || null;
  const id = document.getElementById('ns-id')?.value || null;

  if (!name) {
    showError('Please enter Item Name');
    return;
  }
  if (!categoryId) {
    showError('Please select a Category');
    return;
  }

  const payload = {
    item_name: name,
    price: price,
    quantity: quantity,
    description: description,
    category_id: categoryId || null
  };

  try {
    let res;
    if (id) {
      res = await fetch(`/cueboard/api/stock/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/cueboard/api/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      closeModal('stock-modal');
      await loadData();
      showSuccess(id ? 'Item updated!' : 'Item added!');
    } else {
      showError('Failed to save item');
    }
  } catch (e) {
    console.error(e);
    showError('Network error');
  }
}

/* ================= GAME TYPES (SETTINGS) ================= */

let gameTypes = [];

async function loadGameTypes() {
  try {
    const res = await fetch('/cueboard/api/game-types');
    gameTypes = await res.json();
    renderSettings();
  } catch (e) {
    console.error('Failed to load game types', e);
  }
}

function onBillingModeChange() {
  const mode = document.getElementById('gt-billing-mode')?.value || 'fixed';
  const fixed = document.getElementById('gt-fixed-fields');
  const permin = document.getElementById('gt-permin-fields');
  if (fixed) fixed.style.display = mode === 'fixed' ? 'block' : 'none';
  if (permin) permin.style.display = mode === 'per_minute' ? 'block' : 'none';
}

function renderSettings() {
  const tbody = document.getElementById('settings-rates');
  if (!tbody) return;

  if (gameTypes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:30px; color:#888;">
          No game types found. Click "+ Add Game Type"
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = gameTypes.map(g => {
    const table = tables.find(t => t.id == g.pool_table_id);
    const tableName = table ? table.name : '—';
    const priceLabel = g.billing_mode === 'per_minute'
      ? `${money(g.price_per_minute)}/min`
      : money(g.price);
    const timeLabel = g.billing_mode === 'per_minute'
      ? 'Per min'
      : (g.time ? timeToMinutes(g.time) + ' min' : '—');

    return `
      <tr>
        <td><strong>${tableName}</strong></td>
        <td>${g.game_name}</td>
        <td>${timeLabel}</td>
        <td>${priceLabel}</td>
        <td>
          <span class="badge ${g.status == 1 ? 'ok' : 'out'}">
            ${g.status == 1 ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="editGameType(${g.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteGameType(${g.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddGameType() {
  document.getElementById('game-type-title').textContent = 'Add Game Type';
  document.getElementById('gt-id').value = '';
  document.getElementById('gt-name').value = '';
  document.getElementById('gt-time').value = '';
  document.getElementById('gt-price').value = '';
  document.getElementById('gt-price-per-min').value = '';
  document.getElementById('gt-status').value = '1';
  document.getElementById('gt-billing-mode').value = 'fixed';
  onBillingModeChange();

  const tableSelect = document.getElementById('gt-table');
  tableSelect.innerHTML = '<option value="">-- Select Table --</option>';
  tables.forEach(t => {
    tableSelect.innerHTML += `<option value="${t.id}">${t.name}</option>`;
  });

  openModal('game-type-modal');
}

function editGameType(id) {
  const game = gameTypes.find(g => g.id === id);
  if (!game) return;

  document.getElementById('game-type-title').textContent = 'Edit Game Type';
  document.getElementById('gt-id').value = game.id;
  document.getElementById('gt-name').value = game.game_name;
  document.getElementById('gt-time').value = timeToMinutes(game.time) || '';
  document.getElementById('gt-price').value = game.price || '';
  document.getElementById('gt-price-per-min').value = game.price_per_minute || '';
  document.getElementById('gt-status').value = game.status;
  document.getElementById('gt-billing-mode').value = game.billing_mode || 'fixed';
  onBillingModeChange();

  const tableSelect = document.getElementById('gt-table');
  tableSelect.innerHTML = '<option value="">-- Select Table --</option>';
  tables.forEach(t => {
    const selected = t.id == game.pool_table_id ? 'selected' : '';
    tableSelect.innerHTML += `<option value="${t.id}" ${selected}>${t.name}</option>`;
  });

  openModal('game-type-modal');
}

async function saveGameType() {
  const id = document.getElementById('gt-id').value;
  const name = document.getElementById('gt-name').value.trim();
  const status = document.getElementById('gt-status').value;
  const tableId = document.getElementById('gt-table').value;
  const mode = document.getElementById('gt-billing-mode').value;

  if (!name) {
    showError('Please enter Game Name');
    return;
  }
  if (!tableId) {
    showError('Please select a Table');
    return;
  }

  const payload = {
    game_name: name,
    pool_table_id: tableId,
    billing_mode: mode,
    status: status,
  };

  if (mode === 'fixed') {
    const time = parseInt(document.getElementById('gt-time').value) || 0;
    const price = parseInt(document.getElementById('gt-price').value) || 0;
    if (time < 1) {
      showError('Enter valid time in minutes');
      return;
    }
    payload.time = time;
    payload.price = price;
  } else {
    const ppm = parseInt(document.getElementById('gt-price-per-min').value) || 0;
    if (ppm < 1) {
      showError('Enter price per minute');
      return;
    }
    payload.price_per_minute = ppm;
  }

  try {
    let res;
    if (id) {
      res = await fetch(`/cueboard/api/game-types/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/cueboard/api/game-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      closeModal('game-type-modal');
      await loadGameTypes();
      showSuccess(id ? 'Game type updated!' : 'Game type added!');
    } else {
      const err = await res.json().catch(() => ({}));
      showError(err.message || 'Failed to save');
    }
  } catch (e) {
    console.error(e);
    showError('Network error');
  }
}

async function deleteGameType(id) {
  const result = await showConfirm('Are you sure you want to delete this game type?');
  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`/cueboard/api/game-types/${id}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      }
    });

    if (res.ok) {
      await loadGameTypes();
      showSuccess('Game type deleted successfully');
    } else {
      showError('Failed to delete game type');
    }
  } catch (e) {
    console.error(e);
    showError('Error deleting game type');
  }
}



/* ================= START GAME ================= */

function openSetup(tableId) {

  const bg = document.getElementById('setup-bill-group-id');
  if (bg) bg.value = '';
  const table = tables.find(t => t.id == tableId);
  if (!table) return;

  document.getElementById('setup-title').textContent = `Start Frame — ${table.name}`;
  document.getElementById('setup-table-id').value = tableId;
  document.getElementById('setup-game-type-id').value = '';
  document.getElementById('player1-name').value = '';
  document.getElementById('player2-name').value = '';

  const container = document.getElementById('setup-game-options');
  container.innerHTML = '';

  const tableGames = gameTypes.filter(g => g.pool_table_id == tableId && g.status == 1);

  // Ball colors for different games (visual only)
  const ballSets = [
    ['#c1453a', '#d4a72c', '#2f6f3e'],
    ['#c1453a', '#c1453a', '#d4a72c'],
    ['#c1453a', '#c1453a', '#c1453a'],
    ['#8b929b', '#8b929b', '#8b929b'],
    ['#3b82f6', '#c1453a', '#d4a72c'],
    ['#10b981', '#c1453a', '#8b929b'],
  ];

  if (tableGames.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#888; padding:20px;">No game types available for this table</div>`;
  } else {
    tableGames.forEach((g, index) => {
      const timeMin = timeToMinutes(g.time) || 0;
      const colors = ballSets[index % ballSets.length];

      const div = document.createElement('div');
      div.className = 'game-opt';
      div.dataset.id = g.id;
      div.innerHTML = `
        <div class="balls">
          ${colors.map(c => `<span class="ball-dot" style="background:${c}"></span>`).join('')}
        </div>
        <div class="gname">${g.game_name}</div>
        <div class="grate">${money(g.price)} • ${timeMin} min</div>
      `;
      div.onclick = () => {
        document.querySelectorAll('#setup-game-options .game-opt').forEach(o => o.classList.remove('selected'));
        div.classList.add('selected');
        document.getElementById('setup-game-type-id').value = g.id;
      };
      container.appendChild(div);
    });
  }

  openModal('setup-modal');
}
async function startGame() {
  const tableId = document.getElementById('setup-table-id').value;
  const gameTypeId = document.getElementById('setup-game-type-id').value;
  const player1 = document.getElementById('player1-name').value.trim();
  const player2 = document.getElementById('player2-name').value.trim();
  const billGroupId = document.getElementById('setup-bill-group-id')?.value || null;

  if (!gameTypeId) { showError('Please select a Game Type'); return; }
  if (!player1 || !player2) { showError('Please enter both player names'); return; }

  try {
    const res = await fetch('/cueboard/api/start-game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({
        pool_table_id: tableId,
        pool_game_type_id: gameTypeId,
        player1_name: player1,
        player2_name: player2,
        bill_group_id: billGroupId || undefined
      })
    });

    if (res.ok) {
      // clear bill group hidden for next normal start
      const bg = document.getElementById('setup-bill-group-id');
      if (bg) bg.value = '';

      closeModal('setup-modal');
      await loadData();
      openLive(tableId);
    } else {
      const err = await res.json();
      showError(err.message || 'Failed to start game');
    }
  } catch (e) {
    console.error(e);
    showError('Network error');
  }
}


/* ================= LIVE VIEW ================= */

let currentSession = null;   // active session data
let currentTableId = null;

async function openLive(tableId) {
  currentTableId = tableId;

  try {
    const res = await fetch(`/cueboard/api/active-session/${tableId}`);
    if (!res.ok) {
      showError('No active session found on this table');
      switchView('tables');
      return;
    }

    currentSession = await res.json();
    renderLiveView();
    switchView('live');

    // Start timer
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateLiveTimer, 1000);

  } catch (e) {
    console.error(e);
    showError('Failed to load session');
  }
}

function renderLiveView() {
  if (!currentSession) return;

  const table = currentSession.table;
  const game = currentSession.game_type;
  const players = currentSession.players;

  document.getElementById('live-tname').textContent = table?.name || 'Table';
  document.getElementById('live-meta').textContent =
    `${game?.game_name || 'Game'} • ${money(currentSession.game_price)} • Started ${new Date(currentSession.start_time).toLocaleTimeString()}`;

  // Player 1
  const p1 = players[0];
  document.getElementById('player1-title').textContent = p1?.player_name || 'Player 1';
  document.getElementById('player1-total').textContent = money(p1?.total_amount || 0);
  renderPlayerOrders(1, p1);

  // Player 2
  const p2 = players[1];
  document.getElementById('player2-title').textContent = p2?.player_name || 'Player 2';
  document.getElementById('player2-total').textContent = money(p2?.total_amount || 0);
  renderPlayerOrders(2, p2);
}

function renderPlayerOrders(playerNum, player) {
  const container = document.getElementById(`player${playerNum}-orders`);
  if (!container || !player) return;

  const orders = player.orders || [];

  if (orders.length === 0) {
    container.innerHTML = `<div class="empty-cart">No items yet</div>`;
    return;
  }

  container.innerHTML = orders.map(o => `
    <div class="order-row" style="display:flex; align-items:center; gap:8px;">
      <span style="flex:1">${o.inventory?.item_name || 'Item'} × ${o.quantity}</span>
      <span style="font-family:'JetBrains Mono'; font-size:12px;">${money(o.total)}</span>
      <button class="btn btn-sm btn-danger" style="padding:2px 8px; font-size:11px;"
        onclick="removeOrder(${o.id})" title="Remove item">✕</button>
    </div>
  `).join('');
}

async function removeOrder(orderId) {
  const result = await showConfirm('Remove this item? Stock will be restored.');
  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`/cueboard/api/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      }
    });

    if (res.ok) {
      showSuccess('Item removed');
      await openLive(currentTableId);
      await loadData(); // stock update
    } else {
      const err = await res.json();
      showError(err.message || 'Failed to remove');
    }
  } catch (e) {
    console.error(e);
    showError('Network error');
  }
}

function updateLiveTimer() {
  if (!currentSession?.start_time) return;
  const start = new Date(currentSession.start_time).getTime();
  document.getElementById('live-timer').textContent = fmtTime(Date.now() - start);
}

/* ================= ADD ORDER ================= */

function openAddOrder(playerNum) {
  if (!currentSession) return;

  const player = currentSession.players[playerNum - 1];
  if (!player) return;

  document.getElementById('order-player-name').textContent = player.player_name;
  document.getElementById('order-player-id').value = player.id;
  document.getElementById('order-session-id').value = currentSession.id;
  document.getElementById('order-item-id').value = '';
  document.getElementById('order-category-id').value = '';
  document.getElementById('order-qty').value = 1;

  // Reset to step 1
  document.getElementById('order-step-category').style.display = 'block';
  document.getElementById('order-step-items').style.display = 'none';
  document.getElementById('order-add-btn').style.display = 'none';
  document.getElementById('order-modal-sub').textContent = 'Select a category first.';

  // Fill categories
  const grid = document.getElementById('order-category-grid');
  grid.innerHTML = '';

  const activeCats = categories.filter(c => c.status == 1);

  if (activeCats.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#888; padding:20px;">No categories found</div>`;
  } else {
    activeCats.forEach(cat => {
      const count = stock.filter(s => s.category_id == cat.id && s.quantity > 0).length;
      const div = document.createElement('div');
      div.className = 'item-btn';
      div.innerHTML = `
        <div class="emoji">🏷</div>
        <div class="iname">${cat.name}</div>
        <div class="iprice">${count} items available</div>
      `;
      div.onclick = () => selectOrderCategory(cat.id, cat.name);
      grid.appendChild(div);
    });
  }

  openModal('order-modal');
}
function selectOrderCategory(catId, catName) {
  document.getElementById('order-category-id').value = catId;
  document.getElementById('order-item-id').value = '';

  // Switch to step 2
  document.getElementById('order-step-category').style.display = 'none';
  document.getElementById('order-step-items').style.display = 'block';
  document.getElementById('order-add-btn').style.display = 'none';
  document.getElementById('order-modal-sub').textContent = `Category: ${catName} — Select an item`;

  const grid = document.getElementById('order-item-grid');
  grid.innerHTML = '';

  const items = stock.filter(s => s.category_id == catId && s.quantity > 0);

  if (items.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#888; padding:20px;">No items in this category</div>`;
    return;
  }

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item-btn';
    div.dataset.id = item.id;
    div.innerHTML = `
      <div class="emoji">🧾</div>
      <div class="iname">${item.item_name}</div>
      <div class="iprice">${money(item.price)} • ${item.quantity} left</div>
    `;
    div.onclick = () => {
      document.querySelectorAll('#order-item-grid .item-btn').forEach(b => b.classList.remove('selected'));
      div.classList.add('selected');
      document.getElementById('order-item-id').value = item.id;
      document.getElementById('order-add-btn').style.display = 'block';
    };
    grid.appendChild(div);
  });
}

function backToCategories() {
  document.getElementById('order-step-category').style.display = 'block';
  document.getElementById('order-step-items').style.display = 'none';
  document.getElementById('order-add-btn').style.display = 'none';
  document.getElementById('order-item-id').value = '';
  document.getElementById('order-category-id').value = '';
  document.getElementById('order-modal-sub').textContent = 'Select a category first.';
}

async function saveOrder() {
  const sessionId = document.getElementById('order-session-id').value;
  const playerId = document.getElementById('order-player-id').value;
  const inventoryId = document.getElementById('order-item-id').value;
  const qty = parseInt(document.getElementById('order-qty').value) || 1;

  if (!inventoryId) {
    showError('Please select an item');
    return;
  }

  try {
    const res = await fetch('/cueboard/api/add-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({
        session_id: sessionId,
        player_id: playerId,
        inventory_id: inventoryId,
        quantity: qty
      })
    });

    if (res.ok) {
      closeModal('order-modal');
      await openLive(currentTableId);
    } else {
      const err = await res.json();
      showError(err.message || 'Failed to add item');
    }
  } catch (e) {
    console.error(e);
    showError('Network error');
  }
}

/* ================= END GAME ================= */

function openEndGame() {
  if (!currentSession) return;

  const select = document.getElementById('loser-select');
  select.innerHTML = '<option value="">-- Select Loser --</option>';
  currentSession.players.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${p.player_name}</option>`;
  });

  // Price info (fixed / per minute)
  const mode = currentSession.game_type?.billing_mode || 'fixed';
  const info = document.getElementById('end-game-price-info');
  if (info) {
    if (mode === 'per_minute') {
      const start = new Date(currentSession.start_time).getTime();
      const mins = Math.max(1, Math.ceil((Date.now() - start) / 60000));
      const rate = currentSession.game_type?.price_per_minute || 0;
      info.textContent = `Played ${mins} min × ${money(rate)} = ${money(mins * rate)}`;
    } else {
      info.textContent = `Fixed price: ${money(currentSession.game_price)}`;
    }
  }

  const discountInput = document.getElementById('end-discount');
  discountInput.value = 0;
  updateDiscountPreview();
  discountInput.oninput = updateDiscountPreview;

  openModal('end-game-modal');
}
function updateDiscountPreview() {
  if (!currentSession) return;
  const discAmt = Math.max(0, parseInt(document.getElementById('end-discount').value) || 0);
  const mode = currentSession.game_type?.billing_mode || 'fixed';
  let gamePrice = currentSession.game_price || 0;

  if (mode === 'per_minute') {
    const start = new Date(currentSession.start_time).getTime();
    const mins = Math.max(1, Math.ceil((Date.now() - start) / 60000));
    const rate = currentSession.game_type?.price_per_minute || 0;
    gamePrice = mins * rate;
  }

  const finalPrice = Math.max(0, gamePrice - discAmt);
  const el = document.getElementById('end-discount-preview');
  if (el) {
    el.textContent = discAmt > 0
      ? `Game price: ${money(gamePrice)} → After discount: ${money(finalPrice)}`
      : `Game price: ${money(gamePrice)} (no discount)`;
  }
}


async function confirmEndGame(startNewFrame = false) {
  const loserId = document.getElementById('loser-select').value;
  const discAmt = Math.max(0, parseInt(document.getElementById('end-discount').value) || 0);

  if (!loserId) {
    showError('Please select who lost');
    return;
  }

  const savedPlayers = (currentSession?.players || []).map(p => p.player_name);
  const savedBillGroup = currentSession?.bill_group_id || null;

  try {
    const res = await fetch('/cueboard/api/end-game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({
        session_id: currentSession.id,
        loser_player_id: loserId,
        discount_amount: discAmt
      })
    });

    if (!res.ok) {
      const err = await res.json();
      showError(err.message || 'Failed to end game');
      return;
    }

    const finalSession = await res.json();
    closeModal('end-game-modal');
    if (timerInterval) clearInterval(timerInterval);

    await loadData();

    if (startNewFrame) {
      openSetupForNewFrame(savedPlayers, savedBillGroup || finalSession.bill_group_id);
    } else {
      switchView('tables');
      await viewBill(finalSession.id);
    }
  } catch (e) {
    console.error(e);
    showError('Network error');
  }
}

function openSetupForNewFrame(playerNames = [], billGroupId = null) {
  // Hidden bill group
  let bg = document.getElementById('setup-bill-group-id');
  if (!bg) {
    bg = document.createElement('input');
    bg.type = 'hidden';
    bg.id = 'setup-bill-group-id';
    document.getElementById('setup-modal')?.querySelector('.modal')?.appendChild(bg);
  }
  bg.value = billGroupId || '';

  document.getElementById('setup-title').textContent = 'New Frame — Same Bill';
  document.getElementById('setup-table-id').value = '';
  document.getElementById('setup-game-type-id').value = '';
  document.getElementById('player1-name').value = playerNames[0] || '';
  document.getElementById('player2-name').value = playerNames[1] || '';

  const container = document.getElementById('setup-game-options');
  container.innerHTML = '';

  // Step 1: free tables
  const freeTables = tables.filter(t => t.status == 0);

  if (freeTables.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#888; padding:20px;">No free table available</div>`;
  } else {
    const hint = document.createElement('div');
    hint.style.cssText = 'grid-column:1/-1; font-size:13px; color:var(--text-dim); margin-bottom:8px;';
    hint.textContent = 'Select a table first:';
    container.appendChild(hint);

    freeTables.forEach(t => {
      const div = document.createElement('div');
      div.className = 'game-opt';
      div.innerHTML = `
        <div class="gname">${t.name}</div>
        <div class="grate">Free</div>
      `;
      div.onclick = () => {
        document.getElementById('setup-table-id').value = t.id;
        document.getElementById('setup-title').textContent = `New Frame — ${t.name} (Same Bill)`;
        // Step 2: game types for this table
        showGameTypesForTable(t.id, container);
      };
      container.appendChild(div);
    });
  }

  switchView('tables');
  openModal('setup-modal');
}

function showGameTypesForTable(tableId, container) {
  container.innerHTML = '';

  const back = document.createElement('div');
  back.style.cssText = 'grid-column:1/-1; margin-bottom:8px;';
  back.innerHTML = `<button type="button" class="btn btn-outline btn-sm" id="setup-back-tables">← Change Table</button>`;
  container.appendChild(back);
  document.getElementById('setup-back-tables').onclick = () => {
    const p1 = document.getElementById('player1-name').value;
    const p2 = document.getElementById('player2-name').value;
    const bg = document.getElementById('setup-bill-group-id')?.value || null;
    openSetupForNewFrame([p1, p2], bg);
  };

  const tableGames = gameTypes.filter(g => g.pool_table_id == tableId && g.status == 1);
  const ballSets = [
    ['#c1453a', '#d4a72c', '#2f6f3e'],
    ['#c1453a', '#c1453a', '#d4a72c'],
    ['#c1453a', '#c1453a', '#c1453a'],
    ['#8b929b', '#8b929b', '#8b929b'],
  ];

  if (tableGames.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'grid-column:1/-1; text-align:center; color:#888; padding:20px;';
    empty.textContent = 'No game types for this table';
    container.appendChild(empty);
    return;
  }

  tableGames.forEach((g, index) => {
    const mode = g.billing_mode || 'fixed';
    const label = mode === 'per_minute'
      ? `${money(g.price_per_minute)}/min`
      : `${money(g.price)} • ${timeToMinutes(g.time) || 0} min`;

    const colors = ballSets[index % ballSets.length];
    const div = document.createElement('div');
    div.className = 'game-opt';
    div.dataset.id = g.id;
    div.innerHTML = `
      <div class="balls">${colors.map(c => `<span class="ball-dot" style="background:${c}"></span>`).join('')}</div>
      <div class="gname">${g.game_name}</div>
      <div class="grate">${label}</div>
    `;
    div.onclick = () => {
      document.querySelectorAll('#setup-game-options .game-opt').forEach(o => o.classList.remove('selected'));
      div.classList.add('selected');
      document.getElementById('setup-game-type-id').value = g.id;
    };
    container.appendChild(div);
  });
}
function timeToMinutes(timeStr) {
  if (!timeStr) return '';
  // Agar already number hai
  if (!isNaN(timeStr)) return timeStr;

  // "00:30:00" → 30
  const parts = String(timeStr).split(':');
  if (parts.length >= 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return '';
}
/* ================= BILLING HISTORY ================= */

let billingPage = 1;

async function loadBilling(page = 1) {
  billingPage = page;
  const search = document.getElementById('billing-search')?.value || '';
  const status = document.getElementById('billing-status-filter')?.value || '';

  try {
    const params = new URLSearchParams({
      page: page,
      search: search,
      payment_status: status
    });

    const res = await fetch(`/cueboard/api/billing?${params}`);
    const data = await res.json();

    renderBilling(data);
  } catch (e) {
    console.error(e);
    showError('Failed to load billing history');
  }
}

function renderBilling(data) {
  const tbody = document.getElementById('billing-body');
  const pagination = document.getElementById('billing-pagination');
  if (!tbody) return;

  if (!data || !data.data || data.data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:40px; color:#888;">
          No bills found.
        </td>
      </tr>`;
    if (pagination) pagination.innerHTML = '';
    return;
  }

  const bills = data.data;

  tbody.innerHTML = bills.map(b => {
    const tableName = b.table?.name || '—';
    const gameName = b.game_names || b.game_type?.game_name || '—';
    const players = b.players_label || '—';
    const total = b.total ?? 0;
    const frames = b.frames_count > 1 ? ` (${b.frames_count} frames)` : '';
    const statusBadge = b.payment_status === 'paid'
      ? `<span class="badge ok">Paid</span>`
      : b.payment_status === 'pending'
        ? `<span class="badge low">Pending</span>`
        : `<span class="badge out">Unpaid</span>`;
    const closedAt = b.end_time ? new Date(b.end_time).toLocaleString() : '—';

    return `
      <tr>
        <td><strong>${tableName}</strong>${frames}</td>
        <td>${gameName}</td>
        <td>${players}</td>
        <td><b>${money(total)}</b></td>
        <td>${statusBadge}</td>
        <td>${closedAt}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="viewBill(${b.id})">View</button>
        </td>
      </tr>
    `;
  }).join('');

  if (pagination) {
    let html = '';
    if (data.prev_page_url) {
      html += `<button class="btn btn-outline btn-sm" onclick="loadBilling(${data.current_page - 1})">← Prev</button>`;
    }
    html += `<span style="padding:8px 12px; color:var(--text-dim);">Page ${data.current_page} of ${data.last_page}</span>`;
    if (data.next_page_url) {
      html += `<button class="btn btn-outline btn-sm" onclick="loadBilling(${data.current_page + 1})">Next →</button>`;
    }
    pagination.innerHTML = html;
  }
}

async function viewBill(id) {
  try {
    const res = await fetch(`/cueboard/api/billing/${id}`);
    if (!res.ok) {
      showError('Failed to load bill');
      return;
    }
    const bill = await res.json();
    const sessions = bill.sessions || [bill];
    const tableName = bill.table?.name || sessions[0]?.table?.name || 'Table';
    const billId = bill.id;

    const status = bill.payment_status || 'unpaid';
    const paidAmt = bill.amount_paid ?? 0;
    const statusClass = status === 'paid' ? 'paid' : (status === 'pending' ? 'pending' : 'unpaid');
    const statusLabel = status === 'paid' ? 'PAID' : (status === 'pending' ? 'PENDING' : 'UNPAID');

    const firstStart = sessions[0]?.start_time;
    const lastEnd = sessions[sessions.length - 1]?.end_time;

    let grandTotal = 0;
    const byName = {};

    const framesHtml = sessions.map((session, idx) => {
      const gameName = session.game_type?.game_name || session.gameType?.game_name || 'Game';
      const players = session.players || [];
      let frameTotal = 0;

      const gamePrice = session.game_price || 0;
      const discPrice = session.discounted_game_price ?? gamePrice;
      const discAmt = Math.max(0, gamePrice - discPrice);
      const discPct = session.discount_percent || 0;
      const sid = session.id;

      const playersHtml = players.map(p => {
        frameTotal += (p.total_amount || 0);

        const key = (p.player_name || '').trim() || 'Unknown';
        if (!byName[key]) {
          byName[key] = {
            name: key,
            total: 0,
            amount_paid: 0,
            statuses: [],
            method: p.payment_method || '',
            note: p.payment_note || ''
          };
        }
        byName[key].total += (p.total_amount || 0);
        byName[key].amount_paid += (p.amount_paid || 0);
        byName[key].statuses.push(p.payment_status || 'unpaid');
        if (p.payment_method) byName[key].method = p.payment_method;
        if (p.payment_note) byName[key].note = p.payment_note;

        const orders = p.orders || [];
        const ordersHtml = orders.length
          ? orders.map(o => `
              <div class="bill-line indent">
                <span>${o.inventory?.item_name || 'Item'} × ${o.quantity}</span>
                <span>${money(o.total)}</span>
              </div>`).join('')
          : `<div class="bill-line indent"><span style="color:var(--text-faint)">No snacks / drinks</span><span>—</span></div>`;

        const isLoser = p.id == session.loser_player_id;
        const original = gamePrice;
        const discounted = discPrice;
        const disc = discPct;

        let gameHtml = '';
        if (isLoser) {
          if (disc > 0 || (discounted < original && original > 0)) {
            gameHtml = `
              <div class="bill-line indent"><span>Game price</span><span>${money(original)}</span></div>
              <div class="bill-line indent disc"><span>Discount</span><span>− ${money(original - discounted)}</span></div>
              <div class="bill-line indent"><span>Game (after discount)</span><span>${money(discounted)}</span></div>`;
          } else {
            gameHtml = `<div class="bill-line indent"><span>Game price (lost)</span><span>${money(original)}</span></div>`;
          }
        }

        return `
          <div class="player-block">
            <div class="pname">
              ${p.player_name}
              ${isLoser ? '<span class="lost-tag">LOST</span>' : ''}
            </div>
            ${ordersHtml}
            ${gameHtml}
            <div class="bill-line sub">
              <span>Player total (this frame)</span>
              <span>${money(p.total_amount)}</span>
            </div>
          </div>`;
      }).join('');

      grandTotal += frameTotal;

      const t1 = session.start_time ? new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      const t2 = session.end_time ? new Date(session.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

      const discountEditor = session.loser_player_id ? `
        <div style="margin-top:12px; padding:10px; background:rgba(0,0,0,0.2); border-radius:8px; border:1px dashed var(--border);">
          <div style="font-size:11px; color:var(--text-dim); text-transform:uppercase; margin-bottom:6px;">
            Game discount (this frame)
          </div>
          <div style="font-size:12px; color:var(--text-dim); margin-bottom:8px;">
            Game: <b style="color:var(--cream)">${money(gamePrice)}</b>
            · Discount: <b style="color:#e8837a">${money(discAmt)}</b>${discPct ? ` (${discPct}%)` : ''}
            · After: <b style="color:var(--felt-light)">${money(discPrice)}</b>
          </div>
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <input type="number" id="disc-amt-${sid}" min="0" max="${gamePrice}" value="${discAmt}"
              placeholder="Discount Rs"
              style="width:120px; background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:8px 10px; color:var(--cream);">
            <button type="button" class="btn btn-sm btn-primary"
              onclick="saveFrameDiscount(${billId}, ${sid}, ${gamePrice})">
              Update Discount
            </button>
          </div>
        </div>
      ` : '';

      return `
        <div class="frame-block">
          <div class="frame-label">
            <b>Frame ${idx + 1} — ${gameName}</b>
            <span>${t1}${t2 ? ' → ' + t2 : ''}</span>
          </div>
          ${playersHtml}
          ${discountEditor}
          ${sessions.length > 1 ? `
            <div class="bill-line sub" style="border-top:1px dashed var(--border); margin-top:8px;">
              <span>Frame total</span>
              <span>${money(frameTotal)}</span>
            </div>` : ''}
        </div>`;
    }).join('');

    const uniquePlayers = Object.values(byName).map(p => {
      let st = 'unpaid';
      if (p.total <= 0) st = 'paid';
      else if (p.statuses.every(s => s === 'paid')) st = 'paid';
      else if (p.statuses.some(s => s === 'pending' || s === 'paid') || p.amount_paid > 0) st = 'pending';
      return { ...p, status: st };
    });

    const summaryHtml = uniquePlayers.map((p, i) => {
      const badge = p.status === 'paid' ? 'ok' : (p.status === 'pending' ? 'low' : 'out');
      const safeName = encodeURIComponent(p.name);
      const payBtn = p.total > 0
        ? `<button type="button" class="btn btn-sm btn-outline" onclick="openPlayerPayPanel(${i})">Pay</button>`
        : `<span class="badge ok" style="font-size:10px;">AUTO PAID</span>`;

      return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border); gap:8px; flex-wrap:wrap;">
          <div>
            <strong>${p.name}</strong>
            <span class="badge ${badge}" style="margin-left:6px; font-size:10px;">${p.status.toUpperCase()}</span>
            ${p.amount_paid > 0 && p.status !== 'paid'
              ? `<div style="font-size:11px; color:var(--text-dim); margin-top:2px;">Received ${money(p.amount_paid)} · Balance ${money(Math.max(0, p.total - p.amount_paid))}</div>`
              : ''}
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <b>${money(p.total)}</b>
            ${payBtn}
          </div>
        </div>
        <div id="player-pay-panel-${i}" style="display:none; padding:12px; margin-bottom:8px; background:rgba(0,0,0,0.2); border-radius:8px;">
          <div style="display:flex; gap:6px; margin-bottom:10px;">
            <button type="button" class="btn btn-sm btn-outline" onclick="saveUniquePlayerPay(${billId}, '${safeName}', 'unpaid', ${i})">Unpaid</button>
            <button type="button" class="btn btn-sm btn-outline" onclick="showUniquePayForm(${i}, 'pending')">Pending</button>
            <button type="button" class="btn btn-sm btn-outline" onclick="showUniquePayForm(${i}, 'paid')">Paid</button>
          </div>
          <div id="up-form-pending-${i}" style="display:none;">
            <div class="field" style="margin:0 0 6px;">
              <label>Amount received</label>
              <input type="number" id="up-amt-${i}" value="${p.amount_paid || ''}" min="0" placeholder="e.g. 200">
            </div>
            <div class="field" style="margin:0 0 6px;">
              <label>Paid By</label>
              <div class="pay-method-grid">
                <label class="pay-method-opt"><input type="radio" name="up-method-${i}" value="cash"><span>Cash</span></label>
                <label class="pay-method-opt"><input type="radio" name="up-method-${i}" value="easypaisa"><span>EasyPaisa</span></label>
                <label class="pay-method-opt"><input type="radio" name="up-method-${i}" value="jazzcash"><span>JazzCash</span></label>
                <label class="pay-method-opt"><input type="radio" name="up-method-${i}" value="bank"><span>Bank</span></label>
              </div>
            </div>
            <div class="field" style="margin:0 0 6px;">
              <label>Note</label>
              <input type="text" id="up-note-${i}" value="${(p.note || '').replace(/"/g, '&quot;')}" placeholder="Optional">
            </div>
            <button type="button" class="btn btn-primary btn-sm btn-block"
              onclick="saveUniquePlayerPay(${billId}, '${safeName}', 'pending', ${i})">Save Pending</button>
          </div>
          <div id="up-form-paid-${i}" style="display:none;">
            <div class="field" style="margin:0 0 6px;">
              <label>Paid By *</label>
              <div class="pay-method-grid">
                <label class="pay-method-opt"><input type="radio" name="up-paid-method-${i}" value="cash"><span>Cash</span></label>
                <label class="pay-method-opt"><input type="radio" name="up-paid-method-${i}" value="easypaisa"><span>EasyPaisa</span></label>
                <label class="pay-method-opt"><input type="radio" name="up-paid-method-${i}" value="jazzcash"><span>JazzCash</span></label>
                <label class="pay-method-opt"><input type="radio" name="up-paid-method-${i}" value="bank"><span>Bank</span></label>
              </div>
            </div>
            <div class="field" style="margin:0 0 6px;">
              <label>Note</label>
              <input type="text" id="up-paid-note-${i}" value="${(p.note || '').replace(/"/g, '&quot;')}" placeholder="Optional">
            </div>
            <button type="button" class="btn btn-primary btn-sm btn-block"
              onclick="saveUniquePlayerPay(${billId}, '${safeName}', 'paid', ${i})">Confirm Paid (${money(p.total)})</button>
          </div>
        </div>`;
    }).join('');

    const dateLine = firstStart
      ? new Date(firstStart).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
      : '';

    document.getElementById('bill-detail-content').innerHTML = `
      <div class="bill-sheet">
        <div class="bill-head">
          <h3>${tableName}</h3>
          <div class="bill-meta">
            ${dateLine}<br>
            ${sessions.length} frame${sessions.length > 1 ? 's' : ''}
            ${lastEnd ? ' · Closed ' + new Date(lastEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </div>
          <div class="bill-status ${statusClass}">${statusLabel}</div>
        </div>

        ${framesHtml}

        <div style="margin-top:18px; padding-top:14px; border-top:1px solid var(--border);">
          <div style="font-size:12px; color:var(--text-dim); text-transform:uppercase; margin-bottom:6px;">Players — total & payment</div>
          ${summaryHtml || '<div style="color:#888;">No players</div>'}
        </div>

        <div class="bill-grand">
          <div class="glabel">Grand Total</div>
          <div class="gamt">${money(grandTotal)}</div>
        </div>
        <div style="margin-top:8px; font-size:12px; color:var(--text-dim); text-align:right;">
          Received: <b style="color:var(--brass)">${money(paidAmt)}</b>
          &nbsp;·&nbsp; Balance: <b style="color:#e8837a">${money(Math.max(0, grandTotal - paidAmt))}</b>
        </div>
      </div>`;

    const actions = document.querySelector('#bill-detail-modal .modal-actions');
    if (actions) {
      actions.innerHTML = `
        <div style="width:100%; display:flex; gap:8px;">
          <button type="button" class="btn btn-outline" style="flex:1" onclick="closeModal('bill-detail-modal')">Close</button>
          <button type="button" class="btn btn-primary" style="flex:1" onclick="window.print()">Print</button>
        </div>`;
    }

    openModal('bill-detail-modal');
  } catch (e) {
    console.error(e);
    showError('Failed to load bill details');
  }
}

async function saveFrameDiscount(billId, sessionId, gamePrice) {
  const input = document.getElementById('disc-amt-' + sessionId);
  let amount = Math.max(0, parseInt(input?.value) || 0);
  if (amount > gamePrice) amount = gamePrice;

  try {
    const res = await fetch(`/cueboard/api/billing/${billId}/discount`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        session_id: sessionId,
        discount_amount: amount
      })
    });

    if (res.ok) {
      showSuccess('Discount updated');
      await viewBill(billId);
      if (typeof loadBilling === 'function') {
        loadBilling(typeof billingPage !== 'undefined' ? billingPage : 1);
      }
    } else {
      const err = await res.json().catch(() => ({}));
      showError(err.message || 'Failed to update discount');
    }
  } catch (e) {
    showError('Network error');
  }
}

function openPlayerPayPanel(index) {
  const el = document.getElementById('player-pay-panel-' + index);
  if (!el) return;
  const open = el.style.display === 'block';
  document.querySelectorAll('[id^="player-pay-panel-"]').forEach(p => p.style.display = 'none');
  el.style.display = open ? 'none' : 'block';
}

function showUniquePayForm(index, type) {
  const pend = document.getElementById('up-form-pending-' + index);
  const paid = document.getElementById('up-form-paid-' + index);
  if (pend) pend.style.display = type === 'pending' ? 'block' : 'none';
  if (paid) paid.style.display = type === 'paid' ? 'block' : 'none';
}

async function saveUniquePlayerPay(billId, encodedName, status, index) {
  const playerName = decodeURIComponent(encodedName);
  let amount_paid = 0;
  let payment_method = null;
  let payment_note = null;

  if (status === 'pending') {
    amount_paid = Math.max(0, parseInt(document.getElementById('up-amt-' + index)?.value) || 0);
    payment_method = document.querySelector(`input[name="up-method-${index}"]:checked`)?.value || null;
    payment_note = (document.getElementById('up-note-' + index)?.value || '').trim() || null;
    if (amount_paid <= 0) {
      showError('Enter amount received');
      return;
    }
  } else if (status === 'paid') {
    payment_method = document.querySelector(`input[name="up-paid-method-${index}"]:checked`)?.value;
    payment_note = (document.getElementById('up-paid-note-' + index)?.value || '').trim() || null;
    if (!payment_method) {
      showError('Select payment method');
      return;
    }
  }

  try {
    const res = await fetch(`/cueboard/api/billing/${billId}/player-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({
        player_name: playerName,
        payment_status: status,
        amount_paid,
        payment_method,
        payment_note
      })
    });

    if (res.ok) {
      showSuccess(status === 'paid' ? 'Marked paid' : (status === 'pending' ? 'Pending saved' : 'Marked unpaid'));
      await viewBill(billId);
      if (typeof loadBilling === 'function') loadBilling(typeof billingPage !== 'undefined' ? billingPage : 1);
    } else {
      const err = await res.json().catch(() => ({}));
      showError(err.message || 'Failed');
    }
  } catch (e) {
    showError('Network error');
  }
}

function togglePlayerPanel(playerId, type) {
  const pend = document.getElementById('pp-pending-' + playerId);
  const paid = document.getElementById('pp-paid-' + playerId);
  if (pend) pend.style.display = type === 'pending' ? 'block' : 'none';
  if (paid) paid.style.display = type === 'paid' ? 'block' : 'none';
}

async function setPlayerPayment(playerId, status, billId) {
  try {
    const res = await fetch(`/cueboard/api/billing/player/${playerId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({
        payment_status: status,
        amount_paid: 0,
        payment_method: null,
        payment_note: null
      })
    });
    if (res.ok) {
      showSuccess('Updated');
      await viewBill(billId);
      if (typeof loadBilling === 'function') loadBilling(typeof billingPage !== 'undefined' ? billingPage : 1);
    } else {
      const err = await res.json().catch(() => ({}));
      showError(err.message || 'Failed');
    }
  } catch (e) {
    showError('Network error');
  }
}

async function savePlayerPending(playerId, billId) {
  const amount = Math.max(0, parseInt(document.getElementById('pp-amt-' + playerId)?.value) || 0);
  const method = document.querySelector(`input[name="pp-method-${playerId}"]:checked`)?.value || null;
  const note = (document.getElementById('pp-note-' + playerId)?.value || '').trim();

  if (amount <= 0) {
    showError('Enter amount received');
    return;
  }

  try {
    const res = await fetch(`/cueboard/api/billing/player/${playerId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({
        payment_status: 'pending',
        amount_paid: amount,
        payment_method: method,
        payment_note: note || null
      })
    });
    if (res.ok) {
      showSuccess('Pending saved');
      await viewBill(billId);
      if (typeof loadBilling === 'function') loadBilling(typeof billingPage !== 'undefined' ? billingPage : 1);
    } else {
      const err = await res.json().catch(() => ({}));
      showError(err.message || 'Failed');
    }
  } catch (e) {
    showError('Network error');
  }
}

async function savePlayerPaid(playerId, billId) {
  const method = document.querySelector(`input[name="pp-paid-method-${playerId}"]:checked`)?.value;
  const note = (document.getElementById('pp-paid-note-' + playerId)?.value || '').trim();

  if (!method) {
    showError('Select payment method');
    return;
  }

  try {
    const res = await fetch(`/cueboard/api/billing/player/${playerId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({
        payment_status: 'paid',
        payment_method: method,
        payment_note: note || null
      })
    });
    if (res.ok) {
      showSuccess('Marked paid');
      await viewBill(billId);
      if (typeof loadBilling === 'function') loadBilling(typeof billingPage !== 'undefined' ? billingPage : 1);
    } else {
      const err = await res.json().catch(() => ({}));
      showError(err.message || 'Failed');
    }
  } catch (e) {
    showError('Network error');
  }
}
async function markPaid(id) {
  // if (!confirm('Mark this bill as Paid?')) return;
  const result = await showConfirm('Mark this bill as Paid?');
  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`/cueboard/api/billing/${id}/pay`, {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      }
    });

    if (res.ok) {
      loadBilling(billingPage);
      showSuccess('Marked as Paid');
    } else {
      showError('Failed to update');
    }
  } catch (e) {
    console.error(e);
    showError('Network error');
  }
}

async function markUnpaid(id) {
  // if (!confirm('Mark this bill as Unpaid?')) return;
  const result = await showConfirm('Mark this bill as Unpaid?');
  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`/cueboard/api/billing/${id}/unpay`, {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      }
    });

    if (res.ok) {
      loadBilling(billingPage);
      showSuccess('Marked as Unpaid');
    } else {
      showError('Failed to update');
    }
  } catch (e) {
    console.error(e);
    showError('Network error');
  }
}
/* ================= REPORTS ================= */
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth() + 1; // 1-12
let calDaysData = {};

async function renderReports() {
  try {
    const params = new URLSearchParams({
      cal_year: calYear,
      cal_month: calMonth
    });
    const res = await fetch(`/cueboard/api/reports?${params}`);
    if (!res.ok) return;
    const data = await res.json();

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = money(val || 0);
    };

    set('rep-rev-day', data.revenue?.day);
    set('rep-rev-week', data.revenue?.week);
    set('rep-rev-month', data.revenue?.month);
    set('rep-rev-year', data.revenue?.year);

    set('rep-exp-day', data.expense?.day);
    set('rep-exp-week', data.expense?.week);
    set('rep-exp-month', data.expense?.month);
    set('rep-exp-year', data.expense?.year);

    set('rep-profit-day', data.profit?.day);
    set('rep-profit-week', data.profit?.week);
    set('rep-profit-month', data.profit?.month);
    set('rep-profit-year', data.profit?.year);

    set('rep-arc-day', data.arcade?.day);
    set('rep-arc-week', data.arcade?.week);
    set('rep-arc-month', data.arcade?.month);
    set('rep-arc-year', data.arcade?.year);

    const bestBox = document.getElementById('rep-best-selling');
    if (bestBox) {
      const items = data.best_selling || [];
      bestBox.innerHTML = items.length
        ? items.map(i => `<div class="order-row"><span>${i.name}</span><b>${i.sold} sold</b></div>`).join('')
        : `<div style="color:#888;padding:12px;">No sales yet.</div>`;
    }

    const lowBox = document.getElementById('rep-low-selling');
    if (lowBox) {
      const items = data.low_selling || [];
      lowBox.innerHTML = items.length
        ? items.map(i => `<div class="order-row"><span>${i.name}</span><b>${i.sold} sold</b></div>`).join('')
        : `<div style="color:#888;padding:12px;">No sales yet.</div>`;
    }

    const splitBox = document.getElementById('rep-revenue-split');
    if (splitBox && data.split) {
      const rows = ['day', 'week', 'month', 'year'];
      const labels = { day: 'Daily', week: 'Weekly', month: 'Monthly', year: 'Yearly' };
      splitBox.innerHTML = rows.map(k => {
        const g = data.split[k]?.game || 0;
        const s = data.split[k]?.snacks || 0;
        const a = data.split[k]?.arcade || 0;
        return `
          <div style="margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid var(--border);">
            <div style="font-size:12px; color:var(--brass); margin-bottom:6px; font-weight:600;">${labels[k]}</div>
            <div class="order-row"><span>Table / Game</span><b>${money(g)}</b></div>
            <div class="order-row"><span>Snacks & drinks</span><b>${money(s)}</b></div>
            <div class="order-row"><span>Arcade</span><b>${money(a)}</b></div>
            <div class="order-row"><span>Total</span><b>${money(g + s + a)}</b></div>
          </div>
        `;
      }).join('');
    }

    if (data.calendar) {
      calYear = data.calendar.year;
      calMonth = data.calendar.month;
      calDaysData = data.calendar.days || {};
      renderCalendar();
    }
  } catch (e) {
    console.error('Reports failed', e);
  }
}

function renderCalendar() {
  const box = document.getElementById('reports-calendar');
  const label = document.getElementById('cal-month-label');
  if (!box) return;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (label) label.textContent = `${monthNames[calMonth - 1]} ${calYear}`;

  const first = new Date(calYear, calMonth - 1, 1);
  const startDay = first.getDay(); // 0 Sun
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  let html = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    .map(d => `<div class="cal-head">${d}</div>`).join('');

  for (let i = 0; i < startDay; i++) {
    html += `<div class="cal-day empty"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const info = calDaysData[dateStr] || {};
    const rev = info.revenue || 0;
    const has = rev > 0 || (info.expense || 0) > 0;
    const isToday = dateStr === todayStr;

    html += `
      <div class="cal-day ${has ? 'has-data' : ''} ${isToday ? 'today' : ''}"
           onclick="selectCalDay('${dateStr}', this)">
        <span>${d}</span>
        ${has ? `<span class="cal-amt">${money(rev)}</span>` : ''}
      </div>
    `;
  }

  box.innerHTML = html;
  document.getElementById('cal-day-detail').style.display = 'none';
}

function calPrev() {
  calMonth--;
  if (calMonth < 1) { calMonth = 12; calYear--; }
  renderReports();
}

function calNext() {
  calMonth++;
  if (calMonth > 12) { calMonth = 1; calYear++; }
  renderReports();
}

async function selectCalDay(dateStr, el) {
  document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
  if (el) el.classList.add('selected');

  const detail = document.getElementById('cal-day-detail');
  if (!detail) return;

  try {
    const res = await fetch(`/cueboard/api/reports/day?date=${dateStr}`);
    if (!res.ok) {
      detail.style.display = 'block';
      detail.innerHTML = `<div style="color:#888;">Failed to load day report.</div>`;
      return;
    }
    const data = await res.json();

    const itemsHtml = (data.items || []).length
      ? data.items.map(i => `<div class="order-row"><span>${i.name} × ${i.sold}</span><b>${money(i.amount)}</b></div>`).join('')
      : `<div style="color:#888; font-size:13px;">No item sales</div>`;

    const expHtml = (data.expense_list || []).length
      ? data.expense_list.map(e => `<div class="order-row"><span>${e.title}</span><b>${money(e.amount)}</b></div>`).join('')
      : `<div style="color:#888; font-size:13px;">No expenses</div>`;

    detail.style.display = 'block';
    detail.innerHTML = `
      <div style="border-top:1px solid var(--border); padding-top:16px;">
        <h4 style="margin-bottom:12px;">Report — ${dateStr}</h4>
        <div class="stat-strip" style="grid-template-columns:repeat(5,1fr); margin-bottom:16px;">
          <div class="stat-card"><div class="num" style="font-size:18px;">${money(data.revenue)}</div><div class="lbl">Revenue</div></div>
          <div class="stat-card"><div class="num" style="font-size:18px;">${money(data.arcade || 0)}</div><div class="lbl">Arcade</div></div>
          <div class="stat-card warn"><div class="num" style="font-size:18px;">${money(data.expense)}</div><div class="lbl">Expense</div></div>
          <div class="stat-card"><div class="num" style="font-size:18px;">${money(data.profit)}</div><div class="lbl">Profit</div></div>
          <div class="stat-card"><div class="num" style="font-size:18px;">${data.frames || 0}</div><div class="lbl">Frames</div></div>
        </div>
        <div class="grid-2">
          <div>
            <div style="font-size:12px; color:var(--text-dim); margin-bottom:8px; text-transform:uppercase;">Items sold</div>
            ${itemsHtml}
          </div>
          <div>
            <div style="font-size:12px; color:var(--text-dim); margin-bottom:8px; text-transform:uppercase;">Expenses</div>
            ${expHtml}
          </div>
        </div>
      </div>
    `;
  } catch (e) {
    console.error(e);
  }
}



/* ================= CATEGORIES ================= */
let categories = [];

async function loadCategories() {
  try {
    const res = await fetch('/cueboard/api/categories');
    categories = await res.json();
    renderCategories();
  } catch (e) {
    console.error('Failed to load categories', e);
  }
}

function renderCategories() {
  const tbody = document.getElementById('categories-body');
  if (!tbody) return;

  if (categories.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align:center; padding:30px; color:#888;">
          No categories found. Click "+ Add Category"
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = categories.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>
        <span class="badge ${c.status == 1 ? 'ok' : 'out'}">
          ${c.status == 1 ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editCategory(${c.id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteCategory(${c.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function openAddCategory() {
  document.getElementById('cat-title').textContent = 'Add Category';
  document.getElementById('cat-id').value = '';
  document.getElementById('cat-name').value = '';
  document.getElementById('cat-status').value = '1';
  openModal('category-modal');
}

function editCategory(id) {
  const cat = categories.find(c => c.id === id);
  if (!cat) return;

  document.getElementById('cat-title').textContent = 'Edit Category';
  document.getElementById('cat-id').value = cat.id;
  document.getElementById('cat-name').value = cat.name;
  document.getElementById('cat-status').value = cat.status;
  openModal('category-modal');
}

async function saveCategory() {
  const id = document.getElementById('cat-id').value;
  const name = document.getElementById('cat-name').value.trim();
  const status = document.getElementById('cat-status').value;

  if (!name) {
    showError('Please enter Category Name');
    return;
  }

  const payload = { name, status };

  try {
    let res;
    if (id) {
      res = await fetch(`/cueboard/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/cueboard/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      closeModal('category-modal');
      await loadCategories();
      showSuccess(id ? 'Category updated!' : 'Category added!');
    } else {
      showError('Failed to save category');
    }
  } catch (e) {
    console.error(e);
    showError('Network error');
  }
}

async function deleteCategory(id) {
  const result = await showConfirm('Delete this category?');
  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`/cueboard/api/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      }
    });

    if (res.ok) {
      await loadCategories();
      showSuccess('Category deleted');
    } else {
      showError('Failed to delete');
    }
  } catch (e) {
    console.error(e);
    showError('Error deleting');
  }
}

function fillCategorySelect(selectedId = '') {
  const select = document.getElementById('ns-category');
  if (!select) return;

  select.innerHTML = '<option value="">-- Select Category --</option>';
  categories
    .filter(c => c.status == 1)
    .forEach(c => {
      const sel = c.id == selectedId ? 'selected' : '';
      select.innerHTML += `<option value="${c.id}" ${sel}>${c.name}</option>`;
    });
}



/* ================= EXPENSES ================= */
let expenses = [];

async function loadExpenses() {
  try {
    const res = await fetch('/cueboard/api/expenses');
    expenses = await res.json();
    renderExpenses();
  } catch (e) {
    console.error('Failed to load expenses', e);
  }
}

function renderExpenses() {
  const tbody = document.getElementById('expenses-body');
  if (!tbody) return;

  if (expenses.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:30px; color:#888;">
          No expenses found. Click "+ Add Expense"
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = expenses.map(e => {
    const dateStr = e.expense_date
      ? new Date(e.expense_date).toLocaleDateString()
      : '—';

    return `
      <tr>
        <td>${dateStr}</td>
        <td><strong>${e.title}</strong></td>
        <td>${e.category || '—'}</td>
        <td><b>${money(e.amount)}</b></td>
        <td>${e.description || '—'}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="editExpense(${e.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteExpense(${e.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddExpense() {
  document.getElementById('exp-title').textContent = 'Add Expense';
  document.getElementById('exp-id').value = '';
  document.getElementById('exp-name').value = '';
  document.getElementById('exp-amount').value = '';
  document.getElementById('exp-category').value = '';
  document.getElementById('exp-desc').value = '';
  document.getElementById('exp-date').value = new Date().toISOString().slice(0, 10);
  openModal('expense-modal');
}

function editExpense(id) {
  const e = expenses.find(x => x.id === id);
  if (!e) return;

  document.getElementById('exp-title').textContent = 'Edit Expense';
  document.getElementById('exp-id').value = e.id;
  document.getElementById('exp-name').value = e.title;
  document.getElementById('exp-amount').value = e.amount;
  document.getElementById('exp-category').value = e.category || '';
  document.getElementById('exp-desc').value = e.description || '';
  document.getElementById('exp-date').value = e.expense_date
    ? String(e.expense_date).slice(0, 10)
    : '';

  openModal('expense-modal');
}

async function saveExpense() {
  const id = document.getElementById('exp-id').value;
  const title = document.getElementById('exp-name').value.trim();
  const amount = parseInt(document.getElementById('exp-amount').value) || 0;
  const category = document.getElementById('exp-category').value;
  const description = document.getElementById('exp-desc').value.trim();
  const expense_date = document.getElementById('exp-date').value;

  if (!title) {
    showError('Please enter Title');
    return;
  }
  if (amount < 1) {
    showError('Please enter valid Amount');
    return;
  }
  if (!expense_date) {
    showError('Please select Date');
    return;
  }

  const payload = { title, amount, category, description, expense_date };

  try {
    let res;
    if (id) {
      res = await fetch(`/cueboard/api/expenses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/cueboard/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      closeModal('expense-modal');
      await loadExpenses();
      showSuccess(id ? 'Expense updated!' : 'Expense added!');
    } else {
      showError('Failed to save expense');
    }
  } catch (e) {
    console.error(e);
    showError('Network error');
  }
}

async function deleteExpense(id) {
  const result = await showConfirm('Delete this expense?');
  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`/cueboard/api/expenses/${id}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      }
    });

    if (res.ok) {
      await loadExpenses();
      showSuccess('Expense deleted');
    } else {
      showError('Failed to delete');
    }
  } catch (e) {
    console.error(e);
    showError('Error deleting');
  }
}
function showPaymentPanel(type) {
  const pending = document.getElementById('pending-panel');
  const paid = document.getElementById('paid-panel');
  if (pending) pending.style.display = type === 'pending' ? 'block' : 'none';
  if (paid) paid.style.display = type === 'paid' ? 'block' : 'none';
}

async function setBillPayment(id, status, grandTotal) {
  // Unpaid direct
  if (status === 'unpaid') {
    try {
      const res = await fetch(`/cueboard/api/billing/${id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
        },
        body: JSON.stringify({
          payment_status: 'unpaid',
          amount_paid: 0,
          payment_method: null,
          payment_note: null
        })
      });
      if (res.ok) {
        showSuccess('Marked as Unpaid');
        closeModal('bill-detail-modal');
        if (typeof loadBilling === 'function') loadBilling(typeof billingPage !== 'undefined' ? billingPage : 1);
      } else {
        showError('Failed to update');
      }
    } catch (e) {
      console.error(e);
      showError('Network error');
    }
  }
}

async function savePendingAmount(id, grandTotal) {
  const amount = Math.max(0, parseInt(document.getElementById('bill-amount-paid')?.value) || 0);
  const note = (document.getElementById('bill-payment-note')?.value || '').trim();

  if (amount <= 0) {
    showError('Enter amount received');
    return;
  }

  // Full amount → treat as paid (method still required)
  if (amount >= grandTotal) {
    showPaymentPanel('paid');
    showError('Full amount — select payment method and confirm Paid');
    return;
  }

  try {
    const res = await fetch(`/cueboard/api/billing/${id}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({
        payment_status: 'pending',
        amount_paid: amount,
        payment_note: note || null
      })
    });

    if (res.ok) {
      showSuccess('Pending saved');
      closeModal('bill-detail-modal');
      if (typeof loadBilling === 'function') loadBilling(typeof billingPage !== 'undefined' ? billingPage : 1);
    } else {
      showError('Failed to save');
    }
  } catch (e) {
    console.error(e);
    showError('Network error');
  }
}

async function savePaidAmount(id, grandTotal) {
  const method = document.querySelector('input[name="pay-method"]:checked')?.value;
  const note = (document.getElementById('bill-paid-note')?.value || '').trim();

  if (!method) {
    showError('Please select payment method (Cash / EasyPaisa / JazzCash / Bank)');
    return;
  }

  try {
    const res = await fetch(`/cueboard/api/billing/${id}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({
        payment_status: 'paid',
        amount_paid: grandTotal,
        payment_method: method,
        payment_note: note || null
      })
    });

    if (res.ok) {
      showSuccess('Marked as Paid (' + method + ')');
      closeModal('bill-detail-modal');
      if (typeof loadBilling === 'function') loadBilling(typeof billingPage !== 'undefined' ? billingPage : 1);
    } else {
      const err = await res.json().catch(() => ({}));
      showError(err.message || 'Failed to update');
    }
  } catch (e) {
    console.error(e);
    showError('Network error');
  }
}

async function cancelActiveGame() {
  if (!currentSession) return;

  const result = await showConfirm(
    'Cancel this game? All items will be restored to stock and table will become free. This cannot be undone.'
  );
  if (!result.isConfirmed) return;

  try {
    const res = await fetch('/cueboard/api/cancel-game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({ session_id: currentSession.id })
    });

    if (res.ok) {
      showSuccess('Game cancelled');
      if (timerInterval) clearInterval(timerInterval);
      currentSession = null;
      currentTableId = null;
      await loadData();
      switchView('tables');
    } else {
      const err = await res.json();
      showError(err.message || 'Failed to cancel');
    }
  } catch (e) {
    console.error(e);
    showError('Network error');
  }
}






/* ================= ARCADE ================= */
let arcadePackages = [];
let arcadeSales = [];

async function loadArcade() {
  try {
    const [pkgRes, salesRes] = await Promise.all([
      fetch('/cueboard/api/arcade/packages'),
      fetch('/cueboard/api/arcade/sales')
    ]);
    arcadePackages = await pkgRes.json();
    const data = await salesRes.json();
    arcadeSales = data.sales || [];

    const tEl = document.getElementById('arcade-today-total');
    const tokEl = document.getElementById('arcade-today-tokens');
    if (tEl) tEl.textContent = money(data.today_total || 0);
    if (tokEl) tokEl.textContent = data.today_tokens || 0;

    renderArcadePackages();
    renderArcadeSales();
  } catch (e) {
    console.error('Arcade load failed', e);
  }
}

function renderArcadePackages() {
  const tbody = document.getElementById('arcade-packages-body');
  if (!tbody) return;
  if (!arcadePackages.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#888;padding:20px;">No packages. Add one.</td></tr>`;
    return;
  }
  tbody.innerHTML = arcadePackages.map(p => `
    <tr>
      <td><strong>${p.name}</strong></td>
      <td>${p.tokens}</td>
      <td>${money(p.price)}</td>
      <td><span class="badge ${p.status == 1 ? 'ok' : 'out'}">${p.status == 1 ? 'Active' : 'Inactive'}</span></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editArcadePackage(${p.id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteArcadePackage(${p.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function renderArcadeSales() {
  const tbody = document.getElementById('arcade-sales-body');
  if (!tbody) return;
  if (!arcadeSales.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#888;padding:20px;">No sales yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = arcadeSales.map(s => {
    const t = s.sold_at ? new Date(s.sold_at).toLocaleString() : '—';
    return `
      <tr>
        <td style="font-size:12px;">${t}</td>
        <td>${s.package_name} (${s.tokens}×${s.qty})</td>
        <td>${s.qty}</td>
        <td><b>${money(s.total)}</b></td>
        <td>${s.payment_method || '—'}</td>
        <td><button class="btn btn-sm btn-danger" onclick="deleteArcadeSale(${s.id})">✕</button></td>
      </tr>
    `;
  }).join('');
}

function openAddArcadePackage() {
  document.getElementById('ap-title').textContent = 'Add Package';
  document.getElementById('ap-id').value = '';
  document.getElementById('ap-name').value = '';
  document.getElementById('ap-tokens').value = '5';
  document.getElementById('ap-price').value = '100';
  document.getElementById('ap-status').value = '1';
  openModal('arcade-package-modal');
}

function editArcadePackage(id) {
  const p = arcadePackages.find(x => x.id === id);
  if (!p) return;
  document.getElementById('ap-title').textContent = 'Edit Package';
  document.getElementById('ap-id').value = p.id;
  document.getElementById('ap-name').value = p.name;
  document.getElementById('ap-tokens').value = p.tokens;
  document.getElementById('ap-price').value = p.price;
  document.getElementById('ap-status').value = p.status;
  openModal('arcade-package-modal');
}

async function saveArcadePackage() {
  const id = document.getElementById('ap-id').value;
  const name = document.getElementById('ap-name').value.trim();
  const tokens = parseInt(document.getElementById('ap-tokens').value) || 0;
  const price = parseInt(document.getElementById('ap-price').value) || 0;
  const status = document.getElementById('ap-status').value;

  if (!name || tokens < 1) {
    showError('Enter name and tokens');
    return;
  }

  const payload = { name, tokens, price, status };

  try {
    const res = await fetch(id ? `/cueboard/api/arcade/packages/${id}` : '/cueboard/api/arcade/packages', {
      method: id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeModal('arcade-package-modal');
      await loadArcade();
      showSuccess(id ? 'Package updated' : 'Package added');
    } else {
      showError('Failed to save');
    }
  } catch (e) {
    showError('Network error');
  }
}

async function deleteArcadePackage(id) {
  const result = await showConfirm('Delete this package?');
  if (!result.isConfirmed) return;
  try {
    const res = await fetch(`/cueboard/api/arcade/packages/${id}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '' }
    });
    if (res.ok) {
      await loadArcade();
      showSuccess('Deleted');
    } else showError('Failed');
  } catch (e) { showError('Error'); }
}

function openSellArcade() {
  const sel = document.getElementById('as-package');
  const active = arcadePackages.filter(p => p.status == 1);
  if (!active.length) {
    showError('Add an active package first');
    return;
  }
  sel.innerHTML = active.map(p =>
    `<option value="${p.id}" data-price="${p.price}">${p.name} — ${p.tokens} tokens — ${money(p.price)}</option>`
  ).join('');
  document.getElementById('as-qty').value = 1;
  document.getElementById('as-note').value = '';
  document.querySelector('input[name="as-pay"][value="cash"]').checked = true;
  updateArcadeSellPreview();
  document.getElementById('as-qty').oninput = updateArcadeSellPreview;
  sel.onchange = updateArcadeSellPreview;
  openModal('arcade-sell-modal');
}

function updateArcadeSellPreview() {
  const sel = document.getElementById('as-package');
  const opt = sel?.selectedOptions?.[0];
  const price = parseInt(opt?.dataset?.price) || 0;
  const qty = Math.max(1, parseInt(document.getElementById('as-qty')?.value) || 1);
  const el = document.getElementById('as-total-preview');
  if (el) el.textContent = `Total: ${money(price * qty)}`;
}

async function saveArcadeSale() {
  const packageId = document.getElementById('as-package').value;
  const qty = Math.max(1, parseInt(document.getElementById('as-qty').value) || 1);
  const method = document.querySelector('input[name="as-pay"]:checked')?.value;
  const note = (document.getElementById('as-note').value || '').trim();

  if (!packageId || !method) {
    showError('Select package and payment method');
    return;
  }

  try {
    const res = await fetch('/cueboard/api/arcade/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({
        arcade_package_id: packageId,
        qty,
        payment_method: method,
        note: note || null
      })
    });
    if (res.ok) {
      closeModal('arcade-sell-modal');
      await loadArcade();
      showSuccess('Tokens sold');
    } else {
      const err = await res.json().catch(() => ({}));
      showError(err.message || 'Failed');
    }
  } catch (e) {
    showError('Network error');
  }
}

async function deleteArcadeSale(id) {
  const result = await showConfirm('Delete this sale?');
  if (!result.isConfirmed) return;
  try {
    const res = await fetch(`/cueboard/api/arcade/sales/${id}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '' }
    });
    if (res.ok) {
      await loadArcade();
      showSuccess('Sale deleted');
    } else showError('Failed');
  } catch (e) { showError('Error'); }
}





/* ================= SHOP ================= */
let shopCart = [];
let shopSelectedCat = null; 

async function loadShop() {
  try {
    const res = await fetch('/cueboard/api/shop/history');
    if (!res.ok) return;
    const data = await res.json();

    const tEl = document.getElementById('shop-today-total');
    if (tEl) tEl.textContent = money(data.today_total || 0);

    const tbody = document.getElementById('shop-history-body');
    if (!tbody) return;

    const sales = data.sales || [];
    if (!sales.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#888;padding:24px;">No sales yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = sales.map(s => {
      const t = s.sold_at ? new Date(s.sold_at).toLocaleString() : '—';
      const items = (s.items || []).map(i => `${i.item_name}×${i.qty}`).join(', ');
      return `
        <tr>
          <td style="font-size:12px;">${t}</td>
          <td>${s.customer_name || 'Walk-in'}</td>
          <td style="font-size:12px;">${items || '—'}</td>
          <td><b>${money(s.total)}</b></td>
          <td>${s.payment_method || '—'}</td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="deleteShopSale(${s.id})">Delete</button>
          </td>
        </tr>`;
    }).join('');
  } catch (e) {
    console.error('Shop load failed', e);
  }
}

function openShopModal() {
  shopCart = [];
  shopSelectedCat = null;
  document.getElementById('shop-customer').value = '';
  document.querySelector('input[name="shop-pay"][value="cash"]').checked = true;

  renderShopCategories();
  renderShopItems();
  renderShopCart();
  openModal('shop-modal');
}

function renderShopCategories() {
  const row = document.getElementById('shop-cat-row');
  if (!row) return;

  const cats = (typeof categories !== 'undefined' ? categories : [])
    .filter(c => c.status == 1);

  let html = `
    <button type="button" class="btn btn-sm ${shopSelectedCat === null ? 'btn-primary' : 'btn-outline'}"
      onclick="selectShopCat(null)">All</button>`;

  cats.forEach(c => {
    html += `
      <button type="button" class="btn btn-sm ${shopSelectedCat == c.id ? 'btn-primary' : 'btn-outline'}"
        onclick="selectShopCat(${c.id})">${c.name}</button>`;
  });

  row.innerHTML = html;
}
function selectShopCat(catId) {
  shopSelectedCat = catId;
  renderShopCategories();
  renderShopItems();
}

function renderShopItems() {
  const grid = document.getElementById('shop-item-grid');
  if (!grid) return;

  let list = (stock || []).filter(s => s.quantity > 0);

  if (shopSelectedCat !== null) {
    list = list.filter(s => s.category_id == shopSelectedCat);
  }

  if (!list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1; color:#888; padding:20px; text-align:center;">No items in this category</div>`;
    return;
  }

  grid.innerHTML = list.map(s => `
    <button type="button" class="shop-item-btn" onclick="shopTapItem(${s.id})">
      <strong>${s.item_name}</strong>
      <span class="price">${money(s.price)}</span>
      <span class="left">${s.quantity} left</span>
    </button>
  `).join('');
}

function shopTapItem(inventoryId) {
  const inv = (stock || []).find(s => s.id == inventoryId);
  if (!inv || inv.quantity <= 0) {
    showError('Out of stock');
    return;
  }

  const existing = shopCart.find(c => c.inventory_id == inventoryId);
  const newQty = (existing ? existing.quantity : 0) + 1;

  if (newQty > inv.quantity) {
    showError(`Only ${inv.quantity} left`);
    return;
  }

  if (existing) {
    existing.quantity = newQty;
    existing.total = existing.quantity * existing.unit_price;
  } else {
    shopCart.push({
      inventory_id: inv.id,
      item_name: inv.item_name,
      quantity: 1,
      unit_price: inv.price,
      total: inv.price,
    });
  }
  renderShopCart();
}

function shopAddItem() {
  const sel = document.getElementById('shop-inv-select');
  const opt = sel?.selectedOptions?.[0];
  if (!opt || !opt.value) {
    showError('Select an item');
    return;
  }

  const id = parseInt(opt.value);
  const price = parseInt(opt.dataset.price) || 0;
  const name = opt.dataset.name || 'Item';
  const stockLeft = parseInt(opt.dataset.stock) || 0;
  const qty = Math.max(1, parseInt(document.getElementById('shop-inv-qty').value) || 1);

  const existing = shopCart.find(c => c.inventory_id === id);
  const newQty = (existing ? existing.quantity : 0) + qty;

  if (newQty > stockLeft) {
    showError(`Only ${stockLeft} left in stock`);
    return;
  }

  if (existing) {
    existing.quantity = newQty;
    existing.total = existing.quantity * existing.unit_price;
  } else {
    shopCart.push({
      inventory_id: id,
      item_name: name,
      quantity: qty,
      unit_price: price,
      total: qty * price,
    });
  }

  document.getElementById('shop-inv-qty').value = 1;
  renderShopCart();
}

function shopChangeQty(index, delta) {
  const line = shopCart[index];
  if (!line) return;

  const inv = (stock || []).find(s => s.id == line.inventory_id);
  const max = inv ? inv.quantity : 9999;
  const next = line.quantity + delta;

  if (next < 1) {
    shopCart.splice(index, 1);
  } else if (next > max) {
    showError(`Only ${max} in stock`);
    return;
  } else {
    line.quantity = next;
    line.total = line.quantity * line.unit_price;
  }
  renderShopCart();
}

function shopRemoveItem(index) {
  shopCart.splice(index, 1);
  renderShopCart();
}

function renderShopCart() {
  const box = document.getElementById('shop-cart');
  const total = shopCart.reduce((s, c) => s + c.total, 0);

  if (!shopCart.length) {
    box.innerHTML = `<div style="color:#888; padding:10px; text-align:center;">Tap items above to add</div>`;
  } else {
    box.innerHTML = shopCart.map((c, i) => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border); gap:8px;">
        <div style="flex:1; min-width:0;">
          <strong style="font-size:13px;">${c.item_name}</strong>
          <div style="font-size:11px; color:var(--text-dim);">${money(c.unit_price)} each</div>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <button type="button" class="btn btn-sm btn-outline" onclick="shopChangeQty(${i}, -1)">−</button>
          <span style="min-width:22px; text-align:center;">${c.quantity}</span>
          <button type="button" class="btn btn-sm btn-outline" onclick="shopChangeQty(${i}, 1)">+</button>
        </div>
        <b style="min-width:64px; text-align:right;">${money(c.total)}</b>
        <button type="button" class="btn btn-sm btn-danger" onclick="shopRemoveItem(${i})">✕</button>
      </div>
    `).join('');
  }

  const label = document.getElementById('shop-total-label');
  if (label) label.textContent = `Total: ${money(total)}`;
}

async function saveShopSale() {
  if (!shopCart.length) {
    showError('Add at least one item');
    return;
  }

  const customer = (document.getElementById('shop-customer').value || '').trim();
  const method = document.querySelector('input[name="shop-pay"]:checked')?.value || 'cash';

  try {
    const res = await fetch('/cueboard/api/shop/sale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      body: JSON.stringify({
        customer_name: customer || null,
        payment_method: method,
        items: shopCart.map(c => ({
          inventory_id: c.inventory_id,
          quantity: c.quantity,
        })),
      })
    });

    if (res.ok) {
      closeModal('shop-modal');
      await loadData(); // stock refresh
      await loadShop();
      showSuccess('Sale saved');
    } else {
      const err = await res.json().catch(() => ({}));
      showError(err.message || 'Failed to save');
    }
  } catch (e) {
    showError('Network error');
  }
}

async function deleteShopSale(id) {
  const result = await showConfirm('Delete this sale? Stock will be restored.');
  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`/cueboard/api/shop/sale/${id}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '' }
    });
    if (res.ok) {
      await loadData();
      await loadShop();
      showSuccess('Deleted');
    } else {
      showError('Failed');
    }
  } catch (e) {
    showError('Error');
  }
}


let billingUnlocked = false;

async function openBillingProtected() {
  try {
    const res = await fetch('/cueboard/api/billing/unlock-status', {
      headers: { 'Accept': 'application/json' },
      credentials: 'same-origin'
    });
    const data = await res.json();
    if (data.unlocked) {
      billingUnlocked = true;
      loadBilling(1);
      return;
    }
  } catch (e) {}

  billingUnlocked = false;
  // view pehle se switch ho chuka hai — content empty / locked dikhao
  const tbody = document.getElementById('billing-body');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#888;">
      Locked — enter password to view billing history.
    </td></tr>`;
  }
  const pag = document.getElementById('billing-pagination');
  if (pag) pag.innerHTML = '';

  const err = document.getElementById('billing-lock-error');
  if (err) { err.style.display = 'none'; err.textContent = ''; }
  const input = document.getElementById('billing-lock-password');
  if (input) {
    input.value = '';
    setTimeout(() => input.focus(), 100);
  }
  openModal('billing-lock-modal');
}

async function submitBillingUnlock() {
  const password = (document.getElementById('billing-lock-password')?.value || '').trim();
  const err = document.getElementById('billing-lock-error');
  if (!password) {
    if (err) { err.textContent = 'Enter password'; err.style.display = 'block'; }
    return;
  }

  try {
    const res = await fetch('/cueboard/api/billing/unlock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
      },
      credentials: 'same-origin',
      body: JSON.stringify({ password })
    });

    if (res.ok) {
      billingUnlocked = true;
      closeModal('billing-lock-modal');
      loadBilling(1);
      showSuccess('Billing unlocked');
    } else {
      const data = await res.json().catch(() => ({}));
      if (err) {
        err.textContent = data.message || 'Wrong password';
        err.style.display = 'block';
      }
      showError(data.message || 'Wrong password');
    }
  } catch (e) {
    showError('Network error');
  }
}

function cancelBillingUnlock() {
  closeModal('billing-lock-modal');
  // wapas dashboard (ya pehle wala safe view)
  switchView('dashboard');
}

// Enter key on password field
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('billing-lock-password');
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitBillingUnlock();
    });
  }
});