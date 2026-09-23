/* Real offline check, run with: node test-offline.mjs
   Installs the app in a fresh headless Chrome, then stops the server — which is
   what airplane mode does to it — clears the browser's own HTTP cache so only
   the service worker can answer, and opens the app again. Run once plainly and
   once after visiting reset.html, which used to replace the offline copy of the
   app with the reset page. Needs Google Chrome; skips without it. */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const CHROME = ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find(existsSync);
if (!CHROME) { console.log("offline: skipped — no Chrome found"); process.exit(0) }
const dir = fileURLToPath(new URL(".", import.meta.url));
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run(visitResetFirst) {
  const PORT = 8900 + Math.floor(Math.random() * 90), DBG = 9300 + Math.floor(Math.random() * 90), base = `http://localhost:${PORT}/`;
  const server = spawn("python3", ["-m", "http.server", String(PORT), "--directory", dir], { stdio: "ignore" });
  const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "dd-chrome-"))}`, `--remote-debugging-port=${DBG}`, "about:blank"], { stdio: "ignore" });
  try {
    let target;
    for (let i = 0; i < 100 && !target; i++) {         // up to 20s: a previous Chrome may still be exiting
      await sleep(200);
      try { target = (await (await fetch(`http://localhost:${DBG}/json/list`)).json()).find(t => t.type === "page") } catch {}
    }
    if (!target) throw new Error("Chrome did not start");
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener("open", r, { once: true }));
    let seq = 0; const waiting = new Map(), events = [];
    ws.addEventListener("message", m => {
      const d = JSON.parse(m.data);
      if (d.id && waiting.has(d.id)) { waiting.get(d.id)(d); waiting.delete(d.id) } else if (d.method) events.push(d.method);
    });
    const cdp = (method, params = {}) => new Promise(r => { const id = ++seq; waiting.set(id, r); ws.send(JSON.stringify({ id, method, params })) });
    const js = async e => (await cdp("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
    const go = async url => { events.length = 0; await cdp("Page.navigate", { url }); for (let i = 0; i < 60 && !events.includes("Page.loadEventFired"); i++) await sleep(100); await sleep(400) };

    await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Network.enable");
    await go(base);
    for (let i = 0; i < 50 && !(await js(`navigator.serviceWorker.getRegistration().then(r=>!!(r&&r.active))`)); i++) await sleep(200);
    if (visitResetFirst) await go(base + "reset.html");
    await cdp("Network.clearBrowserCache");
    server.kill(); await sleep(500);
    await go(base);
    return (await js("document.title")) === "Day Desk" && (await js("!!document.getElementById('habits')"));
  } finally { server.kill(); chrome.kill() }
}

const plain = await run(false), afterReset = await run(true);
console.log(`offline: app opens with no network ${plain ? "✓" : "✗"} · and after visiting reset.html ${afterReset ? "✓" : "✗"}`);
process.exit(plain && afterReset ? 0 : 1);
