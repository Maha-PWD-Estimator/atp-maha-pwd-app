/* ═══════════════════════════════════════════════════════════
   CF MAP — SSR Item Number → Material Consumption Factors
   Source: ATP Maha PWD App (same project)
   Keys: scr_sand=Screened Sand(M3), sand=Natural Sand(M3),
         m20mm/m12_10/m40mm=Metal(M3), rubble=Rubble/Murum(M3),
         quarry=Quarry/Soling(M3), cement_bags=Cement(bags),
         bricks=Bricks(nos), ms_bars=Steel(MT)
   Royalty applies on: scr_sand,sand,quarry (Sand rate) | overmetal,rubble (Coarse/Murum rate). Crushed metal (m40mm/m20mm/m12_10) = finished product, NO royalty (same as ATP estimator)
   ═══════════════════════════════════════════════════════════ */
/* ── CF data: ONLY from cf_data.js (load <script src="cf_data.js"> BEFORE this file). No CF is kept in this file. ── */
if(typeof CF_MAP==="undefined"||!CF_MAP||!Object.keys(CF_MAP).length){
  var CF_MAP={};
  console.error("cf_data.js not loaded — CF_MAP is empty. Put cf_data.js in the same folder as PWD_RA_BILL.html");
  window.addEventListener("load",function(){try{showToast("cf_data.js not found — CF/Royalty will not work","error");}catch(e){}});
}
/* Royalty Keys (same as ATP estimator): SAND group → scr_sand, sand, quarry | COARSE/MURUM group → overmetal, rubble (+ m40mm only if item is HB: it.hb40). Crushed m40mm/m20mm/m12_10 = no royalty (SSR 2022-23 Gen. Note xi) */
var ROYALTY_RATE_SAND=237.37;
var ROYALTY_RATE_MURUM=216.18;

/* ═══════════════════════════════════════════════════════════
   FIREBASE INIT — same project as ATP app
   ═══════════════════════════════════════════════════════════ */
var FBCFG={
  apiKey:"AIzaSyCdH-k3hH1mYYcND0cBf7J2pLRG6xQydrU",
  authDomain:"atp-maha-pwd.firebaseapp.com",
  projectId:"atp-maha-pwd",
  storageBucket:"atp-maha-pwd.firebasestorage.app",
  messagingSenderId:"382409286731",
  appId:"1:382409286731:web:37daae9842bc3687bf99ce"
};
if(!firebase.apps.length) firebase.initializeApp(FBCFG);
var DB = firebase.firestore();
var AUTH = firebase.auth();
var CU = null; // current user

/* ═══════════════════════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════════════════════ */
var _confirmResult = null;
var _rcVerifier = null;

AUTH.onAuthStateChanged(function(user){
  CU = user;
  document.getElementById('loadScreen').style.display='none';
  if(!user){
    document.getElementById('loginWall').style.display='flex';
    document.getElementById('userChip').style.display='none';
  } else {
    document.getElementById('loginWall').style.display='none';
    document.getElementById('userChip').style.display='flex';
    var n = user.displayName||user.phoneNumber||user.email||'User';
    document.getElementById('userChipName').textContent = n;
    document.getElementById('userAvatar').textContent = n.charAt(0).toUpperCase();
    document.getElementById('umName').textContent = n;
    document.getElementById('umEmail').textContent = user.email||user.phoneNumber||'';
    // init date
    var today=new Date().toISOString().split('T')[0];
    if(!document.getElementById('billDate').value) document.getElementById('billDate').value=today;
    if(!document.getElementById('ahBillDate').value) document.getElementById('ahBillDate').value=today;
    var totalC=0;APP.tests.forEach(function(t){totalC+=t.qty*t.rate;});
    document.getElementById('sumC').textContent='₹ '+fmt(totalC);
  }
});

function switchLTab(t){
  document.querySelectorAll('.ltab').forEach(function(el,i){
    el.classList.toggle('on',['google','email'][i]===t);
  });
  document.querySelectorAll('.lsec').forEach(function(el){el.classList.remove('on');});
  document.getElementById('lsec-'+t).classList.add('on');
}
function showLE(id,msg){document.getElementById(id).textContent=msg;}

function sendOTP(){
  var num=(document.getElementById('lPhone').value||'').trim();
  if(num.length!==10){showLE('phoneErr','Enter a 10-digit number');return;}
  showLE('phoneErr','');
  if(!_rcVerifier){
    _rcVerifier=new firebase.auth.RecaptchaVerifier('rcWrap',{size:'invisible',callback:function(){}});
  }
  AUTH.signInWithPhoneNumber('+91'+num,_rcVerifier)
    .then(function(r){_confirmResult=r;document.getElementById('otpField').style.display='';showLE('phoneErr','OTP sent!');})
    .catch(function(e){showLE('phoneErr',e.message);if(_rcVerifier){_rcVerifier.clear();_rcVerifier=null;}});
}
function verifyOTP(){
  var code=(document.getElementById('lOTP').value||'').trim();
  if(!_confirmResult){showLE('phoneErr','Request an OTP first');return;}
  _confirmResult.confirm(code).catch(function(e){showLE('phoneErr',e.message);});
}
function loginGoogle(){
  AUTH.signInWithPopup(new firebase.auth.GoogleAuthProvider())
    .catch(function(e){showLE('googleErr',e.message);});
}
function loginEmail(){
  var em=(document.getElementById('lEmail').value||'').trim();
  var pw=document.getElementById('lPass').value;
  if(!em||!pw){showLE('emailErr','Enter email and password');return;}
  AUTH.signInWithEmailAndPassword(em,pw).catch(function(e){showLE('emailErr',e.message);});
}
function doLogout(){
  if(!confirm('Do you want to log out?'))return;
  AUTH.signOut();
  document.getElementById('userMenu').classList.remove('open');
}
function toggleUserMenu(){document.getElementById('userMenu').classList.toggle('open');}
document.addEventListener('click',function(e){
  if(!e.target.closest('#userChip')&&!e.target.closest('#userMenu'))
    document.getElementById('userMenu').classList.remove('open');
});

/* ═══════════════════════════════════════════════════════════
   DATA STORE
   ═══════════════════════════════════════════════════════════ */
var APP={
  items:[],
  tests:[],   /* no default tests — user adds them in the 🧪 Tests tab */
  meta:{},
  splitSrcIdx:-1,
};
var SELECTED_EST_ID = null;
var CUR_RA_BILL_ID = null;

/* ═══════════════════════════════════════════════════════════
   ESTIMATES MODAL — load from Firebase
   ═══════════════════════════════════════════════════════════ */
function openEstModal(){
  if(!CU){showToast('Please log in first','warn');return;}
  SELECTED_EST_ID=null;
  document.getElementById('btnLoadEst').disabled=true;
  document.getElementById('estModal').classList.add('open');
  document.getElementById('estList').innerHTML='<div class="empty-state"><div class="icon">⏳</div><p>Loading…</p></div>';
  DB.collection('estimates').where('uid','==',CU.uid).orderBy('updatedAt','desc').limit(50).get()
    .then(function(snap){
      if(snap.empty){
        document.getElementById('estList').innerHTML='<div class="empty-state"><div class="icon">📂</div><p>No saved estimates found.<br><span style="font-size:11px">Save an estimate from the ATP Maha PWD app first.</span></p></div>';
        return;
      }
      var html='<div class="est-list">';
      snap.forEach(function(doc){
        var d=doc.data();
        var itemCount=(d.items||[]).length;
        var dt=d.updatedAt&&d.updatedAt.toDate?d.updatedAt.toDate().toLocaleDateString('en-IN'):'—';
        var grand=d.grand?'₹'+fmt(d.grand):'';
        html+='<div class="est-card" id="ecard_'+doc.id+'" onclick="selectEst(\''+doc.id+'\')">';
        html+='<div class="est-card-icon">📋</div>';
        html+='<div class="est-card-body">';
        html+='<div class="est-card-name">'+(d.name||'Untitled Estimate')+'</div>';
        html+='<div class="est-card-meta">'+dt+' &nbsp;|&nbsp; '+itemCount+' items'+(grand?' &nbsp;|&nbsp; '+grand:'')+'</div>';
        html+='</div>';
        html+='<span class="est-card-count">'+itemCount+' items</span>';
        html+='</div>';
      });
      html+='</div>';
      document.getElementById('estList').innerHTML=html;
    })
    .catch(function(e){
      document.getElementById('estList').innerHTML='<div class="empty-state"><div class="icon">❌</div><p>'+e.message+'</p></div>';
    });
}
function selectEst(id){
  SELECTED_EST_ID=id;
  document.querySelectorAll('.est-card').forEach(function(c){c.classList.remove('selected');});
  var el=document.getElementById('ecard_'+id);if(el)el.classList.add('selected');
  document.getElementById('btnLoadEst').disabled=false;
}
function closeEstModal(){document.getElementById('estModal').classList.remove('open');}

function loadSelectedEst(){
  if(!SELECTED_EST_ID){return;}
  DB.collection('estimates').doc(SELECTED_EST_ID).get()
    .then(function(doc){
      if(!doc.exists){showToast('Estimate not found','error');return;}
      var d=doc.data();
      var srcItems=d.items||[];
      if(!srcItems.length){showToast('⚠️ No items in this estimate','warn');return;}

      // ── DEBUG: log all fields of the first item to the console ──
      if(srcItems[0]){
        console.log('=== ESTIMATE ITEM DEBUG ===');
        console.log('First item keys:', Object.keys(srcItems[0]));
        console.log('First item full data:', JSON.stringify(srcItems[0], null, 2));
        console.log('rate field value:', srcItems[0].rate);
        console.log('===========================');
        // Detect which rate field is present
        var s0=srcItems[0];
        var rateFields=['rate','rateAmt','ssrRate','unitRate','basicRate','amt','amount','r','Rate'];
        var foundRateField='—', foundRateVal=0;
        rateFields.forEach(function(f){
          if(s0[f]!==undefined&&s0[f]!==null&&s0[f]!==''){
            if(!foundRateVal){foundRateField=f;foundRateVal=parseFloat(s0[f])||0;}
          }
        });
        console.log('Detected rate field:', foundRateField, '=', foundRateVal);
        // Keep in app state for later use
        window._detectedRateField = foundRateField;
      }
      APP.meta=d.cover||d.meta||{};
      APP.items=[];
      srcItems.forEach(function(it,i){
        // ── Exact Firebase field names of the ATP app ──
        // In Firebase: no, desc, unit, baseRate, finalRate, qty, cf, rows, amount
        var descVal = it.desc||it.description||'';
        var itemNo  = String(it.no||'').trim();

        // Rate: try every possible field name
        var rate = parseFloat(it.finalRate)||parseFloat(it.baseRate)||parseFloat(it.rate)||
                   parseFloat(it.rateAmt)||parseFloat(it.ssrRate)||parseFloat(it.unitRate)||
                   parseFloat(it.basicRate)||parseFloat(it.amt)||parseFloat(it.Rate)||
                   parseFloat(it.r)||parseFloat(it.RATE)||parseFloat(it.item_rate)||0;

        // Qty: ATP app stores as it.qty
        var estQty = parseFloat(it.qty)||parseFloat(it.estQty)||0;

        // CF: ATP app stores cf DIRECTLY on item {scr_sand:0.425, m20mm:0.57 ...}
        // No CF_MAP lookup needed — it comes straight from Firebase!
        var itemCF = (it.cf && typeof it.cf==='object') ? it.cf : null;

        var cat = getItemCategory(itemNo, it.steelTag||'', descVal);

        var ni={
          id       : 'item_'+i+'_'+Date.now(),
          no       : itemNo,
          desc     : descVal,
          unit     : it.unit||'',
          rate     : rate,
          estQty   : estQty,
          cf       : itemCF,   // Directly from Firebase — no CF_MAP lookup
          steelTag : it.steelTag||'',
          cat      : cat,
          isSplit:false, splitOf:null, reEntries:[],
          reDate:'', reNo:'', billQty:0, dispDesc:descVal,
          _origSeq : i,
          _rawItem : it,
          _added   : false
        };
        // Estimate measurement rows → Estimate rows + tentative Actual (MB) rows (asked later: same or different?)
        msAttachRows(ni,it);
        APP.items.push(ni);
      });
      // Populate abstract header from meta
      var m=APP.meta;
      if(m.pName) document.getElementById('ahWorkName').value=m.pName;
      if(m.contractor) document.getElementById('ahContractor').value=m.contractor;
      updateAbstractPreview();
      // Auto-sort by construction sequence on load
      autoSortItems();
      updateProjBar();renderItems();renderREEntries();
      document.getElementById('emptyState').style.display='none';
      document.getElementById('itemsTable').style.display='table';
      document.getElementById('itemsBadge').textContent=msItemCount();
      document.getElementById('startDatePanel').style.display='';
      closeEstModal();
      // Rate debug summary
      var withRate=APP.items.filter(function(x){return x.rate>0;}).length;
      var noRate=APP.items.length-withRate;
      if(noRate>0){
        // Log the raw data of items without a rate
        var sample=APP.items.find(function(x){return x.rate===0;});
        if(sample&&sample._rawItem){
          console.warn('Item with rate=0:', JSON.stringify(sample._rawItem,null,2));
          console.warn('All keys of that item:', Object.keys(sample._rawItem));
        }
        showToast('⚠️ '+withRate+' items have a rate | '+noRate+' items have rate=0 — see Console (F12)','warn');
      } else {
        showToast('✅ '+APP.items.length+' items loaded — every item has a rate!','success');
      }
    })
    .catch(function(e){showToast('❌ Load error: '+e.message,'error');});
}

/* ═══════════════════════════════════════════════════════════
   SAVE RA BILL TO FIREBASE (ra_bills sub-collection)
   ═══════════════════════════════════════════════════════════ */
function saveRaBill(){
  if(!CU){showToast('Please log in','warn');return;}
  var billNo=document.getElementById('billNo').value||document.getElementById('ahBillNo').value||'';
  if(!billNo){showToast('⚠️ Enter the Bill No.','warn');return;}
  var payload={
    uid:CU.uid,
    billNo:billNo,
    billDate:document.getElementById('billDate').value||'',
    workName:(document.getElementById('ahWorkName').value||'').trim()+' '+(document.getElementById('ahWorkName2').value||'').trim(),
    contractor:document.getElementById('ahContractor').value||'',
    agreementNo:document.getElementById('ahAgreementNo').value||'',
    meta:APP.meta,items:APP.items,tests:APP.tests,
    adds:JSON.parse(JSON.stringify(msAdds())),
    royaltySand:parseFloat(document.getElementById('royaltySandQty').value)||0,
    royaltyMurum:parseFloat(document.getElementById('royaltyMurumQty').value)||0,
    globalStartDate:document.getElementById('globalStartDate').value||'',
    savedAt:firebase.firestore.FieldValue.serverTimestamp()
  };
  var prm;
  if(CUR_RA_BILL_ID) prm=DB.collection('ra_bills').doc(CUR_RA_BILL_ID).update(payload);
  else prm=DB.collection('ra_bills').add(payload).then(function(ref){CUR_RA_BILL_ID=ref.id;return ref;});
  prm.then(function(){showToast('✅ RA Bill saved to Firebase!','success');})
     .catch(function(e){showToast('❌ Save error: '+e.message,'error');});
}

/* ═══════════════════════════════════════════════════════════
   SAVED RA BILLS LIST
   ═══════════════════════════════════════════════════════════ */
function openRaBills(){
  document.getElementById('raBillsModal').classList.add('open');
  document.getElementById('userMenu').classList.remove('open');
  if(!CU){document.getElementById('raBillsList').innerHTML='<div class="empty-state"><p>Please log in</p></div>';return;}
  DB.collection('ra_bills').where('uid','==',CU.uid).orderBy('savedAt','desc').limit(30).get()
    .then(function(snap){
      if(snap.empty){document.getElementById('raBillsList').innerHTML='<div class="empty-state"><div class="icon">📂</div><p>No saved RA bills</p></div>';return;}
      var html='';
      snap.forEach(function(doc){
        var d=doc.data();
        html+='<div class="bill-list-item" onclick="loadRaBill(\''+doc.id+'\')">';
        html+='<span class="bi-no">B/No. '+(d.billNo||'—')+'</span>';
        html+='<span class="bi-name">'+(d.workName||'—').substring(0,50)+'</span>';
        html+='<span class="bi-date">'+(d.billDate||'')+'</span>';
        html+='<button class="btn btn-danger btn-xs" onclick="event.stopPropagation();deleteRaBill(\''+doc.id+'\')">✕</button>';
        html+='</div>';
      });
      document.getElementById('raBillsList').innerHTML=html;
    })
    .catch(function(e){document.getElementById('raBillsList').innerHTML='<div class="empty-state"><p>'+e.message+'</p></div>';});
}
function closeRaBills(){document.getElementById('raBillsModal').classList.remove('open');}

function loadRaBill(id){
  DB.collection('ra_bills').doc(id).get().then(function(doc){
    if(!doc.exists){showToast('Bill not found','error');return;}
    var d=doc.data();
    CUR_RA_BILL_ID=id;
    // Recalculate category for each item with updated logic
    APP.items=(d.items||[]).map(function(it,i){
      it.cat=getItemCategory(it.no||'',it.steelTag||'',it.desc||it.dispDesc||'');
      if(it._origSeq==null)it._origSeq=i;
      return it;
    });
    APP.tests=d.tests||APP.tests;APP.meta=d.meta||{};
    APP.adds=d.adds?d.adds:msDefaultAdds(false);   /* old bills: add-ons off so their totals do not change */
    document.getElementById('billNo').value=d.billNo||'';
    document.getElementById('billDate').value=d.billDate||'';
    document.getElementById('ahBillNo').value=d.billNo||'';
    document.getElementById('ahBillDate').value=d.billDate||'';
    var wn=(d.workName||'').split(' ');
    document.getElementById('ahWorkName').value=wn.slice(0,6).join(' ');
    document.getElementById('ahWorkName2').value=wn.slice(6).join(' ');
    document.getElementById('ahContractor').value=d.contractor||'';
    document.getElementById('ahAgreementNo').value=d.agreementNo||'';
    document.getElementById('globalStartDate').value=d.globalStartDate||'';
    document.getElementById('royaltySandQty').value=d.royaltySand||'';
    document.getElementById('royaltyMurumQty').value=d.royaltyMurum||'';
    updateBillBadge();updateAbstractPreview();updateProjBar();
    if(APP.items.length){
      document.getElementById('emptyState').style.display='none';
      document.getElementById('itemsTable').style.display='table';
      document.getElementById('itemsBadge').textContent=msItemCount();
      document.getElementById('startDatePanel').style.display='';
      autoSortItems();renderItems();renderREEntries();renderAbstract();
    }
    closeRaBills();showToast('✅ RA Bill loaded!','success');
  }).catch(function(e){showToast('❌ '+e.message,'error');});
}
function deleteRaBill(id){
  if(!confirm('Do you want to delete this?'))return;
  DB.collection('ra_bills').doc(id).delete()
    .then(function(){showToast('🗑️ Deleted','success');openRaBills();})
    .catch(function(e){showToast('❌ '+e.message,'error');});
}

/* ═══════════════════════════════════════════════════════════
   ABSTRACT HEADER — SYNCED
   ═══════════════════════════════════════════════════════════ */
function syncBillNo(src){
  var v=document.getElementById(src).value;
  document.getElementById('billNo').value=v;
  document.getElementById('ahBillNo').value=v;
  updateBillBadge();updateAbstractPreview();
}
function syncBillDate(src){
  var v=document.getElementById(src).value;
  document.getElementById('billDate').value=v;
  document.getElementById('ahBillDate').value=v;
  updateAbstractPreview();
}
function updateAbstractPreview(){
  var wn=(document.getElementById('ahWorkName').value||'').trim()+' '+(document.getElementById('ahWorkName2').value||'').trim();
  var bn=document.getElementById('ahBillNo').value||'___';
  var dt=document.getElementById('ahBillDate').value||'___';
  var con=document.getElementById('ahContractor').value||'___';
  var agr=document.getElementById('ahAgreementNo').value;
  document.getElementById('prevWorkName').textContent='कामाचे नाव: '+(wn.trim()||'___');
  document.getElementById('prevContractor').textContent='ठेकेदार: '+con+(agr?' | Agr: '+agr:'');
  document.getElementById('prevBillInfo').textContent='ABSTRACT | RA Bill | B/No. '+bn+' | Date: '+dt;
  document.getElementById('billNo').value=document.getElementById('ahBillNo').value;
  document.getElementById('billDate').value=document.getElementById('ahBillDate').value;
  updateBillBadge();
}

/* ═══════════════════════════════════════════════════════════
   CATEGORY / SEQUENCE
   ─────────────────────────────────────────────────────────
   PWD Maharashtra SSR 2022-23 — Actual construction sequence:

   SUBSTRUCTURE (underground / foundation work)
   01  Excavation                    (SSR 21.01–21.21)
   02  Anti-termite treatment         (SSR 21.22–21.29)
   03  Sand filling / Murrum filling  (SSR 21.30–21.35)
   04  Soling (stone/brick)           (SSR 21.36–21.40)
   05  Pile Work                      (SSR 22.xx)
   06  PCC (Plain Cement Concrete)    (SSR 24.xx)  — bedding under footing
   07  Steel — Footing / Foundation   (SSR 26.33/26.34, tag=footing)
   08  RCC Footing / Foundation       (SSR 25.11–25.19)
   09  Steel — Column starter bars    (SSR 26.33/26.34, tag=column)
   10  RCC Column / Pedestal          (SSR 25.31–25.39)
   11  Damp Proof Course (DPC)        (SSR 27.xx + 'DPC' in desc)
   12  RCC Retaining Wall / Basement  (SSR 26.05–26.15)

   SUPERSTRUCTURE
   13  Steel — Beam bars              (SSR 26.33/26.34, tag=beam)
   14  RCC Beam / Lintel / Band       (SSR 25.50–25.58)
   15  Steel — Slab bars              (SSR 26.33/26.34, tag=slab)
   16  RCC Slab / Roof                (SSR 25.70–25.78)
   17  RCC Misc (staircase/chajja…)   (SSR 26.16–26.32)
   18  Brick Masonry / Partition      (SSR 27.01–27.16)  — after slab
   19  Stone Masonry                  (SSR 28.01–28.13)
   20  Block / Hollow Block Masonry   (SSR 29.01–29.13)
   21  Lintels (if precast / separate)(SSR 25.41–25.49)

   FINISHING
   22  Plaster — inside & outside     (SSR 32.xx)
   23  Waterproofing                  (SSR 34.xx)
   24  Flooring / Dado / Skirting     (SSR 33.xx)
   25  Doors, Windows, Shutters       (SSR 39.xx)
   26  Paint / Whitewash / Distemper  (SSR 35.xx–36.xx)

   SERVICES & MISC
   27  Sanitary / Plumbing / Drainage (SSR 41.xx–44.xx)
   28  Electrical / Water Supply      (SSR 45.xx–49.xx)
   29  Road / Compound Wall / Gate    (SSR 30.xx, 37.xx–38.xx)
   30  Miscellaneous / Other          (anything not matched above)
   99  Kamala lagnara board / Nameboard (desc contains 'board','name board',
                                        'sign board','nameboard' — always LAST)
   ═══════════════════════════════════════════════════════════ */
function getItemCategory(no, steelTag, desc){
  var n   = parseFloat(no) || 0;
  var t   = (steelTag || '').toLowerCase();
  var d   = (desc     || '').toLowerCase();

  // ── Board / Name board → always very last ──────────────
  if(/\b(name\s?board|sign\s?board|nameboard|notice\s?board|display\s?board)\b/.test(d) ||
     /\bboard\b/.test(d) && /\b(name|sign|notice|display|kamala|project)\b/.test(d))
    return{seq:99,cat:'other',label:'Name Board',curing:0};

  // ── SUBSTRUCTURE ────────────────────────────────────────
  if(n>=21.01&&n<=21.21) return{seq:1, cat:'exc',  label:'Excavation',          curing:0};
  if(n>=21.22&&n<=21.29) return{seq:2, cat:'anti', label:'Anti-termite',         curing:0};
  if(n>=21.30&&n<=21.35) return{seq:3, cat:'other',label:'Sand/Murrum Filling',  curing:0};
  if(n>=21.36&&n<=21.40) return{seq:4, cat:'other',label:'Soling',               curing:0};
  if(n>=22.01&&n<=22.99) return{seq:5, cat:'pcc',  label:'Pile Work',            curing:7};
  // PCC (24.xx) — plain cement concrete, laid before steel+footing
  if(n>=24.01&&n<=24.99) return{seq:6, cat:'pcc',  label:'PCC',                  curing:3};
  // Steel — footing first (bars placed before concrete is poured)
  if((no==='26.33'||no==='26.34')&&(t==='footing'||t==='foundation'))
                          return{seq:7, cat:'steel',label:'Steel — Footing',      curing:0};
  // RCC Footing concrete
  if(n>=25.11&&n<=25.19) return{seq:8, cat:'rcc',  label:'RCC Footing',          curing:7};
  // Steel — column starter bars (placed right after footing concrete)
  if((no==='26.33'||no==='26.34')&&t==='column')
                          return{seq:9, cat:'steel',label:'Steel — Column',       curing:0};
  // RCC Column concrete
  if(n>=25.31&&n<=25.39) return{seq:10,cat:'rcc',  label:'RCC Column',           curing:7};
  // DPC — done after column/plinth, before superstructure masonry
  if((n>=27.01&&n<=27.16)&&/dpc|damp\s?proof/.test(d))
                          return{seq:11,cat:'mason',label:'DPC',                  curing:3};
  // RCC Retaining / basement walls
  if(n>=26.05&&n<=26.15) return{seq:12,cat:'rcc',  label:'RCC Retaining/Wall',   curing:14};

  // ── SUPERSTRUCTURE ──────────────────────────────────────
  // Steel — beam bars placed before beam/slab concrete
  if((no==='26.33'||no==='26.34')&&t==='beam')
                          return{seq:13,cat:'steel',label:'Steel — Beam',         curing:0};
  // RCC Beam / Lintel / Band
  if(n>=25.50&&n<=25.58) return{seq:14,cat:'rcc',  label:'RCC Beam/Lintel',      curing:14};
  if(n>=25.41&&n<=25.49) return{seq:14,cat:'rcc',  label:'RCC Lintel',           curing:14};
  // Steel — slab bars
  if((no==='26.33'||no==='26.34')&&t==='slab')
                          return{seq:15,cat:'steel',label:'Steel — Slab',         curing:0};
  // RCC Slab / Roof
  if(n>=25.70&&n<=25.78) return{seq:16,cat:'rcc',  label:'RCC Slab',             curing:14};
  // Steel tag not set — put after slabs (user should set tag)
  if(no==='26.33'||no==='26.34')
                          return{seq:17,cat:'steel',label:'Steel (no tag)',     curing:0};
  // RCC Misc (staircase, chajja, etc.)
  if(n>=26.16&&n<=26.32) return{seq:17,cat:'rcc',  label:'RCC Misc',             curing:14};
  // Masonry — only after slab is cast
  if(n>=27.01&&n<=27.16) return{seq:18,cat:'mason',label:'Brick Masonry',        curing:3};
  if(n>=28.01&&n<=28.13) return{seq:19,cat:'mason',label:'Stone Masonry',        curing:3};
  if(n>=29.01&&n<=29.13) return{seq:20,cat:'mason',label:'Block Masonry',        curing:3};

  // ── FINISHING ───────────────────────────────────────────
  if(n>=32.01&&n<=32.99) return{seq:22,cat:'other',label:'Plaster',              curing:7};
  if(n>=34.01&&n<=34.99) return{seq:23,cat:'other',label:'Waterproofing',        curing:0};
  if(n>=33.01&&n<=33.99) return{seq:24,cat:'other',label:'Flooring/Dado',        curing:3};
  if(n>=39.01&&n<=39.99) return{seq:25,cat:'other',label:'Doors/Windows',        curing:0};
  if(n>=35.01&&n<=36.99) return{seq:26,cat:'other',label:'Paint/Whitewash',      curing:0};

  // ── SERVICES ────────────────────────────────────────────
  if(n>=41.01&&n<=44.99) return{seq:27,cat:'other',label:'Sanitary/Plumbing',    curing:0};
  if(n>=45.01&&n<=49.99) return{seq:28,cat:'other',label:'Electrical/Water',     curing:0};
  if((n>=30.01&&n<=30.99)||(n>=37.01&&n<=38.99))
                          return{seq:29,cat:'other',label:'Road/Compound/Gate',   curing:0};

  // ── Miscellaneous — unrecognised SSR number ─────────────
  return{seq:30,cat:'other',label:'Misc/Other',curing:0};
}

/* ═══════════════════════════════════════════════════════════
   SMART DATES
   ═══════════════════════════════════════════════════════════ */
function applySmartDates(){
  var sv=document.getElementById('globalStartDate').value;
  if(!sv){showToast('⚠️ Enter the Start Date','warn');return;}
  var start=new Date(sv);
  var seqMap={},seqDates={};
  APP.items.forEach(function(it){
    var cat=it.cat||{seq:99,curing:0};
    if(!seqMap[cat.seq])seqMap[cat.seq]={curing:cat.curing,label:cat.label};
  });
  var seqs=Object.keys(seqMap).map(Number).sort(function(a,b){return a-b;});
  var cur=new Date(start);
  seqs.forEach(function(s){
    seqDates[s]=new Date(cur);
    cur.setDate(cur.getDate()+(seqMap[s].curing||0)+1);
  });
  APP.items.forEach(function(it){
    var cat=it.cat||{seq:99};
    if(seqDates[cat.seq])it.reDate=seqDates[cat.seq].toISOString().split('T')[0];
  });
  // Build chain display
  var ch='';
  seqs.forEach(function(s){
    if(seqDates[s]){
      var ds=seqDates[s].toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
      ch+='<div class="chain-item active-item"><div class="ci-label">'+seqMap[s].label+'</div>';
      ch+='<div class="ci-date">'+ds+'</div>';
      if(seqMap[s].curing>0)ch+='<div class="ci-curing">⏱️ '+seqMap[s].curing+'d</div>';
      ch+='</div>';
    }
  });
  document.getElementById('curingChain').innerHTML=ch;
  renderREEntries();
  showToast('✅ Dates applied!','success');
}
function resetAllDates(){
  APP.items.forEach(function(it){it.reDate='';it.reNo='';});
  document.getElementById('globalStartDate').value='';
  document.getElementById('curingChain').innerHTML='';
  renderREEntries();showToast('🔄 Dates reset','success');
}

