/* ============================================================
   ATP MAHA PWD — ESTIMATE MARKETPLACE MODULE
   Self-contained. Does NOT touch goTab()/tab-index system.
   Requires globals already defined in atp_secondary.js:
     CU (current firebase user), G(id), showToast(msg,type)
   Requires firebase app already initialized (firebase.firestore()).
   ============================================================ */

var MP_ADMIN_EMAIL = 'thongeaditya@gmail.com';
var MP_ADMIN_WHATSAPP = '918975962565'; // country code + number, no + or spaces

var MP_TIERS = [
  { id:'t10l',  label:'10L पर्यंत',   max:1000000,  base:100 },
  { id:'t25l',  label:'10L–25L',      max:2500000,  base:175 },
  { id:'t50l',  label:'25L–50L',      max:5000000,  base:300 },
  { id:'t1cr',  label:'50L–1Cr',      max:10000000, base:500 },
  { id:'bid',   label:'1Cr+ (Bidding)', max:null,   base:null }
];

function mpDb(){ return firebase.firestore(); }
function mpFV(){ return firebase.firestore.FieldValue; }
function mpIsAdmin(){ return CU && CU.email === MP_ADMIN_EMAIL; }

function mpPayAmount(base){ return Math.round(base * 1.10); }   // requestor pays base+10%
function mpPayoutAmount(base){ return Math.round(base * 0.95); } // estimator gets base-5%

/* ---------- Anonymous IDs ---------- */
function mpRandCode(prefix){
  return prefix + '-' + (1000 + Math.floor(Math.random()*9000));
}

function mpEnsureEstimatorProfile(uid){
  var ref = mpDb().collection('estimatorProfiles').doc(uid);
  return ref.get().then(function(d){
    if(d.exists) return d.data();
    var prof = {
      anonId: mpRandCode('EST'),
      totalDelivered: 0,
      ratingSum: 0,
      ratingCount: 0,
      avgRating: 0,
      badge: 'New',
      createdAt: mpFV().serverTimestamp()
    };
    return ref.set(prof).then(function(){ return prof; });
  });
}

function mpEnsureRequestorProfile(uid){
  var ref = mpDb().collection('requestorProfiles').doc(uid);
  return ref.get().then(function(d){
    if(d.exists) return d.data();
    var prof = {
      anonId: mpRandCode('REQ'),
      totalPosted: 0,
      ratingSum: 0,
      ratingCount: 0,
      avgRating: 0,
      unfairRejectCount: 0,
      createdAt: mpFV().serverTimestamp()
    };
    return ref.set(prof).then(function(){ return prof; });
  });
}

function mpComputeBadge(totalDelivered, avgRating){
  if(totalDelivered >= 30 && avgRating >= 4) return '🥇 Gold';
  if(totalDelivered >= 11 && avgRating >= 3.5) return '🥈 Silver';
  if(totalDelivered >= 1) return '🥉 Bronze';
  return '🆕 New';
}

/* ---------- Contact-info filter for chat ---------- */
function mpFilterContact(text){
  var flagged = false;
  var clean = text;
  // 10-digit indian mobile, with/without +91, spaces, dashes, dots
  var phoneRe = /(\+?91[\s\-\.]?)?\b\d[\d\s\-\.]{8,12}\d\b/g;
  if(phoneRe.test(clean)){ flagged = true; clean = clean.replace(phoneRe,'[hidden]'); }
  var emailRe = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  if(emailRe.test(clean)){ flagged = true; clean = clean.replace(emailRe,'[hidden]'); }
  var kwRe = /(whatsapp|whats app|telegram|insta(gram)?|फोन|नंबर|call\s*me|dm\s*me)/gi;
  if(kwRe.test(clean)){ flagged = true; }
  return { clean: clean, flagged: flagged };
}

/* ============================================================
   UI SHELL
   ============================================================ */
