/* ATP Tutorial overlay: "How to use" button + modal (iframe of ATP_Tutorial.html) */
(function(){
var ov=null;
function build(){
  if(ov)return;
  ov=document.createElement('div');ov.id='atpTutOv';
  ov.style.cssText='display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.75);align-items:center;justify-content:center';
  var css=document.createElement('style');
  css.textContent='#atpTutBox{width:min(1040px,96vw);height:96vh;height:96dvh;background:#1c1f26;border-radius:10px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.6)}'+
  '@media(max-width:700px){#atpTutBox{width:100vw;height:100vh;height:100dvh;border-radius:0}}'+
  '@media print{#atpTutOv{display:none!important}}';
  document.head.appendChild(css);
  ov.innerHTML='<div id="atpTutBox"><div style="display:flex;align-items:center;justify-content:space-between;padding:.4rem .8rem;background:#0f1218;color:#fff;flex:0 0 auto"><b style="font-size:.85rem">❓ How to use – Tutorial</b><button id="atpTutX" style="background:#c62828;color:#fff;border:0;border-radius:5px;padding:.3rem .7rem;font-weight:700;font-size:.85rem;cursor:pointer">✕ Close</button></div><iframe id="atpTutFr" title="Tutorial" style="flex:1 1 auto;width:100%;border:0;background:#1c1f26"></iframe></div>';
  document.body.appendChild(ov);
  document.getElementById('atpTutX').onclick=window.atpTutClose;
  ov.addEventListener('click',function(e){if(e.target===ov)window.atpTutClose()});
}
window.atpTutOpen=function(section){
  build();
  document.getElementById('atpTutFr').src='ATP_Tutorial.html?v=8'+(typeof section==='string'&&section?'#'+section:'');
  ov.style.display='flex';document.body.style.overflow='hidden';
};
window.atpTutClose=function(){
  if(!ov)return;
  ov.style.display='none';document.getElementById('atpTutFr').src='about:blank';document.body.style.overflow='';
};
addEventListener('keydown',function(e){if(e.key==='Escape'&&ov&&ov.style.display==='flex')window.atpTutClose()});
addEventListener('message',function(e){if(e.data==='atp-tut-close')window.atpTutClose()});
/* Kontya tab var button pahije: [panel id, tutorial section (optional)]
   Navin tab sathi fakt ek line add kara, udaharan: ['p2','search'], ['p3','abstract'] */
var TABS=[
  ['p0',''],
  ['p1','lead'],
  ['p2','search'],
  ['p8','recap'],
  ['p3','abstract'],
  ['p4','rate'],
  ['p5','measure'],
  ['p10','settings']
];
function addBtn(panelId,section,n){
  var h=document.querySelector('#'+panelId+' .sh h2');
  if(!h){if(n<50)setTimeout(function(){addBtn(panelId,section,n+1)},200);return}
  var id='atpTutBtn_'+panelId;
  if(document.getElementById(id))return;
  var b=document.createElement('button');
  b.id=id;b.type='button';b.className='noprt';
  b.style.cssText='margin-left:.6rem;align-self:center;font-size:.62rem;font-weight:800;padding:.22rem .6rem;border:0;border-radius:999px;background:#6a1b9a;color:#fff;cursor:pointer;white-space:nowrap;line-height:1.2';
  b.innerHTML='? How to use';b.title='How to use';
  b.onclick=function(){window.atpTutOpen(section)};
  h.insertAdjacentElement('afterend',b);
}
function init(){TABS.forEach(function(t){addBtn(t[0],t[1],0)})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