/* ═══════════════════════════════════════════════════════════
   PROJ BAR
   ═══════════════════════════════════════════════════════════ */
function updateProjBar(){
  var m=APP.meta;var html='';
  if(m.pName)html+='<div class="proj-field"><label>Work</label><span>'+m.pName+'</span></div>';
  if(m.pSub)html+='<div class="proj-field"><label>Sub-Div</label><span>'+m.pSub+'</span></div>';
  if(m.pDiv)html+='<div class="proj-field"><label>Division</label><span>'+m.pDiv+'</span></div>';
  html+='<span class="proj-badge">SSR 2022-23</span>';
  document.getElementById('projBar').innerHTML=html||'<span style="color:rgba(255,255,255,.5);font-size:11px">Project info —</span>';
}
function autoSortItems(){
  // Board/Kamala Lagnara items (seq 99) go to the very end.
  // Within each seq group, preserve the original estimate order (_origSeq).
  APP.items.sort(function(a,b){
    var sa=a.cat?a.cat.seq:99,sb=b.cat?b.cat.seq:99;
    // seq:99 always last
    var aLast=(sa===99)?1:0,bLast=(sb===99)?1:0;
    if(aLast!==bLast)return aLast-bLast;
    if(sa!==sb)return sa-sb;
    // same seq → keep original estimate order
    var oa=(a._origSeq!=null)?a._origSeq:999,ob=(b._origSeq!=null)?b._origSeq:999;
    return oa-ob;
  });
}

/* ═══════════════════════════════════════════════════════════
   RENDER ITEMS  (with drag-to-reorder)
   ═══════════════════════════════════════════════════════════ */
function renderItems(){
  var tbody=document.getElementById('itemsTbody');
  if(!APP.items.length){tbody.innerHTML='';return;}
  var html='',visN=0;
  APP.items.forEach(function(it,i){
    if(it.hasSplits)return;          /* split parent is hidden — only its parts are shown & billed */
    visN++;
    var cat=it.cat||{seq:99,cat:'other',label:'Other',curing:0};
    var amt=(it.billQty||it.estQty)*it.rate;
    var stHtml='';
    if(it.no==='26.33'||it.no==='26.34'){stHtml='<span class="steel-tag '+(it.steelTag||'other')+'">'+(it.steelTag||'other').toUpperCase()+'</span> ';}
    var isSteelBase=(it.no==='26.33'||it.no==='26.34')&&!it.isSplit;
    // Show sequential position number (1,2,3…), NOT cat.seq (#99 problem fix)
    var seqDisplay=visN;
    // Rate display — editable input
    var rateDisplay='<input type="number" step="0.01" min="0" value="'+(it.rate||0)+'" style="width:80px;text-align:right;font-family:\'Source Code Pro\',monospace;font-size:11px;border:1px solid var(--border2);border-radius:3px;padding:2px 4px;background:'+(it.rate>0?'var(--paper)':'#fff0f0')+';" oninput="updateItemRate('+i+',this.value)" title="Rate Type here to change">';
    html+='<tr class="'+(it.isSplit?'sub-item':'item-row')+'" draggable="'+(it.isSplit?'false':'true')+'" data-idx="'+i+'" '+(it.isSplit?'':'ondragstart="dragStart(event)" ondragover="dragOver(event)" ondrop="dropItem(event)" ondragend="dragEnd(event)"')+'>';
    html+='<td class="text-muted text-xs" style="cursor:'+(it.isSplit?'default':'grab')+';">'+(it.isSplit?'↳':('☰ '+seqDisplay))+'</td>';
    html+='<td><span class="seq-badge cat-'+cat.cat+'">'+seqDisplay+'</span><br><span class="text-xs text-muted">'+cat.label+'</span></td>';
    html+='<td class="num-cell">'+it.no+'</td>';
    html+='<td><div>'+stHtml+(it.dispDesc||it.desc).substring(0,75)+'…</div>';
    if(cat.curing>0&&!it.isSplit)html+='<div class="mt8"><span class="curing-badge">⏱️ '+cat.curing+'d wait</span></div>';
    html+='</td>';
    html+='<td class="text-xs text-muted">'+it.unit+'</td>';
    html+='<td class="amt-cell text-xs">'+(it.billQty||it.estQty).toFixed(3)+'</td>';
    html+='<td class="amt-cell">'+rateDisplay+'<div id="ssrn-'+i+'">'+(it.isSplit?'':msRateNote(it.no,it.rate,i))+'</div></td>';
    html+='<td class="amt-cell text-code" id="amt-'+i+'">'+( it.rate>0?'₹'+fmt(amt):'-' )+'</td>';
    html+='<td>';
    if(isSteelBase){
      html+='<select style="font-size:10px;padding:2px;margin-bottom:3px;width:100%" onchange="setSteelTag('+i+',this.value)">';
      ['','footing','column','slab','beam','other'].forEach(function(t){
        html+='<option value="'+t+'"'+(it.steelTag===t?' selected':'')+'>'+(t?t.charAt(0).toUpperCase()+t.slice(1):'-- Location --')+'</option>';
      });
      html+='</select><br>';
    }
    if(!it.isSplit){
      html+='<button class="btn btn-ghost btn-xs" onclick="openSplitModal('+i+')">✂️ Split</button> ';
      html+='<button class="btn btn-ghost btn-xs" onclick="moveItemUp('+i+')" title="Move up">▲</button>';
      html+='<button class="btn btn-ghost btn-xs" onclick="moveItemDown('+i+')" title="Move down">▼</button>';
    }
    if(it.isSplit)html+='<button class="btn btn-ghost btn-xs" onclick="moveSplitUp('+i+')" title="Move up">▲</button> <button class="btn btn-ghost btn-xs" onclick="moveSplitDown('+i+')" title="Move down">▼</button> <button class="btn btn-danger btn-xs" onclick="removeSplit('+i+')">✕</button>';
    html+='</td></tr>';
  });
  tbody.innerHTML=html;
  document.getElementById('itemsBadge').textContent=msItemCount();
}

/* ── Manual Move ─────────────────────────────────────── */
function moveItemUp(idx){
  if(idx===0)return;
  // skip over splits above
  var target=idx-1;
  while(target>0&&APP.items[target].isSplit)target--;
  if(APP.items[target].isSplit)return;
  var tmp=APP.items[idx];APP.items[idx]=APP.items[target];APP.items[target]=tmp;
  renderItems();renderREEntries();
}
function moveItemDown(idx){
  if(idx>=APP.items.length-1)return;
  var target=idx+1;
  while(target<APP.items.length-1&&APP.items[target].isSplit)target++;
  if(APP.items[target].isSplit)return;
  var tmp=APP.items[idx];APP.items[idx]=APP.items[target];APP.items[target]=tmp;
  renderItems();renderREEntries();
}

/* ── Drag-to-reorder ─────────────────────────────────── */
var _dragSrcIdx=-1;
function dragStart(e){
  _dragSrcIdx=parseInt(e.currentTarget.dataset.idx);
  e.currentTarget.style.opacity='0.5';
}
function dragEnd(e){e.currentTarget.style.opacity='';}
function dragOver(e){e.preventDefault();}
function dropItem(e){
  e.preventDefault();
  var destIdx=parseInt(e.currentTarget.dataset.idx);
  if(_dragSrcIdx<0||_dragSrcIdx===destIdx)return;
  var moved=APP.items.splice(_dragSrcIdx,1)[0];
  APP.items.splice(destIdx,0,moved);
  _dragSrcIdx=-1;
  renderItems();renderREEntries();
}
function updateItemRate(idx, val) {
  var r = parseFloat(val) || 0;
  APP.items[idx].rate = r;
  APP.items[idx].finalRate = r; // sync both fields
  // Update amount cell live
  var qty = APP.items[idx].billQty || APP.items[idx].estQty || 0;
  var amtEl = document.getElementById('amt-' + idx);
  if (amtEl) amtEl.innerHTML = r > 0 ? '₹' + fmt(r * qty) : '-';
  var nEl = document.getElementById('ssrn-' + idx);
  if (nEl && !APP.items[idx].isSplit) nEl.innerHTML = msRateNote(APP.items[idx].no, r, idx);
  // Re-render abstract if open
  renderAbstract();
}
function setSteelTag(idx,val){
  APP.items[idx].steelTag=val;
  APP.items[idx].cat=getItemCategory(APP.items[idx].no,val,APP.items[idx].desc||'');
  // Re-sort after tag change so steel item moves to correct position
  autoSortItems();renderItems();renderREEntries();renderAbstract();
}

/* ═══════════════════════════════════════════════════════════
   SPLIT MODAL — unlimited parts, qty guard, move up/down
   ═══════════════════════════════════════════════════════════ */
var _splitSrcId=null; // track by item id, not index (index shifts)

function openSplitModal(idx){
  var srcIt=APP.items[idx];
  _splitSrcId=srcIt.id;

  document.getElementById('splitModalTitle').textContent='✂️ Split: '+srcIt.no+' — '+(srcIt.dispDesc||srcIt.desc).substring(0,45);

  // Show original qty
  var origQty=srcIt._origQty!=null?srcIt._origQty:srcIt.estQty;
  // Store original qty on the item for reference
  if(srcIt._origQty==null) srcIt._origQty=srcIt.estQty||0;
  document.getElementById('spOrigQty').textContent=(srcIt._origQty||0).toFixed(3);
  document.getElementById('spOrigUnit').textContent=srcIt.unit||'';

  var isSteelItem=(srcIt.no==='26.33'||srcIt.no==='26.34');

  // Column header
  var hdr='<div style="display:grid;grid-template-columns:28px 1fr '+(isSteelItem?'110px ':'')+'100px 36px;gap:6px;align-items:center">'
    +'<span>#</span><span>Part Description</span>'+(isSteelItem?'<span>Location</span>':'')+'<span>Qty ('+srcIt.unit+')</span><span></span></div>';
  document.getElementById('splitColHeader').innerHTML=hdr;

  // Load existing splits or default 2 rows
  var existSplits=APP.items.filter(function(x){return x.splitOf===srcIt.id;});
  var rows=existSplits.length>0
    ? existSplits.map(function(x,i){return{desc:x.dispDesc||x.desc,tag:x.steelTag||'',qty:x.estQty,id:x.id};})
    : [
        {desc:(srcIt.dispDesc||srcIt.desc).substring(0,40)+' - Part 1',tag:'footing',qty:'',id:''},
        {desc:(srcIt.dispDesc||srcIt.desc).substring(0,40)+' - Part 2',tag:'column',qty:'',id:''}
      ];

  document.getElementById('splitRows').innerHTML='';
  document._splitRowCount=0;
  document._splitIsSteelItem=isSteelItem;
  rows.forEach(function(r){ _addSplitRowDOM(r.desc,r.tag,r.qty); });
  _updateSplitTotals();

  document.getElementById('splitModal').classList.add('open');
}

function _addSplitRowDOM(desc,tag,qty){
  var c=document._splitRowCount||0;
  var isSteelItem=document._splitIsSteelItem;
  var div=document.createElement('div');
  div.className='split-row-item';
  div.id='sr_'+c;
  div.style.cssText='display:grid;grid-template-columns:28px 1fr '+(isSteelItem?'110px ':'')+'100px 36px;gap:6px;align-items:center;margin-bottom:5px;background:var(--paper);border:1px solid var(--border2);border-radius:5px;padding:5px 7px';
  var tagSel=isSteelItem?('<select id="sp_tag_'+c+'" style="font-size:11px;padding:3px">'
    +'<option value="footing"'+(tag==='footing'?' selected':'')+'>Footing</option>'
    +'<option value="column"'+(tag==='column'?' selected':'')+'>Column</option>'
    +'<option value="slab"'+(tag==='slab'?' selected':'')+'>Slab</option>'
    +'<option value="beam"'+(tag==='beam'?' selected':'')+'>Beam</option>'
    +'<option value="other"'+(tag==='other'?' selected':'')+'>Other</option>'
    +'</select>'):'';
  div.innerHTML='<span style="font-size:11px;color:var(--text3);font-family:\'Source Code Pro\',monospace;text-align:center">'+(c+1)+'</span>'
    +'<input type="text" id="sp_desc_'+c+'" value="'+escHtml(desc||'')+'" placeholder="Part description (e.g. G+1 Floor)">'
    +tagSel
    +'<input type="number" id="sp_qty_'+c+'" value="'+(qty||'')+'" placeholder="qty" step="0.001" min="0" oninput="_updateSplitTotals()" style="text-align:right;font-family:\'Source Code Pro\',monospace">'
    +'<button class="btn btn-danger btn-xs" onclick="_removeSplitRowDOM('+c+')" title="Remove">✕</button>';
  document.getElementById('splitRows').appendChild(div);
  document._splitRowCount=c+1;
}

window.addSplitRow=function(){
  var srcIt=APP.items.find(function(x){return x.id===_splitSrcId;});
  var c=document._splitRowCount||0;
  _addSplitRowDOM((srcIt?((srcIt.dispDesc||srcIt.desc).substring(0,30)):'')+ ' - Part '+(c+1),'other','');
};

window._removeSplitRowDOM=function(c){
  var el=document.getElementById('sr_'+c);
  if(el)el.remove();
  _updateSplitTotals();
};

window._updateSplitTotals=function(){
  var srcIt=APP.items.find(function(x){return x.id===_splitSrcId;});
  var origQty=srcIt?srcIt._origQty||srcIt.estQty||0:0;
  var used=0;
  document.querySelectorAll('[id^="sp_qty_"]').forEach(function(el){
    used+=parseFloat(el.value)||0;
  });
  var rem=origQty-used;
  document.getElementById('spUsedQty').textContent=used.toFixed(3);
  var remEl=document.getElementById('spRemQty');
  remEl.textContent=rem.toFixed(3);
  remEl.style.color=Math.abs(rem)<0.001?'var(--green)':(rem<0?'var(--red)':'var(--gold)');
};

function applySplit(){
  var srcIt=APP.items.find(function(x){return x.id===_splitSrcId;});
  if(!srcIt){closeSplitModal();return;}
  var isSteelItem=(srcIt.no==='26.33'||srcIt.no==='26.34');

  // Collect rows
  var ns=[];
  var totalQty=0;
  document.querySelectorAll('#splitRows .split-row-item').forEach(function(row){
    var cIdx=row.id.replace('sr_','');
    var descEl=document.getElementById('sp_desc_'+cIdx);
    var qtyEl=document.getElementById('sp_qty_'+cIdx);
    var tagEl=document.getElementById('sp_tag_'+cIdx);
    var desc=(descEl?descEl.value:'').trim();
    var qty=parseFloat(qtyEl?qtyEl.value:0)||0;
    var tag=tagEl?tagEl.value:(srcIt.steelTag||'');
    if(!desc&&qty===0)return;
    totalQty+=qty;
    ns.push({desc:desc,qty:qty,tag:tag});
  });

  // Qty validation
  var origQty=srcIt._origQty!=null?srcIt._origQty:srcIt.estQty||0;
  if(ns.length===0){showToast('⚠️ Enter at least one part','warn');return;}
  if(Math.abs(totalQty-origQty)>0.005){
    var diff=totalQty-origQty;
    showToast('⚠️ Split qty total ('+totalQty.toFixed(3)+') ≠ Original qty ('+origQty.toFixed(3)+') — difference: '+(diff>0?'+':'')+diff.toFixed(3),'warn');
    return;
  }

  // Remove old splits for this item
  APP.items=APP.items.filter(function(x){return x.splitOf!==srcIt.id;});

  // Build new split items
  var newSplits=ns.map(function(r,i){
    return {
      id:srcIt.id+'_s'+i+'_'+Date.now(),
      no:srcIt.no,
      desc:srcIt.desc,
      dispDesc:r.desc||srcIt.desc,
      unit:srcIt.unit,
      rate:srcIt.rate,
      finalRate:srcIt.rate,
      estQty:r.qty,
      cf:srcIt.cf||null,          // ← copy CF from the parent (for royalty/consumption)
      _rawItem:srcIt._rawItem||null, // ← copy the raw item too (for CF_MAP fallback)
      steelTag:r.tag||srcIt.steelTag,
      cat:getItemCategory(srcIt.no,r.tag||srcIt.steelTag||'',r.desc||srcIt.desc||''),
      isSplit:true,
      splitOf:srcIt.id,
      reEntries:[],reDate:'',reNo:'',billQty:0
    };
  });

  // Insert split items right after parent
  srcIt.hasSplits=true;
  srcIt.estQty=0;
  var insertIdx=APP.items.indexOf(srcIt)+1;
  APP.items.splice.apply(APP.items,[insertIdx,0].concat(newSplits));

  autoSortItems();renderItems();renderREEntries();renderAbstract();
  closeSplitModal();
  showToast('✅ Split into '+ns.length+' parts (Total: '+totalQty.toFixed(3)+' '+srcIt.unit+')','success');
}

/* Move a split part up/down independently */
/* Move a split part up/down — freely swap with ANY item (no parent restriction) */
function moveSplitUp(idx){
  if(idx<=0)return;
  var it=APP.items[idx];
  if(!it.isSplit)return;
  APP.items[idx]=APP.items[idx-1];APP.items[idx-1]=it;
  renderItems();renderREEntries();
}
function moveSplitDown(idx){
  if(idx>=APP.items.length-1)return;
  var it=APP.items[idx];
  if(!it.isSplit)return;
  APP.items[idx]=APP.items[idx+1];APP.items[idx+1]=it;
  renderItems();renderREEntries();
}

function removeSplit(idx){
  var it=APP.items[idx];
  APP.items.splice(idx,1);
  // Check if parent still has splits
  var parent=APP.items.find(function(x){return x.id===it.splitOf;});
  if(parent){
    var remaining=APP.items.filter(function(x){return x.splitOf===parent.id;});
    if(remaining.length===0){
      parent.hasSplits=false;
      // Restore original qty
      parent.estQty=parent._origQty||0;
    }
  }
  renderItems();renderREEntries();renderAbstract();
}
function closeSplitModal(){document.getElementById('splitModal').classList.remove('open');_splitSrcId=null;}

/* ═══════════════════════════════════════════════════════════
   RE ENTRIES
   ═══════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════
   MEASUREMENT ENGINE  (Estimate rows  ⇄  Actual / MB rows)

   it.estRows   = measurement rows of the ESTIMATE   (from the saved estimate, or typed when an SSR item is added)
   it.reEntries = ACTUAL (MB) measurement rows       (what was really executed → Bill qty)
   it.same      = null  → not decided yet (user is asked: "is actual = estimate?")
                  true  → Actual = Estimate (rows are copied automatically; if the estimate rows change, actual follows)
                  false → Actual is different (user edited it; rows are independent)
   it.estQty    = calculated from it.estRows          it.billQty = calculated from it.reEntries
   Row types    : normal {n,l,b,d} | deduction {ded:true} | % row {isPct} | fixed {fixed,q0}
   L / B / D fields accept formulas such as  =3.5*2-0.23
   Rows created by this engine carry _v2:true; rows of older saved bills (no _v2) keep their old calculation.
   ═══════════════════════════════════════════════════════════ */
function msNum(x){var v=parseFloat(x);return isNaN(v)?0:v;}
function msR3(x){return Math.round(x*1000)/1000;}
function msA(v){return escHtml(String(v==null?'':v));}
function msEval(x){
  if(x===''||x==null)return null;
  if(typeof x==='number')return isFinite(x)?x:null;
  var s=String(x).trim();if(!s)return null;
  if(s.charAt(0)==='='){
    var ex=s.substring(1);
    if(!/^[0-9+\-*\/().\s]*$/.test(ex))return null;
    try{var r=Function('"use strict";return ('+ex+')')();return(typeof r==='number'&&isFinite(r))?r:null;}catch(e){return null;}
  }
  var v=parseFloat(s);return isNaN(v)?null:v;
}
function msPF(x){var v=msEval(x);return v===null?0:v;}
function msNewRow(o){return Object.assign({lbl:'',n:'',l:'',b:'',d:'',ded:false},o||{});}
function msNewPctRow(){return{lbl:'% extra',isPct:true,pctMode:'pct',pct:'',factor:''};}
function msRowCalc(r,base){
  if(r.fixed){var q=msNum(r.q0);return r.ded?-Math.abs(q):q;}
  if(r.isPct){var f=(r.pctMode==='factor')?msNum(r.factor):msNum(r.pct)/100;return msR3((base||0)*f);}
  var n=msEval(r.n),l=msEval(r.l),b=msEval(r.b),d=msEval(r.d);
  var dims=!!(l||b||d);
  var t=(n===null||n===0)?(dims?1:0):n;
  if(l)t*=l;if(b)t*=b;if(d)t*=d;
  t=msR3(t);return r.ded?-t:t;
}
function msRowsBase(rows){var b=0;rows.forEach(function(r){if(!r.isPct)b+=msRowCalc(r,0);});return msR3(b);}
function msCalcRows(rows){var base=msRowsBase(rows),t=base;rows.forEach(function(r){if(r.isPct)t+=msRowCalc(r,base);});return msR3(t);}
function msIsSteel(it){return it.no==='26.33'||it.no==='26.34';}
function msHasEst(it){return !!(it.estRows&&it.estRows.length);}
/* items shown in the RE / MB tab (split parents are excluded) */
/* badge count: a split parent is not counted (only its parts are billed) */
function msItemCount(){return APP.items.filter(function(x){return !x.hasSplits;}).length;}
function msIsReItem(x){return !x.hasSplits&&(x.estQty>0||x.isSplit||x._added);}

/* estimate row  →  actual (MB) row */
function msRowToMB(r,steel){
  var o={desc:r.lbl||'',no:'',L:'',B:'',H:'',bars:'',sets:'',wt:'',isDeduct:!!r.ded,rowQty:0,runTotal:0,_v2:true};
  if(r.isPct){
    o.isPct=true;o.desc=r.lbl||'% extra';o.pctMode=(r.pctMode==='factor')?'factor':'pct';
    o.pct=(r.pct==null?'':r.pct);o.factor=(r.factor==null?'':r.factor);
    if(r.fixed){o.fixed=true;o.q0=msNum(r.q0);}
    return o;
  }
  if(r.fixed||steel){o.fixed=true;o.q0=r.fixed?msNum(r.q0):Math.abs(msRowCalc(r,0));return o;}
  o.no=(r.n==null?'':r.n);o.L=(r.l==null?'':r.l);o.B=(r.b==null?'':r.b);o.H=(r.d==null?'':r.d);
  return o;
}
/* recalculate one item's actual rows → rowQty / runTotal / billQty */
function msRecalc(it){
  if(!it||!it.reEntries)return;
  var steel=msIsSteel(it),base=0,allV2=true;
  it.reEntries.forEach(function(r){
    if(!r._v2)allV2=false;
    if(!r.isPct){var q=calcMBRowQty(r,steel);r.rowQty=q;base+=r.isDeduct?-Math.abs(q):q;}
  });
  if(allV2)base=msR3(base);
  var run=0;
  it.reEntries.forEach(function(r){
    if(r.isPct){
      var f=(r.pctMode==='factor')?msNum(r.factor):msNum(r.pct)/100;
      r.rowQty=r.fixed?msNum(r.q0):msR3(base*f);
      run+=r.rowQty;
    }else{
      run+=r.isDeduct?-Math.abs(r.rowQty):r.rowQty;
    }
    r.runTotal=allV2?msR3(run):run;
  });
  it.billQty=Math.max(0,allV2?msR3(run):run);
}
/* estimate rows changed → recompute estQty, and copy to actual unless user made actual different */
function msSyncEst(it){
  if(!msHasEst(it))return;
  it.estQty=msR3(msCalcRows(it.estRows));
  if(it.same!==false){
    var st=msIsSteel(it);
    it.reEntries=it.estRows.map(function(r){return msRowToMB(r,st);});
  }
  msRecalc(it);
}
/* saved estimate item (ATP app format)  →  estimate rows + tentative actual rows */
function msAttachRows(ni,src){
  var q=msNum(src.qty)||msNum(src.estQty);
  var sr=(src.rows||[]).filter(function(r){return r&&!r.isTot;});
  ni.same=null;ni.estRows=[];
  if(!sr.length){
    if(q>0)ni.estRows=[msNewRow({n:q})];else return;
  }else{
    var rows=sr.map(function(r){
      var o={lbl:r.lbl||'',n:(r.n==null?'':r.n),l:(r.l?r.l:''),b:(r.b?r.b:''),d:(r.d?r.d:''),ded:!!r.isDeduct};
      if(r.isPct){
        o.isPct=true;o.lbl=r.lbl||'% extra';o.pctMode=(r.pctMode==='factor')?'factor':'pct';
        o.pct=(r.pct==null?'':r.pct);o.factor=(r.factor==null?'':r.factor);
        if(!(r.pctSrc==null||r.pctSrc===''||r.pctSrc==='self')){o.fixed=true;o.q0=msNum(r.qty);}
      }else{
        var c=msRowCalc(o,0),diff=o.ded?Math.abs(Math.abs(c)-Math.abs(msNum(r.qty))):Math.abs(c-msNum(r.qty));
        if(diff>0.0006){o.fixed=true;o.q0=msNum(r.qty);}   /* linked / formula row → keep the estimate's qty as it is */
      }
      return o;
    });
    var base=msRowsBase(rows);
    rows.forEach(function(o,i){
      if(o.isPct&&!o.fixed&&Math.abs(msRowCalc(o,base)-msNum(sr[i].qty))>0.0006){o.fixed=true;o.q0=msNum(sr[i].qty);}
    });
    ni.estRows=rows;
  }
  msSyncEst(ni);
  if(sr.length&&q&&Math.abs(ni.estQty-q)>0.0015)ni.qWarn=q;
}

/* ── small CSS (injected once, so no HTML change is needed) ── */
function msInjectStyle(){
  if(document.getElementById('msStyle'))return;
  var s=document.createElement('style');s.id='msStyle';
  s.textContent=
    '.ms-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}'
   +'.ms-note{font-size:11px;color:var(--text3,#666)}'
   +'.ms-bar{margin:6px 0;padding:7px 10px;border-radius:6px;font-size:12px;border:1px solid}'
   +'.ms-ask{background:#fff8e6;border-color:#e0a83a}'
   +'.ms-ok{background:rgba(30,107,62,.08);border-color:rgba(30,107,62,.3);color:#1e6b3e}'
   +'.ms-chg{background:#eef3ff;border-color:#9db4e8}'
   +'.ms-warn{margin:6px 0;padding:7px 10px;border-radius:6px;font-size:12px;border:1px solid rgba(139,26,26,.35);background:rgba(139,26,26,.06);color:#8b1a1a}'
   +'.ms-est{margin:8px 0;border:1px dashed var(--border2,#bbb);border-radius:6px;padding:4px 8px}'
   +'.ms-est summary{cursor:pointer;font-size:12px;font-weight:600;padding:3px 0}'
   +'.ms-ovl{position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:none;align-items:center;justify-content:center;z-index:9999}'
   +'.ms-ovl.open{display:flex}'
   +'.ms-box{background:var(--paper,#fff);color:inherit;width:min(820px,94vw);max-height:88vh;overflow:auto;border-radius:10px;padding:16px}'
   +'.ms-res{max-height:48vh;overflow:auto;border:1px solid #ddd;border-radius:6px;margin-top:6px}'
   +'.ms-ri{padding:7px 9px;border-bottom:1px solid #eee;cursor:pointer;font-size:12px}'
   +'.ms-ri:hover{background:rgba(26,39,68,.07)}'
   +'.ms-in{width:100%;padding:8px;border:1px solid #bbb;border-radius:6px;font-size:13px;box-sizing:border-box}'
   +'#reEntriesContainer .re-item{margin:0 0 3px 0!important;position:relative}'
   +'#reEntriesContainer .re-item+.re-item{border-top-left-radius:0;border-top-right-radius:0}'
   +'#reEntriesContainer .re-item-body{padding-top:6px!important;padding-bottom:8px!important}'
   +'#reEntriesContainer .mb-table{margin:4px 0!important}'
   +'#reEntriesContainer .ms-est{margin:4px 0}'
   +'#reEntriesContainer .ms-bar,#reEntriesContainer .ms-warn{margin:4px 0}'
   +'.ms-low{display:inline-block;margin-top:2px;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;background:rgba(139,26,26,.08);border:1px solid rgba(139,26,26,.35);color:#8b1a1a;white-space:nowrap}'
   +'.ms-ssrtxt{display:block;font-size:10px;color:var(--text3,#666);white-space:nowrap}'
   +'.ms-ssrtxt a{color:#1a2744;cursor:pointer;text-decoration:underline}';
  document.head.appendChild(s);
}

