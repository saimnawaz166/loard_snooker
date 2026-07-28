@extends('layouts.cueboard')

@yield('modals')

@section('content')
    <!-- ============ DASHBOARD ============ -->
    <section class="view active" id="view-dashboard">
      <div class="page-head">
        <div>
            <h2>Today at the Club</h2>
            <p>A quick look at floor activity, revenue and stock health.</p>
        </div>
        <button class="btn btn-primary" onclick="switchView('tables')">Go to Tables →</button>
      </div>

      <div class="stat-strip">
        <div class="stat-card"><div class="num" id="stat-active">2</div><div class="lbl">Tables Running</div></div>
        <div class="stat-card"><div class="num" id="stat-games">7</div><div class="lbl">Frames Today</div></div>
        <div class="stat-card"><div class="num" id="stat-rev">Rs 9,450</div><div class="lbl">Revenue Today</div></div>
        <div class="stat-card warn"><div class="num" id="stat-low">2</div><div class="lbl">Items Low on Stock</div></div>
      </div>

      <div class="grid-2">
        <div class="panel">
          <h4>Floor Snapshot</h4>
          <div class="grid-3col" id="mini-table-grid"></div>
        </div>
        <div class="panel">
          <h4>Stock Alerts</h4>
          <div id="dash-stock-alerts"></div>
        </div>
      </div>
    </section>
       @include('cueboard.tables')
    @include('cueboard.stock')
    @include('cueboard.billing')
    @include('cueboard.reports')
    @include('cueboard.settings')
    @include('cueboard.modals')
    @include('cueboard.live')
    @include('cueboard.receipt')
    @include('cueboard.profile')
    @include('cueboard.categories')
    @include('cueboard.expenses')
@endsection