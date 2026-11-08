/* ═══════════════════════════════════════════════════════════════════════
   EXPORT TO EXCEL — RA Bill — PRINT FORMAT
   Print madhe jasa official RA Bill format yeto (Form 47, Abstract, Measurement Book,
   Comparative, Testing, Royalty, Consumption, Cement) tasach Excel madhe yeto.

   Kasa kaam karto:  printRaFormat() jo HTML tayar karto toch capture karto ani
   prati-section ek Excel sheet banavto → print ani Excel kadhi veglé hot nahit.

   Load order:  exceljs_min.js → excel_export_print.js   (excel_export.js ata nako — delete kara)
   PWD_RA_BILL.html  : [Export Excel] → format nivda (1 RA Bill / 2 1st & Final)
   PWD_FINAL_BILL.html: [📊 Export Excel] → 1st & Final format
   ═══════════════════════════════════════════════════════════════════════ */
(function(root){
'use strict';

var GRID=48;                                   /* page width is split in 48 units; table columns snap to it */
var FONT='Times New Roman';
var BLK={DIV:1,P:1,TABLE:1,UL:1,OL:1,LI:1,H1:1,H2:1,H3:1,H4:1,H5:1,H6:1,HR:1,SECTION:1,HEADER:1,FOOTER:1};

/* ── tiny DOM / style helpers ─────────────────────────────── */
function px(v){var m=/(-?[\d.]+)\s*px/.exec(v||'');return m?parseFloat(m[1]):null;}
var MODE={computed:false};
var _cs=null;
function csty(n){
  if(_cs&&_cs.has(n))return _cs.get(n);
  var w=n.ownerDocument.defaultView,cs=w.getComputedStyle(n),r=n.getBoundingClientRect(),o={};
  o.display=cs.display;o['font-weight']=cs.fontWeight;o['font-style']=cs.fontStyle;
  o['text-decoration']=cs.textDecorationLine||cs.textDecoration||'';
  o['text-align']=cs.textAlign;o['font-size']=cs.fontSize;o['vertical-align']=cs.verticalAlign;
  o.width=r.width+'px';o.height=r.height+'px';o._h=r.height;o._w=r.width;o._vis=cs.visibility;
  [['top','Top'],['bottom','Bottom'],['left','Left'],['right','Right']].forEach(function(p){
    var st=cs['border'+p[1]+'Style'],wd=cs['border'+p[1]+'Width'];
    o['border-'+p[0]]=(st==='none'||st==='hidden'||!(parseFloat(wd)>0))?'none':(wd+' '+st);});
  o['margin-top']=cs.marginTop;o['margin-bottom']=cs.marginBottom;o['margin-left']=cs.marginLeft;
  var pb=cs.pageBreakBefore||cs.breakBefore;if(pb==='always'||pb==='page')o['page-break-before']='always';
  if(_cs)_cs.set(n,o);return o;
}
function sty(n){
  if(MODE.computed&&n.nodeType===1&&n.ownerDocument&&n.ownerDocument.defaultView)return csty(n);
  var o={},s=n.getAttribute&&n.getAttribute('style');if(!s)return o;
  s.split(';').forEach(function(p){var i=p.indexOf(':');if(i>0)o[p.slice(0,i).trim().toLowerCase()]=p.slice(i+1).trim().toLowerCase();});
  return o;
}
function hasCls(n,c){return !!(n.classList&&n.classList.contains(c));}
function hidden(n){
  if(n.nodeType!==1)return false;
  var t=n.tagName;if(t==='SCRIPT'||t==='STYLE'||t==='LINK'||t==='META'||t==='TITLE')return true;
  if(n.hasAttribute('hidden')||hasCls(n,'no-print'))return true;
  if(MODE.computed){var q=csty(n);return q.display==='none'||q._vis==='hidden'||q._vis==='collapse';}
  return /display\s*:\s*none/.test(n.getAttribute('style')||'');
}
function isBlockEl(n){
  if(n.nodeType!==1)return false;
  if(BLK[n.tagName])return true;
  var d=sty(n).display;return d==='flex'||d==='block'||d==='grid';
}
function parseBorder(v){
  if(!v||/\bnone\b/.test(v)||/^0(px)?\b/.test(v))return null;
  if(/double/.test(v))return 'double';
  return (px(v)||1)>=2?'medium':'thin';
}
function sidesOf(st,base){
  var s={t:base.t,b:base.b,l:base.l,r:base.r};
  if('border' in st){var a=parseBorder(st.border);s.t=s.b=s.l=s.r=a;}
  [['border-top','t'],['border-bottom','b'],['border-left','l'],['border-right','r']].forEach(function(p){if(p[0] in st)s[p[1]]=parseBorder(st[p[0]]);});
  return s;
}
var NOB={t:null,b:null,l:null,r:null};

/* inherited text style: bold / italic / underline / size / align */
function inherit(n,ctx){
  var c={},k;for(k in ctx)c[k]=ctx[k];
  var st=sty(n),t=n.tagName;
  if(t==='TH'){c.bold=true;c.align='center';c.valign='middle';}
  if(t==='TD'&&!('valign' in st))c.valign='top';
  if(t==='B'||t==='STRONG')c.bold=true;
  if(t==='I'||t==='EM')c.italic=true;
  if(t==='U')c.under=true;
  if(hasCls(n,'ofc-title')){c.bold=true;c.align='center';c.size=16;}
  if(hasCls(n,'ofc-sub')){c.bold=true;c.align='center';c.size=12;}
  if(hasCls(n,'sec-title')){c.bold=true;c.align='center';c.under=true;c.size=14;}
  if(hasCls(n,'tot'))c.bold=true;
  if(hasCls(n,'num')||hasCls(n,'amount-col')||hasCls(n,'num-cell'))c.align='right';
  if(st['font-weight']){var w=st['font-weight'];c.bold=(w==='bold'||w==='bolder'||parseInt(w,10)>=600);}
  if(st['font-style'])c.italic=(st['font-style']==='italic');
  if((st['text-decoration']||'').indexOf('underline')>=0)c.under=true;
  if(st['text-align']){var a=st['text-align'];c.align=(a==='center')?'center':((a==='right'||a==='end')?'right':'left');}
  if(st['vertical-align']){var v=st['vertical-align'];c.valign=v==='middle'?'middle':(v==='bottom'?'bottom':'top');}
  var fs=px(st['font-size']);if(fs)c.size=fs;
  return c;
}

/* ── text → runs ──────────────────────────────────────────── */
function collect(nodes,ctx,out){
  for(var i=0;i<nodes.length;i++){
    var n=nodes[i];
    if(n.nodeType===3){out.push({t:n.nodeValue.replace(/\u00a0/g,'\u0001').replace(/\s+/g,' '),b:ctx.bold,i:ctx.italic});}
    else if(n.nodeType===1){
      if(hidden(n))continue;
      if(n.tagName==='BR'){out.push({t:'\n',b:ctx.bold,i:ctx.italic});continue;}
      var c=inherit(n,ctx),blk=isBlockEl(n)&&n.tagName!=='TABLE';
      if(blk)out.push({t:'\n',b:c.bold,i:c.italic});
      collect(n.childNodes,c,out);
      if(blk)out.push({t:'\n',b:c.bold,i:c.italic});
    }
  }
}
function finish(rs){
  var out=[];
  rs.forEach(function(r){
    if(!r.t)return;var l=out[out.length-1],b=!!r.b,i=!!r.i;
    if(l&&l.b===b&&l.i===i)l.t+=r.t;else out.push({t:r.t,b:b,i:i});
  });
  var prev='';
  out.forEach(function(r){
    var t=r.t.replace(/[ \t]+/g,' ').replace(/ ?\n ?/g,'\n').replace(/\n{2,}/g,'\n');
    if(/[ \n]$/.test(prev)&&/^ /.test(t))t=t.slice(1);
    r.t=t;if(t)prev=t;
  });
  while(out.length){out[0].t=out[0].t.replace(/^[ \n]+/,'');if(out[0].t)break;out.shift();}
  while(out.length){var L=out[out.length-1];L.t=L.t.replace(/[ \n]+$/,'');if(L.t)break;out.pop();}
  out.forEach(function(r){r.t=r.t.replace(/\u0001/g,' ');});
  var all=out.map(function(r){return r.t;}).join('');
  if(!all.trim())return null;
  return out;
}
function plain(runs){return runs.map(function(r){return r.t;}).join('');}

/* ═══════════════════════════════════════════════════════════
   htmlToSheet — convert one print section (DOM element) to a worksheet
   ═══════════════════════════════════════════════════════════ */
function htmlToSheet(ws,secEl,opts){
  MODE.computed=!!(opts&&opts.computed);_cs=MODE.computed&&typeof WeakMap!=='undefined'?new WeakMap():null;
  var ops=[],bords=[],heights={},breaks=[],bounds={},cur=1,maxPx=0;
  bounds[0]=1;bounds[GRID]=1;
  function reg(g){bounds[g]=1;}

  function spacer(pt){heights[cur]=Math.max(heights[cur]||0,pt);cur++;}
  function marginOf(st,side){
    var m=px(st['margin-'+side]);
    if(m==null&&st.margin){var p=st.margin.split(/\s+/).map(px);
      if(p.length===1)m=p[0];else if(p.length>=2)m=(side==='top'||side==='bottom')?(side==='top'?p[0]:(p.length>2?p[2]:p[0])):null;}
    return m&&m>=6?m*0.75:0;
  }

  function textRow(nodes,ctx,g0,g1){
    var rs=[];collect(nodes,ctx,rs);var runs=finish(rs);
    if(!runs)return false;
    reg(g0);reg(g1);
    ops.push({r:cur,r2:cur,g0:g0,g1:g1,runs:runs,ctx:ctx,sides:NOB});
    cur++;return true;
  }

  /* ---- tables ---- */
  function table(tbl,ctx,g0,g1){
    var rows=[].slice.call(tbl.rows).filter(function(r){return !hidden(r);});
    if(!rows.length)return;
    var tctx=inherit(tbl,ctx);tctx.inTable=true;
    var occ=[],cells=[],ncols=0;
    rows.forEach(function(tr,ri){
      occ[ri]=occ[ri]||[];var ci=0;
      [].slice.call(tr.cells).forEach(function(td){
        if(hidden(td))return;
        while(occ[ri][ci])ci++;
        var rs=Math.min(Math.max(1,parseInt(td.getAttribute('rowspan'),10)||1),rows.length-ri),
            cs=Math.max(1,parseInt(td.getAttribute('colspan'),10)||1);
        for(var a=0;a<rs;a++){occ[ri+a]=occ[ri+a]||[];for(var b=0;b<cs;b++)occ[ri+a][ci+b]=1;}
        var rctx=inherit(tr,tctx),cctx=inherit(td,rctx),rr=[];
        collect(td.childNodes,cctx,rr);
        cells.push({el:td,r:ri,c:ci,rs:rs,cs:cs,ctx:cctx,runs:finish(rr),st:sty(td)});
        ci+=cs;if(ci>ncols)ncols=ci;
      });
    });
    if(!ncols)return;
    /* column weights */
    var fixed=[],pct=[],txt=[],c;
    for(c=0;c<ncols;c++){fixed[c]=0;pct[c]=null;txt[c]=0;}
    cells.forEach(function(k){
      if(k.cs!==1)return;
      var w=k.st.width||k.el.getAttribute('width')||'';
      if(/%/.test(w))pct[k.c]=parseFloat(w);
      else if(px(w)!=null)fixed[k.c]=Math.max(fixed[k.c],px(w));
      var mw=px(k.st['min-width']);if(mw)fixed[k.c]=Math.max(fixed[k.c],mw);
      if(k.runs){var longest=0;plain(k.runs).split('\n').forEach(function(l){if(l.length>longest)longest=l.length;});
        txt[k.c]=Math.max(txt[k.c],Math.min(longest,60)*6.5+10);}
    });
    var wt=[],pctSum=0,wSum=0;
    for(c=0;c<ncols;c++){
      if(pct[c]!=null){pctSum+=pct[c];wt[c]=0;}
      else{wt[c]=fixed[c]||txt[c]||50;wSum+=wt[c];}
    }
    if(pctSum>100){for(c=0;c<ncols;c++)if(pct[c]!=null)pct[c]=pct[c]*100/pctSum;pctSum=100;}
    var rem=wSum?Math.max(0.1,1-pctSum/100):0;
    var frac=[];
    for(c=0;c<ncols;c++)frac[c]=pct[c]!=null?pct[c]/100:(wSum?rem*wt[c]/wSum:1/ncols);
    maxPx=Math.max(maxPx,wSum+(pctSum?400:0));
    /* snap to grid */
    var span=g1-g0,bd=[g0],cum=0;
    for(c=0;c<ncols;c++){cum+=frac[c];bd[c+1]=g0+Math.round(cum/ (frac.reduce(function(a,b){return a+b;},0)||1)*span);}
    bd[ncols]=g1;
    for(c=1;c<=ncols;c++)if(bd[c]<=bd[c-1])bd[c]=bd[c-1]+1;
    for(c=ncols-1;c>=1;c--)if(bd[c]>=bd[c+1])bd[c]=bd[c+1]-1;
    bd.forEach(reg);
    var base=cur;
    cells.forEach(function(k){
      var sides=sidesOf(k.st,{t:'thin',b:'thin',l:'thin',r:'thin'});
      ops.push({r:base+k.r,r2:base+k.r+k.rs-1,g0:bd[k.c],g1:bd[Math.min(k.c+k.cs,ncols)],runs:k.runs,ctx:k.ctx,sides:sides,cell:true,h:MODE.computed?(k.st._h||0)*0.75:0});
    });
    cur=base+rows.length;
  }

  /* ---- flex rows (justify-content:space-between) ---- */
  function flex(n,ctx,g0,g1){
    var kids=[].filter.call(n.childNodes,function(k){return k.nodeType===1&&!hidden(k);});
    var N=kids.length;if(!N)return;
    if(MODE.computed){
      var pr=n.getBoundingClientRect(),sp0=g1-g0,end0=cur,start0=cur;
      kids.forEach(function(k){
        var kr=k.getBoundingClientRect(),f0=Math.max(0,(kr.left-pr.left)/(pr.width||1)),f1=Math.min(1,(kr.right-pr.left)/(pr.width||1));
        var a0=g0+Math.round(f0*sp0),a1=g0+Math.round(f1*sp0);
        if(a0>=g1)a0=g1-1;if(a1<=a0)a1=a0+1;if(a1>g1)a1=g1;
        cur=start0;block(k,ctx,a0,a1);if(cur>end0)end0=cur;
      });
      cur=end0;return;
    }
    var ws=kids.map(function(k){var w=sty(k).width;return /%/.test(w||'')?parseFloat(w)/100:null;});
    var known=0,unk=0;ws.forEach(function(w){if(w==null)unk++;else known+=w;});
    var share=unk?Math.max(0,1-known)/unk:0;
    ws=ws.map(function(w){return w==null?share:w;});
    var tot=ws.reduce(function(a,b){return a+b;},0),gap=N>1?Math.max(0,(1-tot)/(N-1)):0;
    var pos=0,start=cur,end=cur,span=g1-g0;
    kids.forEach(function(k,i){
      var a0=g0+Math.round(pos*span),a1=g0+Math.round((pos+ws[i])*span);
      if(a1<=a0)a1=a0+1;if(a1>g1)a1=g1;
      pos+=ws[i]+gap;
      var c2={};for(var q in ctx)c2[q]=ctx[q];
      c2.align=(i===0)?'left':(i===N-1?'right':'center');
      cur=start;block(k,c2,a0,a1);
      if(cur>end)end=cur;
    });
    cur=end;
  }

  /* ---- generic block ---- */
  function block(n,ctx,g0,g1){
    if(hidden(n))return;
    var st=sty(n),c=inherit(n,ctx);
    if(n.tagName==='TABLE'){
      var mt=marginOf(st,'top');if(mt)spacer(mt);
      table(n,ctx,g0,g1);
      var mb=marginOf(st,'bottom');if(mb)spacer(mb);return;
    }
    if(hasCls(n,'page-break')||hasCls(n,'pb')||hasCls(n,'page')||st['page-break-before']==='always'){if(cur>1&&breaks[breaks.length-1]!==cur-1)breaks.push(cur-1);}
    var a0=g0,a1=g1;
    if(MODE.computed&&n.parentNode&&n.parentNode.getBoundingClientRect){
      var pw=n.parentNode.getBoundingClientRect().width||1,ml=px(st['margin-left'])||0;
      if(st.display==='inline-block'){
        var w2=Math.max(4,Math.round((st._w||0)/pw*(g1-g0))),al2=ctx.align||'left';
        if(al2==='right')a0=g1-w2;else if(al2==='center'){a0=g0+Math.round((g1-g0-w2)/2);a1=a0+w2;}else a1=Math.min(g1,g0+w2);
      }else if(ml>=6){a0=Math.min(g1-2,g0+Math.round(ml/pw*(g1-g0)));}
    }else if(st.display==='inline-block'&&!st.width){
      var w=Math.max(6,Math.round((g1-g0)*0.4)),al=ctx.align||'left';
      if(al==='right')a0=g1-w;else if(al==='center'){a0=g0+Math.round((g1-g0-w)/2);a1=a0+w;}else a1=g0+w;
    }
    var mt2=marginOf(st,'top');if(mt2)spacer(mt2);
    var r0=cur;
    if(st.display==='flex'){flex(n,c,a0,a1);}
    else{
      var kids=[].slice.call(n.childNodes),hasBlock=kids.some(isBlockEl);
      if(!hasBlock){textRow(kids,c,a0,a1);}
      else{
        var pending=[];
        var flush=function(){if(pending.length){textRow(pending,c,a0,a1);pending=[];}};
        kids.forEach(function(k){
          if(isBlockEl(k)){flush();block(k,c,a0,a1);}else pending.push(k);
        });
        flush();
      }
    }
    var h=px(st.height);
    var base=hasCls(n,'ofc-info')?{t:'medium',b:'thin',l:null,r:null}:NOB;
    var sd=sidesOf(st,base);
    if(cur===r0&&(h||sd.t||sd.b))spacer(Math.max((h||0)*0.75,4));
    if((sd.t||sd.b||sd.l||sd.r)&&cur>r0){reg(a0);reg(a1);bords.push({r0:r0,r1:cur-1,g0:a0,g1:a1,s:sd});}
    var mb2=marginOf(st,'bottom');if(mb2)spacer(mb2);
  }

  var root0={align:'left',valign:'top'};
  block(secEl,root0,0,GRID);

  /* ── write to worksheet ─────────────────────────────────── */
  var total=Math.max(100,Math.min(150,Math.round(maxPx/7)));
  var bs=Object.keys(bounds).map(Number).sort(function(a,b){return a-b;});
  var idx={};bs.forEach(function(g,i){idx[g]=i;});
  var colW=[];
  for(var i=0;i<bs.length-1;i++){colW[i+1]=Math.max(1.6,(bs[i+1]-bs[i])/GRID*total);ws.getColumn(i+1).width=colW[i+1];}
  function spanW(c0,c1){var s=0;for(var q=c0;q<=c1;q++)s+=colW[q]||2;return s;}
  function pt(sz){return Math.max(7,Math.round((sz||12.5)*0.8*2)/2);}
  var INDIAN=function(z){return '[>=10000000]##\\,##\\,##\\,##0'+z+';[>=100000]##\\,##\\,##0'+z+';##,##0'+z;};

  var need={},bmap={};
  function addB(r,c,sides){
    var k=r+','+c,o=bmap[k]||(bmap[k]={}),rank={thin:1,medium:2,double:3};
    ['t','b','l','r'].forEach(function(s){var v=sides[s];if(v&&(!o[s]||rank[v]>rank[o[s]]))o[s]=v;});
  }

  ops.forEach(function(op){
    var c0=idx[op.g0]+1,c1=idx[op.g1],sz=pt(op.ctx.size||(op.ctx.inTable?11.5:12.5));
    if(c1<c0)c1=c0;
    op.c0=c0;op.c1=c1;op.sz=sz;
    var text=op.runs?plain(op.runs):'';
    /* row height estimate */
    if(text.trim()){
      var cap=Math.max(2,spanW(c0,c1)*(11/sz)*0.9),lines=0,bf=op.ctx.bold?1.12:1;
      text.split('\n').forEach(function(l){
        var up=(l.match(/[A-Z]/g)||[]).length>l.length*0.5?1.2:1;
        var eff=l.length*bf*up*(/[\u0900-\u097F]/.test(l)?1.2:1);lines+=Math.max(1,Math.ceil(eff/cap));});
      op.need=lines*sz*1.32+3;
    }else op.need=sz*1.32+3;
    if(op.h&&op.h>op.need)op.need=op.h;
  });
  ops.forEach(function(op){
    if(op.r2===op.r)need[op.r]=Math.max(need[op.r]||0,op.need);
  });
  ops.forEach(function(op){
    if(op.r2>op.r){var have=0;for(var q=op.r;q<=op.r2;q++)have+=Math.max(need[q]||0,heights[q]||0,13);
      if(have<op.need)need[op.r2]=Math.max(need[op.r2]||0,(Math.max(need[op.r2]||0,heights[op.r2]||0,13))+(op.need-have));}
  });
  var lastRow=cur-1;
  for(var r=1;r<=lastRow;r++){
    var h=Math.max(need[r]||0,heights[r]||0);
    if(heights[r]&&!need[r])h=heights[r];
    if(h)ws.getRow(r).height=Math.min(409,Math.max(h,12));
  }

  /* merges first, then values/styles (merge copies the master style) */
  ops.forEach(function(op){
    if(op.r2>op.r||op.c1>op.c0){try{ws.mergeCells(op.r,op.c0,op.r2,op.c1);}catch(e){}}
  });
  ops.forEach(function(op){
    var cell=ws.getCell(op.r,op.c0),cx=op.ctx;
    if(op.runs){
      var txt=plain(op.runs),val=null,fmtStr=null;
      if(cx.align==='right'&&op.runs.length===1&&/^-?[\d,]*\.?\d+$/.test(txt.trim())&&/\d/.test(txt)&&txt.trim().replace(/,/g,'').length<16){
        var s=txt.trim(),d=(s.split('.')[1]||'').length,z=d?'.'+new Array(d+1).join('0'):'';
        val=parseFloat(s.replace(/,/g,''));
        fmtStr=s.indexOf(',')>=0?INDIAN(z):('0'+z);
      }
      if(val!==null){cell.value=val;cell.numFmt=fmtStr;}
      else if(op.runs.length===1){cell.value=op.runs[0].t;}
      else{
        cell.value={richText:op.runs.map(function(r){
          return {text:r.t,font:{name:FONT,size:op.sz,bold:!!r.b,italic:!!r.i,underline:cx.under?true:undefined}};})};
      }
    }
    cell.font={name:FONT,size:op.sz,bold:!!cx.bold,italic:!!cx.italic,underline:cx.under?true:undefined,color:{argb:'FF000000'}};
    cell.alignment={horizontal:cx.align||'left',vertical:cx.valign||'top',wrapText:true};
    if(op.cell||op.sides.t||op.sides.b||op.sides.l||op.sides.r){
      for(var rr=op.r;rr<=op.r2;rr++)for(var cc=op.c0;cc<=op.c1;cc++){
        addB(rr,cc,{t:rr===op.r?op.sides.t:null,b:rr===op.r2?op.sides.b:null,l:cc===op.c0?op.sides.l:null,r:cc===op.c1?op.sides.r:null});
      }
    }
  });
  bords.forEach(function(b){
    var c0=idx[b.g0]+1,c1=idx[b.g1];
    for(var rr=b.r0;rr<=b.r1;rr++)for(var cc=c0;cc<=c1;cc++){
      addB(rr,cc,{t:rr===b.r0?b.s.t:null,b:rr===b.r1?b.s.b:null,l:cc===c0?b.s.l:null,r:cc===c1?b.s.r:null});
    }
  });
  var BC={argb:'FF000000'};
  Object.keys(bmap).forEach(function(k){
    var p=k.split(','),o=bmap[k],bd={};
    if(o.t)bd.top={style:o.t,color:BC};if(o.b)bd.bottom={style:o.b,color:BC};
    if(o.l)bd.left={style:o.l,color:BC};if(o.r)bd.right={style:o.r,color:BC};
    var cl=ws.getCell(+p[0],+p[1]);cl.style=Object.assign({},cl.style,{border:bd});   /* new object: merged cells may share the master's style object */
  });
  breaks.forEach(function(r){if(r>=1&&r<=lastRow)ws.getRow(r).addPageBreak();});

  var pg0=secEl.querySelector&&secEl.querySelector('.page');
  ws.pageSetup={paperSize:9,orientation:(pg0&&hasCls(pg0,'land'))?'landscape':'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0,horizontalCentered:true,
    margins:{left:0.47,right:0.47,top:0.47,bottom:0.5,header:0.2,footer:0.2}};
  ws.views=[{showGridLines:false}];
  MODE.computed=false;_cs=null;
  return lastRow;
}

/* ═══════════════════════════════════════════════════════════
   APP SIDE — capture the print HTML, build workbook, download
   ═══════════════════════════════════════════════════════════ */
function sheetNameFor(sec,used,i){
  var t=sec.querySelector('.sec-title'),s=t?t.textContent.replace(/\s+/g,' ').trim():'';
  var hasHdr=!!sec.querySelector('.ofc-title');
  var n;
  if(!hasHdr)n='Form 47';
  else if(/abstract/i.test(s))n='Abstract';
  else if(/measurement/i.test(s))n='Measurement Book';
  else if(/comparative/i.test(s))n='Comparative';
  else if(/testing/i.test(s))n='Testing Charges';
  else if(/royalty/i.test(s))n='Royalty';
  else if(/cement/i.test(s))n='Cement Consumption';
  else if(/consumption/i.test(s))n='Consumption Chart';
  else n=s||('Sheet '+(i+1));
  n=n.replace(/[\[\]:*?\/\\]/g,' ').substring(0,31).trim()||('Sheet '+(i+1));
  var base=n,k=2;while(used[n.toLowerCase()]){n=base.substring(0,28)+' '+k;k++;}
  used[n.toLowerCase()]=1;return n;
}

/* run printRaFormat() with window.open stubbed → grab the exact HTML that would be printed */
function captureRaPrintHtml(){
  var buf=[],orig=root.open;
  root.open=function(){return{document:{write:function(x){buf.push(x);},close:function(){}},focus:function(){},print:function(){}};};
  try{printRaFormat();}finally{root.open=orig;}
  return buf.join('');
}

function buildRaPrintWorkbook(ExcelJSlib,html,meta){
  var wb=new ExcelJSlib.Workbook();
  wb.creator='ATP Maha PWD — RA Bill';wb.created=new Date();
  var doc=new DOMParser().parseFromString(html,'text/html');
  var secs=[].slice.call(doc.body.querySelectorAll(':scope > .sec'));
  if(!secs.length)throw new Error('Print format madhe kahich nahi — aadhi estimate / RE entries bhara');
  var used={};
  secs.forEach(function(sec,i){
    var ws=wb.addWorksheet(sheetNameFor(sec,used,i));
    htmlToSheet(ws,sec);
  });
  if(meta&&meta.title)wb.title=meta.title;
  return wb;
}

function say(m,t){
  if(typeof showToast==='function')showToast(m,t);
  else if(typeof toast==='function')toast(m);
  else if(root.console)console.log(m);
}
function ensureExcelJS(cb){
  if(typeof ExcelJS!=='undefined'){cb(true);return;}
  var sc=document.createElement('script');
  sc.src='https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
  sc.onload=function(){cb(typeof ExcelJS!=='undefined');};sc.onerror=function(){cb(false);};
  document.head.appendChild(sc);
}
function gv(id){var e=document.getElementById(id);return e?(e.value||''):'';}
function download(wb,fname,okMsg){
  return wb.xlsx.writeBuffer().then(function(buf){
    var blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    var url=URL.createObjectURL(blob),a2=document.createElement('a');
    a2.href=url;a2.download=fname;document.body.appendChild(a2);a2.click();
    setTimeout(function(){URL.revokeObjectURL(url);a2.remove();},800);
    say('✅ '+okMsg+': '+fname,'success');
  });
}

/* ── 1) RA Bill format ─────────────────────────────────────── */
function exportRaBillExcelPrint(){
  if(typeof ExcelJS==='undefined'){
    say('ExcelJS load hot aahe…','info');
    ensureExcelJS(function(ok){if(ok)exportRaBillExcelPrint();else say('ExcelJS load jhala nahi — internet / exceljs_min.js check kara','error');});
    return;
  }
  if(!APP.items||!APP.items.length){say('Aadhi Estimate load kara','warn');return;}
  var wb;
  try{
    try{APP.items.forEach(function(it){if(it.reEntries)msRecalc(it);});}catch(e){}
    wb=buildRaPrintWorkbook(ExcelJS,captureRaPrintHtml());
  }catch(e){console.error(e);say('Excel error: '+e.message,'error');return;}
  var bn=(gv('billNo')||gv('ahBillNo')||'RA').replace(/[^A-Za-z0-9_-]+/g,'_');
  var dt=(gv('billDate')||gv('ahBillDate')||'').replace(/[^0-9-]+/g,'');
  download(wb,'RA_Bill_'+bn+(dt?'_'+dt:'')+'.xlsx','Excel (RA Bill format)').catch(function(e){console.error(e);say('Excel error: '+e.message,'error');});
}

/* ── 2) 1st & Final Bill format (runs inside PWD_FINAL_BILL.html) ── */
function buildDocsWorkbook(lib,doc){
  var wb=new lib.Workbook();wb.creator='ATP Maha PWD — 1st & Final Bill';wb.created=new Date();
  var used={},n=0;
  [].slice.call(doc.body.querySelectorAll(':scope > .xl-doc')).forEach(function(w,i){
    var nm=(w.getAttribute('data-name')||('Sheet '+(i+1))).replace(/[\[\]:*?\/\\]/g,' ').substring(0,31).trim()||('Sheet '+(i+1)),base=nm,k=2;
    while(used[nm.toLowerCase()]){nm=base.substring(0,28)+' '+k;k++;}
    used[nm.toLowerCase()]=1;
    var ws=wb.addWorksheet(nm);
    var rows=htmlToSheet(ws,w,{computed:true});
    if(!rows){wb.removeWorksheet(ws.id);return;}
    n++;
  });
  if(!n)throw new Error('Kahich print karayla nahi — aadhi bill bhara');
  return wb;
}
function exportFinalBillExcel(){
  return new Promise(function(resolve,reject){
    if(typeof ExcelJS==='undefined'){
      say('ExcelJS load hot aahe…','info');
      ensureExcelJS(function(ok){if(ok)exportFinalBillExcel().then(resolve,reject);else{say('ExcelJS load jhala nahi — internet / exceljs_min.js check kara','error');reject(new Error('ExcelJS'));}});
      return;
    }
    if(typeof DOCS==='undefined'||typeof S==='undefined'){reject(new Error('Final Bill page nahi'));return;}
    if(!S.items.length&&!confirm('No items entered yet. Export anyway?')){reject(new Error('cancelled'));return;}
    var parts=DOCS.map(function(d){
      var h='';try{h=(d.id==='f46')?dF46(false,true):d.fn(false);}catch(e){console.error(e);}
      return '<div class="xl-doc" data-name="'+String(d.label).replace(/"/g,'&quot;')+'">'+h+'</div>';
    }).join('');
    var cssEl=document.getElementById('docCss'),css=(cssEl?cssEl.textContent:'').replace(/@media\s+print/g,'@media all');
    css+='body{margin:0;background:#fff}.page{width:710px!important;min-height:0!important;margin:0!important;box-shadow:none!important}.page.land{width:1047px!important}';
    var fr=document.createElement('iframe');
    fr.style.cssText='position:fixed;left:-12000px;top:0;width:1100px;height:900px;border:0;visibility:hidden';
    fr.onload=function(){
      /* ignore the empty about:blank load fired on append */
      if(!fr.contentDocument||!fr.contentDocument.body||!fr.contentDocument.body.querySelector('.xl-doc'))return;
      var wb;
      try{wb=buildDocsWorkbook(ExcelJS,fr.contentDocument);}
      catch(e){console.error(e);fr.remove();say('Excel error: '+e.message,'error');reject(e);return;}
      fr.remove();
      var ag=((typeof S!=='undefined'&&S.m&&S.m.agrNo)||'draft').replace(/[^A-Za-z0-9_-]+/g,'_');
      download(wb,'Final_Bill_'+ag+'.xlsx','Excel (1st & Final format)').then(resolve,function(e){console.error(e);say('Excel error: '+e.message,'error');reject(e);});
    };
    /* set content BEFORE appending so the first load is the real document */
    fr.srcdoc='<!DOCTYPE html><html><head><meta charset="UTF-8"><style>'+css+'</style></head><body>'+parts+'</body></html>';
    document.body.appendChild(fr);
  });
}

/* RA Bill app → open PWD_FINAL_BILL.html with this bill's data and let it export */
function exportFirstFinalExcel(){
  try{renderAbstract();}catch(e){}
  try{root._msFFState=msBuildFFState();}catch(e){console.error(e);say('Data tayar karta aala nahi: '+e.message,'error');return;}
  var w=root.open('PWD_FINAL_BILL.html#autoexcel','_blank');
  if(!w){say('Popup blocked — allow popups for this page','error');return;}
  say('1st & Final Bill Excel tayar hot aahe…','success');
}

/* [Export Excel] button in RA Bill app → format chooser */
function chooseExcelFormat(){
  if(!APP.items||!APP.items.length){say('Aadhi Estimate load kara','warn');return;}
  var old=document.getElementById('msXlModal');if(old)old.remove();
  var d=document.createElement('div');d.id='msXlModal';
  d.style.cssText='position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:99999;padding:12px';
  var bs='display:block;width:100%;text-align:left;padding:10px 12px;margin-bottom:8px;border:1px solid #1a2744;border-radius:8px;background:#f4f6fb;color:#000;cursor:pointer;font-size:14px;white-space:normal';
  d.innerHTML='<div style="background:#fff;color:#000;border-radius:12px;padding:16px;width:min(560px,94vw)">'
    +'<h3 style="margin:0 0 4px">📊 Export Excel — format nivda</h3>'
    +'<div style="font-size:12px;color:#555;margin-bottom:10px">Print madhe jasa format yeto tasach Excel madhe yeil.</div>'
    +'<button type="button" id="msXl1" style="'+bs+'"><b>📘 1) RA Bill format</b><br><span style="font-size:11px">Form 47 + Abstract + Measurement Book + Comparative + Testing + Royalty + Consumption + Cement</span></button>'
    +'<button type="button" id="msXl2" style="'+bs+'"><b>📗 2) 1st &amp; Final Bill format</b><br><span style="font-size:11px">Forwarding Letter, Checklist, Form 46, Comparative, Cement, Royalty, No Dues Certificate (PWD_FINAL_BILL — Print All sarkhe)</span></button>'
    +'<div style="text-align:right"><button type="button" id="msXlC" style="padding:6px 14px;border:1px solid #999;border-radius:6px;background:#eee;color:#000;cursor:pointer">Cancel</button></div></div>';
  document.body.appendChild(d);
  function close(){d.remove();}
  d.addEventListener('mousedown',function(e){if(e.target===d)close();});
  document.getElementById('msXlC').onclick=close;
  document.getElementById('msXl1').onclick=function(){close();exportRaBillExcelPrint();};
  document.getElementById('msXl2').onclick=function(){close();exportFirstFinalExcel();};
}

root.exportRaBillExcel=chooseExcelFormat;
root.exportRaBillExcelPrint=exportRaBillExcelPrint;
root.exportFirstFinalExcel=exportFirstFinalExcel;
root.exportFinalBillExcel=exportFinalBillExcel;
root.msHtmlToSheet=htmlToSheet;
root.msBuildRaPrintWorkbook=buildRaPrintWorkbook;
if(typeof module!=='undefined'&&module.exports)module.exports={htmlToSheet:htmlToSheet,buildRaPrintWorkbook:buildRaPrintWorkbook,buildDocsWorkbook:buildDocsWorkbook,sheetNameFor:sheetNameFor};
})(typeof window!=='undefined'?window:globalThis);
