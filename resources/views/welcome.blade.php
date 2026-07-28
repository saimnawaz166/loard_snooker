<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lord Arena Snooker — Lahore's Premier Snooker Club</title>
<meta name="description" content="Lord Arena Snooker — premium snooker & pool club in Park View, Lahore. Full-size English tables, ranked play, private lounges, weekly tournaments.">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,500;1,500;1,600&family=Work+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">

<style>
  :root{
    --bg:#0a0b0a;
    --felt:#0e3d2e;
    --felt-light:#155843;
    --felt-deep:#082a20;
    --gold:#c9a961;
    --gold-dim:#8f7a4d;
    --cream:#ede6d6;
    --red:#9c1c2e;
    --muted:#93a49a;
    --line: rgba(201,169,97,0.2);
  }

  *{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{
    background:var(--bg);
    color:var(--cream);
    font-family:'Work Sans', sans-serif;
    font-weight:300;
    line-height:1.65;
    overflow-x:hidden;
  }
  h1,h2,h3,.display{
    font-family:'Oswald', sans-serif;
    text-transform:uppercase;
    letter-spacing:0.03em;
    font-weight:600;
    color:var(--cream);
  }
  a{color:inherit;text-decoration:none;}
  img{max-width:100%;display:block;}
  .wrap{max-width:1200px;margin:0 auto;padding:0 32px;}
  .eyebrow{
    font-family:'Oswald',sans-serif;
    font-size:12px;
    letter-spacing:0.3em;
    text-transform:uppercase;
    color:var(--gold);
    display:flex;
    align-items:center;
    gap:14px;
  }
  .eyebrow::before{content:'';width:28px;height:1px;background:var(--gold-dim);display:inline-block;}
  section{position:relative;}

  /* duotone treatment so mixed photo sources read as one brand */
  .photo{position:relative;overflow:hidden;background:#050605;}
  .photo img{
    width:100%;height:100%;object-fit:cover;
    filter:grayscale(0.25) contrast(1.12) brightness(0.78) saturate(0.9);
    transition:transform 1.4s cubic-bezier(.2,.7,.2,1), filter .6s ease;
  }
  .photo::after{
    content:'';position:absolute;inset:0;
    background:linear-gradient(180deg, rgba(8,42,32,0.35), rgba(8,9,8,0.55));
    mix-blend-mode:multiply;
  }
  .photo:hover img{transform:scale(1.045);}

  /* ---------- NAV ---------- */
  header{
    position:fixed; top:0; left:0; right:0; z-index:100;
    background:linear-gradient(to bottom, rgba(5,6,5,0.85), rgba(5,6,5,0));
    padding:24px 0;
    transition:background .3s ease, padding .3s ease, border-color .3s ease;
    border-bottom:1px solid transparent;
  }
  header.scrolled{
    background:rgba(7,8,7,0.9);
    backdrop-filter:blur(10px);
    border-color:var(--line);
    padding:15px 0;
  }
  nav{display:flex;align-items:center;justify-content:space-between;}
  .logo{
    font-family:'Oswald',sans-serif;
    font-size:20px;
    font-weight:700;
    letter-spacing:0.14em;
    text-transform:uppercase;
  }
  .logo span{color:var(--gold);}
  .nav-links{display:flex;gap:36px;list-style:none;}
  .nav-links a{
    font-size:12px;
    letter-spacing:0.14em;
    text-transform:uppercase;
    color:var(--muted);
    position:relative;
    padding-bottom:4px;
  }
  .nav-links a:hover{color:var(--cream);}
  .nav-links a::after{
    content:'';position:absolute;bottom:0;left:0;width:0;height:1px;background:var(--gold);
    transition:width .25s ease;
  }
  .nav-links a:hover::after{width:100%;}
  .nav-cta{
    border:1px solid var(--gold-dim);
    padding:10px 22px;
    font-size:11px;
    letter-spacing:0.14em;
    text-transform:uppercase;
    color:var(--gold);
    transition:all .25s ease;
    font-family:'Oswald',sans-serif;
  }
  .nav-cta:hover{background:var(--gold);color:#0a0b0a;}
  .burger{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:0;}
  .burger span{width:24px;height:1px;background:var(--cream);display:block;}

  /* ---------- HERO ---------- */
  .hero{
    min-height:100vh;
    display:flex;align-items:center;
    padding:150px 0 70px;
    position:relative;
  }
  .hero .photo{position:absolute;inset:0;}
  .hero .photo::after{
    background:
      linear-gradient(180deg, rgba(6,7,6,0.6) 0%, rgba(6,7,6,0.3) 35%, rgba(6,7,6,0.9) 100%),
      linear-gradient(90deg, rgba(6,7,6,0.8) 0%, rgba(6,7,6,0.2) 55%);
    mix-blend-mode:normal;
  }
  .hero-content{position:relative;z-index:2;width:100%;}
  .hero-content .eyebrow{margin-bottom:22px;}
  .hero h1{
    font-size:clamp(34px, 5.2vw, 66px);
    line-height:1.04;
    max-width:760px;
    margin-bottom:20px;
  }
  .hero h1 em{
    font-family:'Cormorant Garamond', serif;
    font-style:italic;
    color:var(--gold);
    text-transform:none;
    font-weight:600;
    display:block;
    font-size:0.5em;
    letter-spacing:0;
    margin-top:8px;
  }
  .hero p.lead{
    font-size:17px;
    color:#d8ddd7;
    max-width:460px;
    margin-bottom:38px;
  }
  .btn-row{display:flex;gap:18px;flex-wrap:wrap;margin-bottom:56px;}
  .btn{
    display:inline-block;
    padding:16px 32px;
    font-family:'Oswald',sans-serif;
    font-size:12px;
    letter-spacing:0.14em;
    text-transform:uppercase;
    transition:all .25s ease;
  }
  .btn-primary{background:var(--gold);color:#0a0b0a;}
  .btn-primary:hover{background:#e0c483;}
  .btn-outline{border:1px solid rgba(237,230,214,0.4);color:var(--cream);}
  .btn-outline:hover{border-color:var(--gold);color:var(--gold);}

  .stat-row{display:flex;gap:52px;border-top:1px solid rgba(237,230,214,0.2);padding-top:26px;max-width:560px;}
  .stat .num{
    font-family:'Oswald',sans-serif;
    font-size:32px;
    font-weight:600;
    color:var(--gold);
    font-variant-numeric:tabular-nums;
  }
  .stat .label{font-size:10.5px;letter-spacing:0.13em;text-transform:uppercase;color:#c7cfc9;margin-top:2px;}

  .scroll-cue{
    position:absolute;right:32px;bottom:40px;z-index:2;
    writing-mode:vertical-rl;
    font-family:'Oswald',sans-serif;
    font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:var(--muted);
    display:flex;align-items:center;gap:14px;
  }
  .scroll-cue::after{content:'';width:1px;height:50px;background:var(--gold-dim);}

  /* ---------- ABOUT ---------- */
  .about{padding:150px 0 130px;background:#0a0b0a;}
  .about .wrap{display:grid;grid-template-columns:0.95fr 1.05fr;gap:80px;align-items:center;}
  .about-media .photo{aspect-ratio:4/5;border:1px solid var(--line);}
  .about h2{font-size:clamp(30px,3.6vw,46px);line-height:1.08;margin:18px 0 26px;}
  .about-body p{color:var(--muted);margin-bottom:18px;max-width:480px;}
  .about-body p:first-of-type{color:var(--cream);font-size:17px;}
  .rules-list{margin-top:34px;display:flex;flex-direction:column;gap:0;}
  .rules-list li{
    list-style:none;
    display:flex;align-items:baseline;gap:18px;
    padding:18px 0;
    border-top:1px solid var(--line);
    font-size:14px;
    color:var(--cream);
  }
  .rules-list li:last-child{border-bottom:1px solid var(--line);}
  .rules-list .tag{
    font-family:'Oswald',sans-serif;
    font-size:11px;letter-spacing:0.1em;
    color:var(--gold);min-width:96px;
  }

  /* ---------- FACILITIES ---------- */
  .facilities{padding:0 0 130px;background:#0a0b0a;}
  .sec-head{max-width:600px;margin-bottom:64px;}
  .sec-head h2{font-size:clamp(30px,3.6vw,44px);margin-top:16px;}
  .facility-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;}
  .facility-card{
    position:relative;
    aspect-ratio:3/4;
    border:1px solid var(--line);
    display:flex;flex-direction:column;justify-content:flex-end;
    padding:30px 26px;
    overflow:hidden;
  }
  .facility-card .photo{position:absolute;inset:0;z-index:0;}
  .facility-card .content{position:relative;z-index:1;}
  .facility-card .balls{display:flex;gap:6px;margin-bottom:18px;}
  .ball{width:12px;height:12px;border-radius:50%;box-shadow: inset -1px -2px 3px rgba(0,0,0,0.5), inset 1px 1px 2px rgba(255,255,255,0.3);}
  .ball.red{background:#a6192e;} .ball.yellow{background:#e2b13c;} .ball.green{background:#1f7a4c;}
  .ball.blue{background:#1f4e8f;} .ball.black{background:#111;} .ball.pink{background:#d98aa0;}
  .facility-card h3{font-size:20px;margin-bottom:10px;}
  .facility-card p{color:#d3d9d5;font-size:13.5px;margin-bottom:18px;}
  .facility-card .meta{
    font-family:'Oswald',sans-serif;
    font-size:11.5px;letter-spacing:0.1em;color:var(--gold);
    border-top:1px solid rgba(237,230,214,0.25);padding-top:14px;
  }

  /* ---------- MEMBERSHIP ---------- */
  .membership{padding:0 0 130px;background:#0a0b0a;}
  .plans{display:grid;grid-template-columns:repeat(3,1fr);gap:26px;margin-top:60px;}
  .plan{
    border:1px solid var(--line);
    padding:44px 34px;
    display:flex;flex-direction:column;
    background:#0c0d0c;
  }
  .plan.featured{
    border-color:var(--gold);
    background:linear-gradient(180deg, rgba(201,169,97,0.08), transparent 40%), #0c0d0c;
    transform:translateY(-14px);
  }
  .plan .plan-tag{font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:var(--muted);}
  .plan.featured .plan-tag{color:var(--gold);}
  .plan h3{font-size:24px;margin:14px 0 6px;}
  .plan .price{font-family:'Oswald',sans-serif;font-size:38px;color:var(--gold);margin:16px 0;}
  .plan .price span{font-size:13px;color:var(--muted);font-family:'Work Sans',sans-serif;}
  .plan ul{list-style:none;margin:22px 0 32px;flex:1;}
  .plan li{
    padding:12px 0;border-top:1px solid var(--line);
    font-size:14px;color:var(--muted);display:flex;gap:10px;align-items:baseline;
  }
  .plan li::before{content:'—';color:var(--gold);}
  .plan .btn{width:100%;text-align:center;}

  /* ---------- EVENTS ---------- */
  .events{
    min-height:560px;
    display:flex;align-items:center;
    border-top:1px solid var(--line);
    border-bottom:1px solid var(--line);
    position:relative;
    padding:100px 0;
  }
  .events .photo{position:absolute;inset:0;z-index:0;}
  .events .wrap{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center;}
  .events h2{font-size:clamp(28px,3.4vw,42px);margin:16px 0 22px;}
  .events p{color:#dfe4e0;max-width:440px;margin-bottom:32px;}
  .event-card{
    border:1px solid rgba(201,169,97,0.35);
    padding:36px;
    background:rgba(6,7,6,0.55);
    backdrop-filter:blur(6px);
  }
  .event-card .date{
    font-family:'Oswald',sans-serif;font-size:13px;color:var(--gold);
    letter-spacing:0.1em;margin-bottom:10px;
  }
  .event-card h3{font-size:22px;margin-bottom:14px;}
  .event-card p{color:#dfe4e0;font-size:14px;margin-bottom:24px;max-width:none;}
  .countdown{display:flex;gap:24px;}
  .countdown .c-num{font-family:'Oswald',sans-serif;font-size:28px;color:var(--cream);font-variant-numeric:tabular-nums;}
  .countdown .c-label{font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);}

  /* ---------- CONTACT ---------- */
  .contact{padding:130px 0 100px;background:#0a0b0a;}
  .contact .wrap{display:grid;grid-template-columns:0.85fr 1.15fr;gap:70px;}
  .contact h2{font-size:clamp(30px,3.6vw,44px);margin:16px 0 26px;}
  .info-row{display:flex;flex-direction:column;gap:26px;margin-top:36px;}
  .info-row .k{font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--gold);margin-bottom:6px;}
  .info-row .v{color:var(--cream);font-size:15px;}
  .info-row .v.muted{color:var(--muted);}

  form.book{display:flex;flex-direction:column;gap:20px;}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
  .field label{display:block;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;}
  .field input, .field select, .field textarea{
    width:100%;background:transparent;border:none;border-bottom:1px solid var(--line);
    color:var(--cream);font-family:'Work Sans',sans-serif;font-size:15px;
    padding:10px 2px;outline:none;transition:border-color .25s ease;
  }
  .field input:focus, .field select:focus, .field textarea:focus{border-color:var(--gold);}
  .field select option{background:#0a0b0a;}
  .field textarea{resize:vertical;min-height:70px;}
  form.book .btn{margin-top:10px;align-self:flex-start;border:none;cursor:pointer;}

  /* ---------- FOOTER ---------- */
  footer{border-top:1px solid var(--line);padding:56px 0 36px;background:#060706;}
  footer .wrap{display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:30px;}
  footer .f-links{display:flex;gap:30px;list-style:none;}
  footer .f-links a{font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);}
  footer .f-links a:hover{color:var(--gold);}
  footer .f-note{font-size:12px;color:var(--muted);margin-top:14px;}

  @media(max-width:900px){
    .about .wrap, .events .wrap, .contact .wrap{grid-template-columns:1fr;}
    .facility-grid{grid-template-columns:1fr;}
    .facility-card{aspect-ratio:16/10;}
    .plans{grid-template-columns:1fr;}
    .plan.featured{transform:none;}
    .nav-links, .nav-cta{display:none;}
    .burger{display:flex;}
    .stat-row{flex-wrap:wrap;gap:28px;}
    .form-row{grid-template-columns:1fr;}
    .scroll-cue{display:none;}
  }
</style>
</head>
<body>

<header id="siteHeader">
  <div class="wrap">
    <nav>
      <a href="#" class="logo">LORD <span>ARENA</span></a>
      <ul class="nav-links">
        <li><a href="#about">The Club</a></li>
        <li><a href="#facilities">Tables</a></li>
        <li><a href="#membership">Membership</a></li>
        <li><a href="#events">Tournaments</a></li>
        <li><a href="#contact">Visit</a></li>
        <li><a href="{{ route('login') }}">Login</a></li>
      </ul>
      <a href="#contact" class="nav-cta">Book a Table</a>
      <button class="burger" aria-label="Menu" onclick="document.querySelector('.nav-links').classList.toggle('open')">
        <span></span><span></span><span></span>
      </button>
    </nav>
  </div>
</header>

<section class="hero">
  <div class="photo">
    <img src="https://images.unsplash.com/photo-1760903192559-17dc111d31e3?fm=jpg&q=80&w=2400&auto=format&fit=crop" alt="Snooker table racked and ready at Lord Arena">
  </div>
  <div class="hero-content wrap">
    <p class="eyebrow">Lahore's Premier Snooker Club</p>
    <h1>Precision.<br>Patience.<br><em>Every frame earns its name.</em></h1>
    <p class="lead">Ten full-size English tables, tournament lighting, and a room that goes quiet the moment the reds are racked. Lord Arena is built for players who take the game seriously — and for anyone ready to learn why they should.</p>
    <div class="btn-row">
      <a href="#contact" class="btn btn-primary">Reserve a Table</a>
      <a href="#membership" class="btn btn-outline">View Membership</a>
    </div>
    <div class="stat-row">
      <div class="stat"><div class="num">10</div><div class="label">Championship Tables</div></div>
      <div class="stat"><div class="num">18</div><div class="label">Hours Open Daily</div></div>
      <div class="stat"><div class="num">06</div><div class="label">Years Running</div></div>
    </div>
  </div>
  <div class="scroll-cue">Scroll to explore</div>
</section>

<section class="about" id="about">
  <div class="wrap">
    <div class="about-media">
      <div class="photo">
        <img src="https://images.unsplash.com/photo-1757031694671-03df56cb97b2?fm=jpg&q=80&w=1400&auto=format&fit=crop" alt="Player lining up a shot at Lord Arena">
      </div>
    </div>
    <div>
      <p class="eyebrow">The Club</p>
      <h2>A room built around the sound of a good break.</h2>
      <div class="about-body">
        <p>Lord Arena opened as a two-table room above a tailor's shop in Park View. It's grown into Lahore's most serious address for the game — but the rule that started it hasn't changed: the table comes first.</p>
        <p>We keep the tables level to the millimetre, the cloths brushed after every session, and the lighting exactly where a referee would want it. Members tell us it's the closest thing in the city to playing in a proper club back home.</p>
      </div>
      <ul class="rules-list">
        <li><span class="tag">Cloth</span> Strachan tournament cloth, re-ironed weekly</li>
        <li><span class="tag">Light</span> True overhead rigs, zero shadow on the baulk</li>
        <li><span class="tag">Cues</span> House cues from Peradon &amp; Riley, or bring your own</li>
        <li><span class="tag">Silence</span> A house rule — no phones on the table floor</li>
      </ul>
    </div>
  </div>
</section>

<section class="facilities" id="facilities">
  <div class="wrap">
    <div class="sec-head">
      <p class="eyebrow">What's on the Floor</p>
      <h2>Every table has a purpose.</h2>
    </div>
    <div class="facility-grid">
      <div class="facility-card">
        <div class="photo"><img src="https://images.unsplash.com/photo-1760903192559-17dc111d31e3?fm=jpg&q=80&w=900&auto=format&fit=crop" alt="Championship snooker table"></div>
        <div class="content">
          <div class="balls"><span class="ball red"></span><span class="ball yellow"></span><span class="ball green"></span></div>
          <h3>Championship Snooker</h3>
          <p>Full-size 12ft tables, tournament-marked, for ranked matches and serious practice.</p>
          <div class="meta">6 Tables · PKR 800 / hr</div>
        </div>
      </div>
      <div class="facility-card">
        <div class="photo"><img src="https://images.unsplash.com/photo-1757031694671-03df56cb97b2?fm=jpg&q=80&w=900&auto=format&fit=crop" alt="English pool table in play"></div>
        <div class="content">
          <div class="balls"><span class="ball blue"></span><span class="ball black"></span></div>
          <h3>English Pool</h3>
          <p>Faster tables for casual play, doubles nights, and walk-in games.</p>
          <div class="meta">2 Tables · PKR 500 / hr</div>
        </div>
      </div>
      <div class="facility-card">
        <div class="photo"><img src="https://images.unsplash.com/photo-1572122250231-6532b3a3df61?fm=jpg&q=80&w=900&auto=format&fit=crop" alt="Private lounge table at Lord Arena"></div>
        <div class="content">
          <div class="balls"><span class="ball pink"></span></div>
          <h3>Private Lounge</h3>
          <p>Two enclosed tables with seating for six — book the room, not just the table.</p>
          <div class="meta">2 Suites · By Reservation</div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="membership" id="membership">
  <div class="wrap">
    <div class="sec-head">
      <p class="eyebrow">Membership</p>
      <h2>Play by the hour, or make it home.</h2>
    </div>
    <div class="plans">
      <div class="plan">
        <span class="plan-tag">Walk-In</span>
        <h3>Guest</h3>
        <div class="price">PKR 800 <span>/ hour</span></div>
        <ul>
          <li>Table booking, no membership needed</li>
          <li>House cue &amp; chalk included</li>
          <li>Standard tables only</li>
        </ul>
        <a href="#contact" class="btn btn-outline">Book Now</a>
      </div>
      <div class="plan featured">
        <span class="plan-tag">Most Popular</span>
        <h3>Player</h3>
        <div class="price">PKR 9,500 <span>/ month</span></div>
        <ul>
          <li>Unlimited off-peak table time</li>
          <li>Priority booking on all tables</li>
          <li>Entry to monthly house tournament</li>
          <li>10% off private lounge bookings</li>
        </ul>
        <a href="#contact" class="btn btn-primary">Join as Player</a>
      </div>
      <div class="plan">
        <span class="plan-tag">All Access</span>
        <h3>Lord's Table</h3>
        <div class="price">PKR 22,000 <span>/ month</span></div>
        <ul>
          <li>Unlimited table time, any hour</li>
          <li>Reserved locker &amp; personal cue storage</li>
          <li>Free private lounge, 4 hrs / month</li>
          <li>Guest passes for two</li>
        </ul>
        <a href="#contact" class="btn btn-outline">Join Lord's Table</a>
      </div>
    </div>
  </div>
</section>

<section class="events" id="events">
  <div class="photo">
    <img src="https://images.unsplash.com/photo-1572122250231-6532b3a3df61?fm=jpg&q=80&w=2000&auto=format&fit=crop" alt="Player focused on a shot under dim tournament lighting">
  </div>
  <div class="wrap">
    <div>
      <p class="eyebrow">Tournaments</p>
      <h2>The house cup is back this season.</h2>
      <p>Open to every member, seeded by handicap so first-timers and long-markers play on fair terms. Sign-ups close a week before the draw goes up on the board.</p>
      <a href="#contact" class="btn btn-primary">Register Your Name</a>
    </div>
    <div class="event-card">
      <div class="date">Saturday · 15 August</div>
      <h3>Lord Arena Autumn Cup</h3>
      <p>Single elimination, best of 3 frames. 32-player draw, trophy and table credit for the finalist.</p>
      <div class="countdown">
        <div><div class="c-num">18</div><div class="c-label">Days</div></div>
        <div><div class="c-num">09</div><div class="c-label">Hours</div></div>
        <div><div class="c-num">14</div><div class="c-label">Slots Left</div></div>
      </div>
    </div>
  </div>
</section>

<section class="contact" id="contact">
  <div class="wrap">
    <div>
      <p class="eyebrow">Visit the Club</p>
      <h2>Reserve a table, or come see the room first.</h2>
      <div class="info-row">
        <div>
          <div class="k">Address</div>
          <div class="v">Lord Arena Snooker, Park View, Lahore</div>
        </div>
        <div>
          <div class="k">Hours</div>
          <div class="v muted">Open daily · 10:00 AM — 2:00 AM</div>
        </div>
        <div>
          <div class="k">Phone</div>
          <div class="v muted">+92 300 000 0000</div>
        </div>
      </div>
    </div>

    <form class="book" onsubmit="event.preventDefault(); this.querySelector('.btn').textContent='Request Sent';">
      <div class="form-row">
        <div class="field">
          <label for="name">Full Name</label>
          <input id="name" type="text" placeholder="Your name" required>
        </div>
        <div class="field">
          <label for="phone">Phone</label>
          <input id="phone" type="tel" placeholder="03XX XXXXXXX" required>
        </div>
      </div>
      <div class="form-row">
        <div class="field">
          <label for="table">Table Type</label>
          <select id="table">
            <option>Championship Snooker</option>
            <option>English Pool</option>
            <option>Private Lounge</option>
          </select>
        </div>
        <div class="field">
          <label for="time">Preferred Time</label>
          <input id="time" type="text" placeholder="e.g. Today, 8 PM">
        </div>
      </div>
      <div class="field">
        <label for="note">Note (optional)</label>
        <textarea id="note" placeholder="Number of players, occasion, anything we should know"></textarea>
      </div>
      <button type="submit" class="btn btn-primary">Request Booking</button>
    </form>
  </div>
</section>

<footer>
  <div class="wrap">
    <div>
      <a href="#" class="logo">LORD <span>ARENA</span></a>
      <p class="f-note">© {{ date('Y') }} Lord Arena Snooker, Park View, Lahore. All rights reserved.</p>
    </div>
    <ul class="f-links">
      <li><a href="#about">The Club</a></li>
      <li><a href="#facilities">Tables</a></li>
      <li><a href="#membership">Membership</a></li>
      <li><a href="#contact">Visit</a></li>
    </ul>
  </div>
</footer>

<script>
  window.addEventListener('scroll', () => {
    document.getElementById('siteHeader').classList.toggle('scrolled', window.scrollY > 40);
  });
</script>

</body>
</html>