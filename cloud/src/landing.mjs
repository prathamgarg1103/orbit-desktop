export const PUBLIC_PAGE_CSP = "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";

export function launchPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="Diya is a screen-aware desktop companion that teaches the next step inside the tool you are already using.">
  <title>Diya — help that stays in the moment</title>
  <style>
    :root { color:#eef6ff; background:#09101f; font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; }
    * { box-sizing:border-box; } body { min-height:100vh; margin:0; overflow-x:hidden; background:radial-gradient(circle at 82% 16%,#203d822f 0,transparent 28rem),radial-gradient(circle at 14% 84%,#7338ad2b 0,transparent 27rem),#09101f; }
    a { color:inherit; } .shell { width:min(1120px,calc(100% - 40px)); margin:0 auto; padding:24px 0 54px; } .nav { display:flex; align-items:center; justify-content:space-between; } .wordmark { display:flex; align-items:center; gap:9px; color:#fff; font-weight:800; letter-spacing:-.04em; text-decoration:none; } .mark { position:relative; width:21px; height:25px; transform:rotate(-15deg); filter:drop-shadow(0 0 8px #6eeeff8c); } .mark::before { position:absolute; inset:0; border:1px solid #b6f9ff; border-radius:11px 11px 11px 3px; background:linear-gradient(145deg,#ffffff,#7deeff 48%,#756dff); clip-path:polygon(2% 2%,100% 48%,59% 59%,45% 100%,30% 65%,2% 82%); content:""; } .mark::after { position:absolute; top:8px; left:8px; width:4px; height:4px; border-radius:50%; background:#fff; box-shadow:0 0 8px 2px #7deeff; content:""; } .nav a:last-child { color:#aabbd8; font-size:13px; text-underline-offset:4px; }
    main { display:grid; min-height:calc(100vh - 96px); align-items:center; grid-template-columns:minmax(0,1.05fr) minmax(300px,.95fr); gap:80px; padding:72px 0 82px; } .eyebrow { display:inline-flex; align-items:center; gap:8px; margin:0 0 18px; color:#a9c8ff; font-size:12px; font-weight:750; letter-spacing:.11em; text-transform:uppercase; } .eyebrow::before { width:7px; height:7px; border-radius:50%; background:#83f5d2; box-shadow:0 0 0 4px #83f5d21c; content:""; } h1 { max-width:680px; margin:0; color:#fff; font-size:clamp(48px,7vw,82px); line-height:.98; letter-spacing:-.07em; } h1 em { color:#9ceefa; font-style:normal; } .lede { max-width:555px; margin:25px 0 0; color:#b7c3d8; font-size:18px; line-height:1.6; } .signals { display:flex; flex-wrap:wrap; gap:9px; margin:28px 0 0; } .signals span { border:1px solid #a9bde52b; border-radius:999px; padding:7px 10px; color:#b9c7dd; background:#ffffff06; font-size:12px; }
    .form-zone { position:relative; } .form-zone::before { position:absolute; z-index:-1; top:-54px; right:28px; width:280px; height:280px; border:1px solid #77dffd26; border-radius:50%; box-shadow:0 0 90px #639dff20,inset 0 0 80px #639dff12; content:""; } .cursor { position:absolute; top:-22px; right:34px; width:54px; height:65px; transform:rotate(-14deg); filter:drop-shadow(0 0 15px #6eeeffa1); animation:float 2.2s ease-in-out infinite alternate; } .cursor::before { position:absolute; inset:0; border:1px solid #d3fbff; border-radius:18px 18px 18px 4px; background:linear-gradient(145deg,#fff,#89f5ff 43%,#756dff); clip-path:polygon(2% 2%,100% 48%,59% 59%,45% 100%,30% 65%,2% 82%); content:""; } .cursor::after { position:absolute; top:22px; left:22px; width:7px; height:7px; border-radius:50%; background:#fff; box-shadow:0 0 13px 4px #7deeff; content:""; } @keyframes float { to { transform:rotate(-7deg) translate3d(2px,-7px,0); } }
    .form-copy { margin:0 0 16px; color:#f5f9ff; font-size:23px; font-weight:700; letter-spacing:-.035em; } form { padding:22px; border:1px solid #c5d8ff2b; border-radius:22px; background:linear-gradient(145deg,#18243fd6,#111a2ddd); box-shadow:0 25px 80px #02071478,inset 0 1px #ffffff12; } label { display:block; margin:0 0 8px; color:#b6c7e0; font-size:12px; font-weight:700; } .input-row { display:flex; gap:8px; } input { min-width:0; flex:1; border:1px solid #a9c5fb37; border-radius:12px; outline:0; padding:13px 14px; color:#fff; background:#07101fe8; font-size:15px; } input:focus { border-color:#84eefd; box-shadow:0 0 0 3px #74eafa1e; } button { border:0; border-radius:12px; padding:0 16px; color:#07101f; background:linear-gradient(135deg,#a8f8ff,#7a99ff); box-shadow:0 7px 24px #74dff842; font-size:13px; font-weight:800; cursor:pointer; } button:disabled { cursor:wait; opacity:.65; } .form-note { margin:13px 0 0; color:#8192ad; font-size:11px; line-height:1.5; } .form-status { min-height:20px; margin:13px 0 0; color:#9ceefa; font-size:13px; line-height:1.45; } .form-status.error { color:#ffb5c0; }
    .foot { display:flex; justify-content:space-between; gap:20px; color:#71829e; font-size:12px; } .foot a { text-underline-offset:4px; }
    @media (max-width:760px) { .shell { width:min(100% - 32px,560px); } main { display:block; min-height:0; padding:72px 0 64px; } h1 { font-size:clamp(48px,15vw,68px); } .lede { font-size:16px; } .form-zone { margin-top:62px; } .cursor { right:28px; } .foot { flex-direction:column; } } @media (max-width:440px) { .input-row { display:block; } button { width:100%; min-height:46px; margin-top:9px; } }
  </style>
</head>
<body>
  <div class="shell">
    <nav class="nav"><a class="wordmark" href="/"><span class="mark"></span>diya</a><a href="/privacy">privacy at a glance</a></nav>
    <main>
      <section>
        <p class="eyebrow">Early access for Windows</p>
        <h1>Your screen is the <em>prompt.</em></h1>
        <p class="lede">Diya lives quietly near your cursor. Press a hotkey, ask out loud, and get the next step drawn directly on the tool you are already using.</p>
        <div class="signals"><span>One explicit screen at a time</span><span>A guide, not a floating chat</span><span>Agents wait for approval</span></div>
      </section>
      <section class="form-zone" aria-labelledby="access-title">
        <span class="cursor" aria-hidden="true"></span>
        <h2 class="form-copy" id="access-title">Get a beta invite.</h2>
        <form id="waitlist" novalidate>
          <label for="email">Email</label>
          <div class="input-row"><input id="email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" required><button type="submit">Request access</button></div>
          <p class="form-note">We use this email only to reply about the Diya beta. It is encrypted at rest and never becomes part of your screen context.</p>
          <p class="form-status" id="status" aria-live="polite"></p>
        </form>
      </section>
    </main>
    <footer class="foot"><span>Diya helps you move through unfamiliar software without leaving the moment.</span><span>Built for deliberate, approval-first work.</span></footer>
  </div>
  <script>
    const form = document.querySelector('#waitlist'); const email = document.querySelector('#email'); const status = document.querySelector('#status'); const button = form.querySelector('button');
    form.addEventListener('submit', async (event) => { event.preventDefault(); const value = email.value.trim(); if (!email.validity.valid) { status.textContent = 'Enter a valid email address.'; status.className = 'form-status error'; email.focus(); return; } button.disabled = true; status.textContent = 'Saving your request…'; status.className = 'form-status'; try { const response = await fetch('/v1/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: value }) }); if (!response.ok) throw new Error(); email.value = ''; status.textContent = 'You’re on the list. We’ll be in touch about early access.'; } catch { status.textContent = 'That did not go through. Please try again shortly.'; status.className = 'form-status error'; } finally { button.disabled = false; } });
  </script>
</body>
</html>`;
}

export function privacyPage() {
  return `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Diya privacy at a glance</title>
<style>:root{font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#eaf2ff;background:#09101f}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 82% 8%,#264a8a26,transparent 28rem),#09101f}.page{width:min(760px,calc(100% - 40px));margin:0 auto;padding:56px 0 80px}a{color:#a5eefa;text-underline-offset:4px}.brand{color:#fff;font-weight:800;text-decoration:none}h1{margin:42px 0 12px;font-size:clamp(38px,8vw,62px);letter-spacing:-.065em}p,li{color:#b7c5dc;line-height:1.65}.intro{font-size:18px}.items{display:grid;gap:14px;margin:32px 0}.item{padding:20px;border:1px solid #afc8f92b;border-radius:18px;background:#ffffff05}.item h2{margin:0 0 7px;color:#fff;font-size:17px}.item p{margin:0}.small{margin-top:35px;color:#8191aa;font-size:13px}</style>
<main class="page"><a class="brand" href="/">← diya</a><h1>Privacy at a glance.</h1><p class="intro">Diya is designed around explicit context: it does not silently record your screen in the background.</p><section class="items"><article class="item"><h2>Screen context</h2><p>Diya captures a screen only after you use its hotkey. Diya Cloud forwards that image for the active guide request with response storage disabled, then discards it from process memory. It does not retain screenshots, questions, or model answers.</p></article><article class="item"><h2>Early-access email</h2><p>If you request beta access here, Diya Cloud stores your email encrypted at rest plus a keyed duplicate-prevention fingerprint. The email is used only to reply about the beta.</p></article><article class="item"><h2>Connected tools</h2><p>Optional Gmail and Notion tokens are encrypted at rest. Diya asks for approval before any connected action; Gmail support creates drafts rather than sending email.</p></article></section><p class="small">This page describes the current Diya beta implementation. Product, support, and legal details should be finalized before a broad public launch.</p></main>`;
}