/* ── estimate rows table (also used for the "Add item from SSR" draft, id='__draft') ── */
var MSDRAFT={id:'__draft',no:'',desc:'',unit:'',rate:'',estRows:[],same:true};
function msItemRef(id){return id==='__draft'?MSDRAFT:getItemById(id);}
function msEstTable(it){
  var rows=it.estRows||[],base=msRowsBase(rows),id=it.id;
  var h='<table class="mb-table"><thead><tr><th style="width:26px">#</th><th style="min-width:140px">Description</th><th style="width:60px">Nos</th><th style="width:60px">L</th><th style="width:60px">B</th><th style="width:60px">D/H</th><th style="width:68px">Qty</th><th style="width:32px"></th></tr></thead><tbody>';
  if(!rows.length)h+='<tr><td colspan="8" class="text-xs text-muted">No rows yet — press "+ Row".</td></tr>';
  rows.forEach(function(r,ri){
    var bg=r.isPct?' style="background:#f7f0fb"':(r.ded?' style="background:#fdeeee"':'');
    h+='<tr'+bg+'><td class="text-xs text-muted">'+(ri+1)
      +(r.ded?'<br><span title="Deduction" style="color:#b3261e;font-weight:700">−</span>':'')
      +(r.fixed?'<br><span title="Fixed quantity taken from the estimate (linked / formula row). If you change L/B/D it is recalculated.">🔒</span>':'')+'</td>';
    h+='<td class="desc-cell"><input type="text" value="'+msA(r.lbl)+'" onchange="msSetEst(\''+id+'\','+ri+',\'lbl\',this.value)"></td>';
    if(r.isPct){
      var isF=(r.pctMode==='factor');
      h+='<td colspan="4"><div style="display:flex;gap:4px;align-items:center"><select style="width:92px" onchange="msSetEst(\''+id+'\','+ri+',\'pctMode\',this.value)"><option value="pct"'+(isF?'':' selected')+'>% (percent)</option><option value="factor"'+(isF?' selected':'')+'>× factor</option></select>'
        +'<input type="text" inputmode="decimal" style="width:80px" value="'+msA(isF?r.factor:r.pct)+'" oninput="msSetEst(\''+id+'\','+ri+',\''+(isF?'factor':'pct')+'\',this.value)"><span class="ms-note">of the rows above</span></div></td>';
    }else{
      ['n','l','b','d'].forEach(function(f){
        h+='<td><input type="text" inputmode="decimal" value="'+msA(r[f])+'" oninput="msSetEst(\''+id+'\','+ri+',\''+f+'\',this.value)"></td>';
      });
    }
    h+='<td class="calc-cell" id="msEq_'+id+'_'+ri+'">'+msRowCalc(r,base).toFixed(3)+'</td>';
    h+='<td><button class="btn btn-danger btn-xs" onclick="msDelEst(\''+id+'\','+ri+')">✕</button></td></tr>';
  });
  h+='</tbody><tfoot><tr class="mb-total-row"><td colspan="6" style="text-align:right"><strong>Estimate Qty =</strong></td><td class="calc-cell" id="msEt_'+id+'"><strong>'+msCalcRows(rows).toFixed(3)+'</strong></td><td></td></tr></tfoot></table>';
  h+='<div class="flex gap8 mt8"><button class="btn btn-ghost btn-sm" onclick="msAddEst(\''+id+'\',\'n\')">+ Row</button>'
    +'<button class="btn btn-ghost btn-sm" onclick="msAddEst(\''+id+'\',\'d\')">(-) Deduct</button>'
    +'<button class="btn btn-ghost btn-sm" onclick="msAddEst(\''+id+'\',\'p\')">+ % Row</button>'
    +'<span class="ms-note">L / B / D accept formulas like <b>=3.5*2-0.23</b></span></div>';
  return h;
}
function msUpdEstCells(it){
  var rows=it.estRows||[],base=msRowsBase(rows);
  rows.forEach(function(r,ri){var e=document.getElementById('msEq_'+it.id+'_'+ri);if(e)e.textContent=msRowCalc(r,base).toFixed(3);});
  var t=document.getElementById('msEt_'+it.id);if(t)t.innerHTML='<strong>'+msCalcRows(rows).toFixed(3)+'</strong>';
}
function msEstChanged(it,again){
  var draft=(it.id==='__draft');
  if(!draft)msSyncEst(it);
  var box=document.getElementById('msEbox_'+it.id);
  if(again&&box)box.innerHTML=msEstTable(it);else msUpdEstCells(it);
  if(draft)return;
  msRefreshActual(it);renderAbstract();
}
function msSetEst(id,ri,f,v){
  var it=msItemRef(id);if(!it||!it.estRows||!it.estRows[ri])return;
  var r=it.estRows[ri];r[f]=v;
  if(r.fixed&&(f==='n'||f==='l'||f==='b'||f==='d'||f==='pct'||f==='factor'))r.fixed=false;
  msEstChanged(it,f==='pctMode');
}
function msAddEst(id,t){
  var it=msItemRef(id);if(!it)return;if(!it.estRows)it.estRows=[];
  it.estRows.push(t==='p'?msNewPctRow():msNewRow({ded:t==='d'}));
  msEstChanged(it,true);
}
function msDelEst(id,ri){
  var it=msItemRef(id);if(!it||!it.estRows)return;
  it.estRows.splice(ri,1);msEstChanged(it,true);
}
function msEstToggle(id,open){var it=getItemById(id);if(it)it._estOpen=!!open;}

/* ── comparison badge + Estimate/Actual status bar ── */
function msCompHtml(it){
  var estQty=it.estQty||0,actualQty=it.billQty||0,diffQty=actualQty-estQty;
  if(!(estQty>0))return '';
  var mono="font-family:'Source Code Pro',monospace";
  if(Math.abs(diffQty)>0.0005){
    var isOver=diffQty>0,clr=isOver?'var(--red)':'var(--green)',arrow=isOver?'▲':'▼';
    var diffPct=diffQty/estQty*100,diffAmt=diffQty*(it.rate||0);
    return '<span style="display:inline-flex;align-items:center;gap:6px;background:'+(isOver?'rgba(139,26,26,.08)':'rgba(30,107,62,.08)')
      +';border:1px solid '+(isOver?'rgba(139,26,26,.3)':'rgba(30,107,62,.3)')+';border-radius:6px;padding:3px 9px;font-size:11px;'+mono+'">'
      +'<span style="color:'+clr+';font-weight:700">'+arrow+' '+(isOver?'+':'')+diffQty.toFixed(3)+' '+it.unit+'</span>'
      +'<span style="color:'+clr+'">('+(isOver?'+':'')+diffPct.toFixed(1)+'%)</span>'
      +'<span style="color:var(--text3)">|</span>'
      +'<span style="color:'+clr+';font-weight:700">'+(isOver?'+':'-')+'₹'+fmt(Math.abs(diffAmt))+'</span></span>';
  }
  return '<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(30,107,62,.08);border:1px solid rgba(30,107,62,.3);border-radius:6px;padding:3px 9px;font-size:11px;'+mono+';color:var(--green)">✓ Same as estimate</span>';
}
function msStHtml(it){
  if(!msHasEst(it))return '';
  var u=escHtml(it.unit||''),h='';
  if(it.qWarn)h+='<div class="ms-warn">⚠️ The saved estimate shows qty '+it.qWarn.toFixed(3)+' for this item, but its measurement rows give '+(it.estQty||0).toFixed(3)+' — please check the estimate rows.</div>';
  if(it.same==null){
    h+='<div class="ms-bar ms-ask">❓ Estimate quantity is <b>'+(it.estQty||0).toFixed(3)+' '+u+'</b>. Is the work actually executed the same? '
      +'<button class="btn btn-ghost btn-xs" onclick="msSame(\''+it.id+'\',true)">✅ Yes, same</button> '
      +'<button class="btn btn-ghost btn-xs" onclick="msSame(\''+it.id+'\',false)">✏️ No, different</button></div>';
  }else if(it.same===true){
    h+='<div class="ms-bar ms-ok">✅ Actual = Estimate (automatic). To change anything, edit any figure in the MB table below — it switches to "different" by itself.</div>';
  }else{
    h+='<div class="ms-bar ms-chg">✏️ Actual quantity is different from the estimate. <button class="btn btn-ghost btn-xs" onclick="msSame(\''+it.id+'\',true)">↺ Reset to estimate</button></div>';
  }
  return h;
}
function msUpdMBCells(it){
  (it.reEntries||[]).forEach(function(r,ri){
    var tr=document.getElementById('mbrow_'+it.id+'_'+ri);if(!tr)return;
    var cs=tr.querySelectorAll('.calc-cell');
    if(cs[0])cs[0].textContent=((r.isDeduct&&!r.isPct)?'(-)':'')+(r.rowQty||0).toFixed(3);
    if(cs[1])cs[1].textContent=(r.runTotal||0).toFixed(3);
  });
  var q=(it.billQty||0).toFixed(3);
  ['mbsum_','bq_'].forEach(function(p){var e=document.getElementById(p+it.id);if(e)e.textContent=q;});
  var c=document.getElementById('comp_'+it.id);if(c)c.innerHTML=msCompHtml(it);
  var s=document.getElementById('st_'+it.id);if(s)s.innerHTML=msStHtml(it);
}
function msRefreshActual(it){
  var steel=msIsSteel(it),tb=document.getElementById('mbr_'+it.id);
  if(tb){var h='';(it.reEntries||[]).forEach(function(row,ri){h+=renderMBRow(it,ri,row,steel);});tb.innerHTML=h;}
  msUpdMBCells(it);
  var q=(it.estQty||0).toFixed(3);
  ['hesq_','esq_','mssum_'].forEach(function(p){var e=document.getElementById(p+it.id);if(e)e.textContent=q;});
}
function msSame(id,yes){
  var it=getItemById(id);if(!it)return;
  if(yes&&it.same===false&&!confirm('Replace the actual (MB) rows with the estimate rows?'))return;
  it.same=!!yes;
  if(yes)msSyncEst(it);else msRecalc(it);   /* "No" → the copied estimate rows stay and can be edited */
  renderREEntries();renderAbstract();
  if(!yes)showToast('Actual rows are a copy of the estimate rows — change them as needed','warn');
}
function msSameAll(){
  APP.items.forEach(function(it){if(msIsReItem(it)&&msHasEst(it)&&it.same==null){it.same=true;msSyncEst(it);}});
  renderREEntries();renderAbstract();
  showToast('✅ All items: Actual = Estimate','success');
}
function msToolbarHtml(){
  var und=APP.items.filter(function(x){return msIsReItem(x)&&msHasEst(x)&&x.same==null;}).length;
  var h='<div class="ms-toolbar"><button class="btn btn-ghost btn-sm" onclick="openSsrAdd()">🔎 Add Item from SSR</button>';
  if(und)h+='<button class="btn btn-ghost btn-sm" onclick="msSameAll()">✅ All '+und+' pending items: Actual = Estimate</button><span class="ms-note">'+und+' item(s) still need a decision on the actual quantity.</span>';
  return h+'</div>';
}

/* ═══════════════════════════════════════════════════════════
   RE ENTRIES  (MB tab)
   ═══════════════════════════════════════════════════════════ */
function renderREEntries(){
  msInjectStyle();
  var cont=document.getElementById('reEntriesContainer');
  var tb=msToolbarHtml();
  if(!APP.items.length){cont.innerHTML=tb+'<div class="empty-state"><div class="icon">📐</div><p>Load an estimate, or add items from SSR</p></div>';return;}
  var html=tb;
  var billable=APP.items.filter(msIsReItem);
  document.getElementById('reBadge').textContent=billable.length;

  billable.forEach(function(it,billIdx){
    var cat=it.cat||{seq:99,cat:'other',label:'',curing:0};
    var isSteelItem=msIsSteel(it);
    var tagBadge=isSteelItem&&it.steelTag?'<span class="steel-tag '+it.steelTag+'" style="margin-left:7px">'+it.steelTag.toUpperCase()+'</span>':'';
    var curBadge=cat.curing>0?'<span class="curing-badge" style="margin-left:7px">'+cat.curing+'d</span>':'';
    var col=it._reCollapsed?'display:none':'';

    // Estimate rows exist but actual rows are missing → copy them (unless user marked actual as different)
    if(msHasEst(it)&&(!it.reEntries||it.reEntries.length===0)&&it.same!==false)msSyncEst(it);
    // Older items without estimate rows: auto-create one row from estQty
    if((!it.reEntries||it.reEntries.length===0)&&it.estQty>0){
      it.reEntries=[{
        desc:(it.dispDesc||it.desc).substring(0,50),
        no:1, L:it.estQty, B:1, H:1,
        bars:1, sets:1, wt:1,
        isDeduct:false, _isEstRow:true,
        rowQty:it.estQty, runTotal:it.estQty
      }];
      it.billQty=it.estQty;
    }

    var estQty=it.estQty||0;
    var actualQty=it.billQty||0;

    html+='<div class="re-item" id="rei_'+it.id+'">';
    html+='<div class="re-item-header" onclick="toggleRE(\''+it.id+'\')" style="cursor:pointer">';
    html+='<span class="seq-badge cat-'+cat.cat+'" style="font-size:10px;flex-shrink:0">'+(billIdx+1)+'</span>';
    html+='<div class="re-item-title" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+it.no+' — '+(it.dispDesc||it.desc).substring(0,50)+tagBadge+curBadge+'</div>';
    html+='<div style="display:flex;align-items:center;gap:10px;flex-shrink:0;margin-left:8px">';
    html+='<span style="font-size:10px;color:rgba(255,255,255,.55);font-family:\'Source Code Pro\',monospace;white-space:nowrap">Est: <b id="hesq_'+it.id+'">'+estQty.toFixed(3)+'</b> '+it.unit+'</span>';
    html+='<span style="font-size:10px;color:rgba(255,255,255,.9);font-family:\'Source Code Pro\',monospace;white-space:nowrap">MB: <b id="bq_'+it.id+'">'+actualQty.toFixed(3)+'</b> '+it.unit+'</span>';
    html+='</div></div>';

    html+='<div class="re-item-body" id="reb_'+it.id+'" style="'+col+'">';

    // Meta row
    html+='<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding-bottom:9px;margin-bottom:9px;border-bottom:1px dashed var(--border2)">';
    html+='<div><label>RE No.</label><input type="text" id="rno_'+it.id+'" value="'+(it.reNo||'')+'" placeholder="RE-1" style="width:80px" onchange="updateREMeta(\''+it.id+'\',\'reNo\',this.value)"></div>';
    html+='<div><label>Date</label><input type="date" id="rdt_'+it.id+'" value="'+(it.reDate||'')+'" onchange="updateREMeta(\''+it.id+'\',\'reDate\',this.value)"></div>';
    html+='<div><label>Estimate Qty</label><div style="font-family:\'Source Code Pro\',monospace;font-weight:700;font-size:13px;padding:5px 0"><span id="esq_'+it.id+'">'+estQty.toFixed(3)+'</span> '+it.unit+'</div></div>';
    html+='<div><label>Rate</label><div style="font-family:\'Source Code Pro\',monospace;font-weight:700;font-size:13px;padding:5px 0">₹'+fmt(it.rate||0)+' / '+it.unit+'</div>'+msRateNote(it.no,it.rate,null)+'</div>';
    if(cat.curing>0)html+='<div class="next-date-info" id="ndi_'+it.id+'">'+getNextDateInfo(it)+'</div>';
    html+='<div id="comp_'+it.id+'" style="margin-left:auto">'+msCompHtml(it)+'</div>';
    html+='</div>';

    // Estimate / Actual status (question: is actual = estimate?)
    html+='<div id="st_'+it.id+'">'+msStHtml(it)+'</div>';

    // Estimate measurement (editable, collapsed by default)
    if(msHasEst(it)){
      html+='<details class="ms-est"'+(it._estOpen?' open':'')+' ontoggle="msEstToggle(\''+it.id+'\',this.open)">'
        +'<summary>📋 Estimate measurement ('+it.estRows.length+' rows) — Est Qty <span id="mssum_'+it.id+'">'+estQty.toFixed(3)+'</span> '+it.unit+'</summary>'
        +'<div id="msEbox_'+it.id+'">'+msEstTable(it)+'</div></details>';
    }

    // MB (actual) table
    html+='<table class="mb-table"><thead><tr>';
    html+='<th style="width:26px">#</th><th style="min-width:160px">Description</th><th style="width:42px">No.</th>';
    if(isSteelItem){
      html+='<th style="width:55px">Bars</th><th style="width:50px">Sets</th><th style="width:58px">L(m)</th><th style="width:55px">Wt</th><th style="width:68px">Qty(MT)</th>';
    }else{
      html+='<th style="width:58px">L</th><th style="width:58px">B</th><th style="width:58px">H</th><th style="width:68px">Qty</th>';
    }
    html+='<th style="width:68px">Total</th><th style="width:32px"></th>';
    html+='</tr></thead><tbody id="mbr_'+it.id+'">';
    (it.reEntries||[]).forEach(function(row,ri){html+=renderMBRow(it,ri,row,isSteelItem);});
    html+='</tbody>';
    html+='<tfoot><tr class="mb-total-row"><td colspan="'+(isSteelItem?7:5)+'"></td>';
    html+='<td colspan="2" style="text-align:right;color:var(--blue)"><strong>Bill Qty = <span id="mbsum_'+it.id+'">'+actualQty.toFixed(3)+'</span> '+it.unit+'</strong></td><td></td></tr></tfoot>';
    html+='</table>';
    html+='<div class="flex gap8 mt8">';
    html+='<button class="btn btn-ghost btn-sm" onclick="addMBRow(\''+it.id+'\')">+ Row</button>';
    html+='<button class="btn btn-ghost btn-sm" onclick="addMBDeductRow(\''+it.id+'\')">(-) Deduct</button>';
    html+='<button class="btn btn-ghost btn-sm" onclick="addMBPctRow(\''+it.id+'\')">+ % Row</button>';
    html+='</div></div></div>';
  });
  cont.innerHTML=html;
}

window.renderMBRow=function(it,ri,row,isSteelItem){
  var id=it.id,ded=(row.isDeduct&&!row.isPct)?'(-)':'';
  var bg=row.isPct?' style="background:#f7f0fb"':(row.isDeduct?' style="background:#fdeeee"':'');
  var h='<tr id="mbrow_'+id+'_'+ri+'"'+bg+'>';
  h+='<td class="text-xs text-muted">'+(ri+1)+(row.fixed?'<br><span title="Fixed quantity taken from the estimate (linked / formula row). If you change a figure it is recalculated.">🔒</span>':'')+'</td>';
  h+='<td class="desc-cell"><input type="text" value="'+msA(row.desc)+'" placeholder="Description…" onchange="updateMBRow(\''+id+'\','+ri+',\'desc\',this.value)"></td>';
  if(row.isPct){
    var isF=(row.pctMode==='factor');
    h+='<td colspan="'+(isSteelItem?5:4)+'"><div style="display:flex;gap:4px;align-items:center"><select style="width:92px" onchange="updateMBRow(\''+id+'\','+ri+',\'pctMode\',this.value)"><option value="pct"'+(isF?'':' selected')+'>% (percent)</option><option value="factor"'+(isF?' selected':'')+'>× factor</option></select>'
      +'<input type="text" inputmode="decimal" style="width:80px" value="'+msA(isF?row.factor:row.pct)+'" oninput="updateMBRow(\''+id+'\','+ri+',\''+(isF?'factor':'pct')+'\',this.value)"><span class="text-xs text-muted">of the rows above</span></div></td>';
  }else{
    var noV=row._v2?(row.no==null?'':row.no):(row.no||1);
    h+='<td><input type="text" inputmode="decimal" value="'+msA(noV)+'" oninput="updateMBRow(\''+id+'\','+ri+',\'no\',this.value)"></td>';
    if(isSteelItem){
      h+='<td><input type="text" inputmode="decimal" value="'+msA(row.bars)+'" placeholder="bars" oninput="updateMBRow(\''+id+'\','+ri+',\'bars\',this.value)"></td>';
      h+='<td><input type="text" inputmode="decimal" value="'+msA(row.sets)+'" placeholder="sets" oninput="updateMBRow(\''+id+'\','+ri+',\'sets\',this.value)"></td>';
      h+='<td><input type="text" inputmode="decimal" value="'+msA(row.L)+'" placeholder="m" oninput="updateMBRow(\''+id+'\','+ri+',\'L\',this.value)"></td>';
      h+='<td><input type="text" inputmode="decimal" value="'+msA(row.wt)+'" placeholder="kg/m" oninput="updateMBRow(\''+id+'\','+ri+',\'wt\',this.value)"></td>';
    }else{
      h+='<td><input type="text" inputmode="decimal" value="'+msA(row.L)+'" placeholder="L" oninput="updateMBRow(\''+id+'\','+ri+',\'L\',this.value)"></td>';
      h+='<td><input type="text" inputmode="decimal" value="'+msA(row.B)+'" placeholder="B" oninput="updateMBRow(\''+id+'\','+ri+',\'B\',this.value)"></td>';
      h+='<td><input type="text" inputmode="decimal" value="'+msA(row.H)+'" placeholder="H" oninput="updateMBRow(\''+id+'\','+ri+',\'H\',this.value)"></td>';
    }
  }
  h+='<td class="calc-cell">'+ded+(row.rowQty||0).toFixed(3)+'</td>';
  h+='<td class="calc-cell">'+(row.runTotal||0).toFixed(3)+'</td>';
  h+='<td><button class="btn btn-danger btn-xs" onclick="deleteMBRow(\''+id+'\','+ri+')">✕</button></td>';
  h+='</tr>';
  return h;
};

/* any change of the actual rows while "Actual = Estimate" → it becomes "different" */
function msActualEdited(it){if(msHasEst(it)&&it.same!==false)it.same=false;}

function addMBRow(itemId){
  var it=getItemById(itemId);if(!it)return;
  if(!it.reEntries)it.reEntries=[];
  it.reEntries.push(msIsSteel(it)
    ?{desc:'',no:1,L:'',B:'',H:'',bars:'',sets:'',wt:'',isDeduct:false,rowQty:0,runTotal:0}
    :{desc:'',no:'',L:'',B:'',H:'',bars:'',sets:'',wt:'',isDeduct:false,rowQty:0,runTotal:0,_v2:true});
  msActualEdited(it);
  recalcMB(itemId);renderREEntries();
}
function addMBDeductRow(itemId){
  var it=getItemById(itemId);if(!it)return;
  if(!it.reEntries)it.reEntries=[];
  it.reEntries.push(msIsSteel(it)
    ?{desc:'Deduct',no:1,L:'',B:'',H:'',bars:'',sets:'',wt:'',isDeduct:true,rowQty:0,runTotal:0}
    :{desc:'Deduct',no:'',L:'',B:'',H:'',bars:'',sets:'',wt:'',isDeduct:true,rowQty:0,runTotal:0,_v2:true});
  msActualEdited(it);
  recalcMB(itemId);renderREEntries();
}
function addMBPctRow(itemId){
  var it=getItemById(itemId);if(!it)return;
  if(!it.reEntries)it.reEntries=[];
  it.reEntries.push({desc:'% extra',isPct:true,pctMode:'pct',pct:'',factor:'',no:'',L:'',B:'',H:'',bars:'',sets:'',wt:'',isDeduct:false,rowQty:0,runTotal:0,_v2:true});
  msActualEdited(it);
  recalcMB(itemId);renderREEntries();
}
function updateMBRow(itemId,ri,field,val){
  var it=getItemById(itemId);if(!it||!it.reEntries||!it.reEntries[ri])return;
  var row=it.reEntries[ri];
  row[field]=val;                                   /* raw text is stored, so formulas like =3.5*2 work */
  if(field!=='desc'){
    if(row.fixed&&field!=='pctMode')row.fixed=false; /* editing a figure releases the fixed estimate qty */
    msActualEdited(it);
  }
  msRecalc(it);
  if(field==='pctMode'){renderREEntries();renderAbstract();return;}
  msUpdMBCells(it);
  renderAbstract();
}
function deleteMBRow(itemId,ri){
  var it=getItemById(itemId);if(!it||!it.reEntries)return;
  it.reEntries.splice(ri,1);msActualEdited(it);
  recalcMB(itemId);renderREEntries();renderAbstract();
}
function calcMBRowQty(row,isSteelItem){
  if(row.fixed)return msNum(row.q0);
  if(isSteelItem){
    return((msPF(row.no)||1)*(msPF(row.bars)||1)*(msPF(row.sets)||1)*msPF(row.L)*msPF(row.wt))/1000;
  }
  if(row._v2){
    var n=msEval(row.no),l=msEval(row.L),b=msEval(row.B),d=msEval(row.H);
    var dims=!!(l||b||d);
    var t=(n===null||n===0)?(dims?1:0):n;
    if(l)t*=l;if(b)t*=b;if(d)t*=d;
    return msR3(t);
  }
  return(msPF(row.no)||1)*msPF(row.L)*(msPF(row.B)||1)*(msPF(row.H)||1);
}
function recalcMB(itemId){
  var it=getItemById(itemId);if(!it||!it.reEntries)return;
  msRecalc(it);
}

function showRateDebug(){
  if(!APP.items.length){showToast('Load an estimate first','warn');return;}
  var html='';
  // Summary
  var withRate=APP.items.filter(function(x){return x.rate>0;}).length;
  html+='<div style="background:var(--bg2);padding:8px 10px;border-radius:6px;margin-bottom:10px">';
  html+='<strong>Total items: '+APP.items.length+' | With rate: '+withRate+' | Rate=0: '+(APP.items.length-withRate)+'</strong>';
  html+='</div>';

  // Show first item raw fields
  var sample=APP.items[0];
  if(sample&&sample._rawItem){
    html+='<div style="margin-bottom:8px;font-weight:700;color:var(--navy)">📦 First item received from Firebase (raw):</div>';
    html+='<table style="width:100%;border-collapse:collapse;font-size:11px">';
    html+='<tr style="background:var(--navy);color:#fff"><td style="padding:4px 8px">Field Name (Key)</td><td style="padding:4px 8px">Value</td><td style="padding:4px 8px">Type</td></tr>';
    Object.keys(sample._rawItem).forEach(function(k){
      var v=sample._rawItem[k];
      var isRate=/rate|Rate|amt|amount|price|cost/i.test(k);
      html+='<tr style="background:'+(isRate?'rgba(200,146,42,.15)':'')+'"><td style="padding:3px 8px;border-bottom:1px solid var(--border2);font-weight:'+(isRate?'700':'400')+'">'+k+(isRate?' ⭐':'')+'</td>';
      html+='<td style="padding:3px 8px;border-bottom:1px solid var(--border2);color:var(--blue)">'+JSON.stringify(v)+'</td>';
      html+='<td style="padding:3px 8px;border-bottom:1px solid var(--border2);color:var(--text3)">'+typeof v+'</td></tr>';
    });
    html+='</table>';
  } else {
    html+='<div style="color:var(--red)">⚠️ Raw item data not available — reload the estimate</div>';
  }

  // Show all items rate status
  html+='<div style="margin:10px 0 5px;font-weight:700;color:var(--navy)">📋 All items — rate status:</div>';
  html+='<table style="width:100%;border-collapse:collapse;font-size:11px">';
  html+='<tr style="background:var(--navy);color:#fff"><td style="padding:3px 6px">#</td><td style="padding:3px 6px">Item No</td><td style="padding:3px 6px">Rate</td><td style="padding:3px 6px">Status</td></tr>';
  APP.items.forEach(function(it,i){
    var ok=it.rate>0;
    html+='<tr style="background:'+(ok?'':'rgba(139,26,26,.08)')+'"><td style="padding:2px 6px;border-bottom:1px solid var(--border2)">'+(i+1)+'</td>';
    html+='<td style="padding:2px 6px;border-bottom:1px solid var(--border2)">'+it.no+'</td>';
    html+='<td style="padding:2px 6px;border-bottom:1px solid var(--border2);font-weight:700;color:'+(ok?'var(--green)':'var(--red)')+'">'+it.rate+'</td>';
    html+='<td style="padding:2px 6px;border-bottom:1px solid var(--border2)">'+(ok?'✅':'❌ rate=0')+'</td></tr>';
  });
  html+='</table>';

  document.getElementById('rateDebugContent').innerHTML=html;
  document.getElementById('rateDebugModal').classList.add('open');
}

function updateREMeta(itemId,field,val){
  var it=getItemById(itemId);if(it)it[field]=val;
  if(field==='reDate'){var el=document.getElementById('ndi_'+itemId);if(el)el.textContent=getNextDateInfo(it);}
}
function getNextDateInfo(it){
  if(!it.reDate||!it.cat||!it.cat.curing)return'';
  var d=new Date(it.reDate);d.setDate(d.getDate()+it.cat.curing);
  return'⏭️ Next work: '+d.toLocaleDateString('en-IN')+' onwards ('+it.cat.curing+'d curing)';
}
function toggleRE(itemId){
  var it=getItemById(itemId);if(!it)return;
  it._reCollapsed=!it._reCollapsed;
  var b=document.getElementById('reb_'+itemId);if(b)b.style.display=it._reCollapsed?'none':'';
}
function expandAllRE(){APP.items.forEach(function(x){x._reCollapsed=false;});renderREEntries();}
function collapseAllRE(){APP.items.forEach(function(x){x._reCollapsed=true;});renderREEntries();}
function expandAllSubs(){APP.items.forEach(function(x){x._reCollapsed=false;});renderItems();}
function collapseAllSubs(){APP.items.forEach(function(x){x._reCollapsed=true;});renderItems();}

/* ═══════════════════════════════════════════════════════════
   ABSTRACT
   ═══════════════════════════════════════════════════════════ */
function renderAbstract(){
  var tbody=document.getElementById('abstractTbody');

  // getGroupedBillableItems() — for a parent with splits: sum of the splits' billQty → one row
  var grouped=getGroupedBillableItems();

  if(!grouped.length){
    tbody.innerHTML='<tr><td colspan="7" class="empty-state">Enter RE entries</td></tr>';
    document.getElementById('summaryGrid').style.display='none';return;
  }
  var totalA=0,html='';
  grouped.forEach(function(it,i){
    var qty=it.billQty>0?it.billQty:(it.estQty||0);
    var amt=qty*(it.rate||0); totalA+=amt;
    var isSteelItem=(it.no==='26.33'||it.no==='26.34');
    var descHtml=(it.dispDesc||it.desc||'').substring(0,75)+'…';
    if(isSteelItem&&it.steelTag)descHtml='<strong>['+it.steelTag.toUpperCase()+']</strong> '+descHtml;
    html+='<tr><td class="text-xs text-muted">'+(i+1)+'</td><td class="num-cell">'+it.no+'</td>';
    html+='<td>'+descHtml+'</td><td class="amount-col">'+qty.toFixed(3)+'</td>';
    html+='<td class="text-xs text-muted">'+it.unit+'</td>';
    html+='<td class="amount-col">'+fmt(it.rate||0)+'</td><td class="amount-col">'+fmt(amt)+'</td></tr>';
  });
  html+='<tr class="total-row"><td colspan="6" style="text-align:right;font-weight:700">Total (A) — Work Items</td><td class="amount-col">'+fmt(totalA)+'</td></tr>';
  tbody.innerHTML=html;
  document.getElementById('sumA').textContent='₹ '+fmt(totalA);
  document.getElementById('summaryGrid').style.display='grid';
  calcRoyalty();updateAbstractPreview();
}
function calcRoyalty(){
  /* Bridge — uses calcCFRoyalty() which uses normNo() for item no. matching */
  if(typeof calcCFRoyalty !== 'function')return;
  var res=calcCFRoyalty();
  document.getElementById('sumB').textContent='₹ '+fmt(res.totalRoy||0);
  var sandEl=document.getElementById('roySandTotal');
  var murumEl=document.getElementById('royMurumTotal');
  var lineEl=document.getElementById('royaltyAutoLine');
  if(sandEl)sandEl.textContent=(res.sandM3||0).toFixed(3);
  if(murumEl)murumEl.textContent=(res.murumM3||0).toFixed(3);
  if(lineEl){
    var billable=getGroupedBillableItems();
    var cfCount=billable.filter(function(x){return itemHasCF(x);}).length;
    if(!billable.length)lineEl.textContent='';
    else if(cfCount>0)lineEl.textContent='✅ CF found: '+cfCount+'/'+billable.length+' items';
    else lineEl.textContent='⚠️ No CF — check the SSR no.';
  }
  calcGrand();
}
function calcGrand(){
  var a=parseFloat((document.getElementById('sumA').textContent||'0').replace(/[₹,]/g,''))||0;
  var b=parseFloat((document.getElementById('sumB').textContent||'0').replace(/[₹,]/g,''))||0;
  var c=msTestsTotal();
  document.getElementById('sumGrand').textContent='₹ '+fmt(a+b+c);
  try{renderAddonsPanel();}catch(e){}
}