function mpInjectStyles(){
  if(G('mpStyles')) return;
  var s = document.createElement('style');
  s.id = 'mpStyles';
  s.textContent =
    '#mpModal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;align-items:center;justify-content:center;padding:1rem}'+
    '#mpBox{background:#fff;border-radius:12px;width:100%;max-width:720px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;font-family:inherit}'+
    '#mpHdr{background:#18602f;color:#fff;padding:.8rem 1rem;display:flex;align-items:center;gap:.6rem}'+
    '#mpHdr b{font-size:.95rem;flex:1}'+
    '#mpHdr button{background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer}'+
    '#mpSubTabs{display:flex;gap:.3rem;padding:.5rem .7rem;border-bottom:1px solid #eee;flex-wrap:wrap}'+
    '.mpST{padding:.3rem .7rem;border-radius:16px;background:#f2f2f2;font-size:.72rem;font-weight:700;cursor:pointer;color:#333}'+
    '.mpST.on{background:#18602f;color:#fff}'+
    '#mpBody{padding:.8rem 1rem;overflow-y:auto;flex:1;font-size:.78rem}'+
    '.mpCard{border:1px solid #e0e0e0;border-radius:9px;padding:.6rem .75rem;margin-bottom:.5rem;background:#fafafa}'+
    '.mpBadge{font-size:.6rem;padding:.12rem .45rem;border-radius:9px;background:#e8f5e9;color:#18602f;font-weight:800;margin-left:.3rem}'+
    '.mpBtn{padding:.35rem .8rem;border:none;border-radius:6px;background:#18602f;color:#fff;font-weight:800;font-size:.72rem;cursor:pointer}'+
    '.mpBtn.red{background:#c62828}'+
    '.mpBtn.gray{background:#888}'+
    '.mpRow{display:flex;gap:.4rem;flex-wrap:wrap;align-items:center}'+
    '#mpBody input,#mpBody select,#mpBody textarea{width:100%;padding:.4rem;border:1px solid #ccc;border-radius:6px;font-size:.76rem;margin:.2rem 0}'+
    '.mpChatWrap{max-height:220px;overflow-y:auto;border:1px solid #eee;border-radius:8px;padding:.5rem;background:#fff;margin:.4rem 0}'+
    '.mpMsg{margin-bottom:.35rem;padding:.35rem .55rem;border-radius:8px;font-size:.73rem;max-width:80%}'+
    '.mpMsg.me{background:#e8f5e9;margin-left:auto}'+
    '.mpMsg.them{background:#f0f0f0}';
  document.head.appendChild(s);
}

function openMarketplace(){
  mpInjectStyles();
  if(!CU){ showToast('कृपया आधी लॉगिन करा','error'); return; }
  var m = G('mpModal');
  if(!m){
    m = document.createElement('div');
    m.id = 'mpModal';
    m.innerHTML =
      '<div id="mpBox">'+
        '<div id="mpHdr"><b>🤝 Estimate Marketplace</b><button onclick="mpClose()">✕</button></div>'+
        '<div id="mpSubTabs"></div>'+
        '<div id="mpBody">Loading...</div>'+
      '</div>';
    document.body.appendChild(m);
  }
  m.style.display = 'flex';
  mpEnsureEstimatorProfile(CU.uid);
  mpEnsureRequestorProfile(CU.uid);
  mpShowRoleScreen();
}
function mpClose(){ var m=G('mpModal'); if(m) m.style.display='none'; }

/* ---------- Role selection (asked every time modal opens) ---------- */
function mpShowRoleScreen(){
  G('mpSubTabs').innerHTML = '';
  var body = G('mpBody');
  body.innerHTML =
    '<div style="text-align:center;padding:1.2rem .5rem">'+
      '<div style="font-size:.85rem;font-weight:700;margin-bottom:1rem">तुम्ही कोण आहात?</div>'+
      '<div class="mpRow" style="justify-content:center;gap:.8rem">'+
        '<button class="mpBtn" style="padding:.7rem 1.2rem;font-size:.8rem" onclick="mpSetRole(\'requestor\')">🙋 मला Estimate हवा आहे<br><span style="font-weight:400;font-size:.65rem">(Requestor)</span></button>'+
        '<button class="mpBtn" style="padding:.7rem 1.2rem;font-size:.8rem;background:#1565c0" onclick="mpSetRole(\'estimator\')">🛠 मी Estimate करून देतो<br><span style="font-weight:400;font-size:.65rem">(Estimator)</span></button>'+
      '</div>'+
    '</div>';
}
function mpSetRole(role){
  MP_ROLE = role;
  mpRenderSubTabs(role);
  mpGoSub(role==='requestor' ? 'post' : 'jobs');
}
var MP_ROLE = null;

