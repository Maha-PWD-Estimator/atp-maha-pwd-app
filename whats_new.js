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
  id:"2026-11-23",                 /* <-- change this for every new update (date / version) */
  title:"What's new",
  subtitle:"Here is what changed in this update. Tap a card to see how it works.",
  items:[
    /* {icon, title, text, tag:"NEW" (optional), img:"whatsnew/x.png" (optional),
        how:["step 1","step 2",...] (optional: tapping the card opens these steps),
        tab:N, go:"button text" (optional: button closes the popup and opens tab N)} */
    {icon:"🌊",tag:"NEW",title:"Hydraulic Design for bridges and culverts",
     text:"Catchment area, discharge, linear waterway, hydraulic gradient and structure quantities in one tool, with a printable report. Measurements can go straight into your estimate.",
     how:["Log in, then open Hydraulic Design from the header button. It is available only to logged-in users.",
          "Enter the basic parameters, bridge geometry, cross sections and the L-section of the river. Use Load Sample Data to see a worked example first.",
          "Press Calculate. You get the catchment area, discharge (Manning's method), linear waterway and hydraulic gradient calculations.",
          "Fill in Structure Design & Quantities (pier, abutment, caps, steel, bearings) to get the quantities.",
          "Use Print Preview or Print / PDF for the report. Download Measurement Excel gives a file you can upload on the Measurement tab of your estimate.",
          "New to field survey? The Survey Guide animations show how to take levels and cross sections."]},
    {icon:"🚛",tag:"NEW",title:"K1, K2, K3 component and price variation",
     text:"Labour, material and POL components, truck kilometre, and the Statement 5 and Statement 6 price variation sheets, all prepared from your estimate.",
     how:["Load your estimate, then open K1·K2·K3 from its button.",
          "Enter the diesel rate and km per litre for the truck kilometre working (K3 POL). Lead in km is taken from the Lead Charges tab.",
          "Statement 5 gives the final K1, K2, K3 summary as per the Govt. Resolution of 16-5-2005.",
          "Statement 6 (Part A and B) works out price variation for each RA bill: labour, material, POL, bitumen, steel, cement and pipes. Enter the base indices, star rates and RA bill details.",
          "Your settings are remembered. In Print All, tick K1, K2, K3 Component to print it (unticked by default)."]},
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
    {icon:"✏️",tag:"NEW",title:"Rate Analysis: every row is editable",
     text:"Every row on the Rate Analysis sheet (Lead, SCADA, Area %, Bitumen) can now be changed by you.",
     tab:4,go:"Open Rate Analysis  ➜",
     how:["Open the Rate Analysis tab, click the amount (Rs/unit) of any row and type the new value.",
          "You can also rewrite the wording: click the text and type. Press Enter to save.",
          "Delete a row you don't need, and use ↩ to bring it back.",
          "Final Rate, Amount and Abstract recalculate automatically."]}
  ],
  /* Subscription section shown at the bottom of the popup. Delete the whole `promo` block to hide it. */
  promo:{
    title:"Maha PWD Estimator subscription",
    text:"Prepare estimates without interruption. No payment per download: pick a monthly or yearly plan and use it as much as you need.",
    plans:[
      {name:"Monthly",price:"\u20B9100",per:"per month",note:"Good for small jobs or a trial"},
      {name:"Yearly",price:"\u20B91000",per:"per year",note:"2 months free, use it all year",badge:"Best value"}
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
  function seen(){
    try{
      var v=localStorage.getItem(key());if(!v)return false;
      var p=v.split("|");if(p[0]!==CFG.id)return false;
      return (Date.now()-(+p[1]||0))<REPEAT_AFTER_HRS*3600000;
    }catch(e){return false;}
  }
  function markSeen(){try{localStorage.setItem(key(),CFG.id+"|"+Date.now());}catch(e){}}

  function css(){
    var oldSt=document.getElementById("atpWnCss");
    if(oldSt)oldSt.remove();
    var st=document.createElement("style");st.id="atpWnCss";
    st.textContent=
     "#atpWn{position:fixed;inset:0;z-index:100000;background:rgba(20,16,13,.72);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:1rem;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Nirmala UI','Noto Sans Devanagari',sans-serif;animation:atpWnIn .22s ease}"
    +"@keyframes atpWnIn{from{opacity:0}to{opacity:1}}"
    +"@keyframes atpWnUp{from{transform:translateY(16px) scale(.985);opacity:0}to{transform:none;opacity:1}}"
    +"#atpWn .wn-box{background:#fbf8f1;border:1px solid rgba(201,162,39,.28);border-radius:14px;width:100%;max-width:560px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 24px 60px rgba(0,0,0,.45);overflow:hidden;animation:atpWnUp .26s cubic-bezier(.22,1,.36,1)}"
    +"#atpWn .wn-hd{position:relative;padding:1.15rem 1.35rem 1.05rem;background:linear-gradient(135deg,#18130f 0%,#261d15 100%);color:#fff;border-bottom:3px solid #c9a227;display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem}"
    +"#atpWn .wn-hd-badge{display:inline-block;font-size:.64rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#e6c76a;background:rgba(201,162,39,.14);border:1px solid rgba(201,162,39,.35);padding:.16rem .5rem;border-radius:999px;margin-bottom:.4rem}"
    +"#atpWn .wn-hd h2{margin:0;font-size:1.25rem;font-weight:700;letter-spacing:-.01em;color:#fff}"
    +"#atpWn .wn-hd p{margin:.3rem 0 0;font-size:.8rem;color:#d6cec0;line-height:1.45}"
    +"#atpWn .wn-top-x{flex:0 0 32px;height:32px;border-radius:8px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#f3ede2;font-size:1rem;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .18s ease}"
    +"#atpWn .wn-top-x:hover:not(:disabled){background:#c9a227;color:#18130f;border-color:#c9a227}"
    +"#atpWn .wn-top-x:disabled{opacity:.4;cursor:not-allowed}"
    +"#atpWn .wn-list{overflow:auto;padding:.9rem 1rem 1rem;display:flex;flex-direction:column;gap:.75rem;-webkit-overflow-scrolling:touch}"
    +"#atpWn .wn-list::-webkit-scrollbar{width:6px}"
    +"#atpWn .wn-list::-webkit-scrollbar-thumb{background:#d5cbb7;border-radius:999px}"
    +"#atpWn .wn-card{flex:0 0 auto;border:1px solid #e6decb;border-radius:11px;overflow:hidden;background:#fff;box-shadow:0 2px 8px rgba(28,22,18,.04);transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease}"
    +"#atpWn .wn-card:hover{border-color:#d4b454;box-shadow:0 6px 18px rgba(28,22,18,.08)}"
    +"#atpWn .wn-img{width:100%;max-height:205px;object-fit:cover;display:block;background:#efe8da;border-bottom:1px solid #ece4d3}"
    +"#atpWn .wn-row{display:flex;gap:.85rem;padding:.9rem 1rem;align-items:flex-start}"
    +"#atpWn .wn-ic{flex:0 0 46px;height:46px;border-radius:11px;background:linear-gradient(145deg,#faf0d4 0%,#f0dfb0 100%);border:1px solid #e5cb85;display:flex;align-items:center;justify-content:center;font-size:1.45rem;box-shadow:inset 0 1px 0 rgba(255,255,255,.7)}"
    +"#atpWn .wn-body{flex:1;min-width:0}"
    +"#atpWn .wn-t{font-size:.95rem;font-weight:700;color:#18130f;line-height:1.35;display:flex;align-items:center;flex-wrap:wrap;gap:.4rem}"
    +"#atpWn .wn-num{font-size:.68rem;font-weight:700;color:#8c6812;background:#f9f1da;padding:.08rem .38rem;border-radius:5px}"
    +"#atpWn .wn-tag{display:inline-block;font-size:.6rem;font-weight:700;color:#fff;background:#b32d22;border-radius:4px;padding:.14rem .42rem;letter-spacing:.06em;text-transform:uppercase}"
    +"#atpWn .wn-x{font-size:.8rem;color:#575047;margin-top:.32rem;line-height:1.55}"
    +"#atpWn .wn-card.has-how .wn-row{cursor:pointer;user-select:none}"
    +"#atpWn .wn-card.has-how .wn-row:hover{background:#fffcf6}"
    +"#atpWn .wn-more{display:inline-flex;align-items:center;gap:.25rem;font-size:.74rem;font-weight:700;color:#8f670c;margin-top:.5rem;padding:.2rem .55rem;border-radius:6px;background:#fcf6e6}"
    +"#atpWn .wn-arr{display:inline-block;transition:transform .22s ease}"
    +"#atpWn .wn-card.open{border-color:#c9a227;box-shadow:0 8px 22px rgba(201,162,39,.14)}"
    +"#atpWn .wn-card.open .wn-arr{transform:rotate(180deg)}"
    +"#atpWn .wn-how{display:none;padding:.35rem 1rem .95rem 1.05rem;background:#fdf8ed;border-top:1px dashed #e2d5b7}"
    +"#atpWn .wn-card.open .wn-how{display:block;animation:atpWnIn .2s ease}"
    +"#atpWn .wn-how-lbl{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#8c6812;margin-top:.35rem}"
    +"#atpWn .wn-how ol{margin:.45rem 0 .55rem;padding-left:1.25rem;font-size:.78rem;color:#363029;line-height:1.6}"
    +"#atpWn .wn-how li{margin:.28rem 0}"
    +"#atpWn .wn-how li::marker{font-weight:700;color:#9e7414}"
    +"#atpWn .wn-go{display:inline-flex;align-items:center;gap:.35rem;border:1px solid #18130f;border-radius:8px;padding:.52rem .95rem;font-size:.79rem;font-weight:700;background:#18130f;color:#f7dfb0;cursor:pointer;transition:all .16s ease}"
    +"#atpWn .wn-go:hover{background:#c9a227;border-color:#c9a227;color:#18130f}"
    +"#atpWn .wn-promo{flex:0 0 auto;background:linear-gradient(160deg,#18130f 0%,#231b14 100%);border:1px solid rgba(201,162,39,.42);border-radius:12px;padding:1.05rem 1rem 1.1rem;color:#efe7d8;box-shadow:0 8px 24px rgba(0,0,0,.18)}"
    +"#atpWn .wn-promo h3{margin:0;font-size:1.05rem;color:#ebd07a;font-family:Georgia,'Times New Roman',serif;font-weight:700}"
    +"#atpWn .wn-promo p{margin:.4rem 0 0;font-size:.78rem;line-height:1.55;color:#d6cdbd}"
    +"#atpWn .wn-plans{display:flex;gap:.65rem;flex-wrap:wrap;margin:.95rem 0 .35rem}"
    +"#atpWn .wn-plan{flex:1 1 140px;border:1px solid #493b21;border-radius:10px;padding:.85rem .65rem .75rem;text-align:center;position:relative;background:rgba(255,255,255,.03);transition:transform .16s ease,border-color .16s ease}"
    +"#atpWn .wn-plan:hover{transform:translateY(-2px)}"
    +"#atpWn .wn-plan.best{border-color:#c9a227;background:rgba(201,162,39,.09);box-shadow:0 0 0 1px rgba(201,162,39,.25)}"
    +"#atpWn .wn-plan .pn{font-size:.75rem;font-weight:600;color:#dfd6c5}"
    +"#atpWn .wn-plan .pp{display:block;font-size:1.55rem;font-weight:700;color:#f0d27a;margin:.2rem 0 .05rem;font-family:Georgia,'Times New Roman',serif}"
    +"#atpWn .wn-plan .pr{display:block;font-size:.72rem;color:#e7dfd0}"
    +"#atpWn .wn-plan .pt{display:block;font-size:.68rem;color:#b4aa97;margin-top:.35rem;line-height:1.4}"
    +"#atpWn .wn-badge{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:linear-gradient(90deg,#a8291e,#c9382b);color:#fff;font-size:.58rem;font-weight:700;padding:.16rem .55rem;border-radius:999px;white-space:nowrap;letter-spacing:.06em;text-transform:uppercase;box-shadow:0 2px 6px rgba(0,0,0,.3)}"
    +"#atpWn .wn-ft2{margin:.95rem 0 .45rem;font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#d6b44d}"
    +"#atpWn .wn-feat{display:grid;grid-template-columns:1fr 1fr;gap:.38rem .85rem;margin:0;padding:0;list-style:none;font-size:.75rem;color:#ece4d5}"
    +"#atpWn .wn-feat li{display:flex;align-items:flex-start;gap:.38rem;line-height:1.4}"
    +"#atpWn .wn-feat li:before{content:'✓';color:#c9a227;font-weight:700;flex:0 0 auto}"
    +"@media(max-width:460px){#atpWn .wn-feat{grid-template-columns:1fr}#atpWn .wn-box{border-radius:12px}#atpWn .wn-row{padding:.8rem}}"
    +"#atpWn .wn-cta{margin-top:1rem;padding:.8rem .75rem;border:1px solid rgba(201,162,39,.3);background:rgba(201,162,39,.08);border-radius:9px;text-align:center;font-size:.78rem;color:#f2eadc}"
    +"#atpWn .wn-cta a{color:#f0d27a;font-weight:700;text-decoration:none}"
    +"#atpWn .wn-cta a:hover{text-decoration:underline}"
    +"#atpWn .wn-cta .site{display:block;font-size:.94rem;margin:.25rem 0 .15rem}"
    +"#atpWn .wn-ft{padding:.8rem 1rem;border-top:1px solid #e6decb;display:flex;align-items:center;justify-content:space-between;gap:.75rem;background:#f7f2e7}"
    +"#atpWn .wn-ft-note{font-size:.72rem;color:#736a5c}"
    +"#atpWn .wn-btn{border:none;border-radius:8px;padding:.65rem 1.35rem;font-size:.88rem;font-weight:700;background:#c9a227;color:#18130f;cursor:pointer;min-width:136px;transition:all .16s ease}"
    +"#atpWn .wn-btn:hover:not(:disabled){background:#d9b338;transform:translateY(-1px)}"
    +"#atpWn .wn-btn[disabled]{background:#ddd4c3;color:#82796b;cursor:not-allowed;transform:none}";
    document.head.appendChild(st);
  }

  function build(){
    var o=document.createElement("div");o.id="atpWn";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");
    var cards=(CFG.items||[]).map(function(it,idx){
      var how=it.how&&it.how.length;
      var num=String(idx+1).padStart(2,"0");
      return '<div class="wn-card'+(how?' has-how':'')+'" data-i="'+idx+'">'
        +(it.img?'<img class="wn-img" loading="lazy" alt="'+esc(it.title)+'" src="'+esc(it.img)+'" onerror="this.style.display=\'none\'">':'')
        +'<div class="wn-row"'+(how?' role="button" tabindex="0" aria-expanded="false"':'')+'>'
        +(it.img?'':'<div class="wn-ic">'+esc(it.icon||"✨")+'</div>')
        +'<div class="wn-body"><div class="wn-t">'
          +(it.img&&it.icon?esc(it.icon)+' ':'')
          +'<span class="wn-num">#'+num+'</span>'
          +'<span>'+esc(it.title)+'</span>'
          +(it.tag?'<span class="wn-tag">'+esc(it.tag)+'</span>':'')
        +'</div>'
        +'<div class="wn-x">'+esc(it.text)+'</div>'
        +(how?'<div class="wn-more">How does it work? <span class="wn-arr">▾</span></div>':'')
        +'</div></div>'
        +(how?'<div class="wn-how"><div class="wn-how-lbl">Step-by-step guide</div><ol>'+it.how.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ol>'
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
    o.innerHTML='<div class="wn-box"><div class="wn-hd"><div>'
      +'<div class="wn-hd-badge">Release '+esc(CFG.id||"Update")+'</div>'
      +'<h2>'+esc(CFG.title||"What's new")+'</h2>'
      +(CFG.subtitle?'<p>'+esc(CFG.subtitle)+'</p>':'')
      +'</div><button type="button" class="wn-top-x" id="atpWnTopClose" aria-label="Close" disabled>✕</button></div>'
      +'<div class="wn-list">'+cards+promo+'</div>'
      +'<div class="wn-ft"><span class="wn-ft-note">Tap any feature card for steps</span>'
      +'<button type="button" class="wn-btn" id="atpWnClose" disabled></button></div></div>';
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
    var btn=document.getElementById("atpWnClose"),topBtn=document.getElementById("atpWnTopClose"),left=COUNTDOWN,t;
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
      if(left<=0){clearInterval(t);btn.disabled=false;if(topBtn)topBtn.disabled=false;}
    },1000);
    btn.onclick=function(){close();};
    if(topBtn)topBtn.onclick=function(){close();};

    var list=o.querySelector(".wn-list");
    function toggle(card){
      var was=card.classList.contains("open");
      [].forEach.call(list.querySelectorAll(".wn-card.open"),function(c){
        c.classList.remove("open");
        var r=c.querySelector(".wn-row");if(r)r.setAttribute("aria-expanded","false");
      });
      if(!was){
        card.classList.add("open");
        var r=card.querySelector(".wn-row");if(r)r.setAttribute("aria-expanded","true");
      }
    }
    list.addEventListener("click",function(e){
      var g=e.target.closest&&e.target.closest(".wn-go");
      if(g){
        var it=CFG.items[+g.getAttribute("data-go")];
        close(true);
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
    o.addEventListener("click",function(e){if(e.target===o&&!btn.disabled)close();});
    document.addEventListener("keydown",onKey,true);
  }

  function loggedIn(){
    try{
      if(typeof CU==="undefined"||!CU)return false;
      var ls=document.getElementById("loginShell");
      if(ls&&getComputedStyle(ls).display!=="none"&&ls.offsetParent!==null)return false;
      return true;
    }catch(e){return false;}
  }
  function onLogout(){
    wasIn=false;shown=false;
    var old=document.getElementById("atpWn");
    if(old){old.remove();document.body.style.overflow="";}
  }
  var outSince=0;
  function start(){
    if(/[?&]whatsnew=1\b/.test(location.search)){show(true);return;}
    poll=setInterval(function(){
      var li=loggedIn();
      if(!li){
        if(!outSince)outSince=Date.now();
        if(wasIn)onLogout();
      }else if(!wasIn){
        wasIn=true;
        var manual=outSince&&(Date.now()-outSince>4000);
        outSince=0;
        setTimeout(function(){show(!!(manual&&SHOW_EVERY_LOGIN));},800);
      }
    },500);
  }
  window.atpWhatsNewShow=function(){show(true);};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();