/* ═══════════════════════════════════════════════════════════
   TESTS
   ═══════════════════════════════════════════════════════════ */
function openTestsEditor(){
  var html='<div style="font-size:10px;color:var(--text3);margin-bottom:7px;display:grid;grid-template-columns:2fr 60px 80px 50px;gap:5px"><span>Description</span><span>Qty</span><span>Rate ₹</span><span></span></div>';
  APP.tests.forEach(function(t,i){
    html+='<div style="display:grid;grid-template-columns:2fr 60px 80px 50px;gap:5px;margin-bottom:5px" id="trow_'+i+'">';
    html+='<input type="text" id="td_'+i+'" value="'+escHtml(t.desc)+'">';
    html+='<input type="number" id="tq_'+i+'" value="'+t.qty+'" step="1">';
    html+='<input type="number" id="tr_'+i+'" value="'+t.rate+'">';
    html+='<button class="btn btn-danger btn-xs" onclick="document.getElementById(\'trow_'+i+'\').remove()">✕</button>';
    html+='</div>';
  });
  document.getElementById('testsRows').innerHTML=html;
  document._testRowCount=APP.tests.length;
  document.getElementById('testsModal').classList.add('open');
}
function addTestRow(){
  var c=document._testRowCount||0;
  var div=document.createElement('div');div.id='trow_'+c;
  div.style.cssText='display:grid;grid-template-columns:2fr 60px 80px 50px;gap:5px;margin-bottom:5px';
  div.innerHTML='<input type="text" id="td_'+c+'" placeholder="Test name"><input type="number" id="tq_'+c+'" value="1"><input type="number" id="tr_'+c+'" value="0"><button class="btn btn-danger btn-xs" onclick="document.getElementById(\'trow_'+c+'\').remove()">✕</button>';
  document.getElementById('testsRows').appendChild(div);
  document._testRowCount=c+1;
}
function saveTests(){
  APP.tests=[];var n=document._testRowCount||0;var totalC=0;
  for(var i=0;i<n;i++){
    var d=document.getElementById('td_'+i);
    var q=document.getElementById('tq_'+i);
    var r=document.getElementById('tr_'+i);
    if(!d)continue;
    var qty=parseFloat((q||{value:1}).value)||1;
    var rate=parseFloat((r||{value:0}).value)||0;
    APP.tests.push({desc:d.value,qty:qty,rate:rate,unit:'Test'});
    totalC+=qty*rate;
  }
  document.getElementById('sumC').textContent='₹ '+fmt(totalC);
  calcGrand();closeTestsModal();
  showToast('Tests saved — ₹'+fmt(totalC),'success');
}
function closeTestsModal(){document.getElementById('testsModal').classList.remove('open');}

/* ═══════════════════════════════════════════════════════════
   TABS / UTILS
   ═══════════════════════════════════════════════════════════ */
function switchTab(tabId){
  document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active');});
  document.querySelectorAll('.tab-content').forEach(function(t){t.classList.remove('active');});
  document.getElementById(tabId).classList.add('active');
  document.getElementById('content-'+tabId).classList.add('active');
  if(tabId==='tab-abstract')renderAbstract();
  if(tabId==='tab-re')renderREEntries();
  if(tabId==='tab-royalty')renderRoyaltyTab();
  if(tabId==='tab-consumption')renderConsumptionTab();
  if(tabId==='tab-cement')renderCementConsumption();
  if(tabId==='tab-comparative')renderComparativeInput();
  if(tabId==='tab-tests')renderTestsTab();
  if(tabId==='tab-form47'){try{calcForm47Mem();}catch(e){}}
  if(tabId==='tab-completion'){try{cc65SyncTotalCost();}catch(e){}}
}

/* ═══════════════════════════════════════════════════════════
   CF KEY HELPERS
   ═══════════════════════════════════════════════════════════ */
var SAND_KEYS=['scr_sand','sand','quarry'];   // royalty-bearing (Sand rate)
var MURUM_KEYS=['overmetal','rubble'];        // royalty-bearing (Coarse/Murum rate)
var MAT_LABEL={
  sand:'Sand (Natural)',scr_sand:'Screened Sand',
  m20mm:'Metal 20mm',m12_10:'Metal 12-10mm',m40mm:'Metal 40mm',
  rubble:'Rubble / Murum',overmetal:'Overmetal',quarry:'Quarry / Soling',
  cement_bags:'Cement (bags)',bricks:'Bricks (nos)',ms_bars:'Steel TMT (MT)',bitumen:'Bitumen VG-30 (MT)'
};
var MAT_UNIT={
  sand:'M³',scr_sand:'M³',m20mm:'M³',m12_10:'M³',m40mm:'M³',
  rubble:'M³',overmetal:'M³',quarry:'M³',cement_bags:'Bags',bricks:'Nos',ms_bars:'MT',bitumen:'MT'
};

/* Normalize SSR no — trim spaces, handle "25.11 " → "25.11" */
function normNo(n){
  if(!n)return'';
  var s=(n+'').trim().replace(/[\r\n\t\s]/g,'');
  // Remove leading zeros from major part: "025.11" → "25.11"
  s=s.replace(/^0+(\d)/,'$1');
  return s;
}
/* Try all possible CF_MAP lookups for an item no */
function getCF(no){
  if(!no)return null;
  var n=normNo(no);
  if(CF_MAP[n])return CF_MAP[n];
  var n2=n.replace(/\.0$/,'');
  if(CF_MAP[n2])return CF_MAP[n2];
  // "25.5" <-> "25.50" (trailing zero in 2-digit decimal part)
  if(/^\d+\.\d$/.test(n)&&CF_MAP[n+'0'])return CF_MAP[n+'0'];
  var n3=n.replace(/^(\d+\.\d*[1-9])0+$/,'$1');
  if(n3!==n&&CF_MAP[n3])return CF_MAP[n3];
  return null;
}
/* Get CF for item — Firebase stored CF first, then CF_MAP fallback */
function getItemCF(it){
  if(it.cf && typeof it.cf==='object' && Object.keys(it.cf).length>0) return it.cf;
  return getCF(it.no);
}
/* Check if item has any CF (Firebase or CF_MAP) */
function itemHasCF(it){
  return !!getItemCF(it);
}

/* ── Billable items helper — split parent skip, MB qty use ── */
function getBillableItems(){
  return APP.items.filter(function(x){
    if(x.hasSplits) return false; // parent with splits → skip (splits are taken individually)
    var qty=x.billQty>0?x.billQty:x.estQty;
    return qty>0;
  });
}
/* Get effective qty for an item — MB (billQty) > estQty */
function getEffectiveQty(it){
  return it.billQty>0 ? it.billQty : (it.estQty||0);
}

/* ── GROUPED billable items ──────────────────────────────────────────────────
   For an item with splits: the sum of all splits' billQty → one row as the parent item.
   Used for Royalty / Consumption / Cement / Comparative / Abstract.
   ─────────────────────────────────────────────────────────────────────────── */
function getGroupedBillableItems(){
  var result=[];
  var handledParents={};

  APP.items.forEach(function(it){
    // If it is a split item — add the parent once, as a group
    if(it.isSplit){
      var pid=it.splitOf;
      if(handledParents[pid]) return; // already processed
      handledParents[pid]=true;

      var parent=APP.items.find(function(x){return x.id===pid;});
      if(!parent) return;

      // find all splits and sum their billQty
      var splits=APP.items.filter(function(x){return x.splitOf===pid;});
      var totalQty=0;
      splits.forEach(function(s){
        totalQty+=(s.billQty>0?s.billQty:(s.estQty||0));
      });
      if(totalQty<=0) return;

      // Clone of the parent — billQty = sum of the splits' MB, estQty = original estimate qty
      result.push(Object.assign({},parent,{
        billQty:totalQty,
        estQty:parent._origQty||parent.estQty||totalQty,  // preserve the original estimate qty
        cf:parent.cf||null,
        _rawItem:parent._rawItem||null,
        dispDesc:parent.dispDesc||parent.desc
      }));
      return;
    }

    // parent with hasSplits=true is skipped (handled through its splits above)
    if(it.hasSplits) return;

    // Normal item — only if it has a qty
    var qty=it.billQty>0?it.billQty:(it.estQty||0);
    if(qty>0) result.push(it);
  });

  return result;
}

/* ── ROYALTY — same rules as ATP estimator (atp_main.js: royCoarseF / _royTotals) ──
   Sand rate   : scr_sand + sand + quarry
   Coarse rate : overmetal + rubble (+ m40mm only when item is HB: it.hb40)
   Crushed metal (m40mm CB / m20mm / m12_10) = finished product → NO royalty
   Per item: net qty = round(factor × qty, 3 decimals); royalty = round(net × rate) whole rupees; then summed. */
function royCoarseF(cf,it){
  return (cf.overmetal||0)+(cf.rubble||0)+((it&&it.hb40)?(cf.m40mm||0):0);
}
function getRoyRates(){
  var rs=parseFloat((document.getElementById('rRateSand')||{}).value)||ROYALTY_RATE_SAND;
  var rm=parseFloat((document.getElementById('rRateMurum')||{}).value)||ROYALTY_RATE_MURUM;
  return {sand:rs,coarse:rm};
}
function royaltyOfItem(it,qty,rSand,rCoarse){
  var cf=getItemCF(it); if(!cf||!qty)return null;
  var sF=(cf.scr_sand||0)+(cf.sand||0)+(cf.quarry||0);
  var cF=royCoarseF(cf,it);
  var nS=Math.round(sF*qty*1000)/1000, nC=Math.round(cF*qty*1000)/1000;
  return {sF:sF,cF:cF,nS:nS,nC:nC,rS:Math.round(nS*rSand),rC:Math.round(nC*rCoarse)};
}
function calcCFRoyalty(){
  var sandM3=0,murumM3=0,sandRoy=0,murumRoy=0,rows=[];
  var rt=getRoyRates();
  getGroupedBillableItems().forEach(function(it){
    var qty=getEffectiveQty(it); // MB qty first, estQty fallback
    var r=royaltyOfItem(it,qty,rt.sand,rt.coarse); if(!r)return;
    var d=(it.dispDesc||it.desc||'').substring(0,55);
    if(r.sF>0){sandM3+=r.nS;sandRoy+=r.rS;rows.push({no:it.no,desc:d,unit:it.unit,qty:qty,mat:'Sand (M³)',matUnit:'M³',cf:r.sF,netQty:r.nS,type:'sand',royAmt:r.rS});}
    if(r.cF>0){murumM3+=r.nC;murumRoy+=r.rC;rows.push({no:it.no,desc:d,unit:it.unit,qty:qty,mat:'Coarse Aggregate (M³)',matUnit:'M³',cf:r.cF,netQty:r.nC,type:'murum',royAmt:r.rC});}
  });
  return {sandM3:sandM3,murumM3:murumM3,rows:rows,
          sandRoy:sandRoy,murumRoy:murumRoy,totalRoy:sandRoy+murumRoy};
}

/* ═══════════════════════════════════════════════════════════
   ROYALTY TAB
   ═══════════════════════════════════════════════════════════ */
function renderRoyaltyTab(){
  var el=document.getElementById('royaltyTabContent');
  if(!el)return;
  var billable=getGroupedBillableItems();
  if(!billable.length){el.innerHTML='<div class="empty-state"><div class="icon">💰</div><p>Load items first</p></div>';return;}
  var rSand=parseFloat((document.getElementById('rRateSand')||{value:237.37}).value)||237.37;
  var rMurum=parseFloat((document.getElementById('rRateMurum')||{value:216.18}).value)||216.18;
  var res=calcCFRoyalty();

  // Check which items matched CF
  var cfMatched=billable.filter(function(x){return itemHasCF(x);});
  var cfMissed=billable.filter(function(x){return !itemHasCF(x);});

  var h='';

  // Summary row
  h+='<div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">';
  h+='<div style="flex:1;min-width:130px;background:rgba(26,74,117,.08);border:1px solid rgba(26,74,117,.25);border-radius:8px;padding:10px;text-align:center">';
  h+='<div style="font-size:10px;color:var(--text3)">🪨 Total Sand</div>';
  h+='<div style="font-size:18px;font-weight:900;color:var(--blue)">'+res.sandM3.toFixed(3)+' M³</div>';
  h+='<div style="font-size:12px;color:var(--blue)">₹ '+fmt(res.sandRoy)+'</div></div>';
  h+='<div style="flex:1;min-width:130px;background:rgba(139,101,26,.08);border:1px solid rgba(139,101,26,.25);border-radius:8px;padding:10px;text-align:center">';
  h+='<div style="font-size:10px;color:var(--text3)">🏔️ Total Murum</div>';
  h+='<div style="font-size:18px;font-weight:900;color:#b87000">'+res.murumM3.toFixed(3)+' M³</div>';
  h+='<div style="font-size:12px;color:#b87000">₹ '+fmt(res.murumRoy)+'</div></div>';
  h+='<div style="flex:1;min-width:130px;background:rgba(30,107,62,.08);border:1px solid rgba(30,107,62,.25);border-radius:8px;padding:10px;text-align:center">';
  h+='<div style="font-size:10px;color:var(--text3)">✅ CF found</div>';
  h+='<div style="font-size:18px;font-weight:900;color:var(--green)">'+cfMatched.length+' / '+billable.length+'</div>';
  h+='<div style="font-size:10px;color:var(--text3)">items</div></div>';
  h+='<div style="flex:1;min-width:130px;background:rgba(139,26,26,.08);border:1px solid rgba(139,26,26,.25);border-radius:8px;padding:10px;text-align:center">';
  h+='<div style="font-size:10px;color:var(--text3)">💰 Total Royalty (B)</div>';
  h+='<div style="font-size:18px;font-weight:900;color:var(--red)">₹ '+fmt(res.totalRoy)+'</div></div>';
  h+='</div>';

  if(res.rows.length===0){
    h+='<div style="background:rgba(255,200,0,.08);border:1px solid rgba(255,200,0,.3);border-radius:8px;padding:16px;color:var(--text2)">';
    h+='<div style="font-size:18px;margin-bottom:8px;text-align:center">⚠️ Royalty could not be calculated</div>';
    h+='<div style="font-size:11px;margin-bottom:10px;text-align:center;color:var(--text3)">The SSR item numbers of the items did not match CF_MAP.</div>';
    h+='<table style="width:100%;border-collapse:collapse;font-size:10px">';
    h+='<thead><tr style="background:rgba(0,0,0,.05)"><th style="padding:4px 8px;text-align:left">Item No. (from Firebase)</th><th style="padding:4px 8px;text-align:left">after normNo()</th><th style="padding:4px 8px;text-align:left">CF found?</th></tr></thead><tbody>';
    billable.forEach(function(x){
      var nn=normNo(x.no);
      var cf=getItemCF(x);
      h+='<tr style="border-bottom:1px solid var(--border2)">';
      h+='<td style="padding:3px 8px;font-family:monospace">'+escHtml(x.no||'(empty)')+'</td>';
      h+='<td style="padding:3px 8px;font-family:monospace;color:var(--blue)">'+escHtml(nn||'(empty)')+'</td>';
      h+='<td style="padding:3px 8px">'+(cf?'<span style="color:var(--green);font-weight:700">✅ Yes</span>':'<span style="color:var(--red)">❌ No</span>')+'</td>';
      h+='</tr>';
    });
    h+='</tbody></table>';
    h+='<div style="margin-top:10px;font-size:10px;color:var(--text3)">💡 CF_MAP contains: 24.xx, 25.xx, 26.xx, 27.xx, 28.xx, 32.xx, 33.xx, 22.xx etc. — check the Item No. format.</div>';
    h+='</div>';
  } else {
    // SAND table
    var sandRows=res.rows.filter(function(r){return r.type==='sand';});
    if(sandRows.length){
      h+='<div style="font-size:12px;font-weight:700;color:var(--blue);margin:14px 0 7px;padding-bottom:4px;border-bottom:2px solid var(--blue)">🪨 Sand / Screened Sand / Quarry — ₹'+rSand.toFixed(2)+'/M³</div>';
      h+=buildRoyaltyTable(sandRows,'var(--blue)');
      h+='<div style="text-align:right;font-size:12px;font-weight:700;color:var(--blue);margin:4px 0 12px">Total Sand Royalty = <strong>₹ '+fmt(res.sandRoy)+'</strong></div>';
    }

    // MURUM table
    var murumRows=res.rows.filter(function(r){return r.type==='murum';});
    if(murumRows.length){
      h+='<div style="font-size:12px;font-weight:700;color:#b87000;margin:14px 0 7px;padding-bottom:4px;border-bottom:2px solid #b87000">🏔️ Rubble / Overmetal (Coarse) — ₹'+rMurum.toFixed(2)+'/M³</div>';
      h+=buildRoyaltyTable(murumRows,'#b87000');
      h+='<div style="text-align:right;font-size:12px;font-weight:700;color:#b87000;margin:4px 0 12px">Total Murum Royalty = <strong>₹ '+fmt(res.murumRoy)+'</strong></div>';
    }

    h+='<div style="font-size:10px;color:var(--text3);margin:2px 0 8px">ℹ️ Crushed metal (40mm / 20mm / 12-10mm) = finished product → royalty nahi. Net qty 3 decimals, royalty per item whole rupees (as ATP estimator).</div>';
    // Grand total bar
    h+='<div style="background:rgba(139,26,26,.08);border:1px solid rgba(139,26,26,.2);border-radius:8px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;margin-top:8px">';
    h+='<div><div style="font-weight:700;font-size:13px">💰 Total Royalty = Total (B)</div>';
    h+='<div style="font-size:10px;color:var(--text3)">Sand ₹'+fmt(res.sandRoy)+' + Murum ₹'+fmt(res.murumRoy)+'</div></div>';
    h+='<div style="font-size:22px;font-weight:900;color:var(--red)">₹ '+fmt(res.totalRoy)+'</div></div>';
  }

  // Items without CF warning
  if(cfMissed.length){
    h+='<div style="margin-top:12px;padding:10px 14px;background:rgba(255,200,0,.06);border:1px solid rgba(255,200,0,.3);border-radius:6px;font-size:10px">';
    h+='⚠️ <strong>Items below have no CF (royalty not applicable)</strong>:<br>';
    cfMissed.forEach(function(it){
      h+='<span style="display:inline-block;margin:2px 4px 2px 0;background:var(--bg2);padding:1px 7px;border-radius:10px;color:var(--text2)">'+it.no+'</span>';
    });
    h+='</div>';
  }

  el.innerHTML=h;
  // Also update Abstract royalty
  calcRoyalty();
}

function buildRoyaltyTable(rows,color){
  var h='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px">';
  h+='<thead><tr style="background:rgba(0,0,0,.04)">';
  ['Item No.','Description','Bill Qty','Material','CF Factor','Net M³','Royalty ₹'].forEach(function(col,i){
    h+='<th style="padding:5px 7px;text-align:'+(i>1?'right':'left')+';border-bottom:2px solid var(--border2);white-space:nowrap;font-size:10px">'+col+'</th>';
  });
  h+='</tr></thead><tbody>';
  rows.forEach(function(r,i){
    var bg=i%2===0?'':'background:rgba(0,0,0,.015)';
    h+='<tr style="'+bg+'">';
    h+='<td style="padding:4px 7px;font-weight:700;color:'+color+';border-bottom:1px solid var(--border2)">'+r.no+'</td>';
    h+='<td style="padding:4px 7px;color:var(--text2);border-bottom:1px solid var(--border2);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+r.desc+'</td>';
    h+='<td style="padding:4px 7px;text-align:right;border-bottom:1px solid var(--border2);font-family:\'Source Code Pro\',monospace">'+r.qty.toFixed(3)+' '+r.unit+'</td>';
    h+='<td style="padding:4px 7px;text-align:right;border-bottom:1px solid var(--border2);color:var(--text3)">'+r.mat+'</td>';
    h+='<td style="padding:4px 7px;text-align:right;border-bottom:1px solid var(--border2);font-family:\'Source Code Pro\',monospace">'+(+r.cf).toFixed(3)+'</td>';
    h+='<td style="padding:4px 7px;text-align:right;border-bottom:1px solid var(--border2);font-weight:700;font-family:\'Source Code Pro\',monospace">'+r.netQty.toFixed(3)+'</td>';
    h+='<td style="padding:4px 7px;text-align:right;border-bottom:1px solid var(--border2);font-weight:700;color:'+color+'">₹ '+fmt(r.royAmt)+'</td>';
    h+='</tr>';
  });
  h+='</tbody></table></div>';
  return h;
}

/* ═══════════════════════════════════════════════════════════
   CONSUMPTION TAB
   ═══════════════════════════════════════════════════════════ */
function renderConsumptionTab(){
  var el=document.getElementById('consumptionTabContent');
  if(!el)return;
  var billable=getGroupedBillableItems();
  if(!billable.length){el.innerHTML='<div class="empty-state"><div class="icon">📦</div><p>Load items first</p></div>';return;}

  // Build grouped totals per material
  var matTotals={}; // key → {label,unit,total}
  var rows=[];
  var hasCF=0;

  billable.forEach(function(it){
    // CF priority: straight from Firebase (it.cf) → CF_MAP fallback
    var cf=getItemCF(it);
    if(!cf)return;
    hasCF++;
    var qty=getEffectiveQty(it); // MB qty first
    var itemRow={no:it.no,desc:(it.dispDesc||it.desc).substring(0,60),unit:it.unit,qty:qty,mats:[]};
    Object.keys(cf).forEach(function(k){
      var net=qty*cf[k];
      itemRow.mats.push({k:k,label:MAT_LABEL[k]||k,unit:MAT_UNIT[k]||'',cf:cf[k],net:net});
      if(!matTotals[k])matTotals[k]={label:MAT_LABEL[k]||k,unit:MAT_UNIT[k]||'',total:0,isSand:SAND_KEYS.indexOf(k)>=0,isMurum:MURUM_KEYS.indexOf(k)>=0};
      matTotals[k].total+=net;
    });
    rows.push(itemRow);
  });

  if(!hasCF){
    el.innerHTML='<div style="text-align:center;padding:24px;color:var(--text3)"><div style="font-size:28px;margin-bottom:8px">📦</div><strong>No CF data</strong><br><small>Loaded SSR nos: '+billable.map(function(x){return x.no;}).join(', ')+'</small></div>';
    return;
  }

  var h='';

  // Material Summary Cards
  h+='<div style="font-size:12px;font-weight:700;margin-bottom:10px;color:var(--navy)">📊 Total Material Requirement</div>';
  h+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px">';
  ['cement_bags','scr_sand','sand','m20mm','m12_10','m40mm','overmetal','rubble','quarry','bricks','ms_bars','bitumen'].forEach(function(k){
    var mt=matTotals[k];
    if(!mt||!mt.total)return;
    var bgc=mt.isSand?'rgba(26,74,117,.08)':mt.isMurum?'rgba(139,101,26,.08)':'rgba(0,0,0,.04)';
    var bdc=mt.isSand?'rgba(26,74,117,.3)':mt.isMurum?'rgba(139,101,26,.3)':'var(--border2)';
    var txc=mt.isSand?'var(--blue)':mt.isMurum?'#b87000':'var(--navy)';
    var tag=mt.isSand?'🪨':mt.isMurum?'🏔️':'🏗️';
    h+='<div style="min-width:120px;background:'+bgc+';border:1px solid '+bdc+';border-radius:8px;padding:8px 12px;text-align:center">';
    h+='<div style="font-size:10px;color:var(--text3)">'+tag+' '+mt.label+'</div>';
    h+='<div style="font-size:15px;font-weight:900;color:'+txc+'">'+mt.total.toFixed(3)+'</div>';
    h+='<div style="font-size:10px;color:var(--text3)">'+mt.unit+'</div></div>';
  });
  h+='</div>';

  // Per-Item Detail Table
  h+='<div style="font-size:12px;font-weight:700;margin-bottom:8px;color:var(--navy)">📋 Item-wise Consumption</div>';
  h+='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px">';
  h+='<thead><tr style="background:var(--navy);color:#fff"><th style="padding:6px 8px;text-align:left">Item No.</th><th style="padding:6px 8px;text-align:left">Description</th><th style="padding:6px 8px;text-align:right">Bill Qty</th><th style="padding:6px 8px;text-align:left">Material</th><th style="padding:6px 8px;text-align:right">CF</th><th style="padding:6px 8px;text-align:right">Net Qty</th></tr></thead><tbody>';

  rows.forEach(function(it,ii){
    var rc=it.mats.length;
    it.mats.forEach(function(m,mi){
      var isSand=SAND_KEYS.indexOf(m.k)>=0,isMurum=MURUM_KEYS.indexOf(m.k)>=0;
      var mc=isSand?'var(--blue)':isMurum?'#b87000':'var(--text2)';
      var rowBg=ii%2===0?'':'background:rgba(0,0,0,.015)';
      h+='<tr style="'+rowBg+'">';
      if(mi===0){
        h+='<td rowspan="'+rc+'" style="padding:4px 8px;font-weight:700;color:var(--navy);border-bottom:2px solid var(--border2);vertical-align:top">'+it.no+'</td>';
        h+='<td rowspan="'+rc+'" style="padding:4px 8px;color:var(--text2);border-bottom:2px solid var(--border2);max-width:220px;vertical-align:top">'+it.desc+'</td>';
        h+='<td rowspan="'+rc+'" style="padding:4px 8px;text-align:right;border-bottom:2px solid var(--border2);vertical-align:top;font-family:\'Source Code Pro\',monospace">'+it.qty.toFixed(3)+' '+it.unit+'</td>';
      }
      h+='<td style="padding:4px 8px;color:'+mc+';border-bottom:1px solid var(--border2)">'+m.label+'</td>';
      h+='<td style="padding:4px 8px;text-align:right;border-bottom:1px solid var(--border2);font-family:\'Source Code Pro\',monospace;color:var(--text3)">'+m.cf+'</td>';
      h+='<td style="padding:4px 8px;text-align:right;border-bottom:1px solid var(--border2);font-weight:700;font-family:\'Source Code Pro\',monospace;color:'+mc+'">'+m.net.toFixed(3)+' '+m.unit+'</td>';
      h+='</tr>';
    });
  });

  // Totals footer
  h+='<tr style="background:var(--navy);color:#fff;font-weight:700"><td colspan="3" style="padding:6px 8px;text-align:right">TOTAL</td>';
  var matKeys=Object.keys(matTotals).filter(function(k){return matTotals[k].total>0;});
  if(matKeys.length>0){
    h+='<td style="padding:6px 8px">'+matTotals[matKeys[0]].label+'</td><td></td><td style="padding:6px 8px;text-align:right">'+matTotals[matKeys[0]].total.toFixed(3)+' '+matTotals[matKeys[0]].unit+'</td></tr>';
    for(var ki=1;ki<matKeys.length;ki++){
      var k=matKeys[ki];
      h+='<tr style="background:rgba(26,35,86,.06);font-weight:700"><td colspan="3"></td><td style="padding:4px 8px">'+matTotals[k].label+'</td><td></td><td style="padding:4px 8px;text-align:right;font-family:\'Source Code Pro\',monospace">'+matTotals[k].total.toFixed(3)+' '+matTotals[k].unit+'</td></tr>';
    }
  } else {
    h+='<td colspan="3"></td></tr>';
  }

  h+='</tbody></table></div>';

  // Missing items
  var missed=billable.filter(function(x){return !itemHasCF(x);});
  if(missed.length){
    h+='<div style="margin-top:12px;padding:10px;background:rgba(255,200,0,.06);border:1px solid rgba(255,200,0,.3);border-radius:6px;font-size:10px">';
    h+='⚠️ <strong>No CF:</strong> '+missed.map(function(x){return x.no;}).join(', ')+'</div>';
  }

  el.innerHTML=h;
}
function getItemById(id){return APP.items.find(function(x){return x.id===id;});}

/* ═══════════════════════════════════════════════════════════
   CEMENT CONSUMPTION STATEMENT
   ═══════════════════════════════════════════════════════════ */
