/* ══════════════════════════════════════════════════════════════════════════════
   atp_kcomp.js  —  K1, K2, K3 COMPONENT  (Maha PWD Estimator)

   Output (same order / layout as the reference PDF):
     1. Cover page            (Public Works Department · K1,K2,K3 COMPONENT · Name of Work · Estimated Cost)
     2. LABOUR COMPONENT      Qty × SSR labour rate (SSR column 8 "labourRate") for every estimate item
     3. MATERIAL REQUIREMENT STATEMENT   Rubble Stone / Metal (40mm & above) · Crushed Metal · Murum · Sand
     4. ASPHALT COMPONENT     (bitumen, M.T.)
     5. CEMENT COMPONENT      (cement, M.T.)
     6. CALCULATION OF TRUCK KILOMETRE
     7. STATEMENT 5 : FINAL K1, K2, K3 SUMMARY SHEET        (portrait)  Govt. Resolution 16-5-2005 : K1 labour / K2 material / K3 POL = 100 %
                      (items total less Cement, Steel, Bitumen, CI/DI pipes at basic star rates)
     8. STATEMENT 6 PART A : RA BILL PRICE VARIATION - V1 labour, V2 material, V3 POL   (landscape)
     9. STATEMENT 6 PART B : V4 bitumen, V5 HYSD/mild steel, V6 cement, V7 CI/DI pipes, total V, optional ceiling   (landscape)

   Data comes from the app itself:  items[] (qty, cf, spec …) · SSR[] (labour rate, page no.) · CF_MAP via effCF() ·
   LR[] (bags→MT conversion) · #pName (Name of Work) · _atpGrandNow() (Estimated Cost).

   How to load:   <script src="atp_kcomp.js"></script>   AFTER atp_main.js (and after atp_secondary.js if you use it).
   How to open:   a small "K1·K2·K3" button appears bottom-left (set  window.KC_NO_FAB=true  before loading to hide it),
                  or call  kcOpen()  from any button of your own.
   Print All:     registers sheet id 'pk' ("K1, K2, K3 Component", unticked by default) in PRINT_SHEETS / SM_SHEETS and
                  answers window.atpPdfPrintPage('pk').
   Optional save: kcForSave() / kcRestore(obj) are provided if you want the settings stored inside the estimate file.
   ══════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 1. WHICH CF MATERIALS GO INTO WHICH COLUMN  (edit here if your grouping differs) ───────────────────────── */
  var KC_GROUPS = [
    { id: 'rub', name: 'Rubble Stone / Metal (40mm Normal Size and Above)', keys: ['m40mm', 'overmetal', 'quarry'], unit: 'Cu.M.', cap: 6,    lead: 0 },
    { id: 'crm', name: 'Crushed Metal',                                      keys: ['m20mm', 'm12_10'],              unit: 'Cu.M.', cap: 5.75, lead: 0 },
    { id: 'mur', name: 'Murum', trk: 'Murum (Hard Murum / Soft Murum)',      keys: ['rubble'],                       unit: 'Cu.M.', cap: 6,    lead: 0 },
    { id: 'snd', name: 'Sand',                                               keys: ['sand', 'scr_sand'],             unit: 'Cu.M.', cap: 5.75, lead: 0 }
  ];
  var KC_ASP = { id: 'asp', name: 'Asphalt', key: 'bitumen',     unit: 'M.T.', cap: 10, lead: 0 };
  var KC_CEM = { id: 'cem', name: 'Cement',  key: 'cement_bags', unit: 'M.T.', cap: 10, lead: 0 };
  var KC_TRUCK = [KC_GROUPS[0], KC_GROUPS[1], KC_GROUPS[2], KC_GROUPS[3], KC_ASP, KC_CEM];

  /* ── 2. SETTINGS (kept in localStorage; kcForSave()/kcRestore() can also carry them inside the estimate) ────── */
  var CFG = { dist: '', tal: '', hideZero: false, cap: {}, lead: {},
              dieselRate: '', kmpl: '', baseOvr: '',
              useCem: true, useStl: true, useBit: true, usePip: false,
              srCem: '', srStl: '', srBit: '', srPip: '', stlQty: '', pipQty: '',
              baseQtr: '', C0: '', I0: '', P0: '', bitBase: '', SI0: '', CI0: '', D0: '',
              eligPct: 85, tenderAmt: '', ceilPct: '', ra: [] };
  function cfgLoad() {
    try {
      var o = JSON.parse(localStorage.getItem('atp_kc_cfg') || '{}');
      if (o && typeof o === 'object') cfgMerge(o);
    } catch (e) {}
  }
  var RA_NUM = ['w', 'cemQ', 'stlQ', 'bitQ', 'pipQ', 'c1', 'i1', 'p1', 'b1', 's1', 'ci1', 'd1'];
  function cfgMerge(o) {
    if (typeof o.dist === 'string') CFG.dist = o.dist;
    if (typeof o.tal === 'string') CFG.tal = o.tal;
    if (typeof o.hideZero === 'boolean') CFG.hideZero = o.hideZero;
    if (o.cap && typeof o.cap === 'object') CFG.cap = o.cap;
    if (o.lead && typeof o.lead === 'object') CFG.lead = o.lead;
    ['dieselRate', 'kmpl', 'baseOvr', 'C0', 'I0', 'P0', 'eligPct', 'srCem', 'srStl', 'srBit', 'srPip', 'stlQty', 'pipQty', 'bitBase', 'SI0', 'CI0', 'D0', 'tenderAmt', 'ceilPct'].forEach(function (k) {
      if (typeof o[k] === 'number' || typeof o[k] === 'string') CFG[k] = o[k];
    });
    ['useCem', 'useStl', 'useBit', 'usePip'].forEach(function (k) { if (typeof o[k] === 'boolean') CFG[k] = o[k]; });
    if (typeof o.baseQtr === 'string') CFG.baseQtr = o.baseQtr;
    if (Array.isArray(o.ra)) CFG.ra = o.ra.map(function (b) {
      b = b || {};
      var r = { no: String(b.no == null ? '' : b.no), per: String(b.per == null ? '' : b.per) };
      RA_NUM.forEach(function (f) { r[f] = b[f] == null ? '' : b[f]; });
      return r;
    });
  }
  function cfgSave() { try { localStorage.setItem('atp_kc_cfg', JSON.stringify(CFG)); } catch (e) {} }
  function capOf(g)  { var v = parseFloat(CFG.cap[g.id]);  return (v > 0)  ? v : g.cap;  }
  function keysOf(g) { return g.keys || [g.key]; }
  function chartLead(k) { try { return (typeof LEAD_KM !== 'undefined' && LEAD_KM) ? n0(LEAD_KM[k]) : 0; } catch (e) { return 0; } }
  function leadOvr(g) { var v = parseFloat(CFG.lead[g.id]); return (v >= 0) ? v : null; }
  function leadOf(g) { var o = leadOvr(g); if (o !== null) return o; var ks = keysOf(g), i; for (i = 0; i < ks.length; i++) if (chartLead(ks[i]) > 0) return chartLead(ks[i]); return 0; }
  function matLabel(k) { return (typeof LR !== 'undefined' && LR[k] && LR[k].label) ? LR[k].label : k; }

  /* ── 3. SMALL HELPERS ─────────────────────────────────────────────────────────────────────────────────────── */
  function E(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function n0(v) { var x = parseFloat(v); return isNaN(x) ? 0 : x; }
  function r2(v) { return Math.round((+v || 0) * 100) / 100; }
  function f2(v) { return (+v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function f3(v) { return (Math.round((+v || 0) * 1000) / 1000).toFixed(3); }
  function tr(v) { return String(Math.round((+v || 0) * 10000) / 10000); }
  function qf(v) { return String(Math.round((+v || 0) * 1000) / 1000); }
  function workName() { var e = document.getElementById('pName'); return e ? String(e.value || '').replace(/\s+/g, ' ').trim() : ''; }
  function toast(m, t) { if (typeof showToast === 'function') showToast(m, t || 'warn'); else alert(m); }

  var UNIT_MAP = {
    'cubic metre': 'Cu.M.', 'cubic meter': 'Cu.M.', 'cu.m.': 'Cu.M.', 'cum': 'Cu.M.', 'cu.m': 'Cu.M.',
    'square metre': 'Sq.M.', 'square meter': 'Sq.M.', 'sq.m.': 'Sq.M.', 'sqm': 'Sq.M.', 'sq.m': 'Sq.M.',
    'running metre': 'R.M.', 'running meter': 'R.M.', 'r.m.': 'R.M.', 'rm': 'R.M.', 'rmt': 'R.M.',
    'metric tonne': 'M.T.', 'metric ton': 'M.T.', 'mt': 'M.T.', 'm.t.': 'M.T.',
    'number': 'No.', 'nos': 'No.', 'no': 'No.', 'no.': 'No.', 'kilogram': 'Kg.', 'kg': 'Kg.', 'kg.': 'Kg.'
  };
  function unitOf(u) { var s = String(u || '').trim(); return UNIT_MAP[s.toLowerCase()] || s; }

  /* ── 4. SSR LOOKUP ────────────────────────────────────────────────────────────────────────────────────────── */
  var _map = null, _mapN = -1;
  function ssrRowFor(it) {
    if (typeof SSR === 'undefined' || !SSR || !SSR.length) return null;
    if (!_map || _mapN !== SSR.length) {
      _map = { e: {}, n: {} }; _mapN = SSR.length;
      SSR.forEach(function (d) {
        if (!d) return;
        var k = String(d[0]).trim();
        if (!_map.e[k]) _map.e[k] = d;
        var nk = String(Number(k));
        if (!_map.n[nk]) _map.n[nk] = d;
      });
    }
    var no = String(it.no == null ? '' : it.no).trim();
    return _map.e[no] || _map.n[String(Number(no))] || null;
  }
  function descOf(it, row) {
    var d = String(it.desc || '').split(' -- ')[0].replace(/\s+/g, ' ').trim();
    var sp = String(it.spec || (row && row[4]) || '').replace(/Page One Number/gi, 'Page No.').replace(/\s+/g, ' ').trim();
    if (/^as directed/i.test(sp)) sp = '';
    var pg = (row && row[11]) ? String(row[11]) : '';
    var tail = '';
    if (!/Spec\.No\./i.test(d)) tail = (sp ? 'Spec.No.: ' + sp + ' ' : '') + 'SSR I.NO.' + it.no + (pg ? ' P.No.' + pg : '');
    return E(d) + (tail ? ' ' + E(tail) : '');
  }

  /* ── 5. CALCULATION ───────────────────────────────────────────────────────────────────────────────────────── */
  function compute() {
    var its = (typeof items !== 'undefined' && items) ? items : [];
    var cemConv = (typeof LR !== 'undefined' && LR.cement_bags && LR.cement_bags.conv) || 0.05;
    var bitConv = (typeof LR !== 'undefined' && LR.bitumen && LR.bitumen.conv) || 1;
    var out = { L: [], M: [], A: [], C: [], kq: {}, tot: { lab: 0, rub: 0, crm: 0, mur: 0, snd: 0, asp: 0, cem: 0 } };
    var hz = !!CFG.hideZero;

    its.forEach(function (it, i) {
      if (!it) return;
      var q = n0(it.qty), row = ssrRowFor(it);
      var cf = (typeof effCF === 'function') ? effCF(it) : (it.cf || {});
      cf = cf || {};
      var base = { sr: i + 1, no: it.no, desc: descOf(it, row), unit: unitOf(it.unit), qty: q };

      var lr = (row && n0(row[8]) > 0) ? n0(row[8]) : 0;
      var amt = r2(q * lr);
      out.tot.lab += amt;
      if (!(hz && amt === 0)) out.L.push({ b: base, rate: lr, amt: amt });

      var cells = {}, any = false;
      KC_GROUPS.forEach(function (g) {
        var c = 0;
        g.keys.forEach(function (k) { c += n0(cf[k]); out.kq[k] = (out.kq[k] || 0) + n0(cf[k]) * q; });
        var gq = c * q;
        cells[g.id] = { c: c, q: gq };
        out.tot[g.id] += gq;
        if (gq !== 0) any = true;
      });
      if (!(hz && !any)) out.M.push({ b: base, cells: cells });

      var ac = n0(cf[KC_ASP.key]) * bitConv, aq = ac * q;
      out.tot.asp += aq;
      out.kq[KC_ASP.key] = (out.kq[KC_ASP.key] || 0) + aq;
      if (!(hz && aq === 0)) out.A.push({ b: base, c: ac, q: aq });

      var cc = n0(cf[KC_CEM.key]) * cemConv, cq = cc * q;
      out.tot.cem += cq;
      out.kq[KC_CEM.key] = (out.kq[KC_CEM.key] || 0) + cq;
      if (!(hz && cq === 0)) out.C.push({ b: base, c: cc, q: cq });
    });

    out.T = [];
    KC_TRUCK.forEach(function (g) {
      var ks = keysOf(g), ovr = leadOvr(g), cap = capOf(g), parts = [], i;
      ks.forEach(function (k) { var q = out.kq[k] || 0; if (q > 0) parts.push({ k: k, q: q, lead: ovr !== null ? ovr : chartLead(k) }); });
      var rows = [];
      if (!parts.length) rows.push({ q: 0, lead: leadOf(g), names: [] });
      else parts.forEach(function (p) {
        var r = null; for (i = 0; i < rows.length; i++) if (rows[i].lead === p.lead) r = rows[i];
        if (!r) { r = { q: 0, lead: p.lead, names: [] }; rows.push(r); }
        r.q += p.q; r.names.push(matLabel(p.k));
      });
      rows.forEach(function (r) {
        var trips = r.q > 0 ? Math.ceil(r.q / cap - 1e-9) : 0, tf = r.lead * 2;
        var nm = g.trk || g.name;
        if (rows.length > 1) nm += ' \u2013 ' + r.names.join(', ');
        out.T.push({ sr: out.T.length + 1, name: nm, qty: r.q, cap: cap, unit: g.unit, trips: trips, lead: r.lead, tf: tf, dist: trips * tf });
      });
    });

    var gross = 0, stlAuto = 0, stlConv = (typeof LR !== 'undefined' && LR.ms_bars && LR.ms_bars.conv) || 1;
    its.forEach(function (it) {
      if (!it) return;
      var q = n0(it.qty), cf0 = (typeof effCF === 'function') ? effCF(it) : (it.cf || {});
      gross += itemAmt(it, q);
      stlAuto += n0((cf0 || {}).ms_bars) * stlConv * q;
    });
    gross = Math.round(gross);
    var bo = parseFloat(CFG.baseOvr); if (bo > 0) gross = r2(bo);
    var stlQ = n0(CFG.stlQty) > 0 ? n0(CFG.stlQty) : stlAuto;
    var comp = [
      { id: 'cem', nm: 'Cement',            use: CFG.useCem !== false, qty: out.tot.cem,    rate: n0(CFG.srCem) },
      { id: 'stl', nm: 'HYSD & Mild Steel', use: CFG.useStl !== false, qty: stlQ,           rate: n0(CFG.srStl) },
      { id: 'bit', nm: 'Bitumen',           use: CFG.useBit !== false, qty: out.tot.asp,    rate: n0(CFG.srBit) },
      { id: 'pip', nm: 'C.I. & D.I. Pipes', use: CFG.usePip === true,  qty: n0(CFG.pipQty), rate: n0(CFG.srPip) }
    ];
    var ded = 0;
    comp.forEach(function (c) { c.amt = c.use ? r2(c.qty * c.rate) : 0; ded += c.amt; });
    ded = r2(ded);
    var base = r2(gross - ded);
    var km = 0; out.T.forEach(function (r) { km += r.dist; });
    var kmpl = n0(CFG.kmpl), dr = n0(CFG.dieselRate);
    var litres = kmpl > 0 ? km / kmpl : 0;
    var lab = r2(out.tot.lab), pol = r2(litres * dr);
    var k1 = base > 0 ? r2(lab / base * 100) : 0;
    var k3 = base > 0 ? r2(pol / base * 100) : 0;
    var k2 = base > 0 ? r2(100 - k1 - k3) : 0;
    out.K = { gross: gross, ded: ded, comp: comp, base: base, lab: lab, pol: pol, mat: r2(base - lab - pol), km: km, kmpl: kmpl, rate: dr, litres: litres, k1: k1, k2: k2, k3: k3 };
    return out;
  }

  function itemAmt(it, q) {
    try { if (typeof window.KC_ITEM_AMT === 'function') { var x = n0(window.KC_ITEM_AMT(it)); if (x) return x; } } catch (e) {}
    if (it.amount != null && !isNaN(parseFloat(it.amount))) return n0(it.amount);
    return q * (n0(it.finalRate) || n0(it.rate));
  }

  /* ── 6. HTML ──────────────────────────────────────────────────────────────────────────────────────────────── */
  function wkHtml() {
    var n = workName();
    return '<div class="kc-wk"><b>Name of Work :-</b> ' + (n ? E(n) : 'Enter the name in Input Data') + '</div>';
  }

  function signHtml() {
    try {
      if (typeof smGetNames === 'function' && typeof smGetConfig === 'function' && typeof smAutoRoles === 'function' && typeof SM_SHEETS !== 'undefined') {
        var nm = smGetNames(), cfg = smGetConfig(), roles = cfg.pk;
        if (!roles) {
          var sh = SM_SHEETS.filter(function (x) { return x.id === 'pk'; });
          roles = sh.length ? smAutoRoles(sh[0]) : ['sde'];
        }
        if (roles && roles.length) {
          var map = {
            se:  { d: nm.seTitle  || 'Section Engineer',         l: nm.locSub || 'P.W. Sub Division' },
            sde: { d: nm.sdeTitle || 'Sub Divisional Engineer',  l: nm.locSub || 'P.W. Sub Division' },
            de:  { d: nm.deTitle  || 'Divisional Engineer',      l: nm.locDiv || 'P.W. Division' },
            ee:  { d: nm.eeTitle  || 'Executive Engineer',       l: nm.locDiv || 'P.W. Division' },
            se_circle: { d: nm.seCircleTitle || 'Superintending Engineer', l: nm.locCir || 'P.W. Circle' },
            ce:  { d: nm.ceTitle  || 'Chief Engineer',           l: nm.locReg || 'P.W. Region' }
          };
          var gap = (parseInt(localStorage.getItem('signHeight')) || 45) + 'px', bx = '';
          roles.forEach(function (rk) {
            var r = map[rk]; if (!r) return;
            bx += '<div class="kc-sgb"><div style="height:' + gap + '"></div><div>' + E(String(r.d).replace(/,\s*$/, '')) + ',</div><div>' + E(r.l) + '</div></div>';
          });
          if (bx) return '<div class="kc-sg">' + bx + '</div>';
        }
      }
    } catch (e) {}
    return '<div class="kc-sg"><div class="kc-sgb"><div style="height:45px"></div><div>Sub Divisional Engineer,</div><div>' + E(((document.getElementById('pSub') || {}).value || 'P.W. Sub Division').replace(/,\s*$/, '')) + '</div></div></div>';
  }

  function coverHtml() {
    function val(id) { var e = document.getElementById(id); return e ? String(e.value || '').trim() : ''; }
    var p0 = document.getElementById('p0');
    var im = p0 ? p0.querySelector('.cov-hd img') : null, src = im ? (im.getAttribute('src') || '') : '';
    var reg = val('pReg').replace(/^p\.?\s*w\.?\s+region\s*,?\s*/i, 'Public Works Region, ');
    var cir = val('pCir').replace(/^p\.?\s*w\.?\s+circle\s*,?\s*/i, 'Public Works Circle, ');
    var dv  = val('pDiv').replace(/^p\.?\s*w\.?\s+division\s*,?\s*/i, 'P.W.Division, ');
    var nm  = ((document.getElementById('pNamePrint') || {}).textContent || '').trim() || val('pName');
    var cost = val('covCostVal');
    var cm = window.COV_COST_MANUAL;
    if (!(cm !== null && cm !== undefined && String(cm).trim() !== '')) { var cn = parseFloat(cost); if (!isNaN(cn)) cost = (Math.round(cn)).toFixed(2); }
    var ut = document.getElementById('covCostUnitTxt'); ut = ut ? ut.textContent.trim() : 'LAKHS';
    var adopt = 'ADOPTED SSR OF 2022-23';
    if (p0) { var nd = p0.querySelectorAll('*'), k; for (k = 0; k < nd.length; k++) { if (!nd[k].children.length && /ADOPTED\s+SSR/i.test(nd[k].textContent || '')) { adopt = nd[k].textContent.trim(); break; } } }
    var TM2 = "'Times New Roman','Liberation Serif',Times,serif";
    var F = 'font-family:' + TM2 + '!important;color:#000;margin:0;padding:0;';
    var K = 1.04;
    function at(top, inner, st) { return '<div style="' + F + 'position:absolute;left:0;right:0;top:' + (top * K).toFixed(1) + 'mm;transform:translateY(-50%);text-align:center;' + (st || '') + '">' + inner + '</div>'; }
    function dbl(extra) { return 'box-sizing:border-box;border:.8pt solid #000;' + extra; }
    var inner = '<div style="position:absolute;left:1.1mm;right:1.1mm;top:1.1mm;bottom:1.1mm;border:1.8pt solid #000;box-sizing:border-box"></div>';
    return '<section class="kcpg kcpt">'
      + '<div style="' + F + dbl('position:relative;height:' + (250 * K).toFixed(0) + 'mm;width:100%;page-break-inside:avoid;break-inside:avoid;overflow:hidden') + '">'
      + inner
      + (src ? '<div style="position:absolute;left:0;right:0;top:' + (6 * K).toFixed(1) + 'mm;text-align:center"><img src="' + src + '" style="height:' + (27 * K).toFixed(1) + 'mm;width:auto"></div>' : '')
      + at(37, 'GOVERNMENT OF MAHARASHTRA', 'font-size:21pt;font-weight:700;')
      + at(58, E(reg), 'font-size:16.5pt;font-weight:400;text-transform:uppercase;')
      + at(71, E(cir), 'font-size:16.5pt;font-weight:400;text-transform:uppercase;')
      + at(86, E(dv), 'font-size:16.5pt;font-weight:400;text-transform:uppercase;text-decoration:underline;')
      + '<div style="position:absolute;left:10%;right:10%;top:' + (103 * K).toFixed(1) + 'mm;height:' + (30 * K).toFixed(1) + 'mm;box-sizing:border-box;border:1pt solid #000"></div>'
      + at(118, 'K1,K2,K3 COMPONENT', 'font-size:28pt;font-weight:700;letter-spacing:3pt;padding-left:3pt;line-height:1;white-space:nowrap;')
      + at(144, '* NAME OF WORK *', 'font-size:22pt;font-weight:700;')
      + '<div style="' + F + 'position:absolute;left:11%;right:11%;top:' + (152 * K).toFixed(1) + 'mm;text-align:center;font-size:18.5pt;font-weight:700;line-height:1.35">' + E(nm) + '</div>'
      + '<div style="' + F + 'position:absolute;left:18%;top:' + (201 * K).toFixed(1) + 'mm;transform:translateY(-50%);font-size:18pt;font-weight:700;text-decoration:underline;white-space:nowrap">ESTIMATE COST :-</div>'
      + '<div style="' + F + 'position:absolute;left:62%;top:' + (201 * K).toFixed(1) + 'mm;transform:translate(-50%,-50%);font-size:18pt;font-weight:700;white-space:nowrap">' + E(cost) + '</div>'
      + '<div style="' + F + 'position:absolute;left:71%;top:' + (201 * K).toFixed(1) + 'mm;transform:translateY(-50%);font-size:18pt;font-weight:700;white-space:nowrap">' + E(ut) + '</div>'
      + at(237, '<span style="display:inline-block;transform:scaleX(.82);transform-origin:center">' + E(adopt) + '</span>', "font-family:Arial,'Liberation Sans',Helvetica,sans-serif!important;font-size:18pt;font-weight:700;white-space:nowrap;")
      + '</div></section>';
  }

  function labourHtml(D) {
    var body = '';
    D.L.forEach(function (r) {
      body += '<tr><td>' + r.b.sr + '</td><td>' + E(r.b.no) + '</td><td class="d">' + r.b.desc + '</td><td class="v">' + qf(r.b.qty) + '</td><td>' + E(r.b.unit) + '</td><td class="v">' + f2(r.rate) + '</td><td class="b">' + f2(r.amt) + '</td></tr>';
    });
    if (!D.L.length) body = '<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
    return '<section class="kcpg kcpt kcbrk">' + wkHtml() + '<div class="kc-t">LABOUR COMPONENT</div>'
      + '<table class="kct"><colgroup><col style="width:7%"><col style="width:9%"><col style="width:38%"><col style="width:10%"><col style="width:8%"><col style="width:13%"><col style="width:15%"></colgroup>'
      + '<thead><tr><th>Sr.No.</th><th>SSR<br>I.No.</th><th>Description</th><th>Quantity</th><th>Unit</th><th>Labour<br>Rate</th><th>Amount</th></tr></thead>'
      + '<tbody>' + body + '</tbody>'
      + '<tfoot><tr class="kc-tot"><td colspan="6" style="text-align:right">TOTAL LABOUR COMPONENT</td><td class="b">' + f2(D.tot.lab) + '</td></tr></tfoot></table>'
      + signHtml() + '</section>';
  }

  function materialHtml(D) {
    var body = '';
    D.M.forEach(function (r) {
      body += '<tr><td>' + r.b.sr + '</td><td class="d">' + r.b.desc + '</td><td class="v">' + qf(r.b.qty) + '</td><td>' + E(r.b.unit) + '</td>';
      KC_GROUPS.forEach(function (g) { var c = r.cells[g.id]; body += '<td class="v">' + tr(c.c) + '</td><td class="b">' + f3(c.q) + '</td>'; });
      body += '</tr>';
    });
    var nc = 4 + KC_GROUPS.length * 2;
    if (!D.M.length) { body = '<tr>'; for (var i = 0; i < nc; i++) body += '<td>&nbsp;</td>'; body += '</tr>'; }
    var h1 = '<tr><th rowspan="2" style="width:5%">Sr.No.</th><th rowspan="2" style="width:30%">Description</th><th rowspan="2" style="width:7%">Item Qty</th><th rowspan="2" style="width:5%">Unit</th>';
    KC_GROUPS.forEach(function (g) { h1 += '<th colspan="2">' + E(g.name) + '</th>'; });
    h1 += '</tr><tr>';
    KC_GROUPS.forEach(function () { h1 += '<th>Consumption</th><th>Qty</th>'; });
    h1 += '</tr>';
    var ft = '<tr class="kc-tot"><td colspan="4" style="text-align:right">TOTAL MATERIAL QTY</td>';
    KC_GROUPS.forEach(function (g) { ft += '<td>\u2014</td><td class="b">' + f3(D.tot[g.id]) + '</td>'; });
    ft += '</tr>';
    return '<section class="kcpg kcl kcbrk">' + wkHtml() + '<div class="kc-t">MATERIAL REQUIREMENT STATEMENT</div>'
      + '<table class="kct"><thead>' + h1 + '</thead><tbody>' + body + '</tbody><tfoot>' + ft + '</tfoot></table>' + signHtml() + '</section>';
  }

  function singleHtml(D, rows, title, qHead, totLabel, total) {
    var body = '';
    rows.forEach(function (r) {
      body += '<tr><td>' + r.b.sr + '</td><td class="d">' + r.b.desc + '</td><td class="v">' + qf(r.b.qty) + '</td><td>' + E(r.b.unit) + '</td><td class="v">' + tr(r.c) + '</td><td class="b">' + f3(r.q) + '</td></tr>';
    });
    if (!rows.length) body = '<tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>';
    return '<section class="kcpg kcl kcbrk">' + wkHtml() + '<div class="kc-t">' + title + '</div>'
      + '<table class="kct"><colgroup><col style="width:6%"><col style="width:42%"><col style="width:11%"><col style="width:8%"><col style="width:15%"><col style="width:18%"></colgroup>'
      + '<thead><tr><th>Sr.No.</th><th>Description</th><th>Quantity</th><th>Unit</th><th>Consumption</th><th>' + qHead + '</th></tr></thead>'
      + '<tbody>' + body + '</tbody>'
      + '<tfoot><tr class="kc-tot"><td colspan="5" style="text-align:right">' + totLabel + '</td><td class="b">' + f3(total) + '</td></tr></tfoot></table>' + signHtml() + '</section>';
  }

  function truckHtml(D) {
    var body = '';
    D.T.forEach(function (r) {
      body += '<tr><td>' + r.sr + '</td><td class="d b">' + E(r.name) + '</td><td class="v">' + f3(r.qty) + '</td><td class="v">' + qf(r.cap) + '</td><td>' + E(r.unit) + '</td><td class="v">' + f3(r.trips) + '</td><td class="v">' + qf(r.lead) + '</td><td class="v">' + f3(r.tf) + '</td><td class="b">' + f3(r.dist) + '</td></tr>';
    });
    return '<section class="kcpg kcl kcbrk">' + wkHtml() + '<div class="kc-t">CALCULATION OF TRUCK KILOMETRE</div>'
      + '<table class="kct"><colgroup><col style="width:6%"><col style="width:25%"><col style="width:11%"><col style="width:8%"><col style="width:8%"><col style="width:11%"><col style="width:10%"><col style="width:10%"><col style="width:11%"></colgroup>'
      + '<thead><tr><th rowspan="2">Sr.No.</th><th rowspan="2">Materials</th><th rowspan="2">Quantity</th><th colspan="2">Capacity</th><th rowspan="2">No of trips</th><th rowspan="2">Lead in Km</th><th rowspan="2">To and Fro<br>Lead</th><th rowspan="2">Distance<br>Travelled (Km.)</th></tr>'
      + '<tr><th>P.F.</th><th>Unit</th></tr></thead><tbody>' + body + '</tbody></table>'
      + '<div class="kc-note">No of trips = Quantity \u00F7 Load Factor (L.F.), rounded up to whole trips. To and Fro Lead = Lead \u00D7 2. Distance Travelled = No of trips \u00D7 To and Fro Lead.</div>'
      + signHtml() + '</section>';
  }

  /* ── STATEMENT 5 : FINAL K1, K2, K3 SUMMARY SHEET (portrait) ── */
  function kstmtHtml(D) {
    var K = D.K;
    function kr(sr, nm, amt, pct) { return '<tr><td>' + sr + '</td><td class="d b">' + nm + '</td><td class="v">' + f2(amt) + '</td><td class="b">' + f2(pct) + '</td></tr>'; }
    var body = kr(1, 'K1 \u2013 Labour Component', K.lab, K.k1) + kr(2, 'K2 \u2013 Material Component', K.mat, K.k2) + kr(3, 'K3 \u2013 POL / Fuel Component', K.pol, K.k3);
    var warn = K.base > 0 ? '' : '<div class="kc-note"><b>Note:</b> total of estimate items could not be read \u2013 enter it in \u201CItems total override\u201D in the K1\u00B7K2\u00B7K3 tab.</div>';
    var cr = '<tr class="kc-tot"><td>A</td><td class="d b">Total estimated work cost (total of estimate items)</td><td></td><td></td><td class="b">' + f2(K.gross) + '</td><td class="b">100.00</td></tr>';
    K.comp.forEach(function (c) {
      if (!c.use) return;
      cr += '<tr><td></td><td class="d">Less : ' + E(c.nm) + ' at basic star rate</td><td class="v">' + f3(c.qty) + '</td><td class="v">' + f2(c.rate) + '</td><td class="v">' + f2(c.amt) + '</td><td class="v">' + (K.gross > 0 ? f2(c.amt / K.gross * 100) : '0.00') + '</td></tr>';
    });
    cr += '<tr class="kc-tot"><td>B</td><td class="d b">Cost for working K1, K2, K3  ( A \u2212 Less )</td><td></td><td></td><td class="b">' + f2(K.base) + '</td><td class="b">' + (K.gross > 0 ? f2(K.base / K.gross * 100) : '0.00') + '</td></tr>';
    return '<section class="kcpg kcpt kcbrk">' + wkHtml() + '<div class="kc-t">STATEMENT 5 : FINAL K1, K2, K3 SUMMARY SHEET</div>'
      + '<table class="kct kc-s"><colgroup><col style="width:6%"><col style="width:42%"><col style="width:12%"><col style="width:13%"><col style="width:16%"><col style="width:11%"></colgroup>'
      + '<thead><tr><th>Sr.</th><th>Particulars</th><th>Qty (M.T.)</th><th>Star rate<br>(Rs./M.T.)</th><th>Amount (Rs.)</th><th>% of A</th></tr></thead><tbody>' + cr + '</tbody></table>'
      + '<div class="kc-t" style="font-size:11pt;margin:6mm 0 3mm">K1, K2, K3 (as % of B)</div>'
      + '<table class="kct"><colgroup><col style="width:9%"><col style="width:51%"><col style="width:24%"><col style="width:16%"></colgroup>'
      + '<thead><tr><th>Sr.No.</th><th>Component Name</th><th>Amount (Rs.)</th><th>Percentage (%)</th></tr></thead>'
      + '<tbody>' + body + '</tbody>'
      + '<tfoot><tr class="kc-tot"><td colspan="2" style="text-align:right">TOTAL (K1 + K2 + K3)</td><td class="b">' + f2(K.base) + '</td><td class="b">' + f2(r2(K.k1 + K.k2 + K.k3)) + '</td></tr></tfoot></table>'
      + '<div class="kc-t" style="font-size:10.5pt;margin:6mm 0 3mm">Working of K3 \u2013 POL (Truck Kilometre)</div>'
      + '<table class="kct"><colgroup><col style="width:70%"><col style="width:30%"></colgroup><tbody>'
      + '<tr><td class="d">Total distance travelled (Km) \u2013 from Calculation of Truck Kilometre</td><td class="v">' + f3(K.km) + '</td></tr>'
      + '<tr><td class="d">Mileage (Km / Litre)</td><td class="v">' + qf(K.kmpl) + '</td></tr>'
      + '<tr><td class="d">Diesel consumed (Litres) = Km \u00F7 Mileage</td><td class="v">' + f2(K.litres) + '</td></tr>'
      + '<tr><td class="d">Diesel rate (Rs. / Litre)</td><td class="v">' + f2(K.rate) + '</td></tr>'
      + '<tr class="kc-tot"><td class="d b">Total POL cost (Rs.)</td><td class="b">' + f2(K.pol) + '</td></tr></tbody></table>'
      + '<div class="kc-note">As per Govt. Resolution No. CAT/06/04/148 dt. 16-5-2005 : K1 + K2 + K3 = 100 and are worked on the cost of work excluding Cement, HYSD &amp; Mild Steel, Bitumen and C.I./D.I. Pipes, which are paid as per actuals (V4 to V7). A component supplied on Schedule \u2018A\u2019 is not considered. K1 = Labour \u00F7 B \u00D7 100 ; K3 = POL \u00F7 B \u00D7 100 ; K2 = 100 \u2212 (K1 + K3). POL covers truck haulage only.</div>' + warn
      + signHtml() + '</section>';
  }

  /* ── STATEMENT 6 : RA BILL PRICE VARIATION ── */
  function epOf() { var v = parseFloat(CFG.eligPct); return (v >= 0) ? v : 85; }
  function raCalc(K) {
    var ep = epOf(), L0 = n0(CFG.C0), M0 = n0(CFG.I0), P0 = n0(CFG.P0), SI0 = n0(CFG.SI0), CI0 = n0(CFG.CI0), D0 = n0(CFG.D0);
    var Co = n0(CFG.srCem), So = n0(CFG.srStl), srBit = n0(CFG.srBit), B0 = Math.max(srBit, n0(CFG.bitBase));
    var use = {}; K.comp.forEach(function (c) { use[c.id] = c.use; });
    function pv(el, k, cur, b0) { return (b0 > 0 && cur > 0) ? r2(el * (k / 100) * ((cur - b0) / b0)) : 0; }
    var cap = n0(CFG.tenderAmt) * n0(CFG.ceilPct) / 100, hasCap = cap > 0, cum = 0;
    var rows = (CFG.ra || []).map(function (b, i) {
      var W = n0(b.w), q = { cem: n0(b.cemQ), stl: n0(b.stlQ), bit: n0(b.bitQ), pip: n0(b.pipQ) };
      var ded = 0;
      K.comp.forEach(function (c) { if (c.use) ded += q[c.id] * c.rate; });
      ded = r2(ded);
      var P = r2(W - ded), el = r2(Math.max(P, 0) * ep / 100);
      var c1 = n0(b.c1), i1 = n0(b.i1), p1 = n0(b.p1), b1 = n0(b.b1), s1 = n0(b.s1), ci1 = n0(b.ci1), d1 = n0(b.d1);
      var v1 = pv(el, K.k1, c1, L0), v2 = pv(el, K.k2, i1, M0), v3 = pv(el, K.k3, p1, P0);
      var v4 = (use.bit && B0 > 0 && b1 > 0) ? r2(q.bit * (b1 - B0)) : 0;
      var v5 = (use.stl && SI0 > 0 && s1 > 0) ? r2(So * (s1 - SI0) / SI0 * q.stl) : 0;
      var v6 = (use.cem && CI0 > 0 && ci1 > 0) ? r2(Co * (ci1 - CI0) / CI0 * q.cem) : 0;
      var v7 = (use.pip && D0 > 0 && d1 > 0) ? r2(q.pip * (d1 - D0)) : 0;
      var v123 = r2(v1 + v2 + v3), vt = r2(v123 + v4 + v5 + v6 + v7), pay = vt;
      if (hasCap) { if (vt > 0) pay = r2(Math.min(vt, Math.max(0, cap - cum))); cum = r2(cum + pay); }
      return { sr: i + 1, no: b.no, per: b.per, w: W, ded: ded, p: P, el: el, c1: c1, i1: i1, p1: p1, b1: b1, s1: s1, ci1: ci1, d1: d1,
               cemQ: q.cem, stlQ: q.stl, bitQ: q.bit, pipQ: q.pip, v1: v1, v2: v2, v3: v3, v4: v4, v5: v5, v6: v6, v7: v7, v123: v123, vt: vt, pay: pay };
    });
    var t = {};
    ['w', 'ded', 'p', 'el', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v123', 'vt', 'pay'].forEach(function (k) { t[k] = 0; rows.forEach(function (r) { t[k] = r2(t[k] + r[k]); }); });
    return { rows: rows, t: t, ep: ep, B0: B0, hasCap: hasCap, cap: cap, use: use };
  }
  function dash(v) { return v ? qf(v) : '\u2014'; }
  function raHtml(D) {
    var K = D.K, R = raCalc(K), body = '';
    R.rows.forEach(function (r) {
      body += '<tr><td>' + r.sr + '</td><td>' + E(r.no) + '</td><td>' + E(r.per) + '</td><td class="v">' + f2(r.w) + '</td><td class="v">' + f2(r.ded) + '</td><td class="v">' + f2(r.p) + '</td><td class="v">' + f2(r.el) + '</td>'
        + '<td class="v">' + dash(r.c1) + '</td><td class="v">' + dash(r.i1) + '</td><td class="v">' + dash(r.p1) + '</td>'
        + '<td class="v">' + f2(r.v1) + '</td><td class="v">' + f2(r.v2) + '</td><td class="v">' + f2(r.v3) + '</td></tr>';
    });
    if (!R.rows.length) { body = '<tr>'; for (var i = 0; i < 13; i++) body += '<td>&nbsp;</td>'; body += '</tr>'; }
    var info = '<div class="kc-note" style="font-size:9pt;margin:0 0 3mm"><b>Base Quarter :</b> ' + E(CFG.baseQtr || '\u2014')
      + ' &nbsp;|&nbsp; <b>L<sub>0</sub> (Labour CPI) :</b> ' + dash(n0(CFG.C0)) + ' &nbsp;|&nbsp; <b>M<sub>0</sub> (Wholesale PI) :</b> ' + dash(n0(CFG.I0)) + ' &nbsp;|&nbsp; <b>P<sub>0</sub> (HSD price) :</b> ' + dash(n0(CFG.P0))
      + ' &nbsp;|&nbsp; <b>K1 :</b> ' + f2(K.k1) + '% &nbsp;<b>K2 :</b> ' + f2(K.k2) + '% &nbsp;<b>K3 :</b> ' + f2(K.k3) + '%</div>';
    return '<section class="kcpg kcl kcbrk">' + wkHtml() + '<div class="kc-t">STATEMENT 6 : RA BILL PRICE VARIATION \u2013 PART A (LABOUR, MATERIAL, POL)</div>' + info
      + '<table class="kct kc-s"><colgroup><col style="width:4%"><col style="width:6%"><col style="width:8%"><col style="width:10%"><col style="width:10%"><col style="width:10%"><col style="width:10%"><col style="width:6%"><col style="width:6%"><col style="width:6%"><col style="width:8%"><col style="width:8%"><col style="width:8%"></colgroup>'
      + '<thead><tr><th>Sr.<br>No.</th><th>RA Bill<br>No.</th><th>Quarter /<br>Period</th><th>Cost of work done<br>(W) (Rs.)</th><th>Less : Cement, Steel,<br>Bitumen, Pipes at<br>star rates (Rs.)</th><th>P = W \u2212 Less<br>(Rs.)</th><th>Eligible<br>(' + qf(R.ep) + '% of P)</th>'
      + '<th>L1<br>Labour CPI</th><th>M1<br>Wholesale PI</th><th>P1<br>HSD price</th><th>Labour<br>V1</th><th>Material<br>V2</th><th>POL<br>V3</th></tr></thead>'
      + '<tbody>' + body + '</tbody>'
      + '<tfoot><tr class="kc-tot"><td colspan="3" style="text-align:right">TOTAL</td><td class="b">' + f2(R.t.w) + '</td><td class="b">' + f2(R.t.ded) + '</td><td class="b">' + f2(R.t.p) + '</td><td class="b">' + f2(R.t.el) + '</td><td colspan="3"></td>'
      + '<td class="b">' + f2(R.t.v1) + '</td><td class="b">' + f2(R.t.v2) + '</td><td class="b">' + f2(R.t.v3) + '</td></tr></tfoot></table>'
      + '<div class="kc-note">V1 = ' + qf(R.ep / 100) + ' \u00D7 P \u00D7 [K1 \u00F7 100 \u00D7 (L1 \u2212 L0) \u00F7 L0] ; V2 = ' + qf(R.ep / 100) + ' \u00D7 P \u00D7 [K2 \u00F7 100 \u00D7 (M1 \u2212 M0) \u00F7 M0] ; V3 = ' + qf(R.ep / 100) + ' \u00D7 P \u00D7 [K3 \u00F7 100 \u00D7 (P1 \u2212 P0) \u00F7 P0]. P = cost of work done in the quarter minus cost of the \u201Cactuals\u201D materials consumed in it at basic star rates. L1, M1, P1 = averages for the quarter under consideration. Price variation is not payable on extra items / excess quantities beyond Clause 38/37. Operative both ways : a negative value is recovered from the bill.</div>'
      + signHtml() + '</section>';
  }
  function raHtmlB(D) {
    var K = D.K, R = raCalc(K);
    var G = [
      { id: 'bit', nm: 'Bitumen', f: 'V4 = QB \u00D7 (B1 \u2212 B0)',                 q: 'bitQ', qh: 'QB<br>(M.T.)', ix: 'b1',  ih: 'B1<br>(Rs./M.T.)', v: 'v4' },
      { id: 'stl', nm: 'HYSD & Mild Steel', f: 'V5 = So \u00D7 (SI1 \u2212 SI0) \u00F7 SI0 \u00D7 T', q: 'stlQ', qh: 'T<br>(M.T.)',  ix: 's1',  ih: 'SI1',            v: 'v5' },
      { id: 'cem', nm: 'Cement', f: 'V6 = Co \u00D7 (CI1 \u2212 CI0) \u00F7 CI0 \u00D7 T',    q: 'cemQ', qh: 'T<br>(M.T.)',  ix: 'ci1', ih: 'CI1',            v: 'v6' },
      { id: 'pip', nm: 'C.I. & D.I. Pipes', f: 'V7 = Qd \u00D7 (D1 \u2212 D0)',        q: 'pipQ', qh: 'Qd<br>(M.T.)', ix: 'd1',  ih: 'D1<br>(Rs./M.T.)', v: 'v7' }
    ].filter(function (g) { return R.use[g.id]; });
    var ncol = G.length * 3 + 2 + (R.hasCap ? 1 : 0), w = Math.floor(82 / ncol * 100) / 100, i;
    var cg = '<col style="width:4%"><col style="width:6%"><col style="width:8%">'; for (i = 0; i < ncol; i++) cg += '<col style="width:' + w + '%">';
    var h1 = '<tr><th rowspan="2">Sr.<br>No.</th><th rowspan="2">RA Bill<br>No.</th><th rowspan="2">Quarter /<br>Period</th>', h2 = '<tr>';
    G.forEach(function (g) { h1 += '<th colspan="3">' + E(g.nm) + '<br><span style="font-weight:400">' + g.f + '</span></th>'; h2 += '<th>' + g.qh + '</th><th>' + g.ih + '</th><th>' + g.v.toUpperCase() + '<br>(Rs.)</th>'; });
    h1 += '<th rowspan="2">V1 + V2 + V3<br>(Part A)</th><th rowspan="2">TOTAL V<br>(V1 to V7)</th>' + (R.hasCap ? '<th rowspan="2">Payable<br>after ceiling</th>' : '') + '</tr>';
    h2 += '</tr>';
    var body = '';
    R.rows.forEach(function (r) {
      body += '<tr><td>' + r.sr + '</td><td>' + E(r.no) + '</td><td>' + E(r.per) + '</td>';
      G.forEach(function (g) { body += '<td class="v">' + dash(r[g.q]) + '</td><td class="v">' + dash(r[g.ix]) + '</td><td class="v">' + f2(r[g.v]) + '</td>'; });
      body += '<td class="v">' + f2(r.v123) + '</td><td class="b">' + f2(r.vt) + '</td>' + (R.hasCap ? '<td class="b">' + f2(r.pay) + '</td>' : '') + '</tr>';
    });
    if (!R.rows.length) { body = '<tr>'; for (i = 0; i < ncol + 3; i++) body += '<td>&nbsp;</td>'; body += '</tr>'; }
    var ft = '<tr class="kc-tot"><td colspan="3" style="text-align:right">TOTAL</td>';
    G.forEach(function (g) { ft += '<td colspan="2"></td><td class="b">' + f2(R.t[g.v]) + '</td>'; });
    ft += '<td class="b">' + f2(R.t.v123) + '</td><td class="b">' + f2(R.t.vt) + '</td>' + (R.hasCap ? '<td class="b">' + f2(R.t.pay) + '</td>' : '') + '</tr>';
    var bits = [];
    if (R.use.bit) bits.push('<b>B0</b> (higher of star rate / quarter average price) : ' + dash(R.B0));
    if (R.use.stl) bits.push('<b>So</b> : ' + dash(n0(CFG.srStl)) + ' &nbsp;<b>SI0</b> : ' + dash(n0(CFG.SI0)));
    if (R.use.cem) bits.push('<b>Co</b> : ' + dash(n0(CFG.srCem)) + ' &nbsp;<b>CI0</b> : ' + dash(n0(CFG.CI0)));
    if (R.use.pip) bits.push('<b>D0</b> : ' + dash(n0(CFG.D0)));
    if (R.hasCap) bits.push('<b>Ceiling</b> : ' + qf(n0(CFG.ceilPct)) + '% of tender amount Rs. ' + f2(n0(CFG.tenderAmt)) + ' = Rs. ' + f2(R.cap));
    var info = bits.length ? '<div class="kc-note" style="font-size:9pt;margin:0 0 3mm">' + bits.join(' &nbsp;|&nbsp; ') + '</div>' : '';
    return '<section class="kcpg kcl kcbrk">' + wkHtml() + '<div class="kc-t">STATEMENT 6 : RA BILL PRICE VARIATION \u2013 PART B (BITUMEN, STEEL, CEMENT, PIPES) AND TOTAL</div>' + info
      + '<table class="kct kc-s"><colgroup>' + cg + '</colgroup><thead>' + h1 + h2 + '</thead><tbody>' + body + '</tbody><tfoot>' + ft + '</tfoot></table>'
      + '<div class="kc-note">Components V4 to V7 are paid as per actuals on the quantity consumed in the quarter (QB / T / Qd). A component supplied on Schedule \u2018A\u2019 is not considered. Total V = V1 + V2 + V3 + V4 + V5 + V6 + V7 (operative both ways).' + (R.hasCap ? ' Total payable is limited to the ceiling shown above, cumulatively over the RA bills.' : '') + '</div>'
      + signHtml() + '</section>';
  }

  function pagesHtml() {
    var D = compute();
    return coverHtml() + labourHtml(D) + materialHtml(D)
      + singleHtml(D, D.A, 'ASPHALT COMPONENT', 'Asphalt Qty (In<br>M.T.)', 'TOTAL ASPHALT QTY (IN M.T.)', D.tot.asp)
      + singleHtml(D, D.C, 'CEMENT COMPONENT', 'Cement<br>Quantity (M.T.)', 'TOTAL CEMENT QUANTITY (M.T.)', D.tot.cem)
      + truckHtml(D) + kstmtHtml(D) + raHtml(D) + raHtmlB(D);
  }

  /* ── 7. CSS (Print & PDF layout kept intact) ─────────────────────────────────────────────────────────────── */
  function imp(c) {
    return c.replace(/\{([^{}]*)\}/g, function (m, b) {
      return '{' + b.split(';').map(function (d) { d = d.trim(); return (d && d.indexOf('!important') < 0) ? d + '!important' : d; }).filter(Boolean).join(';') + '}';
    });
  }
  function pageCss() {
    var css =
      '@page kcport{size:A4 portrait;margin:12mm 9mm}@page kcland{size:A4 landscape;margin:12mm 9mm}'
      + '.kcw{font-family:Tahoma,"Segoe UI",Verdana,Geneva,Arial,sans-serif;color:#000;background:#fff;font-size:9.5pt;line-height:1.3;-webkit-print-color-adjust:exact;print-color-adjust:exact}'
      + '.kcw *{box-sizing:border-box}'
      + '.kcw .kcpt{page:kcport}.kcw .kcl{page:kcland}'
      + '.kcw .kcbrk{page-break-before:always;break-before:page}'
      + '.kcw .kcpg{background:#fff;color:#000}'
      + '.kcw .kc-wk{font-size:10pt;margin:0 0 5mm 4mm}'
      + '.kcw .kc-t{text-align:center;font-weight:700;font-size:13pt;margin:0 0 5mm}'
      + '.kcw table.kct{width:100%;border-collapse:collapse;table-layout:fixed;background:#fff;margin:0}'
      + '.kcw table.kct th,.kcw table.kct td{border:1px solid #000;padding:2mm 1.4mm;vertical-align:middle;text-align:center;font-size:9pt;color:#000;background:#fff;overflow-wrap:anywhere;font-weight:400}'
      + '.kcw table.kct th{font-weight:700}'
      + '.kcw table.kct.kc-s th,.kcw table.kct.kc-s td{font-size:8pt;padding:1.6mm .8mm}'
      + '.kcw table.kct td.d{text-align:left;font-size:8.5pt;line-height:1.5}'
      + '.kcw table.kct td.b,.kcw table.kct tr.kc-tot td{font-weight:700}'
      + '.kcw table.kct tr{page-break-inside:avoid;break-inside:avoid}'
      + '.kcw table.kct thead{display:table-header-group}'
      + '.kcw table.kct tfoot{display:table-row-group}'
      + '.kcw .kc-note{font-size:8pt;margin-top:3mm}'
      + '.kcw .kc-sg{display:flex;justify-content:flex-end;gap:14mm;margin-top:12mm;padding:0 6mm;page-break-inside:avoid}'
      + '.kcw .kc-sgb{text-align:center;line-height:1.45;font-size:9.5pt}';
    return imp(css);
  }

  /* ── 8. PRINT ─────────────────────────────────────────────────────────────────────────────────────────────── */
  function printNow() {
    if (!(typeof items !== 'undefined' && items && items.length)) { toast('Add items first'); return; }
    try { if (typeof updateAll === 'function') updateAll(); } catch (e) {}
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>K1 K2 K3 Component</title><style>'
      + 'html,body{background:#fff;margin:0;padding:0}' + pageCss() + '</style></head><body><div class="kcw">' + pagesHtml() + '</div></body></html>';
    var f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true');
    f.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;height:297mm;border:0;visibility:hidden';
    document.body.appendChild(f);
    var d = f.contentWindow.document; d.open(); d.write(html); d.close();
    var done = false;
    function go() {
      if (done) return; done = true;
      try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {}
      setTimeout(function () { try { f.remove(); } catch (e) {} }, 60000);
    }
    if (d.fonts && d.fonts.ready) { d.fonts.ready.then(function () { setTimeout(go, 150); }); setTimeout(go, 1200); } else setTimeout(go, 500);
  }

  /* ── 9. SCREEN: Enhanced Modern UI & Live Paper Preview ───────────────────────────────────────────────────── */
  function uiStyles() {
    return '<style>'
      + '.kc-ui-wrap *{box-sizing:border-box;font-family:"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}'
      + '.kc-ui-hdr{background:linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 100%);color:#fff;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-radius:10px 10px 0 0;box-shadow:0 2px 6px rgba(30,58,138,.2);}'
      + '.kc-ui-title{font-size:1.05rem;font-weight:700;letter-spacing:.2px;display:flex;align-items:center;gap:8px;}'
      + '.kc-ui-badge{background:rgba(255,255,255,.18);padding:2px 8px;border-radius:12px;font-size:.7rem;font-weight:600;letter-spacing:.5px;}'
      + '.kc-btn{border:none;border-radius:6px;font-weight:600;font-size:.78rem;padding:7px 14px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:all .15s ease;}'
      + '.kc-btn:active{transform:scale(.98);}'
      + '.kc-btn-print{background:#fff;color:#1e3a8a;box-shadow:0 2px 4px rgba(0,0,0,.15);}'
      + '.kc-btn-print:hover{background:#f0f4ff;}'
      + '.kc-btn-close{background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.35);}'
      + '.kc-btn-close:hover{background:rgba(255,255,255,.25);}'
      + '.kc-btn-imp{background:#2563eb;color:#fff;box-shadow:0 1px 3px rgba(37,99,235,.3);}'
      + '.kc-btn-imp:hover{background:#1d4ed8;}'
      + '.kc-btn-add{background:#16a34a;color:#fff;box-shadow:0 1px 3px rgba(22,163,74,.3);}'
      + '.kc-btn-add:hover{background:#15803d;}'
      + '.kc-ui-body{background:#f1f5f9;padding:14px 16px;border-bottom:1px solid #cbd5e1;display:flex;flex-direction:column;gap:12px;max-height:48vh;overflow-y:auto;}'
      + '.kc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px;align-items:stretch;}'
      + '.kc-card{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:11px 13px;box-shadow:0 1px 3px rgba(15,23,42,.04);display:flex;flex-direction:column;}'
      + '.kc-card-t{font-size:.75rem;font-weight:700;color:#1e3a8a;text-transform:uppercase;letter-spacing:.4px;border-bottom:1px solid #f1f5f9;padding-bottom:6px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;}'
      + '.kc-inp{border:1px solid #cbd5e1;border-radius:5px;background:#f8fafc;color:#0f172a;font-size:.75rem;padding:4px 7px;transition:border-color .15s,background .15s,box-shadow .15s;}'
      + '.kc-inp:focus{outline:none;border-color:#2563eb;background:#fff;box-shadow:0 0 0 2.5px rgba(37,99,235,.15);}'
      + '.kc-chk{width:14px;height:14px;accent-color:#1d4ed8;cursor:pointer;vertical-align:middle;}'
      + '.kc-tbl{width:100%;border-collapse:collapse;font-size:.74rem;}'
      + '.kc-tbl th{font-size:.67rem;font-weight:600;color:#64748b;text-align:left;padding:3px 5px;border-bottom:1px solid #e2e8f0;}'
      + '.kc-tbl td{padding:3.5px 5px;color:#334155;border-bottom:1px solid #f8fafc;}'
      + '.kc-tbl tr:hover td{background:#f8fafc;}'
      + '.kc-kv{display:grid;grid-template-columns:1fr auto;gap:6px 10px;align-items:center;font-size:.74rem;color:#334155;}'
      + '.kc-note-sm{font-size:.67rem;color:#64748b;margin-top:6px;line-height:1.35;}'
      + '.kc-del-btn{border:1px solid #fecaca;color:#dc2626;background:#fef2f2;border-radius:5px;cursor:pointer;font-size:.72rem;padding:3px 7px;transition:all .15s;}'
      + '.kc-del-btn:hover{background:#dc2626;color:#fff;}'
      + '.kc-prev-wrap{background:#cbd5e1;padding:18px 14px;flex:1;overflow:auto;box-shadow:inset 0 2px 6px rgba(0,0,0,.08);}'
      + '.kc-guide-det summary{cursor:pointer;font-size:.72rem;font-weight:600;color:#1d4ed8;user-select:none;padding:4px 0;}'
      + '.kc-guide-det summary:hover{text-decoration:underline;}'
      + '</style>';
  }

  function renderPreview() {
    var box = document.getElementById('kcPrev'); if (!box) return;
    if (!(typeof items !== 'undefined' && items && items.length)) {
      box.innerHTML = '<div style="padding:3rem 1.5rem;text-align:center;background:#fff;border-radius:8px;max-width:460px;margin:2rem auto;box-shadow:0 2px 8px rgba(0,0,0,.08);color:#475569;font-family:\'Segoe UI\',Arial,sans-serif">'
        + '<div style="font-size:2rem;margin-bottom:.5rem">\uD83D\uDCCB</div>'
        + '<div style="font-weight:700;font-size:.95rem;color:#1e293b;margin-bottom:.3rem">No Estimate Items Found</div>'
        + '<div style="font-size:.8rem;color:#64748b">Add items to your estimate first \u2013 the K1, K2, K3 statements will generate automatically.</div></div>';
      return;
    }
    box.innerHTML = '<style>' + pageCss()
      + '.kcprev .kcpg{border:1px solid #94a3b8;margin:0 auto 20px;padding:10mm;box-shadow:0 6px 20px rgba(15,23,42,.16);overflow-x:auto;border-radius:2px}'
      + '.kcprev .kcl{min-width:920px}'
      + '.kcprev .kcpt{max-width:780px}'
      + '.kcprev .kcov{height:auto!important;min-height:700px}'
      + '.kcprev .kcbrk{page-break-before:auto!important}'
      + '</style><div class="kcw kcprev">' + pagesHtml() + '</div>';
  }

  function uiHtml(tab) {
    function sIn(key, w, ph, ty) {
      var v = CFG[key]; if (v == null) v = '';
      return '<input class="kc-inp" type="' + (ty || 'number') + '"' + ((ty || 'number') === 'number' ? ' min="0" step="any"' : '') + ' data-kcs="' + key + '" value="' + E(v) + '" placeholder="' + E(ph) + '" style="width:' + w + 'px;text-align:' + (ty === 'text' ? 'left' : 'right') + '">';
    }
    function cIn(key) { return '<input class="kc-chk" type="checkbox" data-kcs="' + key + '"' + (key === 'usePip' ? (CFG[key] === true ? ' checked' : '') : (CFG[key] !== false ? ' checked' : '')) + '>'; }

    var rows = KC_TRUCK.map(function (g) {
      return '<tr><td style="font-weight:500">' + E(g.trk || g.name) + '</td>'
        + '<td><input class="kc-inp" type="number" min="0" step="any" data-kc="cap" data-id="' + g.id + '" value="' + capOf(g) + '" style="width:66px;text-align:right"></td>'
        + '<td style="color:#64748b;font-size:.7rem">' + g.unit + '</td>'
        + '<td><input class="kc-inp" type="number" min="0" step="any" data-kc="lead" data-id="' + g.id + '" value="' + (leadOvr(g) === null ? '' : leadOvr(g)) + '" placeholder="' + (leadOf(g) > 0 ? leadOf(g) + ' (chart)' : 'chart') + '" title="Blank = take lead from the Lead Charges tab" style="width:88px;text-align:right"></td></tr>';
    }).join('');

    var outer = tab
      ? 'background:#fff;border-radius:10px;width:100%;display:flex;flex-direction:column;border:1px solid #cbd5e1;box-shadow:0 4px 12px rgba(0,0,0,.05)'
      : 'background:#fff;border-radius:10px;width:min(1120px,100%);max-height:95vh;display:flex;flex-direction:column;box-shadow:0 20px 50px rgba(15,23,42,.4)';

    return uiStyles() + '<div class="kc-ui-wrap" style="' + outer + '">'
      + '<div class="kc-ui-hdr">'
      +   '<div class="kc-ui-title">\uD83D\uDE9B K1, K2, K3 Component <span class="kc-ui-badge">Maha PWD</span></div>'
      +   '<div style="display:flex;gap:8px;align-items:center">'
      +     '<button id="kcPrint" class="kc-btn kc-btn-print">\uD83D\uDDA8 Print / Save PDF</button>'
      +     (tab ? '' : '<button id="kcClose" class="kc-btn kc-btn-close">\u2715 Close</button>')
      +   '</div>'
      + '</div>'
      + '<div class="kc-ui-body">'
      +   '<div class="kc-grid">'

      /* Card 1: Truck Kilometre */
      +   '<div class="kc-card" style="grid-column:span 1">'
      +     '<div class="kc-card-t"><span>\uD83D\uDE9A Truck Kilometre (Load &amp; Lead)</span></div>'
      +     '<div style="overflow-x:auto"><table class="kc-tbl"><thead><tr><th>Material</th><th>L.F.</th><th>Unit</th><th>Lead (Km)</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      +     '<div class="kc-note-sm">Blank Lead = auto-fetched from Lead Charges tab.</div>'
      +   '</div>'

      /* Card 2: Components Paid on Actuals */
      +   '<div class="kc-card">'
      +     '<div class="kc-card-t"><span>\uD83D\uDCCA Actuals Components (GR 16-5-2005)</span></div>'
      +     '<table class="kc-tbl"><thead><tr><th>Component</th><th style="text-align:center">Use</th><th>Star Rate (Rs./MT)</th><th>Total Qty (MT)</th></tr></thead><tbody>'
      +       '<tr><td style="font-weight:500">Cement</td><td style="text-align:center">' + cIn('useCem') + '</td><td>' + sIn('srCem', 82, 'Rs.') + '</td><td style="color:#64748b;font-size:.7rem">from estimate</td></tr>'
      +       '<tr><td style="font-weight:500">HYSD &amp; Steel</td><td style="text-align:center">' + cIn('useStl') + '</td><td>' + sIn('srStl', 82, 'Rs.') + '</td><td>' + sIn('stlQty', 76, 'estimate') + '</td></tr>'
      +       '<tr><td style="font-weight:500">Bitumen</td><td style="text-align:center">' + cIn('useBit') + '</td><td>' + sIn('srBit', 82, 'Rs.') + '</td><td style="color:#64748b;font-size:.7rem">from estimate</td></tr>'
      +       '<tr><td style="font-weight:500">C.I. / D.I. Pipes</td><td style="text-align:center">' + cIn('usePip') + '</td><td>' + sIn('srPip', 82, 'Rs.') + '</td><td>' + sIn('pipQty', 76, 'M.T.') + '</td></tr>'
      +     '</tbody></table>'
      +     '<div class="kc-note-sm">Untick if supplied on Schedule \u2018A\u2019.</div>'
      +   '</div>'

      /* Card 3: K3 POL & Display Options */
      +   '<div class="kc-card">'
      +     '<div class="kc-card-t"><span>\u26FD K3 \u2013 POL &amp; General Options</span></div>'
      +     '<div class="kc-kv">'
      +       '<span>Diesel rate (Rs./Litre)</span>' + sIn('dieselRate', 86, 'Rs.')
      +       '<span>Truck Mileage (Km/Litre)</span>' + sIn('kmpl', 86, 'km/l')
      +       '<span title="Blank = total of the estimate items">Items total override (Rs.)</span>' + sIn('baseOvr', 105, 'auto')
      +     '</div>'
      +     '<div style="border-top:1px solid #f1f5f9;margin-top:10px;padding-top:8px">'
      +       '<label style="display:flex;align-items:center;gap:7px;font-size:.74rem;font-weight:500;color:#1e293b;cursor:pointer">'
      +         '<input class="kc-chk" type="checkbox" id="kcHide"' + (CFG.hideZero ? ' checked' : '') + '> Hide rows with zero quantity'
      +       '</label>'
      +     '</div>'
      +   '</div>'

      /* Card 4: Base Indices */
      +   '<div class="kc-card">'
      +     '<div class="kc-card-t"><span>\uD83D\uDCC8 Base Indices (Preceding Quarter)</span></div>'
      +     '<div class="kc-kv">'
      +       '<span>Base Quarter</span>' + sIn('baseQtr', 110, 'e.g. Oct\u2013Dec 2025', 'text')
      +       '<span>L0 (Labour CPI-IW)</span>' + sIn('C0', 84, '')
      +       '<span>M0 (Wholesale PI)</span>' + sIn('I0', 84, '')
      +       '<span>P0 (HSD price)</span>' + sIn('P0', 84, '')
      +       '<span title="B0 = higher of this and the bitumen star rate">Bitumen avg price (Rs./MT)</span>' + sIn('bitBase', 84, 'Rs./MT')
      +       '<span>SI0 (Steel index, RBI)</span>' + sIn('SI0', 84, '')
      +       '<span>CI0 (Cement index, RBI)</span>' + sIn('CI0', 84, '')
      +       '<span>D0 (Pig iron Rs./MT)</span>' + sIn('D0', 84, 'Rs./MT')
      +     '</div>'
      +   '</div>'

      /* Card 5: Eligibility & Ceiling */
      +   '<div class="kc-card">'
      +     '<div class="kc-card-t"><span>\uD83D\uDEE1\uFE0F Eligibility &amp; Ceiling (Optional)</span></div>'
      +     '<div class="kc-kv">'
      +       '<span>Eligibility Factor (%)</span>' + sIn('eligPct', 84, '85')
      +       '<span>Accepted Tender Amt (Rs.)</span>' + sIn('tenderAmt', 110, '')
      +       '<span>Price Variation Ceiling (%)</span>' + sIn('ceilPct', 84, 'none')
      +     '</div>'
      +     '<div class="kc-note-sm">Default eligibility factor is 85%. Leave ceiling blank if no upper cap applies.</div>'
      +   '</div>'

      +   '</div>' /* End Grid */

      /* RA Bills Card (Full Width) */
      +   '<div id="kcRaBox" class="kc-card" style="width:100%"></div>'
      + '</div>'
      + '<div id="kcPrev" class="kc-prev-wrap"></div>'
      + '</div>';
  }

  function wireUi(root, onClose) {
    var cl = root.querySelector('#kcClose'); if (cl) cl.onclick = onClose;
    root.querySelector('#kcPrint').onclick = printNow;
    root.querySelector('#kcHide').onchange = function () { CFG.hideZero = this.checked; cfgSave(); renderPreview(); };
    [].forEach.call(root.querySelectorAll('input[data-kc]'), function (inp) {
      inp.oninput = function () {
        var kind = inp.getAttribute('data-kc'), id = inp.getAttribute('data-id'), v = parseFloat(inp.value);
        if (isNaN(v)) delete CFG[kind][id]; else CFG[kind][id] = v;
        cfgSave(); renderPreview();
      };
    });
    [].forEach.call(root.querySelectorAll('input[data-kcs]'), function (inp) {
      inp[inp.type === 'checkbox' ? 'onchange' : 'oninput'] = function () {
        var k = inp.getAttribute('data-kcs');
        if (inp.type === 'checkbox') { CFG[k] = inp.checked; cfgSave(); drawRa(root); renderPreview(); return; }
        if (inp.type === 'number') { var v = parseFloat(inp.value); CFG[k] = isNaN(v) ? '' : v; } else CFG[k] = inp.value;
        cfgSave(); renderPreview();
      };
    });
    drawRa(root);
    renderPreview();
  }

  function raPicker(root) {
    var fb = (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) ? firebase : null;
    var user = (fb && fb.auth) ? fb.auth().currentUser : null;
    if (!fb || !user) { alert('Please log in first (same login as the RA bill app). You can also type the RA bill values yourself in the table.'); return; }
    var old = document.getElementById('kcRaPick'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'kcRaPick';
    ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,.55);backdrop-filter:blur(2px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:14px';
    ov.innerHTML = '<div style="background:#fff;color:#1e293b;border-radius:10px;max-width:920px;width:100%;max-height:88vh;overflow:auto;padding:18px 20px;font-family:\'Segoe UI\',Arial,sans-serif;font-size:13px;box-shadow:0 20px 40px rgba(0,0,0,.3)"><div id="kcRaPickBody">Loading saved RA bills\u2026</div></div>';
    document.body.appendChild(ov);
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    var body = ov.querySelector('#kcRaPickBody');
    var closeBtn = '<button type="button" id="kcRaPickX" style="padding:6px 14px;border:1px solid #cbd5e1;background:#fff;color:#475569;border-radius:6px;font-weight:600;cursor:pointer">Close</button>';
    function ms(d) { return (d.savedAt && d.savedAt.toMillis) ? d.savedAt.toMillis() : 0; }
    function nm(x) { return parseFloat(String(x).replace(/[^0-9.]/g, '')); }
    function rd(x, n) { var f = Math.pow(10, n); return Math.round((+x || 0) * f) / f; }

    fb.firestore().collection('ra_bills').where('uid', '==', user.uid).get().then(function (snap) {
      var docs = []; snap.forEach(function (d) { var x = d.data(); x._id = d.id; docs.push(x); });
      if (!docs.length) { body.innerHTML = '<p>No saved RA bills found. Save the bill in the RA bill app first, or type the values in the table.</p>' + closeBtn; body.querySelector('#kcRaPickX').onclick = function () { ov.remove(); }; return; }
      var works = {}, newest = {};
      docs.forEach(function (d) {
        var k = String(d.workName || '').replace(/\s+/g, ' ').trim() || '(no work name)';
        (works[k] = works[k] || []).push(d); newest[k] = Math.max(newest[k] || 0, ms(d));
      });
      var names = Object.keys(works).sort(function (a, b) { return newest[b] - newest[a]; });
      var curWork = names[0], cur = [];

      function billsOf(k) {
        var by = {};
        works[k].forEach(function (d) { var n = String(d.billNo || ''); if (!by[n] || ms(d) > ms(by[n])) by[n] = d; });
        return Object.keys(by).map(function (n) { return by[n]; }).sort(function (a, b) {
          var x = nm(a.billNo), y = nm(b.billNo);
          if (!isNaN(x) && !isNaN(y) && x !== y) return x - y;
          return String(a.billDate || '').localeCompare(String(b.billDate || ''));
        });
      }
      function draw() {
        var cum = document.getElementById('kcRaCum') ? document.getElementById('kcRaCum').checked : true;
        var bills = billsOf(curWork); cur = [];
        var rows = '';
        bills.forEach(function (b, i) {
          var pv = b.pv, pp = i > 0 ? bills[i - 1].pv : null, ok = !!pv && (!cum || i === 0 || !!pp), r = null, why = '';
          if (!pv) why = 'Open this bill in the RA bill app and Save once';
          else if (cum && i > 0 && !pp) why = 'Previous bill not saved with figures';
          if (ok) {
            r = { no: b.billNo, w: rd(pv.w - (cum && pp ? pp.w : 0), 2), cemQ: rd(pv.cemQ - (cum && pp ? pp.cemQ : 0), 3), stlQ: rd(pv.stlQ - (cum && pp ? pp.stlQ : 0), 3), bitQ: rd(pv.bitQ - (cum && pp ? pp.bitQ : 0), 3) };
            cur.push(r);
          }
          var td = 'padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;';
          rows += '<tr><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0">' + (ok ? '<input type="checkbox" style="accent-color:#1d4ed8" data-pick="' + (cur.length - 1) + '"' + (i === bills.length - 1 ? ' checked' : '') + '>' : '') + '</td>'
            + '<td style="' + td + 'text-align:left;font-weight:700;color:#1e3a8a">' + E(b.billNo || '\u2014') + '</td><td style="' + td + 'text-align:left">' + E(b.billDate || '') + '</td>'
            + '<td style="' + td + '">' + (pv ? rd(pv.w, 2).toLocaleString('en-IN') : '\u2014') + '</td>'
            + (ok ? '<td style="' + td + 'font-weight:700;' + (r.w < 0 ? 'color:#dc2626' : 'color:#15803d') + '">' + r.w.toLocaleString('en-IN') + '</td><td style="' + td + '">' + r.cemQ + '</td><td style="' + td + '">' + r.stlQ + '</td><td style="' + td + '">' + r.bitQ + '</td>'
                   : '<td colspan="4" style="' + td + 'text-align:left;color:#dc2626;font-size:11px">' + E(why) + '</td>') + '</tr>';
        });
        var opts = names.map(function (n) { return '<option value="' + E(n) + '"' + (n === curWork ? ' selected' : '') + '>' + E(n.length > 90 ? n.slice(0, 90) + '\u2026' : n) + '</option>'; }).join('');
        body.innerHTML = '<div style="font-weight:700;color:#1e3a8a;font-size:15px;margin-bottom:10px;border-bottom:1px solid #e2e8f0;padding-bottom:6px">Import from saved RA bills</div>'
          + '<div style="margin-bottom:8px"><label style="font-weight:600;color:#475569">Work: <select id="kcRaWork" style="max-width:100%;padding:5px 8px;border:1px solid #cbd5e1;border-radius:5px;margin-left:4px">' + opts + '</select></label></div>'
          + '<label style="display:flex;align-items:center;gap:6px;margin-bottom:10px;font-size:12px;color:#334155;cursor:pointer"><input type="checkbox" id="kcRaCum" style="accent-color:#1d4ed8"' + (cum ? ' checked' : '') + '> Bills are cumulative (upto date) \u2013 import only the work <b>since the previous bill</b> (recommended)</label>'
          + '<div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:6px"><table style="border-collapse:collapse;width:100%;font-size:12px"><thead><tr style="background:#f8fafc;color:#475569;text-align:right;border-bottom:1px solid #cbd5e1"><th></th><th style="text-align:left;padding:6px 8px">Bill</th><th style="text-align:left;padding:6px 8px">Date</th><th style="padding:6px 8px">Upto-date W (Rs.)</th><th style="padding:6px 8px">' + (cum ? 'W since prev. bill' : 'W') + '</th><th style="padding:6px 8px">Cement MT</th><th style="padding:6px 8px">Steel MT</th><th style="padding:6px 8px">Bitumen MT</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
          + '<div style="font-size:11px;color:#64748b;margin:10px 0;line-height:1.4">Tick the bill(s) to import. L1, M1, P1, B1, SI1, CI1 are not imported \u2013 enter the index of the quarter in which that bill\u2019s work was done. Extra items / excess qty (Clause 38/37) are not removed from W automatically.</div>'
          + '<div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" id="kcRaPickGo" style="padding:6px 16px;border:none;background:#16a34a;color:#fff;border-radius:6px;font-weight:600;cursor:pointer">Import selected</button>' + closeBtn + '</div>';
        body.querySelector('#kcRaWork').onchange = function () { curWork = this.value; draw(); };
        body.querySelector('#kcRaCum').onchange = draw;
        body.querySelector('#kcRaPickX').onclick = function () { ov.remove(); };
        body.querySelector('#kcRaPickGo').onclick = function () {
          var picks = body.querySelectorAll('input[data-pick]:checked');
          if (!picks.length) { alert('Tick at least one bill.'); return; }
          [].forEach.call(picks, function (c) {
            var r = cur[parseInt(c.getAttribute('data-pick'), 10)], row = null;
            (CFG.ra || []).forEach(function (x) { if (!row && String(x.no) === String(r.no)) row = x; });
            if (!row) { row = { no: String(r.no), per: '' }; RA_NUM.forEach(function (f) { row[f] = ''; }); CFG.ra.push(row); }
            row.w = r.w; row.cemQ = r.cemQ; row.stlQ = r.stlQ; row.bitQ = r.bitQ;
          });
          cfgSave(); ov.remove(); drawRa(root); renderPreview();
        };
      }
      draw();
    }).catch(function (e) { body.innerHTML = '<p>Could not load RA bills: ' + E(e.message) + '</p>' + closeBtn; body.querySelector('#kcRaPickX').onclick = function () { ov.remove(); }; });
  }

  function drawRa(root) {
    var box = root.querySelector('#kcRaBox'); if (!box) return;
    var F = [['no', 'RA Bill No.', 66, 'text'], ['per', 'Quarter / Period', 105, 'text'], ['w', 'Cost of work done W (Rs.)', 115, 'number']];
    if (CFG.useCem !== false) F.push(['cemQ', 'Cement (M.T.)', 82, 'number']);
    if (CFG.useStl !== false) F.push(['stlQ', 'Steel (M.T.)', 82, 'number']);
    if (CFG.useBit !== false) F.push(['bitQ', 'Bitumen QB (M.T.)', 86, 'number']);
    if (CFG.usePip === true)  F.push(['pipQ', 'Pipes Qd (M.T.)', 84, 'number']);
    F.push(['c1', 'L1 Labour CPI', 74, 'number'], ['i1', 'M1 Wholesale PI', 76, 'number'], ['p1', 'P1 HSD price', 74, 'number']);
    if (CFG.useBit !== false) F.push(['b1', 'B1 Bitumen Rs./MT', 86, 'number']);
    if (CFG.useStl !== false) F.push(['s1', 'SI1 Steel index', 74, 'number']);
    if (CFG.useCem !== false) F.push(['ci1', 'CI1 Cement index', 74, 'number']);
    if (CFG.usePip === true)  F.push(['d1', 'D1 Pig iron Rs./MT', 86, 'number']);

    var h = '<div class="kc-card-t" style="flex-wrap:wrap;gap:8px">'
      + '<span>\uD83D\uDCDD RA Bills \u2013 Price Variation (Statement 6)</span>'
      + '<div style="display:flex;gap:8px;align-items:center">'
      +   '<button type="button" id="kcRaImp" class="kc-btn kc-btn-imp" style="padding:4px 10px;font-size:.72rem">\u2B07 Import Saved RA Bills</button>'
      +   '<button type="button" id="kcRaAdd" class="kc-btn kc-btn-add" style="padding:4px 10px;font-size:.72rem">+ Add RA Bill</button>'
      + '</div></div>'
      + '<div style="font-size:.69rem;color:#64748b;margin-bottom:8px">Indices (L1, M1, P1, etc.) are averages for the quarter under consideration; W excludes extra items / excess quantities.</div>'
      + '<div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:6px"><table class="kc-tbl"><thead><tr style="background:#f8fafc"><th style="width:32px">Sr.</th>';

    F.forEach(function (f) { h += '<th style="vertical-align:bottom">' + f[1] + '</th>'; });
    h += '<th style="width:36px"></th></tr></thead><tbody>';

    if (!(CFG.ra || []).length) {
      h += '<tr><td colspan="' + (F.length + 2) + '" style="text-align:center;color:#94a3b8;padding:10px;font-size:.73rem">No RA bills added yet. Click <b>+ Add RA Bill</b> or <b>Import Saved RA Bills</b>.</td></tr>';
    } else {
      (CFG.ra || []).forEach(function (b, i) {
        h += '<tr><td style="font-weight:600;color:#64748b">' + (i + 1) + '</td>';
        F.forEach(function (f) {
          h += '<td style="padding:4px 3px"><input class="kc-inp" type="' + f[3] + '"' + (f[3] === 'number' ? ' min="0" step="any"' : '') + ' data-ra="' + i + '" data-f="' + f[0] + '" value="' + E(b[f[0]] == null ? '' : b[f[0]]) + '" style="width:' + f[2] + 'px;text-align:' + (f[3] === 'text' ? 'left' : 'right') + '"></td>';
        });
        h += '<td style="text-align:center"><button type="button" class="kc-del-btn" data-radel="' + i + '" title="Delete this RA bill">\u2715</button></td></tr>';
      });
    }
    h += '</tbody></table></div>';

    var LG = [
      ['W', 'Cost of work done in this RA bill (extra items / excess qty excluded)', 'The quarter in which this bill\u2019s work was executed', 'RA bill (net since previous bill)'],
      ['Cement / Steel / Bitumen used', 'Quantity of cement, steel, bitumen actually used in this RA bill (M.T.)', 'Same bill / same quarter', 'RA bill (net since previous bill)'],
      ['L1 Labour CPI', 'Labour CPI-IW \u2013 average of the 3 months', 'Quarter under consideration (work done), NOT the base quarter', 'Labour Bureau'],
      ['M1 Wholesale PI', 'WPI (All Commodities) \u2013 average of the 3 months', 'Quarter under consideration', 'eaindustry.nic.in'],
      ['P1 HSD price', 'HSD (diesel) price \u2013 average of the 3 months', 'Quarter under consideration', 'IOCL / BPCL / HPCL'],
      ['B1 Bitumen', 'Bitumen avg ex-refinery price (Rs./M.T.)', 'Quarter under consideration', 'IOCL price circular'],
      ['SI1 / CI1', 'Steel / Cement index (RBI) \u2013 same series as SI0 / CI0', 'Quarter under consideration', 'RBI Bulletin / Handbook'],
      ['D1 Pig iron', 'Pig iron price (Rs./M.T.), only if CI/DI pipes are considered', 'Quarter under consideration', 'As per tender']
    ];

    h += '<details class="kc-guide-det" style="margin-top:8px"><summary>\u2139\uFE0F Column Entry Guide (What to enter in each column)</summary>'
      + '<div style="margin-top:6px;padding:8px 10px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;font-size:.7rem;color:#334155">'
      + '<div style="color:#475569;margin-bottom:6px"><b>L0, M0, P0, SI0, CI0, D0</b> = base indices (quarter <b>preceding the tender month</b>). <b>L1, M1, P1, B1, SI1, CI1, D1</b> = indices of the quarter in which the RA bill\u2019s work was done. If one bill covers two quarters, add one row per quarter.</div>'
      + '<div style="overflow-x:auto"><table class="kc-tbl"><thead><tr><th>Column</th><th>Meaning</th><th>For which period</th><th>Take from</th></tr></thead><tbody>';
    LG.forEach(function (r) { h += '<tr>' + r.map(function (c, j) { return '<td style="' + (j === 0 ? 'font-weight:700;color:#1e3a8a;white-space:nowrap' : '') + '">' + c + '</td>'; }).join('') + '</tr>'; });
    h += '</tbody></table></div></div></details>';

    box.innerHTML = h;
    [].forEach.call(box.querySelectorAll('input[data-ra]'), function (inp) {
      inp.oninput = function () {
        var i = parseInt(inp.getAttribute('data-ra'), 10), f = inp.getAttribute('data-f');
        if (!CFG.ra[i]) return;
        if (inp.type === 'number') { var v = parseFloat(inp.value); CFG.ra[i][f] = isNaN(v) ? '' : v; } else CFG.ra[i][f] = inp.value;
        cfgSave(); renderPreview();
      };
    });
    [].forEach.call(box.querySelectorAll('button[data-radel]'), function (btn) {
      btn.onclick = function () { CFG.ra.splice(parseInt(btn.getAttribute('data-radel'), 10), 1); cfgSave(); drawRa(root); renderPreview(); };
    });
    box.querySelector('#kcRaImp').onclick = function () { raPicker(root); };
    box.querySelector('#kcRaAdd').onclick = function () {
      var r = { no: String(CFG.ra.length + 1), per: '' }; RA_NUM.forEach(function (f) { r[f] = ''; });
      CFG.ra.push(r); cfgSave(); drawRa(root); renderPreview();
    };
  }

  function renderTab(host) {
    host = host || document.getElementById('kcTabHost'); if (!host) return;
    var old = document.getElementById('kcModal'); if (old) old.remove();
    try { if (typeof updateAll === 'function' && typeof items !== 'undefined' && items.length) updateAll(); } catch (e) {}
    host.innerHTML = uiHtml(true);
    wireUi(host, function () {});
  }

  function open() {
    var old = document.getElementById('kcModal'); if (old) old.remove();
    try { if (typeof updateAll === 'function' && typeof items !== 'undefined' && items.length) updateAll(); } catch (e) {}
    var m = document.createElement('div'); m.id = 'kcModal';
    m.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.6);backdrop-filter:blur(2px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:.8rem;font-family:"Segoe UI",Arial,Helvetica,sans-serif';
    m.innerHTML = uiHtml(false);
    document.body.appendChild(m);
    m.addEventListener('mousedown', function (e) { if (e.target === m) m.remove(); });
    wireUi(m, function () { m.remove(); });
  }

  /* ── 10. WIRING ───────────────────────────────────────────────────────────────────────────────────────────── */
  function printAllPage() {
    if (!(typeof items !== 'undefined' && items && items.length)) return null;
    var d = document.createElement('div');
    d.className = '_pdf-print-page kcw';
    d.style.cssText = 'display:block;margin:0;padding:0;background:#fff;page-break-before:always;break-before:page;page-break-after:always;break-after:page';
    d.innerHTML = '<style>' + pageCss() + '</style>' + pagesHtml();
    return d;
  }
  function hookPrint() {
    if (typeof window.atpPdfPrintPage !== 'function') return false;
    if (window.atpPdfPrintPage._kc) return true;
    var o = window.atpPdfPrintPage;
    var w = function (id) { if (id === 'pk') return printAllPage(); return o.apply(this, arguments); };
    w._kc = true;
    window.atpPdfPrintPage = w;
    return true;
  }
  function register() {
    try {
      if (typeof PRINT_SHEETS !== 'undefined' && PRINT_SHEETS && !PRINT_SHEETS.some(function (s) { return s.id === 'pk'; })) {
        var ix = -1; PRINT_SHEETS.forEach(function (s, i) { if (s.id === 'p20') ix = i; });
        PRINT_SHEETS.splice(ix >= 0 ? ix + 1 : PRINT_SHEETS.length, 0, { id: 'pk', name: 'K1, K2, K3 Component', on: false });
      }
      if (typeof SM_SHEETS !== 'undefined' && SM_SHEETS && !SM_SHEETS.some(function (s) { return s.id === 'pk'; })) {
        SM_SHEETS.push({ id: 'pk', label: 'K1, K2, K3 Component', defaultRoles: ['sde'] });
      }
    } catch (e) {}
  }
  function addFab() {
    if (window.KC_NO_FAB || document.getElementById('kcFab')) return;
    var b = document.createElement('button');
    b.id = 'kcFab'; b.type = 'button'; b.textContent = '\uD83D\uDE9B K1\u00B7K2\u00B7K3';
    b.title = 'K1, K2, K3 Component';
    b.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:9000;padding:.45rem .85rem;border:none;border-radius:999px;background:linear-gradient(135deg,#1e3a8a,#1d4ed8);color:#fff;font:700 .74rem "Segoe UI",Arial,Helvetica,sans-serif;cursor:pointer;box-shadow:0 4px 12px rgba(30,58,138,.35);transition:transform .15s';
    b.onmouseenter = function () { b.style.transform = 'translateY(-1px)'; };
    b.onmouseleave = function () { b.style.transform = 'none'; };
    b.onclick = open;
    var mount = document.getElementById('kcMount');
    if (mount) { b.style.cssText = 'padding:.45rem .9rem;border:none;border-radius:6px;background:linear-gradient(135deg,#1e3a8a,#1d4ed8);color:#fff;font:700 .76rem "Segoe UI",Arial,Helvetica,sans-serif;cursor:pointer;box-shadow:0 2px 6px rgba(30,58,138,.25)'; mount.appendChild(b); }
    else document.body.appendChild(b);
    var st = document.createElement('style'); st.textContent = '@media print{#kcFab{display:none!important}}';
    document.head.appendChild(st);
  }

  window.kcOpen = open;
  window.kcRenderTab = renderTab;
  window.kcPrint = printNow;
  window.kcPagesHtml = pagesHtml;
  window.kcCompute = compute;
  window.kcForSave = function () { return JSON.parse(JSON.stringify(CFG)); };
  window.kcRestore = function (o) { if (o && typeof o === 'object') { if (!Array.isArray(o.ra)) CFG.ra = []; cfgMerge(o); cfgSave(); } };

  cfgLoad();
  if (typeof document !== 'undefined') {
    register();
    var tries = 0, iv = setInterval(function () { register(); if (hookPrint() || ++tries > 60) clearInterval(iv); }, 500);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addFab); else addFab();
  }
})();