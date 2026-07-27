<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Forgot Password — CueBoard</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --felt: #0d3b24; --felt-light: #177a4a; --brass: #c9a84c; --brass-dim: #a88b3a;
      --bg: #0f1210; --panel: #1a1f1c; --border: #2a322c; --text: #e8e4d9;
      --text-dim: #8b929b; --cream: #f0ebe0;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text);
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
    }
    .wrap { width: 100%; max-width: 420px; padding: 20px; }
    .brand { display: flex; align-items: center; gap: 12px; justify-content: center; margin-bottom: 32px; }
    .brand .ball {
      width: 36px; height: 36px; border-radius: 50%;
      background: radial-gradient(circle at 35% 35%, #e8a0a0, #c1453a 60%, #8b1a14);
    }
    .brand h1 { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 700; color: var(--cream); }
    .brand h1 span { color: var(--brass); }
    .brand .tag { font-size: 11px; color: var(--text-dim); letter-spacing: 2px; text-transform: uppercase; }
    .panel {
      background: var(--panel); border: 1px solid var(--border); border-radius: 16px;
      padding: 32px; box-shadow: 0 20px 60px rgba(0,0,0,.4);
    }
    .panel h2 { font-family: 'Cormorant Garamond', serif; font-size: 24px; color: var(--cream); text-align: center; margin-bottom: 8px; }
    .panel .sub { text-align: center; color: var(--text-dim); font-size: 13px; margin-bottom: 24px; line-height: 1.5; }
    .field { margin-bottom: 18px; }
    .field label { display: block; font-size: 12px; color: var(--text-dim); margin-bottom: 6px; text-transform: uppercase; letter-spacing: .5px; }
    .field input {
      width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
      padding: 12px 14px; color: var(--cream); font-size: 14px; outline: none;
    }
    .field input:focus { border-color: var(--felt-light); }
    .btn {
      width: 100%; background: var(--felt); color: #fff; border: none; border-radius: 8px;
      padding: 14px; font-size: 15px; font-weight: 600; cursor: pointer;
    }
    .btn:hover { background: var(--felt-light); }
    .back { display: block; text-align: center; margin-top: 18px; font-size: 13px; color: var(--brass-dim); text-decoration: none; }
    .back:hover { color: var(--brass); }
    .error { color: #e8837a; font-size: 12px; margin-top: 6px; }
    .success { color: var(--felt-light); font-size: 13px; text-align: center; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="brand">
      <div class="ball"></div>
      <div>
        <h1>CUE<span>BOARD</span></h1>
        <div class="tag">Club Manager</div>
      </div>
    </div>

    <div class="panel">
      <h2>Forgot Password</h2>
      <div class="sub">Enter your email and we'll send you a reset link.</div>

      @if (session('status'))
        <div class="success">{{ session('status') }}</div>
      @endif

      <form method="POST" action="{{ route('password.email') }}">
        @csrf
        <div class="field">
          <label for="email">Email</label>
          <input id="email" type="email" name="email" value="{{ old('email') }}" required autofocus>
          @error('email') <div class="error">{{ $message }}</div> @enderror
        </div>
        <button type="submit" class="btn">Send Reset Link</button>
      </form>

      <a class="back" href="{{ route('login') }}">← Back to Login</a>
    </div>
  </div>
</body>
</html>