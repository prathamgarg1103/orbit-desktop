export const PUBLIC_PAGE_CSP = "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";
export const BETA_FEEDBACK_URL = "https://github.com/prathamgarg1103/orbit-desktop/issues/new/choose";

export function launchPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="Diya is a screen-aware desktop companion that teaches the next step inside the tool you are already using.">
  <title>Diya - a second cursor for getting unstuck</title>
  <style>
    :root { color:#f5f7f2; background:#101317; font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; }
    * { box-sizing:border-box; }
    body { min-height:100vh; margin:0; overflow-x:hidden; background:#101317; }
    body::before { position:fixed; inset:0; z-index:-2; background:linear-gradient(90deg,#14191d 0,#101317 48%,#17140f 100%); content:""; }
    body::after { position:fixed; inset:auto 0 0; z-index:-1; height:42vh; border-top:1px solid #ffffff12; background:repeating-linear-gradient(90deg,#ffffff0b 0 1px,transparent 1px 72px),repeating-linear-gradient(0deg,#ffffff08 0 1px,transparent 1px 56px); opacity:.45; content:""; }
    a { color:inherit; }
    .shell { width:min(1120px,calc(100% - 40px)); margin:0 auto; padding:22px 0 34px; }
    .nav { display:flex; align-items:center; justify-content:space-between; gap:18px; }
    .wordmark { display:flex; align-items:center; gap:9px; color:#fff; font-weight:800; text-decoration:none; }
    .mark, .cursor { position:relative; display:inline-block; transform:rotate(-14deg); filter:drop-shadow(0 10px 20px #0208068f); }
    .mark { width:18px; height:23px; }
    .mark::before, .cursor::before { position:absolute; inset:0; border:1px solid #d9fff2; background:linear-gradient(145deg,#ffffff 0,#98f5d0 54%,#ffc861 100%); clip-path:polygon(0 0,100% 47%,60% 59%,45% 100%,30% 65%,0 82%); content:""; }
    .mark::after, .cursor::after { position:absolute; border-radius:50%; background:#fff; box-shadow:0 0 10px 3px #9cf5ce; content:""; }
    .mark::after { top:8px; left:7px; width:4px; height:4px; }
    .nav-links { display:flex; align-items:center; gap:16px; }
    .nav-links a { color:#b5c0b9; font-size:13px; text-underline-offset:4px; }
    .nav-links .download { border:1px solid #ffffff24; border-radius:8px; padding:8px 10px; color:#101317; background:#9eeec8; font-weight:800; text-decoration:none; }
    main { display:grid; min-height:calc(100vh - 104px); grid-template-columns:minmax(0,1.02fr) minmax(310px,.98fr); align-items:center; gap:66px; padding:62px 0 72px; }
    .eyebrow { margin:0 0 18px; color:#9eeec8; font-size:12px; font-weight:760; text-transform:uppercase; }
    h1 { max-width:690px; margin:0; color:#fff; font-size:clamp(46px,7vw,82px); line-height:1; letter-spacing:0; }
    h1 em { color:#ffd173; font-style:normal; }
    .lede { max-width:575px; margin:24px 0 0; color:#c5cec7; font-size:18px; line-height:1.6; }
    .cta-row { display:flex; flex-wrap:wrap; align-items:center; gap:12px; margin:30px 0 0; }
    .cta { display:inline-flex; align-items:center; min-height:44px; border-radius:8px; padding:0 16px; color:#101317; background:#9eeec8; font-size:14px; font-weight:820; text-decoration:none; }
    .cta:hover, .nav-links .download:hover { background:#ffd173; }
    .release-link { color:#b5c0b9; font-size:13px; text-underline-offset:4px; }
    .signals { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; max-width:640px; margin:30px 0 0; }
    .signals span { min-height:58px; border:1px solid #ffffff1c; border-radius:8px; padding:12px; color:#dce4dd; background:#ffffff08; font-size:13px; line-height:1.35; }
    .stage { position:relative; min-height:430px; border:1px solid #ffffff1d; background:#151a1f; box-shadow:0 22px 80px #00000059; overflow:hidden; }
    .stage-bar { display:flex; align-items:center; gap:7px; height:34px; padding:0 12px; border-bottom:1px solid #ffffff14; background:#0c0f12; }
    .stage-bar span { width:8px; height:8px; border-radius:50%; background:#ef6f6c; }
    .stage-bar span:nth-child(2) { background:#f0c45d; }
    .stage-bar span:nth-child(3) { background:#7bdd9d; }
    .tool { display:grid; gap:13px; padding:24px; }
    .row { height:42px; border:1px solid #ffffff12; border-radius:8px; background:#20262c; }
    .row:nth-child(2) { width:72%; background:#26302c; }
    .row:nth-child(3) { width:86%; background:#1e252b; }
    .target { position:absolute; left:42%; top:48%; width:74px; height:74px; border:2px solid #ffd173; border-radius:50%; box-shadow:0 0 0 8px #ffd1731a; }
    .cursor { position:absolute; left:52%; top:38%; width:54px; height:66px; animation:float 2.1s ease-in-out infinite alternate; }
    .cursor::after { top:23px; left:22px; width:7px; height:7px; }
    @keyframes float { to { transform:rotate(-8deg) translate3d(4px,-8px,0); } }
    .callout { position:absolute; right:22px; bottom:24px; width:min(295px,calc(100% - 44px)); border:1px solid #ffffff20; border-radius:8px; padding:16px; background:#f5f7f2; color:#141914; box-shadow:0 18px 50px #00000052; }
    .callout strong { display:block; margin-bottom:5px; font-size:14px; }
    .callout p { margin:0; color:#445047; font-size:13px; line-height:1.45; }
    .form-copy { margin:0 0 14px; color:#fff; font-size:20px; font-weight:760; }
    form { margin-top:16px; padding:18px; border:1px solid #ffffff1f; border-radius:8px; background:#ffffff08; }
    label { display:block; margin:0 0 8px; color:#bec9c0; font-size:12px; font-weight:720; }
    .input-row { display:flex; gap:8px; }
    input { min-width:0; flex:1; border:1px solid #ffffff24; border-radius:8px; outline:0; padding:13px 14px; color:#fff; background:#090c0f; font-size:15px; }
    input:focus { border-color:#9eeec8; box-shadow:0 0 0 3px #9eeec821; }
    button { border:0; border-radius:8px; padding:0 16px; color:#101317; background:#9eeec8; font-size:13px; font-weight:820; cursor:pointer; }
    button:hover { background:#ffd173; }
    button:disabled { cursor:wait; opacity:.65; }
    .form-note { margin:12px 0 0; color:#9ca7a1; font-size:11px; line-height:1.5; }
    .form-status { min-height:20px; margin:12px 0 0; color:#9eeec8; font-size:13px; line-height:1.45; }
    .form-status.error { color:#ffb0a8; }
    .foot { display:flex; justify-content:space-between; gap:20px; color:#88948d; font-size:12px; }
    .foot a { text-underline-offset:4px; }
    @media (max-width:860px) { main { grid-template-columns:1fr; gap:42px; padding-top:54px; } .stage { min-height:360px; } }
    @media (max-width:620px) { .shell { width:min(100% - 32px,560px); } .nav { align-items:flex-start; } .nav-links { flex-direction:column; align-items:flex-end; gap:10px; } .signals { grid-template-columns:1fr; } h1 { font-size:clamp(42px,13vw,64px); } .lede { font-size:16px; } .input-row { display:block; } button { width:100%; min-height:46px; margin-top:9px; } .foot { flex-direction:column; } }
  </style>
</head>
<body>
  <div class="shell">
    <nav class="nav"><a class="wordmark" href="/"><span class="mark"></span>diya</a><div class="nav-links"><a href="/privacy">privacy at a glance</a><a href="/status">beta status</a><a href="${BETA_FEEDBACK_URL}">report beta issue</a><a class="download" href="https://github.com/prathamgarg1103/orbit-desktop/releases/download/v0.11.1/Diya.0.11.1.exe">download beta</a></div></nav>
    <main>
      <section>
        <p class="eyebrow">Early access for Windows</p>
        <h1>A second cursor for when software gets <em>opaque.</em></h1>
        <p class="lede">Press the hotkey, let Diya see the current screen once, and ask out loud. It answers in context, points at the interface, and only runs connected agents after you approve the action.</p>
        <div class="cta-row"><a class="cta" href="https://github.com/prathamgarg1103/orbit-desktop/releases/download/v0.11.1/Diya.0.11.1.exe">Download Windows beta</a><a class="release-link" href="https://github.com/prathamgarg1103/orbit-desktop/releases/tag/v0.11.1">View release notes</a><a class="release-link" href="${BETA_FEEDBACK_URL}">Report beta feedback</a></div>
        <div class="signals"><span>Screen context starts only after your hotkey.</span><span>Guidance is drawn over the tool, not trapped in chat.</span><span>Gmail and Notion actions wait for approval.</span></div>
      </section>
      <section aria-labelledby="access-title">
        <div class="stage" aria-hidden="true">
          <div class="stage-bar"><span></span><span></span><span></span></div>
          <div class="tool"><div class="row"></div><div class="row"></div><div class="row"></div><div class="row"></div></div>
          <span class="target"></span>
          <span class="cursor"></span>
          <div class="callout"><strong>Next step</strong><p>Click the highlighted control, then Diya will walk you through the next move.</p></div>
        </div>
        <form id="waitlist" novalidate>
          <h2 class="form-copy" id="access-title">Get a beta invite.</h2>
          <label for="email">Email</label>
          <div class="input-row"><input id="email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" required><button type="submit">Request access</button></div>
          <p class="form-note">We use this email only to reply about the Diya beta. It is encrypted at rest and never becomes part of your screen context.</p>
          <p class="form-status" id="status" aria-live="polite"></p>
        </form>
      </section>
    </main>
    <footer class="foot"><span>Built for deliberate, approval-first work.</span><span>Diya helps without watching in the background.</span></footer>
  </div>
  <script>
    const form = document.querySelector('#waitlist'); const email = document.querySelector('#email'); const status = document.querySelector('#status'); const button = form.querySelector('button');
    form.addEventListener('submit', async (event) => { event.preventDefault(); const value = email.value.trim(); if (!email.validity.valid) { status.textContent = 'Enter a valid email address.'; status.className = 'form-status error'; email.focus(); return; } button.disabled = true; status.textContent = 'Saving your request...'; status.className = 'form-status'; try { const response = await fetch('/v1/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: value }) }); const body = await response.json().catch(() => ({})); if (!response.ok) { const code = body && body.error && body.error.code; if (code === 'configuration_error') { status.textContent = 'The private beta list is being connected. Please check back shortly.'; } else if (code === 'rate_limited') { status.textContent = 'Too many requests from this network. Please try again in a few minutes.'; } else { status.textContent = (body && body.error && body.error.message) || 'That did not go through. Please try again shortly.'; } status.className = 'form-status error'; return; } email.value = ''; status.textContent = 'You are on the list. We will be in touch about early access.'; status.className = 'form-status'; } catch { status.textContent = 'That did not go through. Please try again shortly.'; status.className = 'form-status error'; } finally { button.disabled = false; } });
  </script>
</body>
</html>`;
}

export function privacyPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Diya privacy at a glance</title>
  <style>
    :root{font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#f5f7f2;background:#101317}
    *{box-sizing:border-box}
    body{margin:0;background:#101317}
    .page{width:min(760px,calc(100% - 40px));margin:0 auto;padding:56px 0 80px}
    a{color:#9eeec8;text-underline-offset:4px}
    .brand{color:#fff;font-weight:800;text-decoration:none}
    h1{margin:42px 0 12px;font-size:clamp(38px,8vw,62px);line-height:1;letter-spacing:0}
    p,li{color:#c5cec7;line-height:1.65}
    .intro{font-size:18px}
    .items{display:grid;gap:14px;margin:32px 0}
    .item{padding:20px;border:1px solid #ffffff1f;border-radius:8px;background:#ffffff08}
    .item h2{margin:0 0 7px;color:#fff;font-size:17px}
    .item p{margin:0}
    .small{margin-top:35px;color:#9ca7a1;font-size:13px}
  </style>
</head>
<body>
  <main class="page"><a class="brand" href="/">diya</a><h1>Privacy at a glance.</h1><p class="intro">Diya is designed around explicit context: it does not silently record your screen in the background.</p><section class="items"><article class="item"><h2>Screen context</h2><p>Diya captures a screen only after you use its hotkey. Diya Cloud forwards that image for the active guide request with response storage disabled, then discards it from process memory. It does not retain screenshots, questions, or model answers.</p></article><article class="item"><h2>Early-access email</h2><p>If you request beta access here, Diya Cloud stores your email encrypted at rest plus a keyed duplicate-prevention fingerprint. The email is used only to reply about the beta.</p></article><article class="item"><h2>Beta feedback</h2><p>If an enrolled beta user sends a feedback note from Diya Settings, it is encrypted at rest and never includes their active screen, prompt, or model answer. When that device used a waitlist invite, the beta operator can associate the note with that supplied email to reply.</p></article><article class="item"><h2>Connected tools</h2><p>Optional Gmail and Notion tokens are encrypted at rest. Diya asks for approval before any connected action; Gmail support creates drafts rather than sending email.</p></article></section><p class="small">This page describes the current Diya beta implementation. Product, support, and legal details should be finalized before a broad public launch.</p></main>
</body>
</html>`;
}

export function statusPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Diya status</title>
  <style>
    :root{font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#f5f7f2;background:#101317}
    *{box-sizing:border-box}
    body{margin:0;background:#101317}
    .page{width:min(860px,calc(100% - 40px));margin:0 auto;padding:48px 0 80px}
    a{color:#9eeec8;text-underline-offset:4px}
    .brand{color:#fff;font-weight:800;text-decoration:none}
    h1{margin:40px 0 10px;font-size:clamp(38px,8vw,64px);line-height:1}
    p{color:#c5cec7;line-height:1.65}
    .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:30px 0}
    .card{border:1px solid #ffffff1f;border-radius:10px;padding:18px;background:#ffffff08}
    .card h2{margin:0 0 8px;color:#fff;font-size:17px}
    .status{display:inline-flex;border-radius:999px;padding:4px 9px;margin-bottom:10px;color:#101317;background:#9eeec8;font-size:12px;font-weight:800}
    .pending{background:#ffd173}
    .small{font-size:13px;color:#9ca7a1}
    @media (max-width:720px){.grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <main class="page">
    <a class="brand" href="/">diya</a>
    <h1>Diya beta status.</h1>
    <p>This page separates what is already public from what still depends on production secrets.</p>
    <section class="grid">
      <article class="card"><span class="status">live</span><h2>Windows beta</h2><p>The portable Diya build is available from the public release.</p><p><a href="https://github.com/prathamgarg1103/orbit-desktop/releases/download/v0.11.1/Diya.0.11.1.exe">Download Diya 0.11.1</a></p></article>
      <article class="card"><span class="status">live</span><h2>Public site</h2><p>Landing, privacy summary, release notes, and beta feedback intake are live.</p><p><a href="${BETA_FEEDBACK_URL}">Report beta feedback</a></p></article>
      <article class="card"><span class="status pending">pending secrets</span><h2>Cloud pairing</h2><p>Hosted pairing becomes live after Vercel has DIYA_DATABASE_URL and OPENAI_API_KEY configured.</p><p><a href="/health">View live health JSON</a></p></article>
      <article class="card"><span class="status">ready in repo</span><h2>Startup operating kit</h2><p>Runbook, beta outreach, privacy notes, and GitHub issue intake are ready in the repository.</p><p><a href="https://github.com/prathamgarg1103/orbit-desktop">Open repository</a></p></article>
    </section>
    <p class="small">Diya does not watch in the background. Screen context starts only after the hotkey.</p>
  </main>
</body>
</html>`;
}
