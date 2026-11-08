/* ═══════════════════════════════════════════════════════════════
   online_presence.js  —  Live users (actually using the app) for Admin
   Load AFTER atp_secondary.js :  <script src="online_presence.js"></script>

   How it works
   • Every logged-in (non-admin) user writes presence/{uid} once a minute,
     BUT only while the tab is visible AND the user touched/typed/scrolled
     in the last 2 minutes.  Logged-in-but-idle users do NOT refresh it.
   • Admin dashboard shows:  🟢 Active now · 🟡 Idle (logged in, not using)
     + a verdict "Safe to update?" and the names of active users.
   Firestore rule needed:  see bottom of this file.
   ═══════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
  var BEAT_MS = 60*1000;        /* heartbeat interval              */
  var ACTIVE_WINDOW = 2*60*1000;/* user counts as "using" if input within this */
  var LIVE_MS = 150*1000;       /* admin: lastActive newer than this = Active now */
  var IDLE_MS = 10*60*1000;     /* admin: older than this = ignore (gone)         */
  var POLL_MS = 30*1000;        /* admin refresh                   */

  function fs(){ return (window.firebase && firebase.firestore) ? firebase.firestore() : null; }
  function isAdmin(u){ return !!(u && typeof ADMIN_EMAIL!=="undefined" && u.email===ADMIN_EMAIL); }
  function el(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  /* ───────────── USER SIDE: heartbeat ───────────── */
  var lastInput = Date.now(), lastState = "", beatTimer = null, user = null;

  function markInput(){ lastInput = Date.now(); }
  ["pointerdown","keydown","touchstart","scroll","input","wheel"].forEach(function(ev){
    window.addEventListener(ev, markInput, {passive:true, capture:true});
  });

  function displayName(u){ return u.displayName || u.phoneNumber || u.email || (u.uid||"").slice(0,6); }

  function write(state){
    var db = fs(); if(!db || !user) return;
    if(window._FS_QUOTA_HIT) return;               /* respect existing quota guard */
    var data = {uid:user.uid, name:displayName(user), state:state,
                beat:firebase.firestore.FieldValue.serverTimestamp()};
    if(state==="active") data.lastActive = firebase.firestore.FieldValue.serverTimestamp();
    db.collection("presence").doc(user.uid).set(data,{merge:true}).catch(function(){});
    lastState = state;
  }

  function beat(){
    if(!user) return;
    var using = !document.hidden && (Date.now()-lastInput) < ACTIVE_WINDOW;
    if(using) write("active");
    else if(lastState!=="idle") write("idle");     /* write idle only once, saves quota */
  }

  function startBeat(u){
    stopBeat(); user = u; lastInput = Date.now(); lastState = "";
    beat();
    beatTimer = setInterval(beat, BEAT_MS);
  }
  function stopBeat(){
    if(beatTimer){ clearInterval(beatTimer); beatTimer=null; }
    if(user && lastState!=="offline") write("offline");
    user = null;
  }

  document.addEventListener("visibilitychange", function(){
    if(!user) return;
    if(document.hidden){ if(lastState!=="idle") write("idle"); }
    else { markInput(); beat(); }
  });
  window.addEventListener("pagehide", function(){ if(user && lastState!=="offline") write("offline"); });

  /* ───────────── ADMIN SIDE: widget ───────────── */
  var pollTimer = null;

  function ensureBox(){
    if(el("livePresenceBox")) return el("livePresenceBox");
    var stats = el("aStats"); if(!stats || !stats.parentNode) return null;
    var box = document.createElement("div");
    box.id = "livePresenceBox";
    box.style.cssText = "margin:.6rem 0;padding:.7rem .9rem;border-radius:10px;background:#f5f9f6;border:1px solid #cfe3d5;font-size:.75rem";
    box.innerHTML = "<div style='color:#888'>Live users loading…</div>";
    stats.parentNode.insertBefore(box, stats);
    return box;
  }

  function ts(v){ return v && v.toMillis ? v.toMillis() : (v && v.seconds ? v.seconds*1000 : 0); }

  function render(docs){
    var box = ensureBox(); if(!box) return;
    var now = Date.now(), active = [], idle = [];
    docs.forEach(function(d){
      if(d.state==="offline") return;
      var la = ts(d.lastActive), age = now - la;
      if(d.state==="active" && age <= LIVE_MS) active.push(d);
      else if(age <= IDLE_MS) idle.push(d);
    });
    active.sort(function(a,b){ return ts(b.lastActive)-ts(a.lastActive); });
    var safe = active.length===0;
    var verdict = safe
      ? "<span style='background:#18602f;color:#fff;border-radius:6px;padding:.15rem .5rem;font-weight:800'>✅ Update karayla safe</span>"
      : "<span style='background:#c62828;color:#fff;border-radius:6px;padding:.15rem .5rem;font-weight:800'>⚠️ "+active.length+" user vaprat aahet — thamba</span>";
    var names = active.map(function(d){
      var secs = Math.max(0, Math.round((now-ts(d.lastActive))/1000));
      return esc(d.name||d.uid.slice(0,6))+" <span style='color:#999'>("+(secs<60?secs+"s":Math.round(secs/60)+"m")+" ago)</span>";
    }).join(" · ");
    box.innerHTML =
      "<div style='display:flex;gap:1.2rem;align-items:center;flex-wrap:wrap'>"+
        "<div><div style='font-size:1.5rem;font-weight:800;color:#18602f'>🟢 "+active.length+"</div><div style='color:#666'>Active now (vaprat aahet)</div></div>"+
        "<div><div style='font-size:1.5rem;font-weight:800;color:#b8860b'>🟡 "+idle.length+"</div><div style='color:#666'>Idle (login aahet, vaprat nahit)</div></div>"+
        "<div style='margin-left:auto'>"+verdict+"</div>"+
      "</div>"+
      (names?"<div style='margin-top:.45rem;color:#333'>"+names+"</div>":"")+
      "<div style='margin-top:.3rem;font-size:.6rem;color:#aaa'>Auto-refresh 30s · Active = last 2.5 min madhe touch/type kele</div>";
  }

  function poll(){
    var db = fs(); if(!db) return;
    var dash = el("adminDash");
    if(!dash || dash.offsetParent===null) return;          /* admin dashboard not visible */
    if(!ensureBox()) return;
    var since = firebase.firestore.Timestamp.fromMillis(Date.now()-IDLE_MS);
    db.collection("presence").where("beat",">",since).get().then(function(snap){
      var out=[]; snap.forEach(function(d){ out.push(d.data()); });
      render(out);
    }).catch(function(e){
      var box = ensureBox();
      if(box) box.innerHTML = "<div style='color:#c0392b'>Live users: "+esc(e.message||e)+"<br><span style='font-size:.62rem;color:#888'>Firestore rules madhe <b>presence</b> collection allow kara (file chya khali rule dilay).</span></div>";
    });
  }

  function startAdminPoll(){
    if(pollTimer) return;
    poll(); pollTimer = setInterval(poll, POLL_MS);
  }
  function stopAdminPoll(){ if(pollTimer){ clearInterval(pollTimer); pollTimer=null; } }

  /* ───────────── wiring ───────────── */
  function init(){
    if(!window.firebase || !firebase.auth){ return setTimeout(init, 500); }
    firebase.auth().onAuthStateChanged(function(u){
      if(u){
        if(isAdmin(u)){ stopBeat(); startAdminPoll(); }   /* admin is not counted as a user */
        else { stopAdminPoll(); startBeat(u); }
      } else {
        stopAdminPoll();
        stopBeat();
      }
    });
  }
  init();
})();

/* ─────────────────────────────────────────────────────────────
   FIRESTORE RULES — add inside  match /databases/{database}/documents { ... }

   match /presence/{uid} {
     allow write: if request.auth != null && request.auth.uid == uid;
     allow read:  if request.auth != null
                  && request.auth.token.email == "thongeaditya@gmail.com";
   }
   ───────────────────────────────────────────────────────────── */
