/* ══════════════════════════════════════════════════════════════════════════
   WHAT'S NEW — full-screen overlay that shows new features to the user
   • Shows after every manual login (and logout → login), and after a refresh once REPEAT_AFTER_HRS hours have passed since the last Close
   • Close button is disabled for the first 2 seconds ("Close in 2s…"), then the user can close it
   • Each card has an optional image or an icon tile; tap a card to see "How does it work?"
   • To publish a new update: change `id` in ATP_WHATS_NEW and edit `items`. Nothing else is needed.
   • HTML needs only one line: <script src="whats_new.js"></script>   (after atp_secondary.js)
   • Test any time with ?whatsnew=1 in the URL, or call atpWhatsNewShow() from the console
   ══════════════════════════════════════════════════════════════════════════ */
var ATP_WHATS_NEW={
  id:"2026-11-03",                 /* <-- change this for every new update (date / version) */
  title:"What's new",
  subtitle:"Here is what changed in this update. Tap a card to see how it works.",
  items:[
    /* {icon, title, text, tag:"NEW" (optional), img:"whatsnew/x.png" (optional),
        how:["step 1","step 2",...] (optional: tapping the card opens these steps),
        tab:N, go:"button text" (optional: button closes the popup and opens tab N)} */
    {icon:"📊",tag:"NEW",title:"Excel export with live formulas",
     text:"Change lead km, a measurement or a rate in Excel and the Abstract and Grand Total update on their own. The layout matches Print: borders, merged cells, signature block and A4 page setup.",
     how:["Load your estimate, then choose Export → Excel.",
          "A sheet list appears, the same as Print All. Tick the sheets you need (Diff. Cost of Material is unticked by default).",
          "Open the file and change a km value on the Lead Charges sheet. Lead charge, Rate Analysis, Abstract and Recapitulation all recalculate.",
          "In special cases (cess, manual override) only the value is kept for that item, not a formula."]},
    {icon:"🔁",tag:"NEW",title:"Measurement sheet: download, edit in Excel, upload back",
     text:"Edit your measurement sheet in Excel and upload it back. Rows and formula links stay exactly as they were.",
     tab:5,go:"Open Measurement sheet  ➜",
     how:["On the Measurement tab, use the buttons above the sheet: Current Measurement Download, then Measurement Excel Upload (a Blank Template is there too).",
          "Download your sheet and edit it in Excel: change Nos, L, B, D/H, Floor or Detail, or add new rows under an item. Qty is calculated by Excel.",
          "Leave the Item No and RowID columns alone. RowID is how the app knows which row is which, so each edited row is updated in place. A new row with an empty RowID is added at the end of that item.",
          "Save the file in Excel and click Measurement Excel Upload. A summary shows how many rows will be updated or added. Confirm to apply it.",
          "Formula links are kept. A cell like =G2*2 that points to another row turns back into a live link in the app (blue for a straight reference, green for a calculation). Rows that are already linked inside the app keep their link.",
          "Good to know: deleting a row in Excel does not delete it in the app. Formulas that point to other sheets, or use functions other than SUM and AVERAGE, are brought in as plain values."]},
    {icon:"🛣️",tag:"NEW",title:"Road Improvement AA documents",
     text:"Administrative Approval (AA) documents for Road Improvement now have their own tab.",
     tab:21,go:"Open AA documents  ➜",
     how:["Open the AA documents tab from the tab bar, or use the button below.",
          "Fill in or view the Road Improvement AA documents there.",
          "Details already in your estimate are picked up automatically."]},
    {icon:"✏️",tag:"NEW",title:"Rate Analysis: every row is editable",
     text:"Every row on the Rate Analysis sheet (Lead, SCADA, Area %, Bitumen) can now be changed by you.",
     tab:4,go:"Open Rate Analysis  ➜",
     how:["Open the Rate Analysis tab, click the amount (Rs/unit) of any row and type the new value.",
          "You can also rewrite the wording: click the text and type. Press Enter to save.",
          "Delete a row you don't need, and use ↩ to bring it back.",
          "Final Rate, Amount and Abstract recalculate automatically."]},
    {icon:"🧾",tag:"NEW",title:"Diff. of Cost of Material tab",
     text:"A new tab to work out the difference between SSR rate and market rate for materials.",
     tab:20,go:"Open Diff. Cost of Material  ➜",
     how:["Open the Diff. Cost of Material tab and click Add Row, or pick a material from the dropdown.",
          "Fill in Material, SSR rate, Market rate and Remark. If you pick Bitumen, the rates are filled from the Bitumen section.",
          "Delete any row you don't need. These rows are saved along with your estimate.",
          "In Print and Excel this sheet comes after Testing and is unticked by default. Tick it when you need it."]}
  ],
  /* Subscription section shown at the bottom of the popup. Delete the whole `promo` block to hide it. */
  promo:{
    title:"Maha PWD Estimator subscription",
    text:"Prepare estimates without interruption. No payment per download: subscribe once and use it as much as you need.",
    plans:[
      {name:"Monthly",price:"\u20B9200",per:"per month",note:"Good for small jobs or a trial"},
      {name:"Yearly",price:"\u20B92000",per:"per year",note:"2 months free, use it all year",badge:"Best value"},
      {name:"Single download",price:"\u20B95",per:"per estimate",note:"No subscription, just one estimate download"}
    ],
    featuresTitle:"Included in the subscription",
    features:["Unlimited estimate downloads","2009+ SSR items with rate search","BOQ, Abstract, Rate Analysis","Lead chart and lead diagram","Measurement sheet and steel calc","Material testing frequency","PDF / Excel export","Cloud save, on any device"],
    site:"mahapwdestimator.in",
    phone:"+91 89759 62565"
  }
};

