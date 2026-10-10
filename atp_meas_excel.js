
/* ══ MEASUREMENT SHEET — EXCEL DOWNLOAD / UPLOAD ═══════════════════════════
   Template: fakt headings aslela blank Excel. Item No + Nos/L/B/D bhara, upload kara — Description/rate SSR madhun app ghete.
   Nos/L/B/D madhe cell-reference formula -> app madhe live link (=1.0L*2). NIYAM table chya right side (column N) la.
   Download: pratyek item che measurement rows ek .xlsx madhe (Item No, Floor, Detail, Nos, L, B, D/H, Qty, Type, RowID).
   Upload : Excel madhe bharlele / badalelele rows parat app madhe ghete.
     • RowID asleli row  -> tich row update hote (links / % rows / order tasech rahtat)
     • RowID nasleli row -> item chya shevti navin row add hote
     • Item No estimate madhe nasel tar SSR madhun navin item banto (rate, CF, lead sahit)
     • Type: (rikam)=Normal, D=Deduction, LINK/TOTAL = skip
     • Constant-only formula (=2*3.5+1.2) formula mhanun store hote; cell-reference formula chi value ghetli jate.
   NOTE: Excel madhe row delete keli tar app madhun delete hot nahi. */
var ATP_MX_HDR=['Item No','Description','Unit','Floor','Detail / Remark','Nos','L','B','D/H','Qty','Type','RowID'];
var ATP_MX_FL=['G','1st','2nd','3rd','4th'];
function atpMxNum(s){
  if(s===null||s===undefined)return null;
  s=String(s).replace(/[,\s\u00a0]/g,'');
  if(s==='')return null;
  var v=parseFloat(s);
  return isNaN(v)?null:v;
}
/* Excel formula -> app formula ('=...') jar sagle operands numbers asatil, nahitar null */
function atpMxFormula(f){
  if(!f)return null;
  var e=String(f).trim();
  if(e.charAt(0)!=='=')return null;
  e=e.substring(1).replace(/\s+/g,'');
  var g=0;
  while(/(SUM|AVERAGE)\(([^()]*)\)/i.test(e)&&g++<10){
    e=e.replace(/(SUM|AVERAGE)\(([^()]*)\)/ig,function(m,fn,args){
      var p=args.split(/[,;]/),k;
      for(k=0;k<p.length;k++)if(!/^[0-9]*\.?[0-9]+$/.test(p[k]))return 'X';
      var q='('+p.join('+')+')';
      return /^AVERAGE$/i.test(fn)?'('+q+'/'+p.length+')':q;
    });
  }
  if(!e||!/^[0-9+\-*\/().]+$/.test(e)||e.indexOf('//')>-1||e.indexOf('**')>-1)return null;
  try{var r=Function('"use strict";return ('+e+')')();if(typeof r!=='number'||!isFinite(r))return null;}catch(x){return null;}
  return '='+e;
}

/* ── LINKS: Excel cell reference  <->  app link syntax (=N.rF : N=item no., r=row no. (0 pasun), F=L/B/D/N) ──
   Download: app madhil =1.0L*2  ->  Excel madhe =G2*2        Upload: =G2*2 -> app madhe =1.0L*2 (live link) */