function mpRenderSubTabs(role){
  var wrap = G('mpSubTabs');
  var tabs = role==='requestor'
    ? [['post','📝 Request Post करा'],['myreq','📋 माझे Requests']]
    : [['jobs','🔎 उपलब्ध Jobs'],['myjobs','🛠 माझी घेतलेली कामं']];
  wrap.innerHTML = '';
  tabs.forEach(function(t){
    var b = document.createElement('div');
    b.className = 'mpST'; b.textContent = t[1];
    b.onclick = function(){ mpGoSub(t[0]); };
    b.id = 'mpST_'+t[0];
    wrap.appendChild(b);
  });
  var sw = document.createElement('div');
  sw.className = 'mpST'; sw.style.background='#eee'; sw.style.marginLeft='auto';
  sw.textContent = '🔄 भूमिका बदला';
  sw.onclick = mpShowRoleScreen;
  wrap.appendChild(sw);
}
function mpGoSub(id){
  document.querySelectorAll('.mpST').forEach(function(e){e.classList.remove('on');});
  var el = G('mpST_'+id); if(el) el.classList.add('on');
  if(id==='post') mpRenderPost();
  else if(id==='myreq') mpRenderMyRequests();
  else if(id==='jobs') mpRenderOpenJobs();
  else if(id==='myjobs') mpRenderMyJobs();
}

/* ============================================================
   1) POST A REQUEST (Requestor)
   ============================================================ */
function mpRenderPost(){
  var body = G('mpBody');
  var opts = MP_TIERS.map(function(t){
    return '<option value="'+t.id+'">'+t.label+(t.base?' — Pay ₹'+mpPayAmount(t.base):' — Bidding')+'</option>';
  }).join('');
  body.innerHTML =
    '<div class="mpCard">'+
      '<b>Estimate Value Tier</b>'+
      '<select id="mpTier">'+opts+'</select>'+
      '<div id="mpTierNote" style="color:#888;font-size:.68rem;margin-top:.2rem"></div>'+
      '<b>कामाचे नाव / Scope</b>'+
      '<textarea id="mpScope" rows="3" placeholder="उदा. Excavation, Soling 80mm, M10, M20 — Road length/width, location, विशेष अटी..."></textarea>'+
      '<b>Deadline</b>'+
      '<input type="date" id="mpDeadline">'+
      '<label class="mpRow" style="margin-top:.3rem"><input type="checkbox" id="mpHeavy" style="width:auto"> जड फाईल्स (drawing/survey) पाठवाव्या लागतील</label>'+
      '<div id="mpHeavyNote" style="display:none;color:#c62828;font-size:.68rem;margin:.2rem 0">जड फाईल्स Admin च्या WhatsApp वर पाठवा (📱 +91 89759 62565) — Request post केल्यावर.</div>'+
      '<button class="mpBtn" style="margin-top:.5rem" onclick="mpSubmitPost()">Request Post करा</button>'+
    '</div>';
  G('mpTier').onchange = mpUpdateTierNote;
  G('mpHeavy').onchange = function(){ G('mpHeavyNote').style.display = this.checked?'block':'none'; };
  mpUpdateTierNote();
}
function mpUpdateTierNote(){
  var tid = G('mpTier').value;
  var t = MP_TIERS.filter(function(x){return x.id===tid;})[0];
  var note = G('mpTierNote');
  if(t.base){
    note.textContent = 'तुम्हाला भरायचे: ₹'+mpPayAmount(t.base)+' (base ₹'+t.base+' + platform fee ₹'+(mpPayAmount(t.base)-t.base)+')';
  }else{
    note.textContent = 'Sealed bidding — Estimators त्यांचा दर टाकतील, तुम्हाला व Admin ला फक्त दिसेल. निवडलेल्या दरावर +10% भरावे लागेल.';
  }
}
function mpSubmitPost(){
  var tid = G('mpTier').value;
  var t = MP_TIERS.filter(function(x){return x.id===tid;})[0];
  var scope = G('mpScope').value.trim();
  var deadline = G('mpDeadline').value;
  var heavy = G('mpHeavy').checked;
  if(!scope){ showToast('Scope/description टाका','error'); return; }
  var isBidding = !t.base;
  mpDb().collection('marketReqs').add({
    postedBy: CU.uid,
    tier: tid, tierLabel: t.label,
    type: isBidding?'bidding':'fixed',
    basePrice: t.base || null,
    payAmount: t.base ? mpPayAmount(t.base) : null,
    payoutAmount: t.base ? mpPayoutAmount(t.base) : null,
    scope: scope, deadline: deadline||'', heavyDocs: heavy,
    status: isBidding ? 'bidding-open' : 'open',
    excludedEstimators: [],
    selectedEstimator: null,
    createdAt: mpFV().serverTimestamp()
  }).then(function(){
    showToast('Request post झाला ✅'+(heavy?' — जड फाईल्स WhatsApp वर पाठवायला विसरू नका.':''),'success');
    mpGoSub('myreq');
  }).catch(function(e){ showToast('Error: '+e.message,'error'); });
}