(function(){
  var CFG=window.ATP_WHATS_NEW||ATP_WHATS_NEW;
  var SHOW_EVERY_LOGIN=true;  /* true = show on every manual login / logout->login, even if closed before */
  var REPEAT_AFTER_HRS=6;     /* on refresh / reopening the app, show again only after this many hours since last Close (0 = every time) */
  var COUNTDOWN=2;            /* seconds the Close button stays disabled */
  var shown=false,poll=null,wasIn=false;

  function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
  function uid(){try{return (typeof CU!=="undefined"&&CU&&CU.uid)?CU.uid:"";}catch(e){return "";}}
  function key(){return "atpWhatsNewSeen_"+uid();}
  /* stored as "<id>|<timestamp of last Close>" */
  function seen(){
    try{
      var v=localStorage.getItem(key());if(!v)return false;
      var p=v.split("|");if(p[0]!==CFG.id)return false;
      return (Date.now()-(+p[1]||0))<REPEAT_AFTER_HRS*3600000;
    }catch(e){return false;}
  }
  function markSeen(){try{localStorage.setItem(key(),CFG.id+"|"+Date.now());}catch(e){}}

  /* Palette: warm paper + charcoal + safety orange (flat, no gradients) */
  function css(){
    if(document.getElementById("atpWnCss"))return;
    var st=document.createElement("style");st.id="atpWnCss";
    st.textContent=
     "#atpWn{position:fixed;inset:0;z-index:100000;background:rgba(28,25,23,.66);display:flex;align-items:center;justify-content:center;padding:1rem;font-family:Arial,Helvetica,'Nirmala UI','Noto Sans Devanagari',sans-serif;animation:atpWnIn .2s ease}"
    +"@keyframes atpWnIn{from{opacity:0}to{opacity:1}}"
    +"@keyframes atpWnUp{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}"
    +"#atpWn .wn-box{background:#faf6ee;border-radius:10px;width:100%;max-width:520px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 10px 36px rgba(0,0,0,.35);overflow:hidden;animation:atpWnUp .25s ease}"
    +"#atpWn .wn-hd{padding:1.05rem 1.3rem .95rem;background:#1c1612;color:#fff;border-bottom:4px solid #c9a227}"
    +"#atpWn .wn-hd h2{margin:0;font-size:1.2rem;font-weight:700;letter-spacing:.01em;color:#e6c76a}"
    +"#atpWn .wn-hd p{margin:.3rem 0 0;font-size:.78rem;color:#d9d2c7}"
    +"#atpWn .wn-list{overflow:auto;padding:.8rem 1rem;display:flex;flex-direction:column;gap:.65rem;-webkit-overflow-scrolling:touch}"
    +"#atpWn .wn-card{flex:0 0 auto;border:1px solid #e2d9c8;border-radius:8px;overflow:hidden;background:#fff;display:flex;flex-direction:column}"
    +"#atpWn .wn-img{width:100%;max-height:200px;object-fit:cover;display:block;background:#efe8da}"
    +"#atpWn .wn-row{display:flex;gap:.8rem;padding:.8rem .9rem;align-items:flex-start}"
    +"#atpWn .wn-ic{flex:0 0 44px;height:44px;border-radius:8px;background:#f4ead0;display:flex;align-items:center;justify-content:center;font-size:1.4rem}"
    +"#atpWn .wn-t{font-size:.92rem;font-weight:700;color:#1c1612;line-height:1.3}"
    +"#atpWn .wn-tag{display:inline-block;margin-left:.45rem;font-size:.56rem;font-weight:700;color:#fff;background:#8f2a22;border-radius:3px;padding:.1rem .32rem;vertical-align:middle;letter-spacing:.06em}"
    +"#atpWn .wn-x{font-size:.78rem;color:#5b544b;margin-top:.22rem;line-height:1.5}"
    +"#atpWn .wn-card.has-how .wn-row{cursor:pointer}"
    +"#atpWn .wn-card.has-how .wn-row:hover{background:#fffaf3}"
    +"#atpWn .wn-more{font-size:.72rem;font-weight:700;color:#8a6410;margin-top:.4rem}"
    +"#atpWn .wn-arr{display:inline-block;transition:transform .2s}"
    +"#atpWn .wn-card.open .wn-arr{transform:rotate(180deg)}"
    +"#atpWn .wn-how{display:none;padding:.25rem .95rem .85rem;background:#fbf3e6;border-top:1px dashed #dccfb8}"
    +"#atpWn .wn-card.open .wn-how{display:block}"
    +"#atpWn .wn-how ol{margin:.5rem 0 .3rem;padding-left:1.15rem;font-size:.76rem;color:#3a342d;line-height:1.55}"
    +"#atpWn .wn-how li{margin:.22rem 0}"
    +"#atpWn .wn-go{border:1px solid #1c1612;border-radius:6px;padding:.48rem .9rem;font-size:.78rem;font-weight:700;background:#fff;color:#1c1612;cursor:pointer;margin-top:.35rem}"
    +"#atpWn .wn-go:hover{background:#1c1612;color:#fff}"
    +"#atpWn .wn-ft{padding:.8rem 1rem;border-top:1px solid #e2d9c8;display:flex;justify-content:flex-end;background:#faf6ee}"
    +"#atpWn .wn-btn{border:none;border-radius:6px;padding:.65rem 1.4rem;font-size:.88rem;font-weight:700;background:#c9a227;color:#1c1612;cursor:pointer;min-width:140px}"
    +"#atpWn .wn-promo{flex:0 0 auto;background:#1c1612;border:1px solid #6b5420;border-radius:8px;padding:.95rem .95rem 1rem;color:#e9e1d2}"
    +"#atpWn .wn-promo h3{margin:0;font-size:.98rem;color:#e6c76a;font-family:Georgia,'Times New Roman',serif;font-weight:700}"
    +"#atpWn .wn-promo p{margin:.35rem 0 0;font-size:.76rem;line-height:1.5;color:#cfc6b4}"
    +"#atpWn .wn-plans{display:flex;gap:.55rem;flex-wrap:wrap;margin:.95rem 0 .3rem}"
    +"#atpWn .wn-plan{flex:1 1 130px;border:1px solid #4a3d22;border-radius:6px;padding:.75rem .5rem .6rem;text-align:center;position:relative;background:#241c15}"
    +"#atpWn .wn-plan.best{border-color:#c9a227}"
    +"#atpWn .wn-plan .pn{font-size:.72rem;color:#cfc6b4}"
    +"#atpWn .wn-plan .pp{display:block;font-size:1.45rem;font-weight:700;color:#e6c76a;margin:.15rem 0 0;font-family:Georgia,'Times New Roman',serif}"
    +"#atpWn .wn-plan .pr{display:block;font-size:.7rem;color:#e9e1d2}"
    +"#atpWn .wn-plan .pt{display:block;font-size:.66rem;color:#a99f8c;margin-top:.3rem;line-height:1.4}"
    +"#atpWn .wn-badge{position:absolute;top:-9px;left:50%;transform:translateX(-50%);background:#8f2a22;color:#fff;font-size:.56rem;font-weight:700;padding:.12rem .45rem;border-radius:3px;white-space:nowrap;letter-spacing:.04em}"
    +"#atpWn .wn-ft2{margin:.85rem 0 .35rem;font-size:.66rem;letter-spacing:.1em;text-transform:uppercase;color:#c9a227}"
    +"#atpWn .wn-feat{display:grid;grid-template-columns:1fr 1fr;gap:.3rem .9rem;margin:0;padding:0;list-style:none;font-size:.73rem;color:#e9e1d2}"
    +"#atpWn .wn-feat li:before{content:'\\2014  ';color:#8d7a45}"
    +"@media(max-width:420px){#atpWn .wn-feat{grid-template-columns:1fr}}"
    +"#atpWn .wn-cta{margin-top:.95rem;padding:.7rem .6rem;border:1px solid #5a2a24;background:#2a1612;border-radius:6px;text-align:center;font-size:.76rem;color:#e9e1d2}"
    +"#atpWn .wn-cta a{color:#e6c76a;font-weight:700;text-decoration:none}"
    +"#atpWn .wn-cta .site{display:block;font-size:.9rem;margin-top:.2rem}"
    +"#atpWn .wn-btn[disabled]{background:#cfc6b6;color:#7a7266;cursor:not-allowed}";
    document.head.appendChild(st);
  }

  function build(){
    var o=document.createElement("div");o.id="atpWn";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");
    var cards=(CFG.items||[]).map(function(it,idx){
      var how=it.how&&it.how.length;
      return '<div class="wn-card'+(how?' has-how':'')+'" data-i="'+idx+'">'
        +(it.img?'<img class="wn-img" loading="lazy" alt="'+esc(it.title)+'" src="'+esc(it.img)+'" onerror="this.style.display=\'none\'">':'')
        +'<div class="wn-row"'+(how?' role="button" tabindex="0"':'')+'>'
        +(it.img?'':'<div class="wn-ic">'+esc(it.icon||"✨")+'</div>')
        +'<div><div class="wn-t">'+(it.img&&it.icon?esc(it.icon)+' ':'')+esc(it.title)+(it.tag?'<span class="wn-tag">'+esc(it.tag)+'</span>':'')+'</div>'
        +'<div class="wn-x">'+esc(it.text)+'</div>'
        +(how?'<div class="wn-more">How does it work? <span class="wn-arr">▾</span></div>':'')
        +'</div></div>'
        +(how?'<div class="wn-how"><ol>'+it.how.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ol>'
          +(it.tab!=null?'<button type="button" class="wn-go" data-go="'+idx+'">'+esc(it.go||"Open")+'</button>':'')+'</div>':'')
        +'</div>';
    }).join("");
    var P=CFG.promo,promo="";
    if(P){
      promo='<div class="wn-promo"><h3>'+esc(P.title)+'</h3>'+(P.text?'<p>'+esc(P.text)+'</p>':'')
        +'<div class="wn-plans">'+(P.plans||[]).map(function(p){
          return '<div class="wn-plan'+(p.badge?' best':'')+'">'+(p.badge?'<span class="wn-badge">'+esc(p.badge)+'</span>':'')
            +'<span class="pn">'+esc(p.name)+'</span><span class="pp">'+esc(p.price)+'</span><span class="pr">'+esc(p.per)+'</span>'
            +(p.note?'<span class="pt">'+esc(p.note)+'</span>':'')+'</div>';}).join('')+'</div>'
        +((P.features&&P.features.length)?'<div class="wn-ft2">'+esc(P.featuresTitle||"Included")+'</div><ul class="wn-feat">'+P.features.map(function(f){return '<li>'+esc(f)+'</li>';}).join('')+'</ul>':'')
        +((P.site||P.phone)?'<div class="wn-cta">Subscribe today and finish your work faster'
          +(P.site?'<a class="site" href="https://'+esc(P.site)+'" target="_blank" rel="noopener">'+esc(P.site)+'</a>':'')
          +(P.phone?'<a href="tel:'+esc(P.phone.replace(/[^+\d]/g,""))+'">'+esc(P.phone)+'</a>':'')+'</div>':'')
        +'</div>';
    }
    o.innerHTML='<div class="wn-box"><div class="wn-hd"><h2>'+esc(CFG.title||"What's new")+'</h2>'+(CFG.subtitle?'<p>'+esc(CFG.subtitle)+'</p>':'')+'</div>'
      +'<div class="wn-list">'+cards+promo+'</div>'
      +'<div class="wn-ft"><button type="button" class="wn-btn" id="atpWnClose" disabled></button></div></div>';
    return o;
  }

  function show(force){
    if(shown&&!force)return;
    if(!(CFG.items&&CFG.items.length))return;
    if(!force&&seen())return;
    shown=true;css();
    var old=document.getElementById("atpWn");if(old)old.remove();
    var o=build();document.body.appendChild(o);
    var prevOv=document.body.style.overflow;document.body.style.overflow="hidden";
    var btn=document.getElementById("atpWnClose"),left=COUNTDOWN,t;
    function label(){btn.textContent=left>0?("Close in "+left+"s"):"Close \u2715";}
    function close(f){
      if(btn.disabled&&f!==true)return;
      clearInterval(t);document.removeEventListener("keydown",onKey,true);
      markSeen();o.remove();document.body.style.overflow=prevOv;
    }
    function onKey(e){if(e.key==="Escape"){if(!btn.disabled)close();e.stopPropagation();e.preventDefault();}}
    label();
    t=setInterval(function(){
      left--;label();
      if(left<=0){clearInterval(t);btn.disabled=false;}
    },1000);
    btn.onclick=function(){close();};

    var list=o.querySelector(".wn-list");
    function toggle(card){
      var was=card.classList.contains("open");
      [].forEach.call(list.querySelectorAll(".wn-card.open"),function(c){c.classList.remove("open");});
      if(!was)card.classList.add("open");
    }
    list.addEventListener("click",function(e){
      var g=e.target.closest&&e.target.closest(".wn-go");
      if(g){
        var it=CFG.items[+g.getAttribute("data-go")];
        close(true);   /* closes even during the countdown so the jump to the tab works */
        setTimeout(function(){try{if(typeof goTab==="function")goTab(it.tab);}catch(er){}},50);
        return;
      }
      var row=e.target.closest&&e.target.closest(".wn-card.has-how .wn-row");
      if(row)toggle(row.parentNode);
    });
    list.addEventListener("keydown",function(e){
      if(e.key!=="Enter"&&e.key!==" ")return;
      var row=e.target.closest&&e.target.closest(".wn-card.has-how .wn-row");
      if(row){e.preventDefault();toggle(row.parentNode);}
    });
    o.addEventListener("click",function(e){if(e.target===o&&!btn.disabled)close();});   /* tap outside closes after the countdown */
    document.addEventListener("keydown",onKey,true);
  }

  /* logged in = CU is set and the login screen is hidden */
  function loggedIn(){
    try{
      if(typeof CU==="undefined"||!CU)return false;
      var ls=document.getElementById("loginShell");
      if(ls&&getComputedStyle(ls).display!=="none"&&ls.offsetParent!==null)return false;
      return true;
    }catch(e){return false;}
  }
  /* Persistent watcher: shows the popup on every login (false→true) and resets on logout (true→false),
     so logout → login works without a page reload. */
  function onLogout(){
    wasIn=false;shown=false;
    var old=document.getElementById("atpWn");
    if(old){old.remove();document.body.style.overflow="";}
  }
  var outSince=0;   /* when the login screen was first seen; used to tell a manual login from a session restore */
  function start(){
    if(/[?&]whatsnew=1\b/.test(location.search)){show(true);return;}   /* test: ?whatsnew=1 */
    poll=setInterval(function(){
      var li=loggedIn();
      if(!li){
        if(!outSince)outSince=Date.now();
        if(wasIn)onLogout();
      }else if(!wasIn){
        wasIn=true;
        /* login screen was visible for a while => user typed credentials (manual login) => always show.
           Otherwise it is a refresh / session restore => show only if REPEAT_AFTER_HRS has passed. */
        var manual=outSince&&(Date.now()-outSince>4000);
        outSince=0;
        setTimeout(function(){show(!!(manual&&SHOW_EVERY_LOGIN));},800);
      }
    },500);
  }
  window.atpWhatsNewShow=function(){show(true);};   /* manual trigger from console / a button */
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