function atpMxTokToExcel(tf,erMap){
  var e=String(tf).replace(/\s+/g,''),bad=false;
  if(e.charAt(0)!=='=')return null;
  e=e.substring(1);
  e=e.replace(/(\d+)\.(\d*)([LBDHN])/gi,function(m,ino,rno,fld){
    var er=erMap[(parseInt(ino,10)-1)+'.'+(rno===''?0:parseInt(rno,10))];
    if(!er){bad=true;return 'X';}
    return ({L:'G',B:'H',D:'I',H:'I',N:'F'})[fld.toUpperCase()]+er;
  });
  if(bad)return null;
  var chk=e.replace(/[A-Z]\d+/g,'0');
  if(!chk||!/^[0-9+\-*\/().]+$/.test(chk)||chk.indexOf('//')>-1||chk.indexOf('**')>-1)return null;
  return e;
}
/* fakt ek cell cha reference (=G2) aani same field (L cell la G column) -> source row cha xmap entry, nahitar null */
function atpMxPureRef(xf,colField,xmap,field){
  var e=String(xf).replace(/[\s$]/g,'');
  if(e.charAt(0)==='=')e=e.substring(1);
  var m=/^([A-Z]{1,3})(\d+)$/i.exec(e);if(!m)return null;
  var fld=colField[m[1].toUpperCase()];
  if(!fld||fld.toLowerCase()!==field)return null;
  return xmap[parseInt(m[2],10)]||null;
}
/* xf = Excel formula, xmap = {excelRow:{it,r}}, colField = {'G':'L',...}, self = {r,f} */
function atpMxLinkFormula(xf,xmap,colField,self){
  var e=String(xf).replace(/\s+/g,'').replace(/\$/g,'');
  if(e.charAt(0)==='=')e=e.substring(1);
  if(!e||/[!'"]/.test(e))return null;
  var ok=true,g=0;
  while(/(SUM|AVERAGE)\(([^()]*)\)/i.test(e)&&g++<20){
    e=e.replace(/(SUM|AVERAGE)\(([^()]*)\)/ig,function(m,fn,args){
      var parts=[],a=args.split(','),k;
      for(k=0;k<a.length;k++){
        var seg=a[k],rm=/^([A-Z]{1,3})(\d+):([A-Z]{1,3})(\d+)$/i.exec(seg);
        if(rm){
          if(rm[1].toUpperCase()!==rm[3].toUpperCase()){ok=false;return 'X';}
          var r1=+rm[2],r2=+rm[4],t;if(r1>r2){t=r1;r1=r2;r2=t;}
          if(r2-r1>200){ok=false;return 'X';}
          for(var q=r1;q<=r2;q++)parts.push(rm[1].toUpperCase()+q);
        }else if(/^[0-9]*\.?[0-9]+$/.test(seg)||/^[A-Z]{1,3}\d+$/i.test(seg))parts.push(seg);
        else{ok=false;return 'X';}
      }
      var sum='('+parts.join('+')+')';
      return /^AVERAGE$/i.test(fn)?'('+sum+'/'+parts.length+')':sum;
    });
  }
  if(!ok)return null;
  var bad=false;
  e=e.replace(/([A-Z]{1,3})(\d+)/gi,function(m,c,rn){
    var fld=colField[c.toUpperCase()],xm=xmap[parseInt(rn,10)];
    if(!fld||!xm){bad=true;return 'X';}
    if(xm.r===self.r&&fld.toLowerCase()===self.f){bad=true;return 'X';}      /* swatachya cell cha reference = circular */
    var ii=items.indexOf(xm.it);
    var ri=xm.it.rows.filter(function(x){return !x.isTot;}).indexOf(xm.r);
    if(ii<0||ri<0){bad=true;return 'X';}
    return (ii+1)+'.'+ri+fld;
  });
  if(bad)return null;
  var chk=e.replace(/\d+\.\d+[LBDN]/g,'0');
  if(!/^[0-9+\-*\/().]+$/.test(chk)||chk.indexOf('//')>-1||chk.indexOf('**')>-1)return null;
  return '='+e;
}
function atpMxToast(m,t){if(typeof showToast==='function')showToast(m,t||'info');else alert(m);}
function atpMxFlName(it,k){return flLabel(it,k||0,ATP_MX_FL);}
function atpMxFlIdx(it,txt){
  var s=String(txt==null?'':txt).trim().toLowerCase();if(!s)return null;
  var b=flBands(it),n=b?b.length:5,k,sets=[ATP_MX_FL,FL_STD_FORM,FL_STD_LONG];
  for(k=0;k<n;k++){
    if(flLabel(it,k,ATP_MX_FL).toLowerCase()===s)return k;
    for(var q=0;q<sets.length;q++)if(!b&&String(sets[q][k]).toLowerCase()===s)return k;
  }
  if(!b){if(s==='ground'||s==='ground floor'||s==='gf'||s==='g')return 0;}
  return null;
}
function atpMxEvalF(fx){
  try{var v=Function('"use strict";return ('+String(fx).substring(1)+')')();return(typeof v==='number'&&isFinite(v))?v:null;}catch(e){return null;}
}
function atpMxCol(i){return String.fromCharCode(65+i);}

/* ── EXCEL WRITER: ExcelJS (dropdowns) -> fallback SheetJS (dropdown nahit) ── */
var ATP_MX_FL_LIST='G,1st,2nd,3rd,4th';
var ATP_MX_TYPE_LIST='Normal,Deduction';
var ATP_MX_W=[10,38,7,8,30,7,9,9,9,11,10,12,3,118];   /* A..L = table, M = gap, N = NIYAM (rules) */
/* NIYAM — table chya right side la (column N) Excel sheet madhech dakhavle jatat. Upload var N column vachla jat nahi. */
function atpMxRules(){
  return [
    '📘 NIYAM / RULES — he vachun mag table bharaa  (ha column N upload var vachla jat nahi)',
    '▶ TABLE KASA BHARAYCHA',
    '1) Item No lihaa (SSR sarkha, text). Description / Unit / Rate rikam sodaa — upload var app SSR madhun automatic gheil.',
    '2) Ek item che jewdhe rows pahijet tewdhe khali-khali lihaa. Item No pahilya row madhe lihila tari chalel;',
    '    pudhchya rows madhe Item No rikam sodla tar to adhicha item gheil. Pudcha item: navin Item No lihaa.',
    '3) Floor aani Type dropdown madhun nivdaa. Floor rikam asel tar adhichya row cha floor gheto (pahila = G).',
    '4) Type: rikam = Normal, Deduction = vajaa (qty minus). LINK / TOTAL rows upload var skip hotat.',
    '5) Nos, L, B, D/H bharaa. Qty app swata calculate karel = Nos x L x B x D/H (rikam / 0 asel te multiply hot nahi).',
    '6) Swata total kela asel tar Nos/L/B/D rikam thevun Qty column madhe constant taka — to direct ghetla jaail.',
    '    (Qty column madhil formula app ghet nahi; to fakt tumchya tapasnisathi aahe.)',
    '▶ FORMULA / LINK',
    '7) Nos/L/B/D madhe formula chalto: =2*3.5+1.2 (constant formula — app madhe formula mhanun store hote).',
    '8) Dusrya row cha reference = LIVE LINK. Columns: F = Nos, G = L, H = B, I = D/H.',
    '    a) Fakt reference, same column cha (L madhe =G2, Nos madhe =F2, B madhe =H2, D madhe =I2) => app madhe NILA 🔗 Linked row',
    '        (cell nila + readonly, ✂ Unlink button). Ya row che sagle link-cells ek-ch source row cha asave; Type (Normal/Deduction) same asava.',
    '    b) Calculation (L madhe =G2*2, =H2+H3, =SUM(G2:G4), Nos madhe =F2+1) => HIRVA ƒ Link (cell hirva, ƒ badge, mouse nevun formula disto).',
    '    Doni live aahet: source row cha L/B/D/Nos badlla ki he pan aapoaap badlato. Source row ya ch file madhe (Item No + number sah) asavi.',
    '    Link nighaycha asel tar: nila = ✂ Unlink; hirva = tya cell madhe nave value taka.',
    '9) Chalat nahit (fakt Excel ni calculate keleli value ghetli jaate): Qty (J) cha reference, dusrya sheet cha reference,',
    '    IF / VLOOKUP sarkhe functions, don vegvegalya columns cha range, swatachya ch cell cha reference (circular).',
    '▶ ROW ID (column L)',
    '10) RowID = app madhil row chi olakh (Download Current madhe app lihito). Badlu naka, copy-paste karu naka. Template madhe rikam.',
    '11) RowID asleli row = update hote.  RowID rikam = navin row add hote.  RowID copy keli tar tisri row navin row mhanun add hote.',
    '12) RowID asleli row chi values clear keli (rikam sodli) tar ti row skip hote — app madhil row tashich rahte (delete / zero hot nahi).',
    '▶ SKIP / CHUKA',
    '13) Skip hotat: purna rikami row; Item No nasleli (aani mage item nasleli) row; SSR madhe nasleli Item No;',
    '      fakt Detail text aslela pan Nos/L/B/D/Qty kahich nasleli row. Upload adhi summary yete — tyat nakki tapasaa.',
    '14) Navin Item No SSR madhe asel tar item automatic banto (rate, CF, lead sahit) — estimate chya shevti add hoto.',
    '15) Excel madhe row delete keli tar app madhun delete hot nahi (delete app madhech kara). % rows ya sheet madhe nahit.',
    '16) Ek-ch file don-veli upload kelyas RowID nasleli rows dohi veli add hotil.'
  ];
}
function atpMxAddRules(aoa){
  var lines=atpMxRules(),i;
  for(i=0;i<lines.length;i++){
    if(!aoa[i])aoa[i]=[];
    while(aoa[i].length<13)aoa[i].push('');
    aoa[i][13]=lines[i];
  }
  return aoa;
}
function atpMxLoadExcelJS(cb){
  if(window.ExcelJS){cb(window.ExcelJS);return;}
  var sc=document.createElement('script');
  sc.src='https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
  sc.onload=function(){cb(window.ExcelJS||null);};
  sc.onerror=function(){cb(null);};
  document.head.appendChild(sc);
}
function atpMxDownload(buf,name){
  var blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;
  document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1500);
}
/* o={file,aoa,fcells:[{a,f,v}],flRows:{excelRow:'list'},dvRows:lastRowForDropdowns,tpl:bool,okMsg} */
function atpMxSave(o){
  o.aoa=atpMxAddRules(o.aoa);
  atpMxLoadExcelJS(function(EJ){
    if(!EJ){atpMxSaveSJ(o,true);return;}
    try{atpMxSaveEJ(EJ,o);}catch(e){console.error(e);atpMxSaveSJ(o,true);}
  });
}
function atpMxSaveEJ(EJ,o){
  var wb=new EJ.Workbook(),ws=wb.addWorksheet('Measurement',{views:[{state:'frozen',ySplit:1}]}),i,j;
  ws.columns=ATP_MX_W.map(function(w){return {width:w};});
  o.aoa.forEach(function(row){ws.addRow(row.map(function(v){return(v===''||v===undefined)?null:v;}));});
  var hr=ws.getRow(1);hr.font={bold:true,color:{argb:'FFFFFFFF'}};
  hr.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF1A237E'}};
  o.fcells.forEach(function(c){ws.getCell(c.a).value={formula:c.f,result:c.v};});
  var last=Math.max(o.dvRows||o.aoa.length,o.aoa.length);
  for(i=2;i<=last;i++){
    ws.getCell(i,1).numFmt='@';   /* Item No text rahava (2.10 -> 2.1 hou naye) */
    var fl=(o.flRows&&o.flRows[i])||ATP_MX_FL_LIST;
    ws.getCell(i,4).dataValidation={type:'list',allowBlank:true,formulae:['"'+fl+'"'],showErrorMessage:true,errorStyle:'warning',errorTitle:'Floor',error:'Dropdown madhun floor nivdaa'};
    ws.getCell(i,11).dataValidation={type:'list',allowBlank:true,formulae:['"'+ATP_MX_TYPE_LIST+'"'],showErrorMessage:true,errorStyle:'warning',errorTitle:'Type',error:'Normal kinva Deduction nivdaa'};
  }
  for(i=2;i<=o.aoa.length;i++){var ro=o.aoa[i-1];if(ro&&ro[10]==='TOTAL')ws.getRow(i).font={bold:true};}
  /* NIYAM column (N) cha styling */
  var nl=atpMxRules();
  nl.forEach(function(t,k){
    var c=ws.getCell(k+1,14);
    if(k===0){c.font={bold:true,color:{argb:'FFFFFFFF'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFE65100'}};}
    else if(t.charAt(0)==='▶'){c.font={bold:true,color:{argb:'FFC62828'}};}
    else{c.font={color:{argb:'FF263238'}};}
  });
  wb.xlsx.writeBuffer().then(function(buf){
    atpMxDownload(buf,o.file);atpMxToast(o.okMsg,'success');
  }).catch(function(e){console.error(e);atpMxSaveSJ(o,true);});
}
function atpMxSaveSJ(o,warn){
  if(typeof XLSX==='undefined'){atpMxToast('SheetJS not loaded','error');return;}
  var ws=XLSX.utils.aoa_to_sheet(o.aoa);
  o.fcells.forEach(function(c){ws[c.a]={t:'n',v:c.v,f:c.f};});
  ws['!cols']=ATP_MX_W.map(function(w){return {wch:w};});
  var wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Measurement');
  XLSX.writeFile(wb,o.file);
  atpMxToast(o.okMsg+(warn?' (dropdown nahit — ExcelJS load zala nahi, Floor G/1st/2nd/3rd/4th & Type Deduction swata lihaa)':''),warn?'info':'success');
}

/* ── DOWNLOAD (current estimate) ── */
function atpMxExport(){
  if(!items.length){atpMxToast('Estimate madhe item nahi','error');return;}
  var aoa=[ATP_MX_HDR.slice()],fcells=[],flRows={},stamp=Date.now().toString(36),seq=0;
  /* pre-pass: pratyek (item,row) cha Excel row number — link formulas (=1.0L*2) Excel refs (G2*2) madhe convert karnyasathi */
  var erMap={},er0=2;
  items.forEach(function(it,ii){
    if(!it.rows)return;
    var real=0,any0=false;
    it.rows.forEach(function(r){if(!r||r.isTot)return;if(!r.isPct){erMap[ii+'.'+real]=er0++;any0=true;}real++;});
    if(any0)er0+=2;
  });
  items.forEach(function(it){
    if(!it.rows)return;
    var firstEr=aoa.length+1,lastEr=firstEr-1,any=false;
    var bands=flBands(it),nFl=bands?bands.length:5,fl=[],k;
    for(k=0;k<nFl;k++)fl.push(atpMxFlName(it,k));
    var flStr=fl.join(',');
    var flOk=flStr.length<250&&fl.every(function(x){return String(x).indexOf(',')<0&&String(x).indexOf('"')<0;});
    it.rows.forEach(function(r){
      if(!r||r.isTot||r.isPct)return;
      if(!r._xid)r._xid='r'+stamp+(seq++).toString(36);
      var er=aoa.length+1,lk=!!r._linkedFrom;
      var type=lk?'LINK':(r.isDeduct?'Deduction':'');
      var row=[it.no,any?'':(it.desc||''),any?'':(it.unit||''),atpMxFlName(it,r.fl),r.lbl||'',r.n||1,'','','','',type,r._xid];
      if(!lk&&r._f&&r._f.n){   /* Nos madhe formula / link */
        var fxn=atpMxFormula(r._f.n),xn=fxn?fxn.substring(1):atpMxTokToExcel(r._f.n,erMap);
        if(xn)fcells.push({a:'F'+er,f:xn,v:r.n||1});
      }
      ['l','b','d'].forEach(function(f,fi){
        var v=r[f],cIdx=6+fi;
        row[cIdx]=(v!=null&&v!==0)?v:'';
        var xf=null;
        if(!lk&&r._f&&r._f[f]){var fx0=atpMxFormula(r._f[f]);xf=fx0?fx0.substring(1):atpMxTokToExcel(r._f[f],erMap);}
        if(xf)fcells.push({a:atpMxCol(cIdx)+er,f:xf,v:(v!=null?v:0)});
      });
      var qf='IF(OR(K'+er+'="D",K'+er+'="Deduction"),-1,1)*IF(N(F'+er+')=0,1,F'+er+')*IF(N(G'+er+')=0,1,G'+er+')*IF(N(H'+er+')=0,1,H'+er+')*IF(N(I'+er+')=0,1,I'+er+')';
      if(!lk)fcells.push({a:'J'+er,f:qf,v:r.qty||0});else row[9]=r.qty||0;
      if(flOk&&flStr!==ATP_MX_FL_LIST)flRows[er]=flStr;
      aoa.push(row);any=true;lastEr=er;
    });
    if(any){
      var te=aoa.length+1;
      aoa.push([it.no,'','','','Total','','','','','','TOTAL','']);
      fcells.push({a:'J'+te,f:'SUM(J'+firstEr+':J'+lastEr+')',v:it.qty||0});
      aoa.push([]);
    }
  });
  var d=new Date(),p=function(n){return(n<10?'0':'')+n;};
  atpMxSave({file:'Measurement_'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'.xlsx',aoa:aoa,fcells:fcells,flRows:flRows,
    dvRows:aoa.length+60,tpl:false,okMsg:'Measurement Excel download zala'});
}

/* ── BLANK TEMPLATE (fakt headings + dropdowns) ── */
function atpMxTemplate(){
  atpMxSave({file:'Measurement_Template.xlsx',aoa:[ATP_MX_HDR.slice()],fcells:[],flRows:{},dvRows:500,tpl:true,
    okMsg:'Blank Measurement template download zala'});
}

/* ── UPLOAD ── */
function atpMxFindItem(no){
  var k,s=String(no).trim();
  for(k=0;k<items.length;k++)if(String(items[k].no).trim()===s)return k;
  var f=parseFloat(s),hit=-1,cnt=0;
  if(!isNaN(f)){for(k=0;k<items.length;k++)if(parseFloat(items[k].no)===f&&String(items[k].no).trim().replace(/0+$/,'')===s.replace(/0+$/,'')){hit=k;cnt++;}}
  return cnt===1?hit:-1;
}
function atpMxFindSSR(no){
  var k,s=String(no).trim();
  for(k=0;k<SSR.length;k++)if(String(SSR[k][0]).trim()===s)return SSR[k];
  var f=parseFloat(s),hit=null,cnt=0;
  if(!isNaN(f)){for(k=0;k<SSR.length;k++)if(parseFloat(SSR[k][0])===f&&String(SSR[k][0]).trim().replace(/0+$/,'')===s.replace(/0+$/,'')){hit=SSR[k];cnt++;}}
  return cnt===1?hit:null;
}
function atpMxNewItem(d){
  var no=d[0],keyF=String(parseFloat(no));
  var cf=CF_MAP[no]||CF_MAP[keyF]||{};
  var raw=SCADA[no]||SCADA[keyF]||0,sv=(raw&&!CANCEL_SCADA)?CUSTOM_SCADA_VAL:0;
  var res=calcItemLead(cf),rate=d[3]||0,fr=Math.round((rate+res.total+sv)*100)/100;
  items.push({id:Date.now()+items.length,no:no,desc:(d[1]||''),unit:uClean(d[2]||''),spec:(d[4]||''),
    baseRate:rate,cf:cf,scadaVal:sv,leadPerUnit:Math.round(res.total*100)/100,leadMats:res.mats,
    finalRate:fr,qty:0,rows:[],amount:0});
  return items.length-1;
}
function atpMxParse(ws){
  var ref=ws['!ref'];if(!ref)return {err:'Sheet rikama aahe'};
  var rg=XLSX.utils.decode_range(ref),r,c,hr=-1,map={};
  var cellAt=function(rr,cc){return ws[XLSX.utils.encode_cell({r:rr,c:cc})];};
  for(r=rg.s.r;r<=Math.min(rg.e.r,rg.s.r+15)&&hr<0;r++){
    for(c=rg.s.c;c<=rg.e.c;c++){var h=cellAt(r,c);if(h&&String(h.v).trim().toLowerCase()==='item no'){hr=r;break;}}
  }
  if(hr<0)return {err:'"Item No" header sapadla nahi — app madhun download kelelee sheet vapra'};
  for(c=rg.s.c;c<=rg.e.c;c++){
    var hc=cellAt(hr,c);if(!hc)continue;
    var t=String(hc.v).trim().toLowerCase();
    if(t==='item no')map.no=c;else if(t==='floor')map.fl=c;else if(t.indexOf('detail')===0)map.lbl=c;
    else if(t==='nos'||t==='n')map.n=c;else if(t==='l')map.l=c;else if(t==='b')map.b=c;
    else if(t==='d/h'||t==='d'||t==='h')map.d=c;else if(t==='qty')map.qty=c;else if(t==='type')map.type=c;else if(t==='rowid')map.rid=c;
  }
  if(map.no==null)return {err:'Item No column sapadla nahi'};
  var ops=[],prev='',noCache=0,refF=0,orphans=[],noNum=[],dups=0,seenRid={},ridRows=[];
  var txt=function(cc){var x=cc==null?null:cellAt(r,cc);return(x&&x.v!=null)?String(x.v).trim():'';};
  var num=function(cc,isQty){
    var x=cc==null?null:cellAt(r,cc);if(!x)return {has:false};
    /* Qty column chi formula (Excel ni auto-calc keleli) ignore — fakt tumhi swata typed constant/constant-formula ghetla jato */
    if(isQty&&x.f&&!atpMxFormula('='+x.f))return {has:false};
    var fx=x.f?atpMxFormula('='+x.f):null,val=null;
    if(fx)val=atpMxEvalF(fx);
    var xf=null;
    if(val===null){fx=null;if(x.t!=='e')val=atpMxNum(x.v);if(x.f){xf=x.f;refF++;if(x.v==null)noCache++;}}
    var has=(val!==null)||(x.v!=null&&String(x.v).trim()!=='')||!!xf;
    return {has:has,val:val,fx:fx,xf:xf};
  };
  for(r=hr+1;r<=rg.e.r;r++){
    var tU=txt(map.type).toUpperCase();
    var type=(tU==='D'||tU==='DED'||tU==='DEDUCT'||tU==='DEDUCTION')?'D':tU;
    if(type==='TOTAL')continue;
    if(type==='LINK'){var lr=txt(map.rid);if(lr)ridRows.push({row:r+1,rid:lr});continue;}   /* LINK row upload var skip, pan tichyakade reference asu shakto */
    var no=txt(map.no);if(no)prev=no;else no=prev;
    var o={no:no,type:type,rid:txt(map.rid),lbl:txt(map.lbl),flTxt:txt(map.fl),n:num(map.n),l:num(map.l),b:num(map.b),d:num(map.d),q:num(map.qty,true),row:r+1};
    var hasNum=o.n.has||o.l.has||o.b.has||o.d.has||(o.q.has&&o.q.val);
    if(!hasNum){if(o.lbl)noNum.push(r+1);continue;}   /* rikami row / fakt text = skip (qty 1 hou naye mhanun) */
    if(!no){orphans.push(r+1);continue;}                                                /* data aahe pan Item No nahi */
    if(o.rid)ridRows.push({row:r+1,rid:o.rid});
    if(o.rid){if(seenRid[o.rid]){o.rid='';dups++;}else seenRid[o.rid]=1;}               /* copy keleli row = navin row */
    ops.push(o);
  }
  var colField={};
  ['n','l','b','d'].forEach(function(f){if(map[f]!=null)colField[XLSX.utils.encode_col(map[f])]=f.toUpperCase();});
  return {ops:ops,noCache:noCache,refF:refF,orphans:orphans,noNum:noNum,dups:dups,colField:colField,ridRows:ridRows};
}
function atpMxApply(P){
  var upd=0,add=0,newIt=0,skipLink=0,unknown={},ci,created={};
  /* pass 1: dry run for the summary */
  var st={upd:0,add:0,newIt:0,unk:{},cnt:{}},seenNew={};
  P.ops.forEach(function(o){
    var ix=atpMxFindItem(o.no);
    if(ix<0){
      if(!atpMxFindSSR(o.no)){st.unk[o.no]=1;o.skip=true;return;}
      if(!seenNew[o.no]){seenNew[o.no]=1;st.newIt++;}
      st.add++;st.cnt[o.no]=(st.cnt[o.no]||0)+1;return;
    }
    st.cnt[items[ix].no]=(st.cnt[items[ix].no]||0)+1;
    var found=false;
    if(o.rid)(items[ix].rows||[]).forEach(function(r){if(r._xid===o.rid)found=true;});
    if(found)st.upd++;else st.add++;
  });
  var unk=Object.keys(st.unk);
  var msg='Excel Upload:\n• Update hotil: '+st.upd+' row(s)\n• Navin rows: '+st.add+'\n• Navin items (SSR madhun): '+st.newIt;
  var ck=Object.keys(st.cnt);
  if(ck.length)msg+='\n• Item-wise rows: '+ck.slice(0,10).map(function(k){return k+' ('+st.cnt[k]+')';}).join(', ')+(ck.length>10?' …':'');
  if(unk.length)msg+='\n• Item No sapadle nahit (skip): '+unk.join(', ');
  if(P.orphans&&P.orphans.length)msg+='\n• Item No nahi mhanun skip (Excel row): '+P.orphans.slice(0,12).join(', ')+(P.orphans.length>12?' …':'');
  if(P.noNum&&P.noNum.length)msg+='\n• Number (Nos/L/B/D/Qty) nahi mhanun skip (Excel row): '+P.noNum.slice(0,12).join(', ')+(P.noNum.length>12?' …':'');
  if(P.dups)msg+='\n• '+P.dups+' row(s) cha RowID duplicate hota (copy keleli) — navin row mhanun add hotil';
  if(P.refF)msg+='\n• '+P.refF+' cell(s) madhe cell-reference formula — jithe shakya (L/B/D/Nos cells), app madhe link (=1.0L) banel, nahitar fakt value';
  if(P.noCache)msg+='\n• '+P.noCache+' formula cell(s) chi value save navhti (Excel madhe save karun parat upload kara) — blank ghetli';
  if(!st.upd&&!st.add){alert('Upload karnyasarkhe kahich sapadle nahi.'+(unk.length?'\nItem No sapadle nahit: '+unk.join(', '):'')+(P.orphans&&P.orphans.length?'\nItem No nahi (Excel row): '+P.orphans.join(', '):'')+(P.noNum&&P.noNum.length?'\nNumber nahi (Excel row): '+P.noNum.join(', '):''));return;}
  if(!confirm(msg+'\n\nPudhe jaaych?'))return;
  /* pass 2: apply */
  var lastFl={},xmap={},pend=[];
  /* RowID asleli sagalya Excel rows (LINK sah) -> app row, mhanje tyanchyakade che references resolve hotil */
  var ridIdx={};
  items.forEach(function(x){(x.rows||[]).forEach(function(rw){if(rw&&rw._xid)ridIdx[rw._xid]={it:x,r:rw};});});
  (P.ridRows||[]).forEach(function(q){if(ridIdx[q.rid])xmap[q.row]=ridIdx[q.rid];});
  P.ops.forEach(function(o){
    if(o.skip)return;
    var ix=atpMxFindItem(o.no);
    if(ix<0){var d=atpMxFindSSR(o.no);if(!d)return;ix=atpMxNewItem(d);}
    var it=items[ix];if(!it.rows)it.rows=[];
    var r=null,isNew=false;
    if(!o.rid&&!it._mxCleaned){
      /* app ni add kelli rikami placeholder row (fakt 1 row, kahich nahi) -> navin rows adhi kaadhun taaka */
      it._mxCleaned=true;
      var nt=it.rows.filter(function(x){return !x.isTot;});
      if(nt.length===1){
        var z=nt[0];
        var blank=!z.isPct&&!z._linkedFrom&&!z.lbl&&!z.comment&&(z.n==null||z.n===1)&&!z.l&&!z.b&&!z.d&&!(z._f&&Object.keys(z._f).length);
        if(blank)it.rows.splice(it.rows.indexOf(z),1);
      }
    }
    if(o.rid){for(ci=0;ci<it.rows.length;ci++)if(it.rows[ci]._xid===o.rid){r=it.rows[ci];break;}}
    if(r&&(r.isTot||r.isPct||r._linkedFrom)){skipLink++;return;}
    if(!r){
      isNew=true;
      r={lbl:'',n:1,l:0,b:0,d:0,qty:0,fl:msrLastFloor(it)};
      var ti=it.rows.findIndex(function(x){return x.isTot;});
      if(ti>=0)it.rows.splice(ti,0,r);else it.rows.push(r);
    }
    if(o.type==='D')r.isDeduct=true;else delete r.isDeduct;
    /* Floor rikam asel tar ya upload madhil ya item chya adhichya row cha floor, nahitar G */
    var fl=atpMxFlIdx(it,o.flTxt);
    if(fl!==null)r.fl=fl;
    else if(isNew)r.fl=(lastFl[it.no]!=null)?lastFl[it.no]:0;
    lastFl[it.no]=r.fl||0;
    r.lbl=o.lbl;
    if(!r._f)r._f={};
    /* Nos: constant formula -> _f.n ; cell-reference -> link (pend) ; nahitar value */
    if(o.n.fx){r._f.n=o.n.fx;r.n=o.n.val||1;}
    else{delete r._f.n;r.n=(o.n.val||1);if(o.n.xf)pend.push({r:r,f:'n',xf:o.n.xf});}
    ['l','b','d'].forEach(function(f){
      var x=o[f];
      if(o.rid&&!x.has&&!isNew){r[f]=null;delete r._f[f];return;}
      if(x.fx)r._f[f]=x.fx;else delete r._f[f];
      r[f]=(x.val!==null&&x.val!==undefined)?x.val:null;
      if(x.xf)pend.push({r:r,f:f,xf:x.xf});                 /* cell-reference formula: sagle rows zalyavar link madhe convert */
    });
    xmap[o.row]={it:it,r:r};
    if(o.q&&o.q.has&&o.q.val!==null&&o.q.val!==undefined&&!o.l.has&&!o.b.has&&!o.d.has){
      /* L/B/D nahit, Qty direct dilay -> Nos madhe thev (qty = Nos) */
      r.n=(o.type==='D')?Math.abs(o.q.val):o.q.val;
      delete r._f.n;pend=pend.filter(function(p){return !(p.r===r&&p.f==='n');});
    }
    if(isNew)add++;else upd++;
  });
  items.forEach(function(x){delete x._mxCleaned;});
  /* floor-wise regroup adhi (row numbers final), mag Excel refs -> =N.rF links */
  msrRegroupAll();
  var linked=0,valOnly=0,nat=0,groups=[];
  pend.forEach(function(p){
    var g=null,k;for(k=0;k<groups.length;k++)if(groups[k].r===p.r){g=groups[k];break;}
    if(!g){g={r:p.r,list:[]};groups.push(g);}g.list.push(p);
  });
  groups.forEach(function(g){
    var r=g.r,src=null,same=true,flds=[];
    /* 1) sagle cells fakt same-field reference (L=G2, Nos=F2 ...) aani ek-ch source row -> app cha nila 🔗 row link */
    g.list.forEach(function(p){
      var xm=atpMxPureRef(p.xf,P.colField||{},xmap,p.f);
      if(!xm||xm.r===r){same=false;return;}
      if(src===null)src=xm;else if(src.r!==xm.r)same=false;
      flds.push(p.f);
    });
    if(same&&src&&!!src.r.isDeduct===!!r.isDeduct){
      var sIi=items.indexOf(src.it),sRi=src.it.rows.indexOf(src.r);
      if(sIi>=0&&sRi>=0){
        r._linkedFrom={iIdx:sIi,rIdx:sRi,fields:['n','l','b','d'].filter(function(f){return flds.indexOf(f)>-1;}),pct:100};
        if(r._f)flds.forEach(function(f){delete r._f[f];});
        nat+=g.list.length;return;
      }
    }
    /* 2) calculation / mixed -> hirva ƒ formula link (=1.0L*2) */
    g.list.forEach(function(p){
      var lf=atpMxLinkFormula(p.xf,xmap,P.colField||{},p);
      if(lf){if(!p.r._f)p.r._f={};p.r._f[p.f]=lf;linked++;}else valOnly++;
    });
  });
  msrSyncAllRows();
  for(var a=0;a<items.length;a++)items[a]=recalcItem(items[a]);
  rMS();updateAll();
  atpMxToast('Excel upload zala: '+upd+' update, '+add+' navin row'+(nat?', '+nat+' cell 🔗 link (nila)':'')+(linked?', '+linked+' cell ƒ link (hirva)':'')+(valOnly?', '+valOnly+' formula chi fakt value ghetli':'')+(skipLink?', '+skipLink+' linked/% skip':''),'success');
}
function atpMxImportFile(file){
  if(!file)return;
  if(typeof XLSX==='undefined'){atpMxToast('SheetJS not loaded','error');return;}
  var rd=new FileReader();
  rd.onload=function(e){
    try{
      var wb=XLSX.read(e.target.result,{type:'array'});
      var ws=wb.Sheets['Measurement']||wb.Sheets[wb.SheetNames[0]];
      var P=atpMxParse(ws);
      if(P.err){alert(P.err);return;}
      atpMxApply(P);
    }catch(err){alert('Excel vachta ala nahi: '+err.message);}
  };
  rd.readAsArrayBuffer(file);
}
function atpMxUploadClick(){
  var inp=document.getElementById('atpMxFile');
  if(!inp){
    inp=document.createElement('input');inp.type='file';inp.id='atpMxFile';
    inp.accept='.xlsx,.xls';inp.style.display='none';
    inp.onchange=function(){atpMxImportFile(inp.files[0]);inp.value='';};
    document.body.appendChild(inp);
  }
  inp.click();
}
function atpMxInject(){
  var p5=document.getElementById('p5');if(!p5||document.getElementById('mxBar'))return;
  var tw=p5.querySelector('.tw');if(!tw)return;
  var d=document.createElement('div');d.id='mxBar';d.className='noprt';d.style.cssText='margin:.4rem 0;display:flex;gap:.4rem;flex-wrap:wrap';
  d.innerHTML='<button class="btn" onclick="atpMxTemplate()" title="Fakt headings aslela blank Excel" style="background:#455a64;color:#fff;font-size:.62rem;padding:.3rem .7rem">📄 Blank Template</button>'
    +'<button class="btn" onclick="atpMxExport()" title="Measurement sheet Excel madhe download" style="background:#2e7d32;color:#fff;font-size:.62rem;padding:.3rem .7rem">⬇ Current Measurement Download</button>'
    +'<button class="btn" onclick="atpMxUploadClick()" title="Excel madhe bharlele measurement parat app madhe ghya" style="background:#e65100;color:#fff;font-size:.62rem;padding:.3rem .7rem">⬆ Measurement Excel Upload</button>';
  tw.parentNode.insertBefore(d,tw);
}
if(document.readyState!=='loading')setTimeout(atpMxInject,700);
else document.addEventListener('DOMContentLoaded',function(){setTimeout(atpMxInject,700);});