/* ============================================================
   2) MY REQUESTS (Requestor side — manage)
   ============================================================ */
function mpRenderMyRequests(){
  var body = G('mpBody');
  body.innerHTML = 'Loading...';
  mpDb().collection('marketReqs').where('postedBy','==',CU.uid).orderBy('createdAt','desc').limit(30).get()
    .then(function(snap){
      if(snap.empty){ body.innerHTML = '<div style="color:#888">अजून कोणतीही request नाही.</div>'; return; }
      body.innerHTML = '';
      snap.forEach(function(d){ mpRenderReqCard(d.id, d.data(), 'requestor', body); });
    }).catch(function(e){ body.innerHTML = 'Error: '+e.message; });
}

function mpStatusLabel(s){
  var map = {
    'open':'🟡 खुली (applications येत आहेत)',
    'bidding-open':'🟡 Bidding सुरू',
    'assigned':'🔵 Estimator नेमला',
    'ready-for-payment':'💰 Payment करायचं आहे',
    'payment-pending-verification':'⏳ Payment verify होत आहे',
    'payment-verified':'✅ Payment verified — काम सुरू',
    'delivered':'📦 Estimate मिळाला — तपासा',
    'requestor-satisfied':'👍 Satisfied — Payout बाकी',
    'payout-done':'🏁 पूर्ण झालं',
    'reassign-needed':'⚠️ नवीन Estimator निवडा'
  };
  return map[s]||s;
}

function mpRenderReqCard(id, r, viewerRole, container){
  var card = document.createElement('div');
  card.className = 'mpCard';
  var amt = r.type==='bidding' ? '(Bidding)' : ('₹'+r.payAmount);
  card.innerHTML =
    '<div class="mpRow" style="justify-content:space-between">'+
      '<b>'+(r.tierLabel||'')+' '+amt+'</b>'+
      '<span class="mpBadge">'+mpStatusLabel(r.status)+'</span>'+
    '</div>'+
    '<div style="margin:.3rem 0;color:#444">'+ (r.scope||'').substring(0,140) +'</div>'+
    '<div id="mpDetail_'+id+'"></div>';
  container.appendChild(card);
  var detail = card.querySelector('#mpDetail_'+id);

  if(viewerRole==='requestor'){
    if(r.status==='open' || r.status==='bidding-open' || r.status==='reassign-needed'){
      var btn = document.createElement('button');
      btn.className='mpBtn'; btn.textContent='Applications बघा';
      btn.onclick=function(){ mpShowApplications(id, r, detail); };
      detail.appendChild(btn);
    }
    if(r.status==='ready-for-payment'){
      detail.innerHTML =
        '<div style="background:#fff8e1;padding:.5rem;border-radius:6px;margin:.3rem 0">'+
        'Amount to Pay: <b>₹'+r.payAmount+'</b><br>'+
        'QR ने pay करा, नंतर screenshot खालील WhatsApp वर पाठवा:<br>'+
        '<a href="https://wa.me/'+MP_ADMIN_WHATSAPP+'?text='+encodeURIComponent('Payment screenshot for Request ID: '+id)+'" target="_blank">📱 Admin ला WhatsApp करा</a>'+
        '</div>'+
        '<button class="mpBtn" onclick="mpMarkPaySent(\''+id+'\')">मी Screenshot पाठवला ✅</button>';
    }
    if(r.status==='delivered'){
      var b2=document.createElement('button');
      b2.className='mpBtn'; b2.textContent='Estimate बघा + Satisfied ✅';
      b2.onclick=function(){ mpShowDelivery(id, r, detail); };
      detail.appendChild(b2);
    }
    if(r.status==='assigned' || r.status==='payment-verified'){
      var b3=document.createElement('button');
      b3.className='mpBtn'; b3.textContent='💬 Chat';
      b3.onclick=function(){ mpShowChat(id, r, 'requestor', detail); };
      detail.appendChild(b3);
      var b4=document.createElement('button');
      b4.className='mpBtn red'; b4.style.marginLeft='.3rem'; b4.textContent='Estimator बदला (अपात्र)';
      b4.onclick=function(){ mpReassign(id, r.selectedEstimator); };
      detail.appendChild(b4);
    }
  }
}

