// Maha PWD Estimator - Secondary Functions


/* ATP MAHA PWD v35 */
var FBCFG={apiKey:"AIzaSyCdH-k3hH1mYYcND0cBf7J2pLRG6xQydrU",authDomain:"atp-maha-pwd.firebaseapp.com",projectId:"atp-maha-pwd",storageBucket:"atp-maha-pwd.firebasestorage.app",messagingSenderId:"382409286731",appId:"1:382409286731:web:37daae9842bc3687bf99ce"};
var ADMIN_EMAIL="thongeaditya@gmail.com",UPI_ID="adityathonge@ybl",UPI_NAME="ATP MAHA PWD";
var CLDN="https://api.cloudinary.com/v1_1/duef21oux/image/upload",CLDN_P="jiko4lod";
var PAY_AMOUNT=5,FREE_LIMIT=5;
var CU=null,IS_PRO=false,DL_COUNT=0,OTP_CFM=null,OTP_TMR=null,AUTO_TMR=null;
var CUR_PAY_ID=null,CUR_EST_ID=null,SS_FILE=null,FB_RDY=false;
var _unsub_pay=null,_unsub_user=null;

function G(id){return document.getElementById(id);}
function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
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
  if(G("loginShell"))G("loginShell").style.display="flex";
  if(G("appShell"))G("appShell").style.display="none";
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
    var body=document.createElement('div');
    body.id='reqNotifList';
    body.style.cssText='padding:.9rem;overflow-y:auto;font-size:.78rem;flex:1;min-height:80px';
    body.textContent='Loading...';
    box.appendChild(hdr);
    box.appendChild(body);
    m.appendChild(box);
    document.body.appendChild(m);
  }
  m.style.display='flex';
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
function startReqListener(uid){
  if(REQ_UNSUB)REQ_UNSUB();
  if(!window.firebase||!firebase.firestore)return;
  var _prevCount=-1;
  REQ_UNSUB=firebase.firestore().collection("requests")
    .where("ownerUid","==",uid)
    .where("status","==","pending")
    .onSnapshot(function(snap){
      var newCount=snap.size;
      var badge=G("reqBadge");
      if(badge)badge.textContent=newCount>0?newCount:"";
      if(badge)badge.style.display=newCount>0?"inline-flex":"none";
      if(_prevCount>=0&&newCount>_prevCount){
        var newest="";
        snap.docChanges().forEach(function(ch){
          if(ch.type==="added")newest=ch.doc.data().estName||ch.doc.data().fromName||"";
        });
        showToast("\uD83D\uDD14 New request"+(newest?" for: "+newest:"!"),"info");
      }
      _prevCount=newCount;
    },function(e){REQ_UNSUB=null;});
}
function stopReqListener(){if(REQ_UNSUB){REQ_UNSUB();REQ_UNSUB=null;}}
firebase.auth().onAuthStateChanged(function(user){
    if(user){
      CU=user;
      startReqListener(user.uid);loadUserDoc();
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
        setTimeout(function(){
          var lt=sessionStorage.getItem('_lastTab');
          if(typeof goTab==="function")goTab(lt?parseInt(lt):0);
        },100);
        setTimeout(function(){autoLoad();},300);
        /* Auto-load cloud estimate list after login */
        setTimeout(function(){if(typeof loadCloudList==="function")loadCloudList();},800);
      }
    }
    else{
      CU=null;
      stopReqListener();
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

function loadAppCfg(){
  if(!window.firebase||!firebase.firestore)return;
  firebase.firestore().collection("config").doc("app").get().then(function(d){
    if(d.exists){
      if(d.data().payAmount)PAY_AMOUNT=d.data().payAmount;
      var _mb=G("maintBanner"),_md=d.data().maintenance||{};if(_mb){if(_md.active){var _mm=_md.message||"Scheduled maintenance in progress.";if(_md.from&&_md.to)_mm="🚧 Maintenance: "+_md.from+" – "+_md.to;G("maintMsg").textContent=_mm;_mb.classList.add("show");document.body.classList.add("has-maint");}else{_mb.classList.remove("show");document.body.classList.remove("has-maint");}}
      if(d.data().freeLimit)FREE_LIMIT=d.data().freeLimit;
      var pd=G("payAmtDisplay");if(pd)pd.innerHTML="&#8377;"+PAY_AMOUNT+" <small>/ download</small>";
      var fl=G("freeLimitTxt");if(fl)fl.textContent=FREE_LIMIT;
      var pr=G("priceTxt");if(pr)pr.textContent=PAY_AMOUNT;
      makeQR();
    }
  }).catch(function(){});
  /* Load CF_MAP from cloud */
  firebase.firestore().collection("config").doc("cfmap").get().then(function(d){
    if(d.exists&&d.data().cf){var cloud=d.data().cf;for(var k in cloud)CF_MAP[k]=cloud[k];
      if(typeof rCFTab==="function")rCFTab();if(typeof updateAll==="function")updateAll();}
  }).catch(function(){});
  /* Load Lead Chart (LL table) from cloud */
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
      docs.forEach(function(d){if(d.exists&&d.data().data)newSSR=newSSR.concat(d.data().data);});
      if(newSSR.length>0){for(var i=0;i<newSSR.length;i++)SSR[i]=newSSR[i];SSR.length=newSSR.length;}
    }).catch(function(){});
  }).catch(function(){});
}

function loadUserDoc(){
  if(!CU||!window.firebase||!firebase.firestore)return;
  /* Real-time listener — fires when admin updates freeLimit or isPro */
  if(_unsub_user){_unsub_user();_unsub_user=null;}
  _unsub_user=firebase.firestore().collection("users").doc(CU.uid).onSnapshot(function(d){
    if(!d.exists)return;
    var prev=FREE_LIMIT;
    IS_PRO=d.data().isPro||false;
    DL_COUNT=d.data().dlCount||0;
    if(d.data().freeLimit!=null)FREE_LIMIT=d.data().freeLimit;
    if(typeof renderHeader==="function")renderHeader();
    /* If freeLimit increased, notify user */
    if(FREE_LIMIT>prev&&prev>0)showToast("Payment verified! You can now download. ✅","success");
  },function(e){console.warn("User doc listener:",e.code);});
  firebase.firestore().collection("users").doc(CU.uid).get().then(function(d){
    if(d.exists){IS_PRO=d.data().isPro||false;DL_COUNT=d.data().dlCount||0;if(d.data().freeLimit!=null)FREE_LIMIT=d.data().freeLimit;}
    else{firebase.firestore().collection("users").doc(CU.uid).set({uid:CU.uid,phone:CU.phoneNumber||"",email:CU.email||"",name:CU.displayName||"",isPro:false,dlCount:0,createdAt:firebase.firestore.FieldValue.serverTimestamp()});}
    renderHeader();loadCloudList();
  }).catch(function(){});
}

