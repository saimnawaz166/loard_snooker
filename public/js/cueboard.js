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
      const gameTimeMin = timeToMinutes(session.game_type?.time) || 0;
      const gameTimeMs = gameTimeMin * 60 * 1000;

      const start = new Date(session.start_time).getTime();
      const elapsedMs = Date.now() - start;
      const remainingMs = Math.max(0, gameTimeMs - elapsedMs);

      isTimeOver = remainingMs <= 0;

      if (isTimeOver) {
        cardExtraClass += ' time-over';
      }

      playersHtml = `<div class="sub-row"><span>Players</span><b>${playerNames || '—'}</b></div>`;
      gameInfo = `<div class="game-badge">🔴 ${gameName}</div>`;

      timeHtml = `
        <div class="timer-display table-timer" 
             data-start="${start}" 
             data-limit="${gameTimeMs}"
             style="font-size:20px; ${isTimeOver ? 'color:#e8837a;' : ''}">
          ${isTimeOver ? '00:00:00' : fmtTime(remainingMs)}
        </div>
        <div class="sub-row"><span>Limit</span><b>${gameTimeMin} min</b></div>
      `;
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
  if (view === 'billing') loadBilling(1);
  if (view === 'reports') renderReports();
  if (view === 'settings') renderSettings();
  if (view === 'categories') renderCategories();
  if (view === 'expenses') renderExpenses();
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
      const limit = parseInt(el.dataset.limit);
      if (!start || !limit) return;

      const remainingMs = Math.max(0, limit - (Date.now() - start));
      el.textContent = remainingMs <= 0 ? '00:00:00' : fmtTime(remainingMs);

      // Red color when over
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

    return `
      <tr>
        <td><strong>${tableName}</strong></td>
        <td>${g.game_name}</td>
        <td>${g.time ? timeToMinutes(g.time) + ' min' : '—'}</td>
        <td>${money(g.price)}</td>
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
  document.getElementById('gt-status').value = '1';

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
  document.getElementById('gt-time').value = timeToMinutes(game.time);  // ← yeh change
  document.getElementById('gt-price').value = game.price;
  document.getElementById('gt-status').value = game.status;

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
  const time = document.getElementById('gt-time').value;
  const price = parseInt(document.getElementById('gt-price').value) || 0;
  const status = document.getElementById('gt-status').value;
  const tableId = document.getElementById('gt-table').value;

  if (!name) {
    showError('Please enter Game Name');
    return;
  }
  if (!time) {
    showError('Please enter Time (minutes)');
    return;
  }
  if (!tableId) {
    showError('Please select a Table');
    return;
  }

  const payload = {
    game_name: name,
    time: time,
    price: price,
    status: status,
    pool_table_id: tableId
  };

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
      showSuccess(id ? 'Game type updated successfully!' : 'Game type added successfully!');
    } else {
      showError('Failed to save game type');
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

  if (!gameTypeId) {
    showError('Please select a Game Type');
    return;
  }
  if (!player1 || !player2) {
    showError('Please enter both player names');
    return;
  }

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
        player2_name: player2
      })
    });

    if (res.ok) {
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
    <div class="order-row">
      <span>${o.inventory?.item_name || 'Item'} × ${o.quantity}</span>
      <span>${money(o.total)}</span>
    </div>
  `).join('');
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

  const discountInput = document.getElementById('end-discount');
  discountInput.value = 0;
  updateDiscountPreview();

  discountInput.oninput = updateDiscountPreview;

  openModal('end-game-modal');
}
function updateDiscountPreview() {
  if (!currentSession) return;
  const discount = Math.min(100, Math.max(0, parseInt(document.getElementById('end-discount').value) || 0));
  const gamePrice = currentSession.game_price || 0;
  const finalPrice = Math.round(gamePrice * (100 - discount) / 100);

  const el = document.getElementById('end-discount-preview');
  if (el) {
    el.textContent = discount > 0
      ? `Game price: ${money(gamePrice)} → After ${discount}% off: ${money(finalPrice)}`
      : `Game price: ${money(gamePrice)} (no discount)`;
  }
}

