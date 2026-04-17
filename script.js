/* ===== Firebase init ===== */
try {
  const firebaseConfig = {
    apiKey: "AIzaSyBl0CeDXK9NN_KA4U8zs2A6MpxcX-lSyps",
    authDomain: "caishenrain.firebaseapp.com",
    projectId: "caishenrain",
    storageBucket: "caishenrain.firebasestorage.app",
    messagingSenderId: "474637588644",
    appId: "1:474637588644:web:41875e52b1bf934abb2e31",
    measurementId: "G-FP1ER2SM70"
  };
  if (!window.firebaseAppsInitialized) {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();
    db.settings({ experimentalForceLongPolling: true, useFetchStreams: false });
    window.firebaseAppsInitialized = true;
  }
} catch (err) { console.warn('Firebase init skipped:', err); }

const WORKER_URL = "https://caishen-draw.elynnn598.workers.dev";
const q = new URLSearchParams(location.search);

function detectContext() {
  const h = location.hostname.toLowerCase();
  let companyId = (q.get("c") || q.get("company") || "").toUpperCase();
  let pageId    = q.get("p") || q.get("page") || "";

  if (!companyId) {
    if (h.startsWith("ryb-")) companyId = "RYB";
    else if (h.startsWith("sgb-")) companyId = "SGB";
    else companyId = "LB7";
  }
  if (!pageId) {
    if (/(goldwin|silvermoon|forest)/.test(h)) pageId = "page2";
    else if (/(luckyjade|starfire|mountain)/.test(h)) pageId = "page3";
    else pageId = "page1";
  }
  return { companyId, pageId };
}
const { companyId, pageId } = detectContext();
let gameStarted = false;

/* ===== Company Themes Configuration ===== */
const COMPANY_THEME = {
  LB7: {
    bg: "./vip_bg.png",
    logoOverlay: "https://img.capalangresource.com/images/public/cpwl/banner/WLLB7/GENERAL/banner_20250426050341681.webp",
    caishenSprite: "https://i.postimg.cc/qBDyW26y/00243643-2.png",
    bottomBanner: "https://img.capalangresource.com/images/public/cpwl/slideshow/WLLB7/GENERAL/slideshow_20250426022829742.gif",
    packetImg: "https://i.postimg.cc/kXdsTx0s/f-IXA1-MLNWD.png",
    coinImg: "https://i.postimg.cc/3RdRN4mb/Screenshot-2025-08-10-010039-1.png",
    cssClass: "theme-lb7"
  },
  RYB: {
    bg: "./vip_bg.png", 
    logoOverlay: "https://i.postimg.cc/wMnJztTD/RYB-4-1.png",
    caishenSprite: "https://i.postimg.cc/qBDyW26y/00243643-2.png",
    bottomBanner: "https://i.postimg.cc/NfPCybLx/RYB-3-1.png",
    packetImg: "https://i.postimg.cc/kXdsTx0s/f-IXA1-MLNWD.png",
    coinImg: "https://i.postimg.cc/3RdRN4mb/Screenshot-2025-08-10-010039-1.png",
    cssClass: "theme-ryb"
  },
  SGB: {
    bg: "", // Leave blank for pure CSS luxury gradients
    logoOverlay: "https://singabet.net/images/singabet/logo2.png", 
    caishenSprite: "https://i.postimg.cc/qBDyW26y/00243643-2.png",
    bottomBanner: "https://i.postimg.cc/Hkn6MR7v/329426b2-1880-478e-ad09-cd0cab7fce64-removebg-preview.png", 
    packetImg: "https://i.postimg.cc/kXdsTx0s/f-IXA1-MLNWD.png",
    coinImg: "https://i.postimg.cc/3RdRN4mb/Screenshot-2025-08-10-010039-1.png",
    cssClass: "theme-sgb"
  }
};

let COIN_IMG = "";

function applyTheme() {
  const theme = COMPANY_THEME[companyId] || COMPANY_THEME.LB7;

  document.body.classList.add(theme.cssClass || 'theme-lb7');

  if (theme.bg) document.body.style.setProperty("--bg-url", `url('${theme.bg}')`);

  const elLogo = document.getElementById("companyLogo");
  if (elLogo && theme.logoOverlay) {
    elLogo.src = theme.logoOverlay;
  }

  const elCai = document.getElementById("caishen");
  if (elCai && theme.caishenSprite) elCai.style.backgroundImage = `url('${theme.caishenSprite}')`;

  const elBottom = document.getElementById("bottomBanner");
  if (elBottom && theme.bottomBanner) {
    elBottom.style.backgroundImage = `url('${theme.bottomBanner}')`;
  }

  const elPacket = document.getElementById("bigRedPacket");
  if (elPacket && theme.packetImg) elPacket.style.backgroundImage = `url('${theme.packetImg}')`;

  COIN_IMG = theme.coinImg || COIN_IMG;

  if (q.get("staff")==="8899") {
    const tag = document.createElement("div");
    tag.textContent = `${companyId} · ${pageId}`;
    Object.assign(tag.style,{
      position:"fixed",right:"8px",bottom:"8px",padding:"6px 10px",
      background:"rgba(0,0,0,.6)",color:"#fff",borderRadius:"8px",fontSize:"12px",zIndex:9999
    });
    document.body.appendChild(tag);
  }
}