function renderHeader(){
  var el=G("userHeaderDiv");if(!el)return;
  if(!CU){el.innerHTML="";return;}
  var nm=(CU.displayName||CU.phoneNumber||CU.email||"User").split(" ")[0];
  var rem=Math.max(0,FREE_LIMIT-DL_COUNT);
  el.innerHTML="<span class=\"uname\">\u{1F464} "+esc(nm)+"</span>"+(IS_PRO?"<span class=\"ubadge upro\">\u{1F48E} Pro</span>":"<span class=\"ubadge ufree\">\u{1F193} "+rem+" left</span>")+"<button class=\"ubtn\" id=\"reqBellBtn\" onclick=\"openReqPanel()\" style=\"position:relative;padding:.28rem .45rem\" title=\"Requests\">\u{1F514}<span id=\"reqBadge\" style=\"display:none;position:absolute;top:-4px;right:-4px;background:#e53935;color:#fff;border-radius:8px;min-width:14px;height:14px;font-size:.5rem;font-weight:900;line-height:14px;text-align:center;padding:0 2px;box-sizing:border-box\"></span></button>"+"<button class=\"ubtn\" onclick=\"doLogout()\">Logout</button>";
  var badge=G("dlCountBadge");
  if(badge){
    if(IS_PRO){badge.textContent="(💎 Pro)";}
    else if(rem>0){badge.textContent="("+rem+" free left)";}
    else{badge.textContent="(💳 Pay to download)";}
  }
  /* Show CF Table tab only for admin */
  var isAdm=CU&&CU.email===ADMIN_EMAIL;
  var t13=G("t13");if(t13)t13.style.display="";  /* CF Table for all users */
  var scb=G("saveCFCloudBtn");if(scb)scb.style.display=isAdm?"":"none";
  /* Show share app button when logged in */
  var sab=G("shareAppBtn");if(sab)sab.style.display=CU?"inline-flex":"none";sab&&(sab.style.alignItems="center");
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
function doLogout(){if(!confirm("Are you sure you want to log out?"))return;if(_unsub_pay){_unsub_pay();_unsub_pay=null;}if(_unsub_user){_unsub_user();_unsub_user=null;}firebase.auth().signOut();}

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
  if(IS_PRO)return true;if(DL_COUNT<FREE_LIMIT)return true;
  var pw=G("payWall");if(pw)pw.style.display="flex";
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
              DL_COUNT=d.data().dlCount||0;
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

function uploadCDN(file,folder,onP,onD,onE){
  var fd=new FormData();fd.append("file",file);fd.append("upload_preset",CLDN_P);fd.append("folder",folder);
  var xhr=new XMLHttpRequest();xhr.open("POST",CLDN,true);
  xhr.upload.onprogress=function(e){if(e.lengthComputable&&onP)onP(Math.round(e.loaded/e.total*100));};
  xhr.onload=function(){if(xhr.status===200)onD(JSON.parse(xhr.responseText).secure_url);else onE("Error "+xhr.status);};
  xhr.onerror=function(){onE("Network error");};xhr.send(fd);
}

function onSSfile(input){if(!input.files||!input.files[0])return;SS_FILE=input.files[0];var r=new FileReader();r.onload=function(e){var p=G("ssPreview");p.src=e.target.result;p.style.display="block";G("ssBtn").disabled=false;};r.readAsDataURL(SS_FILE);}
function onSSdrop(e){e.preventDefault();if(e.dataTransfer.files[0]){G("ssFile").files=e.dataTransfer.files;onSSfile(G("ssFile"));}}

function submitPay(){
  if(!SS_FILE){showE("ssErr","Upload screenshot first");return;}if(!CU){showToast("Login first","warn");return;}
  var btn=G("ssBtn");btn.disabled=true;btn.textContent="Uploading... 0%";hideE("ssErr");
  uploadCDN(SS_FILE,"atp-maha-pwd/payments/"+CU.uid,function(p){btn.textContent="Uploading... "+p+"%";},function(url){createPayRec(url);},function(err){console.log(err);createPayRec("");});
}

function createPayRec(ssURL){
  var db=firebase.firestore(),autoAt=new Date(Date.now()+15*60*1000).toISOString();
  db.collection("payments").add({uid:CU.uid,phone:CU.phoneNumber||"",email:CU.email||"",name:CU.displayName||CU.phoneNumber||"",amount:PAY_AMOUNT,upiId:UPI_ID,screenshotURL:ssURL,status:"pending",createdAt:firebase.firestore.FieldValue.serverTimestamp(),autoApproveAt:autoAt})
    .then(function(ref){CUR_PAY_ID=ref.id;showPayStat("pending");startAutoApprove(ref.id);showToast("Submitted! Pending verification ⏳","success");
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
  if(s==="pending"){if(G("statTitle"))G("statTitle").textContent="⏳ Pending...";if(G("statMsg"))G("statMsg").textContent="Admin verifying. Max 15 min.";}
  else if(s==="verified"){
    if(G("statTitle"))G("statTitle").textContent="✅ Verified!";
    if(G("statMsg"))G("statMsg").textContent="Download available now 🎉";
    clearInterval(AUTO_TMR);
    if(G("payWall"))G("payWall").style.display="none";
    showToast("Verified! Download now 🎉","success");
    /* Reload user doc so freeLimit and DL_COUNT are fresh from Firestore */
    if(CU&&window.firebase&&firebase.firestore){
      firebase.firestore().collection("users").doc(CU.uid).get().then(function(d){
        if(d.exists){
          IS_PRO=d.data().isPro||false;
          DL_COUNT=d.data().dlCount||0;
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

function cloudSave(){
  if(!CU){showToast("Login first","warn");return;}if(!window.firebase||!firebase.firestore){showToast("Offline","warn");return;}
  var db=firebase.firestore(),nm=((G("pName")||{value:""}).value||"").trim()||"Untitled";
  /* Compute grand total */
  var _g=0;try{var _A2=0;for(var _ii2=0;_ii2<(typeof items!=="undefined"?items:[]).length;_ii2++)_A2+=(items[_ii2].amount||0);var _S2=typeof gS==="function"?gS():{gst:0,cont:0,li:0,areaPct:0,extraRows:[]};var _roy2=typeof calcRoyTotal==="function"?calcRoyTotal(_S2):0;var _mtfEl2=G("mtfTotal");var _mtf2=_mtfEl2?Math.round(parseFloat(_mtfEl2.textContent)||0):0;var _specF2=_S2.areaPct>0?Math.round(_A2*_S2.areaPct/100):0;var _extT2=0;if(_S2.extraRows&&_S2.extraRows.length){for(var _ei2=0;_ei2<_S2.extraRows.length;_ei2++){if(_S2.extraRows[_ei2].pct>0)_extT2+=Math.round(_A2*_S2.extraRows[_ei2].pct/100);}}_g=(_A2+_roy2+_mtf2)+Math.round(_A2*_S2.gst/100)+Math.round(_A2*_S2.cont/100)+Math.round(_A2*_S2.li/100)+_specF2+_extT2;}catch(_ge2){}
  /* Collect Lead Map drawing data */
  var _leadMapData=null;
  try{
    if(typeof SP!=="undefined"&&SP){
      _leadMapData={shapes:JSON.parse(JSON.stringify(SP.shapes||[])),bgImgX:SP.bgImgX||0,bgImgY:SP.bgImgY||0,bgImgW:SP.bgImgW||0,bgImgH:SP.bgImgH||0};
      if(SP.bgImg){try{var _tc1=document.createElement("canvas");_tc1.width=SP.bgImgW||400;_tc1.height=SP.bgImgH||300;_tc1.getContext("2d").drawImage(SP.bgImg,0,0,_tc1.width,_tc1.height);_leadMapData.bgImgData=_tc1.toDataURL("image/jpeg",0.55);}catch(_e1){}}
    }
  }catch(_e2){}
  /* Collect Plan tab drawing data */
  var _planData=null;
  try{if(typeof window._getPlanData==="function")_planData=window._getPlanData();}catch(_e3){}
  var data={uid:CU.uid,name:nm,items:typeof items!=="undefined"?items:[],
    cover:{pReg:(G("pReg")||{value:""}).value,pCir:(G("pCir")||{value:""}).value,pDiv:(G("pDiv")||{value:""}).value,pSub:(G("pSub")||{value:""}).value,pName:(G("pName")||{value:""}).value},
    settings:{gst:pfN("sGST"),cont:pfN("sCont"),li:pfN("sLI"),royS:pfN("sRS"),royC:pfN("sRC")},
    lkm:(function(){var _lk={};if(typeof LCD!=="undefined"){for(var _i=0;_i<LCD.length;_i++){var _el=G("lkm_"+_i);if(_el)_lk[_i]=parseFloat(_el.value)||0;}}return _lk;})(),
    leadKm:(function(){var _lkf={};if(typeof LEAD_KM!=="undefined"){for(var _k3 in LEAD_KM)_lkf[_k3]=LEAD_KM[_k3];}return _lkf;})(),
    leadLoc:(function(){var _llf={};if(typeof LEAD_LOC!=="undefined"){for(var _l3 in LEAD_LOC)_llf[_l3]=LEAD_LOC[_l3];}return _llf;})(),
    mtfCosts:(function(){var _mc={};if(typeof mtfData!=="undefined"){for(var _mi2=0;_mi2<mtfData.length;_mi2++)_mc[mtfData[_mi2].sr]=mtfData[_mi2].cost;}return _mc;})(),
    steelRows:(typeof steelRows!=="undefined"?JSON.parse(JSON.stringify(steelRows)):[]),
    scSecs:(typeof scSecs!=="undefined"?JSON.parse(JSON.stringify(scSecs)):[]),
    extraRows:(typeof EXTRA_ROWS!=="undefined"?JSON.parse(JSON.stringify(EXTRA_ROWS)):[]),
    leadMapData:_leadMapData,planData:_planData,
    isPublic:true,grand:_g,updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
  var prm;
  if(CUR_EST_ID)prm=db.collection("estimates").doc(CUR_EST_ID).update(data);
  else{data.createdAt=firebase.firestore.FieldValue.serverTimestamp();data.collaborators=[];prm=db.collection("estimates").add(data).then(function(r){CUR_EST_ID=r.id;});}
  prm.then(function(){showToast("Saved ☁️","success");loadCloudList();}).catch(function(e){showToast("Save failed: "+e.message,"error");});
}

function loadCloudList(){
  var list=G("cloudEstList");if(!list)return;
  if(!CU||!window.firebase||!firebase.firestore){list.innerHTML="<div style='color:#aaa;font-size:.65rem;padding:.4rem'>Login required</div>";return;}
  list.innerHTML="<div style='color:#aaa;font-size:.65rem;padding:.4rem'>Loading...</div>";
  firebase.firestore().collection("estimates").where("uid","==",CU.uid).limit(50).get()
    .then(function(snap){
      var all=[];snap.forEach(function(d){all.push({id:d.id,d:d.data()});});
      all.sort(function(a,b){return(b.d.updatedAt?b.d.updatedAt.seconds:0)-(a.d.updatedAt?a.d.updatedAt.seconds:0);});
      if(!all.length){list.innerHTML="<div style='color:#aaa;font-size:.65rem;padding:.4rem;font-style:italic'>No saved estimates</div>";return;}
      list.innerHTML=all.map(function(item){
        var d=item.d,id=item.id,dt=d.updatedAt?new Date(d.updatedAt.seconds*1000).toLocaleDateString("en-IN"):"--",gr=d.grand?"&#8377;"+fmtN(d.grand):"";
        return "<div class='citem' onclick='loadEst(\""+id+"\")'>"+
          "<div class='cname'>"+esc(d.name||"Untitled")+"</div>"+
          "<div class='cmeta'>"+dt+(gr?" · "+gr:"")+"</div>"+
          "<button class='c-shr' onclick='event.stopPropagation();openShare(\""+id+"\")' title='Share'>🔗</button>"+
          "<button class='c-dl' onclick='event.stopPropagation();dlEst(\""+id+"\")' title='Download'>⬇️</button>"+
          "<button class='c-del' onclick='event.stopPropagation();delEst(\""+id+"\")''>🗑️</button></div>";
      }).join("");
    }).catch(function(e){list.innerHTML="<div style='color:red;font-size:.65rem'>Error: "+e.message+"</div>";});
}

function loadEst(docId){
  if(!window.firebase||!firebase.firestore)return;
  firebase.firestore().collection("estimates").doc(docId).get().then(function(d){
    if(!d.exists){showToast("Not found","error");return;}
    var data=d.data();CUR_EST_ID=docId;
    if(data.items)items=data.items;
    if(data.cover){["pReg","pCir","pDiv","pSub","pName"].forEach(function(k){var e=G(k);if(e&&data.cover[k]!=null)e.value=data.cover[k];});}
    if(data.settings){var ks=["gst","cont","li","royS","royC"];["sGST","sCont","sLI","sRS","sRC"].forEach(function(k,i){var e=G(k);if(e&&data.settings[ks[i]]!=null)e.value=data.settings[ks[i]];});}
    /* Restore lead KM and MTF test costs */
    if(data.leadKm){for(var _lk3 in data.leadKm){if(typeof LEAD_KM!=="undefined")LEAD_KM[_lk3]=data.leadKm[_lk3];}}
    if(data.leadLoc){for(var _ll3 in data.leadLoc){if(typeof LEAD_LOC!=="undefined")LEAD_LOC[_ll3]=data.leadLoc[_ll3];}}
    if(data.mtfCosts&&typeof mtfData!=="undefined"){for(var _rk3 in data.mtfCosts){var _rr3=mtfData.find(function(r){return r.sr===parseInt(_rk3)||r.sr===_rk3;});if(_rr3)_rr3.cost=parseFloat(data.mtfCosts[_rk3])||0;}}
    /* Restore steel calculator simple rows */
    if(data.steelRows&&typeof steelRows!=="undefined"){steelRows=JSON.parse(JSON.stringify(data.steelRows));if(typeof renderSteel==="function")renderSteel();}
    /* Restore advanced steel calculator sections (Footing 1, Footing 2, Column 1, Column 2 etc.) */
    if(data.scSecs&&typeof scSecs!=="undefined"){scSecs=JSON.parse(JSON.stringify(data.scSecs));if(data.scSecs.length){var _mxId3=0;data.scSecs.forEach(function(s){var n=parseInt((s.id||"0").toString().replace(/[^0-9]/g,""))||0;if(n>_mxId3)_mxId3=n;});if(typeof scUID!=="undefined")scUID=_mxId3;}if(typeof scRender==="function")scRender();}
    /* Rebuild lead chart first so lkm_ inputs exist, then populate them */
    if(typeof buildLCT==="function")buildLCT();
    if(data.lkm){for(var _ki in data.lkm){var _el2=G("lkm_"+_ki);if(_el2&&typeof onKmChange==="function"){_el2.value=data.lkm[_ki];onKmChange(parseInt(_ki));}}}
    if(typeof updateAll==="function")updateAll();if(typeof upCover==="function")upCover();if(typeof upMeta==="function")upMeta();if(typeof goTab==="function")goTab(0);
    /* Restore Plan tab drawing */
    if(data.planData&&typeof window._setPlanData==="function"){try{window._setPlanData(data.planData);}catch(_pe){}}
    /* Restore Lead Map drawing */
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
            pReg:((G("pReg")||{value:""}).value||"")},
          lkm:_lk,leadKm:(data.leadKm||{}),leadLoc:(data.leadLoc||{}),
          mtfCosts:(data.mtfCosts||{}),
          steelRows:(data.steelRows?JSON.parse(JSON.stringify(data.steelRows)):[]),
          scSecs:(data.scSecs?JSON.parse(JSON.stringify(data.scSecs)):[]),
          extraRows:(data.extraRows?JSON.parse(JSON.stringify(data.extraRows)):[]),
          items:typeof items!=="undefined"?items:[]};
        putStore(_ls);
        if(typeof renderSaveList==="function")renderSaveList();
        if(typeof renderHomeScreen==="function")renderHomeScreen();
        showToast("\u2705 Auto-saved to local storage","success");
      }
    }catch(_e){}
  });
}

function dlEst(docId){if(!canDownload())return;CUR_EST_ID=docId;loadEst(docId);setTimeout(function(){if(typeof printAll==="function")printAll();},600);}
function delEst(docId){if(!confirm("Delete this record?"))return;firebase.firestore().collection("estimates").doc(docId).delete().then(function(){if(CUR_EST_ID===docId)CUR_EST_ID=null;showToast("Deleted","info");loadCloudList();});}
function newEstimate(){if(!confirm("Clear all data and start a new estimate?"))return;CUR_EST_ID=null;if(typeof items!=="undefined")items=[];["pReg","pCir","pDiv","pSub","pName"].forEach(function(k){var e=G(k);if(e)e.value="";});if(typeof buildLCT==="function")buildLCT();if(typeof updateAll==="function")updateAll();if(typeof goTab==="function")goTab(0);showToast("New estimate ready ✅","success");}

/* ADMIN DASHBOARD */
var AD={pays:[],users:[],ests:[],qrFile:null};
function aDt(ts){return ts?new Date(ts.seconds*1000).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}):"—";}
function doAdminLogout(){
  if(!confirm('Admin logout करायचे आहे का?'))return;
  sessionStorage.removeItem('_adminOpen');
  if(_unsub_pay){_unsub_pay();_unsub_pay=null;}
  if(_unsub_user){_unsub_user();_unsub_user=null;}
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
  if(G("aStats"))G("aStats").innerHTML="<div class='astat'><div class='aloading'><span class='spin2'></span></div></div>";
  var db=firebase.firestore();
  function safeGet(col,q){return q.catch(function(){return {forEach:function(){}};});}
  Promise.all([
    safeGet("pay",db.collection("payments").orderBy("createdAt","desc").limit(300).get()),
    safeGet("usr",db.collection("users").limit(500).get()),
    safeGet("est",db.collection("estimates").orderBy("updatedAt","desc").limit(300).get())
  ]).then(function(res){
    AD.pays=[];res[0].forEach(function(d){AD.pays.push(Object.assign({_id:d.id},d.data()));});
    AD.users=[];res[1].forEach(function(d){AD.users.push(Object.assign({_id:d.id},d.data()));});
    AD.ests=[];res[2].forEach(function(d){AD.ests.push(Object.assign({_id:d.id},d.data()));});
    if(!AD.pays.length&&!AD.users.length){
      showToast("Firestore rules — update in Firebase Console","warn");
      if(G("aStats"))G("aStats").innerHTML="<div class='astat rd' style='grid-column:1/-1;padding:.8rem'><div class='astn' style='font-size:.8rem'>&#9888; Firestore Rules Issue</div><div class='astl'>Firebase Console → Firestore → Rules → set: allow read, write: if request.auth != null;<br><br><button onclick='aLoadAll()' style='padding:.3rem .7rem;background:#1565c0;color:#fff;border:none;border-radius:4px;font-size:.65rem;cursor:pointer'>&#128260; Retry</button></div></div>";
      return;
    }
    aRenderStats();aRenderPays(AD.pays);aRenderUsers(AD.users);aRenderEsts(AD.ests);aRenderRev();showToast("Loaded ✅","success");
  }).catch(function(e){
    showToast("Permission error — update Firestore rules","error");
    if(G("aStats"))G("aStats").innerHTML="<div class='astat rd' style='grid-column:1/-1'><div class='astn' style='font-size:.75rem'>❌ "+e.message+"</div><div class='astl'>Update Firestore security rules to allow admin access</div></div>";
  });
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

function aVerify(payId,uid){
  var inp=prompt("How many downloads to give this user?","5");
  if(inp===null)return;
  var PAID_DL=parseInt(inp,10);
  if(isNaN(PAID_DL)||PAID_DL<1){showToast("Enter a valid number","warn");return;}
  var db=firebase.firestore();
  /* Step 1: mark payment verified */
  db.collection("payments").doc(payId).update({
    status:"verified",
    verifiedAt:firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){
    if(!uid){showToast("Verified ✅","success");aLoadAll();return;}
    /* Step 2: fetch user's current dlCount to set correct freeLimit */
    db.collection("users").doc(uid).get().then(function(ud){
      var curDL=ud.exists?(ud.data().dlCount||0):0;
      var curLimit=ud.exists&&ud.data().freeLimit!=null?ud.data().freeLimit:FREE_LIMIT;
      /* New limit = current limit + PAID_DL (so user can do PAID_DL more downloads) */
      var newLimit=curLimit+PAID_DL;
      db.collection("users").doc(uid).update({
        freeLimit:newLimit
      }).then(function(){
        showToast("Verified ✅ — User gets +"+PAID_DL+" downloads (new limit: "+newLimit+")","success");
        aLoadAll();
      }).catch(function(e){showToast("Verified but limit update failed: "+e.message,"warn");aLoadAll();});
    }).catch(function(){
      /* Fallback: just increment */
      db.collection("users").doc(uid).update({
        freeLimit:firebase.firestore.FieldValue.increment(PAID_DL)
      }).then(function(){showToast("Verified ✅ — User gets +"+PAID_DL+" downloads","success");aLoadAll();})
      .catch(function(){showToast("Verified ✅","success");aLoadAll();});
    });
  }).catch(function(e){showToast("Error: "+e.message,"error");});
}
function aReject(payId){if(!confirm("Reject?"))return;firebase.firestore().collection("payments").doc(payId).update({status:"rejected",rejectedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){showToast("Rejected","warn");aLoadAll();}).catch(function(e){showToast("Error: "+e.message,"error");});}

function aViewPay(payId){
  var p=AD.pays.find(function(x){return x._id===payId;});if(!p)return;
  var h=pRw("Name",p.name||"—")+pRw("Phone",p.phone||"—")+pRw("Amount","₹"+(p.amount||PAY_AMOUNT))+pRw("Status",p.status)+pRw("Time",aDt(p.createdAt));
  if(p.screenshotURL)h+="<div style='margin:.7rem 0'><div style='font-size:.65rem;font-weight:800;color:#888;margin-bottom:.3rem'>SCREENSHOT:</div><img src='"+esc(p.screenshotURL)+"' class='pdss' alt='' onerror='this.style.display=\"none\"'></div>";
  else h+="<div style='background:#f8f6f2;border-radius:6px;padding:.8rem;text-align:center;color:#aaa;font-size:.72rem;margin:.7rem 0'>No screenshot</div>";
  if(p.status==="pending")h+="<div class='actrow'><button class='xbtn xgr' onclick='aVerify(\""+payId+"\",\""+esc(p.uid||"")+"\");document.getElementById(\"payDetailModal\").style.display=\"none\"' style='flex:1;padding:.55rem'>✅ Verify</button><button class='xbtn xrd' onclick='aReject(\""+payId+"\");document.getElementById(\"payDetailModal\").style.display=\"none\"' style='flex:1;padding:.55rem'>❌ Reject</button></div>";
  if(G("pdBody"))G("pdBody").innerHTML=h;if(G("payDetailModal"))G("payDetailModal").style.display="flex";
}
function pRw(l,v){return "<div class='pdinforow'><span class='pdlbl'>"+l+"</span><span class='pdval'>"+esc(String(v))+"</span></div>";}

var _usrSortAsc=false;
function aRenderUsers(users){
  if(!G("usrTbody"))return;
  if(!users.length){G("usrTbody").innerHTML="<tr><td colspan='7' style='text-align:center;color:#aaa;padding:2rem'>No users</td></tr>";return;}
  G("usrTbody").innerHTML=users.map(function(u){
    return "<tr>"+
      "<td><strong>"+esc(u.name||"\u2014")+"</strong></td>"+
      "<td style='font-size:.75rem;font-weight:600;color:#333'>"+esc(u.phone||"\u2014")+"</td>"+
      "<td style='font-size:.7rem;color:#555'>"+esc(u.email||"\u2014")+"</td>"+
      "<td style='text-align:center;font-weight:700'>"+(u.dlCount||0)+" / "+(u.freeLimit!=null?u.freeLimit:FREE_LIMIT)+"</td>"+
      "<td>"+(u.isPro?"<span class='abp'>&#128142; Pro</span>":"<span class='abf'>&#127358; Free</span>")+"</td>"+
      "<td style='font-size:.65rem;color:#888'>"+aDt(u.createdAt)+"</td>"+
      "<td style='display:flex;gap:.3rem'>"+
        "<button class='xbtn xgr' data-uid='"+u._id+"' data-nm='"+esc(u.name||u.email||"")+"' onclick='aGrant(this.dataset.uid,this.dataset.nm)'>&#127873; Pro</button>"+
        "<button class='xbtn xbl' data-uid='"+u._id+"' data-nm='"+esc(u.name||u.email||"")+"' onclick='aSetFree(this.dataset.uid,this.dataset.nm)'>&#127358;</button>"+
        "<button class='xbtn xrd' data-uid='"+u._id+"' data-nm='"+esc(u.name||u.email||"")+"' onclick='aDeleteUser(this.dataset.uid,this.dataset.nm)'>&#128465;</button>"+
      "</td></tr>";
  }).join("");
}
function fUsers(){var q=(G("usrQ").value||"").toLowerCase();if(!q){aRenderUsers(AD.users);return;}aRenderUsers(AD.users.filter(function(u){return(u.name||"").toLowerCase().includes(q)||(u.phone||"").includes(q)||(u.email||"").toLowerCase().includes(q);}));}
function aSortUsers(){_usrSortAsc=!_usrSortAsc;var sorted=AD.users.slice().sort(function(a,b){var ta=a.createdAt?a.createdAt.seconds:0,tb=b.createdAt?b.createdAt.seconds:0;return _usrSortAsc?ta-tb:tb-ta;});var btn=G("usrSortBtn");if(btn)btn.textContent=_usrSortAsc?"&#128197; Joined \u2191 Oldest":"&#128197; Joined \u2193 Newest";aRenderUsers(sorted);}
function aDeleteUser(uid,name){
  if(!confirm("DELETE user \""+name+"\"?\n\nYamuळे Firestore madhe tyacha data delete hoil.\n(Firebase Auth account vegalya kadhave lagel — Console varun)\n\nPudhe chala?"))return;
  firebase.firestore().collection("users").doc(uid).delete()
    .then(function(){showToast("User \""+name+"\" deleted \uD83D\uDDD1\uFE0F","info");aLoadAll();})
    .catch(function(e){showToast("Error: "+e.message,"error");});
}
function aGrant(uid,name){if(!confirm("Grant Pro to "+name+"?"))return;firebase.firestore().collection("users").doc(uid).update({isPro:true}).then(function(){showToast("Pro granted 🎉","success");aLoadAll();}).catch(function(e){showToast("Error: "+e.message,"error");});}
function aSetFree(uid,name){var v=prompt("Free downloads for "+name+" (global: "+FREE_LIMIT+"):","5");if(v===null)return;var n=parseInt(v);if(isNaN(n)||n<0){showToast("Invalid","error");return;}firebase.firestore().collection("users").doc(uid).update({freeLimit:n}).then(function(){showToast("Set free="+n+" for "+name,"success");aLoadAll();}).catch(function(e){showToast("Error: "+e.message,"error");});}

function aRenderEsts(ests){
  if(!G("estTbody"))return;
  if(!ests.length){G("estTbody").innerHTML="<tr><td colspan='5' style='text-align:center;color:#aaa;padding:2rem'>No estimates</td></tr>";return;}
  G("estTbody").innerHTML=ests.map(function(e){var u=AD.users.find(function(x){return x._id===e.uid||x.uid===e.uid;});return "<tr><td style='max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700'>"+esc(e.name||"Untitled")+"</td><td style='font-size:.7rem;color:#666'>"+esc(u?u.name||u.phone||"":"?")+"</td><td style='text-align:center'>"+(e.items?e.items.length:0)+"</td><td style='font-weight:700;color:#18602f'>₹"+fmtN(e.grand)+"</td><td style='font-size:.65rem;color:#888'>"+aDt(e.updatedAt)+"</td></tr>";}).join("");}
function fEsts(){var q=(G("estQ").value||"").toLowerCase();if(!q){aRenderEsts(AD.ests);return;}aRenderEsts(AD.ests.filter(function(e){return(e.name||"").toLowerCase().includes(q);}));}

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
function aLoadSettings(){if(!window.firebase||!firebase.firestore)return;firebase.firestore().collection("config").doc("app").get().then(function(d){if(d.exists){if(d.data().payAmount&&G("setPriceVal"))G("setPriceVal").value=d.data().payAmount;if(d.data().freeLimit&&G("setFreeVal"))G("setFreeVal").value=d.data().freeLimit;var md=d.data().maintenance||{};if(G("maintActive"))G("maintActive").value=md.active?"true":"false";if(G("maintMsgInp"))G("maintMsgInp").value=md.message||"";if(G("mantFrom"))G("maintFrom").value=md.from||"";if(G("maintTo"))G("maintTo").value=md.to||"";}}).catch(function(){});}

function saveAppSetting(type){
  var val;
  if(type==="price"){val=parseInt(G("setPriceVal").value);if(isNaN(val)||val<1){showToast("Invalid","error");return;}firebase.firestore().collection("config").doc("app").set({payAmount:val},{merge:true}).then(function(){PAY_AMOUNT=val;showToast("Price=₹"+val,"success");makeQR();var pd=G("payAmtDisplay");if(pd)pd.innerHTML="&#8377;"+val+" <small>/ download</small>";}).catch(function(e){showToast("Error: "+e.message,"error");});}
  else{val=parseInt(G("setFreeVal").value);if(isNaN(val)||val<0){showToast("Invalid","error");return;}firebase.firestore().collection("config").doc("app").set({freeLimit:val},{merge:true}).then(function(){FREE_LIMIT=val;showToast("Free="+val,"success");renderHeader();}).catch(function(e){showToast("Error: "+e.message,"error");});}
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

function aShowSec(sec){["pay","users","ests","settings","loginpage","ssr","lead"].forEach(function(s){var e=G("asec-"+s);if(e)e.style.display=s===sec?"block":"none";});document.querySelectorAll(".asectab").forEach(function(t,i){t.classList.toggle("on",["pay","users","ests","settings","loginpage","ssr","lead"][i]===sec);});if(sec==="settings"){aLoadCurQR();aLoadSettings();}if(sec==="loginpage"){lpLoadAdmin();}if(sec==="ssr"){aRenderSSR();}if(sec==="lead"){aRenderLead();}}

function aDlCSV(type){
  var rows,fn;
  if(type==="pay"){rows=[["Name","Phone","Amount","Status","Time"]];AD.pays.forEach(function(p){rows.push([p.name||"",p.phone||"",p.amount||PAY_AMOUNT,p.status,aDt(p.createdAt)]);});fn="payments.csv";}
  else{rows=[["Name","Phone/Email","Downloads","Free Limit","Status","Joined"]];AD.users.forEach(function(u){rows.push([u.name||"",u.phone||u.email||"",u.dlCount||0,u.freeLimit!=null?u.freeLimit:FREE_LIMIT,u.isPro?"Pro":"Free",aDt(u.createdAt)]);});fn="users.csv";}
  var csv=rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(",");}).join("\n");
  var a=document.createElement("a");a.href="data:text/csv;charset=utf-8,\ufeff"+encodeURIComponent(csv);a.download=fn;a.click();showToast(fn+" downloaded","success");
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
          sLI:(G('sLI')||{value:0}).value,sRS:(G('sRS')||{value:0}).value,sRC:(G('sRC')||{value:0}).value},
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
    var lk=est.lkm||{};
    for(var ki in lk){var el2=document.getElementById('lkm_'+ki);if(el2&&typeof onKmChange==='function'){el2.value=lk[ki];onKmChange(parseInt(ki));}}
    /* Restore MTF costs from autosave */
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
   p0 (Cover) → p8 (General Abstract) → p3 (Abstract) → p4 (Rate Analysis)
   → p5 (Measurement) → p1 (Lead Chart) → p12 (Lead Map) → p6 (Consumption)
   → p7 (Royalty) → p11 (Testing) → p13 (CF Table) → p18 (Plan) → p9 (Steel Calc) → p16 (Documents) → p17 (Schedules) */
var PRINT_ORDER=["p0","p8","p3","p4","p5","p1","p12","p6","p7","p11","p13","p18","p9"];

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
  PRINT_ORDER.forEach(function(id){
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

function _restorePrintOrder(){
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
    var newName=window.prompt('Print झाले \u2705\nहे estimate वेगळ्या नावाने save करायचे का?\nनाव द्या (रिकामे सोडल्यास "'+nm+'" वापरले जाईल):','');
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
  if(typeof CU!=="undefined"&&CU&&typeof IS_PRO!=="undefined"&&!IS_PRO){
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
        if(rowEl)rowEl.className=kmV>0?"":"lc-row-zero";
      }
    }
  }catch(e){}

  /* Sync canvas to print image */
  try{var _cv=document.getElementById("spCanvas");var _ci=document.getElementById("spCanvasPrint");if(_cv&&_ci){_ci.src=_cv.toDataURL("image/png");}}catch(_ce){}
  /* Sync Plan canvas to print image — redraw first so canvas is never blank */
  try{
    if(typeof planRedraw==="function")planRedraw();
    var _pc=document.getElementById("planCanvas");
    var _pi=document.getElementById("planCanvasPrint");
    if(_pc&&_pi){_pi.src=_pc.toDataURL("image/png");}
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

function doExportExcel(){
  if(typeof canDownload==="function"&&!canDownload())return;
  _doCountDownload();
  _prepPrint();
  try{
    var wb=XLSX.utils.book_new();
    var nm=((R("pName")||{}).value||"New Work").trim()||"New Work";

    function tbToSheet(tbId){
      var tb=R(tbId);if(!tb)return null;
      var data=[];
      tb.closest("table")?tb.closest("table").querySelectorAll("tr").forEach(function(tr){
        var row=[];
        tr.querySelectorAll("td,th").forEach(function(td){
          if(!td.closest(".noprt"))row.push(td.innerText.replace(/[\r\n]+/g," ").trim());
        });
        if(row.some(function(x){return x!="";}))data.push(row);
      }):null;
      return data.length?XLSX.utils.aoa_to_sheet(data):null;
    }

    /* 1. Main Sheet - work details */
    var p0=R("p0");
    if(p0){
      var mainData=[["Maha PWD Estimator - Work Details"],[""]];
      p0.querySelectorAll("input,textarea,select").forEach(function(el){
        var lbl=el.placeholder||el.id||"";
        var val=el.value||"";
        if(val.trim())mainData.push([lbl,val]);
      });
      /* Add summary rows */
      mainData.push([""],["Name of Work",nm]);
      var hTot=R("hTot");if(hTot)mainData.push(["Grand Total",hTot.textContent]);
      var hIt=R("hIt");if(hIt)mainData.push(["Total Items",hIt.textContent]);
      var wsMain=XLSX.utils.aoa_to_sheet(mainData);
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

    /* 7. General Abstract */
    var wsFe=tbToSheet("feTb");
    if(wsFe)XLSX.utils.book_append_sheet(wb,wsFe,"General Abstract");

    XLSX.writeFile(wb,nm+".xlsx");
    showToast("Excel downloaded! 📊","success");
  }catch(e){
    showToast("Excel error: "+e.message,"error");
    console.error(e);
  }
}
function G(id){return document.getElementById(id);}
function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
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
  if(G("loginShell"))G("loginShell").style.display="flex";
  if(G("appShell"))G("appShell").style.display="none";
  lpLoad();
  if(!window.firebase||!firebase.auth){
    showToast("Firebase not available — check internet","error");
    return;
  }
  loadAppCfg();loadAdminQR();
  loadQR(makeQR);
});

function loadAppCfg(){
  if(!window.firebase||!firebase.firestore)return;
  firebase.firestore().collection("config").doc("app").get().then(function(d){
    if(d.exists){
      if(d.data().payAmount)PAY_AMOUNT=d.data().payAmount;
      if(d.data().freeLimit)FREE_LIMIT=d.data().freeLimit;
      var pd=G("payAmtDisplay");if(pd)pd.innerHTML="&#8377;"+PAY_AMOUNT+" <small>/ download</small>";
      var fl=G("freeLimitTxt");if(fl)fl.textContent=FREE_LIMIT;
      var pr=G("priceTxt");if(pr)pr.textContent=PAY_AMOUNT;
      makeQR();
    }
  }).catch(function(){});
  /* Load CF_MAP from cloud */
  firebase.firestore().collection("config").doc("cfmap").get().then(function(d){
    if(d.exists&&d.data().cf){var cloud=d.data().cf;for(var k in cloud)CF_MAP[k]=cloud[k];
      if(typeof rCFTab==="function")rCFTab();if(typeof updateAll==="function")updateAll();}
  }).catch(function(){});
  /* Load Lead Chart (LL table) from cloud */
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
      docs.forEach(function(d){if(d.exists&&d.data().data)newSSR=newSSR.concat(d.data().data);});
      if(newSSR.length>0){for(var i=0;i<newSSR.length;i++)SSR[i]=newSSR[i];SSR.length=newSSR.length;}
    }).catch(function(){});
  }).catch(function(){});
}

function loadUserDoc(){
  if(!CU||!window.firebase||!firebase.firestore)return;
  /* Real-time listener — fires when admin updates freeLimit or isPro */
  if(_unsub_user){_unsub_user();_unsub_user=null;}
  _unsub_user=firebase.firestore().collection("users").doc(CU.uid).onSnapshot(function(d){
    if(!d.exists)return;
    var prev=FREE_LIMIT;
    IS_PRO=d.data().isPro||false;
    DL_COUNT=d.data().dlCount||0;
    if(d.data().freeLimit!=null)FREE_LIMIT=d.data().freeLimit;
    if(typeof renderHeader==="function")renderHeader();
    /* If freeLimit increased, notify user */
    if(FREE_LIMIT>prev&&prev>0)showToast("Payment verified! You can now download. ✅","success");
  },function(e){console.warn("User snap2:",e.code);});
  firebase.firestore().collection("users").doc(CU.uid).get().then(function(d){
    if(d.exists){IS_PRO=d.data().isPro||false;DL_COUNT=d.data().dlCount||0;if(d.data().freeLimit!=null)FREE_LIMIT=d.data().freeLimit;}
    else{firebase.firestore().collection("users").doc(CU.uid).set({uid:CU.uid,phone:CU.phoneNumber||"",email:CU.email||"",name:CU.displayName||"",isPro:false,dlCount:0,createdAt:firebase.firestore.FieldValue.serverTimestamp()});}
    renderHeader();loadCloudList();
  }).catch(function(){});
}

function renderHeader(){
  var el=G("userHeaderDiv");if(!el)return;
  if(!CU){el.innerHTML="";return;}
  var nm=(CU.displayName||CU.phoneNumber||CU.email||"User").split(" ")[0];
  var rem=Math.max(0,FREE_LIMIT-DL_COUNT);
  el.innerHTML="<span class=\"uname\">👤 "+esc(nm)+"</span>"+(IS_PRO?"<span class=\"ubadge upro\">💎 Pro</span>":"<span class=\"ubadge ufree\">🆓 "+rem+" left</span>")+"<button class=\"ubtn\" onclick=\"doLogout()\">Logout</button>";
  var badge=G("dlCountBadge");
  if(badge){
    if(IS_PRO){badge.textContent="(💎 Pro)";}
    else if(rem>0){badge.textContent="("+rem+" free left)";}
    else{badge.textContent="(💳 Pay to download)";}
  }
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
function doLogout(){if(!confirm("Are you sure you want to log out?"))return;if(_unsub_pay){_unsub_pay();_unsub_pay=null;}if(_unsub_user){_unsub_user();_unsub_user=null;}firebase.auth().signOut();}

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
  if(IS_PRO)return true;if(DL_COUNT<FREE_LIMIT)return true;
  var pw=G("payWall");if(pw)pw.style.display="flex";
  if(G("upSec"))G("upSec").style.display="block";if(G("statSec"))G("statSec").style.display="none";
  var pi=G("ssPreview");if(pi){pi.src="";pi.style.display="none";}
  if(G("ssBtn"))G("ssBtn").disabled=true;SS_FILE=null;CUR_PAY_ID=null;loadAdminQR();return false;
}

function uploadCDN(file,folder,onP,onD,onE){
  var fd=new FormData();fd.append("file",file);fd.append("upload_preset",CLDN_P);fd.append("folder",folder);
  var xhr=new XMLHttpRequest();xhr.open("POST",CLDN,true);
  xhr.upload.onprogress=function(e){if(e.lengthComputable&&onP)onP(Math.round(e.loaded/e.total*100));};
  xhr.onload=function(){if(xhr.status===200)onD(JSON.parse(xhr.responseText).secure_url);else onE("Error "+xhr.status);};
  xhr.onerror=function(){onE("Network error");};xhr.send(fd);
}

function onSSfile(input){if(!input.files||!input.files[0])return;SS_FILE=input.files[0];var r=new FileReader();r.onload=function(e){var p=G("ssPreview");p.src=e.target.result;p.style.display="block";G("ssBtn").disabled=false;};r.readAsDataURL(SS_FILE);}
function onSSdrop(e){e.preventDefault();if(e.dataTransfer.files[0]){G("ssFile").files=e.dataTransfer.files;onSSfile(G("ssFile"));}}

function submitPay(){
  if(!SS_FILE){showE("ssErr","Upload screenshot first");return;}if(!CU){showToast("Login first","warn");return;}
  var btn=G("ssBtn");btn.disabled=true;btn.textContent="Uploading... 0%";hideE("ssErr");
  uploadCDN(SS_FILE,"atp-maha-pwd/payments/"+CU.uid,function(p){btn.textContent="Uploading... "+p+"%";},function(url){createPayRec(url);},function(err){console.log(err);createPayRec("");});
}

function createPayRec(ssURL){
  var db=firebase.firestore(),autoAt=new Date(Date.now()+15*60*1000).toISOString();
  db.collection("payments").add({uid:CU.uid,phone:CU.phoneNumber||"",email:CU.email||"",name:CU.displayName||CU.phoneNumber||"",amount:PAY_AMOUNT,upiId:UPI_ID,screenshotURL:ssURL,status:"pending",createdAt:firebase.firestore.FieldValue.serverTimestamp(),autoApproveAt:autoAt})
    .then(function(ref){CUR_PAY_ID=ref.id;showPayStat("pending");startAutoApprove(ref.id);showToast("Submitted! Pending verification ⏳","success");
      /* Real-time listener: notify user when admin verifies */
      if(window.firebase&&firebase.firestore){
        firebase.firestore().collection("payments").doc(ref.id).onSnapshot(function(d){
          if(!d.exists)return;var st=d.data().status;
          if(st==="verified")showPayStat("verified");
          else if(st==="rejected")showPayStat("rejected");
        });
      }
    })
    .catch(function(e){G("ssBtn").disabled=false;G("ssBtn").textContent="📤 Submit Screenshot";showToast("Error: "+e.message,"error");});
}

function showPayStat(s){
  if(G("upSec"))G("upSec").style.display="none";if(G("statSec"))G("statSec").style.display="block";
  var box=G("statBox");if(box)box.className="pstatbox "+s;
  if(s==="pending"){if(G("statTitle"))G("statTitle").textContent="⏳ Pending...";if(G("statMsg"))G("statMsg").textContent="Admin verifying. Max 15 min.";}
  else if(s==="verified"){
    if(G("statTitle"))G("statTitle").textContent="✅ Verified!";
    if(G("statMsg"))G("statMsg").textContent="Download available now 🎉";
    clearInterval(AUTO_TMR);
    if(G("payWall"))G("payWall").style.display="none";
    showToast("Verified! Download now 🎉","success");
    /* Reload user doc so freeLimit and DL_COUNT are fresh from Firestore */
    if(CU&&window.firebase&&firebase.firestore){
      firebase.firestore().collection("users").doc(CU.uid).get().then(function(d){
        if(d.exists){
          IS_PRO=d.data().isPro||false;
          DL_COUNT=d.data().dlCount||0;
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

function cloudSave(){
  if(!CU){showToast("Login first","warn");return;}if(!window.firebase||!firebase.firestore){showToast("Offline","warn");return;}
  var db=firebase.firestore(),nm=((G("pName")||{value:""}).value||"").trim()||"Untitled";
  /* Compute grand total */
  var _g=0;try{var _A2=0;for(var _ii2=0;_ii2<(typeof items!=="undefined"?items:[]).length;_ii2++)_A2+=(items[_ii2].amount||0);var _S2=typeof gS==="function"?gS():{gst:0,cont:0,li:0,areaPct:0,extraRows:[]};var _roy2=typeof calcRoyTotal==="function"?calcRoyTotal(_S2):0;var _mtfEl2=G("mtfTotal");var _mtf2=_mtfEl2?Math.round(parseFloat(_mtfEl2.textContent)||0):0;var _specF2=_S2.areaPct>0?Math.round(_A2*_S2.areaPct/100):0;var _extT2=0;if(_S2.extraRows&&_S2.extraRows.length){for(var _ei2=0;_ei2<_S2.extraRows.length;_ei2++){if(_S2.extraRows[_ei2].pct>0)_extT2+=Math.round(_A2*_S2.extraRows[_ei2].pct/100);}}_g=(_A2+_roy2+_mtf2)+Math.round(_A2*_S2.gst/100)+Math.round(_A2*_S2.cont/100)+Math.round(_A2*_S2.li/100)+_specF2+_extT2;}catch(_ge2){}
  /* Collect Lead Map drawing data */
  var _leadMapData=null;
  try{
    if(typeof SP!=="undefined"&&SP){
      _leadMapData={shapes:JSON.parse(JSON.stringify(SP.shapes||[])),bgImgX:SP.bgImgX||0,bgImgY:SP.bgImgY||0,bgImgW:SP.bgImgW||0,bgImgH:SP.bgImgH||0};
      if(SP.bgImg){try{var _tc2=document.createElement("canvas");_tc2.width=SP.bgImgW||400;_tc2.height=SP.bgImgH||300;_tc2.getContext("2d").drawImage(SP.bgImg,0,0,_tc2.width,_tc2.height);_leadMapData.bgImgData=_tc2.toDataURL("image/jpeg",0.55);}catch(_e4){}}
    }
  }catch(_e5){}
  /* Collect Plan tab drawing data */
  var _planData=null;
  try{if(typeof window._getPlanData==="function")_planData=window._getPlanData();}catch(_e6){}
  var data={uid:CU.uid,name:nm,items:typeof items!=="undefined"?items:[],
    cover:{pReg:(G("pReg")||{value:""}).value,pCir:(G("pCir")||{value:""}).value,pDiv:(G("pDiv")||{value:""}).value,pSub:(G("pSub")||{value:""}).value,pName:(G("pName")||{value:""}).value},
    settings:{gst:pfN("sGST"),cont:pfN("sCont"),li:pfN("sLI"),royS:pfN("sRS"),royC:pfN("sRC")},
    lkm:(function(){var _lk={};if(typeof LCD!=="undefined"){for(var _i=0;_i<LCD.length;_i++){var _el=G("lkm_"+_i);if(_el)_lk[_i]=parseFloat(_el.value)||0;}}return _lk;})(),
    leadKm:(function(){var _lkf={};if(typeof LEAD_KM!=="undefined"){for(var _k3 in LEAD_KM)_lkf[_k3]=LEAD_KM[_k3];}return _lkf;})(),
    leadLoc:(function(){var _llf={};if(typeof LEAD_LOC!=="undefined"){for(var _l3 in LEAD_LOC)_llf[_l3]=LEAD_LOC[_l3];}return _llf;})(),
    mtfCosts:(function(){var _mc={};if(typeof mtfData!=="undefined"){for(var _mi2=0;_mi2<mtfData.length;_mi2++)_mc[mtfData[_mi2].sr]=mtfData[_mi2].cost;}return _mc;})(),
    steelRows:(typeof steelRows!=="undefined"?JSON.parse(JSON.stringify(steelRows)):[]),
    scSecs:(typeof scSecs!=="undefined"?JSON.parse(JSON.stringify(scSecs)):[]),
    extraRows:(typeof EXTRA_ROWS!=="undefined"?JSON.parse(JSON.stringify(EXTRA_ROWS)):[]),
    leadMapData:_leadMapData,planData:_planData,
    grand:_g,updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
  var prm;
  if(CUR_EST_ID)prm=db.collection("estimates").doc(CUR_EST_ID).update(data);
  else{data.createdAt=firebase.firestore.FieldValue.serverTimestamp();data.collaborators=[];prm=db.collection("estimates").add(data).then(function(r){CUR_EST_ID=r.id;});}
  prm.then(function(){showToast("Saved ☁️","success");loadCloudList();}).catch(function(e){showToast("Save failed: "+e.message,"error");});
}

function loadCloudList(){
  var list=G("cloudEstList");if(!list)return;
  if(!CU||!window.firebase||!firebase.firestore){list.innerHTML="<div style='color:#aaa;font-size:.65rem;padding:.4rem'>Login required</div>";return;}
  list.innerHTML="<div style='color:#aaa;font-size:.65rem;padding:.4rem'>Loading...</div>";
  firebase.firestore().collection("estimates").where("uid","==",CU.uid).limit(50).get()
    .then(function(snap){
      var all=[];snap.forEach(function(d){all.push({id:d.id,d:d.data()});});
      all.sort(function(a,b){return(b.d.updatedAt?b.d.updatedAt.seconds:0)-(a.d.updatedAt?a.d.updatedAt.seconds:0);});
      if(!all.length){list.innerHTML="<div style='color:#aaa;font-size:.65rem;padding:.4rem;font-style:italic'>No saved estimates</div>";return;}
      list.innerHTML=all.map(function(item){
        var d=item.d,id=item.id,dt=d.updatedAt?new Date(d.updatedAt.seconds*1000).toLocaleDateString("en-IN"):"--",gr=d.grand?"&#8377;"+fmtN(d.grand):"";
        return "<div class='citem' onclick='loadEst(\""+id+"\")'>"+
          "<div class='cname'>"+esc(d.name||"Untitled")+"</div>"+
          "<div class='cmeta'>"+dt+(gr?" · "+gr:"")+"</div>"+
          "<button class='c-shr' onclick='event.stopPropagation();openShare(\""+id+"\")' title='Share'>🔗</button>"+
          "<button class='c-dl' onclick='event.stopPropagation();dlEst(\""+id+"\")' title='Download'>⬇️</button>"+
          "<button class='c-del' onclick='event.stopPropagation();delEst(\""+id+"\")''>🗑️</button></div>";
      }).join("");
    }).catch(function(e){list.innerHTML="<div style='color:red;font-size:.65rem'>Error: "+e.message+"</div>";});
}

function loadEst(docId){
  if(!window.firebase||!firebase.firestore)return;
  firebase.firestore().collection("estimates").doc(docId).get().then(function(d){
    if(!d.exists){showToast("Not found","error");return;}
    var data=d.data();CUR_EST_ID=docId;
    if(data.items)items=data.items;
    if(data.cover){["pReg","pCir","pDiv","pSub","pName"].forEach(function(k){var e=G(k);if(e&&data.cover[k]!=null)e.value=data.cover[k];});}
    if(data.settings){var ks=["gst","cont","li","royS","royC"];["sGST","sCont","sLI","sRS","sRC"].forEach(function(k,i){var e=G(k);if(e&&data.settings[ks[i]]!=null)e.value=data.settings[ks[i]];});}
    /* Restore lead KM and MTF test costs */
    if(data.leadKm){for(var _lk3 in data.leadKm){if(typeof LEAD_KM!=="undefined")LEAD_KM[_lk3]=data.leadKm[_lk3];}}
    if(data.leadLoc){for(var _ll3 in data.leadLoc){if(typeof LEAD_LOC!=="undefined")LEAD_LOC[_ll3]=data.leadLoc[_ll3];}}
    if(data.mtfCosts&&typeof mtfData!=="undefined"){for(var _rk3 in data.mtfCosts){var _rr3=mtfData.find(function(r){return r.sr===parseInt(_rk3)||r.sr===_rk3;});if(_rr3)_rr3.cost=parseFloat(data.mtfCosts[_rk3])||0;}}
    /* Restore steel calculator simple rows */
    if(data.steelRows&&typeof steelRows!=="undefined"){steelRows=JSON.parse(JSON.stringify(data.steelRows));if(typeof renderSteel==="function")renderSteel();}
    /* Restore advanced steel calculator sections (Footing 1, Footing 2, Column 1, Column 2 etc.) */
    if(data.scSecs&&typeof scSecs!=="undefined"){scSecs=JSON.parse(JSON.stringify(data.scSecs));if(data.scSecs.length){var _mxId3=0;data.scSecs.forEach(function(s){var n=parseInt((s.id||"0").toString().replace(/[^0-9]/g,""))||0;if(n>_mxId3)_mxId3=n;});if(typeof scUID!=="undefined")scUID=_mxId3;}if(typeof scRender==="function")scRender();}
    /* Rebuild lead chart first so lkm_ inputs exist, then populate them */
    if(typeof buildLCT==="function")buildLCT();
    if(data.lkm){for(var _ki in data.lkm){var _el2=G("lkm_"+_ki);if(_el2&&typeof onKmChange==="function"){_el2.value=data.lkm[_ki];onKmChange(parseInt(_ki));}}}
    if(typeof updateAll==="function")updateAll();if(typeof upCover==="function")upCover();if(typeof upMeta==="function")upMeta();if(typeof goTab==="function")goTab(0);
    /* Restore Plan tab drawing */
    if(data.planData&&typeof window._setPlanData==="function"){try{window._setPlanData(data.planData);}catch(_pe2){}}
    /* Restore Lead Map drawing */
    if(data.leadMapData&&typeof SP!=="undefined"){
      try{
        var _lmd2=data.leadMapData;
        if(typeof spSaveHistory==="function")spSaveHistory();
        SP.shapes=_lmd2.shapes||[];SP.bgImgX=_lmd2.bgImgX||20;SP.bgImgY=_lmd2.bgImgY||20;SP.bgImgW=_lmd2.bgImgW||0;SP.bgImgH=_lmd2.bgImgH||0;SP.bgImg=null;
        if(_lmd2.bgImgData){var _limg2=new Image();_limg2.onload=function(){SP.bgImg=_limg2;SP.bgImgAspect=(_limg2.height&&_limg2.width)?_limg2.width/_limg2.height:1;if(typeof spRedraw==="function")spRedraw();var _lb2=G("spRemoveImgBtn");if(_lb2)_lb2.style.display="";var _lo2=G("spImgOpacityWrap");if(_lo2)_lo2.style.display="flex";};_limg2.src=_lmd2.bgImgData;}else{if(typeof spRedraw==="function")spRedraw();}
      }catch(_lme2){}
    }
    showToast("Loaded: "+esc(data.name||""),"success");
  });
}

function dlEst(docId){if(!canDownload())return;CUR_EST_ID=docId;loadEst(docId);setTimeout(function(){if(typeof printAll==="function")printAll();},600);}
function delEst(docId){if(!confirm("Delete?"))return;firebase.firestore().collection("estimates").doc(docId).delete().then(function(){if(CUR_EST_ID===docId)CUR_EST_ID=null;showToast("Deleted","info");loadCloudList();});}
function newEstimate(){if(!confirm("Clear all data and start a new estimate?"))return;CUR_EST_ID=null;if(typeof items!=="undefined")items=[];["pReg","pCir","pDiv","pSub","pName"].forEach(function(k){var e=G(k);if(e)e.value="";});if(typeof buildLCT==="function")buildLCT();if(typeof updateAll==="function")updateAll();if(typeof goTab==="function")goTab(0);showToast("New estimate ready ✅","success");}

/* ADMIN DASHBOARD */
var AD={pays:[],users:[],ests:[],qrFile:null};
function aDt(ts){return ts?new Date(ts.seconds*1000).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}):"—";}
function doAdminLogout(){
  if(!confirm('Admin logout करायचे आहे का?'))return;
  sessionStorage.removeItem('_adminOpen');
  if(_unsub_pay){_unsub_pay();_unsub_pay=null;}
  if(_unsub_user){_unsub_user();_unsub_user=null;}
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

function aRenderStats(){
  var pend=AD.pays.filter(function(p){return p.status==="pending";}).length;
  var vrev=AD.pays.filter(function(p){return p.status==="verified";}).reduce(function(s,p){return s+(p.amount||PAY_AMOUNT);},0);
  if(G("aStats"))G("aStats").innerHTML=aStat(AD.users.length,"👥 Users","")+aStat(AD.pays.length,"💳 Payments","bl")+aStat(pend,"⏳ Pending","rd")+aStat("₹"+vrev.toLocaleString("en-IN"),"💰 Revenue","gr");
}
function aStat(n,l,c){return "<div class='astat "+c+"'><div class='astn'>"+n+"</div><div class='astl'>"+l+"</div></div>";}

function fPays(){var q=(G("payQ").value||"").toLowerCase(),f=G("payFlt").value;aRenderPays(AD.pays.filter(function(p){return(!q||(p.name||"").toLowerCase().includes(q)||(p.phone||"").includes(q)||(p.email||"").toLowerCase().includes(q))&&(f==="all"||p.status===f);}));}


function aReject(payId){if(!confirm("Reject?"))return;firebase.firestore().collection("payments").doc(payId).update({status:"rejected",rejectedAt:firebase.firestore.FieldValue.serverTimestamp()}).then(function(){showToast("Rejected","warn");aLoadAll();}).catch(function(e){showToast("Error: "+e.message,"error");});}

function aViewPay(payId){
  var p=AD.pays.find(function(x){return x._id===payId;});if(!p)return;
  var h=pRw("Name",p.name||"—")+pRw("Phone",p.phone||"—")+pRw("Amount","₹"+(p.amount||PAY_AMOUNT))+pRw("Status",p.status)+pRw("Time",aDt(p.createdAt));
  if(p.screenshotURL)h+="<div style='margin:.7rem 0'><div style='font-size:.65rem;font-weight:800;color:#888;margin-bottom:.3rem'>SCREENSHOT:</div><img src='"+esc(p.screenshotURL)+"' class='pdss' alt='' onerror='this.style.display=\"none\"'></div>";
  else h+="<div style='background:#f8f6f2;border-radius:6px;padding:.8rem;text-align:center;color:#aaa;font-size:.72rem;margin:.7rem 0'>No screenshot</div>";
  if(p.status==="pending")h+="<div class='actrow'><button class='xbtn xgr' onclick='aVerify(\""+payId+"\",\""+esc(p.uid||"")+"\");document.getElementById(\"payDetailModal\").style.display=\"none\"' style='flex:1;padding:.55rem'>✅ Verify</button><button class='xbtn xrd' onclick='aReject(\""+payId+"\");document.getElementById(\"payDetailModal\").style.display=\"none\"' style='flex:1;padding:.55rem'>❌ Reject</button></div>";
  if(G("pdBody"))G("pdBody").innerHTML=h;if(G("payDetailModal"))G("payDetailModal").style.display="flex";
}
function pRw(l,v){return "<div class='pdinforow'><span class='pdlbl'>"+l+"</span><span class='pdval'>"+esc(String(v))+"</span></div>";}

function aRenderUsers(users){
  if(!G("usrTbody"))return;
  if(!users.length){G("usrTbody").innerHTML="<tr><td colspan='7' style='text-align:center;color:#aaa;padding:2rem'>No users</td></tr>";return;}
  G("usrTbody").innerHTML=users.map(function(u){
    return "<tr><td><strong>"+esc(u.name||"—")+"</strong></td><td style='font-size:.7rem;color:#666'>"+esc(u.phone||u.email||"—")+"</td>"+
      "<td style='text-align:center;font-weight:700'>"+(u.dlCount||0)+" / "+(u.freeLimit!=null?u.freeLimit:FREE_LIMIT)+"</td>"+
      "<td>"+(u.isPro?"<span class='abp'>💎 Pro</span>":"<span class='abf'>🆓 Free</span>")+"</td>"+
      "<td style='font-size:.65rem;color:#888'>"+aDt(u.createdAt)+"</td>"+
      "<td style='display:flex;gap:.3rem'><button class='xbtn xgr' onclick='aGrant(\""+u._id+"\",\""+esc(u.name||u.phone||"")+"\")'>🎁 Pro</button>"+
      "<button class='xbtn xbl' onclick='aSetFree(\""+u._id+"\",\""+esc(u.name||u.phone||"")+"\")'>🆓</button>"+
      "<button class='xbtn xrd' onclick='aDeleteUser(\""+u._id+"\",\""+esc(u.name||u.phone||u.email||"")+"\")'>🗑️</button></td></tr>";
  }).join("");
}
function fUsers(){var q=(G("usrQ").value||"").toLowerCase();if(!q){aRenderUsers(AD.users);return;}aRenderUsers(AD.users.filter(function(u){return(u.name||"").toLowerCase().includes(q)||(u.phone||"").includes(q)||(u.email||"").toLowerCase().includes(q);}));}
function aGrant(uid,name){if(!confirm("Grant Pro to "+name+"?"))return;firebase.firestore().collection("users").doc(uid).update({isPro:true}).then(function(){showToast("Pro granted 🎉","success");aLoadAll();}).catch(function(e){showToast("Error: "+e.message,"error");});}
function aSetFree(uid,name){var v=prompt("Free downloads for "+name+" (global: "+FREE_LIMIT+"):","5");if(v===null)return;var n=parseInt(v);if(isNaN(n)||n<0){showToast("Invalid","error");return;}firebase.firestore().collection("users").doc(uid).update({freeLimit:n}).then(function(){showToast("Set free="+n+" for "+name,"success");aLoadAll();}).catch(function(e){showToast("Error: "+e.message,"error");});}

function aRenderEsts(ests){
  if(!G("estTbody"))return;
  if(!ests.length){G("estTbody").innerHTML="<tr><td colspan='6' style='text-align:center;color:#aaa;padding:2rem'>No estimates saved yet</td></tr>";return;}
  G("estTbody").innerHTML=ests.map(function(e){
    var u=AD.users.find(function(x){return x._id===e.uid||x.uid===e.uid;});
    return "<tr>"+
      "<td style='max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700'>"+esc(e.name||"Untitled")+"</td>"+
      "<td style='font-size:.68rem;color:#555'>"+esc(u?u.name||u.phone||u.email||"—":"?")+"</td>"+
      "<td style='text-align:center'>"+(e.items?e.items.length:0)+"</td>"+
      "<td style='font-weight:700;color:#18602f'>Rs."+fmtN(e.grand)+"</td>"+
      "<td style='font-size:.63rem;color:#888'>"+aDt(e.updatedAt)+"</td>"+
      "<td style='padding:.2rem;white-space:nowrap'><button class='xbtn xbl' style='padding:.2rem .5rem;font-size:.65rem' data-eid='"+e._id+"' onclick='aViewEst(this.dataset.eid)'>&#128065; View</button> <button class='xbtn xgr' style='padding:.2rem .5rem;font-size:.65rem' data-eid='"+e._id+"' onclick='aAdminLoadEst(this.dataset.eid)'>&#128194; Load</button></td>"+
    "</tr>";
  }).join("");
}
function fEsts(){var q=(G("estQ").value||"").toLowerCase();if(!q){aRenderEsts(AD.ests);return;}aRenderEsts(AD.ests.filter(function(e){return(e.name||"").toLowerCase().includes(q);}));}

function aAdminLoadEst(estId){
  var est=AD.ests.find(function(e){return e._id===estId;});
  if(!est){showToast("Estimate not found","warn");return;}
  var u=AD.users.find(function(x){return x._id===est.uid||x.uid===est.uid;});
  var uName=u?u.name||u.phone||u.email||"Unknown":"Unknown";
  if(!confirm("'"+esc(est.name||"Untitled")+"'\n(User: "+uName+")\n\nही estimate app मध्ये load करायची आहे का?\nसध्याचे unsaved काम जाईल."))return;
  if(typeof items!=="undefined"&&est.items){
    items=est.items.map(function(x){return Object.assign({},x);});
  }
  var m=est.meta||est.cover||{};
  ["pReg","pCir","pDiv","pSub","pName"].forEach(function(k){
    var el=G(k);if(el)el.value=m[k]||m["p"+k.slice(1)]||"";
  });
  if(est.lkm){for(var ki in est.lkm){var el2=G("lkm_"+ki);if(el2&&typeof onKmChange==="function"){el2.value=est.lkm[ki];onKmChange(parseInt(ki));}}}
  if(typeof buildLCT==="function")buildLCT();
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
function aDelPay(payId){
  if(!confirm("Delete this payment record?"))return;
  firebase.firestore().collection("payments").doc(payId).delete()
    .then(function(){showToast("Deleted","info");aLoadAll();})
    .catch(function(e){showToast("Error: "+e.message,"error");});
}
function aLoadSettings(){if(!window.firebase||!firebase.firestore)return;firebase.firestore().collection("config").doc("app").get().then(function(d){if(d.exists){if(d.data().payAmount&&G("setPriceVal"))G("setPriceVal").value=d.data().payAmount;if(d.data().freeLimit&&G("setFreeVal"))G("setFreeVal").value=d.data().freeLimit;var md=d.data().maintenance||{};if(G("maintActive"))G("maintActive").value=md.active?"true":"false";if(G("maintMsgInp"))G("maintMsgInp").value=md.message||"";if(G("mantFrom"))G("maintFrom").value=md.from||"";if(G("maintTo"))G("maintTo").value=md.to||"";}}).catch(function(){});}

function saveAppSetting(type){
  var val;
  if(type==="price"){val=parseInt(G("setPriceVal").value);if(isNaN(val)||val<1){showToast("Invalid","error");return;}firebase.firestore().collection("config").doc("app").set({payAmount:val},{merge:true}).then(function(){PAY_AMOUNT=val;showToast("Price=₹"+val,"success");makeQR();var pd=G("payAmtDisplay");if(pd)pd.innerHTML="&#8377;"+val+" <small>/ download</small>";}).catch(function(e){showToast("Error: "+e.message,"error");});}
  else{val=parseInt(G("setFreeVal").value);if(isNaN(val)||val<0){showToast("Invalid","error");return;}firebase.firestore().collection("config").doc("app").set({freeLimit:val},{merge:true}).then(function(){FREE_LIMIT=val;showToast("Free="+val,"success");renderHeader();}).catch(function(e){showToast("Error: "+e.message,"error");});}
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

function aShowSec(sec){["pay","users","ests","settings","loginpage","ssr","lead"].forEach(function(s){var e=G("asec-"+s);if(e)e.style.display=s===sec?"block":"none";});document.querySelectorAll(".asectab").forEach(function(t,i){t.classList.toggle("on",["pay","users","ests","settings","loginpage","ssr","lead"][i]===sec);});if(sec==="settings"){aLoadCurQR();aLoadSettings();}if(sec==="loginpage"){lpLoadAdmin();}if(sec==="ssr"){aRenderSSR();}if(sec==="lead"){aRenderLead();}}

function aDlCSV(type){
  var rows,fn;
  if(type==="pay"){rows=[["Name","Phone","Amount","Status","Time"]];AD.pays.forEach(function(p){rows.push([p.name||"",p.phone||"",p.amount||PAY_AMOUNT,p.status,aDt(p.createdAt)]);});fn="payments.csv";}
  else{rows=[["Name","Phone/Email","Downloads","Free Limit","Status","Joined"]];AD.users.forEach(function(u){rows.push([u.name||"",u.phone||u.email||"",u.dlCount||0,u.freeLimit!=null?u.freeLimit:FREE_LIMIT,u.isPro?"Pro":"Free",aDt(u.createdAt)]);});fn="users.csv";}
  var csv=rows.map(function(r){return r.map(function(c){return '"'+String(c).replace(/"/g,'""')+'"';}).join(",");}).join("\n");
  var a=document.createElement("a");a.href="data:text/csv;charset=utf-8,\ufeff"+encodeURIComponent(csv);a.download=fn;a.click();showToast(fn+" downloaded","success");
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
          sLI:(G('sLI')||{value:0}).value,sRS:(G('sRS')||{value:0}).value,sRC:(G('sRC')||{value:0}).value},
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
    var lk=est.lkm||{};
    for(var ki in lk){var el2=document.getElementById('lkm_'+ki);if(el2&&typeof onKmChange==='function'){el2.value=lk[ki];onKmChange(parseInt(ki));}}
    /* Restore MTF costs from autosave */
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
  var el=G("browseList");if(!el)return;
  if(!CU){el.innerHTML='<div style="text-align:center;padding:1.5rem;color:#888;font-size:.7rem">Please login to browse estimates</div>';return;}
  if(!window.firebase||!firebase.firestore){el.innerHTML='<div style="text-align:center;padding:1rem;color:#c00">Firebase not loaded</div>';return;}
  el.innerHTML='<div style="text-align:center;padding:1rem;color:#888">Loading...</div>';
  firebase.firestore().collection("estimates").orderBy("updatedAt","desc").limit(50).get()
    .then(function(snap){
      BROWSE_ALL=[];
      snap.forEach(function(d){BROWSE_ALL.push({id:d.id,d:d.data()});});
      renderBrowse(BROWSE_ALL);
    }).catch(function(e){
      el.innerHTML='<div style="padding:1rem;font-size:.65rem"><b style="color:#c00">Could not load.</b><br><span style="color:#666">'+e.message+'</span><br><br><div style="background:#fff8e1;border:1px solid #f5a623;padding:.5rem;border-radius:4px;font-size:.62rem">Firebase Console \u2192 Firestore Rules:<br><code>allow read: if request.auth != null;</code></div></div>';
    });
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
function requestEst(estId,estName){
  if(!CU){showToast("Login first","warn");return;}
  if(!window.firebase||!firebase.firestore)return;
  firebase.firestore().collection("requests").add({
    fromUid:CU.uid,fromName:CU.displayName||CU.email||"",fromEmail:CU.email||"",
    estId:estId,estName:estName,
    status:"pending",
    createdAt:firebase.firestore.FieldValue.serverTimestamp()
  }).then(function(){showToast("Request sent! Owner will be notified 📩","success");})
  .catch(function(e){showToast("Error: "+e.message,"error");});
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
    if(d.lkm){for(var ki in d.lkm){var el2=G("lkm_"+ki);if(el2&&typeof onKmChange==="function"){el2.value=d.lkm[ki];onKmChange(parseInt(ki));}}}
    if(typeof buildLCT==="function")buildLCT();
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

/* ── CONTACT US ─────────────────────────────────────────────── */
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
    G("ctName").value="";G("ctSubj").value="";G("ctMsg").value="";
    if(btn){btn.disabled=false;btn.textContent="Send Message";}
    if(G("ctOK")){G("ctOK").style.display="block";}
    showToast("Message sent!","success");
  }).catch(function(e){
    if(btn){btn.disabled=false;btn.textContent="Send Message";}
    showE("ctErr","Error: "+e.message);
  });
}

/* ── HOME SCREEN ─────────────────────────────── */
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


/* ════════════════════════════════════════════════════════
   LOGIN PAGE — Firebase-driven content
   Firestore: config/loginPage  { images:[], docs:[], videos:[], contact:{} }
   ════════════════════════════════════════════════════════ */
var LP_DATA={images:[],docs:[],videos:[],contact:{email:"thongeaditya@gmail.com",phone:"+91 8975962565"}};
var LP_IDX=0,LP_TMR=null;

/* ── LOAD & RENDER on login page ── */
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
  var bgSl=G("lpBgSlider"),dots=G("lpDots"),cap=G("lpSlideCap");
  if(!bgSl)return;
  var imgs=LP_DATA.images||[];
  clearInterval(LP_TMR);
  LP_IDX=0;
  if(!imgs.length){
    bgSl.innerHTML='<div class="lp-bg-slide active" style="background:linear-gradient(135deg,#0d2b18,#1a3a2a,#0a1a30)"></div>';
    if(dots)dots.innerHTML='';
    if(cap)cap.style.display='none';
    return;
  }
  bgSl.innerHTML=imgs.map(function(img,i){
    var u=esc(img.url||'');
    return '<div class="lp-bg-slide'+(i===0?' active':'')+'" style="background-image:url(' +u+ ')"></div>';
  }).join('');
  if(dots){
    dots.innerHTML=imgs.map(function(_,i){
      return '<div class="lp-dot'+(i===0?' active':'')+'" onclick="lpGoSlide('+i+')"></div>';
    }).join('');
  }
  if(cap){
    if(imgs[0]&&imgs[0].caption){cap.textContent=imgs[0].caption;cap.style.display='block';}
    else{cap.style.display='none';}
  }
  if(imgs.length>1){LP_TMR=setInterval(function(){lpGoSlide((LP_IDX+1)%imgs.length);},5000);}
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
  var eLink=G("lpEmailLink"),pLink=G("lpPhoneLink");
  if(eEl)eEl.textContent=email;
  if(pEl)pEl.textContent=phone;
  if(eLink)eLink.href="mailto:"+email;
  if(pLink)pLink.href="tel:"+phone.replace(/\s/g,"");
}

/* ── ADMIN: Load into editor ── */
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

/* ── ADMIN: Render lists ── */
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

/* ── ADMIN: Upload image via Cloudinary (persists permanently) ── */
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

/* ── ADMIN: Add / Delete ── */
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

/* ════════════════════════════════════════════
   CHATBOT — App FAQ auto-reply
   ════════════════════════════════════════════ */
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
   a:"You get <b>5 free downloads</b> after registering. After that, a small payment of <b>₹5 per download</b> is required.<br>Pay via any UPI app (GPay, PhonePe, Paytm) using the QR code shown after login."},
  {k:["free","free download","free estimate"],
   a:"Yes! Every new user gets <b>5 free estimate downloads</b>. No payment needed initially. After 5 downloads, ₹5 per download applies."},
  {k:["download","pdf","estimate","export"],
   a:"After adding all items to your estimate:<br>1️⃣ Click the <b>Download</b> button<br>2️⃣ If free downloads remain — PDF downloads instantly<br>3️⃣ If limit reached — Pay via UPI, upload screenshot, wait for admin verification (max 15 min)."},
  {k:["ssr","item","search","rate","schedule"],
   a:"Use the <b>SSR Item Search</b> tab. Type the item number (e.g. 28.01) or keywords (e.g. 'brick masonry'). Select the item and enter measurements to add it to your estimate."},
  {k:["lead","lead chart","lead charge","km","transport"],
   a:"Go to the <b>Lead Chart</b> tab. Enter distance in km for each material. The app automatically calculates lead charges using SSR 2022-23 non-linear lookup tables — exactly like the official Excel sheets."},
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

/* Close modal on backdrop click */
document.addEventListener("click",function(e){
  var modal=G("lpChatModal");
  if(modal&&e.target===modal)lpCloseChat();
});

/* ════════════════════════════════════════════════════════
   PAGE HELP — per-tab guide popup  (noprt — won't print)
   ════════════════════════════════════════════════════════ */
var PG_HELP = [
  /* 0 — Main */
  { ico:"🏛️", title:"Main Page",
    body:"<b>Main Page</b> is the cover sheet of your estimate.<br><br>"+
         "📝 <b>Fill in project details:</b><br>• Region, Circle, Division, Sub-Division<br>• Name of Work (full official name)<br><br>"+
         "💾 <b>Save / Load:</b><br>• <em>Save Current Estimate</em> — saves to cloud<br>• <em>Browse</em> tab — open past estimates<br><br>"+
         "🖨️ <b>Print All</b> — prints all sheets (Lead Chart, Abstract, BOQ, etc.) in one go.<br><br>"+
         "➕ <b>New</b> — clears everything and starts a fresh estimate." },

  /* 1 — Lead Chart */
  { ico:"🚛", title:"Lead Chart — SSR 2022-23",
    body:"<b>Lead Chart</b> calculates transport charges for each material.<br><br>"+
         "📏 <b>How to use:</b><br>1️⃣ Enter the distance in <b>km</b> for each material (e.g. Cement = 5 km)<br>2️⃣ Optionally enter the quarry/depot <b>Location name</b><br>3️⃣ Lead charges are auto-calculated using the <b>non-linear SSR 2022-23 lookup table</b> — same as the official Excel sheet<br><br>"+
         "⚠️ Set lead chart <b>before</b> searching items — rates include lead in the final item rate." },

  /* 2 — SSR Item Search */
  { ico:"🔍", title:"SSR Item Search",
    body:"<b>Search</b> from 2,275+ SSR 2022-23 items and add them to your estimate.<br><br>"+
         "🔎 <b>How to search:</b><br>• Type item number: <em>28.01</em><br>• Or type keywords: <em>brick masonry / earth excavation / M20 concrete</em><br><br>"+
         "📐 <b>Add measurements:</b><br>• Enter No. × L × B × D/H for each floor (G, 1st, 2nd...)<br>• Click <b>+ Row</b> to add more measurement rows<br>• Click <b>Add to Estimate</b> — item goes to Abstract<br><br>"+
         "💡 Lead charges are automatically included in the final rate based on your Lead Chart settings." },

  /* 3 — Abstract */
  { ico:"📋", title:"Abstract (BOQ)",
    body:"<b>Abstract</b> shows all items added to your estimate — the Bill of Quantities.<br><br>"+
         "📊 <b>Columns:</b> Sr. | Item No. | Description | Unit | Qty | Final Rate | Amount<br><br>"+
         "✏️ <b>CF button</b> — opens Correction Factor editor for that item (add deductions like SCADA, etc.)<br>"+
         "🗑️ <b>del button</b> — removes item from estimate<br><br>"+
         "The <b>Total</b> at the bottom is used in the General Abstract (Tab 8)." },

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
         "Royalty is charged on:<br>• Sand / Quarry material (M³) — ₹150 per M³<br>• Coarse Aggregate (M³) — ₹80 per M³<br><br>"+
         "Net Qty = Total Qty × Factor<br>Royalty = Net Qty × Royalty Rate<br><br>"+
         "Total Royalty is added to the General Abstract automatically." },

  /* 8 — General Abstract */
  { ico:"📑", title:"General Abstract",
    body:"<b>General Abstract</b> is the final summary of the complete estimate cost.<br><br>"+
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
         "📊 <b>GA Percentages:</b><br>• GST % (default 18%)<br>• Contingencies % (default 2%)<br>• Labour Insurance % (default 1%)<br>All percentages update the General Abstract automatically.<br><br>"+
         "🛢️ <b>Bitumen Rate:</b> Enter current market rate of bitumen (₹/MT) — adjusts all bitumen items automatically.<br><br>"+
         "Changes are applied immediately to your estimate." },

  /* 11 — Material Testing */
  { ico:"🧪", title:"Material Testing Frequency (MTF)",
    body:"<b>Material Testing</b> sheet lists the mandatory material tests as per PWD norms.<br><br>"+
         "For each material test it shows:<br>• Test name<br>• Frequency (e.g. 1 test per 50 M³)<br>• Rate per test<br>• Total tests required<br>• Total cost<br><br>"+
         "MTF cost is included in the General Abstract under <em>Royalty & Material Testing</em>.<br><br>"+
         "✏️ Click <b>Edit Stamps</b> to update the SE/SDE officer names and location stamps." },

  /* 12 — Lead Map */
  { ico:"🗺️", title:"Lead Map — Visual Diagram",
    body:"<b>Lead Map</b> is a visual diagram showing the transport distances for all materials.<br><br>"+
         "📍 Arrow length = Lead distance in km<br>Longer arrow → more km → higher transport cost<br><br>"+
         "The diagram is auto-generated from the distances you entered in <b>Lead Chart (Tab 1)</b>.<br><br>"+
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
/* ESC key closes it */
document.addEventListener("keydown",function(e){if(e.key==="Escape")closePgHelp();});

/* ── CTRL+P INTERCEPT ───────────────────────────────────────────────
   Ctrl+P (Win/Linux) किंवा Cmd+P (Mac) दाबल्यावर browser चा native
   print dialog येण्याआधी आपण printAll() run करतो.
   यामुळे:
   1. canDownload() check होतो — free limit bypass नाही
   2. _prepPrint() — canvas sync + meta update
   3. _applyPrintOrder() — सगळे panels proper order मध्ये
   4. DL_COUNT Firestore वर track होतो
─────────────────────────────────────────────────────────────────── */
document.addEventListener("keydown",function(e){
  if((e.ctrlKey||e.metaKey)&&e.key==="p"){
    e.preventDefault();
    e.stopPropagation();
    if(typeof printAll==="function"){
      printAll();
    }
  }
},true); /* capturing phase — browser shortcut आधी आपल्याला मिळतो */

/* ── BEFOREPRINT / AFTERPRINT ────────────────────────────────────────
   Browser menu → Print किंवा PDF save केल्यावर पण
   _prepPrint() + _applyPrintOrder() run होतो.
   (Ctrl+P ने printAll() call केल्यावर हे duplicate नाही होणार
    कारण printAll च window.print() call करतो — same flow.)
─────────────────────────────────────────────────────────────────── */
/* ── BEFOREPRINT ─────────────────────────────────────────────────────
   printAll() / doPrint() ने आधीच setup केलेले असेल तर skip.
   फक्त browser menu → Print साठी (edge case) इथे setup होतो.
─────────────────────────────────────────────────────────────────── */
window._browserMenuPrintActiveTab=0;
window.addEventListener("beforeprint",function(){
  if(window._printAllInProgress)return; /* printAll/doPrint ने handle केलेय */
  /* Browser menu print — fresh setup */
  window._browserMenuPrintActiveTab=0;
  for(var i=0;i<=18;i++){var t=document.getElementById("t"+i);if(t&&t.classList.contains("on")){window._browserMenuPrintActiveTab=i;break;}}
  if(typeof _prepPrint==="function")_prepPrint();
  if(typeof _applyPrintOrder==="function")_applyPrintOrder();
  if(typeof _doCountDownload==="function")_doCountDownload();
  window._printAllInProgress=true; /* afterprint ला restore करायला सांग */
});

window.addEventListener("afterprint",function(){
  if(!window._printAllInProgress)return;
  window._printAllInProgress=false;
  if(typeof _restorePrintOrder==="function")_restorePrintOrder();
  if(typeof goTab==="function"){
    document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("on");});
    goTab(window._browserMenuPrintActiveTab||0);
  }
  /* Print dialog पूर्ण बंद झाल्यावरच auto-save — toast print मध्ये दिसत नाही */
  setTimeout(function(){
    try{ if(typeof _silentAutoSave==="function")_silentAutoSave(); }catch(_e){}
  },400);
});

/* ── APP SHARE ─────────────────────────────────────────────────────── */
var APP_LOGO_B64="data:image/jpeg;base64,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";
function shareApp(){
  var url=window.location.href.split("?")[0];
  var title="Maha PWD Estimator";
  var text="Maharashtra PWD BOQ Estimation App\n• 2009+ SSR items (2022-23)\n• Lead chart, Measurements, Rate Analysis\n• Abstract, Royalty, Steel Calc & more\n\nOpen here: "+url;
  if(navigator.share){
    /* Try with logo file */
    fetch(APP_LOGO_B64).then(function(r){return r.blob();}).then(function(blob){
      var file=new File([blob],"MahaPWD_logo.jpg",{type:"image/jpeg"});
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
