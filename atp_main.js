// Maha PWD Estimator - Main Logic


// SSR data → see ssr_data.js

var _unsub_pay=null,_unsub_user=null;
var STORE_KEY='atp_maha_pwd_v1';
/* SCADA Settings */
var CANCEL_SCADA=false; /* if true, SCADA deduction will not apply */
var CUSTOM_SCADA_VAL=-126; /* default SCADA value, can be changed */

/* Toggle Cancel SCADA - button in Settings tab */
function toggleCancelSCADA(){
  CANCEL_SCADA=!CANCEL_SCADA;
  var btn=document.getElementById('scadaCancelBtn');
  if(btn){
    if(CANCEL_SCADA){
      btn.textContent='✅ SCADA Cancelled';
      btn.style.background='#e8f5e9';
      btn.style.color='#2e7d32';
      btn.style.borderColor='#2e7d32';
    } else {
      btn.textContent='❌ SCADA Deduction Active';
      btn.style.background='#fff';
      btn.style.color='#c62828';
      btn.style.borderColor='#c62828';
    }
  }
  updateAll();
  showToast(CANCEL_SCADA?'✅ SCADA Deduction cancelled — new items will not have SCADA':'❌ SCADA Deduction is active','info');
}

/* Update custom SCADA value from settings input */
function updateScadaVal(){
  var inp=document.getElementById('sScadaVal');
  if(inp){
    var v=parseFloat(inp.value);
    if(!isNaN(v))CUSTOM_SCADA_VAL=v;
  }
}

/* CF merged into CF_MAP */

const SCADA={"3.4":-126.0,"3.42":-126.0,"3.44":-126.0,"3.46":-126.0,"3.48":-126.0,"3.5":-126.0,"4.12":-126.0,"5.01":-126.0,"5.02":-126.0,"5.03":-126.0,"5.04":-126.0,"5.05":-126.0,"5.06":-126.0,"5.08":-126.0,"5.1":-126.0,"5.12":-126.0,"5.13":-126.0,"5.22":-126.0,"5.22 b":-126.0,"11.02":-126.0,"11.03":-126.0,"11.04":-126.0,"11.22":-126.0,"11.25":-126.0,"11.28":-126.0,"11.29":-126.0,"11.3":-126.0,"11.31":-126.0,"12.25":-126.0,"12.29":-126.0,"12.32":-126.0,"12.34":-126.0,"12.36":-126.0,"12.38":-126.0,"12.49":-126.0,"12.51":-126.0,"12.55":-126.0,"12.57":-126.0,"12.59":-126.0,"14.07":-126.0,"14.15":-126.0,"14.17":-126.0,"14.19":-126.0,"14.27":-126.0,"14.29":-126.0,"14.34":-126.0,"14.39":-126.0,"14.44.a":-126.0,"14.44.b":-126.0,"14.44.c":-126.0,"14.57":-126.0,"14.58":-126.0,"14.59":-126.0,"14.71":-126.0,"14.73":-126.0,"14.86":-126.0,"14.87":-126.0,"14.89":-126.0,"14.9":-126.0,"14.91":-126.0,"14.92":-126.0,"15.02":-126.0,"15.04":-126.0,"15.06":-126.0,"15.08":-126.0,"15.1":-126.0,"15.12":-126.0,"15.13":-126.0,"15.14":-126.0,"15.16":-126.0,"15.18":-126.0,"15.2":-126.0,"15.58":-126.0,"15.6":-126.0,"15.62":-126.0,"15.64":-126.0,"15.66":-126.0,"15.68":-126.0,"15.7":-126.0,"15.72":-126.0,"15.11":-126.0,"15.111":-126.0,"15.112":-126.0,"15.113":-126.0,"15.114":-126.0,"15.115":-126.0,"15.116":-126.0,"15.117":-126.0,"15.118":-126.0,"15.119":-126.0,"15.121":-126.0,"15.122":-126.0,"15.123":-126.0,"15.124":-126.0,"15.125":-126.0,"15.126":-126.0,"15.127":-126.0,"15.129":-126.0,"15.131":-126.0,"15.132":-126.0,"15.133":-126.0,"15.134":-126.0,"15.135":-126.0,"15.136":-126.0,"15.137":-126.0,"15.138":-126.0,"15.139":-126.0,"15.141":-126.0,"15.142":-126.0,"15.143":-126.0,"15.144":-126.0,"15.145":-126.0,"15.146":-126.0,"16.07":-126.0,"17.14":-126.0,"17.15":-126.0,"17.16":-126.0,"17.17":-126.0,"17.18":-126.0,"17.19":-126.0,"17.2":-126.0,"17.21":-126.0,"17.22":-126.0,"17.43":-126.0,"17.44":-126.0,"17.45":-126.0,"17.46":-126.0,"18.01":-126.0,"18.02":-126.0,"18.03":-126.0,"18.04":-126.0,"18.05":-126.0,"18.06":-126.0,"22.01":-126.0,"22.02":-126.0,"22.03":-126.0,"22.04":-126.0,"22.05":-126.0,"22.06":-126.0,"22.07":-126.0,"22.08":-126.0,"22.09":-126.0,"22.1":-126.0,"22.11":-126.0,"22.12":-126.0,"22.13":-126.0,"22.14":-126.0,"22.15":-126.0,"22.16":-126.0,"22.17":-126.0,"22.18":-126.0,"22.19":-126.0,"22.2":-126.0,"22.21":-126.0,"22.22":-126.0,"22.23":-126.0,"22.24":-126.0,"22.25":-126.0,"22.26":-126.0,"22.27":-126.0,"22.28":-126.0,"22.29":-126.0,"22.3":-126.0,"22.31":-126.0,"22.32":-126.0,"22.33":-126.0,"22.34":-126.0,"22.35":-126.0,"22.36":-126.0,"22.37":-126.0,"22.38":-126.0,"22.59":-126.0,"22.6":-126.0,"22.61":-126.0,"24.01":-126.0,"24.04":-126.0,"24.06":-126.0,"24.08":-126.0,"24.1":-126.0,"24.12":-126.0,"24.14":-126.0,"24.15":-126.0,"25.11":-126.0,"25.13":-126.0,"25.15":-126.0,"25.17":-126.0,"25.19":-126.0,"25.31":-126.0,"25.33":-126.0,"25.35":-126.0,"25.39":-126.0,"25.5":-126.0,"25.52":-126.0,"25.54":-126.0,"25.56":-126.0,"25.58":-126.0,"25.7":-126.0,"25.72":-126.0,"25.74":-126.0,"25.76":-126.0,"25.78":-126.0,"26.05":-126.0,"26.07":-126.0,"26.09":-126.0,"26.11":-126.0,"26.17":-126.0,"26.19":-126.0,"26.23":-126.0,"26.25":-126.0,"26.26":-126.0,"26.27":-126.0,"26.28":-126.0,"26.29":-126.0,"26.31":-126.0,"26.32":-126.0,"26.58":-126.0,"26.6":-126.0,"26.62":-126.0,"26.64":-126.0,"26.66":-126.0,"51.139 a":-126.0,"51.139 b":-126.0,"51.156":-126.0};
const LR={"rubble":{"conv":1,"label":"Rubble / Murrum"},"overmetal":{"conv":1,"label":"Oversize Metal 80mm"},"sand":{"conv":1,"label":"Sand (natural)"},"scr_sand":{"conv":1,"label":"Screened Sand"},"m20mm":{"conv":1,"label":"Metal 20mm"},"m12_10":{"conv":1,"label":"Metal 12-10mm"},"m40mm":{"conv":1,"label":"Metal 40mm"},"quarry":{"conv":1,"label":"Quarry / Soling Stone"},"cement_bags":{"conv":0.05,"label":"Cement (bags)"},"bricks":{"conv":0.001,"label":"Bricks (nos)"},"ms_bars":{"conv":1,"label":"Steel MS/TMT (MT)"},"bitumen":{"conv":1,"label":"Bitumen VG-30 (MT)"}};
const LL={"concrete_block":[[0.0,0.0],[0.5,137.494286],[1.0,149.124286],[1.5,160.5],[2.0,171.421429],[2.5,182.708571],[3.0,193.52],[3.5,204.284286],[4.0,214.877143],[4.5,225.255714],[5.0,235.702857],[5.5,246.545714],[6.0,256.561429],[6.5,267.368571],[7.0,277.218571],[7.5,287.325714],[8.0,297.75],[8.5,307.438571],[9.0,317.384286],[9.5,326.972857],[10.0,336.195714],[11.0,350.617143],[12.0,364.582857],[13.0,378.09],[14.0,391.78],[15.0,404.15],[20.0,497.297143],[25.0,590.384286],[30.0,633.614286],[35.0,718.957143],[40.0,804.214286],[45.0,888.707143],[50.0,922.178571],[60.0,1018.497143],[70.0,1166.738571],[80.0,1316.384286],[90.0,1467.48],[100.0,1616.15],[125.0,1789.924286],[150.0,2123.25],[175.0,2319.6],[200.0,2638.42],[250.0,3260.612857],[300.0,3892.781429],[350.0,4518.991429],[400.0,5153.735714],[500.0,6406.907143],[600.0,7627.394286],[700.0,8910.224286],[800.0,10168.001429],[900.0,11423.505714],[1000.0,12678.505714]],"cement_bags":[[0.0,0.0],[0.5,96.246],[1.0,104.387],[1.5,112.35],[2.0,119.995],[2.5,127.896],[3.0,135.464],[3.5,142.999],[4.0,150.414],[4.5,157.679],[5.0,164.992],[5.5,172.582],[6.0,179.593],[6.5,187.158],[7.0,194.053],[7.5,201.128],[8.0,208.425],[8.5,215.207],[9.0,222.169],[9.5,228.881],[10.0,235.337],[11.0,245.432],[12.0,255.208],[13.0,264.663],[14.0,274.246],[15.0,282.905],[20.0,348.108],[25.0,413.269],[30.0,443.53],[35.0,503.27],[40.0,562.95],[45.0,622.095],[50.0,645.525],[60.0,712.948],[70.0,816.717],[80.0,921.469],[90.0,1027.236],[100.0,1131.305],[125.0,1252.947],[150.0,1486.275],[175.0,1623.72],[200.0,1846.894],[250.0,2282.429],[300.0,2724.947],[350.0,3163.294],[400.0,3607.615],[500.0,4484.835],[600.0,5339.176],[700.0,6237.157],[800.0,7117.601],[900.0,7996.454],[1000.0,8874.954]],"bricks":[[0.0,0.0],[0.5,309.971014],[1.0,336.190016],[1.5,361.835749],[2.0,386.457327],[2.5,411.903382],[3.0,436.276973],[3.5,460.544283],[4.0,484.425121],[4.5,507.822866],[5.0,531.375201],[5.5,555.819646],[6.0,578.399356],[6.5,602.763285],[7.0,624.969404],[7.5,647.755233],[8.0,671.256039],[8.5,693.098229],[9.0,715.520129],[9.5,737.136876],[10.0,757.929147],[11.0,790.441224],[12.0,821.925926],[13.0,852.376812],[14.0,883.239936],[15.0,911.127214],[20.0,1121.120773],[25.0,1330.979066],[30.0,1428.438003],[35.0,1620.837359],[40.0,1813.043478],[45.0,2003.52657],[50.0,2078.985507],[60.0,2296.128824],[70.0,2630.328502],[80.0,2967.694042],[90.0,3308.328502],[100.0,3643.494364],[125.0,4035.256039],[150.0,4786.714976],[175.0,5229.371981],[200.0,5948.128824],[250.0,7350.818035],[300.0,8775.996779],[350.0,10187.742351],[400.0,11618.727858],[500.0,14443.913043],[600.0,17195.413849],[700.0,20087.462158],[800.0,22923.030596],[900.0,25753.47504],[1000.0,28582.782609]],"tiles_hr":[[0.0,0.0],[0.5,192.492],[1.0,208.774],[1.5,224.7],[2.0,239.99],[2.5,255.792],[3.0,270.928],[3.5,285.998],[4.0,300.828],[4.5,315.358],[5.0,329.984],[5.5,345.164],[6.0,359.186],[6.5,374.316],[7.0,388.106],[7.5,402.256],[8.0,416.85],[8.5,430.414],[9.0,444.338],[9.5,457.762],[10.0,470.674],[11.0,490.864],[12.0,510.416],[13.0,529.326],[14.0,548.492],[15.0,565.81],[20.0,696.216],[25.0,826.538],[30.0,887.06],[35.0,1006.54],[40.0,1125.9],[45.0,1244.19],[50.0,1291.05],[60.0,1425.896],[70.0,1633.434],[80.0,1842.938],[90.0,2054.472],[100.0,2262.61],[125.0,2505.894],[150.0,2972.55],[175.0,3247.44],[200.0,3693.788],[250.0,4564.858],[300.0,5449.894],[350.0,6326.588],[400.0,7215.23],[500.0,8969.67],[600.0,10678.352],[700.0,12474.314],[800.0,14235.202],[900.0,15992.908],[1000.0,17749.908]],"ms_bars":[[0.0,0.0],[0.5,96.246],[1.0,104.387],[1.5,112.35],[2.0,119.995],[2.5,127.896],[3.0,135.464],[3.5,142.999],[4.0,150.414],[4.5,157.679],[5.0,164.992],[5.5,172.582],[6.0,179.593],[6.5,187.158],[7.0,194.053],[7.5,201.128],[8.0,208.425],[8.5,215.207],[9.0,222.169],[9.5,228.881],[10.0,235.337],[11.0,245.432],[12.0,255.208],[13.0,264.663],[14.0,274.246],[15.0,282.905],[20.0,348.108],[25.0,413.269],[30.0,443.53],[35.0,503.27],[40.0,562.95],[45.0,622.095],[50.0,645.525],[60.0,712.948],[70.0,816.717],[80.0,921.469],[90.0,1027.236],[100.0,1131.305],[125.0,1252.947],[150.0,1486.275],[175.0,1623.72],[200.0,1846.894],[250.0,2282.429],[300.0,2724.947],[350.0,3163.294],[400.0,3607.615],[500.0,4484.835],[600.0,5339.176],[700.0,6237.157],[800.0,7117.601],[900.0,7996.454],[1000.0,8874.954]],"flooring":[[0.0,0.0],[0.5,9.6246],[1.0,10.4387],[1.5,11.235],[2.0,11.9995],[2.5,12.7896],[3.0,13.5464],[3.5,14.2999],[4.0,15.0414],[4.5,15.7679],[5.0,16.4992],[5.5,17.2582],[6.0,17.9593],[6.5,18.7158],[7.0,19.4053],[7.5,20.1128],[8.0,20.8425],[8.5,21.5207],[9.0,22.2169],[9.5,22.8881],[10.0,23.5337],[11.0,24.5432],[12.0,25.5208],[13.0,26.4663],[14.0,27.4246],[15.0,28.2905],[20.0,34.8108],[25.0,41.3269],[30.0,44.353],[35.0,50.327],[40.0,56.295],[45.0,62.2095],[50.0,64.5525],[60.0,71.2948],[70.0,81.6717],[80.0,92.1469],[90.0,102.7236],[100.0,113.1305],[125.0,125.2947],[150.0,148.6275],[175.0,162.372],[200.0,184.6894],[250.0,228.2429],[300.0,272.4947],[350.0,316.3294],[400.0,360.7615],[500.0,448.4835],[600.0,533.9176],[700.0,623.7157],[800.0,711.7601],[900.0,799.6454],[1000.0,887.4954]],"gi_sheet":[[0.0,0.0],[0.5,96.246],[1.0,104.387],[1.5,112.35],[2.0,119.995],[2.5,127.896],[3.0,135.464],[3.5,142.999],[4.0,150.414],[4.5,157.679],[5.0,164.992],[5.5,172.582],[6.0,179.593],[6.5,187.158],[7.0,194.053],[7.5,201.128],[8.0,208.425],[8.5,215.207],[9.0,222.169],[9.5,228.881],[10.0,235.337],[11.0,245.432],[12.0,255.208],[13.0,264.663],[14.0,274.246],[15.0,282.905],[20.0,348.108],[25.0,413.269],[30.0,443.53],[35.0,503.27],[40.0,562.95],[45.0,622.095],[50.0,645.525],[60.0,712.948],[70.0,816.717],[80.0,921.469],[90.0,1027.236],[100.0,1131.305],[125.0,1252.947],[150.0,1486.275],[175.0,1623.72],[200.0,1846.894],[250.0,2282.429],[300.0,2724.947],[350.0,3163.294],[400.0,3607.615],[500.0,4484.835],[600.0,5339.176],[700.0,6237.157],[800.0,7117.601],[900.0,7996.454],[1000.0,8874.954]],"rubble":[[0.0,0.0],[0.5,177.876667],[1.0,186.485],[1.5,195.0],[2.0,203.316667],[2.5,211.675],[3.0,219.981667],[3.5,228.161667],[4.0,236.28],[4.5,244.31],[5.0,252.223333],[5.5,260.595],[6.0,268.385],[6.5,276.491667],[7.0,284.406667],[7.5,292.283333],[8.0,300.156667],[8.5,307.92],[9.0,315.708333],[9.5,323.245],[10.0,330.77],[11.0,343.78],[12.0,356.53],[13.0,369.03],[14.0,381.348333],[15.0,393.443333],[20.0,468.368333],[25.0,543.243333],[30.0,593.741667],[35.0,664.575],[40.0,735.441667],[45.0,806.241667],[50.0,851.588333],[60.0,957.663333],[70.0,1089.125],[80.0,1220.636667],[90.0,1352.06],[100.0,1483.66],[125.0,1716.863333],[150.0,2026.588333],[175.0,2269.306667],[200.0,2569.346667],[250.0,3169.715],[300.0,3769.708333],[350.0,4370.03],[400.0,4970.175],[500.0,6170.436667]],"manure":[[0.0,0.0],[0.5,195.83],[1.0,205.3],[1.5,214.68],[2.0,223.83],[2.5,233.04],[3.0,242.18],[3.5,251.19],[4.0,260.12],[4.5,268.97],[5.0,277.68],[5.5,286.89],[6.0,295.47],[6.5,304.39],[7.0,313.11],[7.5,321.78],[8.0,330.45],[8.5,338.99],[9.0,347.57],[9.5,355.87],[10.0,364.15],[11.0,378.47],[12.0,392.51],[13.0,406.27],[14.0,419.83],[15.0,433.15],[20.0,515.63],[25.0,598.07],[30.0,653.66],[35.0,731.64],[40.0,809.66],[45.0,887.61],[50.0,937.53],[60.0,1054.31],[70.0,1199.04],[80.0,1343.82],[90.0,1488.51],[100.0,1633.39],[125.0,1890.12],[150.0,2231.11],[175.0,2498.32],[200.0,2828.64],[250.0,3489.59],[300.0,4150.14],[350.0,4811.04],[400.0,5471.75],[500.0,6793.14]],"quarry":[[0.0,0.0],[0.5,227.08],[1.0,238.07],[1.5,248.94],[2.0,259.55],[2.5,270.22],[3.0,280.83],[3.5,291.27],[4.0,301.63],[4.5,311.89],[5.0,321.99],[5.5,332.67],[6.0,342.62],[6.5,352.97],[7.0,363.07],[7.5,373.13],[8.0,383.18],[8.5,393.09],[9.0,403.03],[9.5,412.65],[10.0,422.26],[11.0,438.87],[12.0,455.14],[13.0,471.1],[14.0,486.83],[15.0,502.27],[20.0,597.92],[25.0,693.5],[30.0,757.97],[35.0,848.39],[40.0,938.86],[45.0,1029.24],[50.0,1087.13],[60.0,1222.55],[70.0,1390.37],[80.0,1558.26],[90.0,1726.03],[100.0,1894.03],[125.0,2191.74],[150.0,2587.13],[175.0,2896.99],[200.0,3280.02],[250.0,4046.44],[300.0,4812.39],[350.0,5578.76],[400.0,6344.9],[500.0,7877.15]],"sand":[[0.0,0.0],[0.5,185.61],[1.0,194.59],[1.5,203.48],[2.0,212.16],[2.5,220.88],[3.0,229.55],[3.5,238.08],[4.0,246.55],[4.5,254.93],[5.0,263.19],[5.5,271.93],[6.0,280.05],[6.5,288.51],[7.0,296.77],[7.5,304.99],[8.0,313.21],[8.5,321.31],[9.0,329.43],[9.5,337.3],[10.0,345.15],[11.0,358.73],[12.0,372.03],[13.0,385.07],[14.0,397.93],[15.0,410.55],[20.0,488.73],[25.0,566.86],[30.0,619.56],[35.0,693.47],[40.0,767.42],[45.0,841.3],[50.0,888.61],[60.0,999.3],[70.0,1136.48],[80.0,1273.71],[90.0,1410.85],[100.0,1548.17],[125.0,1791.51],[150.0,2114.7],[175.0,2367.97],[200.0,2681.06],[250.0,3307.53],[300.0,3933.61],[350.0,4560.03],[400.0,5186.27],[500.0,6438.72]],"overmetal":[[0.0,0.0],[0.5,177.88],[1.0,186.49],[1.5,195.0],[2.0,203.32],[2.5,211.68],[3.0,219.98],[3.5,228.16],[4.0,236.28],[4.5,244.31],[5.0,252.22],[5.5,260.6],[6.0,268.39],[6.5,276.49],[7.0,284.41],[7.5,292.28],[8.0,300.16],[8.5,307.92],[9.0,315.71],[9.5,323.25],[10.0,330.77],[11.0,343.78],[12.0,356.53],[13.0,369.03],[14.0,381.35],[15.0,393.44],[20.0,468.37],[25.0,543.24],[30.0,593.74],[35.0,664.58],[40.0,735.44],[45.0,806.24],[50.0,851.59],[60.0,957.66],[70.0,1089.13],[80.0,1220.64],[90.0,1352.06],[100.0,1483.66],[125.0,1716.86],[150.0,2026.59],[175.0,2269.31],[200.0,2569.35],[250.0,3169.72],[300.0,3769.71],[350.0,4370.03],[400.0,4970.18],[500.0,6170.44]],"m20mm":[[0.0,0.0],[0.5,185.61],[1.0,194.59],[1.5,203.48],[2.0,212.16],[2.5,220.88],[3.0,229.55],[3.5,238.08],[4.0,246.55],[4.5,254.93],[5.0,263.19],[5.5,271.93],[6.0,280.05],[6.5,288.51],[7.0,296.77],[7.5,304.99],[8.0,313.21],[8.5,321.31],[9.0,329.43],[9.5,337.3],[10.0,345.15],[11.0,358.73],[12.0,372.03],[13.0,385.07],[14.0,397.93],[15.0,410.55],[20.0,488.73],[25.0,566.86],[30.0,619.56],[35.0,693.47],[40.0,767.42],[45.0,841.3],[50.0,888.61],[60.0,999.3],[70.0,1136.48],[80.0,1273.71],[90.0,1410.85],[100.0,1548.17],[125.0,1791.51],[150.0,2114.7],[175.0,2367.97],[200.0,2681.06],[250.0,3307.53],[300.0,3933.61],[350.0,4560.03],[400.0,5186.27],[500.0,6438.72]],"m12_10":[[0.0,0.0],[0.5,185.61],[1.0,194.59],[1.5,203.48],[2.0,212.16],[2.5,220.88],[3.0,229.55],[3.5,238.08],[4.0,246.55],[4.5,254.93],[5.0,263.19],[5.5,271.93],[6.0,280.05],[6.5,288.51],[7.0,296.77],[7.5,304.99],[8.0,313.21],[8.5,321.31],[9.0,329.43],[9.5,337.3],[10.0,345.15],[11.0,358.73],[12.0,372.03],[13.0,385.07],[14.0,397.93],[15.0,410.55],[20.0,488.73],[25.0,566.86],[30.0,619.56],[35.0,693.47],[40.0,767.42],[45.0,841.3],[50.0,888.61],[60.0,999.3],[70.0,1136.48],[80.0,1273.71],[90.0,1410.85],[100.0,1548.17],[125.0,1791.51],[150.0,2114.7],[175.0,2367.97],[200.0,2681.06],[250.0,3307.53],[300.0,3933.61],[350.0,4560.03],[400.0,5186.27],[500.0,6438.72]],"scr_sand":[[0.0,0.0],[0.5,185.61],[1.0,194.59],[1.5,203.48],[2.0,212.16],[2.5,220.88],[3.0,229.55],[3.5,238.08],[4.0,246.55],[4.5,254.93],[5.0,263.19],[5.5,271.93],[6.0,280.05],[6.5,288.51],[7.0,296.77],[7.5,304.99],[8.0,313.21],[8.5,321.31],[9.0,329.43],[9.5,337.3],[10.0,345.15],[11.0,358.73],[12.0,372.03],[13.0,385.07],[14.0,397.93],[15.0,410.55],[20.0,488.73],[25.0,566.86],[30.0,619.56],[35.0,693.47],[40.0,767.42],[45.0,841.3],[50.0,888.61],[60.0,999.3],[70.0,1136.48],[80.0,1273.71],[90.0,1410.85],[100.0,1548.17],[125.0,1791.51],[150.0,2114.7],[175.0,2367.97],[200.0,2681.06],[250.0,3307.53],[300.0,3933.61],[350.0,4560.03],[400.0,5186.27],[500.0,6438.72]],"m40mm":[[0.0,0.0],[0.5,177.88],[1.0,186.49],[1.5,195.0],[2.0,203.32],[2.5,211.68],[3.0,219.98],[3.5,228.16],[4.0,236.28],[4.5,244.31],[5.0,252.22],[5.5,260.6],[6.0,268.39],[6.5,276.49],[7.0,284.41],[7.5,292.28],[8.0,300.16],[8.5,307.92],[9.0,315.71],[9.5,323.25],[10.0,330.77],[11.0,343.78],[12.0,356.53],[13.0,369.03],[14.0,381.35],[15.0,393.44],[20.0,468.37],[25.0,543.24],[30.0,593.74],[35.0,664.58],[40.0,735.44],[45.0,806.24],[50.0,851.59],[60.0,957.66],[70.0,1089.13],[80.0,1220.64],[90.0,1352.06],[100.0,1483.66],[125.0,1716.86],[150.0,2026.59],[175.0,2269.31],[200.0,2569.35],[250.0,3169.72],[300.0,3769.71],[350.0,4370.03],[400.0,4970.18],[500.0,6170.44]]};
const LCD=[
  {"name":"Sand (Natural)","unit":"Cu.M.","defKm":0,"defRate":0,"matKeys":["sand"],"llKey":"sand"},
  {"name":"Screened / Crushed Sand","unit":"Cu.M.","defKm":0,"defRate":0,"matKeys":["scr_sand"],"llKey":"sand"},
  {"name":"Metal 20mm","unit":"Cu.M.","defKm":0,"defRate":0,"matKeys":["m20mm"],"llKey":"sand"},
  {"name":"Metal 12-10mm","unit":"Cu.M.","defKm":0,"defRate":0,"matKeys":["m12_10"],"llKey":"sand"},
  {"name":"Metal 40mm (CB)","unit":"Cu.M.","defKm":0,"defRate":0,"matKeys":["m40mm"],"llKey":"overmetal"},
  {"name":"Oversize Metal 80mm","unit":"Cu.M.","defKm":0,"defRate":0,"matKeys":["overmetal"],"llKey":"overmetal"},
  {"name":"Quarry / Soling Stone","unit":"Cu.M.","defKm":0,"defRate":0,"matKeys":["quarry"],"llKey":"quarry"},
  {"name":"Rubble / Murrum / Earth","unit":"Cu.M.","defKm":0,"defRate":0,"matKeys":["rubble"],"llKey":"rubble"},
  {"name":"Cement (Bags)","unit":"MT","defKm":0,"defRate":0,"matKeys":["cement_bags"],"llKey":"cement_bags"},
  {"name":"Bricks","unit":"Per 1000 Nos.","defKm":0,"defRate":0,"matKeys":["bricks"],"llKey":"bricks"},
  {"name":"Steel MS / TMT","unit":"MT","defKm":0,"defRate":0,"matKeys":["ms_bars"],"llKey":"ms_bars"},
  {"name":"Bitumen (VG-30)","unit":"MT per Cum","defKm":0,"defRate":0,"matKeys":["bitumen"],"llKey":"bitumen","isBitumen":true},
  {"name":"Manure / Sludge","unit":"Cu.M.","defKm":0,"defRate":0,"matKeys":[],"llKey":"manure"},
  {"name":"ConcreteBlock (FORM)","unit":"Cu.M.","defKm":0,"defRate":0,"matKeys":[],"llKey":"concrete_block"},
  {"name":"Tiles (Half Round/Roofing)","unit":"Cu.M.","defKm":0,"defRate":0,"matKeys":[],"llKey":"tiles_hr"},
  {"name":"Flooring Tiles Ceramic","unit":"Sq.M.","defKm":0,"defRate":0,"matKeys":[],"llKey":"flooring"},
  {"name":"GI Sheet","unit":"MT","defKm":0,"defRate":0,"matKeys":[],"llKey":"gi_sheet"},
  {"name":"Lime Stone Block / GI Pipe / AC Sheet","unit":"MT","defKm":0,"defRate":0,"matKeys":[],"llKey":"cement_bags"}
];


// CF_MAP → see cf_data.js

/* ── VERIFY DATA ─────────────────────────────────────────────────────── */
if(!Array.isArray(LCD))LCD=[];/* LCD empty OK */
if(!Array.isArray(SSR)||!SSR.length)throw new Error('SSR missing');

/* ── LOOKUP INTERPOLATION (non-linear, from Excel Factor sheets) ─────── */
function lkup(mat,km){
  var tbl=LL[mat];
  if(!tbl||!tbl.length||km<=0)return 0;
  var lo=null,hi=null,i,p;
  for(i=0;i<tbl.length;i++){
    p=tbl[i];
    if(p[0]<=km)lo=p;
    if(p[0]>=km&&hi===null)hi=p;
  }
  if(!lo)return hi?hi[1]:0;
  if(!hi||lo[0]===hi[0])return lo[1];
  var t=(km-lo[0])/(hi[0]-lo[0]);
  return lo[1]+t*(hi[1]-lo[1]);
}

/* ── LEAD_KM: one km per material key ───────────────────────────────── */
var LEAD_KM={};
var LEAD_LOC={};
(function(){
  var i,j,row;
  for(i=0;i<LCD.length;i++){
    row=LCD[i];
    if(!row.matKeys||!Array.isArray(row.matKeys))continue;
    for(j=0;j<row.matKeys.length;j++)LEAD_KM[row.matKeys[j]]=0;
  }
  for(var k in LR){if(!(k in LEAD_KM))LEAD_KM[k]=0;}
})();

var items=[],selSSR=null,mrCount=0,stm=null;
function R(id){return document.getElementById(id);}
function pf(id){return parseFloat((R(id)||{}).value)||0;}
function pfD(id,def){var el=R(id);if(!el||el.value===''||el.value===null)return def;var v=parseFloat(el.value);return isNaN(v)?def:v;}
function se(id,v){var e=R(id);if(e)e.textContent=v;}
function gS(){
  getBitChange();
  var areaSel=R('sAreaType');
  var areaPct=areaSel?parseFloat(areaSel.value)||0:0;
  var areaLbl=areaSel&&areaSel.options[areaSel.selectedIndex]?
    (areaSel.options[areaSel.selectedIndex].getAttribute('data-label')||''):'' ;
  var el=R('sAreaPct');if(el)el.textContent=areaPct>0?(areaPct+'%'):'0%';
  return{gst:pf('sGST')||18,cont:pfD('sCont',2),li:pfD('sLI',1),
    royS:pfD('sRS',237.37),royC:pfD('sRC',216.18),
    bitSSR:pf('sBitSSR')||46500,bitCur:pf('sBitCur')||46500,
    areaPct:areaPct,areaLbl:areaLbl,
    extraRows:(typeof EXTRA_ROWS!=='undefined'?EXTRA_ROWS:[])};
}
/* ── EXTRA % ROWS ──────────────────────────────────────────── */
var EXTRA_ROWS=[];
function addExtraRow(lbl,pct){
  EXTRA_ROWS.push({lbl:lbl||'',pct:pct||0});
  renderExtraRows();
  updateAll();
}
function removeExtraRow(i){
  EXTRA_ROWS.splice(i,1);
  renderExtraRows();
  updateAll();
}
function _escER(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function renderExtraRows(){
  var el=R('extraRowsList');if(!el)return;
  if(!EXTRA_ROWS.length){el.innerHTML='<div style="font-size:.58rem;color:#aaa;padding:.2rem 0">No extra rows. Click + Add above.</div>';return;}
  var h='';
  for(var _i=0;_i<EXTRA_ROWS.length;_i++){
    var r=EXTRA_ROWS[_i];
    h+='<div style="display:flex;align-items:center;gap:.3rem;margin-bottom:.3rem;background:#f8f6f2;border-radius:4px;padding:.2rem .4rem">'
      +'<input type="text" value="'+_escER(r.lbl||'')+'" placeholder="Label (e.g. Electrification)" oninput="EXTRA_ROWS['+_i+'].lbl=this.value;updateAll()" style="flex:1;border:1px solid #ddd;border-radius:3px;padding:.2rem .3rem;font-size:.62rem">'
      +'<input type="number" value="'+(r.pct||0)+'" min="0" max="100" step="0.5" oninput="EXTRA_ROWS['+_i+'].pct=parseFloat(this.value)||0;updateAll()" style="width:55px;border:1px solid #ddd;border-radius:3px;padding:.2rem .3rem;font-size:.62rem;text-align:right">'
      +'<span style="font-size:.6rem">%</span>'
      +'<button onclick="removeExtraRow('+_i+')" style="background:#c62828;color:#fff;border:none;border-radius:3px;padding:.15rem .35rem;font-size:.6rem;cursor:pointer">✕</button>'
      +'</div>';
  }
  el.innerHTML=h;
}

function fmt(n){
  if(!n&&n!==0)return'0';
  return new Intl.NumberFormat('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Math.round(n*100)/100);
}
function fmtW(n){
  if(!n&&n!==0)return'0';
  return new Intl.NumberFormat('en-IN',{minimumFractionDigits:0,maximumFractionDigits:0}).format(Math.round(n));
}
function fmtL(n){
  if(!n&&n!==0)return'0';
  return(n/100000).toFixed(2)+' L';
}

/* ── LEAD CHART TABLE ────────────────────────────────────────────────── */
function onLocChange(idx){
  console.log("onLocChange called with idx="+idx);
  if(!LCD[idx])return;
  /* Use row index as key so each row has independent location */
  var locKey='row_'+idx;
  var locEl=R('lloc_'+idx);
  if(locEl){
    LEAD_LOC[locKey]=locEl.value||'';
    console.log("Saved LEAD_LOC["+locKey+"]="+locEl.value);
    var printEl=R('llocp_'+idx);
    if(printEl)printEl.textContent=locEl.value||'';
  }
  autoSaveDraft();
}

function buildLCT(){
  var tb=R('lctBody');if(!tb)return;
  var h='',i,row;
  for(i=0;i<LCD.length;i++){
    row=LCD[i];
    h+='<tr class="lc-row-zero" id="lcrow_'+i+'">'
      +'<td style="padding:.3rem .4rem;font-size:.63rem">'+(row.name||'')+'</td>'
      +'<td class="r" style="padding:.3rem .4rem;white-space:nowrap;font-size:.62rem">'+(row.unit||'')+'</td>'
      +'<td class="r" style="padding:.3rem .4rem">'
        +'<input class="km-in noprt" type="number" id="lkm_'+i+'" value="0" min="0" step="0.5" '
        +'style="width:72px;padding:.25rem;text-align:right;border:1px solid #ccc;border-radius:3px">'
        +'<span class="prtonly" id="lkmp_'+i+'" style="font-weight:600"></span>'
      +'</td>'
      +'<td style="padding:.3rem .4rem">'
        +'<input class="noprt" type="text" id="lloc_'+i+'" placeholder="Location" '
        +'style="width:130px;padding:.25rem;font-size:.6rem;border:1px solid #ccc;border-radius:3px">'
        +'<span class="prtonly" id="llocp_'+i+'"></span>'
      +'</td>'
      +'<td class="r" style="padding:.3rem .4rem">'
        +'<span class="chg-val" id="lchg_'+i+'">0.000</span>'
      +'</td>'
    +'</tr>';
  }
  tb.innerHTML=h;
  for(i=0;i<LCD.length;i++){
    (function(idx){
      var kmEl=R('lkm_'+idx),locEl=R('lloc_'+idx);
      var key=LCD[idx]?LCD[idx].llKey:'';
      if(kmEl){
        if(LEAD_KM[key]){kmEl.value=LEAD_KM[key];onKmChange(idx);}
        kmEl.oninput=function(){onKmChange(idx);};
      }
      if(locEl){
        /* Restore using row index key (independent per row) */
        var locKey='row_'+idx;
        if(typeof LEAD_LOC!=='undefined'&&LEAD_LOC[locKey])locEl.value=LEAD_LOC[locKey];
        locEl.oninput=function(){onLocChange(idx);};
      }
      var km2=parseFloat((kmEl||{}).value)||0,row2=LCD[idx];
      var chg2=row2.isBitumen?(km2*10):(row2.llKey?lkup(row2.llKey,km2):0);
      var chgEl=R('lchg_'+idx);if(chgEl)chgEl.textContent=(Math.round(chg2*1000)/1000).toFixed(3);
      var rowEl=R('lcrow_'+idx);if(rowEl)rowEl.className=km2>0?'':'lc-row-zero';
    })(i);
  }
}
function onKmChange(ri){
  console.log("onKmChange called with ri="+ri);
  var row=LCD[ri];if(!row)return;
  var km=parseFloat((R('lkm_'+ri)||{}).value)||0,j;
  /* Save to LEAD_KM using row.key for Lead Diagram */
  LEAD_KM[row.llKey]=km;
  console.log("Saved LEAD_KM["+row.llKey+"]="+km);
  autoSaveDraft();
  /* Update LEAD_KM for rows that map to material keys */
  if(row.matKeys&&row.matKeys.length){
    for(j=0;j<row.matKeys.length;j++)LEAD_KM[row.matKeys[j]]=km;
  }
  /* Show charge via LL lookup using llKey - Bitumen uses flat 10 Rs/km */
  var chg;
  if(row.isBitumen){
    chg=km*10; /* Bitumen: 10 Rs per km */
  } else {
    chg=row.llKey?lkup(row.llKey,km):0;
  }
  var el=R('lchg_'+ri);
  if(el)el.textContent=(Math.round(chg*1000)/1000).toFixed(3);
  /* Update print span with km value */
  var kpEl=R('lkmp_'+ri);
  if(kpEl)kpEl.textContent=km>0?km.toFixed(1):'';
  /* Show/hide row in print based on km */
  var rowEl=R('lcrow_'+ri);
  if(rowEl)rowEl.className=km>0?'':'lc-row-zero';
  /* Recalculate all items via updateAll */
  updateAll();
}

/* ── LEAD CALCULATION (LL lookup, non-linear) ────────────────────────── */
function getBitChange(){
  var ssrR=parseFloat((document.getElementById('sBitSSR')||{}).value)||46500;
  var curR=parseFloat((document.getElementById('sBitCur')||{}).value)||46500;
  var chg=curR-ssrR;
  var el=document.getElementById('sBitChange');
  if(el)el.textContent=(chg>=0?'+':'')+Math.round(chg*100)/100;
  return chg;
}
/* ── CF TABLE TAB ────────────────────────────────────────────────────── */
/* CF table mats list - same order as columns */
var CF_MATS=['rubble','overmetal','sand','scr_sand','cement_bags','m40mm','m20mm','m12_10','quarry','bricks','ms_bars','bitumen','tiles_hr','flooring','gi_sheet'];
var CF_MAT_LABELS=['Rubble','Overmetal','Sand','Scr.Sand','Cement','M40mm','M20mm','M12mm','Quarry','Bricks','Steel','Bitumen','Tiles HR','Flooring','GI Sheet'];

/* Get description from SSR for an item number */
function getCFDesc(no){
  var i,n=String(parseFloat(no));
  for(i=0;i<SSR.length;i++){if(SSR[i][0]===no||SSR[i][0]===n)return SSR[i][1].substring(0,60)+'...';}
  return '(Manual entry)';
}

/* Render CF Edit Table - reads current CF_MAP */
function rCFTab(){
  if(typeof SSR==='undefined'||!SSR||!SSR.length)return;
  var tb=R('cfEditBody');if(!tb)return;
  var q=((R('cfSrchQ')||{}).value||'').trim().toLowerCase();
  var onlySet=!!(R('cfOnlySet')&&R('cfOnlySet').checked);
  var mats=CF_MATS;
  var h='';var shown=0;
  for(var si=0;si<SSR.length;si++){
    var d=SSR[si];
    var no=d[0],desc=(d[1]||'');
    var cf=CF_MAP[no]||{};
    var hasCF=Object.keys(cf).some(function(k){return cf[k]>0;});
    if(onlySet&&!hasCF)continue;
    if(q){
      var hay=(no+' '+desc).toLowerCase();
      var words=q.split(/\s+/);
      if(!words.every(function(w){return hay.indexOf(w)!==-1;}))continue;
    }
    shown++;
    h+='<tr style="border-bottom:1px solid #eee;background:'+(shown%2?'#fafaf8':'#fff')+'">';
    h+='<td style="padding:.22rem .35rem;font-weight:700;color:#1565c0;white-space:nowrap">'+esc(no)+'</td>';
    h+='<td style="padding:.22rem .35rem;font-size:.59rem;line-height:1.35;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+esc(desc)+'">'+esc(desc.substring(0,70))+'</td>';
    mats.forEach(function(m){
      var v=cf[m]||0;
      h+='<td style="padding:.18rem .25rem;text-align:center">';
      h+='<input type="number" step="0.001" min="0" value="'+(v>0?v:'')+'" ';
      h+='data-no="'+esc(no)+'" data-mat="'+m+'" onchange="cfCellChange(this)" placeholder="0" ';
      h+='style="width:58px;padding:.12rem .18rem;font-size:.59rem;border:1px solid '+(v>0?'#4caf50':'#ddd')+';border-radius:2px;text-align:right;background:'+(v>0?'#f1f8e9':'#fff')+'">';
      h+='</td>';
    });
    h+='<td style="padding:.18rem .25rem;text-align:center">';
    h+='<button onclick="cfDelRow(\''+esc(no)+'\')" style="font-size:.58rem;padding:.12rem .3rem;background:#dc3545;color:#fff;border:none;border-radius:2px;cursor:pointer">✕</button>';
    h+='</td></tr>';
  }
  tb.innerHTML=h||'<tr><td colspan="15" style="text-align:center;padding:1.5rem;color:#aaa">No items found</td></tr>';
  var cnt=R('cfTabCount');if(cnt)cnt.textContent=shown+' / '+SSR.length+' items';
}
function cfCellChange(inp){
  var no=inp.getAttribute('data-no');
  var mat=inp.getAttribute('data-mat');
  var val=parseFloat(inp.value)||0;
  if(!no||!mat)return;
  if(!CF_MAP[no])CF_MAP[no]={};
  if(val>0){CF_MAP[no][mat]=val;}else{delete CF_MAP[no][mat];}
  if(CF_MAP[no]&&!Object.keys(CF_MAP[no]).length)delete CF_MAP[no];
  inp.style.border='1px solid '+(val>0?'#4caf50':'#ddd');
  inp.style.background=val>0?'#f1f8e9':'#fff';
  inp.style.outline='2px solid #ff6f00';
  setTimeout(function(){inp.style.outline='';},600);
}
function cfDelRow(no){
  delete CF_MAP[no];
  document.querySelectorAll('#cfEditBody input[data-no="'+no+'"]').forEach(function(inp){
    inp.value='';inp.style.border='1px solid #ddd';inp.style.background='#fff';
  });
  showToast('CF cleared: '+no,'success');
}
function updateCFMAP(no,mat,val){
  if(!CF_MAP[no])CF_MAP[no]={};
  var v=parseFloat(val)||0;
  if(v>0)CF_MAP[no][mat]=v;
  else delete CF_MAP[no][mat];
  /* If all materials removed, keep empty object */
}

/* Delete a CF row */
function deleteCFRow(no){
  if(!confirm('Delete CF for item '+no+'?'))return;
  delete CF_MAP[no];
  rCFTab();
}

/* Add new CF row */
function addCFRow(){
  var no=prompt('Item number enter kara (e.g. 3.18, 24.01):','');
  if(!no)return;
  no=no.trim();
  if(!no){alert('Item number is empty.');return;}
  if(CF_MAP[no]){alert('Item '+no+' already exists. Please edit it in the table.');return;}
  CF_MAP[no]={};
  rCFTab();
  /* Scroll to new row */
  var el=R('cfrow_'+no);
  if(el)el.scrollIntoView({behavior:'smooth',block:'center'});
}

/* Reset CF to original defaults */
function resetCFtoDefaults(){
  if(!confirm('Reset all CF values to defaults? This cannot be undone.'))return;
  /* Restore from hardcoded defaults */
  var DEFAULTS={
    "21.37":{rubble:1.8,quarry:0.36},
    "24.01":{cement_bags:0.76,scr_sand:0.11,m40mm:0.16,m20mm:0.05},
    "25.11":{cement_bags:4.2,scr_sand:0.26,m20mm:0.34,m12_10:0.17},
    "25.31":{cement_bags:11.45,scr_sand:0.7,m20mm:0.93,m12_10:0.46},
    "25.5":{cement_bags:13.23,scr_sand:0.8,m20mm:1.08,m12_10:0.53},
    "25.7":{cement_bags:9.45,scr_sand:0.57,m20mm:0.77,m12_10:0.38},
    "26.33":{ms_bars:0.91},
    "27.01":{cement_bags:14.17,scr_sand:2.87,bricks:4260.75},
    "32.01":{cement_bags:0.01},
    "32.12":{cement_bags:0.12,scr_sand:0.01,m20mm:0.01},
    "33.04":{cement_bags:1.22,scr_sand:0.2},
    "3.18":{overmetal:0.27},
    "3.19":{overmetal:0.24},
    "3.2":{overmetal:0.24},
    "3.4":{bitumen:0.056},
    "3.42":{bitumen:0.056},
    "3.44":{bitumen:0.062},
    "3.46":{bitumen:0.062},
    "3.48":{bitumen:0.074},
    "3.5":{bitumen:0.074}
  };
  /* Deep copy */
  for(var k in CF_MAP)delete CF_MAP[k];
  for(var k2 in DEFAULTS)CF_MAP[k2]=JSON.parse(JSON.stringify(DEFAULTS[k2]));
  rCFTab();
  updateAll();
  alert('CF defaults restored successfully.');
}

/* Save CF to HTML and download - CF permanently embedded */

function aSaveSSRCloud(){
  if(!window.firebase||!firebase.firestore){showToast("Firebase not ready","error");return;}
  if(!CU||CU.email!==ADMIN_EMAIL){showToast("Admin only","error");return;}
  /* SSR is large - store as array of arrays */
  var ssrData=SSR.map(function(d){return[d[0],d[1],d[2],d[3]];});
  showToast("Saving SSR to cloud...","info");
  /* Split into chunks of 500 to avoid Firestore 1MB limit */
  var chunkSize=500;
  var chunks=[];
  for(var i=0;i<ssrData.length;i+=chunkSize)chunks.push(ssrData.slice(i,i+chunkSize));
  var batch=firebase.firestore().batch();
  /* Delete old chunks first, then write new */
  var ref=firebase.firestore().collection("config");
  ref.doc("ssr_meta").set({chunks:chunks.length,total:ssrData.length,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
  var promises=chunks.map(function(chunk,ci){
    return ref.doc("ssr_chunk_"+ci).set({data:chunk,chunk:ci});
  });
  Promise.all(promises).then(function(){
    showToast("SSR cloud vr save zala! ("+ssrData.length+" items, "+chunks.length+" chunks)","success");
  }).catch(function(e){showToast("SSR save error: "+e.message,"error");});
}

function aSaveLeadCloud(){
  if(!window.firebase||!firebase.firestore){showToast("Firebase not ready","error");return;}
  if(!CU||CU.email!==ADMIN_EMAIL){showToast("Admin only","error");return;}
  /* Save full LL table to Firestore */
  var llData={};
  for(var k in LL){if(Array.isArray(LL[k]))llData[k]=LL[k];}
  showToast("Saving Lead Chart to cloud...","info");
  firebase.firestore().collection("config").doc("lead_ll").set({
    ll:llData,
    updatedAt:firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy:CU.email
  }).then(function(){
    showToast("Lead Chart cloud vr save zala! Saglya users la next load la nava rates milel.","success");
  }).catch(function(e){showToast("Lead save error: "+e.message,"error");});
}

function switchD(id){
  document.querySelectorAll('#p16 .doc-tab').forEach(function(t,i){
    var ids=['ts','note','nh','jp','hp','wo','sg','nd','an'];
    t.classList.toggle('on',ids[i]===id);
  });
  document.querySelectorAll('#p16 .doc-sec').forEach(function(s){
    s.classList.toggle('on',s.id==='d-'+id);
  });
}
function doPrint16(){
  var a=document.querySelector('#p16 .doc-sec.on');
  if(!a)return;
  var clone=a.cloneNode(true);
  var oi=a.querySelectorAll('input,textarea');
  var ci=clone.querySelectorAll('input,textarea');
  for(var _i=0;_i<oi.length;_i++){if(ci[_i])ci[_i].setAttribute('value',oi[_i].value);}
  clone.querySelectorAll('.del-btn,.noprt').forEach(function(el){el.remove();});
  var win=window.open('','_blank');
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>');
  win.document.write(clone.outerHTML);
  win.document.write('</body></html>');
  win.document.close();
  win.onload=function(){setTimeout(function(){win.print();},400);};
}
function printSB(){
  var a=document.getElementById('sb_content');
  if(!a){showToast('Please open Schedule-B tab and try again','warn');return;}
  var clone=a.cloneNode(true);
  // Copy input/textarea values into clone
  var oi=a.querySelectorAll('input,textarea');
  var ci=clone.querySelectorAll('input,textarea');
  for(var _i=0;_i<oi.length;_i++){
    if(ci[_i]){
      if(oi[_i].tagName==='TEXTAREA')ci[_i].textContent=oi[_i].value;
      else ci[_i].setAttribute('value',oi[_i].value);
    }
  }
  // Remove screen-only elements
  clone.querySelectorAll('.noprt,.sb-add-btn,.sb-prt-btn,.stamp-sel-box,.pg-sep,.pg-sep-lbl').forEach(function(el){el.remove();});
  var win=window.open('','_blank');
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>');
  win.document.write(clone.outerHTML);
  win.document.write('</body></html>');
  win.document.close();
  win.onload=function(){setTimeout(function(){win.print();},400);};
}
/* ── SCHEDULE A ─────────────────────────────────── */
function fillScheduleA(){
  var wk=(window.R?R('pName'):document.getElementById('pName'));
  var wkName=wk?wk.value:'';
  var w=document.getElementById('sa_work');if(w&&!w.value)w.value=wkName;
  // Sync div/subdiv from SB
  var sbDiv=document.getElementById('sb_div');var sbSub=document.getElementById('sb_subdiv');
  var saDiv=document.getElementById('sa_div');var saSub=document.getElementById('sa_subdiv');
  if(saDiv&&!saDiv.value&&sbDiv)saDiv.value=sbDiv.value;
  if(saSub&&!saSub.value&&sbSub)saSub.value=sbSub.value;
  // Sync sign span
  var sp=document.getElementById('sa_div_sign');
  if(sp&&saDiv)sp.textContent=saDiv.value;
}
function saAddRow(){
  var tb=document.getElementById('sa_tbody');if(!tb)return;
  var IS='border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none;cursor:text;padding:0;width:100%';
  var tr=document.createElement('tr');
  tr.innerHTML='<td style="text-align:center;vertical-align:top;padding:.2rem;border:1px solid #ddd"><input style="'+IS+';text-align:center;width:28px" placeholder="#"></td>'
    +'<td style="vertical-align:top;padding:.2rem;border:1px solid #ddd"><textarea style="'+IS+';resize:none;overflow:hidden;min-height:1.5em;line-height:1.4;display:block" oninput="autoH(this)" placeholder="Particulars..."></textarea></td>'
    +'<td style="text-align:center;vertical-align:top;padding:.2rem;border:1px solid #ddd"><input style="'+IS+';text-align:center" placeholder=""></td>'
    +'<td style="text-align:center;vertical-align:top;padding:.2rem;border:1px solid #ddd"><input style="'+IS+';text-align:center" placeholder=""></td>'
    +'<td style="text-align:right;vertical-align:top;padding:.2rem;border:1px solid #ddd"><input style="'+IS+';text-align:right" placeholder=""></td>'
    +'<td style="vertical-align:top;padding:.2rem;border:1px solid #ddd"><input style="'+IS+'" placeholder=""></td>'
    +'<td style="vertical-align:top;padding:.2rem;border:1px solid #ddd"><input style="'+IS+'" placeholder=""></td>'
    +'<td class="noprt" style="text-align:center;vertical-align:top;padding:.2rem"><button onclick="this.closest(\'tr\').remove()" style="font-size:.6rem;padding:.1rem .3rem;background:#c62828;color:#fff;border:none;border-radius:3px;cursor:pointer">✕</button></td>';
  tb.appendChild(tr);
}
function saDelRow(btn){
  var tr=btn.closest('tr');if(tr)tr.remove();
  var tbody=document.getElementById('sa_tbody');
  if(!tbody)return;
  var rows=tbody.querySelectorAll('tr');
  if(!rows.length)saSetNIL();
  else rows.forEach(function(r,i){var inp=r.querySelector('td:first-child input');if(inp)inp.value=i+1;});
}
function saSetNIL(){
  var tbody=document.getElementById('sa_tbody');if(!tbody)return;
  tbody.innerHTML='<tr><td style="text-align:center;font-style:italic;color:#888" colspan="7">NIL</td><td class="noprt"></td></tr>';
}
function printSA(){
  var a=document.getElementById('sa_content');
  if(!a){showToast('Please open Schedule-A tab','warn');return;}
  var clone=a.cloneNode(true);
  var oi=a.querySelectorAll('input,textarea');var ci=clone.querySelectorAll('input,textarea');
  for(var _i=0;_i<oi.length;_i++){if(ci[_i]){if(oi[_i].tagName==='TEXTAREA')ci[_i].textContent=oi[_i].value;else ci[_i].setAttribute('value',oi[_i].value);}}
  clone.querySelectorAll('.noprt,.sa-add-btn,.sa-del-btn,.sa-prt-btn').forEach(function(el){el.remove();});
  var win=window.open('','_blank');
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>');
  win.document.write(clone.outerHTML);
  win.document.write('</body></html>');
  win.document.close();
  win.onload=function(){setTimeout(function(){win.print();},400);};
}
function tsAdd(){
  var list=document.getElementById('ts_ati_list');
  var rows=list.querySelectorAll('.ts-row');
  var nums=['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15'];
  var n=(nums[rows.length]||(rows.length+1))+'.';
  var d=document.createElement('div');d.className='ts-row';
  d.style.cssText='display:flex;align-items:baseline;gap:.3rem;margin-bottom:.2rem';
  d.innerHTML='<span class="ts-num" style="font-weight:700;min-width:22px;flex-shrink:0">'+n+'</span><input class="dati-inp" placeholder="New condition..."><span class="del-btn noprt" onclick="tsDel(this)" style="cursor:pointer;color:#c00;font-size:.85rem;padding:0 .3rem;flex-shrink:0">✕</span>';
  list.appendChild(d);
}
function tsDel(btn){btn.parentElement.remove();tsRenum();}
function tsRenum(){var nums=['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15'];document.querySelectorAll('#ts_ati_list .ts-row').forEach(function(r,i){var s=r.querySelector('.ts-num');if(s)s.textContent=(nums[i]||(i+1))+'.';})}
function niAdd(){
  var list=document.getElementById('ni_list');
  var rows=list.querySelectorAll('.ni-row');
  var nums=['1','2','3','4','5','6','7','8','9','10'];
  var n=nums[rows.length]||(rows.length+1);
  var d=document.createElement('div');d.className='ni-row';
  d.style.cssText='display:flex;align-items:baseline;gap:.3rem;margin-bottom:.15rem';
  d.innerHTML='<span class="ni-num" style="min-width:18px;font-weight:700;flex-shrink:0">'+n+'</span><input class="dati-inp" placeholder="New item..."><span class="del-btn noprt" onclick="niDel(this)" style="cursor:pointer;color:#c00;font-size:.85rem;padding:0 .3rem;flex-shrink:0">✕</span>';
  list.appendChild(d);
}
function niDel(btn){btn.parentElement.remove();niRenum();}
function niRenum(){var nums=['1','2','3','4','5','6','7','8','9','10'];document.querySelectorAll('#ni_list .ni-row').forEach(function(r,i){var s=r.querySelector('.ni-num');if(s)s.textContent=nums[i]||(i+1);})}
function sbAddA(){
  var tbody=document.getElementById('sb_tbody');
  var ref=document.getElementById('sb_tot_a');
  var tr=document.createElement('tr');
  tr.innerHTML='<td><input style="width:100%;cursor:text"></td><td><input style="width:100%;cursor:text"></td><td><input style="width:100%;cursor:text"></td><td><input style="width:100%;text-align:right;cursor:text"></td><td><input style="width:100%;cursor:text"></td><td><input style="width:100%;text-align:right;cursor:text"></td><td><input style="width:100%;cursor:text"></td><td><input style="width:100%;cursor:text"></td><td><input style="width:100%;text-align:right;cursor:text"></td>';
  tbody.insertBefore(tr,ref);
}
function sbAddB(){
  var tbody=document.getElementById('sb_tbody');
  var ref=document.getElementById('sb_tot_b');
  var tr=document.createElement('tr');
  tr.innerHTML='<td><input style="width:100%;cursor:text"></td><td><input style="width:100%;cursor:text"></td><td><input style="width:100%;cursor:text"></td><td><input style="width:100%;text-align:right;cursor:text"></td><td><input style="width:100%;cursor:text"></td><td><input style="width:100%;text-align:right;cursor:text"></td><td><input style="width:100%;cursor:text"></td><td><input style="width:100%;cursor:text"></td><td><input style="width:100%;text-align:right;cursor:text"></td>';
  tbody.insertBefore(tr,ref);
}
/* ── HELPERS ─────────────────────────────────────── */
function autoH(ta){ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';}
function sbDelNote(btn){
  var row=btn.closest('.note-row');
  if(!row)return;
  var list=row.parentElement;
  row.remove();
  // Renumber
  var rows=list.querySelectorAll('.note-row');
  rows.forEach(function(r,i){var n=r.querySelector('.note-num');if(n)n.textContent=(i+1)+')';});
}
function sbAddNote(listId){
  var list=document.getElementById(listId);
  if(!list)return;
  var rows=list.querySelectorAll('.note-row');
  var num=rows.length+1;
  var d=document.createElement('div');
  d.className='note-row';
  d.innerHTML='<span class="note-num">'+num+')</span>'
    +'<textarea class="note-txt" rows="1" oninput="autoH(this)" placeholder="Write a note..."></textarea>'
    +'<button class="note-del noprt" onclick="sbDelNote(this)">✕</button>';
  list.appendChild(d);
  setTimeout(function(){d.querySelector('textarea').focus();},50);
}
function sbToggleStamp(){
  var p1=document.getElementById('sb_stamp_p1');
  var p2=document.getElementById('sb_stamp_p2');
  // Page 1 stamp: sign block at bottom of page1
  var sp1=document.querySelector('#sb_page1 .stamp-page1-sign');
  if(sp1)sp1.style.display=(p1&&p1.checked)?'':'none';
  // Page 2 stamp
  var sp2=document.getElementById('sb_p2_stamp_block');
  if(sp2)sp2.style.display=(p2&&p2.checked)?'flex':'none';
}
function scToggleStamp(){
  var p2=document.getElementById('sc_p2_stamp_block');
  var ck2=document.getElementById('sc_stamp_p2');
  if(p2)p2.style.display=(ck2&&ck2.checked)?'flex':'none';
}
function sbSyncDivNames(){
  var div=document.getElementById('sb_div');
  var sub=document.getElementById('sb_subdiv');
  var dv=div?div.value:'';var sv=sub?sub.value:'';
  var el;
  el=document.getElementById('sb_div_sign1');if(el)el.textContent=dv;
  el=document.getElementById('sb_div_sign2');if(el)el.textContent=dv;
  el=document.getElementById('sb_subdiv_sign1');if(el)el.textContent=sv;
}
/* ── SCHEDULE C ─────────────────────────────────── */
function fillScheduleC(force){
  var tbody=document.getElementById('sc_tbody');if(!tbody)return;
  var G=function(id){return document.getElementById(id);};
  var wkName=G('pName')?G('pName').value:'';
  var w1=G('sc_work_p1');var w2=G('sc_work');
  if(w1&&!w1.value)w1.value=wkName;if(w2&&!w2.value)w2.value=wkName;
  var sbDiv=G('sb_div');var sbSub=G('sb_subdiv');
  var scDiv=G('sc_div');var scSub=G('sc_subdiv');
  if(scDiv&&!scDiv.value&&sbDiv)scDiv.value=sbDiv.value;
  if(scSub&&!scSub.value&&sbSub)scSub.value=sbSub.value;
  if(!force&&tbody.querySelectorAll('tr').length>0)return;
  if(!items||!items.length){scAddRow();return;}
  function getSpec(it){
    if(it.spec&&it.spec.trim())return it.spec.trim();
    if(typeof SSR!=='undefined'){var no=String(it.no||'').trim();for(var si=0;si<SSR.length;si++){if(String(SSR[si][0]).trim()===no&&SSR[si][4])return SSR[si][4];}}
    return '';
  }
  function parseSpec(spec){
    spec=(spec||'').trim();var ref='',pg='',add='';
    if(!spec||/^[-\s]+$/.test(spec)){return[ref,pg,spec.replace(/^[-\s]+/,'').trim()];}
    var m1=spec.match(/^([A-Za-z][A-Za-z0-9.\-\/]+)\s+Page\s+(?:One\s+)?(?:Number|No\.?)\s*(\d+)/i);
    if(m1){ref=m1[1];pg=m1[2];add=spec.slice(m1[0].length).trim().replace(/^[,\s]+/,'').trim();return[ref,pg,add];}
    var m2=spec.match(/^([A-Za-z][A-Za-z0-9.\-\/]+)\s+(\d+(?:-\d+)?)/);
    if(m2){ref=m2[1];pg=m2[2];add=spec.slice(m2[0].length).trim();return[ref,pg,add];}
    add=spec;return[ref,pg,add];
  }
  var _ss='1. With additional specification for controlled concrete.\n2. If artificai/ VSI crushed sand is used instead of natural sand; terms, conditions and specifications mentioned in circular by CHeif Engineer, Public Works Region, Nagpur hearing No 36 dated 15/01/2019 and Annexure -1 attached to it will be applicable.';
  var _defaultAdd='The work shall be done as per instructions of Engineer in charge.';
  var IS='border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none;cursor:text;padding:0;width:100%';
  var html='';
  items.forEach(function(it,idx){
    var p=parseSpec(getSpec(it));var ref=p[0],pg=p[1],add=p[2];
    var isScada=(typeof SCADA!=='undefined'&&SCADA[it.no]&&SCADA[it.no]!==0);
    if(isScada){add=(add?add+'\n':'')+_ss;}
    else if(!add||!add.trim()){add=_defaultAdd;}
    html+='<tr>'
      +'<td style="text-align:center"><input value="'+(idx+1)+'" style="'+IS+';text-align:center"></td>'
      +'<td><textarea style="'+IS+';resize:none;overflow:hidden;min-height:2em;line-height:1.4;display:block">'+it.desc.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</textarea></td>'
      +'<td><input value="'+ref.replace(/"/g,'&quot;')+'" style="'+IS+'"></td>'
      +'<td style="text-align:center"><input value="'+pg+'" style="'+IS+';text-align:center"></td>'
      +'<td><textarea style="'+IS+';resize:none;overflow:hidden;min-height:1.5em;line-height:1.4;display:block">'+add.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</textarea></td>'
      +'<td class="noprt" style="text-align:center"><button class="sc-del-btn2" onclick="scDelRow(this)">✕</button></td>'
      +'</tr>';
  });
  tbody.innerHTML=html;
  setTimeout(function(){tbody.querySelectorAll('textarea').forEach(function(ta){ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';});},50);
}

function scAddRow(){
  var tbody=document.getElementById('sc_tbody');
  if(!tbody)return;
  var rows=tbody.querySelectorAll('tr');
  var idx=rows.length+1;
  var tr=document.createElement('tr');
  tr.innerHTML='<td style="text-align:center"><input value="'+idx+'" style="width:100%;text-align:center;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none;cursor:text"></td>'
    +'<td><textarea style="width:100%;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none;resize:none;overflow:hidden;min-height:2em;line-height:1.4;padding:0;display:block;cursor:text" placeholder="Item of Work"></textarea></td>'
    +'<td><input style="width:100%;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none;cursor:text" placeholder="Spec.No."></td>'
    +'<td><input style="width:100%;text-align:center;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none;cursor:text" placeholder="Pg"></td>'
    +'<td><textarea style="width:100%;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none;resize:none;overflow:hidden;min-height:1.5em;line-height:1.4;padding:0;display:block;cursor:text" placeholder="Additional Specifications..."></textarea></td>'
    +'<td class="noprt" style="text-align:center"><button class="sc-del-btn2" onclick="scDelRow(this)">✕</button></td>';
  tbody.appendChild(tr);
  // Sync work name if needed
  var wkEl=(window.R?R('pName'):document.getElementById('pName'));
  var wkName=wkEl?wkEl.value:'';
  var w1=document.getElementById('sc_work_p1');var w2=document.getElementById('sc_work');
  if(w1&&!w1.value)w1.value=wkName;
  if(w2&&!w2.value)w2.value=wkName;
}
function scDelRow(btn){
  var tr=btn.closest('tr');
  if(tr)tr.remove();
  // Renumber
  var tbody=document.getElementById('sc_tbody');
  if(!tbody)return;
  tbody.querySelectorAll('tr').forEach(function(row,i){
    var inp=row.querySelector('td:first-child input');
    if(inp)inp.value=i+1;
  });
}
function printSC(){
  var a=document.getElementById('sc_content');
  if(!a){showToast('Please open Schedule-C tab and try again','warn');return;}
  var clone=a.cloneNode(true);
  // Copy input values
  var oi=a.querySelectorAll('input,textarea');
  var ci=clone.querySelectorAll('input,textarea');
  for(var _i=0;_i<oi.length;_i++){
    if(ci[_i]){
      if(oi[_i].tagName==='TEXTAREA')ci[_i].textContent=oi[_i].value;
      else ci[_i].setAttribute('value',oi[_i].value);
    }
  }
  // Remove screen-only elements
  clone.querySelectorAll('.noprt,.sc-add-btn2,.sc-del-btn2,.sc-prt-btn2,.stamp-sel-box,.pg-sep,.pg-sep-lbl').forEach(function(el){el.remove();});
  var win=window.open('','_blank');
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>');
  win.document.write(clone.outerHTML);
  win.document.write('</body></html>');
  win.document.close();
  win.onload=function(){setTimeout(function(){win.print();},400);};
}
function downloadSchWord(){
  var sec=document.querySelector('#p17 .sch-sec.on');if(!sec)return;
  var clone=sec.cloneNode(true);
  var orig=sec.querySelectorAll('textarea,input'),cl=clone.querySelectorAll('textarea,input');
  for(var i=0;i<orig.length;i++){if(!cl[i])continue;if(orig[i].tagName==='TEXTAREA')cl[i].value=orig[i].value;else cl[i].setAttribute('value',orig[i].value);}
  // Replace inputs/textareas with spans for Word
  clone.querySelectorAll('input,textarea').forEach(function(el){
    var sp=document.createElement('span');
    sp.textContent=el.value||el.getAttribute('value')||'';
    sp.style.cssText=el.style.cssText||'';
    el.parentNode.replaceChild(sp,el);
  });
  clone.querySelectorAll('.noprt,.sc-add-btn2,.sc-del-btn2,.sb-add-btn,.note-del,.note-add-btn,.stamp-pg-sel,.stamp-sel-box').forEach(function(el){el.remove();});
  var html='<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><meta name=ProgId content=Word.Document><meta name=Generator content="Microsoft Word 15"><meta name=Originator content="Microsoft Word 15"><title>Schedule</title></head><body>';
  html+=clone.innerHTML;
  html+='</body></html>';
  var blob=new Blob([html],{type:'application/msword'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  // Determine which schedule
  var name='Schedule';
  if(sec.id==='sch-b')name='Schedule_B';
  else if(sec.id==='sch-c')name='Schedule_C';
  else if(sec.id==='sch-a')name='Schedule_A';
  var wkEl=document.getElementById('pName');
  if(wkEl&&wkEl.value)name+='_'+wkEl.value.replace(/[^a-zA-Z0-9]/g,'_').substring(0,20);
  a.download=name+'.doc';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(url);
  if(typeof showToast==='function')showToast('Word file downloaded! \u2713','success');
}

function fillScheduleB(){
  if(!items||!items.length)return;
  var S=gS();
  var tbody=document.getElementById('sb_tbody');
  if(!tbody)return;
  var wk=(window.R?R('pName'):document.getElementById('pName'));
  var sbWork=document.getElementById('sb_work');
  if(sbWork&&!sbWork.value)sbWork.value=wk?wk.value:'';
  var sbWorkP1=document.getElementById('sb_work_p1');
  if(sbWorkP1&&!sbWorkP1.value)sbWorkP1.value=wk?wk.value:'';
  // Auto-size all note textareas
  setTimeout(function(){
    document.querySelectorAll('#sb_notes_list .note-txt,#sc_notes_list .note-txt').forEach(function(ta){autoH(ta);});
  },80);
  // Sync div/subdiv sign spans
  sbSyncDivNames();
  var tRS=0,tRC=0;
  items.forEach(function(it){
    var cf=it.cf||{};
    tRS+=((cf.scr_sand||0)+(cf.sand||0)+(cf.quarry||0))*(it.qty||0);
    tRC+=((cf.m40mm||0)+(cf.m20mm||0)+(cf.m12_10||0)+(cf.overmetal||0)+(cf.rubble||0))*(it.qty||0);
  });
  tRS=Math.round(tRS*1000)/1000;
  tRC=Math.round(tRC*1000)/1000;
  function toW(n){
    var ones=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    var tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    if(!n||n===0)return'Zero Only';
    function h(x){if(x===0)return'';if(x<20)return ones[x]+' ';if(x<100)return tens[Math.floor(x/10)]+' '+(x%10?ones[x%10]+' ':'');return ones[Math.floor(x/100)]+' Hundred '+(x%100?h(x%100):'');}
    var dec=Math.round((Math.abs(n)%1)*100);var ni=Math.floor(Math.abs(n));var w='';
    if(ni>=10000000)w+=h(Math.floor(ni/10000000))+'Crore ';ni%=10000000;
    if(ni>=100000)w+=h(Math.floor(ni/100000))+'Lakh ';ni%=100000;
    if(ni>=1000)w+=h(Math.floor(ni/1000))+'Thousand ';ni%=1000;
    w+=h(ni);if(dec)w+='and '+dec+' Cents ';
    return w.trim()+' Only';
  }
  function getSpec(it){
    if(it.spec&&it.spec.trim().length>0)return it.spec.trim();
    if(typeof SSR!=='undefined'){
      var no=String(it.no||'').trim();
      for(var si=0;si<SSR.length;si++){
        if(String(SSR[si][0]).trim()===no&&SSR[si][4]&&SSR[si][4].length>0)return SSR[si][4];
      }
    }
    return'SSR 2022-23 No.'+it.no;
  }
  var html='<tr class="sb-part"><td colspan="9" style="padding:.2rem .4rem;font-weight:700">PART - A</td></tr>';
  var pA=0;
  items.forEach(function(it,idx){
    var amt=Math.round(it.amount||0);pA+=amt;
    var rate=it.finalRate||it.baseRate||0;
    var spec=getSpec(it);
    html+='<tr>'
      +'<td style="text-align:center"><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none;text-align:center" value="'+(idx+1)+'"></td>'
      +'<td style="word-wrap:break-word"><textarea style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none;resize:none;overflow:hidden;min-height:2.5em;word-wrap:break-word;white-space:pre-wrap;line-height:1.4;padding:0;display:block">'+it.desc.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</textarea></td>'
      +'<td style="word-wrap:break-word"><textarea style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none;resize:none;overflow:hidden;min-height:1.5em;word-wrap:break-word;white-space:pre-wrap;line-height:1.4;padding:0;display:block">'+spec.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</textarea></td>'
      +'<td><input style="width:100%;text-align:right;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="'+(it.qty||0).toFixed(3)+'"></td>'
      +'<td><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="'+(it.unit||'')+'"></td>'
      +'<td><input style="width:100%;text-align:right;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="'+rate.toFixed(2)+'"></td>'
      +'<td style="font-size:.62rem;word-wrap:break-word"><textarea style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:.62rem;outline:none;resize:none;overflow:hidden;min-height:1.5em;word-wrap:break-word;white-space:pre-wrap;line-height:1.4;padding:0;display:block">'+toW(Math.round(rate))+'</textarea></td>'
      +'<td><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="'+(it.unit||'')+'"></td>'
      +'<td><input style="width:100%;text-align:right;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="'+amt+'"></td>'
      +'</tr>';
  });
  html+='<tr class="sb-tot" id="sb_tot_a"><td colspan="8" style="text-align:right;padding-right:.5rem;font-weight:700">TOTAL : PART - A</td><td><input id="sb_total_a" style="width:100%;text-align:right;font-weight:700;background:transparent;border:none;outline:none;font-family:inherit;font-size:inherit;cursor:text" value="'+pA+'"></td></tr>';
  html+='<tr class="sb-part"><td colspan="9" style="padding:.2rem .4rem;font-weight:700">PART - B &nbsp;(Royalty &amp; Testing Charges)</td></tr>';
  var pB=0,royS=S.royS||237.37,royC=S.royC||216.18,bIdx=items.length+1;
  if(tRS>0){var rsA=Math.round(tRS*royS);pB+=rsA;
    html+='<tr><td style="text-align:center"><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none;text-align:center" value="'+bIdx+'"></td><td><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="Royalty Charges for Sand / Quarry"></td><td><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="As directed"></td><td><input style="width:100%;text-align:right;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="'+tRS.toFixed(3)+'"></td><td><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="Cu.M."></td><td><input style="width:100%;text-align:right;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="'+royS.toFixed(2)+'"></td><td style="font-size:.62rem"><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:.62rem;outline:none" value="'+toW(royS)+'"></td><td><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="Cu.M."></td><td><input style="width:100%;text-align:right;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="'+rsA+'"></td></tr>';
    bIdx++;
  }
  if(tRC>0){var rcA=Math.round(tRC*royC);pB+=rcA;
    html+='<tr><td style="text-align:center"><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none;text-align:center" value="'+bIdx+'"></td><td><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="Royalty Charges for Coarse Aggregate (Metal)"></td><td><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="As directed"></td><td><input style="width:100%;text-align:right;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="'+tRC.toFixed(3)+'"></td><td><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="Cu.M."></td><td><input style="width:100%;text-align:right;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="'+royC.toFixed(2)+'"></td><td style="font-size:.62rem"><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:.62rem;outline:none" value="'+toW(royC)+'"></td><td><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="Cu.M."></td><td><input style="width:100%;text-align:right;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="'+rcA+'"></td></tr>';
    bIdx++;
  }
  var mtf=window._mtfTotalVal||0;
  if(mtf>0){pB+=Math.round(mtf);
    html+='<tr><td style="text-align:center"><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none;text-align:center" value="'+bIdx+'"></td><td><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="VQCC Testing Charges"></td><td><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="As directed"></td><td><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value=""></td><td><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="Nos."></td><td><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value=""></td><td><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="'+toW(Math.round(mtf))+'"></td><td><input style="width:100%;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="Nos."></td><td><input style="width:100%;text-align:right;cursor:text;border:none;background:transparent;font-family:inherit;font-size:inherit;outline:none" value="'+Math.round(mtf)+'"></td></tr>';
  }
  var grand=pA+pB;
  html+='<tr class="sb-tot" id="sb_tot_b"><td colspan="8" style="text-align:right;padding-right:.5rem;font-weight:700">TOTAL : PART - B</td><td><input id="sb_total_b" style="width:100%;text-align:right;font-weight:700;background:transparent;border:none;outline:none;font-family:inherit;font-size:inherit;cursor:text" value="'+pB+'"></td></tr>';
  html+='<tr class="sb-grand"><td colspan="8" style="text-align:right;padding-right:.5rem;font-weight:900">GRAND TOTAL : (A+B)</td><td><input id="sb_grand" style="width:100%;text-align:right;font-weight:900;background:transparent;border:none;outline:none;font-family:inherit;font-size:inherit;cursor:text" value="'+grand+'"></td></tr>';
  html+='<tr><td colspan="9"><input id="sb_grand_words" style="width:100%;border:none;border-bottom:1px solid #aaa;background:transparent;font-family:inherit;font-size:inherit;outline:none;cursor:text" value="'+toW(grand)+'"></td></tr>';
  tbody.innerHTML=html;
  var addR=document.createElement('tr');addR.className='noprt';
  addR.innerHTML='<td colspan="9" style="padding:.3rem"><button class="sb-add-btn" onclick="sbAddA()">+ Row (Part A)</button><button class="sb-add-btn" onclick="sbAddB()">+ Row (Part B)</button></td>';
  tbody.appendChild(addR);
  /* Auto-resize all textareas */
  setTimeout(function(){
    tbody.querySelectorAll('textarea').forEach(function(ta){
      ta.style.height='auto';
      ta.style.height=ta.scrollHeight+'px';
    });
  },50);
}
function saveMaintenance(){
  if(!window.firebase||!firebase.firestore){showToast("Firebase not ready","error");return;}
  var active=G("maintActive").value==="true";
  var message=(G("maintMsgInp").value||"").trim();
  var from=(G("maintFrom").value||"").trim();
  var to=(G("maintTo").value||"").trim();
  firebase.firestore().collection("config").doc("app").set({maintenance:{active:active,message:message,from:from,to:to}},{merge:true})
    .then(function(){
      if(G("maintSaveMsg"))G("maintSaveMsg").textContent=active?"✅ Banner is now LIVE!":"✅ Banner hidden.";
      showToast(active?"🚧 Maintenance banner LIVE!":"✅ Banner hidden.","success");
      var mb=G("maintBanner");
      if(mb){if(active){var mm=message||'Scheduled maintenance in progress.';if(from&&to)mm='🚧 Maintenance: '+from+' – '+to;G('maintMsg').textContent=mm;mb.classList.add('show');document.body.classList.add('has-maint');}else{mb.classList.remove('show');document.body.classList.remove('has-maint');}}
    }).catch(function(e){showToast("Error: "+e.message,"error");});
}
function saveCFtoCloud(){
  if(!window.firebase||!firebase.firestore){showToast("Firebase not ready","error");return;}
  if(!CU||CU.email!==ADMIN_EMAIL){showToast("Admin only","error");return;}
  var cfData=JSON.parse(JSON.stringify(CF_MAP));
  firebase.firestore().collection("config").doc("cfmap").set({
    cf:cfData,updatedAt:firebase.firestore.FieldValue.serverTimestamp(),updatedBy:CU.email
  }).then(function(){
    showToast("CF cloud vr save zala! Saglya users la next load la milel.","success");
  }).catch(function(e){showToast("Error: "+e.message,"error");});
}

/* ── ADMIN SSR TABLE ──────────────────────────────────── */
function aRenderSSR(){
  var q=((G('ssrAdminQ')||{}).value||'').trim().toLowerCase();
  var list=q?SSR.filter(function(d){
    var words=q.split(/\s+/);
    var hay=(d[0]+' '+d[1]).toLowerCase();
    return words.every(function(w){return hay.indexOf(w)!==-1;});
  }):SSR;
  var cnt=G('ssrCount');if(cnt)cnt.textContent=list.length+' / '+SSR.length+' items';
  var tb=G('ssrAdminBody');if(!tb)return;
  var h='';
  list.forEach(function(d,i){
    var realIdx=SSR.indexOf(d);
    h+='<tr style="border-bottom:1px solid #eee;background:'+(i%2?'#fafaf8':'#fff')+'">';
    h+='<td style="padding:.3rem .4rem;font-weight:700;color:#1565c0;white-space:nowrap;vertical-align:top">'+esc(d[0])+'</td>';
    h+='<td style="padding:.3rem .4rem;line-height:1.4;color:#333">'+esc(d[1])+'</td>';
    h+='<td style="padding:.3rem .4rem;text-align:center;color:#555;white-space:nowrap;vertical-align:top">'+esc(d[2])+'</td>';
    h+='<td style="padding:.3rem .4rem;text-align:center;vertical-align:top">';
    h+='<input type="number" step="0.01" value="'+d[3]+'" data-ri="'+realIdx+'" ';
    h+='onchange="aUpdateSSRRate(this)" ';
    h+='style="width:80px;padding:.2rem .3rem;font-size:.63rem;border:1px solid #ccc;border-radius:3px;text-align:right">';
    h+='</td>';
    h+='</tr>';
  });
  tb.innerHTML=h||'<tr><td colspan="4" style="text-align:center;padding:1.5rem;color:#aaa">No items found</td></tr>';
}
function aFilterSSR(){
  clearTimeout(window._ssrT);
  window._ssrT=setTimeout(aRenderSSR,250);
}
function aUpdateSSRRate(inp){
  var ri=parseInt(inp.getAttribute('data-ri'));
  if(ri>=0&&ri<SSR.length){
    SSR[ri][3]=parseFloat(inp.value)||0;
    inp.style.background='#e8f5e9';
    setTimeout(function(){inp.style.background='';},800);
  }
}
function aExportSSRExcel(){
  if(typeof XLSX==='undefined'){showToast('SheetJS not loaded','error');return;}
  var rows=[['No.','Description','Unit','Rate (Rs)']];
  SSR.forEach(function(d){rows.push([d[0],d[1],d[2],d[3]]);});
  var wb=XLSX.utils.book_new();
  var ws=XLSX.utils.aoa_to_sheet(rows);
  ws['!cols']=[{wch:8},{wch:90},{wch:18},{wch:12}];
  XLSX.utils.book_append_sheet(wb,ws,'SSR');
  XLSX.writeFile(wb,'SSR_Items.xlsx');
  showToast('SSR Excel downloaded!','success');
}
function aImportSSRExcel(){var f=G('ssrImportFile');if(f)f.click();}

/* ── DELETE ALL SSR & RE-UPLOAD ─────────────────────────────────────── */
function aDeleteAndReuploadSSR(){
  if(!window.firebase||!firebase.firestore){showToast('Firebase not ready','error');return;}
  if(!CU||CU.email!==ADMIN_EMAIL){showToast('Admin only','error');return;}
  if(!confirm('⚠️ This will permanently DELETE all SSR — including from Cloud!\n\nYou will then upload a new Excel file.\n\nDo you want to confirm?'))return;
  var f=G('ssrReuploadFile');if(f)f.click();
}

function aDoDeleteAndReupload(inp){
  if(!inp.files||!inp.files[0])return;
  if(typeof XLSX==='undefined'){showToast('SheetJS not loaded','error');return;}
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var wb=XLSX.read(e.target.result,{type:'array'});
      var ws=wb.Sheets[wb.SheetNames[0]];
      var rows=XLSX.utils.sheet_to_json(ws,{header:1});
      /* Validate: at least 2 rows (header + 1 data) */
      if(rows.length<2){showToast('No data found in file!','error');return;}
      var newSSR=[];
      rows.forEach(function(row,ri){
        if(ri===0)return; /* Skip header */
        if(!row[0]||!row[1])return;
        var no=String(row[0]).trim(),desc=String(row[1]).trim();
        var unit=String(row[2]||'').trim(),rate=parseFloat(row[3])||0;
        newSSR.push([no,desc,unit,rate]);
      });
      if(newSSR.length===0){showToast('No valid data found in Excel!','error');return;}
      if(!confirm('New SSR: '+newSSR.length+' items\nAll old SSR will be permanently DELETED.\n\nDo you want to proceed?'))return;
      /* Step 1: Replace SSR global array */
      SSR.length=0;
      newSSR.forEach(function(r){SSR.push(r);});
      aRenderSSR();
      showToast('⏳ Deleting old SSR from Cloud...','info');
      /* Step 2: Delete old chunks from Cloud, then save new ones */
      var ref=firebase.firestore().collection('config');
      /* Check old meta to know how many chunks existed */
      ref.doc('ssr_meta').get().then(function(doc){
        var oldChunks=doc.exists?(doc.data().chunks||0):20;
        var deletePromises=[];
        for(var ci=0;ci<oldChunks+5;ci++){
          deletePromises.push(ref.doc('ssr_chunk_'+ci).delete().catch(function(){}));
        }
        return Promise.all(deletePromises);
      }).then(function(){
        showToast('⏳ Saving new SSR to Cloud...','info');
        /* Step 3: Save new SSR chunks to cloud */
        var ssrData=SSR.map(function(d){return[d[0],d[1],d[2],d[3]];});
        var chunkSize=500,chunks=[];
        for(var i=0;i<ssrData.length;i+=chunkSize)chunks.push(ssrData.slice(i,i+chunkSize));
        ref.doc('ssr_meta').set({chunks:chunks.length,total:ssrData.length,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
        return Promise.all(chunks.map(function(chunk,ci){
          return ref.doc('ssr_chunk_'+ci).set({data:chunk,chunk:ci});
        }));
      }).then(function(){
        showToast('✅ Done! Old SSR deleted, new '+SSR.length+' items saved to Cloud.','success');
      }).catch(function(err){
        showToast('Cloud error: '+err.message,'error');
      });
    }catch(err){showToast('File error: '+err.message,'error');}
  };
  reader.readAsArrayBuffer(inp.files[0]);
  inp.value='';
}
function aDoImportSSR(inp){
  if(!inp.files||!inp.files[0])return;
  if(typeof XLSX==='undefined'){showToast('SheetJS not loaded','error');return;}
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var wb=XLSX.read(e.target.result,{type:'array'});
      var ws=wb.Sheets[wb.SheetNames[0]];
      var rows=XLSX.utils.sheet_to_json(ws,{header:1});
      var updated=0,added=0;
      rows.forEach(function(row,ri){
        if(ri===0)return;
        if(!row[0]||!row[1])return;
        var no=String(row[0]).trim(),desc=String(row[1]).trim();
        var unit=String(row[2]||'').trim(),rate=parseFloat(row[3])||0;
        var found=false;
        for(var i=0;i<SSR.length;i++){
          if(SSR[i][0]===no){SSR[i][1]=desc;SSR[i][2]=unit;SSR[i][3]=rate;found=true;updated++;break;}
        }
        if(!found){SSR.push([no,desc,unit,rate]);added++;}
      });
      showToast('Import: '+updated+' updated, '+added+' new items added','success');
      aRenderSSR();
    }catch(err){showToast('Import error: '+err.message,'error');}
  };
  reader.readAsArrayBuffer(inp.files[0]);
  inp.value='';
}

/* ── ADMIN LEAD CHART ────────────────────────────────── */
function aRenderLead(){
  var head=G('leadAdminHead');var tb=G('leadAdminBody');if(!head||!tb)return;
  var matKeys=["concrete_block", "cement_bags", "bricks", "tiles_hr", "ms_bars", "flooring", "gi_sheet", "rubble", "manure", "quarry", "sand", "overmetal", "m20mm", "m12_10", "scr_sand", "m40mm"];
  var matLabels={"concrete_block": "ConcreteBlock (FORM)", "cement_bags": "Cement / Lime / Stone Block / GI / CI Pipes", "bricks": "Bricks", "tiles_hr": "Tiles Half Round / Roofing / Manlore", "ms_bars": "Steel (MS, TMT, H.Y.S.D.)", "flooring": "Flooring Tiles Ceramic / Marbonate", "gi_sheet": "GI Sheet", "rubble": "Murrum, Building Rubish, Earth", "manure": "Manure / Sludge", "quarry": "Excavated Rock soling stone", "sand": "Sand / Stone below 40mm", "overmetal": "Stone Aggregate 40mm+", "m20mm": "Metal 20mm", "m12_10": "Metal 12-10mm", "scr_sand": "Screened Sand", "m40mm": "Metal 40mm"};
  /* Build header row: "Lead (km)" + each material */
  var hh='<tr style="background:#1565c0;color:#fff;position:sticky;top:0;z-index:2">';
  hh+='<th style="padding:.3rem .5rem;text-align:center;min-width:70px;position:sticky;left:0;background:#1565c0;z-index:3">Lead<br>(km)</th>';
  matKeys.forEach(function(k){
    hh+='<th style="padding:.3rem .5rem;text-align:center;min-width:80px;font-size:.58rem;line-height:1.3">'+esc(matLabels[k]||k)+'</th>';
  });
  hh+='</tr>';
  head.innerHTML=hh;
  /* Get all km points from first key */
  var allKms=LL[matKeys[0]]?LL[matKeys[0]].map(function(p){return p[0];}):[];
  /* Build data rows */
  var h='';
  allKms.forEach(function(km,ri){
    h+='<tr style="border-bottom:1px solid #eee;background:'+(ri%2?'#fafaf8':'#fff')+'">';
    h+='<td style="padding:.25rem .4rem;text-align:center;font-weight:700;color:#1565c0;position:sticky;left:0;background:'+(ri%2?'#fafaf8':'#fff')+';z-index:1;border-right:2px solid #d0ccc4">'+km+'</td>';
    matKeys.forEach(function(k){
      var tbl=LL[k]||[];
      var rate=0;
      for(var i=0;i<tbl.length;i++){if(tbl[i][0]===km){rate=tbl[i][1];break;}}
      h+='<td style="padding:.2rem .3rem;text-align:right">';
      h+='<input type="number" step="0.01" value="'+rate.toFixed(2)+'" ';
      h+='data-km="'+km+'" data-key="'+k+'" ';
      h+='onchange="aUpdateLL(this)" ';
      h+='style="width:72px;padding:.15rem .25rem;font-size:.61rem;border:1px solid #ddd;border-radius:2px;text-align:right;background:'+( rate>0?'#fff':'#f5f5f5')+';">';
      h+='</td>';
    });
    h+='</tr>';
  });
  tb.innerHTML=h;
}

function aUpdateLL(inp){
  var km=parseFloat(inp.getAttribute('data-km'));
  var key=inp.getAttribute('data-key');
  var val=parseFloat(inp.value)||0;
  if(!LL[key])return;
  for(var i=0;i<LL[key].length;i++){
    if(LL[key][i][0]===km){LL[key][i][1]=val;break;}
  }
  inp.style.background=val>0?'#e8f5e9':'#f5f5f5';
  setTimeout(function(){
    inp.style.background=val>0?'#fff':'#f5f5f5';
    if(typeof updateAll==="function")updateAll();
  },600);
}

function aExportLeadCSV(){
  var matKeys=["concrete_block", "cement_bags", "bricks", "tiles_hr", "ms_bars", "flooring", "gi_sheet", "rubble", "manure", "quarry", "sand", "overmetal", "m20mm", "m12_10", "scr_sand", "m40mm"];
  var matLabels={"concrete_block": "ConcreteBlock (FORM)", "cement_bags": "Cement / Lime / Stone Block / GI / CI Pipes", "bricks": "Bricks", "tiles_hr": "Tiles Half Round / Roofing / Manlore", "ms_bars": "Steel (MS, TMT, H.Y.S.D.)", "flooring": "Flooring Tiles Ceramic / Marbonate", "gi_sheet": "GI Sheet", "rubble": "Murrum, Building Rubish, Earth", "manure": "Manure / Sludge", "quarry": "Excavated Rock soling stone", "sand": "Sand / Stone below 40mm", "overmetal": "Stone Aggregate 40mm+", "m20mm": "Metal 20mm", "m12_10": "Metal 12-10mm", "scr_sand": "Screened Sand", "m40mm": "Metal 40mm"};
  var allKms=LL[matKeys[0]]?LL[matKeys[0]].map(function(p){return p[0];}):[];
  var rows=[['Lead in km'].concat(matKeys.map(function(k){return matLabels[k]||k;}))];
  allKms.forEach(function(km){
    var row=[km];
    matKeys.forEach(function(k){
      var tbl=LL[k]||[];
      var rate=0;
      for(var i=0;i<tbl.length;i++){if(tbl[i][0]===km){rate=tbl[i][1];break;}}
      row.push(rate.toFixed(4));
    });
    rows.push(row);
  });
  var csv=rows.map(function(r){return r.map(function(v){return '"'+String(v).replace(/"/g,'""')+'"';}).join(',');}).join('\n');
  var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.href=url;a.download='Lead_Chart.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Lead Chart CSV downloaded!','success');
}

function aImportLeadCSV(){var f=G('leadImportFile');if(f)f.click();}

function aDoImportLeadCSV(inp){
  if(!inp.files||!inp.files[0])return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var lines=e.target.result.split(/\r?\n/).filter(function(l){return l.trim();});
      /* Row 0 = header: "Lead in km", mat1, mat2... */
      var headers=lines[0].split(',').map(function(h){return h.replace(/"/g,'').trim();});
      /* Map header names to LL keys */
      var matLabels={"concrete_block": "ConcreteBlock (FORM)", "cement_bags": "Cement / Lime / Stone Block / GI / CI Pipes", "bricks": "Bricks", "tiles_hr": "Tiles Half Round / Roofing / Manlore", "ms_bars": "Steel (MS, TMT, H.Y.S.D.)", "flooring": "Flooring Tiles Ceramic / Marbonate", "gi_sheet": "GI Sheet", "rubble": "Murrum, Building Rubish, Earth", "manure": "Manure / Sludge", "quarry": "Excavated Rock soling stone", "sand": "Sand / Stone below 40mm", "overmetal": "Stone Aggregate 40mm+", "m20mm": "Metal 20mm", "m12_10": "Metal 12-10mm", "scr_sand": "Screened Sand", "m40mm": "Metal 40mm"};
      var labelToKey={};
      for(var k in matLabels)labelToKey[matLabels[k]]=k;
      var colKeys=headers.slice(1).map(function(h){return labelToKey[h]||h;});
      var updated=0;
      for(var ri=1;ri<lines.length;ri++){
        var cols=lines[ri].split(',').map(function(v){return v.replace(/"/g,'').trim();});
        if(!cols[0])continue;
        var km=parseFloat(cols[0]);
        if(isNaN(km))continue;
        colKeys.forEach(function(key,ci){
          if(!LL[key])return;
          var val=parseFloat(cols[ci+1])||0;
          for(var i=0;i<LL[key].length;i++){
            if(LL[key][i][0]===km){LL[key][i][1]=val;updated++;break;}
          }
        });
      }
      showToast('Import done: '+updated+' values updated','success');
      aRenderLead();
      if(typeof updateAll==="function")updateAll();
    }catch(err){showToast('Import error: '+err.message,'error');}
  };
  reader.readAsText(inp.files[0]);
  inp.value='';
}

function aUpdateLeadKm(inp){/* legacy - not used */}
function aUpdateLeadLoc(inp){/* legacy - not used */}

function saveCFandDownload(){
  /* Build new CF_MAP JS string */
  var lines=['var CF_MAP={'];
  var keys=Object.keys(CF_MAP);
  for(var i=0;i<keys.length;i++){
    var no=keys[i],cf=CF_MAP[no];
    var mats=[];
    for(var m in cf){if(cf[m]&&cf[m]>0)mats.push(m+':'+cf[m]);}
    if(mats.length)lines.push('  "'+no+'":{'+mats.join(',')+'}'+( i<keys.length-1?',':''));
  }
  lines.push('};');
  var newCFMAP=lines.join('\n');

  /* Get current HTML */
  var html=document.documentElement.outerHTML;

  /* Replace CF_MAP in HTML */
  var cfStart=html.indexOf('var CF_MAP=');
  var cfEnd=html.indexOf('};',cfStart)+2;
  if(cfStart<0||cfEnd<2){alert('CF_MAP not found in HTML!');return;}
  var newHTML=html.substring(0,cfStart)+newCFMAP+html.substring(cfEnd);

  /* Download */
  var blob=new Blob([newHTML],{type:'text/html;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download='boq_v27_cf_saved.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  alert('✅ CF values HTML madhe save hotle!\nDownload zaleya file la dusrya computer la pathva - CF values embed astil.');
}

/* ── CF CSV EXPORT ─────────────────────────────────────────────────── */
function exportCFcsv(){
  var MATS=['rubble','overmetal','sand','scr_sand','cement_bags','m40mm','m20mm','m12_10','quarry','bricks','ms_bars','bitumen'];
  /* Header row */
  var rows=['Item No.,Description,'+MATS.join(',')];
  var keys=Object.keys(CF_MAP).sort();
  for(var i=0;i<keys.length;i++){
    var no=keys[i], cf=CF_MAP[no]||{};
    /* Get description */
    var desc='';
    for(var s=0;s<SSR.length;s++){if(SSR[s][0]===no){desc=SSR[s][1].replace(/,/g,' ').replace(/\n/g,' ').substring(0,80);break;}}
    var vals=MATS.map(function(m){return cf[m]||0;});
    rows.push('"'+no+'","'+desc+'",'+vals.join(','));
  }
  var csv=rows.join('\r\n');
  var blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download='CF_Table_boq_v27.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── CF CSV IMPORT ─────────────────────────────────────────────────── */
function importCFcsv(){
  var inp=document.createElement('input');
  inp.type='file'; inp.accept='.csv,text/csv';
  inp.onchange=function(e){
    var file=e.target.files[0]; if(!file)return;
    var reader=new FileReader();
    reader.onload=function(ev){
      try{
        var text=ev.target.result;
        /* Remove BOM if present */
        if(text.charCodeAt(0)===0xFEFF)text=text.slice(1);
        var lines=text.split(/\r?\n/).filter(function(l){return l.trim();});
        if(lines.length<2){alert('CSV file is empty or invalid.');return;}
        /* Parse header to get column positions */
        var hdr=parseCSVRow(lines[0]);
        var noIdx=0, descIdx=1;
        var MATS=['rubble','overmetal','sand','scr_sand','cement_bags','m40mm','m20mm','m12_10','quarry','bricks','ms_bars','bitumen'];
        var matIdx={};
        for(var m=0;m<MATS.length;m++){
          var col=hdr.indexOf(MATS[m]);
          if(col>=0)matIdx[MATS[m]]=col;
          else{
            /* Try case-insensitive */
            for(var h=0;h<hdr.length;h++){
              if(hdr[h].toLowerCase().trim()===MATS[m].toLowerCase()){matIdx[MATS[m]]=h;break;}
            }
          }
        }
        /* Parse rows */
        var imported=0,skipped=0;
        for(var i=1;i<lines.length;i++){
          var row=parseCSVRow(lines[i]);
          if(!row||!row[0])continue;
          var no=row[0].trim();
          if(!no){skipped++;continue;}
          var newCF={};
          for(var mat in matIdx){
            var idx2=matIdx[mat];
            var v=idx2<row.length?parseFloat(row[idx2].trim())||0:0;
            if(v>0)newCF[mat]=v;
          }
          CF_MAP[no]=newCF;
          imported++;
        }
        rCFTab();
        updateAll();
        alert('✅ CF Import complete!\n'+imported+' items imported, '+skipped+' skipped.\nEdit karoon "Save CF & Download HTML" dabava.');
      }catch(err){alert('Import failed: '+err.message);}
    };
    reader.readAsText(file,'UTF-8');
  };
  inp.click();
}

/* Parse one CSV row handling quoted fields */
function parseCSVRow(line){
  var result=[],cur='',inQ=false,c;
  for(var i=0;i<line.length;i++){
    c=line[i];
    if(c==='"'){inQ=!inQ;}
    else if(c===','&&!inQ){result.push(cur);cur='';}
    else{cur+=c;}
  }
  result.push(cur);
  return result;
}

function recalcItem(it){
  var cf=it.cf||{},lpu=0,lm=[],mat,f,lr,cv,km,chg,add;
  var bitChangeAmt=0;
  for(mat in cf){
    f=cf[mat];if(!f||f<=0)continue;
    /* Bitumen: special calculation = factor * km * 10 (lead) + factor * changeInRate */
    if(mat==='bitumen'){
      km=LEAD_KM['bitumen']||0;
      /* Lead for Bitumen = bitumen_MT_per_cum * km * 10 Rs/km */
      var bitLeadAmt=f*km*10;
      lpu+=bitLeadAmt;
      if(bitLeadAmt>0)lm.push({mat:'bitumen',label:'Bitumen Lead ('+f.toFixed(4)+' MT × '+km+' km × ₹10)',factor:f,conv:1,km:km,chg:km*10,add:bitLeadAmt});
      /* Change in Rate for Bitumen */
      var bitChange=getBitChange();
      bitChangeAmt=f*bitChange;
      if(Math.abs(bitChangeAmt)>0.001)lm.push({mat:'bitumen_change',label:'Bitumen Rate Change ('+f.toFixed(4)+' MT × ₹'+Math.round(bitChange)+')',factor:f,conv:1,km:0,chg:bitChange,add:bitChangeAmt});
      lpu+=bitChangeAmt;
      continue;
    }
    lr=LR[mat];if(!lr)continue;
    cv=lr.conv||1;km=LEAD_KM[mat]||0;
    chg=lkup(mat,km);
    add=f*cv*chg;lpu+=add;
    if(add>0)lm.push({mat:mat,label:lr.label||mat,factor:f,conv:cv,km:km,chg:chg,add:add});
  }
  var sv=it.scadaVal||0;
  var fr=Math.round((it.baseRate+lpu+sv)*100)/100;
  /* ── Area Type (as per GR Table) % ── */
  var _aS=typeof gS==='function'?gS():{areaPct:0,areaLbl:''};
  if(_aS.areaPct>0){
    var _aAdd=Math.round(it.baseRate*_aS.areaPct/100*100)/100;
    lm.push({mat:'area_pct',label:'+'+_aS.areaPct+'% Specific Area ('+_aS.areaLbl+')',
      factor:_aS.areaPct,conv:1,km:0,chg:0,add:_aAdd});
    fr=Math.round((fr+_aAdd)*100)/100;
  }
  var out=JSON.parse(JSON.stringify(it));
  out.leadPerUnit=Math.round(lpu*100)/100;
  out.leadMats=lm;
  out.finalRate=fr;
  /* Recalculate floor rates for each row */
  if(out.rows){
    var amt=0;
    out.rows.forEach(function(rw){
      if(!rw.isTot){
        rw.flRate=Math.round(fr*(1+(rw.fl||0)/100)*100)/100;
        amt+=rw.flRate*rw.qty;
      }
    });
    out.amount=Math.round(amt*100)/100;
  } else {
    out.amount=Math.round(fr*it.qty*100)/100;
  }
  return out;
}
function calcItemLead(cf){
  var total=0,mats=[],mat,f,lr,cv,km,chg,add;
  for(mat in cf||{}){
    f=cf[mat];if(!f||f<=0)continue;
    lr=LR[mat];if(!lr)continue;
    cv=lr.conv||1;km=LEAD_KM[mat]||0;
    chg=lkup(mat,km);
    add=f*cv*chg;total+=add;
    if(add>0)mats.push({mat:mat,label:lr.label||mat,factor:f,conv:cv,km:km,chg:chg,add:add});
  }
  return{total:Math.round(total*100)/100,mats:mats};
}

/* ── COVER PAGE ──────────────────────────────────────────────────────── */
function upCover(){/* header fixed: GOVERNMENT OF MAHARASHTRA only */
  var sbp=R('pSubPrint');if(sbp)sbp.textContent=((R('pSub')||{}).value||'');
  /* Auto-sync pReg → stampLocReg and pCir → stampLocCir with proper prefix */
  var regRaw=((R('pReg')||{}).value||'').trim();
  var cirRaw=((R('pCir')||{}).value||'').trim();
  if(regRaw){
    var regFull=(/^public\s+works\s+region/i.test(regRaw))?regRaw:('Public Works Region, '+regRaw);
    localStorage.setItem('stampLocReg',regFull);
  }
  if(cirRaw){
    var cirFull=(/^public\s+works\s+circle/i.test(cirRaw))?cirRaw:('Public Works Circle, '+cirRaw);
    localStorage.setItem('stampLocCir',cirFull);
  }
  /* Refresh all stamp blocks */
  if(typeof updateAllStamps==='function')updateAllStamps();
}
function upMeta(){
  var nm=((R('pName')||{}).value||'');
  var i;for(i=2;i<=9;i++){var e=R('pt'+i);if(e)e.textContent=nm;}
  se('covWork',nm||'-- Name of Work --');
  var s=R('pt8s');
  if(s){var d1=((R('pDiv')||{}).value||''),d2=((R('pSub')||{}).value||'');
    s.textContent=[d1,d2].filter(Boolean).join(' . ');}
  ['pName','pSub'].forEach(function(id){var ta=R(id);
    if(ta&&ta.tagName==='TEXTAREA'){ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';}});
  var np=R('pNamePrint');if(np)np.textContent=((R('pName')||{}).value||'');
  var sbp=R('pSubPrint');if(sbp)sbp.textContent=((R('pSub')||{}).value||'');
  /* Update all pth-work divs */
  var wk=((R('pName')||{}).value||'');
  document.querySelectorAll('.pth-work').forEach(function(el){el.textContent=wk;});
}

/* ── SEARCH ──────────────────────────────────────────────────────────── */
function buildList(arr){
  var h='',i,d,desc;
  for(i=0;i<arr.length;i++){
    d=arr[i];if(!d||d.length<2)continue;
    desc=(d[1]||'');

    h+='<div class="ri" data-no="'+d[0]+'">'
      +'<div class="rin">'+d[0]+'</div>'
      +'<div class="rid">'+desc+'</div>'
      +'<div class="riu">'+(d[2]||'')+'</div>'
      +'<div class="rir">\u20b9'+fmt(d[3])+'</div>'
      +'</div>';
  }
  return h||'<div class="ni">Not found</div>';
}
function showDefaultList(){
  var box=R('resBox');if(!box)return;
  box.innerHTML=buildList(SSR.slice(0,30));
}
function doSearch(){
  clearTimeout(stm);
  stm=setTimeout(function(){
    var q=((R('srchIn')||{}).value||'').trim().toLowerCase();
    var box=R('resBox');if(!box)return;
    if(!q){se('srchInfo',SSR.length+' items');showDefaultList();return;}
    var words=q.split(/\s+/).filter(function(w){return w.length>0;});
    var res=[],i,d,h;
    for(i=0;i<SSR.length;i++){
      d=SSR[i];if(!d||d.length<2)continue;
      h=((d[0]||'')+' '+(d[1]||'')+' '+(d[2]||'')).toLowerCase();
      if(words.every(function(w){return h.indexOf(w)>=0;})){
        res.push(d);if(res.length>=80)break;
      }
    }
    se('srchInfo',res.length+' results');
    box.innerHTML=buildList(res);
  },150);
}
document.addEventListener('click',function(e){
  var ri=e.target.closest?e.target.closest('.ri'):null;
  if(!ri)return;
  var no=ri.getAttribute('data-no');
  if(no)selItem(no);
});
function selItem(no){
  var d=null,i;
  for(i=0;i<SSR.length;i++){if(SSR[i][0]===no){d=SSR[i];break;}}
  if(!d)return;
  selSSR={no:d[0],desc:(d[1]||''),unit:(d[2]||''),rate:d[3]||0,spec:(d[4]||'')};
  var keyF=String(parseFloat(no));
  /* CF lookup: try exact no first, then parent (parseFloat), then CF_MAP exact */
  selSSR.cf=CF_MAP[no]||CF_MAP[keyF]||{};  /* Auto-load from CF_MAP */
  /* SCADA: if CANCEL_SCADA is true use 0, otherwise use CUSTOM_SCADA_VAL or table value */
  var _rawScada=SCADA[no]||SCADA[keyF]||0;
  if(_rawScada&&!CANCEL_SCADA){
    /* SCADA item found - use custom value (changed from settings) */
    selSSR.scadaVal=CUSTOM_SCADA_VAL;
  } else {
    selSSR.scadaVal=0; /* SCADA cancelled or item has no SCADA */
  }
  se('selNo','Item No. '+d[0]);
  var desc=(d[1]||'');
  se('selDesc',desc);
  var rh='\u20b9'+fmt(d[3]||0)+' / '+(d[2]||'');
  var _rawScadaCheck=SCADA[no]||SCADA[keyF]||0;
  if(_rawScadaCheck){
    if(CANCEL_SCADA){
      rh+='<span class="spill" style="background:#e8f5e9;color:#2e7d32">SCADA Cancel ✅</span>';
    } else {
      rh+='<span class="spill">SCADA '+selSSR.scadaVal+'</span>';
    }
  }
  R('selRate').innerHTML=rh;
  var prev=R('leadPrev'),hasCf=false,m;
  for(m in selSSR.cf||{}){if(selSSR.cf[m]>0){hasCf=true;break;}}
  if(!selSSR.cf||!hasCf){
    prev.innerHTML='<div class="lprev-hd">Lead</div><div class="no-lead">CF nahi -- Lead = 0</div>';
  } else {
    var res=calcItemLead(selSSR.cf),fr=d[3]+res.total+selSSR.scadaVal,j,mt;
    var h2='<div class="lprev-hd">Lead (current km -- non-linear lookup)</div>';
    for(j=0;j<res.mats.length;j++){
      mt=res.mats[j];
      h2+='<div class="lp-row"><span>'+mt.label
        +' ('+mt.factor+(mt.conv!==1?'x'+mt.conv:'')+' x km='+mt.km+')</span>'
        +'<span class="lp-v">+\u20b9'+fmt(mt.add)+'</span></div>';
    }
    if(selSSR.scadaVal)h2+='<div class="lp-row"><span>SCADA</span>'
      +'<span class="lp-v" style="color:var(--rd)">'+selSSR.scadaVal+'</span></div>';
    h2+='<div style="border-top:1px solid #c8bef0;margin-top:.18rem;padding-top:.18rem;font-weight:700;font-size:.62rem">'
      +'Lead/unit=\u20b9'+fmt(res.total)+' | Final=\u20b9'+fmt(fr)+'</div>';
    prev.innerHTML=h2;
  }
  mrCount=0;R('measRows').innerHTML='';addMR();
  R('addForm').classList.add('on');
  R('addForm').scrollIntoView({behavior:'smooth',block:'nearest'});
}

/* ── MEASUREMENTS ────────────────────────────────────────────────────── */
function addMR(){
  mrCount++;var id=mrCount;
  var div=document.createElement('div');div.className='mr';div.id='mr'+id;
  div.innerHTML='<input type="text" placeholder="Desc" id="ml'+id+'">'
    +'<select class="mfl" id="mf'+id+'" onchange="cMR('+id+')">'
    +'<option value="0">GF</option><option value="1">1st</option>'
    +'<option value="2">2nd</option><option value="3">3rd</option><option value="4">4th</option>'
    +'</select>'
    +'<input type="number" placeholder="1" step="any" id="mn'+id
    +'" oninput="cMR('+id+')" value="1">'
    +'<input type="text" placeholder="L" id="ml2'+id+'" oninput="cMR('+id+')" style="font-family:monospace;width:55px">'
    +'<input type="text" placeholder="B" id="mb'+id+'" oninput="cMR('+id+')" style="font-family:monospace;width:55px">'
    +'<input type="text" placeholder="D/H" id="md'+id+'" oninput="cMR('+id+')" style="font-family:monospace;width:55px">'
    +'<span class="mt" id="mt'+id+'">0.000</span>'
    +'<button class="dr" onclick="this.parentElement.remove()">x</button>';
  R('measRows').appendChild(div);
}
function mrVal(id){
  var el=R(id);if(!el)return null;
  var v=el.value.trim();
  if(v==="")return null;
  if(v.charAt(0)==="="){
    try{
      /* Support =N.L (row 0) and =N.rL (row r, 0-based) e.g. =1.0L =2.1B */
      var expr=v.substring(1).replace(/(\d+)\.(\d+)(L|B|D|H|N)/gi,function(mm,ino,rno,fld){
        var it=items[parseInt(ino)-1];
        var rIdx=parseInt(rno);
        /* skip isTot rows when resolving */
        var realRows=(it&&it.rows)?it.rows.filter(function(r){return !r.isTot;}):[];
        var row=realRows[rIdx];
        if(!row)return '0';
        var f=fld.toUpperCase();
        var val=f==='L'?row.l:f==='B'?row.b:f==='D'||f==='H'?row.d:row.n;
        return String(val||0);
      }).replace(/(\d+)\.(L|B|D|H|N)/gi,function(mm,ino,fld){
        /* =N.L shorthand = row 0 of item N */
        var it=items[parseInt(ino)-1];
        var realRows=(it&&it.rows)?it.rows.filter(function(r){return !r.isTot;}):[];
        var row=realRows[0];
        if(!row)return '0';
        var f=fld.toUpperCase();
        var val=f==='L'?row.l:f==='B'?row.b:f==='D'||f==='H'?row.d:row.n;
        return String(val||0);
      });
      var res=Function("\"use strict\";return ("+expr+")")();
      el.style.background=isNaN(res)?"#ffebee":"#e8f5e9";
      return isNaN(res)?null:res;
    }catch(e){el.style.background="#ffebee";return null;}
  }
  el.style.background="";
  var num=parseFloat(v);
  return isNaN(num)?null:num;
}
function cMR(id){
  var n=pf("mn"+id)||1;
  var lv=mrVal("ml2"+id),bv=mrVal("mb"+id),dv=mrVal("md"+id);
  var t=n;
  if(lv!==null&&lv!==0)t*=lv;
  if(bv!==null&&bv!==0)t*=bv;
  if(dv!==null&&dv!==0)t*=dv;
  var el=R("mt"+id);if(el)el.textContent=t.toFixed(3);
}
function addToEst(){
  if(!selSSR)return;
  var rows=[],qty=0,amount=0,allMr,i,id,n,l,b,dv,lbl,q,fl,flPct,flRate;
  var cf=selSSR.cf||{},sv=selSSR.scadaVal||0;
  var res=calcItemLead(cf);
  var baseRate=selSSR.rate+res.total+sv;
  allMr=document.querySelectorAll('[id^="mr"]');
  for(i=0;i<allMr.length;i++){
    id=allMr[i].id.replace('mr','');if(!R('mn'+id))continue;
    n=pf('mn'+id)||1;
    var _lv=mrVal('ml2'+id),_bv=mrVal('mb'+id),_dv=mrVal('md'+id);
    l=_lv!==null?_lv:0;b=_bv!==null?_bv:0;dv=_dv!==null?_dv:0;
    lbl=((R('ml'+id)||{}).value||'');
    fl=parseInt((R('mf'+id)||{}).value||'0');
    flRate=Math.round(baseRate*(1+fl/100)*100)/100;
    q=n;
    if(_lv!==null&&_lv!==0)q*=_lv;
    if(_bv!==null&&_bv!==0)q*=_bv;
    if(_dv!==null&&_dv!==0)q*=_dv;
    if(q>0){
      rows.push({lbl:lbl,n:n,l:l,b:b,d:dv,qty:q,fl:fl,flRate:flRate});
      qty+=q;amount+=flRate*q;
    }
  }
  if(qty<=0){alert('Quantity is 0. Enter measurements.');return;}
  qty=Math.round(qty*1000)/1000;
  amount=Math.round(amount*100)/100;
  var fr=Math.round(baseRate*100)/100;
  var existIdx=-1,k;
  for(k=0;k<items.length;k++){if(items[k].no===selSSR.no){existIdx=k;break;}}
  if(existIdx>=0){
    var ex=items[existIdx];ex.rows=ex.rows.concat(rows);
    ex.qty=Math.round((ex.qty+qty)*1000)/1000;
    ex.amount=Math.round((ex.amount+amount)*100)/100;items[existIdx]=ex;
  } else {
    items.push({id:Date.now(),no:selSSR.no,desc:selSSR.desc,unit:selSSR.unit,spec:selSSR.spec||'',
      baseRate:selSSR.rate,cf:cf,scadaVal:sv,
      leadPerUnit:Math.round(res.total*100)/100,leadMats:res.mats,
      finalRate:fr,qty:qty,rows:rows,amount:amount});
  }
  closeForm();updateAll();
}
function closeForm(){R('addForm').classList.remove('on');selSSR=null;}
function removeItem(id){items=items.filter(function(it){return it.id!==id;});updateAll();}

/* ── ROYALTY & GRAND ─────────────────────────────────────────────────── */
function calcRoyTotal(S){
  var t=0,i,cf,sF,cF;
  for(i=0;i<items.length;i++){
    cf=items[i].cf||{};
    sF=(cf.scr_sand||0)+(cf.sand||0)+(cf.quarry||0);
    cF=(cf.m40mm||0)+(cf.m20mm||0)+(cf.m12_10||0)+(cf.overmetal||0)+(cf.rubble||0);
    t+=Math.round(sF*items[i].qty*S.royS)+Math.round(cF*items[i].qty*S.royC);
  }
  return t;
}
function calcGrand(){
  var S=gS(),A=0,i;
  for(i=0;i<items.length;i++)A+=items[i].amount;
  var roy=calcRoyTotal(S);
  var mtf=window._mtfTotalVal||0;
  var ABC=A+roy+mtf;
  var specF=0; /* Area % now included in each item's finalRate — not added separately */
  var extraTotal=0;if(S.extraRows&&S.extraRows.length){for(var _ei=0;_ei<S.extraRows.length;_ei++){if(S.extraRows[_ei].pct>0)extraTotal+=Math.round(A*S.extraRows[_ei].pct/100);}}
  return ABC+Math.round(A*S.gst/100)+Math.round(A*S.cont/100)+Math.round(A*S.li/100)+specF+extraTotal;
}

function msrResolve(v,iIdx){
  if(v===""||v===null)return null;
  v=String(v).trim();
  if(v.charAt(0)==="="){
    try{
      /* Step 1: resolve =N.rL (item N, row r, field L) e.g. =1.0L */
      var expr=v.substring(1).replace(/(\d+)\.(\d+)(L|B|D|H|N)/gi,function(mm,ino,rno,fld){
        var it=items[parseInt(ino)-1];
        var rIdx=parseInt(rno);
        var realRows=(it&&it.rows)?it.rows.filter(function(r){return !r.isTot;}):[];
        var row=realRows[rIdx];
        if(!row)return '0';
        var f=fld.toUpperCase();
        return String((f==='L'?row.l:f==='B'?row.b:f==='D'||f==='H'?row.d:row.n)||0);
      });
      /* Step 2: resolve =N.L (item N, row 0, field L) */
      expr=expr.replace(/(\d+)\.(L|B|D|H|N)/gi,function(mm,ino,fld){
        var it=items[parseInt(ino)-1];
        var realRows=(it&&it.rows)?it.rows.filter(function(r){return !r.isTot;}):[];
        var row=realRows[0];
        if(!row)return '0';
        var f=fld.toUpperCase();
        return String((f==='L'?row.l:f==='B'?row.b:f==='D'||f==='H'?row.d:row.n)||0);
      });
      var res=Function("\"use strict\";return ("+expr+")")();
      return isNaN(res)?null:res;
    }catch(e){return null;}
  }
  var num=parseFloat(v);
  return isNaN(num)?null:num;
}
function msrUpd(iIdx,rIdx,el,field){
  var it=items[iIdx];if(!it||!it.rows||!it.rows[rIdx])return;
  var r=it.rows[rIdx];
  if(!r._f)r._f={};
  if(field==="lbl"){r.lbl=el.value;return;}
  else if(field==="n"){r.n=parseFloat(el.value)||1;}
  else{
    var raw=el.value.trim();
    /* avg(a,b,...) shorthand → (a+b+...)/n */
    if(/^avg\s*\(/i.test(raw)){
      var nums=raw.replace(/^avg\s*\(/i,'').replace(/\)\s*$/,'').split(',');
      var sum=0,cnt=0;
      nums.forEach(function(x){var v=parseFloat(x.trim());if(!isNaN(v)){sum+=v;cnt++;}});
      if(cnt>0){el.value=String(Math.round(sum/cnt*1000)/1000);raw=el.value;}
    }
    var isF=raw.charAt(0)==="=";
    if(isF){
      var v=msrResolve(raw,iIdx);
      if(v!==null){
        r._f[field]=raw;   /* store formula */
        r[field]=v;
        el.style.background="#e8f5e9";
      } else {
        el.style.background="#ffebee";
        return; /* incomplete formula - dont update */
      }
    } else {
      delete r._f[field];  /* clear formula if plain value */
      /* Link preserved — edit source row to change linked values */
      el.style.background="";
      var num=raw===""?null:parseFloat(raw);
      r[field]=(raw===""||isNaN(num))?null:num;
    }
  }
  /* Recalc qty */
  var n=r.n||1,t=n;
  if(r.l!==null&&r.l!==undefined&&r.l!==0)t*=r.l;
  if(r.b!==null&&r.b!==undefined&&r.b!==0)t*=r.b;
  if(r.d!==null&&r.d!==undefined&&r.d!==0)t*=r.d;
  r.qty=(r.isDeduct?-1:1)*Math.round(t*1000)/1000;
  var qel=R("msrq_"+iIdx+"_"+rIdx);
  if(qel){var _qa=Math.abs(r.qty);qel.innerHTML=r.isDeduct?'<span style="color:#c62828;font-weight:700">(-'+_qa.toFixed(3)+')</span>':'<span style="font-weight:700">'+r.qty.toFixed(3)+'</span>';}
  var tot=0;it.rows.forEach(function(rw){if(!rw.isTot)tot+=rw.qty||0;});
  it.qty=Math.round(tot*1000)/1000;
  items[iIdx]=recalcItem(it);
  /* Live update yellow total number */
  var totEl=R("mstot_"+iIdx);if(totEl)totEl.textContent=it.qty.toFixed(3);
  /* Live update Total = posSum − dedSum label */
  var lblEl=R("mstotlbl_"+iIdx);
  if(lblEl){
    var _ps=0,_ds=0;
    it.rows.forEach(function(rw){
      if(rw.isTot)return;
      if(rw.isDeduct)_ds+=Math.abs(rw.qty||0);
      else _ps+=rw.qty||0;
    });
    _ps=Math.round(_ps*1000)/1000;
    _ds=Math.round(_ds*1000)/1000;
    if(_ds>0){
      lblEl.innerHTML='Total = <b>'+_ps.toFixed(3)+'</b>'
        +' &minus; <span style="color:#c62828"><b>'+_ds.toFixed(3)+'</b></span>'
        +' = <span style="color:#1a237e"><b>'+it.qty.toFixed(3)+'</b></span>';
    } else {
      lblEl.textContent='Total';
    }
  }
  /* Refresh any rows that have _linkedFrom pointing to this iIdx/rIdx — live DOM update */
  var _anyLinked=false;
  items.forEach(function(dIt,dIIdx){
    if(!dIt.rows)return;
    var changed=false;
    dIt.rows.forEach(function(dR,dRIdx){
      if(!dR._linkedFrom)return;
      if(dR._linkedFrom.iIdx!==iIdx||dR._linkedFrom.rIdx!==rIdx)return;
      dR.l=r.l||0; dR.b=r.b||0; dR.d=r.d||0; dR.n=r.n||1;
      dR.isDeduct=(r.isDeduct||false); /* mirror deduction flag from source */
      var _nt=(dR.n||1);
      if(dR.l)_nt*=dR.l; if(dR.b)_nt*=dR.b; if(dR.d)_nt*=dR.d;
      dR.qty=(dR.isDeduct?-1:1)*Math.round(_nt*1000)/1000;
      changed=true;
      _anyLinked=true;
      /* Instantly update DOM inputs of linked row so user sees live change */
      var _dRow=R('msr_'+dIIdx+'_'+dRIdx);
      if(_dRow){
        var _ins=_dRow.querySelectorAll('input[type="number"],input:not([type])');
        /* inputs order in row: lbl, n, l, b, d — find by oninput attr */
        _dRow.querySelectorAll('input').forEach(function(inp){
          var _oi=inp.getAttribute('oninput')||'';
          if(_oi.indexOf(",'n')")>-1) inp.value=dR.n||1;
          if(_oi.indexOf(",'l')")>-1) inp.value=dR.l||'';
          if(_oi.indexOf(",'b')")>-1) inp.value=dR.b||'';
          if(_oi.indexOf(",'d')")>-1) inp.value=dR.d||'';
        });
        /* Update qty display */
        var _qa=Math.abs(dR.qty);
        var _qEl=R('msrq_'+dIIdx+'_'+dRIdx);
        if(_qEl)_qEl.innerHTML=dR.isDeduct?'<span style="color:#c62828;font-weight:700">(-'+_qa.toFixed(3)+')</span>':'<span style="font-weight:700">'+dR.qty.toFixed(3)+'</span>';
      }
    });
    if(changed){
      var _tot=0;dIt.rows.forEach(function(rw){if(!rw.isTot)_tot+=rw.qty||0;});
      dIt.qty=Math.round(_tot*1000)/1000;
      items[dIIdx]=recalcItem(dIt);
      /* Update linked item total display */
      var _tEl=R('mstot_'+dIIdx);if(_tEl)_tEl.textContent=dIt.qty.toFixed(3);
    }
  });
  clearTimeout(window._uaT);window._uaT=setTimeout(_doUpdateAllNoMS,300);
}
function editMeasRow(iIdx,rIdx){
  var el=document.querySelector("#msr_"+iIdx+"_"+rIdx+" input");
  if(el)el.focus();
}

function delMeasRow(itemIdx,rowIdx){
  var it=items[itemIdx];
  if(!it||!it.rows||!it.rows[rowIdx])return;
  if(!confirm('Delete this measurement row?'))return;
  it.rows.splice(rowIdx,1);
  if(it.meas&&it.meas[rowIdx])it.meas.splice(rowIdx,1);
  /* Recalc total */
  var tot=0;
  it.rows.forEach(function(rw){if(!rw.isTot)tot+=rw.qty;});
  it.qty=Math.round(tot*1000)/1000;
  if(it.rows.length===0){
    /* Remove item if no rows */
    if(confirm('No measurements left. Remove item?')){
      items.splice(itemIdx,1);
    }
  }else{
    items[itemIdx]=recalcItem(it);
  }
  updateAll();
}

/* ── CF EDITOR ─────────────────────────────────────────────────────────── */
var cfEditingItem=null;

function openCFEditor(itemIdx){
  cfEditingItem=itemIdx;
  var it=items[itemIdx];
  if(!it){
    if(!items||!items.length){showToast("Estimate load kara — CF editor sathi items pahije","warn");}
    else{showToast("Item sapat nahi","warn");}
    return;
  }
  var cf=it.cf||{};
  var h='<div style="margin-bottom:.8rem;padding:.5rem;background:#e3f2fd;border-radius:4px">';
  h+='<strong style="color:#1565c0">'+it.no+':</strong> '+(it.desc||"").substring(0,100)+'...';
  h+='</div>';
  h+='<div style="font-size:.62rem;color:#666;margin-bottom:.6rem">Set consumption factor for each material (leave 0 to skip)</div>';
  h+='<table style="width:100%;border-collapse:collapse">';
  
  /* All available materials from LR */
  var mats=[
    {k:'rubble',lbl:'Rubble / Murrum',u:'M3'},
    {k:'overmetal',lbl:'Oversize Metal 80mm',u:'M3'},
    {k:'sand',lbl:'Sand (natural)',u:'M3'},
    {k:'quarry',lbl:'Quarry Stone',u:'M3'},
    {k:'cement_bags',lbl:'Cement',u:'Bags'},
    {k:'scr_sand',lbl:'Screened Sand',u:'M3'},
    {k:'m40mm',lbl:'Metal 40mm',u:'M3'},
    {k:'m20mm',lbl:'Metal 20mm',u:'M3'},
    {k:'m12_10',lbl:'Metal 12-10mm',u:'M3'},
    {k:'bricks',lbl:'Bricks',u:'Nos'},
    {k:'ms_bars',lbl:'Steel MS/TMT',u:'MT'},
    {k:'bitumen',lbl:'Bitumen VG-30',u:'MT'}
  ];
  
  mats.forEach(function(m){
    var val=cf[m.k]||0;
    h+='<tr><td style="padding:.25rem;font-size:.64rem;width:40%">'+m.lbl+'</td>';
    h+='<td style="padding:.25rem;width:20%;font-size:.6rem;color:#666">per '+it.unit+'</td>';
    h+='<td style="padding:.25rem;width:20%">';
    h+='<input id="cf_'+m.k+'" type="number" step="0.001" value="'+val+'" ';
    h+='style="width:100%;padding:.3rem;font-size:.62rem;border:1px solid #ccc;border-radius:3px;text-align:right">';
    h+='</td>';
    h+='<td style="padding:.25rem;width:20%;font-size:.6rem;color:#888">'+m.u+'</td></tr>';
  });
  
  h+='</table>';
  h+='<div style="display:flex;gap:.5rem;margin-top:1rem;padding-top:1rem;border-top:1px solid #eee">';
  h+='<button onclick="saveCF()" class="btn bg" style="flex:1">Save CF</button>';
  h+='<button onclick="clearCF()" class="btn bs">Clear All</button>';
  h+='<button onclick="closeCFEditor()" class="btn" style="background:#666;color:#fff">Cancel</button>';
  h+='</div>';
  
  R('cfEditorBody').innerHTML=h;
  R('cfEditor').style.display='block';
}

function closeCFEditor(){
  R('cfEditor').style.display='none';
  cfEditingItem=null;
}
/* ── STAMP MANAGER ──────────────────────────────────────────── */
var SM_SHEETS = [
  {id:'p1', label:'Lead Chart', defaultRoles:['sde','ee']},
  {id:'p2', label:'SSR Item Search', defaultRoles:[]},
  {id:'p3', label:'Abstract', defaultRoles:['sde','ee','se_circle']},
  {id:'p4', label:'Rate Analysis', defaultRoles:['sde','ee','se_circle']},
  {id:'p5', label:'Measurement Sheet', defaultRoles:['se']},
  {id:'p6', label:'Consumption Chart', defaultRoles:['sde','ee','se_circle']},
  {id:'p7', label:'Royalty Statement', defaultRoles:['sde','ee','se_circle']},
  {id:'p8', label:'General Abstract', defaultRoles:['sde','ee','se_circle']},
  {id:'p9', label:'Steel Calc', defaultRoles:['se']},
  {id:'p11', label:'Material Testing', defaultRoles:['sde','ee','se_circle']},
  {id:'p12', label:'Lead Map', defaultRoles:['sde','ee']},
];
var SM_ROLES = [
  {key:'se',        label:'Section Engineer (SE)'},
  {key:'sde',       label:'Sub Divisional Engineer (SDE)'},
  {key:'ee',        label:'Executive Engineer (EE)'},
  {key:'se_circle', label:'Superintending Engineer (SE Circle)'},
  {key:'ce',        label:'Chief Engineer (CE)'},
];

function smGetConfig(){
  try{return JSON.parse(localStorage.getItem('smSheetCfg')||'{}');}catch(e){return {};}
}
function smSaveConfig(cfg){
  localStorage.setItem('smSheetCfg', JSON.stringify(cfg));
}
function smGetNames(){
  /* Locations: modal-saved values take priority, then cover page fields, then defaults */
  var subDiv = localStorage.getItem('stampLocSub') || ((document.getElementById('pSub')||{value:''}).value||'').trim() || 'P.W. Sub Division';
  var div    = localStorage.getItem('stampLocDiv') || ((document.getElementById('pDiv')||{value:''}).value||'').trim() || 'P.W. Division';
  var cir    = localStorage.getItem('stampLocCir') || ((document.getElementById('pCir')||{value:''}).value||'').trim() || 'P.W. Circle';
  var reg    = localStorage.getItem('stampLocReg') || ((document.getElementById('pReg')||{value:''}).value||'').trim() || 'P.W. Region';
  return {
    se:        localStorage.getItem('stampSecEng')||'',
    seTitle:   localStorage.getItem('stampSETitle')||'Section Engineer',
    sde:       localStorage.getItem('stampSubDivEng')||'',
    sdeTitle:  localStorage.getItem('stampSDETitle')||'Sub Divisional Engineer',
    de:        localStorage.getItem('stampDE')||'',
    deTitle:   localStorage.getItem('stampDETitle')||'Divisional Engineer',
    ee:        localStorage.getItem('stampEE')||'',
    eeTitle:   localStorage.getItem('stampEETitle')||'Executive Engineer',
    se_circle: localStorage.getItem('stampSECircle')||'',
    seCircleTitle: localStorage.getItem('stampSECircleTitle')||'Superintending Engineer',
    ce:        localStorage.getItem('stampCE')||'',
    ceTitle:   localStorage.getItem('stampCETitle')||'Chief Engineer',
    locSub:    subDiv,
    locDiv:    div,
    locCir:    cir,
    locReg:    reg,
    loc:       subDiv,
  };
}

/* ── Designation Auto-Fill: PWD Officer name → Designation database ── */
var SM_OFFICER_DB = (function(){
  /* Format: { 'Officer Name (or partial)': 'Designation' }
     Keys are matched case-insensitively. Add more as needed. */
  var db = {};
  /* Common PWD Maharashtra designation patterns */
  var rules = [
    /* By prefix/suffix keywords */
    {re:/section\s*engineer|junior\s*engineer|j\.?e\.?/i, desg:'Section Engineer'},
    {re:/sub\s*divis|sde|s\.d\.e|deputy\s*eng/i, desg:'Sub Divisional Engineer'},
    {re:/executive\s*eng|e\.e\.|exe\.?\s*eng/i, desg:'Executive Engineer'},
    {re:/superintend|s\.e\.|circle\s*eng/i, desg:'Superintending Engineer'},
    {re:/chief\s*eng|c\.e\./i, desg:'Chief Engineer'},
    {re:/divis.*eng|d\.e\./i, desg:'Divisional Engineer'},
  ];
  return {
    /* Lookup by free-form name or title keywords */
    lookup: function(name) {
      if (!name) return '';
      for (var i = 0; i < rules.length; i++) {
        if (rules[i].re.test(name)) return rules[i].desg;
      }
      return '';
    },
    /* Get default designation for a role */
    defaultDesg: function(roleKey) {
      var map = {
        se: 'Section Engineer',
        sde: 'Sub Divisional Engineer',
        de: 'Divisional Engineer',
        ee: 'Executive Engineer',
        se_circle: 'Superintending Engineer',
        ce: 'Chief Engineer',
      };
      return map[roleKey] || '';
    }
  };
})();

/* Called when officer name input changes — auto-fills designation if empty or still default */
function smAutoFillDesignation(nameInputId, titleInputId, roleKey) {
  var nameEl = R(nameInputId);
  var titleEl = R(titleInputId);
  if (!nameEl || !titleEl) return;
  var name = nameEl.value.trim();
  /* Try to detect designation from name keywords */
  var detected = SM_OFFICER_DB.lookup(name);
  var defaultDesg = SM_OFFICER_DB.defaultDesg(roleKey);
  var current = titleEl.value.trim();
  /* Only auto-fill if title is empty or still at default value */
  if (!current || current === defaultDesg || current === SM_OFFICER_DB.defaultDesg('se') ||
      current === SM_OFFICER_DB.defaultDesg('sde') || current === SM_OFFICER_DB.defaultDesg('ee') ||
      current === SM_OFFICER_DB.defaultDesg('se_circle') || current === SM_OFFICER_DB.defaultDesg('ce')) {
    if (detected) {
      titleEl.value = detected;
      titleEl.style.borderColor = '#22c55e'; /* green flash */
      setTimeout(function(){ titleEl.style.borderColor = ''; }, 1200);
    } else if (!current) {
      /* Fill with role default */
      titleEl.value = defaultDesg;
    }
  }
}

function smSwitchTab(n){
  for(var i=1;i<=3;i++){
    var tab=R('smTab'+i), cont=R('smTabContent'+i);
    if(!tab||!cont) continue;
    if(i===n){
      tab.style.color='#0284c7';
      tab.style.borderBottom='3px solid #0284c7';
      tab.style.fontWeight='800';
      cont.style.display='block';
    } else {
      tab.style.color='#888';
      tab.style.borderBottom='3px solid transparent';
      tab.style.fontWeight='600';
      cont.style.display='none';
    }
  }
}

function smResetToDefaults(){
  if(!confirm('Sheet-wise stamp config will be reset to default. Continue?')) return;
  localStorage.removeItem('smSheetCfg');
  smBuildSheetConfig();
  if(typeof showToast==='function') showToast('Default stamps have been reset!','success');
}

function smBuildSheetConfig(){
  var cfg = smGetConfig();
  var container = R('smSheetConfig');
  if(!container) return;
  var html2 = '';
  SM_SHEETS.forEach(function(sheet){
    var activeCfg = cfg[sheet.id] || sheet.defaultRoles;
    html2 += '<div style="background:#f8faff;border:1px solid #dde4f0;border-radius:7px;padding:.6rem .8rem">';
    html2 += '<div style="font-size:.67rem;font-weight:800;color:#1a237e;margin-bottom:.4rem">📄 '+sheet.label+'</div>';
    html2 += '<div style="display:flex;flex-wrap:wrap;gap:.4rem">';
    SM_ROLES.forEach(function(role){
      var checked = activeCfg.indexOf(role.key) !== -1;
      var chk = checked ? 'checked' : '';
      var bg = checked ? '#0284c7' : '#eee';
      var cl = checked ? '#fff' : '#555';
      html2 += '<label style="display:flex;align-items:center;gap:.3rem;cursor:pointer;background:'+bg+';color:'+cl+';padding:.22rem .5rem;border-radius:4px;font-size:.6rem;font-weight:700;transition:all .15s">';
      html2 += '<input type="checkbox" data-sheet="'+sheet.id+'" data-role="'+role.key+'" '+chk+' style="width:11px;height:11px;cursor:pointer" onchange="smCheckChange(this)">';
      html2 += role.label+'</label>';
    });
    html2 += '</div></div>';
  });
  container.innerHTML = html2;
}

function smCheckChange(el){
  var lbl = el.parentElement;
  if(el.checked){
    lbl.style.background='#0284c7';
    lbl.style.color='#fff';
  } else {
    lbl.style.background='#eee';
    lbl.style.color='#555';
  }
}

function openStampModal(){
  /* Move modal to body level so parent panel display:none doesn't hide it */
  var _m=R('stampModal');
  if(_m && _m.parentElement && _m.parentElement.id!=='__body_root__'){
    _m.parentElement.removeChild(_m);
    document.body.appendChild(_m);
  }
  R('stampModal').style.display='block';
  var names = smGetNames();
  /* Officer Names — load first */
  if(R('smSE'))       R('smSE').value       = names.se==='Section Engineer'?'':names.se;
  if(R('smSDE'))      R('smSDE').value      = names.sde==='Sub Divisional Engineer'?'':names.sde;
  if(R('smEE'))       R('smEE').value       = names.ee==='Executive Engineer'?'':names.ee;
  if(R('smSECircle')) R('smSECircle').value = names.se_circle==='Superintending Engineer'?'':names.se_circle;
  if(R('smCE'))       R('smCE').value       = names.ce==='Chief Engineer'?'':names.ce;
  /* Designations — load saved, or auto-fill from role default */
  if(R('smSETitle'))        R('smSETitle').value        = names.seTitle==='Section Engineer'?'Section Engineer':names.seTitle;
  if(R('smSDETitle'))       R('smSDETitle').value       = names.sdeTitle==='Sub Divisional Engineer'?'Sub Divisional Engineer':names.sdeTitle;
  if(R('smEETitle'))        R('smEETitle').value        = names.eeTitle==='Executive Engineer'?'Executive Engineer':names.eeTitle;
  if(R('smSECircleTitle'))  R('smSECircleTitle').value  = names.seCircleTitle==='Superintending Engineer'?'Superintending Engineer':names.seCircleTitle;
  if(R('smCETitle'))        R('smCETitle').value        = names.ceTitle==='Chief Engineer'?'Chief Engineer':names.ceTitle;
  /* Locations */
  if(R('smLocSub')) R('smLocSub').value = names.locSub==='P.W. Sub Division'?'':names.locSub;
  if(R('smLocDiv')) R('smLocDiv').value = names.locDiv==='P.W. Division'?'':names.locDiv;
  if(R('smLocCir')) R('smLocCir').value = names.locCir==='P.W. Circle'?'':names.locCir;
  if(R('smLocReg')) R('smLocReg').value = names.locReg==='P.W. Region'?'':names.locReg;
  var sh = localStorage.getItem('signHeight')||'45';
  if(R('signHeightInput')){
    R('signHeightInput').value = sh;
    if(R('signHeightVal')) R('signHeightVal').textContent = sh+'px';
  }
  smSwitchTab(1);
  smBuildSheetConfig();
}

function closeStampModal(){
  R('stampModal').style.display='none';
}

function saveStampDetails(){
  var se        = (R('smSE')       ? R('smSE').value.trim()       : '') || 'Section Engineer';
  var sde       = (R('smSDE')      ? R('smSDE').value.trim()      : '') || 'Sub Divisional Engineer';
  var ee        = (R('smEE')       ? R('smEE').value.trim()       : '') || 'Executive Engineer';
  var se_circle = (R('smSECircle') ? R('smSECircle').value.trim() : '') || 'Superintending Engineer';
  var ce        = (R('smCE')       ? R('smCE').value.trim()       : '') || 'Chief Engineer';
  var sh        = parseInt((R('signHeightInput')||{}).value)||45;
  /* Designations */
  var seTitle       = (R('smSETitle')       ? R('smSETitle').value.trim()       : '') || 'Section Engineer';
  var sdeTitle      = (R('smSDETitle')      ? R('smSDETitle').value.trim()      : '') || 'Sub Divisional Engineer';
  var eeTitle       = (R('smEETitle')       ? R('smEETitle').value.trim()       : '') || 'Executive Engineer';
  var seCircleTitle = (R('smSECircleTitle') ? R('smSECircleTitle').value.trim() : '') || 'Superintending Engineer';
  var ceTitle       = (R('smCETitle')       ? R('smCETitle').value.trim()       : '') || 'Chief Engineer';
  /* Locations */
  var locSub = (R('smLocSub') ? R('smLocSub').value.trim() : '') || '';
  var locDiv = (R('smLocDiv') ? R('smLocDiv').value.trim() : '') || '';
  var locCir = (R('smLocCir') ? R('smLocCir').value.trim() : '') || '';
  var locReg = (R('smLocReg') ? R('smLocReg').value.trim() : '') || '';

  localStorage.setItem('stampSecEng',se);
  localStorage.setItem('stampSubDivEng',sde);
  localStorage.setItem('stampEE',ee);
  localStorage.setItem('stampSECircle',se_circle);
  localStorage.setItem('stampCE',ce);
  localStorage.setItem('signHeight',sh);
  localStorage.setItem('stampSETitle',seTitle);
  localStorage.setItem('stampSDETitle',sdeTitle);
  localStorage.setItem('stampEETitle',eeTitle);
  localStorage.setItem('stampSECircleTitle',seCircleTitle);
  localStorage.setItem('stampCETitle',ceTitle);
  if(locSub) localStorage.setItem('stampLocSub',locSub);
  if(locDiv) localStorage.setItem('stampLocDiv',locDiv);
  if(locCir) localStorage.setItem('stampLocCir',locCir);
  if(locReg) localStorage.setItem('stampLocReg',locReg);
  /* Save per-sheet config from checkboxes */
  var cfg = smGetConfig();
  var checks = document.querySelectorAll('#smSheetConfig input[type=checkbox]');
  var newCfg = {};
  SM_SHEETS.forEach(function(s){ newCfg[s.id]=[]; });
  checks.forEach(function(cb){
    if(cb.checked) newCfg[cb.dataset.sheet].push(cb.dataset.role);
  });
  smSaveConfig(newCfg);
  updateAllStamps();
  var _sn=smGetNames();if(R('st_subdiv')&&_sn.locSub!=='P.W. Sub Division')R('st_subdiv').value=_sn.locSub;if(R('st_div')&&_sn.locDiv!=='P.W. Division')R('st_div').value=_sn.locDiv;if(R('st_de')&&_sn.sde!=='Sub Divisional Engineer')R('st_de').value=_sn.sde;if(R('st_ee')&&_sn.ee!=='Executive Engineer')R('st_ee').value=_sn.ee;if(typeof schApplyStamps==='function')schApplyStamps();
  closeStampModal();
  if(typeof showToast==='function') showToast('Stamps updated!','success');
}

function updateAllStamps(){
  var names = smGetNames();
  var sh=(parseInt(localStorage.getItem('signHeight'))||45)+'px';
  var cfg = smGetConfig();
  /* Update old-style global spans (backward compat) */
  function _applyStmpSpan(cls, val, placeholderTxt){
    document.querySelectorAll('.'+cls).forEach(function(e){
      var empty=!val||val.trim()==='';
      e.textContent=empty?placeholderTxt:val;
      if(e.getAttribute('data-role')){e.setAttribute('data-empty',empty?'1':'0');}
      if(empty&&!e.getAttribute('data-role')){e.setAttribute('data-empty','1');e.style.color='#bbb';e.style.fontStyle='italic';}
      else if(!empty&&!e.getAttribute('data-role')){e.setAttribute('data-empty','0');e.style.color='';e.style.fontStyle='';}
    });
  }
  _applyStmpSpan('stmp-se',        names.se,        '(Name)');
  _applyStmpSpan('stmp-sde',       names.sde,       '(Name)');
  _applyStmpSpan('stmp-loc',       names.locSub||names.loc, '');
  _applyStmpSpan('stmp-ee',        names.ee,        '(Name)');
  _applyStmpSpan('stmp-se_circle', names.se_circle, '(Name)');
  _applyStmpSpan('stmp-ce',        names.ce,        '(Name)');
  /* Sync comma spans to hide when name is empty */
  ['ee','sde','se','ce','se_circle','de'].forEach(function(rk){
    var nm = names[rk==='se_circle'?'se_circle':rk]||'';
    document.querySelectorAll('.stmp-comma-'+rk).forEach(function(e){
      e.setAttribute('data-empty',nm?'0':'1');
    });
  });
  document.querySelectorAll('.sign-space').forEach(function(e){e.style.minHeight=sh;});
  /* Re-render each sheet's stamp block dynamically */
  document.querySelectorAll('.sheet-stamp-block').forEach(function(block){
    var sheetId = block.getAttribute('data-sheet');
    var activeCfg = cfg[sheetId];
    if(!activeCfg){
      /* Use defaults */
      var found = SM_SHEETS.filter(function(s){return s.id===sheetId;});
      activeCfg = found.length ? found[0].defaultRoles : ['se','sde'];
    }
    if(!activeCfg.length){ block.style.display='none'; return; }
    block.style.display='';
    /* Build inner HTML based on active roles */
    var roleMap = {
      se:        {label:names.se,        desg:names.seTitle||'Section Engineer',        loc:names.locSub||'P.W. Sub Division'},
      sde:       {label:names.sde,       desg:names.sdeTitle||'Sub Divisional Engineer', loc:names.locSub||'P.W. Sub Division'},
      de:        {label:names.de,        desg:names.deTitle||'Divisional Engineer',     loc:names.locDiv||'P.W. Division'},
      ee:        {label:names.ee,        desg:names.eeTitle||'Executive Engineer',      loc:names.locDiv||'P.W. Division'},
      se_circle: {label:names.se_circle, desg:names.seCircleTitle||'Superintending Engineer', loc:names.locCir||'P.W. Circle'},
      ce:        {label:names.ce,        desg:names.ceTitle||'Chief Engineer',          loc:names.locReg||'P.W. Region'},
    };
    var boxes = '';
    activeCfg.forEach(function(rk, ri){
      var r = roleMap[rk];
      if(!r) return;
      var align = ri===0 ? 'left' : 'right';
      var ml = ri===0 ? '' : 'margin-left:auto;';
      boxes += '<div style="text-align:'+align+';flex:1">';
      boxes += '<div style="font-size:.72rem;line-height:1.8;font-style:italic">';
      /* 1. Officer Name */
      var _isEmpty=!r.label||r.label.trim()==='';boxes += '<div><span class="stmp-'+rk+'" data-role="'+rk+'" data-empty="'+(_isEmpty?'1':'0')+'" contenteditable="true" title="Click to edit" style="cursor:text;border-bottom:1px dashed #aaa;outline:none'+(_isEmpty?';color:#bbb;font-style:italic':'')+';" onblur="smInlineEdit(this)" onkeydown="smStampKeydown(event,this)">'+(_isEmpty?'(Name)':r.label)+'</span></div>';
      /* 2. Sign Space */
      boxes += '<div class="sign-space" style="min-height:'+sh+';border-bottom:1px solid #ccc;margin:.3rem 0;width:90%;'+ml+'"></div>';
      /* 3. Designation */
      boxes += '<div class="stmp-desg-'+rk+'" style="font-size:.65rem;font-weight:700">'+r.desg+'</div>';
      /* 4. Location */
      boxes += '<div class="stmp-loc stmp-loc-'+rk+'" style="font-size:.6rem">'+r.loc+'</div>';
      boxes += '</div></div>';
    });
    block.querySelector('div').innerHTML = boxes;
  });
}

function smStampKeydown(ev,el){
  if(ev.key==='Enter'){ev.preventDefault();el.blur();}
}
function smInlineEdit(el){
  var roleKey = el.getAttribute('data-role')||'';
  var val = el.textContent.trim();
  // If user typed the placeholder text or left blank, treat as empty
  var keyMap = {se:'stampSecEng', sde:'stampSubDivEng', de:'stampDE', ee:'stampEE', se_circle:'stampSECircle', ce:'stampCE'};
  var lsKey = keyMap[roleKey];
  if(!roleKey) return;
  if(!val || val==='(Name)'){
    // Clear the stored name
    if(lsKey) localStorage.removeItem(lsKey);
    // Show placeholder on screen
    el.textContent='(Name)';
    el.setAttribute('data-empty','1');
    el.style.color='#bbb';
    el.style.fontStyle='italic';
    // Update other same-role spans
    document.querySelectorAll('.stmp-'+roleKey).forEach(function(e){
      if(e!==el){e.textContent='(Name)';e.setAttribute('data-empty','1');e.style.color='#bbb';e.style.fontStyle='italic';}
    });
    return;
  }
  if(lsKey){ localStorage.setItem(lsKey, val); }
  el.setAttribute('data-empty','0');
  el.style.color='';
  el.style.fontStyle='';
  document.querySelectorAll('.stmp-'+roleKey).forEach(function(e){
    if(e!==el){e.textContent=val;e.setAttribute('data-empty','0');e.style.color='';e.style.fontStyle='';}
  });
}

window.addEventListener('load',function(){upCover();updateAllStamps();renderExtraRows();});


function saveCF(){
  if(cfEditingItem===null)return;
  var it=items[cfEditingItem];
  if(!it)return;
  
  var newCF={};
  var mats=['rubble','overmetal','sand','quarry','cement_bags','scr_sand',
    'm40mm','m20mm','m12_10','bricks','ms_bars','bitumen'];
  
  mats.forEach(function(k){
    var el=R('cf_'+k);
    if(el){
      var v=parseFloat(el.value)||0;
      if(v>0)newCF[k]=v;
    }
  });
  
  it.cf=newCF;
  items[cfEditingItem]=recalcItem(it);
  updateAll();
  closeCFEditor();
  showToast('CF updated: '+it.no,'success');
}

function clearCF(){
  if(!confirm('Clear all CF for this item?'))return;
  var mats=['rubble','overmetal','sand','quarry','cement_bags','scr_sand',
    'm40mm','m20mm','m12_10','bricks','ms_bars','bitumen'];
  mats.forEach(function(k){
    var el=R('cf_'+k);
    if(el)el.value=0;
  });
}


/* ── LEAD DIAGRAM ──────────────────────────────────────────────────────── */
function drawLeadDiagram(){
  /* legacy - now site plan canvas */
  spRedraw();
}

/* ════════════════════════════════════════════════════════
   SITE PLAN DRAW ENGINE
   ════════════════════════════════════════════════════════ */
var SP={
  tool:'line',      /* line | text | select */
  shapes:[],        /* all drawn shapes */
  lineStart:null,   /* first click of current line */
  dragging:null,    /* shape being dragged */
  dragOff:{x:0,y:0},
  history:[],       /* undo stack */
  mousePos:{x:0,y:0},
  selectedIdx:null, /* currently selected shape */
  GRID:20,
  /* bg image */
  bgImg:null, bgImgX:20, bgImgY:20, bgImgW:0, bgImgH:0,
  bgImgSelected:false, bgImgDragging:false, bgImgResizing:false,
  bgImgDragOX:0, bgImgDragOY:0,
  bgImgAspect:1, _bgImgOpacity:0.92
};

function spInit(){
  var cv=R('spCanvas');if(!cv)return;
  /* Default: show grid only */
  spRedraw();
}

function spSetTool(t){
  SP.tool=t;SP.lineStart=null;
  ['Line','Text','Sel'].forEach(function(n){
    var b=R('spTool'+n);if(b){
      b.style.background=t===n.toLowerCase()?'#1565c0':'#fff';
      b.style.color=t===n.toLowerCase()?'#fff':'#333';
      b.style.borderColor=t===n.toLowerCase()?'#1565c0':'#666';
    }
  });
  spStatus(t==='line'?'Click to start line | Click again to end':
           t==='text'?'Click on canvas to add text':
           'Click shape = निवडा (लाल होईल) | Delete key = हटवा | Drag = हलवा');
  spRedraw();
}

function spSnap(v){return Math.round(v/5)*5;}/* 5px snap */

function spGetPos(e){
  var cv=R('spCanvas');
  var r=cv.getBoundingClientRect();
  var scaleX=cv.width/r.width;
  var scaleY=cv.height/r.height;
  return {
    x:spSnap((e.clientX-r.left)*scaleX),
    y:spSnap((e.clientY-r.top)*scaleY)
  };
}

function spClick(e){
  if(SP.dragging)return;
  var p=spGetPos(e);
  if(SP.tool==='line'){
    if(!SP.lineStart){
      SP.lineStart=p;
      spStatus('First point set ('+p.x+','+p.y+') — Click again to draw line');
      spRedraw();
    }else{
      var styleEl=R('spLineStyle');
      var widthEl=R('spLineWidth');
      var style=styleEl?styleEl.value:'solid';
      var width=widthEl?(parseInt(widthEl.value)||2):2;
      spSaveHistory();
      SP.shapes.push({type:'line',x1:SP.lineStart.x,y1:SP.lineStart.y,
        x2:p.x,y2:p.y,style:style,width:width});
      SP.lineStart=null;
      spStatus('Line added — Click to start next line');
      spRedraw();
    }
  }else if(SP.tool==='text'){
    var txt=prompt('Text enter kara:','');
    if(txt&&txt.trim()){
      spSaveHistory();
      SP.shapes.push({type:'text',x:p.x,y:p.y,text:txt.trim(),size:13});
      spRedraw();
    }
  }
}

function spDblClick(e){
  var p=spGetPos(e);
  /* Double click: delete nearest shape */
  var best=-1,bestD=20;
  SP.shapes.forEach(function(s,i){
    var d=spDistToShape(s,p);
    if(d<bestD){bestD=d;best=i;}
  });
  if(best>=0){spSaveHistory();SP.shapes.splice(best,1);spRedraw();}
}

function spMouseDown(e){
  if(SP.tool!=='select')return;
  var p=spGetPos(e);

  /* bgImg: check resize handle first, then drag */
  if(SP.bgImg){
    var rhx=SP.bgImgX+SP.bgImgW-8, rhy=SP.bgImgY+SP.bgImgH-8;
    if(p.x>=rhx&&p.x<=rhx+10&&p.y>=rhy&&p.y<=rhy+10){
      SP.bgImgResizing=true;SP.bgImgSelected=true;spRedraw();return;
    }
    if(p.x>=SP.bgImgX&&p.x<=SP.bgImgX+SP.bgImgW&&
       p.y>=SP.bgImgY&&p.y<=SP.bgImgY+SP.bgImgH){
      SP.bgImgDragging=true;SP.bgImgSelected=true;
      SP.bgImgDragOX=p.x-SP.bgImgX;SP.bgImgDragOY=p.y-SP.bgImgY;
      spRedraw();return;
    }
    SP.bgImgSelected=false;spRedraw();
  }

  var best=-1,bestD=20;
  SP.shapes.forEach(function(s,i){
    var d=spDistToShape(s,p);
    if(d<bestD){bestD=d;best=i;}
  });
  if(best>=0){
    /* deselect old */
    if(SP.selectedIdx!==null&&SP.shapes[SP.selectedIdx])SP.shapes[SP.selectedIdx].selected=false;
    SP.dragging=best;
    SP.selectedIdx=best;
    SP.shapes[best].selected=true;
    var s=SP.shapes[best];
    if(s.type==='text'){SP.dragOff={x:p.x-s.x,y:p.y-s.y};}
    else if(s.type==='line'){SP.dragOff={x:p.x,y:p.y,ox1:s.x1,oy1:s.y1,ox2:s.x2,oy2:s.y2};}
    else{SP.dragOff={x:p.x-s.x,y:p.y-s.y};}
    spRedraw();
  }else{
    /* clicked empty area — deselect */
    if(SP.selectedIdx!==null&&SP.shapes[SP.selectedIdx]){
      SP.shapes[SP.selectedIdx].selected=false;
      SP.selectedIdx=null;
      spRedraw();
    }
  }
}

function spDeleteSelected(){
  if(SP.selectedIdx!==null&&SP.shapes[SP.selectedIdx]){
    spSaveHistory();
    SP.shapes.splice(SP.selectedIdx,1);
    SP.selectedIdx=null;
    spRedraw();
    spStatus('Shape deleted ✓');
  }
}

function spMouseMove(e){
  var p=spGetPos(e);
  SP.mousePos=p;
  if(SP.tool==='line'&&SP.lineStart){spRedraw();return;}
  /* bgImg drag/resize */
  if(SP.bgImgDragging){
    SP.bgImgX=p.x-SP.bgImgDragOX;SP.bgImgY=p.y-SP.bgImgDragOY;
    spRedraw();return;
  }
  if(SP.bgImgResizing){
    var newW=Math.max(40,p.x-SP.bgImgX);
    SP.bgImgW=newW;
    SP.bgImgH=e.shiftKey?Math.round(newW/SP.bgImgAspect):Math.max(30,p.y-SP.bgImgY);
    spRedraw();return;
  }
  if(SP.dragging===null||SP.dragging===undefined)return;
  var s=SP.shapes[SP.dragging];if(!s)return;
  if(s.type==='text'||s.type==='site'||s.type==='quarry'){
    s.x=p.x-SP.dragOff.x;s.y=p.y-SP.dragOff.y;
  }else if(s.type==='line'){
    var dx=p.x-SP.dragOff.x,dy=p.y-SP.dragOff.y;
    s.x1=SP.dragOff.ox1+dx;s.y1=SP.dragOff.oy1+dy;
    s.x2=SP.dragOff.ox2+dx;s.y2=SP.dragOff.oy2+dy;
  }
  spRedraw();
}

function spMouseUp(e){SP.dragging=null;SP.bgImgDragging=false;SP.bgImgResizing=false;}

function spDistToShape(s,p){
  if(s.type==='text'||s.type==='site'||s.type==='quarry'){
    return Math.hypot(s.x-p.x,s.y-p.y);
  }else if(s.type==='line'){
    /* dist to line segment */
    var dx=s.x2-s.x1,dy=s.y2-s.y1,len2=dx*dx+dy*dy;
    if(!len2)return Math.hypot(s.x1-p.x,s.y1-p.y);
    var t=Math.max(0,Math.min(1,((p.x-s.x1)*dx+(p.y-s.y1)*dy)/len2));
    return Math.hypot(s.x1+t*dx-p.x,s.y1+t*dy-p.y);
  }
  return 999;
}

function spAddQuarry(){
  var name=prompt('Quarry name / material:','Quarry');
  if(!name)return;
  spSaveHistory();
  SP.shapes.push({type:'quarry',x:200,y:200,text:name});
  spRedraw();
  spStatus('Quarry added — drag with Select tool to reposition');
}

function spAddSite(){
  var name=prompt('Site name:','Work Site');
  if(!name)name='Work Site';
  spSaveHistory();
  SP.shapes.push({type:'site',x:430,y:300,text:name});
  spRedraw();
}

function spSaveHistory(){SP.history.push(JSON.parse(JSON.stringify(SP.shapes)));if(SP.history.length>30)SP.history.shift();}
function spUndo(){if(SP.history.length){SP.shapes=SP.history.pop();spRedraw();}}
function spClear(){spSaveHistory();SP.shapes=[];SP.lineStart=null;spRedraw();}
function spStatus(msg){var el=R('spStatus');if(el)el.textContent=msg;}

function spRedraw(){
  if(typeof SP==='undefined'||!SP)return;
  var cv=R('spCanvas');if(!cv)return;
  var ctx=cv.getContext('2d');
  ctx.clearRect(0,0,cv.width,cv.height);
  /* Plain white - no grid */

  /* Draw background image if present */
  if(SP.bgImg){
    ctx.save();
    ctx.globalAlpha=SP._bgImgOpacity||0.92;
    ctx.drawImage(SP.bgImg,SP.bgImgX,SP.bgImgY,SP.bgImgW,SP.bgImgH);
    ctx.globalAlpha=1;
    if(SP.bgImgSelected){
      ctx.strokeStyle='#7b1fa2';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);
      ctx.strokeRect(SP.bgImgX,SP.bgImgY,SP.bgImgW,SP.bgImgH);
      ctx.setLineDash([]);
      /* resize handle */
      ctx.fillStyle='#7b1fa2';
      ctx.fillRect(SP.bgImgX+SP.bgImgW-8,SP.bgImgY+SP.bgImgH-8,10,10);
      ctx.font='9px Arial';ctx.fillStyle='#7b1fa2';
      ctx.fillText('📷 Drag/resize — Select tool',SP.bgImgX+4,SP.bgImgY+12);
    }
    ctx.restore();
  }

  /* Draw all shapes */
  SP.shapes.forEach(function(s){
    ctx.save();
    /* selection highlight: red color when selected */
    var isSelected=s.selected;
    ctx.strokeStyle=isSelected?'#e53935':'#000';ctx.fillStyle=isSelected?'#e53935':'#000';
    if(s.type==='line'){
      ctx.lineWidth=s.width||2;
      ctx.strokeStyle=isSelected?'#e53935':'#000';
      if(s.style==='dashed')ctx.setLineDash([10,6]);
      else if(s.style==='double')ctx.setLineDash([]);
      else ctx.setLineDash([]);
      ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();
      /* endpoint dots when selected */
      if(isSelected){
        [[s.x1,s.y1],[s.x2,s.y2]].forEach(function(pt){
          ctx.fillStyle='#e53935';ctx.beginPath();ctx.arc(pt[0],pt[1],4,0,Math.PI*2);ctx.fill();
        });
      }
      /* Double line style */
      if(s.style==='double'){
        var dx=s.x2-s.x1,dy=s.y2-s.y1,len=Math.hypot(dx,dy)||1;
        var nx=-dy/len*4,ny=dx/len*4;
        ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(s.x1+nx,s.y1+ny);ctx.lineTo(s.x2+nx,s.y2+ny);ctx.stroke();
        ctx.beginPath();ctx.moveTo(s.x1-nx,s.y1-ny);ctx.lineTo(s.x2-nx,s.y2-ny);ctx.stroke();
      }
      /* Railway hatch */
      if(s.style==='railway'){
        ctx.setLineDash([]);
        var dx=s.x2-s.x1,dy=s.y2-s.y1,len=Math.hypot(dx,dy)||1;
        var nx=-dy/len*7,ny=dx/len*7;
        var steps=Math.max(1,Math.floor(len/14));
        for(var i=0;i<=steps;i++){
          var t=i/steps;
          var hx=s.x1+dx*t,hy=s.y1+dy*t;
          ctx.lineWidth=1.5;
          ctx.beginPath();ctx.moveTo(hx-nx,hy-ny);ctx.lineTo(hx+nx,hy+ny);ctx.stroke();
        }
      }
    }else if(s.type==='text'){
      ctx.font=(s.size||13)+'px Arial';ctx.fillStyle='#000';
      ctx.fillText(s.text,s.x,s.y);
    }else if(s.type==='quarry'){
      /* Black & white: triangle outline + hatch fill */
      ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(s.x,s.y-22);ctx.lineTo(s.x-20,s.y+12);ctx.lineTo(s.x+20,s.y+12);ctx.closePath();
      ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#000';ctx.stroke();
      /* Hatch inside triangle */
      ctx.save();ctx.clip();
      ctx.lineWidth=0.8;ctx.strokeStyle='#555';
      for(var hi=-30;hi<30;hi+=5){ctx.beginPath();ctx.moveTo(s.x+hi-20,s.y-22);ctx.lineTo(s.x+hi+20,s.y+12);ctx.stroke();}
      ctx.restore();
      /* Label */
      ctx.font='bold 11px Arial';ctx.fillStyle='#000';ctx.textAlign='center';
      ctx.fillText(s.text,s.x,s.y+26);ctx.textAlign='left';
    }else if(s.type==='site'){
      /* Black & white: circle + text */
      ctx.lineWidth=2;ctx.strokeStyle='#000';ctx.fillStyle='#fff';
      ctx.beginPath();ctx.arc(s.x,s.y,24,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.font='bold 10px Arial';ctx.fillStyle='#000';ctx.textAlign='center';
      var words=s.text.split(' ');
      if(words.length>1){
        ctx.fillText(words[0],s.x,s.y+1);
        ctx.font='9px Arial';ctx.fillText(words.slice(1).join(' '),s.x,s.y+12);
      }else{
        ctx.fillText(s.text.substring(0,10),s.x,s.y+4);
      }
      ctx.textAlign='left';
    }
    ctx.restore();
  });

  /* Preview line while drawing */
  if(SP.tool==='line'&&SP.lineStart){
    ctx.save();
    ctx.strokeStyle='#555';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.globalAlpha=0.6;
    ctx.beginPath();ctx.moveTo(SP.lineStart.x,SP.lineStart.y);
    ctx.lineTo(SP.mousePos.x,SP.mousePos.y);ctx.stroke();
    ctx.setLineDash([]);ctx.globalAlpha=1;
    /* Start dot */
    ctx.fillStyle='#000';ctx.beginPath();
    ctx.arc(SP.lineStart.x,SP.lineStart.y,4,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
}

function spSavePNG(){
  var cv=R('spCanvas');if(!cv)return;
  var a=document.createElement('a');
  a.download='SitePlan.png';
  a.href=cv.toDataURL('image/png');
  a.click();
  showToast('Site Plan PNG saved!','success');
}

/* ══════════════════════════════════════════════
   LEAD MAP — FIREBASE CLOUD SAVE / LOAD
══════════════════════════════════════════════ */
function spSaveToCloud(){
  if(!window.firebase||!firebase.firestore){showToast('Firebase ready नाही','error');return;}
  var data={
    shapes: SP.shapes,
    bgImgX: SP.bgImgX, bgImgY: SP.bgImgY,
    bgImgW: SP.bgImgW, bgImgH: SP.bgImgH,
    savedAt: firebase.firestore.FieldValue.serverTimestamp(),
    savedBy: (window.CU&&CU.email)||'unknown'
  };
  /* bgImg (background image) base64 save करा */
  if(SP.bgImg){
    try{
      var tc=document.createElement('canvas');
      tc.width=SP.bgImgW||400;tc.height=SP.bgImgH||300;
      tc.getContext('2d').drawImage(SP.bgImg,0,0,tc.width,tc.height);
      data.bgImgData=tc.toDataURL('image/jpeg',0.55); /* compressed */
    }catch(e){ /* cross-origin image असेल तर skip */ }
  }
  showToast('Lead Map Cloud ला save होत आहे...','info');
  firebase.firestore().collection('config').doc('draw_lead_map').set(data)
    .then(function(){
      showToast('✅ Lead Map Cloud वर save झाला!','success');
      spStatus('Cloud Save: यशस्वी ✓');
    })
    .catch(function(e){showToast('Lead Map save error: '+e.message,'error');});
}

function spLoadFromCloud(){
  if(!window.firebase||!firebase.firestore){showToast('Firebase ready नाही','error');return;}
  showToast('Lead Map Cloud वरून load होत आहे...','info');
  firebase.firestore().collection('config').doc('draw_lead_map').get()
    .then(function(doc){
      if(!doc.exists||!doc.data().shapes){
        showToast('Cloud वर Lead Map सापडला नाही. आधी Save करा.','error');return;
      }
      var d=doc.data();
      spSaveHistory();
      SP.shapes=d.shapes||[];
      /* bg image restore */
      SP.bgImg=null;
      if(d.bgImgData){
        var img=new Image();
        img.onload=function(){
          SP.bgImg=img;
          SP.bgImgX=d.bgImgX||20;SP.bgImgY=d.bgImgY||20;
          SP.bgImgW=d.bgImgW||img.width;SP.bgImgH=d.bgImgH||img.height;
          SP.bgImgAspect=(img.height&&img.width)?img.width/img.height:1;
          spRedraw();
          var btn=R('spRemoveImgBtn');if(btn)btn.style.display='';
          var ow=R('spImgOpacityWrap');if(ow)ow.style.display='flex';
        };
        img.src=d.bgImgData;
      }else{
        SP.bgImgX=20;SP.bgImgY=20;SP.bgImgW=0;SP.bgImgH=0;
      }
      spRedraw();
      showToast('✅ Lead Map Cloud वरून load झाला!','success');
      spStatus('Cloud Load: यशस्वी ✓');
    })
    .catch(function(e){showToast('Lead Map load error: '+e.message,'error');});
}

/* ══════════════════════════════════════════════
   LEAD MAP — IMAGE / PDF IMPORT
══════════════════════════════════════════════ */
function spImportImage(){
  var inp=R('spImgInput');if(inp){inp.value='';inp.click();}
}

function spHandleImport(input){
  var file=input.files[0];if(!file)return;
  var statusEl=R('spImportStatus');
  function setStatus(msg,color){if(statusEl){statusEl.textContent=msg;statusEl.style.color=color||'#555';}}

  if(file.type==='application/pdf'){
    setStatus('PDF load होत आहे...','#7b1fa2');
    _spLoadPdfJs(function(){
      if(!window.pdfjsLib){setStatus('PDF.js load झाला नाही. PNG/JPG वापरा.','#c00');return;}
      var reader=new FileReader();
      reader.onload=function(e){
        var pdfData=new Uint8Array(e.target.result);
        pdfjsLib.getDocument({data:pdfData}).promise.then(function(pdf){
          setStatus('Page 1/'+pdf.numPages+' render होत आहे...','#7b1fa2');
          pdf.getPage(1).then(function(page){
            var vp=page.getViewport({scale:2.0});
            var tc=document.createElement('canvas');
            tc.width=vp.width;tc.height=vp.height;
            page.render({canvasContext:tc.getContext('2d'),viewport:vp}).promise.then(function(){
              var img=new Image();
              img.onload=function(){_spSetBgImage(img);setStatus('PDF imported! ✓ (Page 1)','#1b5e20');};
              img.src=tc.toDataURL('image/png');
            });
          });
        }).catch(function(err){setStatus('PDF error: '+err.message,'#c00');});
      };
      reader.readAsArrayBuffer(file);
    });
    return;
  }

  if(!file.type.match(/^image\//)){setStatus('फक्त JPG, PNG, PDF फाईल select करा.','#c00');return;}
  setStatus('Image load होत आहे...','#7b1fa2');
  var reader=new FileReader();
  reader.onload=function(e){
    var img=new Image();
    img.onload=function(){_spSetBgImage(img);setStatus('Image imported! ✓  Select tool वापरून position करा.','#1b5e20');};
    img.onerror=function(){setStatus('Image load error.','#c00');};
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}

function _spSetBgImage(img){
  var cv=R('spCanvas');if(!cv)return;
  SP.bgImg=img;SP.bgImgAspect=img.width/img.height;
  var maxW=cv.width*0.88,maxH=cv.height*0.88;
  var ratio=Math.min(maxW/img.width,maxH/img.height,1);
  SP.bgImgW=Math.round(img.width*ratio);
  SP.bgImgH=Math.round(img.height*ratio);
  SP.bgImgX=Math.round((cv.width-SP.bgImgW)/2);
  SP.bgImgY=Math.round((cv.height-SP.bgImgH)/2);
  SP.bgImgSelected=true;
  var btn=R('spRemoveImgBtn');if(btn)btn.style.display='';
  var opWrap=R('spImgOpacityWrap');if(opWrap)opWrap.style.display='flex';
  if(typeof spSetTool==='function')spSetTool('select');
  spRedraw();
}

function spRemoveBgImg(){
  if(!SP.bgImg)return;
  if(!confirm('Background image remove करायची?'))return;
  SP.bgImg=null;SP.bgImgSelected=false;
  var btn=R('spRemoveImgBtn');if(btn)btn.style.display='none';
  var opWrap=R('spImgOpacityWrap');if(opWrap)opWrap.style.display='none';
  var statusEl=R('spImportStatus');if(statusEl)statusEl.textContent='';
  spRedraw();
}

function spImgOpacity(val){
  SP._bgImgOpacity=parseFloat(val)||0.92;
  var lbl=R('spImgOpacityVal');if(lbl)lbl.textContent=Math.round(SP._bgImgOpacity*100)+'%';
  spRedraw();
}

function _spLoadPdfJs(cb){
  if(window.pdfjsLib){cb();return;}
  var s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  s.onload=function(){
    if(window.pdfjsLib)
      pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    setTimeout(cb,200);
  };
  s.onerror=function(){cb();};
  document.head.appendChild(s);
}


/* ── LEAD CHART: Dynamic Sub-Row Addition ── */
var LC_SUB_ITEMS=[{"label":"Sand (Natural)","matKeys":["sand"],"llKey":"sand","unit":"Cu.M."},{"label":"Screened / Crushed Sand","matKeys":["scr_sand"],"llKey":"sand","unit":"Cu.M."},{"label":"Metal 20mm","matKeys":["m20mm"],"llKey":"sand","unit":"Cu.M."},{"label":"Metal 12-10mm","matKeys":["m12_10"],"llKey":"sand","unit":"Cu.M."},{"label":"Metal 40mm (CB)","matKeys":["m40mm"],"llKey":"overmetal","unit":"Cu.M."},{"label":"Oversize Metal 80mm","matKeys":["overmetal"],"llKey":"overmetal","unit":"Cu.M."},{"label":"Quarry / Soling Stone","matKeys":["quarry"],"llKey":"quarry","unit":"Cu.M."},{"label":"Rubble / Murrum / Earth","matKeys":["rubble"],"llKey":"rubble","unit":"Cu.M."},{"label":"Cement (Bags)","matKeys":["cement_bags"],"llKey":"cement_bags","unit":"MT"},{"label":"Bricks","matKeys":["bricks"],"llKey":"bricks","unit":"Per 1000 Nos."},{"label":"Steel MS / TMT","matKeys":["ms_bars"],"llKey":"ms_bars","unit":"MT"},{"label":"Bitumen (VG-30)","matKeys":["bitumen"],"llKey":"bitumen","unit":"MT per Cum","isBitumen":true},{"label":"Tiles (Half Round/Roofing/Manlore)","matKeys":["tiles_hr"],"llKey":"tiles_hr","unit":"Cu.M."},{"label":"Flooring Tiles Ceramic/Marbonate","matKeys":["flooring"],"llKey":"flooring","unit":"Sq.M."},{"label":"GI Sheet","matKeys":["gi_sheet"],"llKey":"gi_sheet","unit":"MT"},{"label":"Manure / Sludge","matKeys":[],"llKey":"manure","unit":"Cu.M."},{"label":"ConcreteBlock (FORM)","matKeys":[],"llKey":"concrete_block","unit":"Cu.M."}];
var LC_EXTRA=[];/* Extra rows added by user */

function lcAddRow(){
  /* Show item selector modal */
  var modal=document.getElementById('lcAddModal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='lcAddModal';
    modal.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center';
    modal.innerHTML='<div style="background:#fff;border-radius:10px;padding:1.2rem 1.5rem;min-width:280px;max-width:360px;box-shadow:0 4px 20px rgba(0,0,0,.3)">'
      +'<div style="font-weight:700;font-size:.85rem;margin-bottom:.8rem;color:#1a237e">+ Add Lead Row</div>'
      +'<div style="font-size:.72rem;margin-bottom:.4rem;color:#555">Select Name of Item:</div>'
      +'<select id="lcSubSel" style="width:100%;padding:.35rem .5rem;border:1px solid #ccc;border-radius:5px;font-size:.75rem;margin-bottom:.6rem">'
      +'<option value="">-- Select Item --</option>'
      +(typeof LC_SUB_ITEMS!=='undefined'?LC_SUB_ITEMS:[]).map(function(s,i){return'<option value="'+i+'">'+s.label+'</option>';}).join('')
      +'</select>'
      +'<div style="font-size:.72rem;margin-bottom:.2rem;color:#555">Location (optional):</div>'
      +'<input type="text" id="lcSubLoc" placeholder="e.g. Sirsala Quarry" style="width:100%;padding:.3rem .5rem;border:1px solid #ccc;border-radius:5px;font-size:.72rem;margin-bottom:.7rem;box-sizing:border-box">'
      +'<div style="display:flex;gap:.5rem;justify-content:flex-end">'
      +'<button onclick="lcAddModalClose()" style="padding:.3rem .8rem;border:1px solid #ccc;border-radius:5px;font-size:.72rem;cursor:pointer;background:#f5f5f5">Cancel</button>'
      +'<button onclick="lcAddModalConfirm()" style="padding:.3rem .8rem;border:none;border-radius:5px;font-size:.72rem;cursor:pointer;background:#1a237e;color:#fff;font-weight:700">Add Row</button>'
      +'</div>'
      +'</div>';
    document.body.appendChild(modal);
  } else {
    modal.style.display='flex';
  }
  var sel=document.getElementById('lcSubSel');
  if(sel)sel.value='';
  var loc=document.getElementById('lcSubLoc');
  if(loc)loc.value='';
}

function lcAddModalClose(){
  var modal=document.getElementById('lcAddModal');
  if(modal)modal.style.display='none';
}

function lcAddModalConfirm(){
  var sel=document.getElementById('lcSubSel');
  var loc=document.getElementById('lcSubLoc');
  if(!sel||sel.value===''){showToast('Select an item','warn');return;}
  var si=parseInt(sel.value);
  var sub=LC_SUB_ITEMS[si];
  if(!sub)return;
  var locVal=loc?loc.value.trim():'';
  var ni=13000+Math.floor(Math.random()*50000);
  var modal=document.getElementById('lcAddModal');
  if(modal)modal.style.display='none';
  var tbody=document.getElementById('lctBody');if(!tbody)return;
  var tr=document.createElement('tr');
  tr.id='lcrow_'+ni;tr.className='lc-row-zero';tr.style.height='2rem';
  var mkStr=sub.matKeys.join(',');
  tr.innerHTML=
    '<td style="padding:.3rem .4rem;font-size:.63rem">'+sub.label
    +' <span class="noprt" style="color:#c00;cursor:pointer;margin-left:.4rem;font-weight:700"'
    +' data-ni="'+ni+'" data-mk="'+mkStr+'" data-lk="'+sub.llKey+'">✕</span></td>'
    +'<td class="r" style="padding:.3rem .4rem;white-space:nowrap;font-size:.62rem">'+sub.unit+'</td>'
    +'<td class="r" style="padding:.3rem .4rem">'
    +'<input class="km-in noprt" type="number" id="lkm_'+ni+'" value="0" min="0" step="0.5"'
    +' style="width:80px;padding:.25rem;text-align:right;border:1px solid #ccc;border-radius:3px">'
    +'<span class="prtonly" id="lkmp_'+ni+'" style="font-weight:600"></span></td>'
    +'<td style="padding:.3rem .4rem">'
    +'<input class="noprt" type="text" id="lloc_'+ni+'" value="'+locVal+'" placeholder="Location"'
    +' style="width:130px;padding:.25rem;font-size:.6rem;border:1px solid #ccc;border-radius:3px">'
    +'<span class="prtonly" id="llocp_'+ni+'">'+locVal+'</span></td>'
    +'<td class="r" style="padding:.3rem .4rem"><span class="chg-val" id="lchg_'+ni+'">0.000</span></td>';
  tbody.appendChild(tr);
  /* bind ✕ */
  var xBtn=tr.querySelector('[data-ni]');
  if(xBtn)xBtn.onclick=function(){
    var xni=this.getAttribute('data-ni');
    var xmk=this.getAttribute('data-mk');
    var xlk=this.getAttribute('data-lk');
    var el=document.getElementById('lcrow_'+xni);if(el)el.remove();
    if(xmk)xmk.split(',').forEach(function(k){if(k)LEAD_KM[k]=0;});
    if(xlk)LEAD_KM[xlk]=0;
    updateAll();
  };
  /* bind km input */
  (function(id,s){
    var kmEl=document.getElementById('lkm_'+id);
    var locEl=document.getElementById('lloc_'+id);
    if(kmEl)kmEl.oninput=function(){
      var v=parseFloat(this.value)||0;
      s.matKeys.forEach(function(k){LEAD_KM[k]=v;});
      LEAD_KM[s.llKey]=v;
      var chg=s.isBitumen?v*10:(typeof lkup==='function'?lkup(s.llKey,v):0);
      var ce=document.getElementById('lchg_'+id);if(ce)ce.textContent=(Math.round(chg*1000)/1000).toFixed(3);
      var ke=document.getElementById('lkmp_'+id);if(ke)ke.textContent=v>0?v.toFixed(1):'';
      var re2=document.getElementById('lcrow_'+id);if(re2)re2.className=v>0?'':'lc-row-zero';
      updateAll();
    };
    if(locEl)locEl.oninput=function(){
      var lcp=document.getElementById('llocp_'+id);if(lcp)lcp.textContent=this.value;
    };
  })(ni,sub);
  showToast(sub.label+' added!','success');
}

function lcRemoveRow(ni){
  var rowEl=document.getElementById('lcrow_'+ni);
  if(rowEl)rowEl.remove();
  /* Reset LEAD_KM for this entry */
  var entry=LC_EXTRA.find(function(e){return e.extraIdx===ni;});
  if(entry){
    entry.matKeys.forEach(function(k){
      /* Only reset if no other active row sets this key */
      var stillSet=false;
      for(var i=0;i<LCD.length;i++){
        var kmEl=document.getElementById('lkm_'+i);
        if(kmEl&&parseFloat(kmEl.value)>0&&LCD[i].matKeys&&LCD[i].matKeys.indexOf(k)>=0){stillSet=true;break;}
      }
      if(!stillSet)LEAD_KM[k]=0;
    });
    LC_EXTRA=LC_EXTRA.filter(function(e){return e.extraIdx!==ni;});
  }
  updateAll();
}

/* ═══ MEASUREMENT: Add Row + Deduction ═══ */
function msrAddRow(iIdx){
  var it=items[iIdx];if(!it)return;
  if(!it.rows)it.rows=[];
  /* Insert before any isTot row so new row appears above total */
  var totIdx=it.rows.findIndex(function(r){return r.isTot;});
  var newRow={lbl:'',n:1,l:0,b:0,d:0,qty:0,fl:0};
  if(totIdx>=0) it.rows.splice(totIdx,0,newRow);
  else it.rows.push(newRow);
  rMS();updateAll();
}
function msrAddDeduction(iIdx){
  var it=items[iIdx];if(!it)return;
  if(!it.rows)it.rows=[];
  var modal=document.createElement('div');
  modal.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center';
  modal.innerHTML='<div style="background:#fff;border-radius:10px;padding:1.2rem 1.5rem;width:360px;box-shadow:0 6px 24px rgba(0,0,0,.3);max-height:90vh;overflow-y:auto">'
    +'<b style="color:#c62828;font-size:.88rem">\u2796 Deduction Add \u0915\u0930\u093e</b>'
    +'<div style="font-size:.64rem;color:#888;margin:.15rem 0 .6rem">Deduct quantity for openings, holes, voids</div>'

    +'<div style="font-size:.65rem;color:#555;margin-bottom:.18rem">Description / Remark <span style="color:#c62828">*</span></div>'
    +'<input id="_dLbl" type="text" placeholder="e.g. Deduct door opening 1.2×2.1 or Window 1×1.2" style="width:100%;padding:.3rem;border:1.5px solid #c62828;border-radius:5px;font-size:.72rem;margin-bottom:.5rem;box-sizing:border-box">'

    +'<div style="font-size:.65rem;color:#777;margin-bottom:.18rem">Measurements — <span style="color:#b26a00">you can write avg(a,b,c) for average</span></div>'
    +'<div style="display:flex;gap:.4rem;margin-bottom:.4rem">'
    +'<div style="flex:1"><div style="font-size:.65rem;color:#777">Nos.</div><input id="_dN" type="number" value="1" min="0" step="any" style="width:100%;padding:.28rem;border:1px solid #ccc;border-radius:4px;font-size:.72rem;box-sizing:border-box"></div>'
    +'<div style="flex:1.2"><div style="font-size:.65rem;color:#777">L</div><input id="_dL" type="text" value="" placeholder="avg(a,b)" step="any" style="width:100%;padding:.28rem;border:1px solid #ccc;border-radius:4px;font-size:.72rem;box-sizing:border-box"></div>'
    +'<div style="flex:1.2"><div style="font-size:.65rem;color:#777">B</div><input id="_dB" type="text" value="" placeholder="avg(a,b)" step="any" style="width:100%;padding:.28rem;border:1px solid #ccc;border-radius:4px;font-size:.72rem;box-sizing:border-box"></div>'
    +'<div style="flex:1.2"><div style="font-size:.65rem;color:#777">D/H</div><input id="_dD" type="text" value="" placeholder="avg(a,b)" step="any" style="width:100%;padding:.28rem;border:1px solid #ccc;border-radius:4px;font-size:.72rem;box-sizing:border-box"></div>'
    +'</div>'

    +'<div id="_dQtyPrev" style="font-size:.68rem;color:#c62828;font-weight:700;text-align:right;margin-bottom:.35rem;min-height:1rem"></div>'

    +'<div style="font-size:.65rem;color:#555;margin-bottom:.18rem">Comment / Explanation <span style="color:#888;font-size:.6rem">(optional — will appear in measurement sheet)</span></div>'
    +'<input id="_dComment" type="text" placeholder="e.g. 90% of total length as per IS, avg of 3 readings" style="width:100%;padding:.3rem;border:1px solid #ccc;border-radius:5px;font-size:.68rem;margin-bottom:.6rem;box-sizing:border-box">'

    +'<div style="display:flex;gap:.4rem;justify-content:flex-end">'
    +'<button id="_dCancel" style="padding:.28rem .8rem;border:1px solid #ccc;border-radius:5px;font-size:.72rem;cursor:pointer">Cancel</button>'
    +'<button id="_dAdd" style="padding:.28rem .8rem;border:none;border-radius:5px;font-size:.72rem;cursor:pointer;background:#c62828;color:#fff;font-weight:700">\u2796 Deduction Add</button>'
    +'</div></div>';
  document.body.appendChild(modal);
  setTimeout(function(){var el=document.getElementById('_dLbl');if(el)el.focus();},80);

  /* Live qty preview */
  function _parseAvg(v){
    v=(v||'').trim();
    if(!v)return 0;
    if(/^avg\s*\(/i.test(v)){
      var nums=v.replace(/^avg\s*\(/i,'').replace(/\)\s*$/,'').split(',');
      var sum=0,cnt=0;
      nums.forEach(function(x){var n=parseFloat(x.trim());if(!isNaN(n)){sum+=n;cnt++;}});
      return cnt>0?Math.round(sum/cnt*1000)/1000:0;
    }
    var n=parseFloat(v);return isNaN(n)?0:n;
  }
  function _updatePreview(){
    var n=Math.abs(parseFloat(document.getElementById('_dN').value)||1);
    var l=_parseAvg(document.getElementById('_dL').value);
    var b=_parseAvg(document.getElementById('_dB').value);
    var d=_parseAvg(document.getElementById('_dD').value);
    var q=n;if(l)q*=l;if(b)q*=b;if(d)q*=d;
    q=Math.round(q*1000)/1000;
    var prev=document.getElementById('_dQtyPrev');
    if(prev)prev.textContent=q>0?'Deduction Qty = -'+q+' '+it.unit:'';
  }
  ['_dN','_dL','_dB','_dD'].forEach(function(id){
    var el=document.getElementById(id);
    if(el)el.addEventListener('input',_updatePreview);
  });

  document.getElementById('_dCancel').onclick=function(){modal.remove();};
  document.getElementById('_dAdd').onclick=function(){
    var lbl=(document.getElementById('_dLbl').value.trim())||'Deduction';
    var comment=(document.getElementById('_dComment').value.trim())||'';
    var n=Math.abs(parseFloat(document.getElementById('_dN').value)||1);
    var l=_parseAvg(document.getElementById('_dL').value);
    var b=_parseAvg(document.getElementById('_dB').value);
    var d=_parseAvg(document.getElementById('_dD').value);
    var q=n; if(l)q*=l; if(b)q*=b; if(d)q*=d;
    q=Math.round(q*1000)/1000;
    if(q<=0){alert('Qty 0 ahe — L, B, D values enter kara');return;}
    modal.remove();
    var row={lbl:lbl,n:n,l:l,b:b,d:d,qty:-q,fl:0,isDeduct:true};
    if(comment)row.comment=comment;
    it.rows.push(row);
    var tot=0; it.rows.forEach(function(rw){if(!rw.isTot)tot+=rw.qty||0;});
    it.qty=Math.round(tot*1000)/1000;
    it.amount=Math.round(it.qty*(it.finalRate||it.baseRate||0)*100)/100;
    rMS();updateAll();
    if(typeof showToast==='function')showToast('Deduction added! (-'+q+' '+it.unit+')','success');
  };
}
/* ═══ MEASUREMENT: Average value helper ═══ */
/* Usage: type "avg(10,8)" in L/B/D field → auto calculates (10+8)/2 = 9 */
function msrAvg(){/* handled in msrUpd via formula parsing */}

/* ── COPY / PASTE with live reference (multi-row) ───────────────────── */
/* _msrSel = { "iIdx_rIdx": true, ... }  _msrSelActive = bool */
window._msrSel={};
window._msrSelActive=false;

function msrActivateCopy(){
  window._msrSel={};
  window._msrSelActive=true;
  rMS();
  if(typeof showToast==='function') showToast('Copy Mode ON — check rows to copy, then click Paste Linked.','info');
}

function msrToggleSel(iIdx,rIdx,el){
  var key=iIdx+'_'+rIdx;
  if(el.checked) window._msrSel[key]={iIdx:iIdx,rIdx:rIdx};
  else delete window._msrSel[key];
}

function msrClearSel(){
  window._msrSel={};
  window._msrSelActive=false;
  rMS();
}

function msrUnlink(iIdx,rIdx){
  var it=items[iIdx];if(!it||!it.rows||!it.rows[rIdx])return;
  var r=it.rows[rIdx];
  delete r._linkedFrom;
  rMS();
  if(typeof showToast==='function') showToast('Link removed — row is now independent.','info');
}

function msrPasteRows(destIIdx){
  var keys=Object.keys(window._msrSel);
  if(!keys.length){alert('No rows selected. Please check at least one row.');return;}
  var destIt=items[destIIdx];
  if(!destIt||!destIt.rows){return;}

  var selList=keys.map(function(k){return window._msrSel[k];});
  selList.sort(function(a,b){return a.iIdx!==b.iIdx?a.iIdx-b.iIdx:a.rIdx-b.rIdx;});

  selList.forEach(function(src){
    var srcIt=items[src.iIdx];
    if(!srcIt||!srcIt.rows||!srcIt.rows[src.rIdx])return;
    var srcR=srcIt.rows[src.rIdx];

    /* Store index-based reference to source row — JSON-safe, recalc-safe */
    var newRow={
      lbl:      srcR.lbl||'',
      n:        srcR.n||1,
      l:        srcR.l||0,
      b:        srcR.b||0,
      d:        srcR.d||0,
      qty:      0,
      fl:       srcR.fl||0,
      isDeduct: srcR.isDeduct||false,   /* preserve deduction flag */
      _linkedFrom: {iIdx: src.iIdx, rIdx: src.rIdx}  /* index ref — survives JSON save/load */
    };
    var _t=(newRow.n||1);
    if(newRow.l)_t*=newRow.l; if(newRow.b)_t*=newRow.b; if(newRow.d)_t*=newRow.d;
    newRow.qty=(newRow.isDeduct?-1:1)*Math.round(_t*1000)/1000;
    /* Insert before isTot row */
    var _ti=destIt.rows.findIndex(function(r){return r.isTot;});
    if(_ti>=0) destIt.rows.splice(_ti,0,newRow);
    else destIt.rows.push(newRow);
  });

  destIt.qty=Math.round(destIt.rows.reduce(function(s,r){return s+(r.qty||0);},0)*1000)/1000;
  items[destIIdx]=recalcItem(destIt);

  window._msrSel={};
  window._msrSelActive=false;
  rMS();
  updateAll();
  if(typeof showToast==='function') showToast(selList.length+' row(s) pasted with live link — edit source row to auto-update here.','success');
}

/* Add/Edit comment on any measurement row */
function msrAddComment(iIdx,rIdx){
  var it=items[iIdx];if(!it||!it.rows||!it.rows[rIdx])return;
  var r=it.rows[rIdx];
  /* Ask which field to attach comment to */
  var modal=document.createElement('div');
  modal.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center';
  var curField=r.commentField||'general';
  var curComment=r.comment||'';
  modal.innerHTML='<div style="background:#fff;border-radius:10px;padding:1.2rem 1.5rem;width:340px;box-shadow:0 6px 24px rgba(0,0,0,.3)">'
    +'<b style="color:#b26a00;font-size:.85rem">Add Comment / Note</b>'
    +'<div style="font-size:.62rem;color:#888;margin:.1rem 0 .6rem">Which column should the comment appear under?</div>'
    +'<div style="display:flex;gap:.3rem;margin-bottom:.5rem;flex-wrap:wrap">'
    +'<button id="_cfl" onclick="(function(){document.getElementById(\'_cfl\').style.fontWeight=\'900\';[\'_cfb\',\'_cfd\',\'_cfg\'].forEach(function(x){document.getElementById(x).style.fontWeight=\'\'});document.getElementById(\'_cFieldVal\').value=\'l\';})()" style="padding:.2rem .5rem;border:1px solid #ccc;border-radius:4px;font-size:.65rem;cursor:pointer;'+(curField==='l'?'font-weight:900;background:#e8f5e9':'')+'">Length (L)</button>'
    +'<button id="_cfb" onclick="(function(){document.getElementById(\'_cfb\').style.fontWeight=\'900\';[\'_cfl\',\'_cfd\',\'_cfg\'].forEach(function(x){document.getElementById(x).style.fontWeight=\'\'});document.getElementById(\'_cFieldVal\').value=\'b\';})()" style="padding:.2rem .5rem;border:1px solid #ccc;border-radius:4px;font-size:.65rem;cursor:pointer;'+(curField==='b'?'font-weight:900;background:#e8f5e9':'')+'">Width (B)</button>'
    +'<button id="_cfd" onclick="(function(){document.getElementById(\'_cfd\').style.fontWeight=\'900\';[\'_cfl\',\'_cfb\',\'_cfg\'].forEach(function(x){document.getElementById(x).style.fontWeight=\'\'});document.getElementById(\'_cFieldVal\').value=\'d\';})()" style="padding:.2rem .5rem;border:1px solid #ccc;border-radius:4px;font-size:.65rem;cursor:pointer;'+(curField==='d'?'font-weight:900;background:#e8f5e9':'')+'">Depth (D)</button>'
    +'<button id="_cfg" onclick="(function(){document.getElementById(\'_cfg\').style.fontWeight=\'900\';[\'_cfl\',\'_cfb\',\'_cfd\'].forEach(function(x){document.getElementById(x).style.fontWeight=\'\'});document.getElementById(\'_cFieldVal\').value=\'general\';})()" style="padding:.2rem .5rem;border:1px solid #ccc;border-radius:4px;font-size:.65rem;cursor:pointer;'+(curField==='general'||!curField?'font-weight:900;background:#fff9e6':'')+'">General</button>'
    +'</div>'
    +'<input type="hidden" id="_cFieldVal" value="'+curField+'">'
    +'<textarea id="_cTxt" rows="3" placeholder="Type your comment or note here..." style="width:100%;padding:.3rem;border:1px solid #ccc;border-radius:5px;font-size:.7rem;box-sizing:border-box;resize:vertical">'+curComment+'</textarea>'
    +'<div style="display:flex;gap:.4rem;justify-content:flex-end;margin-top:.5rem">'
    +'<button id="_cClear" style="padding:.25rem .7rem;border:1px solid #f5a623;color:#b26a00;border-radius:5px;font-size:.7rem;cursor:pointer;background:#fff8e1">Clear</button>'
    +'<button id="_cCancel" style="padding:.25rem .7rem;border:1px solid #ccc;border-radius:5px;font-size:.7rem;cursor:pointer">Cancel</button>'
    +'<button id="_cSave" style="padding:.25rem .7rem;background:#b26a00;color:#fff;border:none;border-radius:5px;font-size:.7rem;cursor:pointer;font-weight:700">Save</button>'
    +'</div></div>';
  document.body.appendChild(modal);
  setTimeout(function(){var el=document.getElementById('_cTxt');if(el)el.focus();},80);
  document.getElementById('_cClear').onclick=function(){
    r.comment='';r.commentField='';modal.remove();rMS();
  };
  document.getElementById('_cCancel').onclick=function(){modal.remove();};
  document.getElementById('_cSave').onclick=function(){
    var txt=(document.getElementById('_cTxt').value||'').trim();
    var fld=(document.getElementById('_cFieldVal').value)||'general';
    r.comment=txt;
    r.commentField=txt?fld:'';
    modal.remove();
    rMS();
  };
}

function switchSch(id){
  document.querySelectorAll('#p17 .sch-tab').forEach(function(t,i){var ids=['b','c','a','stamps'];t.classList.toggle('on',ids[i]===id);});
  document.querySelectorAll('#p17 .sch-sec').forEach(function(s){s.classList.toggle('on',s.id==='sch-'+id);});
  setTimeout(function(){document.querySelectorAll('#sch-'+id+' textarea').forEach(function(ta){ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';});},80);
  /* Auto-load stamp names when stamps tab opens */
  if(id==='stamps'){
    setTimeout(function(){
      schAutoLoadStampNames();
      schUpdateStampVisibility();
      /* Also restore saved values */
      var G=function(i){return document.getElementById(i);};
      var ld=function(id,lk){var e=G(id);if(e&&!e.value){var v=localStorage.getItem(lk);if(v)e.value=v;}};
      ld('st_de','schStampDE');ld('st_ee','schStampEE');
      ld('st_div','schStampDiv');ld('st_subdiv','schStampSub');
    },50);
  }
}
function schAutoLoadStampNames(){
  /* Auto-populate st_de, st_ee from main stamp manager if empty */
  var G=function(id){return document.getElementById(id);};
  var deEl=G('st_de'), eeEl=G('st_ee');
  if(deEl && !deEl.value){
    var de=localStorage.getItem('stampDE')||'';
    if(de && de!=='Divisional Engineer') deEl.value=de;
  }
  if(eeEl && !eeEl.value){
    var ee=localStorage.getItem('stampEE')||'';
    if(ee && ee!=='Executive Engineer') eeEl.value=ee;
  }
  var subEl=G('st_subdiv');
  if(subEl && !subEl.value){
    var loc=localStorage.getItem('stampSubDivLoc')||'';
    if(loc && loc!=='P.W. Sub Division') subEl.value=loc;
  }
}
function schApplyStamps(){
  var G=function(id){return document.getElementById(id);};
  schAutoLoadStampNames();
  var div=G('st_div')?G('st_div').value:'',sub=G('st_subdiv')?G('st_subdiv').value:'';
  var de=G('st_de')?G('st_de').value:'',ee=G('st_ee')?G('st_ee').value:'';
  var wk=G('st_work')?G('st_work').value:'',tn=G('st_tender')?G('st_tender').value:'';
  var apB=G('st_b')&&G('st_b').checked,apC=G('st_c')&&G('st_c').checked,apA=G('st_a')&&G('st_a').checked;
  /* Save to localStorage for persistence */
  localStorage.setItem('schStampDE',de);
  localStorage.setItem('schStampEE',ee);
  localStorage.setItem('schStampDiv',div);
  localStorage.setItem('schStampSub',sub);
  var s=function(id,v){var e=G(id);if(e)e.value=v;};
  if(apB){s('sb_div',div);s('sb_subdiv',sub);s('sb_work_p1',wk);s('sb_work',wk);s('sb1_de',de);s('sb1_ee',ee);s('sb2_de',de);s('sb2_ee',ee);}
  if(apC){s('sc_div',div);s('sc_subdiv',sub);s('sc_work_p1',wk);s('sc_work',wk);s('sc1_de',de);s('sc1_ee',ee);s('sc2_de',de);s('sc2_ee',ee);}
  if(apA){s('sa_div',div);s('sa_subdiv',sub);s('sa_work',wk);s('sa_tender',tn);s('sa1_de',de);s('sa1_ee',ee);}
  /* Per-schedule DE/EE visibility based on checkboxes */
  schUpdateStampVisibility();
  if(typeof showToast==='function')showToast('Stamps applied! ✓','success');
}
function schUpdateStampVisibility(){
  /* Hide/show DE or EE stamp boxes per schedule based on stored pref */
  /* For now: if DE value is empty, hide DE stamp boxes */
  var G=function(id){return document.getElementById(id);};
  var de=G('st_de')?G('st_de').value.trim():'';
  var ee=G('st_ee')?G('st_ee').value.trim():'';
  /* Show/hide DE boxes */
  ['sb1_de','sb2_de','sc1_de','sc2_de','sa1_de'].forEach(function(id){
    var el=G(id); if(!el) return;
    var box=el.closest('.pg-stamp-box');
    if(box) box.style.display = de ? '' : 'none';
  });
  /* Show/hide EE boxes */
  ['sb1_ee','sb2_ee','sc1_ee','sc2_ee','sa1_ee'].forEach(function(id){
    var el=G(id); if(!el) return;
    var box=el.closest('.pg-stamp-box');
    if(box) box.style.display = ee ? '' : 'none';
  });
}
function printSch(){
  var sec=document.querySelector('#p17 .sch-sec.on');if(!sec)return;
  var clone=sec.cloneNode(true);
  var orig=sec.querySelectorAll('textarea,input'),cl=clone.querySelectorAll('textarea,input');
  for(var i=0;i<orig.length;i++){if(!cl[i])continue;if(orig[i].tagName==='TEXTAREA')cl[i].value=orig[i].value;else cl[i].setAttribute('value',orig[i].value);}
  clone.querySelectorAll('.noprt,.sc-add-btn2,.sc-del-btn2,.sb-add-btn,.note-del,.note-add-btn,.stamp-pg-sel,.stamp-sel-box').forEach(function(el){el.remove();});
  var win=window.open('','_blank');
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>');
  win.document.write(clone.innerHTML);
  win.document.write('</body></html>');
  win.document.close();
  win.onload=function(){setTimeout(function(){win.print();},400);};
}
function schCopyStampsTo(pgStampDiv){
  var G=function(id){return document.getElementById(id);};
  var de=G('st_de')?G('st_de').value:'';
  var ee=G('st_ee')?G('st_ee').value:'';
  pgStampDiv.querySelectorAll('.pg-stamp-inp').forEach(function(inp){
    if(!inp.id)return;
    if(/_de$/.test(inp.id))inp.value=de;
    if(/_ee$/.test(inp.id))inp.value=ee;
  });
  if(typeof showToast==='function')showToast('Stamp copied! \u2713','success');
}
function updateAll(){
  getBitChange();
  /* Recalc all items so bitumen rate change / lead km changes reflect */
  for(var _i=0;_i<items.length;_i++)items[_i]=recalcItem(items[_i]);
  rBOQ();rRA();rMS();rCC();rLC();rRoy();calcMTF();rFE();rSum();
  var n=items.length;
  if(R('b2'))R('b2').textContent=n;
  var _es=R('empS');if(_es)_es.style.display=n?'none':'block';
  var _sp=R('sumPanel');if(_sp)_sp.style.display=n?'block':'none';
  var grand=calcGrand();
  R('hIt').textContent=n;R('hTot').textContent='\u20b9'+fmtL(Math.round(grand));
  var el;
  el=R('covCostVal');if(el)el.value=Math.round(grand/100000);
  upMeta();
}
/* updateAll without rMS re-render — used while editing measurement cells */
function _doUpdateAllNoMS(){
  getBitChange();
  for(var _i=0;_i<items.length;_i++)items[_i]=recalcItem(items[_i]);
  rBOQ();rRA();rCC();rLC();rRoy();calcMTF();rFE();rSum();
  var n=items.length;
  if(R('b2'))R('b2').textContent=n;
  var _es=R('empS');if(_es)_es.style.display=n?'none':'block';
  var _sp=R('sumPanel');if(_sp)_sp.style.display=n?'block':'none';
  var grand=calcGrand();
  R('hIt').textContent=n;R('hTot').textContent='\u20b9'+fmtL(Math.round(grand));
  var el;
  el=R('covCostVal');if(el)el.value=Math.round(grand/100000);
  upMeta();
}

/* ── BOQ ─────────────────────────────────────────────────────────────── */
function rBOQ(){
  var tb=R('boqTb');if(!tb)return;
  var tblBOQ=tb.parentNode;
  if(!items.length){tb.innerHTML='<tr><td colspan="9" class="ni">Add items to generate</td></tr>';return;}
  var A=0,tbodiesBOQ='',i,it;
  for(i=0;i<items.length;i++)A+=items[i].amount;
  var floorNames=['Ground Floor','1st Floor','2nd Floor','3rd Floor','4th Floor'];
  var floorColors=['#2e7d32','#1565c0','#6a1b9a','#bf360c','#00695c'];
  var FCLS=['fl-gf','fl-1f','fl-2f','fl-3f','fl-4f'];
  for(i=0;i<items.length;i++){
    it=items[i];
    var h='';
    var floorQtys={},floorRates={};
    var hasFloor=false;
    var hasUpperFloor=false;
    if(it.rows){
      it.rows.forEach(function(rw){
        if(rw.isTot)return;
        var fl=rw.fl!=null?rw.fl:0;
        if(fl>=0)hasFloor=true;
        if(fl>0)hasUpperFloor=true;
        var q=(rw.n||1)*(rw.l||0);
        if(rw.b>0)q*=rw.b;if(rw.d>0)q*=rw.d;
        floorQtys[fl]=(floorQtys[fl]||0)+q;
        if(rw.flRate)floorRates[fl]=rw.flRate;
      });
    }
    if(!hasUpperFloor){
      h+='<tr>'
        +'<td style="font-weight:700;text-align:center">'+(i+1)+'</td>'
        +'<td class="or" style="font-weight:700;white-space:nowrap">'+it.no+'</td>'
        +'<td style="font-size:.63rem;line-height:1.4">'+it.desc+'</td>'
        +'<td style="font-size:.58rem;color:var(--mu)">'+it.unit+'</td>'
        +'<td style="text-align:center">'+(hasFloor?'<span class="fl-badge fl-gf">Ground Floor</span>':'')+'</td>'
        +'<td class="r">'+it.qty.toFixed(3)+'</td>'
        +'<td class="r" style="font-size:.54rem">₹'+fmt(it.finalRate)+(hasFloor?'<span style="font-size:.42rem;color:#2e7d32;margin-left:.1rem;font-weight:700">GF (0%)</span>':'')+'</td>'
        +'<td class="r gr">₹'+fmtW(it.amount)+'</td>'
        +'<td class="noprt" style="white-space:nowrap">'
        +'<button onclick="openCFEditor('+i+')" class="btn-sm" style="background:#ff6f00;color:#fff;font-size:.52rem;padding:.12rem .3rem;margin-right:.2rem;border:none;border-radius:3px;cursor:pointer">CF</button>'
        +'<button class="dbt" onclick="removeItem('+it.id+')">del</button>'
        +'</td></tr>';
    } else {
      var flKeys=Object.keys(floorQtys).map(Number).sort();
      var itemTotal=0;
      var totalRows=flKeys.length;
      for(var fi=0;fi<flKeys.length;fi++){
        var fl=flKeys[fi];
        var fQty=Math.round(floorQtys[fl]*1000)/1000;
        var fRate=floorRates[fl]||Math.round(it.finalRate*(1+fl/100)*100)/100;
        var fAmt=Math.round(fQty*fRate*100)/100;
        itemTotal+=fAmt;
        var fColor=floorColors[fl]||'#333';
        var fName=floorNames[fl]||('Floor '+fl);
        var fcls=FCLS[fl]||'fl-gf';
        h+='<tr>';
        if(fi===0){
          h+='<td rowspan="'+(totalRows+1)+'" style="font-weight:700;text-align:center;vertical-align:top;padding-top:.3rem">'+(i+1)+'</td>'
            +'<td rowspan="'+(totalRows+1)+'" class="or" style="font-weight:700;white-space:nowrap;vertical-align:top;padding-top:.3rem">'+it.no+'</td>'
            +'<td rowspan="'+(totalRows+1)+'" style="font-size:.63rem;line-height:1.4;vertical-align:top;padding-top:.3rem">'+it.desc+'</td>'
            +'<td rowspan="'+(totalRows+1)+'" style="font-size:.58rem;color:var(--mu);vertical-align:top;padding-top:.3rem">'+it.unit+'</td>';
        }
        h+='<td style="text-align:center"><span class="fl-badge '+fcls+'">'+fName+'</span></td>'
          +'<td class="r" style="font-weight:600">'+fQty.toFixed(3)+'</td>'
          +'<td class="r" style="font-size:.54rem;color:'+fColor+'">₹'+fmt(fRate)
          +(fl>0?'<span style="font-size:.42rem;color:var(--mu);margin-left:.1rem">+'+fl+'%</span>':'<span style="font-size:.42rem;color:#2e7d32;margin-left:.1rem;font-weight:700">GF (0%)</span>')+'</td>'
          +'<td class="r" style="color:'+fColor+';font-weight:600">₹'+fmtW(fAmt)+'</td>'
          +'<td class="noprt">'+(fi===0?'<button onclick="openCFEditor('+i+')" class="btn-sm" style="background:#ff6f00;color:#fff;font-size:.52rem;padding:.12rem .3rem;margin-right:.2rem;border:none;border-radius:3px;cursor:pointer">CF</button><button class="dbt" onclick="removeItem('+it.id+')">del</button>':'')+'</td></tr>';
      }
      h+='<tr style="background:#fff9e6">'
        +'<td colspan="1" style="text-align:right;font-size:.56rem;font-weight:700;color:#555">Total</td>'
        +'<td class="r" style="font-weight:700">'+it.qty.toFixed(3)+'</td>'
        +'<td></td>'
        +'<td class="r gr" style="font-weight:700">₹'+fmtW(itemTotal)+'</td>'
        +'<td class="noprt"></td></tr>';
      h+='<tr style="height:3px"><td colspan="9" style="background:var(--bd);padding:0"></td></tr>';
    }
    if(i < items.length-1){
      /* Normal items — स्वतःच्या tbody मध्ये */
      tbodiesBOQ+='<tbody class="boq-item-grp">'+h+'</tbody>';
    }
    /* Last item — h वेगळा ठेवतो, खाली tfooter + stamp सोबत एकत्र टाकतो */
  }
  /* Last item + Total row + Stamp — एकाच tbody मध्ये → page-break-inside:avoid */
  var lastH = items.length ? '' : '';
  /* last item चा h वर loop मध्ये शेवटी set झाला आहे */
  var stampHTML=getSheetStampHTML('p3');
  tbodiesBOQ+='<tbody class="boq-item-grp" style="page-break-inside:avoid">'
    +h
    +'<tr class="tfooter"><td colspan="7" style="text-align:right">Total =</td>'
    +'<td class="r gr">₹'+fmtW(A)+'</td><td></td></tr>'
    +(stampHTML?'<tr class="noprt-row"><td colspan="9" style="padding:0;border:none">'+stampHTML+'</td></tr>':'')
    +'</tbody>';
  /* Rebuild table */
  var theadBOQ=tblBOQ.querySelector('thead');
  tblBOQ.innerHTML='';
  if(theadBOQ)tblBOQ.appendChild(theadBOQ);
  var tmpBOQ=document.createElement('div');
  tmpBOQ.innerHTML='<table>'+tbodiesBOQ+'</table>';
  var newTbodiesBOQ=tmpBOQ.querySelectorAll('tbody');
  for(var tbi=0;tbi<newTbodiesBOQ.length;tbi++)tblBOQ.appendChild(newTbodiesBOQ[tbi]);
  var firstBOQ=tblBOQ.querySelector('tbody');
  if(firstBOQ)firstBOQ.id='boqTb';
}

/* ── RATE ANALYSIS (merged rows like Consumption) ────────────────────── */
function rRA(){
  var tb=R('raTb');if(!tb)return;
  var tbl=tb.parentNode; /* <table> */
  if(!items.length){tb.innerHTML='<tr><td colspan="5" class="ni">Add items to generate</td></tr>';return;}
  /* Build one <tbody class="ra-item-grp"> per item so page-break-inside:avoid works per item */
  var tbodies='',i,it,desc,j,m,subRows;
  for(i=0;i<items.length;i++){
    it=items[i];
    /* Sub-rows: one per lead material + base row */
    subRows=[];
    subRows.push({lbl:'Base SSR Rate',val:'\u20b9'+fmt(it.baseRate),cls:'',note:it.unit});
    for(j=0;j<(it.leadMats||[]).length;j++){
      m=it.leadMats[j];
      var isNeg=(m.add<0);
      var valPrefix=isNeg?'-\u20b9':'+\u20b9';
      var valCls2=isNeg?'rd':'pu';
      var noteTxt='';
      if(m.mat==='bitumen_change'){
        noteTxt=m.factor.toFixed(4)+' MT \u00d7 \u20b9'+fmt(Math.abs(m.chg));
      } else if(m.mat==='area_pct'){
        noteTxt='on base rate only';
      } else {
        noteTxt=m.factor+(m.conv!==1?'\u00d7'+m.conv:'')+' \u00d7 '+m.km+'km';
      }
      subRows.push({lbl:(m.mat==='area_pct'?m.label:'+ Lead: '+m.label),
        val:valPrefix+fmt(Math.abs(m.add)),cls:valCls2,
        note:noteTxt});
    }
    if(it.scadaVal)subRows.push({lbl:'+ SCADA Deduction',val:it.scadaVal,cls:'rd',note:''});
    subRows.push({lbl:'Final Rate (Ground Floor) / '+it.unit,val:'\u20b9'+fmt(it.finalRate),cls:'gr bold',note:'0% increase'});
    /* Add floor-wise rows if item has floor measurements */
    var usedFloors={};
    if(it.rows){it.rows.forEach(function(rw){if(rw.fl&&rw.fl>0)usedFloors[rw.fl]=true;});}
    var floorNames=['Ground','1st Floor','2nd Floor','3rd Floor','4th Floor'];
    for(var fx=1;fx<=4;fx++){
      if(usedFloors[fx]){
        var fRate=Math.round(it.finalRate*(1+fx/100)*100)/100;
        subRows.push({lbl:'Final Rate ('+floorNames[fx]+') / '+it.unit,
          val:'\u20b9'+fmt(fRate),cls:'gr bold',
          note:'+'+fx+'% on GF rate'});
      }
    }
    desc=it.desc;
    var h='';
    /* Description header row */
    h+='<tr style="background:#f0f4ff">'
      +'<td style="font-weight:700;white-space:nowrap">'+it.no+'</td>'
      +'<td colspan="5" style="font-size:.67rem;line-height:1.5;font-weight:600;padding:.35rem .5rem;min-width:300px">'+desc+'</td>'
      +'</tr>';
    for(j=0;j<subRows.length;j++){
      var sr=subRows[j];
      var isFinal=(j===subRows.length-1);
      var rowStyle=isFinal?'style="background:#f0faf0"':'';
      h+='<tr '+rowStyle+'>';
      var valCls=sr.cls.indexOf('bold')>=0?'font-weight:700;':''
        +(sr.cls.indexOf('pu')>=0?'color:var(--pu);':sr.cls.indexOf('gr')>=0?'color:var(--gr);':sr.cls.indexOf('rd')>=0?'color:var(--rd);':'');
      h+='<td></td><td></td>'
        +'<td style="font-size:.62rem'+(isFinal?';font-weight:700':'')+'">'+sr.lbl+'</td>'
        +'<td class="r" style="font-family:monospace;font-size:.63rem;'+valCls+'">'+sr.val+'</td>'
        +'<td style="font-size:.54rem;color:var(--mu)">'+sr.note+'</td>'
        +'</tr>';
    }
    h+='<tr style="height:3px"><td colspan="6" style="background:var(--bd);padding:0"></td></tr>';
    if(i < items.length-1){
      tbodies+='<tbody class="ra-item-grp">'+h+'</tbody>';
    }
    /* Last item — h वेगळा ठेवतो, stamp सोबत एकत्र टाकतो */
  }
  if(!tbodies && !items.length){
    tbodies='<tbody id="raTb"><tr><td colspan="6" class="ni">Add items to generate</td></tr></tbody>';
  } else if(items.length){
    /* Last item + Stamp — एकाच tbody मध्ये → page-break-inside:avoid */
    var raStampHTML=getSheetStampHTML('p4');
    tbodies+='<tbody class="ra-item-grp" style="page-break-inside:avoid;break-inside:avoid">'
      +h
      +(raStampHTML?'<tr class="noprt-row"><td colspan="6" style="padding:0;border:none">'+raStampHTML+'</td></tr>':'')
      +'</tbody>';
  }
  /* Replace all existing tbodies in the table except thead */
  var thead=tbl.querySelector('thead');
  tbl.innerHTML='';
  if(thead)tbl.appendChild(thead);
  var tmp=document.createElement('div');
  tmp.innerHTML='<table>'+tbodies+'</table>';
  var newTbodies=tmp.querySelectorAll('tbody');
  for(var ti=0;ti<newTbodies.length;ti++)tbl.appendChild(newTbodies[ti]);
  /* Keep raTb id on first tbody for Excel export compatibility */
  var first=tbl.querySelector('tbody');
  if(first)first.id='raTb';
}

/* ── MEASUREMENTS ────────────────────────────────────────────────────── */
function rMS(){
  var tb=R('msTb');if(!tb)return;
  var tblMS=tb.parentNode; /* <table> */
  if(!items.length){tb.innerHTML='<tr><td colspan="11" class="ni">Add items to generate</td></tr>';return;}
  var FLBL=['G','1st','2nd','3rd','4th'];
  var FCLS=['fl-gf','fl-1f','fl-2f','fl-3f','fl-4f'];
  var tbodiesMS='',h='',i,it,ri,r;
  var IS='font-size:.62rem;border:none;background:transparent;padding:.1rem .2rem;font-family:inherit;outline:none;box-sizing:border-box;width:100%';
  var IF='';
  for(i=0;i<items.length;i++){
    it=items[i];
    h=''; /* reset per item — each gets its own <tbody> */
    /* migrate old meas format */
    if(!it.rows&&it.meas&&it.meas.length){
      it.rows=[];
      for(var mi=0;mi<it.meas.length;mi++){
        var m=it.meas[mi];
        it.rows.push({lbl:m.desc||'',n:m.nos||1,l:m.L||0,b:m.B||0,d:m.H||0,qty:0,fl:0});
      }
    }
    if(!it.rows||!it.rows.length)continue;
    /* Item header row - colspan 10 (no rate/amount) */
    h+='<tr style="background:#f0f4ff">'
      +'<td style="font-weight:700;text-align:center">'+(i+1)+'</td>'
      +'<td class="or" style="font-weight:700;white-space:nowrap">'+it.no+'</td>'
      +'<td colspan="9" style="font-size:.67rem;line-height:1.5;font-weight:600;padding:.35rem .5rem">'+it.desc+'</td>'
      +'</tr>';
    var multiRow=it.rows.length>1;
    for(ri=0;ri<it.rows.length;ri++){
      r=it.rows[ri];
      /* Recalc qty */
      if(!r.isTot){
        /* Re-evaluate any stored formulas so linked values stay live */
        if(r._linkedFrom){
          /* Live reference via index — JSON-safe */
          var _lf=r._linkedFrom;
          var _srcIt=items[_lf.iIdx];
          var _s=(_srcIt&&_srcIt.rows)?_srcIt.rows[_lf.rIdx]:null;
          if(_s){
            r.l=(_s.l!=null?_s.l:0);
            r.b=(_s.b!=null?_s.b:0);
            r.d=(_s.d!=null?_s.d:0);
            r.n=(_s.n||1);
            r.isDeduct=(_s.isDeduct||false); /* mirror deduction status */
          }
        } else if(r._f){
          if(r._f.l){var _rv=msrResolve(r._f.l,i);if(_rv!==null)r.l=_rv;}
          if(r._f.b){var _rv=msrResolve(r._f.b,i);if(_rv!==null)r.b=_rv;}
          if(r._f.d){var _rv=msrResolve(r._f.d,i);if(_rv!==null)r.d=_rv;}
        }
        var _n=r.n||1,_q=_n;
        if(r.l!==null&&r.l!==undefined&&r.l!==0)_q*=r.l;
        if(r.b!==null&&r.b!==undefined&&r.b!==0)_q*=r.b;
        if(r.d!==null&&r.d!==undefined&&r.d!==0)_q*=r.d;
        /* ---- Deduction rows always store NEGATIVE qty ---- */
        r.qty=(r.isDeduct?-1:1)*Math.round(_q*1000)/1000;
      }
      var isTotRow=(r.isTot||false);
      var flIdx=(r.fl!=null?r.fl:0);
      var fcls=FCLS[flIdx]||'fl-gf';
      var flbl=FLBL[flIdx]||('F'+flIdx);
      if(isTotRow){
        h+='<tr><td></td><td></td><td></td><td></td>'
          +'<td style="font-size:.61rem;font-weight:900"><b>'+(r.lbl||'')+'</b></td>'
          +'<td></td><td></td><td></td><td></td>'
          +'<td class="r" style="font-weight:700">'+r.qty.toFixed(3)+'</td>'
          +'<td style="font-size:.56rem">'+it.unit+'</td>'
          +'<td class="noprt"></td></tr>';
      } else {
        var _ded=(r.isDeduct||false);
        /* ── Parse avg() in display values ── */
        function _fmtVal(v,fld,rf){
          /* Show resolved numeric value, not formula string */
          return (v!==null&&v!==undefined&&v!==0)?v:'';
        }
        var _lDisp=_fmtVal(r.l,'l',r._f);
        var _bDisp=_fmtVal(r.b,'b',r._f);
        var _dDisp=_fmtVal(r.d,'d',r._f);
        var _qAbs=Math.abs(r.qty);
        var _qDisplay=_ded
          ?'<span style="color:#c62828;font-weight:700">(-'+_qAbs.toFixed(3)+')</span>'
          :'<span style="font-weight:700">'+r.qty.toFixed(3)+'</span>';

        /* Pre-compute link info */
        var _isLinked=!!r._linkedFrom;
        var _lnkTitle='';
        if(_isLinked){
          var _lf2=r._linkedFrom;
          var _srcItLnk2=items[_lf2.iIdx];
          var _srcDescLnk2=_srcItLnk2?(_srcItLnk2.no||('Item '+(_lf2.iIdx+1))):('Item '+(_lf2.iIdx+1));
          _lnkTitle='🔗 Linked from Item '+(_lf2.iIdx+1)+', Row '+(_lf2.rIdx+1)+' ('+_srcDescLnk2+') — edit source row to update';
        }
        var _rowBg=_ded?'background:#fff0f0':(_isLinked?'background:#f0f8ff':'');
        h+='<tr id="msr_'+i+'_'+ri+'" style="'+_rowBg+'">';
        h+='<td></td><td></td><td></td>';
        /* Floor badge OR DEDUCT badge */
        if(_ded){
          h+='<td style="text-align:center"><span style="display:inline-block;font-size:.46rem;font-weight:700;background:#c62828;color:#fff;padding:.1rem .3rem;border-radius:3px;letter-spacing:.03em">DEDUCT</span></td>';
        } else {
          h+='<td style="text-align:center"><span class="fl-badge '+fcls+'">'+flbl+'</span></td>';
        }
        /* Description field with Add Comment button + linked badge */
        h+='<td><input style="'+IS+';width:100%;'+(r._f&&r._f.lbl?'background:#fffde7':'')
          +(_ded?'color:#c62828':'')
          +'" '+IF+' value="'+esc(r.lbl||'')+'" placeholder="'
          +(_ded?'Deduction detail (e.g. door opening)':'Detail / Remark')
          +'" oninput="msrUpd('+i+','+ri+',this,\'lbl\')">'
          +(_isLinked?'<span class="ms-link-badge noprt" title="'+_lnkTitle+'" style="font-size:.45rem;background:#1565c0;color:#fff;padding:.05rem .25rem;border-radius:2px;margin-left:.15rem;cursor:help;white-space:nowrap">🔗 Linked</span>':'')
          +'<button onclick="msrAddComment('+i+','+ri+')" title="Add comment / note" style="font-size:.5rem;background:#b26a00;color:#fff;border:none;border-radius:2px;cursor:pointer;padding:.05rem .25rem;margin-left:.15rem;white-space:nowrap">Add Comment</button></td>';
        /* Nos — blue bg + readonly if linked */
        h+='<td class="r"><input style="'+IS+';width:38px;text-align:right'
          +(_isLinked?';background:#e3f2fd;cursor:help;pointer-events:none':(_ded?';background:#fff0f0':''))
          +'" '+IF+(_isLinked?' readonly':'')+' type="number" step="any" min="0" value="'+(r.n||1)
          +'" oninput="msrUpd('+i+','+ri+',this,\'n\')" title="'+(_isLinked?_lnkTitle:'')+'"></td>';
        /* L/B/D cells — blue bg + tooltip if linked */
        var _lComment=(r.commentField==='l'&&r.comment)?'<div style="font-size:.5rem;color:#b26a00;font-style:italic;padding:.05rem .1rem">'+esc(r.comment)+'</div>':'';
        h+='<td class="r"><input style="'+IS+';width:55px;text-align:right;font-family:monospace'
          +(_isLinked?';background:#e3f2fd;cursor:help':(_ded?';background:#fff0f0':''))
          +';" '+IF+' value="'+esc(String(_lDisp===0?'':_lDisp))
          +'" placeholder="—" '+(_isLinked?'readonly':'')+' oninput="msrUpd('+i+','+ri+',this,\'l\')" title="'+(_isLinked?_lnkTitle:'Type value or avg(a,b,c) for average')+'">'+_lComment+'</td>';
        /* B — with comment below if comment is for B */
        var _bComment=(r.commentField==='b'&&r.comment)?'<div style="font-size:.5rem;color:#b26a00;font-style:italic;padding:.05rem .1rem">'+esc(r.comment)+'</div>':'';
        h+='<td class="r"><input style="'+IS+';width:55px;text-align:right;font-family:monospace'
          +(_isLinked?';background:#e3f2fd;cursor:help':(_ded?';background:#fff0f0':''))
          +';" '+IF+' value="'+esc(String(_bDisp===0?'':_bDisp))
          +'" placeholder="—" '+(_isLinked?'readonly':'')+' oninput="msrUpd('+i+','+ri+',this,\'b\')" title="'+(_isLinked?_lnkTitle:'Type value or avg(a,b,c) for average')+'">'+_bComment+'</td>';
        /* D/H — with comment below if comment is for D */
        var _dComment=(r.commentField==='d'&&r.comment)?'<div style="font-size:.5rem;color:#b26a00;font-style:italic;padding:.05rem .1rem">'+esc(r.comment)+'</div>':'';
        h+='<td class="r"><input style="'+IS+';width:55px;text-align:right;font-family:monospace'
          +(_isLinked?';background:#e3f2fd;cursor:help':(_ded?';background:#fff0f0':''))
          +';" '+IF+' value="'+esc(String(_dDisp===0?'':_dDisp))
          +'" placeholder="—" '+(_isLinked?'readonly':'')+' oninput="msrUpd('+i+','+ri+',this,\'d\')" title="'+(_isLinked?_lnkTitle:'Type value or avg(a,b,c) for average')+'">'+_dComment+'</td>';
        /* Qty display */
        h+='<td class="r" id="msrq_'+i+'_'+ri+'">'+_qDisplay+'</td>';
        /* Unit */
        h+='<td style="font-size:.56rem">'+(multiRow?'':it.unit)+'</td>';
        /* Checkbox (copy mode only) + Delete + Unlink buttons */
        var _chkd=(window._msrSel&&window._msrSel[i+"_"+ri]);
        h+='<td class="noprt" style="text-align:center;white-space:nowrap">'
          +(window._msrSelActive?'<input type="checkbox" '+((_chkd)?'checked':'')+' onchange="msrToggleSel('+i+','+ri+',this)" title="Select for copy (live link)" style="width:13px;height:13px;cursor:pointer;margin-right:.2rem;accent-color:#1565c0">':'')
          +(_isLinked?'<button onclick="msrUnlink('+i+','+ri+')" class="btn-sm" title="Remove live link — make independent" style="background:#7b1fa2;color:#fff;font-size:.52rem;padding:.1rem .3rem;margin-right:.15rem">✂ Unlink</button>':'')
          +'<button onclick="delMeasRow('+i+','+ri+')" class="btn-sm" style="background:#c62828;color:#fff;font-size:.52rem;padding:.1rem .25rem">✕</button>'
          +'</td>';
        /* Comment row below — only if no commentField set (general comment) */
        h+='</tr>';
        if(r.comment&&!r.commentField){
          h+='<tr style="'+(r.isDeduct?'background:#fff0f0':'background:#fffde7')+'"><td></td><td></td><td></td><td></td>'
            +'<td colspan="7" style="font-size:.56rem;color:#b26a00;padding:.1rem .3rem;font-style:italic">'+esc(r.comment)+'</td></tr>';
        }
      }
    }
    /* Total row for multi-row items */
    var hasIsTot=it.rows.some(function(rw){return rw.isTot;});
    if(multiRow&&!hasIsTot){
      var _posSum=0,_dedSum=0;
      it.rows.forEach(function(rw){
        if(rw.isTot)return;
        if(rw.isDeduct)_dedSum+=Math.abs(rw.qty||0);
        else _posSum+=rw.qty||0;
      });
      _posSum=Math.round(_posSum*1000)/1000;
      _dedSum=Math.round(_dedSum*1000)/1000;
      var _totLbl;
      if(_dedSum>0){
        _totLbl='Total = <b>'+_posSum.toFixed(3)+'</b>'
          +' &minus; <span style="color:#c62828"><b>'+_dedSum.toFixed(3)+'</b></span>'
          +' = <span style="color:#1a237e"><b>'+it.qty.toFixed(3)+'</b></span>';
      } else {
        _totLbl='Total';
      }
      h+='<tr style="background:var(--bg)">'
        +'<td colspan="9" style="text-align:right;font-size:.58rem;color:var(--mu)" id="mstotlbl_'+i+'">'+_totLbl+'</td>'
        +'<td class="r" style="font-weight:700" id="mstot_'+i+'">'+it.qty.toFixed(3)+'</td>'
        +'<td style="font-size:.56rem">'+it.unit+'</td>'
        +'<td class="noprt"></td></tr>';
    }
    h+='<tr class="noprt"><td colspan="11" style="padding:.25rem .4rem;border-top:1px solid #e8e8e8">'
      +(window._msrSelActive?'<button onclick="msrPasteRows('+i+')" style="font-size:.62rem;padding:.18rem .5rem;background:#1565c0;color:#fff;border:none;border-radius:3px;cursor:pointer;margin-right:.3rem">📋 Paste Linked</button>':'')
      +'<button onclick="msrAddRow('+i+')" style="font-size:.62rem;padding:.18rem .5rem;background:#1565c0;color:#fff;border:none;border-radius:3px;cursor:pointer;margin-right:.3rem">+ Row</button>'
      +'<button onclick="msrAddDeduction('+i+')" style="font-size:.62rem;padding:.18rem .5rem;background:#c62828;color:#fff;border:none;border-radius:3px;cursor:pointer">&#8722; Deduction</button>'
      +(window._msrSelActive?'<button onclick="msrClearSel()" style="font-size:.62rem;padding:.18rem .5rem;background:#f57f17;color:#fff;border:none;border-radius:3px;cursor:pointer;margin-left:.3rem">✕ Clear Selection</button>':'<button onclick="msrActivateCopy()" style="font-size:.62rem;padding:.18rem .5rem;background:#607d8b;color:#fff;border:none;border-radius:3px;cursor:pointer;margin-left:.3rem">⎘ Copy Mode</button>')
      +'</td></tr>';
    h+='<tr><td colspan="11" style="height:3px;background:var(--bd);padding:0"></td></tr>';
    if(i < items.length-1){
      tbodiesMS+='<tbody class="ms-item-grp">'+h+'</tbody>';
    }
    /* Last item — h वेगळा ठेवतो, stamp सोबत एकत्र टाकतो */
  }
  /* Rebuild table with one <tbody> per item for page-break-inside:avoid */
  if(!tbodiesMS){
    tb.innerHTML='<tr><td colspan="11" class="ni">Add items to generate</td></tr>';
  } else {
    /* Last item + Stamp — एकाच tbody मध्ये → page-break-inside:avoid */
    var msStampHTML=getSheetStampHTML('p5');
    tbodiesMS+='<tbody class="ms-item-grp" style="page-break-inside:avoid;break-inside:avoid">'
      +h
      +(msStampHTML?'<tr class="noprt-row"><td colspan="11" style="padding:0;border:none">'+msStampHTML+'</td></tr>':'')
      +'</tbody>';
    var theadMS=tblMS.querySelector('thead');
    tblMS.innerHTML='';
    if(theadMS)tblMS.appendChild(theadMS);
    var tmpMS=document.createElement('div');
    tmpMS.innerHTML='<table>'+tbodiesMS+'</table>';
    var newTbodiesMS=tmpMS.querySelectorAll('tbody');
    for(var tmi=0;tmi<newTbodiesMS.length;tmi++)tblMS.appendChild(newTbodiesMS[tmi]);
    /* Keep msTb id on first tbody for compatibility */
    var firstMS=tblMS.querySelector('tbody');
    if(firstMS)firstMS.id='msTb';
  }
  /* Post-render: update item totals that have linked rows */
  items.forEach(function(it2,ii){
    if(!it2.rows)return;
    var hasLinked=it2.rows.some(function(r){return r._linkedFrom;});
    if(!hasLinked)return;
    var _tot=0;
    it2.rows.forEach(function(rw){if(!rw.isTot)_tot+=rw.qty||0;});
    it2.qty=Math.round(_tot*1000)/1000;
    var totEl=R('mstot_'+ii);if(totEl)totEl.textContent=it2.qty.toFixed(3);
  });
}

/* ── CONSUMPTION CHART (merged rows per item) ────────────────────────── */
function rCC(){
  var tb=R('ccTb');if(!tb)return;
  var tblCC=tb.parentNode;
  if(!items.length){tb.innerHTML='<tr><td colspan="5" class="ni">Add items to generate</td></tr>';return;}

  var MATS=[
    {k:'rubble',     lbl:'Rubble',         u:'M3'},
    {k:'overmetal',  lbl:'Oversize Metal', u:'M3'},
    {k:'sand',       lbl:'Sand (natural)', u:'M3'},
    {k:'quarry',     lbl:'Quarry Stone',   u:'M3'},
    {k:'cement_bags',lbl:'Cement',         u:'Bags'},
    {k:'scr_sand',   lbl:'Screened Sand',  u:'M3'},
    {k:'m40mm',      lbl:'Metal 40mm',     u:'M3'},
    {k:'m20mm',      lbl:'Metal 20mm',     u:'M3'},
    {k:'m12_10',     lbl:'Metal 12-10mm',  u:'M3'},
    {k:'bricks',     lbl:'Bricks',         u:'Nos'},
    {k:'ms_bars',    lbl:'MS/TMT Bars',    u:'MT'},
    {k:'bitumen',    lbl:'Bitumen VG-30',  u:'MT'},
  ];

  var tbodiesCC='',i,it,cf,desc,j,m,f,nq;
  for(i=0;i<items.length;i++){
    it=items[i];cf=it.cf||{};
    var itMats=[];
    for(j=0;j<MATS.length;j++){
      m=MATS[j];f=cf[m.k]||0;
      if(f>0){
        nq=Math.round(f*it.qty*1000)/1000;
        itMats.push({lbl:m.lbl,u:m.u,factor:f,netQty:nq});
      }
    }
    var rowspan=itMats.length||1;
    desc=(it.desc||"").length>100?(it.desc||"").substring(0,100)+'...':it.desc;
    if(!itMats.length){continue;}
    var h='';
    for(j=0;j<itMats.length;j++){
      h+='<tr>';
      if(j===0){
        h+='<td class="cc-no" rowspan="'+rowspan+'">'+it.no+'</td>'
          +'<td class="cc-desc" rowspan="'+rowspan+'">'+desc+'</td>'
          +'<td class="cc-unit" rowspan="'+rowspan+'">'+it.unit+'</td>'
          +'<td class="cc-qty" rowspan="'+rowspan+'">'+it.qty.toFixed(3)+'</td>';
      }
      h+='<td style="font-size:.62rem">'+itMats[j].lbl+'</td>'
        +'<td class="r" style="font-size:.61rem;font-family:monospace">'+itMats[j].factor.toFixed(3)+'</td>'
        +'<td class="r" style="font-weight:700;font-family:monospace;color:var(--gr)">'+itMats[j].netQty+'</td>'
        +'<td style="font-size:.59rem;color:#666">'+itMats[j].u+'</td>'
        +'</tr>';
    }
    h+='<tr style="height:3px"><td colspan="8" style="background:var(--bd);padding:0"></td></tr>';
    tbodiesCC+='<tbody class="cc-item-grp">'+h+'</tbody>';
  }
  if(!tbodiesCC){
    tb.innerHTML='<tr><td colspan="7" class="ni">Add items to generate</td></tr>';
    return;
  }
  /* Last tbody ला stamp सोबत replace करतो — page-break-inside:avoid */
  var ccStampHTML=getSheetStampHTML('p6');
  if(ccStampHTML){
    /* शेवटची </tbody> काढतो आणि stamp सह नवीन टाकतो */
    var lastClose=tbodiesCC.lastIndexOf('</tbody>');
    if(lastClose!==-1){
      tbodiesCC=tbodiesCC.substring(0,lastClose)
        +'<tr class="noprt-row"><td colspan="8" style="padding:0;border:none">'+ccStampHTML+'</td></tr>'
        +'</tbody>';
      /* त्या last tbody ला page-break-inside:avoid add करतो */
      var lastOpen=tbodiesCC.lastIndexOf('<tbody class="cc-item-grp">');
      if(lastOpen!==-1){
        tbodiesCC=tbodiesCC.substring(0,lastOpen)
          +'<tbody class="cc-item-grp" style="page-break-inside:avoid;break-inside:avoid">'
          +tbodiesCC.substring(lastOpen+'<tbody class="cc-item-grp">'.length);
      }
    }
  }
  var theadCC=tblCC.querySelector('thead');
  tblCC.innerHTML='';
  if(theadCC)tblCC.appendChild(theadCC);
  var tmpCC=document.createElement('div');
  tmpCC.innerHTML='<table>'+tbodiesCC+'</table>';
  var newTbodiesCC=tmpCC.querySelectorAll('tbody');
  for(var tci=0;tci<newTbodiesCC.length;tci++)tblCC.appendChild(newTbodiesCC[tci]);
  var firstCC=tblCC.querySelector('tbody');
  if(firstCC)firstCC.id='ccTb';
}

/* ── LEAD SUMMARY ────────────────────────────────────────────────────── */
function rLC(){
  var tb=R('lcTb');if(!tb)return;
  if(!items.length){tb.innerHTML='<tr><td colspan="12" class="ni">Add items to generate</td></tr>';return;}
  /* gkm: get km for a material from leadMats array */
  function gkm(it2,k){var j,lm=it2.leadMats||[];
    for(j=0;j<lm.length;j++)if(lm[j].mat===k)return lm[j].km>0?lm[j].km:'--';
    return '--';}
  /* gbitamt: get bitumen lead+change total for display */
  function gbitamt(it2){var j,lm=it2.leadMats||[],tot=0,has=false;
    for(j=0;j<lm.length;j++)if(lm[j].mat==='bitumen'||lm[j].mat==='bitumen_change'){tot+=lm[j].add;has=true;}
    return has?'\u20b9'+fmt(tot):'--';}
  var h='',i,it,desc,bitkm;
  for(i=0;i<items.length;i++){
    it=items[i];desc=(it.desc||"").length>60?(it.desc||"").substring(0,60)+'...':it.desc;
    /* bitumen km from LEAD_KM global */
    bitkm=(LEAD_KM['bitumen']||0)>0?(LEAD_KM['bitumen']||0):'--';
    /* show bitumen km cell only if item has bitumen CF */
    var hasBit=it.cf&&it.cf.bitumen>0;
    h+='<tr><td>'+(i+1)+'</td><td class="or">'+it.no+'</td>'
      +'<td style="max-width:145px;font-size:.6rem">'+desc+'</td>'
      +'<td style="font-size:.56rem">'+it.unit+'</td>'
      +'<td class="r">'+it.qty.toFixed(3)+'</td>'
      +'<td class="r">'+gkm(it,'cement_bags')+'</td>'
      +'<td class="r">'+gkm(it,'scr_sand')+'</td>'
      +'<td class="r">'+gkm(it,'m40mm')+'</td>'
      +'<td class="r">'+gkm(it,'m20mm')+'</td>'
      +'<td class="r">'+gkm(it,'ms_bars')+'</td>'
      +'<td class="r" style="color:var(--pu)">'+(hasBit?bitkm:'--')+'</td>'
      +'<td class="r pu" style="font-weight:700">\u20b9'+fmt(it.leadPerUnit*it.qty)+'</td></tr>';
  }
  tb.innerHTML=h;
}

/* ── ROYALTY ─────────────────────────────────────────────────────────── */
function rRoy(){
  var S=gS(),tb=R('royTb');if(!tb)return;
  var tblRoy=tb.parentNode;
  if(!items.length){tb.innerHTML='<tr><td colspan="8" class="ni">Add items to generate</td></tr>';return;}
  var tRS=0,tRC=0,tbodiesRoy='',i,it,cf,sF,cF,nS,nC,rS,rC,desc,matRows,rowspan,j;
  for(i=0;i<items.length;i++){
    it=items[i];cf=it.cf||{};
    sF=(cf.scr_sand||0)+(cf.sand||0)+(cf.quarry||0);
    cF=(cf.m40mm||0)+(cf.m20mm||0)+(cf.m12_10||0)+(cf.overmetal||0)+(cf.rubble||0);
    nS=Math.round(sF*it.qty*1000)/1000;
    nC=Math.round(cF*it.qty*1000)/1000;
    rS=Math.round(nS*S.royS);
    rC=Math.round(nC*S.royC);
    tRS+=rS;tRC+=rC;
    matRows=[];
    if(sF>0)matRows.push({lbl:'Sand / Quarry (M3)',factor:sF.toFixed(3),netQty:nS.toFixed(3),roy:rS>0?'\u20b9'+fmt(rS):'0',hasRoy:rS>0});
    if(cF>0)matRows.push({lbl:'Coarse Aggregate (M3)',factor:cF.toFixed(3),netQty:nC.toFixed(3),roy:rC>0?'\u20b9'+fmt(rC):'0',hasRoy:rC>0});
    if(!matRows.length){continue;}
    rowspan=matRows.length;
    desc=(it.desc||"").length>110?(it.desc||"").substring(0,110)+'...':it.desc;
    var h='';
    for(j=0;j<matRows.length;j++){
      var mr=matRows[j];
      h+='<tr>';
      if(j===0){
        h+='<td class="cc-no" rowspan="'+rowspan+'">'+it.no+'</td>'
          +'<td class="cc-desc" rowspan="'+rowspan+'">'+desc+'</td>'
          +'<td class="cc-unit" rowspan="'+rowspan+'">'+it.unit+'</td>'
          +'<td class="cc-qty" rowspan="'+rowspan+'">'+it.qty.toFixed(3)+'</td>';
      }
      h+='<td style="font-size:.62rem'+(mr.none?';color:var(--mu);font-style:italic':'')+'">'+(mr.lbl)+'</td>'
        +'<td class="r" style="font-family:monospace;font-size:.61rem">'+(mr.factor)+'</td>'
        +'<td class="r" style="font-family:monospace;font-size:.61rem">'+(mr.netQty)+'</td>'
        +'<td class="r" style="font-weight:700;color:var(--or)">'+(mr.roy)+'</td>'
        +'</tr>';
    }
    h+='<tr style="height:3px"><td colspan="8" style="background:var(--bd);padding:0"></td></tr>';
    tbodiesRoy+='<tbody class="roy-item-grp">'+h+'</tbody>';
  }
  /* Footer totals */
  var footerH='';
  if(tRS>0||tRC>0){
    footerH='<tr class="tfooter"><td colspan="4" style="text-align:right">Total Sand/Quarry Royalty</td>'
      +'<td colspan="2"></td><td></td><td class="r or">\u20b9'+fmt(tRS)+'</td></tr>'
      +'<tr class="tfooter"><td colspan="4" style="text-align:right">Total Coarse Royalty</td>'
      +'<td colspan="2"></td><td></td><td class="r or">\u20b9'+fmt(tRC)+'</td></tr>'
      +'<tr class="tfooter"><td colspan="4" style="text-align:right;font-size:.76rem;font-weight:900">Total Royalty</td>'
      +'<td colspan="2"></td><td></td><td class="r or" style="font-size:.76rem;font-weight:900">\u20b9'+fmt(tRS+tRC)+'</td></tr>';
  }
  if(!tbodiesRoy){
    tb.innerHTML='<tr><td colspan="8" style="text-align:center;padding:1.2rem;color:var(--mu)">No royalty materials in added items</td></tr>';
    return;
  }
  /* Last item tbody + footer + stamp एकाच tbody मध्ये → page-break-inside:avoid */
  var royStampHTML=getSheetStampHTML('p7');
  var lastTbodyOpen=tbodiesRoy.lastIndexOf('<tbody class="roy-item-grp">');
  if(lastTbodyOpen!==-1){
    var lastTbodyClose=tbodiesRoy.lastIndexOf('</tbody>');
    /* last tbody मधील content काढतो */
    var lastTbodyContent=tbodiesRoy.substring(lastTbodyOpen+'<tbody class="roy-item-grp">'.length, lastTbodyClose);
    tbodiesRoy=tbodiesRoy.substring(0,lastTbodyOpen)
      +'<tbody class="roy-item-grp" style="page-break-inside:avoid;break-inside:avoid">'
      +lastTbodyContent
      +footerH
      +(royStampHTML?'<tr class="noprt-row"><td colspan="8" style="padding:0;border:none">'+royStampHTML+'</td></tr>':'')
      +'</tbody>';
  } else {
    /* items नाहीत पण footer आहे */
    tbodiesRoy+='<tbody style="page-break-inside:avoid;break-inside:avoid">'+footerH
      +(royStampHTML?'<tr class="noprt-row"><td colspan="8" style="padding:0;border:none">'+royStampHTML+'</td></tr>':'')
      +'</tbody>';
  }
  var theadRoy=tblRoy.querySelector('thead');
  tblRoy.innerHTML='';
  if(theadRoy)tblRoy.appendChild(theadRoy);
  var tmpRoy=document.createElement('div');
  tmpRoy.innerHTML='<table>'+tbodiesRoy+'</table>';
  var newTbodiesRoy=tmpRoy.querySelectorAll('tbody');
  for(var tri=0;tri<newTbodiesRoy.length;tri++)tblRoy.appendChild(newTbodiesRoy[tri]);
  var firstRoy=tblRoy.querySelector('tbody');
  if(firstRoy)firstRoy.id='royTb';
}

/* ── FINAL ESTIMATE ──────────────────────────────────────────────────── */
function rFE(){
  var S=gS(),tb=R('feTb');if(!tb)return;
  if(!items.length){tb.innerHTML='<tr><td colspan="2" class="ni">Add items to generate</td></tr>';return;}
  var A=0,i;for(i=0;i<items.length;i++)A+=items[i].amount;
  var roy=calcRoyTotal(S);
  var mtfEl=R('mtfTotal');var mtf=mtfEl?Math.round(parseFloat(mtfEl.textContent)||0):0;
  var ABC=A+roy+mtf;
  var gst=Math.round(A*S.gst/100),cont=Math.round(A*S.cont/100),li=Math.round(A*S.li/100);
  var specF=0; /* Area % now included in each item's finalRate — not added separately */
  var extraTotalFE=0;if(S.extraRows&&S.extraRows.length){for(var _eife=0;_eife<S.extraRows.length;_eife++){if(S.extraRows[_eife].pct>0)extraTotalFE+=Math.round(A*S.extraRows[_eife].pct/100);}}
  var grand=ABC+gst+cont+li+extraTotalFE;
  var h='<tr><td>Cost of Work</td>'
    +'<td class="r gr" style="font-weight:700">\u20b9'+fmt(A)+'</td></tr>'
    +'<tr><td style="color:var(--mu)">Royalty</td>'
    +'<td class="r">\u20b9'+fmt(roy)+'</td></tr>'
    +(mtf>0?'<tr><td style="color:var(--mu)">Material Testing</td>'
    +'<td class="r">\u20b9'+fmt(mtf)+'</td></tr>':'')
    +'<tr style="background:var(--bg)">'
    +'<td style="text-align:right;font-weight:700">Total (A + B + C)</td>'
    +'<td class="r" style="font-weight:700">\u20b9'+fmt(ABC)+'</td></tr>'
    +'<tr style="height:5px"><td colspan="2" style="padding:0"></td></tr>'
    +(S.gst>0?'<tr><td style="color:var(--mu)">Add '+S.gst+'% GST</td>'
    +'<td class="r">\u20b9'+fmt(gst)+'</td></tr>':'')
    +(S.cont>0?'<tr><td style="color:var(--mu)">Add '+S.cont+'% Contingencies</td>'
    +'<td class="r">\u20b9'+fmt(cont)+'</td></tr>':'')
    +(S.li>0?'<tr><td style="color:var(--mu)">Add '+S.li+'% Labour Insurance</td>'
    +'<td class="r">\u20b9'+fmt(li)+'</td></tr>':'');
  /* specF row removed — Area % is now included in each item's finalRate */
  if(S.extraRows&&S.extraRows.length){
    for(var _ei2=0;_ei2<S.extraRows.length;_ei2++){
      var _er=S.extraRows[_ei2];
      if(_er.pct>0){
        var _eamt=Math.round(A*_er.pct/100);
        h+='<tr style="background:#e8f5e9">'
          +'<td style="color:#1b5e20;font-size:.63rem">Add '+_er.pct+'% for '+(_er.lbl||'Extra')+'</td>'
          +'<td class="r" style="color:#1b5e20;font-weight:700">\u20b9'+fmt(_eamt)+'</td></tr>';
      }
    }
  }
  h+='<tr style="height:5px"><td colspan="2" style="padding:0"></td></tr>'
    +'<tr style="background:#18150f;color:#fff">'
    +'<td style="text-align:right;font-weight:900;font-size:.84rem;padding:.4rem .44rem">Grand Total</td>'
    +'<td class="r" style="font-weight:900;font-size:.84rem;color:#f5a623">₹'+fmtW(grand)+'</td></tr>'
    +'<tr style="background:var(--bg)"><td style="text-align:right;font-size:.7rem;color:var(--mu)">= Rs.</td>'
    +'<td class="r" style="font-size:.72rem;font-weight:700">'+(grand/100000).toFixed(2)+' Lakhs</td></tr>';
  tb.innerHTML=h;
}

function rSum(){
  var S=gS(),A=0,i;for(i=0;i<items.length;i++)A+=items[i].amount;
  var roy=calcRoyTotal(S);
  var mtfEl=R('mtfTotal');var mtf=mtfEl?Math.round(parseFloat(mtfEl.textContent)||0):0;
  var ABC=A+roy+mtf;
  var gst=Math.round(A*S.gst/100),cont=Math.round(A*S.cont/100),li=Math.round(A*S.li/100);
  var specF=0; /* Area % now included in each item's finalRate — not added separately */
  var extraTotal2=0;var S2=gS();if(S2.extraRows&&S2.extraRows.length){for(var _ei3=0;_ei3<S2.extraRows.length;_ei3++){if(S2.extraRows[_ei3].pct>0)extraTotal2+=Math.round(A*S2.extraRows[_ei3].pct/100);}}
  var grand=ABC+gst+cont+li+extraTotal2;
  se('sA','\u20b9'+fmt(A));se('gaA','\u20b9'+fmt(A));
  se('gaB','\u20b9'+fmt(roy));
  se('gaC','\u20b9'+fmt(mtf));
  se('gaABC','\u20b9'+fmt(ABC));
  se('lGST','+ GST '+S.gst+'%');
  se('lCont','+ Cont. '+S.cont+'%');se('lLI','+ Labour '+S.li+'%');
  se('gaGST','\u20b9'+fmt(gst));se('gaCont','\u20b9'+fmt(cont));se('gaLI','\u20b9'+fmt(li));
  var gaFEl=R('gaF'),lFEl=R('lF'),gaFRow=R('gaFRow');
  if(gaFRow)gaFRow.style.display='none'; /* Area % now in item rates — row always hidden */
  if(gaFEl)gaFEl.textContent='\u20b9'+fmt(specF);
  if(lFEl)lFEl.textContent='+ Area '+S.areaPct+'% ('+S.areaLbl.substring(0,22)+')';
  se('gaGrand','\u20b9'+fmtW(grand));se('gaLk','= '+(grand/100000).toFixed(3)+' Lakhs');
  var h='';
  for(i=0;i<items.length;i++){
    var it=items[i];
    h+='<div class="sr" style="font-size:.64rem"><span>'
      +'<b style="color:var(--or)">'+it.no+'</b> '+it.qty.toFixed(3)+' '+it.unit+'</span>'
      +'<span class="sv">\u20b9'+fmt(it.amount)+'</span></div>';
  }
  var ar=R('absRows');if(ar)ar.innerHTML=h;
}
function goTab(n){
  if(n===9&&typeof scRender==='function')scRender();
  if(n===12&&typeof spRedraw==='function'){
    spRedraw();
    document.removeEventListener('keydown',window._planKeyHandler||function(){});
    document.removeEventListener('keydown',window._spKeyHandler||function(){});
    window._spKeyHandler=function(e){if(e.key==='Delete'||e.key==='Backspace'){if(document.activeElement&&(document.activeElement.tagName==='INPUT'||document.activeElement.tagName==='TEXTAREA'||document.activeElement.tagName==='SELECT'))return;spDeleteSelected();}};document.addEventListener('keydown',window._spKeyHandler);
  }
  if(n===18){
    if(typeof planRedraw==='function')planRedraw();
    document.removeEventListener('keydown',window._spKeyHandler||function(){});
    document.removeEventListener('keydown',window._planKeyHandler||function(){});
    if(typeof window._planKeyHandler==='function')document.addEventListener('keydown',window._planKeyHandler);
  }
  if(n!==12&&n!==18){document.removeEventListener('keydown',window._spKeyHandler||function(){});document.removeEventListener('keydown',window._planKeyHandler||function(){});}
  if(n===13)rCFTab();
  if(n===14&&typeof loadBrowse==="function")loadBrowse();
  if(n===15){/* Contact tab */}
  if(n===16){/* Documents tab */}
  if(n===17){fillScheduleB();fillScheduleC(false);}

  var i,p,t;
  for(i=0;i<=19;i++){
    p=R('p'+i);if(p)p.classList.toggle('on',i===n);
    t=R('t'+i);if(t)t.classList.toggle('on',i===n);
  }
  /* Update pth-work (Name of Work) in active panel */
  var wk=(R('pName')||{}).value||'';
  document.querySelectorAll('.pth-work').forEach(function(el){el.textContent=wk;});
  /* Scroll active tab into view */
  var at=R('t'+n);if(at)at.scrollIntoView({inline:'center',behavior:'smooth',block:'nearest'});
  /* Scroll main panel area to top */
  var mainEl=document.querySelector('.main');if(mainEl){mainEl.scrollTop=0;mainEl.scrollLeft=0;}
  try{sessionStorage.setItem('_lastTab',n);}catch(e){}
}
/* printAll defined in ATP module */
function getStore(){try{var s=localStorage.getItem(STORE_KEY);return s?JSON.parse(s):{};
}catch(e){return{};}}
function putStore(d){try{localStorage.setItem(STORE_KEY,JSON.stringify(d));
}catch(e){alert('Storage error: '+e.message);}}

function saveEstimate(){
  var nm=((R('pName')||{}).value||'').trim();
  if(!nm){alert('Please enter the Name of Work first.');return;}
  var d=getStore();if(d[nm]&&!confirm('Estimate "'+nm+'" already exists. Overwrite it?'))return;
  var lkm={};for(var i=0;i<LCD.length;i++){var el=R('lkm_'+i);if(el)lkm[i]=parseFloat(el.value)||0;}
  /* Also save LEAD_KM and LEAD_LOC for full restore */
  var lkmFull={};
  if(typeof LEAD_KM!=='undefined'){for(var _k in LEAD_KM)lkmFull[_k]=LEAD_KM[_k];}
  var llocFull={};
  if(typeof LEAD_LOC!=='undefined'){for(var _l in LEAD_LOC)llocFull[_l]=LEAD_LOC[_l];}
  var mtfSave={};if(typeof mtfData!=='undefined'){for(var _sm=0;_sm<mtfData.length;_sm++)mtfSave[mtfData[_sm].sr]=mtfData[_sm].cost;}
  /* Save extra rows (Electrification, Water Supply etc.) */
  var extraRowsSave=(typeof EXTRA_ROWS!=='undefined')?JSON.parse(JSON.stringify(EXTRA_ROWS)):[];
  /* Save steel calculator rows */
  var steelRowsSave=(typeof steelRows!=='undefined')?JSON.parse(JSON.stringify(steelRows)):[];
  /* Save advanced steel calculator sections */
  var scSecsSave=(typeof scSecs!=='undefined')?JSON.parse(JSON.stringify(scSecs)):[];
  /* Save plan tab drawing data */
  var planDataSave = (typeof window._getPlanData === 'function') ? window._getPlanData() : null;
  /* Save lead map drawing data */
  var leadMapDataSave = null;
  if(typeof SP !== 'undefined'){
    leadMapDataSave = { shapes: JSON.parse(JSON.stringify(SP.shapes)),
      bgImgX: SP.bgImgX||0, bgImgY: SP.bgImgY||0,
      bgImgW: SP.bgImgW||0, bgImgH: SP.bgImgH||0 };
    if(SP.bgImg){
      try{
        var _ltc=document.createElement('canvas');
        _ltc.width=SP.bgImgW||400; _ltc.height=SP.bgImgH||300;
        _ltc.getContext('2d').drawImage(SP.bgImg,0,0,_ltc.width,_ltc.height);
        leadMapDataSave.bgImgData=_ltc.toDataURL('image/jpeg',0.55);
      }catch(_le){}
    }
  }
  d[nm]={nm:nm,dt:new Date().toLocaleDateString('en-IN'),
    meta:{pName:((R('pName')||{}).value||''),pSub:((R('pSub')||{}).value||''),
      pDiv:((R('pDiv')||{}).value||''),pCir:((R('pCir')||{}).value||''),
      pReg:((R('pReg')||{}).value||''),
      sGST:pf('sGST'),sCont:pf('sCont'),sLI:pf('sLI'),sRS:pf('sRS'),sRC:pf('sRC'),
      cancelScada:(CANCEL_SCADA||false),customScadaVal:(CUSTOM_SCADA_VAL||-126)},
    lkm:lkm,leadKm:lkmFull,leadLoc:llocFull,mtfCosts:mtfSave,
    extraRows:extraRowsSave,steelRows:steelRowsSave,scSecs:scSecsSave,
    planData:planDataSave, leadMapData:leadMapDataSave,
    items:items};
  putStore(d);renderSaveList();
  if(typeof CU!=="undefined"&&CU&&window.firebase&&firebase.firestore){
    var _cov={pName:d[nm].meta.pName,pSub:d[nm].meta.pSub,pDiv:d[nm].meta.pDiv,pCir:d[nm].meta.pCir,pReg:d[nm].meta.pReg};
    /* Compute grand total properly */
    var _grand=0;
    try{
      var _A=0;for(var _ii=0;_ii<items.length;_ii++)_A+=items[_ii].amount;
      var _S=gS();
      var _roy=calcRoyTotal(_S);
      var _mtfEl=R('mtfTotal');var _mtf=_mtfEl?Math.round(parseFloat(_mtfEl.textContent)||0):0;
      var _ABC=_A+_roy+_mtf;
      var _specF=0; /* Area % now in item finalRates */
      var _extT=0;if(_S.extraRows&&_S.extraRows.length){for(var _ei=0;_ei<_S.extraRows.length;_ei++){if(_S.extraRows[_ei].pct>0)_extT+=Math.round(_A*_S.extraRows[_ei].pct/100);}}
      _grand=_ABC+Math.round(_A*_S.gst/100)+Math.round(_A*_S.cont/100)+Math.round(_A*_S.li/100)+_specF+_extT;
    }catch(_ge){}
    var _cdoc={name:nm,uid:CU.uid,cover:_cov,items:items,grand:_grand,
      lkm:lkm,leadKm:lkmFull,leadLoc:llocFull,mtfCosts:mtfSave,
      extraRows:extraRowsSave,steelRows:steelRowsSave,scSecs:scSecsSave,
      planData:planDataSave, leadMapData:leadMapDataSave,
      settings:{gst:pf('sGST'),cont:pf('sCont'),li:pf('sLI'),royS:pf('sRS'),royC:pf('sRC'),
        cancelScada:(CANCEL_SCADA||false),customScadaVal:(CUSTOM_SCADA_VAL||-126)},
      updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
    firebase.firestore().collection("estimates").where("name","==",nm).where("uid","==",CU.uid).limit(1).get()
      .then(function(_s){return _s.empty?firebase.firestore().collection("estimates").add(_cdoc):_s.docs[0].ref.update(_cdoc);})
      .then(function(){showToast("\u2705 Saved locally & to cloud","success");})
      .catch(function(){showToast("\u2705 Saved locally","success");});
  } else {
    showToast("\u2705 Estimate saved: \""+nm+"\"","success");
  }
}
function loadEstimate(nm){
  var d=getStore();var est=d[nm];if(!est)return;var m=est.meta||{};
  ['pName','pSub','pDiv','pCir','pReg'].forEach(function(id){var el=R(id);if(el)el.value=m[id]||'';});
  ['sGST','sCont','sLI','sRS','sRC'].forEach(function(id){var el=R(id);if(el)el.value=m[id]||0;});
  /* Restore SCADA settings */
  CANCEL_SCADA=(m.cancelScada||false);
  CUSTOM_SCADA_VAL=(m.customScadaVal!=null?m.customScadaVal:-126);
  var _scBtn=document.getElementById('scadaCancelBtn');
  if(_scBtn){if(CANCEL_SCADA){_scBtn.textContent='✅ SCADA Cancelled';_scBtn.style.background='#e8f5e9';_scBtn.style.color='#2e7d32';_scBtn.style.borderColor='#2e7d32';}else{_scBtn.textContent='❌ SCADA Deduction Active';_scBtn.style.background='#fff';_scBtn.style.color='#c62828';_scBtn.style.borderColor='#c62828';}}
  var _scInp=document.getElementById('sScadaVal');
  if(_scInp)_scInp.value=CUSTOM_SCADA_VAL;
  /* Restore lead KM from index-based lkm and key-based leadKm */
  if(est.leadKm){for(var _lk in est.leadKm){if(typeof LEAD_KM!=='undefined')LEAD_KM[_lk]=est.leadKm[_lk];}}
  if(est.leadLoc){for(var _ll in est.leadLoc){if(typeof LEAD_LOC!=='undefined')LEAD_LOC[_ll]=est.leadLoc[_ll];}}
  /* Restore MTF test costs */
  if(est.mtfCosts&&typeof mtfData!=='undefined'){for(var _rk in est.mtfCosts){var _rr=mtfData.find(function(r){return r.sr===parseInt(_rk)||r.sr===_rk;});if(_rr)_rr.cost=parseFloat(est.mtfCosts[_rk])||0;}}
  /* Restore steel calculator simple rows */
  if(est.steelRows&&typeof steelRows!=='undefined'){steelRows=JSON.parse(JSON.stringify(est.steelRows));if(typeof renderSteel==='function')renderSteel();}
  /* Restore advanced steel calculator sections (Footing 1, Footing 2, Column 1, Column 2 etc.) */
  if(est.scSecs&&typeof scSecs!=='undefined'){scSecs=JSON.parse(JSON.stringify(est.scSecs));if(typeof scUID==='undefined')window.scUID=0;if(est.scSecs.length){var _mxId=0;est.scSecs.forEach(function(s){var n=parseInt((s.id||'0').toString().replace(/[^0-9]/g,''))||0;if(n>_mxId)_mxId=n;});scUID=_mxId;}if(typeof scRender==='function')scRender();}
  items=est.items||[];for(var i=0;i<items.length;i++)items[i]=recalcItem(items[i]);
  ['pName','pSub'].forEach(function(id){var ta=R(id);
    if(ta&&ta.tagName==='TEXTAREA'){ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';}});
  /* Rebuild lead chart first so inputs exist, then re-apply lkm values */
  if(typeof buildLCT==='function')buildLCT();
  var lk=est.lkm||{};
  for(var ki in lk){var el2=R('lkm_'+ki);if(el2){el2.value=lk[ki];onKmChange(parseInt(ki));}}
  upCover();upMeta();updateAll();
  /* Restore Plan tab drawing */
  if(est.planData && typeof window._setPlanData === 'function'){
    window._setPlanData(est.planData);
  }
  /* Restore Lead Map drawing */
  if(est.leadMapData && typeof SP !== 'undefined'){
    var _lmd = est.leadMapData;
    if(typeof spSaveHistory === 'function') spSaveHistory();
    SP.shapes = _lmd.shapes || [];
    SP.bgImgX = _lmd.bgImgX||20; SP.bgImgY = _lmd.bgImgY||20;
    SP.bgImgW = _lmd.bgImgW||0; SP.bgImgH = _lmd.bgImgH||0;
    SP.bgImg = null;
    if(_lmd.bgImgData){
      var _limg = new Image();
      _limg.onload = function(){
        SP.bgImg = _limg;
        SP.bgImgAspect = (_limg.height&&_limg.width)?_limg.width/_limg.height:1;
        if(typeof spRedraw === 'function') spRedraw();
        var _lb=R('spRemoveImgBtn'); if(_lb) _lb.style.display='';
        var _lo=R('spImgOpacityWrap'); if(_lo) _lo.style.display='flex';
      };
      _limg.src = _lmd.bgImgData;
    } else {
      if(typeof spRedraw === 'function') spRedraw();
    }
  }
  alert('\u2705 Estimate loaded: "'+nm+'"');}
function deleteEstimate(nm){
  if(!confirm('Delete estimate "'+nm+'"? This cannot be undone.'))return;
  var d=getStore();delete d[nm];putStore(d);renderSaveList();}
function renderSaveList(){
  var el=R('saveList');if(!el)return;
  var d=getStore();var keys=Object.keys(d);
  if(!keys.length){el.innerHTML='<div style="color:var(--mu);font-size:.62rem;padding:.5rem 0;font-style:italic">No saved estimates yet</div>';return;}
  var h='';
  for(var i=0;i<keys.length;i++){
    var k=keys[i];var est=d[k];var esc=k.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    h+='<div style="display:flex;align-items:center;gap:.3rem;padding:.32rem 0;border-bottom:1px solid var(--bd)">'
      +'<div style="flex:1"><div style="font-size:.66rem;font-weight:700">'+k+'</div>'
      +'<div style="font-size:.55rem;color:var(--mu)">'+(est.items||[]).length+' items &nbsp;&middot;&nbsp;'+(est.dt||'')+'</div></div>'
      +'<button class="btn bp" style="font-size:.54rem;padding:.22rem .44rem" onclick="loadEstimate(&quot;'+esc+'&quot;)">Load</button>'
      +'&nbsp;<button class="btn bs" style="font-size:.54rem;padding:.22rem .44rem;color:var(--rd)" onclick="deleteEstimate(&quot;'+esc+'&quot;)">Delete</button>'
      +'</div>';
  }el.innerHTML=h;}
function exportJSON(){
  var nm=((R('pName')||{}).value||'Estimate').trim();
  var lkm={};for(var i=0;i<LCD.length;i++){var el=R('lkm_'+i);if(el)lkm[i]=parseFloat(el.value)||0;}
  var data={version:1,exportedAt:new Date().toISOString(),
    meta:{pName:((R('pName')||{}).value||''),pSub:((R('pSub')||{}).value||''),
      pDiv:((R('pDiv')||{}).value||''),pCir:((R('pCir')||{}).value||''),
      pReg:((R('pReg')||{}).value||''),
      sGST:pf('sGST'),sCont:pf('sCont'),sLI:pf('sLI'),sRS:pf('sRS'),sRC:pf('sRC')},
    lkm:lkm,items:items};
  var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;
  a.download=(nm.replace(/[^a-zA-Z0-9 _-]/g,'_').substring(0,60)||'estimate')+'.json';
  a.click();URL.revokeObjectURL(url);}
function importJSON(){
  var inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';
  inp.onchange=function(e){
    var file=e.target.files[0];if(!file)return;
    var reader=new FileReader();
    reader.onload=function(ev){
      try{
        var data=JSON.parse(ev.target.result);
        if(!data.meta||!data.items)throw new Error('Invalid estimate file');
        var m=data.meta;
        ['pName','pSub','pDiv','pCir','pReg'].forEach(function(id){var el=R(id);if(el)el.value=m[id]||'';});
        ['sGST','sCont','sLI','sRS','sRC'].forEach(function(id){var el=R(id);if(el)el.value=m[id]||0;});
        var lk=data.lkm||{};
        for(var ki in lk){var el2=R('lkm_'+ki);if(el2){el2.value=lk[ki];onKmChange(parseInt(ki));}}
        items=data.items||[];for(var i=0;i<items.length;i++)items[i]=recalcItem(items[i]);
        ['pName','pSub'].forEach(function(id){var ta=R(id);
          if(ta&&ta.tagName==='TEXTAREA'){ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';}});
        upCover();upMeta();updateAll();alert('Loaded: "'+(m.pName||'estimate')+'"');
      }catch(err){alert('Import failed: '+err.message);}};
    reader.readAsText(file);};inp.click();}

/* ── STEEL CALCULATOR ────────────────────────────────────────────────── */
var steelRows = [];
function addSteelRow(){
  steelRows.push({desc:'Footing',L:0,B:0,H:0,dia:10,nos:1});
  renderSteel();
}
function delSteelRow(i){
  steelRows.splice(i,1);renderSteel();
}
function upSteelRow(i,field,val){
  steelRows[i][field]=parseFloat(val)||0;
  renderSteel();
}
function renderSteel(){
  var tb=R('steelBody');if(!tb)return;
  if(!steelRows.length){tb.innerHTML='<tr><td colspan="10" class="ni">Click + Add Row to start</td></tr>';R('steelGrandTotal').textContent='0.00';return;}
  var h='',total=0;
  for(var i=0;i<steelRows.length;i++){
    var r=steelRows[i];
    /* Cutting length = L (user can manually adjust later if needed) */
    var cutLen=r.L||0;
    /* Weight per meter = Dia² × 0.00617 */
    var wtPerM=(r.dia*r.dia*0.00617)||0;
    /* Total weight = cutLen × nos × wtPerM */
    var totWt=(cutLen*r.nos*wtPerM)||0;
    total+=totWt;
    h+='<tr>'
      +'<td><input value="'+(r.desc||'')+'" oninput="steelRows['+i+'].desc=this.value" style="width:95px;font-size:.62rem;padding:.14rem"></td>'
      +'<td><input type="number" value="'+r.L+'" oninput="upSteelRow('+i+',\'L\',this.value)" step="0.01" style="width:48px;font-size:.62rem;padding:.14rem;text-align:right"></td>'
      +'<td><input type="number" value="'+r.B+'" oninput="upSteelRow('+i+',\'B\',this.value)" step="0.01" style="width:48px;font-size:.62rem;padding:.14rem;text-align:right"></td>'
      +'<td><input type="number" value="'+r.H+'" oninput="upSteelRow('+i+',\'H\',this.value)" step="0.01" style="width:48px;font-size:.62rem;padding:.14rem;text-align:right"></td>'
      +'<td><input type="number" value="'+r.dia+'" oninput="upSteelRow('+i+',\'dia\',this.value)" step="1" style="width:48px;font-size:.62rem;padding:.14rem;text-align:right"></td>'
      +'<td><input type="number" value="'+r.nos+'" oninput="upSteelRow('+i+',\'nos\',this.value)" step="1" style="width:43px;font-size:.62rem;padding:.14rem;text-align:right"></td>'
      +'<td class="r" style="font-family:monospace;font-weight:700;color:var(--bl)">'+cutLen.toFixed(2)+'</td>'
      +'<td class="r" style="font-family:monospace;font-size:.6rem;color:var(--mu)">'+wtPerM.toFixed(3)+'</td>'
      +'<td class="r" style="font-family:monospace;font-weight:700;color:var(--gr)">'+totWt.toFixed(2)+'</td>'
      +'<td><button class="dbt" onclick="delSteelRow('+i+')">&times;</button></td>'
      +'</tr>';
  }
  tb.innerHTML=h;
  /* Grand total in Quintal (1 quintal = 100 kg) */
  var quintals=(total/100)||0;
  R('steelGrandTotal').textContent=quintals.toFixed(3);
}
/* ── STEEL CALCULATOR (TMT FE-500) ───────────────────────────────────── */
/* ══ STEEL CALCULATOR ══════════════════════════════════════════════ */
var scSecs=[];
var scUID=0;

/* Section type definitions */
var scTypes={
  Footing:{
    color:'#1b5e20',bg:'#e8f5e9',bc:'#4caf50',
    fields:[
      {k:'nos',lbl:'Number of Footings',def:1,step:1},
      {k:'len',lbl:'Length (mm)',def:750,step:10},
      {k:'wid',lbl:'Width (mm)',def:500,step:10},
      {k:'cover',lbl:'Cover (mm)',def:50,step:5},
      {k:'depth',lbl:'Depth (mm)',def:1500,step:10},
      {k:'dia',lbl:'Main Dia (mm)',def:16,step:1},
      {k:'spc',lbl:'Main Spacing (mm)',def:120,step:10}
    ],
    calc:function(v){
      var nos=v.nos||0,len=v.len||0,wid=v.wid||0,cover=v.cover||50,depth=v.depth||0,dia=v.dia||16,spc=v.spc||120;
      var eff_len=len-2*cover;
      var eff_wid=wid-2*cover;
      var bars_x=Math.ceil(eff_wid/spc);
      var bars_y=Math.ceil(eff_len/spc);
      var cut_len_x=eff_len/1000;
      var cut_len_y=eff_wid/1000;
      var tot_len=(bars_x*cut_len_x+bars_y*cut_len_y);
      var kg_per_m=0.00617*dia*dia;
      var wt_one=kg_per_m*tot_len;
      var wt_all=wt_one*nos;
      return{rows:[
        {l:'Effective Length (mm)',v:eff_len.toFixed(0)},
        {l:'Effective Width (mm)',v:eff_wid.toFixed(0)},
        {l:'Bars in X direction',v:bars_x},
        {l:'Bars in Y direction',v:bars_y},
        {l:'Cut length per X-bar (m)',v:cut_len_x.toFixed(2)},
        {l:'Cut length per Y-bar (m)',v:cut_len_y.toFixed(2)},
        {l:'Total length all bars (m)',v:tot_len.toFixed(2)},
        {l:'Kg per meter',v:kg_per_m.toFixed(6)},
        {l:'Total steel per footing (kg)',v:wt_one.toFixed(4)},
        {l:'Total steel all footings (kg)',v:wt_all.toFixed(4)}
      ],grand:wt_all};
    }
  },
  Column:{
    color:'#b71c1c',bg:'#ffebee',bc:'#f44336',
    fields:[
      {k:'nos',lbl:'Number of columns',def:4,step:1},
      {k:'width',lbl:'Column width b (mm)',def:450,step:10},
      {k:'depth',lbl:'Column depth h (mm)',def:230,step:10},
      {k:'height',lbl:'Clear height H (mm)',def:3900,step:100},
      {k:'cover',lbl:'Cover (mm)',def:40,step:5},
      {k:'mainDia',lbl:'Main bar dia (mm)',def:16,step:1},
      {k:'mainNos',lbl:'Number of main bars',def:4,step:1},
      {k:'stirDia',lbl:'Stirrup dia (mm)',def:8,step:1},
      {k:'stirSpc',lbl:'Stirrup spacing s (mm)',def:150,step:10},
      {k:'devLen',lbl:'Dev/Lap length per main bar (mm)',def:500,step:50}
    ],
    calc:function(v){
      /* Excel cell mapping */
      var E23=v.nos||0, E24=v.width||0, E25=v.depth||0, E26=v.height||0;
      var E27=v.cover||40, E28=v.mainDia||16, E29=v.mainNos||4, E30=v.stirDia||8;
      var E31=v.stirSpc||150, E32=2*9*E30, E33=v.devLen||500;
      
      /* Excel formulas EXACT */
      var G23 = E24 - 2*E27;  // b_clear
      var G24 = E25 - 2*E27;  // h_clear
      var G25 = 2*(G23 + G24)/1000;  // P_st
      var G26 = E32/1000;  // hook_m
      var G27 = G25 + G26;  // L_st_one
      var G28 = Math.floor(E26/E31) + 1;  // n_st
      var G29 = G27 * G28;  // L_st_total
      var G30 = 0.0061685 * E30 * E30;  // kg/m stirrup
      var G31 = G29 * G30;  // wt_stir_one
      var G32 = G31 * E23;  // wt_stir_all
      var G33 = (E26 + E33)/1000;  // L_main_one
      var G34 = G33 * E29;  // L_main_total
      var G35 = 0.0061685 * E28 * E28;  // kg/m main
      var G36 = G34 * G35;  // wt_main_one
      var G37 = G36 * E23;  // wt_main_all
      var G38 = G31 + G36;  // wt_per_col
      var G39 = G32 + G37;  // wt_all_cols
      
      return{rows:[
        {l:'Effective width b_clear (mm)',v:G23.toFixed(0)},
        {l:'Effective depth h_clear (mm)',v:G24.toFixed(0)},
        {l:'Perimeter of stirrup P_st (m)',v:G25.toFixed(3)},
        {l:'Hook length per stirrup (m)',v:G26.toFixed(3)},
        {l:'Length of one stirrup L_st_one (m)',v:G27.toFixed(3)},
        {l:'Number of stirrups per column n_st',v:G28},
        {l:'Total stirrup length per column (m)',v:G29.toFixed(3)},
        {l:'Kg per meter for stirrup (kg/m)',v:G30.toFixed(6)},
        {l:'Weight of stirrups per column (kg)',v:G31.toFixed(6)},
        {l:'Total stirrups weight for all columns (kg)',v:G32.toFixed(4)},
        {l:'Length of one main bar (m)',v:G33.toFixed(2)},
        {l:'Total main bar length per column (m)',v:G34.toFixed(2)},
        {l:'Kg per meter for main bar (kg/m)',v:G35.toFixed(6)},
        {l:'Weight of main bars per column (kg)',v:G36.toFixed(6)},
        {l:'Total main bars weight for all columns (kg)',v:G37.toFixed(4)},
        {l:'Total steel per column (kg)',v:G38.toFixed(6)},
        {l:'Total steel for all columns (kg)',v:G39.toFixed(4)}
      ],grand:G39};
    }
  },
  Beam:{
    color:'#1565c0',bg:'#e3f2fd',bc:'#2196f3',
    fields:[
      {k:'nos',lbl:'Number of beams',def:4,step:1},
      {k:'span',lbl:'Span length L (mm)',def:5400,step:100},
      {k:'width',lbl:'Beam width b (mm)',def:300,step:10},
      {k:'depth',lbl:'Beam depth h (mm)',def:500,step:10},
      {k:'cover',lbl:'Cover (mm)',def:25,step:5},
      {k:'botDia',lbl:'Bottom bar dia (mm)',def:16,step:1},
      {k:'botNos',lbl:'Number of bottom bars',def:5,step:1},
      {k:'topDia',lbl:'Top bar dia (mm)',def:12,step:1},
      {k:'topNos',lbl:'Number of top bars',def:2,step:1},
      {k:'stirDia',lbl:'Stirrup dia (mm)',def:8,step:1},
      {k:'stirSpc',lbl:'Stirrup spacing s (mm)',def:150,step:10},
      {k:'devLen',lbl:'Dev/Lap length per bar (mm)',def:500,step:50}
    ],
    calc:function(v){
      /* Excel cell mapping */
      var E44=v.nos||0, E45=v.span||0, E46=v.width||0, E47=v.depth||0;
      var E48=v.cover||25, E49=v.botDia||16, E50=v.botNos||3;
      var E51=v.topDia||12, E52=v.topNos||2, E53=v.stirDia||8;
      var E54=v.stirSpc||150, E55=2*9*E53, E56=v.devLen||500;
      
      /* Excel formulas EXACT */
      var G44 = E46 - 2*E48;
      var G45 = E47 - 2*E48;
      var G46 = E47 - E48 - E49/2;
      var G47 = 2*((G44 + G45)/1000);
      var G48 = E55/1000;
      var G49 = G47 + G48;
      var G50 = Math.floor(E45/E54) + 1;
      var G51 = G48 * G49;
      var G52 = 0.0061685 * E53 * E53;
      var G53 = G50 * G51;
      var G54 = G52 * E44;
      var G55 = (E45 + 2*E56)/1000;
      var G56 = G55 * E50;
      var G57 = 0.0061685 * E49 * E49;
      var G58 = G57 * G56;
      var G59 = G58 * E44;
      var G60 = (E45 + 2*E56)/1000;
      var G61 = G60 * E52;
      var G62 = 0.0061685 * E51 * E51;
      var G63 = G62 * G61;
      var G64 = G63 * E44;
      var G65 = G53 + G58 + G63;
      var G66 = G54 + G59 + G65;
      
      return{rows:[
        {l:'Effective width b_clear (mm)',v:G44.toFixed(0)},
        {l:'Effective depth h_clear (mm)',v:G45.toFixed(0)},
        {l:'Effective depth to bottom bar (mm)',v:G46.toFixed(0)},
        {l:'Perimeter of stirrup P_st (m)',v:G47.toFixed(3)},
        {l:'Hook length per stirrup (m)',v:G48.toFixed(3)},
        {l:'Length of one stirrup L_st_one (m)',v:G49.toFixed(3)},
        {l:'Number of stirrups per beam n_st',v:G50},
        {l:'Total stirrup length per beam (m)',v:G51.toFixed(6)},
        {l:'Kg per meter for stirrup (kg/m)',v:G52.toFixed(6)},
        {l:'Weight of stirrups per beam (kg)',v:G53.toFixed(6)},
        {l:'Total stirrups weight for all beams (kg)',v:G54.toFixed(4)},
        {l:'Cut length of one bottom bar (m)',v:G55.toFixed(1)},
        {l:'Total bottom bar length per beam (m)',v:G56.toFixed(0)},
        {l:'Kg per meter for bottom bar (kg/m)',v:G57.toFixed(6)},
        {l:'Weight of bottom bars per beam (kg)',v:G58.toFixed(6)},
        {l:'Total bottom bars weight for all beams (kg)',v:G59.toFixed(4)},
        {l:'Cut length of one top bar (m)',v:G60.toFixed(1)},
        {l:'Total top bar length per beam (m)',v:G61.toFixed(1)},
        {l:'Kg per meter for top bar (kg/m)',v:G62.toFixed(6)},
        {l:'Weight of top bars per beam (kg)',v:G63.toFixed(6)},
        {l:'Total top bars weight for all beams (kg)',v:G64.toFixed(4)},
        {l:'Total steel per beam (kg)',v:G65.toFixed(6)},
        {l:'Total steel for all beams (kg)',v:G66.toFixed(4)}
      ],grand:G66};
    }
  },
  Slab:{
    color:'#4a148c',bg:'#f3e5f5',bc:'#9c27b0',
    fields:[
      {k:'nos',lbl:'Number of slabs',def:1,step:1},
      {k:'length',lbl:'Slab length L (mm)',def:6400,step:100},
      {k:'width',lbl:'Slab width B (mm)',def:4720,step:100},
      {k:'thick',lbl:'Slab thickness (mm)',def:150,step:10},
      {k:'cover',lbl:'Cover (mm)',def:15,step:5},
      {k:'mainDia',lbl:'Main bar dia (mm)',def:16,step:1},
      {k:'mainSpc',lbl:'Spacing of main bars (mm)',def:150,step:10},
      {k:'distDia',lbl:'Distribution bar dia (mm)',def:12,step:1},
      {k:'distSpc',lbl:'Spacing of distribution bars (mm)',def:150,step:10},
      {k:'devLen',lbl:'Dev/Lap length per bar (mm)',def:500,step:50}
    ],
    calc:function(v){
      /* Excel cell mapping */
      var E71=v.nos||0, E72=v.length||0, E73=v.width||0, E74=v.thick||0;
      var E75=v.cover||15, E76=v.mainDia||16, E77=v.mainSpc||150;
      var E78=v.distDia||12, E79=v.distSpc||150, E80=v.devLen||500;
      
      /* Excel formulas EXACT */
      var G71 = E72 - 2*E75;  // eff_span
      var G72 = E73 - 2*E75;  // eff_width
      var G73 = Math.ceil(E73/E77);  // n_main (ROUNDUP)
      var G74 = (E72 + E80)/1000;  // L_main_one
      var G75 = G74 * G73;  // L_main_total
      var G76 = (E76*E76)/162;  // kg/m main (Excel uses dia²/162)
      var G77 = G76 * G75;  // wt_main
      var G78 = Math.ceil(E72/E79);  // n_dist (ROUNDUP)
      var G79 = (E73 + E80)/1000;  // L_dist_one
      var G80 = G78 * G79;  // L_dist_total
      var G81 = (E78*E78)/162;  // kg/m dist
      var G82 = G80 * G81;  // wt_dist
      var G83 = G82 + G77;  // wt_per_slab
      var G84 = G83 * E71;  // wt_all_slabs
      
      return{rows:[
        {l:'Effective span (mm)',v:G71.toFixed(0)},
        {l:'Effective width (mm)',v:G72.toFixed(0)},
        {l:'Number of main bars',v:G73},
        {l:'Cut length of one main bar (m)',v:G74.toFixed(1)},
        {l:'Total length of main bars (m)',v:G75.toFixed(1)},
        {l:'Kg per meter for main bar (kg/m)',v:G76.toFixed(6)},
        {l:'Total wt of main bars (kg)',v:G77.toFixed(6)},
        {l:'Number of distribution bars',v:G78},
        {l:'Cut length of one distribution bar (m)',v:G79.toFixed(2)},
        {l:'Total length of distribution bars (m)',v:G80.toFixed(2)},
        {l:'Kg per meter for distribution bar (kg/m)',v:G81.toFixed(6)},
        {l:'Total wt of distribution bars (kg)',v:G82.toFixed(2)},
        {l:'Total steel for per slab (kg)',v:G83.toFixed(4)},
        {l:'Total steel for all slab (kg)',v:G84.toFixed(4)}
      ],grand:G84};
    }
  }
};



function scAdd(type){
  var t=scTypes[type];if(!t)return;
  var cnt=scSecs.filter(function(s){return s.type===type;}).length+1;
  var sec={id:scUID++,type:type,name:type+' '+cnt,vals:{}};
  t.fields.forEach(function(f){sec.vals[f.k]=f.def;});
  scSecs.push(sec);
  scRender();
  autoSaveDraft();
}

function scDel(id){
  scSecs=scSecs.filter(function(s){return s.id!==id;});
  scRender();
  autoSaveDraft();
}

function scSet(id,key,val){
  var sec=scSecs.find(function(s){return s.id===id;});
  if(!sec)return;
  /* Allow empty/partial input during typing — don't force 0 */
  var n=parseFloat(val);
  sec.vals[key]=isNaN(n)?0:n;
  scCalcOnly(id);  /* only update calculated values, NO full re-render */
  autoSaveDraft();
}

function scCalcOnly(id){
  var sec=scSecs.find(function(s){return s.id===id;});
  if(!sec)return;
  var t=scTypes[sec.type];if(!t)return;
  var res=t.calc(sec.vals);
  var tot=res.grand||0;
  /* Update each calc result span using data attributes */
  res.rows.forEach(function(row,i){
    var el=document.querySelector('[data-sc="'+id+'-r'+i+'"]');
    if(el)el.textContent=row.v;
  });
  /* Update section total text */
  var totEl=document.querySelector('[data-sc="'+id+'-tot"]');
  if(totEl)totEl.textContent=tot.toFixed(3)+' kg';
  /* Update header kg */
  var hdEl=document.querySelector('[data-sc="'+id+'-hd"]');
  if(hdEl)hdEl.textContent=tot.toFixed(2)+' kg';
  /* Toggle zero class */
  var secEl=document.querySelector('[data-sc="'+id+'-sec"]');
  if(secEl){
    if(tot<=0)secEl.classList.add('sc-zero');
    else secEl.classList.remove('sc-zero');
  }
  scUpdateGrand();
}

function scRename(id,name){
  var sec=scSecs.find(function(s){return s.id===id;});
  if(sec){sec.name=name;scRender();}
}

function scRender(){
  if(typeof scSecs==='undefined')return;
  var el=R('scSections');if(!el)return;
  if(!scSecs.length){
    el.innerHTML='<div style="text-align:center;padding:1.2rem;color:#aaa;font-size:.63rem">Use + buttons above to add sections (Footing / Column / Beam / Slab)</div>';
    scUpdateGrand();return;
  }
  var h='';
  scSecs.forEach(function(sec){
    var t=scTypes[sec.type];if(!t)return;
    var res=t.calc(sec.vals);
    var tot=res.grand||0;
    var isZ=(tot<=0);
    /* Outer div */
    h+='<div class="sc-sec'+(isZ?' sc-zero':'')+'" data-sc="'+sec.id+'-sec" style="border-color:'+t.bc+';border:2px solid '+t.bc+'">';
    /* Screen header */
    h+='<div class="sc-hd noprt" style="background:'+t.bg+';border-bottom:1px solid '+t.bc+'">'
      +'<input value="'+esc(sec.name)+'" onchange="scRename('+sec.id+',this.value)" '
      +'style="flex:1;background:transparent;border:none;font-weight:900;font-size:.64rem;'
      +'color:'+t.color+';font-family:inherit;min-width:0;outline:none">'
      +'<span data-sc="'+sec.id+'-hd" style="font-family:monospace;font-size:.62rem;color:'+t.color+';font-weight:700;padding:0 .5rem">'
      +tot.toFixed(2)+' kg</span>'
      +'<button onclick="scDel('+sec.id+')" '
      +'style="background:#c62828;color:#fff;border:none;border-radius:3px;'
      +'padding:.12rem .4rem;font-size:.56rem;cursor:pointer;flex-shrink:0">✕ Remove</button>'
      +'</div>';
    /* Print header */
    h+='<div class="prtonly" style="padding:.2rem .5rem;background:'+t.bg
      +';font-weight:900;font-size:.7rem;color:'+t.color+'">'+esc(sec.name)+'</div>';
    /* Body */
    h+='<div class="sc-bd"><table class="sc-tbl">';
    var nF=t.fields.length, nR=res.rows.length, nMax=Math.max(nF,nR);
    for(var i=0;i<nMax;i++){
      h+='<tr>';
      /* Input column */
      if(i<nF){
        var f=t.fields[i];
        h+='<td style="width:30%;color:#555;white-space:nowrap;padding-right:.3rem">'+f.lbl+'</td>'
          +'<td style="width:15%;padding:.04rem">'
          +'<input class="sc-in noprt" type="number" step="'+f.step
          +'" value="'+sec.vals[f.k]+'" '
          +'oninput="scSet('+sec.id+',\''+f.k+'\',this.value)">'
          +'<span class="prtonly" style="font-family:monospace;font-weight:700;font-size:.6rem">'
          +sec.vals[f.k]+'</span>'
          +'</td>';
      }else{
        h+='<td colspan="2"></td>';
      }
      /* Calc result column */
      if(i<nR){
        var row=res.rows[i];
        var bg=row.h?t.bg:'transparent';
        var fc=row.h?t.color:(row.b?'#111':'#555');
        var fw=row.b?'700':'400';
        h+='<td style="width:33%;color:#666;font-size:.56rem;padding-left:.5rem">'+row.l+' =</td>'
          +'<td style="width:22%"><span class="sc-ro" data-sc="'+sec.id+'-r'+i+'" style="background:'+bg
          +';color:'+fc+';font-weight:'+fw+'">'+row.v+'</span></td>';
      }else{
        h+='<td colspan="2"></td>';
      }
      h+='</tr>';
    }
    h+='</table>';
    /* Section total bar */
    h+='<div class="sc-tot" style="background:'+t.bg+';color:'+t.color+'">'
      +'Total: <b>'+sec.name+'</b> = '
      +'<span data-sc="'+sec.id+'-tot" style="font-size:.78rem">'+tot.toFixed(3)+'</span> kg'
      +(isZ?' &nbsp;<span style="font-size:.54rem;font-weight:400;opacity:.65">(zero → hidden in print)</span>':'')
      +'</div>';
    h+='</div></div>';
  });
  el.innerHTML=h;
  scUpdateGrand();
}

function scUpdateGrand(){
  var tot=0;
  scSecs.forEach(function(s){
    var t=scTypes[s.type];if(!t)return;
    var r=t.calc(s.vals);tot+=r.grand||0;
  });
  if(R('scKg'))R('scKg').textContent=tot.toFixed(2)+' kg';
  if(R('scMT'))R('scMT').textContent=(tot/1000).toFixed(4)+' MT';
}

function scReset(){
  if(scSecs.length&&!confirm('Reset all steel sections? This cannot be undone.'))return;
  scSecs=[];scUID=0;scRender();
  autoSaveDraft();
}

/* AUTO-SAVE DRAFT (localStorage + debounced Firebase) */
var _autoSaveTimer=null;
function autoSaveDraft(){
  try{
    var nm=((document.getElementById('pName')||{value:''}).value||'').trim();
    var draftKey='_atp_draft_';
    var d=typeof getStore==='function'?getStore():{};
    var lkm={};
    if(typeof LCD!=='undefined'){for(var _di=0;_di<LCD.length;_di++){var _de=document.getElementById('lkm_'+_di);if(_de)lkm[_di]=parseFloat(_de.value)||0;}}
    var lkmFull={};if(typeof LEAD_KM!=='undefined'){for(var _dk in LEAD_KM)lkmFull[_dk]=LEAD_KM[_dk];}
    var llocFull={};if(typeof LEAD_LOC!=='undefined'){for(var _dl in LEAD_LOC)llocFull[_dl]=LEAD_LOC[_dl];}
    var mtfSave={};if(typeof mtfData!=='undefined'){for(var _dsm=0;_dsm<mtfData.length;_dsm++)mtfSave[mtfData[_dsm].sr]=mtfData[_dsm].cost;}
    var draft={nm:nm||'__draft__',dt:new Date().toLocaleDateString('en-IN'),
      meta:{pName:nm,
        pSub:((document.getElementById('pSub')||{value:''}).value||''),
        pDiv:((document.getElementById('pDiv')||{value:''}).value||''),
        pCir:((document.getElementById('pCir')||{value:''}).value||''),
        pReg:((document.getElementById('pReg')||{value:''}).value||''),
        sGST:(document.getElementById('sGST')||{value:0}).value,
        sCont:(document.getElementById('sCont')||{value:0}).value,
        sLI:(document.getElementById('sLI')||{value:0}).value,
        sRS:(document.getElementById('sRS')||{value:0}).value,
        sRC:(document.getElementById('sRC')||{value:0}).value},
      lkm:lkm,leadKm:lkmFull,leadLoc:llocFull,mtfCosts:mtfSave,
      steelRows:(typeof steelRows!=='undefined'?JSON.parse(JSON.stringify(steelRows)):[]),
      scSecs:(typeof scSecs!=='undefined'?JSON.parse(JSON.stringify(scSecs)):[]),
      extraRows:(typeof EXTRA_ROWS!=='undefined'?JSON.parse(JSON.stringify(EXTRA_ROWS)):[]),
      items:typeof items!=='undefined'?items:[]};
    d[draftKey]=draft;
    if(nm)d[nm]=draft;
    if(typeof putStore==='function')putStore(d);
  }catch(e){}
  if(_autoSaveTimer)clearTimeout(_autoSaveTimer);
  _autoSaveTimer=setTimeout(function(){
    try{
      if(typeof CU!=='undefined'&&CU&&window.firebase&&firebase.firestore&&typeof CUR_EST_ID!=='undefined'&&CUR_EST_ID){
        var lkm2={};if(typeof LCD!=='undefined'){for(var _fi=0;_fi<LCD.length;_fi++){var _fe=document.getElementById('lkm_'+_fi);if(_fe)lkm2[_fi]=parseFloat(_fe.value)||0;}}
        var lkmFull2={};if(typeof LEAD_KM!=='undefined'){for(var _fk in LEAD_KM)lkmFull2[_fk]=LEAD_KM[_fk];}
        var llocFull2={};if(typeof LEAD_LOC!=='undefined'){for(var _fl in LEAD_LOC)llocFull2[_fl]=LEAD_LOC[_fl];}
        var mtfSave2={};if(typeof mtfData!=='undefined'){for(var _fsm=0;_fsm<mtfData.length;_fsm++)mtfSave2[mtfData[_fsm].sr]=mtfData[_fsm].cost;}
        firebase.firestore().collection('estimates').doc(CUR_EST_ID).update({
          lkm:lkm2,leadKm:lkmFull2,leadLoc:llocFull2,mtfCosts:mtfSave2,
          steelRows:(typeof steelRows!=='undefined'?JSON.parse(JSON.stringify(steelRows)):[]),
          scSecs:(typeof scSecs!=='undefined'?JSON.parse(JSON.stringify(scSecs)):[]),
          updatedAt:firebase.firestore.FieldValue.serverTimestamp()
        }).then(function(){if(typeof showToast==='function')showToast('☁️ Auto-saved to cloud','success');}).catch(function(){});
      }
    }catch(e){}
  },2500);
}

function scAddToItem(){
  if(!R('scKg'))return;
  var totalKg=parseFloat(R('scKg').textContent)||0;
  var q=totalKg/1000; /* MT */
  if(q<=0){alert('Total steel quantity is 0. Add steel sections and enter values first.');return;}
  var ssr26=null;
  for(var j=0;j<SSR.length;j++){if(SSR[j][0]==='26.33'){ssr26=SSR[j];break;}}
  if(!ssr26){alert('Item 26.33 not found in SSR.');return;}
  var qi=Math.round(q*100000)/100000;
  
  /* Build separate measurement row for each section */
  var measRows=[], tableRows=[], runTot=0;
  scSecs.forEach(function(sec){
    var t=scTypes[sec.type];if(!t)return;
    var res=t.calc(sec.vals);
    var secKg=res.grand||0;
    if(secKg<=0)return; /* skip zero sections */
    var secMT=secKg/1000;
    runTot+=secKg;
    measRows.push({desc:sec.name,nos:1,L:Math.round(secMT*100000)/100000,B:1,H:1});
    tableRows.push({lbl:sec.name,n:1,l:Math.round(secMT*100000)/100000,b:1,d:1,
      qty:Math.round(secMT*100000)/100000});
  });
  /* Add total row */
  tableRows.push({lbl:'TOTAL',n:1,l:qi,b:1,d:1,qty:qi,isTot:true});
  
  var existing=-1;
  for(var i=0;i<items.length;i++){if(items[i].no==='26.33'){existing=i;break;}}
  
  if(existing>=0){
    var it=items[existing];
    it.qty=qi;
    it.meas=measRows;
    it.rows=tableRows;
    it.cf={'ms_bars':1};
    if(!it.baseRate||it.baseRate<=0)it.baseRate=ssr26[3];
    items[existing]=recalcItem(it);
  }else{
    var ni={no:'26.33',desc:ssr26[1],unit:ssr26[2],
      baseRate:ssr26[3],rate:ssr26[3],qty:qi,
      leadRate:0,amount:0,finalRate:0,
      cf:{'ms_bars':1},
      meas:measRows,rows:tableRows};
    ni=recalcItem(ni);
    items.push(ni);
  }
  updateAll();
  alert('Added to Item 26.33: '+qi.toFixed(5)+' MT ('+totalKg.toFixed(2)+' kg)\n'+
    scSecs.filter(function(s){return scTypes[s.type].calc(s.vals).grand>0;})
    .map(function(s){return s.name+': '+(scTypes[s.type].calc(s.vals).grand/1000).toFixed(5)+' MT';})
    .join('\n'));
  goTab(3);
}

/* ══ MATERIAL TESTING FREQUENCY ════════════════════════════════════════ */
var mtfData=[
  {sr:1,mat:'Cement',
   desc:'i) Compressive Strength\nii) Initial Setting Time\niii) Final Setting Time\niv) Specific Gravity\nv) Soundness\nvi) Fineness\nvii) Workability',
   freq:'One test for each consignment of 150 MT & part thereof.',
   ref:'PWD Handbook, Chapter-33 for RCC Quality Control Part I (Modified)',
   qtyFormula:'cement*0.05',threshold:150,cost:0},
  {sr:2,mat:'Aggregate',
   desc:'i) Crushing Value\nii) Impact Value\niii) Water Absorption\niv) Gradation\nv) Flakiness Index',
   freq:'One test for 200 cum & part thereof.',
   ref:'PWD Handbook, Chapter-3 for RCC & IS:2386 Part-II',
   qtyFormula:'aggregate',threshold:200,cost:0},
  {sr:3,mat:'Sand',
   desc:'i) Fineness Modulus\nii) Silt Content\niii) Bulkage for Volume Batching',
   freq:'At Beginning & if there is change in source.',
   ref:'PWD Handbook, Chapter-3 for RCC & IS:2386 Part-II',
   qtyFormula:'sand',threshold:0,cost:0},
  {sr:4,mat:'Cement Concrete',
   desc:'i) Compressive Strength\n   (1 set of 3 cubes for each grade)\n   a) Up to 5 cum – 1 Set\n   b) 6 to 15 cum – 2 Sets\n   c) 16 to 30 cum – 3 Sets\n   d) 31 to 50 cum – 4 Sets\n   e) 51 & above – 4 Sets + one additional sample for each additional 50 cum or part thereof\nii) Mix Design',
   freq:'At beginning & if there is change in source of material.',
   ref:'MORTH Specification 2013 Section 1717 (Table-1700-9)',
   qtyFormula:'',threshold:5,cost:0},
  {sr:5,mat:'Steel',
   desc:'i) Ultimate Tensile Stress\nii) Percentage Elongation\niii) Yield Stress (Proof Stress)\niv) Weight per meter',
   freq:'One test for every 5 metric tonnes or part thereof for each diameter of bar.',
   ref:'IS:432 (Part-II)',
   qtyFormula:'steel/1000',threshold:5,cost:0},
  {sr:6,mat:'Bricks',
   desc:'i) Compressive Strength\nii) Water Absorption',
   freq:'One set of 15 Bricks for 50,000 Nos and part thereof.',
   ref:'IS:1077',
   qtyFormula:'bricks',threshold:50000,cost:0},
  {sr:7,mat:'Flooring Tiles',
   desc:'i) Transverse Strength\nii) Water Absorption',
   freq:'6 tiles shall be tested or every test for every 2000 tiles or part thereof.',
   ref:'As per SSR 2017-18',
   qtyFormula:'',threshold:2000,cost:0},
  {sr:8,mat:'Manglore Tiles',
   desc:'i) Breaking Load\nii) Water Absorption',
   freq:'One set of 18 tiles for every 2000 tiles or part thereof.',
   ref:'As per SSR 2017-18',
   qtyFormula:'',threshold:2000,cost:0},
  {sr:9,mat:'Paver Blocks',
   desc:'i) Compressive Strength\nii) Water Absorption',
   freq:'One test for 50,000 blocks & part thereof.',
   ref:'IS:15658 – 2006',
   qtyFormula:'',threshold:50000,cost:0}
];

function resetMTF(){
  /* Clear all manual overrides so auto-calc runs fresh */
  mtfData.forEach(function(row){delete row._qty;delete row._tests;});
  calcMTF();
}function calcMTF(){
  var mats=getMaterialTotals();
  /* ── Calculate total FIRST (no DOM needed) ── */
  var tot=0;
  mtfData.forEach(function(row){
    var qty=0;
    if(row._qty!==undefined&&row._qty!==null){
      qty=row._qty;
    } else if(row.qtyFormula){
      try{
        qty=eval(row.qtyFormula.replace('cement',mats.cement||0)
          .replace('aggregate',mats.aggregate||0)
          .replace('sand',mats.sand||0)
          .replace('steel',mats.steel||0)
          .replace('bricks',mats.bricks||0));
      }catch(e){qty=0;}
    }
    qty=qty||0;
    var tests=0;
    if(row._tests!==undefined&&row._tests!==null){
      tests=row._tests;
    } else {
      tests=(row.threshold>0&&qty>0)?Math.ceil(qty/row.threshold):(qty>0&&row.threshold===0?1:0);
    }
    var costPerTest=row.cost||0;
    tot+=tests*costPerTest;
  });
  window._mtfTotalVal=Math.round(tot);
  if(R('mtfTotal'))R('mtfTotal').textContent=tot.toFixed(2);

  /* ── Render table only if visible ── */
  var tb=R('mtfTb');if(!tb)return;
  var h='';
  mtfData.forEach(function(row){
    var qty=0;
    if(row._qty!==undefined&&row._qty!==null){
      qty=row._qty;
    } else if(row.qtyFormula){
      try{
        qty=eval(row.qtyFormula.replace('cement',mats.cement||0)
          .replace('aggregate',mats.aggregate||0)
          .replace('sand',mats.sand||0)
          .replace('steel',mats.steel||0)
          .replace('bricks',mats.bricks||0));
      }catch(e){qty=0;}
    }
    qty=qty||0;
    var tests=0;
    if(row._tests!==undefined&&row._tests!==null){
      tests=row._tests;
    } else {
      tests=(row.threshold>0&&qty>0)?Math.ceil(qty/row.threshold):(qty>0&&row.threshold===0?1:0);
    }
    var costPerTest=row.cost||0;
    var totalCost=tests*costPerTest;
    if(totalCost===0&&qty===0){h+='<tr class="mtf-zero">';} else {h+='<tr>';}
    h+='<td style="font-size:.57rem">'+row.sr+'</td>';
    h+='<td style="font-size:.57rem">'+row.mat+'</td>';
    h+='<td style="font-size:.57rem">'+row.desc+'</td>';
    h+='<td style="font-size:.57rem">'+row.freq+'</td>';
    h+='<td style="font-size:.57rem">'+row.ref+'</td>';
    h+='<td class="r"><input class="mtf-edit" type="number" step="any" value="'+qty.toFixed(2)+'" onchange="updateMTFQty('+row.sr+',this.value)"><span class="mtf-prt" style="display:none">'+qty.toFixed(2)+'</span></td>';
    h+='<td class="r"><input class="mtf-edit" type="number" step="1" min="0" value="'+tests+'" onchange="updateMTFTests('+row.sr+',this.value)"><span class="mtf-prt" style="display:none">'+tests+'</span></td>';
    h+='<td class="r"><input class="mtf-edit" type="number" value="'+costPerTest+'" onchange="updateMTFCost('+row.sr+',this.value)"><span class="mtf-prt" style="display:none">'+costPerTest+'</span></td>';
    h+='<td class="r" style="font-weight:700;color:#d84315">'+totalCost.toFixed(2)+'</td>';
    h+='</tr>';
  });
  tb.innerHTML=h;
}

function getMaterialTotals(){
  /* Sum materials from Consumption Chart */
  var totals={cement:0,aggregate:0,sand:0,steel:0,bricks:0};
  
  /* Iterate through items and sum consumption factors */
  items.forEach(function(it){
    if(!it.cf)return;
    for(var mat in it.cf){
      var factor=it.cf[mat]||0;
      var lr=LR[mat];if(!lr)continue;
      var conv=lr.conv||1;
      var netQty=it.qty*factor*conv;
      
      /* Map to material categories */
      var lbl=(lr.label||'').toLowerCase();
      if(lbl.indexOf('cement')>=0)totals.cement+=netQty;
      else if(lbl.indexOf('aggregate')>=0||lbl.indexOf('metal')>=0||lbl.indexOf('grit')>=0)
        totals.aggregate+=netQty;
      else if(lbl.indexOf('sand')>=0)totals.sand+=netQty;
      else if(lbl.indexOf('steel')>=0||lbl.indexOf('tmt')>=0||mat==='ms_bars')
        totals.steel+=netQty;
      else if(lbl.indexOf('brick')>=0)totals.bricks+=netQty;
    }
  });
  
  return totals;
}

function _refreshGrand(){
  var grand=calcGrand();
  if(R('hTot'))R('hTot').textContent='\u20b9'+fmtL(Math.round(grand));
  var el=R('covCostVal');if(el)el.value=Math.round(grand/100000);
  rFE();
}
function updateMTFCost(sr,val){
  var row=mtfData.find(function(r){return r.sr===sr;});
  if(row){row.cost=parseFloat(val)||0;}
  calcMTF();_refreshGrand();
}
function updateMTFQty(sr,val){
  var row=mtfData.find(function(r){return r.sr===sr;});
  if(row){row._qty=parseFloat(val)||0;}
  calcMTF();_refreshGrand();
}
function updateMTFTests(sr,val){
  var row=mtfData.find(function(r){return r.sr===sr;});
  if(row){row._tests=parseInt(val)||0;}
  calcMTF();_refreshGrand();
}

function editMTFCost(){
  var val=parseFloat((R('mtfCostEdit')||{}).value)||0;
  if(val<=0){alert('Enter valid cost');return;}
  /* Apply to all rows with 0 cost */
  var changed=0;
  mtfData.forEach(function(r){
    if(r.cost<=0){r.cost=val;changed++;}
  });
  alert('Updated '+changed+' rows with cost '+val.toFixed(2));
  calcMTF();
  if(R('mtfCostEdit'))R('mtfCostEdit').value='';
}

buildLCT();
/* Initialize EXTRA_ROWS defaults */
if(!EXTRA_ROWS.length){
  EXTRA_ROWS.push({lbl:'Electrification',pct:0});
  EXTRA_ROWS.push({lbl:'Water Supply',pct:0});
}

/* ── AUTO SAVE every 2 minutes ── */
setInterval(function(){
  try{
    var nm=((R('pName')||{}).value||'').trim();
    if(!nm)return; /* Don't save if no name */
    var d=getStore();
    var lkm={};for(var _i=0;_i<LCD.length;_i++){var _el=R('lkm_'+_i);if(_el)lkm[_i]=parseFloat(_el.value)||0;}
    var _lkf={};if(typeof LEAD_KM!=='undefined'){for(var _k2 in LEAD_KM)_lkf[_k2]=LEAD_KM[_k2];}
    var _mtfCosts={};if(typeof mtfData!=='undefined'){for(var _mi=0;_mi<mtfData.length;_mi++)_mtfCosts[mtfData[_mi].sr]=mtfData[_mi].cost;}
    d['__autosave__']={nm:nm,dt:new Date().toLocaleDateString('en-IN'),_auto:true,
      meta:{pName:((R('pName')||{}).value||''),pSub:((R('pSub')||{}).value||''),
        pDiv:((R('pDiv')||{}).value||''),pCir:((R('pCir')||{}).value||''),
        pReg:((R('pReg')||{}).value||''),
        sGST:pf('sGST'),sCont:pf('sCont'),sLI:pf('sLI'),sRS:pf('sRS'),sRC:pf('sRC'),
        cancelScada:(CANCEL_SCADA||false),customScadaVal:(CUSTOM_SCADA_VAL||-126)},
      lkm:lkm,leadKm:_lkf,mtfCosts:_mtfCosts,
      steelRows:(typeof steelRows!=='undefined'?JSON.parse(JSON.stringify(steelRows)):[]),
      scSecs:(typeof scSecs!=='undefined'?JSON.parse(JSON.stringify(scSecs)):[]),
      items:items};
    if(nm)d[nm]=d['__autosave__']; /* Also update named entry */
    putStore(d);
    console.log('AutoSaved at '+new Date().toLocaleTimeString());
  }catch(e){console.warn('AutoSave failed:',e);}
},120000); /* 2 minutes */

/* AutoSave restore removed */
scRender();
calcMTF();
showDefaultList();
renderSaveList();
upCover();
upMeta();

/* ══════════════════════════════════════════════════════════════
   PLAN TAB — Civil Drawing Canvas  (Column, Beam, Wall, Door, Window, Label)
   ══════════════════════════════════════════════════════════════ */
(function(){
  var PLAN = {
    tool: 'column',
    shapes: [],
    history: [],
    dragging: null,
    dragOffX: 0, dragOffY: 0,
    lineStart: null,
    canvas: null, ctx: null,
    GRID: 20,
    // color map
    COLORS: {column:'#1a237e', beam:'#333333', wall:'#888888', door:'#c0392b', window:'#1976d2', text:'#2c3e50', line:'#000000'},
    selectedIdx: null, /* currently selected shape index */
    /* ── Background image (import) ── */
    bgImg: null, bgImgX: 20, bgImgY: 20, bgImgW: 0, bgImgH: 0,
    bgImgSelected: false, bgImgDragging: false, bgImgResizing: false,
    bgImgDragOX: 0, bgImgDragOY: 0,
    bgImgAspect: 1
  };

  /* ── helpers ── */
  function R(id){return document.getElementById(id);}
  function getCanvas(){return R('planCanvas');}
  function getCtx(){return getCanvas() ? getCanvas().getContext('2d') : null;}
  function snap(v){return Math.round(v/PLAN.GRID)*PLAN.GRID;}
  function evPos(ev){
    var c=getCanvas(),r=c.getBoundingClientRect();
    var scaleX=c.width/r.width, scaleY=c.height/r.height;
    return {x:snap((ev.clientX-r.left)*scaleX), y:snap((ev.clientY-r.top)*scaleY)};
  }

  /* ── draw all ── */
  function drawAll(){
    var c=getCanvas(); if(!c)return;
    var ctx=c.getContext('2d');
    ctx.clearRect(0,0,c.width,c.height);
    // fill background
    ctx.fillStyle='#fffef8'; ctx.fillRect(0,0,c.width,c.height);
    // grid
    var showGrid=(R('planGrid')||{}).checked!==false;
    if(showGrid){
      ctx.strokeStyle='#e0ddd8'; ctx.lineWidth=0.5;
      for(var gx=0;gx<c.width;gx+=PLAN.GRID){
        ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,c.height); ctx.stroke();
      }
      for(var gy=0;gy<c.height;gy+=PLAN.GRID){
        ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(c.width,gy); ctx.stroke();
      }
    }
    // ── draw background image (imported) ──
    if(PLAN.bgImg){
      ctx.save();
      ctx.globalAlpha=PLAN._bgImgOpacity||0.92;
      ctx.drawImage(PLAN.bgImg,PLAN.bgImgX,PLAN.bgImgY,PLAN.bgImgW,PLAN.bgImgH);
      ctx.globalAlpha=1;
      if(PLAN.bgImgSelected){
        // dashed selection border
        ctx.strokeStyle='#7b1fa2'; ctx.lineWidth=2; ctx.setLineDash([5,3]);
        ctx.strokeRect(PLAN.bgImgX,PLAN.bgImgY,PLAN.bgImgW,PLAN.bgImgH);
        ctx.setLineDash([]);
        // light purple tint overlay
        ctx.fillStyle='rgba(123,31,162,0.07)';
        ctx.fillRect(PLAN.bgImgX,PLAN.bgImgY,PLAN.bgImgW,PLAN.bgImgH);
        // resize handle (bottom-right)
        var rhx=PLAN.bgImgX+PLAN.bgImgW-7, rhy=PLAN.bgImgY+PLAN.bgImgH-7;
        ctx.fillStyle='#7b1fa2';
        ctx.fillRect(rhx,rhy,14,14);
        ctx.strokeStyle='#fff'; ctx.lineWidth=1.5;
        ctx.strokeRect(rhx,rhy,14,14);
        // rotate handle (top-right, small circle)
        var rrx=PLAN.bgImgX+PLAN.bgImgW-7, rry=PLAN.bgImgY-14;
        ctx.beginPath(); ctx.arc(rrx+7,rry+7,6,0,2*Math.PI);
        ctx.fillStyle='#7b1fa2'; ctx.fill();
        ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.stroke();
        // opacity label
        ctx.fillStyle='rgba(123,31,162,0.8)';
        ctx.font='bold 9px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='top';
        ctx.fillText('📷 Image — Select tool वापरून drag/resize करा',PLAN.bgImgX+4,PLAN.bgImgY+4);
      }
      ctx.restore();
    }
    // draw shapes
    PLAN.shapes.forEach(function(s){ drawShape(ctx,s); });
    updateSchedule();
  }
  window.planDrawAll = drawAll;
  window.planRedraw = drawAll;

  function drawShape(ctx,s){
    ctx.save();
    switch(s.type){
      case 'column':
        var cw=28,ch=20; // visual size on canvas
        ctx.fillStyle=PLAN.COLORS.column;
        ctx.fillRect(s.x-cw/2,s.y-ch/2,cw,ch);
        ctx.strokeStyle='#0d1440'; ctx.lineWidth=1.5;
        ctx.strokeRect(s.x-cw/2,s.y-ch/2,cw,ch);
        // hatch pattern for column
        ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
        for(var hx=s.x-cw/2;hx<s.x+cw/2;hx+=5){
          ctx.beginPath(); ctx.moveTo(hx,s.y-ch/2); ctx.lineTo(hx,s.y+ch/2); ctx.stroke();
        }
        // label
        ctx.fillStyle='#fff'; ctx.font='bold 6px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(s.label||'C',s.x,s.y);
        break;

      case 'beam':
        ctx.strokeStyle=PLAN.COLORS.beam; ctx.lineWidth=5; ctx.lineCap='butt';
        ctx.beginPath(); ctx.moveTo(s.x1,s.y1); ctx.lineTo(s.x2,s.y2); ctx.stroke();
        ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(s.x1,s.y1); ctx.lineTo(s.x2,s.y2); ctx.stroke();
        // label
        if(s.label){
          var mx=(s.x1+s.x2)/2, my=(s.y1+s.y2)/2;
          ctx.fillStyle='#333'; ctx.font='bold 7px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='bottom';
          ctx.fillText(s.label,mx,my-3);
        }
        break;

      case 'wall':
        ctx.strokeStyle=PLAN.COLORS.wall; ctx.lineWidth=8; ctx.lineCap='square';
        ctx.beginPath(); ctx.moveTo(s.x1,s.y1); ctx.lineTo(s.x2,s.y2); ctx.stroke();
        ctx.strokeStyle='#555'; ctx.lineWidth=9;
        ctx.setLineDash([0]); ctx.lineWidth=9;
        // double line wall
        var angle=Math.atan2(s.y2-s.y1,s.x2-s.x1);
        var perp=angle+Math.PI/2;
        var off=4;
        ctx.strokeStyle='#666'; ctx.lineWidth=2; ctx.setLineDash([]);
        [[1],[-1]].forEach(function(sign){
          ctx.beginPath();
          ctx.moveTo(s.x1+Math.cos(perp)*off*sign,s.y1+Math.sin(perp)*off*sign);
          ctx.lineTo(s.x2+Math.cos(perp)*off*sign,s.y2+Math.sin(perp)*off*sign);
          ctx.stroke();
        });
        // fill between
        ctx.beginPath();
        ctx.moveTo(s.x1+Math.cos(perp)*off,s.y1+Math.sin(perp)*off);
        ctx.lineTo(s.x2+Math.cos(perp)*off,s.y2+Math.sin(perp)*off);
        ctx.lineTo(s.x2-Math.cos(perp)*off,s.y2-Math.sin(perp)*off);
        ctx.lineTo(s.x1-Math.cos(perp)*off,s.y1-Math.sin(perp)*off);
        ctx.closePath();
        ctx.fillStyle='#aaa'; ctx.fill();
        ctx.strokeStyle='#555'; ctx.lineWidth=1; ctx.stroke();
        if(s.label){
          var mx2=(s.x1+s.x2)/2, my2=(s.y1+s.y2)/2;
          ctx.fillStyle='#333'; ctx.font='7px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='bottom';
          ctx.fillText(s.label,mx2,my2-7);
        }
        break;

      case 'door':
        var dw=24,dh=24;
        ctx.strokeStyle=PLAN.COLORS.door; ctx.lineWidth=2; ctx.setLineDash([]);
        // door frame
        ctx.strokeRect(s.x-dw/2,s.y-dh/2,dw,dh);
        // door swing arc
        ctx.beginPath(); ctx.arc(s.x-dw/2,s.y-dh/2,dw,0,Math.PI/2);
        ctx.setLineDash([3,2]); ctx.stroke(); ctx.setLineDash([]);
        // door leaf
        ctx.strokeStyle=PLAN.COLORS.door; ctx.lineWidth=2.5;
        ctx.beginPath(); ctx.moveTo(s.x-dw/2,s.y-dh/2); ctx.lineTo(s.x-dw/2+dw,s.y-dh/2); ctx.stroke();
        // label
        ctx.fillStyle=PLAN.COLORS.door; ctx.font='bold 7px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='top'; ctx.setLineDash([]);
        ctx.fillText(s.label||'D',s.x,s.y+dh/2+2);
        break;

      case 'window':
        var ww=28,wh=10;
        ctx.strokeStyle=PLAN.COLORS.window; ctx.lineWidth=2; ctx.setLineDash([]);
        ctx.strokeRect(s.x-ww/2,s.y-wh/2,ww,wh);
        // window panes (3 vertical lines)
        ctx.lineWidth=1;
        for(var wi=1;wi<3;wi++){
          var wx=s.x-ww/2+wi*(ww/3);
          ctx.beginPath(); ctx.moveTo(wx,s.y-wh/2); ctx.lineTo(wx,s.y+wh/2); ctx.stroke();
        }
        // outer border thicker
        ctx.lineWidth=2.5;
        ctx.strokeRect(s.x-ww/2,s.y-wh/2,ww,wh);
        // label
        ctx.fillStyle=PLAN.COLORS.window; ctx.font='bold 7px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText(s.label||'W',s.x,s.y+wh/2+2);
        break;

      case 'line':
        ctx.strokeStyle = s.selected ? '#e53935' : (s.color || PLAN.COLORS.line);
        ctx.lineWidth = s.width || 2;
        if(s.style==='dashed') ctx.setLineDash([10,6]);
        else ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(s.x1,s.y1); ctx.lineTo(s.x2,s.y2); ctx.stroke();
        if(s.style==='double'){
          var an2=Math.atan2(s.y2-s.y1,s.x2-s.x1), pr2=an2+Math.PI/2;
          ctx.lineWidth=1; ctx.setLineDash([]);
          [[3],[-3]].forEach(function(off2){
            ctx.beginPath();
            ctx.moveTo(s.x1+Math.cos(pr2)*off2,s.y1+Math.sin(pr2)*off2);
            ctx.lineTo(s.x2+Math.cos(pr2)*off2,s.y2+Math.sin(pr2)*off2);
            ctx.stroke();
          });
        }
        ctx.setLineDash([]);
        if(s.selected){
          ctx.fillStyle='#e53935';
          [[s.x1,s.y1],[s.x2,s.y2]].forEach(function(pt){
            ctx.beginPath(); ctx.arc(pt[0],pt[1],4,0,Math.PI*2); ctx.fill();
          });
        }
        if(s.label){
          var mlx=(s.x1+s.x2)/2, mly=(s.y1+s.y2)/2;
          ctx.fillStyle='#333'; ctx.font='7px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='bottom';
          ctx.fillText(s.label,mlx,mly-3);
        }
        break;

      case 'text':
        ctx.fillStyle=PLAN.COLORS.text; ctx.font='bold 9px sans-serif'; ctx.textAlign='left'; ctx.textBaseline='top';
        ctx.fillText(s.label||'',s.x,s.y);
        break;
    }
    ctx.restore();
  }

  /* ── hit test ── */
  function hitTest(s,x,y){
    var tol=16;
    switch(s.type){
      case 'column': return Math.abs(s.x-x)<18 && Math.abs(s.y-y)<14;
      case 'door':   return Math.abs(s.x-x)<20 && Math.abs(s.y-y)<20;
      case 'window': return Math.abs(s.x-x)<18 && Math.abs(s.y-y)<12;
      case 'text':   return s.x<=x && x<=s.x+80 && s.y<=y && y<=s.y+14;
      case 'beam': case 'wall': case 'line':
        var dx=s.x2-s.x1, dy=s.y2-s.y1, len=Math.sqrt(dx*dx+dy*dy)||1;
        var t=((x-s.x1)*dx+(y-s.y1)*dy)/(len*len);
        t=Math.max(0,Math.min(1,t));
        var px=s.x1+t*dx, py=s.y1+t*dy;
        return Math.hypot(x-px,y-py)<tol;
    }
    return false;
  }

  /* ── public tool setter ── */
  window.planSetTool = function(tool){
    PLAN.tool=tool; PLAN.lineStart=null;
    ['planToolColumn','planToolBeam','planToolWall','planToolDoor','planToolWindow','planToolText','planToolLine','planToolSel'].forEach(function(id){
      var el=R(id); if(!el)return;
      var active=(id==='planTool'+tool.charAt(0).toUpperCase()+tool.slice(1));
      el.style.background=active?({column:'#1565c0',beam:'#333',wall:'#555',door:'#c0392b',window:'#1976d2',text:'#2c3e50',line:'#000',select:'#555'}[tool]||'#333'):'#fff';
      el.style.color=active?'#fff':'#333';
      el.style.borderColor=active?el.style.background:'#aaa';
    });
    var msgs={column:'Column: Canvas वर click करा',beam:'Beam: 1st click = start, 2nd click = end',wall:'Wall: 1st click = start, 2nd click = end',door:'Door: Canvas वर click करा',window:'Window: Canvas वर click करा',text:'Label: Click करा → नाव टाईप करा',line:'Line: 1st click = start, 2nd click = end | Select tool → shape click → Delete key दाबा',select:'Select: Click = निवडा (लाल होईल), Delete key = हटवा, Drag = हलवा'};
    var st=R('planStatus'); if(st)st.textContent=msgs[tool]||'';
  };

  window.planClick = function(ev){
    if(PLAN.tool==='select')return;
    var pos=evPos(ev);
    var x=pos.x, y=pos.y;

    if(PLAN.tool==='column'){
      var sz=(R('planColSize')||{}).value||'230x380';
      saveHistory();
      var n='C'+(PLAN.shapes.filter(function(s){return s.type==='column';}).length+1);
      PLAN.shapes.push({type:'column',x:x,y:y,size:sz,label:n});
      drawAll(); return;
    }
    if(PLAN.tool==='door'){
      saveHistory();
      var nd='D'+(PLAN.shapes.filter(function(s){return s.type==='door';}).length+1);
      PLAN.shapes.push({type:'door',x:x,y:y,label:nd});
      drawAll(); return;
    }
    if(PLAN.tool==='window'){
      saveHistory();
      var nw='W'+(PLAN.shapes.filter(function(s){return s.type==='window';}).length+1);
      PLAN.shapes.push({type:'window',x:x,y:y,label:nw});
      drawAll(); return;
    }
    if(PLAN.tool==='text'){
      var lbl=prompt('Label / नाव टाईप करा:');
      if(!lbl)return;
      saveHistory();
      PLAN.shapes.push({type:'text',x:x,y:y,label:lbl});
      drawAll(); return;
    }
    if(PLAN.tool==='beam'||PLAN.tool==='wall'||PLAN.tool==='line'){
      if(!PLAN.lineStart){
        PLAN.lineStart={x:x,y:y};
        var st2=R('planStatus'); if(st2)st2.textContent='1st point set → आता end point click करा ('+x+','+y+')';
      } else {
        saveHistory();
        var tp=PLAN.tool;
        if(tp==='line'){
          var lnStyle=(R('planLineStyle')||{}).value||'solid';
          var lnWidth=parseInt((R('planLineWidth')||{}).value)||2;
          PLAN.shapes.push({type:'line',x1:PLAN.lineStart.x,y1:PLAN.lineStart.y,x2:x,y2:y,style:lnStyle,width:lnWidth});
        } else {
          var cnt=PLAN.shapes.filter(function(s){return s.type===tp;}).length+1;
          PLAN.shapes.push({type:tp,x1:PLAN.lineStart.x,y1:PLAN.lineStart.y,x2:x,y2:y,label:(tp==='beam'?'B':'W')+cnt});
        }
        PLAN.lineStart=null;
        drawAll();
      }
      return;
    }
  };

  window.planMouseDown = function(ev){
    if(PLAN.tool!=='select')return;
    var pos=evPos(ev);
    /* ── bgImg: resize handle or drag ── */
    if(PLAN.bgImg){
      var rhx=PLAN.bgImgX+PLAN.bgImgW-7, rhy=PLAN.bgImgY+PLAN.bgImgH-7;
      if(pos.x>=rhx-2&&pos.x<=rhx+16&&pos.y>=rhy-2&&pos.y<=rhy+16){
        PLAN.bgImgResizing=true; PLAN.bgImgSelected=true; drawAll(); return;
      }
      if(pos.x>=PLAN.bgImgX&&pos.x<=PLAN.bgImgX+PLAN.bgImgW&&
         pos.y>=PLAN.bgImgY&&pos.y<=PLAN.bgImgY+PLAN.bgImgH){
        PLAN.bgImgDragging=true; PLAN.bgImgSelected=true;
        PLAN.bgImgDragOX=pos.x-PLAN.bgImgX; PLAN.bgImgDragOY=pos.y-PLAN.bgImgY;
        drawAll(); return;
      }
      /* click outside image → deselect */
      PLAN.bgImgSelected=false; drawAll();
    }
    for(var i=PLAN.shapes.length-1;i>=0;i--){
      if(hitTest(PLAN.shapes[i],pos.x,pos.y)){
        /* deselect previous */
        if(PLAN.selectedIdx!==null&&PLAN.shapes[PLAN.selectedIdx]) PLAN.shapes[PLAN.selectedIdx].selected=false;
        PLAN.dragging=i;
        PLAN.selectedIdx=i;
        PLAN.shapes[i].selected=true;
        var s=PLAN.shapes[i];
        PLAN.dragOffX=pos.x-(s.x||s.x1||0);
        PLAN.dragOffY=pos.y-(s.y||s.y1||0);
        drawAll();
        return;
      }
    }
    /* clicked on empty area — deselect */
    if(PLAN.selectedIdx!==null&&PLAN.shapes[PLAN.selectedIdx]){
      PLAN.shapes[PLAN.selectedIdx].selected=false;
      PLAN.selectedIdx=null;
      drawAll();
    }
  };
  window.planMouseMove = function(ev){
    var pos=evPos(ev);
    /* ── bgImg drag / resize ── */
    if(PLAN.bgImgDragging){
      PLAN.bgImgX=pos.x-PLAN.bgImgDragOX;
      PLAN.bgImgY=pos.y-PLAN.bgImgDragOY;
      drawAll(); return;
    }
    if(PLAN.bgImgResizing){
      var newW=Math.max(40,pos.x-PLAN.bgImgX);
      /* Shift held → lock aspect ratio */
      if(ev.shiftKey){ PLAN.bgImgH=Math.round(newW/PLAN.bgImgAspect); }
      else { PLAN.bgImgH=Math.max(30,pos.y-PLAN.bgImgY); }
      PLAN.bgImgW=newW;
      drawAll(); return;
    }
    /* cursor feedback: resize handle */
    if(PLAN.bgImg&&PLAN.tool==='select'){
      var c2=getCanvas();if(!c2)return;
      var rhx2=PLAN.bgImgX+PLAN.bgImgW-7,rhy2=PLAN.bgImgY+PLAN.bgImgH-7;
      c2.style.cursor=(pos.x>=rhx2-4&&pos.x<=rhx2+18&&pos.y>=rhy2-4&&pos.y<=rhy2+18)?'se-resize':
        (pos.x>=PLAN.bgImgX&&pos.x<=PLAN.bgImgX+PLAN.bgImgW&&
         pos.y>=PLAN.bgImgY&&pos.y<=PLAN.bgImgY+PLAN.bgImgH)?'move':'crosshair';
    }
    // line preview
    if((PLAN.tool==='beam'||PLAN.tool==='wall'||PLAN.tool==='line')&&PLAN.lineStart){
      drawAll();
      var ctx2=getCanvas().getContext('2d');
      ctx2.save();
      ctx2.strokeStyle=PLAN.tool==='beam'?'#333':(PLAN.tool==='line'?'#000':'#888');
      ctx2.lineWidth=PLAN.tool==='beam'?4:(PLAN.tool==='line'?(parseInt((R('planLineWidth')||{}).value)||2):7);
      ctx2.setLineDash([5,3]);
      ctx2.beginPath(); ctx2.moveTo(PLAN.lineStart.x,PLAN.lineStart.y); ctx2.lineTo(pos.x,pos.y); ctx2.stroke();
      ctx2.restore();
      return;
    }
    if(PLAN.dragging===null||PLAN.tool!=='select')return;
    var s=PLAN.shapes[PLAN.dragging];
    var nx=pos.x-PLAN.dragOffX, ny=pos.y-PLAN.dragOffY;
    if(s.type==='beam'||s.type==='wall'){
      var dx=s.x2-s.x1, dy=s.y2-s.y1;
      s.x1=nx; s.y1=ny; s.x2=nx+dx; s.y2=ny+dy;
    } else {
      s.x=nx; s.y=ny;
    }
    drawAll();
  };
  window.planMouseUp = function(){ PLAN.dragging=null; PLAN.bgImgDragging=false; PLAN.bgImgResizing=false; };

  /* ── Delete selected shape ── */
  window.planDeleteSelected = function(){
    if(PLAN.selectedIdx!==null && PLAN.shapes[PLAN.selectedIdx]){
      saveHistory();
      PLAN.shapes.splice(PLAN.selectedIdx,1);
      PLAN.selectedIdx=null;
      drawAll();
      var st=R('planStatus'); if(st)st.textContent='Shape deleted ✓';
    }
  };

  /* ── Keyboard: Delete key ── */
  window._planKeyHandler = function(e){
    if(e.key==='Delete'||e.key==='Backspace'){
      if(document.activeElement&&(document.activeElement.tagName==='INPUT'||document.activeElement.tagName==='TEXTAREA'||document.activeElement.tagName==='SELECT'))return;
      window.planDeleteSelected();
    }
  };

  window.planDblClick = function(ev){
    if(PLAN.tool==='select'){
      var pos=evPos(ev);
      for(var i=PLAN.shapes.length-1;i>=0;i--){
        if(hitTest(PLAN.shapes[i],pos.x,pos.y)){
          var s=PLAN.shapes[i];
          if(s.type==='line'){
            if(confirm('ही line delete करायची?')){saveHistory();PLAN.shapes.splice(i,1);PLAN.selectedIdx=null;}
          } else {
            var action=prompt('Label बदला किंवा Delete करा:\n(नवीन नाव टाईप करा, रिकामे सोडून OK = Delete)','');
            if(action===null)return;
            if(action===''){saveHistory();PLAN.shapes.splice(i,1);PLAN.selectedIdx=null;}
            else{saveHistory();s.label=action;}
          }
          drawAll(); return;
        }
      }
    }
  };

  function saveHistory(){
    PLAN.history.push(JSON.stringify(PLAN.shapes));
    if(PLAN.history.length>50)PLAN.history.shift();
  }

  window.planUndo = function(){
    if(!PLAN.history.length){alert('Undo करण्यासाठी काही नाही');return;}
    PLAN.shapes=JSON.parse(PLAN.history.pop());
    PLAN.lineStart=null; drawAll();
  };

  window.planClear = function(){
    if(!PLAN.shapes.length&&!PLAN.bgImg)return;
    if(!confirm('सर्व elements delete होतील. Continue?'))return;
    saveHistory(); PLAN.shapes=[]; PLAN.lineStart=null;
    PLAN.bgImg=null; PLAN.bgImgSelected=false;
    var btn=R('planRemoveImgBtn'); if(btn)btn.style.display='none';
    drawAll();
  };

  /* ── Estimate save/load bridge (called by saveEstimate / loadEstimate) ── */
  window._getPlanData = function(){
    var d = { shapes: JSON.parse(JSON.stringify(PLAN.shapes)) };
    if(PLAN.bgImg){
      try{
        var tc=document.createElement('canvas');
        tc.width=PLAN.bgImgW||400; tc.height=PLAN.bgImgH||300;
        tc.getContext('2d').drawImage(PLAN.bgImg,0,0,tc.width,tc.height);
        d.bgImgData=tc.toDataURL('image/jpeg',0.55);
      }catch(e){}
    }
    d.bgImgX=PLAN.bgImgX||0; d.bgImgY=PLAN.bgImgY||0;
    d.bgImgW=PLAN.bgImgW||0; d.bgImgH=PLAN.bgImgH||0;
    return d;
  };
  window._setPlanData = function(d){
    if(!d) return;
    saveHistory();
    PLAN.shapes = d.shapes || [];
    PLAN.lineStart = null;
    PLAN.bgImg = null;
    PLAN.bgImgX = d.bgImgX||0; PLAN.bgImgY = d.bgImgY||0;
    PLAN.bgImgW = d.bgImgW||0; PLAN.bgImgH = d.bgImgH||0;
    if(d.bgImgData){
      var img=new Image();
      img.onload=function(){
        PLAN.bgImg=img;
        PLAN.bgImgAspect=(img.height&&img.width)?img.width/img.height:1;
        drawAll();
        var btn=R('planRemoveImgBtn');if(btn)btn.style.display='';
        var ow=R('planImgOpacityWrap');if(ow)ow.style.display='flex';
      };
      img.src=d.bgImgData;
    } else {
      drawAll();
    }
  };

  window.planSavePNG = function(){
    var c=getCanvas(); if(!c){alert('Canvas ready नाही');return;}
    // capture to img for print
    var dataURL=c.toDataURL('image/png');
    var img=R('planCanvasPrint'); if(img)img.src=dataURL;
    // download
    var a=document.createElement('a');
    a.href=dataURL; a.download='building_plan.png'; a.click();
  };

  /* ══════════════════════════════════════════════
     PLAN TAB — FIREBASE CLOUD SAVE / LOAD
  ══════════════════════════════════════════════ */
  window.planSaveToCloud = function(){
    if(!window.firebase||!firebase.firestore){showToast('Firebase ready नाही','error');return;}
    var data={
      shapes: PLAN.shapes,
      bgImgX: PLAN.bgImgX||0, bgImgY: PLAN.bgImgY||0,
      bgImgW: PLAN.bgImgW||0, bgImgH: PLAN.bgImgH||0,
      savedAt: firebase.firestore.FieldValue.serverTimestamp(),
      savedBy: (window.CU&&CU.email)||'unknown'
    };
    /* background image save */
    if(PLAN.bgImg){
      try{
        var tc=document.createElement('canvas');
        tc.width=PLAN.bgImgW||400;tc.height=PLAN.bgImgH||300;
        tc.getContext('2d').drawImage(PLAN.bgImg,0,0,tc.width,tc.height);
        data.bgImgData=tc.toDataURL('image/jpeg',0.55);
      }catch(e){}
    }
    showToast('Building Plan Cloud ला save होत आहे...','info');
    firebase.firestore().collection('config').doc('draw_building_plan').set(data)
      .then(function(){
        showToast('✅ Building Plan Cloud वर save झाला!','success');
        var st=R('planStatus');if(st)st.textContent='Cloud Save: यशस्वी ✓';
      })
      .catch(function(e){showToast('Plan save error: '+e.message,'error');});
  };

  window.planLoadFromCloud = function(){
    if(!window.firebase||!firebase.firestore){showToast('Firebase ready नाही','error');return;}
    showToast('Building Plan Cloud वरून load होत आहे...','info');
    firebase.firestore().collection('config').doc('draw_building_plan').get()
      .then(function(doc){
        if(!doc.exists||!doc.data().shapes){
          showToast('Cloud वर Plan सापडला नाही. आधी Save करा.','error');return;
        }
        var d=doc.data();
        saveHistory();
        PLAN.shapes=d.shapes||[];
        PLAN.lineStart=null;
        /* bg image restore */
        PLAN.bgImg=null;
        if(d.bgImgData){
          var img=new Image();
          img.onload=function(){
            PLAN.bgImg=img;
            PLAN.bgImgX=d.bgImgX||0;PLAN.bgImgY=d.bgImgY||0;
            PLAN.bgImgW=d.bgImgW||img.width;PLAN.bgImgH=d.bgImgH||img.height;
            PLAN.bgImgAspect=(img.height&&img.width)?img.width/img.height:1;
            drawAll();
            var btn=R('planRemoveImgBtn');if(btn)btn.style.display='';
            var ow=R('planImgOpacityWrap');if(ow)ow.style.display='flex';
          };
          img.src=d.bgImgData;
        }else{
          PLAN.bgImgX=0;PLAN.bgImgY=0;PLAN.bgImgW=0;PLAN.bgImgH=0;
        }
        drawAll();
        showToast('✅ Building Plan Cloud वरून load झाला!','success');
        var st=R('planStatus');if(st)st.textContent='Cloud Load: यशस्वी ✓';
      })
      .catch(function(e){showToast('Plan load error: '+e.message,'error');});
  };

  /* ── schedule table ── */
  function updateSchedule(){
    var tb=R('planScheduleTb'); if(!tb)return;
    var counts={column:0,beam:0,wall:0,door:0,window:0,text:0};
    var colSizes={};
    PLAN.shapes.forEach(function(s){
      counts[s.type]=(counts[s.type]||0)+1;
      if(s.type==='column'){
        var sz=s.size||'230x380';
        colSizes[sz]=(colSizes[sz]||0)+1;
      }
    });
    var rows='';
    if(counts.column){
      Object.keys(colSizes).forEach(function(sz){
        rows+='<tr><td style="padding:.2rem .4rem">⬛ Column</td><td style="padding:.2rem .4rem">RCC Column</td><td style="padding:.2rem .4rem">'+sz+' mm</td><td style="padding:.2rem .4rem;text-align:right;font-weight:700">'+colSizes[sz]+'</td></tr>';
      });
    }
    if(counts.beam) rows+='<tr><td style="padding:.2rem .4rem">━ Beam</td><td style="padding:.2rem .4rem">RCC Beam</td><td style="padding:.2rem .4rem">—</td><td style="padding:.2rem .4rem;text-align:right;font-weight:700">'+counts.beam+'</td></tr>';
    if(counts.wall) rows+='<tr><td style="padding:.2rem .4rem">▬ Wall</td><td style="padding:.2rem .4rem">Masonry Wall</td><td style="padding:.2rem .4rem">—</td><td style="padding:.2rem .4rem;text-align:right;font-weight:700">'+counts.wall+'</td></tr>';
    if(counts.door) rows+='<tr><td style="padding:.2rem .4rem">🚪 Door</td><td style="padding:.2rem .4rem">Door Opening</td><td style="padding:.2rem .4rem">—</td><td style="padding:.2rem .4rem;text-align:right;font-weight:700">'+counts.door+'</td></tr>';
    if(counts.window) rows+='<tr><td style="padding:.2rem .4rem">🪟 Window</td><td style="padding:.2rem .4rem">Window Opening</td><td style="padding:.2rem .4rem">—</td><td style="padding:.2rem .4rem;text-align:right;font-weight:700">'+counts.window+'</td></tr>';
    if(!rows) rows='<tr><td colspan="4" style="text-align:center;color:#aaa;padding:.4rem;font-style:italic">Plan वर elements जोडल्यावर येथे दिसतील</td></tr>';
    tb.innerHTML=rows;
  }

  /* ══════════════════════════════════════════════
     IMAGE / PDF IMPORT
  ══════════════════════════════════════════════ */
  window.planImportImage = function(){
    var inp=R('planImgInput'); if(inp){inp.value='';inp.click();}
  };

  window.planHandleImport = function(input){
    var file=input.files[0]; if(!file)return;
    var statusEl=R('planImportStatus');
    function setStatus(msg,color){if(statusEl){statusEl.textContent=msg;statusEl.style.color=color||'#555';}}

    if(file.type==='application/pdf'){
      setStatus('PDF load होत आहे...','#7b1fa2');
      _planLoadPdfJs(function(){
        if(!window.pdfjsLib){setStatus('PDF.js load झाला नाही. PNG/JPG वापरा.','#c00');return;}
        var reader=new FileReader();
        reader.onload=function(e){
          var pdfData=new Uint8Array(e.target.result);
          pdfjsLib.getDocument({data:pdfData}).promise.then(function(pdf){
            setStatus('Page '+1+'/'+pdf.numPages+' render होत आहे...','#7b1fa2');
            pdf.getPage(1).then(function(page){
              var vp=page.getViewport({scale:2.0});
              var tc=document.createElement('canvas');
              tc.width=vp.width; tc.height=vp.height;
              page.render({canvasContext:tc.getContext('2d'),viewport:vp}).promise.then(function(){
                var img=new Image();
                img.onload=function(){_planSetBgImage(img);setStatus('PDF imported! ✓ (Page 1)','#1b5e20');};
                img.src=tc.toDataURL('image/png');
              });
            });
          }).catch(function(err){setStatus('PDF error: '+err.message,'#c00');});
        };
        reader.readAsArrayBuffer(file);
      });
      return;
    }

    /* Regular image */
    if(!file.type.match(/^image\//)){setStatus('फक्त JPG, PNG, PDF फाईल select करा.','#c00');return;}
    setStatus('Image load होत आहे...','#7b1fa2');
    var reader=new FileReader();
    reader.onload=function(e){
      var img=new Image();
      img.onload=function(){_planSetBgImage(img);setStatus('Image imported! ✓  Select tool वापरून position करा.','#1b5e20');};
      img.onerror=function(){setStatus('Image load error.','#c00');};
      img.src=e.target.result;
    };
    reader.readAsDataURL(file);
  };

  function _planSetBgImage(img){
    var c=getCanvas(); if(!c)return;
    PLAN.bgImg=img;
    PLAN.bgImgAspect=img.width/img.height;
    /* fit within canvas maintaining aspect ratio */
    var maxW=c.width*0.88, maxH=c.height*0.88;
    var ratio=Math.min(maxW/img.width, maxH/img.height, 1);
    PLAN.bgImgW=Math.round(img.width*ratio);
    PLAN.bgImgH=Math.round(img.height*ratio);
    PLAN.bgImgX=Math.round((c.width-PLAN.bgImgW)/2);
    PLAN.bgImgY=Math.round((c.height-PLAN.bgImgH)/2);
    PLAN.bgImgSelected=true;
    var btn=R('planRemoveImgBtn'); if(btn)btn.style.display='';
    var opWrap=R('planImgOpacityWrap'); if(opWrap)opWrap.style.display='flex';
    /* auto-switch to select tool so user can immediately position */
    if(typeof window.planSetTool==='function') window.planSetTool('select');
    drawAll();
  }

  window.planRemoveBgImg = function(){
    if(!PLAN.bgImg)return;
    if(!confirm('Background image remove करायची?'))return;
    PLAN.bgImg=null; PLAN.bgImgSelected=false;
    var btn=R('planRemoveImgBtn'); if(btn)btn.style.display='none';
    var opWrap=R('planImgOpacityWrap'); if(opWrap)opWrap.style.display='none';
    var statusEl=R('planImportStatus'); if(statusEl)statusEl.textContent='';
    drawAll();
  };

  /* Opacity slider */
  window.planImgOpacity = function(val){
    PLAN._bgImgOpacity=parseFloat(val)||0.92;
    var lbl=R('planImgOpacityVal'); if(lbl)lbl.textContent=Math.round(PLAN._bgImgOpacity*100)+'%';
    drawAll();
  };

  function _planLoadPdfJs(cb){
    if(window.pdfjsLib){cb();return;}
    var s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload=function(){
      if(window.pdfjsLib)
        pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      setTimeout(cb,200);
    };
    s.onerror=function(){cb();};
    document.head.appendChild(s);
  }

  /* init on DOMContentLoaded */
  function planInit(){
    var c=getCanvas(); if(!c)return;
    // initial draw
    setTimeout(drawAll,100);
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',planInit);
  } else {
    setTimeout(planInit,200);
  }
})();
/* ── END PLAN TAB ── */

/* ══════════════════════════════════════════════
   PRINT ALL HOOK — Cloud-only silent save
   Print All click = cloud la save hoto (no toast,
   no localStorage, no alert)
══════════════════════════════════════════════ */
(function(){
  /* Cloud-only silent save — localStorage ला touch karat nahi */
  function _cloudSilent(){
    try{
      if(!window.CU || !window.firebase || !firebase.firestore) return;
      var nm = ((document.getElementById('pName')||{}).value||'').trim();
      if(!nm) return;

      /* Collect all estimate data */
      var lkm={};
      if(typeof LCD !== 'undefined'){
        for(var i=0;i<LCD.length;i++){var el=R('lkm_'+i);if(el)lkm[i]=parseFloat(el.value)||0;}
      }
      var lkmFull={};
      if(typeof LEAD_KM!=='undefined'){for(var _k in LEAD_KM)lkmFull[_k]=LEAD_KM[_k];}
      var llocFull={};
      if(typeof LEAD_LOC!=='undefined'){for(var _l in LEAD_LOC)llocFull[_l]=LEAD_LOC[_l];}
      var mtfSave={};
      if(typeof mtfData!=='undefined'){for(var _sm=0;_sm<mtfData.length;_sm++)mtfSave[mtfData[_sm].sr]=mtfData[_sm].cost;}
      var extraRowsSave=(typeof EXTRA_ROWS!=='undefined')?JSON.parse(JSON.stringify(EXTRA_ROWS)):[];
      var steelRowsSave=(typeof steelRows!=='undefined')?JSON.parse(JSON.stringify(steelRows)):[];
      var scSecsSave=(typeof scSecs!=='undefined')?JSON.parse(JSON.stringify(scSecs)):[];

      /* Plan tab drawing data */
      var planDataSave = (typeof window._getPlanData==='function') ? window._getPlanData() : null;

      /* Lead Map drawing data */
      var leadMapDataSave = null;
      if(typeof SP !== 'undefined'){
        leadMapDataSave = {
          shapes: JSON.parse(JSON.stringify(SP.shapes||[])),
          bgImgX: SP.bgImgX||0, bgImgY: SP.bgImgY||0,
          bgImgW: SP.bgImgW||0, bgImgH: SP.bgImgH||0
        };
        if(SP.bgImg){
          try{
            var _tc=document.createElement('canvas');
            _tc.width=SP.bgImgW||400; _tc.height=SP.bgImgH||300;
            _tc.getContext('2d').drawImage(SP.bgImg,0,0,_tc.width,_tc.height);
            leadMapDataSave.bgImgData=_tc.toDataURL('image/jpeg',0.55);
          }catch(_e){}
        }
      }

      /* Grand total calculation */
      var _grand=0;
      try{
        var _A=0; var _items=items||[];
        for(var _ii=0;_ii<_items.length;_ii++) _A+=_items[_ii].amount;
        var _S=gS();
        var _roy=calcRoyTotal(_S);
        var _mtfEl=R('mtfTotal'); var _mtf=_mtfEl?Math.round(parseFloat(_mtfEl.textContent)||0):0;
        var _ABC=_A+_roy+_mtf;
        var _specF=0; /* Area % now in item finalRates */
        var _extT=0;
        if(_S.extraRows&&_S.extraRows.length){
          for(var _ei=0;_ei<_S.extraRows.length;_ei++){
            if(_S.extraRows[_ei].pct>0) _extT+=Math.round(_A*_S.extraRows[_ei].pct/100);
          }
        }
        _grand=_ABC+Math.round(_A*_S.gst/100)+Math.round(_A*_S.cont/100)+Math.round(_A*_S.li/100)+_specF+_extT;
      }catch(_ge){}

      var _cov={
        pName:((R('pName')||{}).value||''),
        pSub:((R('pSub')||{}).value||''),
        pDiv:((R('pDiv')||{}).value||''),
        pCir:((R('pCir')||{}).value||''),
        pReg:((R('pReg')||{}).value||'')
      };
      var _doc={
        name:nm, uid:CU.uid, cover:_cov,
        items:(items||[]), grand:_grand,
        lkm:lkm, leadKm:lkmFull, leadLoc:llocFull,
        mtfCosts:mtfSave, extraRows:extraRowsSave,
        steelRows:steelRowsSave, scSecs:scSecsSave,
        planData:planDataSave, leadMapData:leadMapDataSave,
        settings:{
          gst:pf('sGST'),cont:pf('sCont'),li:pf('sLI'),
          royS:pf('sRS'),royC:pf('sRC'),
          cancelScada:(CANCEL_SCADA||false),
          customScadaVal:(CUSTOM_SCADA_VAL||-126)
        },
        updatedAt:firebase.firestore.FieldValue.serverTimestamp()
      };

      /* Upsert to Firestore — no toast, no alert */
      firebase.firestore()
        .collection('estimates')
        .where('name','==',nm).where('uid','==',CU.uid).limit(1).get()
        .then(function(_s){
          return _s.empty
            ? firebase.firestore().collection('estimates').add(_doc)
            : _s.docs[0].ref.update(_doc);
        })
        .catch(function(){/* silent fail — print should not block */});
    }catch(_err){}
  }

  function _hookPrintAll(){
    if(typeof window.printAll !== 'function') return false;
    if(window._printAllHooked) return true;
    var _origPrint = window.printAll;
    window.printAll = function(){
      _cloudSilent();              /* fire-and-forget cloud save */
      _origPrint.apply(this, arguments);
    };
    window._printAllHooked = true;
    return true;
  }

  if(!_hookPrintAll()){
    var _tries = 0;
    var _iv = setInterval(function(){
      if(_hookPrintAll() || ++_tries > 40) clearInterval(_iv);
    }, 250);
  }
})();

/* ══════════════════════════════════════════════
   AUTO CLOUD SAVE + AUTO LOAD — No manual buttons needed
   saveEstimate() → automatically saves to cloud
   Login → automatically loads cloud list
══════════════════════════════════════════════ */
(function(){

  /* ── 1. Hook saveEstimate to auto-trigger cloudSave after save ── */
  function _hookSaveEstimate(){
    if(typeof window.saveEstimate !== 'function') return false;
    if(window._saveEstimateCloudHooked) return true;
    var _orig = window.saveEstimate;
    window.saveEstimate = function(){
      _orig.apply(this, arguments);
      /* After local save, also push to cloud silently */
      setTimeout(function(){
        try{
          if(typeof window.cloudSave === 'function'){
            window.cloudSave();
          }
        }catch(e){}
      }, 300);
    };
    window._saveEstimateCloudHooked = true;
    return true;
  }

  /* ── 2. Hook: After login (CU is set), auto-load cloud list ── */
  function _hookAuthForCloudList(){
    if(typeof window.firebase === 'undefined' || !firebase.auth) return false;
    if(window._cloudListAuthHooked) return true;
    firebase.auth().onAuthStateChanged(function(user){
      if(user){
        /* User logged in — auto-load cloud estimate list */
        setTimeout(function(){
          try{
            if(typeof window.loadCloudList === 'function'){
              window.loadCloudList();
            }
          }catch(e){}
        }, 1000);
      }
    });
    window._cloudListAuthHooked = true;
    return true;
  }

  /* Try hooking now; retry if not ready */
  function _tryHook(){
    _hookSaveEstimate();
    _hookAuthForCloudList();
  }

  var _hTries = 0;
  var _hIv = setInterval(function(){
    _tryHook();
    if(++_hTries > 60) clearInterval(_hIv);
  }, 500);

  /* Also try on DOMContentLoaded */
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(_tryHook, 500); });
  } else {
    setTimeout(_tryHook, 500);
  }

})();
/* ── END AUTO CLOUD SAVE HOOK ── */