function renderCementConsumption(){
  var el=document.getElementById('cementConsumptionContent');
  if(!el)return;

  // sync header spans for print
  document.getElementById('ccs-workname').textContent=(document.getElementById('ahWorkName').value||'')+' '+(document.getElementById('ahWorkName2').value||'');
  document.getElementById('ccs-contractor').textContent=document.getElementById('ahContractor').value||'—';
  document.getElementById('ccs-billno').textContent='B-1 No. '+(document.getElementById('billNo').value||'—')+' Date:- '+(document.getElementById('billDate').value||'—');

  var billable=getGroupedBillableItems();
  if(!billable.length){el.innerHTML='<div class="empty-state"><div class="icon">🏗️</div><p>Load items first</p></div>';return;}

  var cementRate=parseFloat(document.getElementById('cementRate').value)||380;
  var rows=[];
  var totalTheory=0, totalActual=0;

  billable.forEach(function(it){
    var cf=getItemCF(it);
    if(!cf||!cf.cement_bags)return;
    var qty=getEffectiveQty(it); // MB qty first
    var cfVal=cf.cement_bags;
    var theory=Math.round(qty*cfVal*100)/100;
    totalTheory+=theory;
    totalActual+=theory; // Actual = Theoretical (as per PWD practice)
    rows.push({
      desc:(it.dispDesc||it.desc).substring(0,70),
      no:it.no,unit:it.unit,qty:qty,
      cfRate:cfVal,theory:theory,actual:theory
    });
  });

  if(!rows.length){
    el.innerHTML='<div style="text-align:center;padding:20px;color:var(--text3)"><div style="font-size:28px">🏗️</div><strong>No Cement CF data</strong><br><small>None of the loaded items has a cement_bags CF.</small></div>';
    return;
  }

  var totalBags=Math.ceil(totalActual);
  var recovery=Math.round(totalBags*cementRate*100)/100;

  var h='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
  h+='<thead><tr style="background:var(--navy);color:#fff">';
  h+='<th style="padding:7px 8px;text-align:left;white-space:nowrap">Items of work</th>';
  h+='<th style="padding:7px 8px;text-align:right;white-space:nowrap">Qty Executed</th>';
  h+='<th style="padding:7px 8px;text-align:right;white-space:nowrap">Unit</th>';
  h+='<th style="padding:7px 8px;text-align:right;white-space:nowrap">Rate of<br>Theoretical<br>(Bags/Unit)</th>';
  h+='<th style="padding:7px 8px;text-align:right;white-space:nowrap">Theoretically<br>Consumption<br>(Bags)</th>';
  h+='<th style="padding:7px 8px;text-align:right;white-space:nowrap">Actual<br>Consumption<br>(Bags)</th>';
  h+='<th style="padding:7px 8px;text-align:right;white-space:nowrap">Total<br>Consumption</th>';
  h+='<th style="padding:7px 8px;text-align:left">Remark</th>';
  h+='</tr></thead><tbody>';

  rows.forEach(function(r,i){
    var bg=i%2===0?'':'background:rgba(0,0,0,.018)';
    h+='<tr style="'+bg+'">';
    h+='<td style="padding:5px 8px;border-bottom:1px solid var(--border2)">'+r.desc+'</td>';
    h+='<td style="padding:5px 8px;border-bottom:1px solid var(--border2);text-align:right;font-family:\'Source Code Pro\',monospace">'+r.qty.toFixed(2)+'</td>';
    h+='<td style="padding:5px 8px;border-bottom:1px solid var(--border2);text-align:right">'+r.unit+'</td>';
    h+='<td style="padding:5px 8px;border-bottom:1px solid var(--border2);text-align:right;font-family:\'Source Code Pro\',monospace">'+r.cfRate+'</td>';
    h+='<td style="padding:5px 8px;border-bottom:1px solid var(--border2);text-align:right;font-family:\'Source Code Pro\',monospace">'+r.theory.toFixed(2)+'</td>';
    h+='<td style="padding:5px 8px;border-bottom:1px solid var(--border2);text-align:right;font-family:\'Source Code Pro\',monospace">'+r.actual.toFixed(2)+'</td>';
    h+='<td style="padding:5px 8px;border-bottom:1px solid var(--border2);text-align:right"></td>';
    h+='<td style="padding:5px 8px;border-bottom:1px solid var(--border2);font-size:10px;color:var(--green)">Cement brought<br>Recovery in Bill</td>';
    h+='</tr>';
  });

  // Total row
  h+='<tr style="background:var(--navy);color:#fff;font-weight:700">';
  h+='<td colspan="3" style="padding:6px 8px;text-align:right">Total</td>';
  h+='<td style="padding:6px 8px;text-align:right">—</td>';
  h+='<td style="padding:6px 8px;text-align:right;font-family:\'Source Code Pro\',monospace">'+totalTheory.toFixed(2)+' Bags</td>';
  h+='<td style="padding:6px 8px;text-align:right;font-family:\'Source Code Pro\',monospace">'+totalActual.toFixed(2)+' Bags</td>';
  h+='<td style="padding:6px 8px;text-align:right;font-family:\'Source Code Pro\',monospace">'+totalBags+' Bags</td>';
  h+='<td></td></tr>';
  h+='</tbody></table></div>';

  // Recovery summary
  h+='<div style="margin-top:14px;background:linear-gradient(135deg,rgba(30,107,62,.08),rgba(200,146,42,.05));border:1px solid var(--border2);border-radius:8px;padding:12px 16px">';
  h+='<div style="font-size:12px;font-weight:700;color:var(--navy);margin-bottom:8px">💰 Cement Recovery Calculation</div>';
  h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">';
  h+='<div style="background:var(--paper);border-radius:6px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text3)">Total Bags</div><div style="font-size:18px;font-weight:900;color:var(--navy)">'+totalBags+'</div><div style="font-size:10px;color:var(--text3)">Bags</div></div>';
  h+='<div style="background:var(--paper);border-radius:6px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text3)">Rate per Bag</div><div style="font-size:18px;font-weight:900;color:var(--blue)">₹'+cementRate+'</div></div>';
  h+='<div style="background:var(--paper);border:2px solid var(--gold);border-radius:6px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--text3)">Recovery Amount</div><div style="font-size:18px;font-weight:900;color:var(--green)">₹ '+fmt(recovery)+'</div></div>';
  h+='</div></div>';

  el.innerHTML=h;
}

/* ═══════════════════════════════════════════════════════════
   COMPARATIVE STATEMENT — Fully Automatic
   Tender = estQty + rate (from estimate)
   Actual = billQty + rate (from MB entries)
   ═══════════════════════════════════════════════════════════ */
var COMP_REMARKS={}; // itemId → remark string only

function renderComparativeInput(){
  // Directly build the full comparative table — no manual input needed
  buildComparativeTable();
}

