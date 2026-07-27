@extends('layouts.cueboard')

@section('content')
    <!-- ============ RECEIPT ============ -->
    <section class="view" id="view-receipt">
      <div class="page-head"><div><h2>Bill Summary</h2><p>Frame closed and added to billing history.</p></div></div>
      <div class="receipt" id="receipt-box"></div>
      <div style="display:flex; justify-content:center; gap:10px;">
        <button class="btn btn-outline" onclick="window.print()">Print Receipt</button>
        <button class="btn btn-primary" onclick="switchView('tables')">Back to Tables</button>
      </div>
    </section>
@endsection