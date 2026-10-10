
/* ══ PASTE FROM EXCEL — Measurement Sheet ══════════════════════════════════
   Measurement Sheet chya kuthlyahi cell (Detail / Nos / L / B / D) madhe Excel che cells paste kela ki
   to tya cell pasun ujvikade (columns) ani khali (rows) bharto — Excel sarkhach.
   Rows kami astil tar tya item madhe navin rows add hotat (floor = shevtchya row cha).
   Excel madhil constant-only formula (=2*3.5+1.2, SUM/AVERAGE of numbers) formula mhanunach store hote
   (r._f). Cell-reference wali formula (=B2*3, =SUM(A1:A5)) chi Excel ni calculate kelelee value ghetli jate.
   Ek-ch cell paste kela tar normal paste. Linked fields (🔗) skip hotat. */
var ATP_XL_COLS=['lbl','n','l','b','d'];
function atpXlNum(s){
  if(s===null||s===undefined)return null;
  s=String(s).replace(/[,\s\u00a0]/g,'');
  if(s==='')return null;
  var v=parseFloat(s);
  return isNaN(v)?null:v;
}
/* Excel formula -> app formula ('=...') jar sagle operands numbers asatil, nahitar null */
function atpXlFormula(f){
  if(!f)return null;
  var e=String(f).trim();
  if(e.charAt(0)!=='=')return null;
  e=e.substring(1).replace(/\s+/g,'');
  var g=0;
  while(/(SUM|AVERAGE)\(([^()]*)\)/i.test(e)&&g++<10){
    e=e.replace(/(SUM|AVERAGE)\(([^()]*)\)/ig,function(m,fn,args){
      var p=args.split(/[,;]/),k;
      for(k=0;k<p.length;k++)if(!/^[0-9]*\.?[0-9]+$/.test(p[k]))return 'X';
      var s='('+p.join('+')+')';
      return /^AVERAGE$/i.test(fn)?'('+s+'/'+p.length+')':s;
    });
  }
  if(!e||!/^[0-9+\-*\/().]+$/.test(e)||e.indexOf('//')>-1||e.indexOf('**')>-1)return null;
  try{var r=Function('"use strict";return ('+e+')')();if(typeof r!=='number'||!isFinite(r))return null;}catch(x){return null;}
  return '='+e;
}
/* Clipboard -> grid of {v:displayText, f:excelFormula}. Excel HTML clipboard madhe x:fmla attribute astoy */
function atpXlGrid(cd){
  var html=cd.getData('text/html')||'',text=cd.getData('text/plain')||'';
  var tl=text.replace(/\r/g,'').replace(/\n+$/,'').split('\n').map(function(l){return l.split('\t');});
  var grid=[];
  if(html&&/<td/i.test(html)&&typeof DOMParser!=='undefined'){
    try{
      var doc=new DOMParser().parseFromString(html,'text/html');
      Array.prototype.forEach.call(doc.querySelectorAll('tr'),function(tr){
        var row=[];
        Array.prototype.forEach.call(tr.querySelectorAll('td,th'),function(td){
          row.push({v:(td.textContent||'').replace(/\s+/g,' ').trim(),f:td.getAttribute('x:fmla')||''});
        });
        grid.push(row);
      });
    }catch(err){grid=[];}
  }
  /* html grid plain text shi jul nahi tar plain text vapar (values only) */
  if(!grid.length||grid.length!==tl.length||grid[0].length!==tl[0].length){
    grid=tl.map(function(r){return r.map(function(c){return {v:c.trim(),f:''};});});
  }
  return grid;
}
function atpXlPaste(iIdx,rIdx,col0,grid){
  var it=items[iIdx];if(!it||!it.rows)return;
  var targets=[],k;
  for(k=rIdx;k<it.rows.length;k++){var rr=it.rows[k];if(rr&&!rr.isTot&&!rr.isPct)targets.push(rr);}
  var added=0,skipped=0,valOnly=0,cells=0,gi,ci;
  for(gi=0;gi<grid.length;gi++){
    var line=grid[gi],r=targets[gi];
    if(!r){
      r={lbl:'',n:1,l:0,b:0,d:0,qty:0,fl:msrLastFloor(it)};
      var ti=it.rows.findIndex(function(x){return x.isTot;});
      if(ti>=0)it.rows.splice(ti,0,r);else it.rows.push(r);
      targets.push(r);added++;
    }
    var lf=r._linkedFrom?msrLinkFieldsOf(r):[];
    for(ci=0;ci<line.length;ci++){
      var f=ATP_XL_COLS[col0+ci];if(!f)break;
      var c=line[ci];
      if(lf.indexOf('qty')>-1||(f!=='lbl'&&lf.indexOf(f)>-1)){skipped++;continue;}
      cells++;
      if(f==='lbl'){r.lbl=c.v;continue;}
      var fx=atpXlFormula(c.f),val=null;
      if(fx){val=msrResolve(fx,iIdx);if(val===null)fx=null;}
      if(!fx){val=atpXlNum(c.v);if(c.f)valOnly++;}
      if(f==='n'){r.n=val||1;continue;}
      if(!r._f)r._f={};
      if(fx){r._f[f]=fx;r[f]=val;}else{delete r._f[f];r[f]=val;}
    }
  }
  msrSyncAllRows();
  for(var a=0;a<items.length;a++)items[a]=recalcItem(items[a]);
  rMS();updateAll();
  if(typeof showToast==='function'){
    var msg='Excel paste: '+grid.length+' row(s)'+(added?' ('+added+' navin)':'');
    if(valOnly)msg+=' — '+valOnly+' cell(s) madhe cell-reference formula hota, value ghetli';
    if(skipped)msg+=' — '+skipped+' linked cell(s) skip';
    showToast(msg,valOnly||skipped?'info':'success');
  }
}
document.addEventListener('paste',function(e){
  var t=e.target;
  if(!t||t.tagName!=='INPUT')return;
  var tr=t.closest?t.closest('tr[id^="msr_"]'):null;if(!tr)return;
  var m=/^msr_(\d+)_(\d+)$/.exec(tr.id);if(!m)return;
  var fm=/msrUpd\(\d+,\d+,this,'(\w+)'\)/.exec(t.getAttribute('oninput')||'');if(!fm)return;
  var col=ATP_XL_COLS.indexOf(fm[1]);if(col<0)return;
  var cd=e.clipboardData;if(!cd)return;
  var text=cd.getData('text/plain')||'';
  if(text.indexOf('\t')<0&&text.replace(/\r?\n$/,'').indexOf('\n')<0)return; /* single cell = normal paste */
  e.preventDefault();
  atpXlPaste(parseInt(m[1],10),parseInt(m[2],10),col,atpXlGrid(cd));
},true);