function buildComparativeTable(){
  var el=document.getElementById('comparativeInputArea');
  var outEl=document.getElementById('comparativeOutput');
  var tblEl=document.getElementById('comparativeTable');
  var sumEl=document.getElementById('comparativeSummary');
  if(!tblEl)return;

  if(el)el.innerHTML='';

  var workName=(document.getElementById('ahWorkName').value||'')+' '+(document.getElementById('ahWorkName2').value||'');
  var contractor=document.getElementById('ahContractor').value||'—';
  var billNo=document.getElementById('billNo').value||'—';
  var billDate=document.getElementById('billDate').value||'—';
  var agr=document.getElementById('ahAgreementNo').value||'—';

  var totalTAmt=0,totalAAmt=0,totalExcess=0,totalLess=0;

  // getGroupedBillableItems() — split parent = sum of the splits' billQty → one row
  var grouped=getGroupedBillableItems();

  if(!grouped.length){
    if(el)el.innerHTML='<div class="empty-state"><div class="icon">📑</div><p>Load items first</p></div>';
    if(outEl)outEl.style.display='none';
    return;
  }

  var rows=grouped.map(function(it){
    var tq=it.estQty||0;
    var tr=it.rate||0;
    var aq=it.billQty>0?it.billQty:(it.estQty||0);
    var tAmt=Math.round(tq*tr);
    var aAmt=Math.round(aq*tr);
    var diff=aAmt-tAmt;
    totalTAmt+=tAmt; totalAAmt+=aAmt;
    if(diff>0) totalExcess+=diff;
    if(diff<0) totalLess+=Math.abs(diff);
    return {it:it,tq:tq,tr:tr,tAmt:tAmt,aq:aq,ar:tr,aAmt:aAmt,diff:diff};
  });

  var h='<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px;border:1px solid #ccc">';
  // Header row 1
  h+='<thead>';
  h+='<tr style="background:var(--navy);color:#fff">';
  h+='<th rowspan="2" style="padding:6px 7px;text-align:left;border:1px solid rgba(255,255,255,.2)">Item of Work</th>';
  h+='<th colspan="3" style="padding:6px 7px;text-align:center;border:1px solid rgba(255,255,255,.2)">As per Tender</th>';
  h+='<th colspan="3" style="padding:6px 7px;text-align:center;border:1px solid rgba(255,255,255,.2)">As per Actual</th>';
  h+='<th colspan="2" style="padding:6px 7px;text-align:center;border:1px solid rgba(255,255,255,.2)">Difference</th>';
  h+='<th rowspan="2" style="padding:6px 7px;text-align:center;border:1px solid rgba(255,255,255,.2)">Remarks</th>';
  h+='</tr>';
  // Header row 2
  h+='<tr style="background:var(--navy2);color:#fff">';
  ['Quantity','Rate','Amount','Quantity','Rate','Amount','Excess','Less'].forEach(function(c){
    h+='<th style="padding:5px 6px;text-align:right;border:1px solid rgba(255,255,255,.2);white-space:nowrap">'+c+'</th>';
  });
  h+='</tr></thead><tbody>';

  rows.forEach(function(row,i){
    var it=row.it;
    var excess=row.diff>0?row.diff:0;
    var less=row.diff<0?Math.abs(row.diff):0;
    var bg=i%2===0?'#fff':'#f8f7f4';
    var exSt=excess>0?'color:var(--green);font-weight:700':'color:#999';
    var leSt=less>0?'color:var(--red);font-weight:700':'color:#999';
    var rem=COMP_REMARKS[it.id]||'';

    h+='<tr style="background:'+bg+'">';
    // Item of Work
    h+='<td style="padding:4px 8px;border:1px solid #ddd;font-size:11px"><b style="color:var(--blue)">'+it.no+'</b> — '+(it.dispDesc||it.desc).substring(0,55)+'</td>';
    // As per Tender
    h+='<td style="padding:4px 7px;border:1px solid #ddd;text-align:right;font-family:\'Source Code Pro\',monospace">'+row.tq.toFixed(3)+'</td>';
    h+='<td style="padding:4px 7px;border:1px solid #ddd;text-align:right;font-family:\'Source Code Pro\',monospace">'+row.tr.toFixed(2)+'</td>';
    h+='<td style="padding:4px 7px;border:1px solid #ddd;text-align:right;font-weight:700">'+row.tAmt.toLocaleString('en-IN')+'</td>';
    // As per Actual
    h+='<td style="padding:4px 7px;border:1px solid #ddd;text-align:right;font-family:\'Source Code Pro\',monospace">'+row.aq.toFixed(3)+'</td>';
    h+='<td style="padding:4px 7px;border:1px solid #ddd;text-align:right;font-family:\'Source Code Pro\',monospace">'+row.ar.toFixed(2)+'</td>';
    h+='<td style="padding:4px 7px;border:1px solid #ddd;text-align:right;font-weight:700">'+row.aAmt.toLocaleString('en-IN')+'</td>';
    // Difference
    h+='<td style="padding:4px 7px;border:1px solid #ddd;text-align:right;'+exSt+'">'+( excess>0?excess.toLocaleString('en-IN'):'0' )+'</td>';
    h+='<td style="padding:4px 7px;border:1px solid #ddd;text-align:right;'+leSt+'">'+( less>0?less.toLocaleString('en-IN'):'0' )+'</td>';
    // Remark — editable
    h+='<td style="padding:2px 5px;border:1px solid #ddd"><input type="text" value="'+escHtml(rem)+'" placeholder="Remark" style="width:100%;min-width:90px;font-size:10px;border:none;background:transparent;outline:none;font-family:inherit" oninput="COMP_REMARKS[\''+it.id+'\']=this.value" /></td>';
    h+='</tr>';
  });

  // Total row
  h+='<tr style="background:var(--navy);color:#fff;font-weight:700">';
  h+='<td style="padding:6px 8px;border:1px solid rgba(255,255,255,.2);text-align:right">Rs</td>';
  h+='<td colspan="2" style="border:1px solid rgba(255,255,255,.2)"></td>';
  h+='<td style="padding:6px 8px;border:1px solid rgba(255,255,255,.2);text-align:right">'+totalTAmt.toLocaleString('en-IN')+'</td>';
  h+='<td colspan="2" style="border:1px solid rgba(255,255,255,.2)"></td>';
  h+='<td style="padding:6px 8px;border:1px solid rgba(255,255,255,.2);text-align:right">'+totalAAmt.toLocaleString('en-IN')+'</td>';
  h+='<td style="padding:6px 8px;border:1px solid rgba(255,255,255,.2);text-align:right;color:#90EE90">'+totalExcess.toLocaleString('en-IN')+'</td>';
  h+='<td style="padding:6px 8px;border:1px solid rgba(255,255,255,.2);text-align:right;color:#FFB6C1">'+totalLess.toLocaleString('en-IN')+'</td>';
  h+='<td style="border:1px solid rgba(255,255,255,.2)"></td></tr>';
  h+='</tbody></table></div>';

  tblEl.innerHTML=h;

  // Summary
  var netDiff=totalExcess-totalLess;
  var netLabel=netDiff>=0?'Total Excess':'Total Less';
  var sH='<div style="margin-top:14px;display:flex;gap:16px;flex-wrap:wrap;align-items:center">';
  sH+='<div style="background:var(--paper);border:2px solid '+(netDiff>=0?'var(--green)':'var(--red)')+';border-radius:8px;padding:10px 20px;font-size:14px;font-weight:900">';
  sH+=netLabel+' = Rs &nbsp;<span style="color:'+(netDiff>=0?'var(--green)':'var(--red)')+'">'+Math.abs(netDiff).toLocaleString('en-IN')+'</span></div>';
  sH+='<div style="font-size:12px;color:var(--text3);font-family:\'Source Code Pro\',monospace">';
  sH+='Excess: '+totalExcess.toLocaleString('en-IN')+' | Less: '+totalLess.toLocaleString('en-IN')+'<br>';
  sH+=(netDiff>=0?'+':'')+netDiff.toLocaleString('en-IN')+' Net</div></div>';
  sumEl.innerHTML=sH;

  // print spans
  document.querySelectorAll('.cs-workname').forEach(function(e){e.textContent=workName;});
  document.querySelectorAll('.cs-contractor').forEach(function(e){e.textContent=contractor;});
  document.querySelectorAll('.cs-billno').forEach(function(e){e.textContent='B-1 No. '+billNo+' Date:- '+billDate+(agr&&agr!=='—'?' Agr:'+agr:'');});

  if(outEl)outEl.style.display='';
}
function fmt(n){
  if(!n&&n!==0)return'0.00';
  return new Intl.NumberFormat('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Math.round(n*100)/100);
}
function escHtml(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function updateBillBadge(){
  var v=document.getElementById('billNo').value||document.getElementById('ahBillNo').value||'___';
  document.getElementById('billBadge').textContent='B/No. '+v;
}
function showToast(msg,type){
  var t=document.getElementById('toast');t.textContent=msg;
  t.style.borderLeftColor=type==='error'?'#c0392b':type==='warn'?'#e0a83a':'#2e8b57';
  t.classList.add('show');setTimeout(function(){t.classList.remove('show');},3500);
}
/* ── shared helper: build RE entries as clean print HTML ── */
function buildREPrintHtml(){
  var billable=APP.items.filter(msIsReItem);
  if(!billable.length) return '';
  var h='';
  billable.forEach(function(it,idx){
    var isSteelItem=(it.no==='26.33'||it.no==='26.34');
    h+='<div style="margin-bottom:18px;page-break-inside:avoid">';
    h+='<div style="background:#1a2744;color:#fff;padding:6px 10px;font-size:12px;font-weight:700;border-radius:3px 3px 0 0">';
    h+=(idx+1)+'. '+it.no+' — '+(it.dispDesc||it.desc).substring(0,70);
    h+='&nbsp;&nbsp;<span style="font-size:10px;opacity:.7">Est: '+( it.estQty||0).toFixed(3)+' '+it.unit+'</span>';
    h+='</div>';
    h+='<table style="width:100%;border-collapse:collapse;font-size:10px">';
    h+='<thead><tr style="background:#243058;color:#fff">';
    h+='<th style="padding:4px 5px;text-align:center;border:1px solid rgba(255,255,255,.2);width:26px">#</th>';
    h+='<th style="padding:4px 5px;text-align:left;border:1px solid rgba(255,255,255,.2)">Description</th>';
    h+='<th style="padding:4px 5px;text-align:right;border:1px solid rgba(255,255,255,.2);width:36px">No.</th>';
    if(isSteelItem){
      h+='<th style="padding:4px 5px;text-align:right;border:1px solid rgba(255,255,255,.2);width:46px">Bars</th>';
      h+='<th style="padding:4px 5px;text-align:right;border:1px solid rgba(255,255,255,.2);width:40px">Sets</th>';
      h+='<th style="padding:4px 5px;text-align:right;border:1px solid rgba(255,255,255,.2);width:52px">L(m)</th>';
      h+='<th style="padding:4px 5px;text-align:right;border:1px solid rgba(255,255,255,.2);width:50px">Wt</th>';
      h+='<th style="padding:4px 5px;text-align:right;border:1px solid rgba(255,255,255,.2);width:60px">Qty(MT)</th>';
    } else {
      h+='<th style="padding:4px 5px;text-align:right;border:1px solid rgba(255,255,255,.2);width:52px">L</th>';
      h+='<th style="padding:4px 5px;text-align:right;border:1px solid rgba(255,255,255,.2);width:52px">B</th>';
      h+='<th style="padding:4px 5px;text-align:right;border:1px solid rgba(255,255,255,.2);width:52px">H</th>';
      h+='<th style="padding:4px 5px;text-align:right;border:1px solid rgba(255,255,255,.2);width:60px">परिमाण</th>';
    }
    h+='<th style="padding:4px 5px;text-align:right;border:1px solid rgba(255,255,255,.2);width:60px">बेरीज</th>';
    h+='</tr></thead><tbody>';
    (it.reEntries||[]).forEach(function(row,ri){
      var bg=ri%2===0?'#fff':'#f8f7f4';
      var ded=(row.isDeduct&&!row.isPct)?'(-) ':'';
      h+='<tr style="background:'+bg+'">';
      h+='<td style="padding:3px 5px;border:1px solid #ddd;text-align:center;color:#666">'+(ri+1)+'</td>';
      h+='<td style="padding:3px 5px;border:1px solid #ddd">'+(row.desc||'')+'</td>';
      h+='<td style="padding:3px 5px;border:1px solid #ddd;text-align:right;font-family:monospace">'+(row._v2?(row.no==null?'':row.no):(row.no||1))+'</td>';
      if(isSteelItem){
        h+='<td style="padding:3px 5px;border:1px solid #ddd;text-align:right;font-family:monospace">'+(row.bars||'')+'</td>';
        h+='<td style="padding:3px 5px;border:1px solid #ddd;text-align:right;font-family:monospace">'+(row.sets||'')+'</td>';
        h+='<td style="padding:3px 5px;border:1px solid #ddd;text-align:right;font-family:monospace">'+(row.L||'')+'</td>';
        h+='<td style="padding:3px 5px;border:1px solid #ddd;text-align:right;font-family:monospace">'+(row.wt||'')+'</td>';
      } else {
        h+='<td style="padding:3px 5px;border:1px solid #ddd;text-align:right;font-family:monospace">'+(row.L||'')+'</td>';
        h+='<td style="padding:3px 5px;border:1px solid #ddd;text-align:right;font-family:monospace">'+(row.B||'')+'</td>';
        h+='<td style="padding:3px 5px;border:1px solid #ddd;text-align:right;font-family:monospace">'+(row.H||'')+'</td>';
      }
      h+='<td style="padding:3px 5px;border:1px solid #ddd;text-align:right;font-family:monospace;font-weight:600">'+ded+(row.rowQty||0).toFixed(3)+'</td>';
      h+='<td style="padding:3px 5px;border:1px solid #ddd;text-align:right;font-family:monospace;font-weight:700;color:#2e4a8f">'+(row.runTotal||0).toFixed(3)+'</td>';
      h+='</tr>';
    });
    h+='<tr style="background:#e8edf8;font-weight:700">';
    var colspan=isSteelItem?8:6;
    h+='<td colspan="'+colspan+'" style="padding:4px 8px;border:1px solid #ccc;text-align:right">Bill Qty = </td>';
    h+='<td colspan="2" style="padding:4px 8px;border:1px solid #ccc;text-align:right;font-family:monospace;color:#1a2744">'+(it.billQty||0).toFixed(3)+' '+it.unit+'</td>';
    h+='</tr>';
    h+='</tbody></table></div>';
  });
  return h;
}

/* ── shared: build signature block (no stamp circles) ── */
function buildSigBlock(s1n,s1d,s2n,s2d){
  return '<div style="margin-top:50px;display:flex;justify-content:space-between;font-size:12px">'
    +'<div style="text-align:center;width:40%">'
    +'<div style="height:70px"></div>'
    +'<div style="border-top:1.5px solid #000;padding-top:5px;font-weight:700;font-size:13px">'+s1n+'</div>'
    +'<div style="font-size:12px">'+s1d+'</div>'
    +'</div>'
    +'<div style="text-align:center;width:40%">'
    +'<div style="height:70px"></div>'
    +'<div style="border-top:1.5px solid #000;padding-top:5px;font-weight:700;font-size:13px">'+s2n+'</div>'
    +'<div style="font-size:12px">'+s2d+'</div>'
    +'</div>'
    +'</div>';
}

/* ── shared: common print styles ── */
function getPrintStyles(){
  return '*{box-sizing:border-box;margin:0;padding:0}'
    +'body{font-family:"Arial",sans-serif;background:#fff;color:#1c1810;font-size:12px;padding:20px}'
    +'.section{margin-bottom:28px;page-break-after:always}'
    +'.section:last-child{page-break-after:avoid}'
    +'.sec-title{font-size:13px;font-weight:700;color:#fff;background:#1a2744;padding:6px 11px;margin-bottom:9px;border-radius:3px}'
    +'.info-line{font-size:12px;margin-bottom:4px}'
    +'.print-title{text-align:center;font-size:15px;font-weight:700;margin-bottom:3px}'
    +'.print-sub{text-align:center;font-size:10px;color:#555;margin-bottom:9px;border-bottom:2px solid #333;padding-bottom:7px}'
    +'table{width:100%;border-collapse:collapse;font-size:11px;margin-top:7px}'
    +'thead th{background:#1a2744;color:#fff;padding:5px 5px;font-size:10px;text-transform:uppercase;text-align:left}'
    +'thead th.r{text-align:right}'
    +'tbody td{padding:4px 5px;border:1px solid #ccc;vertical-align:top}'
    +'tr.total-row td{background:#e8edf8;font-weight:700}'
    +'.amount-col,.num-cell{text-align:right;font-family:monospace;font-weight:600}'
    +'.summary-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:10px}'
    +'.summary-box{border:1px solid #ccc;border-radius:4px;padding:9px;text-align:center}'
    +'.summary-box.grand{grid-column:1/-1;border-top:3px solid #1a2744}'
    +'.summary-label{font-size:9px;color:#666;text-transform:uppercase;margin-bottom:2px}'
    +'.summary-amount{font-size:15px;font-weight:700;color:#1a2744}'
    +'.summary-box.grand .summary-amount{font-size:19px;color:#2e4a8f}'
    +'@media print{body{padding:6px}.no-print{display:none!important}}';
}

function printAbstractLegacy(){  /* old on-screen style print — replaced by the 2-format chooser at the end of this file */
  renderAbstract();
  if(typeof buildComparativeTable==='function') buildComparativeTable();
  if(typeof renderRoyaltyTab==='function') renderRoyaltyTab();
  if(typeof renderCementConsumption==='function') renderCementConsumption();

  var workName=(document.getElementById('ahWorkName').value||'')+' '+(document.getElementById('ahWorkName2').value||'');
  var contractor=document.getElementById('ahContractor').value||'—';
  var billNo=document.getElementById('billNo').value||'—';
  var billDate=(document.getElementById('billDate')||{}).value||'—';
  var agr=document.getElementById('ahAgreementNo').value||'—';

  var tbl=document.getElementById('abstractTable');
  var sg=document.getElementById('summaryGrid');
  var abstractHtml=(tbl?tbl.outerHTML:'')+(sg&&sg.style.display!=='none'?sg.outerHTML:'');

  var compOut=document.getElementById('comparativeOutput');
  var compHtml=compOut&&compOut.style.display!=='none'?compOut.innerHTML:'';

  var royHtml=(document.getElementById('royaltyTabContent')||{}).innerHTML||'';
  var cemHtml=(document.getElementById('cementConsumptionContent')||{}).innerHTML||'';
  var conHtml=(document.getElementById('consumptionTabContent')||{}).innerHTML||'';

  var s1n=(document.getElementById('sig1Name')||{}).value||'Sectional Engineer';
  var s1d=(document.getElementById('sig1Desig')||{}).value||'P.W. Sub Division Sinnar';
  var s2n=(document.getElementById('sig2Name')||{}).value||'Sub Divisional Engineer';
  var s2d=(document.getElementById('sig2Desig')||{}).value||'P.W. Division Nashik';

  var reHtml=buildREPrintHtml();
  var sigBlock=buildSigBlock(s1n,s1d,s2n,s2d);

  var pw=window.open('','_blank','width=1100,height=850');
  pw.document.write('<!DOCTYPE html><html lang="mr"><head><meta charset="UTF-8">');
  pw.document.write('<title>PWD RA Bill — '+workName+'</title>');
  pw.document.write('<style>'+getPrintStyles()+'</style></head><body>');

  var hdr='<div class="print-title">PWD RA Bill — महाराष्ट्र सार्वजनिक बांधकाम विभाग</div>'
    +'<div class="print-sub">SSR 2022-23 &nbsp;|&nbsp; P.W.D. 9 m. &nbsp;|&nbsp; सा. बां. वि. ९ म.</div>'
    +'<div class="info-line"><strong>Name of Work :</strong> '+workName+'</div>'
    +'<div class="info-line"><strong>Contractor :</strong> '+contractor+'&nbsp;&nbsp;&nbsp;<strong>Bill No :</strong> '+billNo+'&nbsp;&nbsp;&nbsp;<strong>Date :</strong> '+billDate+'&nbsp;&nbsp;&nbsp;<strong>Agreement No :</strong> '+agr+'</div>';

  // SECTION 1: Abstract
  pw.document.write('<div class="section">'+hdr+'<div class="sec-title">📊 Abstract of Bill</div>'+abstractHtml+'</div>');

  // SECTION 2: RE Entries (MB)
  if(reHtml){
    pw.document.write('<div class="section">'+hdr+'<div class="sec-title">📐 RE Entries — Measurement Book</div>'+reHtml+'</div>');
  }

  // SECTION 3: Comparative Statement
  if(compHtml){
    pw.document.write('<div class="section">'+hdr+'<div class="sec-title">📑 Comparative Statement</div>'+compHtml+sigBlock+'</div>');
  }

  // SECTION 4: Royalty
  if(royHtml&&royHtml.indexOf('empty-state')===-1){
    pw.document.write('<div class="section">'+hdr+'<div class="sec-title">💰 Royalty Statement</div>'+royHtml+sigBlock+'</div>');
  }

  // SECTION 5: Consumption
  if(conHtml&&conHtml.indexOf('empty-state')===-1){
    pw.document.write('<div class="section">'+hdr+'<div class="sec-title">📦 Consumption Chart</div>'+conHtml+sigBlock+'</div>');
  }

  // SECTION 6: Cement Consumption
  if(cemHtml&&cemHtml.indexOf('empty-state')===-1){
    pw.document.write('<div class="section">'+hdr+'<div class="sec-title">🏗️ Cement Consumption Statement</div>'+cemHtml+sigBlock+'</div>');
  }

  pw.document.write('<div class="no-print" style="display:block;margin-top:20px;text-align:center">');
  pw.document.write('<button onclick="window.print()" style="padding:10px 28px;background:#1a2744;color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer;margin-right:10px">🖨️ Print</button>');
  pw.document.write('<button onclick="window.close()" style="padding:10px 18px;background:#ccc;color:#333;border:none;border-radius:6px;font-size:14px;cursor:pointer">Close</button>');
  pw.document.write('</div></body></html>');
  pw.document.close();
}

function printComparative(){
  if(typeof buildComparativeTable==='function') buildComparativeTable();

  var workName=(document.getElementById('ahWorkName').value||'')+' '+(document.getElementById('ahWorkName2').value||'');
  var contractor=document.getElementById('ahContractor').value||'—';
  var billNo=document.getElementById('billNo').value||'—';
  var billDate=(document.getElementById('billDate')||{}).value||'—';
  var agr=document.getElementById('ahAgreementNo').value||'—';

  var compOut=document.getElementById('comparativeOutput');
  var compHtml=compOut?compOut.innerHTML:'';

  var s1n=(document.getElementById('sig1Name')||{}).value||'Sectional Engineer';
  var s1d=(document.getElementById('sig1Desig')||{}).value||'P.W. Sub Division Sinnar';
  var s2n=(document.getElementById('sig2Name')||{}).value||'Sub Divisional Engineer';
  var s2d=(document.getElementById('sig2Desig')||{}).value||'P.W. Division Nashik';

  var sigBlock=buildSigBlock(s1n,s1d,s2n,s2d);

  var pw=window.open('','_blank','width=1100,height=850');
  pw.document.write('<!DOCTYPE html><html lang="mr"><head><meta charset="UTF-8">');
  pw.document.write('<title>Comparative Statement — '+workName+'</title>');
  pw.document.write('<style>'+getPrintStyles()+'</style></head><body>');
  pw.document.write('<div style="text-align:center;font-size:16px;font-weight:700;margin-bottom:4px">Comparative statement</div>');
  pw.document.write('<div style="margin-bottom:10px;border-bottom:2px solid #333;padding-bottom:8px;font-size:11px;color:#555;text-align:center">सा. बां. वि. ९ म. | P.W.D. 9 m. | SSR 2022-23</div>');
  pw.document.write('<div class="info-line">Name of works :- '+workName+'</div>');
  pw.document.write('<div class="info-line">Name of Agency :- '+contractor+'</div>');
  pw.document.write('<div class="info-line" style="margin-bottom:10px">Agency :- B-1 No. '+billNo+' &nbsp; Date :- '+billDate+(agr&&agr!=='—'?' &nbsp; Agr: '+agr:'')+'</div>');
  pw.document.write(compHtml);
  pw.document.write(sigBlock);
  pw.document.write('<div class="no-print" style="display:block;margin-top:24px;text-align:center">');
  pw.document.write('<button onclick="window.print()" style="padding:10px 28px;background:#1a2744;color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer;margin-right:10px">🖨️ Print</button>');
  pw.document.write('<button onclick="window.close()" style="padding:10px 18px;background:#ccc;color:#333;border:none;border-radius:6px;font-size:14px;cursor:pointer">Close</button>');
  pw.document.write('</div></body></html>');
  pw.document.close();
}

/* ═══════════════════════════════════════════════════════════
   FORM 47 — Running Account Bill — COMPLETE REWRITE
   Exact image format on screen | inline editable | auto-calculate
   ═══════════════════════════════════════════════════════════ */

function getF47Grand(){
  var a=0,sandTotal=0,murumTotal=0,sandAmt=0,murumAmt=0,c=0;
  var F47ITEMS=APP.items.filter(function(x){return !x.hasSplits;});   /* split parent is not billed — only its parts */
  F47ITEMS.forEach(function(it){a+=(it.billQty||0)*it.rate;});
  var rt=getRoyRates();   /* royalty: same rules as ATP estimator (see calcCFRoyalty) */
  F47ITEMS.forEach(function(it){
    var r=royaltyOfItem(it,it.billQty||0,rt.sand,rt.coarse); if(!r)return;
    sandTotal+=r.nS; murumTotal+=r.nC; sandAmt+=r.rS; murumAmt+=r.rC;
  });
  var b=sandAmt+murumAmt;
  APP.tests.forEach(function(t){c+=t.qty*t.rate;});
  return {a:Math.round(a*100)/100, b:Math.round(b*100)/100, c:Math.round(c*100)/100,
          grand:Math.round((a+b+c)*100)/100,
          sandTotal:sandTotal, murumTotal:murumTotal,
          sandAmt:sandAmt, murumAmt:murumAmt};
}

function calcForm47(){
  var wn1=document.getElementById('ahWorkName'),wn2=document.getElementById('ahWorkName2');
  var ct=document.getElementById('ahContractor'),ag=document.getElementById('ahAgreementNo');
  if(wn1&&wn1.value&&!document.getElementById('f47WorkName1').value) document.getElementById('f47WorkName1').value=wn1.value;
  if(wn2&&wn2.value&&!document.getElementById('f47WorkName2').value) document.getElementById('f47WorkName2').value=wn2.value;
  if(ct&&ct.value&&!document.getElementById('f47Contractor').value) document.getElementById('f47Contractor').value=ct.value;
  if(ag&&ag.value&&!document.getElementById('f47AgrNo').value) document.getElementById('f47AgrNo').value=ag.value;
  renderF47Part1();
  calcForm47Mem();
  showToast('✅ Form 47 auto-filled!','success');
}

function renderF47Part1(){
  var totals=getF47Grand();
  var items=APP.items.filter(function(x){return !x.hasSplits&&(x.billQty||0)>0;});
  var tbody=document.getElementById('f47P1Tbody'); if(!tbody)return;
  var h='';
  items.forEach(function(it){
    var amt=(it.billQty||0)*it.rate;
    h+='<tr>';
    h+='<td style="border:1px solid var(--border2);padding:2px"><input type="number" placeholder="0" step="0.01" style="width:100%;border:none;background:transparent;font-family:monospace;font-size:10px;text-align:right"></td>';
    h+='<td style="border:1px solid var(--border2);padding:2px"><input type="number" placeholder="0" step="0.01" style="width:100%;border:none;background:transparent;font-family:monospace;font-size:10px;text-align:right"></td>';
    h+='<td style="border:1px solid var(--border2);padding:3px;text-align:right;font-family:monospace;font-size:10px">'+(it.billQty||0).toFixed(3)+'</td>';
    h+='<td style="border:1px solid var(--border2);padding:3px;text-align:right;font-family:monospace;font-size:10px">'+(it.billQty||0).toFixed(3)+'</td>';
    h+='<td style="border:1px solid var(--border2);padding:3px;text-align:right;font-family:monospace;font-size:10px">'+(it.billQty||0).toFixed(3)+'</td>';
    h+='<td style="border:1px solid var(--border2);padding:3px;font-size:10px"><b style="color:var(--blue);font-family:monospace;font-size:9px">'+escHtml(it.no)+'</b> '+escHtml(it.dispDesc||it.desc)+'</td>';
    h+='<td style="border:1px solid var(--border2);padding:3px;text-align:right;font-family:monospace;font-size:10px">'+fmt(it.rate)+'</td>';
    h+='<td style="border:1px solid var(--border2);padding:3px;text-align:center;font-size:10px">'+escHtml(it.unit)+'</td>';
    h+='<td style="border:1px solid var(--border2);padding:3px;text-align:right;font-family:monospace;font-size:10px;font-weight:700">'+fmt(amt)+'</td>';
    h+='<td style="border:1px solid var(--border2);padding:3px;text-align:right;font-family:monospace;font-size:10px">'+fmt(amt)+'</td>';
    h+='<td style="border:1px solid var(--border2);padding:2px"><input type="text" placeholder="Remark" style="width:100%;border:none;background:transparent;font-size:10px"></td>';
    h+='</tr>';
  });
  // Royalty
  if(totals.murumAmt>0){h+='<tr style="background:#fffde7"><td colspan="2" style="border:1px solid var(--border2)"></td><td style="border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px;padding:3px">'+totals.murumTotal.toFixed(3)+'</td><td style="border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px;padding:3px">'+totals.murumTotal.toFixed(3)+'</td><td style="border:1px solid var(--border2);padding:3px"></td><td style="border:1px solid var(--border2);padding:3px;font-size:10px">Royalty charges — For metal</td><td style="border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px;padding:3px">'+ROYALTY_RATE_MURUM+'</td><td style="border:1px solid var(--border2);text-align:center;font-size:10px;padding:3px">Cum</td><td style="border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px;font-weight:700;padding:3px">'+fmt(totals.murumAmt)+'</td><td style="border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px;padding:3px">'+fmt(totals.murumAmt)+'</td><td style="border:1px solid var(--border2)"></td></tr>';}
  if(totals.sandAmt>0){h+='<tr style="background:#fffde7"><td colspan="2" style="border:1px solid var(--border2)"></td><td style="border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px;padding:3px">'+totals.sandTotal.toFixed(3)+'</td><td style="border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px;padding:3px">'+totals.sandTotal.toFixed(3)+'</td><td style="border:1px solid var(--border2);padding:3px"></td><td style="border:1px solid var(--border2);padding:3px;font-size:10px">Royalty charges — For sand</td><td style="border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px;padding:3px">'+ROYALTY_RATE_SAND+'</td><td style="border:1px solid var(--border2);text-align:center;font-size:10px;padding:3px">Cum</td><td style="border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px;font-weight:700;padding:3px">'+fmt(totals.sandAmt)+'</td><td style="border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px;padding:3px">'+fmt(totals.sandAmt)+'</td><td style="border:1px solid var(--border2)"></td></tr>';}
  // Testing charges
  var testTotal=0;
  APP.tests.forEach(function(t){
    if(!t.qty)return; var ta=t.qty*t.rate; testTotal+=ta;
    h+='<tr style="background:#f0f8ff"><td colspan="2" style="border:1px solid var(--border2)"></td><td style="border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px;padding:3px">'+t.qty+'</td><td colspan="2" style="border:1px solid var(--border2)"></td><td style="border:1px solid var(--border2);padding:3px;font-size:10px">Testing charges — Compresive strength</td><td style="border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px;padding:3px">'+t.rate+'</td><td style="border:1px solid var(--border2);text-align:center;font-size:10px;padding:3px">Test</td><td style="border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px;font-weight:700;padding:3px">'+fmt(ta)+'</td><td style="border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px;padding:3px">'+fmt(ta)+'</td><td style="border:1px solid var(--border2)"></td></tr>';
  });
  // Sub-totals A and B
  h+='<tr style="background:#e8edf8;font-weight:700"><td colspan="7" style="border:1px solid #ccc;text-align:right;padding:3px 6px;font-size:10px">A</td><td style="border:1px solid #ccc"></td><td style="border:1px solid #ccc;text-align:right;font-family:monospace;padding:3px">'+fmt(totals.a+totals.b)+'</td><td colspan="2" style="border:1px solid #ccc"></td></tr>';
  // Royalty sub-total B
  h+='<tr style="background:#fffae8;font-weight:700"><td colspan="7" style="border:1px solid #ccc;text-align:right;padding:3px 6px;font-size:10px">B</td><td style="border:1px solid #ccc"></td><td style="border:1px solid #ccc;text-align:right;font-family:monospace;padding:3px">'+fmt(totals.murumAmt+totals.sandAmt)+'</td><td colspan="2" style="border:1px solid #ccc"></td></tr>';
  // Grand total row
  h+='<tr style="background:var(--navy);color:#fff;font-weight:700"><td colspan="8" style="border:1px solid rgba(255,255,255,.2);text-align:right;padding:5px 8px;font-size:11px">Total value of work done to date (A)</td>';
  h+='<td style="border:1px solid rgba(255,255,255,.2);text-align:right;font-family:monospace;padding:5px" id="f47P1TotalA">'+fmt(totals.grand)+'</td><td colspan="2" style="border:1px solid rgba(255,255,255,.2)"></td></tr>';
  h+='<tr style="background:#fce8e8"><td colspan="8" style="border:1px solid #ccc;text-align:right;padding:3px 8px;font-size:10px">Deduct value of work shown in previous bill</td><td style="border:1px solid #ccc;text-align:right;font-family:monospace;padding:3px" id="f47P1PrevDeduct">—</td><td colspan="2" style="border:1px solid #ccc"></td></tr>';
  h+='<tr style="background:#dff0d8;font-weight:700"><td colspan="8" style="border:1px solid #ccc;text-align:right;padding:3px 8px;font-size:10px">Net value of work science previous bill of figu.</td><td style="border:1px solid #ccc;text-align:right;font-family:monospace;padding:3px" id="f47P1Net">—</td><td colspan="2" style="border:1px solid #ccc"></td></tr>';
  tbody.innerHTML=h;
  updateF47P1Totals();
}

function updateF47P1Totals(){
  var totals=getF47Grand();
  var prevPaid=parseFloat((document.getElementById('f47PrevPaid')||{}).value)||0;
  var net=totals.grand-prevPaid;
  var el1=document.getElementById('f47P1PrevDeduct'),el2=document.getElementById('f47P1Net');
  if(el1)el1.textContent=fmt(prevPaid);
  if(el2)el2.textContent=fmt(net<0?0:net);
}

function toggleF47Part2(){
  var isNil=document.getElementById('f47Part2Nil').checked;
  var nilRow=document.getElementById('f47P2NilRow');
  var tbody=document.getElementById('f47P2Tbody');
  if(isNil){
    if(nilRow)nilRow.style.display='';
    if(tbody) Array.from(tbody.querySelectorAll('tr:not(#f47P2NilRow)')).forEach(function(r){r.remove();});
  } else {
    if(nilRow)nilRow.style.display='none';
    addF47P2Row();
  }
}

function addF47P2Row(){
  var tbody=document.getElementById('f47P2Tbody'); if(!tbody)return;
  var r=document.createElement('tr');
  var inp='style="width:100%;border:none;background:transparent;font-family:monospace;font-size:10px;text-align:right"';
  var inpT='style="width:100%;border:none;background:transparent;font-size:10px"';
  r.innerHTML=
    '<td style="border:1px solid var(--border2);padding:2px"><input type="number" '+inp+' placeholder="0"></td>'+
    '<td style="border:1px solid var(--border2);padding:2px"><input type="number" '+inp+' placeholder="0"></td>'+
    '<td style="border:1px solid var(--border2);padding:2px"><input type="number" '+inp+' placeholder="0"></td>'+
    '<td style="border:1px solid var(--border2);padding:2px"><input type="number" '+inp+' placeholder="0"></td>'+
    '<td style="border:1px solid var(--border2);padding:2px"><input type="text" '+inpT+' placeholder="Material Description" style="text-align:left"></td>'+
    '<td style="border:1px solid var(--border2);padding:2px"><input type="text" '+inpT+' placeholder="Unit"></td>'+
    '<td style="border:1px solid var(--border2);padding:2px"><input type="number" '+inp+' placeholder="0"></td>'+
    '<td style="border:1px solid var(--border2);padding:2px"><input type="number" '+inp+' placeholder="0"></td>'+
    '<td style="border:1px solid var(--border2);padding:2px"><input type="text" '+inpT+' placeholder="No."></td>'+
    '<td style="border:1px solid var(--border2);padding:2px"><input type="date" style="width:100%;border:none;background:transparent;font-size:10px"></td>'+
    '<td style="border:1px solid var(--border2);padding:2px"><input type="text" '+inpT+' placeholder="Reason"></td>';
  tbody.appendChild(r);
}

function calcForm47Mem(){
  var totals=getF47Grand();
  var _ad=msAddonsCalc(),_g=document.getElementById('f47GstAmt');
  if(_g){if(_g.value==='')delete _g.dataset.user; if(!_g.dataset.user&&document.activeElement!==_g)_g.value=_ad.gst;}   /* GST follows the Abstract add-ons until the user types his own figure */
  var _ae=document.getElementById('f47AddonsAmt');if(_ae)_ae.textContent=fmt(_ad.other);
  var grandA=totals.grand;
  var prevPaid=parseFloat((document.getElementById('f47PrevPaid')||{}).value)||0;
  var gstAmt=parseFloat((document.getElementById('f47GstAmt')||{}).value)||0;
  var partBAmt=parseFloat((document.getElementById('f47PartBAmt')||{}).value)||0;
  var withheld=parseFloat((document.getElementById('f47Withheld')||{}).value)||0;
  var recovOther=parseFloat((document.getElementById('f47RecoveryOther')||{}).value)||0;
  var byChq=grandA+gstAmt+partBAmt+_ad.other-prevPaid-withheld-recovOther;
  if(byChq<0)byChq=0;
  var netSincePrev=grandA-prevPaid; if(netSincePrev<0)netSincePrev=0;
  function s(id,v){var e=document.getElementById(id);if(e)e.textContent=fmt(v);}
  s('f47Mem1',grandA);s('f47Mem3',0);s('f47Mem4',grandA);
  s('f47MemKA',prevPaid);s('f47MemKB',netSincePrev);s('f47Mem7',prevPaid);
  s('f47MemByChq',byChq);s('f47MemH',byChq+recovOther);
  s('f47PayAmt',byChq);s('f47PayAmt2',byChq);
  updateF47P1Totals();
  // Work Abstract
  var wb=document.getElementById('f47WorkAbsTbody');
  if(wb){
    var h='';
    APP.items.filter(function(x){return !x.hasSplits&&(x.billQty||0)>0;}).forEach(function(it){
      var amt=(it.billQty||0)*it.rate,rs=Math.floor(amt),ps=Math.round((amt-rs)*100);
      h+='<tr><td style="padding:2px 4px;border:1px solid var(--border2);font-size:10px">'+escHtml(it.no)+'</td><td style="padding:2px 4px;border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px">'+rs.toLocaleString('en-IN')+'</td><td style="padding:2px 4px;border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px">'+String(ps).padStart(2,'0')+'</td></tr>';
    });
    if(totals.murumAmt>0){var r=Math.floor(totals.murumAmt),p=Math.round((totals.murumAmt-r)*100);h+='<tr style="background:#fffde7"><td style="padding:2px 4px;border:1px solid var(--border2);font-size:10px">Royalty Metal</td><td style="padding:2px 4px;border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px">'+r.toLocaleString('en-IN')+'</td><td style="padding:2px 4px;border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px">'+String(p).padStart(2,'0')+'</td></tr>';}
    if(totals.sandAmt>0){var r2=Math.floor(totals.sandAmt),p2=Math.round((totals.sandAmt-r2)*100);h+='<tr style="background:#fffde7"><td style="padding:2px 4px;border:1px solid var(--border2);font-size:10px">Royalty Sand</td><td style="padding:2px 4px;border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px">'+r2.toLocaleString('en-IN')+'</td><td style="padding:2px 4px;border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px">'+String(p2).padStart(2,'0')+'</td></tr>';}
    APP.tests.forEach(function(t){if(!t.qty)return;var ta=t.qty*t.rate,tr2=Math.floor(ta),tp=Math.round((ta-tr2)*100);h+='<tr style="background:#f0f8ff"><td style="padding:2px 4px;border:1px solid var(--border2);font-size:10px">Test</td><td style="padding:2px 4px;border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px">'+tr2.toLocaleString('en-IN')+'</td><td style="padding:2px 4px;border:1px solid var(--border2);text-align:right;font-family:monospace;font-size:10px">'+String(tp).padStart(2,'0')+'</td></tr>';});
    var gr=Math.floor(grandA),gp=Math.round((grandA-gr)*100);
    h+='<tr style="background:var(--navy);color:#fff;font-weight:700"><td style="padding:2px 4px;border:1px solid rgba(255,255,255,.2);font-size:10px">Total</td><td style="padding:2px 4px;border:1px solid rgba(255,255,255,.2);text-align:right;font-family:monospace;font-size:10px">'+gr.toLocaleString('en-IN')+'</td><td style="padding:2px 4px;border:1px solid rgba(255,255,255,.2);text-align:right;font-family:monospace;font-size:10px">'+String(gp).padStart(2,'0')+'</td></tr>';
    wb.innerHTML=h;
  }
}

function printForm47(){
  calcForm47();
  var totals=getF47Grand();
  var prevPaid=parseFloat((document.getElementById('f47PrevPaid')||{}).value)||0;
  var gstAmt=parseFloat((document.getElementById('f47GstAmt')||{}).value)||0;
  var partBAmt=parseFloat((document.getElementById('f47PartBAmt')||{}).value)||0;
  var withheld=parseFloat((document.getElementById('f47Withheld')||{}).value)||0;
  var recovOther=parseFloat((document.getElementById('f47RecoveryOther')||{}).value)||0;
  var ad47=msAddonsCalc();
  var byChq=totals.grand+gstAmt+partBAmt+ad47.other-prevPaid-withheld-recovOther;
  if(byChq<0)byChq=0;
  var netSincePrev=totals.grand-prevPaid; if(netSincePrev<0)netSincePrev=0;

  function g(id){return(document.getElementById(id)||{}).value||'';}
  function fmtDate(d){if(!d)return'—';var p=d.split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:d;}

  var division=g('f47Division')||'Nashik', subDiv=g('f47SubDiv')||'Sinnar';
  var pwNo=g('f47PwNo'), contractor=g('f47Contractor')||'—';
  var workName=(g('f47WorkName1')+(g('f47WorkName2')?' '+g('f47WorkName2'):'')).trim()||'—';
  var billSerial=g('f47BillSerial'), prevBillRef=g('f47PrevBillRef');
  var agrNo=g('f47AgrNo'), agrDate=g('f47AgrDate'), acceptedBy=g('f47AcceptedBy');
  var workStart=g('f47WorkStartDate'), stipulated=g('f47Stipulated');
  var extension=g('f47Extension'), actualCompl=g('f47ActualCompletion'), ledger=g('f47LedgerFolio');
  var cashVoucher=g('f47CashVoucher'), mbBarcode=g('f47MBBarcode'), mbPage=g('f47MBPage');
  var jeName=g('f47JEName')||'S. B. Kamble, Jr. Engineer';
  var prevBillNo=g('f47PrevBillNo')||'I';
  var sde=g('f47SDE')||'Sub-Divisional Engineer', sdeDesig=g('f47SDEDesig')||'P W Sub-Division Sinnar';
  var eeDiv=g('f47EEDiv')||'NASHIK', remarks=g('f47Remarks');
  var isNil=(document.getElementById('f47Part2Nil')||{}).checked!==false;

  var pw=window.open('','_blank','width=1200,height=950');
  pw.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Form 47 — '+escHtml(workName)+'</title>');
  pw.document.write('<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Arial",sans-serif;color:#000;font-size:11px;padding:16px}table{width:100%;border-collapse:collapse;font-size:10px}td,th{padding:4px 5px;border:1px solid #888}thead th{background:#1a2744;color:#fff;font-size:9px;text-align:center}.sec-title{font-size:12px;font-weight:700;background:#1a2744;color:#fff;padding:5px 10px;margin:14px 0 5px;text-align:center}.page-break{page-break-before:always}@media print{.no-print{display:none!important}}</style></head><body>');

  // COVER
  pw.document.write('<div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px"><span>Division: <b>'+escHtml(division)+'</b> &nbsp; Sub Division: <b>'+escHtml(subDiv)+'</b></span><span>Outer P.W. <b>'+escHtml(pwNo)+'</b></span></div>');
  pw.document.write('<div style="border:2px solid #000;text-align:center;padding:2px;font-size:10px;font-weight:700;margin-bottom:2px">FORM 47</div>');
  pw.document.write('<div style="text-align:center;font-size:20px;font-weight:700">Running Account Bill</div>');
  pw.document.write('<div style="text-align:center;font-size:10px">(Refer to in Paragraph 10-2-10 of M.P.W.A.Code)</div>');
  pw.document.write('<div style="text-align:center;font-size:11px;font-weight:700;margin-bottom:4px">CASH BOOK VOUCHER NO. '+escHtml(cashVoucher)+'</div>');
  pw.document.write('<div style="border-top:3px double #000;border-bottom:1px solid #000;height:3px;margin-bottom:8px"></div>');
  pw.document.write('<table style="border:none;font-size:11px;margin-bottom:8px"><tbody>');
  pw.document.write('<tr><td style="border:none;width:240px">Name of Contractor or Supplier :</td><td style="border:none;font-weight:700">'+escHtml(contractor)+'</td></tr>');
  pw.document.write('<tr><td style="border:none;vertical-align:top">Name Of Work :-</td><td style="border:none;font-weight:700">'+escHtml(workName)+'</td></tr>');
  pw.document.write('<tr><td style="border:none">Serial No.of this bill :-</td><td style="border:none;font-weight:700">'+escHtml(billSerial)+'</td></tr>');
  pw.document.write('<tr><td style="border:none">No.& date of previous bills for this work :-</td><td style="border:none">'+escHtml(prevBillRef)+'</td></tr>');
  pw.document.write('<tr><td style="border:none">Referance to Agreement :-</td><td style="border:none;font-weight:700">'+escHtml(agrNo)+'&nbsp;&nbsp;/ Date '+fmtDate(agrDate)+'</td></tr>');
  pw.document.write('<tr><td style="border:none">Accepted by :-</td><td style="border:none;font-weight:700">'+escHtml(acceptedBy)+'</td></tr>');
  pw.document.write('<tr><td style="border:none">Date of Written order to commance work :-</td><td style="border:none;font-weight:700">'+fmtDate(workStart)+'</td></tr>');
  pw.document.write('<tr><td style="border:none;vertical-align:top">Date of completion stipulated in the contract :-</td><td style="border:none;font-weight:700">'+escHtml(stipulated)+(extension?'<br><span style="font-weight:400;font-size:10px">Extension granted up to :- '+escHtml(extension)+'</span>':'')+(actualCompl?'<br><span style="font-weight:400;font-size:10px">Date of actual completion of work: '+fmtDate(actualCompl)+'</span>':'')+'</td></tr>');
  pw.document.write('<tr><td style="border:none">Contract Ledger Folio No.</td><td style="border:none">'+escHtml(ledger)+'</td></tr>');
  pw.document.write('</tbody></table>');
  pw.document.write('<div style="font-size:9px;color:#555;border-top:1px solid #ccc;padding-top:4px;margin-bottom:4px">(For use in Accountant General\'s Office)</div>');
  pw.document.write('<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:6px"><span>Cleark</span><span>Accountant</span></div>');
  pw.document.write('<div style="text-align:center;font-size:9px;color:#555;margin-bottom:4px">(For Use in Divisional Office)</div>');
  pw.document.write('<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px"><span>Checked</span><span>Audited</span><span>Reviewed</span></div>');
  pw.document.write('<div style="text-align:right;font-size:11px;margin-bottom:5px">Superitendents</div>');
  pw.document.write('<div style="display:flex;justify-content:space-between;font-size:11px"><span>Account Cleark</span><span>Account Auditor</span><span>Divisional Accountant</span></div>');

  // PART I
  pw.document.write('<div class="page-break"></div>');
  pw.document.write('<div class="sec-title">PART 1 - ACCOUNT OF WORK EXECUTED</div>');
  var p1tbody=document.getElementById('f47P1Tbody');
  pw.document.write('<div style="overflow-x:auto"><table style="min-width:900px;font-size:9px"><thead>');
  pw.document.write('<tr><th rowspan="2" style="width:55px;font-size:8px">Advance payment for work Done note yet measured<br>Total as per previous bill</th><th rowspan="2" style="width:45px;font-size:8px">since previous bill</th><th colspan="3">Quantity executed</th><th rowspan="2" style="min-width:160px">Items of work<br><span style="font-size:7px;opacity:.8">(Gruped under sub work of estimate)</span></th><th rowspan="2" style="width:55px">Rate</th><th rowspan="2" style="width:35px">Unit</th><th colspan="2">payment on basis of actual measurement</th><th rowspan="2" style="width:75px;font-size:8px">remark with reason for delay in adjusting payments showing column -1</th></tr>');
  pw.document.write('<tr><th style="width:45px">Total upto date</th><th style="width:45px">upto date</th><th style="width:45px">as per measurement book</th><th style="width:60px">Upto date</th><th style="width:60px">since previous bill</th></tr>');
  pw.document.write('</thead><tbody>');
  if(p1tbody) pw.document.write(p1tbody.innerHTML.replace(/<input[^>]*type="[^"]*"[^>]*value="([^"]*)"[^>]*>/g,'$1').replace(/<input([^>]*)>/g,function(m,a){var v=a.match(/value="([^"]*)"/);return v?v[1]:'';}).replace(/<[^>]+>/g,function(m){return m.indexOf('</td>')>=0||m.indexOf('<td')>=0||m.indexOf('</tr')>=0||m.indexOf('<tr')>=0?m:'';}));
  pw.document.write('</tbody></table></div>');

  // PART II
  pw.document.write('<div class="page-break"></div>');
  pw.document.write('<div class="sec-title">PART II ACCOUNT OF SECURED ADVANCES ALLOWED ON THE SECURITY MATERIALS BROUGHT TO THE SITE</div>');
  pw.document.write('<table style="min-width:1000px;font-size:9px"><thead><tr>');
  pw.document.write('<th style="width:58px;font-size:8px">Quantity Outstanding from pervious bill</th>');
  pw.document.write('<th style="width:58px;font-size:8px">Deduct Quantity Utilized in work measured Scince Previous Bill</th>');
  pw.document.write('<th style="width:65px;font-size:8px">Quantity Outstanding including Quantity brought to site scince Previous Bill</th>');
  pw.document.write('<th style="width:58px;font-size:8px">Full rate assessed by the divisional officer</th>');
  pw.document.write('<th style="min-width:140px">Description Of Materials</th>');
  pw.document.write('<th style="width:35px">Unit</th>');
  pw.document.write('<th style="width:55px;font-size:8px">Reduced rate at which advance is made</th>');
  pw.document.write('<th style="width:58px;font-size:8px">Upto date Amount of Advance</th>');
  pw.document.write('<th style="width:42px">No.</th>');
  pw.document.write('<th style="width:58px">Date</th>');
  pw.document.write('<th style="width:72px;font-size:8px">Reason for no clearance of advance when outstanding for more than three months</th>');
  pw.document.write('</tr></thead><tbody>');
  pw.document.write(isNil?'<tr><td colspan="11" style="text-align:center;padding:22px;font-size:16px;font-weight:700;color:#888">NIL</td></tr>':'<tr><td colspan="11" style="padding:8px;font-size:10px">Refer to screen entries</td></tr>');
  pw.document.write('</tbody></table>');
  pw.document.write('<table style="margin-top:0;font-size:11px"><tbody>');
  pw.document.write('<tr><td style="width:55%">Total Amount Outstanding as per the bill (G)</td><td></td><td>Figure (E) in words: _______________</td></tr>');
  pw.document.write('<tr><td>Deduct amount outstanding as per entry (G) of Previous Bill</td><td colspan="2"></td></tr>');
  pw.document.write('<tr style="font-weight:700"><td>Net Amount Scince Previous Bill (E)</td><td colspan="2"></td></tr>');
  pw.document.write('</tbody></table>');
  pw.document.write('<div style="margin-top:8px;font-size:9px;line-height:1.7">1). Entries in Column (4) to (9) of part are based on measurements recorded by Shri <b>'+escHtml(jeName)+'</b> on in Measurement Book No.Barcode <b>'+escHtml(mbBarcode)+'</b> Page No. <b>'+escHtml(mbPage)+'</b> And Checked 100 % by the Sub Divisional Officer on ______<br>2). Certified (i) that in and quite from the quantities of work actually executed as shown in column(4) of part I some work has been actually done in consecution with several items and the value of such work after these deduction from the proportionate amount of secured advance if any ultimately recoverable on agocurt quantities of materials used (in) is no case less than the advance payments as column (3) of part made or proposed to be made for the convenience of the contractor in anticipation of an subject to the results of detailed measurements which will be made as soon as possible. 3). Certified(i) that those quantities of materials shown in column(3) of part II above have been actually brought by the contractor to the site of the and work and contractor has not previously received any advances on security(ii) that these materials are of an impershable natnret and are allrequired by the contractor for use in the connection with items for which rates for finished work have been agreed upon and(iii) that a formal agreement in form 50 signed by the contractor in accordance with paragraph 20,219 M.P.W.A. code is recorded the divisional office</div>');
  pw.document.write('<div style="margin-top:20px;display:flex;justify-content:space-between;font-size:11px"><div>Dated _____ &nbsp; Signature of the Contractor: _______________</div><div style="text-align:center"><div style="height:40px"></div><div style="border-top:1.5px solid #000;padding-top:3px;font-weight:700">'+escHtml(sde)+'</div><div style="font-size:10px">'+escHtml(sdeDesig)+'</div></div><div>Signature of Officer Authorizing Payment: _______________</div></div>');
  pw.document.write('<div style="font-size:9px;color:#555;margin-top:4px;font-style:italic">This signature is necessary only when the officer preparing the bill not the officer authorizing payment</div>');

  // PART IV
  pw.document.write('<div class="page-break"></div>');
  pw.document.write('<div class="sec-title">PART-IV MEMORANDUM OF PAYMENTS</div>');
  pw.document.write('<table style="font-size:11px"><tbody>');
  pw.document.write('<tr><td style="width:65%">1)Total value work actully measurement as per part I column (8) Entry(A)</td><td style="text-align:right;font-family:monospace">Rs.</td><td style="text-align:right;font-family:monospace;font-weight:700">'+fmt(totals.grand)+'</td></tr>');
  pw.document.write('<tr><td>2)Total upto date advance payment for work not yet measurement as par part I</td><td style="text-align:right;font-family:monospace">Rs.</td><td style="text-align:right;font-family:monospace">0.00</td></tr>');
  pw.document.write('<tr><td>3)Total upto date secured advance on security of materials as per part II column(8) Entry (E)</td><td style="text-align:right;font-family:monospace">Rs.</td><td style="text-align:right;font-family:monospace">0.00</td></tr>');
  pw.document.write('<tr style="font-weight:700;background:#e8edf8"><td>4)Total (Items 1+2+3)</td><td style="text-align:right;font-family:monospace">Rs.</td><td style="text-align:right;font-family:monospace">'+fmt(totals.grand)+'</td></tr>');
  pw.document.write('<tr><td>5)Dated amount withhold</td><td style="text-align:right;font-family:monospace">Rs.</td><td style="text-align:right;font-family:monospace">'+fmt(withheld)+'</td></tr>');
  pw.document.write('<tr style="background:#f0f8ff"><td colspan="3" style="font-weight:700">6) Balance upto date payments Item 1,2(K)</td></tr>');
  pw.document.write('<tr><td>&nbsp;&nbsp;A) From Previous bill as per last running Bill</td><td style="text-align:right;font-family:monospace">Rs.</td><td style="text-align:right;font-family:monospace">'+fmt(prevPaid)+'</td></tr>');
  pw.document.write('<tr><td>&nbsp;&nbsp;B) from this bill</td><td style="text-align:right;font-family:monospace">Rs.</td><td style="text-align:right;font-family:monospace">'+fmt(netSincePrev)+'</td></tr>');
  pw.document.write('<tr style="font-weight:700;background:#e8edf8"><td>7) Total amount of payment already made as per entry (K) of last Running Account Bill No. <b>'+escHtml(prevBillNo)+'</b> forwardes with account for Payments now to made,as Detailed below</td><td style="text-align:right;font-family:monospace">Rs.</td><td style="text-align:right;font-family:monospace">'+fmt(prevPaid)+'</td></tr>');
  pw.document.write('<tr><td>&nbsp;&nbsp;a)By recovery for amounts creditable to(a) this bill</td><td colspan="2"></td></tr>');
  pw.document.write('<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;Add GST '+fmt(gstAmt)+'</td><td style="text-align:right;font-family:monospace">Rs.</td><td style="text-align:right;font-family:monospace">'+fmt(gstAmt)+'</td></tr>');
  ad47.rows.forEach(function(r){if(r.k==='gst'||!r.eff)return;pw.document.write('<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;Add '+escHtml(r.lbl)+'</td><td style="text-align:right;font-family:monospace">Rs.</td><td style="text-align:right;font-family:monospace">'+fmt(r.amt)+'</td></tr>');});
  pw.document.write('<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;Add Part (B) '+fmt(partBAmt)+'</td><td style="text-align:right;font-family:monospace">Rs.</td><td style="text-align:right;font-family:monospace">'+fmt(partBAmt)+'</td></tr>');
  pw.document.write('<tr><td>&nbsp;&nbsp;b)By recovery of amounts creditable (a) to the other work or head of account Deposit</td><td style="text-align:right;font-family:monospace">Rs.</td><td style="text-align:right;font-family:monospace">'+fmt(recovOther)+'</td></tr>');
  pw.document.write('<tr><td>&nbsp;&nbsp;c) By Cheque</td><td style="text-align:right;font-family:monospace">Rs.</td><td style="text-align:right;font-family:monospace;font-weight:700">'+fmt(byChq)+'</td></tr>');
  pw.document.write('<tr style="background:#1a2744;color:#fff;font-weight:700"><td>Total+(b)+(b) (H)</td><td style="text-align:right;font-family:monospace">Rs.</td><td style="text-align:right;font-family:monospace">'+fmt(byChq+recovOther)+'</td></tr>');
  pw.document.write('</tbody></table>');
  pw.document.write('<div style="margin-top:10px;border:2px solid #2e8b57;padding:10px;border-radius:4px">');
  pw.document.write('<div style="font-size:13px;font-weight:700">Pay Rs '+fmt(byChq)+'&nbsp;&nbsp;&nbsp; By cheque</div>');
  pw.document.write('<div style="margin-top:4px;font-size:10px">Here speerty the het amount payable,vide item 5 (c)</div>');
  pw.document.write('<div style="margin-top:4px;font-size:10px">Received Rs (     ) '+fmt(byChq)+' Dated initials of Disbursing Officer as per above Rs. '+fmt(byChq)+'</div>');
  pw.document.write('<div style="margin-top:12px;text-align:right"><div style="display:inline-block;text-align:center"><div style="height:45px"></div><div style="border-top:1.5px solid #000;padding-top:3px;font-weight:700">Executive Engineer</div><div>Public Works Division</div><div>'+escHtml(eeDiv)+'</div></div></div>');
  pw.document.write('</div>');
  pw.document.write('<div style="display:flex;justify-content:space-between;margin-top:10px;font-size:11px"><span>Witness</span><span>Full Signature of Contractor</span></div>');
  pw.document.write('<div style="margin-top:5px;font-size:11px">Pay by me, Vide Cheque No. _______ Dated _______</div>');
  pw.document.write('<div style="margin-top:6px;font-size:10px;font-style:italic">Initials Of Person actually making the Payment</div>');
  pw.document.write('<div style="border-top:2px solid #ccc;margin-top:8px;padding-top:6px"><div style="font-weight:700;margin-bottom:3px">PART - REMARKS</div>');
  pw.document.write('<div style="font-size:9px;color:#555">The space reserved for any remarks the Disbursing Officer or the Executive Engineer may record in respect of the executed of to work.Check measurements or the state accounts.</div>');
  if(remarks)pw.document.write('<div style="margin-top:5px;font-size:11px">'+escHtml(remarks)+'</div>');
  pw.document.write('</div>');
  pw.document.write('<div class="no-print" style="display:block;margin-top:20px;text-align:center"><button onclick="window.print()" style="padding:10px 28px;background:#1a2744;color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer;margin-right:10px">🖨️ Print</button><button onclick="window.close()" style="padding:10px 18px;background:#ccc;color:#333;border:none;border-radius:6px;font-size:14px;cursor:pointer">Close</button></div>');
  pw.document.write('</body></html>');
  pw.document.close();
}

// ═══ COMPLETION CERTIFICATE — TOTAL COST AUTO (Grand Total A+B+C) ═══
// Auto-fills cc65TotalCost from Grand Total. If user edits it manually, it is left alone
// until user clicks "↻ Auto" (or clears the box).
var _cc65TotalManual=false;
function cc65SyncTotalCost(force){
  var el=document.getElementById('cc65TotalCost'); if(!el)return;
  var hint=document.getElementById('cc65TotalCostHint');
  if(_cc65TotalManual&&!force){ if(hint)hint.textContent='✎ manual'; return; }
  try{renderAbstract();}catch(e){}            // refresh A+B+C from current bill data
  var g=document.getElementById('sumGrand');
  var v=parseFloat(((g&&g.textContent)||'0').replace(/[₹,\s]/g,''))||0;
  if(v>0){
    el.value=v.toFixed(2);
    _cc65TotalManual=false;
    if(hint)hint.textContent='auto = A+B+C';
  } else if(force){
    if(hint)hint.textContent='⚠ Grand Total 0 — आधी RE entries भरा';
  }
}
document.addEventListener('input',function(e){
  if(!e.target||e.target.id!=='cc65TotalCost')return;
  var hint=document.getElementById('cc65TotalCostHint');
  if(e.target.value.trim()===''){ _cc65TotalManual=false; if(hint)hint.textContent=''; }
  else { _cc65TotalManual=true; if(hint)hint.textContent='✎ manual'; }
});

// ═══ COMPLETION CERTIFICATE PRINT ══════════════════════════
function printCompletionCert(){
  try{cc65SyncTotalCost();}catch(e){}
  function g(id){var el=document.getElementById(id);return el?el.value||'':''}
  function fmtDate(d){if(!d)return'____';var p=d.split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:d;}
  function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

  var workName1=g('cc65WorkName1'), workName2=g('cc65WorkName2');
  var scheme=g('cc65Scheme'), agency=g('cc65Agency');
  var authority=g('cc65Authority');
  var aaAmount=g('cc65AAAmount'), tsReg=g('cc65TSReg');
  var b1No=g('cc65B1No'), b1Date=g('cc65B1Date');
  var tsAmount=g('cc65TSAmount'), mbNo=g('cc65MBNo');
  var pageNo=g('cc65PageNo'), tsDate=g('cc65TSDate');
  var totalCost=g('cc65TotalCost');
  var handedDate=g('cc65HandedDate'), handedMonth=g('cc65HandedMonth'), handedYear=g('cc65HandedYear');
  var signName=g('cc65SignName'), signDesig=g('cc65SignDesig');

  var pw=window.open('','_blank','width=900,height=850');
  pw.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Completion Certificate — Form 65</title>');
  pw.document.write('<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Arial",sans-serif;color:#000;font-size:12px;padding:40px 50px;max-width:800px;margin:0 auto}.no-print{display:block}@media print{.no-print{display:none!important}}</style></head><body>');

  // Header
  pw.document.write('<div style="text-align:center;margin-bottom:24px">');
  pw.document.write('<div style="font-size:20px;font-weight:700;letter-spacing:1.5px">COMPLETION CERTIFICATE</div>');
  pw.document.write('<div style="font-size:13px;font-weight:600;margin-top:5px">FORM NO (65)</div>');
  pw.document.write('</div>');

  // Work Name & Scheme
  pw.document.write('<table style="width:100%;border:none;font-size:12px;margin-bottom:6px"><tbody>');
  pw.document.write('<tr><td style="width:180px;padding:5px 0;vertical-align:top">Name of works :-</td><td style="padding:5px 0;font-weight:700">'+esc(workName1)+(workName2?'<br>'+esc(workName2):'')+'</td></tr>');
  pw.document.write('<tr><td style="padding:5px 0">Name of Scheme :</td><td style="padding:5px 0;font-weight:700">'+esc(scheme)+'</td></tr>');
  pw.document.write('</tbody></table>');
  pw.document.write('<div style="border-top:1px solid #ccc;margin:8px 0"></div>');

  // Agency
  pw.document.write('<table style="width:100%;border:none;font-size:12px;margin-bottom:6px"><tbody>');
  pw.document.write('<tr><td style="width:180px;padding:5px 0">Name of Agency :-</td><td style="padding:5px 0;font-weight:700">'+esc(agency)+'</td></tr>');
  pw.document.write('</tbody></table>');
  pw.document.write('<div style="border-top:1px solid #ccc;margin:8px 0"></div>');

  // Authority & Amounts
  pw.document.write('<table style="width:100%;border:none;font-size:12px;margin-bottom:4px"><tbody>');
  pw.document.write('<tr><td style="width:180px;padding:4px 0">Authority :-</td><td colspan="3" style="padding:4px 0;font-weight:700">'+esc(authority)+'</td></tr>');
  pw.document.write('<tr><td style="padding:4px 0">A. A. Amount :-</td><td style="padding:4px 0;font-weight:700;width:180px">'+esc(aaAmount)+'</td><td style="padding:4px 0;width:130px">T.S. Reg. No :-</td><td style="padding:4px 0;font-weight:700">'+esc(tsReg)+'</td></tr>');
  pw.document.write('<tr><td style="padding:4px 0">B-1 No. '+esc(b1No)+'</td><td style="padding:4px 0">Date. '+fmtDate(b1Date)+'</td><td style="padding:4px 0">T.S. Amount :-</td><td style="padding:4px 0;font-weight:700">'+esc(tsAmount)+'</td></tr>');
  pw.document.write('<tr><td style="padding:4px 0">M.B No. '+esc(mbNo)+'</td><td style="padding:4px 0">Page No. '+esc(pageNo)+'</td><td style="padding:4px 0">T.S. Date :-</td><td style="padding:4px 0;font-weight:700">'+fmtDate(tsDate)+'</td></tr>');
  pw.document.write('</tbody></table>');

  pw.document.write('<div style="margin:10px 0;font-size:12px;font-weight:700">Total Cost of work Recording M.B. Amount :-'+esc(totalCost)+'</div>');
  pw.document.write('<div style="border-top:2px solid #000;margin:14px 0"></div>');

  // Certification para
  var dd=handedDate||'__', mm=handedMonth||'__', yy=handedYear||'__';
  pw.document.write('<p style="font-size:12px;line-height:2;text-indent:40px;margin-bottom:30px">Certified that work mentioned above is completed of dated. And handed over to &nbsp;'+esc(dd)+' / '+esc(mm)+' /202'+esc(yy)+' that there have no material deviation from the sanctioned and specifications other then those sanctioned by compentent authority.</p>');

  // Signature
  pw.document.write('<div style="display:flex;justify-content:flex-end;margin-top:40px">');
  pw.document.write('<div style="text-align:center;min-width:200px">');
  pw.document.write('<div style="height:60px"></div>');
  pw.document.write('<div style="border-top:1.5px solid #000;padding-top:4px;font-weight:700;font-size:12px">'+esc(signName)+'</div>');
  pw.document.write('<div style="font-size:11px;margin-top:2px">'+esc(signDesig)+'</div>');
  pw.document.write('</div></div>');

  pw.document.write('<div class="no-print" style="margin-top:24px;text-align:center"><button onclick="window.print()" style="padding:10px 28px;background:#1a2744;color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer;margin-right:10px">🖨️ Print</button><button onclick="window.close()" style="padding:10px 18px;background:#ccc;color:#333;border:none;border-radius:6px;font-size:14px;cursor:pointer">Close</button></div>');
  pw.document.write('</body></html>');
  pw.document.close();
}

/* ═══════════════════════════════════════════════════════════
   ADD ITEM FROM SSR
   • Item no / description / unit come from ssr_data.js  (loaded on demand, keep it next to this page)
   • Rate is pre-filled from SSR; the user may change it (the user's rate is always kept). Below-SSR rates show a red warning
   • The user enters the estimate measurement and says whether the actual work is the same
   ═══════════════════════════════════════════════════════════ */
var _msSsrT=null,_msSsrLoading=false;
function msSsrOk(){return typeof SSR!=='undefined'&&SSR&&SSR.length;}
function msUnit(u){return String(u||'').replace(/\s+/g,' ').replace(/^one\s+/i,'').replace(/meterr\b/ig,'Meter').replace(/\.$/,'').trim();}
var _msSsrMap=null;
function msSsrRateOf(no){
  if(!msSsrOk())return null;
  if(!_msSsrMap){_msSsrMap={};for(var i=0;i<SSR.length;i++){var d=SSR[i];if(d&&d.length>3){var k=String(d[0]).trim();if(!(k in _msSsrMap))_msSsrMap[k]=msNum(d[3]);}}}
  var v=_msSsrMap[String(no==null?'':no).trim()];
  return (v>0)?v:null;
}
/* HTML under the rate box: SSR rate + red badge when the entered rate is below the SSR basic rate */
function msRateNote(no,rate,idx){
  var sr=msSsrRateOf(no);if(sr==null)return '';
  var r=msNum(rate),h='<span class="ms-ssrtxt">SSR ₹'+fmt(sr)
    +((r!==sr&&idx!=null)?' · <a onclick="msUseSsrRate('+idx+')" title="Set SSR rate">use SSR</a>':'')+'</span>';
  if(r>0&&r<sr-0.0001)h+='<span class="ms-low">▼ Below SSR by ₹'+fmt(sr-r)+' ('+((sr-r)/sr*100).toFixed(1)+'%)</span>';
  return h;
}
function msUseSsrRate(idx){
  var it=APP.items[idx];if(!it)return;var sr=msSsrRateOf(it.no);if(sr==null)return;
  it.rate=sr;it.finalRate=sr;renderItems();renderAbstract();
}
function msPreloadSsr(){
  if(msSsrOk()||_msSsrLoading)return;
  _msSsrLoading=true;
  var s=document.createElement('script');s.src='ssr_data.js';
  s.onload=function(){_msSsrLoading=false;try{if(APP.items.length){renderItems();renderREEntries();}}catch(e){}};
  s.onerror=function(){_msSsrLoading=false;};
  document.head.appendChild(s);
}
function msLoadSsr(cb){
  if(msSsrOk()){cb();return;}
  if(_msSsrLoading)return;
  _msSsrLoading=true;
  var s=document.createElement('script');s.src='ssr_data.js';
  s.onload=function(){_msSsrLoading=false;if(msSsrOk())cb();else showToast('ssr_data.js loaded but it contains no SSR data','error');};
  s.onerror=function(){_msSsrLoading=false;showToast('ssr_data.js not found — keep it in the same folder as this page','error');};
  document.head.appendChild(s);
}
function msEnsureModal(){
  msInjectStyle();
  if(document.getElementById('msSsrModal'))return;
  var d=document.createElement('div');d.id='msSsrModal';d.className='ms-ovl';
  d.innerHTML='<div class="ms-box" id="msSsrBody"></div>';
  d.addEventListener('mousedown',function(e){if(e.target===d)closeSsrAdd();});
  document.body.appendChild(d);
}
function closeSsrAdd(){var m=document.getElementById('msSsrModal');if(m)m.classList.remove('open');}
function openSsrAdd(){
  msLoadSsr(function(){
    msEnsureModal();
    document.getElementById('msSsrBody').innerHTML=
      '<h3 style="margin:0 0 8px">🔎 Add Item from SSR</h3>'
     +'<input id="msSsrQ" class="ms-in" placeholder="Item No. or keywords — e.g. 22.01 or cement concrete" oninput="msSsrSearch()">'
     +'<div class="ms-note" id="msSsrInfo" style="margin:4px 0"></div><div class="ms-res" id="msSsrRes"></div>'
     +'<div style="text-align:right;margin-top:10px"><button class="btn btn-ghost" onclick="closeSsrAdd()">Close</button></div>';
    document.getElementById('msSsrModal').classList.add('open');
    msSsrSearch(true);
    setTimeout(function(){var q=document.getElementById('msSsrQ');if(q)q.focus();},50);
  });
}
function msSsrSearch(now){
  clearTimeout(_msSsrT);
  _msSsrT=setTimeout(function(){
    var qe=document.getElementById('msSsrQ');if(!qe)return;
    var q=(qe.value||'').trim().toLowerCase(),words=q.split(/\s+/).filter(Boolean),res=[],i,d,h;
    if(!words.length){res=SSR.slice(0,30);}
    else{
      for(i=0;i<SSR.length;i++){
        d=SSR[i];if(!d||d.length<2)continue;
        h=((d[0]||'')+' '+(d[1]||'')+' '+(d[2]||'')).toLowerCase();
        if(words.every(function(w){return h.indexOf(w)>=0;})){res.push(d);if(res.length>=60)break;}
      }
    }
    document.getElementById('msSsrInfo').textContent=words.length?(res.length+' results'+(res.length>=60?' (first 60)':'')):(SSR.length+' items — start typing to search');
    document.getElementById('msSsrRes').innerHTML=res.length?res.map(function(d){
      var ds=String(d[1]||'');
      return '<div class="ms-ri" onclick="msSsrPick(\''+msA(d[0])+'\')"><b>'+msA(d[0])+'</b> <span>['+msA(msUnit(d[2]))+']</span><br>'+msA(ds.length>230?ds.substring(0,230)+'…':ds)+'</div>';
    }).join(''):'<div class="ms-note" style="padding:10px">Nothing found</div>';
  },now===true?0:150);
}
function msSsrPick(no){
  var d=null,i;
  for(i=0;i<SSR.length;i++){if(String(SSR[i][0])===String(no)){d=SSR[i];break;}}
  if(!d)return;
  MSDRAFT={id:'__draft',no:String(d[0]),desc:String(d[1]||''),unit:msUnit(d[2]),rate:(msNum(d[3])>0?msNum(d[3]):''),ssrRate:msNum(d[3]),estRows:[msNewRow()],same:true};
  var ds=MSDRAFT.desc;
  document.getElementById('msSsrBody').innerHTML=
    '<h3 style="margin:0 0 6px">＋ Add item: '+msA(MSDRAFT.no)+' <span class="ms-note">['+msA(MSDRAFT.unit)+']</span></h3>'
   +'<p class="ms-note" style="margin:0 0 8px">'+msA(ds.length>300?ds.substring(0,300)+'…':ds)+'</p>'
   +'<div style="max-width:260px;margin-bottom:8px"><label>Rate (₹ / '+msA(MSDRAFT.unit)+') — SSR rate is filled, you can change it</label>'
   +'<input id="msSsrRate" class="ms-in" type="text" inputmode="decimal" placeholder="e.g. 5210.50" value="'+msA(MSDRAFT.rate)+'" oninput="msDraftRate(this.value)"><div id="msRateWarn">'+msDraftRateNote()+'</div></div>'
   +'<div style="font-weight:600;font-size:12px;margin:6px 0 4px">📋 Estimate measurement (Nos × L × B × D/H)</div>'
   +'<div id="msEbox___draft">'+msEstTable(MSDRAFT)+'</div>'
   +'<div class="ms-bar ms-ask" style="margin-top:10px">❓ Is the work actually executed the same as the estimate?<br>'
   +'<label style="margin-right:14px"><input type="radio" name="msDsame" checked onchange="MSDRAFT.same=true"> ✅ Yes, same (actual rows are filled automatically)</label>'
   +'<label><input type="radio" name="msDsame" onchange="MSDRAFT.same=false"> ✏️ No, different (I will change it in the MB tab)</label></div>'
   +'<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button class="btn btn-ghost" onclick="openSsrAdd()">← Back</button><button class="btn btn-ghost" onclick="closeSsrAdd()">Cancel</button><button class="btn btn-primary" onclick="msSsrAdd()">✓ Add Item</button></div>';
  setTimeout(function(){var r=document.getElementById('msSsrRate');if(r)r.focus();},50);
}
function msDraftRateNote(){
  var sr=MSDRAFT.ssrRate,r=msNum(MSDRAFT.rate);if(!(sr>0))return '<span class="ms-ssrtxt">No SSR rate found for this item</span>';
  var h='<span class="ms-ssrtxt">SSR basic rate: ₹'+fmt(sr)+(r!==sr?' · <a onclick="msDraftUseSsr()">use SSR rate</a>':'')+'</span>';
  if(r>0&&r<sr-0.0001)h+='<span class="ms-low">▼ Rate is below SSR basic rate by ₹'+fmt(sr-r)+' ('+((sr-r)/sr*100).toFixed(1)+'%)</span>';
  return h;
}
function msDraftRate(v){MSDRAFT.rate=v;var e=document.getElementById('msRateWarn');if(e)e.innerHTML=msDraftRateNote();}
function msDraftUseSsr(){MSDRAFT.rate=MSDRAFT.ssrRate;var i=document.getElementById('msSsrRate');if(i)i.value=MSDRAFT.rate;msDraftRate(MSDRAFT.rate);}
function msShowItemsUI(){
  var es=document.getElementById('emptyState'),it=document.getElementById('itemsTable'),sp=document.getElementById('startDatePanel');
  if(es)es.style.display='none';
  if(it)it.style.display='table';
  if(sp)sp.style.display='';
  var b=document.getElementById('itemsBadge');if(b)b.textContent=msItemCount();
}
function msSsrAdd(){
  var rows=MSDRAFT.estRows.filter(function(r){return r.isPct||msRowCalc(r,0)!==0;});
  var q=msCalcRows(rows);
  if(!rows.length||q===0){
    if(!confirm('Estimate qty is 0. Add the item anyway?'))return;
    if(!rows.length)rows=[msNewRow()];
  }
  if(!msNum(MSDRAFT.rate)&&!confirm('No rate entered. Add anyway? (You can enter the rate later in the Items table)'))return;
  if(APP.items.some(function(x){return String(x.no)===MSDRAFT.no&&!x.hasSplits;})&&!confirm('Item '+MSDRAFT.no+' is already in the list. Add it again?'))return;
  var maxSeq=-1;APP.items.forEach(function(x){if(x._origSeq!=null&&x._origSeq>maxSeq)maxSeq=x._origSeq;});
  var want=!!MSDRAFT.same;
  var it={
    id:'item_add_'+Date.now()+'_'+Math.floor(Math.random()*1000),
    no:MSDRAFT.no,desc:MSDRAFT.desc,unit:MSDRAFT.unit,rate:msNum(MSDRAFT.rate),
    estQty:0,cf:null,steelTag:'',cat:getItemCategory(MSDRAFT.no,'',MSDRAFT.desc),
    isSplit:false,splitOf:null,reEntries:[],reDate:'',reNo:'',billQty:0,dispDesc:MSDRAFT.desc,
    _origSeq:maxSeq+1,_rawItem:null,_added:true,estRows:rows,same:true,ssrRate:MSDRAFT.ssrRate||0,finalRate:msNum(MSDRAFT.rate)
  };
  msSyncEst(it);        /* copies the estimate rows to the actual rows */
  it.same=want;         /* "different" → copied rows stay and can be edited */
  APP.items.push(it);
  msShowItemsUI();
  autoSortItems();renderItems();
  try{switchTab('tab-re');}catch(e){renderREEntries();}
  renderAbstract();
  closeSsrAdd();
  setTimeout(function(){
    var e=document.getElementById('rei_'+it.id);
    if(e){e.scrollIntoView({behavior:'smooth',block:'start'});e.style.outline='2px solid #c8922a';setTimeout(function(){e.style.outline='';},1800);}
  },80);
  showToast('✅ Item '+it.no+' added'+(want?' (Actual = Estimate)':' — change the actual rows'),'success');
}

/* "Add Item from SSR" button next to the existing "load estimate" button (no HTML change needed) */
(function msInjectButton(){
  function go(){
    if(document.getElementById('msAddSsrBtn'))return true;
    var b=document.querySelector('[onclick*="openEstModal"]');
    if(!b||!b.parentNode)return false;
    var n=document.createElement('button');n.id='msAddSsrBtn';n.type='button';n.className=b.className;
    n.textContent='🔎 Add Item from SSR';n.onclick=openSsrAdd;
    b.parentNode.insertBefore(n,b.nextSibling);
    return true;
  }
  function start(){msInjectStyle();msPreloadSsr();if(!go())setTimeout(go,1200);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();


/* ═══════════════════════════════════════════════════════════
   PRINT  —  format chooser + OFFICIAL print formats
   [Print] → asks:  1) RA Bill format (official, black & white, no screen colours)
                    2) 1st & Final Bill format (PWD_FINAL_BILL.html → Print All)
   ═══════════════════════════════════════════════════════════ */
function msEnsurePrintModal(){
  msInjectStyle();
  if(document.getElementById('msPrintModal'))return;
  var d=document.createElement('div');d.id='msPrintModal';d.className='ms-ovl';
  d.innerHTML='<div class="ms-box" style="width:min(560px,94vw)">'
    +'<h3 style="margin:0 0 4px">🖨️ Print — select format</h3>'
    +'<div class="ms-note" style="margin-bottom:10px">Which format do you want to print?</div>'
    +'<button class="btn btn-primary" style="display:block;width:100%;text-align:left;padding:10px 12px;margin-bottom:8px;white-space:normal" onclick="printRaFormat()">'
    +'<b>📘 1) RA Bill format</b><br><span style="font-weight:400;font-size:11px">Form 47 (Running Account Bill) + Abstract + Measurement Book + Comparative + Royalty + Consumption + Cement — official layout (plain black &amp; white)</span></button>'
    +'<button class="btn btn-success" style="display:block;width:100%;text-align:left;padding:10px 12px;margin-bottom:8px;white-space:normal" onclick="printFirstFinal()">'
    +'<b>📗 2) 1st &amp; Final Bill format</b><br><span style="font-weight:400;font-size:11px">Same as “Print All” in PWD_FINAL_BILL — Forwarding Letter, Checklist, Form 46, Comparative, Cement, Royalty, No Dues Certificate. Items, rates and bill quantities are carried over from this bill.</span></button>'
    +'<div style="text-align:right"><button class="btn btn-ghost" onclick="closePrintChooser()">Cancel</button></div></div>';
  d.addEventListener('mousedown',function(e){if(e.target===d)closePrintChooser();});
  document.body.appendChild(d);
}
function closePrintChooser(){var m=document.getElementById('msPrintModal');if(m)m.classList.remove('open');}
function printAbstract(){
  if(!APP.items.length){showToast('Load an estimate or add items first','warn');return;}
  msEnsurePrintModal();
  document.getElementById('msPrintModal').classList.add('open');
}

/* ── helpers ── */
function msCleanClone(el,outer){
  if(!el)return '';
  var c=el.cloneNode(true);
  Array.prototype.forEach.call(c.querySelectorAll('input,textarea,select'),function(f){
    var t;
    if(f.type==='checkbox'||f.type==='radio')t=f.checked?'☑':'☐';
    else if(f.tagName==='SELECT')t=f.options[f.selectedIndex]?f.options[f.selectedIndex].text:'';
    else t=f.value;
    var sp=document.createElement('span');sp.textContent=t;f.parentNode.replaceChild(sp,f);
  });
  Array.prototype.forEach.call(c.querySelectorAll('button,.no-print,script'),function(b){b.parentNode.removeChild(b);});
  return outer?c.outerHTML:c.innerHTML;
}
/* run an existing print function but capture the HTML it would write instead of opening a window */
function msCapture(fn){
  var buf=[],orig=window.open;
  window.open=function(){return{document:{write:function(x){buf.push(x);},close:function(){}},focus:function(){},print:function(){}};};
  try{fn();}catch(e){console.error(e);}finally{window.open=orig;}
  var d=new DOMParser().parseFromString(buf.join(''),'text/html');
  Array.prototype.forEach.call(d.querySelectorAll('.no-print,script'),function(n){n.parentNode.removeChild(n);});
  return d.body?d.body.innerHTML:'';
}
function msOfficialStyles(){
  return '@page{size:A4 portrait;margin:12mm}'
   +'*{box-sizing:border-box}'
   +'html,body{margin:0;padding:0;background:#fff}'
   +'body{font-family:"Times New Roman","Noto Sans Devanagari","Mangal",serif;font-size:12.5px;line-height:1.4;color:#000;padding:0}'
   +'*{background:transparent!important;color:#000!important;box-shadow:none!important;text-shadow:none!important}'
   +'*{border-color:#000!important}'
   +'table{width:100%;border-collapse:collapse;margin-top:6px;font-size:11.5px}'
   +'th,td{border:1px solid #000;padding:3px 5px;vertical-align:top}'
   +'table{min-width:0!important}div{overflow:visible!important}'
   +'th{text-align:center;font-weight:700;text-transform:none}'
   +'tr{page-break-inside:avoid}thead{display:table-header-group}'
   +'.num,.amount-col,.num-cell{text-align:right;white-space:nowrap;font-family:inherit!important}'
   +'.sec{page-break-after:always;padding:0}.sec:last-child{page-break-after:auto}'
   +'.page-break{page-break-before:always}'
   +'.ofc-title{text-align:center;font-size:16px;font-weight:700}'
   +'.ofc-sub{text-align:center;font-size:12px;font-weight:700;margin-bottom:4px}'
   +'.ofc-info{border-top:2px solid #000;border-bottom:1px solid #000;padding:4px 0;margin:4px 0 8px;font-size:12px}'
   +'.ofc-info div{margin:2px 0}'
   +'.sec-title{text-align:center;font-size:14px;font-weight:700;text-decoration:underline;margin:10px 0 6px;padding:0;border:0}'
   +'.tot td{font-weight:700}'
   +'.summary-grid{display:block}.summary-box{display:inline-block;border:1px solid #000;padding:4px 10px;margin:4px 6px 0 0}'
   +'.summary-label{font-size:10px}.summary-amount{font-weight:700}'
   +'.no-print{display:none!important}'
   +'@media screen{body{padding:16px}.ctl{display:block!important;text-align:center;margin:16px 0}}'
   +'@media print{.ctl{display:none!important}}';
}
function msOfficialAbstract(){
  var grouped=getGroupedBillableItems(),tot=getF47Grand(),A=0;
  var h='<table><thead><tr><th style="width:34px">Sr.<br>No.</th><th style="width:52px">Item<br>No.</th><th>Description of Work</th><th style="width:70px">Quantity</th><th style="width:60px">Unit</th><th style="width:70px">Rate (₹)</th><th style="width:88px">Amount (₹)</th></tr></thead><tbody>';
  grouped.forEach(function(it,i){
    var q=it.billQty>0?it.billQty:(it.estQty||0),a=q*(it.rate||0);A+=a;
    var d=escHtml(it.dispDesc||it.desc||'');
    if((it.no==='26.33'||it.no==='26.34')&&it.steelTag)d='['+escHtml(it.steelTag.toUpperCase())+'] '+d;
    h+='<tr><td style="text-align:center">'+(i+1)+'</td><td>'+escHtml(it.no)+'</td><td>'+d+'</td><td class="num">'+q.toFixed(3)+'</td><td style="text-align:center">'+escHtml(it.unit||'')+'</td><td class="num">'+fmt(it.rate||0)+'</td><td class="num">'+fmt(a)+'</td></tr>';
  });
  h+='<tr class="tot"><td colspan="6" style="text-align:right">Total (A) — Work Items</td><td class="num">'+fmt(A)+'</td></tr>';
  if(tot.b>0)h+='<tr class="tot"><td colspan="6" style="text-align:right">(B) Royalty Charges</td><td class="num">'+fmt(tot.b)+'</td></tr>';
  if(tot.c>0)h+='<tr class="tot"><td colspan="6" style="text-align:right">(C) Testing / V&amp;QC Charges</td><td class="num">'+fmt(tot.c)+'</td></tr>';
  h+='<tr class="tot"><td colspan="6" style="text-align:right">Total (A + B + C)</td><td class="num">'+fmt(A+tot.b+tot.c)+'</td></tr>';
  var ad=msAddonsCalc();
  ad.rows.forEach(function(r){if(!r.eff)return;h+='<tr><td colspan="6" style="text-align:right">Add '+escHtml(r.lbl)+'</td><td class="num">'+fmt(r.amt)+'</td></tr>';});
  if(ad.total>0)h+='<tr class="tot"><td colspan="6" style="text-align:right">Net Total (including add-on charges)</td><td class="num">'+fmt(A+tot.b+tot.c+ad.total)+'</td></tr>';
  return h+'</tbody></table>';
}

/* ── 1) RA BILL — official format ── */
function printRaFormat(){
  closePrintChooser();
  try{renderAbstract();}catch(e){}
  try{if(typeof buildComparativeTable==='function')buildComparativeTable();}catch(e){}
  try{if(typeof renderRoyaltyTab==='function')renderRoyaltyTab();}catch(e){}
  try{if(typeof renderCementConsumption==='function')renderCementConsumption();}catch(e){}
  try{if(typeof renderConsumptionTab==='function')renderConsumptionTab();}catch(e){}
  function v(id){var e=document.getElementById(id);return e&&e.value?e.value:'';}
  var workName=escHtml((v('ahWorkName')+' '+v('ahWorkName2')).trim()||'—');
  var info='<div class="ofc-info"><div><b>Name of Work :</b> '+workName+'</div>'
    +'<div><b>Contractor :</b> '+escHtml(v('ahContractor')||'—')+' &nbsp;&nbsp; <b>Bill No :</b> '+escHtml(v('billNo')||'—')+' &nbsp;&nbsp; <b>Date :</b> '+escHtml(v('billDate')||'—')+' &nbsp;&nbsp; <b>Agreement No :</b> '+escHtml(v('ahAgreementNo')||'—')+'</div></div>';
  var hdr='<div class="ofc-title">सार्वजनिक बांधकाम विभाग, महाराष्ट्र शासन</div><div class="ofc-sub">Public Works Department — Running Account Bill</div>'+info;
  var sig=buildSigBlock(v('sig1Name')||'Sectional Engineer',v('sig1Desig')||'P.W. Sub Division',v('sig2Name')||'Sub Divisional Engineer',v('sig2Desig')||'P.W. Division');

  var secs=[];
  var f47=msCapture(printForm47);
  if(f47)secs.push('<div class="sec">'+f47+'</div>');
  secs.push('<div class="sec">'+hdr+'<div class="sec-title">Abstract of Bill</div>'+msOfficialAbstract()+sig+'</div>');
  var re=buildREPrintHtml();
  if(re)secs.push('<div class="sec">'+hdr+'<div class="sec-title">Measurement Book — Details of Measurements</div>'+re+'</div>');
  var comp=document.getElementById('comparativeOutput');
  if(comp&&comp.style.display!=='none'&&comp.innerHTML.trim())secs.push('<div class="sec">'+hdr+'<div class="sec-title">Comparative Statement</div>'+msCleanClone(comp)+sig+'</div>');
  var tst=msOfficialTests();
  if(tst)secs.push('<div class="sec">'+hdr+'<div class="sec-title">Statement of Testing Charges</div>'+tst+sig+'</div>');
  [['royaltyTabContent','Royalty Statement'],['consumptionTabContent','Consumption Chart'],['cementConsumptionContent','Cement Consumption Statement']].forEach(function(x){
    var el=document.getElementById(x[0]);
    if(el&&el.innerHTML.indexOf('empty-state')===-1&&el.innerHTML.trim())secs.push('<div class="sec">'+hdr+'<div class="sec-title">'+x[1]+'</div>'+msCleanClone(el)+sig+'</div>');
  });

  var pw=window.open('','_blank','width=1100,height=850');
  if(!pw){showToast('Popup blocked — allow popups for this page','error');return;}
  pw.document.write('<!DOCTYPE html><html lang="mr"><head><meta charset="UTF-8"><title>RA Bill — '+workName+'</title>'
    +'<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">'
    +'<style>'+msOfficialStyles()+'</style></head><body>'+secs.join('')
    +'<div class="ctl" style="display:none"><button onclick="window.print()" style="padding:9px 26px;font-size:14px;cursor:pointer;margin-right:8px">🖨️ Print</button><button onclick="window.close()" style="padding:9px 18px;font-size:14px;cursor:pointer">Close</button></div>'
    +'<script>window.onload=function(){setTimeout(function(){window.print();},700);};<\/script></body></html>');
  pw.document.close();
}

/* ── 2) 1st & FINAL — hand this bill's data to PWD_FINAL_BILL.html and print all there ── */
var _msFFState=null;
function msBuildFFState(){
  function v(id){var e=document.getElementById(id);return e&&e.value?e.value:'';}
  var st={v:1,
    m:{division:v('f47Division')||'ABCD',subdiv:v('f47SubDiv')||'XYZ',
       workName:(v('ahWorkName')+' '+v('ahWorkName2')).trim(),contractor:v('ahContractor'),
       agrNo:v('ahAgreementNo'),agrDate:v('f47AgrDate'),mbNo:v('cc65MBNo')||v('f47MBBarcode'),mbPage:v('cc65PageNo')||v('f47MBPage'),
       completionDate:v('f47ActualCompletion')},
    items:[],tests:[],extraB:[],
    roy:{on:true,rateMurum:ROYALTY_RATE_MURUM,rateSand:ROYALTY_RATE_SAND,ov:{},extra:[]},
    cem:{cf:{},act:{},rem:{},extra:[]},txt:{}};
  if(!st.m.division||st.m.division==='')delete st.m.division;
  var n=0;
  APP.items.forEach(function(it){
    if(it.hasSplits)return;
    var q=(it.billQty>0)?it.billQty:(it.estQty||0);
    if(!(q>0)&&!(it.estQty>0))return;
    var o={id:'ra'+(n++)+'_'+String(it.id),no:String(it.no||''),desc:it.dispDesc||it.desc||'',unit:it.unit||'',
           rate:it.rate||0,estQty:it.estQty||0,qty:q,cf:(it.cf&&typeof it.cf==='object')?it.cf:null};
    if(msHasEst(it)){
      o.rows=JSON.parse(JSON.stringify(it.estRows));
      o.same=(it.same===true||it.same===false)?it.same:null;
      var steel=msIsSteel(it);
      o.aRows=(it.reEntries||[]).map(function(r){
        var a={lbl:r.desc||'',n:(r.no==null?'':r.no),l:(r.L==null?'':r.L),b:(r.B==null?'':r.B),d:(r.H==null?'':r.H),ded:!!r.isDeduct};
        if(r.isPct){a.isPct=true;a.pctMode=r.pctMode;a.pct=r.pct;a.factor=r.factor;if(r.fixed){a.fixed=true;a.q0=msNum(r.q0);}}
        else if(r.fixed||steel){a.fixed=true;a.q0=Math.abs(msNum(r.rowQty));}
        return a;});
    }
    st.items.push(o);
  });
  (APP.tests||[]).forEach(function(t,i){
    if(!t||!(msNum(t.qty)>0))return;
    st.tests.push({id:'rt'+i,desc:t.desc||'',unit:t.unit||'Test',tq:t.qty,qty:t.qty,rate:t.rate});
  });
  return JSON.parse(JSON.stringify(st));
}
function printFirstFinal(){
  closePrintChooser();
  try{renderAbstract();}catch(e){}
  _msFFState=msBuildFFState();
  var w=window.open('PWD_FINAL_BILL.html#autoprint','_blank');
  if(!w){showToast('Popup blocked — allow popups for this page','error');return;}
  showToast('Opening 1st & Final Bill format…','success');
}
window.addEventListener('message',function(e){
  var d=e.data;if(!d||d.type!=='ff-ready'||!_msFFState)return;
  try{e.source.postMessage({type:'ra-state',S:_msFFState},'*');}catch(x){}
});


/* ═══════════════════════════════════════════════════════════
   🧪 TESTS TAB  — user picks which tests, how many and at what ₹ rate
   (VQCC list is the same one used in the ATP estimate's Testing sheet: pick a test → its VQCC rate is filled,
    rate / count / name stay editable.  Total goes to Abstract (C), Form 47 and the 1st & Final bill.)
   APP.tests = [{desc, qty (no. of tests), rate (₹ per test), unit:'Test', vq}]
   ═══════════════════════════════════════════════════════════ */
var MS_TEST_CAT=[["Cement", "Basic test of cement (consistency, fineness, SG, setting time, compressive strength, soundness)", "#1", 3960], ["Aggregate", "Water absorption + Specific gravity + Impact / Crushing value (one of the two)", "#2", 2730], ["Aggregate", "Sieve analysis (Gradation)", "#3", 725], ["Aggregate", "Flakiness Index & Elongation Index", "#5", 895], ["Sand", "Fineness modulus (sieve analysis), silt & clay content", "#10", 1450], ["Steel", "Steel bars up to 16 mm (set of 3 bars)", "#74", 1340], ["Steel", "Steel bars above 16 mm (set of 3 bars)", "#75", 1675], ["Bricks", "Bricks — water absorption, compressive strength, efflorescence (set of 5 bricks)", "#13", 2285], ["Flooring Tiles", "Flooring tiles (mosaic / cement) — flexural, water absorption, wear (set of 6 tiles)", "#14", 2620], ["Flooring Tiles", "Ceramic / vitrified tiles — water absorption, modulus of rupture (set of 6 tiles)", "#16", 1675], ["Manglore Tiles", "Manglore tiles — water absorption, flexural (set of 6 tiles)", "#17", 1560], ["Paver Blocks", "Paver blocks — compressive strength, water absorption (set of 8 blocks)", "#27", 2620], ["Sub-grade / Earthwork", "CBR (average of 3 specimens)", "#33", 7250], ["Sub-grade / Earthwork", "Plastic Index (LL & PL)", "#31", 1230], ["Granular Sub-base (GSB)", "Grading of aggregate", "#3", 725], ["Granular Sub-base (GSB)", "Atterberg limits", "#31", 1230], ["Water Bound Macadam (WBM)", "Aggregate Impact Value", "#2", 2730], ["Water Bound Macadam (WBM)", "Grading of aggregate", "#3", 725], ["Water Bound Macadam (WBM)", "Combined Flakiness & Elongation Indices", "#5", 895], ["Water Bound Macadam (WBM)", "Atterberg limits of binding material", "#31", 1230], ["Water Bound Macadam (WBM)", "Atterberg limits of screenings", "#31", 1230], ["Wet Mix Macadam (WMM)", "Aggregate Impact Value", "#2", 2730], ["Wet Mix Macadam (WMM)", "Grading of aggregate", "#3", 725], ["Wet Mix Macadam (WMM)", "Combined Flakiness & Elongation Indices", "#5", 895], ["Wet Mix Macadam (WMM)", "Atterberg limits (portion passing 425 micron sieve)", "#31", 1230], ["Hard Murum", "Atterberg limits", "#31", 1230], ["BBM / MPM", "Aggregate Impact Value", "#2", 2730], ["BBM / MPM", "Grading of aggregate", "#3", 725], ["BBM / MPM", "Combined Flakiness & Elongation Indices", "#5", 895], ["BBM / MPM", "Stripping value of aggregate", "#6", 780], ["BUSG", "Aggregate Impact Value / Abrasion Value", "#2", 2730], ["BUSG", "Grading of aggregate", "#3", 725], ["BUSG", "Combined Flakiness & Elongation Indices", "#5", 895], ["Seal coat / Surface Dressing", "Aggregate Impact Value", "#2", 2730], ["Seal coat / Surface Dressing", "Combined Flakiness & Elongation Indices", "#5", 895], ["Seal coat / Surface Dressing", "Stripping value of aggregate", "#6", 780], ["Open / Close-graded Premix Surfacing", "Aggregate Impact Value", "#2", 2730], ["Open / Close-graded Premix Surfacing", "Combined Flakiness & Elongation Indices", "#5", 895], ["Open / Close-graded Premix Surfacing", "Stripping value of aggregate", "#6", 780], ["Bituminous Macadam (BM)", "Aggregate Impact Value", "#2", 2730], ["Bituminous Macadam (BM)", "Combined Flakiness & Elongation Indices", "#5", 895], ["Bituminous Macadam (BM)", "Density of compacted layer", "#53", 665], ["Bituminous Macadam (BM)", "Stripping value of aggregate", "#6", 780], ["DBM / Bituminous Concrete (BC)", "Aggregate Impact Value", "#2", 2730], ["DBM / Bituminous Concrete (BC)", "Combined Flakiness & Elongation Indices", "#5", 895], ["DBM / Bituminous Concrete (BC)", "Density of compacted layer", "#53", 665], ["DBM / Bituminous Concrete (BC)", "Binder content", "#44", 1675], ["DBM / Bituminous Concrete (BC)", "Stability, flow, density & voids (Marshall)", "#46", 1170], ["DBM / Bituminous Concrete (BC)", "Stripping value of aggregate", "#6", 780], ["Bitumen (binder)", "Binder: Penetration, Softening point, Flash & Fire point, Specific gravity", "#41", 3290], ["Bitumen (binder)", "Binder: Viscosity (Absolute / Kinematic)", "#42", 2005], ["Bitumen (binder)", "Binder: Ductility / Elastic recovery", "#43", 950], ["Bitumen (binder)", "Bitumen emulsion: % residue / sieve test (tack / prime coat with emulsion)", "#56", 665], ["Bitumen (binder)", "Bitumen emulsion: particle charge test", "#57", 445], ["Mastic Asphalt", "Aggregate Impact Value", "#2", 2730], ["Mastic Asphalt", "Combined Flakiness & Elongation Indices", "#5", 895], ["Cold Mixes", "Aggregate Impact Value", "#2", 2730], ["Cold Mixes", "Combined Flakiness & Elongation Indices", "#5", 895], ["Cement Concrete", "Cube test — compressive strength (set of 3 cubes)", "#19", 725], ["Cement Concrete", "Concrete mix design (normal curing)", "#20", 14445]];
function msTestsTotal(){
  var t=0;(APP.tests||[]).forEach(function(x){t+=(parseFloat(x.qty)||0)*(parseFloat(x.rate)||0);});
  var e=document.getElementById('sumC');if(e)e.textContent='₹ '+fmt(t);
  return t;
}
function renderTestsTab(){
  msInjectStyle();
  var el=document.getElementById('testsTabContent');if(!el)return;
  var sel='<select id="tsSel" class="ms-in" style="max-width:640px"><option value="">— Select a test (VQCC rate list) —</option>',last='';
  MS_TEST_CAT.forEach(function(c,i){
    if(c[0]!==last){if(last)sel+='</optgroup>';sel+='<optgroup label="'+msA(c[0])+'">';last=c[0];}
    sel+='<option value="'+i+'">'+msA(c[1])+'  ['+msA(c[2])+' = ₹'+c[3]+']</option>';
  });
  sel+='</optgroup></select>';
  var h='<div class="ms-toolbar">'+sel
    +'<button class="btn btn-primary btn-sm" onclick="addTestFromCat()">＋ Add test</button>'
    +'<button class="btn btn-ghost btn-sm" onclick="addTestCustom()">＋ Custom test</button></div>'
    +'<div class="ms-note" style="margin-bottom:8px">Only the tests you add here are charged. Rate (₹ per test) and number of tests can be changed. Total = Abstract (C) = Form 47 = 1st &amp; Final bill.</div>';
  h+='<div class="scroll" style="overflow-x:auto"><table class="mb-table"><thead><tr><th style="width:34px">#</th><th style="min-width:260px">Test</th><th style="width:56px">VQCC</th><th style="width:80px">No. of tests</th><th style="width:100px">Rate ₹ / test</th><th style="width:110px">Amount ₹</th><th style="width:34px"></th></tr></thead><tbody>';
  if(!(APP.tests||[]).length)h+='<tr><td colspan="7" class="text-xs text-muted" style="padding:10px">No tests added yet.</td></tr>';
  (APP.tests||[]).forEach(function(t,i){
    var amt=(parseFloat(t.qty)||0)*(parseFloat(t.rate)||0);
    h+='<tr><td class="text-xs text-muted">'+(i+1)+'</td>'
      +'<td class="desc-cell"><input type="text" value="'+msA(t.desc)+'" placeholder="Test name" onchange="updateTestRow('+i+',\'desc\',this.value)"></td>'
      +'<td class="text-xs">'+msA(t.vq||'')+'</td>'
      +'<td><input type="text" inputmode="decimal" value="'+msA(t.qty)+'" oninput="updateTestRow('+i+',\'qty\',this.value)"></td>'
      +'<td><input type="text" inputmode="decimal" value="'+msA(t.rate)+'" oninput="updateTestRow('+i+',\'rate\',this.value)"></td>'
      +'<td class="calc-cell" id="tsAmt_'+i+'">'+fmt(amt)+'</td>'
      +'<td><button class="btn btn-danger btn-xs" onclick="deleteTestRow('+i+')">✕</button></td></tr>';
  });
  h+='</tbody><tfoot><tr class="mb-total-row"><td colspan="5" style="text-align:right"><strong>Total Testing Charges (C) =</strong></td><td class="calc-cell"><strong id="tsTot">'+fmt(msTestsTotal())+'</strong></td><td></td></tr></tfoot></table></div>';
  el.innerHTML=h;
}
function addTestFromCat(){
  var s=document.getElementById('tsSel');if(!s||s.value===''){showToast('Select a test first','warn');return;}
  var c=MS_TEST_CAT[parseInt(s.value)];if(!c)return;
  APP.tests.push({desc:c[1],qty:1,rate:c[3],unit:'Test',vq:c[2]});
  renderTestsTab();renderAbstract();
}
function addTestCustom(){
  APP.tests.push({desc:'',qty:1,rate:0,unit:'Test',vq:''});
  renderTestsTab();
  setTimeout(function(){var r=document.querySelectorAll('#testsTabContent tbody tr td.desc-cell input');if(r.length)r[r.length-1].focus();},30);
}
function deleteTestRow(i){APP.tests.splice(i,1);renderTestsTab();renderAbstract();}
function updateTestRow(i,f,v){
  var t=APP.tests[i];if(!t)return;
  t[f]=(f==='desc')?v:(parseFloat(v)||0);
  if(f!=='desc'){
    var a=document.getElementById('tsAmt_'+i);if(a)a.textContent=fmt((parseFloat(t.qty)||0)*(parseFloat(t.rate)||0));
    var tt=document.getElementById('tsTot');if(tt)tt.textContent=fmt(msTestsTotal());
    calcGrand();
  }
}
/* Testing statement for the official RA print */
function msOfficialTests(){
  var rows=(APP.tests||[]).filter(function(t){return (parseFloat(t.qty)||0)>0;});
  if(!rows.length)return '';
  var tot=0,h='<table><thead><tr><th style="width:34px">Sr.<br>No.</th><th>Description of Test</th><th style="width:60px">VQCC</th><th style="width:70px">No. of<br>Tests</th><th style="width:80px">Rate (₹)</th><th style="width:96px">Amount (₹)</th></tr></thead><tbody>';
  rows.forEach(function(t,i){var a=(parseFloat(t.qty)||0)*(parseFloat(t.rate)||0);tot+=a;
    h+='<tr><td style="text-align:center">'+(i+1)+'</td><td>'+escHtml(t.desc||'')+'</td><td style="text-align:center">'+escHtml(t.vq||'')+'</td><td class="num">'+(parseFloat(t.qty)||0)+'</td><td class="num">'+fmt(parseFloat(t.rate)||0)+'</td><td class="num">'+fmt(a)+'</td></tr>';});
  return h+'<tr class="tot"><td colspan="5" style="text-align:right">Total Testing Charges (C)</td><td class="num">'+fmt(tot)+'</td></tr></tbody></table>';
}


/* ═══════════════════════════════════════════════════════════
   ADD-ON CHARGES  (GST · Contingencies · Labour Insurance · extra rows)
   Same rules as the ATP estimate:  GST on A (or A+B+C) · Contingencies % or ₹ · Labour Insurance AUTO
   (work value up to ₹25 lakh = 0.50 %, above = 1.00 %) · any number of extra rows (% or ₹).
   Everything is filled automatically; every figure can be changed or switched off.
   APP.adds = {gst:{on,pct,base:'A'|'ABC'}, cont:{on,mode:'pct'|'amt',val}, li:{on,auto,pct}, extra:[{lbl,mode,val}]}
   ═══════════════════════════════════════════════════════════ */
function msDefaultAdds(on){return{gst:{on:on,pct:18,base:'A'},cont:{on:on,mode:'pct',val:2},li:{on:on,auto:true,pct:0.5},extra:[]};}
function msAdds(){if(!APP.adds)APP.adds=msDefaultAdds(true);return APP.adds;}
function msAddonsCalc(){
  var t=getF47Grand(),A=t.a,B=t.b,C=t.c,ABC=A+B+C,ad=msAdds(),rows=[],r;
  function add(k,lbl,on,amt){rows.push({k:k,lbl:lbl,on:!!on,amt:amt,eff:!!on&&amt>0});}
  var gp=+ad.gst.pct||0;
  add('gst','GST '+gp+'% on '+(ad.gst.base==='ABC'?'A+B+C':'A'),ad.gst.on,Math.round((ad.gst.base==='ABC'?ABC:A)*gp/100));
  var cv=+ad.cont.val||0;
  add('cont','Contingencies '+(ad.cont.mode==='amt'?('Rs. '+Math.round(cv)):(cv+'%')),ad.cont.on,ad.cont.mode==='amt'?Math.round(cv):Math.round(A*cv/100));
  var lp=ad.li.auto?(A>2500000?1:0.5):(+ad.li.pct||0);
  add('li','Labour Insurance '+lp+'%',ad.li.on,Math.round(A*lp/100));
  (ad.extra||[]).forEach(function(x,i){var v=+x.val||0;add('x'+i,(x.lbl||'Extra')+' '+(x.mode==='amt'?('Rs. '+Math.round(v)):(v+'%')),true,x.mode==='amt'?Math.round(v):Math.round(A*v/100));});
  var gst=0,other=0;rows.forEach(function(q){if(!q.eff)return;if(q.k==='gst')gst+=q.amt;else other+=q.amt;});
  return{A:A,B:B,C:C,ABC:ABC,rows:rows,gst:gst,other:other,total:gst+other,net:ABC+gst+other,liPct:lp};
}
function renderAddonsPanel(){
  var sg=document.getElementById('summaryGrid');if(!sg||!sg.parentNode)return;
  var p=document.getElementById('addonsPanel');
  if(!p){p=document.createElement('div');p.id='addonsPanel';p.style.cssText='margin-top:12px;border:1px solid var(--border2,#ccc);border-radius:8px;padding:10px 12px';sg.parentNode.insertBefore(p,sg.nextSibling);}
  p.style.display=(sg.style.display==='none')?'none':'';
  var ad=msAdds(),c=msAddonsCalc();
  function num(id,v,w,on){return '<input type="text" inputmode="decimal" id="'+id+'" value="'+msA(v)+'" style="width:'+(w||70)+'px;text-align:right"'+(on||'')+'>';}
  var h='<div style="font-weight:700;font-size:13px;color:var(--navy);margin-bottom:6px">➕ Add-on Charges <span class="ms-note" style="font-weight:400">— filled automatically; change any figure or untick to remove</span></div>'
   +'<div class="scroll" style="overflow-x:auto"><table class="mb-table"><thead><tr><th style="width:30px"></th><th style="min-width:210px">Charge</th><th style="min-width:230px">Rate / basis (editable)</th><th style="width:120px">Amount ₹</th><th style="width:30px"></th></tr></thead><tbody>';
  // GST
  h+='<tr><td><input type="checkbox"'+(ad.gst.on?' checked':'')+' onchange="msAdSet(\'gst\',\'on\',this.checked)"></td><td>GST</td><td>'
    +'<input type="text" inputmode="decimal" value="'+msA(ad.gst.pct)+'" style="width:60px;text-align:right" oninput="msAdSet(\'gst\',\'pct\',this.value)"> % on '
    +'<select onchange="msAdSet(\'gst\',\'base\',this.value)"><option value="A"'+(ad.gst.base==='ABC'?'':' selected')+'>A (work)</option><option value="ABC"'+(ad.gst.base==='ABC'?' selected':'')+'>A + B + C</option></select></td><td class="calc-cell" id="adAmt_gst"></td><td></td></tr>';
  // Contingencies
  h+='<tr><td><input type="checkbox"'+(ad.cont.on?' checked':'')+' onchange="msAdSet(\'cont\',\'on\',this.checked)"></td><td>Contingencies</td><td>'
    +'<input type="text" inputmode="decimal" value="'+msA(ad.cont.val)+'" style="width:80px;text-align:right" oninput="msAdSet(\'cont\',\'val\',this.value)"> '
    +'<select onchange="msAdSet(\'cont\',\'mode\',this.value)"><option value="pct"'+(ad.cont.mode==='amt'?'':' selected')+'>% of A</option><option value="amt"'+(ad.cont.mode==='amt'?' selected':'')+'>₹ fixed amount</option></select></td><td class="calc-cell" id="adAmt_cont"></td><td></td></tr>';
  // Labour insurance
  h+='<tr><td><input type="checkbox"'+(ad.li.on?' checked':'')+' onchange="msAdSet(\'li\',\'on\',this.checked)"></td><td>Labour Insurance</td><td>'
    +'<label style="font-size:11px"><input type="checkbox"'+(ad.li.auto?' checked':'')+' onchange="msAdSet(\'li\',\'auto\',this.checked)"> Auto (up to ₹25 lakh = 0.5 %, above = 1 %)</label> &nbsp; '
    +'<input type="text" inputmode="decimal" value="'+msA(ad.li.auto?c.liPct:ad.li.pct)+'" style="width:60px;text-align:right"'+(ad.li.auto?' disabled':'')+' oninput="msAdSet(\'li\',\'pct\',this.value)"> % of A</td><td class="calc-cell" id="adAmt_li"></td><td></td></tr>';
  // extras
  (ad.extra||[]).forEach(function(x,i){
    h+='<tr style="background:#f1f8f1"><td></td><td><input type="text" value="'+msA(x.lbl)+'" placeholder="Extra charge name" oninput="msAdExtra('+i+',\'lbl\',this.value)"></td><td>'
      +'<input type="text" inputmode="decimal" value="'+msA(x.val)+'" style="width:80px;text-align:right" oninput="msAdExtra('+i+',\'val\',this.value)"> '
      +'<select onchange="msAdExtra('+i+',\'mode\',this.value)"><option value="pct"'+(x.mode==='amt'?'':' selected')+'>% of A</option><option value="amt"'+(x.mode==='amt'?' selected':'')+'>₹ fixed amount</option></select></td>'
      +'<td class="calc-cell" id="adAmt_x'+i+'"></td><td><button class="btn btn-danger btn-xs" onclick="msAdDelExtra('+i+')">✕</button></td></tr>';
  });
  h+='</tbody><tfoot>'
    +'<tr class="mb-total-row"><td colspan="3" style="text-align:right">Total add-on charges =</td><td class="calc-cell" id="adTot"></td><td></td></tr>'
    +'<tr class="mb-total-row"><td colspan="3" style="text-align:right"><strong>NET TOTAL = A + B + C + add-ons</strong></td><td class="calc-cell" id="adNet"></td><td></td></tr></tfoot></table></div>'
    +'<div class="flex gap8 mt8"><button class="btn btn-ghost btn-sm" onclick="msAdAddExtra()">＋ Extra charge</button><span class="ms-note">GST amount also goes to Form 47 (Add GST); the other charges are added to the payment in Form 47 Part IV.</span></div>';
  p.innerHTML=h;
  msAdRefresh();
}
function msAdRefresh(){
  var c=msAddonsCalc();
  c.rows.forEach(function(r){var e=document.getElementById('adAmt_'+r.k);if(e)e.textContent=r.on?fmt(r.amt):'—';});
  var t=document.getElementById('adTot');if(t)t.textContent=fmt(c.total);
  var n=document.getElementById('adNet');if(n)n.innerHTML='<strong>'+fmt(c.net)+'</strong>';
  try{calcForm47Mem();}catch(e){}
}
function msAdSet(k,f,v){
  var ad=msAdds(),o=ad[k];if(!o)return;
  if(f==='on'||f==='auto')o[f]=!!v;
  else if(f==='mode'||f==='base')o[f]=v;
  else o[f]=parseFloat(v)||0;
  if(f==='on'||f==='auto'||f==='mode'||f==='base')renderAddonsPanel();else msAdRefresh();
}
function msAdExtra(i,f,v){
  var x=msAdds().extra[i];if(!x)return;
  x[f]=(f==='lbl'||f==='mode')?v:(parseFloat(v)||0);
  if(f==='mode')renderAddonsPanel();else msAdRefresh();
}
function msAdAddExtra(){msAdds().extra.push({lbl:'',mode:'pct',val:0});renderAddonsPanel();}
function msAdDelExtra(i){msAdds().extra.splice(i,1);renderAddonsPanel();}
/* once the user types his own GST figure in Form 47, stop overwriting it (clear the box to go back to auto) */
(function(){
  function go(){var g=document.getElementById('f47GstAmt');if(g&&!g._msL){g._msL=1;g.addEventListener('input',function(e){if(e.isTrusted)g.dataset.user='1';});}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
})();