function mpShowApplications(reqId, r, container){
  container.innerHTML = 'Loading applications...';
  mpDb().collection('marketReqs').doc(reqId).collection('applications').get().then(function(snap){
    if(snap.empty){ container.innerHTML='<div style="color:#888">अजून कोणीही apply केलेलं नाही.</div>'; return; }
    container.innerHTML='';
    snap.forEach(function(d){
      var a = d.data();
      if((r.excludedEstimators||[]).indexOf(d.id)>-1) return;
      var row = document.createElement('div');
      row.style.cssText='border:1px solid #ddd;border-radius:7px;padding:.4rem .6rem;margin:.3rem 0;background:#fff';
      row.innerHTML =
        '<b>'+a.anonId+'</b> '+
        '<span class="mpBadge">'+a.badge+'</span> '+
        '<span style="color:#888;font-size:.68rem">'+a.totalDelivered+' estimates दिले · ⭐ '+(a.avgRating||0).toFixed(1)+'</span>'+
        (r.type==='bidding' ? ('<div style="margin-top:.2rem">Bid: <b>₹'+a.bidAmount+'</b></div>') : '')+
        (a.message ? ('<div style="margin-top:.2rem;color:#555;font-size:.7rem">"'+a.message+'"</div>') : '');
      var pick = document.createElement('button');
      pick.className='mpBtn'; pick.style.marginTop='.3rem'; pick.textContent='यांना निवडा';
      pick.onclick=function(){ mpSelectEstimator(reqId, d.id, a); };
      row.appendChild(pick);
      container.appendChild(row);
    });
  });
}

function mpSelectEstimator(reqId, estUid, appData){
  var updates = { status:'assigned', selectedEstimator: estUid, assignedAt: mpFV().serverTimestamp() };
  if(appData && appData.bidAmount){
    updates.basePrice = appData.bidAmount;
    updates.payAmount = mpPayAmount(appData.bidAmount);
    updates.payoutAmount = mpPayoutAmount(appData.bidAmount);
  }
  mpDb().collection('marketReqs').doc(reqId).update(updates).then(function(){
    showToast('Estimator नेमला ✅','success');
    mpGoSub('myreq');
  }).catch(function(e){ showToast('Error: '+e.message,'error'); });
}

function mpReassign(reqId, badEstUid){
  if(!confirm('हा Estimator काढून नवीन निवडायचा?')) return;
  mpDb().collection('marketReqs').doc(reqId).update({
    status:'reassign-needed',
    selectedEstimator: null,
    excludedEstimators: mpFV().arrayUnion(badEstUid)
  }).then(function(){ showToast('काढलं — नवीन निवडा','info'); mpGoSub('myreq'); });
}

function mpMarkPaySent(reqId){
  mpDb().collection('marketReqs').doc(reqId).update({
    status:'payment-pending-verification', paySentAt: mpFV().serverTimestamp()
  }).then(function(){ showToast('Admin verify करेल — 15 मिनिटांत','info'); mpGoSub('myreq'); });
}

function mpShowDelivery(reqId, r, container){
  container.innerHTML = '<div class="mpCard">'+
    (r.deliveryNote?('<div style="white-space:pre-wrap">'+r.deliveryNote+'</div>'):'')+
    (r.deliveryLink?('<div><a href="'+r.deliveryLink+'" target="_blank">📎 Estimate उघडा</a></div>'):'')+
    '</div>'+
    '<div class="mpRow" style="margin-top:.4rem">Rating: <span id="mpStars">★★★★★</span></div>'+
    '<input type="hidden" id="mpRateVal" value="5">'+
    '<button class="mpBtn" onclick="mpSatisfyAndRate(\''+reqId+'\')">Satisfied ✅ आणि Rating द्या</button>';
  var stars = container.querySelector('#mpStars');
  stars.style.cursor='pointer'; stars.style.fontSize='1.1rem'; stars.style.color='#f5a623';
  stars.onclick = function(ev){
    var rect = stars.getBoundingClientRect();
    var pct = (ev.clientX-rect.left)/rect.width;
    var val = Math.max(1, Math.ceil(pct*5));
    container.querySelector('#mpRateVal').value = val;
    stars.textContent = '★★★★★'.substring(0,val) + '☆☆☆☆☆'.substring(0,5-val);
  };
}
function mpSatisfyAndRate(reqId){
  var val = parseInt(G('mpRateVal') ? G('mpRateVal').value : (document.getElementById('mpRateVal').value), 10) || 5;
  var reqRef = mpDb().collection('marketReqs').doc(reqId);
  reqRef.get().then(function(d){
    var r = d.data();
    var estRef = mpDb().collection('estimatorProfiles').doc(r.selectedEstimator);
    return mpDb().runTransaction(function(tx){
      return tx.get(estRef).then(function(ed){
        var p = ed.data();
        var newCount = (p.ratingCount||0)+1;
        var newSum = (p.ratingSum||0)+val;
        var newAvg = newSum/newCount;
        var newDelivered = (p.totalDelivered||0)+1;
        tx.update(estRef, {
          ratingCount:newCount, ratingSum:newSum, avgRating:newAvg,
          totalDelivered:newDelivered, badge: mpComputeBadge(newDelivered,newAvg)
        });
        tx.update(reqRef, { status:'requestor-satisfied', satisfiedAt: mpFV().serverTimestamp(), requestorRating: val });
      });
    });
  }).then(function(){
    showToast('धन्यवाद! Admin आता payout करेल.','success');
    mpGoSub('myreq');
  }).catch(function(e){ showToast('Error: '+e.message,'error'); });
}

