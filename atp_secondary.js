// Maha PWD Estimator - Secondary Functions (DEDUPLICATED)
// Note: याआधी या file मध्ये जवळपास 1500 ओळींचा संपूर्ण जुना block डुप्लिकेट होता,
// जो JS मध्ये नंतर define झाल्याने नवीन functions (उदा. Request Notifications) override करत होता.
// आता एकच स्वच्छ, deduplicated version ठेवली आहे.

// Maha PWD Estimator - Secondary Functions


/* ATP MAHA PWD v35 */
var FBCFG={apiKey:"AIzaSyCdH-k3hH1mYYcND0cBf7J2pLRG6xQydrU",authDomain:"atp-maha-pwd.firebaseapp.com",projectId:"atp-maha-pwd",storageBucket:"atp-maha-pwd.firebasestorage.app",messagingSenderId:"382409286731",appId:"1:382409286731:web:37daae9842bc3687bf99ce"};
var ADMIN_EMAIL="thongeaditya@gmail.com",UPI_ID="adityathonge@ybl",UPI_NAME="ATP MAHA PWD";
var CLDN="https://api.cloudinary.com/v1_1/duef21oux/image/upload",CLDN_P="jiko4lod";
var PLAN_PRICE={m:100,y:1000},PLAN_SEL="m",PAY_AMOUNT=100,FREE_LIMIT=5,APP_FREE_LIMIT=5; /* APP_FREE_LIMIT = global default from config/app ONLY (never overwritten by a user doc); FREE_LIMIT = logged-in user's own limit */
var CU=null,IS_PRO=false,DL_COUNT=0,OTP_CFM=null,OTP_TMR=null,AUTO_TMR=null;
var CUR_PAY_ID=null,CUR_EST_ID=null,SS_FILE=null,FB_RDY=false;
var _unsub_pay=null,_unsub_user=null;

/* ── SHARE-LINK deep link (?share=ESTID) — estimate open link ── */
var PENDING_SHARE_ID=(function(){
  try{
    var p=new URLSearchParams(window.location.search);
    return p.get("share")||null;
  }catch(e){return null;}
})();

function G(id){return document.getElementById(id);}
function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function escAttr(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
/* Firestore quota (resource-exhausted) detector — admin la red banner dakhavto */
window._FS_QUOTA_HIT=false;
function _fsIsQuota(x){try{var s=String(x&&(x.code||x.message||x));return /resource-exhausted|quota exceeded|quota limit/i.test(s);}catch(e){return false;}}
function _fsQuotaHit(){
  if(window._FS_QUOTA_HIT)return;window._FS_QUOTA_HIT=true;
  var adm=false;try{adm=(typeof CU!=="undefined"&&CU&&typeof ADMIN_EMAIL!=="undefined"&&CU.email===ADMIN_EMAIL)||sessionStorage.getItem("_adminOpen")==="1";}catch(e){}
  if(!adm)return;
  var b=document.createElement("div");b.id="fsQuotaBanner";
  b.style.cssText="position:fixed;top:0;left:0;right:0;z-index:99999;background:#c62828;color:#fff;padding:.55rem 2.2rem .55rem .8rem;font:700 .78rem/1.4 sans-serif;text-align:center";
  b.innerHTML="\u26A0\uFE0F Firestore free quota (reads/writes) sampli ahe. Daily quota Pacific-time midnight la reset hoto (IST madhe sumare dupari 12:30\u20131:30). Jast vapar asel tar Blaze plan vapra."
    +"<span onclick='this.parentNode.remove()' style='position:absolute;right:.7rem;top:.4rem;cursor:pointer;font-size:1rem'>\u00D7</span>";
  document.body.appendChild(b);
}
window.addEventListener("unhandledrejection",function(e){if(_fsIsQuota(e&&e.reason))_fsQuotaHit();});
["error","warn"].forEach(function(k){var o=console[k];console[k]=function(){try{for(var i=0;i<arguments.length;i++){if(_fsIsQuota(arguments[i])){_fsQuotaHit();break;}}}catch(e){}return o.apply(console,arguments);};});
function fmtN(n){return Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:0});}
function pfN(id){var e=G(id);return e?parseFloat(e.value)||0:0;}

var _tt=null;
function showToast(msg,type){
  var t=G("mainToast");if(!t)return;
  t.textContent=msg;t.className="toast toast-"+(type||"info")+" show";
  clearTimeout(_tt);_tt=setTimeout(function(){t.className="toast";},3500);
}
function showE(id,msg){var e=G(id);if(e){e.textContent=msg;e.style.display="block";}}
function hideE(id){var e=G(id);if(e)e.style.display="none";}

function loadFB(cb){ cb(); }

function loadQR(cb){
  if(window.QRCode){cb();return;}
  var s=document.createElement("script");
  s.src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
  s.onload=cb;s.onerror=function(){cb();};document.head.appendChild(s);
}

function makeQR(){
  if(!window.QRCode)return;
  var url="upi://pay?pa="+UPI_ID+"&pn="+encodeURIComponent(UPI_NAME)+"&am="+PAY_AMOUNT+"&cu=INR&tn=BOQ+Download";
  try{
    G("autoQRDiv").innerHTML="<canvas id=\"qrCv\"></canvas>";
    new QRCode(G("qrCv"),{text:url,width:180,height:180,colorDark:"#18150f",colorLight:"#fff",correctLevel:QRCode.CorrectLevel.H});
  }catch(e){}
}

document.addEventListener("DOMContentLoaded",function(){
  /* FIX: bell/notification functions hya callback chya aat define aahet (function scope).
     Bell cha inline onclick="openReqPanel()" ani header redraw var updateReqBadge baher pahto,
     mhanun window var expose karne zaruri (function declarations hoisted aahet, mhanun ithe chalte). */
  window.openReqPanel=openReqPanel;
  window.updateReqBadge=updateReqBadge;
  window.loadReqNotifList=loadReqNotifList;
  window.approveReq=approveReq;
  window.rejectReq=rejectReq;
  window.atpGetMyRequests=function(){return _decDocs||[];}; /* atp_browse.js sathi: mazya requests cha status */
  if(G("loginShell"))G("loginShell").style.display="flex";
  if(G("appShell"))G("appShell").style.display="none";
  /* Local PWD logo (embedded base64 — no Cloudinary/hosting needed) */
  try{
    if(G("lpHdrLogoImg"))G("lpHdrLogoImg").src=APP_LOGO_B64;
    if(G("lpCardLogoImg"))G("lpCardLogoImg").src=APP_LOGO_B64;
  }catch(e){}
  /* Delay lpLoad to ensure Firebase SDK is ready */
  setTimeout(function(){if(typeof lpLoad==="function")lpLoad();},800);
  if(!window.firebase||!firebase.auth){
    showToast("Firebase not available — check internet","error");
    return;
  }
  
/* ── REQUEST NOTIFICATIONS ──────────────────────────────── */
var REQ_UNSUB=null;
function openReqPanel(){
  var m=document.getElementById('reqNotifModal');
  if(!m){
    m=document.createElement('div');
    m.id='reqNotifModal';
    m.style.cssText='display:flex;position:fixed;inset:0;z-index:9010;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:1rem';
    m.addEventListener('click',function(e){if(e.target===m)m.style.display='none';});
    var box=document.createElement('div');
    box.style.cssText='background:#fff;border-radius:14px;max-width:440px;width:100%;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.4);max-height:88vh;display:flex;flex-direction:column';
    var hdr=document.createElement('div');
    hdr.style.cssText='background:#18602f;color:#fff;padding:.85rem 1.2rem;display:flex;align-items:center;justify-content:space-between;flex-shrink:0';
    var ttl=document.createElement('span');
    ttl.style.cssText='font-size:.88rem;font-weight:900';
    ttl.textContent='🔔 Estimate Access Requests';
    var cls=document.createElement('button');
    cls.textContent='✕';
    cls.style.cssText='background:none;border:none;color:#fff;font-size:1.3rem;cursor:pointer;margin-left:auto;padding:0 .3rem';
    cls.onclick=function(){m.style.display='none';};
    hdr.appendChild(ttl);
    hdr.appendChild(cls);
    var wrap=document.createElement('div');
    wrap.style.cssText='padding:.9rem;overflow-y:auto;font-size:.78rem;flex:1;min-height:80px';
    var nb=document.createElement('div');
    nb.id='reqNotifNew';
    var body=document.createElement('div');
    body.id='reqNotifList';
    body.textContent='Loading...';
    wrap.appendChild(nb);
    wrap.appendChild(body);
    box.appendChild(hdr);
    box.appendChild(wrap);
    m.appendChild(box);
    document.body.appendChild(m);
  }
  m.style.display='flex';
  renderNewReqPanel(true);
  loadReqNotifList();
}
function loadReqNotifList(){
  var list=document.getElementById('reqNotifList');
  if(!list||!CU||!window.firebase||!firebase.firestore)return;
  list.textContent='Loading...';
  firebase.firestore().collection('requests')
    .where('ownerUid','==',CU.uid)
    .orderBy('createdAt','desc')
    .limit(40)
    .get()
    .then(function(snap){
      if(snap.empty){list.textContent='No requests yet.';return;}
      list.innerHTML='';
      snap.forEach(function(d){
        var r=d.data();
        var dt=r.createdAt?new Date(r.createdAt.seconds*1000).toLocaleDateString('en-IN'):'--';
        var sc=r.status==='pending'?'#f57c00':r.status==='approved'?'#18602f':'#c62828';
        var sb=r.status==='pending'?'#fff8e1':r.status==='approved'?'#e8f5e9':'#fde8e8';
        var card=document.createElement('div');
        card.style.cssText='border:1px solid #e0e0e0;border-radius:8px;padding:.62rem .75rem;margin-bottom:.4rem;background:'+sb;
        var row=document.createElement('div');
        row.style.cssText='display:flex;justify-content:space-between;align-items:flex-start;gap:.4rem;margin-bottom:.2rem';
        var nm=document.createElement('strong');
        nm.style.cssText='font-size:.77rem;color:#1a3a2a';
        nm.textContent='👤 '+(r.fromName||r.fromEmail||'Unknown');
        var badge=document.createElement('span');
        badge.style.cssText='font-size:.58rem;padding:.1rem .42rem;border-radius:9px;background:'+sc+';color:#fff;font-weight:800;text-transform:uppercase;flex-shrink:0';
        badge.textContent=r.status;
        row.appendChild(nm);row.appendChild(badge);card.appendChild(row);
        var en=document.createElement('div');
        en.style.cssText='color:#444;font-size:.7rem';
        en.textContent='📋 '+(r.estName||'(unnamed)');
        card.appendChild(en);
        var meta=document.createElement('div');
        meta.style.cssText='color:#888;font-size:.63rem;margin:.1rem 0 .2rem';
        meta.textContent=(r.fromEmail||'')+' · '+dt;
        card.appendChild(meta);
        if(r.status==='pending'){
          var btns=document.createElement('div');
          btns.style.cssText='display:flex;gap:.35rem;margin-top:.3rem';
          var ab=document.createElement('button');
          ab.textContent='✓ Approve';
          ab.style.cssText='flex:1;padding:.3rem;background:#18602f;color:#fff;border:none;border-radius:5px;font-size:.67rem;font-weight:800;cursor:pointer';
          (function(did,eid,em,b){ab.onclick=function(){approveReq(did,eid,em,b);};})(d.id,r.estId||'',r.fromEmail||'',ab);
          var rb=document.createElement('button');
          rb.textContent='✗ Reject';
          rb.style.cssText='flex:1;padding:.3rem;background:#c62828;color:#fff;border:none;border-radius:5px;font-size:.67rem;font-weight:800;cursor:pointer';
          (function(did,b){rb.onclick=function(){rejectReq(did,b);};})(d.id,rb);
          btns.appendChild(ab);btns.appendChild(rb);card.appendChild(btns);
        }
        list.appendChild(card);
      });
    }).catch(function(e){
      list.textContent='Error: '+e.message;
    });
}
function approveReq(reqId,estId,email,btn){
  if(!window.firebase||!firebase.firestore)return;
  btn.disabled=true;btn.textContent='Approving...';
  var db=firebase.firestore();
  Promise.all([
    db.collection('requests').doc(reqId).update({status:'approved',approvedAt:firebase.firestore.FieldValue.serverTimestamp()}),
    (estId&&email)?db.collection('estimates').doc(estId).update({collaborators:firebase.firestore.FieldValue.arrayUnion({email:email,role:'viewer',addedAt:new Date().toISOString()})}):Promise.resolve()
  ]).then(function(){showToast('Approved! '+email+' added.','success');loadReqNotifList();})
  .catch(function(e){showToast('Error: '+e.message,'error');btn.disabled=false;btn.textContent='Approve';});
}
function rejectReq(reqId,btn){
  btn.disabled=true;btn.textContent='...';
  firebase.firestore().collection('requests').doc(reqId)
    .update({status:'rejected',rejectedAt:firebase.firestore.FieldValue.serverTimestamp()})
    .then(function(){showToast('Request rejected.','info');loadReqNotifList();})
    .catch(function(e){showToast('Error: '+e.message,'error');btn.disabled=false;btn.textContent='Reject';});
}
/* ── Bell badge = junya "requests" + navin Browse "estimateRequests" (owner pending) + requester che navin decisions ── */
var REQ_UNSUB_N=null,REQ_UNSUB_D=null;
var _cntOld=0,_cntNew=0,_cntDec=0,_newDocs=[],_decDocs=[],_panelFreshIds={};
function _seenKey(){return 'atpSeenDec_'+(CU?CU.uid:'');}
function _getSeen(){try{return JSON.parse(localStorage.getItem(_seenKey())||'{}')||{};}catch(e){return {};}}
function _setSeen(o){try{localStorage.setItem(_seenKey(),JSON.stringify(o));}catch(e){}}
function _isDecided(r){return r.status==='granted'||r.status==='denied';}
function _isUnseen(r,seen){return _isDecided(r)&&String(seen[r.id])!==String(r.decidedMs||1);}
function updateReqBadge(){
  var total=_cntOld+_cntNew+_cntDec;
  var badge=G("reqBadge");
  if(badge){badge.textContent=total>0?(total>9?"9+":total):"";badge.style.display=total>0?"inline-flex":"none";}
  var b=G("reqBellBtn");
  if(b){
    var tp=[];
    if(_cntNew>0)tp.push("You have a new request for your estimate ("+_cntNew+") \u2014 check the Browse tab");
    if(_cntDec>0)tp.push("You have a reply to your request ("+_cntDec+") \u2014 check the Browse tab");
    if(_cntOld>0)tp.push("Share request ("+_cntOld+") \u2014 bell ughada");
    b.title=tp.length?tp.join("\n"):"Requests";
  }
}
function atpMarkDecisionsSeen(){
  if(!CU)return;
  var seen=_getSeen(),ch=false;
  _decDocs.forEach(function(r){if(_isDecided(r)&&String(seen[r.id])!==String(r.decidedMs||1)){seen[r.id]=r.decidedMs||1;ch=true;}});
  if(ch)_setSeen(seen);
  _cntDec=0;updateReqBadge();
}
window.atpMarkDecisionsSeen=atpMarkDecisionsSeen;
function decideNewReq(rid,act,btn){
  var r=null;_newDocs.forEach(function(x){if(x.id===rid)r=x;});
  if(!r||!window.firebase||!firebase.firestore)return;
  if(btn){btn.disabled=true;}
  var db=firebase.firestore(),rref=db.collection('estimateRequests').doc(rid),p;
  if(act==='grant'){
    var b=db.batch();
    b.update(db.collection('estimateIndex').doc(r.estId),{allowedUids:firebase.firestore.FieldValue.arrayUnion(r.requesterUid)});
    b.update(rref,{status:'granted',decidedMs:Date.now()});
    p=b.commit();
  }else{p=rref.update({status:'denied',decidedMs:Date.now()});}
  p.then(function(){
    showToast(act==='grant'?('\u2705 Access granted: '+(r.requesterName||'')):'Request declined',act==='grant'?'success':'info');
    if(typeof window.atpBrowseLoad==='function'&&G('atpBrowseRoot'))window.atpBrowseLoad();
  }).catch(function(e){showToast('Failed: '+(e&&e.message||e),'error');if(btn)btn.disabled=false;});
}
function renderNewReqPanel(fresh){
  var el=G('reqNotifNew');if(!el)return;
  if(fresh){_panelFreshIds={};var seen=_getSeen();_decDocs.forEach(function(r){if(_isUnseen(r,seen))_panelFreshIds[r.id]=1;});}
  el.innerHTML='';
  function mk(tag,css,txt){var d=document.createElement(tag);if(css)d.style.cssText=css;if(txt!=null)d.textContent=txt;return d;}
  if(_newDocs.length||_decDocs.some(_isDecided)){
    var gb=mk('button','width:100%;padding:.4rem;margin-bottom:.5rem;background:#1a237e;color:#fff;border:none;border-radius:6px;font-size:.7rem;font-weight:800;cursor:pointer','\uD83D\uDCC2 Browse tab ughada');
    gb.onclick=function(){var m=G('reqNotifModal');if(m)m.style.display='none';if(typeof goTab==='function')goTab(14);};
    el.appendChild(gb);
  }
  if(_newDocs.length){
    el.appendChild(mk('div','font-weight:900;font-size:.72rem;color:#1a3a2a;margin:0 0 .35rem','\uD83D\uDD11 Browse access requests ('+_newDocs.length+')'));
    _newDocs.forEach(function(r){
      var card=mk('div','border:1px solid #f9a825;border-radius:8px;padding:.6rem .75rem;margin-bottom:.4rem;background:#fff8e1');
      card.appendChild(mk('strong','font-size:.77rem;color:#1a3a2a','\uD83D\uDC64 '+(r.requesterName||r.requesterEmail||'Unknown')));
      card.appendChild(mk('div','color:#444;font-size:.7rem','\uD83D\uDCCB '+(r.estTitle||'(unnamed)')));
      card.appendChild(mk('div','color:#888;font-size:.63rem;margin:.1rem 0 .2rem',(r.requesterEmail||'')+(r.createdMs?' \u00B7 '+new Date(r.createdMs).toLocaleDateString('en-IN'):'')));
      var btns=mk('div','display:flex;gap:.35rem;margin-top:.3rem');
      var ab=mk('button','flex:1;padding:.3rem;background:#18602f;color:#fff;border:none;border-radius:5px;font-size:.67rem;font-weight:800;cursor:pointer','\u2713 Grant');
      ab.onclick=function(){decideNewReq(r.id,'grant',ab);};
      var rb=mk('button','flex:1;padding:.3rem;background:#c62828;color:#fff;border:none;border-radius:5px;font-size:.67rem;font-weight:800;cursor:pointer','\u2717 Deny');
      rb.onclick=function(){decideNewReq(r.id,'deny',rb);};
      btns.appendChild(ab);btns.appendChild(rb);card.appendChild(btns);el.appendChild(card);
    });
  }
  var dec=_decDocs.filter(_isDecided).sort(function(a,b){return (b.decidedMs||0)-(a.decidedMs||0);}).slice(0,10);
  if(dec.length){
    el.appendChild(mk('div','font-weight:900;font-size:.72rem;color:#1a3a2a;margin:.5rem 0 .35rem','\uD83D\uDCEC Status of your requests'));
    dec.forEach(function(r){
      var ok=r.status==='granted';
      var card=mk('div','border:1px solid #e0e0e0;border-radius:8px;padding:.5rem .75rem;margin-bottom:.35rem;background:'+(ok?'#e8f5e9':'#fde8e8'));
      var row=mk('div','display:flex;justify-content:space-between;gap:.4rem;align-items:flex-start');
      row.appendChild(mk('strong','font-size:.72rem;color:#1a3a2a','\uD83D\uDCCB '+(r.estTitle||'(unnamed)')));
      var tag=mk('span','font-size:.58rem;padding:.1rem .42rem;border-radius:9px;color:#fff;font-weight:800;text-transform:uppercase;flex-shrink:0;background:'+(ok?'#18602f':'#c62828'),(ok?'Granted':'Denied')+(_panelFreshIds[r.id]?' \u00B7 NEW':''));
      row.appendChild(tag);card.appendChild(row);
      card.appendChild(mk('div','color:#666;font-size:.65rem;margin-top:.15rem',ok?('\u2705 '+(r.ownerName||'Owner')+' granted access. You can now use it from Browse.'):('\u2716 '+(r.ownerName||'Owner')+' declined the request.')));
      el.appendChild(card);
    });
    el.appendChild(mk('div','height:.3rem'));
  }
  if(fresh)atpMarkDecisionsSeen();
}
function startReqListener(uid){
  stopReqListener();
  if(!window.firebase||!firebase.firestore)return;
  var db=firebase.firestore();
  /* 1) junya "requests" (share-link flow) */
  var _prevCount=-1;
  REQ_UNSUB=db.collection("requests")
    .where("ownerUid","==",uid)
    .where("status","==","pending")
    .onSnapshot(function(snap){
      var newCount=snap.size;
      _cntOld=newCount;updateReqBadge();
      if(_prevCount>=0&&newCount>_prevCount){
        var newest="";
        snap.docChanges().forEach(function(ch){
          if(ch.type==="added")newest=ch.doc.data().estName||ch.doc.data().fromName||"";
        });
        showToast("\uD83D\uDD14 New request"+(newest?" for: "+newest:"!"),"info");
      }
      _prevCount=newCount;
    },function(e){REQ_UNSUB=null;});
  /* 2) Browse madhle private estimate requests (owner sathi pending) */
  var _firstN=true;
  REQ_UNSUB_N=db.collection("estimateRequests")
    .where("ownerUid","==",uid)
    .where("status","==","pending")
    .onSnapshot(function(snap){
      _newDocs=[];snap.forEach(function(d){var x=d.data();x.id=d.id;_newDocs.push(x);});
      _newDocs.sort(function(a,b){return (b.createdMs||0)-(a.createdMs||0);});
      _cntNew=_newDocs.length;updateReqBadge();
      if(!_firstN){
        snap.docChanges().forEach(function(ch){
          if(ch.type==="added"){var x=ch.doc.data();showToast("\uD83D\uDD14 New request for your estimate: "+(x.estTitle||"")+" \u2014 check the Browse tab","info");}
        });
      }
      _firstN=false;
      var pm=G('reqNotifModal');if(pm&&pm.style.display!=='none')renderNewReqPanel(false);
    },function(e){console.warn("estimateRequests(owner) listener:",e&&e.message||e);REQ_UNSUB_N=null;});
  /* 3) requester sathi: tyachya requests cha decision (granted / denied) */
  var _firstD=true;
  REQ_UNSUB_D=db.collection("estimateRequests")
    .where("requesterUid","==",uid)
    .onSnapshot(function(snap){
      _decDocs=[];snap.forEach(function(d){var x=d.data();x.id=d.id;_decDocs.push(x);});
      var hasKey=false;try{hasKey=localStorage.getItem(_seenKey())!==null;}catch(e){}
      if(_firstD&&!hasKey){ /* pahilyandach: fakt 3 diwsapurvi che junye decisions "seen" — recent grant miss hou naye */
        var cut=Date.now()-3*24*3600*1000,sn={};
        _decDocs.forEach(function(r){if(_isDecided(r)&&(r.decidedMs||0)<cut)sn[r.id]=r.decidedMs||1;});_setSeen(sn);
      }
      var seen=_getSeen(),panelOpen=(G('reqNotifModal')&&G('reqNotifModal').style.display!=='none');
      if(!_firstD){
        snap.docChanges().forEach(function(ch){
          if(ch.type==="removed")return;
          var x=ch.doc.data();
          if(_isDecided(x)&&String(seen[ch.doc.id])!==String(x.decidedMs||1)){
            showToast(x.status==='granted'?("\u2705 Your request was granted: "+(x.estTitle||"")+" \u2014 use it from the Browse tab"):("\u2716 Request declined: "+(x.estTitle||"")),x.status==='granted'?'success':'info');
          }
        });
      }
      _firstD=false;
      try{if(typeof window.atpBrowseRender==='function')window.atpBrowseRender();}catch(_re){} /* grant/deny ala ki Browse list live update (0 reads) */
      if(panelOpen){renderNewReqPanel(true);}
      else{_cntDec=_decDocs.filter(function(r){return _isUnseen(r,seen);}).length;updateReqBadge();}
    },function(e){console.warn("estimateRequests(requester) listener:",e&&e.message||e);REQ_UNSUB_D=null;});
}
function stopReqListener(){
  if(REQ_UNSUB){REQ_UNSUB();REQ_UNSUB=null;}
  if(REQ_UNSUB_N){REQ_UNSUB_N();REQ_UNSUB_N=null;}
  if(REQ_UNSUB_D){REQ_UNSUB_D();REQ_UNSUB_D=null;}
  _cntOld=_cntNew=_cntDec=0;_newDocs=[];_decDocs=[];updateReqBadge();
}
firebase.auth().onAuthStateChanged(function(user){
    if(user){
      CU=user;
      startReqListener(user.uid);loadUserDoc();
      if(typeof mpnStart==="function")mpnStart(user.uid);
      if(G("loginShell"))G("loginShell").style.display="none";
      /* CF Table visible to all users */
      var _t13=G("t13");
      if(_t13){_t13.style.display="";}
      /* Admin refresh restore */
      if(sessionStorage.getItem("_adminOpen")==="1"&&CU.email===ADMIN_EMAIL){
        if(G("appShell"))G("appShell").style.display="none";
        var _aw=G("adminWrap");if(_aw)_aw.style.display="block";
        if(G("adminLoginBox"))G("adminLoginBox").style.display="none";
        if(G("adminDash"))G("adminDash").style.display="block";
        if(G("adminUsr"))G("adminUsr").textContent=CU.email;
        setTimeout(function(){aLoadAll();aLoadCurQR();aStartPayListener();aLoadSettings();},400);
      } else {
        sessionStorage.setItem('_appOpen','1');
        if(G("appShell"))G("appShell").style.display="block";
        if(typeof injectFeedbackWidget==="function")injectFeedbackWidget();
        if(typeof startMyQueryListener==="function")startMyQueryListener(user.uid);
        setTimeout(function(){
          var lt=sessionStorage.getItem('_lastTab');
          if(typeof goTab==="function")goTab(lt?parseInt(lt):0);
        },100);
        setTimeout(function(){autoLoad();},300);
        /* Stamp / sign details + sheet stamp config: cloud se ya device var ghya */
        setTimeout(function(){try{if(typeof atpPrefsPull==="function")atpPrefsPull();}catch(_pe){}},600);
        /* Auto-load cloud estimate list after login */
        setTimeout(function(){if(typeof loadCloudList==="function")loadCloudList();},800);
        /* ── Share-link: agar ?share=ID ne login karun aala asel tar to estimate direct load kara ── */
        if(PENDING_SHARE_ID){
          var _shId=PENDING_SHARE_ID;PENDING_SHARE_ID=null;
          setTimeout(function(){loadSharedEstimateFromLink(_shId);},1200);
          try{
            var _u=new URL(window.location.href);
            _u.searchParams.delete("share");
            window.history.replaceState({},"",_u.toString());
          }catch(e){}
        }
      }
    }
    else{
      CU=null;
      stopReqListener();
      if(typeof mpnStop==="function")mpnStop();
      if(typeof stopMyQueryListener==="function")stopMyQueryListener();
      var _fbBtn=G("fbWidgetBtn");if(_fbBtn)_fbBtn.remove();
      if(G("loginShell"))G("loginShell").style.display="flex";
      if(G("appShell"))G("appShell").style.display="none";
      if(G("adminWrap"))G("adminWrap").style.display="none";
      sessionStorage.removeItem("_adminOpen");
      setTimeout(function(){if(typeof lpLoad==="function")lpLoad();},500);
    }
  });
/* Hide loader fallback after 5s */
setTimeout(function(){},5000);
  loadAppCfg();loadAdminQR();
  loadQR(makeQR);
});

function planRenderPay(){
  var pd=G("payAmtDisplay");if(!pd)return;
  PAY_AMOUNT=PLAN_PRICE[PLAN_SEL];
  function card(k,t,sub){var on=PLAN_SEL===k;return "<div onclick=\"planPick('"+k+"')\" style=\"flex:1;cursor:pointer;border:2px solid "+(on?"#18602f":"#ccc")+";background:"+(on?"#e8f5e9":"#fff")+";border-radius:8px;padding:.5rem .3rem;text-align:center\"><div style=\"font-size:.7rem;font-weight:700;color:#555\">"+t+"</div><div style=\"font-size:1.35rem;font-weight:800;color:#18602f\">&#8377;"+PLAN_PRICE[k]+"</div><div style=\"font-size:.6rem;color:#777\">"+sub+"</div></div>";}
  pd.innerHTML="<div style=\"display:flex;gap:.5rem\">"+card("m","Monthly","per month")+card("y","Yearly","per year \u2022 best value")+"</div><div style=\"font-size:.66rem;color:#555;margin-top:.4rem;font-weight:400\">Unlimited downloads \u2022 no per-download charge</div>";
}
function planPick(k){PLAN_SEL=k;planRenderPay();makeQR();}

function loadAppCfg(){
  if(!window.firebase||!firebase.firestore)return;
  firebase.firestore().collection("config").doc("app").get().then(function(d){
    if(d.exists){
      if(d.data().planMonthly)PLAN_PRICE.m=d.data().planMonthly;if(d.data().planYearly)PLAN_PRICE.y=d.data().planYearly;PAY_AMOUNT=PLAN_PRICE[PLAN_SEL];
      var _mb=G("maintBanner"),_md=d.data().maintenance||{};if(_mb){if(_md.active){var _mm=_md.message||"Scheduled maintenance in progress.";if(_md.from&&_md.to)_mm="🚧 Maintenance: "+_md.from+" – "+_md.to;G("maintMsg").textContent=_mm;_mb.classList.add("show");document.body.classList.add("has-maint");}else{_mb.classList.remove("show");document.body.classList.remove("has-maint");}}
      if(d.data().freeLimit!=null)APP_FREE_LIMIT=d.data().freeLimit;if(d.data().freeLimit)FREE_LIMIT=d.data().freeLimit;
      planRenderPay();
      var fl=G("freeLimitTxt");if(fl)fl.textContent=FREE_LIMIT;
      var pr=G("priceTxt");if(pr)pr.textContent=PLAN_PRICE.m;
      makeQR();
    }
  }).catch(function(){});
  /* Load CF_MAP from cloud */
  firebase.firestore().collection("config").doc("cfmap").get().then(function(d){
    if(d.exists&&d.data().cf){
      /* If cf_data.js is newer than the cloud copy, the file wins (cloud copy is stale) */
      var _cfTs=d.data().updatedAt,_cfMs=(_cfTs&&typeof _cfTs.toMillis==="function")?_cfTs.toMillis():0;
      if(typeof CF_VERSION!=="undefined"&&_cfMs<CF_VERSION){console.log("CF cloud copy is older than cf_data.js - using cf_data.js");return;}
      var cloud=d.data().cf;for(var k in cloud)CF_MAP[k]=cloud[k];
      if(typeof rCFTab==="function")rCFTab();if(typeof updateAll==="function")updateAll();}
  }).catch(function(){});
  /* Load Lead Charges (LL table) from cloud */
  firebase.firestore().collection("config").doc("lead_ll").get().then(function(d){
    if(d.exists&&d.data().ll){
      var cll=d.data().ll;
      for(var k in cll){if(Array.isArray(cll[k]))LL[k]=cll[k];}
      if(typeof updateAll==="function")updateAll();
    }
  }).catch(function(){});
  /* Load SSR from cloud if available */
  firebase.firestore().collection("config").doc("ssr_meta").get().then(function(meta){
    if(!meta.exists)return;
    var numChunks=meta.data().chunks||0;
    if(!numChunks)return;
    var promises=[];
    for(var ci=0;ci<numChunks;ci++){
      promises.push(firebase.firestore().collection("config").doc("ssr_chunk_"+ci).get());
    }
    Promise.all(promises).then(function(docs){
      var newSSR=[];
      docs.forEach(function(d){
        if(!d.exists)return;var x=d.data().data;
        if(typeof x==='string'){try{x=JSON.parse(x);}catch(e){x=null;}}   /* new format: JSON string */
        if(Array.isArray(x))newSSR=newSSR.concat(x);                        /* old format: array of arrays */
      });
      if(newSSR.length>0){
        /* Old cloud copies hold only 4 fields - fill spec/Sr.No/Chapter/RefNo/Labour from local ssr_data.js */
        var loc={};SSR.forEach(function(r){(loc[r[0]]=loc[r[0]]||[]).push(r);});
        newSSR=newSSR.map(function(r){
          if(!Array.isArray(r))return r;
          var l=(loc[r[0]]||[]).shift(),o=r.slice();
          while(o.length<9){var k=o.length;o.push(l&&l[k]!==undefined?l[k]:(k===8?0:''));}
          return o;
        });
        for(var i=0;i<newSSR.length;i++)SSR[i]=newSSR[i];SSR.length=newSSR.length;
      }
    }).catch(function(){});
  }).catch(function(){});
}

function loadUserDoc(){
  if(!CU||!window.firebase||!firebase.firestore)return;
  /* Real-time listener — fires when admin updates freeLimit or isPro */
  PLAN_START=0;PLAN_END=0;
  if(!window._planTmr)window._planTmr=setInterval(function(){if(PLAN_END&&typeof renderHeader==="function")renderHeader();},60000);
  if(_unsub_user){_unsub_user();_unsub_user=null;}
  _unsub_user=firebase.firestore().collection("users").doc(CU.uid).onSnapshot(function(d){
    if(!d.exists)return;
    var prev=FREE_LIMIT;
    IS_PRO=d.data().isPro||false;
    DL_COUNT=d.data().dlCount||0;_readPlan(d.data());
    if(d.data().freeLimit!=null)FREE_LIMIT=d.data().freeLimit;
    if(typeof renderHeader==="function")renderHeader();
    if(planActive()&&G("payWall"))G("payWall").style.display="none";
    /* If freeLimit increased, notify user */
    if(FREE_LIMIT>prev&&prev>0)showToast("Payment verified! You can now download. ✅","success");
  },function(e){console.warn("User doc listener:",e.code);});
  firebase.firestore().collection("users").doc(CU.uid).get().then(function(d){
    if(d.exists){IS_PRO=d.data().isPro||false;DL_COUNT=d.data().dlCount||0;_readPlan(d.data());if(d.data().freeLimit!=null)FREE_LIMIT=d.data().freeLimit;}
    else{firebase.firestore().collection("users").doc(CU.uid).set({uid:CU.uid,phone:CU.phoneNumber||"",email:CU.email||"",name:CU.displayName||"",isPro:false,dlCount:0,createdAt:firebase.firestore.FieldValue.serverTimestamp()});}
    renderHeader();loadCloudList();
  }).catch(function(){});
}

function renderHeader(){
  var el=G("userHeaderDiv");if(!el)return;
  if(!CU){el.innerHTML="";if(typeof rcUnlisten==="function"){rcUnlisten();RC_PAYS=[];}if(typeof rcRenderBtn==="function")rcRenderBtn();return;}
  var nm=(CU.displayName||CU.phoneNumber||CU.email||"User").split(" ")[0];
  var rem=Math.max(0,FREE_LIMIT-DL_COUNT);
  el.innerHTML="<span class=\"uname\">\u{1F464} "+esc(nm)+"</span>"/* download count / plan status ata fakt Recharge button madhe (rcRenderBtn) - duplicate badge kadhla */+"<button class=\"ubtn\" id=\"reqBellBtn\" onclick=\"openReqPanel()\" style=\"position:relative;padding:.28rem .45rem\" title=\"Requests\">\u{1F514}<span id=\"reqBadge\" style=\"display:none;position:absolute;top:-4px;right:-4px;background:#e53935;color:#fff;border-radius:8px;min-width:14px;height:14px;font-size:.5rem;font-weight:900;line-height:14px;text-align:center;padding:0 2px;box-sizing:border-box\"></span></button>"+"<button class=\"ubtn\" onclick=\"doLogout()\">Logout</button>";
  if(typeof updateReqBadge==="function")updateReqBadge();
  var _uf=el.querySelector(".ufree");if(_uf&&planActive())_uf.innerHTML="\u{1F39F}\uFE0F Unlimited till "+_planEndTxt();
  var badge=G("dlCountBadge");
  if(badge){
    if(IS_PRO){badge.textContent="(💎 Pro)";}
    else if(planActive()){badge.textContent="(🎟️ Unlimited till "+_planEndTxt()+")";}
    else if(rem>0){badge.textContent="("+rem+" free left)";}
    else{badge.textContent="(💳 Pay to download)";}
  }
  /* Show CF Table tab only for admin */
  var isAdm=CU&&CU.email===ADMIN_EMAIL;
  var t13=G("t13");if(t13)t13.style.display="";  /* CF Table for all users */
  var scb=G("saveCFCloudBtn");if(scb)scb.style.display=isAdm?"":"none";
  /* Show share app button when logged in */
  var sab=G("shareAppBtn");if(sab)sab.style.display=CU?"inline-flex":"none";sab&&(sab.style.alignItems="center");
  if(typeof rcRefresh==="function"){if(!RC_UNSUB)rcListen();rcRefresh();if(G("rcModal")){rcRenderPayBox();}}
}

function swAuth(i){for(var j=0;j<2;j++){var p=G("ap"+j),t=G("at"+j);if(p)p.classList[j===i?"add":"remove"]("on");if(t)t.classList[j===i?"add":"remove"]("on");}}
function swEmail(tab){G("eL").style.display=tab==="l"?"block":"none";G("eR").style.display=tab==="r"?"block":"none";G("et0").classList[tab==="l"?"add":"remove"]("on");G("et1").classList[tab==="r"?"add":"remove"]("on");}

function showInfo(title,inp,out){G("infoTtl").textContent=title+" — Guide";G("infoIn").textContent=inp;G("infoOut").textContent=out;G("infoModal").style.display="flex";}
function closeInfo(){G("infoModal").style.display="none";}

function sendOTP(){
  var fn=(G("phFirst").value||"").trim(),num=(G("phNum").value||"").trim();
  if(!fn){showE("phErr","Enter your first name");return;}
  if(!/^[6-9]\d{9}$/.test(num)){showE("phErr","Enter valid 10-digit number");return;}
  hideE("phErr");
  var btn=G("otpBtn");btn.disabled=true;btn.textContent="Sending...";
  if(G("phSent"))G("phSent").textContent="+91"+num;
  G("rcWrap").innerHTML="";
  
  try{
    var rc=new firebase.auth.RecaptchaVerifier("rcWrap",{size:"invisible",callback:function(){}});
    firebase.auth().signInWithPhoneNumber("+91"+num,rc)
      .then(function(res){
        OTP_CFM=res;G("ph1").style.display="none";G("ph2").style.display="block";
        btn.disabled=false;btn.textContent="📤 Send OTP";startOTPTimer();showToast("OTP sent!","success");
      })
      .catch(function(e){
        btn.disabled=false;btn.textContent="📤 Send OTP";
        showE("phErr",e.code==="auth/too-many-requests"?"Too many attempts. Wait a moment.":e.code==="auth/invalid-phone-number"?"Invalid number":"Error: "+e.message);
        try{rc.clear();}catch(x){}G("rcWrap").innerHTML="";
      });
  }catch(e){btn.disabled=false;btn.textContent="📤 Send OTP";showE("phErr","Error: "+e.message);G("rcWrap").innerHTML="";}
}

function verifyOTP(){
  var code=(G("otpVal").value||"").trim();
  if(code.length!==6){showE("otpErr","Enter 6-digit OTP");return;}
  if(!OTP_CFM){showE("otpErr","Request OTP first");return;}
  hideE("otpErr");
  var btn=G("verBtn");if(btn){btn.disabled=true;btn.textContent="Verifying...";}
  OTP_CFM.confirm(code)
    .then(function(res){
      var fn=(G("phFirst").value||"").trim(),ln=(G("phLast").value||"").trim(),name=(fn+" "+ln).trim();
      if(name&&res.user){
        res.user.updateProfile({displayName:name}).catch(function(){});
        if(window.firebase&&firebase.firestore)firebase.firestore().collection("users").doc(res.user.uid).set({name:name},{merge:true}).catch(function(){});
      }
      showToast("Welcome "+fn+"!","success");
    })
    .catch(function(e){
      if(btn){btn.disabled=false;btn.textContent="✅ Verify OTP";}
      showE("otpErr",e.code==="auth/invalid-verification-code"?"Wrong OTP":e.code==="auth/code-expired"?"OTP expired — resend":"Error: "+e.message);
    });
}

function goPhBack(){
  G("ph1").style.display="block";G("ph2").style.display="none";
  if(G("otpVal"))G("otpVal").value="";G("rcWrap").innerHTML="";OTP_CFM=null;clearInterval(OTP_TMR);
}

function startOTPTimer(){
  var s=60;if(G("otpCd"))G("otpCd").textContent=s;if(G("resendSpan"))G("resendSpan").style.display="none";
  clearInterval(OTP_TMR);
  OTP_TMR=setInterval(function(){s--;if(G("otpCd"))G("otpCd").textContent=s;if(s<=0){clearInterval(OTP_TMR);if(G("resendSpan"))G("resendSpan").style.display="inline";}},1000);
}

function doGoogle(){
  
  firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(function(e){showToast("Google login failed: "+e.message,"error");});
}

function doELogin(){
  var em=(G("eEmail").value||"").trim(),pw=G("ePwd").value;
  if(!em||!pw){showE("eErr","Email and password required");return;}
  var btn=G("eLoginBtn");btn.disabled=true;btn.textContent="Logging in...";hideE("eErr");
  firebase.auth().signInWithEmailAndPassword(em,pw)
    .then(function(c){
      if(!c.user.emailVerified){
        firebase.auth().signOut();
        btn.disabled=false;btn.textContent="🔑 Login";
        showE("eErr","⚠️ Email not verified. A verification link has been sent to your inbox — please verify before logging in.");
        return;
      }
    })
    .catch(function(e){btn.disabled=false;btn.textContent="🔑 Login";showE("eErr",e.code==="auth/user-not-found"||e.code==="auth/invalid-credential"?"Invalid email or password":e.code==="auth/wrong-password"?"Wrong password":e.message);});
}

function doRegister(){
  var fn=(G("rFirst").value||"").trim(),ln=(G("rLast").value||"").trim();
  var ph=G("rPhone")?(G("rPhone").value||"").replace(/[^0-9]/g,""):"";
  var em=(G("rEmail").value||"").trim(),pw=G("rPwd").value,pw2=G("rPwd2").value;
  if(!fn){showE("rErr","First name required");return;}
  if(!ph||ph.length!==10){showE("rErr","Valid 10-digit mobile number required");return;}
  if(!em){showE("rErr","Email required");return;}
  if(pw.length<6){showE("rErr","Password min 6 chars");return;}
  if(pw!==pw2){showE("rErr","Passwords do not match");return;}
  var name=(fn+" "+ln).trim();
  var btn=G("regBtn");btn.disabled=true;btn.textContent="Checking...";hideE("rErr");
  firebase.firestore().collection("users").where("phone","==",ph).limit(1).get()
  .then(function(snap){
    if(!snap.empty){
      btn.disabled=false;btn.textContent="\uD83D\uDCDD Create Account";
      showE("rErr","\u274C This mobile number is already registered. Please login.");
      return;
    }
    btn.textContent="Creating...";
    return firebase.auth().createUserWithEmailAndPassword(em,pw)
    .then(function(cr){
      var uid=cr.user.uid;
      // updateProfile & sendEmailVerification — fail झाली तरी registration block होणार नाही
      cr.user.updateProfile({displayName:name}).catch(function(){});
      cr.user.sendEmailVerification().catch(function(){});
      // Firestore मध्ये user save करा
      firebase.firestore().collection("users").doc(uid).set({
        name:name,phone:ph,email:em,emailVerified:false,
        createdAt:firebase.firestore.FieldValue.serverTimestamp()
      },{merge:true}).catch(function(){});
      firebase.auth().signOut();
      btn.disabled=false;btn.textContent="\uD83D\uDCDD Create Account";
      var errEl=G("rErr");
      errEl.style.display="block";errEl.style.color="#18602f";
      errEl.style.background="#e8f5e9";errEl.style.borderColor="#81c784";
      errEl.textContent="\u2705 Account created! Verification email sent to "+em+". Please verify before logging in.";
      showToast("Verification email sent \uD83D\uDCE7","success");
    })
    .catch(function(e){
      btn.disabled=false;btn.textContent="\uD83D\uDCDD Create Account";
      var msg=e.message;
      if(e.code==="auth/email-already-in-use") msg="\u274C Email already registered. Please login.";
      else if(e.code==="auth/operation-not-allowed") msg="\u274C Registration disabled. Contact admin.";
      else if(e.code==="auth/weak-password") msg="\u274C Password too weak. Use at least 6 characters.";
      else if(e.code==="auth/invalid-email") msg="\u274C Invalid email address.";
      showE("rErr",msg);
    });
  }).catch(function(e){
    btn.disabled=false;btn.textContent="\uD83D\uDCDD Create Account";
    showE("rErr","Error: "+e.message);
  });
}

function doForgot(){var em=(G("eEmail").value||"").trim();if(!em){showE("eErr","Enter email first");return;}firebase.auth().sendPasswordResetEmail(em).then(function(){showToast("Reset email sent 📧","success");}).catch(function(e){showE("eErr",e.message);});}
function doLogout(){if(!confirm("Are you sure you want to log out?"))return;if(_unsub_pay){_unsub_pay();_unsub_pay=null;}if(_unsub_user){_unsub_user();_unsub_user=null;}if(typeof aStopQueryListener==="function")aStopQueryListener();firebase.auth().signOut();}

function doAdminLogin(){
  var pw=(G("admPwd").value||"").trim();if(!pw){showE("admErr","Enter password");return;}
  hideE("admErr");var btn=G("admBtn");btn.disabled=true;btn.textContent="Logging in...";
  
  firebase.auth().signInWithEmailAndPassword(ADMIN_EMAIL,pw)
    .then(function(){
      sessionStorage.setItem("_adminOpen","1");
      if(G("loginShell"))G("loginShell").style.display="none";
      var w=G("adminWrap");if(w)w.style.display="block";
      if(G("adminLoginBox"))G("adminLoginBox").style.display="none";
      if(G("adminDash"))G("adminDash").style.display="block";
      if(G("adminUsr"))G("adminUsr").textContent=ADMIN_EMAIL;
      aLoadAll();aLoadCurQR();aStartPayListener();aLoadSettings();
    })
    .catch(function(e){btn.disabled=false;btn.textContent="🔑 Admin Login";showE("admErr",e.code==="auth/wrong-password"||e.code==="auth/invalid-credential"?"Wrong password":"Error: "+e.message);});
}

function doPortalLogin(){
  var pw=(G("portalPwd").value||"").trim();if(!pw){showE("portalErr","Enter password");return;}
  hideE("portalErr");var btn=G("portalBtn");btn.disabled=true;btn.textContent="Logging in...";
  firebase.auth().signInWithEmailAndPassword(ADMIN_EMAIL,pw)
    .then(function(c){
      sessionStorage.setItem("_adminOpen","1");
      if(G("adminLoginBox"))G("adminLoginBox").style.display="none";
      if(G("adminDash"))G("adminDash").style.display="block";
      if(G("adminUsr"))G("adminUsr").textContent=c.user.email;
      showToast("Welcome Admin! 👑","success");aLoadAll();aLoadCurQR();aStartPayListener();aLoadSettings();
    })
    .catch(function(e){btn.disabled=false;btn.textContent="🔑 Login to Dashboard";showE("portalErr",e.code==="auth/wrong-password"||e.code==="auth/invalid-credential"?"Wrong password":"Error: "+e.message);});
}

function openAdmin(){
  var w=G("adminWrap");if(!w)return;w.style.display="block";
  if(CU&&CU.email===ADMIN_EMAIL){sessionStorage.setItem("_adminOpen","1");if(G("adminLoginBox"))G("adminLoginBox").style.display="none";if(G("adminDash"))G("adminDash").style.display="block";if(G("adminUsr"))G("adminUsr").textContent=CU.email;aLoadAll();aLoadCurQR();aStartPayListener();aLoadSettings();}
  else{if(G("adminLoginBox"))G("adminLoginBox").style.display="flex";if(G("adminDash"))G("adminDash").style.display="none";}
}

function loadAdminQR(){
  if(!window.firebase||!firebase.firestore)return;
  firebase.firestore().collection("config").doc("upi").get().then(function(d){
    if(d.exists&&d.data().qrURL){
      var img=G("adminQRImg");if(img){img.src=d.data().qrURL;img.onload=function(){if(G("adminQRDiv"))G("adminQRDiv").style.display="block";if(G("autoQRDiv"))G("autoQRDiv").style.display="none";};}
      if(d.data().upiId){UPI_ID=d.data().upiId;var ud=G("upiDisplay");if(ud)ud.textContent=d.data().upiId;}
    }
  }).catch(function(){});
}

function canDownload(){
  if(!CU){showToast("Please login first","warn");if(G("loginShell"))G("loginShell").style.display="flex";return false;}
  if(IS_PRO||planActive())return true;if(DL_COUNT<FREE_LIMIT)return true;
  /* Payment pending 10 min peksha jast ani admin ne verify kele nahi => verify hoy paryant 5 temporary downloads */
  if(typeof rcGraceActive==="function"&&rcGraceActive()){showToast("Temporary download until payment is verified \u2713 ("+Math.max(0,FREE_LIMIT+RC_GRACE_DL-DL_COUNT)+" left)","info");return true;}
  /* Free downloads sampalyavar junya payWall aivaji navin Recharge modal (QR + plan + status) */
  if(typeof rcOpen==="function"){rcOpen(true);return false;}
  planRenderPay();var pw=G("payWall");if(pw)pw.style.display="flex";
  if(G("upSec"))G("upSec").style.display="block";if(G("statSec"))G("statSec").style.display="none";
  var pi=G("ssPreview");if(pi){pi.src="";pi.style.display="none";}
  if(G("ssBtn"))G("ssBtn").disabled=true;SS_FILE=null;CUR_PAY_ID=null;loadAdminQR();
  /* Check if user has a pending/verified payment already */
  if(CU&&window.firebase&&firebase.firestore){
    firebase.firestore().collection("payments")
      .where("uid","==",CU.uid)
      .orderBy("createdAt","desc").limit(1).get()
      .then(function(snap){
        if(snap.empty)return;
        var last=snap.docs[0].data();
        var lastId=snap.docs[0].id;
        if(last.status==="pending"){
          CUR_PAY_ID=lastId;
          showPayStat("pending");
        } else if(last.status==="verified"){
          /* Already verified - update freeLimit and close paywall */
          firebase.firestore().collection("users").doc(CU.uid).get().then(function(d){
            if(d.exists){
              IS_PRO=d.data().isPro||false;
              DL_COUNT=d.data().dlCount||0;_readPlan(d.data());
              if(d.data().freeLimit!=null)FREE_LIMIT=d.data().freeLimit;
            }
            if(typeof renderHeader==="function")renderHeader();
            if(G("payWall"))G("payWall").style.display="none";
            showToast("Payment already verified! Try downloading again.","success");
          });
        }
      }).catch(function(){});
  }
  return false;
}

/* Cloudinary band jhala => image compress karun data-URL (base64) mhanun Firestore madhech save. Signature junach: uploadCDN(file,folder,onP,onD,onE) */
function uploadCDN(file,folder,onP,onD,onE){
  try{
    var f=String(folder||""),isQR=f.indexOf("/qr")>-1,isLP=f.indexOf("login-images")>-1;
    var maxD=isQR?700:(isLP?800:1000),q0=isQR?0.92:(isLP?0.7:0.72),maxLen=isQR?400000:(isLP?200000:700000);
    if(!file){onE("No file");return;}
    if(onP)onP(10);
    var fr=new FileReader();
    fr.onerror=function(){onE("Could not read file");};
    fr.onload=function(){
      var img=new Image();
      img.onerror=function(){onE("Invalid image");};
      img.onload=function(){
        try{
          if(onP)onP(60);
          var w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
          var sc=Math.min(1,maxD/Math.max(w,h)),out="",tries=0;
          do{
            var cw=Math.max(1,Math.round(w*sc)),ch=Math.max(1,Math.round(h*sc));
            var c=document.createElement("canvas");c.width=cw;c.height=ch;
            var ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,cw,ch);ctx.drawImage(img,0,0,cw,ch);
            var qq=q0;out=c.toDataURL("image/jpeg",qq);
            while(out.length>maxLen&&qq>0.35){qq-=0.1;out=c.toDataURL("image/jpeg",qq);}
            if(out.length>maxLen)sc*=0.8;
            tries++;
          }while(out.length>maxLen&&tries<5);
          if(out.length>maxLen){onE("Image too large, use a smaller image");return;}
          if(onP)onP(100);
          onD(out);
        }catch(e){onE((e&&e.message)||"Image error");}
      };
      img.src=fr.result;
    };
    fr.readAsDataURL(file);
  }catch(e){onE((e&&e.message)||"Upload error");}
}

function onSSfile(input){if(!input.files||!input.files[0])return;SS_FILE=input.files[0];var r=new FileReader();r.onload=function(e){var p=G("ssPreview");p.src=e.target.result;p.style.display="block";G("ssBtn").disabled=false;};r.readAsDataURL(SS_FILE);}
function onSSdrop(e){e.preventDefault();if(e.dataTransfer.files[0]){G("ssFile").files=e.dataTransfer.files;onSSfile(G("ssFile"));}}

function submitPay(){
  if(!SS_FILE){showE("ssErr","Upload screenshot first");return;}if(!CU){showToast("Login first","warn");return;}
  var btn=G("ssBtn");btn.disabled=true;btn.textContent="Uploading... 0%";hideE("ssErr");
  uploadCDN(SS_FILE,"atp-maha-pwd/payments/"+CU.uid,function(p){btn.textContent="Uploading... "+p+"%";},function(url){createPayRec(url);},function(err){console.log(err);createPayRec("");});
}

function createPayRec(ssURL){
  var db=firebase.firestore();
  db.collection("payments").add({uid:CU.uid,phone:CU.phoneNumber||"",email:CU.email||"",name:CU.displayName||CU.phoneNumber||"",amount:PAY_AMOUNT,plan:PLAN_SEL==="y"?"yearly":"monthly",planMonths:PLAN_SEL==="y"?12:1,upiId:UPI_ID,screenshotURL:ssURL,status:"pending",createdAt:firebase.firestore.FieldValue.serverTimestamp()})
    .then(function(ref){CUR_PAY_ID=ref.id;showPayStat("pending");showToast("Submitted! Pending verification ⏳","success");
      /* Real-time listener: notify user when admin verifies */
      if(window.firebase&&firebase.firestore){
        firebase.firestore().collection("payments").doc(ref.id).onSnapshot(function(d){
          if(!d.exists)return;var st=d.data().status;
          if(st==="verified")showPayStat("verified");
          else if(st==="rejected")showPayStat("rejected");
        });
      }
    })
    .catch(function(e){
      G("ssBtn").disabled=false;G("ssBtn").textContent="📤 Submit Screenshot";
      var msg=e.message||e.code||"Unknown error";
      if(msg.indexOf("permission")>=0||msg.indexOf("PERMISSION")>=0){
        showToast("Firestore permission error — update rules","error");
        showE("ssErr","Firebase rules error. Contact admin.");
      } else {
        showToast("Error: "+msg,"error");
        showE("ssErr","Submit failed: "+msg);
      }
      console.error("createPayRec error:",e);
    });
}

function showPayStat(s){
  if(G("upSec"))G("upSec").style.display="none";if(G("statSec"))G("statSec").style.display="block";
  var box=G("statBox");if(box)box.className="pstatbox "+s;
  if(s==="pending"){if(G("statTitle"))G("statTitle").textContent="⏳ Pending...";if(G("statMsg"))G("statMsg").textContent="Admin will verify your payment and activate your plan.";}
  else if(s==="verified"){
    if(G("statTitle"))G("statTitle").textContent="✅ Verified!";
    if(G("statMsg"))G("statMsg").textContent="Plan activated. Unlimited downloads 🎉";
    clearInterval(AUTO_TMR);
    if(G("payWall"))G("payWall").style.display="none";
    showToast("Verified! Download now 🎉","success");
    /* Reload user doc so freeLimit and DL_COUNT are fresh from Firestore */
    if(CU&&window.firebase&&firebase.firestore){
      firebase.firestore().collection("users").doc(CU.uid).get().then(function(d){
        if(d.exists){
          IS_PRO=d.data().isPro||false;
          DL_COUNT=d.data().dlCount||0;_readPlan(d.data());
          if(d.data().freeLimit!=null)FREE_LIMIT=d.data().freeLimit;
        }
        renderHeader();
      }).catch(function(){});
    }
  }
  else{if(G("statTitle"))G("statTitle").textContent="❌ Rejected";if(G("statMsg"))G("statMsg").textContent="Contact admin or try again.";clearInterval(AUTO_TMR);}
}

function startAutoApprove(payId){
  var total=15*60,rem=total;if(G("tfill"))G("tfill").style.width="100%";clearInterval(AUTO_TMR);
  AUTO_TMR=setInterval(function(){
    rem--;if(G("tfill"))G("tfill").style.width=(rem/total*100).toFixed(1)+"%";
    var m=Math.floor(rem/60),s=rem%60;if(G("autoMsg"))G("autoMsg").textContent="Auto-approve in: "+m+":"+(s<10?"0":"")+s;
    if(rem<=0){
      clearInterval(AUTO_TMR);
      var db2=firebase.firestore();
      db2.collection("payments").doc(payId).update({
        status:"verified",autoApproved:true,
        verifiedAt:firebase.firestore.FieldValue.serverTimestamp()
      }).then(function(){
        /* Also give user +1 freeLimit on auto-approve */
        if(CU){
          db2.collection("users").doc(CU.uid).update({
            freeLimit:firebase.firestore.FieldValue.increment(1)
          }).catch(function(){});
        }
        showPayStat("verified");
      },function(e){console.warn("Pay snap:",e.code);});
    }
  },1000);
}

function checkPayStatus(){
  if(!CUR_PAY_ID)return;
  firebase.firestore().collection("payments").doc(CUR_PAY_ID).get().then(function(d){
    if(!d.exists)return;
    var s=d.data().status;
    if(s==="verified"){showPayStat("verified");}
    else if(s==="rejected"){showPayStat("rejected");}
    else{showToast("Still pending ⏳","info");}
  });
}

var SHARE_EST_ID=null;
function openShare(estId){SHARE_EST_ID=estId||CUR_EST_ID;if(!SHARE_EST_ID){showToast("Save first","warn");return;}if(G("shareModal"))G("shareModal").style.display="flex";if(G("shareEmail"))G("shareEmail").value="";hideE("shareErr");loadShareList();}
function loadShareList(){
  var list=G("shareList");if(!list||!SHARE_EST_ID)return;
  list.innerHTML="<div style='color:#aaa;font-size:.7rem'>Loading...</div>";
  firebase.firestore().collection("estimates").doc(SHARE_EST_ID).get().then(function(d){
    var cols=d.exists?d.data().collaborators||[]:[];
    if(!cols.length){list.innerHTML="<div style='color:#aaa;font-size:.7rem;font-style:italic'>No collaborators</div>";return;}
    list.innerHTML=cols.map(function(x){return "<div class='shitem'><span style='flex:1;font-size:.77rem'>"+esc(x.email)+"</span><span class='srole "+x.role+"'>"+x.role+"</span><button class='sh-rm' onclick='removeShare(this.dataset.e)' data-e='"+esc(x.email)+"'>✕</button></div>";}).join("");
  }).catch(function(){list.innerHTML="<div style='color:red;font-size:.7rem'>Error</div>";});
}
function addShare(){
  var email=(G("shareEmail").value||"").trim().toLowerCase(),role=G("shareRole").value;
  if(!email||!email.includes("@")){showE("shareErr","Valid email required");return;}hideE("shareErr");
  firebase.firestore().collection("estimates").doc(SHARE_EST_ID).update({collaborators:firebase.firestore.FieldValue.arrayUnion({email:email,role:role,addedAt:new Date().toISOString()})})
    .then(function(){showToast("Added "+email,"success");G("shareEmail").value="";loadShareList();}).catch(function(e){showE("shareErr","Error: "+e.message);});
}
function removeShare(email){
  if(!confirm("Remove "+email+"?"))return;
  firebase.firestore().collection("estimates").doc(SHARE_EST_ID).get()
    .then(function(d){return d.ref.update({collaborators:(d.data().collaborators||[]).filter(function(c){return c.email!==email;})});})
    .then(function(){showToast("Removed","info");loadShareList();})
    .catch(function(){showToast("Error","error");});
}

/* Auto-versioning helper for cloudSave() — jar toch (root) naav aadhich
   uid chya estimates madhe asel, tar "(v2)", "(v3)" ase pudhchi version
   naav dyayla. names = ya uid chya sagalya existing estimates chi naave. */
function _atpNextCloudVersionName(names,baseName){
  var root=(baseName||'').replace(/\s*\(v\d+\)\s*$/i,'').trim();
  var esc=root.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  var re=new RegExp('^'+esc+'\\s*\\(v(\\d+)\\)$','i');
  var maxV=1;
  (names||[]).forEach(function(n){
    var m=(n||'').match(re);
    if(m){var v=parseInt(m[1],10)||1;if(v>maxV)maxV=v;}
  });
  return root+' (v'+(maxV+1)+')';
}
/* Comparable data-only subset (name/uid/timestamps ignore) — actual
   content badalla nasel tar navin version banवायचi garaj nahi. */
function _atpCanon(v){
  if(Array.isArray(v))return "["+v.map(_atpCanon).join(",")+"]";
  if(v&&typeof v==="object")return "{"+Object.keys(v).sort().map(function(k){return JSON.stringify(k)+":"+_atpCanon(v[k]);}).join(",")+"}";
  return JSON.stringify(v===undefined?null:v);
}
function _atpCloudComparable(d,wt){
  if(!d)return null;
  var base=JSON.stringify({
    cover:d.cover,settings:d.settings,items:d.items,lkm:d.lkm,leadKm:d.leadKm,leadLoc:d.leadLoc,
    mtfCosts:d.mtfCosts,steelRows:d.steelRows,scSecs:d.scSecs,extraRows:d.extraRows,
    leadMapData:d.leadMapData,planData:d.planData
  });
  /* Testing tab data counts as a change (only compared when the stored doc already carries it) */
  if(wt)base+=_atpCanon([d.mtfCustom||[],d.mtfDesc||{},d.mtfConc||null,d.testReport||null,d.lcExtra||[]]);
  return base;
}
function cloudSave(){
  if(!CU){showToast("Login first","warn");return;}if(!window.firebase||!firebase.firestore){showToast("Offline","warn");return;}
  var db=firebase.firestore(),nm=((G("pName")||{value:""}).value||"").trim()||"Untitled";
  /* Compute grand total */
  var _g=0;try{var _A2=0;for(var _ii2=0;_ii2<(typeof items!=="undefined"?items:[]).length;_ii2++)_A2+=(items[_ii2].amount||0);var _S2=typeof gS==="function"?gS():{gst:0,cont:0,li:0,areaPct:0,extraRows:[]};var _roy2=typeof calcRoyTotal==="function"?calcRoyTotal(_S2):0;var _mtfEl2=G("mtfTotal");var _mtf2=_mtfEl2?Math.round(parseFloat(_mtfEl2.textContent)||0):0;var _specF2=_S2.areaPct>0?Math.round(_A2*_S2.areaPct/100):0;var _extT2=0;if(_S2.extraRows&&_S2.extraRows.length){for(var _ei2=0;_ei2<_S2.extraRows.length;_ei2++){if(_S2.extraRows[_ei2].pct>0)_extT2+=Math.round(_A2*_S2.extraRows[_ei2].pct/100);}}_g=(_A2+_roy2+_mtf2)+Math.round((window.GST_BASE==="ABC"?(_A2+_roy2+_mtf2):_A2)*_S2.gst/100)+Math.round(_A2*_S2.cont/100)+Math.round(_A2*_S2.li/100)+_specF2+_extT2;}catch(_ge2){}
  /* Collect Quarry Chart drawing data */
  var _leadMapData=null;
  try{
    if(typeof SP!=="undefined"&&SP){
      _leadMapData={shapes:JSON.parse(JSON.stringify(SP.shapes||[])),bgImgX:SP.bgImgX||0,bgImgY:SP.bgImgY||0,bgImgW:SP.bgImgW||0,bgImgH:SP.bgImgH||0,autoOn:SP.autoOn!==false};
      if(SP.bgImg){try{var _tc1=document.createElement("canvas");_tc1.width=SP.bgImgW||400;_tc1.height=SP.bgImgH||300;_tc1.getContext("2d").drawImage(SP.bgImg,0,0,_tc1.width,_tc1.height);_leadMapData.bgImgData=_tc1.toDataURL("image/jpeg",0.55);}catch(_e1){}}
    }
  }catch(_e2){}
  /* Collect Plan tab drawing data */
  var _planData=null;
  try{if(typeof window._getPlanData==="function")_planData=window._getPlanData();}catch(_e3){}
  var data={uid:CU.uid,name:nm,baseName:nm,items:typeof items!=="undefined"?items:[],
    cover:{pReg:(G("pReg")||{value:""}).value,pCir:(G("pCir")||{value:""}).value,pDiv:(G("pDiv")||{value:""}).value,pSub:(G("pSub")||{value:""}).value,pName:(G("pName")||{value:""}).value},
    settings:{gst:pfN("sGST"),cont:pfN("sCont"),li:pfN("sLI"),royS:pfN("sRS"),royC:pfN("sRC"),gstBase:(window.GST_BASE||"A"),area:(typeof areaCfgSave==="function"?areaCfgSave():null),cessOn:(typeof cessCfg==="function"?cessCfg().on:false),cessPct:(typeof cessCfg==="function"?cessCfg().pct:21),cessScadaFirst:(typeof cessCfg==="function"?cessCfg().scadaFirst:true),
      contMode:((G("sContMode")||{}).value||"pct"),covCostUnit:(window.COV_COST_UNIT||"lakhs"),covCostManual:(window.COV_COST_MANUAL!=null?window.COV_COST_MANUAL:null),
      cancelScada:(typeof CANCEL_SCADA!=="undefined"?!!CANCEL_SCADA:false),gfOnly:(typeof GF_ONLY!=="undefined"?!!GF_ONLY:false),
      customScadaVal:(typeof CUSTOM_SCADA_VAL!=="undefined"?(CUSTOM_SCADA_VAL||-126):-126),customScadaBt:(typeof CUSTOM_SCADA_BT!=="undefined"&&CUSTOM_SCADA_BT!=null?CUSTOM_SCADA_BT:-63),
      bitHeatVal:(typeof BIT_HEAT_VAL!=="undefined"?BIT_HEAT_VAL:137),dcmRows:(typeof DCM_ROWS!=="undefined"?JSON.parse(JSON.stringify(DCM_ROWS||[])):[])},
    lkm:(function(){var _lk={};if(typeof LCD!=="undefined"){for(var _i=0;_i<LCD.length;_i++){var _el=G("lkm_"+_i);if(_el)_lk[_i]=parseFloat(_el.value)||0;}}return _lk;})(),
    leadKm:(function(){var _lkf={};if(typeof LEAD_KM!=="undefined"){for(var _k3 in LEAD_KM)_lkf[_k3]=LEAD_KM[_k3];}return _lkf;})(),
    leadLoc:(function(){var _llf={};if(typeof LEAD_LOC!=="undefined"){for(var _l3 in LEAD_LOC)_llf[_l3]=LEAD_LOC[_l3];}return _llf;})(),
    lcExtra:(typeof lcExtraForSave==="function"?JSON.parse(JSON.stringify(lcExtraForSave())):[]),
    mtfCosts:(function(){var _mc={};if(typeof mtfData!=="undefined"){for(var _mi2=0;_mi2<mtfData.length;_mi2++)_mc[mtfData[_mi2].sr]=mtfData[_mi2].cost;}return _mc;})(),
    mtfCustom:(typeof mtfCustomRowsForSave==="function"?JSON.parse(JSON.stringify(mtfCustomRowsForSave())):[]),
    mtfDesc:(typeof mtfDescOverridesForSave==="function"?JSON.parse(JSON.stringify(mtfDescOverridesForSave())):{}),
    mtfConc:(typeof mtfConcForSave==="function"?JSON.parse(JSON.stringify(mtfConcForSave())):null),
    testReport:(typeof trForSave==="function"?JSON.parse(JSON.stringify(trForSave()||null)):null),
    grData:(typeof grForSave==="function"?JSON.parse(JSON.stringify(grForSave()||null)):null),
    steelRows:(typeof steelRows!=="undefined"?JSON.parse(JSON.stringify(steelRows)):[]),
    scSecs:(typeof scSecs!=="undefined"?JSON.parse(JSON.stringify(scSecs)):[]),
    extraRows:(typeof EXTRA_ROWS!=="undefined"?JSON.parse(JSON.stringify(EXTRA_ROWS)):[]),
    leadMapData:_leadMapData,planData:_planData,
    isPublic:true,grand:_g,updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
  var prm,_wasVersioned=false;
  if(CUR_EST_ID){
    /* Ha ek aadhich load/save kelela estimate aahe — pahilyanda existing
       doc shi actual data compare karto. Kahich badal nasel tar tyach
       doc madhe silently update (navin version nahi). Khara badal
       asel tarach navin version tayar hoto, juna record tasach thevun. */
    prm=db.collection("estimates").doc(CUR_EST_ID).get().then(function(snap){
      var existing=snap.exists?snap.data():null;
      var _wt=!!(existing&&existing.mtfConc!==undefined);
      var unchanged=existing&&_atpCloudComparable(existing,_wt)===_atpCloudComparable(data,_wt);
      if(unchanged){
        data.name=existing.name||nm;
        data.baseName=existing.baseName||nm;
        return db.collection("estimates").doc(CUR_EST_ID).update(data);
      }
      return db.collection("estimates").where("uid","==",CU.uid).get().then(function(snap2){
        var names=[];snap2.forEach(function(d2){var dd=d2.data();names.push(dd.baseName||dd.name||'');});
        /* Nav badalle (ABCD -> XYZ) ani XYZ aadhi nasel = navin estimate "XYZ"; ABCD tasach rahto. Nahitar (v2) version. */
        var _renamed=!!(existing&&(existing.baseName||existing.name||"")!==nm&&(existing.name||"")!==nm);
        if(_renamed&&names.indexOf(nm)<0){data.name=nm;_wasVersioned=false;}
        else{data.name=_atpNextCloudVersionName(names,nm);_wasVersioned=true;}
        data.createdAt=firebase.firestore.FieldValue.serverTimestamp();data.collaborators=[];
        data.isPrivate=true; /* sagle estimates private */
        return db.collection("estimates").add(data).then(function(r){CUR_EST_ID=r.id;});
      });
    });
  } else {
    data.createdAt=firebase.firestore.FieldValue.serverTimestamp();data.collaborators=[];
    prm=db.collection("estimates").add(data).then(function(r){CUR_EST_ID=r.id;});
  }
  prm.then(function(){try{if(typeof atpIdxSync==="function")atpIdxSync(CUR_EST_ID,data);}catch(_ie){}showToast(_wasVersioned?("\u2705 Saved as new version: \""+data.name+"\""):"Saved ☁️","success");loadCloudList();}).catch(function(e){showToast("Save failed: "+e.message,"error");});
}

function loadCloudList(){
  var list=G("cloudEstList");if(!list)return;
  if(!CU||!window.firebase||!firebase.firestore){list.innerHTML="<div style='color:#aaa;font-size:.65rem;padding:.4rem'>Login required</div>";return;}
  list.innerHTML="<div style='color:#aaa;font-size:.65rem;padding:.4rem'>Loading...</div>";
  firebase.firestore().collection("estimates").where("uid","==",CU.uid).limit(50).get()
    .then(function(snap){
      var all=[];window._cloudCache={};snap.forEach(function(d){all.push({id:d.id,d:d.data()});window._cloudCache[d.id]=d.data();});
      all.sort(function(a,b){return(b.d.updatedAt?b.d.updatedAt.seconds:0)-(a.d.updatedAt?a.d.updatedAt.seconds:0);});
      if(!all.length){list.innerHTML="<div style='color:#aaa;font-size:.65rem;padding:.4rem;font-style:italic'>No saved estimates</div>";return;}
      list.innerHTML=all.map(function(item){
        var d=item.d,id=item.id,dt=d.updatedAt?new Date(d.updatedAt.seconds*1000).toLocaleDateString("en-IN"):"--",gr=d.grand?"&#8377;"+fmtN(d.grand):"";
        return "<div class='citem' onclick='loadEst(\""+id+"\")'>"+
          "<div class='cname'>"+esc(d.name||"Untitled")+"</div>"+
          "<div class='cmeta'>"+dt+(gr?" · "+gr:"")+"</div>"+
          "<button class='c-shr' onclick='event.stopPropagation();openShare(\""+id+"\")' title='Share'>🔗</button>"+
          "<span title='Private — others must request access' style='flex-shrink:0;font-size:.8rem;padding:0 .1rem'>🔒</span>"+
          "<button class='c-dl' onclick='event.stopPropagation();dlEst(\""+id+"\")' title='Download'>⬇️</button>"+
          "<button class='c-del' onclick='event.stopPropagation();delEst(\""+id+"\")''>🗑️</button></div>";
      }).join("");
    }).catch(function(e){list.innerHTML="<div style='color:red;font-size:.65rem'>Error: "+e.message+"</div>";});
}

/* Settings tab values that the cloud copy used to drop: SCADA (cancel / custom values), bitumen heat value,
   Diff. Cost of Material rows, contingency mode. Same logic as _atpApplyEstimate (local load). */
function _atpCloudApplyMisc(st){
  st=st||{};
  try{
    CANCEL_SCADA=!!st.cancelScada;
    CUSTOM_SCADA_VAL=(st.customScadaVal!=null?st.customScadaVal:-126);
    CUSTOM_SCADA_BT=(st.customScadaBt!=null?st.customScadaBt:-63);
    BIT_HEAT_VAL=(st.bitHeatVal!=null?st.bitHeatVal:137);
    DCM_ROWS=(st.dcmRows&&st.dcmRows.length)?JSON.parse(JSON.stringify(st.dcmRows)):[];
    var e1=G("sScadaBt");if(e1)e1.value=CUSTOM_SCADA_BT;
    var e2=G("sBitHeat");if(e2)e2.value=BIT_HEAT_VAL;
    var e3=G("sScadaVal");if(e3)e3.value=CUSTOM_SCADA_VAL;
    var e4=G("sContMode");if(e4){e4.value=(st.contMode==="amt")?"amt":"pct";if(typeof contModeChg==="function")contModeChg(true);}
    var b=G("scadaCancelBtn");
    if(b){if(CANCEL_SCADA){b.textContent="\u2705 SCADA Cancelled";b.style.background="#e8f5e9";b.style.color="#2e7d32";b.style.borderColor="#2e7d32";}
          else{b.textContent="\u274c SCADA Deduction Active";b.style.background="#fff";b.style.color="#c62828";b.style.borderColor="#c62828";}}
    if(typeof dcmRender==="function")dcmRender();
  }catch(_m){}
}
/* "Open as copy" and "open shared link" used to restore only items + cover + lead km, so GST / contingency / royalty rates,
   lead km, Testing tab, steel, extra % rows etc. of the opened estimate were lost. This applies the rest of the saved data. */
function _atpCloudApplyRest(d){
  if(!d)return;
  window._atpAutoHold=Date.now()+4000;
  try{
    var st=d.settings||{};
    var ks=["gst","cont","li","royS","royC"];
    ["sGST","sCont","sLI","sRS","sRC"].forEach(function(k,i){var e=G(k);if(e&&st[ks[i]]!=null)e.value=st[ks[i]];});
    window.GST_BASE=(st.gstBase==="ABC")?"ABC":"A";
    try{if(typeof cessRestore==="function")cessRestore(st);if(typeof areaRestore==="function")areaRestore(st.area,d.items);}catch(_a){}
    try{
      window.COV_COST_UNIT=(st.covCostUnit==="thousands"||st.covCostUnit==="actual")?st.covCostUnit:"lakhs";
      window.COV_COST_MANUAL=(st.covCostManual!=null&&st.covCostManual!=="")?String(st.covCostManual):null;
      if(typeof covCostRender==="function")covCostRender();
    }catch(_c){}
    try{GF_ONLY=!!st.gfOnly;if(typeof gfBtnRefresh==="function"){gfBtnRefresh();gfHead();}}catch(_g){}
    _atpCloudApplyMisc(st);
    if(d.leadKm){for(var k1 in d.leadKm){if(typeof LEAD_KM!=="undefined")LEAD_KM[k1]=d.leadKm[k1];}}
    if(d.leadLoc){for(var k2 in d.leadLoc){if(typeof LEAD_LOC!=="undefined")LEAD_LOC[k2]=d.leadLoc[k2];}}
    if(typeof mtfData!=="undefined"){
      if(!(d.mtfCustom&&d.mtfCustom.length))mtfData=mtfData.filter(function(r){return !r.isCustom;});
      if(typeof mtfRestoreCustom==="function")mtfRestoreCustom(d.mtfCustom);
      if(d.mtfCosts){for(var k3 in d.mtfCosts){var r3=mtfData.find(function(r){return r.sr===parseInt(k3)||r.sr===k3;});if(r3)r3.cost=parseFloat(d.mtfCosts[k3])||0;}}
      if(d.mtfDesc){for(var k4 in d.mtfDesc){var r4=mtfData.find(function(r){return r.sr===parseInt(k4)||r.sr===k4;});if(r4&&!r4.isCustom)r4.desc=d.mtfDesc[k4];}}
    }
    if(typeof mtfConcRestore==="function")mtfConcRestore(d.mtfConc);
    if(typeof trRestore==="function")trRestore(d.testReport);
    if(typeof grRestore==="function")grRestore(d.grData);
    if(d.steelRows&&typeof steelRows!=="undefined"){steelRows=JSON.parse(JSON.stringify(d.steelRows));if(typeof renderSteel==="function")renderSteel();}
    if(Array.isArray(d.extraRows)){EXTRA_ROWS=JSON.parse(JSON.stringify(d.extraRows));if(typeof renderExtraRows==="function")renderExtraRows();}
    if(d.scSecs&&typeof scSecs!=="undefined"){scSecs=JSON.parse(JSON.stringify(d.scSecs));var mx=0;d.scSecs.forEach(function(x){var n=parseInt((x.id||"0").toString().replace(/[^0-9]/g,""))||0;if(n>mx)mx=n;});if(typeof scUID!=="undefined")scUID=mx;if(typeof scRender==="function")scRender();}
    if(d.planData&&typeof window._setPlanData==="function"){try{window._setPlanData(d.planData);}catch(_p){}}
  }catch(e){console.error("_atpCloudApplyRest failed",e);}
}
function loadEst(docId){
  if(!window.firebase||!firebase.firestore)return;
  firebase.firestore().collection("estimates").doc(docId).get().then(function(d){
    if(!d.exists){showToast("Not found","error");return;}
    var data=d.data();CUR_EST_ID=docId;window._atpAutoHold=Date.now()+4000;
    if(data.items)items=data.items;
    if(data.cover){["pReg","pCir","pDiv","pSub","pName"].forEach(function(k){var e=G(k);if(e&&data.cover[k]!=null)e.value=data.cover[k];});}
    if(data.settings){var ks=["gst","cont","li","royS","royC"];["sGST","sCont","sLI","sRS","sRC"].forEach(function(k,i){var e=G(k);if(e&&data.settings[ks[i]]!=null)e.value=data.settings[ks[i]];});}
    window.GST_BASE=((data.settings||{}).gstBase==="ABC")?"ABC":"A";
    /* Cess + Area % (1st / 2nd area type) */
    try{if(typeof cessRestore==="function")cessRestore(data.settings||{});if(typeof areaRestore==="function")areaRestore((data.settings||{}).area,data.items);}catch(_ar){}
    /* Cover page Estimated Cost (unit + typed value) */
    try{
      var _cs=data.settings||{};
      window.COV_COST_UNIT=(_cs.covCostUnit==="thousands"||_cs.covCostUnit==="actual")?_cs.covCostUnit:"lakhs";
      window.COV_COST_MANUAL=(_cs.covCostManual!=null&&_cs.covCostManual!=="")?String(_cs.covCostManual):null;
      if(typeof covCostRender==="function")covCostRender();
    }catch(_cc){}
    /* Only Ground Floor setting (Settings tab button) */
    try{GF_ONLY=!!((data.settings||{}).gfOnly);if(typeof gfBtnRefresh==="function"){gfBtnRefresh();gfHead();}}catch(_gf){}
    _atpCloudApplyMisc(data.settings);   /* SCADA, bitumen heat, Diff. cost of material, contingency mode */
    /* Restore lead KM and MTF test costs */
    if(data.leadKm){for(var _lk3 in data.leadKm){if(typeof LEAD_KM!=="undefined")LEAD_KM[_lk3]=data.leadKm[_lk3];}}
    if(data.leadLoc){for(var _ll3 in data.leadLoc){if(typeof LEAD_LOC!=="undefined")LEAD_LOC[_ll3]=data.leadLoc[_ll3];}}
    /* Restore Testing tab: custom rows first (so their costs can be applied below) */
    try{
      if(typeof mtfData!=="undefined"&&!(data.mtfCustom&&data.mtfCustom.length))mtfData=mtfData.filter(function(r){return !r.isCustom;});
      if(typeof mtfRestoreCustom==="function")mtfRestoreCustom(data.mtfCustom);
    }catch(_mt1){}
    if(data.mtfCosts&&typeof mtfData!=="undefined"){for(var _rk3 in data.mtfCosts){var _rr3=mtfData.find(function(r){return r.sr===parseInt(_rk3)||r.sr===_rk3;});if(_rr3)_rr3.cost=parseFloat(data.mtfCosts[_rk3])||0;}}
    /* Testing tab: description overrides, concrete grades / VQCC picks / mix design, test report */
    try{
      if(data.mtfDesc&&typeof mtfData!=="undefined"){for(var _ddk3 in data.mtfDesc){var _ddr3=mtfData.find(function(r){return r.sr===parseInt(_ddk3)||r.sr===_ddk3;});if(_ddr3&&!_ddr3.isCustom)_ddr3.desc=data.mtfDesc[_ddk3];}}
      if(typeof mtfConcRestore==="function")mtfConcRestore(data.mtfConc);
      if(typeof trRestore==="function")trRestore(data.testReport);
      if(typeof grRestore==="function")grRestore(data.grData);
    }catch(_mt2){}
    /* Restore steel calculator simple rows */
    if(data.steelRows&&typeof steelRows!=="undefined"){steelRows=JSON.parse(JSON.stringify(data.steelRows));if(typeof renderSteel==="function")renderSteel();}
    if(Array.isArray(data.extraRows)){EXTRA_ROWS=JSON.parse(JSON.stringify(data.extraRows));if(typeof renderExtraRows==="function")renderExtraRows();}
    /* Restore advanced steel calculator sections (Footing 1, Footing 2, Column 1, Column 2 etc.) */
    if(data.scSecs&&typeof scSecs!=="undefined"){scSecs=JSON.parse(JSON.stringify(data.scSecs));if(data.scSecs.length){var _mxId3=0;data.scSecs.forEach(function(s){var n=parseInt((s.id||"0").toString().replace(/[^0-9]/g,""))||0;if(n>_mxId3)_mxId3=n;});if(typeof scUID!=="undefined")scUID=_mxId3;}if(typeof scRender==="function")scRender();}
    /* Rebuild lead charges first so lkm_ inputs exist, then populate them */
    if(typeof buildLCT==="function")buildLCT();
    if(typeof lcExtraRestore==="function")lcExtraRestore(data.lcExtra);   /* user-added Lead Charges rows */
    if(data.lkm){for(var _ki in data.lkm){var _el2=G("lkm_"+_ki);if(_el2&&typeof onKmChange==="function"){_el2.value=data.lkm[_ki];onKmChange(parseInt(_ki));}}}
    if(typeof updateAll==="function")updateAll();if(typeof upCover==="function")upCover();if(typeof upMeta==="function")upMeta();if(typeof goTab==="function")goTab(0);
    /* Restore Plan tab drawing */
    if(data.planData&&typeof window._setPlanData==="function"){try{window._setPlanData(data.planData);}catch(_pe){}}
    /* Restore Quarry Chart drawing */
    if(data.leadMapData&&typeof SP!=="undefined"){
      try{
        var _lmd=data.leadMapData;
        if(typeof spSaveHistory==="function")spSaveHistory();
        SP.shapes=_lmd.shapes||[];SP.bgImgX=_lmd.bgImgX||20;SP.bgImgY=_lmd.bgImgY||20;SP.bgImgW=_lmd.bgImgW||0;SP.bgImgH=_lmd.bgImgH||0;SP.bgImg=null;
        if(_lmd.bgImgData){var _limg=new Image();_limg.onload=function(){SP.bgImg=_limg;SP.bgImgAspect=(_limg.height&&_limg.width)?_limg.width/_limg.height:1;if(typeof spRedraw==="function")spRedraw();var _lb=G("spRemoveImgBtn");if(_lb)_lb.style.display="";var _lo=G("spImgOpacityWrap");if(_lo)_lo.style.display="flex";};_limg.src=_lmd.bgImgData;}else{if(typeof spRedraw==="function")spRedraw();}
      }catch(_lme){}
    }
    showToast("Loaded: "+esc(data.name||""),"success");
    /* Auto-save locally (include steel data) */
    try{
      var _nm=(data.name||"").trim()||(data.cover&&data.cover.pName?data.cover.pName.trim():"");
      if(_nm&&typeof getStore==="function"&&typeof putStore==="function"){
        var _ls=getStore();var _lk={};
        if(typeof LCD!=="undefined"){for(var _i=0;_i<LCD.length;_i++){var _el=document.getElementById("lkm_"+_i);if(_el)_lk[_i]=parseFloat(_el.value)||0;}}
        _ls[_nm]={nm:_nm,dt:new Date().toLocaleDateString("en-IN"),
          meta:{pName:((G("pName")||{value:""}).value||""),pSub:((G("pSub")||{value:""}).value||""),
            pDiv:((G("pDiv")||{value:""}).value||""),pCir:((G("pCir")||{value:""}).value||""),
            pReg:((G("pReg")||{value:""}).value||""),
            covCostUnit:(window.COV_COST_UNIT||"lakhs"),covCostManual:(window.COV_COST_MANUAL!=null?window.COV_COST_MANUAL:null),gfOnly:!!((data.settings||{}).gfOnly),area:((data.settings||{}).area||null),cessOn:((data.settings||{}).cessOn===true),cessPct:(data.settings||{}).cessPct,cessScadaFirst:(data.settings||{}).cessScadaFirst},
          lkm:_lk,leadKm:(data.leadKm||{}),leadLoc:(data.leadLoc||{}),
          mtfCosts:(data.mtfCosts||{}),
          steelRows:(data.steelRows?JSON.parse(JSON.stringify(data.steelRows)):[]),
          scSecs:(data.scSecs?JSON.parse(JSON.stringify(data.scSecs)):[]),
          extraRows:(data.extraRows?JSON.parse(JSON.stringify(data.extraRows)):[]),
          items:typeof items!=="undefined"?items:[]};
        try{
          var _e=_ls[_nm],_cs2=data.settings||{};
          _e.lcExtra=data.lcExtra||[];_e.mtfCustom=data.mtfCustom||[];_e.mtfDesc=data.mtfDesc||{};_e.mtfConc=data.mtfConc||null;_e.testReport=data.testReport||null;_e.grData=data.grData||null;
          _e.leadLoc=data.leadLoc||{};
          var _m2=_e.meta;_m2.sGST=_cs2.gst;_m2.sCont=_cs2.cont;_m2.sContMode=_cs2.contMode||"pct";_m2.sLI=_cs2.li;_m2.sRS=_cs2.royS;_m2.sRC=_cs2.royC;
          _m2.cancelScada=!!_cs2.cancelScada;_m2.customScadaVal=_cs2.customScadaVal;_m2.customScadaBt=_cs2.customScadaBt;_m2.bitHeatVal=_cs2.bitHeatVal;_m2.dcmRows=_cs2.dcmRows||[];_m2.gstBase=_cs2.gstBase||"A";
        }catch(_le2){}
        putStore(_ls);
        if(typeof renderSaveList==="function")renderSaveList();
        if(typeof renderHomeScreen==="function")renderHomeScreen();
        showToast("\u2705 Auto-saved to local storage","success");
      }
    }catch(_e){}
  });
}

function dlEst(docId){if(!canDownload())return;CUR_EST_ID=docId;loadEst(docId);setTimeout(function(){if(typeof printAll==="function")printAll();},600);}
function delEst(docId){if(!confirm("Delete this record?"))return;firebase.firestore().collection("estimates").doc(docId).delete().then(function(){if(typeof atpIdxRemove==="function")atpIdxRemove(docId);if(CUR_EST_ID===docId)CUR_EST_ID=null;showToast("Deleted","info");loadCloudList();});}
function newEstimate(){if(!confirm("Clear all data and start a new estimate?"))return;CUR_EST_ID=null;if(typeof items!=="undefined")items=[];/* office details (Region / Circle / Division / Sub Division) stay for the next estimate — only the Name of Work is cleared */
[["pReg","P.W. Region, "],["pCir","P.W. Circle, "],["pDiv","P.W. Division, "]].forEach(function(p){var e=G(p[0]);if(e&&!String(e.value||"").trim())e.value=p[1];});
var _nw=G("pName");if(_nw){_nw.value="";_nw.style.height="auto";}
if(typeof grRestore==="function")try{grRestore(null);}catch(_g){}   /* General Report back to a fresh one */
if(typeof upCover==="function")upCover();if(typeof buildLCT==="function")buildLCT();if(typeof updateAll==="function")updateAll();if(typeof goTab==="function")goTab(0);showToast("New estimate ready ✅","success");}

/* ADMIN DASHBOARD */
var AD={pays:[],users:[],ests:[],diary:[],qrFile:null};
function aDt(ts){return ts?new Date(ts.seconds*1000).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}):"—";}
function doAdminLogout(){
  if(!confirm('Do you want to log out of admin?'))return;
  sessionStorage.removeItem('_adminOpen');
  if(_unsub_pay){_unsub_pay();_unsub_pay=null;}
  if(_unsub_user){_unsub_user();_unsub_user=null;}
  if(typeof aStopQueryListener==='function')aStopQueryListener();
  if(typeof A_CHAT_UNSUB!=='undefined'&&A_CHAT_UNSUB){A_CHAT_UNSUB();A_CHAT_UNSUB=null;}
  firebase.auth().signOut().then(function(){
    if(G('adminDash'))G('adminDash').style.display='none';
    if(G('adminWrap'))G('adminWrap').style.display='none';
    if(G('portalPwd'))G('portalPwd').value='';
    if(G('loginShell'))G('loginShell').style.display='flex';
  }).catch(function(e){showToast('Logout error: '+e.message,'error');});
}

function aStartPayListener(){
  if(_unsub_pay){_unsub_pay();_unsub_pay=null;}
  try{
    _unsub_pay=firebase.firestore().collection("payments").where("status","==","pending").onSnapshot(function(s){
      var c=s.size;if(G("pendCnt"))G("pendCnt").textContent=c;
      if(G("pendBanner"))G("pendBanner").classList[c>0?"add":"remove"]("show");
      if(G("payDot"))G("payDot").innerHTML=c>0?"<span class='ndot'></span>":"";
    },function(e){_unsub_pay=null;});
  }catch(e){_unsub_pay=null;}
}

function aLoadAll(){
  if(!window.firebase||!firebase.firestore)return;
  if(typeof aInjectQueryInbox==="function")aInjectQueryInbox();
  if(typeof aStartQueryListener==="function")aStartQueryListener();
  if(G("aStats"))G("aStats").innerHTML="<div class='astat'><div class='aloading'><span class='spin2'></span></div></div>";
  var db=firebase.firestore();
  function safeGet(col,q){return q.catch(function(e){if(window._fsIsQuota&&_fsIsQuota(e))_fsQuotaHit();return {forEach:function(){}};});}
  Promise.all([
    safeGet("pay",db.collection("payments").orderBy("createdAt","desc").limit(50).get()),
    safeGet("usr",db.collection("users").limit(500).get()),
    safeGet("est",db.collection("estimates").orderBy("updatedAt","desc").limit(50).get())
  ]).then(function(res){
    AD.pays=[];res[0].forEach(function(d){AD.pays.push(Object.assign({_id:d.id},d.data()));});
    AD.users=[];res[1].forEach(function(d){AD.users.push(Object.assign({_id:d.id},d.data()));});
    AD.users.sort(function(a,b){var ta=a.createdAt&&a.createdAt.seconds?a.createdAt.seconds:0;var tb=b.createdAt&&b.createdAt.seconds?b.createdAt.seconds:0;return tb-ta;});
    AD.ests=[];res[2].forEach(function(d){AD.ests.push(Object.assign({_id:d.id},d.data()));});
    if(!AD.pays.length&&!AD.users.length&&window._FS_QUOTA_HIT){return;}
    if(!AD.pays.length&&!AD.users.length){
      showToast("Firestore rules — update in Firebase Console","warn");
      if(G("aStats"))G("aStats").innerHTML="<div class='astat rd' style='grid-column:1/-1;padding:.8rem'><div class='astn' style='font-size:.8rem'>&#9888; Firestore Rules Issue</div><div class='astl'>Firebase Console → Firestore → Rules → set: allow read, write: if request.auth != null;<br><br><button onclick='aLoadAll()' style='padding:.3rem .7rem;background:#1565c0;color:#fff;border:none;border-radius:4px;font-size:.65rem;cursor:pointer'>&#128260; Retry</button></div></div>";
      return;
    }
    aRenderStats();aRenderPays(AD.pays);aRenderUsers(AD.users);aRenderEsts(AD.ests);aRenderRev();try{aRenderUsage();}catch(_e){}showToast("Loaded ✅","success");
  }).catch(function(e){
    showToast("Permission error — update Firestore rules","error");
    if(G("aStats"))G("aStats").innerHTML="<div class='astat rd' style='grid-column:1/-1'><div class='astn' style='font-size:.75rem'>❌ "+e.message+"</div><div class='astl'>Update Firestore security rules to allow admin access</div></div>";
  });
}

/* ── ADMIN: JE DIARY (all JEs' work-diary entries, read across every user's uid) ── */
function aJEName(uid){
  var u=(AD.users||[]).filter(function(x){return x._id===uid;})[0];
  if(u)return u.name||u.phone||u.email||(uid?uid.slice(0,8)+'…':'—');
  return uid?uid.slice(0,8)+'…':'—';
}
function aLoadDiary(){
  if(!window.firebase||!firebase.firestore)return;
  if(G("diaryTbody"))G("diaryTbody").innerHTML="<tr><td colspan='7'><div class='aloading'><span class='spin2'></span></div></td></tr>";
  firebase.firestore().collectionGroup("entries").get().then(function(snap){
    var rows=[];
    snap.forEach(function(d){
      if(d.id.indexOf("work:")!==0)return; /* skip customVillages/customRoads/layout:positions/file: docs */
      var parts=d.id.split(":");
      var type=parts[1]||"",refId=parts.slice(2).join(":")||"";
      var uid=(d.ref.parent&&d.ref.parent.parent)?d.ref.parent.parent.id:"";
      var data=d.data()||{};
      var arr=[];try{arr=JSON.parse(data.value||"[]");}catch(e){arr=[];}
      arr.forEach(function(w){
        rows.push({uid:uid,refType:type,refId:refId,text:w.text||"",status:w.status||"",logged:w.logged||"",
          workOrderDate:w.workOrderDate||"",contractorName:w.contractorName||"",contractorPhone:w.contractorPhone||"",
          dlp:w.dlp||"",orderFileKey:w.orderFileKey||null,mbFileKey:w.mbFileKey||null});
      });
    });
    rows.sort(function(a,b){return (b.logged||"").localeCompare(a.logged||"");});
    AD.diary=rows;
    aRenderDiary(AD.diary);
    if(rows.length)showToast("JE Diary loaded ✅","success");
  }).catch(function(e){
    if(G("diaryTbody"))G("diaryTbody").innerHTML="<tr><td colspan='7' style='text-align:center;color:#c0392b;padding:1.5rem'>❌ "+esc(e.message)+"<br><span style='font-size:.62rem;color:#888'>In Firebase Console → Firestore → Rules, add a separate allow-read rule for admin (email match) on je_diary/{uid}/entries/{doc}</span></td></tr>";
  });
}
function aRenderDiary(rows){
  rows=rows||AD.diary||[];
  if(!G("diaryTbody"))return;
  if(!rows.length){G("diaryTbody").innerHTML="<tr><td colspan='7' style='text-align:center;color:#aaa;padding:2rem'>No diary entries found yet</td></tr>";return;}
  G("diaryTbody").innerHTML=rows.map(function(w){
    var refLbl=(w.refType==="road"?"🛣️ ":"🏘️ ")+esc(w.refId);
    var att="";
    if(w.orderFileKey)att+="<button class='xbtn xbl' title='Work Order' onclick='aViewDiaryFile(\""+w.uid+"\",\""+w.orderFileKey+"\")'>📎WO</button> ";
    if(w.mbFileKey)att+="<button class='xbtn xbl' title='MB' onclick='aViewDiaryFile(\""+w.uid+"\",\""+w.mbFileKey+"\")'>📎MB</button>";
    return "<tr><td><strong>"+esc(aJEName(w.uid))+"</strong></td>"+
      "<td style='font-size:.65rem;white-space:nowrap'>"+esc(w.logged||"—")+"</td>"+
      "<td style='font-size:.65rem;white-space:nowrap'>"+refLbl+"</td>"+
      "<td style='font-size:.65rem'>"+esc(w.status||"—")+"</td>"+
      "<td style='font-size:.65rem;max-width:240px;white-space:normal'>"+esc(w.text||"")+"</td>"+
      "<td style='font-size:.63rem'>"+esc(w.contractorName||"—")+(w.contractorPhone?" ("+esc(w.contractorPhone)+")":"")+"<br>DLP: "+esc(w.dlp||"—")+"</td>"+
      "<td style='white-space:nowrap'>"+(att||"—")+"</td></tr>";
  }).join("");
}
function fDiary(){
  var q=(G("diaryQ")?G("diaryQ").value:"").toLowerCase();
  var f=G("diaryFlt")?G("diaryFlt").value:"all";
  aRenderDiary((AD.diary||[]).filter(function(w){
    var hay=(aJEName(w.uid)+" "+w.refId+" "+w.text+" "+w.contractorName).toLowerCase();
    return (!q||hay.indexOf(q)>-1)&&(f==="all"||w.refType===f);
  }));
}
function aViewDiaryFile(uid,key){
  if(!uid||!key)return;
  firebase.firestore().collection("je_diary").doc(uid).collection("entries").doc(String(key).replace(/\//g,"_")).get()
    .then(function(d){
      if(!d.exists){showToast("File not found","error");return;}
      var f=null;try{f=JSON.parse((d.data()||{}).value||"null");}catch(e){}
      if(f&&f.dataUrl)window.open(f.dataUrl,"_blank");
      else showToast("File not found","error");
    }).catch(function(e){showToast("Error: "+e.message,"error");});
}

function aRenderStats(){
  var pend=AD.pays.filter(function(p){return p.status==="pending";}).length;
  var vrev=AD.pays.filter(function(p){return p.status==="verified";}).reduce(function(s,p){return s+(p.amount||PAY_AMOUNT);},0);
  if(G("aStats"))G("aStats").innerHTML=aStat(AD.users.length,"👥 Users","")+aStat(AD.pays.length,"💳 Payments","bl")+aStat(pend,"⏳ Pending","rd")+aStat("₹"+vrev.toLocaleString("en-IN"),"💰 Revenue","gr");
}
function aStat(n,l,c){return "<div class='astat "+c+"'><div class='astn'>"+n+"</div><div class='astl'>"+l+"</div></div>";}

function aRenderPays(pays){
  if(!G("payTbody"))return;
  if(!pays.length){G("payTbody").innerHTML="<tr><td colspan='5' style='text-align:center;color:#aaa;padding:2rem'>No payments</td></tr>";return;}
  G("payTbody").innerHTML=pays.map(function(p){
    var badge=p.status==="pending"?"<span class='abpd'>⏳</span>":p.status==="verified"?"<span class='abv'>✅</span>":"<span class='abrj'>❌</span>";
    var acts=(p.status==="pending"?"<button class='xbtn xgr' onclick='aVerify(\""+p._id+"\",\""+p.uid+"\")'>✅</button><button class='xbtn xrd' onclick='aReject(\""+p._id+"\")'>❌</button>":"")+
      "<button class='xbtn xbl' onclick='aViewPay(\""+p._id+"\")'>👁️</button>";
    return "<tr><td><strong>"+esc(p.name||"—")+"</strong><br><span style='font-size:.62rem;color:#888'>"+esc(p.phone||p.email||"")+"</span></td>"+
      "<td style='font-weight:800;color:#18602f'>₹"+(p.amount||PAY_AMOUNT)+"</td><td>"+badge+"</td>"+
      "<td style='font-size:.67rem;color:#888'>"+aDt(p.createdAt)+"</td>"+
      "<td style='display:flex;gap:.3rem'>"+acts+"</td></tr>";
  }).join("");
}
function fPays(){var q=(G("payQ").value||"").toLowerCase(),f=G("payFlt").value;aRenderPays(AD.pays.filter(function(p){return(!q||(p.name||"").toLowerCase().includes(q)||(p.phone||"").includes(q)||(p.email||"").toLowerCase().includes(q))&&(f==="all"||p.status===f);}));}

function aVerify(payId,uid,delShot){
  var db=firebase.firestore(),T=firebase.firestore.Timestamp;
  var pr=(AD.pays||[]).find(function(x){return x._id===payId;})||{};
  var months=parseInt(pr.planMonths,10);
  if(!months){var inp=prompt("How many months should the plan be? (1 = Monthly, 12 = Yearly)","1");if(inp===null)return;months=parseInt(inp,10);if(isNaN(months)||months<1){showToast("Enter a valid number","warn");return;}}
  var _up={status:"verified",verifiedAt:firebase.firestore.FieldValue.serverTimestamp()};
  if(delShot){_up.screenshotURL=firebase.firestore.FieldValue.delete();_up.screenshotDeleted=true;}
  db.collection("payments").doc(payId).update(_up).then(function(){
    if(!uid){showToast("Verified ✅","success");aLoadAll();return;}
    return db.collection("users").doc(uid).get().then(function(ud){
      var d=ud.exists?ud.data():{},dl=d.dlCount||0,now=Date.now(),curEnd=_tsMs(d.planEnd),ext=curEnd>now;
      var td=new Date();td=new Date(td.getFullYear(),td.getMonth(),td.getDate());
      var segStart=ext?new Date(curEnd+1):td;
      var planStart=ext?(_tsMs(d.planStart)||td.getTime()):td.getTime();
      var e=_addMonths(segStart,months).getTime()-1;
      return db.collection("users").doc(uid).update({
        planStart:T.fromMillis(planStart),planEnd:T.fromMillis(e),
        planMonths:(ext?(parseInt(d.planMonths,10)||0):0)+months,
        freeLimit:dl,planSetAt:firebase.firestore.FieldValue.serverTimestamp()
      }).then(function(){showToast("Verified ✅ Plan active till "+_dmy(e),"success");aLoadAll();});
    });
  }).catch(function(e){showToast("Error: "+e.message,"error");});
}
function aReject(payId){if(!confirm("Reject?"))return;firebase.firestore().collection("payments").doc(payId).update({status:"rejected",rejectedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){showToast("Rejected","warn");aLoadAll();}).catch(function(e){showToast("Error: "+e.message,"error");});}

function aViewPay(payId){
  var p=AD.pays.find(function(x){return x._id===payId;});if(!p)return;
  var h=pRw("Name",p.name||"—")+pRw("Phone",p.phone||"—")+pRw("Amount","₹"+(p.amount||PAY_AMOUNT))+pRw("Status",p.status)+pRw("Time",aDt(p.createdAt));
  if(p.screenshotURL){h+="<div style='margin:.7rem 0'><div style='font-size:.65rem;font-weight:800;color:#888;margin-bottom:.3rem'>SCREENSHOT:</div><img src='"+esc(p.screenshotURL)+"' class='pdss' alt='' onerror='this.style.display=\"none\"'></div>";
    if(p.status!=="pending")h+="<button class='xbtn xrd' onclick='aDelShot(\""+payId+"\")' style='width:100%;padding:.45rem;margin-bottom:.5rem'>\u{1F5D1}\uFE0F Delete screenshot (storage vachel)</button>";}
  else h+="<div style='background:#f8f6f2;border-radius:6px;padding:.8rem;text-align:center;color:#aaa;font-size:.72rem;margin:.7rem 0'>"+(p.screenshotDeleted?"Screenshot deleted \u2713":"No screenshot")+"</div>";
  if(p.status==="pending")h+="<label style='display:flex;align-items:center;gap:.4rem;font-size:.7rem;color:#555;margin:.4rem 0;cursor:pointer'><input type='checkbox' id='pdDelShot'> Verify nantar screenshot delete kara (storage vachel)</label><div class='actrow'><button class='xbtn xgr' onclick='aVerifyModal(\""+payId+"\",\""+esc(p.uid||"")+"\")' style='flex:1;padding:.55rem'>\u2705 Verify</button><button class='xbtn xrd' onclick='aReject(\""+payId+"\");document.getElementById(\"payDetailModal\").style.display=\"none\"' style='flex:1;padding:.55rem'>\u274C Reject</button></div>";
  if(G("pdBody"))G("pdBody").innerHTML=h;if(G("payDetailModal"))G("payDetailModal").style.display="flex";
}
function pRw(l,v){return "<div class='pdinforow'><span class='pdlbl'>"+l+"</span><span class='pdval'>"+esc(String(v))+"</span></div>";}
function aVerifyModal(payId,uid){
  var cb=G("pdDelShot"),del=!!(cb&&cb.checked);
  if(G("payDetailModal"))G("payDetailModal").style.display="none";
  aVerify(payId,uid,del);
}
function aDelShot(payId){
  if(!confirm("Screenshot permanently delete karaycha? (Payment record rahil, fakta image jail)"))return;
  firebase.firestore().collection("payments").doc(payId).update({screenshotURL:firebase.firestore.FieldValue.delete(),screenshotDeleted:true,screenshotDeletedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){
    var p=(AD.pays||[]).find(function(x){return x._id===payId;});if(p){delete p.screenshotURL;p.screenshotDeleted=true;}
    showToast("Screenshot deleted \u{1F5D1}\uFE0F","success");aViewPay(payId);
  }).catch(function(e){showToast("Error: "+e.message,"error");});
}

/* ── FIRESTORE QUOTA: usage estimate widget (admin) ── */
function aRenderUsage(){
  var box=G("aUsage");
  if(!box){var st=G("aStats");if(!st||!st.parentNode)return;box=document.createElement("div");box.id="aUsage";st.parentNode.insertBefore(box,st.nextSibling);}
  function sz(arr){var t=0;(arr||[]).forEach(function(d){try{t+=JSON.stringify(d).length;}catch(e){}});return t;}
  var avg={est:(AD.ests||[]).length?sz(AD.ests)/AD.ests.length:0,usr:(AD.users||[]).length?sz(AD.users)/AD.users.length:0,pay:(AD.pays||[]).length?sz(AD.pays)/AD.pays.length:0};
  var cnt={est:(AD.ests||[]).length,usr:(AD.users||[]).length,pay:(AD.pays||[]).length};
  var map={est:"estimates",usr:"users",pay:"payments"},db=firebase.firestore(),pend=0,done=0;
  function draw(exact){
    var bytes=(cnt.est*avg.est+cnt.usr*avg.usr+cnt.pay*avg.pay)*1.3; /* ~30% index overhead */
    var lim=1024*1024*1024,pct=Math.min(100,bytes/lim*100),col=pct<50?"#2e7d32":pct<80?"#ef6c00":"#c62828";
    var mb=(bytes/1048576).toFixed(1),pid="";try{pid=firebase.app().options.projectId||"";}catch(e){}
    box.innerHTML="<div style='background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:.6rem .8rem;margin:.6rem 0;font-size:.72rem'>"
      +"<div style='font-weight:800;margin-bottom:.3rem'>\u{1F4CA} Firestore storage (approx) <span style='font-weight:500;color:#888'>"+(exact?"":"(counting\u2026)")+"</span></div>"
      +"<div style='background:#eee;border-radius:5px;height:10px;overflow:hidden'><div style='width:"+Math.max(1,pct).toFixed(1)+"%;height:100%;background:"+col+"'></div></div>"
      +"<div style='margin-top:.3rem;color:#444'>~<b>"+mb+" MB</b> / 1024 MB free &nbsp;("+pct.toFixed(1)+"%) &nbsp;\u00B7&nbsp; estimates "+cnt.est+", users "+cnt.usr+", payments "+cnt.pay+"</div>"
      +"<div style='margin-top:.25rem;color:#888;font-size:.64rem'>Daily reads/writes (50k/20k) ani exact usage \u2192 Firebase Console \u2192 Usage tab. "
      +(pid?"<a href='https://console.firebase.google.com/project/"+encodeURIComponent(pid)+"/usage' target='_blank' rel='noopener' style='color:#1565c0'>Usage ughada \u2197</a>":"")+"</div>"
      +(window._FS_QUOTA_HIT?"<div style='margin-top:.35rem;color:#c62828;font-weight:800'>\u26A0\uFE0F Quota bharli ahe (resource-exhausted)</div>":"")+"</div>";
  }
  draw(false);
  Object.keys(map).forEach(function(k){
    var q=db.collection(map[k]);
    if(typeof q.count!=="function")return;
    pend++;
    q.count().get().then(function(s){var n=s.data().count;if(typeof n==="number")cnt[k]=n;}).catch(function(e){if(window._fsIsQuota&&_fsIsQuota(e))_fsQuotaHit();}).then(function(){done++;if(done===pend)draw(true);});
  });
  if(!pend)draw(true);
}


function aRenderUsers(users){
  if(!G("usrTbody"))return;
  if(!users.length){G("usrTbody").innerHTML="<tr><td colspan='7' style='text-align:center;color:#aaa;padding:2rem'>No users</td></tr>";return;}
  G("usrTbody").innerHTML=users.map(function(u){
    return "<tr>"+
      "<td><strong>"+esc(u.name||"\u2014")+"</strong></td>"+
      "<td style='font-size:.75rem;font-weight:600;color:#333'>"+esc(u.phone||"\u2014")+"</td>"+
      "<td style='font-size:.7rem;color:#555'>"+esc(u.email||"\u2014")+"</td>"+
      "<td style='text-align:center;font-weight:700'>"+(u.dlCount||0)+" / "+(u.freeLimit!=null?u.freeLimit:APP_FREE_LIMIT)+"</td>"+
      "<td>"+(u.isPro?"<span class='abp'>&#128142; Pro</span>":"<span class='abf'>&#127358; Free</span>")+aPlanBadge(u)+"</td>"+
      "<td style='font-size:.65rem;color:#888'>"+aDt(u.createdAt)+"</td>"+
      "<td style='display:flex;gap:.3rem'>"+
        "<button class='xbtn xgr' data-uid='"+u._id+"' data-nm='"+escAttr(u.name||u.email||"")+"' onclick='aGrant(this.dataset.uid,this.dataset.nm)'>&#127873; Pro</button>"+
        "<button class='xbtn xbl' data-uid='"+u._id+"' data-nm='"+escAttr(u.name||u.email||"")+"' onclick='aSetFree(this.dataset.uid,this.dataset.nm)'>&#127358;</button>"+
        "<button class='xbtn xgr' data-uid='"+u._id+"' data-nm='"+escAttr(u.name||u.email||"")+"' onclick='aPlanOpen(this.dataset.uid,this.dataset.nm)' title='Unlimited download plan'>&#128197; Plan</button>"+
        "<span style='position:relative;display:inline-block'>"+
          "<button class='xbtn xbl' data-uid='"+u._id+"' data-nm='"+escAttr(u.name||u.email||"")+"' onclick='aOpenUserChat(this.dataset.uid,this.dataset.nm)'>&#128172;</button>"+
          "<span id='chatDot_"+u._id+"' style='display:none;position:absolute;top:-6px;right:-6px;background:#e53935;color:#fff;border-radius:8px;min-width:15px;height:15px;font-size:.55rem;font-weight:900;line-height:15px;text-align:center;padding:0 3px;box-sizing:border-box;pointer-events:none'></span>"+
        "</span>"+
        "<button class='xbtn xrd' data-uid='"+u._id+"' data-nm='"+escAttr(u.name||u.email||"")+"' onclick='aDelUser(this.dataset.uid,this.dataset.nm)' title='Delete user'>&#128465;</button>"+
      "</td></tr>";
  }).join("");
  aApplyUnreadDots();
}
function fUsers(){var q=(G("usrQ").value||"").toLowerCase();if(!q){aRenderUsers(AD.users);return;}aRenderUsers(AD.users.filter(function(u){return(u.name||"").toLowerCase().includes(q)||(u.phone||"").includes(q)||(u.email||"").toLowerCase().includes(q);}));}

/* ── ADMIN: user delete (Firestore data). Auth account Firebase Console madhun delete karavi lagte. ── */
function aDelUser(uid,name){
  if(!CU||CU.email!==ADMIN_EMAIL){showToast("Admin only","error");return;}
  if(uid===CU.uid){showToast("Swatacha admin account delete karta yenar nahi","warn");return;}
  var u=(AD.users||[]).find(function(x){return x._id===uid;})||{};
  var typed=prompt("DELETE USER\n"+(name||"")+"\n"+(u.email||"")+"\n\nHe delete hoil: user record, tyache saglye estimates, Browse index, RA bills, presence.\nPayment records tasech rahtil.\n\nConfirm karayla DELETE lihha:");
  if(typed!=="DELETE"){if(typed!==null)showToast("Cancelled","info");return;}
  var db=firebase.firestore(),counts={est:0,idx:0,ra:0};
  function delQuery(q,key){
    return q.get().then(function(snap){
      var refs=[];snap.forEach(function(d){refs.push(d.ref);});
      counts[key]=refs.length;
      var p=Promise.resolve();
      for(var i=0;i<refs.length;i+=400){(function(ch){
        p=p.then(function(){var b=db.batch();ch.forEach(function(r){b.delete(r);});return b.commit();});
      })(refs.slice(i,i+400));}
      return p;
    });
  }
  showToast("Deleting…","info");
  delQuery(db.collection("estimates").where("uid","==",uid),"est")
  .then(function(){return delQuery(db.collection("estimateIndex").where("ownerUid","==",uid),"idx");})
  .then(function(){return delQuery(db.collection("ra_bills").where("uid","==",uid),"ra");})
  .then(function(){return db.collection("presence").doc(uid).delete().catch(function(){});})
  .then(function(){return db.collection("users").doc(uid).delete();})
  .then(function(){
    AD.users=(AD.users||[]).filter(function(x){return x._id!==uid;});
    AD.ests=(AD.ests||[]).filter(function(x){return x.uid!==uid;});
    try{aRenderStats();aRenderUsers(AD.users);aRenderEsts(AD.ests);}catch(_e){}
    showToast("User data deleted ✅","success");
    alert("Firestore madhun user cha data delete zala (estimates "+counts.est+", index "+counts.idx+", RA bills "+counts.ra+").\n\nMAHATVACHE: Login account ajun aahe. Firebase Console → Authentication → Users madhe khalcha account delete kara, nahitar to parat login karun navin free record banvel:\n\nEmail: "+(u.email||"—")+"\nUID: "+uid);
  })
  .catch(function(e){showToast("Delete error: "+(e.message||e),"error");});
}

function aGrant(uid,name){if(!confirm("Grant Pro to "+name+"?"))return;firebase.firestore().collection("users").doc(uid).update({isPro:true}).then(function(){showToast("Pro granted 🎉","success");aLoadAll();}).catch(function(e){showToast("Error: "+e.message,"error");});}
function aSetFree(uid,name){
  var u=(AD.users||[]).find(function(x){return x._id===uid;});
  var cur=(u&&u.freeLimit!=null)?u.freeLimit:APP_FREE_LIMIT;
  var v=prompt("Free downloads for "+name+" (global: "+APP_FREE_LIMIT+"):",String(cur));
  if(v===null)return;
  var n=parseInt(v);
  if(isNaN(n)||n<0){showToast("Invalid","error");return;}
  firebase.firestore().collection("users").doc(uid).update({freeLimit:n}).then(function(){
    /* Update in-memory + table immediately — don't wait for a full aLoadAll() round trip */
    if(u)u.freeLimit=n;
    aRenderUsers(AD.users);
    /* Verify against the SERVER (bypass local cache) so a silent-fail is never invisible */
    firebase.firestore().collection("users").doc(uid).get({source:"server"}).then(function(d){
      var saved=d.exists?d.data().freeLimit:undefined;
      if(saved===n){showToast("Saved ✅ Free="+n+" for "+name,"success");}
      else{
        console.error("aSetFree: server value ("+saved+") does not match what was set ("+n+")");
        alert("⚠ Save issue: server shows freeLimit="+saved+", expected "+n+". Check Firestore rules — admin needs permission to update other users' docs.");
      }
    }).catch(function(e){console.error("aSetFree verify error",e);});
  }).catch(function(e){
    console.error("aSetFree write error",e);
    alert("❌ Save FAILED: "+e.message+"\n\nThis is most likely caused by Firestore Security Rules — you need to allow admin to update the 'freeLimit' field of other users in the rules.");
    showToast("Error: "+e.message,"error");
  });
}


/* ══ UNLIMITED DOWNLOAD PLAN (admin sets start date + months; after end date user's free downloads = 0) ══
   users/{uid}: planStart, planEnd (Timestamps), planMonths. During the plan canDownload() is true and
   dlCount is NOT incremented. On save, freeLimit is set = dlCount so remaining downloads are 0 after the plan ends. */
var PLAN_START=0,PLAN_END=0;
function _tsMs(v){if(!v)return 0;if(v.toMillis)return v.toMillis();if(v.seconds!=null)return v.seconds*1000;if(v instanceof Date)return v.getTime();return Number(v)||0;}
function _readPlan(dd){PLAN_START=_tsMs(dd&&dd.planStart);PLAN_END=_tsMs(dd&&dd.planEnd);PLAN_MONTHS=parseInt(dd&&dd.planMonths,10)||0;}
function planActive(){var n=Date.now();return !!PLAN_END&&n>=PLAN_START&&n<=PLAN_END;}
function _p2(n){return ("0"+n).slice(-2);}
function _dmy(ms){var d=new Date(ms);return _p2(d.getDate())+"-"+_p2(d.getMonth()+1)+"-"+d.getFullYear();}
function _ymd(d){return d.getFullYear()+"-"+_p2(d.getMonth()+1)+"-"+_p2(d.getDate());}
function _planEndTxt(){return _dmy(PLAN_END);}
function _addMonths(d,n){var r=new Date(d.getFullYear(),d.getMonth()+n,1);var last=new Date(r.getFullYear(),r.getMonth()+1,0).getDate();r.setDate(Math.min(d.getDate(),last));return r;}
function aPlanInfo(u){
  var s=_tsMs(u&&u.planStart),e=_tsMs(u&&u.planEnd),n=Date.now();
  if(!e)return null;
  return {s:s,e:e,state:n<s?"upcoming":(n<=e?"active":"expired"),days:Math.max(0,Math.ceil((e-n)/86400000))};
}
function aPlanBadge(u){
  var p=aPlanInfo(u);if(!p)return "";
  if(p.state==="active")return "<div style='font-size:.58rem;color:#00796b;font-weight:700;margin-top:2px'>🎟️ Unlimited till "+_dmy(p.e)+" ("+p.days+"d left)</div>";
  if(p.state==="upcoming")return "<div style='font-size:.58rem;color:#e65100;font-weight:700;margin-top:2px'>📅 Plan "+_dmy(p.s)+" → "+_dmy(p.e)+"</div>";
  return "<div style='font-size:.58rem;color:#c62828;margin-top:2px'>Plan expired "+_dmy(p.e)+"</div>";
}
function aPlanClose(){var b=G("planModalBg");if(b)b.remove();}
function aPlanOpen(uid,name){
  var u=(AD.users||[]).find(function(x){return x._id===uid;});if(!u)return;
  var p=aPlanInfo(u),canExt=!!(p&&p.state!=="expired");
  aPlanClose();
  var bg=document.createElement("div");bg.id="planModalBg";
  bg.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem";
  bg.dataset.uid=uid;
  var qb="padding:.4rem .7rem;border:1px solid #00796b;background:#fff;color:#00796b;border-radius:5px;font-weight:700;font-size:.72rem;cursor:pointer";
  var inp="padding:.35rem .5rem;border:1px solid #bbb;border-radius:5px;font-size:.8rem;box-sizing:border-box";
  bg.innerHTML="<div style='background:#fff;border-radius:10px;max-width:400px;width:100%;padding:1rem 1.1rem;font-family:inherit;box-shadow:0 8px 30px rgba(0,0,0,.35)'>"
   +"<div style='font-weight:800;font-size:.95rem;margin-bottom:.2rem'>📅 Unlimited Download Plan</div>"
   +"<div style='font-size:.72rem;color:#555;margin-bottom:.6rem'>"+esc(name||"User")+(p?"<br><b>Current:</b> "+_dmy(p.s)+" → "+_dmy(p.e)+" ("+p.state+(p.state==="active"?", "+p.days+" days left":"")+")":"<br>No plan")+"</div>"
   +"<label style='font-size:.68rem;font-weight:700'>Start date</label><br>"
   +"<input type='date' id='planStartIn' value='"+_ymd(new Date())+"' style='"+inp+";width:100%;margin-bottom:.5rem' oninput='aPlanCalc()'>"
   +(canExt?"<label style='font-size:.68rem;display:block;margin-bottom:.5rem'><input type='checkbox' id='planExtend' checked onchange='aPlanCalc()'> Add after the current plan's end date (extend / recharge)</label>":"")
   +"<label style='font-size:.68rem;font-weight:700'>Recharge</label><br>"
   +"<div style='display:flex;gap:.4rem;flex-wrap:wrap;margin:.2rem 0 .4rem'>"
   +"<button type='button' style='"+qb+"' onclick='aPlanSetM(1)'>1 Month</button>"
   +"<button type='button' style='"+qb+"' onclick='aPlanSetM(2)'>2 Months</button>"
   +"<button type='button' style='"+qb+"' onclick='aPlanSetM(12)'>1 Year</button></div>"
   +"<label style='font-size:.68rem;font-weight:700'>Months (custom)</label> "
   +"<input type='number' id='planMonthsIn' min='1' max='120' value='1' style='"+inp+";width:80px' oninput='aPlanCalc()'>"
   +"<div id='planPrev' style='margin:.6rem 0;padding:.5rem;background:#e0f2f1;border-radius:6px;font-size:.72rem;font-weight:700;color:#00695c'></div>"
   +"<div style='font-size:.6rem;color:#888;margin-bottom:.6rem'>After saving the plan, the user's remaining free downloads become 0. Downloads are not counted during the plan. After the plan ends, downloads resume only when a new plan payment is verified.</div>"
   +"<div style='display:flex;gap:.4rem;flex-wrap:wrap'>"
   +"<button type='button' class='xbtn xgr' style='flex:1;padding:.5rem' onclick='aPlanSave()'>✅ Save Plan</button>"
   +(p?"<button type='button' class='xbtn xrd' style='padding:.5rem' onclick='aPlanRemove()'>🗑 Remove</button>":"")
   +"<button type='button' class='xbtn' style='padding:.5rem;background:#eee;color:#333' onclick='aPlanClose()'>Cancel</button></div></div>";
  document.body.appendChild(bg);
  aPlanCalc();
}
function aPlanSetM(n){var i=G("planMonthsIn");if(i)i.value=n;aPlanCalc();}
function aPlanCalc(){
  var bg=G("planModalBg");if(!bg)return null;
  var u=(AD.users||[]).find(function(x){return x._id===bg.dataset.uid;});
  var p=aPlanInfo(u),ext=G("planExtend")&&G("planExtend").checked&&p&&p.state!=="expired";
  var n=parseInt(G("planMonthsIn").value,10),sIn=G("planStartIn"),prev=G("planPrev");
  var s;
  if(ext){var t=new Date(p.e+1);s=new Date(t.getFullYear(),t.getMonth(),t.getDate());sIn.value=_ymd(s);sIn.disabled=true;s=new Date(p.s);}
  else{sIn.disabled=false;var m=(sIn.value||"").split("-");if(m.length!==3){prev.textContent="Select a start date";return null;}s=new Date(+m[0],+m[1]-1,+m[2]);}
  if(isNaN(n)||n<1||n>120){prev.textContent="Months must be between 1 and 120";return null;}
  var segStart=ext?new Date(+sIn.value.split("-")[0],+sIn.value.split("-")[1]-1,+sIn.value.split("-")[2]):s;
  var e=_addMonths(segStart,n).getTime()-1;
  prev.innerHTML="Unlimited downloads: "+_dmy(ext?p.s:s.getTime())+" → "+_dmy(e)+(ext?"<br><span style='font-weight:400'>(+"+n+" month, "+_dmy(segStart.getTime())+" onwards)</span>":"")+"<br><span style='font-weight:400'>"+_dmy(e+1)+" onwards downloads = 0</span>";
  return {s:s,e:e,n:n,ext:!!ext};
}
function aPlanSave(){
  var bg=G("planModalBg");if(!bg)return;var uid=bg.dataset.uid;
  var c=aPlanCalc();if(!c){showToast("Check date / months","warn");return;}
  var db=firebase.firestore(),T=firebase.firestore.Timestamp;
  db.collection("users").doc(uid).get().then(function(d){
    var dl=d.exists?(d.data().dlCount||0):0;
    var months=c.n+(c.ext?(parseInt((d.data()||{}).planMonths,10)||0):0);
    return db.collection("users").doc(uid).update({
      planStart:T.fromDate(c.s),planEnd:T.fromMillis(c.e),planMonths:months,
      freeLimit:dl,planSetAt:firebase.firestore.FieldValue.serverTimestamp()
    }).then(function(){return dl;});
  }).then(function(dl){
    var u=(AD.users||[]).find(function(x){return x._id===uid;});
    if(u){u.planStart=new Date(c.s);u.planEnd=new Date(c.e);u.freeLimit=dl;}
    aPlanClose();
    showToast("Plan saved ✅ "+_dmy(c.s.getTime())+" → "+_dmy(c.e),"success");
    if(typeof fUsers==="function"&&G("usrQ"))fUsers();else aRenderUsers(AD.users);
  }).catch(function(e){
    console.error("aPlanSave",e);
    alert("❌ Plan save FAILED: "+e.message+"\n\nYou need to allow admin to update the planStart, planEnd, planMonths and planSetAt fields in users docs in Firestore Security Rules (same as freeLimit).");
  });
}
function aPlanRemove(){
  var bg=G("planModalBg");if(!bg)return;var uid=bg.dataset.uid;
  if(!confirm("Remove this plan?"))return;
  var F=firebase.firestore.FieldValue;
  firebase.firestore().collection("users").doc(uid).update({planStart:F.delete(),planEnd:F.delete(),planMonths:F.delete()}).then(function(){
    var u=(AD.users||[]).find(function(x){return x._id===uid;});
    if(u){delete u.planStart;delete u.planEnd;}
    aPlanClose();showToast("Plan removed","warn");
    if(typeof fUsers==="function"&&G("usrQ"))fUsers();else aRenderUsers(AD.users);
  }).catch(function(e){showToast("Error: "+e.message,"error");});
}

/* ── ADMIN: Estimates — select / bulk delete ─────────────────────────── */
var EST_SEL={};      /* {estId:true} selected */
var EST_VIS=[];      /* ids currently shown (after search filter) — for select-all & shift-range */
var EST_LAST=null;   /* last ticked id, for shift+click range */

function aEstIsAdmin(){return !!(window.CU&&CU.email===ADMIN_EMAIL);}


/* ── ADMIN: kontahi user cha estimate admin account madhe COPY mhanun load karne ── */
function adminLoadEst(estId){
  if(!CU||CU.email!==ADMIN_EMAIL){showToast("Admin only","error");return;}
  if(typeof browseLoadEst!=="function"){showToast("Load function sapadla nahi","error");return;}
  if(!confirm("Ha estimate tumchya admin account madhe COPY mhanun ughadaycha?\nAdmin panel band hoil; user cha original badalnar nahi.\nSave kelat tar tumchya navane navin copy banel."))return;
  try{sessionStorage.removeItem("_adminOpen");}catch(_e){}
  if(G("adminWrap"))G("adminWrap").style.display="none";
  if(G("homeScreen"))G("homeScreen").style.display="none";
  if(G("appShell"))G("appShell").style.display="block";
  var _oc=window.confirm;window.confirm=function(){return true;};
  try{browseLoadEst(estId,"0");}finally{window.confirm=_oc;}
}

function aRenderEsts(ests){
  var tb=G("estTbody");if(!tb)return;
  EST_VIS=ests.map(function(e){return e._id;});
  if(!ests.length){tb.innerHTML="<tr><td colspan='7' style='text-align:center;color:#aaa;padding:2rem'>No estimates</td></tr>";aEstUpdBar();return;}
  tb.innerHTML=ests.map(function(e){
    var u=AD.users.find(function(x){return x._id===e.uid||x.uid===e.uid;});
    var id=e._id,on=!!EST_SEL[id];
    return "<tr"+(on?" style='background:#fff3e0'":"")+">"
      +"<td style='text-align:center'><input type='checkbox' "+(on?"checked ":"")+"onclick=\"aEstTick(event,'"+id+"')\" style='width:15px;height:15px;cursor:pointer'></td>"
      +"<td style='max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700'>"+esc(e.name||"Untitled")+"</td>"
      +"<td style='font-size:.7rem;color:#666'>"+esc(u?u.name||u.phone||"":"?")+"</td>"
      +"<td style='text-align:center'>"+(e.items?e.items.length:0)+"</td>"
      +"<td style='font-weight:700;color:#18602f'>₹"+fmtN(e.grand)+"</td>"
      +"<td style='font-size:.65rem;color:#888'>"+aDt(e.updatedAt)+"</td>"
      +"<td style='text-align:center;white-space:nowrap'><button class='xbtn xgr' style='padding:.15rem .4rem' title='Load in my app (copy)' onclick=\"adminLoadEst('"+id+"')\">▶ Load</button> <button class='xbtn xrd' style='padding:.15rem .4rem' title='Delete this estimate' onclick=\"aDelEst('"+id+"')\">🗑</button></td>"
      +"</tr>";}).join("");
  aEstUpdBar();
}

function fEsts(){
  var q=(G("estQ").value||"").toLowerCase();
  if(!q){aRenderEsts(AD.ests);return;}
  aRenderEsts(AD.ests.filter(function(e){return(e.name||"").toLowerCase().includes(q);}));
}

function aEstCount(){var n=0;for(var k in EST_SEL)if(EST_SEL[k])n++;return n;}

function aEstUpdBar(){
  var n=aEstCount();
  var b=G("estDelBtn");if(b){b.textContent="🗑 Delete Selected ("+n+")";b.disabled=!n;}
  var inf=G("estSelInfo");if(inf)inf.textContent=n?(n+" selected"):"";
  var all=G("estChkAll");
  if(all){
    var vis=EST_VIS.length,sel=EST_VIS.filter(function(id){return EST_SEL[id];}).length;
    all.checked=vis>0&&sel===vis;
    all.indeterminate=sel>0&&sel<vis;
  }
}

function aEstTick(ev,id){
  var on=ev.target.checked;
  if(ev.shiftKey&&EST_LAST&&EST_LAST!==id){        /* shift+click = range */
    var a=EST_VIS.indexOf(EST_LAST),b=EST_VIS.indexOf(id);
    if(a>-1&&b>-1){
      var lo=Math.min(a,b),hi=Math.max(a,b);
      for(var i=lo;i<=hi;i++)EST_SEL[EST_VIS[i]]=on;
    }else EST_SEL[id]=on;
  }else EST_SEL[id]=on;
  EST_LAST=id;
  fEsts();
}

function aEstToggleAll(chk){
  EST_VIS.forEach(function(id){EST_SEL[id]=chk.checked;});
  fEsts();
}

/* quick select: estimates not updated for N days (only among those shown) */
function aEstSelOlder(sel){
  var days=parseInt(sel.value,10);sel.value="";
  if(!days)return;
  var cutoff=Date.now()/1000-days*86400,n=0;
  AD.ests.forEach(function(e){
    if(EST_VIS.indexOf(e._id)<0)return;
    var t=e.updatedAt&&e.updatedAt.seconds?e.updatedAt.seconds:0;
    if(t&&t<cutoff){EST_SEL[e._id]=true;n++;}
  });
  fEsts();
  showToast(n?(n+" estimates selected (older than "+days+" days)"):"No estimates found","info");
}

function aEstClearSel(){EST_SEL={};EST_LAST=null;fEsts();}

/* delete a list of estimate ids in batches of 400; returns Promise of {ok:[ids],fail:n,err:msg} */
function aEstDeleteIds(ids){
  var db=firebase.firestore(),ok=[],fail=0,err="";
  var chunks=[];for(var i=0;i<ids.length;i+=400)chunks.push(ids.slice(i,i+400));
  return chunks.reduce(function(p,ch){
    return p.then(function(){
      var b=db.batch();ch.forEach(function(id){b.delete(db.collection("estimates").doc(id));});
      return b.commit().then(function(){
          ok=ok.concat(ch);
          /* best-effort: also remove the matching estimateIndex doc (Browse list), errors ignored */
          ch.forEach(function(id){db.collection("estimateIndex").doc(id).delete().catch(function(){});});
        })
        .catch(function(e){fail+=ch.length;err=e.message||String(e);});
    });
  },Promise.resolve()).then(function(){return {ok:ok,fail:fail,err:err};});
}

function aEstAfterDelete(res){
  var gone={};res.ok.forEach(function(id){gone[id]=true;delete EST_SEL[id];});
  AD.ests=AD.ests.filter(function(e){return !gone[e._id];});
  if(typeof CUR_EST_ID!=="undefined"&&gone[CUR_EST_ID])CUR_EST_ID=null;
  fEsts();
  if(typeof aRenderStats==="function")try{aRenderStats();}catch(e){}
  if(res.fail)showToast("❌ "+res.ok.length+" deleted, "+res.fail+" failed: "+res.err,"error");
  else showToast("🗑 "+res.ok.length+" estimate(s) deleted","success");
}

function aDelEst(id){
  if(!aEstIsAdmin()){showToast("Admin only","error");return;}
  var e=AD.ests.find(function(x){return x._id===id;});
  if(!confirm("Delete estimate?\n\n"+(e?(e.name||"Untitled"):id)+"\n\nThis cannot be undone."))return;
  aEstDeleteIds([id]).then(aEstAfterDelete);
}

function aDelEstSel(){
  if(!aEstIsAdmin()){showToast("Admin only","error");return;}
  var ids=Object.keys(EST_SEL).filter(function(k){return EST_SEL[k];});
  if(!ids.length){showToast("Select estimates first","warn");return;}
  var names=ids.slice(0,6).map(function(id){var e=AD.ests.find(function(x){return x._id===id;});return "• "+((e&&e.name)||"Untitled");}).join("\n");
  if(ids.length>6)names+="\n… and "+(ids.length-6)+" more";
  if(!confirm(ids.length+" estimates will be DELETED. Continue?\n\n"+names+"\n\nThis cannot be undone."))return;
  if(ids.length>=10){
    var t=prompt(ids.length+" estimates will be deleted. Type DELETE to confirm:");
    if(t===null||t.trim().toUpperCase()!=="DELETE"){showToast("Cancelled","info");return;}
  }
  var b=G("estDelBtn");if(b){b.disabled=true;b.textContent="Deleting…";}
  aEstDeleteIds(ids).then(aEstAfterDelete);
}

function aRenderRev(){
  if(!G("revDiv"))return;
  var v=AD.pays.filter(function(p){return p.status==="verified";});
  var total=v.reduce(function(s,p){return s+(p.amount||PAY_AMOUNT);},0);
  var rows=v.map(function(p){
    return "<div style='display:flex;align-items:center;gap:.4rem;padding:.22rem 0;border-bottom:1px solid #eee;font-size:.66rem'>" +
      "<span style='flex:1;font-weight:700'>" + esc(p.name||"--") + "</span>" +
      "<span style='color:#18602f;font-weight:800'>Rs." + (p.amount||PAY_AMOUNT) + "</span>" +
      "<span style='font-size:.58rem;color:#aaa'>" + aDt(p.createdAt) + "</span>" +
      "<button class='xbtn xrd' style='font-size:.56rem;padding:.12rem .3rem' data-pid='" + p._id + "' onclick='aDelPay(this.dataset.pid)'>Delete</button>" +
    "</div>";
  }).join("");
  G("revDiv").innerHTML =
    "<div style='display:grid;grid-template-columns:1fr 1fr;gap:.4rem;margin-bottom:.6rem'>" +
    "<div style='background:#e8f5e9;border-radius:5px;padding:.5rem;text-align:center'><div style='font-size:.95rem;font-weight:900;color:#18602f'>Rs." + total.toLocaleString("en-IN") + "</div><div style='font-size:.58rem;color:#555'>Total Revenue</div></div>" +
    "<div style='background:#fce4ec;border-radius:5px;padding:.5rem;text-align:center'><div style='font-size:.95rem;font-weight:900;color:#c62828'>" + AD.pays.filter(function(p){return p.status==="pending";}).length + "</div><div style='font-size:.58rem;color:#555'>Pending</div></div>" +
    "</div><div style='font-size:.63rem;font-weight:800;color:#555;margin-bottom:.3rem'>Verified Payments:</div>" +
    (rows||"<div style='color:#aaa;font-size:.63rem;font-style:italic'>No verified payments yet</div>");
}
function aViewEst(estId){
  var est=AD.ests.find(function(e){return e._id===estId;});
  if(!est){showToast("Estimate not found","warn");return;}
  var u=AD.users.find(function(x){return x._id===est.uid||x.uid===est.uid;});
  var items=est.items||[];
  var h='<div style="font-size:.7rem"><table style="width:100%;border-collapse:collapse;margin-bottom:.8rem;font-size:.7rem">';
  h+='<tr><td style="padding:.2rem .5rem;color:#888">Estimate</td><td style="font-weight:700">'+esc(est.name||"Untitled")+'</td></tr>';
  h+='<tr><td style="padding:.2rem .5rem;color:#888">User</td><td>'+esc(u?u.name||u.phone||u.email||"Unknown":"Unknown")+'</td></tr>';
  h+='<tr><td style="padding:.2rem .5rem;color:#888">Division</td><td>'+esc((est.cover&&est.cover.pDiv)||"—")+'</td></tr>';
  h+='<tr><td style="padding:.2rem .5rem;color:#888">Amount</td><td style="color:#18602f;font-weight:800">Rs.'+fmtN(est.grand)+'</td></tr>';
  h+='<tr><td style="padding:.2rem .5rem;color:#888">Items</td><td>'+items.length+'</td></tr>';
  h+='<tr><td style="padding:.2rem .5rem;color:#888">Saved</td><td>'+aDt(est.updatedAt)+'</td></tr></table>';
  if(items.length){
    h+='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.62rem">';
    h+='<tr style="background:#18150f;color:#fff"><th style="padding:.28rem .3rem;text-align:left">Code</th><th style="text-align:left">Description</th><th>Unit</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>';
    items.slice(0,60).forEach(function(it,i){
      h+='<tr style="border-bottom:1px solid #eee;background:'+(i%2?'#fafafa':'#fff')+'">';
      h+='<td style="padding:.2rem .3rem;white-space:nowrap">'+esc(String(it.code||it.sno||""))+'</td>';
      h+='<td style="padding:.2rem .3rem;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(it.desc||it.description||"")+'</td>';
      h+='<td style="text-align:center">'+esc(it.unit||"")+'</td>';
      h+='<td style="text-align:right">'+fmtN(it.qty||0)+'</td>';
      h+='<td style="text-align:right">'+fmtN(it.rate||0)+'</td>';
      h+='<td style="text-align:right;font-weight:700;color:#18602f">Rs.'+fmtN(it.amt||it.amount||0)+'</td></tr>';
    });
    if(items.length>60)h+='<tr><td colspan="6" style="text-align:center;color:#aaa;padding:.3rem;font-style:italic">...and '+(items.length-60)+' more items</td></tr>';
    h+='</table></div>';
  }else{h+='<div style="color:#aaa;padding:.5rem;font-style:italic">No items data</div>';}
  h+='</div>';
  var pdHead=G("pdHead"),pdBody=G("pdBody"),modal=G("payDetailModal");
  if(pdHead)pdHead.innerHTML='&#128065; '+esc(est.name||"Estimate");
  if(pdBody)pdBody.innerHTML=h;
  if(modal)modal.style.display="flex";
}

function aDelPay(payId){
  if(!confirm("Delete this payment record?"))return;
  firebase.firestore().collection("payments").doc(payId).delete()
    .then(function(){showToast("Deleted","info");aLoadAll();})
    .catch(function(e){showToast("Error: "+e.message,"error");});
}
function aLoadSettings(){if(!window.firebase||!firebase.firestore)return;firebase.firestore().collection("config").doc("app").get().then(function(d){if(d.exists){if(G("setPlanM"))G("setPlanM").value=d.data().planMonthly||PLAN_PRICE.m;if(G("setPlanY"))G("setPlanY").value=d.data().planYearly||PLAN_PRICE.y;if(d.data().freeLimit!=null)APP_FREE_LIMIT=d.data().freeLimit;if(d.data().freeLimit&&G("setFreeVal"))G("setFreeVal").value=d.data().freeLimit;var md=d.data().maintenance||{};if(G("maintActive"))G("maintActive").value=md.active?"true":"false";if(G("maintMsgInp"))G("maintMsgInp").value=md.message||"";if(G("mantFrom"))G("maintFrom").value=md.from||"";if(G("maintTo"))G("maintTo").value=md.to||"";}}).catch(function(){});}

function saveAppSetting(type){
  var val;
  if(type==="pm"||type==="py"){var _k=type==="pm"?"m":"y",_el=G(type==="pm"?"setPlanM":"setPlanY");val=parseInt(_el.value);if(isNaN(val)||val<1){showToast("Invalid","error");return;}var _o={};_o[type==="pm"?"planMonthly":"planYearly"]=val;firebase.firestore().collection("config").doc("app").set(_o,{merge:true}).then(function(){PLAN_PRICE[_k]=val;showToast((type==="pm"?"Monthly":"Yearly")+" plan = ₹"+val,"success");planRenderPay();makeQR();}).catch(function(e){showToast("Error: "+e.message,"error");});}
  else{val=parseInt(G("setFreeVal").value);if(isNaN(val)||val<0){showToast("Invalid","error");return;}firebase.firestore().collection("config").doc("app").set({freeLimit:val},{merge:true}).then(function(){FREE_LIMIT=val;APP_FREE_LIMIT=val;showToast("Free="+val,"success");renderHeader();}).catch(function(e){showToast("Error: "+e.message,"error");});}
}

function aLoadCurQR(){if(!window.firebase||!firebase.firestore)return;firebase.firestore().collection("config").doc("upi").get().then(function(d){if(d.exists&&d.data().qrURL){if(G("curQR")){G("curQR").src=d.data().qrURL;G("curQR").style.display="block";}if(G("noQRMsg"))G("noQRMsg").style.display="none";if(d.data().upiId&&G("nUPI"))G("nUPI").placeholder=d.data().upiId;}}).catch(function(){});}
function onQRfile(input){if(!input.files||!input.files[0])return;AD.qrFile=input.files[0];var r=new FileReader();r.onload=function(e){if(G("qrNew")){G("qrNew").src=e.target.result;G("qrNew").style.display="block";}};r.readAsDataURL(AD.qrFile);}
function onQRdrop(e){e.preventDefault();if(e.dataTransfer.files[0]){G("qrFile").files=e.dataTransfer.files;onQRfile(G("qrFile"));}}
function uploadQR(){
  var newUPI=(G("nUPI").value||"").trim()||UPI_ID;
  if(!AD.qrFile&&!(G("nUPI").value||"").trim()){showE("qrErr","Upload QR or enter UPI ID");return;}
  var btn=G("qrUpBtn");btn.disabled=true;btn.textContent="Uploading...";hideE("qrErr");if(G("qrOK"))G("qrOK").style.display="none";
  function saveFS(url){var d={upiId:newUPI,updatedAt:firebase.firestore.FieldValue.serverTimestamp()};if(url)d.qrURL=url;firebase.firestore().collection("config").doc("upi").set(d,{merge:true}).then(function(){btn.disabled=false;btn.textContent="⬆️ Upload QR";if(G("qrOK"))G("qrOK").style.display="block";if(url&&G("curQR")){G("curQR").src=url;G("curQR").style.display="block";if(G("noQRMsg"))G("noQRMsg").style.display="none";}UPI_ID=newUPI;showToast("QR updated! 📷","success");}).catch(function(e){btn.disabled=false;showToast("Error: "+e.message,"error");});}
  if(AD.qrFile)uploadCDN(AD.qrFile,"atp-maha-pwd/qr",function(p){btn.textContent="Uploading... "+p+"%";},function(url){saveFS(url);},function(err){console.log(err);saveFS("");});else saveFS("");
}

function aShowSec(sec){["pay","users","ests","settings","loginpage","ssr","lead","mtf","diary","mkt"].forEach(function(s){var e=G("asec-"+s);if(e)e.style.display=s===sec?"block":"none";});document.querySelectorAll(".asectab").forEach(function(t,i){t.classList.toggle("on",["pay","users","ests","settings","loginpage","ssr","lead","mtf","diary","mkt"][i]===sec);});if(sec==="settings"){aLoadCurQR();aLoadSettings();if(typeof aLoadBitRefImage==="function")aLoadBitRefImage();}if(sec==="loginpage"){lpLoadAdmin();}if(sec==="ssr"){aRenderSSR();}if(sec==="lead"){aRenderLead();}if(sec==="mtf"&&typeof aLoadMTFCosts==="function"){aLoadMTFCosts();}if(sec==="diary"){aLoadDiary();}if(sec==="mkt"&&typeof mpRenderAdminSection==="function"){mpRenderAdminSection();}}

function aDlCSV(type){
  var rows,fn;
  if(type==="pay"){rows=[["Name","Phone","Amount","Status","Time"]];AD.pays.forEach(function(p){rows.push([p.name||"",p.phone||"",p.amount||PAY_AMOUNT,p.status,aDt(p.createdAt)]);});fn="payments.csv";}
  else if(type==="diary"){rows=[["JE","Type","Road/Village","Status","Details","Contractor","Phone","DLP","Date"]];(AD.diary||[]).forEach(function(w){rows.push([aJEName(w.uid),w.refType,w.refId,w.status||"",w.text||"",w.contractorName||"",w.contractorPhone||"",w.dlp||"",w.logged||""]);});fn="je_diary.csv";}
  else{rows=[["Name","Phone/Email","Downloads","Free Limit","Status","Plan From","Plan Till","Joined"]];AD.users.forEach(function(u){var _pp=aPlanInfo(u);rows.push([u.name||"",u.phone||u.email||"",u.dlCount||0,u.freeLimit!=null?u.freeLimit:APP_FREE_LIMIT,u.isPro?"Pro":"Free",_pp?_dmy(_pp.s):"",_pp?_dmy(_pp.e):"",aDt(u.createdAt)]);});fn="users.csv";}
  var csv=rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(",");}).join("\n");
  var a=document.createElement("a");a.href="data:text/csv;charset=utf-8,\ufeff"+encodeURIComponent(csv);a.download=fn;a.click();showToast(fn+" downloaded","success");
}

/* ── BCC EMAIL BATCHES (99 per batch, copy-paste into mail app's BCC field) ── */
function aOpenBCC(){
  var emails=[];
  (AD.users||[]).forEach(function(u){
    var e=(u.email||"").trim();
    if(e&&e.indexOf("@")>-1&&emails.indexOf(e)===-1)emails.push(e);
  });
  if(!emails.length){showToast("No valid email found","warn");return;}
  var BATCH=99,batches=[];
  for(var i=0;i<emails.length;i+=BATCH)batches.push(emails.slice(i,i+BATCH));
  if(G("bccSummary"))G("bccSummary").textContent=emails.length+" valid emails → "+batches.length+" batch(es) of up to "+BATCH;
  if(G("bccBatches"))G("bccBatches").innerHTML=batches.map(function(b,idx){
    var joined=b.join(", ");
    return "<div style='border:1px solid #e5e0d8;border-radius:8px;padding:.6rem;margin-bottom:.6rem'>"+
      "<div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem'>"+
        "<strong style='font-size:.72rem'>Batch "+(idx+1)+" ("+b.length+" emails)</strong>"+
        "<button class='xbtn xgr' data-idx='"+idx+"' onclick='aCopyBCCBatch(this)'>📋 Copy</button>"+
      "</div>"+
      "<textarea readonly style='width:100%;box-sizing:border-box;height:70px;font-size:.65rem;padding:.4rem;border:1px solid #d0ccc4;border-radius:5px;resize:vertical' id='bccTa_"+idx+"'>"+esc(joined)+"</textarea>"+
    "</div>";
  }).join("");
  window._bccBatches=batches;
  if(G("bccModal"))G("bccModal").style.display="flex";
}
function aCopyBCCBatch(btn){
  var idx=btn.dataset.idx,ta=G("bccTa_"+idx);
  if(!ta)return;
  ta.select();ta.setSelectionRange(0,999999);
  var done=function(){showToast("Batch "+(parseInt(idx,10)+1)+" copied — now paste it into the BCC field of your mail app","success");};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(ta.value).then(done).catch(function(){try{document.execCommand("copy");done();}catch(e){showToast("Copy failed — select the text and press Ctrl+C","warn");}});
  else{try{document.execCommand("copy");done();}catch(e){showToast("Copy failed — select the text and press Ctrl+C","warn");}}
}

/* ── WHATSAPP CLICK-THROUGH QUEUE (free click-to-chat, one contact per click — no bulk API) ── */
var WA={list:[],idx:0,msg:""};
function aOpenWA(){
  var list=[];
  (AD.users||[]).forEach(function(u){
    var p=(u.phone||"").replace(/[^0-9]/g,"");
    if(p.length===10)p="91"+p; /* assume Indian mobile, add country code */
    if(p.length>=11)list.push({name:u.name||u.email||"User",phone:p});
  });
  WA.list=list;WA.idx=0;
  if(!list.length){showToast("No valid mobile number found","warn");return;}
  if(G("waSetup"))G("waSetup").style.display="block";
  if(G("waQueue"))G("waQueue").style.display="none";
  if(G("waDone"))G("waDone").style.display="none";
  if(G("waMsg"))G("waMsg").value="";
  if(G("waModal"))G("waModal").style.display="flex";
}
function waStart(){
  WA.msg=(G("waMsg").value||"").trim();
  if(!WA.msg){showToast("Type a message first","warn");return;}
  WA.idx=0;
  if(G("waSetup"))G("waSetup").style.display="none";
  if(G("waQueue"))G("waQueue").style.display="block";
  waRenderCurrent();
}
function waRenderCurrent(){
  if(WA.idx>=WA.list.length){
    if(G("waProgress"))G("waProgress").textContent=WA.list.length+" / "+WA.list.length;
    if(G("waCurName"))G("waCurName").textContent="—";
    if(G("waCurPhone"))G("waCurPhone").textContent="—";
    if(G("waDone"))G("waDone").style.display="block";
    return;
  }
  var u=WA.list[WA.idx];
  if(G("waProgress"))G("waProgress").textContent=(WA.idx+1)+" / "+WA.list.length;
  if(G("waCurName"))G("waCurName").textContent=u.name;
  if(G("waCurPhone"))G("waCurPhone").textContent="+"+u.phone;
}
function waSendCurrent(){
  if(WA.idx>=WA.list.length)return;
  var u=WA.list[WA.idx];
  var url="https://wa.me/"+u.phone+"?text="+encodeURIComponent(WA.msg);
  window.open(url,"_blank");
  WA.idx++;
  waRenderCurrent();
}
function waSkip(){
  if(WA.idx>=WA.list.length)return;
  WA.idx++;
  waRenderCurrent();
}


/* ── AUTO SAVE / RESTORE ── */
var _asTimer=null;
function autoSave(){
  clearTimeout(_asTimer);
  _asTimer=setTimeout(function(){
    try{
      var nm=((G('pName')||{value:''}).value||'').trim()||'__autosave__';
      var lkm={};
      if(typeof LCD!=='undefined'){for(var i=0;i<LCD.length;i++){var el=document.getElementById('lkm_'+i);if(el)lkm[i]=parseFloat(el.value)||0;}}
      var d={nm:nm,dt:new Date().toLocaleDateString('en-IN'),
        meta:{pName:(G('pName')||{value:''}).value,pSub:(G('pSub')||{value:''}).value,
          pDiv:(G('pDiv')||{value:''}).value,pCir:(G('pCir')||{value:''}).value,
          pReg:(G('pReg')||{value:''}).value,
          sGST:(G('sGST')||{value:0}).value,sCont:(G('sCont')||{value:0}).value,
          sLI:(G('sLI')||{value:0}).value,sRS:(G('sRS')||{value:0}).value,sRC:(G('sRC')||{value:0}).value,gstBase:(window.GST_BASE||'A'),gfOnly:(typeof GF_ONLY!=='undefined'&&!!GF_ONLY)},
        lkm:lkm,items:typeof items!=='undefined'?items:[]};
      localStorage.setItem('boq_autosave',JSON.stringify(d));
    }catch(e){}
  },800);
}
function autoLoad(){
  try{
    var s=localStorage.getItem('boq_autosave');
    if(!s)return;
    var est=JSON.parse(s);
    var m=est.meta||{};
    ['pName','pSub','pDiv','pCir','pReg'].forEach(function(id){var el=document.getElementById(id);if(el)el.value=m[id]||'';});
    ['sGST','sCont','sLI','sRS','sRC'].forEach(function(id){var el=document.getElementById(id);if(el)el.value=m[id]||0;});
    window.GST_BASE=(m.gstBase==='ABC')?'ABC':'A';
    var lk=est.lkm||{};
    for(var ki in lk){var el2=document.getElementById('lkm_'+ki);if(el2&&typeof onKmChange==='function'){el2.value=lk[ki];onKmChange(parseInt(ki));}}
    /* Restore MTF costs from autosave */
    if(Array.isArray(est.extraRows)){EXTRA_ROWS=JSON.parse(JSON.stringify(est.extraRows));if(typeof renderExtraRows==='function')renderExtraRows();}
    if(typeof grRestore==='function'&&est.grData)grRestore(est.grData);
    if(est.mtfCosts&&typeof mtfData!=='undefined'){for(var _ak in est.mtfCosts){var _ar=mtfData.find(function(r){return r.sr===parseInt(_ak)||r.sr===_ak;});if(_ar)_ar.cost=parseFloat(est.mtfCosts[_ak])||0;}}
    if(typeof items!=='undefined'&&est.items&&est.items.length){
      items=est.items;
      for(var i=0;i<items.length;i++){if(typeof recalcItem==='function')items[i]=recalcItem(items[i]);}
    }
    if(typeof buildLCT==='function')buildLCT();
    if(typeof updateAll==='function')updateAll();
    if(typeof upCover==='function')upCover();
    if(typeof upMeta==='function')upMeta();
  }catch(e){}
}

/* ── BROWSE ESTIMATES ─────────────────────────────────────────── */
var BROWSE_ALL=[];
function loadBrowse(){
  var list=G("browseList");if(!list)return;
  if(!CU||!window.firebase||!firebase.firestore){
    list.innerHTML="<div style='color:var(--mu);padding:.8rem;text-align:center'>Please login to browse estimates</div>";return;
  }
  list.innerHTML="<div style='color:var(--mu);padding:.8rem;text-align:center'>Loading...</div>";
  BROWSE_ALL=[];
  firebase.firestore().collection("estimates")
    .orderBy("updatedAt","desc").limit(50).get()
    .then(function(snap){
      snap.forEach(function(d){
        if(d.data().uid!==CU.uid)BROWSE_ALL.push({id:d.id,d:d.data()});
      });
      renderBrowse(BROWSE_ALL);
    }).catch(function(e){
      list.innerHTML="<div style='color:#c00;padding:.5rem'>Error: "+e.message+"</div>";
    });
}
function requestEst(estId,estName){
  if(!CU){showToast("Login first to request an estimate","warn");return;}
  if(!window.firebase||!firebase.firestore)return;
  /* Find owner uid from BROWSE_ALL */
  var estObj=BROWSE_ALL.find(function(x){return x.id===estId;});
  var ownerUid=estObj&&estObj.d?estObj.d.uid:"";
  firebase.firestore().collection("requests").add({
    fromUid:CU.uid,
    fromName:CU.displayName||CU.email||CU.phoneNumber||"",
    fromEmail:CU.email||"",
    fromPhone:CU.phoneNumber||"",
    estId:estId,
    estName:estName,
    ownerUid:ownerUid,
    status:"pending",
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){
    showToast("Request sent! \uD83D\uDCE9 Owner will be notified.","success");
    /* Also show in admin requests panel */
    if(typeof aLoadAll==="function"&&AD&&AD.isAdmin)aLoadAll();
    /* Queue admin email (needs Trigger-Email extension — see sendContact) */
    firebase.firestore().collection("mail").add({
      to:[ADMIN_EMAIL],
      message:{
        subject:"📩 New estimate access request",
        text:(CU.displayName||CU.email||CU.phoneNumber||"A user")+" requested access to estimate \""+estName+"\".",
        html:"<p><b>"+esc(CU.displayName||CU.email||CU.phoneNumber||"A user")+"</b> requested access to estimate \""+esc(estName||"")+"\".</p>"
      }
    }).catch(function(e){console.warn("Mail queue error:",e.message);});
  }).catch(function(e){showToast("Error: "+e.message,"error");});
}
function sendContact(){
  var name=(G("ctName").value||"").trim();
  var subj=(G("ctSubj").value||"").trim();
  var msg=(G("ctMsg").value||"").trim();
  hideE("ctErr");hideE("ctOK");
  if(!name){showE("ctErr","Please enter your name");return;}
  if(!msg){showE("ctErr","Please enter a message");return;}
  if(!CU||!window.firebase||!firebase.firestore){showE("ctErr","Login required");return;}
  var btn=G("ctMsg").nextElementSibling;
  if(btn){btn.disabled=true;btn.textContent="Sending...";}
  firebase.firestore().collection("contacts").add({
    uid:CU.uid,name:name,email:CU.email||"",
    subject:subj||"General Enquiry",message:msg,
    status:"new",
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){
    /* Queue an email to admin via the "mail" collection.
       Requires the Firebase "Trigger Email from Firestore" extension
       (https://extensions.dev/extensions/firebase/firestore-send-email)
       to be installed & configured with an SMTP provider — this write
       alone does not send mail without that extension running. */
    firebase.firestore().collection("mail").add({
      to:[ADMIN_EMAIL],
      message:{
        subject:"📩 New message — "+(subj||"General Enquiry"),
        text:"From: "+name+" ("+(CU.email||CU.phoneNumber||"")+")\n\nSubject: "+(subj||"General Enquiry")+"\n\n"+msg,
        html:"<p><b>From:</b> "+esc(name)+" ("+esc(CU.email||CU.phoneNumber||"")+")</p>"
          +"<p><b>Subject:</b> "+esc(subj||"General Enquiry")+"</p>"
          +"<p>"+esc(msg).replace(/\n/g,"<br>")+"</p>"
      }
    }).catch(function(e){console.warn("Mail queue error (check 'mail' collection / Trigger Email extension):",e.message);});
    G("ctName").value="";G("ctSubj").value="";G("ctMsg").value="";
    if(btn){btn.disabled=false;btn.textContent="Send Message";}
    if(G("ctOK")){G("ctOK").style.display="block";}
    showToast("Message sent!","success");
  }).catch(function(e){
    if(btn){btn.disabled=false;btn.textContent="Send Message";}
    showE("ctErr","Error: "+e.message);
  });
}
/* Desired print sequence:
   p0 (Cover) → p8 (Recapitulation) → p3 (Abstract) → p5 (Measurement)
   → p4 (Rate Analysis) → p1 (Lead Charges) → p12 (Quarry Chart) → p6 (Consumption)
   → p7 (Royalty) → p11 (Testing) → p13 (CF Table) → p18 (Plan) → p9 (Steel Calc).  "pgr" = General Report (Documents tab madhla), Print All picker madhun. */
var PRINT_ORDER=["p0","pgr","p8","p3","p5","p4","p1","p12","p6","p7","p11","p20","p13","p18","p9"];

/* ── General Report (सर्वसाधारण अहवाल) in Print All ──────────────────────────
   Ha ahval "Documents" tab (p16 > #d-gr) madhe aahe, PRINT_ORDER madhe p16 nahi,
   mhanun to Print All madhe yet navhta. Ethe #gr_content cha print-only clone banvun
   Main page (p0) nantar takto. Original fields/IDs la hat lavat nahi (clone, ids kadhun).
   Print jhalyavar _restorePrintOrder → _grRemovePrintPage() to kadhun takto. */
function _grBuildPrintPage(){
  var src=document.getElementById("gr_content");
  if(!src)return null;
  var clone=src.cloneNode(true);
  /* textarea/input → plain div (value print hotanna disat nahi) */
  var oi=src.querySelectorAll("input,textarea"),ci=clone.querySelectorAll("input,textarea");
  for(var i=0;i<oi.length;i++){
    if(!ci[i])continue;
    var d=document.createElement("div");
    d.className="gr-pr "+(oi[i].className||"");
    var val=oi[i].value||"";
    if(oi[i].id==="gr_workname"){
      d.style.fontWeight="700";
      if(!String(val).trim()){var pn=document.getElementById("pName");val=pn?(pn.value||""):"";}
    }
    d.textContent=val;
    ci[i].parentNode.replaceChild(d,ci[i]);
  }
  /* buttons (+ Add item, ✕, ＋) kadhun taka */
  clone.querySelectorAll(".noprt").forEach(function(el){el.parentNode.removeChild(el);});
  /* duplicate IDs nako — getElementById('gr_*') original var yavi */
  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach(function(el){el.removeAttribute("id");});
  clone.querySelectorAll("[contenteditable]").forEach(function(el){el.removeAttribute("contenteditable");});
  clone.querySelectorAll("[oninput],[onclick]").forEach(function(el){el.removeAttribute("oninput");el.removeAttribute("onclick");});

  var page=document.createElement("div");
  page.id="_grPrintPage";
  page.className="panel on _gr-print-page";
  page.style.cssText="display:block;margin:0;padding:0;page-break-before:always;break-before:page;page-break-after:always;break-after:page";
  var st=document.createElement("style");
  st.textContent=
    "._gr-print-page .gr-card{background:#fff;box-shadow:none;border:none;border-radius:0;padding:8mm 10mm;line-height:1.8;font-size:14px;color:#000;"
      +"font-family:Arial,Helvetica,'Nirmala UI','Mangal','Noto Sans Devanagari',sans-serif}"
    +"._gr-print-page .gr-pr{white-space:pre-wrap;word-break:break-word;border:none;background:transparent;width:100%}"
    +"._gr-print-page .gr-work{display:flex;gap:.5rem;margin-bottom:6px}"
    +"._gr-print-page .gr-work-lbl{font-weight:700;white-space:nowrap}"
    +"._gr-print-page .gr-title{text-align:center;font-weight:700;font-size:18px;margin:22px 0 18px}"
    +"._gr-print-page .gr-sec-h{margin:16px 0 8px}"
    +"._gr-print-page .gr-item{display:flex;gap:.4rem;margin-bottom:3px}"
    +"._gr-print-page .gr-item-num{min-width:30px}"
    +"._gr-print-page .gr-item-txt{flex:1}"
    +"._gr-print-page .gr-para{margin-bottom:6px}"
    +"._gr-print-page .gr-sign{display:flex;justify-content:space-between;margin-top:60px;gap:20px;page-break-inside:avoid;break-inside:avoid}"
    +"._gr-print-page .gr-sign-block{flex:1;text-align:center;font-weight:600}";
  page.appendChild(st);
  page.appendChild(clone);
  return page;
}
function _grRemovePrintPage(){
  var el=document.getElementById("_grPrintPage");
  if(el&&el.parentNode)el.parentNode.removeChild(el);
}

function _applyPrintOrder(){
  /* Move panels into a dedicated print wrapper in the desired sequence */
  var wrapper=document.getElementById("_printOrderWrapper");
  if(!wrapper){
    wrapper=document.createElement("div");
    wrapper.id="_printOrderWrapper";
    wrapper.style.cssText="display:none;margin:0;padding:0";
    document.body.appendChild(wrapper);
  }
  /* Move wrapper to be the FIRST child of body so nothing renders before it */
  if(document.body.firstChild!==wrapper){
    document.body.insertBefore(wrapper,document.body.firstChild);
  }
  /* Store original parent/nextSibling for each panel so we can restore */
  wrapper._savedPositions=[];
  var firstPanel=true;
  _grRemovePrintPage();
  _pdfRemovePrintPages();
  PRINT_ORDER.forEach(function(id){
    /* General Report (Documents tab madhla) — picker madhe "pgr" tick asel tar tya jagi */
    if(id==="pgr"){
      try{
        var _grPg=_grBuildPrintPage();
        if(_grPg){
          if(firstPanel){_grPg.style.pageBreakBefore="avoid";_grPg.style.breakBefore="avoid";firstPanel=false;}
          wrapper.appendChild(_grPg);
        }
      }catch(_ge){console.error("Print All: General Report",_ge);}
      return;
    }
    /* Main Page / Recapitulation / Abstract / Measurement / Rate Analysis — estimate-PDF style page (atp_main.js: atpPdfPrintPage) instead of the screen panel */
    if((id==="p0"||id==="p1"||id==="p8"||id==="p3"||id==="p5"||id==="p4"||id==="p12"||id==="p7"||id==="p6"||id==="p11"||id==="p20"||id==="p18")&&typeof atpPdfPrintPage==="function"){
      try{
        var _pdfPg=atpPdfPrintPage(id);
        if(_pdfPg){
          if(firstPanel){_pdfPg.style.pageBreakBefore="avoid";_pdfPg.style.breakBefore="avoid";firstPanel=false;}
          wrapper.appendChild(_pdfPg);
          return;
        }
      }catch(_pe){console.error("Print All: PDF-style "+id,_pe);}
    }
    var el=document.getElementById(id);
    if(!el)return;
    wrapper._savedPositions.push({el:el,parent:el.parentNode,next:el.nextSibling});
    wrapper.appendChild(el);
    el.classList.add("on");
    el.style.margin="0";
    el.style.padding="0";
    /* First panel: no page-break-before to avoid blank leading page */
    if(firstPanel){
      el.style.pageBreakBefore="avoid";
      el.style.breakBefore="avoid";
      el.style.marginTop="0";
      el.style.paddingTop="0";
      firstPanel=false;
    } else {
      el.style.pageBreakBefore="always";
      el.style.breakBefore="always";
    }
    el.style.pageBreakAfter="always";
    el.style.breakAfter="always";

    /* .pth + .tw एकत्र wrap करतो — page-break-inside:avoid मुळे
       title आणि table एकाच page वर राहतात, blank page येत नाही */
    var pth=el.querySelector(".pth");
    var tw=el.querySelector(".tw");
    if(pth&&tw&&tw.parentNode===pth.parentNode){
      /* आधीच wrap केलेलं नसेल तरच */
      if(!pth.parentNode.classList||!pth.parentNode.classList.contains("_pth-tw-wrap")){
        var wrap=document.createElement("div");
        wrap.className="_pth-tw-wrap";
        wrap.style.cssText="page-break-inside:avoid;break-inside:avoid;display:block;margin:0;padding:0";
        pth.parentNode.insertBefore(wrap,pth);
        wrap.appendChild(pth);
        wrap.appendChild(tw);
      }
    }
  });
  wrapper.style.cssText="display:block;margin:0;padding:0";
}

function _pdfRemovePrintPages(){
  document.querySelectorAll("._pdf-print-page").forEach(function(e){if(e.parentNode)e.parentNode.removeChild(e);});
}
function _restorePrintOrder(){
  _grRemovePrintPage();
  _pdfRemovePrintPages();
  var wrapper=document.getElementById("_printOrderWrapper");
  if(!wrapper||!wrapper._savedPositions)return;
  wrapper._savedPositions.forEach(function(s){
    if(s.next){s.parent.insertBefore(s.el,s.next);}
    else{s.parent.appendChild(s.el);}
    s.el.classList.remove("on");
    s.el.style.pageBreakAfter="";
    s.el.style.breakAfter="";
    s.el.style.pageBreakBefore="";
    s.el.style.breakBefore="";
    s.el.style.marginTop="";
    s.el.style.paddingTop="";
    s.el.style.margin="";
    s.el.style.padding="";
    /* .pth + .tw wrap उलटवतो */
    var wrapDiv=s.el.querySelector("._pth-tw-wrap");
    if(wrapDiv){
      var parent=wrapDiv.parentNode;
      while(wrapDiv.firstChild){parent.insertBefore(wrapDiv.firstChild,wrapDiv);}
      parent.removeChild(wrapDiv);
    }
  });
  wrapper._savedPositions=[];
  wrapper.style.cssText="display:none;margin:0;padding:0";
  /* Move wrapper back to end of body */
  document.body.appendChild(wrapper);
  /* Reset plan canvas print image so it doesn't linger on screen */
  try{var _pci=document.getElementById("planCanvasPrint");if(_pci)_pci.removeAttribute("src");}catch(_e){}
  /* Stamp wrap cleanup */
  if(typeof _unwrapStamps==="function") _unwrapStamps();
}

function printAll(){
  if(typeof canDownload==="function"&&!canDownload())return;
  _doCountDownload();
  _prepPrint();
  var activeTab=0;
  for(var i=0;i<=18;i++){var t=R("t"+i);if(t&&t.classList.contains("on")){activeTab=i;break;}}
  /* Hide all panels first; only the ordered wrapper panels will show */
  document.querySelectorAll(".panel").forEach(function(p){p.classList.remove("on");});
  _applyPrintOrder();
  if(typeof drawLeadDiagram==="function"){try{drawLeadDiagram();}catch(e){}}
  var oldTitle=document.title;
  var workName=((R("pName")||{}).value||"").trim();
  document.title=workName||"New Work";
  window._printAllInProgress=true;
  /* Stamp alone fix — panels visible झाल्यावर run करतो */
  setTimeout(function(){_avoidLonelyStamp();},80);
  setTimeout(function(){window.print();},300);
  setTimeout(function(){document.title=oldTitle;},900);
  setTimeout(function(){
    window._printAllInProgress=false;
    _restorePrintOrder();
    document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("on");});
    goTab(activeTab);
    /* _silentAutoSave() → afterprint event मध्ये होतो (dialog बंद झाल्यावर) */
  },800);
}

/* ══════════════════════════════════════════════════════════════════
   SILENT AUTO-SAVE — Print नंतर वापरतो.
   alert / confirm dialogs दाखवत नाही — silently save करतो.
══════════════════════════════════════════════════════════════════ */
function _silentAutoSave(){
  var nm=((R('pName')||{}).value||'').trim();
  if(!nm)return; /* Name नाही — silently skip, no alert */

  /* जर नवीन document असेल (CUR_EST_ID नाही) — नाव विचारून save करायचे */
  if(!CUR_EST_ID){
    var newName=window.prompt('Print done \u2705\nSave this estimate under a different name?\nEnter a name (if left blank, "'+nm+'" will be used):','');
    /* Cancel दाबले — null येते — save करायचे नाही */
    if(newName===null)return;
    /* नाव दिले असेल तर pName field update करणे */
    if(newName.trim()){
      var pNameEl=R('pName');
      if(pNameEl)pNameEl.value=newName.trim();
    }
  }

  /* window.confirm आणि showToast तात्पुरते block करतो — print/save दरम्यान कोणताही popup/toast नको */
  var _origConfirm=window.confirm;
  var _origToast=window.showToast;
  window.confirm=function(){return true;};
  window.showToast=function(){}; /* toast mute */
  try{
    if(typeof saveEstimate==='function')saveEstimate();
  }catch(_e){}
  window.confirm=_origConfirm;
  window.showToast=_origToast; /* restore */
}

function _doCountDownload(){
  /* Count download once per export action */
  if(typeof CU!=="undefined"&&CU&&typeof IS_PRO!=="undefined"&&!IS_PRO&&!planActive()){
    DL_COUNT++;
    if(typeof renderHeader==="function")renderHeader();
    if(window.firebase&&firebase.firestore)
      firebase.firestore().collection("users").doc(CU.uid)
        .update({dlCount:firebase.firestore.FieldValue.increment(1)}).catch(function(){});
  }
}

function _prepPrint(){
  upMeta();
  var nm=((R("pName")||{}).value||"");
  document.querySelectorAll(".pth-work").forEach(function(el){el.textContent=nm;});
  try{
    if(typeof LCD!=="undefined"&&LCD&&LCD.length){
      for(var ki=0;ki<LCD.length;ki++){
        var kmEl=R("lkm_"+ki);if(!kmEl)continue;
        var kmV=parseFloat(kmEl.value)||0;
        var kpEl=R("lkmp_"+ki);if(kpEl)kpEl.textContent=kmV>0?kmV.toFixed(1):"";
        var locEl=R("lloc_"+ki);if(locEl){var lp=R("llocp_"+ki);if(lp)lp.textContent=locEl.value||"";}
        var rowEl=R("lcrow_"+ki);
        var chgEl=R("lchg_"+ki);var chgV=chgEl?(parseFloat(chgEl.textContent)||0):0;
        if(rowEl)rowEl.className=(kmV>0&&chgV>0)?"":"lc-row-zero";
      }
    }
  }catch(e){}

  /* Sync canvas to print image */
  try{var _cv=document.getElementById("spCanvas");var _ci=document.getElementById("spCanvasPrint");if(_cv&&_ci){var _su=(typeof spBuildPrintImg==="function")?spBuildPrintImg():null;if(_su){_ci.src=_su;}else{_ci.src=_cv.toDataURL("image/png");}}}catch(_ce){}
  /* Sync Plan canvas to print image — redraw first so canvas is never blank */
  try{
    if(typeof planRedraw==="function")planRedraw();
    var _pc=document.getElementById("planCanvas");
    var _pi=document.getElementById("planCanvasPrint");
    if(_pc&&_pi){var _pu=(typeof planBuildPrintImg==="function")?planBuildPrintImg():null;if(_pu){_pi.src=_pu;}else{_pi.src=_pc.toDataURL("image/png");}}
  }catch(_pce){}
}

/**
 * _avoidLonelyStamp()
 * Abstract / इतर sheets मधील stamp block जर एकट्याने next page वर जाणार असेल,
 * तर table च्या last rows ना extra padding-bottom देऊन stamp same page वर आणतो.
 *
 * Logic:
 *   1. प्रत्येक panel मध्ये sheet-stamp-block शोधतो.
 *   2. त्याच्या आधीची table शोधतो.
 *   3. Table bottom position आणि page height यावरून space left calculate करतो.
 *   4. जर stamp + safety buffer ला जागा नसेल, तर last rows ना padding देतो.
 */
/**
 * getSheetStampHTML(sheetId)
 * sheet-stamp-block चा innerHTML परत देतो — table मध्ये inline टाकण्यासाठी
 */
function getSheetStampHTML(sheetId){
  var block=document.querySelector('[data-sheet="'+sheetId+'"].sheet-stamp-block');
  if(!block)return '';
  if(block.style.display==='none')return ''; /* stamp switched off for this sheet */
  return '<div style="margin-top:1.5rem;padding:1rem 2rem;border-top:1px solid #999;page-break-inside:avoid">'+block.innerHTML+'</div>';
}

function _avoidLonelyStamp(){
  /* Approach: .tw (table wrapper) आणि .sheet-stamp-block यांना
     एका common wrapper div मध्ये wrap करतो ज्याला
     page-break-inside:avoid दिलेला आहे.
     Browser मग दोन्ही एकत्र ठेवतो — stamp alone जात नाही.
     
     Print नंतर _restorePrintOrder मध्ये unwrap होतो. */

  document.querySelectorAll('.sheet-stamp-block').forEach(function(stampBlock){
    var panel = stampBlock.parentElement;
    if(!panel) return;

    /* आधी wrap केलेला असेल तर skip */
    if(stampBlock.parentElement.classList.contains('_stamp-wrap')) return;

    /* .tw शोधतो — stampBlock च्या आधीचा */
    var tw = null;
    var sib = stampBlock.previousElementSibling;
    while(sib){
      if(sib.classList && sib.classList.contains('tw')){tw = sib; break;}
      sib = sib.previousElementSibling;
    }

    /* tw नसेल तरी फक्त stampBlock wrap करतो */
    var wrapper = document.createElement('div');
    wrapper.className = '_stamp-wrap';
    wrapper.style.cssText = 'page-break-inside:avoid!important;break-inside:avoid!important;display:block';

    if(tw){
      /* tw च्या जागी wrapper insert करतो */
      panel.insertBefore(wrapper, tw);
      wrapper.appendChild(tw);
    } else {
      panel.insertBefore(wrapper, stampBlock);
    }
    wrapper.appendChild(stampBlock);
  });
}

function _unwrapStamps(){
  /* Print नंतर wrap उलटवतो */
  document.querySelectorAll('._stamp-wrap').forEach(function(wrapper){
    var parent = wrapper.parentElement;
    if(!parent) return;
    while(wrapper.firstChild){
      parent.insertBefore(wrapper.firstChild, wrapper);
    }
    parent.removeChild(wrapper);
  });
}

function doPrint(){
  G("exportOptModal").style.display="none";
  _doCountDownload();
  _prepPrint();
  var activeTab=0;
  for(var i=0;i<=18;i++){var t=R("t"+i);if(t&&t.classList.contains("on")){activeTab=i;break;}}
  /* Hide all panels; only ordered wrapper panels will print */
  document.querySelectorAll(".panel").forEach(function(p){p.classList.remove("on");});
  _applyPrintOrder();
  if(typeof drawLeadDiagram==="function"){try{drawLeadDiagram();}catch(e){}}
  window._printAllInProgress=true;
  setTimeout(function(){window.print();},300);
  setTimeout(function(){
    window._printAllInProgress=false;
    _restorePrintOrder();
    document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("on");});
    goTab(activeTab);
    /* _silentAutoSave() → afterprint event मध्ये होतो (dialog बंद झाल्यावर) */
  },800);
}

/* ══════════════════════════════════════════════════════════════════════════
   EXPORT ALL → EXCEL  (print sarkhe formatting)
   • Print All sarkhach sheet-picker; nivdlelya sheets print chya sequence madhe (ek sheet = ek tab)
   • Borders, merged cells (rowspan/colspan), header fill/bold, number alignment, wrap + row height,
     Name-of-Work title, Engineer signature block (stamp), cover page, Quarry/Plan image
   • A4, fit-to-width, header rows pratyek page var repeat, "Page x of y" footer
   • Pratyek cell cha format app madhil tya element cha computed style varun ghetla jato
   • ExcelJS load zala nahi tar juna simple export (_doExportExcelLegacy) vaprla jato
   ══════════════════════════════════════════════════════════════════════════ */
var XL_NAMES={p0:"Main Page",p8:"Recapitulation",p20:"Diff Cost of Material",p3:"Abstract",p5:"Measurements",p4:"Rate Analysis",p1:"Lead Charges",p12:"Quarry Chart",p6:"Consumption",p7:"Royalty",p11:"Testing",p13:"CF Table",p18:"Plan",p9:"Steel Calculation"};
var XL_FONT="Arial";
var XL_BRD={style:"thin",color:{argb:"FF444444"}};

function _xlColor(css){
  if(!css)return null;
  var m=/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s\/]+([\d.]+))?/.exec(css);
  if(!m)return null;
  if(m[4]!==undefined&&parseFloat(m[4])===0)return null;
  var h=function(n){n=parseInt(n,10);return(n<16?"0":"")+n.toString(16).toUpperCase();};
  return "FF"+h(m[1])+h(m[2])+h(m[3]);
}
/* print madhe lapleli (noprt / zero rows / display:none) elements — .prtonly nehmi disto */
function _xlHidden(el,root){
  var n=el;
  while(n&&n!==root&&n.nodeType===1){
    var cl=n.classList,po=cl&&cl.contains("prtonly");
    if(!po){
      if(cl&&(cl.contains("noprt")||cl.contains("roy-hid")||cl.contains("lc-row-zero")||cl.contains("mtf-zero")))return true;
      var cs=null;try{cs=window.getComputedStyle(n);}catch(e){}
      if(cs&&cs.display==="none")return true;
    }
    n=n.parentNode;
  }
  return false;
}
/* cell / element cha print text: input/select value ghyaycha, noprt + buttons kaadhaycha, prtonly thevaycha */
function _xlText(td){
  var clone=td.cloneNode(true),orig=td.querySelectorAll("input,select,textarea"),cl=clone.querySelectorAll("input,select,textarea"),i;
  for(i=0;i<cl.length;i++){
    var o=orig[i],c=cl[i],v="";
    if(o&&!_xlHidden(o,td)){
      if(o.tagName==="SELECT")v=o.options[o.selectedIndex]?o.options[o.selectedIndex].text:o.value;
      else if(o.type==="checkbox"||o.type==="radio")v=o.checked?"\u2713":"";
      else v=o.value;
    }
    c.parentNode.replaceChild(document.createTextNode(v==null?"":String(v)),c);
  }
  clone.querySelectorAll(".noprt,button,script,style,.gst-base-btn,.roy-hide-btn").forEach(function(x){x.parentNode&&x.parentNode.removeChild(x);});
  clone.querySelectorAll("*").forEach(function(x){if(x.style&&x.style.display==="none"&&!x.classList.contains("prtonly"))x.parentNode&&x.parentNode.removeChild(x);});
  clone.querySelectorAll("br").forEach(function(b){b.parentNode.replaceChild(document.createTextNode("\n"),b);});
  var t=clone.textContent||"",ws="";
  try{ws=window.getComputedStyle(td).whiteSpace||"";}catch(e){}
  t=/pre/.test(ws)?t.replace(/[ \t\u00a0]+/g," ").replace(/ ?\n ?/g,"\n"):t.replace(/\s+/g," ");
  return t.trim();
}
function _xlStyle(el,fallbackBgEl){
  var cs=window.getComputedStyle(el),px=parseFloat(cs.fontSize)||12;
  var fw=cs.fontWeight,bold=(fw==="bold"||parseInt(fw,10)>=600);
  var bg=_xlColor(cs.backgroundColor);
  if(!bg&&fallbackBgEl){try{bg=_xlColor(window.getComputedStyle(fallbackBgEl).backgroundColor);}catch(e){}}
  if(bg==="FFFFFFFF")bg=null;
  var al=cs.textAlign,h="left";
  if(al==="right"||al==="end")h="right";else if(al==="center")h="center";
  else if(el.classList&&el.classList.contains("r"))h="right";   /* .r = right-aligned numeric column */
  var va=cs.verticalAlign;
  var tdl=(cs.textDecorationLine||cs.textDecoration||"");
  return{
    bold:bold,italic:cs.fontStyle==="italic",under:/underline/.test(tdl),
    sz:Math.max(8,Math.min(15,Math.round(px*0.75*1.25*2)/2)),
    color:_xlColor(cs.color)||"FF000000",bg:bg,h:h,
    v:(va==="top"?"top":(va==="bottom"?"bottom":"middle"))
  };
}
function _xlApply(cell,st,extra){
  extra=extra||{};
  cell.font={name:XL_FONT,size:extra.sz||st.sz,bold:extra.bold!=null?extra.bold:st.bold,italic:st.italic,underline:st.under,color:{argb:st.color}};
  cell.alignment={horizontal:extra.h||st.h,vertical:extra.v||st.v,wrapText:true};
  if(st.bg)cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:st.bg}};
}
function _xlFmt(d){
  var dec=d>0?"."+new Array(d+1).join("0"):"";
  return "[>=10000000]##\\,##\\,##\\,##0"+dec+";[>=100000]##\\,##\\,##0"+dec+";##,##0"+dec;
}
function _xlLines(txt,w,sz){
  var cap=Math.max(3,Math.floor(w*10.1/sz*0.88)),n=0;
  String(txt==null?"":txt).split("\n").forEach(function(p){n+=Math.max(1,Math.ceil(p.length/cap));});
  return n;
}
function _xlRowH(lines,sz){return Math.max(15,Math.round(lines*sz*1.32+4));}
/* Arial char-width model (em) + word-wrap simulation: row height jaast jaga shillak na thevta tight basto */
function _xlCw(ch){
  var c=ch.charCodeAt(0);
  if(c>=0x0900&&c<=0x097F)return 0.62;
  if(c>255)return 1;
  if("ijl'|!.,:;".indexOf(ch)>-1)return 0.25;
  if(" ftI/\\[]-()r".indexOf(ch)>-1)return 0.3;
  if(ch==="m"||ch==="M"||ch==="W")return 0.88;
  if(ch==="w")return 0.72;
  if(c>=48&&c<=57)return 0.556;
  if(c>=65&&c<=90)return 0.69;
  if(c>=97&&c<=122)return 0.54;
  return 0.56;
}
function _xlLinesFit(txt,w,sz,bold){
  var avail=(w*7-8)*0.95,k=sz*96/72*(typeof bold==="number"?(1+0.07*bold):(bold?1.07:1)),sp=0.278*k,total=0;
  String(txt==null?"":txt).split("\n").forEach(function(par){
    var words=par.split(" "),line=0,cnt=1,first=true;
    words.forEach(function(wd){
      var ww=0,i;for(i=0;i<wd.length;i++)ww+=_xlCw(wd.charAt(i))*k;
      if(first){line=ww;first=false;}
      else if(line+sp+ww<=avail){line+=sp+ww;}
      else{cnt++;line=ww;}
      while(line>avail&&avail>0){cnt++;line-=avail;}
    });
    total+=cnt;
  });
  return Math.max(1,total);
}

/* ── <table> → grid ─────────────────────────────────────────────────────── */
function _xlGrid(table,id){
  var trs=[].slice.call(table.rows),vis=[],root=table.parentNode;
  trs.forEach(function(tr){
    if(_xlHidden(tr,root))return;
    if(id==="p13"&&tr.parentNode&&tr.parentNode.id==="cfEditBody"){
      var c0=tr.cells[0]?_xlText(tr.cells[0]):"";
      var inEst=(typeof items!=="undefined")&&items.some(function(it){return String(it.no).trim()===c0;});
      if(!inEst)return;
    }
    vis.push(tr);
  });
  if(!vis.length)return null;
  var bodyRows=vis.filter(function(tr){return tr.parentNode.tagName!=="THEAD";});
  if(!bodyRows.length||bodyRows.every(function(tr){return tr.querySelector("td.ni");}))return null;
  var occ=[],rows=[],ncols=0,head=0,headDone=false;
  vis.forEach(function(tr,ri){
    occ[ri]=occ[ri]||[];
    var ci=0,placed=[],isHead=(tr.parentNode.tagName==="THEAD")||(tr.cells.length>0&&[].every.call(tr.cells,function(c){return c.tagName==="TH";}));
    [].forEach.call(tr.cells,function(td){
      if(_xlHidden(td,tr.parentNode))return;
      while(occ[ri][ci])ci++;
      var cs=Math.max(1,td.colSpan||1),rs=Math.min(Math.max(1,td.rowSpan||1),vis.length-ri),a,b;
      for(a=0;a<rs;a++){occ[ri+a]=occ[ri+a]||[];for(b=0;b<cs;b++)occ[ri+a][ci+b]=true;}
      placed.push({td:td,c:ci,cs:cs,rs:rs});
      ci+=cs;
    });
    ncols=Math.max(ncols,ci);
    if(!headDone){if(isHead)head++;else headDone=true;}
    /* 3px divider rows (cc-tbl) */
    var hpx=parseFloat(tr.style&&tr.style.height)||0,divider=false;
    if(hpx>0&&hpx<=8&&tr.style.height.indexOf("px")>-1){divider=placed.every(function(p){return _xlText(p.td)==="";});}
    rows.push({tr:tr,cells:placed,isHead:isHead,divider:divider});
  });
  if(!ncols)return null;
  /* cell data */
  rows.forEach(function(rw){
    rw.cells.forEach(function(p){
      var td=p.td,txt=_xlText(td),st=_xlStyle(td,rw.tr);
      if(rw.isHead){st.bold=true;if(!st.bg)st.bg="FFF2F2F2";}
      p.txt=txt;p.st=st;p.num=null;p.dec=0;
      if(!rw.isHead&&st.h==="right"&&/^[-+]?\d[\d,]*(\.\d+)?$/.test(txt)){
        p.num=parseFloat(txt.replace(/,/g,""));
        p.dec=txt.indexOf(".")>-1?txt.split(".")[1].length:0;
        if(isNaN(p.num))p.num=null;
      }
    });
  });
  /* logical column widths (chars) */
  var lw=[],c;
  for(c=0;c<ncols;c++){
    var mxB=0,mxH=0,wordH=0,allNum=true,nB=0;
    rows.forEach(function(rw){
      if(rw.divider)return;
      rw.cells.forEach(function(p){
        if(p.c!==c||p.cs!==1)return;
        var L=0;String(p.txt).split("\n").forEach(function(s){L=Math.max(L,s.length);});
        if(rw.isHead){
          mxH=Math.max(mxH,Math.min(L,13));
          String(p.txt).split(/\s+/).forEach(function(wd){wordH=Math.max(wordH,wd.length);});
        }else{
          mxB=Math.max(mxB,L);
          if(p.txt!==""){nB++;if(p.num===null&&!/^[-\u2013\u2014.]+$/.test(p.txt))allNum=false;}
        }
      });
    });
    var w=Math.max(Math.max(mxH,wordH)+3,Math.min(mxB*1.05+2,mxB>40?52:60));
    if(allNum&&nB)w=Math.max(w,mxB*1.3+3,11);
    lw.push(Math.max(6,Math.min(60,w)));
  }
  return{t:"table",rows:rows,ncols:ncols,head:head,lw:lw};
}

/* ── panel → blocks ─────────────────────────────────────────────────────── */
function _xlStamp(el){
  var row=el.firstElementChild,groups=[];
  if(!row)return null;
  [].forEach.call(row.children,function(ch){
    if(ch.style&&ch.style.display==="none")return;
    var box=ch.firstElementChild||ch,lines=[],al=window.getComputedStyle(ch).textAlign;
    [].forEach.call(box.children,function(ln){
      if(ln.classList.contains("sign-space")){lines.push({sign:true});return;}
      var t=(ln.textContent||"").replace(/\s+/g," ").trim();
      var fw=window.getComputedStyle(ln).fontWeight;
      lines.push({txt:t,bold:(fw==="bold"||parseInt(fw,10)>=600)});
    });
    groups.push({h:(al==="right"||al==="end")?"right":(al==="center"?"center":"left"),lines:lines});
  });
  return groups.length?{t:"stamp",groups:groups}:null;
}
function _xlCollect(panel,id){
  var blocks=[];
  function leaf(el){
    var tx=_xlText(el);if(!tx)return;
    blocks.push({t:"text",txt:tx,st:_xlStyle(el)});
  }
  function walk(el){
    if(!el||el.nodeType!==1)return;
    var tg=el.tagName,cl=el.classList;
    if(tg==="SCRIPT"||tg==="STYLE"||tg==="BUTTON"||tg==="CANVAS"||tg==="IMG")return;
    if(cl.contains("sh"))return;
    if(cl.contains("pth")){
      var w=el.querySelector(".pth-work"),s=el.querySelector(".pth-sheet");
      blocks.push({t:"title",work:w?(w.textContent||"").replace(/\s+/g," ").trim():"",sheet:s?(s.textContent||"").replace(/\s+/g," ").trim():"",
        wst:w?_xlStyle(w):null});
      return;
    }
    if(cl.contains("sheet-stamp-block")){
      if(el.style.display==="none")return;
      var sb=_xlStamp(el);if(sb)blocks.push(sb);return;
    }
    if(_xlHidden(el,panel))return;
    if(tg==="TABLE"){
      if(id==="p13"&&el.id!=="cfEditTable")return;
      var g=_xlGrid(el,id);if(g)blocks.push(g);return;
    }
    if(id==="p13"&&!el.querySelector("table")&&!el.classList.contains("tw"))return;
    if(!el.querySelector("table,div,p,ul,ol,h1,h2,h3,h4,h5,h6,section,canvas,img")){leaf(el);return;}
    [].forEach.call(el.children,walk);
  }
  if(id==="p12"||id==="p18"){
    /* Quarry chart / Plan: fakt title + print image + stamp */
    var pth=panel.querySelector(".pth");if(pth)walk(pth);
    var im=document.getElementById(id==="p12"?"spCanvasPrint":"planCanvasPrint");
    if(im&&/^data:image\//.test(im.getAttribute("src")||im.src||"")){
      blocks.push({t:"image",src:im.getAttribute("src")||im.src,w:im.naturalWidth||0,h:im.naturalHeight||0});
    }
    var stp=panel.querySelector(".sheet-stamp-block");if(stp)walk(stp);
    return blocks;
  }
  [].forEach.call(panel.children,walk);
  return blocks;
}

/* ── writers ────────────────────────────────────────────────────────────── */
function _xlSpans(n,M){
  var base=Math.floor(M/n),ex=M%n,sp=[],st=[],acc=0,j;
  for(j=0;j<n;j++){var s=base+(j<ex?1:0);sp.push(s);st.push(acc);acc+=s;}
  return{sp:sp,st:st};
}
function _xlSumW(colW,c1,c2){var s=0,c;for(c=c1;c<=c2;c++)s+=colW[c-1]||8;return s;}
function _xlBorderRange(ws,r1,c1,r2,c2,b){
  var r,c;for(r=r1;r<=r2;r++)for(c=c1;c<=c2;c++)ws.getCell(r,c).border=b;
}
function _xlWriteTable(ws,tb,r0,M,colW){
  var m=_xlSpans(tb.ncols,M),rowH={},needs=[];
  tb.rows.forEach(function(rw,ri){
    var xr=r0+ri,maxH=15;
    if(rw.divider){
      ws.getRow(xr).height=4;
      var dbg=null;try{dbg=_xlColor(window.getComputedStyle(rw.tr.cells[0]).backgroundColor);}catch(e){}
      if(dbg&&dbg!=="FFFFFFFF"){for(var q=1;q<=M;q++)ws.getCell(xr,q).fill={type:"pattern",pattern:"solid",fgColor:{argb:dbg}};}
      rowH[xr]=4;return;
    }
    rw.cells.forEach(function(p){
      var c1=m.st[p.c]+1,c2=m.st[p.c+p.cs-1]+m.sp[p.c+p.cs-1],r1=xr,r2=xr+p.rs-1;
      var cell=ws.getCell(r1,c1);
      if(p.num!==null){cell.value=p.num;cell.numFmt=_xlFmt(p.dec);}else cell.value=p.txt===""?null:p.txt;
      _xlApply(cell,p.st);
      if(c2>c1||r2>r1){
        ws.mergeCells(r1,c1,r2,c2);
        var rr,cc;for(rr=r1;rr<=r2;rr++)for(cc=c1;cc<=c2;cc++){
          if(rr===r1&&cc===c1)continue;
          if(p.st.bg)ws.getCell(rr,cc).fill={type:"pattern",pattern:"solid",fgColor:{argb:p.st.bg}};
        }
      }
      _xlBorderRange(ws,r1,c1,r2,c2,{top:XL_BRD,left:XL_BRD,bottom:XL_BRD,right:XL_BRD});
      var need=_xlRowH(p.num!==null?1:_xlLines(p.txt,_xlSumW(colW,c1,c2),p.st.sz),p.st.sz);
      if(p.rs===1)maxH=Math.max(maxH,need);else needs.push({r1:r1,r2:r2,h:need});
    });
    ws.getRow(xr).height=maxH;rowH[xr]=maxH;
  });
  needs.forEach(function(n){
    var sum=0,r;for(r=n.r1;r<=n.r2;r++)sum+=(rowH[r]||15);
    if(sum<n.h){var add=(n.h-sum)/(n.r2-n.r1+1);for(r=n.r1;r<=n.r2;r++){rowH[r]=(rowH[r]||15)+add;ws.getRow(r).height=rowH[r];}}
  });
  return r0+tb.rows.length;
}
function _xlWriteText(ws,b,r,M,colW){
  var st=b.st;ws.mergeCells(r,1,r,M);
  var cell=ws.getCell(r,1);cell.value=b.txt;_xlApply(cell,st);
  ws.getRow(r).height=_xlRowH(_xlLines(b.txt,_xlSumW(colW,1,M),st.sz),st.sz);
  return r+1;
}
function _xlWriteTitle(ws,b,r,M,colW){
  var rows=0;
  if(b.work){
    ws.mergeCells(r,1,r,M);var c=ws.getCell(r,1);c.value=(XK_NAMEREF&&_xkNorm(b.work)===XK_NAMEVAL)?_xkNameF(b.work):b.work;
    c.font={name:XL_FONT,size:12,bold:true};c.alignment={horizontal:"center",vertical:"middle",wrapText:true};
    ws.getRow(r).height=_xlRowH(_xlLines(b.work,_xlSumW(colW,1,M),12),12);r++;rows++;
  }
  if(b.sheet){
    ws.mergeCells(r,1,r,M);var c2=ws.getCell(r,1);c2.value=b.sheet;
    c2.font={name:XL_FONT,size:13,bold:true,underline:true};c2.alignment={horizontal:"center",vertical:"middle",wrapText:true};
    ws.getRow(r).height=22;r++;rows++;
  }
  ws.getRow(r).height=6;r++;
  return r;
}
function _xlStampSpans(colW,k){
  var M=colW.length,tot=colW.reduce(function(a,b){return a+b;},0),st=[0],sp=[],i,c;
  var cum=[0];for(c=0;c<M;c++)cum.push(cum[c]+colW[c]);   /* cum[c] = width of columns 0..c-1 */
  for(i=1;i<k;i++){
    var lo=st[i-1]+1,hi=M-(k-i),best=lo,bd=1e9,target=tot*i/k;
    for(c=lo;c<=hi;c++){var d=Math.abs(cum[c]-target);if(d<bd){bd=d;best=c;}}
    st.push(best);
  }
  for(i=0;i<k;i++)sp.push((i+1<k?st[i+1]:M)-st[i]);
  return{sp:sp,st:st};
}
function _xlWriteStamp(ws,b,r,M,colW){
  /* Signature block in the sample layout (same as Print All "Standard"): blank space for the wet signature, then
     "Designation," and "Location" in bold. The officer-name line above the signature space is not exported and there
     is no ruled line across the sheet. */
  var grps=b.groups.map(function(g){
    var hasSign=g.lines.some(function(l){return l.sign;}),seen=!hasSign,out=[],first=true;
    g.lines.forEach(function(l){
      if(l.sign){seen=true;out.push(l);return;}
      if(!seen)return;
      if(!l.txt)return;
      var t=l.txt;
      if(first){t=t.replace(/\s*,\s*$/,"")+",";first=false;}
      out.push({txt:t,bold:true});
    });
    return{h:g.h,lines:out};
  });
  var k=grps.length,m=_xlStampSpans(colW,k),i;
  ws.getRow(r).height=14;
  r++;
  var maxL=0;grps.forEach(function(g){maxL=Math.max(maxL,g.lines.length);});
  var li;
  for(li=0;li<maxL;li++){
    var isSign=grps.some(function(g){return g.lines[li]&&g.lines[li].sign;});
    var needH=16;
    if(!isSign){
      grps.forEach(function(g,gi){
        var l2=g.lines[li];if(!l2||l2.sign||!l2.txt)return;
        var w2=_xlSumW(colW,m.st[gi]+1,m.st[gi]+m.sp[gi]);
        needH=Math.max(needH,_xlRowH(_xlLinesFit(l2.txt,w2,10,true),10));
      });
    }
    ws.getRow(r).height=isSign?44:needH;
    grps.forEach(function(g,gi){
      var ln=g.lines[li];if(!ln)return;
      var c1=m.st[gi]+1,c2=m.st[gi]+m.sp[gi];
      if(c2>c1)ws.mergeCells(r,c1,r,c2);
      var cell=ws.getCell(r,c1);
      if(ln.sign)return;   /* blank space, no line */
      cell.value=ln.txt||null;
      cell.font={name:XL_FONT,size:10,bold:true,italic:false};
      cell.alignment={horizontal:g.h,vertical:"top",wrapText:true};
    });
    r++;
  }
  return r;
}
function _xlWriteImage(wb,ws,b,r,M,colW){
  var m=/^data:image\/(png|jpe?g|gif);base64,/i.exec(b.src);if(!m)return r;
  var ext=m[1].toLowerCase();ext=ext==="jpg"?"jpeg":ext;
  var totalPx=Math.min(700,_xlSumW(colW,1,M)*7),w=b.w||900,h=b.h||640;
  var sc=totalPx/w,pw=Math.round(w*sc),ph=Math.round(h*sc);
  var id=wb.addImage({base64:b.src,extension:ext});
  var nrows=Math.ceil(ph*0.75/20),i;
  for(i=0;i<nrows;i++)ws.getRow(r+i).height=20;
  var offc=Math.max(0,(_xlSumW(colW,1,M)*7-pw)/2/7);   /* image madhe center */
  var col=0,acc=0;while(col<M&&acc+colW[col]<=offc){acc+=colW[col];col++;}
  ws.addImage(id,{tl:{col:col+((offc-acc)/(colW[col]||8)),row:r-1},ext:{width:pw,height:ph}});
  return r+nrows+1;
}

function _xlSheetSetup(ws,landscape,titleRows){
  ws.pageSetup={paperSize:9,orientation:landscape?"landscape":"portrait",fitToPage:true,fitToWidth:1,fitToHeight:0,horizontalCentered:true,
    margins:{left:0.7,right:0.63,top:0.63,bottom:0.55,header:0.3,footer:0.3}};
  if(titleRows)ws.pageSetup.printTitlesRow=titleRows;
  ws.headerFooter={oddFooter:"&C&9Page &P of &N"};
}
function _xlPanelSheet(wb,panel,id){
  var blocks=_xlCollect(panel,id);
  var body=blocks.some(function(b){return b.t!=="title"&&b.t!=="stamp";});
  if(!body)return null;
  var M=4,c;
  blocks.forEach(function(b){if(b.t==="table")M=Math.max(M,b.ncols);});
  var colW=[];for(c=0;c<M;c++)colW.push(0);
  var hasTb=false;
  blocks.forEach(function(b){
    if(b.t!=="table")return;hasTb=true;
    var m=_xlSpans(b.ncols,M);
    b.lw.forEach(function(w,j){var k;for(k=0;k<m.sp[j];k++){var cc=m.st[j]+k;colW[cc]=Math.max(colW[cc],w/m.sp[j]);}});
  });
  for(c=0;c<M;c++)colW[c]=Math.max(hasTb?4:16,colW[c]);
  var total=colW.reduce(function(a,b){return a+b;},0);
  if(total<96){var f=96/total;colW=colW.map(function(w){return w*f;});total=96;}
  var ws=wb.addWorksheet(XL_NAMES[id]||id,{views:[{showGridLines:false}]});
  colW.forEach(function(w,i){ws.getColumn(i+1).width=Math.round(w*10)/10;});
  var r=1,titleRows=null;
  blocks.forEach(function(b){
    if(b.t==="title")r=_xlWriteTitle(ws,b,r,M,colW);
    else if(b.t==="table"){
      var r0=r;r=_xlWriteTable(ws,b,r,M,colW);
      if(!titleRows&&b.head>0)titleRows=r0+":"+(r0+b.head-1);
      ws.getRow(r).height=8;r++;
    }
    else if(b.t==="text"){r=_xlWriteText(ws,b,r,M,colW);}
    else if(b.t==="image"){r=_xlWriteImage(wb,ws,b,r,M,colW);}
    else if(b.t==="stamp"){ws.getRow(r).height=10;r++;r=_xlWriteStamp(ws,b,r,M,colW);}
  });
  _xlSheetSetup(ws,total>150,titleRows);
  return ws;
}

/* ── Cover (Main Page) ──────────────────────────────────────────────────── */
function _xlCover(wb,p0){
  var ws=wb.addWorksheet(XL_NAMES.p0,{views:[{showGridLines:false}]}),M=7,i;
  var colW=[14,14,14,10,14,14,14],r=1;     /* madhla narrow column = page cha center, emblem tya var */
  colW.forEach(function(w,j){ws.getColumn(j+1).width=w;});
  function val(id){var e=document.getElementById(id);return e?String(e.value||"").trim():"";}
  /* emblem (centered, original aspect ratio) */
  var im=p0.querySelector(".cov-hd img"),src=im?(im.getAttribute("src")||""):"";
  ws.getRow(r).height=62;
  var mm=/^data:image\/(png|jpe?g|gif);base64,/i.exec(src);
  if(mm){
    var ext=mm[1].toLowerCase();ext=ext==="jpg"?"jpeg":ext;
    var iid=wb.addImage({base64:src,extension:ext});
    /* explicit EMU offsets (ExcelJS fractional col is not real EMU): center column ~70px, image 52px => ~10px left offset */
    ws.addImage(iid,{tl:{nativeCol:3,nativeColOff:95250,nativeRow:0,nativeRowOff:19050},ext:{width:52,height:63}});
  }
  r++;
  var gov=p0.querySelector(".cov-gov");
  ws.mergeCells(r,1,r,M);var g=ws.getCell(r,1);g.value=gov?gov.textContent.trim():"GOVERNMENT OF MAHARASHTRA";
  g.font={name:XL_FONT,size:15,bold:true};g.alignment={horizontal:"center",vertical:"middle"};ws.getRow(r).height=26;r++;
  ws.getRow(r).height=12;r++;
  var sw=p0.querySelector(".est-stamp-word");
  ws.mergeCells(r,2,r,6);var e=ws.getCell(r,2);e.value=sw?sw.textContent.trim():"ESTIMATE";
  e.font={name:XL_FONT,size:26,bold:true};e.alignment={horizontal:"center",vertical:"middle"};
  _xlBorderRange(ws,r,2,r,6,{top:{style:"medium"},bottom:{style:"medium"},left:{style:"medium"},right:{style:"medium"}});
  ws.getRow(r).height=46;r++;
  ws.getRow(r).height=16;r++;
  var sub=document.getElementById("pSubPrint");
  var lines=[val("pReg"),val("pCir"),val("pDiv"),(sub&&sub.textContent.trim())||val("pSub")];
  lines.forEach(function(t){
    if(!t)return;
    ws.mergeCells(r,1,r,M);var c=ws.getCell(r,1);c.value=t;
    c.font={name:XL_FONT,size:12,bold:true};c.alignment={horizontal:"center",vertical:"middle",wrapText:true};
    ws.getRow(r).height=_xlRowH(_xlLines(t,94,12),12)+4;r++;
  });
  ws.getRow(r).height=14;r++;
  var np=document.getElementById("pNamePrint"),nm=(np&&np.textContent.trim())||val("pName");
  ws.mergeCells(r,1,r,2);var l=ws.getCell(r,1);l.value="Name of Work :-";
  l.font={name:XL_FONT,size:12,bold:true};l.alignment={horizontal:"left",vertical:"top"};
  ws.mergeCells(r,3,r,M);var v=ws.getCell(r,3);v.value=nm||null;ws._xlNameCell=v;ws._xlNameVal=nm||"";
  v.font={name:XL_FONT,size:12,bold:true};v.alignment={horizontal:"left",vertical:"top",wrapText:true};
  ws.getRow(r).height=Math.max(34,_xlRowH(_xlLines(nm,66,12),12));r++;
  ws.getRow(r).height=18;r++;
  var cost=val("covCostVal"),ut=document.getElementById("covCostUnitTxt");
  ws.mergeCells(r,1,r,2);var cl=ws.getCell(r,1);cl.value="ESTIMATED COST :-";
  cl.font={name:XL_FONT,size:12,bold:true};cl.alignment={horizontal:"left",vertical:"middle"};
  ws.mergeCells(r,3,r,4);var cv=ws.getCell(r,3);
  var cn=parseFloat(String(cost).replace(/,/g,""));
  if(!isNaN(cn)&&/^[-\d.,\s]+$/.test(cost)){cv.value=cn;cv.numFmt=(window.COV_COST_UNIT==="actual")?"0":"0.00";}else cv.value=cost||null;
  cv.font={name:XL_FONT,size:14,bold:true};cv.alignment={horizontal:"center",vertical:"middle"};
  var cu=ws.getCell(r,5);cu.value=ut?ut.textContent.trim():"LAKHS";
  cu.font={name:XL_FONT,size:12,bold:true};cu.alignment={horizontal:"left",vertical:"middle"};
  ws.getRow(r).height=24;r++;
  ws._xlCost=cv;
  _xlSheetSetup(ws,false,null);
  return ws;
}

/* ── General Report (सर्वसाधारण अहवाल) sheet — text document laid out like the printed page ── */
function _xlGeneralReport(wb){
  var d=(typeof window._grCollect==="function")?window._grCollect():null;
  if(!d)return null;
  var ws=wb.addWorksheet("General Report");
  var W=[6,62,34],tot=W[0]+W[1]+W[2],r=1;
  ws.columns=[{width:W[0]},{width:W[1]},{width:W[2]}];
  function hgt(txt,w,sz,bold){var n=_xlLinesFit(txt,w,sz,bold);if(n>1)n=Math.ceil(n*1.1);return Math.max(15,_xlRowH(n,sz));}
  function full(txt,o){
    o=o||{};var sz=o.sz||11;
    ws.mergeCells(r,1,r,3);var c=ws.getCell(r,1);c.value=txt||null;
    c.font={name:XL_FONT,size:sz,bold:!!o.bold};
    c.alignment={horizontal:o.h||"left",vertical:"top",wrapText:true};
    ws.getRow(r).height=txt?hgt(txt,tot,sz,!!o.bold):(o.blank||10);
    r++;
  }
  full("\u0915\u093e\u092e\u093e\u091a\u0947 \u0928\u093e\u0902\u0935 :- "+(d.work||""),{bold:true});
  full("",{blank:8});
  full(d.title||"",{bold:true,h:"center",sz:14});
  full("",{blank:8});
  if(d.intro)full(d.intro);
  full("",{blank:8});
  if(d.head)full(d.head);
  d.items.forEach(function(t,i){
    var a=ws.getCell(r,1);a.value=(i+1)+")";a.font={name:XL_FONT,size:11};a.alignment={horizontal:"right",vertical:"top"};
    ws.mergeCells(r,2,r,3);var b=ws.getCell(r,2);b.value=t;b.font={name:XL_FONT,size:11};b.alignment={horizontal:"left",vertical:"top",wrapText:true};
    ws.getRow(r).height=hgt(t,W[1]+W[2],11,false);r++;
  });
  full("",{blank:8});
  if(d.note)full(d.note);
  /* signature blocks: block 1 under columns A:B, block 2 under column C */
  full("",{blank:34});
  var lines=[["role"],["dept"],["loc"]];
  lines.forEach(function(k){
    var key=k[0];
    ws.mergeCells(r,1,r,2);var s1=ws.getCell(r,1);s1.value=d.signs[0][key]||null;
    s1.font={name:XL_FONT,size:11,bold:key==="role"};s1.alignment={horizontal:"center",vertical:"top",wrapText:true};
    if(d.twoSign){var s2=ws.getCell(r,3);s2.value=d.signs[1][key]||null;
      s2.font={name:XL_FONT,size:11,bold:key==="role"};s2.alignment={horizontal:"center",vertical:"top",wrapText:true};}
    ws.getRow(r).height=Math.max(hgt(d.signs[0][key]||"",W[0]+W[1],11,key==="role"),d.twoSign?hgt(d.signs[1][key]||"",W[2],11,key==="role"):15);
    r++;
  });
  _xlSheetSetup(ws,false,null);
  return ws;
}

/* ══════════════════════════════════════════════════════════════════════════
   EXPORT EXCEL → "Standard" layout  (same layout as Print All "Standard")
   • Print All / Export Excel chya picker madhe Standard nivadla (window.ATP_PDF_PRINT_ALL !== false) tar
     pratyek sheet cha Standard page (atp_main.js: atpPdfPrintPage) ghetla jato, to off-screen render hoto ani
     tyachya computed style varun (font, size, bold, alignment, borders, grey header fill, merged cells,
     row height) Excel sheet banto. Signature block pan Standard sarkhach (blank space + Designation, + Location).
   • Classic nivadla tar kahi badalat nahi — juna code (_xlPanelSheet / _xlCover / linked formulas) ch chalto.
   • Standard sheet nasalela sheets (CF Table, Steel Calc ...) Print All sarkhech Classic panel varun banatat.
   ══════════════════════════════════════════════════════════════════════════ */
function _xsOn(){return window.ATP_PDF_PRINT_ALL!==false&&typeof atpPdfPrintPage==="function";}
/* Standard Excel: ya sheets chya text rows chi height Excel swatah AutoFit karto (Ctrl+A > Alt,H,O,A sarkhe) - app ne height fix keli nahi.
   Merged (colspan/rowspan) text cells + spacer/divider rows chi height explicit thevli jate (Excel merged cells autofit karat nahi).
   Default OFF (Excel load var AutoFit karat nahi); test sathi window.XS_AUTOFIT_ROWS=true */
var XS_AUTOFIT={p3:1,p5:1,p4:1,p1:1,p6:1,p7:1,p11:1};   /* Abstract, Measurements, Rate Analysis, Lead, Consumption, Royalty, Testing */

function _xsFont(cs){
  var f=String(cs.fontFamily||"").split(",")[0].replace(/["']/g,"").trim().toLowerCase();
  if(/narrow/.test(f))return"Arial Narrow";
  if(/book antiqua|palatino/.test(f))return"Book Antiqua";
  if(/times|liberation serif|georgia|cambria/.test(f))return"Times New Roman";
  if(/verdana/.test(f))return"Verdana";
  if(/tahoma|segoe/.test(f))return"Tahoma";
  return XL_FONT;
}
function _xsFontK(name){   /* rough width factor vs Arial (row-height estimate) */
  return name==="Verdana"?1.15:(name==="Tahoma"?1.0:(name==="Arial Narrow"?0.84:(name==="Times New Roman"?0.95:1)));
}
function _xsPt(cs){var p=(parseFloat(cs.fontSize)||12)*0.75;return Math.max(5,Math.min(20,Math.round(p*2)/2));}

/* CSS border → ExcelJS border (4 sides) */
function _xsBorders(cs){
  function one(sd){
    var st=cs["border"+sd+"Style"],w=parseFloat(cs["border"+sd+"Width"])||0;
    if(!st||st==="none"||st==="hidden"||w<=0)return null;
    var col=_xlColor(cs["border"+sd+"Color"])||"FF000000";
    var style=st==="dashed"?"dashed":(st==="dotted"?"dotted":(st==="double"?"double":(w>=2.4?"medium":"thin")));
    return{style:style,color:{argb:col}};
  }
  return{top:one("Top"),left:one("Left"),bottom:one("Bottom"),right:one("Right")};
}
function _xsHasBorder(b){return!!(b.top||b.left||b.bottom||b.right);}

/* cell madhe fakt ek child div (border/background aslela, jasa Name-of-Work box) asel tar style tya child varun ghyaycha */
function _xsEff(td){
  var kids=td.children;
  if(kids.length!==1)return td;
  var own="";[].forEach.call(td.childNodes,function(n){if(n.nodeType===3)own+=n.nodeValue;});
  if(own.replace(/[\s\u00a0]+/g,"")!=="")return td;
  var k=kids[0],ks=null;
  try{ks=window.getComputedStyle(k);}catch(e){return td;}
  if(!/^(block|flex)$/.test(ks.display))return td;
  if(_xsHasBorder(_xsBorders(ks))||_xlColor(ks.backgroundColor)&&_xlColor(ks.backgroundColor)!=="FFFFFFFF")return k;
  return td;
}

/* element madhla print text → runs (bold / italic / underline). <br> + block elements = new line.
   display:flex (jase "X  2.50") = ek line, tukde space ne jodlele. */
function _xsRuns(root){
  var ch=[];
  function deco(el){
    var n=el;
    while(n&&n.nodeType===1){
      var c=window.getComputedStyle(n);
      if(/underline/.test(c.textDecorationLine||c.textDecoration||""))return true;
      if(n===root)break;n=n.parentNode;
    }
    return false;
  }
  function addStr(s,el,cs){
    if(!s)return;
    if(cs.textTransform==="uppercase")s=s.toUpperCase();
    var fw=cs.fontWeight,b=(fw==="bold"||parseInt(fw,10)>=600),i=cs.fontStyle==="italic",u=deco(el),k;
    for(k=0;k<s.length;k++)ch.push({c:s.charAt(k),b:b,i:i,u:u});
  }
  function nl(){ch.push({c:"\n"});}
  function walk(n,inFlex){
    if(n.nodeType===3){
      var p=n.parentNode;if(!p||p.nodeType!==1)return;
      addStr(n.nodeValue.replace(/[ \t\r\n\u00a0]+/g," "),p,window.getComputedStyle(p));
      return;
    }
    if(n.nodeType!==1)return;
    var tg=n.tagName;
    if(tg==="SCRIPT"||tg==="STYLE"||tg==="BUTTON")return;
    if(n!==root&&_xlHidden(n,root))return;
    if(tg==="BR"){nl();return;}
    var cs=window.getComputedStyle(n);
    if(tg==="INPUT"||tg==="SELECT"||tg==="TEXTAREA"){
      var v=(tg==="SELECT")?(n.options[n.selectedIndex]?n.options[n.selectedIndex].text:n.value):n.value;
      addStr(String(v==null?"":v),n,cs);return;
    }
    var disp=cs.display,isRoot=(n===root);
    var flex=/flex/.test(disp);
    var blk=!isRoot&&!inFlex&&/^(block|flex|list-item|table|-webkit-box)/.test(disp);
    if(inFlex&&ch.length&&ch[ch.length-1].c!==" "&&ch[ch.length-1].c!=="\n")ch.push({c:" "});
    if(blk)nl();
    var kids=n.childNodes,j;
    for(j=0;j<kids.length;j++)walk(kids[j],flex);
    if(blk)nl();
  }
  walk(root,false);
  /* whitespace normalise: ek space, ek newline, leading/trailing nako */
  var out=[],k2;
  for(k2=0;k2<ch.length;k2++){
    var x=ch[k2],last=out.length?out[out.length-1]:null;
    if(x.c==="\n"){
      while(out.length&&out[out.length-1].c===" ")out.pop();
      if(!out.length||out[out.length-1].c==="\n")continue;
      out.push(x);
    }else if(x.c===" "){
      if(!last||last.c===" "||last.c==="\n")continue;
      out.push(x);
    }else out.push(x);
  }
  while(out.length&&(out[out.length-1].c===" "||out[out.length-1].c==="\n"))out.pop();
  var merged=[],text="",pend="";
  out.forEach(function(x){
    text+=x.c;
    if(x.c==="\n"||x.c===" "){pend+=x.c;return;}   /* space / newline agli run chya survatila (run chya shevti nahi) */
    var l=merged[merged.length-1];
    if(l&&l.b===x.b&&l.i===x.i&&l.u===x.u)l.t+=pend+x.c;
    else merged.push({t:pend+x.c,b:x.b,i:x.i,u:x.u});
    pend="";
  });
  return{text:text,runs:merged};
}

/* ek cell / text block cha sagla data (value + style) */
function _xsCell(el){
  var eff=_xsEff(el),cs=window.getComputedStyle(eff),tcs=(eff===el)?cs:window.getComputedStyle(el);
  var rr=_xsRuns(el),font=_xsFont(cs),sz=_xsPt(cs);
  var bg=_xlColor(cs.backgroundColor);if(!bg||bg==="FFFFFFFF")bg=(eff===el)?null:_xlColor(tcs.backgroundColor);
  if(bg==="FFFFFFFF")bg=null;
  var al=cs.textAlign,h=(al==="right"||al==="end")?"right":(al==="center"?"center":"left");
  var va=tcs.verticalAlign,v=(va==="top")?"top":(va==="bottom"?"bottom":"middle");
  var bd=_xsBorders(cs);
  if(eff!==el){var b2=_xsBorders(tcs);["top","left","bottom","right"].forEach(function(s){if(!bd[s])bd[s]=b2[s];});}
  var fw=cs.fontWeight,bold=(fw==="bold"||parseInt(fw,10)>=600);
  var single=rr.runs.length<=1,r0=rr.runs[0]||null;
  var d={txt:rr.text,runs:rr.runs,font:font,fk:_xsFontK(font),sz:sz,color:_xlColor(cs.color)||"FF000000",bg:bg,h:h,v:v,bd:bd,
    wrap:(cs.whiteSpace!=="nowrap"||rr.text.indexOf("\n")>-1),bold:single&&r0?r0.b:bold,italic:single&&r0?r0.i:(cs.fontStyle==="italic"),under:single&&r0?r0.u:false,
    pad:((parseFloat(cs.paddingTop)||0)+(parseFloat(cs.paddingBottom)||0))*0.75,num:null,dec:0,boldAny:bold||rr.runs.some(function(x){return x.b;}),
    boldFr:(function(){var t=0,b=0;rr.runs.forEach(function(x){t+=x.t.length;if(x.b)b+=x.t.length;});return t?b/t:(bold?1:0);})()};
  if(single&&h==="right"&&/^[-+]?\d[\d,]*(\.\d+)?$/.test(rr.text)){
    var nv=parseFloat(rr.text.replace(/,/g,""));
    if(!isNaN(nv)){d.num=nv;d.dec=rr.text.indexOf(".")>-1?rr.text.split(".")[1].length:0;}
  }
  return d;
}
function _xsSetCell(cell,d){
  if(d.num!==null){
    cell.value=d.num;
    cell.numFmt=d.dec>0?"0."+new Array(d.dec+1).join("0"):"0";
  }else if(d.runs.length>1){
    cell.value={richText:d.runs.map(function(r){
      return{text:r.t,font:{name:d.font,size:d.sz,color:{argb:d.color},bold:!!r.b,italic:!!r.i,underline:!!r.u}};
    })};
  }else cell.value=d.txt===""?null:d.txt;
  cell.font={name:d.font,size:d.sz,bold:!!d.bold,italic:!!d.italic,underline:!!d.under,color:{argb:d.color}};
  cell.alignment={horizontal:d.h,vertical:d.v,wrapText:d.wrap};
  if(d.bg)cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:d.bg}};
}
/* merged range chya border: fakt bahercya kadyanna, pratyek cell la swatantra style (merged cells ek style object share kartat) */
function _xsBorderRange(ws,r1,c1,r2,c2,b,bg){
  var r,c;
  for(r=r1;r<=r2;r++)for(c=c1;c<=c2;c++){
    var cell=ws.getCell(r,c),bd={};
    if(r===r1&&b.top)bd.top=b.top;
    if(r===r2&&b.bottom)bd.bottom=b.bottom;
    if(c===c1&&b.left)bd.left=b.left;
    if(c===c2&&b.right)bd.right=b.right;
    var st=Object.assign({},cell.style);
    if(_xsHasBorder(bd))st.border=bd;
    if(bg&&!(r===r1&&c===c1))st.fill={type:"pattern",pattern:"solid",fgColor:{argb:bg}};
    cell.style=st;
  }
}

/* <table> (+ nested "keep together" tables) → flat row list; thead fakt pahilya table cha */
function _xsRows(tables,root){
  var out=[];
  tables.forEach(function(tb,ti){
    function handleTr(tr,inHead){
      if(_xlHidden(tr,root))return;
      var cl=tr.classList;
      if(cl.contains("stp"))return;      /* signature row (signature vegla lihito) */
      if(cl.contains("kp")){
        [].forEach.call(tr.querySelectorAll("table"),function(inner){addRows(inner,false);});
        return;
      }
      out.push({tr:tr,head:!!inHead});
    }
    function addRows(t,skipHead){
      [].forEach.call(t.children,function(sec){
        var tg=sec.tagName;
        if(tg==="TR"){handleTr(sec,false);return;}
        if(tg!=="THEAD"&&tg!=="TBODY"&&tg!=="TFOOT")return;
        if(tg==="THEAD"&&skipHead)return;
        [].forEach.call(sec.children,function(tr){if(tr.tagName==="TR")handleTr(tr,tg==="THEAD");});
      });
    }
    addRows(tb,ti>0);
  });
  return out;
}

function _xsWriteTable(ws,tables,r0,M,colW,root,bandIns){
  var list=_xsRows(tables,root);
  if(!list.length)return{r:r0,head:null};
  var occ=[],rows=[];
  list.forEach(function(it,ri){
    occ[ri]=occ[ri]||[];
    var ci=0,cells=[];
    [].forEach.call(it.tr.cells,function(td){
      if(_xlHidden(td,it.tr))return;
      while(occ[ri][ci])ci++;
      var cs=Math.max(1,td.colSpan||1),rs=Math.min(Math.max(1,td.rowSpan||1),list.length-ri),a,b;
      for(a=0;a<rs;a++){occ[ri+a]=occ[ri+a]||[];for(b=0;b<cs;b++)occ[ri+a][ci+b]=true;}
      cells.push({td:td,c:ci,cs:cs,rs:rs});
      ci+=cs;
    });
    rows.push({tr:it.tr,head:it.head,cells:cells});
  });
  /* Abstract / Measurements: the grey "SSR OF 2022-23 ITEM NO. x & PAGE NO.y" line (span.ssrh) sits inside the description cell in the print page.
     A part of one Excel cell cannot be shaded, so it gets its own row(s) directly under the item's description (grey band, like the PDF). */
  var bandAfter={},bandInfo={},extraTot=0;
  if(bandIns){
    rows.forEach(function(rw,ri){
      rw.cells.forEach(function(p){
        var ssrEl=p.td.querySelector&&p.td.querySelector(".ssr");
        if(!ssrEl||bandInfo[ri])return;
        var hEl=ssrEl.querySelector(".ssrh");
        var head=hEl?(hEl.textContent||"").replace(/[\s\u00a0]+/g," ").trim():"";
        var cl=ssrEl.cloneNode(true);[].forEach.call(cl.querySelectorAll(".ssrh"),function(e){if(e.parentNode)e.parentNode.removeChild(e);});
        var rest=(cl.textContent||"").replace(/[\s\u00a0]+/g," ").trim();
        if(!head&&!rest)return;
        var lines=[];if(head)lines.push({t:head,grey:true});if(rest)lines.push({t:rest,grey:false});
        var endRi=Math.min(rows.length-1,ri+Math.max(1,p.rs)-1);
        bandInfo[ri]={p:p,lines:lines,ssrEl:ssrEl,endRi:endRi};
        bandAfter[endRi]=(bandAfter[endRi]||0)+lines.length;
      });
    });
  }
  var xrOf=[],off=0;
  rows.forEach(function(rw,ri){xrOf[ri]=r0+ri+off;rw.xr=xrOf[ri];off+=(bandAfter[ri]||0);});
  extraTot=off;
  var rowH={},needs=[];
  rows.forEach(function(rw,ri){
    var xr=xrOf[ri],bH=Math.max(3,(rw.tr.offsetHeight||0)*0.75),maxH=bH,tMax=0,hadT=false,mergedT=false;
    rw.cells.forEach(function(p){
      var c1=p.c+1,c2=Math.min(M,p.c+p.cs),r1=xr,r2=xrOf[Math.min(rows.length-1,ri+p.rs-1)];
      if(c1>M)return;
      var bi=bandInfo[ri],hid=null;
      if(bi&&bi.p===p){hid=bi.ssrEl;hid._xsDisp=hid.style.display;hid.style.display="none";}   /* description without the SSR line */
      var d;try{d=_xsCell(p.td);}finally{if(hid)hid.style.display=hid._xsDisp||"";}
      var cell=ws.getCell(r1,c1);
      _xsSetCell(cell,d);
      if(c2>c1||r2>r1)ws.mergeCells(r1,c1,r2,c2);
      _xsBorderRange(ws,r1,c1,r2,c2,d.bd,d.bg);
      if(bi&&bi.p===p)bi.d=d;
      if(d.txt!==""){
        var w=_xlSumW(colW,c1,c2),lines=(d.num!==null||!d.wrap)?1:_xlLinesFit(d.txt,w,d.sz*d.fk,d.boldFr);   /* wrap nasalela cell (jase "Per Cu.M." unit) 1 line - tya mule row double uncha hot hoti */
        var need=lines*d.sz*1.3+Math.min(d.pad,3)+2;   /* HTML td padding (~16pt) Excel madhe nasto -> row jast uncha hot hota */
        if(c2>c1)mergedT=true;   /* merged text cell: Excel AutoFit karat nahi */
        if(p.rs===1){maxH=Math.max(maxH,need);tMax=Math.max(tMax,need);hadT=true;}else needs.push({r1:r1,r2:r2,h:need});
      }
    });
    /* text asel tar row height = text la lagnari (Excel column width varun mojleli) height; browser (off-screen) chi row height vaparli ki text nantar jaga shillak rahte */
    if(hadT&&!rw.cells.some(function(p9){return p9.rs>1;}))maxH=Math.max(tMax,12);
    maxH=Math.min(409,maxH);
    var autoRow=!!ws._xsAuto&&hadT&&!mergedT&&!rw.cells.some(function(p9){return p9.rs>1;});
    rowH[xr]=maxH;   /* estimate (rowspan calc sathi) - autoRow la Excel chi AutoFit height yete */
    if(!autoRow)ws.getRow(xr).height=maxH;
  });
  /* the grey SSR band rows (written after the item's last row) */
  Object.keys(bandInfo).forEach(function(k){
    var bi=bandInfo[k],p=bi.p,d=bi.d;if(!d)return;
    var c1=p.c+1,c2=Math.min(M,p.c+p.cs),base=xrOf[bi.endRi],w=_xlSumW(colW,c1,c2);
    bi.lines.forEach(function(ln,j){
      var rr=base+1+j,cell=ws.getCell(rr,c1);
      cell.value=ln.t;
      cell.font={name:d.font,size:d.sz,bold:true,color:{argb:"FF000000"}};
      cell.alignment={horizontal:"left",vertical:"middle",wrapText:true};
      if(c2>c1)ws.mergeCells(rr,c1,rr,c2);
      if(ln.grey){var cc;for(cc=c1;cc<=c2;cc++)ws.getCell(rr,cc).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFD9D9D9"}};}
      var nl=_xlLinesFit(ln.t,w,d.sz*d.fk,true);
      var h=Math.min(409,Math.max(13,nl*d.sz*1.3+3));
      ws.getRow(rr).height=h;rowH[rr]=h;
    });
  });
  needs.forEach(function(n){
    var sum=0,r;for(r=n.r1;r<=n.r2;r++)sum+=(rowH[r]||15);
    if(sum<n.h){var add=(n.h-sum)/(n.r2-n.r1+1);for(r=n.r1;r<=n.r2;r++){rowH[r]=Math.min(409,(rowH[r]||15)+add);ws.getRow(r).height=rowH[r];}}
  });
  /* page-to-page repeat: table cha header (title + column heads) — Name-of-Work (tr.wk) asel tar repeat nahi */
  var h1=-1,h2=-1,badHead=false;
  rows.forEach(function(rw,ri){
    if(!rw.head)return;
    if(rw.tr.classList.contains("wk"))badHead=true;
    if(h1<0)h1=ri;h2=ri;
  });
  return{r:r0+rows.length+extraTot,r0:r0,rows:rows,head:(h1>=0&&!badHead)?[xrOf[h1],xrOf[h2]]:null};
}

/* table baherche text blocks (Name of Work box, title, notes, certificate) */
function _xsWriteText(ws,el,r,M,colW,hostW){
  var d=_xsCell(el);
  if(d.txt==="")return r;
  var cs=window.getComputedStyle(el),mt=(parseFloat(cs.marginTop)||0)*0.75,mb=(parseFloat(cs.marginBottom)||0)*0.75;
  if(mt>2){ws.getRow(r).height=mt;r++;}
  var tot=colW.reduce(function(a,b){return a+b;},0),frac=hostW>0?Math.min(1,(el.offsetWidth||hostW)/hostW):1;
  var c2=1,acc=colW[0]||8;
  while(c2<M&&acc<tot*frac*0.98){acc+=colW[c2]||8;c2++;}
  _xsSetCell(ws.getCell(r,1),d);
  if(c2>1)ws.mergeCells(r,1,r,c2);
  _xsBorderRange(ws,r,1,r,c2,d.bd,d.bg);
  var lines=_xlLinesFit(d.txt,_xlSumW(colW,1,c2),d.sz*d.fk,d.boldAny);
  ws.getRow(r).height=Math.min(409,Math.max(12,lines*d.sz*1.3+d.pad+2));
  r++;
  if(mb>2){ws.getRow(r).height=mb;r++;}
  return r;
}

/* PNG header varun image size (aspect ratio sathi) */
function _xsImgSize(src){
  try{
    var b64=String(src).split(",")[1]||"",bin=atob(b64.slice(0,48));
    if(bin.charCodeAt(1)===0x50){
      var w=(bin.charCodeAt(16)<<24)|(bin.charCodeAt(17)<<16)|(bin.charCodeAt(18)<<8)|bin.charCodeAt(19);
      var h=(bin.charCodeAt(20)<<24)|(bin.charCodeAt(21)<<16)|(bin.charCodeAt(22)<<8)|bin.charCodeAt(23);
      if(w>0&&h>0)return{w:w,h:h};
    }
  }catch(e){}
  return{w:0,h:0};
}

/* Standard signature block (Print All cha) → _xlWriteStamp sathi groups */
function _xsStamp(el){
  var boxes=el.querySelectorAll(".sgb");
  if(boxes.length){
    var k=boxes.length,groups=[];
    [].forEach.call(boxes,function(bx,i){
      var lines=[{sign:true}];
      [].forEach.call(bx.children,function(ln){
        if(ln.classList.contains("sgsp"))return;
        var t=(ln.textContent||"").replace(/\s+/g," ").trim();
        if(t)lines.push({txt:t,bold:true});
      });
      groups.push({h:k===1?"left":(i===0?"left":(i===k-1?"right":"center")),lines:lines});
    });
    return{t:"stamp",groups:groups};
  }
  if(el.classList.contains("sg")){
    var gs=[],kids=[].filter.call(el.children,function(x){return x.tagName==="DIV";});
    kids.forEach(function(x,i){
      var parts=String(x.innerHTML).split(/<br\s*\/?>/i).map(function(s){return s.replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim();}).filter(Boolean);
      var lines=[{sign:true}];parts.forEach(function(t){lines.push({txt:t,bold:true});});
      gs.push({h:i===0?"left":(i===kids.length-1?"right":"center"),lines:lines});
    });
    return gs.length?{t:"stamp",groups:gs}:null;
  }
  var w=el.firstElementChild;
  return w?_xlStamp(w):null;   /* app cha swatacha stamp (Settings madhla) */
}

function _xsBuildSheet(wb,pg,id){
  var HOSTW=188*96/25.4;   /* print box = 188 mm (host div) */
  /* signature: adhi vachto, mag page madhun kadhato (tyache rows table madhe rikame rahtat → skip) */
  var sts=pg.querySelectorAll(".stampw,.sg"),stamp=null;
  if(sts.length){try{stamp=_xsStamp(sts[sts.length-1]);}catch(e){console.error("Excel Standard stamp",e);}}
  [].forEach.call(sts,function(e){if(e.parentNode)e.parentNode.removeChild(e);});

  /* kiti columns + width (colgroup chya % varun) */
  var M=4,colW=null,tbl=pg.querySelector("table.pdfp");
  var refW=tbl?(tbl.offsetWidth||HOSTW):HOSTW,TOTW=Math.max(40,100*refW/HOSTW);   /* 188 mm = 100 chars (Recap 160 mm = 85, Consumption 266 mm = 141) */
  if(tbl){
    var cg=tbl.querySelector("colgroup"),cols=cg?cg.querySelectorAll("col"):[];
    if(cols.length){
      M=cols.length;
      var pc=[].map.call(cols,function(c){return parseFloat(c.style.width)||0;}),ps=pc.reduce(function(a,b){return a+b;},0);
      if(ps>0)colW=pc.map(function(p){return Math.max(5.5,TOTW*p/ps);});
    }else{
      [].forEach.call(tbl.querySelectorAll("tr"),function(tr){var s=0;[].forEach.call(tr.cells,function(c){s+=Math.max(1,c.colSpan||1);});M=Math.max(M,s);});
    }
  }
  M=Math.max(1,Math.min(60,M));
  if(!colW||colW.length!==M){colW=[];for(var q=0;q<M;q++)colW.push(TOTW/M);}

  var blocks=[];
  function walk(el){
    [].forEach.call(el.children,function(ch){
      var tg=ch.tagName;
      if(tg==="STYLE"||tg==="SCRIPT")return;
      if(_xlHidden(ch,pg))return;
      if(tg==="TABLE"){
        if(!ch.classList.contains("pdfp"))return;
        var last=blocks[blocks.length-1];
        if(id==="p6"&&last&&last.t==="std")last.tables.push(ch);   /* Consumption: rotated pages → ek table */
        else blocks.push({t:"std",tables:[ch]});
        return;
      }
      if(tg==="IMG"){blocks.push({t:"img",el:ch});return;}
      if(ch.querySelector("table,img,div"))walk(ch);
      else blocks.push({t:"text",el:ch});
    });
  }
  walk(pg);
  if(!blocks.length)return null;

  var ws=wb.addWorksheet(XL_NAMES[id]||id,{views:[{showGridLines:false}]});
  colW.forEach(function(w,i){ws.getColumn(i+1).width=Math.round(w*10)/10;});
  ws._xsAuto=!!XS_AUTOFIT[id]&&window.XS_AUTOFIT_ROWS===true;   /* default OFF: Excel file ughadtana AutoFit karat nahi (rows 15pt var atkatat) */
  var r=1,titleRows=null;
  blocks.forEach(function(b){
    if(b.t==="std"){
      var o=_xsWriteTable(ws,b.tables,r,M,colW,pg,(id==="p3"||id==="p5"));
      r=o.r;if(!titleRows&&o.head)titleRows=o.head[0]+":"+o.head[1];
      if(o.rows){   /* Standard row meta -> live formulas (_xfApply) */
        ws._xsMeta=ws._xsMeta||[];
        o.rows.forEach(function(rw,ri){
          ws._xsMeta.push({cls:String(rw.tr.className||""),xr:(rw.xr!=null?rw.xr:o.r0+ri),cells:rw.cells.map(function(p2){
            var td2=p2.td,tx=(td2.textContent||"").replace(/[\s\u00a0]+/g," ").trim();
            var fe=td2.querySelector(".fl"),nt=tx,ft="";
            if(fe){ft=(fe.textContent||"").replace(/[\s\u00a0]+/g," ").trim();var cn2=td2.cloneNode(true);[].forEach.call(cn2.querySelectorAll(".fl"),function(e){e.parentNode.removeChild(e);});nt=(cn2.textContent||"").replace(/[\s\u00a0]+/g," ").trim();}
            return{c:p2.c,cs:p2.cs,rs:p2.rs,txt:tx,fl:!!fe,nt:nt,ft:ft};
          })});
        });
      }
    }else if(b.t==="text"){
      r=_xsWriteText(ws,b.el,r,M,colW,refW);
    }else if(b.t==="img"){
      var src=b.el.getAttribute("src")||"";
      if(/^data:image\//.test(src)){
        var sz=_xsImgSize(src);
        r=_xlWriteImage(wb,ws,{src:src,w:sz.w||b.el.naturalWidth||0,h:sz.h||b.el.naturalHeight||0},r,M,colW);
      }
    }
  });
  /* Abstract: item rows madhil Sr.No / Description / Qty / Unit / Rate / Amount sagle vertically TOP (values khali na jata varti) */
  if(id==="p3"&&ws._xsMeta){
    ws._xsMeta.forEach(function(m){
      if((" "+m.cls+" ").indexOf(" it ")<0)return;
      m.cells.forEach(function(p2){
        var c;for(c=p2.c;c<p2.c+p2.cs&&c<M;c++){
          var cell=ws.getCell(m.xr,c+1),al=Object.assign({},cell.alignment||{});al.vertical="top";cell.alignment=al;
        }
      });
    });
  }
  if(stamp){ws.getRow(r).height=12;r++;r=_xlWriteStamp(ws,stamp,r,M,colW);}
  _xlSheetSetup(ws,TOTW>115,titleRows);
  return ws;
}

/* ── Main Page (Cover) — covPage() sarkhach: double border, Times New Roman, ESTIMATE box ── */
function _xsCover(wb){
  var p0=document.getElementById("p0");if(!p0)return null;
  function val(i){var e=document.getElementById(i);return e?String(e.value||"").trim():"";}
  var reg=val("pReg").replace(/^p\.?\s*w\.?\s+region\s*,?\s*/i,"Public Works Region, "),
      cir=val("pCir").replace(/^p\.?\s*w\.?\s+circle\s*,?\s*/i,"Public Works Circle, "),
      dv=val("pDiv").replace(/^p\.?\s*w\.?\s+division\s*,?\s*/i,"P.W.Division, ");
  var np=document.getElementById("pNamePrint"),nm=(np&&np.textContent.trim())||val("pName");
  var cost=val("covCostVal"),ut=document.getElementById("covCostUnitTxt");ut=ut?ut.textContent.trim():"LAKHS";
  var adopt="ADOPTED SSR OF 2022-23",nd=p0.querySelectorAll("*"),k;
  for(k=0;k<nd.length;k++){if(!nd[k].children.length&&/ADOPTED\s+SSR/i.test(nd[k].textContent||"")){adopt=nd[k].textContent.trim();break;}}
  var ws=wb.addWorksheet(XL_NAMES.p0,{views:[{showGridLines:false}]}),M=7,TM="Times New Roman";
  var colW=[14,14,14,10,14,14,14],r=1;
  colW.forEach(function(w,j){ws.getColumn(j+1).width=w;});
  function gap(h){ws.getRow(r).height=h;r++;}
  function line(c1,c2,txt,o){
    o=o||{};
    if(c2>c1)ws.mergeCells(r,c1,r,c2);
    var c=ws.getCell(r,c1);c.value=txt||null;
    c.font={name:o.font||TM,size:o.sz,bold:o.bold!==false,underline:!!o.under};
    c.alignment={horizontal:o.h||"center",vertical:"middle",wrapText:true};
    ws.getRow(r).height=o.ht||Math.max(20,Math.round(o.sz*1.5));
    r++;
    return c;
  }
  gap(10);
  /* emblem */
  var im=p0.querySelector(".cov-hd img"),src=im?(im.getAttribute("src")||""):"";
  var mm=/^data:image\/(png|jpe?g|gif);base64,/i.exec(src);
  ws.getRow(r).height=78;
  if(mm){
    var ext=mm[1].toLowerCase();ext=ext==="jpg"?"jpeg":ext;
    var iid=wb.addImage({base64:src,extension:ext});
    ws.addImage(iid,{tl:{nativeCol:2,nativeColOff:838200,nativeRow:r-1,nativeRowOff:38100},ext:{width:83,height:100}});
  }
  r++;
  gap(8);
  line(1,M,"GOVERNMENT OF MAHARASHTRA",{sz:21,ht:34});
  gap(22);
  line(1,M,reg.toUpperCase(),{sz:16.5,bold:false,ht:26});gap(10);
  line(1,M,cir.toUpperCase(),{sz:16.5,bold:false,ht:26});gap(10);
  line(1,M,dv.toUpperCase(),{sz:16.5,bold:false,under:true,ht:26});
  gap(22);
  /* ESTIMATE box */
  var er=r;line(2,6,"ESTIMATE",{sz:50,ht:72});
  var thin={style:"thin",color:{argb:"FF000000"}};
  _xsBorderRange(ws,er,2,er,6,{top:thin,bottom:thin,left:thin,right:thin},null);
  gap(24);
  line(1,M,"* NAME OF WORK *",{sz:22,ht:34});
  gap(6);
  var nmLines=_xlLinesFit(nm,_xlSumW(colW,2,6),18.5*1.05,true);
  line(1,M,nm,{sz:18.5,ht:Math.max(30,Math.round(nmLines*18.5*1.4+6))}).alignment={horizontal:"center",vertical:"top",wrapText:true};
  gap(40);
  /* ESTIMATE COST :-  <cost>  <unit> */
  ws.getRow(r).height=30;
  ws.mergeCells(r,2,r,3);
  var cl=ws.getCell(r,2);cl.value="ESTIMATE COST :-";cl.font={name:TM,size:15,bold:true,underline:true};cl.alignment={horizontal:"left",vertical:"middle"};
  ws.mergeCells(r,4,r,5);
  var cv=ws.getCell(r,4),cn=parseFloat(String(cost).replace(/,/g,""));
  if(!isNaN(cn)&&/^[-\d.,\s]+$/.test(cost)){cv.value=cn;cv.numFmt=(window.COV_COST_UNIT==="actual")?"0":"0.00";}else cv.value=cost||null;
  cv.font={name:TM,size:15,bold:true};cv.alignment={horizontal:"center",vertical:"middle"};
  ws._xsCost=(!isNaN(cn)&&/^[-\d.,\s]+$/.test(cost))?cv:null;
  var cu=ws.getCell(r,6);cu.value=ut;cu.font={name:TM,size:15,bold:true};cu.alignment={horizontal:"left",vertical:"middle"};
  r++;
  gap(60);
  line(1,M,adopt,{sz:14,font:"Arial Narrow",ht:24});
  gap(12);
  var last=r-1,dbl={style:"double",color:{argb:"FF000000"}},c;
  for(var rr=1;rr<=last;rr++)for(c=1;c<=M;c++){
    var bd={};
    if(rr===1)bd.top=dbl;if(rr===last)bd.bottom=dbl;if(c===1)bd.left=dbl;if(c===M)bd.right=dbl;
    if(!_xsHasBorder(bd))continue;
    var cell=ws.getCell(rr,c),st=Object.assign({},cell.style),ob=st.border||{};
    st.border=Object.assign({},ob,bd);cell.style=st;
  }
  _xlSheetSetup(ws,false,null);
  return ws;
}

/* entry: ek Standard sheet. null = Standard page nahi (Classic varun banto, Print All sarkha) */
function _xsSheet(wb,id){
  if(id==="p0")return _xsCover(wb);
  var pg=null;
  try{pg=atpPdfPrintPage(id);}catch(e){console.error("Excel Standard page "+id,e);}
  if(!pg)return null;
  var host=document.createElement("div");
  host.style.cssText="position:absolute;left:-99999px;top:0;width:188mm;background:#fff";
  host.appendChild(pg);document.body.appendChild(host);
  var ws=null;
  try{ws=_xsBuildSheet(wb,pg,id);}
  catch(e){
    console.error("Excel Standard sheet "+id+" failed, Classic layout will be used:",e);
    try{var w0=wb.getWorksheet(XL_NAMES[id]||id);if(w0)wb.removeWorksheet(w0.id);}catch(x){}
    ws=null;
  }
  finally{if(host.parentNode)host.parentNode.removeChild(host);}
  return ws;
}

/* ══════════════════════════════════════════════════════════════════════════
   STANDARD layout → LIVE FORMULAS (Classic sarkhe linking)
   Chain:  Measurements (No x L x B x D = Qty, item TOTAL)  ->  Abstract (Qty, Amount, Total A / B / A+B)
           Rate Analysis (Qty x Net lead = Rate, TOTAL RATE)  ->  Abstract (Rate)
           Abstract totals  ->  Recapitulation (A, B, TOTAL, GST / Contingencies / % rows, GRAND TOTAL, SAY)  ->  Main Page (Estimate Cost)
   Pratyek formula adhi app chya value shi (displayed digits pramane) tapasli jate. Match nahi zala (floors, manual override,
   amt-mode rows, N2 "2 X 3" sarkhe special case) tar tya cell madhe fakt value rahte - Excel madhe kadhich chukichi value yet nahi.
   Meta (ws._xsMeta) = Standard page che rows (class + cell text), _xsBuildSheet madhe jama hote.
   ══════════════════════════════════════════════════════════════════════════ */
var XF_CNT=0;
function _xfN(t){
  t=String(t==null?"":t).replace(/[\s\u00a0]/g,"");
  if(!/^[-+]?\d[\d,]*(\.\d+)?$/.test(t))return null;
  var v=parseFloat(t.replace(/,/g,""));if(isNaN(v))return null;
  return{v:v,dec:t.indexOf(".")>-1?t.split(".")[1].length:0};
}
function _xfR(v,d){var k=Math.pow(10,d),s=v<0?-1:1;return s*Math.round(Math.abs(v)*k+1e-9)/k;}
function _xfFmt(dec,pre){
  var z=dec>0?"0."+new Array(dec+1).join("0"):"0";
  return pre?('"'+pre+' "'+z+';"'+pre+' -"'+z):z;
}
function _xfCol(p,ci){for(var i=0;i<p.cells.length;i++)if(p.cells[i].c===ci)return p.cells[i];return null;}
function _xfA(col,r){return _xkA(col)+r;}
function _xfRef(ws,col,r){return"'"+ws.name+"'!$"+_xkA(col)+"$"+r;}
function _xfPut(ws,r,c,f,v,fmt){var cell=ws.getCell(r,c);cell.value={formula:f,result:v};if(fmt)cell.numFmt=fmt;XF_CNT++;}
function _xfSetNum(ws,r,c,v,fmt){var cell=ws.getCell(r,c);cell.value=v;if(fmt)cell.numFmt=fmt;}

/* ── Measurements ── */
function _xfFk(t){t=String(t||"").toLowerCase().replace(/floor/g,"").replace(/[\s.\-]/g,"");return(t===""||t==="ground")?"g":t;}
function _xfMeas(ws){
  var out={},cur=null,rows=ws._xsMeta||[];
  rows.forEach(function(p){
    var cl=" "+p.cls+" ";
    if(cl.indexOf(" mi ")>-1){
      var c0=_xfCol(p,0),n=c0?parseInt(c0.txt,10):NaN;
      var hq=_xfCol(p,6);   /* header row chya Qty column madhe number nasel tarach SUM header pasun suru hoto (pahili line add keli tari count hote) */
      cur=isNaN(n)?null:{idx:n,q:[],sum:0,p:0,ok:true,hx:p.xr,hok:!(hq&&_xfN(hq.txt)),desc:p.cells.map(function(c8){return c8.txt;}).join(" ")};return;
    }
    if(!cur)return;
    if(cl.indexOf(" pmr ")>-1){
      var qc=_xfCol(p,6),qm=qc?/^=\s*(.+)$/.exec(qc.txt):null,qn=qm?_xfN(qm[1]):null;
      if(!qn){cur.ok=false;return;}
      var nc=_xfCol(p,2),fac=[],val=1,okf=true,cn=null;
      if(nc&&nc.txt!==""){cn=_xfN(nc.txt);if(cn){fac.push({c:nc.c+1,v:cn.v,dec:cn.dec,pre:""});val*=cn.v;}else okf=false;}
      else okf=false;   /* % / lump-sum row: value only */
      [3,4,5].forEach(function(ci){
        var cc=_xfCol(p,ci);if(!cc||cc.txt==="")return;
        var m=/^X\s*(.+)$/.exec(cc.txt),nv=m?_xfN(m[1]):null;
        if(!nv){okf=false;return;}
        fac.push({c:cc.c+1,v:nv.v,dec:nv.dec,pre:"X"});val*=nv.v;
      });
      var qcol=qc.c+1,sg=qn.v<0?-1:1,fm=_xfFmt(qn.dec,"=");
      var okQ=okf&&fac.length&&(Math.abs(_xfR(Math.abs(val),qn.dec)-Math.abs(qn.v))<1e-9
        ||(qn.dec<3&&Math.abs(_xfR(_xfR(Math.abs(val),3),qn.dec)-Math.abs(qn.v))<1e-9));   /* app: qty 3 decimals la round, mag 2 decimals dakhavto (6.4545 -> 6.455 -> 6.46) */
      if(okf&&fac.length){   /* ALWAYS link (value match nahi zali tari) */
        fac.forEach(function(f){_xfSetNum(ws,p.xr,f.c,f.v,_xfFmt(f.dec,f.pre));});
        _xfPut(ws,p.xr,qcol,(sg<0?"-":"")+fac.map(function(f){return _xfA(f.c,p.xr);}).join("*"),qn.v,fm);
        cur.p+=sg*Math.abs(val);   /* full precision, like the app (display only is rounded) */
      }else{if(okf&&fac.length)console.warn("Excel link skipped: Measurements item "+cur.idx+" row "+p.xr+" shown "+qn.v+" but calc "+val);_xfSetNum(ws,p.xr,qcol,qn.v,fm);cur.p+=qn.v;}
      var fk0="";p.cells.forEach(function(c9){if(c9.ft&&!fk0)fk0=c9.ft;});
      cur.q.push({xr:p.xr,col:qcol,v:qn.v,fk:_xfFk(fk0),lab:((_xfCol(p,1)||{}).txt)||"",lk:!!(okf&&fac.length)});cur.sum+=qn.v;return;
    }
    if(cl.indexOf(" tq ")>-1){
      var cs=p.cells,tv=cs.length?cs[cs.length-1]:null,tn=tv?_xfN(tv.txt):null;
      if(tn&&cur.ok&&cur.q.length){
        var tol=Math.max(0.02,0.01*Math.abs(tn.v));
        if(Math.abs(cur.p-tn.v)>tol){   /* Deduct rows (e.g. "(-100%)") app madhe minus astat, Excel madhe plus gelela -> sign thik karto */
          var cand=cur.q.filter(function(q){return !q.lk&&q.v>0&&/deduct|\(\s*-/i.test(q.lab);}),nb=Math.min(cand.length,12),mask,fixed=false;
          for(mask=1;mask<(1<<nb)&&!fixed;mask++){
            var sx=cur.p,b2;for(b2=0;b2<nb;b2++)if(mask&(1<<b2))sx-=2*cand[b2].v;
            if(Math.abs(sx-tn.v)<=tol){
              for(b2=0;b2<nb;b2++)if(mask&(1<<b2)){var qq2=cand[b2];ws.getCell(qq2.xr,qq2.col).value=-qq2.v;qq2.v=-qq2.v;}
              cur.p=sx;fixed=true;
            }
          }
        }
        if(Math.abs(cur.p-tn.v)>tol){console.warn("Excel link skipped: Measurements item "+cur.idx+" TOTAL "+tn.v+" but rows give "+cur.p+" (value kept as number)");cur=null;return;}
        var col=cur.q[0].col,a=cur.q[0].xr;
        /* Dynamic range: item header (kinva pahili line) pasun TOTAL chya var chya row paryant (INDEX(...,ROW()-1)).
           Measurement madhe line add / delete keli (shevati pan) tari Abstract cha Qty auto update hoto. */
        var sA=cur.hok?cur.hx:a;
        _xfPut(ws,p.xr,tv.c+1,"SUM("+_xfA(col,sA)+":INDEX("+_xkA(col)+":"+_xkA(col)+",ROW()-1))",cur.p,_xfFmt(tn.dec,""));
        out[cur.idx]={ref:_xfRef(ws,tv.c+1,p.xr),v:tn.v,p:cur.p,rows:cur.q.slice(),wsn:ws.name,desc:cur.desc};
      }else if(tn&&cur.q.length)console.warn("Excel link skipped: Measurements item "+cur.idx+" TOTAL shown "+tn.v+" but rows sum "+cur.p+(cur.ok?"":" (a row is not numeric)"));
      cur=null;
    }
  });
  return out;
}

/* ── Rate Analysis ── */
function _xfRA(ws){
  var rows=ws._xsMeta||[],out={},cur=null;
  rows.forEach(function(p){
    var cl=" "+p.cls+" ";
    if(cl.indexOf(" rxi ")>-1){var c0=_xfCol(p,0),n=c0?parseInt(c0.txt,10):NaN;cur=isNaN(n)?null:{idx:n,basic:null,adds:[],first:null,diff:null};return;}
    if(!cur)return;
    var rc=_xfCol(p,4),rn=rc?_xfN(rc.txt):null,col=rc?rc.c+1:5;
    if(cl.indexOf(" rxb ")>-1){if(rn){_xfSetNum(ws,p.xr,col,rn.v,"0.00");cur.basic={xr:p.xr,col:col,v:rn.v};}return;}
    if(cl.indexOf(" rxd ")>-1){
      if(!rn)return;
      _xfSetNum(ws,p.xr,col,rn.v,"0.00");
      if(cur.first){cur.diff={xr:p.xr,col:col,v:rn.v};return;}
      var lab=(_xfCol(p,1)||{}).txt||"";
      var addO=null;if(!/^NET\b/i.test(lab)){addO={xr:p.xr,col:col,v:rn.v};cur.adds.push(addO);}
      var qc=_xfCol(p,2),nc=_xfCol(p,3),qn=qc?_xfN(qc.txt):null,nn=nc?_xfN(nc.txt):null;
      if(qn&&nn){
        if(addO){addO.qc=qc.c+1;addO.nc=nc.c+1;addO.qv=qn.v;addO.nv=nn.v;}
        _xfSetNum(ws,p.xr,qc.c+1,qn.v,_xfFmt(qn.dec,""));_xfSetNum(ws,p.xr,nc.c+1,nn.v,_xfFmt(nn.dec,""));
        var lm=/^ADD\s+LEAD\s+CHARGES?\s+FOR\s+(.+)$/i.exec(lab),mk2=lm?_xfLeadMk(lm[1]):null;   /* Net lead = Lead Chart cha charge */
        if(mk2&&Math.abs(_xfR(XF_LEAD[mk2].v,2)-nn.v)<0.0051)_xfPut(ws,p.xr,nc.c+1,"ROUND("+XF_LEAD[mk2].ref+",2)",nn.v,_xfFmt(nn.dec,""));
        _xfPut(ws,p.xr,col,"ROUND("+_xfA(qc.c+1,p.xr)+"*"+_xfA(nc.c+1,p.xr)+",2)",rn.v,"0.00");
      }
      return;
    }
    if(cl.indexOf(" rxt ")>-1){
      if(!rn)return;
      _xfSetNum(ws,p.xr,col,rn.v,"0.00");
      if(!cur.first){
        if(cur.basic){
          var s=cur.basic.v;cur.adds.forEach(function(a){s+=a.v;});
          var okT=Math.abs(_xfR(s,2)-rn.v)<0.0051;
          if(!okT){   /* app lines che amount round karat nahi, fakt final total round karto (e.g. 840.01) -> lines unrounded (Qty*Net lead) */
            var su=cur.basic.v,allq=true;
            cur.adds.forEach(function(a){if(a.qc){su+=a.qv*a.nv;}else su+=a.v;});
            if(Math.abs(_xfR(su,2)-rn.v)<0.0051){
              okT=true;
              cur.adds.forEach(function(a){if(a.qc)_xfPut(ws,a.xr,a.col,_xfA(a.qc,a.xr)+"*"+_xfA(a.nc,a.xr),a.v,"0.00");});
            }
          }
          okT=true;   /* ALWAYS link */
          if(okT){
            var fRA="ROUND("+_xfA(cur.basic.col,cur.basic.xr)+cur.adds.map(function(a){return"+"+_xfA(a.col,a.xr);}).join("")+",2)";
            try{
              var sd=0,bx=cur.basic.xr;
              rows.forEach(function(q){
                if(q.xr<bx||q.xr>=p.xr)return;
                var rq=_xfCol(q,4),rqn=rq?_xfN(rq.txt):null,lb=((_xfCol(q,1)||{}).txt)||"";
                if(rqn&&!/^NET/i.test(lb))sd+=rqn.v;
              });
              if(Math.abs(sd-s)<0.005){
                var RC=_xkA(col),LC=_xkA(2);
                fRA="ROUND(SUMIFS("+RC+bx+":INDEX("+RC+":"+RC+",ROW()-1),"+LC+bx+":INDEX("+LC+":"+LC+",ROW()-1),\"<>NET*\"),2)";
              }
            }catch(e){}
            _xfPut(ws,p.xr,col,fRA,rn.v,"0.00");
            var o1=out[cur.idx]||(out[cur.idx]={fl:{}});o1.ref=_xfRef(ws,col,p.xr);o1.v=rn.v;
            o1.fl[_xfFk((_xfCol(p,1)||{}).txt)]={ref:o1.ref,v:rn.v};
          }
        }
        cur.first={xr:p.xr,col:col,v:rn.v};
      }else if(cur.diff&&Math.abs(_xfR(cur.first.v+cur.diff.v,2)-rn.v)<0.0051){
        _xfPut(ws,p.xr,col,"ROUND("+_xfA(cur.first.col,cur.first.xr)+"+"+_xfA(cur.diff.col,cur.diff.xr)+",2)",rn.v,"0.00");
        var o2=out[cur.idx]||(out[cur.idx]={fl:{}});o2.fl[_xfFk((_xfCol(p,1)||{}).txt)]={ref:_xfRef(ws,col,p.xr),v:rn.v};
        cur.diff=null;
      }
    }
  });
  return out;
}

/* ── Abstract ── */
function _xfAbs(ws,meas,ra){
  var rows=ws._xsMeta||[],idx=null,items=[],A=null,B=null,afterA=[],res={};
  var ic={},ci=null,stp=false;   /* item madhe kiti Abstract rows (floor-wise) */
  rows.forEach(function(p){
    if(stp)return;var cl=" "+p.cls+" ";
    if(cl.indexOf(" it ")>-1){var c=_xfCol(p,0);if(c&&/^\d+$/.test(c.txt))ci=parseInt(c.txt,10);if(ci!=null)ic[ci]=(ic[ci]||0)+1;return;}
    var lb=p.cells.map(function(c){return c.txt;}).join(" ");if(/^Total\s*=/i.test(lb)||/TOTAL\s*\(/i.test(lb))stp=true;
  });
  rows.forEach(function(p){
    var cl=" "+p.cls+" ",last=p.cells.length?p.cells[p.cells.length-1]:null;
    if(cl.indexOf(" it ")>-1&&!A){
      var c0=_xfCol(p,0);if(c0&&/^\d+$/.test(c0.txt))idx=parseInt(c0.txt,10);
      var qc=_xfCol(p,2),rc=_xfCol(p,3),ac=_xfCol(p,5);if(!qc||!rc||!ac)return;
      var qn=_xfN(qc.fl?qc.nt:qc.txt),rn=_xfN(rc.txt),an=_xfN(ac.txt);
      if(!an)return;
      items.push({xr:p.xr,col:ac.c+1});
      _xfSetNum(ws,p.xr,ac.c+1,an.v,"0.00");
      if(rn)_xfSetNum(ws,p.xr,rc.c+1,rn.v,"0.00");
      if(qn)_xfSetNum(ws,p.xr,qc.c+1,qn.v,_xfFmt(qn.dec,""));
      var m=meas[idx],r2=ra[idx];
      var lnk=false,lv=0,qfmt=qn?_xfFmt(qn.dec,""):"";
      if(qn&&m&&(!qc.fl||ic[idx]===1)){lnk=true;lv=m.p;_xfPut(ws,p.xr,qc.c+1,m.ref,m.p,qfmt);}
      else if(qn&&m&&qc.fl&&m.rows){   /* floor-wise: ya floor chya measurement rows chi sum (Classic SUMIFS sarkhe) */
        var fk=_xfFk(qc.ft),sel=m.rows.filter(function(r){return r.fk===fk;}),sf=0;
        sel.forEach(function(r){sf+=r.v;});
        if(sel.length){
          lnk=true;lv=sf;
          _xfPut(ws,p.xr,qc.c+1,"ROUND("+sel.map(function(r){return"'"+m.wsn+"'!$"+_xkA(r.col)+"$"+r.xr;}).join("+")+","+qn.dec+")",sf,qfmt);
        }
      }
      if(lnk&&qc.fl&&qc.ft)ws.getCell(p.xr,qc.c+1).numFmt=qfmt+' "['+String(qc.ft).replace(/"/g,"")+']"';
      var rr2=null;   /* rate: floor row asel tar tya floor cha TOTAL RATE (1ST FLOOR vagere), nahitar item cha pahila TOTAL RATE */
      if(r2){rr2=(qc.fl&&r2.fl&&r2.fl[_xfFk(qc.ft)])||(r2.ref?r2:null);}
      var rlnk=!!(rn&&rr2);
      if(rlnk)_xfPut(ws,p.xr,rc.c+1,rr2.ref,rn.v,"0.00");
      /* app: Amount = round( round(Qty,3) x Rate ) -> linked qty sathi ROUND(Qty,3) */
      var qq=lnk?lv:(qn?qn.v:0),amtOk=false,amtF="ROUND("+_xfA(qc.c+1,p.xr)+"*"+_xfA(rc.c+1,p.xr)+",0)";
      if(qn&&rn){   /* ALWAYS link: Amount = ROUND(ROUND(Qty,3)*Rate,0) (linked qty) / ROUND(Qty*Rate,0) */
        amtOk=true;
        if(lnk)amtF="ROUND(ROUND("+_xfA(qc.c+1,p.xr)+",3)*"+_xfA(rc.c+1,p.xr)+",0)";
      }
      if(!amtOk)console.warn("Excel link skipped: Abstract item "+idx+" amount "+an.v+" (qty "+(lnk?lv:(qn?qn.v:"?"))+" x rate "+(rn?rn.v:"?")+")");
      if(!lnk&&qn)console.warn("Excel link skipped: Abstract item "+idx+" qty "+qn.v+" does not match Measurements total "+(m?m.v:"(none)"));
      if(amtOk)_xfPut(ws,p.xr,ac.c+1,amtF,an.v,"0.00");
      return;
    }
    if(!last)return;
    var lab=p.cells.map(function(c){return c.txt;}).join(" ").trim(),mt=/TOTAL\s*\(\s*([A-Z+]+)\s*\)/i.exec(lab);
    var isTot=/^Total\s*=/i.test(lab)||!!mt,an2=_xfN(last.txt);
    if(!isTot){
      if(A&&!B&&an2&&last.c===5)afterA.push({xr:p.xr,col:last.c+1,v:an2.v});
      return;
    }
    if(!an2)return;
    var col=last.c+1,key=mt?mt[1].toUpperCase():"";
    _xfSetNum(ws,p.xr,col,an2.v,"0.00");
    if(!A&&(key===""||key==="A")){
      if(items.length){
        var s=0;
        rows.forEach(function(q){ if(q.xr>=items[0].xr&&q.xr<=items[items.length-1].xr){var lc=q.cells.length?q.cells[q.cells.length-1]:null,nv=(lc&&/ it /.test(" "+q.cls+" ")&&lc.c+1===col)?_xfN(lc.txt):null;if(nv)s+=nv.v;} });
        _xfPut(ws,p.xr,col,"SUM("+_xfA(col,items[0].xr)+":"+_xfA(col,items[items.length-1].xr)+")",an2.v,"0.00");
      }
      A={ref:_xfRef(ws,col,p.xr),v:an2.v,xr:p.xr,col:col};res.A=A;
    }else if(A&&!B&&key==="B"){
      var sb=0;afterA.forEach(function(i){sb+=i.v;});
      if(afterA.length)_xfPut(ws,p.xr,col,"SUM("+_xfA(col,afterA[0].xr)+":"+_xfA(col,afterA[afterA.length-1].xr)+")",an2.v,"0.00");
      B={ref:_xfRef(ws,col,p.xr),v:an2.v,xr:p.xr,col:col};res.B=B;
    }else if(A&&B&&key.indexOf("+")>-1){
      _xfPut(ws,p.xr,col,_xfA(A.col,A.xr)+"+"+_xfA(B.col,B.xr),an2.v,"0.00");
    }
  });
  return res;
}

/* ── Recapitulation ── */
function _xfRecap(ws,ab){
  var rows=ws._xsMeta||[],R={},rl=[],out={};
  function ref(k){return _xfA(k.col,k.xr);}
  rows.forEach(function(p){
    var cl=" "+p.cls+" ",last=p.cells.length?p.cells[p.cells.length-1]:null,n=last?_xfN(last.txt):null;
    if(!last||!n)return;
    var col=last.c+1,lab=p.cells.map(function(c){return c.txt;}).join(" ");
    _xfSetNum(ws,p.xr,col,n.v,"0.00");
    if(cl.indexOf(" pdfrA ")>-1){
      if(ab.A)_xfPut(ws,p.xr,col,ab.A.ref,n.v,"0.00");
      R.A={col:col,xr:p.xr,v:n.v};
    }else if(cl.indexOf(" pdfrB ")>-1){
      if(ab.B)_xfPut(ws,p.xr,col,ab.B.ref,n.v,"0.00");
      R.B={col:col,xr:p.xr,v:n.v};
    }else if(cl.indexOf(" pdfrT ")>-1){
      if(/GRAND/i.test(lab)){
        if(R.T){
          var s=R.T.v;rl.forEach(function(x){s+=x.v;});
          _xfPut(ws,p.xr,col,ref(R.T)+(rl.length?"+SUM("+_xfA(rl[0].col,rl[0].xr)+":"+_xfA(rl[rl.length-1].col,rl[rl.length-1].xr)+")":""),n.v,"0.00");
        }
        R.G={col:col,xr:p.xr,v:n.v};
      }else if(/SAY/i.test(lab)){
        if(R.G)_xfPut(ws,p.xr,col,"ROUND("+ref(R.G)+"/100000,2)",n.v,"0.00");
        out.say={ref:_xfRef(ws,col,p.xr),v:n.v};
      }else if(/TOTAL/i.test(lab)&&R.A){
        var t=R.A.v+(R.B?R.B.v:0);
        _xfPut(ws,p.xr,col,ref(R.A)+(R.B?"+"+ref(R.B):""),n.v,"0.00");
        R.T={col:col,xr:p.xr,v:n.v};
      }
    }else if(cl.indexOf(" rl ")>-1){
      var m=/ADD\s+([\d.]+)\s*%.*?ON\s*\[\s*(A\+B|A)\s*\]/i.exec(lab),base=m?(m[2].toUpperCase()==="A+B"?R.T:R.A):null;
      if(m&&base)_xfPut(ws,p.xr,col,"ROUND("+ref(base)+"*"+m[1]+"/100,0)",n.v,"0.00");
      rl.push({col:col,xr:p.xr,v:n.v});
    }
  });
  return out;
}

/* ── Lead Chart (Standard) → live: Lead km (input) → Lead charge (SSR table interpolation, hidden "LeadTables") → Rate Analysis lead lines ── */
var XF_LEAD={};
function _xfNk(t){return String(t==null?"":t).toUpperCase().replace(/[^A-Z0-9]/g,"");}
function _xfLeadMk(t){
  var n=_xfNk(t),r=null;
  Object.keys(XF_LEAD).forEach(function(mk){if(!r&&typeof LR!=="undefined"&&LR[mk]&&_xfNk(LR[mk].label||mk)===n)r=mk;});
  return r;
}
function _xfLead(ws){
  XF_LEAD={};
  if(typeof LCD==="undefined"||typeof LL==="undefined"||typeof lkup!=="function")return;
  var rows=ws._xsMeta||[],hit=[],keys={};
  rows.forEach(function(p){
    var mc=_xfCol(p,1),kc=_xfCol(p,4),cc=_xfCol(p,5),kn=kc?_xfN(kc.txt):null,cn=cc?_xfN(cc.txt):null;
    if(!mc||!kn||!cn)return;
    var nm=_xfNk(mc.txt),row=null;
    LCD.forEach(function(r){if(!row&&_xfNk(r.name)===nm)row=r;});
    if(!row)return;
    var chg=row.isBitumen?kn.v*10:((row.llKey&&LL[row.llKey])?lkup(row.llKey,kn.v):null);
    if(chg==null||Math.abs(_xfR(chg,2)-cn.v)>0.0051)return;   /* app value shi match nahi -> value rahte */
    hit.push({p:p,row:row,kc:kc,cc:cc,kn:kn,cn:cn});
    if(!row.isBitumen)keys[row.llKey]=1;
  });
  if(!hit.length)return;
  var lt=ws.workbook.addWorksheet("LeadTables",{views:[{showGridLines:true}]}),T={},ti=0;
  Object.keys(keys).forEach(function(k){
    var kc=1+2*ti,cc=2+2*ti,n=LL[k].length;ti++;
    lt.getCell(1,kc).value=k;lt.getCell(2,kc).value="km";lt.getCell(2,cc).value="charge";
    LL[k].forEach(function(pt,i){lt.getCell(3+i,kc).value=pt[0];lt.getCell(3+i,cc).value=pt[1];});
    T[k]={kc:kc,cc:cc,n:n,kmR:"'LeadTables'!$"+_xkA(kc)+"$3:$"+_xkA(kc)+"$"+(2+n),chR:"'LeadTables'!$"+_xkA(cc)+"$3:$"+_xkA(cc)+"$"+(2+n)};
  });
  hit.forEach(function(h){
    var r=h.p.xr,kcol=h.kc.c+1,ccol=h.cc.c+1,kref=_xfA(kcol,r);
    _xfSetNum(ws,r,kcol,h.kn.v,_xfFmt(h.kn.dec,""));
    var f=h.row.isBitumen?(kref+"*10"):_xkLkup(T[h.row.llKey],kref);
    _xfPut(ws,r,ccol,f,h.cn.v,"0.00");
    var ref="'"+ws.name+"'!$"+_xkA(ccol)+"$"+r;
    (h.row.matKeys||[]).forEach(function(mk){XF_LEAD[mk]={ref:ref,v:h.cn.v};});
  });
  lt.state="hidden";lt.orderNo=1000;
}

/* ── Consumption (Standard) → qty = Measurements item total × factor ── */
function _xfNum0(t){var m=/^[-+]?\d[\d,]*(\.\d+)?/.exec(String(t||"").trim());return m?parseFloat(m[0].replace(/,/g,"")):NaN;}
function _xfIsItem(p){var a=_xfCol(p,0),b=_xfCol(p,1);return !!(a&&/^\d+$/.test(a.txt)&&b&&b.txt.length>3&&!/^\d+$/.test(b.txt));}
function _xfCons(ws,meas){
  var rows=ws._xsMeta||[],by={},first=null,last=null,FC=[3,5,7,9,11,13,15];
  by._hdr={};by._tot={};
  rows.forEach(function(p){
    if(!_xfIsItem(p))p.cells.forEach(function(c0){if(c0.c>=3&&/CEMENT|METAL|SAND/i.test(c0.txt)&&!/^\d/.test(c0.txt))by._hdr[c0.c]=c0.txt;});
    if(_xfIsItem(p)){
      var it=parseInt(_xfCol(p,0).txt,10),cq=_xfCol(p,2),q0=cq?_xfNum0(cq.txt):NaN,m=meas[it],ent={xr:p.xr,f:{}};
      /* QUANTITY cell ("13.06" + unit, 2 line) -> Measurements total shi link (text formula: number + new line + unit) */
      if(cq&&m&&!isNaN(q0)){
        var qm=/^([-+]?\d[\d,]*(?:\.(\d+))?)\s*(.*)$/.exec(cq.txt),qd=qm&&qm[2]?qm[2].length:0,qu=qm?String(qm[3]||"").replace(/"/g,""):"";
        if(qm&&Math.abs(_xfR(m.p,qd)-q0)<Math.pow(10,-qd)*0.51){
          var cc0=ws.getCell(p.xr,cq.c+1),cur0=cc0.value,res0=(typeof cur0==="string")?cur0:(_xfR(m.p,qd).toFixed(qd)+"\n"+qu);
          cc0.value={formula:'TEXT(ROUND('+m.ref+','+qd+'),"'+(qd?"0."+new Array(qd+1).join("0"):"0")+'")'+(qu?'&CHAR(10)&"'+qu+'"':""),result:res0};
          XF_CNT++;
          var al=cc0.alignment||{};cc0.alignment=Object.assign({},al,{wrapText:true});
        }
      }
      FC.forEach(function(c){
        var fc=_xfCol(p,c),qc=_xfCol(p,c+1),fn=fc?_xfN(fc.txt):null,qn=qc?_xfN(qc.txt):null;
        if(!fn||!qn)return;
        _xfSetNum(ws,p.xr,fc.c+1,fn.v,_xfFmt(fn.dec,""));_xfSetNum(ws,p.xr,qc.c+1,qn.v,_xfFmt(qn.dec,""));
        ent.f[c]={v:fn.v,ref:"'"+ws.name+"'!$"+_xkA(fc.c+1)+"$"+p.xr};
        if(m&&!isNaN(q0)&&Math.abs(_xfR(m.p,2)-q0)<0.0051){   /* Measurements total chi displayed value 2 decimal asu shakte -> full value (m.p) vapar */
          var m3=_xfR(m.p,3),pr=m3*fn.v,rv=(Math.abs(_xfR(pr,3))<1e-12&&pr>0)?_xfR(pr,5):_xfR(pr,3);
          if(Math.abs(rv-qn.v)<0.00111){
            var Q="ROUND("+m.ref+",3)",F=_xfA(fc.c+1,p.xr);
            _xfPut(ws,p.xr,qc.c+1,"IF(AND(ROUND("+Q+"*"+F+",3)=0,"+Q+"*"+F+">0),ROUND("+Q+"*"+F+",5),ROUND("+Q+"*"+F+",3))",qn.v,_xfFmt(qn.dec,""));
          }
        }
      });
      by[it]=ent;if(!first)first=p.xr;last=p.xr;return;
    }
    var a0=_xfCol(p,0);
    if(first&&a0&&/^TOTAL/i.test(a0.txt)){
      FC.forEach(function(c){
        var tc=_xfCol(p,c+1),tn=tc?_xfN(tc.txt):null;if(!tn)return;
        var sm=0;rows.forEach(function(q){if(q.xr>=first&&q.xr<=last){var qc=_xfCol(q,c+1),qn=qc?_xfN(qc.txt):null;if(qn&&_xfIsItem(q))sm+=qn.v;}});
        by._tot[c]={ref:"'"+ws.name+"'!$"+_xkA(c+2)+"$"+p.xr,v:tn.v};
        if(Math.abs(sm-tn.v)<0.0015){var L=_xkA(c+2);_xfPut(ws,p.xr,c+2,"ROUND(SUM("+L+first+":INDEX("+L+":"+L+",ROW()-1)),3)",tn.v,_xfFmt(tn.dec,""));}
        else _xfSetNum(ws,p.xr,c+2,tn.v,_xfFmt(tn.dec,""));
      });
    }
  });
  return by;
}

/* ── Royalty (Standard): Qty (Measurements) × Factor (Consumption) → Net qty → Rate → Amount ── */
function _xfRoy(ws,meas,cons){
  var rows=ws._xsMeta||[],first=null,last=null,out={},R={};
  function pickF(it,pref,v){var e=cons&&cons[it];if(!e)return null;for(var i=0;i<pref.length;i++){var f=e.f[pref[i]];if(f&&Math.abs(f.v-v)<1e-9)return f;}return null;}
  rows.forEach(function(p){
    if(_xfIsItem(p)){
      var it=parseInt(_xfCol(p,0).txt,10),cc=_xfCol(p,2),cn=cc?_xfN(cc.txt):null,m=meas[it];
      if(!cn)return;
      var qref=_xfA(cc.c+1,p.xr);
      if(m&&Math.abs(_xfR(m.p,3)-cn.v)<0.00111)_xfPut(ws,p.xr,cc.c+1,"ROUND("+m.ref+",3)",cn.v,_xfFmt(cn.dec,""));else _xfSetNum(ws,p.xr,cc.c+1,cn.v,_xfFmt(cn.dec,""));
      [[4,5,[5,15,3]],[6,7,[3,15,5]]].forEach(function(g){
        var fc=_xfCol(p,g[0]),qc=_xfCol(p,g[1]),fn=fc?_xfN(fc.txt):null,qn=qc?_xfN(qc.txt):null;if(!fn||!qn)return;
        var lf=pickF(it,g[2],fn.v);
        if(lf)_xfPut(ws,p.xr,fc.c+1,lf.ref,fn.v,_xfFmt(fn.dec,""));else _xfSetNum(ws,p.xr,fc.c+1,fn.v,_xfFmt(fn.dec,""));
        if(Math.abs(_xfR(fn.v*cn.v,3)-qn.v)<1e-9)_xfPut(ws,p.xr,qc.c+1,"ROUND("+_xfA(fc.c+1,p.xr)+"*"+qref+",3)",qn.v,_xfFmt(qn.dec,""));
        else _xfSetNum(ws,p.xr,qc.c+1,qn.v,_xfFmt(qn.dec,""));
      });
      if(!first)first=p.xr;last=p.xr;return;
    }
    var lc=_xfCol(p,2),lb=lc?lc.txt:"";if(!first||!lb)return;
    function cell(ci){var c=_xfCol(p,ci),n=c?_xfN(c.txt):null;return n?{c:c.c+1,n:n}:null;}
    if(/^Total\s+Qty/i.test(lb)){
      [[5,"s"],[7,"o"]].forEach(function(g){
        var t=cell(g[0]);if(!t)return;var sm=0;
        rows.forEach(function(q){if(q.xr>=first&&q.xr<=last&&_xfIsItem(q)){var qc=_xfCol(q,g[0]),qn=qc?_xfN(qc.txt):null;if(qn)sm+=qn.v;}});
        var L=_xkA(t.c);
        if(Math.abs(sm-t.n.v)<0.0015)_xfPut(ws,p.xr,t.c,"ROUND(SUM("+L+first+":INDEX("+L+":"+L+",ROW()-1)),3)",t.n.v,_xfFmt(t.n.dec,""));
        else _xfSetNum(ws,p.xr,t.c,t.n.v,_xfFmt(t.n.dec,""));
        R[g[1]]={c:t.c,qx:p.xr,qv:t.n.v};
      });
    }else if(/^Rate/i.test(lb)){
      [[5,"s"],[7,"o"]].forEach(function(g){var t=cell(g[0]);if(!t||!R[g[1]])return;_xfSetNum(ws,p.xr,t.c,t.n.v,"0.00");R[g[1]].rx=p.xr;R[g[1]].rv=t.n.v;});
    }else if(/^Total\s+Amount/i.test(lb)){
      [[5,"s"],[7,"o"]].forEach(function(g){
        var t=cell(g[0]),o=R[g[1]];if(!t||!o||!o.rx)return;
        var sm=0;rows.forEach(function(q){if(q.xr>=first&&q.xr<=last&&_xfIsItem(q)){var qc=_xfCol(q,g[0]),qn=qc?_xfN(qc.txt):null;if(qn)sm+=Math.round(qn.v*o.rv+1e-9);}});
        var L=_xkA(t.c);
        if(Math.abs(sm-t.n.v)<0.5){_xfPut(ws,p.xr,t.c,"SUMPRODUCT(ROUND("+L+first+":INDEX("+L+":"+L+",ROW()-"+(p.xr-o.qx+1)+")*$"+L+"$"+o.rx+",0))",t.n.v,"0");}
        else _xfSetNum(ws,p.xr,t.c,t.n.v,"0");
        o.ax=p.xr;o.av=t.n.v;
        out[g[1]]={qty:"'"+ws.name+"'!$"+L+"$"+o.qx,qv:o.qv,rate:"'"+ws.name+"'!$"+L+"$"+o.rx,rv:o.rv,amt:"'"+ws.name+"'!$"+L+"$"+p.xr,av:t.n.v};
      });
    }else if(/^Grand\s+Total/i.test(lb)){
      var g=cell(7),a1=R.s&&R.s.ax,a2=R.o&&R.o.ax;
      if(g&&a1&&a2&&Math.abs(R.s.av+R.o.av-g.n.v)<0.5)_xfPut(ws,p.xr,g.c,_xfA(R.s.c,a1)+"+"+_xfA(R.o.c,a2),g.n.v,"0");
      else if(g)_xfSetNum(ws,p.xr,g.c,g.n.v,"0");
    }
  });
  return out;
}
/* Abstract [B]: ROYALTY CHARGES FOR SAND / OTHER MINERALS → Royalty sheet */
function _xfRoyAbs(ws,roy){
  (ws._xsMeta||[]).forEach(function(p){
    var b=_xfCol(p,1),t=b?String(b.txt).toUpperCase():"";
    var k=/ROYALTY CHARGES FOR SAND/.test(t)?"s":(/ROYALTY CHARGES FOR OTHER MINERALS/.test(t)?"o":null);
    if(!k||!roy[k])return;
    var qc=_xfCol(p,2),rc=_xfCol(p,3),ac=_xfCol(p,5),qn=qc?_xfN(qc.txt):null,rn=rc?_xfN(rc.txt):null,an=ac?_xfN(ac.txt):null,o=roy[k];
    if(qn&&Math.abs(_xfR(o.qv,2)-qn.v)<0.0051)_xfPut(ws,p.xr,qc.c+1,"ROUND("+o.qty+",2)",qn.v,_xfFmt(qn.dec,""));
    if(rn&&Math.abs(o.rv-rn.v)<0.0051)_xfPut(ws,p.xr,rc.c+1,o.rate,rn.v,"0.00");
    if(an&&Math.abs(o.av-an.v)<0.5)_xfPut(ws,p.xr,ac.c+1,o.amt,an.v,"0.00");
  });
}

/* ── Testing (Standard): Qty (Consumption / Measurements) → No. of tests (frequency) → Abstract [B] testing rows ── */
function _xfTest(ws,meas,cons){
  var rows=ws._xsMeta||[],out={};
  function consRef(re){var refs=[],tot=0;if(!cons||!cons._hdr)return null;Object.keys(cons._hdr).forEach(function(c){if(re.test(cons._hdr[c])&&cons._tot[c]){refs.push(cons._tot[c].ref);tot+=cons._tot[c].v;}});return refs.length?{refs:refs,v:tot}:null;}
  rows.forEach(function(p){
    if(!_xfIsItem(p))return;
    var lb=String(_xfCol(p,1).txt).toUpperCase(),qc=_xfCol(p,2),gc=_xfCol(p,6),qn=qc?_xfN(qc.txt):null,gn=gc?_xfN(gc.txt):null;
    if(!qn||!gn)return;
    var qcol=qc.c+1,gcol=gc.c+1,qa=_xfA(qcol,p.xr),kind=null,f=null;
    _xfSetNum(ws,p.xr,qcol,qn.v,_xfFmt(qn.dec,""));_xfSetNum(ws,p.xr,gcol,gn.v,"0");
    if(/CONCRETE/.test(lb)){
      kind="conc";var gm=/M[-\s]?(\d+)/.exec(lb),refs=[],sm=0;
      if(gm){var re=new RegExp("M[-\\s]?"+gm[1]+"(?!\\d)","i");
        Object.keys(meas).forEach(function(k){var m=meas[k];if(m.desc&&re.test(m.desc)&&/cement\s+concrete/i.test(m.desc)){refs.push(m.ref);sm+=m.p;}});}
      if(refs.length&&Math.abs(_xfR(sm,2)-qn.v)<0.0051)f="ROUND("+refs.join("+")+",2)";
    }else if(/CEMENT/.test(lb)){
      kind="cem";var c1=consRef(/CEMENT/i);
      if(c1&&Math.abs(_xfR(c1.v*0.05,2)-qn.v)<0.0101)f="ROUND(("+c1.refs.join("+")+")*0.05,2)";
    }else if(/AGGREGATE/.test(lb)){
      kind="agg";var c2=consRef(/METAL/i);
      if(c2&&Math.abs(_xfR(c2.v,2)-qn.v)<0.0101)f="ROUND("+c2.refs.join("+")+",2)";
    }else if(/SAND/.test(lb)){
      kind="sand";var c3=consRef(/SAND/i);
      if(c3&&Math.abs(_xfR(c3.v,2)-qn.v)<0.0101)f="ROUND("+c3.refs.join("+")+",2)";
    }
    if(f)_xfPut(ws,p.xr,qcol,f,qn.v,_xfFmt(qn.dec,""));
    var r0="ROUND("+qa+",0)",g=null,q=qn.v;
    if(kind==="cem"){g="IF("+qa+">0,ROUNDUP("+qa+"/150,0),0)";}
    else if(kind==="agg"){g="IF("+qa+">0,ROUNDUP("+qa+"/200,0),0)";}
    else if(kind==="sand"){g="IF("+qa+">0,1,0)";}
    else if(kind==="conc"){g="IF("+r0+"<=0,0,IF("+r0+"<=5,1,IF("+r0+"<=15,2,IF("+r0+"<=30,3,IF("+r0+"<=50,4,4+ROUNDUP(("+r0+"-50)/50,0))))))";}
    if(g){
      var rq=Math.round(q),exp=kind==="cem"?(q>0?Math.ceil(q/150):0):(kind==="agg"?(q>0?Math.ceil(q/200):0):(kind==="sand"?(q>0?1:0):(rq<=0?0:(rq<=5?1:(rq<=15?2:(rq<=30?3:(rq<=50?4:4+Math.ceil((rq-50)/50))))))));
      if(exp===gn.v)_xfPut(ws,p.xr,gcol,g,gn.v,"0");
    }
    out[_xfNk(lb.replace(/^BASIC\s+TEST\s+OF\s+/,""))]={ref:"'"+ws.name+"'!$"+_xkA(gcol)+"$"+p.xr,v:gn.v};
  });
  return out;
}
function _xfTestAbs(ws,tst){
  var head=null;
  (ws._xsMeta||[]).forEach(function(p){
    var b=_xfCol(p,1),qc=_xfCol(p,2),rc=_xfCol(p,3),ac=_xfCol(p,5),qn=qc?_xfN(qc.txt):null,rn=rc?_xfN(rc.txt):null,an=ac?_xfN(ac.txt):null;
    if(b&&!qn&&!rn&&!an){head=_xfNk(b.txt);return;}
    if(!head||!qn||!rn||!an)return;
    var hit=null;Object.keys(tst).forEach(function(k){if(!hit&&k&&head.length>=k.length&&head.slice(-k.length)===k)hit=tst[k];});
    if(!hit||Math.abs(hit.v-qn.v)>1e-9){head=null;return;}
    _xfPut(ws,p.xr,qc.c+1,hit.ref,qn.v,"0");
    _xfSetNum(ws,p.xr,rc.c+1,rn.v,"0.00");
    if(Math.abs(qn.v*rn.v-an.v)<0.5)_xfPut(ws,p.xr,ac.c+1,_xfA(qc.c+1,p.xr)+"*"+_xfA(rc.c+1,p.xr),an.v,"0.00");
    head=null;
  });
}

function _xfApply(S){
  XF_CNT=0;
  var meas={},ra={},ab={},rc={};
  if(S.p1)try{_xfLead(S.p1);}catch(e){console.error("Excel formulas (Lead Chart):",e);XF_LEAD={};}
  if(S.p5)try{meas=_xfMeas(S.p5);}catch(e){console.error("Excel formulas (Measurements):",e);}
  if(S.p4)try{ra=_xfRA(S.p4);}catch(e){console.error("Excel formulas (Rate Analysis):",e);}
  if(S.p3)try{ab=_xfAbs(S.p3,meas,ra);}catch(e){console.error("Excel formulas (Abstract):",e);}
  var cons=null,roy=null;
  if(S.p6)try{cons=_xfCons(S.p6,meas);}catch(e){console.error("Excel formulas (Consumption):",e);}
  if(S.p7)try{roy=_xfRoy(S.p7,meas,cons);if(S.p3&&roy)_xfRoyAbs(S.p3,roy);}catch(e){console.error("Excel formulas (Royalty):",e);}
  if(S.p11)try{var tst=_xfTest(S.p11,meas,cons);if(S.p3&&tst)_xfTestAbs(S.p3,tst);}catch(e){console.error("Excel formulas (Testing):",e);}
  if(S.p8)try{rc=_xfRecap(S.p8,ab);}catch(e){console.error("Excel formulas (Recapitulation):",e);}
  try{
    if(S.p0&&S.p0._xsCost&&rc.say&&!(window.COV_COST_MANUAL!=null&&window.COV_COST_MANUAL!=="")){
      var cv=S.p0._xsCost,cvv=cv.value;
      if(typeof cvv==="number"&&Math.abs(cvv-rc.say.v)<0.0051){cv.value={formula:rc.say.ref,result:cvv};XF_CNT++;}
    }
  }catch(e){console.error("Excel formulas (Main Page):",e);}
  return XF_CNT;
}

/* ── driver ─────────────────────────────────────────────────────────────── */
function _xlSave(buf,fname){
  if(typeof atpMxDownload==="function"){atpMxDownload(buf,fname);return;}
  var blob=new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
  var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=fname;
  document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1500);
}
function _xlBuild(EJ,ids){
  var wb=new EJ.Workbook(),made=0,lk=null;
  var STD=_xsOn(),STDWS={};   /* Standard = Print All "Standard" sarkhe layout; Classic = juna (live formulas) */
  XK_NAMEREF=null;XK_NAMEVAL="";
  wb.creator="Maha PWD Estimator";wb.created=new Date();
  wb.calcProperties={fullCalcOnLoad:true};
  var LK={p8:"fe",p3:"ab",p5:"ms",p4:"ra",p1:"lc",p6:"cc",p7:"ry",p11:"mt"};
  /* live-formula chain: Lead km -> Rate Analysis -> Abstract <- Measurements -> Recapitulation */
  if(!STD&&window.XL_LINKED!==false&&typeof _xlLinkBuild==="function"&&ids.some(function(id){return LK[id];})){
    try{lk=_xlLinkBuild(wb);}
    catch(e){
      console.error("Linked Excel failed, value-only sheets will be used:",e);lk=null;XK_NAMEREF=null;
      wb.worksheets.slice().forEach(function(w){try{wb.removeWorksheet(w.id);}catch(x){}});
    }
  }
  var seq=0,cover=null;
  ids.forEach(function(id){
    if(id==="pgr"){var wg=null;try{wg=_xlGeneralReport(wb);}catch(e){console.error("Excel General Report:",e);}if(wg){wg.orderNo=seq++;made++;}return;}
    var panel=document.getElementById(id);if(!panel)return;
    var ws=null;
    if(STD){   /* Standard layout: Print All Standard page varun; page nasel tar khali Classic path (Print All sarkhach) */
      var wsS=null;try{wsS=_xsSheet(wb,id);}catch(e){console.error("Excel Standard "+id+":",e);}
      if(wsS){STDWS[id]=wsS;wsS.orderNo=seq++;made++;return;}
    }
    if(lk&&LK[id]){ws=wb.getWorksheet(XLK[LK[id]]);}
    else{
      try{ws=(id==="p0")?_xlCover(wb,panel):_xlPanelSheet(wb,panel,id);}catch(e){console.error("Excel sheet "+id+":",e);}
      if(id==="p0")cover=ws;
    }
    if(ws){ws.orderNo=seq++;made++;}
  });
  var xfN=0;
  if(STD&&window.XL_LINKED!==false){try{xfN=_xfApply(STDWS);}catch(e){console.error("Excel Standard formulas:",e);}}
  if(lk){
    /* linked helper sheets: keep the ones not chosen hidden, Settings/LeadTables at the end */
    Object.keys(LK).forEach(function(id){
      if(ids.indexOf(id)<0){var w=wb.getWorksheet(XLK[LK[id]]);if(w){w.orderNo=seq++;w.state="hidden";}}
    });
    ["set","lt"].forEach(function(k){var w=wb.getWorksheet(XLK[k]);if(w){w.orderNo=seq++;if(k==="lt")w.state="hidden";}});   /* LeadTables (SSR charts) stays hidden; formulas still work, right-click > Unhide to see it */
    if(cover&&cover._xlCost&&!(window.COV_COST_MANUAL!=null&&window.COV_COST_MANUAL!=="")){
      var dv=(window.COV_COST_UNIT==="thousands")?1000:((window.COV_COST_UNIT==="actual")?1:100000),th=(dv===1000);
      cover._xlCost.value={formula:"ROUND("+lk.grand+"/"+dv+",0)",result:Math.round(lk.grandVal/dv)};
      cover._xlCost.numFmt="0";
    }
  }
  if(lk&&cover&&cover._xlNameCell&&XK_NAMEREF&&_xkNorm(cover._xlNameVal)===XK_NAMEVAL)cover._xlNameCell.value=_xkNameF(cover._xlNameVal);
  XK_NAMEREF=null;
  if(!made){showToast("No sheet with data found to export","error");return;}
  var nm=((document.getElementById("pName")||{}).value||"New Work").trim()||"New Work";
  nm=nm.replace(/[\\\/:*?"<>|\r\n]+/g," ").replace(/\s+/g," ").trim().substring(0,100)||"New Work";
  return wb.xlsx.writeBuffer().then(function(buf){
    _xlSave(buf,nm+".xlsx");
    var _left="";
    try{if(typeof CU!=="undefined"&&CU&&!IS_PRO&&!planActive())_left=" \u2022 "+Math.max(0,FREE_LIMIT-DL_COUNT)+" downloads left";}catch(e){}
    showToast("Excel downloaded! \uD83D\uDCCA ("+made+" sheets"+(lk?", live formulas \u2022 v2":(xfN?", "+xfN+" live formulas":""))+")"+_left,"success");
  });
}
function _xlRun(ids){
  if(typeof canDownload==="function"&&!canDownload())return;
  _doCountDownload();
  try{if(typeof updateAllStamps==="function")updateAllStamps();}catch(e){}
  _prepPrint();
  var all=(typeof PRINT_SHEETS!=="undefined"&&PRINT_SHEETS)?PRINT_SHEETS:[];
  var order=all.map(function(s){return s.id;});
  if(!order.length)order=["p0","p8","p20","p3","p5","p4","p1","p12","p6","p7","p11","p18","p9"];
  var sel=ids?order.filter(function(x){return ids.indexOf(x)>-1;}):order.filter(function(x,i){return all[i]?all[i].on:true;});
  if((!ids||ids.indexOf("pgr")>-1)&&sel.indexOf("pgr")<0){var _p0=sel.indexOf("p0");sel.splice(_p0>-1?_p0+1:0,0,"pgr");}   /* General Report sheet: right after Main */
  if(typeof atpMxLoadExcelJS!=="function"){_doExportExcelLegacy(true);return;}
  atpMxLoadExcelJS(function(EJ){
    if(!EJ){showToast("ExcelJS failed to load \u2014 downloading a simple Excel instead","info");_doExportExcelLegacy(true);return;}
    try{
      var pr=_xlBuild(EJ,sel);
      if(pr&&pr.catch)pr.catch(function(e){console.error(e);showToast("Excel error: "+e.message,"error");});
    }catch(e){console.error(e);showToast("Excel error: "+e.message,"error");}
  });
}
function doExportExcel(){
  try{var mdl=G("exportOptModal");if(mdl)mdl.style.display="none";}catch(e){}
  if(typeof printSheetPicker!=="function"){_xlRun(null);return;}
  var _grE={id:"pgr",name:"General Report (\u0938\u0930\u094d\u0935\u0938\u093e\u0927\u093e\u0930\u0923 \u0905\u0939\u0935\u093e\u0932)",on:true},_grAt=0;
  try{var _grHas=false;for(var _gh=0;_gh<PRINT_SHEETS.length;_gh++){if(PRINT_SHEETS[_gh].id==="pgr")_grHas=true;}
    if(_grHas){_grE=null;}   /* already in PRINT_SHEETS (Print All picker) — don't add twice */
    else{for(var _gi=0;_gi<PRINT_SHEETS.length;_gi++){if(PRINT_SHEETS[_gi].id==="p0"){_grAt=_gi+1;break;}}PRINT_SHEETS.splice(_grAt,0,_grE);}}catch(_ge){_grE=null;}
  try{printSheetPicker(function(ids){_xlRun(ids);});}
  finally{try{if(_grE){var _gx=PRINT_SHEETS.indexOf(_grE);if(_gx>-1)PRINT_SHEETS.splice(_gx,1);}}catch(_gf){}}
  /* Print picker cha text Excel sathi badalto */
  try{
    var pm=document.getElementById("printPickModal"),card=pm&&pm.firstElementChild;
    if(card){
      if(card.children[0])card.children[0].textContent="Export Excel \u2013 select sheets";
      if(card.children[1])card.children[1].textContent="Choose the sheets you want in this Excel file. They are exported in the same order as Print All.";
      var go=document.getElementById("ppGo");if(go)go.textContent="Export";
    }
  }catch(e){}
}

/* ══════════════════════════════════════════════════════════════════════════
   LINKED EXCEL (live formulas) — Lead km → Lead charge → Rate Analysis → Abstract ← Measurements → Recapitulation
   Pratyek formula app chya engine shi match karto; ani export velela JS madhe app value shi tapasto —
   jar match nahi zala (cess / override sarkhe special case) tar tya item/cell sathi fakt value thevto.
   Sheets: Settings, Lead Charges (km input), LeadTables (SSR lookup), Measurements, Rate Analysis, Abstract, Consumption, Royalty, Recapitulation
   ══════════════════════════════════════════════════════════════════════════ */
var XLK={set:"Settings",lt:"LeadTables",lc:"Lead Charges",ms:"Measurements",ra:"Rate Analysis",ab:"Abstract",cc:"Consumption",ry:"Royalty",mt:"Testing",fe:"Recapitulation"};
var XLK_IN="FFFFF9C4";   /* input cell colour (light yellow) */
function _xkA(c){var s="";while(c>0){var m=(c-1)%26;s=String.fromCharCode(65+m)+s;c=Math.floor((c-1)/26);}return s;}
function _xkRef(k,r,c){return "'"+XLK[k]+"'!$"+_xkA(c)+"$"+r;}
function _xkSt(o){var d={sz:10,color:"FF000000",h:"left",v:"middle",bold:false,italic:false,under:false,bg:null},k;for(k in o)d[k]=o[k];return d;}
var XK_NAMEREF=null,XK_NAMEVAL="";   /* Settings!Name of Work cell (set while a linked workbook is being built) */
function _xkNorm(x){return String(x==null?"":x).replace(/\s+/g," ").trim();}
function _xkNameF(res){return{formula:"IF("+XK_NAMEREF+'="","",'+XK_NAMEREF+")",result:res};}
var XK_PLAIN=false;   /* true => no fills / coloured fonts (print sheets); only light-grey header fill stays */
function _xkPlainSt(st){var o={},k;for(k in st)o[k]=st[k];if(o.bg!=="FFF2F2F2")o.bg=null;o.color="FF000000";return o;}
function _xkPut(ws,r,c,val,st,o){
  o=o||{};if(XK_PLAIN)st=_xkPlainSt(st);var cell=ws.getCell(r,c);
  if(val&&typeof val==="object"&&val.f!==undefined)cell.value={formula:val.f,result:val.v};
  else cell.value=(val===""||val===undefined||val===null)?null:val;
  if(o.fmt)cell.numFmt=o.fmt;
  _xlApply(cell,st);
  if(o.box!==false)cell.border={top:XL_BRD,left:XL_BRD,bottom:XL_BRD,right:XL_BRD};
  return cell;
}
function _xkF(f,v){return{f:f,v:v};}
var XK_F2=_xlFmt(2),XK_F3="0.000";
function _xkNum(x){var n=Number(x);return isFinite(n)?n:0;}
function _xkQ(s){return String(s).replace(/"/g,'""');}

/* lookup (interpolation) formula for LL[key] at km cell reference kmRef */
function _xkLkup(T,kmRef){
  var K=kmRef,kr=T.kmR,cr=T.chR,n=T.n;
  var mt="MATCH("+K+","+kr+",1)";
  return "IF("+K+"<=0,0,IF("+K+"<=INDEX("+kr+",1),INDEX("+cr+",1),IF("+K+">=INDEX("+kr+","+n+"),INDEX("+cr+","+n+"),"
    +"INDEX("+cr+","+mt+")+("+K+"-INDEX("+kr+","+mt+"))/(INDEX("+kr+","+mt+"+1)-INDEX("+kr+","+mt+"))*(INDEX("+cr+","+mt+"+1)-INDEX("+cr+","+mt+")))))";
}
function _xkLkupJS(key,km){return lkup(key,km);}

function _xkSheet(wb,key,widths,panelId,tabColor){
  var ws=wb.addWorksheet(XLK[key],{views:[{showGridLines:false}]});
  widths.forEach(function(w,i){ws.getColumn(i+1).width=w;});
  var o={ws:ws,r:1,M:widths.length,colW:widths.slice(),blocks:[]};
  if(panelId){
    var p=document.getElementById(panelId);
    if(p){
      o.blocks=_xlCollect(p,panelId);
      var tt=o.blocks.filter(function(b){return b.t==="title";})[0];
      if(tt)o.r=_xlWriteTitle(ws,tt,1,o.M,o.colW);
    }
  }
  if(tabColor)ws.properties.tabColor={argb:tabColor};
  return o;
}
function _xkTail(sh){   /* extra text blocks + signature stamp from the print panel */
  var ws=sh.ws,r=sh.r;
  sh.blocks.forEach(function(b){
    if(b.t==="text"){r=_xlWriteText(ws,b,r,sh.M,sh.colW);}
  });
  var st=sh.blocks.filter(function(b){return b.t==="stamp";})[0];
  if(st){ws.getRow(r).height=10;r++;r=_xlWriteStamp(ws,st,r,sh.M,sh.colW);}
  sh.r=r;
}
function _xkHead(sh,labels,bgs){
  var r=sh.r;
  labels.forEach(function(l,i){
    _xkPut(sh.ws,r,i+1,l,_xkSt({bold:true,h:(i>=3&&labels.length>5)?"right":"left",bg:"FFF2F2F2",sz:10}));
  });
  sh.ws.getRow(r).height=22;sh.headRow=r;sh.r=r+1;return r;
}

/* ── main entry: returns context with addresses (or null → caller falls back to value-only sheets) ── */
function _xlLinkBuild(wb){
  if(typeof items==="undefined"||!items.length)return null;
  XK_PLAIN=false;
  var S=gS(),I=items,ctx={ok:true,static:[],name:{}};
  var gfonly=!!(typeof GF_ONLY!=="undefined"&&GF_ONLY);
  var cessAny=I.some(function(it){return it.cessOn;});

  /* ── lead tables layout ── */
  var used={};  /* mat keys used by items */
  I.forEach(function(it){(it.leadMats||[]).forEach(function(m){if(m.mat&&LR[m.mat]&&m.mat!=="bitumen"&&LL[m.mat]&&!/^area_|^bitumen_/.test(m.mat))used[m.mat]=1;});});
  var matKeys=Object.keys(used);
  var tblKeys={};matKeys.forEach(function(k){tblKeys[k]=1;});
  LCD.forEach(function(row){if(!row.isBitumen&&row.llKey&&LL[row.llKey])tblKeys[row.llKey]=1;});
  var tk=Object.keys(tblKeys),T={};
  tk.forEach(function(k,t){
    var kc=6+2*t,cc=7+2*t,n=LL[k].length,r1=3,r2=2+n;
    T[k]={kc:kc,cc:cc,n:n,kmR:"'"+XLK.lt+"'!$"+_xkA(kc)+"$"+r1+":$"+_xkA(kc)+"$"+r2,chR:"'"+XLK.lt+"'!$"+_xkA(cc)+"$"+r1+":$"+_xkA(cc)+"$"+r2};
  });
  var LC_R0=null,lcKmAt={};  /* first data row on Lead Charges (set when sheet is created) */

  /* ═════ Settings ═════ */
  var sh=_xkSheet(wb,"set",[44,18,40],null,"FFFFC107");
  var ws=sh.ws;ws.mergeCells(1,1,1,3);
  _xkPut(ws,1,1,"Settings \u2014 yellow cells are inputs (change them and everything recalculates)",_xkSt({bold:true,sz:12}),{box:false});
  var ST={},rr=3;
  function setRow(key,label,val,note,fmt){
    _xkPut(ws,rr,1,label,_xkSt({}));
    _xkPut(ws,rr,2,val,_xkSt({h:"right",bg:XLK_IN,bold:true}),{fmt:fmt});
    _xkPut(ws,rr,3,note||"",_xkSt({color:"FF666666",sz:9}));
    ST[key]="'"+XLK.set+"'!$B$"+rr;rr++;
  }
  var bitSSR=parseFloat((document.getElementById("sBitSSR")||{}).value)||46500,bitCur=parseFloat((document.getElementById("sBitCur")||{}).value)||46500;
  XK_NAMEREF=null;
  (function(){
    var nmv=((document.getElementById("pName")||{}).value||"");
    ws.mergeCells(rr,2,rr,3);
    _xkPut(ws,rr,1,"Name of Work",_xkSt({bold:true}));
    _xkPut(ws,rr,2,nmv,_xkSt({bg:XLK_IN,bold:true}));
    ws.getCell(rr,3).border={top:XL_BRD,right:XL_BRD,bottom:XL_BRD};
    ws.getCell(rr,2).alignment={horizontal:"left",vertical:"middle",wrapText:true};
    ws.getRow(rr).height=Math.max(18,_xlRowH(_xlLines(nmv,58,10),10));
    XK_NAMEREF="'"+XLK.set+"'!$B$"+rr;XK_NAMEVAL=_xkNorm(nmv);rr+=2;
  })();
  setRow("gst","GST %",_xkNum(S.gst),"");
  setRow("contMode","Contingencies mode (pct / amt)",S.contMode==="amt"?"amt":"pct","pct = % of A, amt = fixed Rs.");
  setRow("cont","Contingencies value",_xkNum(S.cont),"");
  setRow("li","Labour Insurance %",_xkNum(S.li),"");
  setRow("royS","Royalty \u2014 Sand (Rs per M3)",_xkNum(S.royS),"");
  setRow("royC","Royalty \u2014 Coarse aggregate (Rs per M3)",_xkNum(S.royC),"");
  setRow("gstBase","GST on (A or ABC)",window.GST_BASE==="ABC"?"ABC":"A","A = Cost of Work, ABC = A + Royalty + Testing");
  setRow("mtf","Material Testing total (Rs)",Math.round(window._mtfTotalVal||0),"live from the Testing sheet");
  setRow("area1","Area % (1)",_xkNum(S.areaPct),S.areaLbl||"");
  setRow("area2","Area % (2)",_xkNum(S.areaPct2),S.areaLbl2||"");
  setRow("bitHeat","Bitumen heating & decanning (Rs / MT)",_xkNum(typeof BIT_HEAT_VAL!=="undefined"?BIT_HEAT_VAL:0),"");
  setRow("bitSSR","Bitumen SSR rate (Rs / MT)",bitSSR,"");
  setRow("bitCur","Bitumen current rate (Rs / MT)",bitCur,"");
  _xkPut(ws,rr,1,"Bitumen rate change",_xkSt({}));
  _xkPut(ws,rr,2,_xkF(ST.bitCur+"-"+ST.bitSSR,bitCur-bitSSR),_xkSt({h:"right"}),{fmt:XK_F2});
  _xkPut(ws,rr,3,"= current \u2212 SSR",_xkSt({color:"FF666666",sz:9}));ST.bitChg="'"+XLK.set+"'!$B$"+rr;rr+=2;
  var ex=(S.extraRows||[]).filter(function(e){return extraOn(e);});
  ST.extra=[];
  if(ex.length){
    _xkPut(ws,rr,1,"Extra rows (label)",_xkSt({bold:true,bg:"FFF2F2F2"}));_xkPut(ws,rr,2,"Mode / value",_xkSt({bold:true,bg:"FFF2F2F2"}));_xkPut(ws,rr,3,"(pct = %, amt = Rs.)",_xkSt({bold:true,bg:"FFF2F2F2"}));rr++;
    ex.forEach(function(e){
      _xkPut(ws,rr,1,e.lbl||"Extra",_xkSt({}));
      _xkPut(ws,rr,2,e.mode==="amt"?_xkNum(e.amt):_xkNum(e.pct),_xkSt({h:"right",bg:XLK_IN,bold:true}));
      _xkPut(ws,rr,3,e.mode==="amt"?"amt":"pct",_xkSt({bg:XLK_IN}));
      ST.extra.push({lbl:e.lbl||"Extra",val:"'"+XLK.set+"'!$B$"+rr,mode:"'"+XLK.set+"'!$C$"+rr,e:e});rr++;
    });
  }
  ws.pageSetup={paperSize:9,orientation:"portrait",fitToPage:true,fitToWidth:1,fitToHeight:0};

  XK_PLAIN=true;
  /* ═════ Lead Charges (km input + charge) ═════ */
  var lc=_xkSheet(wb,"lc",[40,16,13,26,16],"p1");
  _xkHead(lc,["Name of Item","Unit","Lead (km)","Location","Lead charges"]);
  LC_R0=lc.r;var lcRowOf={},matLcRow={},lcN=0;
  LCD.forEach(function(row,idx){
    var kmEl=document.getElementById("lkm_"+idx),locEl=document.getElementById("lloc_"+idx);
    var km=kmEl?(parseFloat(kmEl.value)||0):(LEAD_KM[(row.matKeys&&row.matKeys.length)?row.matKeys[0]:row.llKey]||0),loc=locEl?locEl.value:"";
    var chg=row.isBitumen?km*10:(row.llKey&&LL[row.llKey]?lkup(row.llKey,km):0);
    if(!(km>0&&chg>0))return;      /* lead 0 km => export madhe row yet nahi (print sarkhach) */
    var r=LC_R0+lcN;lcN++;lcRowOf[idx]=r;
    (row.matKeys||[]).forEach(function(mk){matLcRow[mk]=r;});lcKmAt[r]=km;
    var kmRef="$C"+r,f=row.isBitumen?("C"+r+"*10"):((row.llKey&&T[row.llKey])?_xkLkup(T[row.llKey],"C"+r):"0");
    _xkPut(lc.ws,r,1,row.name||"",_xkSt({sz:9.5}));
    _xkPut(lc.ws,r,2,row.unit||"",_xkSt({sz:9.5,h:"right"}));
    _xkPut(lc.ws,r,3,km,_xkSt({h:"right",bg:XLK_IN,bold:true}),{fmt:"0.0"});
    _xkPut(lc.ws,r,4,loc,_xkSt({bg:XLK_IN,sz:9.5}));
    _xkPut(lc.ws,r,5,_xkF(f,chg),_xkSt({h:"right"}),{fmt:XK_F3});
  });
  lc.r=LC_R0+lcN+1;
  ctx.lcSheet=lc;
  _xkTail(lc);
  _xlSheetSetup(lc.ws,false,lc.headRow+":"+lc.headRow);

  XK_PLAIN=false;
  /* ═════ LeadTables ═════ */
  var lt=wb.addWorksheet(XLK.lt,{views:[{showGridLines:true}]});
  [16,24,10,14,3].forEach(function(w,i){lt.getColumn(i+1).width=w;});
  ["Material","Label","Lead km","Lead charge"].forEach(function(h,i){_xkPut(lt,1,i+1,h,_xkSt({bold:true,bg:"FFF2F2F2"}));});
  var matCharge={},matKm={};
  matKeys.forEach(function(mk,i){
    var r=2+i,kmv=LEAD_KM[mk]||0,lrow=matLcRow[mk];
    _xkPut(lt,r,1,mk,_xkSt({sz:9}));_xkPut(lt,r,2,LR[mk].label||mk,_xkSt({sz:9}));
    /* link km to the Lead Charges row only when it equals the km the app really uses for this material */
    var lcKm=lrow?lcKmAt[lrow]:null,linkOk=(lrow&&Math.abs((lcKm||0)-kmv)<1e-9);
    var kmCell=linkOk?_xkF("'"+XLK.lc+"'!$C$"+lrow,kmv):kmv;
    if(lrow&&!linkOk)ctx.static.push("km:"+mk);
    _xkPut(lt,r,3,kmCell,_xkSt({h:"right",sz:9,bg:linkOk?null:XLK_IN}),{fmt:"0.0"});
    _xkPut(lt,r,4,_xkF(_xkLkup(T[mk],"C"+r),lkup(mk,kmv)),_xkSt({h:"right",sz:9}),{fmt:XK_F3});
    matCharge[mk]="'"+XLK.lt+"'!$D$"+r;
  });
  tk.forEach(function(k){
    var t=T[k];
    lt.mergeCells(1,t.kc,1,t.cc);_xkPut(lt,1,t.kc,k+(LR[k]?" \u2014 "+(LR[k].label||""):""),_xkSt({bold:true,bg:"FFF2F2F2",sz:9}));
    _xkPut(lt,2,t.kc,"km",_xkSt({bold:true,sz:9}));_xkPut(lt,2,t.cc,"charge",_xkSt({bold:true,sz:9}));
    LL[k].forEach(function(p,i){lt.getCell(3+i,t.kc).value=p[0];lt.getCell(3+i,t.cc).value=p[1];});
    lt.getColumn(t.kc).width=8;lt.getColumn(t.cc).width=11;
  });
  lt.getCell(1,5).value=null;
  /* bitumen km cell */
  var bitKmVal=LEAD_KM.bitumen||0,bitKmRef=(matLcRow.bitumen&&Math.abs((lcKmAt[matLcRow.bitumen]||0)-bitKmVal)<1e-9)?("'"+XLK.lc+"'!$C$"+matLcRow.bitumen):null;

  var _xkSsrTxt=function(it){
    try{if(typeof window.ATP_ssrBandText==="function")return window.ATP_ssrBandText(it);}catch(e){}
    var pm=window.ATP_SSR_PAGES||{},pg=it.pg||pm[String(it.no)]||"";
    return "SSR OF "+(window.ATP_SSR_YEAR||"2022-23")+" ITEM NO. "+it.no+(pg?" & PAGE NO."+pg:"");
  };
  XK_PLAIN=true;
  /* ═════ Measurements ═════ */
  var MQF=(typeof atpQXlFmt==="function")?atpQXlFmt():XK_F3;   /* 2 / 3 digit chosen in the Measurement tab */
  var mN2=(typeof atpN2On==="function"&&atpN2On())?1:0;   /* second "No." column on -> extra column after No.; L/W/H/Qty/Unit/Fl/Ded shift right by 1 */
  var mcL=6+mN2,mcW=7+mN2,mcH=8+mN2,mcQ=9+mN2,mcU=10+mN2,mcF=11+mN2,mcD=12+mN2,mQL=_xkA(mcQ);
  var MSW=[6,9,14,34,9,10,10,10,13,16,5,5];if(mN2)MSW.splice(5,0,9);
  var ms=_xkSheet(wb,"ms",MSW,"p5");
  ms.ws.getColumn(mcF).hidden=true;ms.ws.getColumn(mcD).hidden=true;   /* Fl / Ded helper columns (formulas still use them) */
  _xkHead(ms,mN2?["Sr.","Item No.","Floor","Detail","No.","No.","Length","Width","Height","Quantity","Unit","Fl","Ded"]:["Sr.","Item No.","Floor","Detail","No.","Length","Width","Height","Quantity","Unit","Fl","Ded"]);
  var FLBL=["G","1st","2nd","3rd","4th"],msRowAddr=[],msTot=[],msFirst=[],msLast=[];
  /* pass 1: row numbers */
  var rnow=ms.r;
  I.forEach(function(it,i){
    if(!it.rows||!it.rows.length){msRowAddr[i]=null;return;}
    var rows=it.rows.filter(function(r){return !r.isTot;});
    var info={hdr:rnow,ssr:0,rows:[]};rnow++;info.ssr=rnow;rnow++;   /* grey SSR line under the item description */
    rows.forEach(function(r){info.rows.push({r:r,xr:rnow});rnow++;});
    info.sp=rnow;rnow++;   /* thin spacer: Excel madhe navin row ya spacer chya var Insert kela tar SUM range auto expand hoto */
    info.tot=rnow;rnow++;msRowAddr[i]=info;
  });
  function msQ(i,ri){ /* address of qty cell of item i, row index ri (index within non-isTot rows) */
    var info=msRowAddr[i];return info&&info.rows[ri]?(mQL+info.rows[ri].xr):null;}
  var msModelBad=0;
  I.forEach(function(it,i){
    var info=msRowAddr[i];if(!info)return;
    var rows=info.rows,ws2=ms.ws,hr=info.hdr;
    var bg="FFF0F4FF";
    _xkPut(ws2,hr,1,i+1,_xkSt({bold:true,h:"center",bg:bg}));_xkPut(ws2,hr,2,it.no,_xkSt({bold:true,bg:bg}));
    ws2.mergeCells(hr,3,hr,mcQ);_xkPut(ws2,hr,3,it.desc,_xkSt({bold:true,sz:9.5,bg:bg,v:"top"}));
    for(var c=4;c<=mcQ;c++)ws2.getCell(hr,c).border={top:XL_BRD,left:XL_BRD,bottom:XL_BRD,right:XL_BRD};
    _xkPut(ws2,hr,mcU,it.unit||"",_xkSt({sz:9,bg:bg,v:"top"}));
    ws2.getRow(hr).height=_xlRowH(_xlLines(it.desc,_xlSumW(ms.colW,3,mcQ),9.5),9.5);
    /* grey SSR line (same as the PDF) */
    _xkPut(ws2,info.ssr,1,"",_xkSt({bg:"FFD9D9D9"}));_xkPut(ws2,info.ssr,2,"",_xkSt({bg:"FFD9D9D9"}));
    ws2.mergeCells(info.ssr,3,info.ssr,mcQ);_xkPut(ws2,info.ssr,3,_xkSsrTxt(it),_xkSt({sz:9,bg:"FFD9D9D9",v:"middle"}));
    for(var c2=4;c2<=mcQ;c2++)ws2.getCell(info.ssr,c2).border={top:XL_BRD,left:XL_BRD,bottom:XL_BRD,right:XL_BRD};
    _xkPut(ws2,info.ssr,mcU,"",_xkSt({sz:9,bg:"FFD9D9D9"}));
    ws2.getRow(info.ssr).height=15;
    var lastFl=null,nonPct=[];
    rows.forEach(function(o){if(!o.r.isPct)nonPct.push(o);});
    /* non-% rows -> consecutive segments as ranges; first segment starts at header row, last (if it ends at last row) runs to spacer */
    var segs=[],cur=null;
    rows.forEach(function(o,k){
      if(o.r.isPct){cur=null;return;}
      if(!cur){cur={a:o.xr,b:o.xr,first:(k===0)};segs.push(cur);}else cur.b=o.xr;
      if(k===rows.length-1)cur.toSp=true;
    });
    var sumNonPct=segs.map(function(g){
      var a=g.first?hr:g.a,b=g.toSp?info.sp:g.b;
      return a===b?(mQL+a):(mQL+a+":"+mQL+b);
    }).join(",");
    rows.forEach(function(o,ri){
      var r=o.r,xr=o.xr,fl=r.fl!=null?r.fl:0,st=_xkSt({sz:9.5}),stR=_xkSt({sz:9.5,h:"right"}),stIn=_xkSt({sz:9.5,h:"right",bg:XLK_IN});
      var flb=flLabel(it,fl,FLBL);
      _xkPut(ws2,xr,1,"",st);_xkPut(ws2,xr,2,"",st);
      _xkPut(ws2,xr,3,(lastFl!==fl)?flb:"",_xkSt({sz:9.5,bold:true}));lastFl=fl;
      _xkPut(ws2,xr,4,r.lbl||"",st);
      if(mN2)_xkPut(ws2,xr,6,"",stR);   /* second No. column (blank unless filled below) */
      _xkPut(ws2,xr,mcU,"",st);
      _xkPut(ws2,xr,mcF,fl,_xkSt({sz:8,color:"FF888888",h:"center"}));
      var qv=r.qty||0,f,model;
      if(r.isPct){
        var fac=msrPctIsFactor(r),pv=fac?msrPctFactorVal(r):(r.pct!=null?r.pct:0);
        _xkPut(ws2,xr,5,pv,stIn,{fmt:fac?"0.0000":"0.##"});
        _xkPut(ws2,xr,mcL,fac?"factor":"%",_xkSt({sz:9,h:"center"}));
        var base,baseRef;
        var src=(r.pctSrc!=null)?r.pctSrc:"self";
        if(src==="self"||src===""){baseRef=sumNonPct?("ROUND(SUM("+sumNonPct+"),3)"):"0";base=msrPctBase(i,r);}
        else{var si=parseInt(src,10);baseRef=(msRowAddr[si]&&si!==i)?(mQL+msRowAddr[si].tot):null;base=msrPctBase(i,r);}
        if(baseRef===null){_xkPut(ws2,xr,mcW,base,stR,{fmt:MQF});_xkPut(ws2,xr,mcQ,qv,_xkSt({sz:9.5,h:"right",bold:true}),{fmt:MQF});return;}
        _xkPut(ws2,xr,mcW,_xkF(baseRef,base),_xkSt({sz:9,h:"right",color:"FF6A1B9A"}),{fmt:MQF});
        _xkPut(ws2,xr,mcH,"",st);
        f="ROUND("+_xkA(mcW)+xr+"*E"+xr+(fac?"":"/100")+",3)";
        model=Math.round(base*(fac?pv:pv/100)*1000)/1000;
        _xkPut(ws2,xr,mcQ,_xkF(f,qv),_xkSt({sz:9.5,h:"right",bold:true,color:"FF6A1B9A"}),{fmt:MQF});
        if(Math.abs(model-qv)>0.0005)msModelBad++;
        return;
      }
      _xkPut(ws2,xr,mcD,r.isDeduct?"D":"",_xkSt({sz:8,color:"FF888888",h:"center",bg:XLK_IN}));
      var lf=r._linkedFrom,lfl=lf?msrLinkFieldsOf(r):[];
      if(lf&&lfl.indexOf("qty")>-1){
        var sA=msQ(lf.iIdx,msRowIdxIn(lf.iIdx,lf.rIdx));
        var lp=(lf.pct!=null?lf.pct:100);
        _xkPut(ws2,xr,5,"",stR);_xkPut(ws2,xr,mcL,"",stR);_xkPut(ws2,xr,mcW,"",stR);_xkPut(ws2,xr,mcH,lp+"%",_xkSt({sz:9,h:"right",color:"FF1565C0"}));
        if(sA){_xkPut(ws2,xr,mcQ,_xkF("ROUND("+sA+"*"+lp+"/100,3)",qv),_xkSt({sz:9.5,h:"right",bold:true,color:"FF1565C0"}),{fmt:MQF});}
        else _xkPut(ws2,xr,mcQ,qv,_xkSt({sz:9.5,h:"right",bold:true}),{fmt:MQF});
        return;
      }
      /* normal / deduction row (field links → reference source cell) */
      var cols=[["n",5]].concat(mN2?[["n2",6]]:[]).concat([["l",mcL],["b",mcW],["d",mcH]]),vals={n:mN2?(r.n||1):(r.n||1)*(r.n2||1),n2:(r.n2!=null?r.n2:""),l:(r.l||0),b:(r.b||0),d:(r.d||0)};
      cols.forEach(function(cc){
        var fld=cc[0],col=cc[1],v=vals[fld],ref=null;
        if(lf&&lfl.indexOf(fld)>-1){
          var sinfo=msRowAddr[lf.iIdx],sidx=msRowIdxIn(lf.iIdx,lf.rIdx);
          if(sinfo&&sidx>=0&&sinfo.rows[sidx])ref=_xkA(col)+sinfo.rows[sidx].xr;
        }
        var shown=(fld==="n")?v:((v===0||v===null)?"":v);
        if(ref)_xkPut(ws2,xr,col,_xkF(ref,(fld==="n")?v:(v||0)),_xkSt({sz:9.5,h:"right",color:"FF1565C0"}),{fmt:"0.###"});
        else if(fld==="n"&&!mN2&&r.n2!=null&&(r.n2||1)!==1)_xkPut(ws2,xr,col,_xkF((r.n||1)+"*"+(r.n2||1),v),stIn,{fmt:"0.###"});   /* No. x No.2 */
        else _xkPut(ws2,xr,col,shown,stIn,{fmt:"0.###"});
      });
      var qcs=['E'].concat(mN2?['F']:[]).concat([_xkA(mcL),_xkA(mcW),_xkA(mcH)]);
      f='IF('+_xkA(mcD)+xr+'="D",-1,1)*ROUND('+qcs.map(function(c){return 'IF('+c+xr+'=0,1,'+c+xr+')';}).join('*')+',3)';
      var t=vals.n;if(mN2&&r.n2)t*=r.n2;if(vals.l)t*=vals.l;if(vals.b)t*=vals.b;if(vals.d)t*=vals.d;
      model=(r.isDeduct?-1:1)*Math.round(t*1000)/1000;
      if(Math.abs(model-qv)>0.0005){msModelBad++;_xkPut(ws2,xr,mcQ,qv,_xkSt({sz:9.5,h:"right",bold:true}),{fmt:MQF});}
      else _xkPut(ws2,xr,mcQ,_xkF(f,qv),_xkSt({sz:9.5,h:"right",bold:true,color:r.isDeduct?"FFC62828":"FF000000"}),{fmt:MQF});
    });
    /* total row */
    var tr=info.tot,rngs=mQL+hr+":"+mQL+info.sp;
    /* spacer row (thin, no values) */
    for(var cs=1;cs<=mcU;cs++){var spc=ws2.getCell(info.sp,cs);spc.border={left:XL_BRD,right:XL_BRD};}
    ws2.getRow(info.sp).height=4;
    ws2.mergeCells(tr,1,tr,mcH);
    _xkPut(ws2,tr,1,"Total Quantity",_xkSt({bold:true,h:"right",sz:9.5,bg:"FFF7F7F7"}));
    for(var c2=2;c2<=mcH;c2++)ws2.getCell(tr,c2).border={top:XL_BRD,left:XL_BRD,bottom:XL_BRD,right:XL_BRD};
    _xkPut(ws2,tr,mcQ,_xkF("ROUND(SUM("+rngs+"),3)",it.qty),_xkSt({bold:true,h:"right",bg:"FFF7F7F7"}),{fmt:MQF});
    _xkPut(ws2,tr,mcU,it.unit||"",_xkSt({sz:9,bg:"FFF7F7F7"}));
    msTot[i]=mQL+tr;msFirst[i]=hr;msLast[i]=info.sp;
  });
  function msRowIdxIn(i,rawIdx){ /* it.rows index (incl. isTot) → index within non-isTot rows */
    var it2=I[i];if(!it2||!it2.rows)return -1;var k=0,j;
    for(j=0;j<it2.rows.length;j++){if(j===rawIdx)return it2.rows[j].isTot?-1:k;if(!it2.rows[j].isTot)k++;}
    return -1;}
  ms.r=rnow+1;
  ms.ws.getColumn(mcF).width=5;ms.ws.getColumn(mcD).width=5;
  _xkTail(ms);
  _xlSheetSetup(ms.ws,false,ms.headRow+":"+ms.headRow);
  ms.ws.pageSetup.printArea="A1:"+_xkA(mcU)+(ms.r+30);
  ctx.msModelBad=msModelBad;

  /* ═════ Rate Analysis ═════ */
  var ra=_xkSheet(wb,"ra",[6,9,56,16,26],"p4");
  _xkHead(ra,["Sr.","Item No.","Rate Component","Rate (Rs.)","Unit / note"]);
  var raFinal=[],raFloor=[],raBase=[],raStatic=[];
  var raBad=0;
  I.forEach(function(it,i){
    var ws3=ra.ws,r=ra.r,bg="FFF0F4FF";
    _xkPut(ws3,r,1,i+1,_xkSt({bold:true,h:"center",bg:bg}));_xkPut(ws3,r,2,it.no,_xkSt({bold:true,bg:bg}));
    ws3.mergeCells(r,3,r,5);_xkPut(ws3,r,3,it.desc,_xkSt({bold:true,sz:9.5,bg:bg,v:"top"}));
    ws3.getCell(r,4).border=ws3.getCell(r,5).border={top:XL_BRD,left:XL_BRD,bottom:XL_BRD,right:XL_BRD};
    ws3.getRow(r).height=_xlRowH(_xlLines(it.desc,_xlSumW(ra.colW,3,5),9.5),9.5);r++;
    var lead=it.leadMats||[],useStatic=!!it.cessOn;
    var stL=_xkSt({sz:9.5}),stV=_xkSt({sz:9.5,h:"right"}),stN=_xkSt({sz:9,color:"FF666666"});
    function row(lbl,val,note,o){
      o=o||{};
      _xkPut(ws3,r,1,"",stL);_xkPut(ws3,r,2,"",stL);
      _xkPut(ws3,r,3,lbl,_xkSt({sz:9.5,bold:!!o.bold,bg:o.bg||null}));
      _xkPut(ws3,r,4,val,_xkSt({sz:9.5,h:"right",bold:!!o.bold,bg:o.bg||(o.inp?XLK_IN:null),color:o.color||"FF000000"}),{fmt:XK_F2});
      _xkPut(ws3,r,5,note||"",stN);
      r++;return r-1;
    }
    /* ── CESS MODE: same rows as the on-screen Rate Analysis (SSR - Cess Deduction - Net Basic/Net Rate - % charges - Cess Addition - leads - Completed Rate), floor-wise ── */
    if(it.cessOn){
      var cNames=["Ground Floor","1st Floor","2nd Floor","3rd Floor","4th Floor"];
      var cBands=flBands(it),cSF=!!it.scadaFirst,cPN=cSF?"on Net Rate (after Cess & SCADA)":"on Net Basic";
      var cR2=function(v){return Math.round(v*100)/100;};
      var cFm=function(v){return cR2(Math.abs(v)).toFixed(2);};
      var cfl=[0];
      if(it.rows&&!gfOff(it)){it.rows.forEach(function(rw){if(!rw.isTot&&rw.fl&&rw.fl>0&&cfl.indexOf(rw.fl)<0)cfl.push(rw.fl);});}
      cfl.sort(function(a,b){return a-b;});
      var cxTot=0;(it.raExtra||[]).forEach(function(x){cxTot+=raxAmt(x);});
      raFloor[i]={};
      cfl.forEach(function(cf,ci){
        var cLbl=cBands?(cBands[cf]?cBands[cf].l:""):(cNames[cf]||("Floor "+cf));
        var cMulti=(cfl.length>1||cf>0);
        if(cMulti)row("\u2014 "+cLbl+" \u2014","","",{bold:true});
        var sR=row("SSR Rate",it.baseRate,it.unit||"");
        if(ci===0)raBase[i]="D"+sR;
        row(it.cessPct+"% Cess Deduction",-it.cessAmt,"",{color:"FFC62828"});
        if(!cSF)row("Net Basic Rate",it.netBasic,"",{bold:true});
        if(cSF){
          if(it.scadaVal)row("SCADA Deduction",it.scadaVal,"",{color:"FFC62828"});
          row("Net Rate (Basic - Cess - SCADA)",it.pctBase,"",{bold:true});
        }
        lead.forEach(function(m){
          if(!(m.mat==="area_pct"||m.mat==="area_pct2"||/^addon_/.test(m.mat)))return;
          var pl=/^addon_/.test(m.mat)?m.label:(m.factor+"% Area Charges ("+(m.mat==="area_pct"?S.areaLbl:S.areaLbl2)+")");
          if(m.del)pl+=" (deleted)";
          row(pl,m.del?0:m.add,cPN,{color:"FF6A1B9A"});
        });
        if(cf>0){
          if(cBands){var cp=(cBands[cf]&&cBands[cf].p)||0;row("+"+cp+"% Extra for "+cBands[cf].l,cR2(it.pctBase*cp/100),cPN,{color:"FF6A1B9A"});}
          else row(cf+"% "+cNames[cf]+" Rise Charges",cR2(it.pctBase*cf/100),cPN,{color:"FF6A1B9A"});
        }
        row(it.cessPct+"% Cess Addition",it.cessAmt,"",{color:"FF6A1B9A"});
        lead.forEach(function(m){
          if(m.mat==="area_pct"||m.mat==="area_pct2"||/^addon_/.test(m.mat))return;
          var cn=(m.mat==="bitumen_change")?(m.factor.toFixed(4)+" MT \u00d7 "+cFm(m.chg||0)):
            (m.factor+(m.conv!==1?" \u00d7 "+m.conv:"")+" \u00d7 "+((m.chg!==undefined&&m.chg>0)?cFm(m.chg):((m.km||0)+" km")));
          var ll=(m.mat==="bitumen_change"||m.mat==="bitumen_heat")?m.label:("Lead: "+m.label+" ( "+cn+" )");
          if(m.del)ll+=" (deleted)";
          var mv=m.del?0:m.add;
          row(ll,mv,"",{color:mv<0?"FFC62828":"FF6A1B9A"});
        });
        if(it.scadaVal&&!cSF)row("SCADA Deduction",it.scadaVal,"",{color:"FFC62828"});
        if(ci===0){(it.raExtra||[]).forEach(function(x){row((x.lbl||x.label||x.desc||"Extra row"),raxAmt(x),"");});}
        else if(cxTot)row("Extra Rows",cxTot,"",{color:cxTot<0?"FFC62828":"FF6A1B9A"});
        var cRate=flRateOf(it,cf,it.finalRate);
        var fr3=row("Completed Rate"+(cMulti?" ("+cLbl+")":""),cRate,"",{bold:true,bg:"FFF0FAF0",color:"FF1B5E20"});
        raFloor[i][cf]="D"+fr3;
        if(cf===0)raFinal[i]="D"+fr3;
      });
      raBad++;ctx.static.push(it.no);
      ws3.getRow(r).height=4;r++;
      ra.r=r;
      return;
    }
    var baseR=row("Base SSR Rate",it.baseRate,it.unit||"",{inp:true});raBase[i]="D"+baseR;
    var leadRows=[],areaRows=[],extraRows=[],scadaRow=null,model=0,sumLead=0;
    lead.forEach(function(m){
      var add=m.add,lbl,val=add,note="",fx=null;
      if(/^addon_/.test(m.mat)){var rwA=row(m.label,add,"on base rate only",{color:"FF6A1B9A"});areaRows.push("D"+rwA);return;}
      if(m.mat==="area_pct"||m.mat==="area_pct2"){
        lbl=m.label;note="on base rate only";
        if(!m.ov&&!useStatic)fx=_xkF("ROUND("+raBase[i]+"*"+(m.mat==="area_pct"?ST.area1:ST.area2)+"/100,2)",add);
        var rw=row(lbl,fx||add,note,{color:"FF6A1B9A"});areaRows.push("D"+rw);return;
      }
      if(m.mat==="bitumen"){
        lbl="Lead: "+m.label;note="lead km "+(m.km||0);
        if(!m.ov&&!useStatic&&bitKmRef)fx=_xkF(m.factor+"*"+bitKmRef+"*10",add);
      }else if(m.mat==="bitumen_heat"){
        lbl=m.label;note="";
        if(!m.ov&&!useStatic)fx=_xkF(m.factor+"*"+ST.bitHeat,add);
      }else if(m.mat==="bitumen_change"){
        lbl=m.label;note="";
        if(!m.ov&&!useStatic)fx=_xkF(m.factor+"*"+ST.bitChg,add);
      }else{
        lbl="Lead: "+m.label+" ( "+m.factor+(m.conv!==1?" \u00d7 "+m.conv:"")+" \u00d7 lead rate )";
        if(!m.ov&&!useStatic&&matCharge[m.mat])fx=_xkF(m.factor+"*"+m.conv+"*"+matCharge[m.mat],add);
        note="lead km "+(m.km||0);
      }
      if(m.del){lbl=lbl+" (deleted)";fx=null;val=0;}
      var rw2=row(lbl,fx||val,note,{color:add<0?"FFC62828":"FF6A1B9A"});leadRows.push("D"+rw2);
    });
    if(it.scadaVal){scadaRow="D"+row("SCADA Deduction",it.scadaVal,"",{inp:true,color:"FFC62828"});}
    (it.raExtra||[]).forEach(function(x){extraRows.push("D"+row((x.lbl||x.label||x.desc||"Extra row"),raxAmt(x),"",{inp:true}));});
    /* Final rate */
    var parts=["ROUND("+raBase[i]+(leadRows.length?"+"+leadRows.join("+"):"")+(scadaRow?"+"+scadaRow:"")+",2)"];
    var finalF="ROUND("+parts[0]+(areaRows.length?"+"+areaRows.join("+"):"")+(extraRows.length?"+"+extraRows.join("+"):"")+",2)";
    /* model check in JS */
    var m1=Math.round((it.baseRate+lead.filter(function(m){return !/^area_/.test(m.mat);}).reduce(function(s,m){return s+m.add;},0)+(it.scadaVal||0))*100)/100;
    var m2=m1;lead.filter(function(m){return /^area_/.test(m.mat);}).forEach(function(m){m2=Math.round((m2+m.add)*100)/100;});
    var xs=(it.raExtra||[]).reduce(function(s,x){return s+raxAmt(x);},0);if(xs)m2=Math.round((m2+xs)*100)/100;
    var okModel=Math.abs(m2-it.finalRate)<0.006&&!it.cessOn;
    if(!okModel){raBad++;ctx.static.push(it.no);}
    var fr=row("Final Rate ("+(flBands(it)?flBands(it)[0].l:"Ground Floor")+")",okModel?_xkF(finalF,it.finalRate):it.finalRate,"",{bold:true,bg:"FFF0FAF0",color:"FF1B5E20"});
    raFinal[i]="D"+fr;raFloor[i]={0:"D"+fr};
    /* floor rows (floors used in rows) */
    var usedF={};
    if(it.rows&&!gfOff(it))it.rows.forEach(function(rw){if(!rw.isTot&&rw.fl&&rw.fl>0&&(rw.qty||0))usedF[rw.fl]=1;});
    var bands=flBands(it);
    Object.keys(usedF).map(Number).sort().forEach(function(fx){
      var fRate=flRateOf(it,fx,it.finalRate),fFormula=null;
      if(okModel){
        if(bands){var p=(bands[fx]&&bands[fx].p)||0;fFormula="ROUND(D"+fr+"+"+raBase[i]+"*"+p+"/100,2)";}
        else fFormula="ROUND(D"+fr+"*(1+"+fx+"/100),2)";
        var chk=bands?Math.round((it.finalRate+(it.baseRate||0)*((bands[fx]&&bands[fx].p)||0)/100)*100)/100:Math.round(it.finalRate*(1+fx/100)*100)/100;
        if(Math.abs(chk-fRate)>0.006)fFormula=null;
      }
      var lbl=bands?("Final Rate ("+bands[fx].l+")  [+"+bands[fx].p+"% on SSR base]"):("Final Rate ("+(["Ground","1st Floor","2nd Floor","3rd Floor","4th Floor"][fx])+")  [+"+fx+"% on GF rate]");
      var fr2=row(lbl,fFormula?_xkF(fFormula,fRate):fRate,"",{bold:true,bg:"FFF0FAF0",color:"FF1B5E20"});
      raFloor[i][fx]="D"+fr2;
    });
    ws3.getRow(r).height=4;r++;
    ra.r=r;
  });
  _xkTail(ra);
  _xlSheetSetup(ra.ws,false,ra.headRow+":"+ra.headRow);
  ctx.raBad=raBad;

  /* ═════ Abstract ═════ */
  var cols=gfonly?[6,9,52,12,13,15,16]:[6,9,52,12,12,13,15,16];
  var ab=_xkSheet(wb,"ab",cols,"p3");
  _xkHead(ab,gfonly?["Sr.","Item No.","Description","Unit","Qty","Final Rate","Amount"]:["Sr.","Item No.","Description","Unit","Floor","Qty","Final Rate","Amount"]);
  var grpTotal=0,cQ=gfonly?5:6,cR=gfonly?6:7,cA=gfonly?7:8,amtCells=[],abR0=ab.r,abBad=0;
  I.forEach(function(it,i){
    var ws4=ab.ws,info=msRowAddr[i];
    var floorQ={},hasUpper=false;
    if(it.rows)it.rows.forEach(function(rw){if(rw.isTot)return;var q=rw.qty||0;if(!q)return;var fl=rw.fl!=null?rw.fl:0;if(fl>0)hasUpper=true;floorQ[fl]=(floorQ[fl]||0)+q;});
    if(gfOff(it))hasUpper=false;
    var fls=hasUpper?Object.keys(floorQ).map(Number).sort():[0];
    var grpAmt=[];
    fls.forEach(function(fl,k){
      var r=ab.r,q,qf=null,rate,rf=null;
      if(hasUpper){
        q=Math.round(floorQ[fl]*1000)/1000;
        if(info&&msFirst[i])qf=_xkF("ROUND(SUMIFS('"+XLK.ms+"'!$"+mQL+"$"+msFirst[i]+":$"+mQL+"$"+msLast[i]+",'"+XLK.ms+"'!$"+_xkA(mcF)+"$"+msFirst[i]+":$"+_xkA(mcF)+"$"+msLast[i]+","+fl+"),3)",q);
        rate=flRateOf(it,gfOff(it)?0:fl,it.finalRate);
        var rc=raFloor[i]&&raFloor[i][fl];if(rc)rf=_xkF("'"+XLK.ra+"'!$"+rc.charAt(0)+"$"+rc.substring(1),rate);
      }else{
        q=it.qty;if(info)qf=_xkF("'"+XLK.ms+"'!$"+msTot[i].charAt(0)+"$"+msTot[i].substring(1),q);
        rate=it.finalRate;rf=_xkF("'"+XLK.ra+"'!$"+raFinal[i].charAt(0)+"$"+raFinal[i].substring(1),rate);
      }
      var amt=Math.round(q*rate);   /* whole rupee per row (e.g. 68.75 x 8374.78 = 575766.00) */
      var first=(k===0),fst=_xkSt({sz:9.5,v:"top"});
      _xkPut(ws4,r,1,first?i+1:"",_xkSt({bold:true,h:"center",v:"top"}));
      _xkPut(ws4,r,2,first?it.no:"",_xkSt({bold:true,v:"top"}));
      _xkPut(ws4,r,3,first?it.desc:"",_xkSt({sz:9.5,v:"top"}));
      _xkPut(ws4,r,4,first?(it.unit||""):"",_xkSt({sz:9,v:"top"}));
      if(!gfonly)_xkPut(ws4,r,5,hasUpper?flLabel(it,fl,["Ground Floor","1st Floor","2nd Floor","3rd Floor","4th Floor"]):(first?"Ground Floor":""),_xkSt({sz:9,h:"center",v:"top"}));
      _xkPut(ws4,r,cQ,qf||q,_xkSt({h:"right",v:"top"}),{fmt:XK_F3});
      _xkPut(ws4,r,cR,rf||rate,_xkSt({h:"right",v:"top"}),{fmt:XK_F2});
      var qa=_xkA(cQ)+r,ra2=_xkA(cR)+r;
      _xkPut(ws4,r,cA,(qf&&rf)?_xkF("ROUND("+qa+"*"+ra2+",0)",amt):amt,_xkSt({h:"right",bold:true,v:"top"}),{fmt:"#,##0.00"});
      amtCells.push(_xkA(cA)+r);grpAmt.push(amt);
      var hAb=15;
      if(first){hAb=_xlRowH(_xlLinesFit(it.desc,ab.colW[2],9.5,false),9.5);hAb=Math.max(hAb,_xlRowH(_xlLinesFit(it.unit||"",ab.colW[3],9,false),9));}
      ws4.getRow(r).height=hAb;
      ab.r=r+1;
      if(first){   /* grey SSR line under the description (same as the PDF) */
        var br=ab.r,gc=gfonly?7:8,cb;
        for(cb=1;cb<=gc;cb++)_xkPut(ws4,br,cb,cb===3?_xkSsrTxt(it):"",_xkSt({sz:9,bg:"FFD9D9D9",v:"middle"}));
        ws4.getRow(br).height=15;
        ab.r=br+1;
      }
    });
    var sumA=grpAmt.reduce(function(a,b){return a+b;},0);grpTotal+=sumA;
    if(Math.abs(sumA-it.amount)>fls.length)abBad++;
  });
  var tr2=ab.r;
  ab.ws.mergeCells(tr2,1,tr2,cA-1);
  _xkPut(ab.ws,tr2,1,"Total =",_xkSt({bold:true,h:"right"}));
  for(var cc2=2;cc2<cA;cc2++)ab.ws.getCell(tr2,cc2).border={top:XL_BRD,left:XL_BRD,bottom:XL_BRD,right:XL_BRD};
  var totA=I.reduce(function(s,it){return s+it.amount;},0);
  totA=Math.round(grpTotal*100)/100;
  _xkPut(ab.ws,tr2,cA,_xkF("SUM("+_xkA(cA)+abR0+":"+_xkA(cA)+(tr2-1)+")",totA),_xkSt({bold:true,h:"right",bg:"FFF2F2F2"}),{fmt:"#,##0.00"});
  var absTot="'"+XLK.ab+"'!$"+_xkA(cA)+"$"+tr2;
  ab.r=tr2+1;
  var abTotRow=tr2;   /* tail + page setup are done after the [B] Royalty/Testing block is added (see below) */
  ctx.abBad=abBad;

  /* ═════ Consumption + Royalty (live: qty = Measurements total, net = qty x factor, royalty = net x Settings rate) ═════ */
  /* first 5 columns (Sr / Item / Description / Unit / Total Qty), merged over the item's material rows */
  function xkLeft5(sh,r1,r2,i,it,desc){
    var ws=sh.ws,n=r2-r1+1,c;
    var qref=msTot[i]?("'"+XLK.ms+"'!$"+msTot[i].charAt(0)+"$"+msTot[i].substring(1)):null;
    for(c=1;c<=5;c++){
      if(c===5)_xkPut(ws,r1,c,qref?_xkF(qref,it.qty):it.qty,_xkSt({sz:9.5,v:"top",h:"right"}),{fmt:XK_F3});
      else _xkPut(ws,r1,c,[i+1,it.no,desc,it.unit||""][c-1],_xkSt({sz:c===3?9.5:9.5,v:"top",bold:c<=2,h:c===1?"center":"left"}));
      if(n>1){ws.mergeCells(r1,c,r2,c);_xlBorderRange(ws,r1,c,r2,c,{top:XL_BRD,left:XL_BRD,bottom:XL_BRD,right:XL_BRD});}
    }
    var need=_xlRowH(_xlLinesFit(desc,sh.colW[2],9.5,false),9.5),per=Math.max(15,Math.ceil(need/n)),q;
    for(q=r1;q<=r2;q++)ws.getRow(q).height=per;
    return "$E$"+r1;
  }
  function xkHead2(sh,labs,al){
    labs.forEach(function(l,k){_xkPut(sh.ws,sh.r,k+1,l,_xkSt({bold:true,bg:"FFF2F2F2",h:al[k]}));});
    sh.ws.getRow(sh.r).height=22;sh.headRow=sh.r;sh.r++;
  }
  XK_PLAIN=true;
  var ccS=_xkSheet(wb,"cc",[6,9,46,12,11,18,10,12,8],"p6"),ccAddr={},ccTop={};
  xkHead2(ccS,["Sr.","Item No.","Description","Unit","Total Qty","Material","Factor","Net Qty","Unit"],["center","left","left","left","right","left","right","right","left"]);
  I.forEach(function(it,i){
    var cf=effCF(it),mats=[],j;
    for(j=0;j<CF_MATS.length;j++){var f0=cf[CF_MATS[j]]||0;if(f0>0)mats.push({k:CF_MATS[j],lbl:CF_MAT_LABELS[j],u:CF_MAT_UNITS[j]||"",f:f0});}
    if(!mats.length)return;
    var r1=ccS.r,r2=r1+mats.length-1,dsc=(it.desc||"").length>100?(it.desc||"").substring(0,100)+"...":(it.desc||"");
    var qa=xkLeft5(ccS,r1,r2,i,it,dsc);ccAddr[i]={};ccTop[i]=r1;
    mats.forEach(function(m,k){
      var r=r1+k,nq=Math.round(m.f*it.qty*1000)/1000,P=qa+"*G"+r;
      if(nq===0&&m.f*it.qty>0)nq=Math.round(m.f*it.qty*100000)/100000;
      _xkPut(ccS.ws,r,6,m.lbl,_xkSt({sz:9.5}));
      _xkPut(ccS.ws,r,7,m.f,_xkSt({sz:9.5,h:"right"}),{fmt:"0.000###"});
      _xkPut(ccS.ws,r,8,_xkF("IF(AND(ROUND("+P+",3)=0,"+P+">0),ROUND("+P+",5),ROUND("+P+",3))",nq),_xkSt({sz:9.5,h:"right",bold:true}));
      _xkPut(ccS.ws,r,9,m.u,_xkSt({sz:9}));
      ccAddr[i][m.k]=r;
    });
    ccS.r=r2+1;
  });
  ccS.r++;
  _xkTail(ccS);
  _xlSheetSetup(ccS.ws,false,ccS.headRow+":"+ccS.headRow);

  var ryS=_xkSheet(wb,"ry",[6,9,46,12,11,22,10,12,14],"p7"),royModel=0,sandCells=[],coarseCells=[];
  xkHead2(ryS,["Sr.","Item No.","Description","Unit","Total Qty","Material","Factor","Net Qty","Royalty"],["center","left","left","left","right","left","right","right","right"]);
  I.forEach(function(it,i){
    var cf=effCF(it),sF=(cf.scr_sand||0)+(cf.sand||0)+(cf.quarry||0),cF=royCoarseF(cf),rows=[];
    if(sF>0)rows.push({grp:"sand",lbl:"Sand (M3)",f:sF,keys:ROY_SAND_KEYS,rate:ST.royS,rr:S.royS});
    if(cF>0)rows.push({grp:"coarse",lbl:"Coarse Aggregate (M3)",f:cF,keys:ROY_COARSE_KEYS,rate:ST.royC,rr:S.royC});
    if(!rows.length)return;
    var r1=ryS.r,r2=r1+rows.length-1,dsc=(it.desc||"").length>110?(it.desc||"").substring(0,110)+"...":(it.desc||"");
    var qa=xkLeft5(ryS,r1,r2,i,it,dsc);
    rows.forEach(function(m,k){
      var r=r1+k,nq=Math.round(m.f*it.qty*1000)/1000,roy=Math.round(nq*m.rr);royModel+=roy;
      var links=m.keys.filter(function(kk){return ccAddr[i]&&ccAddr[i][kk];}).map(function(kk){return "'"+XLK.cc+"'!$G$"+ccAddr[i][kk];});
      _xkPut(ryS.ws,r,6,m.lbl,_xkSt({sz:9.5}));
      _xkPut(ryS.ws,r,7,links.length?_xkF(links.join("+"),m.f):m.f,_xkSt({sz:9.5,h:"right"}),{fmt:"0.000"});
      _xkPut(ryS.ws,r,8,_xkF("ROUND(G"+r+"*"+qa+",3)",nq),_xkSt({sz:9.5,h:"right"}),{fmt:XK_F3});
      _xkPut(ryS.ws,r,9,_xkF("ROUND(H"+r+"*"+m.rate+",0)",roy),_xkSt({sz:9.5,h:"right",bold:true}),{fmt:"#,##0"});
      (m.grp==="sand"?sandCells:coarseCells).push("I"+r);
    });
    ryS.r=r2+1;
  });
  var rySum=0,rcSum=0,ryRowS=null,ryRowC=null,ryD1=ryS.headRow+1,ryD2=ryS.r-1;
  (function(){
    function foot(label,f,v,big){
      var r=ryS.r;ryS.ws.mergeCells(r,1,r,8);
      _xkPut(ryS.ws,r,1,label,_xkSt({bold:true,h:"right",sz:big?10.5:9.5}));
      for(var c=2;c<=8;c++)ryS.ws.getCell(r,c).border={top:XL_BRD,left:XL_BRD,bottom:XL_BRD,right:XL_BRD};
      _xkPut(ryS.ws,r,9,_xkF(f,v),_xkSt({bold:true,h:"right",sz:big?10.5:9.5,bg:big?"FFF2F2F2":null}),{fmt:"#,##0"});
      ryS.ws.getRow(r).height=big?20:17;ryS.r=r+1;return r;
    }
    /* group totals recomputed from the same per-item rounding as the app */
    I.forEach(function(it){var cf=effCF(it),sF=(cf.scr_sand||0)+(cf.sand||0)+(cf.quarry||0),cF=royCoarseF(cf);
      rySum+=Math.round(Math.round(sF*it.qty*1000)/1000*S.royS);rcSum+=Math.round(Math.round(cF*it.qty*1000)/1000*S.royC);});
    var rS=foot("Total Sand Royalty",sandCells.length?"SUM("+sandCells.join(",")+")":"0",rySum,false);
    var rC=foot("Total Coarse Royalty",coarseCells.length?"SUM("+coarseCells.join(",")+")":"0",rcSum,false);
    var rT2=foot("Total Royalty","I"+rS+"+I"+rC,rySum+rcSum,true);
    royTot="'"+XLK.ry+"'!$I$"+rT2;ryRowS=rS;ryRowC=rC;
  })();
  ryS.r++;
  _xkTail(ryS);
  _xlSheetSetup(ryS.ws,false,ryS.headRow+":"+ryS.headRow);
  var royTot;

  /* ═════ Testing (live: qty from Consumption/Measurements, tests = f(qty, frequency), total -> Settings -> Recap) ═════ */
  var MT_CATS=["cement","aggregate","sand","steel","bricks"],MT_LBL={cement:"Cement total (MT)",aggregate:"Aggregate total (M3)",sand:"Sand total (M3)",steel:"Steel total (MT)",bricks:"Bricks total (1000 Nos)"};
  var mtRef={},mtTerms={cement:[],aggregate:[],sand:[],steel:[],bricks:[]},mtVal={cement:0,aggregate:0,sand:0,steel:0,bricks:0};
  I.forEach(function(it,i){
    if(!it.cf)return;
    var ecf=effCF(it),mat;
    for(mat in ecf){
      var factor=ecf[mat]||0,lr=LR[mat];if(!lr)continue;
      var conv=lr.conv||1,net=it.qty*factor*conv,lbl=(lr.label||"").toLowerCase(),cat=null;
      if(lbl.indexOf("cement")>=0)cat="cement";
      else if(lbl.indexOf("aggregate")>=0||lbl.indexOf("metal")>=0||lbl.indexOf("grit")>=0)cat="aggregate";
      else if(lbl.indexOf("sand")>=0)cat="sand";
      else if(lbl.indexOf("steel")>=0||lbl.indexOf("tmt")>=0||mat==="ms_bars")cat="steel";
      else if(lbl.indexOf("brick")>=0)cat="bricks";
      if(!cat||!(net>0))continue;
      mtVal[cat]+=net;
      var rowC=ccAddr[i]&&ccAddr[i][mat];
      mtTerms[cat].push((rowC&&ccTop[i])?("'"+XLK.cc+"'!$E$"+ccTop[i]+"*'"+XLK.cc+"'!$G$"+rowC+(conv!==1?"*"+conv:"")):String(net));
    }
  });
  (function(){
    var wsS=wb.getWorksheet(XLK.set);rr++;
    _xkPut(wsS,rr,1,"Material totals from Consumption (used by Testing)",_xkSt({bold:true,bg:"FFF2F2F2"}));
    _xkPut(wsS,rr,2,"",_xkSt({bg:"FFF2F2F2"}));_xkPut(wsS,rr,3,"",_xkSt({bg:"FFF2F2F2"}));rr++;
    MT_CATS.forEach(function(cat){
      var fx=mtTerms[cat].join("+");
      _xkPut(wsS,rr,1,MT_LBL[cat],_xkSt({}));
      _xkPut(wsS,rr,2,(fx&&fx.length<7000)?_xkF(fx,mtVal[cat]):mtVal[cat],_xkSt({h:"right",bold:true}),{fmt:"0.000"});
      _xkPut(wsS,rr,3,"sum of qty x factor x conv (Consumption)",_xkSt({color:"FF666666",sz:9}));
      mtRef[cat]="'"+XLK.set+"'!$B$"+rr;rr++;
    });
  })();

  var mtS=_xkSheet(wb,"mt",[6,12,36,26,22,13,9,11,13],"p11"),mtTot=[],mtN=0;
  xkHead2(mtS,["Sr.","Material","Description of Test","Frequency (Min.)","Reference","Total Qty","No. Tests","Cost/Test","Total Cost"],["center","left","left","left","left","right","right","right","right"]);
  function mtQtyFmt(v,unit){
    var b=(Math.abs(v)>0&&Math.abs(v)<1)?"0.000#":"0.00##";
    return unit?(b+' "'+String(unit).replace(/"/g,"")+'"'):b;
  }
  function mtPut(o){   /* o: mat, desc, freq, ref, qty{v,f}, tests{v,f}, cost, extra(mix), unit */
    var r=mtS.r,ws=mtS.ws;mtN++;
    var lines=Math.max(_xlLinesFit(o.desc||"",mtS.colW[2],9,false),_xlLinesFit(o.freq||"",mtS.colW[3],9,false),_xlLinesFit(o.ref||"",mtS.colW[4],9,false),_xlLinesFit(o.mat||"",mtS.colW[1],9,true));
    ws.getRow(r).height=_xlRowH(lines,9);
    _xkPut(ws,r,1,mtN,_xkSt({sz:9,v:"top",h:"center"}));
    _xkPut(ws,r,2,o.mat,_xkSt({sz:9,v:"top",bold:true}));
    _xkPut(ws,r,3,o.desc,_xkSt({sz:9,v:"top"}));
    _xkPut(ws,r,4,o.freq,_xkSt({sz:9,v:"top"}));
    _xkPut(ws,r,5,o.ref,_xkSt({sz:9,v:"top"}));
    _xkPut(ws,r,6,o.qty.f?_xkF(o.qty.f,o.qty.v):o.qty.v,_xkSt({sz:9,v:"top",h:"right"}),{fmt:mtQtyFmt(o.qty.v,o.unit)});
    _xkPut(ws,r,7,o.tests.f?_xkF(o.tests.f.replace(/\{Q\}/g,"F"+r),o.tests.v):o.tests.v,_xkSt({sz:9,v:"top",h:"right",bold:true}),{fmt:"0"});
    _xkPut(ws,r,8,o.cost,_xkSt({sz:9,v:"top",h:"right"}),{fmt:"#,##0.##"});
    var tv=o.tests.v*o.cost+(o.extra||0);
    _xkPut(ws,r,9,_xkF("G"+r+"*H"+r+(o.extra?"+"+o.extra:""),tv),_xkSt({sz:9,v:"top",h:"right",bold:true}),{fmt:"#,##0.00"});
    mtTot.push(r);mtS.r=r+1;
  }
  function mtTestsF(th,k){   /* tests from qty cell ({Q}) + frequency threshold */
    return th>0?("IF({Q}>0,ROUNDUP({Q}/"+th+",0)"+(k&&k!==1?"*"+k:"")+",0)"):"IF({Q}>0,1,0)";
  }
  var mtEff=mtfEffRows(getMaterialTotals());
  mtEff.rows.forEach(function(e){
    var row=e.row,qty=e.qty,tests=e.tests,cost=e.cost||0,mix=mtfMixCost(e),virt=!!e.g,isConc=(row.sr===4&&!row.isCustom);
    if(cost*tests+mix===0&&qty===0)return;                       /* same rows the print skips (mtf-zero) */
    var qo={v:qty,f:null},to={v:tests,f:null},mat=row.mat;
    if(virt){
      mat=row.mat+" "+e.g.grade;
      if(MTF_CONC_Q[e.g.grade]===undefined){
        var terms=e.g.items.map(function(c){return msTot[c.idx]?("'"+XLK.ms+"'!$"+msTot[c.idx].charAt(0)+"$"+msTot[c.idx].substring(1)):String(+c.it.qty||0);});
        qo.f="ROUND("+terms.join("+")+",2)";
      }
      if(MTF_CONC_T[e.g.grade]===undefined)
        to.f="IF(ROUND({Q},0)<=0,0,IF(ROUND({Q},0)<=5,1,IF(ROUND({Q},0)<=15,2,IF(ROUND({Q},0)<=30,3,IF(ROUND({Q},0)<=50,4,4+ROUNDUP((ROUND({Q},0)-50)/50,0))))))";
    }else if(!isConc){
      if((row._qty===undefined||row._qty===null)&&row.qtyFormula&&!row.isCustom&&/^[a-z0-9*+\-\/(). ]+$/.test(row.qtyFormula)){
        var okF=true,ex=row.qtyFormula.replace(/cement|aggregate|sand|steel|bricks/g,function(m){return mtRef[m];});
        if(ex)qo.f=ex;
      }
      if(row._tests===undefined||row._tests===null)to.f=mtTestsF(row.threshold,1);
    }
    mtPut({mat:mat,desc:row.desc||"",freq:row.freq||"",ref:row.ref||"",qty:qo,tests:to,cost:cost,extra:mix});
  });
  /* VQCC picker rows (P1, P2 ...) */
  function mtPickAutoTerms(grp){
    /* mirror of mtfGroupAuto: returns {terms,q} so the quantity can be a live formula */
    if(!grp.match&&grp.basis!=="bit")return null;
    var AGG=["m40mm","m20mm","m12_10","overmetal","rubble"],terms=[],q=0;
    I.forEach(function(it,i){
      var d=String(it.desc||""),add=0,tm=[],cb=effCF(it)||{};
      function cc(k){return (ccAddr[i]&&ccAddr[i][k]&&ccTop[i])?("'"+XLK.cc+"'!$E$"+ccTop[i]+"*'"+XLK.cc+"'!$G$"+ccAddr[i][k]):String((+cb[k]||0)*(+it.qty||0));}
      if(grp.basis==="bit"){add=(+cb.bitumen||0)*(+it.qty||0);if(add>0)tm.push(cc("bitumen"));}
      else if(!grp.match(d))return;
      else if(grp.basis==="agg"){
        for(var gi=0;gi<MTF_CAT.length;gi++){var og=MTF_CAT[gi];if(og===grp)break;if(og.basis==="agg"&&og.match&&og.match(d))return;}
        AGG.forEach(function(k){var a=(+cb[k]||0)*(+it.qty||0);add+=a;if(a>0)tm.push(cc(k));});
      }else{
        if(unitShort(it.unit)!=="Cu.m")return;
        add=(+it.qty||0);if(add>0)tm.push(msTot[i]?("'"+XLK.ms+"'!$"+msTot[i].charAt(0)+"$"+msTot[i].substring(1)):String(add));
      }
      if(add>0){q+=add;terms=terms.concat(tm);}
    });
    return {terms:terms,q:Math.round(q*100)/100};
  }
  MTF_PICK.forEach(function(pk){
    var f=mtfCatFind(pk.k);if(!f)return;
    var qty=mtfPickQty(pk),tests=mtfPickTests(pk,qty),rate=+pk.r||0;
    if(tests*rate===0&&qty===0)return;
    var qo={v:qty,f:null},to={v:tests,f:null};
    if((pk.q===undefined||pk.q===null)&&f.t.a){
      var au=mtPickAutoTerms(f.grp);
      if(au&&au.terms.length&&Math.abs(au.q-qty)<0.005&&au.terms.join("+").length<6000)qo.f="ROUND("+au.terms.join("+")+",2)";
    }
    if(pk.t===undefined||pk.t===null)to.f=mtfTestsF(f.t.th,f.t.k);
    mtPut({mat:f.grp.name,desc:(pk.d!==undefined)?pk.d:f.t.n,freq:f.t.f,ref:f.grp.ref,qty:qo,tests:to,cost:rate,unit:f.t.u||f.grp.unit});
  });
  var mtTotRow=mtS.r,mtModel=0;
  mtTot.forEach(function(r){var c=mtS.ws.getCell(r,9).value;mtModel+=(c&&c.result!==undefined)?c.result:(+c||0);});
  (function(){
    var ws=mtS.ws,r=mtS.r;ws.mergeCells(r,1,r,8);
    _xkPut(ws,r,1,"Total Cost of Testing =",_xkSt({bold:true,h:"right",sz:10.5}));
    for(var c=2;c<=8;c++)ws.getCell(r,c).border={top:XL_BRD,left:XL_BRD,bottom:XL_BRD,right:XL_BRD};
    _xkPut(ws,r,9,_xkF(mtTot.length?"SUM(I"+mtTot[0]+":I"+mtTot[mtTot.length-1]+")":"0",mtModel),_xkSt({bold:true,h:"right",sz:10.5,bg:"FFF2F2F2"}),{fmt:"#,##0.00"});
    ws.getRow(r).height=20;mtS.r=r+1;
  })();
  mtS.r++;
  _xkTail(mtS);
  _xlSheetSetup(mtS.ws,false,mtS.headRow+":"+mtS.headRow);
  /* Settings 'Material Testing total' now follows the Testing sheet (and so does Recapitulation) */
  (function(){
    var wsS=wb.getWorksheet(XLK.set),mr=parseInt(String(ST.mtf).split("$").pop(),10),cell=wsS.getCell(mr,2);
    cell.value={formula:"ROUND('"+XLK.mt+"'!$I$"+mtTotRow+",0)",result:Math.round(mtModel)};
    cell.fill={type:"pattern",pattern:"none"};
  })();

  /* ═════ Abstract: [B] Royalty + Testing, TOTAL(A) / TOTAL(B) / TOTAL(A+B) — same as the app's Abstract ═════ */
  (function(){
   try{
    var wsA=ab.ws,tRows=[],rq,roy=Math.round(royModel),mtfV=0;
    try{tRows=mtfAbsRows();}catch(e){console.error("mtfAbsRows failed",e);tRows=[];}
    tRows.forEach(function(x){mtfV+=x.amt;});mtfV=Math.round(mtfV);
    var hasR=roy>0,hasT=mtfV>0;
    if(!hasR&&!hasT){_xkTail(ab);_xlSheetSetup(wsA,false,ab.headRow+":"+ab.headRow);return;}
    rq=_royQtys(S);
    var bd={top:XL_BRD,left:XL_BRD,bottom:XL_BRD,right:XL_BRD};
    function mrg(r){wsA.mergeCells(r,1,r,cA-1);for(var c=2;c<cA;c++)wsA.getCell(r,c).border=bd;}
    function bRow(sr,desc,unit,q,rate,amt,o){
      o=o||{};var r=ab.r,c;
      for(c=1;c<=cA;c++)wsA.getCell(r,c).border=bd;
      _xkPut(wsA,r,1,sr,_xkSt({bold:true,h:"center",v:"top"}));
      _xkPut(wsA,r,3,desc,_xkSt({sz:9.5,v:"top",bold:!!o.bold}));
      _xkPut(wsA,r,4,unit,_xkSt({sz:9,v:"top"}));
      if(q!==""&&q!==null)_xkPut(wsA,r,cQ,q,_xkSt({h:"right",v:"top"}),{fmt:"0.00"});
      if(rate!==""&&rate!==null)_xkPut(wsA,r,cR,rate,_xkSt({h:"right",v:"top"}),{fmt:XK_F2});
      if(amt!==""&&amt!==null)_xkPut(wsA,r,cA,amt,_xkSt({h:"right",v:"top",bold:true}),{fmt:"#,##0.00"});
      wsA.getRow(r).height=Math.max(15,_xlRowH(_xlLinesFit(desc,ab.colW[2],9.5,false),9.5));
      ab.r=r+1;return r;
    }
    function band(txt){var r=ab.r;mrg(r);_xkPut(wsA,r,1,txt,_xkSt({bold:true,sz:10}));wsA.getRow(r).height=18;ab.r=r+1;}
    function totRow(lbl,f,v,big){
      var r=ab.r;mrg(r);
      _xkPut(wsA,r,1,lbl,_xkSt({bold:true,h:"right",sz:big?10.5:10}));
      _xkPut(wsA,r,cA,_xkF(f,v),_xkSt({bold:true,h:"right",bg:"FFF2F2F2",sz:big?10.5:10}),{fmt:"#,##0.00"});
      wsA.getRow(r).height=big?20:18;ab.r=r+1;return r;
    }
    /* A total: relabel the existing "Total =" row */
    wsA.getCell(abTotRow,1).value="TOTAL(A) Rs.";
    /* TOTAL(A) is rounded to whole rupees (same as the app and the Recapitulation), still a live SUM of the item amounts */
    wsA.getCell(abTotRow,cA).value={formula:"SUM("+_xkA(cA)+abR0+":"+_xkA(cA)+(abTotRow-1)+")",result:grpTotal};
    ab.r++;   /* blank spacer row */
    band("[B] "+(hasR&&hasT?"Royalty Charges & Testing Charges.":(hasR?"Royalty Charges.":"Testing Charges.")));
    var srn=I.length;
    var royRng="'"+XLK.ry+"'!$F$"+ryD1+":$F$"+ryD2,netRng="'"+XLK.ry+"'!$H$"+ryD1+":$H$"+ryD2;
    var royParts=[];
    if(hasR){
      var _what=(rq.rS>0&&rq.rC>0)?"Sand, Rubble, Murum, Soil, 60mm./40mm. metal (Hand broken),":(rq.rS>0?"Sand,":"Rubble, Murum, Soil, 60mm./40mm. metal (Hand broken),");
      srn++;
      bRow(srn,"ROYALTY CHARGES :- Supply of "+_what+" royalty charges are not included in the rates.[As per Govt. of Maharashtra, Revenue and Forest Departments Gazette No.146 dtd. 04 June 2021]","","","","",{bold:true});
      if(rq.rS>0)bRow("","ROYALTY CHARGES FOR SAND","Cu.M",_xkF('ROUND(SUMIF('+royRng+',"Sand (M3)",'+netRng+'),2)',rq.qS),_xkF(ST.royS,S.royS),_xkF("'"+XLK.ry+"'!$I$"+ryRowS,rq.rS),{bold:true});
      if(rq.rC>0)bRow("","ROYALTY CHARGES FOR OTHER MINERALS","Cu.M",_xkF('ROUND(SUMIF('+royRng+',"Coarse Aggregate (M3)",'+netRng+'),2)',rq.qC),_xkF(ST.royC,S.royC),_xkF("'"+XLK.ry+"'!$I$"+ryRowC,rq.rC),{bold:true});
    }
    if(hasT){
      srn++;
      bRow(srn,"Laboratory testing charges are not considered in the Rate Abstracts. Where ever required separate item shall be taken in the estimate for material testing charges, on the basis of testing frequency and charges fixed by Vigilance & Quality Control Circle, for the current year and shall form part of tender. testing of material by Quality control and certified quality must be use by contractor","","","","");
      var lastG=null;
      tRows.forEach(function(x){
        if(x.grp!==lastG){lastG=x.grp;var rg=ab.r,cg;for(cg=1;cg<=cA;cg++)wsA.getCell(rg,cg).border=bd;wsA.mergeCells(rg,3,rg,cA);_xkPut(wsA,rg,3,String(x.grp).toUpperCase(),_xkSt({bold:true,sz:9.5,v:"top"}));wsA.getRow(rg).height=16;ab.r=rg+1;}   /* group heading sits in the Description column, like the app */
        bRow("",x.desc,x.unit,x.qty,x.rate,Math.round(x.amt));   /* whole rupees, same as the app's fmtW2 */
      });
      ctx.static.push("Abstract [B] testing rows (live total: Testing sheet)");
    }
    var fB="ROUND("+(hasR?royTot:"0")+",0)+ROUND("+(hasT?ST.mtf:"0")+",0)";
    var rB=totRow("TOTAL(B) Rs.",fB,roy+mtfV,false);
    var Aval=Math.round(grpTotal*100)/100;
    totRow("TOTAL(A+B) Rs.",_xkA(cA)+abTotRow+"+"+_xkA(cA)+rB,Math.round(grpTotal)+roy+mtfV,true);
    _xkTail(ab);
    _xlSheetSetup(wsA,false,ab.headRow+":"+ab.headRow);
   }catch(e){
    console.error("Abstract [B] Royalty/Testing block failed:",e);
    try{_xkTail(ab);_xlSheetSetup(ab.ws,false,ab.headRow+":"+ab.headRow);}catch(x){}
   }
  })();

  XK_PLAIN=false;
  /* ═════ Recapitulation ═════ */
  var fe=_xkSheet(wb,"fe",[22,22,22,24],"p8");
  (function(){var r=fe.r;fe.ws.mergeCells(r,1,r,3);_xkPut(fe.ws,r,1,"Description",_xkSt({bold:true,bg:"FFF2F2F2"}));for(var c=2;c<=3;c++)fe.ws.getCell(r,c).border={top:XL_BRD,left:XL_BRD,bottom:XL_BRD,right:XL_BRD};_xkPut(fe.ws,r,4,"Amount",_xkSt({bold:true,h:"right",bg:"FFF2F2F2"}));fe.ws.getRow(r).height=22;fe.headRow=r;fe.r=r+1;})();
  var A=Math.round(totA),roy=Math.round(royModel),mtf=Math.round(window._mtfTotalVal||0),ABC=A+roy+mtf;
  var gstV=Math.round(gstBaseAmt(A,ABC)*S.gst/100),contV=contAmt(A,S),liV=Math.round(A*S.li/100);
  var feR=fe.r,L=0;
  function lt2(){return String.fromCharCode(65+(L++));}
  function frow(label,val,o){
    o=o||{};
    fe.ws.mergeCells(feR,1,feR,3);
    for(var cq=2;cq<=3;cq++)fe.ws.getCell(feR,cq).border={top:XL_BRD,left:XL_BRD,bottom:XL_BRD,right:XL_BRD};
    var cL=_xkPut(fe.ws,feR,1,label,_xkSt({bold:!!o.bold,h:o.right?"right":"left",bg:o.bg||null,color:o.color||"FF000000",sz:o.sz||10}));
    var cV=_xkPut(fe.ws,feR,4,val,_xkSt({bold:!!o.bold,h:"right",bg:o.bg||null,color:o.vcolor||o.color||"FF000000",sz:o.sz||10}),{fmt:o.fmt===undefined?_xlFmt(2):o.fmt});
    fe.ws.getRow(feR).height=o.h||18;feR++;return feR-1;
  }
  var rA=frow(lt2()+"  Cost of Work",_xkF("ROUND("+absTot+",0)",A),{bold:true,color:"FF1B5E20"});
  /* Same as the app: A = Cost of Work, B = Royalty + Material Testing (one row; two bullet sub-rows when both exist), Total (A + B).
     B is hidden when both Royalty and Testing are 0 - exactly like the app's Recapitulation. */
  var hasRoy=roy>0,hasMtf=mtf>0,bothB=hasRoy&&hasMtf,hasB=hasRoy||hasMtf;
  var rBB=null,tl=["A"];
  if(hasB){
    var bLbl=bothB?"Royalty & Testing Charges":(hasRoy?"Royalty":"Material Testing");
    var fBsingle=hasRoy?"ROUND("+royTot+",0)":"ROUND("+ST.mtf+",0)";
    var fBboth="D"+(feR+1)+"+D"+(feR+2);
    rBB=frow(lt2()+"  "+bLbl,_xkF(bothB?fBboth:fBsingle,roy+mtf),{bold:true});
    tl.push("B");
    if(bothB){
      var subSt={sz:8.5,color:"FF666666"};
      frow("        \u2022 Royalty",_xkF("ROUND("+royTot+",0)",roy),subSt);
      frow("        \u2022 Material Testing",_xkF("ROUND("+ST.mtf+",0)",mtf),subSt);
    }
  }
  var rT=frow("Total ("+tl.join(" + ")+")",_xkF("D"+rA+(rBB?"+D"+rBB:""),ABC),{bold:true,right:true,bg:"FFF2F2F2"});
  fe.ws.getRow(feR).height=5;feR++;
  var rG=null,rC=null,rL=null,sums=[];
  /* Same as the app: GST / Contingencies / Labour Insurance rows appear only when their value is > 0; extra rows only when active */
  if(S.gst>0){rG=frow(_xkF('"Add "&'+ST.gst+'&"% GST"',"Add "+S.gst+"% GST"),_xkF("ROUND(IF("+ST.gstBase+'="ABC",D'+rT+",D"+rA+")*"+ST.gst+"/100,0)",gstV));sums.push("D"+rG);}
  if(S.cont>0){rC=frow(_xkF('"Add "&IF('+ST.contMode+'="amt","Rs. "&ROUND('+ST.cont+',0),'+ST.cont+'&"%")&" Contingencies"',"Add "+contLbl(S)+" Contingencies"),_xkF("IF("+ST.contMode+'="amt",ROUND('+ST.cont+",0),ROUND(D"+rA+"*"+ST.cont+"/100,0))",contV));sums.push("D"+rC);}
  if(S.li>0){rL=frow(_xkF('"Add "&'+ST.li+'&"% Labour Insurance"',"Add "+S.li+"% Labour Insurance"),_xkF("ROUND(D"+rA+"*"+ST.li+"/100,0)",liV));sums.push("D"+rL);}
  var extraSum=0;
  ST.extra.forEach(function(x){
    var e=x.e,amt=extraAmt(A,e);extraSum+=amt;
    var rx=frow(_xkF('"Add "&IF('+x.mode+'="amt","Rs. "&ROUND('+x.val+',0),'+x.val+'&"%")&" for '+_xkQ(x.lbl)+'"',"Add "+(e.mode==="amt"?("Rs. "+Math.round(e.amt||0)):(e.pct+"%"))+" for "+x.lbl),_xkF("IF("+x.mode+'="amt",ROUND('+x.val+",0),ROUND(D"+rA+"*"+x.val+"/100,0))",amt),{bg:"FFE8F5E9",color:"FF1B5E20"});
    sums.push("D"+rx);
  });
  fe.ws.getRow(feR).height=5;feR++;
  var grand=ABC+gstV+contV+liV+extraSum;
  var rGr=frow("Grand Total",_xkF("D"+rT+(sums.length?"+"+sums.join("+"):""),grand),{bold:true,right:true,bg:"FF18150F",color:"FFFFFFFF",vcolor:"FFF5A623",sz:12,h:24});
  frow("= Rs.",_xkF('TEXT(D'+rGr+'/100000,"0.00")&" Lakhs"',(grand/100000).toFixed(2)+" Lakhs"),{right:true,fmt:null,h:18});
  fe.ws.getRow(feR-1).getCell(4).numFmt="@";
  ctx.grand="'"+XLK.fe+"'!$D$"+rGr;ctx.grandVal=grand;ctx.appGrand=calcGrand();
  fe.r=feR+1;
  _xkTail(fe);
  _xlSheetSetup(fe.ws,false,fe.headRow+":"+fe.headRow);
  /* ── CHECK block: app total vs Excel total (below the print area, not printed) ── */
  (function(){
    var cw=fe.ws,cr=fe.r+2,paEnd=fe.r;
    var stH=_xkSt({sz:9,bold:true,bg:"FFF2F2F2"}),stL=_xkSt({sz:9}),stV=_xkSt({sz:9,h:"right",bold:true});
    function brd(r){for(var c=2;c<=4;c++)cw.getCell(r,c).border={top:XL_BRD,left:XL_BRD,bottom:XL_BRD,right:XL_BRD};}
    function chk(label,val,fmt,st){
      cw.mergeCells(cr,1,cr,3);brd(cr);
      _xkPut(cw,cr,1,label,stL);_xkPut(cw,cr,4,val,st||stV,{fmt:fmt});
      cw.getRow(cr).height=15;cr++;return cr-1;
    }
    cw.mergeCells(cr,1,cr,4);brd(cr);_xkPut(cw,cr,1,"CHECK \u2014 app total vs this Excel (not printed)",stH);cw.getRow(cr).height=16;cr++;
    var appG=Math.round(_xkNum(ctx.appGrand));
    var rAp=chk("Grand Total in app (at export)",appG,"#,##0");
    var rEx=chk("Grand Total in this Excel (now)",_xkF("D"+rGr,grand),"#,##0");
    var df=grand-appG;
    var rDf=chk("Difference (Excel - App)",_xkF("D"+rEx+"-D"+rAp,df),"#,##0;[Red]-#,##0");
    var okTxt="OK - matches app",badTxt="DIFFERS - check inputs";
    chk("Status",_xkF('IF(ABS(D'+rDf+')<=1,"'+okTxt+'","'+badTxt+'")',Math.abs(df)<=1?okTxt:badTxt),null);
    var stat=(ctx.static||[]).slice();
    chk("Items kept as fixed values (not live)",stat.length,"0");
    if(stat.length){
      var lst=stat.join(", ");cw.mergeCells(cr,1,cr,4);brd(cr);
      _xkPut(cw,cr,1,lst,_xkSt({sz:8.5,color:"FF444444"}));
      cw.getCell(cr,1).alignment={horizontal:"left",vertical:"top",wrapText:true};
      cw.getRow(cr).height=Math.max(15,Math.ceil(lst.length/60)*12);cr++;
    }
    cw.mergeCells(cr,1,cr,4);
    _xkPut(cw,cr,1,"Difference is 0 only while inputs are unchanged. Once you edit rates/quantities in Excel it will change - that is expected.",_xkSt({sz:8,italic:true,color:"FF666666"}),{box:false});
    cw.getCell(cr,1).alignment={horizontal:"left",vertical:"top",wrapText:true};cw.getRow(cr).height=24;
    cw.pageSetup.printArea="A1:D"+paEnd;
  })();

  XK_PLAIN=false;
  ctx.sheets={set:XLK.set,lc:XLK.lc,lt:XLK.lt,ms:XLK.ms,ra:XLK.ra,ab:XLK.ab,cc:XLK.cc,ry:XLK.ry,mt:XLK.mt,fe:XLK.fe};
  return ctx;
}

/* Juna simple export — ExcelJS load na zalyas fallback mhanun */
function _doExportExcelLegacy(noGate){
  if(!noGate){
    if(typeof canDownload==="function"&&!canDownload())return;
    _doCountDownload();
  }
  _prepPrint();
  try{
    var wb=XLSX.utils.book_new();
    var nm=((R("pName")||{}).value||"New Work").trim()||"New Work";

    /* Reads the *actual* value of a cell: input/select/textarea .value
       (td.innerText is always blank for form fields, which is why
       No./L/B/D-H used to export empty even though Qty worked fine). */
    function cellVal(td){
      if(td.querySelector(".gst-base-btn")){td=td.cloneNode(true);td.querySelectorAll(".gst-base-btn").forEach(function(b){b.remove();});}
      var inputs=td.querySelectorAll("input,select,textarea");
      if(inputs.length){
        var vals=[];
        inputs.forEach(function(el){
          var v;
          if(el.tagName==="SELECT"){
            v=el.options[el.selectedIndex]?el.options[el.selectedIndex].text:el.value;
          }else{
            v=el.value;
          }
          v=(v||"").toString().trim();
          if(v)vals.push(v);
        });
        return vals.join(" ");
      }
      /* Skip empty "Add Comment" style buttons */
      if(td.querySelector("button")&&!td.textContent.replace(/add\s*comment/i,"").trim())return "";
      return td.innerText.replace(/[\r\n]+/g," ").trim();
    }

    function tbToSheet(tbId){
      var tb=R(tbId);if(!tb)return null;
      var table=tb.closest("table");if(!table)return null;
      var data=[];
      table.querySelectorAll("tr").forEach(function(tr){
        if(tr.closest(".noprt"))return;
        var row=[];
        tr.querySelectorAll("td,th").forEach(function(td){
          if(!td.closest(".noprt"))row.push(cellVal(td));
        });
        if(row.some(function(x){return x!="";}))data.push(row);
      });
      if(!data.length)return null;

      var ws=XLSX.utils.aoa_to_sheet(data);
      var ncols=data.reduce(function(m,r){return Math.max(m,r.length);},0);

      /* Long "Description" text used to just overflow across empty cells
         (looked merged but wasn't, and never wrapped). Now we merge that
         row's Description cell across to the last column and turn wrap on. */
      var header=data[0]||[];
      var descCol=-1;
      header.forEach(function(h,i){if(descCol<0&&/description/i.test(h||""))descCol=i;});
      if(descCol>=0){
        var merges=[];
        data.forEach(function(row,r){
          if(r===0)return;
          var v=row[descCol];
          if(!v)return;
          var restEmpty=true;
          for(var c=descCol+1;c<ncols;c++){if((row[c]||"")!==""){restEmpty=false;break;}}
          if(restEmpty&&ncols-1>descCol){
            merges.push({s:{r:r,c:descCol},e:{r:r,c:ncols-1}});
            var addr=XLSX.utils.encode_cell({r:r,c:descCol});
            if(ws[addr])ws[addr].s={alignment:{wrapText:true,vertical:"top"}};
          }
        });
        if(merges.length)ws["!merges"]=(ws["!merges"]||[]).concat(merges);
      }
      /* Header row: bold + wrap so long headers don't get clipped */
      header.forEach(function(h,i){
        var addr=XLSX.utils.encode_cell({r:0,c:i});
        if(ws[addr])ws[addr].s={font:{bold:true},alignment:{wrapText:true,vertical:"top"}};
      });

      /* Sensible column widths (Description gets a wide fixed column) */
      var cols=[];
      for(var c=0;c<ncols;c++){
        if(c===descCol){cols.push({wch:55});continue;}
        var maxLen=10;
        data.forEach(function(row){var s=(row[c]||"").toString();if(s.length>maxLen)maxLen=s.length;});
        cols.push({wch:Math.min(maxLen+2,35)});
      }
      ws["!cols"]=cols;

      return ws;
    }

    /* 1. Main Sheet - work details (mirrors the print header block) */
    var p0=R("p0");
    if(p0){
      var mainData=[["Maha PWD Estimator - Work Details"],[""]];
      p0.querySelectorAll("input,textarea,select").forEach(function(el){
        var lbl=el.placeholder||el.id||"";
        var val=el.tagName==="SELECT"?(el.options[el.selectedIndex]?el.options[el.selectedIndex].text:el.value):el.value;
        val=(val||"").toString();
        if(val.trim())mainData.push([lbl,val]);
      });
      /* Add summary rows */
      mainData.push([""],["Name of Work",nm]);
      var hTot=R("hTot");if(hTot)mainData.push(["Grand Total",hTot.textContent]);
      var hIt=R("hIt");if(hIt)mainData.push(["Total Items",hIt.textContent]);
      var wsMain=XLSX.utils.aoa_to_sheet(mainData);
      wsMain["!cols"]=[{wch:30},{wch:50}];
      if(wsMain["A1"])wsMain["A1"].s={font:{bold:true,sz:14}};
      XLSX.utils.book_append_sheet(wb,wsMain,"Main");
    }

    /* 2. Abstract */
    var wsBoq=tbToSheet("boqTb");
    if(wsBoq)XLSX.utils.book_append_sheet(wb,wsBoq,"Abstract");

    /* 3. Measurements */
    var wsMs=tbToSheet("msTb");
    if(wsMs)XLSX.utils.book_append_sheet(wb,wsMs,"Measurements");

    /* 4. Rate Analysis */
    var wsRa=tbToSheet("raTb");
    if(wsRa)XLSX.utils.book_append_sheet(wb,wsRa,"Rate Analysis");

    /* 5. Consumption */
    var wsCc=tbToSheet("ccTb");
    if(wsCc)XLSX.utils.book_append_sheet(wb,wsCc,"Consumption");

    /* 6. Royalty */
    var wsRoy=tbToSheet("royTb");
    if(wsRoy)XLSX.utils.book_append_sheet(wb,wsRoy,"Royalty");

    /* 7. Recapitulation */
    var wsFe=tbToSheet("feTb");
    if(wsFe)XLSX.utils.book_append_sheet(wb,wsFe,"Recapitulation");

    XLSX.writeFile(wb,nm+".xlsx");
    showToast("Excel downloaded! 📊","success");
  }catch(e){
    showToast("Excel error: "+e.message,"error");
    console.error(e);
  }
}

/* ── Landing Page / Browse / Home (previously only in duplicate block) ── */

/* ════════════════════════════════════════════════════════
   LOGIN PAGE — Firebase-driven content
   Firestore: config/loginPage  { images:[], docs:[], videos:[], contact:{} }
   ════════════════════════════════════════════════════════ */
var LP_DATA={images:[],docs:[],videos:[],contact:{email:"thongeaditya@gmail.com",phone:"+91 8975962565"}};
var LP_IDX=0,LP_TMR=null;

var LP_CHAT_OPEN=false;

/* Q&A knowledge base */
var LP_QA=[
  {k:["login","sign in","log in","account"],
   a:"To login:<br>1️⃣ Enter your email & password<br>2️⃣ Click 🔑 Login<br>Or use 🌐 Google login.<br>New user? Click <b>Register</b> tab first."},
  {k:["register","create account","sign up","new account","new user"],
   a:"To create an account:<br>1️⃣ Click <b>Register</b> tab<br>2️⃣ Fill name, email, password<br>3️⃣ Click 📝 Create Account<br>4️⃣ Check your email for a <b>verification link</b> and click it before logging in."},
  {k:["verify","verification","email verify","link"],
   a:"After registering, a <b>verification email</b> is sent to you. Open that email and click the link. Then you can login. If you didn't receive it, check spam or contact us."},
  {k:["forgot","password","reset"],
   a:"Click <b>Forgot password?</b> on the login form. Enter your email and we'll send a reset link."},
  {k:["price","cost","pay","payment","how much","₹","rs","rupee","download fee"],
   a:"You get <b>5 free downloads</b> after registering. After that, choose a plan: <b>₹100 per month</b> or <b>₹1000 per year</b> for unlimited downloads.<br>Pay via any UPI app (GPay, PhonePe, Paytm) using the QR code shown when your free downloads are over."},
  {k:["free","free download","free estimate"],
   a:"Yes! Every new user gets <b>5 free estimate downloads</b>. No payment needed initially. After that, a monthly (₹100) or yearly (₹1000) plan gives unlimited downloads."},
  {k:["download","pdf","estimate","export"],
   a:"After adding all items to your estimate:<br>1️⃣ Click the <b>Download</b> button<br>2️⃣ If free downloads remain — PDF downloads instantly<br>3️⃣ If limit reached — Choose Monthly / Yearly plan, pay via UPI, upload screenshot and wait for admin to activate your plan."},
  {k:["ssr","item","search","rate","schedule"],
   a:"Use the <b>SSR Item Search</b> tab. Type the item number (e.g. 28.01) or keywords (e.g. 'brick masonry'). Select the item and enter measurements to add it to your estimate."},
  {k:["lead","lead chart","lead charges","lead charge","km","transport"],
   a:"Go to the <b>Lead Charges</b> tab. Enter distance in km for each material. The app automatically calculates lead charges using SSR 2022-23 non-linear lookup tables — exactly like the official Excel sheets."},
  {k:["boq","bill of quantities","estimate","quantity"],
   a:"This app generates <b>BOQ (Bill of Quantities)</b> as per Maharashtra PWD SSR 2022-23. It includes lead charges, royalty, GST, contingencies and all standard deductions."},
  {k:["save","cloud","sync","data"],
   a:"Your estimates are <b>saved to cloud</b> (Firebase) after login. You can access them from any device. There is also an <b>Auto-Save</b> every 2 minutes for local data."},
  {k:["google","gmail","google login"],
   a:"Yes! Click <b>🌐 Continue with Google</b> to login with your Gmail account — no password needed."},
  {k:["admin","administration","dashboard"],
   a:"The Admin section is for the app owner only. Regular users don't need it."},
  {k:["contact","help","support","problem","issue","error","not working"],
   a:"Need help? Contact us:<br>✉️ <b>Email:</b> thongeaditya@gmail.com<br>📱 <b>Phone/WhatsApp:</b> +91 8975962565<br>We usually reply within a few hours!",showContact:true},
  {k:["feature","what can","what does","about","how to use","how does"],
   a:"<b>ATP MAHA PWD Estimate App</b> features:<br>✅ SSR 2022-23 item search (2275+ items)<br>✅ Lead charge calculation (non-linear, Excel-accurate)<br>✅ BOQ generation with GST, royalty, contingencies<br>✅ Steel calculator<br>✅ Material Testing Fees (MTF)<br>✅ Cloud save & PDF download<br>✅ Works on mobile & desktop"},
  {k:["material","steel","concrete","cement","brick"],
   a:"The app supports all PWD materials — you can search items by name or number and add measurements floor-wise (G, 1st, 2nd, 3rd, 4th floor). Lead charges are calculated automatically."}
];

/* ════════════════════════════════════════════════════════
   PAGE HELP — per-tab guide popup  (noprt — won't print)
   ════════════════════════════════════════════════════════ */
var PG_HELP = [
  /* 0 — Main */
  { ico:"🏛️", title:"Main Page",
    body:"<b>Main Page</b> is the cover sheet of your estimate.<br><br>"+
         "📝 <b>Fill in project details:</b><br>• Region, Circle, Division, Sub-Division<br>• Name of Work (full official name)<br><br>"+
         "💾 <b>Save / Load:</b><br>• <em>Save Current Estimate</em> — saves to cloud<br>• <em>Browse</em> tab — open past estimates<br><br>"+
         "🖨️ <b>Print All</b> — prints all sheets (Lead Charges, Abstract, BOQ, etc.) in one go.<br><br>"+
         "➕ <b>New</b> — clears everything and starts a fresh estimate." },

  /* 1 — Lead Charges */
  { ico:"🚛", title:"Lead Charges — SSR 2022-23",
    body:"<b>Lead Charges</b> calculates transport charges for each material.<br><br>"+
         "📏 <b>How to use:</b><br>1️⃣ Enter the distance in <b>km</b> for each material (e.g. Cement = 5 km)<br>2️⃣ Optionally enter the quarry/depot <b>Location name</b><br>3️⃣ Lead charges are auto-calculated using the <b>non-linear SSR 2022-23 lookup table</b> — same as the official Excel sheet<br><br>"+
         "⚠️ Set lead charges <b>before</b> searching items — rates include lead in the final item rate." },

  /* 2 — SSR Item Search */
  { ico:"🔍", title:"SSR Item Search",
    body:"<b>Search</b> from 2,275+ SSR 2022-23 items and add them to your estimate.<br><br>"+
         "🔎 <b>How to search:</b><br>• Type item number: <em>28.01</em><br>• Or type keywords: <em>brick masonry / earth excavation / M20 concrete</em><br><br>"+
         "📐 <b>Add measurements:</b><br>• Enter No. × L × B × D/H for each floor (G, 1st, 2nd...)<br>• Click <b>+ Row</b> to add more measurement rows<br>• Click <b>Add to Estimate</b> — item goes to Abstract<br><br>"+
         "💡 Lead charges are automatically included in the final rate based on your Lead Charges settings." },

  /* 3 — Abstract */
  { ico:"📋", title:"Abstract (BOQ)",
    body:"<b>Abstract</b> shows all items added to your estimate — the Bill of Quantities.<br><br>"+
         "📊 <b>Columns:</b> Sr. | Item No. | Description | Unit | Qty | Final Rate | Amount<br><br>"+
         "✏️ <b>CF button</b> — opens Correction Factor editor for that item (add deductions like SCADA, etc.)<br>"+
         "🗑️ <b>del button</b> — removes item from estimate<br><br>"+
         "The <b>Total</b> at the bottom is used in the Recapitulation (Tab 8)." },

  /* 4 — Rate Analysis */
  { ico:"📊", title:"Rate Analysis",
    body:"<b>Rate Analysis</b> shows a detailed breakdown of how each item's final rate is calculated.<br><br>"+
         "For each item you can see:<br>• Base SSR Rate (from schedule)<br>• + Lead charges per material (cement, sand, aggregate, bricks, etc.)<br>• + Bitumen rate adjustment (if applicable)<br>• − SCADA / CF deductions<br>• = <b>Final Rate</b><br><br>"+
         "This sheet is printed as part of the complete estimate set." },

  /* 5 — Measurement Sheet */
  { ico:"📏", title:"Measurement Sheet",
    body:"<b>Measurement Sheet</b> shows the detailed measurements for each item, floor-wise.<br><br>"+
         "Each row shows: Description | Floor | No. | L | B | D/H | Total Qty<br><br>"+
         "✎ <b>Edit</b> — click to modify measurements for any row<br>"+
         "✕ <b>Delete</b> — removes a measurement row (updates Abstract automatically)<br><br>"+
         "💡 Add more measurements by going to <b>Search (Tab 2)</b>, selecting the item again, and adding new rows." },

  /* 6 — Consumption Chart */
  { ico:"🧱", title:"Consumption Chart",
    body:"<b>Consumption Chart</b> calculates how much of each raw material is needed for the whole project.<br><br>"+
         "For each item it shows the material consumption factors:<br>• Cement (bags)<br>• Sand / Screened Sand (M³)<br>• Metal / Aggregate (M³)<br>• Bricks (Nos.)<br>• Steel, Bitumen, etc.<br><br>"+
         "Net Qty = Total Qty × Consumption Factor<br><br>"+
         "Useful for procurement planning and material budgeting." },

  /* 7 — Royalty */
  { ico:"💰", title:"Royalty Statement",
    body:"<b>Royalty Statement</b> calculates the royalty charges payable to the government for extracted materials.<br><br>"+
         "Royalty is charged on:<br>• Sand material (M³) — ₹150 per M³<br>• Coarse Aggregate (M³) — ₹80 per M³<br><br>"+
         "Net Qty = Total Qty × Factor<br>Royalty = Net Qty × Royalty Rate<br><br>"+
         "Total Royalty is added to the Recapitulation automatically." },

  /* 8 — Recapitulation */
  { ico:"📑", title:"Recapitulation",
    body:"<b>Recapitulation</b> is the final summary of the complete estimate cost.<br><br>"+
         "Formula:<br>A. Cost of Work (from Abstract)<br>B. + Royalty & Material Testing Fees<br>= Subtotal (A+B)<br>C. + 18% GST<br>D. + 2% Contingencies<br>E. + 1% Labour Insurance<br>= <b>Grand Total</b><br><br>"+
         "🖨️ <b>Print All</b> — prints the complete estimate set<br>"+
         "📤 <b>Export CSV</b> — exports item-wise data to Excel/CSV<br><br>"+
         "Percentages (GST, Contingencies etc.) can be changed in <b>Settings (Tab 10)</b>." },

  /* 9 — Steel Calc */
  { ico:"⚙️", title:"Steel Calculator — TMT FE-500",
    body:"<b>Steel Calculator</b> helps you calculate the weight of TMT bars for RCC work.<br><br>"+
         "📐 <b>How to use:</b><br>1️⃣ Select bar diameter (8mm, 10mm, 12mm, 16mm, 20mm, 25mm, 32mm)<br>2️⃣ Enter number of bars and length (in metres)<br>3️⃣ Weight is auto-calculated: <em>D² / 162 × Length × Nos.</em><br><br>"+
         "Add multiple rows for different dia bars. Total weight shown at bottom in kg and MT." },

  /* 10 — Settings */
  { ico:"⚙️", title:"Settings",
    body:"<b>Settings</b> — customize the estimate calculations.<br><br>"+
         "📊 <b>GA Percentages:</b><br>• GST % (default 18%)<br>• Contingencies % (default 2%)<br>• Labour Insurance % (default 1%)<br>All percentages update the Recapitulation automatically.<br><br>"+
         "🛢️ <b>Bitumen Rate:</b> Enter current market rate of bitumen (₹/MT) — adjusts all bitumen items automatically.<br><br>"+
         "Changes are applied immediately to your estimate." },

  /* 11 — Material Testing */
  { ico:"🧪", title:"Material Testing Frequency (MTF)",
    body:"<b>Material Testing</b> sheet lists the mandatory material tests as per PWD norms.<br><br>"+
         "For each material test it shows:<br>• Test name<br>• Frequency (e.g. 1 test per 50 M³)<br>• Rate per test<br>• Total tests required<br>• Total cost<br><br>"+
         "MTF cost is included in the Recapitulation under <em>Royalty & Material Testing</em>.<br><br>"+
         "✏️ Click <b>Edit Stamps</b> to update the SE/SDE officer names and location stamps." },

  /* 12 — Quarry Chart */
  { ico:"🗺️", title:"Quarry Chart — Visual Diagram",
    body:"<b>Quarry Chart</b> is a visual diagram showing the transport distances for all materials.<br><br>"+
         "📍 Arrow length = Lead distance in km<br>Longer arrow → more km → higher transport cost<br><br>"+
         "The diagram is auto-generated from the distances you entered in <b>Lead Charges (Tab 1)</b>.<br><br>"+
         "This diagram is printed as part of the estimate and helps the reviewer understand the site location context." },

  /* 13 — CF Table */
  { ico:"⚙️", title:"CF Table — Consumption Factors",
    body:"<b>CF Table</b> (Consumption Factor Table) shows the material consumption factors for all SSR items.<br><br>"+
         "These factors are used to calculate:<br>• Lead charges per item<br>• Consumption Chart quantities<br>• Royalty quantities<br><br>"+
         "✏️ You can edit CF values here if the project requires non-standard factors.<br>Reset button restores default SSR values.<br><br>"+
         "💡 Most users don't need to change these — defaults are as per SSR 2022-23." },

  /* 14 — Browse */
  { ico:"📂", title:"Browse Estimates",
    body:"<b>Browse Estimates</b> shows all your saved estimates from the cloud.<br><br>"+
         "📋 Each estimate shows: Name of Work | Date | Amount<br><br>"+
         "🔄 Click <b>Refresh</b> to reload the list from cloud<br>"+
         "📂 Click any estimate to <b>open and load it</b> — replaces current estimate<br>"+
         "🗑️ Delete button — permanently deletes from cloud<br><br>"+
         "💡 Use <b>Save Current Estimate</b> on Main Page to save your work before switching." },

  /* 15 — Contact */
  { ico:"📞", title:"Contact Us",
    body:"<b>Contact Us</b> — reach the app developer for support.<br><br>"+
         "✉️ Email: <b>thongeaditya@gmail.com</b><br>📱 Phone / WhatsApp: <b>+91 8975962565</b><br><br>"+
         "For issues related to:<br>• Login or account problems<br>• Payment or download issues<br>• SSR rate queries<br>• Feature requests or bugs<br><br>"+
         "We typically respond within a few hours. You can also use the <b>ℹ️ chat button</b> on the login page for instant FAQ answers." }
];

/* ── APP SHARE ─────────────────────────────────────────────────────── */
var APP_LOGO_B64="favicon-512x512.png";



function aAdminLoadEst(estId){
  var est=AD.ests.find(function(e){return e._id===estId;});
  if(!est){showToast("Estimate not found","warn");return;}
  var u=AD.users.find(function(x){return x._id===est.uid||x.uid===est.uid;});
  var uName=u?u.name||u.phone||u.email||"Unknown":"Unknown";
  if(!confirm("'"+esc(est.name||"Untitled")+"'\n(User: "+uName+")\n\nLoad this estimate into the app?\nYour current unsaved work will be lost."))return;
  if(typeof items!=="undefined"&&est.items){
    items=est.items.map(function(x){return Object.assign({},x);});
  }
  var m=est.meta||est.cover||{};
  ["pReg","pCir","pDiv","pSub","pName"].forEach(function(k){
    var el=G(k);if(el)el.value=m[k]||m["p"+k.slice(1)]||"";
  });
  if(est.lkm){for(var ki in est.lkm){var el2=G("lkm_"+ki);if(el2&&typeof onKmChange==="function"){el2.value=est.lkm[ki];onKmChange(parseInt(ki));}}}
  if(typeof buildLCT==="function")buildLCT();
  if(typeof lcExtraRestore==="function")lcExtraRestore(est.lcExtra);
  if(typeof updateAll==="function")updateAll();
  if(typeof upCover==="function")upCover();
  if(typeof upMeta==="function")upMeta();
  CUR_EST_ID=null;
  if(G("adminWrap"))G("adminWrap").style.display="none";
  if(G("appShell"))G("appShell").style.display="block";
  sessionStorage.removeItem("_adminOpen");
  if(typeof goTab==="function")goTab(0);
  showToast("Estimate loaded ✅  (User: "+uName+")","success");
}

function renderBrowse(arr){
  var el=G("browseList");if(!el)return;
  if(!arr||!arr.length){el.innerHTML='<div style="text-align:center;padding:1.5rem;color:#aaa;font-style:italic">No estimates yet.</div>';return;}
  var qEl=G("browseQ"),q=qEl?qEl.value.toLowerCase():"";
  var show=q?arr.filter(function(x){return (x.d.name||"").toLowerCase().indexOf(q)>=0||((x.d.cover&&x.d.cover.pDiv)||"").toLowerCase().indexOf(q)>=0;}):arr;
  if(!show.length){el.innerHTML='<div style="text-align:center;padding:1rem;color:#aaa">No results</div>';return;}
  el.innerHTML=show.map(function(item){
    var d=item.d,id=item.id;
    var dt=d.updatedAt?new Date(d.updatedAt.seconds*1000).toLocaleDateString("en-IN"):"";
    var div=d.cover&&d.cover.pDiv?d.cover.pDiv:"";
    var gr=d.grand?"Rs."+fmtN(d.grand):"";
    var own=(d.uid&&CU&&d.uid===CU.uid)?" (yours)":"";
    var meta=[div,dt,gr].filter(Boolean).join(" \u00b7 ");
    return '<div style="background:#fff;border:1px solid #ddd;border-radius:6px;padding:.5rem .7rem;margin-bottom:.4rem;display:flex;align-items:center;gap:.5rem">'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-weight:800;font-size:.72rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(d.name||"Untitled")+esc(own)+'</div>'+
        (meta?'<div style="font-size:.6rem;color:#888;margin-top:.1rem">'+esc(meta)+'</div>':'')+
        (d.items?'<div style="font-size:.58rem;color:#aaa">'+d.items.length+' items</div>':'')+
      '</div>'+
      '<button class="btn bp" style="font-size:.62rem;padding:.22rem .44rem;flex-shrink:0" data-id="'+id+'" data-isown="'+(d.uid&&CU&&d.uid===CU.uid?'1':'0')+'" onclick="browseLoadEst(this.dataset.id,this.dataset.isown)">&#128194; Load</button>'+
      '<button class="btn bs" style="font-size:.62rem;padding:.22rem .44rem;flex-shrink:0" data-id="'+id+'" data-nm="'+escAttr(d.name||"Untitled")+'" onclick="event.stopPropagation();shareEstLink(this.dataset.id,this.dataset.nm)" title="Share link">&#128279;</button>'+
    '</div>';
  }).join("");
}

function browseSearch(){
  var q=(G("browseQ").value||"").toLowerCase().trim();
  var list=G("browseList");if(!list)return;
  if(!BROWSE_ALL||!BROWSE_ALL.length)return;
  var filtered=q?BROWSE_ALL.filter(function(x){
    var nm=(x.d.name||"").toLowerCase();
    var dv=(x.d.cover&&x.d.cover.pDiv?x.d.cover.pDiv:"").toLowerCase();
    return nm.includes(q)||dv.includes(q);
  }):BROWSE_ALL;
  renderBrowse(filtered);
}

function browseLoadEst(estId,isOwn){
  if(!CU){showToast("Login first","warn");return;}
  if(!window.firebase||!firebase.firestore)return;
  var msg=isOwn==='1'
    ?"Load your estimate? Current unsaved work will be lost."
    :"Load this estimate as a COPY? The original will remain unchanged.\nIf you save after editing, it will be saved as a NEW estimate under your name.";
  if(!confirm(msg))return;
  firebase.firestore().collection("estimates").doc(estId).get().then(function(doc){
    if(!doc.exists){showToast("Estimate not found","error");return;}
    var d=doc.data();
    if(typeof items!=="undefined"&&d.items){
      items=d.items.map(function(x){return Object.assign({},x);});
    }
    var m=d.meta||d.cover||{};
    ["pReg","pCir","pDiv","pSub","pName"].forEach(function(k){var el=G(k);if(el)el.value=m[k]||m["p"+k.slice(1)]||"";});
    try{_atpCloudApplyRest(d);}catch(_ar2){}
    if(d.lkm){for(var ki in d.lkm){var el2=G("lkm_"+ki);if(el2&&typeof onKmChange==="function"){el2.value=d.lkm[ki];onKmChange(parseInt(ki));}}}
    if(typeof buildLCT==="function")buildLCT();
    if(typeof lcExtraRestore==="function")lcExtraRestore(d.lcExtra);   /* user-added Lead Charges rows */
    if(typeof updateAll==="function")updateAll();
    if(typeof upCover==="function")upCover();
    if(typeof upMeta==="function")upMeta();
    // If own estimate: keep CUR_EST_ID so saving updates same doc
    // If someone else's estimate: clear CUR_EST_ID so any save creates a NEW doc
    CUR_EST_ID=isOwn==='1'?estId:null;
    if(isOwn!=='1'){
      showToast("Loaded as copy ✅  Save will create a new estimate under your name.","success");
    } else {
      showToast("Estimate loaded! ✅","success");
    }
    if(typeof goTab==="function")goTab(0);
  }).catch(function(e){showToast("Error loading: "+e.message,"error");});
}

/* ── SHARE LINK: generate a link that, when opened, loads this estimate
   directly for whoever clicks it (after they log in) ── */
function shareEstLink(estId,estName){
  if(!estId){showToast("Estimate ID not found","warn");return;}
  var url=window.location.origin+window.location.pathname+"?share="+encodeURIComponent(estId);
  var title="ATP MAHA PWD — "+(estName||"Estimate");
  var text="📋 Estimate link: "+(estName||"Untitled");
  if(navigator.share){
    navigator.share({title:title,text:text,url:url}).catch(function(){});
  } else if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(function(){
      showToast("Share link copied! 🔗 Paste it anywhere to share this estimate.","success");
    }).catch(function(){showToast("Link: "+url,"info");});
  } else {
    showToast("Link: "+url,"info");
  }
}

/* Called after login when the app was opened via a ?share=ESTID link.
   Loads that estimate directly — as the user's own if they own it,
   otherwise as an editable copy (matches browseLoadEst behaviour). */
function loadSharedEstimateFromLink(estId){
  if(!estId)return;
  if(!CU||!window.firebase||!firebase.firestore){showToast("Login first to open the shared estimate","warn");return;}
  firebase.firestore().collection("estimates").doc(estId).get().then(function(doc){
    if(!doc.exists){showToast("Shared estimate not found ❌ (deleted or invalid link)","error");return;}
    var d=doc.data();
    var isOwn=!!(d.uid&&CU&&d.uid===CU.uid);
    if(typeof items!=="undefined"&&d.items){
      items=d.items.map(function(x){return Object.assign({},x);});
    }
    var m=d.meta||d.cover||{};
    ["pReg","pCir","pDiv","pSub","pName"].forEach(function(k){var el=G(k);if(el)el.value=m[k]||m["p"+k.slice(1)]||"";});
    try{_atpCloudApplyRest(d);}catch(_ar2){}
    if(d.lkm){for(var ki in d.lkm){var el2=G("lkm_"+ki);if(el2&&typeof onKmChange==="function"){el2.value=d.lkm[ki];onKmChange(parseInt(ki));}}}
    if(typeof buildLCT==="function")buildLCT();
    if(typeof lcExtraRestore==="function")lcExtraRestore(d.lcExtra);   /* user-added Lead Charges rows */
    if(typeof updateAll==="function")updateAll();
    if(typeof upCover==="function")upCover();
    if(typeof upMeta==="function")upMeta();
    CUR_EST_ID=isOwn?estId:null;
    if(G("homeScreen"))G("homeScreen").style.display="none";
    if(G("appShell"))G("appShell").style.display="block";
    if(typeof goTab==="function")goTab(0);
    showToast(isOwn?"Your estimate opened via share link ✅":"Shared estimate opened via link 🔗 (If you save, a copy will be created under your name)","success");
  }).catch(function(e){showToast("Error opening shared link: "+e.message,"error");});
}

function renderHomeScreen(){
  var el=G("homeEstList");if(!el)return;
  var d=(typeof getStore==="function")?getStore():{};
  var keys=Object.keys(d).filter(function(k){return k!=="__autosave__";});
  if(!keys.length){
    el.innerHTML='<div style="color:var(--mu);font-size:.62rem;padding:1.2rem 0;text-align:center;font-style:italic">No saved estimates yet.<br>Tap New Estimate to start.</div>';
    return;
  }
  var rows=[];
  for(var i=0;i<keys.length;i++){
    var k=keys[i];var est=d[k];
    var cnt=(est.items||[]).length;
    var dt=est.dt||"";
    rows.push('<div style="background:#fff;border-radius:8px;padding:.6rem .8rem;margin-bottom:.5rem;border:1px solid var(--bd);display:flex;align-items:center;gap:.5rem">'
      +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:.68rem;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+k+'</div>'
        +'<div style="font-size:.56rem;color:var(--mu)">'+cnt+' items &middot; '+dt+'</div>'
      +'</div>'
      +'<button class="btn bp" style="font-size:.56rem;padding:.25rem .5rem" data-idx="'+i+'" onclick="homeOpen(parseInt(this.dataset.idx))">Open</button>'
      +'<button style="background:none;border:none;color:#c00;cursor:pointer;font-size:.85rem;padding:.2rem .4rem" data-idx="'+i+'" onclick="homeDel(parseInt(this.dataset.idx))">🗑</button>'
    +'</div>');
  }
  el.innerHTML=rows.join("");
  el._keys=keys;
}

function homeOpen(idx){
  var el=G("homeEstList");if(!el||!el._keys)return;
  var nm=el._keys[idx];
  if(typeof loadEstimate==="function")loadEstimate(nm);
  if(G("homeScreen"))G("homeScreen").style.display="none";
  if(G("appShell"))G("appShell").style.display="block";
  if(typeof goTab==="function")goTab(0);
}

function homeDel(idx){
  var el=G("homeEstList");if(!el||!el._keys)return;
  var nm=el._keys[idx];
  if(!confirm("Delete '"+nm+"'?"))return;
  if(typeof delStore==="function")delStore(nm);
  renderHomeScreen();
}

function lpLoad(){
  /* Try localStorage cache first so data shows instantly even after logout/reload */
  try{
    var cached=localStorage.getItem("_lp_data_cache");
    if(cached){
      var cd=JSON.parse(cached);
      LP_DATA.images=cd.images||[];
      LP_DATA.docs=cd.docs||[];
      LP_DATA.videos=cd.videos||[];
      LP_DATA.contact=cd.contact||{email:"thongeaditya@gmail.com",phone:"+91 8975962565"};
      lpRenderSlider();lpRenderDocs();lpRenderVideos();lpRenderContact();
    }
  }catch(e){}
  /* Then fetch fresh from Firebase (works even when logged out - public read) */
  if(!window.firebase||!firebase.firestore)return;
  firebase.firestore().collection("config").doc("loginPage").get()
    .then(function(d){
      if(d.exists){
        var data=d.data();
        LP_DATA.images=data.images||[];
        LP_DATA.docs=data.docs||[];
        LP_DATA.videos=data.videos||[];
        LP_DATA.contact=data.contact||{email:"thongeaditya@gmail.com",phone:"+91 8975962565"};
        /* Cache for next load */
        try{localStorage.setItem("_lp_data_cache",JSON.stringify(LP_DATA));}catch(e){}
      }
      lpRenderSlider();lpRenderDocs();lpRenderVideos();lpRenderContact();
    }).catch(function(){
      /* Firebase offline - cached data already shown */
    });
}

function lpRenderSlider(){
  /* Cloudinary plan limit reached — login page background is now a fixed CSS
     gradient always, and never loads images from Cloudinary/Firestore.
     (Admin-uploaded slider images, if any, are simply ignored here.) */
  var bgSl=G("lpBgSlider"),dots=G("lpDots"),cap=G("lpSlideCap");
  if(!bgSl)return;
  clearInterval(LP_TMR);
  LP_IDX=0;
  bgSl.innerHTML='<div class="lp-bg-slide active" style="background:linear-gradient(135deg,#0d2b18,#1a3a2a,#0a1a30)"></div>';
  if(dots){dots.innerHTML='';dots.style.display='none';}
  if(cap)cap.style.display='none';
}

function lpOpenImgZoom(url,cap){
  var ov=document.createElement("div");
  ov.style.cssText="position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:zoom-out";
  ov.onclick=function(){if(document.body.contains(ov))document.body.removeChild(ov);};
  ov.innerHTML='<img src="'+esc(url)+'" style="max-width:92vw;max-height:80vh;border-radius:8px;box-shadow:0 4px 30px rgba(0,0,0,.6)">'+
    (cap?'<div style="color:#fff;margin-top:.5rem;font-size:.75rem;max-width:80vw;text-align:center">'+esc(cap)+'</div>':'')+
    '<div style="color:rgba(255,255,255,.45);font-size:.6rem;margin-top:.3rem">Tap to close</div>';
  document.body.appendChild(ov);
}

function lpGoSlide(n){
  LP_IDX=n;
  var bgSl=G("lpBgSlider"),dots=G("lpDots"),cap=G("lpSlideCap");
  if(!bgSl)return;
  bgSl.querySelectorAll(".lp-bg-slide").forEach(function(el,i){el.classList.toggle("active",i===n);});
  if(dots)dots.querySelectorAll(".lp-dot").forEach(function(el,i){el.classList.toggle("active",i===n);});
  if(cap){var imgs=LP_DATA.images||[];if(imgs[n]&&imgs[n].caption){cap.textContent=imgs[n].caption;cap.style.display='block';}else{cap.style.display='none';}}
}

function lpRenderDocs(){
  var el=G("lpDocList");if(!el)return;
  var docs=LP_DATA.docs||[];
  if(!docs.length){el.innerHTML='<div class="lp-empty">No documents added yet.</div>';return;}
  el.innerHTML=docs.map(function(doc){
    var icon=(doc.url||"").toLowerCase().includes(".pdf")?"📄":"📋";
    return '<a class="lp-doc-item" href="'+esc(doc.url||"#")+'" target="_blank" rel="noopener">'+
      '<span class="lp-doc-icon">'+icon+'</span>'+
      '<span class="lp-doc-name">'+esc(doc.name||"Document")+'</span>'+
      '<span class="lp-doc-arr">→</span></a>';
  }).join("");
}

function lpRenderVideos(){
  var el=G("lpVidList");if(!el)return;
  var vids=LP_DATA.videos||[];
  if(!vids.length){el.innerHTML='<div class="lp-empty">No videos added yet.</div>';return;}
  el.innerHTML=vids.map(function(v){
    var url=v.url||"";
    var m=url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    var vid=m?m[1]:"";
    var thumb=vid?"https://img.youtube.com/vi/"+vid+"/mqdefault.jpg":"";
    return '<a class="lp-vid-item" href="'+esc(url)+'" target="_blank" rel="noopener">'+
      (thumb
        ?'<img class="lp-vid-thumb" src="'+thumb+'" alt="" onerror="this.style.display=\'none\'">'
        :'<div class="lp-vid-yt">YT</div>')+
      '<span class="lp-vid-label">'+esc(v.label||"Tutorial")+'</span>'+
      '<span class="lp-vid-play">▶</span></a>';
  }).join("");
}

function lpRenderContact(){
  var c=LP_DATA.contact||{};
  var email=c.email||"thongeaditya@gmail.com";
  var phone=c.phone||"+91 8975962565";
  var eEl=G("lpContactEmail"),pEl=G("lpContactPhone");
  var eLink=G("lpEmailLink"),pLink=G("lpPhoneLink"),waLink=G("lpWaLink");
  if(eEl)eEl.textContent=email;
  if(pEl)pEl.textContent=phone;
  if(eLink)eLink.href="mailto:"+email;
  if(pLink)pLink.href="tel:"+phone.replace(/\s/g,"");
  if(waLink){var digits=phone.replace(/[^0-9]/g,"");waLink.href="https://wa.me/"+digits;}
}

function lpLoadAdmin(){
  if(!window.firebase||!firebase.firestore)return;
  firebase.firestore().collection("config").doc("loginPage").get()
    .then(function(d){
      if(d.exists){
        var data=d.data();
        LP_DATA.images=data.images||[];
        LP_DATA.docs=data.docs||[];
        LP_DATA.videos=data.videos||[];
        LP_DATA.contact=data.contact||{email:"thongeaditya@gmail.com",phone:"+91 8975962565"};
      }
      lpRenderAdminImages();
      lpRenderAdminDocs();
      lpRenderAdminVideos();
      /* Pre-fill contact fields */
      var c=LP_DATA.contact||{};
      if(G("lpSetEmail"))G("lpSetEmail").value=c.email||"thongeaditya@gmail.com";
      if(G("lpSetPhone"))G("lpSetPhone").value=c.phone||"+91 8975962565";
    }).catch(function(){});
}

function lpSaveData(callback){
  if(!window.firebase||!firebase.firestore)return;
  /* Update localStorage cache immediately */
  try{localStorage.setItem("_lp_data_cache",JSON.stringify(LP_DATA));}catch(e){}
  firebase.firestore().collection("config").doc("loginPage").set(LP_DATA)
    .then(function(){
      var ok=G("lpSaveOK");if(ok){ok.style.display="block";setTimeout(function(){ok.style.display="none";},3000);}
      /* Refresh live login page */
      lpRenderSlider();lpRenderDocs();lpRenderVideos();lpRenderContact();
      if(callback)callback();
    }).catch(function(e){showToast("Error: "+e.message,"error");});
}

function lpRenderAdminImages(){
  var el=G("lpImgAdminList");if(!el)return;
  var imgs=LP_DATA.images||[];
  if(!imgs.length){el.innerHTML='<div style="font-size:.62rem;color:#aaa;padding:.3rem 0">No images yet. Upload above.</div>';return;}
  var cols=imgs.length<=2?2:3;
  var html='<div style="font-size:.6rem;color:#555;margin-bottom:.4rem;font-weight:700">'+imgs.length+' photo(s) — drag sequence using ▲▼ buttons</div>';
  html+='<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:.4rem">';
  imgs.forEach(function(img,i){
    html+='<div style="display:flex;align-items:center;gap:6px;background:#f9f7f4;border-radius:8px;padding:5px 6px;border:1px solid #e0dbd0">'+
      '<div style="font-size:.65rem;font-weight:900;color:#1565c0;min-width:18px;text-align:center">'+(i+1)+'</div>'+
      '<img src="'+esc(img.url||"")+'" style="width:52px;height:40px;object-fit:cover;border-radius:4px;flex-shrink:0;" loading="lazy">'+
      '<div style="flex:1;min-width:0;font-size:.58rem;color:#444;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(img.caption?esc(img.caption):'<span style="color:#aaa">No caption</span>')+'</div>'+
      '<div style="display:flex;flex-direction:column;gap:2px">'+
        '<button onclick="lpMoveImage('+i+',-1)" '+(i===0?'disabled style="opacity:.3;cursor:not-allowed;"':'')+' style="padding:1px 5px;background:#1565c0;color:#fff;border:none;border-radius:3px;font-size:.6rem;cursor:pointer;line-height:1.4">▲</button>'+
        '<button onclick="lpMoveImage('+i+',1)" '+(i===imgs.length-1?'disabled style="opacity:.3;cursor:not-allowed;"':'')+' style="padding:1px 5px;background:#1565c0;color:#fff;border:none;border-radius:3px;font-size:.6rem;cursor:pointer;line-height:1.4">▼</button>'+
      '</div>'+
      '<button onclick="lpDelImage('+i+')" style="width:22px;height:22px;border-radius:50%;background:#c62828;color:#fff;border:none;cursor:pointer;font-size:.65rem;font-weight:900;flex-shrink:0">✕</button>'+
    '</div>';
  });
  html+='</div>';
  el.innerHTML=html;
}

function lpMoveImage(i,dir){
  var imgs=LP_DATA.images||[];
  var j=i+dir;
  if(j<0||j>=imgs.length)return;
  var tmp=imgs[i];imgs[i]=imgs[j];imgs[j]=tmp;
  LP_DATA.images=imgs;
  lpSaveData(function(){lpRenderAdminImages();});
}

function lpRenderAdminDocs(){
  var el=G("lpDocAdminList");if(!el)return;
  var docs=LP_DATA.docs||[];
  if(!docs.length){el.innerHTML='<div style="font-size:.62rem;color:#aaa;padding:.3rem 0">No documents yet.</div>';return;}
  el.innerHTML='<div style="font-size:.6rem;color:#555;margin-bottom:.4rem;font-weight:700">'+docs.length+' document(s) — use ▲▼ to reorder</div>'+
  docs.map(function(doc,i){
    return '<div style="display:flex;align-items:center;gap:.5rem;padding:.35rem .4rem;border-bottom:1px solid #f0ede8;background:'+(i%2===0?'#fff':'#fafaf8')+';border-radius:4px;margin-bottom:2px">'+
      '<div style="font-size:.65rem;font-weight:900;color:#1565c0;min-width:18px;text-align:center">'+(i+1)+'</div>'+
      '<span style="font-size:1rem">📄</span>'+
      '<div style="flex:1;min-width:0">'+
        '<div style="font-size:.62rem;font-weight:700;color:#333;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(doc.name||"")+'</div>'+
        '<div style="font-size:.52rem;color:#aaa;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(doc.url||"")+'</div>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;gap:2px">'+
        '<button onclick="lpMoveDoc('+i+',-1)" '+(i===0?'disabled style="opacity:.3;cursor:not-allowed;"':'')+' style="padding:1px 5px;background:#1565c0;color:#fff;border:none;border-radius:3px;font-size:.6rem;cursor:pointer;line-height:1.4">▲</button>'+
        '<button onclick="lpMoveDoc('+i+',1)" '+(i===docs.length-1?'disabled style="opacity:.3;cursor:not-allowed;"':'')+' style="padding:1px 5px;background:#1565c0;color:#fff;border:none;border-radius:3px;font-size:.6rem;cursor:pointer;line-height:1.4">▼</button>'+
      '</div>'+
      '<button class="xbtn" style="background:#c62828;color:#fff;border:none;border-radius:50%;width:22px;height:22px;flex-shrink:0;font-size:.65rem;font-weight:900" onclick="lpDelDoc('+i+')">✕</button>'+
    '</div>';
  }).join("");
}

function lpMoveDoc(i,dir){
  var docs=LP_DATA.docs||[];
  var j=i+dir;
  if(j<0||j>=docs.length)return;
  var tmp=docs[i];docs[i]=docs[j];docs[j]=tmp;
  LP_DATA.docs=docs;
  lpSaveData(function(){lpRenderAdminDocs();});
}

function lpRenderAdminVideos(){
  var el=G("lpVidAdminList");if(!el)return;
  var vids=LP_DATA.videos||[];
  if(!vids.length){el.innerHTML='<div style="font-size:.62rem;color:#aaa;padding:.3rem 0">No videos yet.</div>';return;}
  el.innerHTML=vids.map(function(v,i){
    return '<div style="display:flex;align-items:center;gap:.5rem;padding:.3rem 0;border-bottom:1px solid #f0ede8">'+
      '<span style="font-size:1.1rem">▶️</span>'+
      '<div style="flex:1;min-width:0"><div style="font-size:.62rem;font-weight:700;color:#333">'+esc(v.label||"")+'</div>'+
      '<div style="font-size:.55rem;color:#aaa;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(v.url||"")+'</div></div>'+
      '<button class="xbtn" style="background:#c62828;color:#fff;border:none;flex-shrink:0" onclick="lpDelVideo('+i+')">✕</button></div>';
  }).join("");
}

function lpUploadImage(input){
  if(!input.files||!input.files[0])return;
  var file=input.files[0];
  var prog=G("lpImgUploadProg"),pct=G("lpImgPct"),err=G("lpImgErr");
  if(prog)prog.style.display="block";
  if(err)err.style.display="none";
  uploadCDN(file,"atp-maha-pwd/login-images",
    function(p){if(pct)pct.textContent=p;},
    function(url){
      if(prog)prog.style.display="none";
      input.value="";
      var cap=(G("lpImgCap")?G("lpImgCap").value||"":"");
      LP_DATA.images=LP_DATA.images||[];
      LP_DATA.images.push({url:url,caption:cap});
      if(G("lpImgCap"))G("lpImgCap").value="";
      lpSaveData(function(){lpRenderAdminImages();});
    },
    function(e){
      if(prog)prog.style.display="none";
      if(err){err.textContent="Upload failed: "+e;err.style.display="block";}
    }
  );
}

function lpAddImage(){
  var url=(G("lpImgUrl")?G("lpImgUrl").value||"":"").trim();
  var cap=(G("lpImgCap")?G("lpImgCap").value||"":"").trim();
  var err=G("lpImgErr");
  if(!url){if(err){err.textContent="Enter an image URL";err.style.display="block";}return;}
  if(err)err.style.display="none";
  LP_DATA.images=LP_DATA.images||[];
  LP_DATA.images.push({url:url,caption:cap});
  if(G("lpImgUrl"))G("lpImgUrl").value="";
  if(G("lpImgCap"))G("lpImgCap").value="";
  lpSaveData(function(){lpRenderAdminImages();});
}

function lpDelImage(i){LP_DATA.images.splice(i,1);lpSaveData(function(){lpRenderAdminImages();});}

function lpAddDoc(){
  var url=(G("lpDocUrl")?G("lpDocUrl").value||"":"").trim();
  var name=(G("lpDocName")?G("lpDocName").value||"":"").trim();
  var err=G("lpDocErr");
  if(!url||!name){if(err){err.textContent="Enter both URL and document name";err.style.display="block";}return;}
  if(err)err.style.display="none";
  LP_DATA.docs=LP_DATA.docs||[];
  LP_DATA.docs.push({url:url,name:name});
  if(G("lpDocUrl"))G("lpDocUrl").value="";
  if(G("lpDocName"))G("lpDocName").value="";
  lpSaveData(function(){lpRenderAdminDocs();});
}

function lpDelDoc(i){LP_DATA.docs.splice(i,1);lpSaveData(function(){lpRenderAdminDocs();});}

function lpAddVideo(){
  var url=(G("lpVidUrl")?G("lpVidUrl").value||"":"").trim();
  var label=(G("lpVidLabel")?G("lpVidLabel").value||"":"").trim();
  var err=G("lpVidErr");
  if(!url||!url.includes("youtu")){if(err){err.textContent="Enter a valid YouTube URL";err.style.display="block";}return;}
  if(!label){if(err){err.textContent="Enter a video title";err.style.display="block";}return;}
  if(err)err.style.display="none";
  LP_DATA.videos=LP_DATA.videos||[];
  LP_DATA.videos.push({url:url,label:label});
  if(G("lpVidUrl"))G("lpVidUrl").value="";
  if(G("lpVidLabel"))G("lpVidLabel").value="";
  lpSaveData(function(){lpRenderAdminVideos();});
}

function lpDelVideo(i){LP_DATA.videos.splice(i,1);lpSaveData(function(){lpRenderAdminVideos();});}

function lpSaveContact(){
  var email=(G("lpSetEmail")?G("lpSetEmail").value||"":"").trim();
  var phone=(G("lpSetPhone")?G("lpSetPhone").value||"":"").trim();
  if(!email&&!phone)return;
  LP_DATA.contact={email:email,phone:phone};
  lpSaveData(function(){
    var ok=G("lpContactOK");if(ok){ok.style.display="block";setTimeout(function(){ok.style.display="none";},2500);}
    lpRenderContact();
  });
}

function lpGetReply(q){
  var ql=q.toLowerCase();
  for(var i=0;i<LP_QA.length;i++){
    var item=LP_QA[i];
    for(var j=0;j<item.k.length;j++){
      if(ql.includes(item.k[j])){return item;}
    }
  }
  return null;
}

function lpOpenChat(){
  var modal=G("lpChatModal");
  if(modal)modal.style.display="block";
  LP_CHAT_OPEN=true;
  setTimeout(function(){var inp=G("lpChatInput");if(inp)inp.focus();},100);
  /* update contact links */
  var c=LP_DATA.contact||{};
  var ev=G("lpChatEmailVal"),pv=G("lpChatPhoneVal");
  var el=G("lpChatEmail"),pl=G("lpChatPhone");
  if(ev)ev.textContent=c.email||"thongeaditya@gmail.com";
  if(pv)pv.textContent=c.phone||"+91 8975962565";
  if(el)el.href="mailto:"+(c.email||"thongeaditya@gmail.com");
  if(pl)pl.href="tel:"+(c.phone||"+91 8975962565").replace(/\s/g,"");
}

function lpCloseChat(){
  var modal=G("lpChatModal");
  if(modal)modal.style.display="none";
  LP_CHAT_OPEN=false;
}

function lpAddMsg(text,isUser,showContact){
  var msgs=G("lpChatMsgs");if(!msgs)return;
  var div=document.createElement("div");
  div.className=isUser?"lp-user-msg":"lp-bot-msg";
  div.innerHTML=text;
  msgs.appendChild(div);
  if(showContact){
    var cr=G("lpChatContactRow");
    if(cr)cr.style.display="flex";
  }
  msgs.scrollTop=msgs.scrollHeight;
}

function lpSendMsg(){
  var inp=G("lpChatInput");if(!inp)return;
  var q=(inp.value||"").trim();
  if(!q)return;
  inp.value="";
  /* Hide quick buttons after first message */
  var qb=G("lpQuickBtns");if(qb)qb.style.display="none";
  lpAddMsg(q,true);
  /* typing indicator */
  var msgs=G("lpChatMsgs");
  var typing=document.createElement("div");
  typing.className="lp-bot-msg";
  typing.id="lpTyping";
  typing.innerHTML='<span style="display:flex;gap:3px;align-items:center"><span style="width:6px;height:6px;background:#1565c0;border-radius:50%;animation:lpDot .9s infinite"></span><span style="width:6px;height:6px;background:#1565c0;border-radius:50%;animation:lpDot .9s .3s infinite"></span><span style="width:6px;height:6px;background:#1565c0;border-radius:50%;animation:lpDot .9s .6s infinite"></span></span>';
  if(msgs)msgs.appendChild(typing);
  if(msgs)msgs.scrollTop=msgs.scrollHeight;
  setTimeout(function(){
    var t=G("lpTyping");if(t)t.remove();
    var result=lpGetReply(q);
    if(result){
      lpAddMsg(result.a,false,result.showContact);
    } else {
      var c=LP_DATA.contact||{};
      lpAddMsg("I am not sure about that 😊<br>Please contact us directly — we will help you!<br>✉️ "+(c.email||"thongeaditya@gmail.com")+"<br>📱 "+(c.phone||"+91 8975962565"),false,true);
    }
  },700);
}

function lpQuick(btn,q){
  var inp=G("lpChatInput");if(inp)inp.value=q;
  lpSendMsg();
}

function showPageHelp(n){
  var h=PG_HELP[n];if(!h)return;
  var modal=G("pgHelpModal"),title=G("pgHelpTitle"),body=G("pgHelpBody"),ico=G("pgHelpIco");
  if(!modal)return;
  if(ico)ico.textContent=h.ico;
  if(title)title.textContent=h.title;
  if(body)body.innerHTML=h.body;
  modal.style.display="block";
}

function closePgHelp(){
  var modal=G("pgHelpModal");if(modal)modal.style.display="none";
}

function shareApp(){
  var url=window.location.href.split("?")[0];
  var title="Maha PWD Estimator";
  var text="Maharashtra PWD BOQ Estimation App\n• 2009+ SSR items (2022-23)\n• Lead chart, Measurements, Rate Analysis\n• Abstract, Royalty, Steel Calc & more\n\nOpen here: "+url;
  if(navigator.share){
    /* Try with logo file */
    fetch(APP_LOGO_B64).then(function(r){return r.blob();}).then(function(blob){
      var file=new File([blob],"MahaPWD_logo.png",{type:"image/png"});
      var shareData={title:title,text:text,files:[file]};
      if(navigator.canShare&&navigator.canShare(shareData)){
        navigator.share(shareData).catch(function(){});
      } else {
        navigator.share({title:title,text:text,url:url}).catch(function(){});
      }
    }).catch(function(){
      navigator.share({title:title,text:text,url:url}).catch(function(){});
    });
  } else {
    /* Fallback: copy to clipboard */
    var txt=title+"\n"+text;
    navigator.clipboard?navigator.clipboard.writeText(txt).then(function(){showToast("App link copied to clipboard! 📋","success");})
      .catch(function(){showToast("Share: "+url,"info");})
      :showToast("Share: "+url,"info");
  }
}


/* ════════════════════════════════════════════════════════
   USER ⇄ ADMIN CHAT (two-way)
   Firestore collection: "queries" (kept same name/rules as before)
   NEW doc shape (every message is its own doc):
     {uid,name,email,phone,sender:'user'|'admin',message,
      seenByAdmin,seenByUser,createdAt}
   OLD doc shape (still read + rendered for backward compatibility):
     {uid,name,email,phone,message,status,reply,seenByUser,createdAt,repliedAt}
   ════════════════════════════════════════════════════════ */
function cDt(ts){return (ts&&ts.seconds)?new Date(ts.seconds*1000).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}):"Just now";}

/* Flattens a mixed batch of old+new query docs into one ordered list of chat "turns" */
function normalizeQueryDocs(docs){
  var out=[];
  (docs||[]).forEach(function(r){
    if(r.sender){
      out.push({sender:r.sender,text:r.message||"",createdAt:r.createdAt,id:(r.id||r._id)+"_m"});
    }else{
      out.push({sender:"user",text:r.message||"",createdAt:r.createdAt,id:(r.id||r._id)+"_u"});
      if(r.reply){out.push({sender:"admin",text:r.reply,createdAt:r.repliedAt||r.createdAt,id:(r.id||r._id)+"_a"});}
    }
  });
  out.sort(function(a,b){
    var ta=(a.createdAt&&a.createdAt.seconds)?a.createdAt.seconds:0;
    var tb=(b.createdAt&&b.createdAt.seconds)?b.createdAt.seconds:0;
    return ta-tb;
  });
  return out;
}

/* selfSender: 'user' when rendering inside the user widget, 'admin' inside the admin panel — decides bubble alignment */
function renderBubblesHTML(turns,selfSender){
  return (turns||[]).map(function(t){
    var mine=t.sender===selfSender;
    var label=t.sender==="admin"?"Admin":"User";
    return "<div style='display:flex;justify-content:"+(mine?"flex-end":"flex-start")+";margin-bottom:.4rem'>"+
      "<div style='max-width:78%;background:"+(mine?"#18602f":"#eef1ee")+";color:"+(mine?"#fff":"#222")+";padding:.45rem .65rem;border-radius:10px;font-size:.74rem;line-height:1.35'>"+
        (mine?"":"<div style='font-size:.58rem;font-weight:800;opacity:.65;margin-bottom:.15rem'>"+esc(label)+"</div>")+
        "<div style='white-space:pre-wrap;word-break:break-word'>"+esc(t.text)+"</div>"+
        "<div style='font-size:.55rem;opacity:.6;margin-top:.2rem;text-align:right'>"+cDt(t.createdAt)+"</div>"+
      "</div></div>";
  }).join("");
}

/* ── USER SIDE: floating chat button + modal ─────────────────────── */
var MY_QUERY_UNSUB=null,FB_THREAD_UNSUB=null;

function injectFeedbackWidget(){
  if(G('fbWidgetBtn'))return;
  var btn=document.createElement('button');
  btn.id='fbWidgetBtn';
  btn.title='Chat with Admin';
  btn.innerHTML='💬';
  btn.style.cssText='position:fixed;bottom:18px;right:18px;width:52px;height:52px;border-radius:50%;background:#18602f;color:#fff;border:none;font-size:1.4rem;box-shadow:0 4px 14px rgba(0,0,0,.35);cursor:pointer;z-index:2147482000;display:flex;align-items:center;justify-content:center';
  var badge=document.createElement('span');
  badge.id='fbWidgetBadge';
  badge.style.cssText='display:none;position:absolute;top:-2px;right:-2px;background:#e53935;color:#fff;border-radius:8px;min-width:16px;height:16px;font-size:.6rem;font-weight:900;line-height:16px;text-align:center;padding:0 3px;box-sizing:border-box';
  btn.appendChild(badge);
  btn.onclick=function(){openFeedbackModal();};
  document.body.appendChild(btn);
}

function openFeedbackModal(){
  var m=G('fbModal');
  if(!m){
    m=document.createElement('div');
    m.id='fbModal';
    m.style.cssText='display:flex;position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:1rem';
    m.addEventListener('click',function(e){if(e.target===m)closeFeedbackModal();});
    var box=document.createElement('div');
    box.style.cssText='background:#fff;border-radius:14px;max-width:440px;width:100%;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.4);height:70vh;max-height:600px;display:flex;flex-direction:column';
    var hdr=document.createElement('div');
    hdr.style.cssText='background:#18602f;color:#fff;padding:.85rem 1.2rem;display:flex;align-items:center;justify-content:space-between;flex-shrink:0';
    var ttl=document.createElement('span');
    ttl.style.cssText='font-size:.88rem;font-weight:900';
    ttl.textContent='💬 Chat with Admin';
    var cls=document.createElement('button');
    cls.textContent='✕';
    cls.style.cssText='background:none;border:none;color:#fff;font-size:1.3rem;cursor:pointer;margin-left:auto;padding:0 .3rem';
    cls.onclick=function(){closeFeedbackModal();};
    hdr.appendChild(ttl);hdr.appendChild(cls);
    var body=document.createElement('div');
    body.id='fbBody';
    body.style.cssText='padding:.9rem;overflow-y:auto;font-size:.78rem;flex:1;min-height:120px';
    var footer=document.createElement('div');
    footer.style.cssText='padding:.7rem .9rem;border-top:1px solid #eee;flex-shrink:0;display:flex;gap:.4rem';
    var ta=document.createElement('textarea');
    ta.id='fbMsgInput';
    ta.placeholder='Write your problem or question here...';
    ta.style.cssText='flex:1;resize:none;height:44px;padding:.4rem .5rem;border:1px solid #ddd;border-radius:6px;font-size:.75rem;font-family:inherit';
    ta.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submitFeedback();}});
    var sendBtn=document.createElement('button');
    sendBtn.textContent='Send';
    sendBtn.style.cssText='padding:.4rem .9rem;background:#18602f;color:#fff;border:none;border-radius:6px;font-size:.75rem;font-weight:800;cursor:pointer;flex-shrink:0';
    sendBtn.onclick=function(){submitFeedback();};
    footer.appendChild(ta);footer.appendChild(sendBtn);
    box.appendChild(hdr);box.appendChild(body);box.appendChild(footer);
    m.appendChild(box);
    document.body.appendChild(m);
  }
  m.style.display='flex';
  startFbThreadListener();
}

function closeFeedbackModal(){
  var m=G('fbModal');if(m)m.style.display='none';
  if(FB_THREAD_UNSUB){FB_THREAD_UNSUB();FB_THREAD_UNSUB=null;}
}

function submitFeedback(){
  if(!CU){showToast('Please login first','warn');return;}
  var ta=G('fbMsgInput');
  var msg=(ta.value||'').trim();
  if(!msg){showToast('Please write your query','warn');return;}
  if(!window.firebase||!firebase.firestore)return;
  ta.disabled=true;
  firebase.firestore().collection('queries').add({
    uid:CU.uid,
    name:CU.displayName||CU.email||CU.phoneNumber||'',
    email:CU.email||'',
    phone:CU.phoneNumber||'',
    sender:'user',
    message:msg,
    seenByAdmin:false,
    seenByUser:true,
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){
    ta.value='';ta.disabled=false;
  }).catch(function(e){
    ta.disabled=false;
    showToast('Error: '+e.message,'error');
  });
}

function startFbThreadListener(){
  if(FB_THREAD_UNSUB){FB_THREAD_UNSUB();FB_THREAD_UNSUB=null;}
  var body=G('fbBody');
  if(!CU){if(body)body.innerHTML='<div style="text-align:center;color:#aaa;padding:1rem">Please login first.</div>';return;}
  if(!window.firebase||!firebase.firestore)return;
  if(body)body.innerHTML='Loading...';
  FB_THREAD_UNSUB=firebase.firestore().collection('queries')
    .where('uid','==',CU.uid)
    .onSnapshot(function(snap){
      var docs=[];snap.forEach(function(d){docs.push(Object.assign({id:d.id},d.data()));});
      var turns=normalizeQueryDocs(docs);
      var b=G('fbBody');if(!b)return;
      if(!turns.length){b.innerHTML='<div style="text-align:center;color:#aaa;padding:1rem;font-style:italic">No messages yet. Write your question below 👇</div>';}
      else{b.innerHTML=renderBubblesHTML(turns,'user');b.scrollTop=b.scrollHeight;}
      markFeedbackSeen(docs);
    },function(e){FB_THREAD_UNSUB=null;});
}

function markFeedbackSeen(docs){
  if(!CU||!window.firebase||!firebase.firestore)return;
  var db=firebase.firestore();
  (docs||[]).forEach(function(r){
    if(r.sender==='admin'&&r.seenByUser===false){db.collection('queries').doc(r.id).update({seenByUser:true}).catch(function(){});}
    else if(!r.sender&&r.status==='replied'&&r.seenByUser===false){db.collection('queries').doc(r.id).update({seenByUser:true}).catch(function(){});}
  });
}

function startMyQueryListener(uid){
  if(MY_QUERY_UNSUB)MY_QUERY_UNSUB();
  if(!window.firebase||!firebase.firestore)return;
  MY_QUERY_UNSUB=firebase.firestore().collection('queries')
    .where('uid','==',uid)
    .onSnapshot(function(snap){
      var unseen=0;
      snap.forEach(function(d){
        var r=d.data();
        if(r.sender==='admin'&&r.seenByUser===false)unseen++;
        else if(!r.sender&&r.status==='replied'&&r.seenByUser===false)unseen++;
      });
      var badge=G('fbWidgetBadge');
      if(badge){badge.textContent=unseen>0?unseen:'';badge.style.display=unseen>0?'flex':'none';}
    },function(e){MY_QUERY_UNSUB=null;});
}
function stopMyQueryListener(){if(MY_QUERY_UNSUB){MY_QUERY_UNSUB();MY_QUERY_UNSUB=null;}}


/* ════════════════════════════════════════════════════════
   ADMIN: PER-USER CHAT INBOX (bottom-right floating button
   + Users-tab "💬 Chat" button both open this, filtered to
   that specific user's full conversation history)
   ════════════════════════════════════════════════════════ */
var QRY_UNSUB_A=null,QRY_UNSUB_B=null,A_CHAT_UNSUB=null,A_CHAT_UID=null,A_CHAT_USERS_CACHE={},AD_UNREAD_MAP={};

/* Paints/clears the red unread dot on each Users-tab chat button, without re-rendering the whole table */
function aApplyUnreadDots(){
  document.querySelectorAll('[id^="chatDot_"]').forEach(function(el){
    var uid=el.id.slice(8);
    var n=AD_UNREAD_MAP[uid]||0;
    el.style.display=n>0?'flex':'none';
    el.textContent=n>0?(n>9?'9+':n):'';
  });
}

function aInjectQueryInbox(){
  if(G('aQryBtn'))return;
  var btn=document.createElement('button');
  btn.id='aQryBtn';
  btn.title='User Chats';
  btn.innerHTML='💬';
  btn.style.cssText='position:fixed;bottom:18px;right:18px;width:52px;height:52px;border-radius:50%;background:#1565c0;color:#fff;border:none;font-size:1.4rem;box-shadow:0 4px 14px rgba(0,0,0,.35);cursor:pointer;z-index:2147482000;display:flex;align-items:center;justify-content:center';
  var badge=document.createElement('span');
  badge.id='aQryBadge';
  badge.style.cssText='display:none;position:absolute;top:-2px;right:-2px;background:#e53935;color:#fff;border-radius:8px;min-width:16px;height:16px;font-size:.6rem;font-weight:900;line-height:16px;text-align:center;padding:0 3px;box-sizing:border-box';
  btn.appendChild(badge);
  btn.onclick=function(){aOpenQueriesPanel();};
  document.body.appendChild(btn);
}

function aStartQueryListener(){
  aStopQueryListener();
  if(!window.firebase||!firebase.firestore)return;
  var db=firebase.firestore(),counts={legacy:0,neu:0},maps={legacy:{},neu:{}},prevTotal=-1;
  function recalc(){
    var n=counts.legacy+counts.neu;
    var badge=G('aQryBadge');
    if(badge){badge.textContent=n>0?n:'';badge.style.display=n>0?'flex':'none';}
    if(prevTotal>=0&&n>prevTotal)showToast('💬 New message from a user!','info');
    prevTotal=n;
    var merged={};
    Object.keys(maps.legacy).forEach(function(u){merged[u]=(merged[u]||0)+maps.legacy[u];});
    Object.keys(maps.neu).forEach(function(u){merged[u]=(merged[u]||0)+maps.neu[u];});
    AD_UNREAD_MAP=merged;
    aApplyUnreadDots();
  }
  QRY_UNSUB_A=db.collection('queries').where('status','==','open').onSnapshot(function(s){
    counts.legacy=s.size;maps.legacy={};
    s.forEach(function(d){var u=d.data().uid;if(u)maps.legacy[u]=(maps.legacy[u]||0)+1;});
    recalc();
  },function(e){QRY_UNSUB_A=null;if(!firebase.auth().currentUser)return;console.error('Chat notif listener A error',e);});
  QRY_UNSUB_B=db.collection('queries').where('sender','==','user').where('seenByAdmin','==',false).onSnapshot(function(s){
    counts.neu=s.size;maps.neu={};
    s.forEach(function(d){var u=d.data().uid;if(u)maps.neu[u]=(maps.neu[u]||0)+1;});
    recalc();
  },function(e){QRY_UNSUB_B=null;if(!firebase.auth().currentUser)return;console.error('Chat notif listener B error',e);showToast('Chat notifications error: '+e.message,'error');});
}
function aStopQueryListener(){
  if(QRY_UNSUB_A){QRY_UNSUB_A();QRY_UNSUB_A=null;}
  if(QRY_UNSUB_B){QRY_UNSUB_B();QRY_UNSUB_B=null;}
}

/* presetUid/presetName: jump straight into one user's thread (used by the Users-tab "💬 Chat" button) */
function aOpenQueriesPanel(presetUid,presetName){
  var m=G('aQryModal');
  if(!m){
    m=document.createElement('div');
    m.id='aQryModal';
    m.style.cssText='display:flex;position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.72);align-items:center;justify-content:center;padding:1rem';
    m.addEventListener('click',function(e){if(e.target===m)aCloseQueriesPanel();});
    var box=document.createElement('div');
    box.style.cssText='background:#fff;border-radius:14px;max-width:760px;width:100%;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.4);height:70vh;max-height:640px;display:flex;flex-direction:column';
    var hdr=document.createElement('div');
    hdr.style.cssText='background:#1565c0;color:#fff;padding:.85rem 1.2rem;display:flex;align-items:center;justify-content:space-between;flex-shrink:0';
    var ttl=document.createElement('span');
    ttl.style.cssText='font-size:.88rem;font-weight:900';
    ttl.textContent='💬 User Chats';
    var cls=document.createElement('button');
    cls.textContent='✕';
    cls.style.cssText='background:none;border:none;color:#fff;font-size:1.3rem;cursor:pointer;margin-left:auto;padding:0 .3rem';
    cls.onclick=function(){aCloseQueriesPanel();};
    hdr.appendChild(ttl);hdr.appendChild(cls);
    var panes=document.createElement('div');
    panes.style.cssText='display:flex;flex-wrap:nowrap;flex:1;min-height:0;overflow:hidden';
    var listPane=document.createElement('div');
    listPane.id='aQryUserList';
    listPane.style.cssText='flex:0 0 210px;width:210px;height:100%;box-sizing:border-box;overflow-y:auto;border-right:1px solid #eee;padding:.5rem';
    listPane.innerHTML='Loading...';
    var threadWrap=document.createElement('div');
    threadWrap.style.cssText='flex:1 1 auto;width:0;height:100%;box-sizing:border-box;display:flex;flex-direction:column;min-width:0;min-height:0';
    var threadHdr=document.createElement('div');
    threadHdr.id='aQryThreadHdr';
    threadHdr.style.cssText='padding:.5rem .8rem;border-bottom:1px solid #eee;font-size:.75rem;font-weight:800;color:#1a3a2a;flex-shrink:0;display:none';
    var thread=document.createElement('div');
    thread.id='aQryThread';
    thread.style.cssText='flex:1;min-height:0;overflow-y:auto;padding:.7rem;font-size:.78rem';
    thread.innerHTML='<div style="text-align:center;color:#aaa;padding:2rem;font-style:italic">Select a user from the left 👈</div>';
    var footer=document.createElement('div');
    footer.id='aQryFooter';
    footer.style.cssText='padding:.6rem .7rem;border-top:1px solid #eee;flex-shrink:0;display:none;gap:.4rem';
    var ta=document.createElement('textarea');
    ta.id='aQryReplyInput';
    ta.placeholder='Type reply...';
    ta.style.cssText='flex:1;resize:none;height:42px;padding:.4rem .5rem;border:1px solid #ddd;border-radius:6px;font-size:.75rem;font-family:inherit';
    ta.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();aSendChatReply();}});
    var sendBtn=document.createElement('button');
    sendBtn.textContent='Send';
    sendBtn.style.cssText='padding:.4rem .9rem;background:#1565c0;color:#fff;border:none;border-radius:6px;font-size:.75rem;font-weight:800;cursor:pointer;flex-shrink:0';
    sendBtn.onclick=function(){aSendChatReply();};
    footer.appendChild(ta);footer.appendChild(sendBtn);
    threadWrap.appendChild(threadHdr);threadWrap.appendChild(thread);threadWrap.appendChild(footer);
    panes.appendChild(listPane);panes.appendChild(threadWrap);
    box.appendChild(hdr);box.appendChild(panes);
    m.appendChild(box);
    document.body.appendChild(m);
  }
  m.style.display='flex';
  aLoadUserList(function(){
    if(presetUid)aSelectChatUser(presetUid,presetName||'');
  });
}

function aCloseQueriesPanel(){
  var m=G('aQryModal');if(m)m.style.display='none';
  if(A_CHAT_UNSUB){A_CHAT_UNSUB();A_CHAT_UNSUB=null;}
  A_CHAT_UID=null;
}

/* Groups every message doc by uid → one row per user, sorted by most recent activity, with an unread-count badge */
function aLoadUserList(cb){
  var list=G('aQryUserList');if(!list||!window.firebase||!firebase.firestore)return;
  list.innerHTML='Loading...';
  firebase.firestore().collection('queries').orderBy('createdAt','desc').limit(500).get().then(function(snap){
    var map={};
    snap.forEach(function(d){
      var r=d.data();var uid=r.uid;if(!uid)return;
      if(!map[uid])map[uid]={uid:uid,name:r.name||r.email||r.phone||'User',email:r.email||'',phone:r.phone||'',lastTime:r.createdAt,lastText:r.message||r.reply||'',unread:0};
      if(r.sender==='user'&&r.seenByAdmin===false)map[uid].unread++;
      else if(!r.sender&&r.status==='open')map[uid].unread++;
    });
    A_CHAT_USERS_CACHE=map;
    var arr=Object.keys(map).map(function(k){return map[k];});
    if(!arr.length){list.innerHTML='<div style="text-align:center;color:#aaa;padding:1rem;font-size:.7rem">No chats yet.</div>';if(cb)cb();return;}
    arr.sort(function(a,b){
      var ta=(a.lastTime&&a.lastTime.seconds)?a.lastTime.seconds:0;
      var tb=(b.lastTime&&b.lastTime.seconds)?b.lastTime.seconds:0;
      return tb-ta;
    });
    list.innerHTML=arr.map(function(u){
      return "<div class='aQryUserRow' data-uid='"+escAttr(u.uid)+"' data-nm='"+escAttr(u.name)+"' style='padding:.5rem .4rem;border-radius:8px;cursor:pointer;margin-bottom:.25rem;"+(u.uid===A_CHAT_UID?"background:#e3f2fd":"")+"'>"+
        "<div style='display:flex;justify-content:space-between;align-items:center;gap:.3rem'>"+
          "<strong style='font-size:.7rem;color:#1a3a2a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'>"+esc(u.name)+"</strong>"+
          (u.unread>0?"<span style='background:#e53935;color:#fff;border-radius:8px;min-width:15px;height:15px;font-size:.55rem;font-weight:900;line-height:15px;text-align:center;padding:0 3px;flex-shrink:0'>"+u.unread+"</span>":"")+
        "</div>"+
        "<div style='font-size:.62rem;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:.1rem'>"+esc((u.lastText||'').slice(0,42))+"</div>"+
      "</div>";
    }).join('');
    Array.prototype.forEach.call(list.querySelectorAll('.aQryUserRow'),function(el){
      el.onclick=function(){aSelectChatUser(el.getAttribute('data-uid'),el.getAttribute('data-nm'));};
    });
    if(cb)cb();
  }).catch(function(e){list.innerHTML='<div style="color:#c62828;font-size:.68rem">Error: '+esc(e.message)+'</div>';});
}

/* Opens one specific user's full chat history for the admin — live-updating */
function aSelectChatUser(uid,name){
  A_CHAT_UID=uid;
  var hdr=G('aQryThreadHdr');if(hdr){hdr.style.display='block';hdr.textContent='👤 '+(name||'User');}
  var f=G('aQryFooter');if(f)f.style.display='flex';
  var rows=document.querySelectorAll('.aQryUserRow');
  Array.prototype.forEach.call(rows,function(el){el.style.background=(el.getAttribute('data-uid')===uid)?'#e3f2fd':'';});
  if(A_CHAT_UNSUB){A_CHAT_UNSUB();A_CHAT_UNSUB=null;}
  var thread=G('aQryThread');if(thread)thread.innerHTML='Loading...';
  if(!window.firebase||!firebase.firestore)return;
  A_CHAT_UNSUB=firebase.firestore().collection('queries')
    .where('uid','==',uid)
    .onSnapshot(function(snap){
      var docs=[];snap.forEach(function(d){docs.push(Object.assign({id:d.id},d.data()));});
      var turns=normalizeQueryDocs(docs);
      var t=G('aQryThread');if(!t)return;
      if(!turns.length){t.innerHTML='<div style="text-align:center;color:#aaa;padding:2rem;font-style:italic">No messages.</div>';}
      else{t.innerHTML=renderBubblesHTML(turns,'admin');t.scrollTop=t.scrollHeight;}
      /* mark this user's messages as seen by admin */
      docs.forEach(function(r){
        if(r.sender==='user'&&r.seenByAdmin===false)firebase.firestore().collection('queries').doc(r.id).update({seenByAdmin:true}).catch(function(){});
      });
    },function(e){console.error('Chat thread listener error',e);showToast('Thread load error: '+e.message,'error');A_CHAT_UNSUB=null;});
}

/* Opens the admin chat panel directly for one user — hooked up to the "💬 Chat" button in the Users tab */
function aOpenUserChat(uid,name){
  console.log('aOpenUserChat clicked',uid,name);
  if(!uid){showToast('User id missing — refresh and try again','error');return;}
  try{aOpenQueriesPanel(uid,name);}
  catch(e){console.error('aOpenUserChat error',e);showToast('Chat open error: '+e.message,'error');}
}

function aSendChatReply(){
  if(!A_CHAT_UID){showToast('Select a user first','warn');return;}
  var ta=G('aQryReplyInput');
  var msg=(ta.value||'').trim();
  if(!msg){showToast('Type a reply first','warn');return;}
  var u=A_CHAT_USERS_CACHE[A_CHAT_UID]||{};
  ta.disabled=true;
  firebase.firestore().collection('queries').add({
    uid:A_CHAT_UID,
    name:u.name||'',
    email:u.email||'',
    phone:u.phone||'',
    sender:'admin',
    message:msg,
    seenByAdmin:true,
    seenByUser:false,
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){
    ta.value='';ta.disabled=false;
    aLoadUserList();
  }).catch(function(e){ta.disabled=false;showToast('Error: '+e.message,'error');});
}


/* ══════════════════════════════════════════════════════════════════════════
   RECHARGE / MY PLAN  — header button (Marketplace sarkha) + modal
   Button var plan status disto (kiti din/mahine baki). Click kela tar: plan details,
   QR + UPI, screenshot upload, payment history (admin verify kelyavar date disto).
   Admin verify cha flow (aVerify) tasach ahe — payments/{id} status pending → verified,
   users/{uid} madhe planStart/planEnd/planMonths set hote.
   ══════════════════════════════════════════════════════════════════════════ */
var RC_QR_B64="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAdYAAAHWAgMAAAC3dEDJAAAADFBMVEX////AwMBgYGAAAABcEFatAAAelUlEQVR42u2dXYwcV3bff7dZ1SPNMFFrw2bWQxuzD4vAGD2QQfwUA2FRlpQXA25upopaibAVYC3Do3XIh7zEMMDeII8GMgKsNiAHiB64q52uiTgOkgevFp5aw/KDbQSjB02CtZHMBtR4sy0sSwtyluxq9s3DvVV1q/qrqj9muLLqZaprqurUvfecc8/5n3PPFZJTOD6tcCrH52Q/u2QtDprZ7/g2HuvptYMmVG8np/qG5Gibz683j1+rfDu5t/JteY1NB6B7PUMkQu5nv2NJSrglk6MJrKjTQH2XNGROSPP5yzJkSd27DyzJPuxJKaV8OHMnC/OHhPAUxlZA7WTIyhKtlZ8tAZrQyWJ+ZEWhXpwot2A3UoHaNf7Xs4C6C1X1u+5Gu3ajAi6dwG5EuyAC5wMXQO4AIQ9cfe8Hrn5VMvRu+q07IPe5kErp/VhuD4FqehWElFIexiLcZE3eV41XMv4YoMaaPq3dkneV3Col8FA9r46+6uT7Q3ohBB6P7k5HdxRoJZJtGWGQjnlQYmxr4wcuAHrpFwwSduJ/524owFJi9L+cMV+bb2IwCyeLqYVsVGunUG/BHNRFOIKlKMJSY0Vz9k4ePHqT/y1HdbKVCDBQj+/o+EfxDZ0AuoDwAX3Vp+PafuTKHdz8W+UOLlD3jwHh0kkbq07FBoDc55l4Fr4Yqwt1nImneeNYkTLWJyvycaoEtIyvyYdU0mleSumk6sLRdkQ/7mSrvKgseAYKik++nxus05KtnQ7Z8Ge1tcE4FWYcLp2g7mA/Bp/drHWwjNyR0PGj2I7IPBb50hU+LnUXbB+ou65vmC+JCOzzjOxl1IUyHqQSdsP+zykGKR+DcTXWEY8zrsCe3GdthLoo0LeSaSU8LDG2U3FSODNLTcVJtcJXnzB1EZ4O2doT3dppDbtRM+2xV70NbG5q8bmmr3evizYecOyBRCo8oXobaLXq7eRDjm4uv6MfWW3bFFUXmC6KoRgy5oeBPDxWIIK+N9YRpJqjmLoY3c3R6cy34nTIyhMlK05EgKZqpLPATp6LZ1Qp2oNirq1V6kK0TXjBowN0PQ0/Ht2s3iZWDElfr74VAef+ffDGf2zd7HoSoHWQ4JMXo/82QOtPdwDsVF3ksYvEGXEStyPtH3VDYn4onCOrOTLWhRyBXSxUVMqzlDgdsqekpYZ38pnT6eTHp9PauenkQQPmWeFgnbOhdgWsc8CLNpxzGohzNmy4OcUgNl6A2hUHy64hNq7qy40XxqmLj9OQw/vqz79pfnhpqdP1uEPLXekcf+HF78jngzeaP9hd7nQ9fL4RQPfVyrZ+7LzfP8Md583gH9/tnr/i47XWmw/+9X99KCvAQfMvDxN1o/vLAnr+cBPO8gV0dtaQ93bSgbZ8odRgtFPJmQQOFrKzA53gMvhLakAif03hLOUFSJRHwHpMAWOHA3w0Uc87JdivMj8dEZR4bLHOSPHW9go/b02+Ury1VuFO7k2+IkfLre0W6HUJdTcEenwSj6Pt6o+x3So9F/jAXUa46ScGv5xezdnacvCAW3I/hhR1MMIRUm4BcE5xrTHNS/mQqpQON+TdGGi8LEOo2VI61o1BCqFVwjq7BJC2drB/9zmblcIK0NtfPCcXbcWTjjmKwhpxFi1VK2/7lrGeC+PJU83us04FpVnKGc9duRBFtKsiCNRd25cA7kd1P3L1NX2nQhdT4d/tIn3q7jrCFb7YwK2jNIRP3e34Bmqp4pzHSl1kQQQVhDTCmJmQJwhpxhMTr0Bq+7+Ssf/30lSFPf38xLGVZXo8mJsAiXmQmKO6cE6HLE8+2bA02bl4ALWRZHvjadXGs5RVfrzVI9U20AqOPLstEG06HthteQ2PTWe1rS36TUffCZvr+hP/MGgd1Nvd62Kb10P10dIT2yaJ1baCITLflU1ResbMVnqstEEi47eGWCIOSRjTeOueqS5kms5UUF38LHPy52Q/J3sCR2J6KKDxWAGNHfVJbVrBgbe6pW858MDIc9ToIhx7on3GY3MzzokUDgfN5XdAtGm1IKLviW1aAdhtw7qQKrNJYYZaOa6k2iCT2VQZuEEDjUbWg5T7+ZioiF8mpZThHFG4YKFjK0+Hpf5eREaKePMnQtaaL1mZSWmrTSZqTfPJB83ld/ovI4EPL1242/WAG80PL3WVUviNrSNPh/VubMGDs4DkG80Lh9B/mQC4cKhDFHDhLiS50EYgdOmh9Li19+ZNpZoi5D5rsqfcjv3UpNhPfY276amU95WvESSJlNq6IA5jGhFNmUY2lmK/ZC0NUYTj+6t3gl5BbS5ewZMI/tXKu9Xz6OSwvAqYs+tlcTKHDi0qlMBy/4Je3YmdfrGBD1j2SqhPhx3nnJVcJ71YUzikznOsO/BnsJFGctwoDi32AW7I+2JJ9h1qOGpCd1JhdajxG6bcPlLffEseXqnFcmsBVSkbtRvyvqPhxwRzvJpAlVnMMQDZQwSEBFn2F4rNMpwUJY3cy/BGD8Jwn16wpK4lmude+nxlegVvzcB+lekFsFfwq4LpyQ4LyFgFm+jMpKXKiWowvjOebK9App0syvZNMGLgf+prQHAV262k6x0qUHef86GL9IkznPs+0CLypQIVO/6RWofhYLsgd6QCGo/RmOM60a7dUPCj+gT/OF79JOSIYyu16oOsg5DxCpLjISD2squfwqHTfCFUSY4SIGvokISTJ74pZ2xrnPjW5jfN1+Y7zReiJeeahLiY/GTndGypYOZOnsnREwVAhE0Holf1/V9tdK9T+6e/zeY6dK+Lbd7+678hatXbidkvXw9Vu87/QZzc+B8+4dcQ2/JHr9D+1m6/RZvW2687y5tXEG159Kpsf4D8rbB9jGn/y1QbXFSnMVCYQIrJKgpjAeRarCr2Y5TB0c+L2D7ReMJFncMUzjDx9SYLgMjp5FqxsRUz2KijVshY48iGkz13qyRb67f2ZvCBCpryYtRbC3aynE5hyCH2jT2ZrCwntaHZs9YQltpFp97OYDla40bGIYzxCKO1jfhTLGB1q/+y2KbjrW5V2/IasOlEng5RANhtAbDpHN3senrxdBLX2HQiD8Q2HvU2dK9LD2gdRFRv4/HKK3WOX9OPtA6W31EvS0GEJhdjvz+X3LhiZjRWM4uv46sVlfWQWUWdpDwanT815vh4Hjp5sQn+sqBb/YTZyVNijk98vtRi5vsxMp+Z2c7Vj5NbHptzyBUbrqbcUKsDLvIn8OzV/51+Vd3BbyAaNkB47gp7nwwjq4OWx1+6DND66MKPHiQ44uHxF14gVF+18qfAe7xZv8Jf3AXuAGsqyvkeH7oiXnbwyhaAuIPXgr/sQD/Ofe2+KtqDqygYOF1LI5rGku6kQINxfJg253I25JnEQNZKWRfFnF1ZeFinJBucuNwuAoWbs3IsTbY2zcvC02ltoW/tDWCOq3yq1kt3AhCuXia9PORTjAINOUYTG/i4rBr3OsvmTSqv0lzOsM+FOLkRLsRLng7NhwxhfZRiD4Nz+34qrLfk/bgqAyNAhDB7KibpeTl+oOUoiCqHnpfBk3uTB1oMCFt4EtP8yDyZSmlLfy4abbGgvZgd6pzG9SoakDmpTraou8sKHYTItX0ZpzVHKs+xE+gsR19fTZvi6vRIlJboBHUn2pW+BL9zRFKVYR3bFb5U0QrbFxvCTdOi47l9yay/IIYus040x+NMcqPOhU6tAyPlUS+WvKwJJNO8nIFn5j7fyjnLrVMeuyjw3gGUQozirsocBHMUz/ZGa9QZO1mW/bdVsJOdWUZhog8kRn1tGRvRKdwZFipVWSqTwnZFW8DPuSB3xIYA96NVol2xQV1HLmp/BHy1p/KbpU/d0WnRbl3FJcQGEO124qoMAPZb3wP4G1XBwT8mTXXOgAhS3leVW2SafmCUYjBQhiQtei/FHAcKtOUdhM9z4T4n+znZmbELndx45IFEbOu0aIFeW50om+PXqrcrqhTDalt6og3U05etx5hjG1h+xwZotQCqt+U1YL0ZeZVvi7ZWF0u5Go3NPNCo1cWhGaK4n17V6iJXriWTPWn4JbNbF9Nac09OLtycfKAniJPD2cnKd5DXSiI2jWJGzZij//zXke3ng1lYykm+Ri1KrFmGoWA92xjS1l8JAORLAVgiC1o4pqnyrMh0spWy44rUOY1rd6C7BNy48eElfWfroPrjj3chKQrbfxlofU9/ePT8BtX+g7OJYogQe9Ig9Z5p6aiUSXktyi26knGtt/1sWnTFLAaXYB9uI3E7TC5N06L7mQUVhuawpsZ6Xr0NvPX1RaNwzhCqvHF3TmRlsdbG+e4XGvMhKwqhcOJP4rPtBWupjISuJl1e3Vog2bxXcjs9/R1+WN5FUpz8OMUDenXz/XUXVhGuSN/QA5aMeyrNZvPfKWwRUPXbkq81llS7QCewGz+J8xyx9Sx8Ud63llS2ksOKfMyVxBVwbG3/iw0gs1z6PmuZYik4Qk3zj2p1dccDwI6l+aFwdZ5jtJTOZlIxlBrJvcGRlTsgMuO5nO/l+N7EiIhIIpKhesP4PMcRjmIW0hXNboGxlePAv2Is8YvZn/82X1lzzGeH00dGxH7299O8U/jZ2vgEiLEaKi+Ezg/nK7fDx/aL+QvFG2viyWWP1/IXzk1lddoNsSOh7pzfPXbF+yEvBNQdvba68+fPOoBrpEUrBpK/8wfp4AJ0OgFw2U1OUemRxmG7cbRCZyKg1jBciGfxiym0kK+tpLGFfZGFB5JZ3FhCSZqJIEz4McyB9vcnoy88BcCDSwaxrRlZqjd64gmyI9mDwxK2yHiyVmGOegpDJ35xXtbFGKyrGQtvqhPtacjWRloXcvSHii1SnVgpKTtTxIHiln3NVBPNkh5bJdWTGZaqTfQvn9b1RWJ3orS6+Dtfujq/OfK1Gd3xu6DSmm3fbsgd6q4D2L/8fxJNHPw0ec2X4q5oCF8bJVox+B1dZDpWN91YXZAGHAePTF3oQ1acy0ZWo8wtmc4XcRyh6UtkImjukkHC0V82hvSpBbvVUUrqaYOnxKLI6hcbzlzFSRVGZcGtNR/YMhSGsyCyemx7hvr8sqEwnAW31jIt1bS6srPYsTXJii3+ttAcNKwS1Wo72eBFraLWWc+ZbV90zVe7ffCfAYgxhgdi6WFKdnUr8iRiG4ejm6vpJHxenbYCfc2LYsyxH4MI0qzcgpGtpCyGYM3YTobUaggBHdFMQIR83nScIT1FiCKoDWe1Ykjg1JhjUNqQmA8nO3PBPaf05msn3Fo9E3w5sefsGVrrFO9d9WdFsTs8152Ipo4mGxSdQuQoS28wsWOiAqn+aC8utqi3jGodxEUTqANdDwjYdKJrWaXlmAPe1tEK6QH1tg2IbdTuU/2Xk2ou/Zdpjyj0pPpRZiIQGrtIIcRbcSZ0UiLaSIC+nNZ8MorLXy65imKE61kITQ5HGKxlDlnKEx42yFN586LwtDjRPJ/j0St4S2WKB2c7hrd24aurJ4xtLf2QWjyoljWB1ayhwCiItDlCDDZuRT1+q/nhpSMPaNMKluWDs5XH8vmgdbD8YGlcQw6aVfX8laB1sGziN9VUAqr9sX0qfRDw3BtrgEBAx18bPwS60KvyodZmmoGCjLiKnHKc7I1PSbYRUwnyYhvMkB09kexu3Bgnrw/DcnPdNNO8GFDDzhAitXmTHTSlHH5ojm3xqrGjtEMWe3ZyzUxb++iN9SBLVhTW4Fb8kEsn0N1mTN6B82Fc0lVnSIdph7YyFDYAN9nLDpJKsMEIsg9+/pcQbb4RfPoVC7hn3Hf1hefaH59/qd1/ie8A//cL99ZGTGfV9lfcN9pHX3iBT/8EZZhU28BXuMeRfRX47r1ca8Pvak68M8CbO8/R6+zG1atl+mQOzA2f4t4nASv3/By73AsgivESZ2rzPEwhhMzl2nzlNs8dvRRCKC+yu9N686mkvDOFb1SbtrVWst/HLzQ4b5BtLKaTZV6qK3fu/L+SNuT0Y2tLhgGN/WJgp5NVF7pSAiSVYBMNoA8VjzziMc1hBKQAt173j7EbwhcbRLt1R+6IDdy6qt2CD/jP1R25owu0aRDhlpnGuE8SizjMbkR7OVNXWv+6fyZNbjT2kMkmJRigZHmD9XCoXbYwtzo+Phn6LU8tmmxvrB5YGNloGGc2Ly2arBwiov2FY44Zsg1NLioTo5jS9TKUcSzYPyz7GisFFcM/qpFsC/Fz2+//p76aJe99K3jXIvxN/sn2393MsvKFuMCyrVdMAIi3Pvr+989uV6m2771rJRHNt3tt3U9iO81zzGxdmanKsGYWjk61SKYI7DPZeo4GuriXLe04/WLJwcXV/eBSfjYIxluO0+yGNMC1Px285Iy3HKfx5vfzF/5WNMe7TnMhOxBbvlktiojOQrYf5H9/cYSjONdOljfzQ/taSThpOqTmf2V//r4aWqcEnCTk0U27IXeI851UVYZgdSvZObvu6CKOEO12r9vfbH0vE4iUFfHK7f4ZXOqOtk78eCtdF7XMAsQ2VwJYO5Q7YuNTY211bF0kCyqy8cr4tCrvD/zX2KEun/IYL8WatfzrY57O9vLvF7XbCoztOCu/4jwyeLnbnII7BlICiuQ5voMRmvrDhWAXw4TiF/g4aW735pjuLF54YiJ6b0Fli38Z/7zGGNdgpFs9XXWP36b78+rXN0sab6E5tmVg1TNA1eHjCwBvXp/Mh5eG+HwWcORVJNDyVreOX5MAt24FqGACrWB1a0XqQgpHNyMiHc44qjboBHBj6wdf6npIVDlpCbDnADx6Crhz9m0vovoI2OPNm0e68ktqEjTTJCljF8vA3Ol2mEdgLLNIZsQ9c1uKhEB6Gk7MhZsa35v7xGcc9mmQFa92i5nlohxZOR62E7fLG2JFyIqCntecEVZZLrOhDMJqZRYw2WYnvvgi7F9xACwVonBqANY5B0tgLImoWalzcm6gc/PLLMDiOQldT8OEK93ukrz6wWYToPId4MYNgEoEHPzeP9x7cBZExDeCC4fQPX8poHWwLKHvAas+6Botqrg86r0XDkF6guC59INURHNwjebgEaR+Sa5adOax/P63A+uv5NSVW4YfwaLlNihsvsyVrHM6rT0lnRycDllnxrG1QP5xQ692uOfDZZUA3bv3QYpkyj/+Va0Zdv65Wm9Rd1dJFknYvq3e8Mkne7gINy2auYGD7dr+i7G+sBuqoamP39Ri1VcJ0Jl9piox5nghTnk0jrv5WdxMP4hvMCq3yIG0aOghgkG9LsZp+96kqeTs5LG1ynmMi2UpsQCytWyPyVGdWZsv2TDbyWIUiXCBnTy3BIiwFNm5sVSNsYHUumsrbLHudXfthvDxZMfv/OaDuIa0rrQAvhvtJvVcjHccqX/DAXbDVo/VXduPXKEiE0dIn6/2zIfMjEZjF0uj/Oth1v5PFl8POzJLJ5YK7yFjzaSTZ5fbkIUeU5YsKzDxWSc28RWXxBnr1Mypk3szi+tUZIuq3VnHVmGOGluMdqNduYOLSyfQW1duOtGuzpCuO3aje11s4+NydLN6W16jzUFzdSvZLcZuyB2xrbWMfgMc3QTRpxOoKjFi+1PDupBZzZHoiFy04oy5zFrI/G4xmNWdGFh0pbyKcMZKaaWrofdmktuTt5NlTsLKfaA1rXK0FtnaWmHtE55MJ4vp9IkYy1KWvsUa6M5YDf+r3MvOxR1Tc0ZtemsBl+NTKx2pFF1UseiWd17Cj/9RAjSCuLUHR15Vdj0kLS9SEuqxek8VfNHb3D96SnrJllNAq7XeXJFJfdmqfPSUdkaeMUEEGcOPMlvHKV50pXREQK60CznkwFh0ddksxfDMTOVfp54kayUTheXU/m1wotP82HsXu03CsNb2TqiTnSEiWplO7TszttbC3vir0Y/UnRDbTXazBj1xP/tiFAxOfLabiR8nRWXVY+H7xtUs+KdLMSRyK+WbcQmVRs0o26xF+JwDtZoTy62Ud3lBi3Ats1XEklmgbQj418vzUZLZGA7R+Z8EEIZGL57lu4VmiLluHDCvGeik7OQFAm/TdHJR9N6aVyeXcyl782ptsJCxtZA7iL4roO7W/RVXf8c9n9o/cwH3o6f9ZfBrdRdsV2ME0W6kVIOy/+0GPpEPkYIkO/5BWij2AMC3EwjTtxtmaFGmhaMVRnAms/opt819JuC4lNtkcqjXM2Pi0umY55+T/Zzsk0jWou6Cqp/g1GNtYByd4EhBA3GhV9PQQCQpShpl8LvxqfEGnRkFdWcV2xWxFnhkwgUioy62IFvotZrbiPZWqi4uZzetlbloRbr7lFYXZ0Z3x6X8hbF7yNTGT5NB4bENxluuOXuyN8S0DIcYnHPd3iQYelqbprWUaO1EPMJZkABZ4/GIYCGdPC/rYthxBoaksZbsb13+tS2vceCtN6ttfX11q3u9r/IIVIEFvXS6ept06bRCCQ7sdpzMFB+bTsdb3eq/DLRZbdtU23hsbsZXo8w29xkQQYcomvEeMimIQGbFhWFSJMXlB/AEI0O6wCqKUzLPFwFjW6VaO7eG90q1Vp5gJz8BrtcJjG2tiKYb+k4BNIZmyL0glFLW2MXRTdC7zh0pqW/zyoWu2qEud6zKo1RzdK+LOxEc3TzyKmqzOqhud6+LV16JVb7YptVabx6/Vr0tXn/dYX2zTrUNx0MKPWXRxYy6kGYi5MM0LUJDEwP1F/SG26G5Qe7YtOhwfk5lGZaqzY+HymCO4WLZeabWWpPulKMQu8rMei6cRt1M3DW0MeOEPqqf7EYQZlyBEMB2dCG2XUA8+ys7Iq5VlvEK1DuefSm1qcXGTwDOucuIq1aMRf7ZANn1O5/Wulfttnm19f6aKsF63unw8ZWVH/fPyDc9lf0o2nmyFzTMwLc+/qvDqi+v2sgLbai+p+MSy+1utcF333MOfu9/HCbWRSYXOh+iwHRGhu1QEWTXVMl0QYWR/fgwZ3N8JvdanOPEJ06HbLHDmY5sOOPYBtPp5Nr8OtkZoVbNms5q2XDdXYVeRV2PdlHLmEICx3Yro9pVdzuBngxdVgNNziWMKwhIAsB28TG2nLoVL7N2dCZCNbO22qEWS2iuMbl9q8kkJe/J/fy9RoE2s6B1MBQuCEaMdzCJN8ISjmatLG/mCNTmzclFAJOJV0867yI8HeVYOwmyc1gsGSwCWtG5zFobdPyj9BY7RSLtNNKgQUWfurMa1284Qld1UHWhkzrz+qFOUHfiq0OWLSTgyMBiyWQPmVyNxmGbVee2k0nufXTyLBXE430CsfmyIMJiEvAmgghi6m+YqEgrCxvDUXrWOg0tVaC1cj4sVRsythadNzJXX/oab8t3A6h+7V7re9scBbs8g3hrHzpBx33Rw/oHbVoByK9f2QD+p0fjHsDrv/StAEB887+/28K1G/bmxd/i3Xe/D8id3lcB6P6X+ymIgCnuybbUj0GFKLTm2E9XPzXjtAiDefYGUx0ym1UP29CyyNQdZll1qs1Ky21LJMtjF+FQhrBmFiBrGlNjCvCvlhXMKZCacBp1UX5sB3ug6Ng688SlCrZWjouaWQU/0LjeMLecMiovGoWjI0+08eiwutW9DnjU27oYtEcHqLYFoCtLi2086u3j1wDY3ITIq94GNp2DILm3dWC3pSe2s9tlG0VcLiq4QMn9/Rg8PAS1+9SAdZEUXUjQxTDe0HKGyi1TLLKeal1BOI0z4hTmuDl5BaKkTTsnH6is/VOwtcVSiZyZyc5uy8yDrDWpKRbUsrdYk9m8/7LWEQB6b8sI4E4NDryq7KlT49DhjIDWAVTe/xcev+7/ObqyNKw3V+7VAFqtTnrvjV99IR61pHJLrlr0YF04lTp1Rg7yz9LQatFyYIeLqatFnxr4J+dx72Ixx599hFUumuwC900dLtR2wx8+Vm60CxLsRienkhLc0o12qTvr8YfH1+WOvirckWR/t/nhJV1eATocx/kNy+0HZ/se8LvNH3zJuL/riTZeCzostftnaDsHniYbL6hIrlbaTNhZMm6yjE/WzKvmcPiV3HLRyB/G1JEPS3MH/+Y+8Z2+AC2U7N+vTl5wa62RRO2GrtEY7dqNBF20XcDnnnJfN1IZUyEKDV8SBujkxvj7Q5cwDMxSDEOmeScBEYwQxa0UlFQrJwwQQeTqOSbpTAmWWqRA2yRjLAyKOmm9Gd3q4DMst7PY3gUMjRNrrSxBVp5+Jy9AXeiY5npsKKhgAnFhxsgXG0DHH5hmtY6o/hrQ8TtxhrXKkJYuPi6dwG4YY6uU0EgQIbNYMosuGowyUPNVRytuxTWoB0CER+VAhFGDHw4V7YDeCN6Qc5gKRIF/h0OGdXETnxW3rPaZmebHCHZvDnI7pd4Y63rNNo61knBYL/7nUZrUrMt8b65HXrItXXIoA19eI05dkteA1XbSqgNP5zW1ggPP1jBjq0Oy5ZRCMgUMD1EkcIFjqgujPqxR8DG3Ce7YEMXFSSGKxXBy7bSmgt7pkLVOg2wynfx/EouzoArIDxEAAAAASUVORK5CYII=";
var RC_PICK="m",RC_SS=null,RC_PAYS=[],RC_UNSUB=null,RC_QR_URL="";
var PLAN_MONTHS=0,RC_GRACE_MIN=10,RC_GRACE_DL=5;
/* oldest pending payment: 10 min nantar verify nahi => grace (5 temporary downloads, FREE_LIMIT+5 paryant) */
function rcPendInfo(){
  var pl=(RC_PAYS||[]).filter(function(x){return x.status==="pending";});if(!pl.length)return null;
  var p=pl[pl.length-1],n=Date.now(),age=n-(_tsMs(p.createdAt)||n);
  return {p:p,ageMin:age/60000,grace:age>=RC_GRACE_MIN*60000,left:Math.max(0,FREE_LIMIT+RC_GRACE_DL-DL_COUNT)};
}
function rcGraceActive(){var i=rcPendInfo();return !!(i&&i.grace&&i.left>0);}

function rcLeftTxt(endMs){
  var now=new Date(),end=new Date(endMs);
  if(end<=now)return "0 days";
  var base=new Date(now.getFullYear(),now.getMonth(),now.getDate()),m=0;
  while(m<120&&_addMonths(base,m+1)<=end)m++;
  var d=Math.ceil((end-_addMonths(base,m))/86400000);
  return (m?m+(m>1?" months":" month"):"")+((m&&d>0)?" ":"")+((d>0||!m)?d+(d===1?" day":" days"):"");
}
function rcDaysLeft(){return Math.max(0,Math.ceil((PLAN_END-Date.now())/86400000));}
function rcState(){
  if(!CU)return {k:"none"};
  if(IS_PRO)return {k:"pro"};
  var n=Date.now();
  if(PLAN_END&&n>=PLAN_START&&n<=PLAN_END)return {k:"active",days:rcDaysLeft()};
  if(PLAN_END&&n<PLAN_START)return {k:"upcoming"};
  if(PLAN_END&&n>PLAN_END)return {k:"expired"};
  return {k:"free"};
}
function rcBtnInfo(){
  var st=rcState(),rem=Math.max(0,FREE_LIMIT-DL_COUNT);
  if(st.k==="pro")return {t:"\u{1F48E} Pro \u2022 Unlimited",c:"#b8860b"};
  if(st.k==="active")return {t:"\u{1F39F}\uFE0F "+(st.days>60?rcLeftTxt(PLAN_END):st.days+" days")+" left",c:st.days<=7?"#e65100":"#18602f"};
  if(st.k==="upcoming")return {t:"\u{1F4C5} Plan from "+_dmy(PLAN_START),c:"#00838f"};
  var pi=rcPendInfo();
  if(pi)return {t:(pi.grace&&pi.left>0)?"\u23F3 Pending \u2022 "+pi.left+" downloads":"\u23F3 Verify pending",c:"#e65100"};
  if(st.k==="expired")return {t:"\u26D4 Plan expired \u2022 Recharge",c:"#c62828"};
  return rem>0?{t:"\u{1F193} "+rem+" free \u2022 Recharge",c:"#00838f"}:{t:"\u{1F4B3} Recharge",c:"#c62828"};
}
function rcRenderBtn(){
  var old=G("rcPlanBtn");
  if(!CU){if(old&&old.parentNode)old.parentNode.removeChild(old);return;}
  var info=rcBtnInfo(),b=old;
  if(!b){
    b=document.createElement("button");b.id="rcPlanBtn";b.type="button";
    b.onclick=rcOpen;b.title="Plan / Recharge";
    var sab=G("shareAppBtn");
    if(sab&&sab.parentNode){b.className=sab.className;sab.parentNode.insertBefore(b,sab.nextSibling);}
    else{var host=G("userHeaderDiv");if(!host)return;var lo=host.querySelector("button:last-child");host.insertBefore(b,lo||null);}
  } else if(!b.parentNode){return;}
  b.style.cssText="border:none;border-radius:4px;padding:.3rem .75rem;font-size:.66rem;font-weight:700;color:#fff;cursor:pointer;display:inline-flex;align-items:center;gap:.3rem;margin-left:.4rem;white-space:nowrap;font-family:inherit;background:"+info.c;
  b.textContent=info.t;
}
function rcUnlisten(){if(RC_UNSUB){try{RC_UNSUB();}catch(e){}RC_UNSUB=null;}}
function rcListen(){
  rcUnlisten();if(!CU||!window.firebase||!firebase.firestore)return;
  RC_UNSUB=firebase.firestore().collection("payments").where("uid","==",CU.uid).orderBy("createdAt","desc").limit(10).onSnapshot(function(s){
    RC_PAYS=s.docs.map(function(d){var x=d.data();x._id=d.id;return x;});rcRenderHist();rcRefresh();
  },function(e){console.warn("rc payments:",e&&e.code);RC_PAYS=null;rcRenderHist();});
  if(!window._rcTmr)window._rcTmr=setInterval(function(){if(CU&&rcPendInfo()){rcRefresh();}},30000);
}
function rcClose(){var m=G("rcModal");if(m&&m.parentNode)m.parentNode.removeChild(m);RC_SS=null;}
function rcOpen(fromDl){
  if(!CU){showToast("Please login first","warn");return;}
  if(G("rcModal"))rcClose();
  var m=document.createElement("div");m.id="rcModal";
  m.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99999;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:1rem .6rem";
  m.onclick=function(e){if(e.target===m)rcClose();};
  m.innerHTML="<div style='background:#fff;border-radius:12px;max-width:430px;width:100%;box-shadow:0 10px 40px rgba(0,0,0,.35);overflow:hidden;font-family:inherit'>"
    +"<div style='background:#18602f;color:#fff;padding:.7rem 1rem;display:flex;align-items:center;justify-content:space-between'><div style='font-weight:800;font-size:.9rem'>\u{1F39F}\uFE0F My Plan / Recharge</div><button onclick='rcClose()' style='background:none;border:none;color:#fff;font-size:1.3rem;cursor:pointer;line-height:1'>\u00D7</button></div>"
    +"<div style='padding:.9rem 1rem'>"+(fromDl===true?"<div style='background:#fff3e0;border:1px solid #ffb74d;color:#e65100;border-radius:8px;padding:.5rem .7rem;font-size:.72rem;font-weight:700;margin-bottom:.6rem'>\u{1F512} Your free downloads are over. Recharge to download/print \u2014 downloads resume once your payment is verified.</div>":"")+"<div id='rcStat'></div><div id='rcPayBox'></div><div id='rcHist'></div></div></div>";
  document.body.appendChild(m);
  RC_PICK="m";RC_SS=null;
  rcRefresh();rcRenderPayBox();if(!RC_UNSUB)rcListen();
  if(window.firebase&&firebase.firestore)firebase.firestore().collection("config").doc("upi").get().then(function(d){
    if(d.exists){if(d.data().qrURL)RC_QR_URL=d.data().qrURL;if(d.data().upiId)UPI_ID=d.data().upiId;rcRenderPayBox();}
  }).catch(function(){});
}
function rcRow(l,v,c){return "<div style='display:flex;justify-content:space-between;font-size:.74rem;padding:.2rem 0;border-bottom:1px dashed #e3e3e3'><span style='color:#666'>"+l+"</span><b style='color:"+(c||"#222")+"'>"+v+"</b></div>";}
function rcRefresh(){
  rcRenderBtn();
  var box=G("rcStat");if(!box)return;
  var st=rcState(),rem=Math.max(0,FREE_LIMIT-DL_COUNT),h="";
  if(st.k==="pro"){
    h="<div style='background:#fff8e1;border:1px solid #f0c36d;border-radius:8px;padding:.7rem;text-align:center'><div style='font-size:1.1rem;font-weight:800;color:#b8860b'>\u{1F48E} Pro Account</div><div style='font-size:.72rem;color:#666;margin-top:.2rem'>Unlimited downloads \u2014 no recharge needed.</div></div>";
  } else if(st.k==="active"||st.k==="upcoming"||st.k==="expired"){
    var tm=PLAN_MONTHS||Math.max(1,Math.round((PLAN_END-PLAN_START)/2629800000));
    var col=st.k==="active"?(st.days<=7?"#e65100":"#18602f"):(st.k==="expired"?"#c62828":"#00838f");
    var title=st.k==="active"?"\u2705 Plan is active":(st.k==="expired"?"\u26D4 Plan has expired":"\u{1F4C5} Plan starts soon");
    h="<div style='border:2px solid "+col+";border-radius:8px;padding:.7rem'><div style='font-weight:800;color:"+col+";font-size:.95rem;margin-bottom:.3rem'>"+title+"</div>"
      +rcRow("Recharged for",tm+(tm>1?" months":" month"))+rcRow("Plan starts",_dmy(PLAN_START))+rcRow("Plan ends",_dmy(PLAN_END));
    if(st.k==="active"){
      var tot=PLAN_END-PLAN_START,pct=Math.min(100,Math.max(0,Math.round((Date.now()-PLAN_START)/tot*100)));
      h+=rcRow("Remaining",rcLeftTxt(PLAN_END)+" ("+st.days+" days)",col)
        +"<div style='height:8px;background:#e8e8e8;border-radius:5px;margin-top:.5rem;overflow:hidden'><div style='height:100%;width:"+pct+"%;background:"+col+"'></div></div><div style='font-size:.6rem;color:#888;margin-top:.15rem'>"+pct+"% used</div>";
    } else if(st.k==="expired"){
      h+="<div style='font-size:.7rem;color:#c62828;margin-top:.4rem'>Recharge to continue downloading.</div>";
    }
    h+="</div>";
  } else {
    h="<div style='border:2px solid "+(rem>0?"#00838f":"#c62828")+";border-radius:8px;padding:.7rem'><div style='font-weight:800;font-size:.95rem;color:"+(rem>0?"#00838f":"#c62828")+"'>"+(rem>0?"\u{1F193} Free downloads: "+rem+" / "+FREE_LIMIT+" left":"\u{1F4B3} Free downloads used up")+"</div><div style='font-size:.7rem;color:#666;margin-top:.25rem'>No active plan. Recharge for unlimited downloads.</div></div>";
  }
  var pn=(st.k==="free"||st.k==="expired")?rcPendInfo():null;
  if(pn){
    var wait=Math.max(1,Math.ceil(RC_GRACE_MIN-pn.ageMin));
    h+="<div style='background:#fff3e0;border:1px solid #ffb74d;border-radius:8px;padding:.55rem .7rem;margin-top:.5rem;font-size:.72rem;color:#e65100;font-weight:700'>"
      +(!pn.grace?"\u23F3 Payment is being verified. If it isn't verified within "+wait+" min, you'll get "+RC_GRACE_DL+" temporary downloads until it is."
      :(pn.left>0?"\u2705 "+pn.left+" temporary downloads available until verification \u2014 you can Print/Download."
      :"\u23F3 Temporary downloads used up. Please wait for admin verification."))+"</div>";
  }
  box.innerHTML=h;
}
function rcPick(k){RC_PICK=k;rcRenderPayBox();}
function rcRenderPayBox(){
  var box=G("rcPayBox");if(!box)return;
  if(IS_PRO){box.innerHTML="";return;}
  var amt=PLAN_PRICE[RC_PICK];
  function card(k,t,sub){var on=RC_PICK===k;return "<div onclick=\"rcPick('"+k+"')\" style='flex:1;cursor:pointer;border:2px solid "+(on?"#18602f":"#ccc")+";background:"+(on?"#e8f5e9":"#fff")+";border-radius:8px;padding:.45rem .3rem;text-align:center'><div style='font-size:.68rem;font-weight:700;color:#555'>"+t+"</div><div style='font-size:1.25rem;font-weight:800;color:#18602f'>\u20B9"+PLAN_PRICE[k]+"</div><div style='font-size:.58rem;color:#777'>"+sub+"</div></div>";}
  var upi="upi://pay?pa="+UPI_ID+"&pn="+encodeURIComponent(UPI_NAME)+"&am="+amt+"&cu=INR&tn=ATP+Plan";
  var pend=(RC_PAYS||[]).some(function(p){return p.status==="pending";});
  box.innerHTML="<div style='font-weight:800;font-size:.8rem;margin:.9rem 0 .4rem'>\u{1F504} Recharge</div>"
    +"<div style='display:flex;gap:.5rem'>"+card("m","Monthly (1 month)","per month")+card("y","Yearly (12 months)","best value")+"</div>"
    +(planActive()?"<div style='font-size:.62rem;color:#00796b;margin-top:.3rem'>\u2139\uFE0F Your plan is active \u2014 a new recharge starts after the current plan ends (extend).</div>":"")
    +"<div style='text-align:center;margin:.7rem 0 .3rem'><div style='font-size:.72rem;color:#555'>Scan to pay <b style='color:#18602f;font-size:.95rem'>\u20B9"+amt+"</b></div>"
    +"<div id='rcQrWrap' style='display:inline-block;margin:.4rem 0;background:#fff;border-radius:8px'><img id='rcQrImg' src='"+escAttr(RC_QR_URL||RC_QR_B64)+"' alt='UPI QR' onerror='rcQrFail(this)' style='width:210px;height:210px;object-fit:contain;border-radius:8px;display:block'></div>"
    +"<div style='font-size:.68rem;color:#444'>UPI ID: <b id='rcUpiTxt'>"+esc(UPI_ID)+"</b> <button onclick='rcCopyUpi()' style='font-size:.6rem;padding:.1rem .4rem;border:1px solid #bbb;background:#f6f6f6;border-radius:4px;cursor:pointer'>Copy</button></div>"
    +"<div style='font-size:.6rem;color:#888;margin-top:.15rem'>Enter the amount \u20B9"+amt+" manually.</div>"
    +"<div style='margin-top:.45rem'><a href='"+escAttr(upi)+"' style='display:inline-block;font-size:.68rem;font-weight:700;color:#fff;background:#5f259f;padding:.35rem .8rem;border-radius:5px;text-decoration:none'>\u{1F4F1} Pay with UPI app (amount auto-filled)</a></div>"
    +"<div style='margin-top:.35rem'><a href='javascript:void(0)' onclick='rcAutoQR()' style='font-size:.6rem;color:#1565c0'>Can't scan? Use QR with amount</a></div></div>"
    +"<div style='font-size:.66rem;color:#555;background:#f7f7f2;border-radius:6px;padding:.5rem .6rem;line-height:1.5'>1\uFE0F\u20E3 Pay &nbsp; 2\uFE0F\u20E3 Upload payment screenshot &nbsp; 3\uFE0F\u20E3 Submit \u2014 admin will verify, then your plan starts.</div>"
    +"<div style='margin-top:.6rem'><input type='file' id='rcFile' accept='image/*' onchange='rcOnFile(this)' style='font-size:.7rem;width:100%'>"
    +"<img id='rcPrev' alt='' style='display:none;max-width:100%;max-height:170px;margin-top:.4rem;border-radius:6px;border:1px solid #ddd'></div>"
    +"<div id='rcErr' style='display:none;color:#c62828;font-size:.68rem;margin-top:.3rem'></div>"
    +(pend?"<div style='font-size:.64rem;color:#e65100;margin-top:.4rem'>\u23F3 You already have a pending payment. Submit another only if needed.</div>":"")
    +"<button id='rcSubBtn' onclick='rcSubmit()' disabled style='width:100%;margin-top:.5rem;padding:.55rem;border:none;border-radius:6px;background:#18602f;color:#fff;font-weight:800;font-size:.8rem;cursor:pointer;opacity:.5'>\u{1F4E4} Submit Screenshot</button>";
  if(RC_SS){rcShowPrev();}
}
function rcCopyUpi(){
  try{navigator.clipboard.writeText(UPI_ID);showToast("UPI ID copied \u2713","success");}
  catch(e){var t=G("rcUpiTxt");if(t){var r=document.createRange();r.selectNode(t);var s=window.getSelection();s.removeAllRanges();s.addRange(r);}}
}
/* QR image load nahi jhali (broken/expired CDN link) => 1) embedded QR, 2) auto-generated UPI QR (amount sahit) */
function rcQrFail(img){
  if(img&&!img.dataset.fb&&RC_QR_B64&&img.getAttribute("src")!==RC_QR_B64){img.dataset.fb="1";img.src=RC_QR_B64;return;}
  rcAutoQR();
}
function rcAutoQR(){
  loadQR(function(){
    var w=G("rcQrWrap");if(!w||!window.QRCode)return;
    var url="upi://pay?pa="+UPI_ID+"&pn="+encodeURIComponent(UPI_NAME)+"&am="+PLAN_PRICE[RC_PICK]+"&cu=INR&tn=ATP+Plan";
    w.innerHTML="<div id='rcAutoQ' style='padding:8px'></div>";
    try{new QRCode(G("rcAutoQ"),{text:url,width:190,height:190,colorDark:"#18150f",colorLight:"#fff",correctLevel:QRCode.CorrectLevel.H});}catch(e){}
  });
}
function rcErr(t){var e=G("rcErr");if(e){e.textContent=t;e.style.display=t?"block":"none";}}
function rcShowPrev(){
  if(!RC_SS)return;var r=new FileReader();
  r.onload=function(e){var p=G("rcPrev");if(p){p.src=e.target.result;p.style.display="block";}var b=G("rcSubBtn");if(b){b.disabled=false;b.style.opacity="1";}};
  r.readAsDataURL(RC_SS);
}
function rcOnFile(inp){
  if(!inp.files||!inp.files[0])return;
  RC_SS=inp.files[0];rcErr("");rcShowPrev();
}
function rcSubmit(){
  if(!CU){showToast("Please login first","warn");return;}
  if(!RC_SS){rcErr("Please upload the payment screenshot first");return;}
  var btn=G("rcSubBtn"),k=RC_PICK,amt=PLAN_PRICE[k];
  btn.disabled=true;btn.style.opacity=".5";btn.textContent="Uploading... 0%";rcErr("");
  uploadCDN(RC_SS,"atp-maha-pwd/payments/"+CU.uid,
    function(p){btn.textContent="Uploading... "+p+"%";},
    function(url){
      firebase.firestore().collection("payments").add({uid:CU.uid,phone:CU.phoneNumber||"",email:CU.email||"",name:CU.displayName||CU.phoneNumber||"",
        amount:amt,plan:k==="y"?"yearly":"monthly",planMonths:k==="y"?12:1,upiId:UPI_ID,screenshotURL:url,status:"pending",
        createdAt:firebase.firestore.FieldValue.serverTimestamp()})
      .then(function(){
        showToast("Submitted! Admin will verify \u23F3","success");
        RC_SS=null;rcRenderPayBox();
      }).catch(function(e){
        var msg=(e&&(e.message||e.code))||"Unknown error";
        rcErr("Submit failed: "+msg);btn.disabled=false;btn.style.opacity="1";btn.textContent="\u{1F4E4} Submit Screenshot";
      });
    },
    function(err){rcErr("Screenshot upload failed ("+err+"). Please try again.");btn.disabled=false;btn.style.opacity="1";btn.textContent="\u{1F4E4} Submit Screenshot";});
}
function rcRenderHist(){
  var box=G("rcHist");if(!box)return;
  if(IS_PRO){box.innerHTML="";return;}
  var h="<div style='font-weight:800;font-size:.8rem;margin:1rem 0 .35rem'>\u{1F9FE} My recharges / payments</div>";
  if(RC_PAYS===null){box.innerHTML=h+"<div style='font-size:.68rem;color:#999'>Could not load history.</div>";rcRenderPayBox();return;}
  if(!RC_PAYS.length){box.innerHTML=h+"<div style='font-size:.68rem;color:#999;font-style:italic'>No payments yet.</div>";rcRenderPayBox();return;}
  RC_PAYS.forEach(function(p){
    var c=_tsMs(p.createdAt)||Date.now(),mo=parseInt(p.planMonths,10)||(p.plan==="yearly"?12:1);
    var stt=p.status==="verified"?["\u2705 Verified","#18602f","Verified: "+(_tsMs(p.verifiedAt)?_dmy(_tsMs(p.verifiedAt)):"")]
      :p.status==="rejected"?["\u274C Rejected","#c62828","Rejected: "+(_tsMs(p.rejectedAt)?_dmy(_tsMs(p.rejectedAt)):"")]
      :["\u23F3 Pending","#e65100","Awaiting admin verification"];
    h+="<div style='display:flex;justify-content:space-between;align-items:center;border:1px solid #e5e5e5;border-radius:7px;padding:.4rem .55rem;margin-bottom:.3rem'>"
      +"<div><div style='font-size:.74rem;font-weight:700'>"+mo+(mo>1?" months":" month")+" \u2022 \u20B9"+(p.amount||"")+"</div><div style='font-size:.6rem;color:#888'>Submit: "+_dmy(c)+"</div></div>"
      +"<div style='text-align:right'><div style='font-size:.7rem;font-weight:800;color:"+stt[1]+"'>"+stt[0]+"</div><div style='font-size:.58rem;color:#888'>"+stt[2]+"</div></div></div>";
  });
  box.innerHTML=h;rcRenderPayBox();
}
