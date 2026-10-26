import {cleanName} from './core.js?v=20261026.3';
import {mountBenchmarks} from './benchmarks.js?v=20261026.3';

export const money = cents => (cents / 100).toLocaleString('zh-CN', {minimumFractionDigits:2,maximumFractionDigits:2});
export function toCents(value) {
 const text=String(value).trim();
 if(!/^\d+(?:\.\d{1,2})?$/.test(text)) throw Error('金额请填写非负数字，最多两位小数。');
 const [whole,decimal='']=text.split('.');
 const cents=Number(whole)*100+Number(decimal.padEnd(2,'0'));
 if(!Number.isSafeInteger(cents)||cents>100000000) throw Error('金额超出范围，请核对。');
 return cents;
}
export const hourlyCents = cents => Math.round(cents*60/80);
export const takeHomeCents = gross => Math.round(gross*47/100);
export function normalizeIncome(entry){
 const grossCents=entry.grossCents??entry.cents;
 return {...entry,grossCents,cents:takeHomeCents(grossCents),sharePercent:47};
}
export function sessionKey(date,time,label) {return JSON.stringify([date,time,label]);}
export function upsertIncome(entries,entry) {
 const index=entries.findIndex(e=>e.id===entry.id);
 return {entries:index<0?[entry,...entries]:entries.map((e,i)=>i===index?entry:e),created:index<0};
}

// 只读取到课区域，按横向位置把金额关联到其下方的姓名。
export function readPriceRows(blocks,top,bottom) {
 const lines=(blocks||[]).flatMap(b=>(b.paragraphs||[]).flatMap(p=>p.lines||[]))
  .filter(l=>l.bbox.y0>=top&&l.bbox.y1<=bottom);
 const prices=lines.flatMap(l=>{
  const match=l.text.replace(/[,，\s]/g,'').match(/(?:^|[^\d])(\d+\.\d{2})(?!\d)/);
  return match?[{...l,cents:toCents(match[1]),used:false}]:[];
 });
 const rows=[];
 for(const l of lines){
  const match=l.text.replace(/\s/g,'').match(/20\d{2}([\u4e00-\u9fff·]{2,8})\d*/);
  if(!match)continue;
  const center=(l.bbox.x0+l.bbox.x1)/2;
  const candidates=prices.filter(p=>!p.used&&p.bbox.y1<=l.bbox.y0+8&&l.bbox.y0-p.bbox.y1<Math.max(90,(l.bbox.y1-l.bbox.y0)*4)&&Math.abs((p.bbox.x0+p.bbox.x1)/2-center)<Math.max(65,(l.bbox.x1-l.bbox.x0)*.6))
   .sort((a,b)=>(l.bbox.y0-a.bbox.y1+Math.abs((a.bbox.x0+a.bbox.x1)/2-center))-(l.bbox.y0-b.bbox.y1+Math.abs((b.bbox.x0+b.bbox.x1)/2-center)));
  if(candidates.length){candidates[0].used=true;rows.push({name:cleanName(match[1]),cents:candidates[0].cents});}
 }
 return rows;
}

