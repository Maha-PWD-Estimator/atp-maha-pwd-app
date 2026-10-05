/* ═══════════════════════════════════════════════════════════════════════
   atp_browse.js — Browse Estimates (privacy + kami Firestore reads)

   Load order: atp_main.js → atp_secondary.js → atp_browse.js

   Data model
   ──────────
   estimateIndex/{estId}   (halka doc — fakt list sathi)
     name, grand, nItems, div, ownerUid, ownerName, updatedAt,
     isPrivate (true/false/absent=public), allowedUids[] (grant kelelyanche uid)

   estimateRequests/{estId_requesterUid}
     estId, estTitle, ownerUid, ownerName, requesterUid, requesterName,
     requesterEmail, status ('pending'|'granted'|'denied'), createdMs, decidedMs
     (hya fields cha vapar atp_secondary.js madhle bell/notification code kartoy)

   Reads
   ─────
   • Tab ughadlyavar: fakt estimateIndex cha 1 page (PAGE docs), session madhe cache.
   • Refresh / Load more dabla tarach parat read.
   • Full estimate (estimates/{id}) fakt "Load" dabla tarach vachto (1 read).
   • Search = already load zalelya rows madhe (0 reads).
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var PAGE = 20;                 /* ek veli kiti rows vachaychya */
  var TTL  = 10 * 60 * 1000;     /* cache 10 min — tab parat ughadla tar read nahi */

  var ST = { rows: [], cursor: null, more: false, loadedAt: 0, busy: false, local: {}, uid: null };

  function $(id){ return document.getElementById(id); }
  function me(){ return (window.CU && window.CU.uid) || null; }
  function ownerLabel(){ var u = window.CU || {}; return u.displayName || u.email || u.phoneNumber || 'User'; }
  function fdb(){ return firebase.firestore(); }
  function ok(){ return !!(me() && window.firebase && firebase.firestore); }
  function toast(m, t){ if (typeof showToast === 'function') showToast(m, t || 'info'); }
  function e(s){ return (typeof esc === 'function') ? esc(s) : String(s == null ? '' : s).replace(/[&<>]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]; }); }
  function ea(s){ return (typeof escAttr === 'function') ? escAttr(s) : e(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function n(x){ return (typeof fmtN === 'function') ? fmtN(x) : Number(x || 0).toLocaleString('en-IN'); }

  /* ── 1) INDEX SYNC — estimate save zalyavar halka index doc update (1 write) ── */
  window.atpIdxSync = function(estId, d){
    try{
      if (!estId || !d || !ok()) return;
      var cov = d.cover || {};
      var obj = {
        name: d.name || 'Untitled',
        grand: d.grand || 0,
        nItems: (d.items && d.items.length) || 0,
        div: cov.pDiv || '',
        ownerUid: me(),
        ownerName: ownerLabel(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      /* isPrivate fakt tevha lihito jevha d madhe explicit aahe (nahitar junya setting la haat lavat nahi) */
      if (d.isPrivate === true || d.isPrivate === false) obj.isPrivate = d.isPrivate;
      fdb().collection('estimateIndex').doc(estId).set(obj, { merge: true }).catch(function(){});
    }catch(_e){}
  };

  window.atpIdxRemove = function(estId){
    try{ if (estId && ok()) fdb().collection('estimateIndex').doc(estId).delete().catch(function(){}); }catch(_e){}
  };

  /* ── 2) Private / Public toggle (My Saved Estimates list madhun) ── */
  window.atpTogglePrivate = function(estId, btn){
    if (!ok()) { toast('Login first', 'warn'); return; }
    var cur = btn && btn.getAttribute('data-priv') === '1';
    var next = !cur;
    if (btn) btn.disabled = true;
    fdb().collection('estimates').doc(estId).update({ isPrivate: next }).then(function(){
      var cache = (window._cloudCache && window._cloudCache[estId]) || {};
      var d = Object.assign({}, cache, { isPrivate: next });
      window.atpIdxSync(estId, d);
      if (window._cloudCache && window._cloudCache[estId]) window._cloudCache[estId].isPrivate = next;
      if (btn) {
        btn.setAttribute('data-priv', next ? '1' : '0');
        btn.textContent = next ? '\uD83D\uDD12' : '\uD83C\uDF10';
        btn.title = next ? 'Private — dusryanna request karavi lagel' : 'Public — Browse madhun direct Load hoil';
        btn.disabled = false;
      }
      toast(next ? '\uD83D\uDD12 Private kela — Browse madhe nav disel, pan access sathi request lagel'
                 : '\uD83C\uDF10 Public kela — Browse madhun koni pan Load karu shakel', 'success');
    }).catch(function(err){
      if (btn) btn.disabled = false;
      toast('Failed: ' + (err && err.message || err), 'error');
    });
  };

  /* ── 3) Ekda-ch self-backfill: junya estimates cha index banvto (per user, per device) ── */
  function selfBackfill(){
    var k = 'atpIdxBF1_' + me();
    try{ if (localStorage.getItem(k)) return; }catch(_e){}
    fdb().collection('estimates').where('uid', '==', me()).get().then(function(snap){
      var docs = []; snap.forEach(function(d){ docs.push(d); });
      var chunks = []; for (var i = 0; i < docs.length; i += 400) chunks.push(docs.slice(i, i + 400));
      return chunks.reduce(function(p, ch){
        return p.then(function(){
          var b = fdb().batch();
          ch.forEach(function(d){
            var x = d.data(), cov = x.cover || {};
            var obj = { name: x.name || 'Untitled', grand: x.grand || 0, nItems: (x.items && x.items.length) || 0,
                        div: cov.pDiv || '', ownerUid: me(), ownerName: ownerLabel(),
                        updatedAt: x.updatedAt || firebase.firestore.FieldValue.serverTimestamp() };
            if (x.isPrivate === true) obj.isPrivate = true;
            b.set(fdb().collection('estimateIndex').doc(d.id), obj, { merge: true });
          });
          return b.commit();
        });
      }, Promise.resolve());
    }).then(function(){ try{ localStorage.setItem(k, '1'); }catch(_e){} })
      .catch(function(err){ console.warn('atp index backfill:', err && err.message || err); });
  }

  /* ── 4) Request status (mazya requests) ── */
  function reqStatus(estId){
    /* bell listener cha live data (estimateRequests where requesterUid == me) — extra reads nahit */
    var a = (typeof window.atpGetMyRequests === 'function') ? window.atpGetMyRequests() : [], u = me();
    for (var i = 0; i < a.length; i++) if (a[i].estId === estId && a[i].requesterUid === u) return a[i].status || '';
    return ST.local[estId] || '';   /* listener la update yaychya aadhi: ata-chi request */
  }

  /* ── 5) Render ── */
  function rowById(id){ for (var i = 0; i < ST.rows.length; i++) if (ST.rows[i].id === id) return ST.rows[i]; return null; }

  function rowHTML(r){
    var u = me();
    var priv = r.isPrivate === true;
    var st = reqStatus(r.id);
    var allowed = !priv || (r.allowedUids || []).indexOf(u) >= 0 || st === 'granted';
    var meta = ['\u20B9 ' + n(r.grand), (r.nItems || 0) + ' items'].join(' \u00B7 ');
    var btn;
    if (allowed) {
      btn = '<button class="btn bp" style="font-size:.62rem;padding:.22rem .5rem;flex-shrink:0" data-id="' + ea(r.id) +
            '" onclick="browseLoadEst(this.dataset.id,\'0\')">&#128194; Load</button>';
    } else if (st === 'pending') {
      btn = '<button class="btn bs" disabled style="font-size:.62rem;padding:.22rem .5rem;flex-shrink:0;opacity:.7">&#9203; Request pending</button>';
    } else {
      btn = '<button class="btn bs" style="font-size:.62rem;padding:.22rem .5rem;flex-shrink:0" data-id="' + ea(r.id) +
            '" onclick="atpBrowseRequest(this.dataset.id,this)">&#128273; ' + (st === 'denied' ? 'Request again' : 'Request access') + '</button>';
    }
    return '<div style="background:#fff;border:1px solid #ddd;border-radius:6px;padding:.5rem .7rem;margin-bottom:.4rem;display:flex;align-items:center;gap:.5rem">' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-weight:800;font-size:.72rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
          (priv ? '&#128274; ' : '') + e(r.name || 'Untitled') + '</div>' +
        '<div style="font-size:.6rem;color:#888;margin-top:.1rem">' + e(meta) + '</div>' +
        '<div style="font-size:.58rem;color:#aaa">' + e(r.ownerName || '') +
          (st === 'denied' && !allowed ? ' \u00B7 <span style="color:#c62828">request nakarli hoti</span>' : '') + '</div>' +
      '</div>' + btn + '</div>';
  }

  function render(){
    var el = $('browseList'); if (!el) return;
    var qEl = $('browseQ'), q = qEl ? (qEl.value || '').toLowerCase().trim() : '';
    var rows = q ? ST.rows.filter(function(r){
      return (r.name || '').toLowerCase().indexOf(q) >= 0 || (r.div || '').toLowerCase().indexOf(q) >= 0 ||
             (r.ownerName || '').toLowerCase().indexOf(q) >= 0;
    }) : ST.rows;
    var html;
    if (!rows.length) {
      html = '<div style="text-align:center;padding:1.5rem;color:#aaa;font-style:italic">' +
             (ST.rows.length ? 'No results in loaded list' + (ST.more ? ' \u2014 "Load more" dabun baki list ana' : '') : 'No estimates yet.') + '</div>';
    } else {
      html = rows.map(rowHTML).join('');
    }
    if (ST.more) {
      html += '<div style="text-align:center;margin:.5rem 0"><button class="btn bs" style="font-size:.65rem" onclick="atpBrowseMore()">' +
              '&#11015; Load more</button></div>';
    }
    el.innerHTML = html;
  }

  /* ── 6) Load (page 1) ── */
  function fetchPage(append){
    var list = $('browseList'); if (!list) return Promise.resolve();
    ST.busy = true;
    if (!append) list.innerHTML = '<div style="color:var(--mu);padding:.8rem;text-align:center">Loading...</div>';
    var q = fdb().collection('estimateIndex').orderBy('updatedAt', 'desc').limit(PAGE);
    if (append && ST.cursor) q = q.startAfter(ST.cursor);
    return q.get().then(function(snap){
      var u = me();
      if (!append) ST.rows = [];
      snap.forEach(function(d){
        var x = d.data();
        if (x.ownerUid === u) return;              /* swatachi estimates Browse madhe nako */
        x.id = d.id; ST.rows.push(x);
      });
      ST.cursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : ST.cursor;
      ST.more = snap.docs.length === PAGE;
      ST.loadedAt = Date.now(); ST.uid = u;
      render();
    }).catch(function(err){
      list.innerHTML = '<div style="color:#c00;padding:.5rem">Error: ' + e(err && err.message || err) + '</div>';
    }).then(function(){ ST.busy = false; });
  }

  /* force=true → Refresh button; force nasel tar fresh cache vaprto (0 reads) */
  window.atpBrowseLoad = function(force){
    var list = $('browseList'); if (!list) return;
    if (!ok()) {
      list.innerHTML = "<div style='color:var(--mu);padding:.8rem;text-align:center'>Please login to browse estimates</div>";
      return;
    }
    if (ST.busy) return;
    var fresh = ST.uid === me() && ST.loadedAt && (Date.now() - ST.loadedAt) < TTL;
    if (force !== true && fresh) { render(); return; }
    selfBackfill();
    fetchPage(false);
  };

  window.atpBrowseMore = function(){ if (ok() && !ST.busy && ST.more) fetchPage(true); };

  /* tab ughadlyavar goTab → loadBrowse() (atp_main.js) */
  window.loadBrowse = function(){ window.atpBrowseLoad(false); };

  /* search box: 0 reads, fakt loaded rows filter */
  window.browseSearch = function(){ render(); };
  window.atpBrowseRender = function(){ if (ST.rows.length) render(); };

  /* ── 7) Request access (private estimate) ── */
  window.atpBrowseRequest = function(estId, btn){
    if (!ok()) { toast('Login first to request access', 'warn'); return; }
    var r = rowById(estId); if (!r) return;
    if (btn) btn.disabled = true;
    var u = window.CU;
    fdb().collection('estimateRequests').doc(estId + '_' + me()).set({
      estId: estId, estTitle: r.name || '', ownerUid: r.ownerUid, ownerName: r.ownerName || '',
      requesterUid: me(), requesterName: ownerLabel(), requesterEmail: u.email || '',
      status: 'pending', createdMs: Date.now()
    }).then(function(){
      ST.local[estId] = 'pending';
      toast('\u2705 Request pathavali. Owner ne grant kela ki notification yeil.', 'success');
      render();
    }).catch(function(err){
      if (btn) btn.disabled = false;
      toast('Request failed: ' + (err && err.message || err), 'error');
    });
  };

  /* login badalyavar cache clear */
  try{
    if (window.firebase && firebase.auth) firebase.auth().onAuthStateChanged(function(){ ST.rows = []; ST.loadedAt = 0; ST.local = {}; ST.uid = null; });
  }catch(_e){}
})();