/* ============================================================
   3) OPEN JOBS (Estimator — browse & apply)
   ============================================================ */
function mpRenderOpenJobs(){
  var body = G('mpBody');
  body.innerHTML = 'Loading...';
  mpDb().collection('marketReqs')
    .where('status','in',['open','bidding-open','reassign-needed'])
    .orderBy('createdAt','desc').limit(30).get()
    .then(function(snap){
      if(snap.empty){ body.innerHTML='<div style="color:#888">सध्या कोणतीही open job नाही.</div>'; return; }
      body.innerHTML='';
      snap.forEach(function(d){
        var r = d.data();
        if(r.postedBy===CU.uid) return; // own request
        if((r.excludedEstimators||[]).indexOf(CU.uid)>-1) return;
        var card = document.createElement('div');
        card.className='mpCard';
        var amt = r.type==='bidding' ? 'Bidding' : ('Payout: ₹'+r.payoutAmount);
        card.innerHTML =
          '<div class="mpRow" style="justify-content:space-between"><b>'+r.tierLabel+'</b><span class="mpBadge">'+amt+'</span></div>'+
          '<div style="margin:.3rem 0;color:#444">'+(r.scope||'').substring(0,160)+'</div>'+
          '<div style="color:#888;font-size:.68rem">Deadline: '+(r.deadline||'—')+'</div>';
        var applyBox = document.createElement('div');
        applyBox.style.marginTop='.4rem';
        if(r.type==='bidding'){
          applyBox.innerHTML = '<input type="number" placeholder="तुमचा दर ₹" id="mpBid_'+d.id+'"><textarea rows="2" placeholder="Message (optional)" id="mpMsg_'+d.id+'"></textarea>';
        }else{
          applyBox.innerHTML = '<textarea rows="2" placeholder="Message (optional)" id="mpMsg_'+d.id+'"></textarea>';
        }
        var btn = document.createElement('button');
        btn.className='mpBtn'; btn.textContent='Apply करा';
        btn.onclick=function(){ mpApply(d.id, r); };
        applyBox.appendChild(btn);
        card.appendChild(applyBox);
        body.appendChild(card);
      });
    }).catch(function(e){ body.innerHTML='Error: '+e.message; });
}

function mpApply(reqId, r){
  mpEnsureEstimatorProfile(CU.uid).then(function(prof){
    var data = {
      anonId: prof.anonId, badge: prof.badge,
      totalDelivered: prof.totalDelivered, avgRating: prof.avgRating,
      message: (G('mpMsg_'+reqId)?G('mpMsg_'+reqId).value:'').trim(),
      appliedAt: mpFV().serverTimestamp()
    };
    if(r.type==='bidding'){
      var bidEl = G('mpBid_'+reqId);
      var bid = bidEl ? parseFloat(bidEl.value) : NaN;
      if(!bid || bid<=0){ showToast('दर टाका','error'); return; }
      data.bidAmount = bid;
    }
    mpDb().collection('marketReqs').doc(reqId).collection('applications').doc(CU.uid).set(data)
      .then(function(){ showToast('Apply झालं ✅','success'); })
      .catch(function(e){ showToast('Error: '+e.message,'error'); });
  });
}