/* ===== Date Utilities & Restrictions ===== */
function getKLDate(){
  return new Date(new Date().toLocaleString('en-US',{ timeZone:'Asia/Kuala_Lumpur' }));
}

function getTodayString() {
    const date = getKLDate();
    return date.getFullYear() + "-" + (date.getMonth() + 1).toString().padStart(2, '0') + "-" + date.getDate().toString().padStart(2, '0');
}

function getClaimStorageKey() {
    return 'claimed_' + companyId + '_' + getTodayString();
}

function hasClaimedToday() {
    return localStorage.getItem(getClaimStorageKey()) === '1';
}

/* ===== Shift+R: Clean up ===== */
document.addEventListener("keydown", function(e) {
  if (e.shiftKey && e.key.toLowerCase() === "r") {
    try { sessionStorage.setItem('forceUnlock', '1'); } catch {}
    localStorage.clear();
    location.reload();
  }
});

const COMPANY_OPEN_DAY = { LB7: 3, SGB: 2, RYB: 5 };
const WEEKDAY_NAME = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function isCompanyOpenToday(companyId){
  const target = COMPANY_OPEN_DAY[companyId] ?? 3;
  return getKLDate().getDay() === target;
}

function nextCompanyOpenZero(companyId){
  const target = COMPANY_OPEN_DAY[companyId] ?? 3;
  const now = getKLDate();
  const add = ((target - now.getDay()) + 7) % 7 || 7; 
  const d = new Date(now);
  d.setDate(now.getDate() + add);
  d.setHours(0,0,0,0);
  return d;
}

function formatCountdown(ms){
  const s = Math.max(0, Math.floor(ms/1000));
  const d = Math.floor(s/86400), h = Math.floor((s%86400)/3600), m = Math.floor((s%3600)/60), sec = s%60;
  const parts = [];
  if(d) parts.push(d+"d"); if(h||parts.length) parts.push(h+"h"); if(m||parts.length) parts.push(m+"m"); parts.push(sec+"s");
  return parts.join(" ");
}

/* ===== Notice gating ===== */
function setupNotice(){
  const overlay = document.getElementById('noticeOverlay');
  const msg = document.getElementById('unlockMsg');
  const btn = document.getElementById('startBtn');
  const packet = document.getElementById('bigRedPacket');

  const forced = sessionStorage.getItem('forceUnlock') === '1';

  if (hasClaimedToday() && !forced) {
      msg.textContent = `You have already claimed your angpao today. Come back tomorrow!`;
      btn.disabled = true;
  } else {
      msg.textContent = forced
        ? 'Test mode — unlocked via Shift+R'
        : `Tap Start to play!`;
      btn.disabled = false;
      btn.onclick = ()=>{
        gameStarted = true;
        overlay.style.display = 'none';
        packet.classList.remove('disabled');
        const bg = document.getElementById('bgMusic');
        if(bg){ bg.volume = 0.5; bg.play().catch(()=>{}); }
        try { sessionStorage.removeItem('forceUnlock'); } catch {}
      };
  }
}

/* ===== Animations ===== */
function animateNumber(el, target, duration = 1600, onDone){
  target = Number(target) || 0;
  const fmt = new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  let from = parseFloat((el.textContent||'').replace(/[^0-9.\-]/g,'')); if (isNaN(from)) from = 0;
  const start = performance.now();
  const tick = (now)=>{
    const p = Math.min((now-start)/duration, 1);
    const e = 1 - Math.pow(1 - p, 3);
    const val = from + (target - from)*e;
    el.textContent = fmt.format(val);
    if (p < 1) requestAnimationFrame(tick); else { el.textContent = fmt.format(target); onDone && onDone(); }
  };
  requestAnimationFrame(tick);
}

function fadeOutAndStopAudio(audio, durationMs = 1200) {
  if (!audio) return;
  const startVol = audio.volume ?? 1;
  const start = performance.now();
  function step(t) {
    const p = Math.min((t - start) / durationMs, 1);
    const v = startVol * (1 - p);
    audio.volume = Math.max(0, v);
    if (p < 1) requestAnimationFrame(step);
    else { audio.pause(); audio.currentTime = 0; audio.volume = startVol; }
  }
  requestAnimationFrame(step);
}