export function mountIncome(){
 const $=id=>document.getElementById(id);
 const panel=document.createElement('section');panel.className='card income-card';
 panel.innerHTML=`<div class="section-title"><span class="number">¥</span><h2>让努力，看得见</h2><span class="pill">收入账本</span></div>
 <div id="income-win" class="income-win" role="status"><span>本节到手薪水 · 47%</span><strong id="income-amount">¥ 0.00</strong><p id="income-gross">到课课费合计 × 47% = 到手薪水</p><p id="income-cheer">认真上完的每一节课，都值得留下一笔记录。</p></div>
 <p id="income-period" class="hint"></p><div class="income-stats"><div>当日到手<span id="income-today">¥ 0.00</span></div><div>当月到手<span id="income-month">¥ 0.00</span></div><div>累计到手<span id="income-total">¥ 0.00</span></div></div>
 <p id="income-milestone" class="hint"></p><progress id="income-progress" max="100000" value="0" aria-label="下一个千元里程碑"></progress>
 <p id="income-rate" class="income-rate">每节 80 分钟 · 等待记录</p><p id="income-compare" class="hint">下方自动对比全国、铁岭及近龄参考；个人目标可选填。</p>
 <label>参考时薪（元 / 小时，选填）<input id="income-reference" inputmode="decimal" type="number" min="0" step="0.01" placeholder="例如 150"></label><p class="hint">这是你设置的目标基准，不代表市场平均水平；时薪仅按授课80分钟计算。</p>
 <details id="income-inputs"><summary>自动识别信息 · 需要时修改</summary><label>开课时间（截图自动填写，可修改）<input id="income-time" type="time"></label><div id="income-prices"></div><p class="hint">仅计算到课学生。缺失金额请补填；金额未齐时可生成报告，但暂不记账。同一日期、时间和班级只记一笔；同日另有一节课请填写不同时间。</p></details>
 <p id="income-status" class="hint" role="status"></p><details><summary>账目明细与导出</summary><button id="income-export" class="secondary">导出 CSV</button><div id="income-list"></div><p class="hint">截图课费合计后按47%计算到手薪水，时薪也按到手金额计算。旧账目自动按47%重新折算。账目保存在当前浏览器，建议定期导出备份。</p></details>`;
 document.querySelector('aside').prepend(panel);
 document.querySelector('.form .card').append($('income-inputs'));
 const metadata=$('income-inputs'),timeLabel=$('income-time').closest('label');
 for(const id of ['date','teacher'])metadata.insertBefore($(id).closest('label'),timeLabel);
 $('className').closest('.grid').style.gridTemplateColumns='1fr';
 const personalGoal=document.createElement('details'),personalSummary=document.createElement('summary');personalSummary.textContent='个人目标时薪（选填）';personalGoal.append(personalSummary);
 const goalLabel=$('income-reference').closest('label'),goalHint=goalLabel.nextElementSibling;goalLabel.before(personalGoal);personalGoal.append(goalLabel,goalHint);
 const updateBenchmarks=mountBenchmarks(panel);
 let entries=[],priceMap=new Map(),conflicts=new Set(),last=null,amountFrame=0;
 try{entries=JSON.parse(localStorage.getItem('bio-income')||'[]');if(!Array.isArray(entries))entries=[];entries=entries.map(normalizeIncome);$('income-reference').value=localStorage.getItem('bio-income-reference')||'';}catch{}
 const write=next=>{localStorage.setItem('bio-income',JSON.stringify(next));entries=next;};
 function names(){return [...new Set($('names').value.split(/[\s,，、;；]+/).map(cleanName).filter(Boolean))];}
 function sync(){
  const box=$('income-prices');box.replaceChildren();
  for(const name of names()){
   const label=document.createElement('label');label.className='income-price';const span=document.createElement('span');span.textContent=name;
   const input=document.createElement('input');input.type='number';input.min='0';input.step='.01';input.inputMode='decimal';input.placeholder='待补金额';input.setAttribute('aria-label',`${name}课费`);input.value=priceMap.has(name)?String(priceMap.get(name)/100):'';
   input.oninput=()=>{if(!input.value.trim()){priceMap.delete(name);return;}try{priceMap.set(name,toCents(input.value));}catch{priceMap.delete(name);}};
   label.append(span,input);box.append(label);
  }
 }
 function render(){
  updateBenchmarks(last?hourlyCents(last.cents):null);
  const d=new Date(),today=$('date').value||last?.date||`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  $('income-period').textContent=`按上课日期统计：${today} · 金额均为47%到手薪水`;
  const sum=arr=>arr.reduce((s,e)=>s+e.cents,0),total=sum(entries);
  $('income-today').textContent='¥ '+money(sum(entries.filter(e=>e.date===today)));
  $('income-month').textContent='¥ '+money(sum(entries.filter(e=>e.date.slice(0,7)===today.slice(0,7))));
  $('income-total').textContent='¥ '+money(total);
  const target=(Math.floor(total/100000)+1)*100000;
  $('income-milestone').textContent=`已完成 ${Math.floor(total/100000)} 个千元积累 · 距下一个 ¥${money(target)} 还差 ¥${money(target-total)}`;
  $('income-progress').value=total%100000;
  if(last){
   $('income-amount').textContent='¥ '+money(last.cents);
   $('income-gross').textContent=`${last.date} ${last.time||''} · 课费 ¥${money(last.grossCents)} × 47%`;
   const rate=hourlyCents(last.cents);$('income-rate').textContent=`80 分钟 · 到手时薪 ¥${money(rate)} / 小时`;
   let ref=0;try{if($('income-reference').value)ref=toCents($('income-reference').value);}catch{}
   $('income-compare').textContent=ref?(rate>ref?`比你设置的参考时薪高 ${((rate/ref-1)*100).toFixed(1)}%，这份教学能力正在创造价值！`:rate===ref?'本节授课时薪达到你设置的参考水平。':`本节为参考时薪的 ${(rate/ref*100).toFixed(1)}%，已如实记录。`):'下方自动对比全国、铁岭及近龄参考；个人目标可选填。';
  }
  if(!last)$('income-gross').textContent='到课课费合计 × 47% = 到手薪水';
  $('income-list').replaceChildren();
  entries.forEach(e=>{
   const row=document.createElement('div');row.className='income-entry';const text=document.createElement('span');text.textContent=`${e.date} ${e.time||''} · ${e.label} · 课费 ¥${money(e.grossCents)} / 到手 ¥${money(e.cents)}`;
   const edit=document.createElement('button');edit.className='secondary';edit.textContent='改金额';edit.onclick=()=>{const value=prompt('修改截图课费合计（元，未乘47%）',String(e.grossCents/100));if(value===null)return;try{const updated=normalizeIncome({...e,grossCents:toCents(value)});write(entries.map(x=>x.id===e.id?updated:x));if(last?.id===e.id)last=updated;render();}catch(err){$('income-status').textContent=err.message;}};
   const del=document.createElement('button');del.className='quiet';del.textContent='删除';del.onclick=()=>{if(confirm('删除这笔课时收入？')){try{write(entries.filter(x=>x.id!==e.id));if(last?.id===e.id){last=entries[0]||null;$('income-amount').textContent=last?'¥ '+money(last.cents):'¥ 0.00';$('income-cheer').textContent='账目已更新。';$('income-rate').textContent='每节 80 分钟 · 等待记录';$('income-compare').textContent='下方自动对比全国、铁岭及近龄参考；个人目标可选填。';}render();}catch{$('income-status').textContent='删除失败，浏览器存储不可用。';}}};
   row.append(text,edit,del);$('income-list').append(row);
  });
 }
 $('income-reference').oninput=()=>{try{localStorage.setItem('bio-income-reference',$('income-reference').value);}catch{}render();};
 $('names').addEventListener('blur',sync);
 $('date').addEventListener('change',render);
 $('income-export').onclick=()=>{
  const cell=s=>'"'+String(s).replaceAll('"','""')+'"';
  const content='\ufeff上课日期,开课时间,班级或学生,课费合计（元）,到手比例,到手薪水（元）,分钟,到手时薪（元）\r\n'+entries.map(e=>[e.date,e.time,e.label,money(e.grossCents),'47%',money(e.cents),80,money(hourlyCents(e.cents))].map(cell).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='生物课时收入.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 last=entries[0]||null;render();sync();
 return {
  rename(from,to){if(priceMap.has(from)&&!priceMap.has(to))priceMap.set(to,priceMap.get(from));priceMap.delete(from);sync();},
  reset(){priceMap=new Map();conflicts=new Set();$('income-time').value='';$('income-status').textContent='';sync();},
  recognize(rows,text){
   for(const row of rows){if(conflicts.has(row.name))continue;if(priceMap.has(row.name)&&priceMap.get(row.name)!==row.cents){priceMap.delete(row.name);conflicts.add(row.name);$('income-status').textContent='多张截图中金额不一致，请手动核对。';}else priceMap.set(row.name,row.cents);}
   const time=text.match(/(?:^|\s)(\d{2}:\d{2})(?::\d{2})?\s*[-—~～]/);if(time)$('income-time').value=time[1];sync();render();
  },
  record(expectedCount=null){
   sync();const attendees=names();
   if(expectedCount!==null&&attendees.length!==expectedCount){$('income-status').textContent='报告已生成；名单人数与截图不一致，暂未记账，请核对名单后再次生成。';return;}
   if(attendees.some(n=>!priceMap.has(n))){$('income-status').textContent='报告已生成；到课学生金额未齐，暂未记账，请补齐金额后再次生成。';return;}
   const date=$('date').value,time=$('income-time').value,label=attendees.length===1?attendees[0]:$('className').value;
   const entry=normalizeIncome({id:sessionKey(date,time,label),date,time,label,grossCents:attendees.reduce((s,n)=>s+priceMap.get(n),0),names:attendees,minutes:80});
   const result=upsertIncome(entries,entry);
   try{write(result.entries);}catch{$('income-status').textContent='报告已生成，但收入保存失败，请先导出账目再重试。';return;}
   last=entry;render();
   $('income-status').textContent=result.created?'本节已自动记账 ✓':'这节课已记过，更新原记录，不重复累加。';
   const cheers=['认真教学，正在变成实实在在的收获。','又完成一节课，你的付出有了清楚的回响。','一点点积累，就是你向前走的证据。','这份收入，来自你扎实投入的80分钟。'];
   $('income-cheer').textContent=result.created&&entry.cents>0?`这80分钟，又积累了 ${money(entry.cents)} 元。${cheers[Math.floor(Math.random()*cheers.length)]}`:result.created?'本节课已记录，收入为0元。':'本节记录已更新，累计收入按实际金额统计。';
   cancelAnimationFrame(amountFrame);
   if(result.created&&entry.cents>0){const win=$('income-win');win.classList.remove('celebrate');void win.offsetWidth;win.classList.add('celebrate');if(!matchMedia('(prefers-reduced-motion: reduce)').matches){win.animate([{transform:'scale(.97)',opacity:.5},{transform:'scale(1)',opacity:1}],{duration:650,easing:'ease-out'});const start=performance.now();const tick=now=>{const progress=Math.min(1,(now-start)/700);$('income-amount').textContent='¥ '+money(Math.round(entry.cents*(1-Math.pow(1-progress,3))));if(progress<1)amountFrame=requestAnimationFrame(tick);};amountFrame=requestAnimationFrame(tick);}}
   if(innerWidth<760)panel.scrollIntoView({behavior:'smooth',block:'start'});
  }
 };
}