async function confirmEndGame() {
  const loserId = document.getElementById('loser-select').value;
  const discount = Math.min(100, Math.max(0, parseInt(document.getElementById('end-discount').value) || 0));

  if (!loserId) {
    showError('Please select who lost');
    return;
  }

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
        discount_percent: discount
      })
    });

    if (res.ok) {
      const finalSession = await res.json();
      closeModal('end-game-modal');
      if (timerInterval) clearInterval(timerInterval);

      let summary = 'Game Ended!\n\n';
      finalSession.players.forEach(p => {
        summary += `${p.player_name}: ${money(p.total_amount)}\n`;
      });
      if (discount > 0) {
        summary += `\nDiscount: ${discount}% on game price`;
      }
      showSuccess(summary);

      await loadData();
      switchView('tables');
    } else {
      const err = await res.json();
      showError(err.message || 'Failed to end game');
    }
  } catch (e) {
    console.error(e);
    showError('Network error');
  }
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

  // Safety check
  if (!data || !data.data) {
    tbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center; padding:40px; color:#888;">
        No bills found.
      </td>
    </tr>`;
    if (pagination) pagination.innerHTML = '';
    return;
  }

  const bills = data.data;   // ← YE LINE MISSING THI

  tbody.innerHTML = bills.map(b => {
    const tableName = b.table?.name || '—';
    const gameName = b.game_type?.game_name || '—';
    const players = (b.players || []).map(p => p.player_name).join(' vs ');
    const total = (b.players || []).reduce((sum, p) => sum + (p.total_amount || 0), 0);
    const statusBadge = b.payment_status === 'paid'
      ? `<span class="badge ok">Paid</span>`
      : `<span class="badge out">Unpaid</span>`;
    const closedAt = b.end_time
      ? new Date(b.end_time).toLocaleString()
      : '—';

    return `
      <tr>
        <td><strong>${tableName}</strong></td>
        <td>${gameName}</td>
        <td>${players}</td>
        <td><b>${money(total)}</b></td>
        <td>${statusBadge}</td>
        <td>${closedAt}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="viewBill(${b.id})">View</button>
          ${b.payment_status !== 'paid'
        ? `<button class="btn btn-sm btn-primary" onclick="markPaid(${b.id})">Mark Paid</button>`
        : ''}
        </td>
      </tr>
    `;
  }).join('');

  // Pagination
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

    const tableName = bill.table?.name || 'Table';
    const gameName = bill.game_type?.game_name || 'Game';
    const players = bill.players || [];

    let playersHtml = players.map(p => {
      const orders = (p.orders || []).map(o =>
        `<div class="rline"><span>${o.inventory?.item_name || 'Item'} × ${o.quantity}</span><span>${money(o.total)}</span></div>`
      ).join('') || '<div class="rline"><span>No items</span><span>—</span></div>';

      const isLoser = p.id == bill.loser_player_id;
      let gameCharge = '';
      if (isLoser) {
        const original = bill.game_price || 0;
        const discounted = bill.discounted_game_price ?? original;
        const disc = bill.discount_percent || 0;

        if (disc > 0) {
          gameCharge = `
      <div class="rline"><span>Game Price</span><span>${money(original)}</span></div>
      <div class="rline"><span>Discount (${disc}%)</span><span>- ${money(original - discounted)}</span></div>
      <div class="rline"><span>Game Price (After Discount)</span><span>${money(discounted)}</span></div>
    `;
        } else {
          gameCharge = `<div class="rline"><span>Game Price (Lost)</span><span>${money(original)}</span></div>`;
        }
      }

      return `
        <div style="margin-bottom:16px;">
          <h4 style="margin-bottom:8px; color:var(--brass);">${p.player_name} ${isLoser ? '(Lost)' : ''}</h4>
          ${orders}
          ${gameCharge}
          <div class="rline total"><span>Subtotal</span><span>${money(p.total_amount)}</span></div>
        </div>
      `;
    }).join('');

    const grandTotal = players.reduce((sum, p) => sum + (p.total_amount || 0), 0);

    document.getElementById('bill-detail-content').innerHTML = `
  <div class="receipt" style="max-width:100%; margin:0; box-shadow:none; border:none; padding:0;">
    <h3 style="text-align:center;">${tableName} — ${gameName}</h3>
    <div class="rsub" style="text-align:center; margin-bottom:16px;">
      ${bill.start_time ? new Date(bill.start_time).toLocaleString() : ''} → 
      ${bill.end_time ? new Date(bill.end_time).toLocaleString() : ''}<br>
      Status: <b id="bill-status-text">${bill.payment_status === 'paid' ? 'PAID' : 'UNPAID'}</b>
    </div>
    ${playersHtml}
    <div class="rline total" style="margin-top:12px; font-size:18px;">
      <span>Grand Total</span><span>${money(grandTotal)}</span>
    </div>
  </div>
`;

    // Buttons update
    const actions = document.querySelector('#bill-detail-modal .modal-actions');
    actions.innerHTML = `
  <button class="btn btn-outline" style="flex:1" onclick="closeModal('bill-detail-modal')">Close</button>
  <button class="btn btn-primary" style="flex:1" onclick="window.print()">Print</button>
  ${bill.payment_status === 'paid'
        ? `<button class="btn btn-outline" style="flex:1" onclick="markUnpaid(${bill.id}); closeModal('bill-detail-modal');">Mark Unpaid</button>`
        : `<button class="btn btn-primary" style="flex:1" onclick="markPaid(${bill.id}); closeModal('bill-detail-modal');">Mark Paid</button>`
      }
`;

    openModal('bill-detail-modal');
  } catch (e) {
    console.error(e);
    showError('Failed to load bill details');
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

    // Best selling
    const bestBox = document.getElementById('rep-best-selling');
    if (bestBox) {
      const items = data.best_selling || [];
      bestBox.innerHTML = items.length
        ? items.map(i => `<div class="order-row"><span>${i.name}</span><b>${i.sold} sold</b></div>`).join('')
        : `<div style="color:#888;padding:12px;">No sales yet.</div>`;
    }

    // Low selling
    const lowBox = document.getElementById('rep-low-selling');
    if (lowBox) {
      const items = data.low_selling || [];
      lowBox.innerHTML = items.length
        ? items.map(i => `<div class="order-row"><span>${i.name}</span><b>${i.sold} sold</b></div>`).join('')
        : `<div style="color:#888;padding:12px;">No sales yet.</div>`;
    }

    // Revenue split
    const splitBox = document.getElementById('rep-revenue-split');
    if (splitBox && data.split) {
      const rows = ['day', 'week', 'month', 'year'];
      const labels = { day: 'Daily', week: 'Weekly', month: 'Monthly', year: 'Yearly' };
      splitBox.innerHTML = rows.map(k => {
        const g = data.split[k]?.game || 0;
        const s = data.split[k]?.snacks || 0;
        return `
          <div style="margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid var(--border);">
            <div style="font-size:12px; color:var(--brass); margin-bottom:6px; font-weight:600;">${labels[k]}</div>
            <div class="order-row"><span>Table / Game</span><b>${money(g)}</b></div>
            <div class="order-row"><span>Snacks & drinks</span><b>${money(s)}</b></div>
            <div class="order-row"><span>Total</span><b>${money(g + s)}</b></div>
          </div>
        `;
      }).join('');
    }

    // Calendar
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

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  if (label) label.textContent = `${monthNames[calMonth - 1]} ${calYear}`;

  const first = new Date(calYear, calMonth - 1, 1);
  const startDay = first.getDay(); // 0 Sun
  const daysInMonth = new Date(calYear, calMonth, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  let html = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    .map(d => `<div class="cal-head">${d}</div>`).join('');

  for (let i = 0; i < startDay; i++) {
    html += `<div class="cal-day empty"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
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
        <div class="stat-strip" style="grid-template-columns:repeat(4,1fr); margin-bottom:16px;">
          <div class="stat-card"><div class="num" style="font-size:18px;">${money(data.revenue)}</div><div class="lbl">Revenue</div></div>
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