/* ============================================================
   4) MY JOBS (Estimator — assigned/in-progress)
   ============================================================ */
function mpRenderMyJobs(){
  var body = G('mpBody');
  body.innerHTML = 'Loading...';
  mpDb().collection('marketReqs').where('selectedEstimator','==',CU.uid).orderBy('createdAt','desc').limit(30).get()
    .then(function(snap){
      if(snap.empty){ body.innerHTML='<div style="color:#888">अजून कोणतंही काम नेमलेलं नाही.</div>'; return; }
      body.innerHTML='';
      snap.forEach(function(d){
        var r = d.data();
        var card = document.createElement('div');
        card.className='mpCard';
        card.innerHTML =
          '<div class="mpRow" style="justify-content:space-between"><b>'+r.tierLabel+' — You get ₹'+r.payoutAmount+'</b><span class="mpBadge">'+mpStatusLabel(r.status)+'</span></div>'+
          '<div style="margin:.3rem 0;color:#444">'+(r.scope||'').substring(0,160)+'</div>'+
          '<div id="mpJobDetail_'+d.id+'"></div>';
        body.appendChild(card);
        var detail = card.querySelector('#mpJobDetail_'+d.id);
        if(r.status==='assigned'){
          var b1=document.createElement('button'); b1.className='mpBtn'; b1.textContent='💬 Chat';
          b1.onclick=function(){ mpShowChat(d.id, r, 'estimator', detail); }; detail.appendChild(b1);
          var b2=document.createElement('button'); b2.className='mpBtn'; b2.style.marginLeft='.3rem'; b2.textContent='Estimate Ready ✅';
          b2.onclick=function(){ mpMarkReady(d.id); }; detail.appendChild(b2);
        }
        if(r.status==='payment-verified'){
          detail.innerHTML =
            '<div style="background:#e8f5e9;padding:.4rem;border-radius:6px;margin-bottom:.3rem">Payment received with admin — तुम्ही estimate deliver करू शकता.</div>'+
            '<textarea rows="2" placeholder="Delivery note" id="mpDelNote_'+d.id+'"></textarea>'+
            '<input placeholder="Link (Drive/PDF), असल्यास" id="mpDelLink_'+d.id+'">'+
            '<button class="mpBtn" onclick="mpDeliver(\''+d.id+'\')">Deliver करा</button>';
        }
        if(r.status==='payout-done' && !r.estimatorRatedRequestor){
          var b3=document.createElement('button'); b3.className='mpBtn'; b3.textContent='Requestor ला Rate करा';
          b3.onclick=function(){ mpRateRequestorPrompt(d.id, r); }; detail.appendChild(b3);
        }
      });
    }).catch(function(e){ body.innerHTML='Error: '+e.message; });
}

function mpMarkReady(reqId){
  mpDb().collection('marketReqs').doc(reqId).update({ status:'ready-for-payment' })
    .then(function(){ showToast('Requestor ला payment साठी कळवलं','success'); mpGoSub('myjobs'); });
}

function mpDeliver(reqId){
  var note = G('mpDelNote_'+reqId) ? G('mpDelNote_'+reqId).value : '';
  var link = G('mpDelLink_'+reqId) ? G('mpDelLink_'+reqId).value : '';
  mpDb().collection('marketReqs').doc(reqId).update({
    status:'delivered', deliveryNote: note, deliveryLink: link, deliveredAt: mpFV().serverTimestamp()
  }).then(function(){ showToast('Deliver झालं ✅','success'); mpGoSub('myjobs'); });
}

function mpRateRequestorPrompt(reqId, r){
  var val = prompt('Requestor ला Rating द्या (1-5):','5');
  val = parseInt(val,10);
  if(!val || val<1 || val>5) return;
  var unfair = confirm('या Requestor ने काम unfairly reject केलं का? (OK = हो, Cancel = नाही)');
  var reqUid = r.postedBy;
  var reqProfRef = mpDb().collection('requestorProfiles').doc(reqUid);
  mpDb().runTransaction(function(tx){
    return tx.get(reqProfRef).then(function(pd){
      var p = pd.data()||{ratingSum:0,ratingCount:0,unfairRejectCount:0};
      tx.update(reqProfRef, {
        ratingSum:(p.ratingSum||0)+val, ratingCount:(p.ratingCount||0)+1,
        avgRating: ((p.ratingSum||0)+val)/((p.ratingCount||0)+1),
        unfairRejectCount: (p.unfairRejectCount||0)+(unfair?1:0)
      });
      tx.update(mpDb().collection('marketReqs').doc(reqId), { estimatorRatedRequestor:true });
    });
  }).then(function(){ showToast('Rating दिलं ✅','success'); mpGoSub('myjobs'); });
}

