<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <title>CueBoard — Snooker Club Management</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    
    <style>
        :root{
            --bg:#0f1215;
            --bg-elev:#171c20;
            --bg-elev-2:#1d2328;
            --sidebar:#0d1013;
            --felt:#0f5132;
            --felt-light:#1c8a54;
            --felt-glow: rgba(28,138,84,0.35);
            --brass:#c9a45c;
            --brass-dim:#8f7644;
            --cream:#ede4d3;
            --text-dim:#8b929b;
            --text-faint:#565d65;
            --border:#262e35;
            --red:#c1453a;
            --red-dim: rgba(193,69,58,0.14);
            --amber:#d4a72c;
            --amber-dim: rgba(212,167,44,0.14);
            --radius:10px;
            font-family:'Inter',sans-serif;
        }
        *{box-sizing:border-box; margin:0; padding:0;}
        body{ background:var(--bg); color:var(--cream); min-height:100vh; display:flex; }
        ::selection{ background:var(--felt-light); color:#fff; }
        ::-webkit-scrollbar{ width:8px; height:8px; }
        ::-webkit-scrollbar-thumb{ background:var(--border); border-radius:4px; }

        /* ================= SIDEBAR ================= */
        aside{
            width:230px; flex-shrink:0; background:var(--sidebar); border-right:1px solid var(--border);
            height:100vh; position:sticky; top:0; display:flex; flex-direction:column; padding:22px 16px;
        }
        .brand{ display:flex; align-items:center; gap:10px; padding:0 8px 24px; border-bottom:1px solid var(--border); margin-bottom:18px; }
        .brand .ball{
            width:24px; height:24px; border-radius:50%; flex-shrink:0;
            background:radial-gradient(circle at 32% 28%, #e8635a, var(--red) 65%, #7a2019 100%);
            box-shadow:0 0 0 1px rgba(0,0,0,0.4), 0 2px 6px rgba(193,69,58,0.4);
        }
        .brand h1{ font-family:'Oswald',sans-serif; font-weight:600; font-size:18px; letter-spacing:1px; text-transform:uppercase; }
        .brand h1 span{ color:var(--brass); }
        .brand .tag{ font-size:10px; color:var(--text-faint); letter-spacing:1.5px; text-transform:uppercase; margin-top:-2px; }

        nav.side-nav{ display:flex; flex-direction:column; gap:2px; }
        nav.side-nav button{
            display:flex; align-items:center; gap:12px; text-align:left; background:transparent; border:none;
            color:var(--text-dim); font-family:'Inter'; font-size:14px; font-weight:600; padding:11px 12px;
            border-radius:8px; cursor:pointer; transition:all .15s ease;
        }
        nav.side-nav button .ico{ width:18px; text-align:center; font-size:15px; }
        nav.side-nav button:hover{ background:var(--bg-elev); color:var(--cream); }
        nav.side-nav button.active{ background:var(--felt); color:#fff; box-shadow:0 2px 10px var(--felt-glow); }
        .side-badge{ margin-left:auto; background:var(--red); color:#fff; font-size:10px; font-family:'JetBrains Mono'; padding:1px 6px; border-radius:20px; }

        .sidebar-footer{ margin-top:auto; padding-top:16px; border-top:1px solid var(--border); }
        .biz-card{ display:flex; align-items:center; gap:10px; padding:8px; }
        .biz-avatar{ width:32px; height:32px; border-radius:8px; background:var(--bg-elev-2); display:flex; align-items:center; justify-content:center; font-size:15px; border:1px solid var(--border); }
        .biz-name{ font-size:12.5px; font-weight:600; }
        .biz-role{ font-size:10.5px; color:var(--text-faint); }

        /* ================= MAIN ================= */
        .main-wrap{ flex:1; min-width:0; }
        header.topbar{
            display:flex; align-items:center; justify-content:space-between; padding:16px 32px;
            border-bottom:1px solid var(--border); position:sticky; top:0; background:rgba(15,18,21,0.92);
            backdrop-filter:blur(6px); z-index:40;
        }
        .breadcrumb{ font-family:'JetBrains Mono'; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:var(--brass); }
        .topbar-right{ display:flex; align-items:center; gap:14px; }
        .search-box{
            display:flex; align-items:center; gap:8px; background:var(--bg-elev); border:1px solid var(--border);
            border-radius:8px; padding:8px 14px; font-size:13px; color:var(--text-faint); width:220px;
        }
        .icon-btn{ width:36px; height:36px; border-radius:8px; background:var(--bg-elev); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:15px; position:relative; }
        .icon-btn .dot-flag{ position:absolute; top:6px; right:6px; width:6px; height:6px; border-radius:50%; background:var(--red); }

        main{ max-width:1240px; margin:0 auto; padding:30px 32px 60px; }
        .view{ display:none; animation:fadeIn .3s ease; }
        .view.active{ display:block; }
        @keyframes fadeIn{ from{opacity:0; transform:translateY(6px);} to{opacity:1; transform:translateY(0);} }

        .page-head{ display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px;}
        .page-head h2{ font-family:'Oswald'; font-size:25px; font-weight:600; letter-spacing:0.3px; }
        .page-head p{ color:var(--text-dim); font-size:13.5px; margin-top:4px; }

        /* Components */
        .btn{ font-family:'Inter'; font-weight:600; font-size:13px; border:none; border-radius:8px; padding:10px 16px; cursor:pointer; transition:filter .15s ease, transform .1s ease; }
        .btn:active{ transform:scale(0.97); }
        .btn-primary{ background:var(--felt); color:#fff; }
        .btn-primary:hover{ filter:brightness(1.15); }
        .btn-outline{ background:transparent; color:var(--cream); border:1px solid var(--border); }
        .btn-outline:hover{ border-color:var(--brass-dim); }
        .btn-danger{ background:var(--red-dim); color:#e8837a; border:1px solid rgba(193,69,58,0.4); }
        .btn-sm{ padding:7px 12px; font-size:12px; }
        .btn-block{ width:100%; }

        .stat-strip{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:30px; }
        .stat-card{ background:var(--bg-elev); border:1px solid var(--border); border-radius:var(--radius); padding:18px 20px; position:relative; overflow:hidden; }
        .stat-card::before{ content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--felt-light); }
        .stat-card.warn::before{ background:var(--amber); }
        .stat-card .num{ font-family:'JetBrains Mono'; font-size:25px; font-weight:700; }
        .stat-card .lbl{ font-size:11.5px; color:var(--text-dim); margin-top:4px; text-transform:uppercase; letter-spacing:0.5px; }

        .panel{ background:var(--bg-elev); border:1px solid var(--border); border-radius:14px; padding:22px; }
        .panel h4{ font-family:'Oswald'; font-size:14.5px; letter-spacing:0.5px; text-transform:uppercase; color:var(--text-dim); margin-bottom:16px; }
        .grid-2{ display:grid; grid-template-columns:1.4fr 1fr; gap:20px; }
        .grid-3col{ display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }

        .table-card{ background:linear-gradient(160deg, var(--bg-elev) 0%, var(--bg-elev-2) 100%); border:1px solid var(--border); border-radius:14px; overflow:hidden; transition:transform .2s ease, border-color .2s ease; cursor:pointer; display:flex; flex-direction:column; }
  .table-card:hover{ transform:translateY(-3px); border-color:var(--brass-dim); }
  .table-card .felt-top{ height:62px; background: repeating-linear-gradient(135deg, rgba(255,255,255,0.02) 0 2px, transparent 2px 8px), linear-gradient(135deg, var(--felt) 0%, #0b3d26 100%); display:flex; align-items:center; justify-content:space-between; padding:0 18px; border-bottom:3px solid var(--brass-dim); }
  .table-card.idle .felt-top{ filter:grayscale(0.5) brightness(0.7); }
  .table-card .felt-top .tname{ font-family:'Oswald'; font-weight:600; font-size:16px; color:#fff; }
  .status-dot{ display:flex; align-items:center; gap:6px; font-family:'JetBrains Mono'; font-size:10.5px; letter-spacing:1px; text-transform:uppercase; }
  .status-dot .dot{ width:8px; height:8px; border-radius:50%; }
  .status-dot.live .dot{ background:var(--red); box-shadow:0 0 8px var(--red); animation:pulse 1.4s infinite; }
  .status-dot.idle .dot{ background:var(--text-faint); }
  @keyframes pulse{ 0%,100%{opacity:1;} 50%{opacity:0.35;} }
  .table-card .body{ padding:16px 18px; flex:1; display:flex; flex-direction:column; gap:10px; }
  .game-badge{ display:inline-flex; align-self:flex-start; align-items:center; gap:6px; background:var(--bg); border:1px solid var(--border); padding:4px 11px; border-radius:999px; font-size:11.5px; color:var(--brass); font-weight:600; }
  .timer-display{ font-family:'JetBrains Mono'; font-size:30px; font-weight:700; }
  .timer-display.idle-txt{ color:var(--text-faint); font-size:16px; }
  .sub-row{ display:flex; justify-content:space-between; font-size:12px; color:var(--text-dim); }
  .sub-row b{ color:var(--cream); font-weight:600; }

  /* Live table view */
  .live-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; background:linear-gradient(120deg, rgba(23,122,74,0.15), transparent); border:1px solid var(--border); border-radius:14px; padding:22px 26px; }
  .live-header .tname-big{ font-family:'Oswald'; font-size:23px; font-weight:600; }
  .live-header .meta{ color:var(--text-dim); font-size:13px; margin-top:4px; }
  .scoreboard{ font-family:'JetBrains Mono'; font-size:40px; font-weight:700; color:var(--brass); background:#0a0d0f; border:2px solid var(--brass-dim); border-radius:8px; padding:8px 22px; box-shadow: inset 0 0 12px rgba(0,0,0,0.6); }
  .item-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
  .item-btn{ background:var(--bg); border:1px solid var(--border); border-radius:10px; padding:12px 8px; text-align:center; cursor:pointer; transition:all .15s ease; position:relative; }
  .item-btn:hover{ border-color:var(--brass-dim); transform:translateY(-2px); }
  .item-btn.low{ border-color:rgba(212,167,44,0.5); }
  .item-btn.out{ opacity:0.4; cursor:not-allowed; }
  .item-btn .emoji{ font-size:20px; }
  .item-btn .iname{ font-size:11.5px; font-weight:600; margin-top:6px; }
  .item-btn .iprice{ font-size:10.5px; color:var(--text-dim); font-family:'JetBrains Mono'; margin-top:2px; }
  .stock-flag{ position:absolute; top:5px; right:5px; font-size:9px; font-family:'JetBrains Mono'; background:var(--amber-dim); color:var(--amber); padding:1px 5px; border-radius:4px; }

  .order-row{ display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border); font-size:13px; }
  .order-row:last-child{ border-bottom:none; }
  .qty-ctrl{ display:flex; align-items:center; gap:8px; }
  .qty-ctrl button{ width:20px; height:20px; border-radius:5px; border:1px solid var(--border); background:var(--bg); color:var(--cream); cursor:pointer; font-size:12px; }
  .empty-cart{ color:var(--text-faint); font-size:13px; text-align:center; padding:20px 0; }
  .bill-totals{ margin-top:12px; padding-top:12px; border-top:1px dashed var(--border); }
  .bill-totals .row{ display:flex; justify-content:space-between; font-size:12.5px; color:var(--text-dim); margin-bottom:6px; }
  .bill-totals .row.grand{ color:var(--cream); font-weight:700; font-size:16px; font-family:'JetBrains Mono'; margin-top:6px; }

  /* Tables (basic) */
  table.data-table{ width:100%; border-collapse:collapse; font-size:13px; }
  table.data-table th{ text-align:left; color:var(--text-faint); font-size:11px; text-transform:uppercase; letter-spacing:0.5px; padding:10px 12px; border-bottom:1px solid var(--border); font-weight:600; }
  table.data-table td{ padding:12px; border-bottom:1px solid var(--border); }
  table.data-table tr:last-child td{ border-bottom:none; }
  table.data-table tr:hover td{ background:rgba(255,255,255,0.015); }
  .badge{ font-size:10.5px; font-family:'JetBrains Mono'; padding:3px 9px; border-radius:20px; font-weight:600; letter-spacing:0.3px; }
  .badge.ok{ background:rgba(28,138,84,0.15); color:var(--felt-light); }
  .badge.low{ background:var(--amber-dim); color:var(--amber); }
  .badge.out{ background:var(--red-dim); color:#e8837a; }
  .stock-qty-ctrl{ display:flex; align-items:center; gap:6px; }
  .stock-qty-ctrl button{ width:24px; height:24px; border-radius:6px; border:1px solid var(--border); background:var(--bg); color:var(--cream); cursor:pointer; }

  /* Receipt / billing history */
  .receipt{ max-width:420px; margin:0 auto 30px; background:var(--bg-elev); border:1px solid var(--border); border-radius:14px; padding:26px; position:relative; }
  .receipt h3{ font-family:'Oswald'; font-size:18px; text-align:center; letter-spacing:1px; }
  .receipt .rsub{ text-align:center; color:var(--text-dim); font-size:12px; margin-top:2px; margin-bottom:18px; }
  .receipt .rline{ display:flex; justify-content:space-between; font-size:13px; padding:6px 0; border-bottom:1px dotted var(--border); }
  .receipt .rline.total{ font-family:'JetBrains Mono'; font-weight:700; font-size:17px; border-bottom:none; margin-top:8px; padding-top:12px; border-top:1px solid var(--brass-dim); }

  .modal-backdrop{ display:none; position:fixed; inset:0; background:rgba(8,10,12,0.72); z-index:100; align-items:center; justify-content:center; backdrop-filter:blur(3px); }
  .modal-backdrop.active{ display:flex; }
  .modal{ background:var(--bg-elev); border:1px solid var(--border); border-radius:16px; width:520px; max-width:92vw; padding:28px; box-shadow:0 20px 60px rgba(0,0,0,0.5); }
  .modal h3{ font-family:'Oswald'; font-size:20px; margin-bottom:4px; }
  .modal .sub{ color:var(--text-dim); font-size:13px; margin-bottom:20px; }
  .game-options{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px; }
  .game-opt{ border:1.5px solid var(--border); border-radius:10px; padding:14px; cursor:pointer; background:var(--bg); transition:all .15s ease; }
  .game-opt:hover{ border-color:var(--brass-dim); }
  .game-opt.selected{ border-color:var(--felt-light); background:rgba(23,122,74,0.12); }
  .game-opt .balls{ display:flex; gap:4px; margin-bottom:8px; }
  .ball-dot{ width:12px; height:12px; border-radius:50%; }
  .game-opt .gname{ font-weight:600; font-size:13.5px; }
  .game-opt .grate{ font-size:11px; color:var(--text-dim); margin-top:2px; font-family:'JetBrains Mono';}
  .modal-actions{ display:flex; gap:10px; margin-top:6px; }
  .field{ margin-bottom:14px; }
  .field label{ display:block; font-size:12px; color:var(--text-dim); margin-bottom:6px; font-weight:600; }
  .field input, .field select{ width:100%; background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:10px 12px; color:var(--cream); font-family:'Inter'; font-size:13.5px; }

  table-card.time-over {
  border-color: #c1453a !important;
  background: linear-gradient(160deg, #2a1515 0%, #1a0f0f 100%) !important;
}
.table-card.time-over .felt-top {
  background: linear-gradient(135deg, #7a2019 0%, #4a1010 100%) !important;
  filter: none !important;
}
  .field-row{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }

  .module-note{ font-size:12px; color:var(--text-faint); margin-top:30px; text-align:center; }

  .game-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 18px;
}

.game-opt {
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 14px;
  cursor: pointer;
  background: var(--bg);
  transition: all .15s ease;
}

.game-opt:hover {
  border-color: var(--brass-dim);
}

.game-opt.selected {
  border-color: var(--felt-light);
  background: rgba(23,122,74,0.12);
}

.game-opt .balls {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.ball-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.game-opt .gname {
  font-weight: 600;
  font-size: 13.5px;
}

.game-opt .grate {
  font-size: 11px;
  color: var(--text-dim);
  margin-top: 2px;
  font-family: 'JetBrains Mono';
}
.item-btn.selected {
  border-color: var(--felt-light) !important;
  background: rgba(23,122,74,0.15) !important;
}
    </style>
</head>
<body>

    @include('cueboard.sidebar')

    <div class="main-wrap">
        @include('cueboard.topbar')

        <main>
            @yield('content')
        </main>
    </div>

    @yield('modals')

    <script src="{{ asset('js/cueboard.js') }}"></script>
</body>
</html>