/* ===== Open packet ===== */
async function openRedPacket(){
  if (!gameStarted) return;
  const big = document.getElementById('bigRedPacket');
  if (!big || big.dataset.lock === '1') return;
  
  if (hasClaimedToday()) { 
      alert('Reward already claimed for today.'); 
      return; 
  }

  big.dataset.lock = '1';
  big.classList.add('opening');

  const openSnd = document.getElementById('openSound');
  if(openSnd){ openSnd.currentTime = 0; openSnd.play().catch(()=>{}); }

  const rect = big.getBoundingClientRect();
  createConfetti(rect.left + rect.width/2, rect.top + rect.height*0.35);

  let reward, captchaCode;
  try {
    const resp = await fetch(`${WORKER_URL}/draw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, pageId })
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Service error');
    reward = data.amount; captchaCode = data.code;
  } catch (e) {
    big.dataset.lock = '0';
    big.classList.remove('opening');
    alert('Service busy, try again.');
    return;
  }

  const bg = document.getElementById('bgMusic');
  fadeOutAndStopAudio(bg, 1200);

  try {
    if (window.db && captchaCode) {
      await db.collection("companies").doc(companyId)
        .collection("pages").doc(pageId)
        .collection("rewards").doc(captchaCode)
        .set({
          companyId,
          pageId,
          rewardAmount: reward,
          captchaCode,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          ua: navigator.userAgent || ''
        });
    }
  } catch (logErr) {
    console.warn("Firestore log failed:", logErr);
  }

  const popup = document.getElementById('rewardPopup');
  const numberEl = document.getElementById('rewardNumber');
  const captchaEl = document.getElementById('captchaCode');
  popup.style.display = 'block';
  captchaEl.style.display = 'none';
  
  animateNumber(numberEl, Number(reward), 1600, ()=>{
    captchaEl.textContent = `Verification Code: ${captchaCode}`;
    captchaEl.dataset.code = captchaCode;
    captchaEl.style.display = 'block';
  });
  
  // Set the specific storage key for TODAY
  localStorage.setItem(getClaimStorageKey(), '1');
  big.style.pointerEvents = 'none';
}

/* ===== Coin particles ===== */
function createConfetti(cx, cy){
  const pieces = 16;
  for (let i=0;i<pieces;i++){
    const el = document.createElement('div');
    el.className = 'coin';
    const angle = (Math.PI*2) * (i/pieces) + (Math.random()*0.8-0.4);
    const distance = 100 + Math.random()*90;
    const dx = Math.cos(angle)*distance;
    const dy = Math.sin(angle)*distance;
    const r = Math.floor(Math.random()*360) + 'deg';
    el.style.setProperty('--img', `url(${COIN_IMG})`);
    el.style.setProperty('--x', cx + 'px');
    el.style.setProperty('--y', cy + 'px');
    el.style.setProperty('--dx', dx + 'px');
    el.style.setProperty('--dy', dy + 'px');
    el.style.setProperty('--r', r);
    document.body.appendChild(el);
    el.addEventListener('animationend', ()=> el.remove());
  }
}

/* ===== Copy code ===== */
function copyCode(){
  const el = document.getElementById('captchaCode');
  const code = el?.dataset?.code;
  if (!code) return;
  if (navigator.clipboard && window.isSecureContext){
    navigator.clipboard.writeText(code).then(()=> alert('Verification code copied'));
  }
}

/* ===== Hidden dev unlock (gesture + PIN) ===== */
(function(){
  const btn = document.getElementById('devUnlockBtn');
  if(!btn) return;

  const isLocal = ['localhost','127.0.0.1','::1'].includes(location.hostname) || location.protocol === 'file:';
  const DEV_PIN = '741852'; 

  function reveal(){ btn.style.display='block'; btn.setAttribute('aria-hidden','false'); }
  if (isLocal) reveal();

  let taps = 0, firstTapAt = 0;
  const tryTap = ()=>{
    const now = performance.now();
    if (now - firstTapAt > 1500) { taps = 0; firstTapAt = now; }
    if (taps === 0) firstTapAt = now;
    taps++;
    if (taps >= 7) {
      taps = 0;
      const input = prompt('Developer PIN');
      if (input && input === DEV_PIN) reveal();
    }
  };
  ['noticeOverlay','bigRedPacket','caishen'].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', tryTap, true);
  });
  document.addEventListener('click', tryTap, true);

  btn.addEventListener('click', ()=>{
    try { sessionStorage.setItem('forceUnlock','1'); } catch {}
    localStorage.clear();
    location.reload();
  });
})();

document.addEventListener('DOMContentLoaded', ()=>{
  applyTheme();
  setupNotice();
});