/* ============================================================
   CHAT (contact-info filtered, only postedBy + selectedEstimator + admin)
   ============================================================ */
function mpShowChat(reqId, r, myRole, container){
  container.innerHTML =
    '<div class="mpChatWrap" id="mpChatWrap_'+reqId+'">Loading...</div>'+
    '<div class="mpRow"><input id="mpChatIn_'+reqId+'" placeholder="Message लिहा (contact info आपोआप लपेल)"><button class="mpBtn" onclick="mpSendChat(\''+reqId+'\',\''+myRole+'\')">पाठवा</button></div>';
  mpDb().collection('marketReqs').doc(reqId).collection('chat').orderBy('createdAt','asc').limit(100)
    .onSnapshot(function(snap){
      var wrap = G('mpChatWrap_'+reqId);
      if(!wrap) return;
      wrap.innerHTML='';
      snap.forEach(function(d){
        var m = d.data();
        var mine = m.senderUid===CU.uid;
        var b = document.createElement('div');
        b.className='mpMsg '+(mine?'me':'them');
        b.textContent = m.text;
        wrap.appendChild(b);
      });
      wrap.scrollTop = wrap.scrollHeight;
    });
}
function mpSendChat(reqId, myRole){
  var inp = G('mpChatIn_'+reqId);
  var raw = inp.value.trim();
  if(!raw) return;
  var f = mpFilterContact(raw);
  mpDb().collection('marketReqs').doc(reqId).collection('chat').add({
    senderUid: CU.uid, role: myRole, text: f.clean, flagged: f.flagged,
    createdAt: mpFV().serverTimestamp()
  }).then(function(){ inp.value=''; if(f.flagged) showToast('Contact info लपवलं गेलं','info'); });
}

/* ============================================================
   ADMIN — rendered inside the real Admin Dashboard (asec-mkt),
   NOT inside the user-facing openMarketplace() modal.
   Called from atp_secondary.js's aShowSec('mkt').
   ============================================================ */
function mpRenderAdminSection(body){
  if(!body) body = G('asec-mkt');
  if(!body) return;
  mpInjectStyles();
  body.innerHTML = 'Loading...';
  mpDb().collection('marketReqs').orderBy('createdAt','desc').limit(50).get().then(function(snap){
    body.innerHTML='';
    snap.forEach(function(d){
      var r = d.data();
      var card = document.createElement('div');
      card.className='mpCard';
      card.innerHTML =
        '<div class="mpRow" style="justify-content:space-between"><b>'+d.id.substring(0,8)+'</b><span class="mpBadge">'+mpStatusLabel(r.status)+'</span></div>'+
        '<div style="font-size:.7rem;color:#555">'+(r.tierLabel||'')+' · Pay ₹'+(r.payAmount||'-')+' · Payout ₹'+(r.payoutAmount||'-')+'</div>';
      if(r.status==='payment-pending-verification'){
        var b1=document.createElement('button'); b1.className='mpBtn'; b1.textContent='Payment Verify केलं ✅';
        b1.onclick=function(){ mpDb().collection('marketReqs').doc(d.id).update({status:'payment-verified',paymentVerifiedAt:mpFV().serverTimestamp()}).then(function(){showToast('Verified','success');mpRenderAdminSection();}); };
        card.appendChild(b1);
      }
      if(r.status==='requestor-satisfied'){
        var b2=document.createElement('button'); b2.className='mpBtn'; b2.textContent='Payout केलं ✅ (₹'+r.payoutAmount+')';
        b2.onclick=function(){ mpDb().collection('marketReqs').doc(d.id).update({status:'payout-done',payoutDoneAt:mpFV().serverTimestamp()}).then(function(){showToast('Payout marked','success');mpRenderAdminSection();}); };
        card.appendChild(b2);
      }
      if(r.status==='assigned' || r.status==='ready-for-payment' || r.status==='payment-verified'){
        var b3=document.createElement('button'); b3.className='mpBtn red'; b3.textContent='Reassign करा (अपात्र Estimator)';
        b3.onclick=function(){ mpReassign(d.id, r.selectedEstimator); };
        card.appendChild(b3);
      }
      body.appendChild(card);
    });
  });
}
