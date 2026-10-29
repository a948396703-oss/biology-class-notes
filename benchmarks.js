// 数据核查日：2026-10-26。年薪按假设40小时×52周折算，仅作量级参照。
export const ASSUMED_ANNUAL_HOURS=2080;
export const wageReferences={
 nationalPrivate:{annualYuan:71590,year:2025,label:'全国城镇私营单位',url:'https://www.stats.gov.cn/sj/zxfb/202605/t20260515_1963707.html'},
 nationalNonPrivate:{annualYuan:129441,year:2025,label:'全国城镇非私营单位',url:'https://www.stats.gov.cn/sj/zxfb/202605/t20260515_1963707.html'},
 tieling:{annualYuan:81946,year:2024,label:'铁岭市职工',url:'https://zc.51shebao.com/detail/837801',note:'市人社局公告转载，原文未完成独立核验；不是所有铁岭居民的平均收入'},
 graduate:{annualYuan:6199*12,year:2024,label:'2024届本科毕业半年后样本',url:'https://cpms.ssap.com.cn/skwx_cmr/initDatabaseDetail?contentId=8096371&contentType=literature&siteId=23',note:'月均6199元，仅为近龄补充样本；不是全国23岁人口均值，也不推断你的学历'}
};
export const teachingQuantiles=[{p:10,annualYuan:30000},{p:25,annualYuan:39000},{p:50,annualYuan:53100},{p:75,annualYuan:82000},{p:90,annualYuan:133300}];
export function relativeWage(hourlyCents,annualYuan){
 if(!Number.isFinite(hourlyCents)||hourlyCents<0||!Number.isFinite(annualYuan)||annualYuan<=0)return null;
 const reference=annualYuan/ASSUMED_ANNUAL_HOURS;
 const percent=(hourlyCents/100/reference-1)*100;
 return {reference,percent,direction:Math.abs(percent)<.05?'相当':percent>0?'高于':'低于'};
}
export function quantileReference(hourlyCents){
 if(!Number.isFinite(hourlyCents)||hourlyCents<0)return null;
 const annualEquivalent=hourlyCents/100*ASSUMED_ANNUAL_HOURS;
 const reached=teachingQuantiles.filter(q=>annualEquivalent>=q.annualYuan).at(-1);
 return reached?`达到企业教学岗位 ${reached.p}% 分位折算线（¥${(reached.annualYuan/ASSUMED_ANNUAL_HOURS).toFixed(2)}/小时）`:'低于企业教学岗位10%分位折算线';
}
export function mountBenchmarks(parent){
 const section=document.createElement('section');section.className='wage-benchmarks';
 section.innerHTML=`<div class="wage-chart-heading"><h2>这一小时，很有价值</h2><span>铁岭 · 23岁</span></div>
 <div class="wage-hero"><span>你的到手授课时薪</span><div><strong id="benchmark-own">—</strong><span>元 / 小时</span></div></div>
 <div class="wage-chart" role="img" aria-label="你的授课时薪与工资折算参考对比"><div id="benchmark-self"></div><div id="benchmark-nation"></div><div id="benchmark-local"></div></div>
 <p class="wage-chart-caption">工资折算参考 · 非全年收入排名</p><p id="benchmark-feedback" role="status"></p>
 <details class="wage-sources"><summary>数据来源</summary><p class="hint">参考时薪=税前年工资÷2080。你的47%分成后授课时薪未计备课、批改、通勤及空档，比较仅作量级参照，不代表全年综合收入或全国排名。全国数据覆盖城镇单位就业人员；铁岭数据为公告转载，原文尚未独立核验。核查日：2026-10-26。</p>
 <div id="benchmark-source-links"></div><p class="hint">23岁同龄人：暂无可靠平均时薪或排名。以下仅为毕业生样本补充参考。</p><div id="benchmark-graduate"></div>
 <p id="benchmark-quantile"></p><a href="https://www.mohrss.gov.cn/SYrlzyhshbzb/laodongguanxi_/fwyd/202607/t20260708_579822.html" target="_blank" rel="noopener noreferrer">教学岗位分位线来源（非全国排名）</a></details>`;
 parent.querySelector('#income-status').before(section);
 const get=id=>section.querySelector('#'+id);
 const refs=[[wageReferences.nationalPrivate,'全国 · 私营'],[wageReferences.nationalNonPrivate,'全国 · 非私营'],[wageReferences.tieling,'铁岭 · 职工']];
 for(const [ref] of [...refs,[wageReferences.graduate]]){
  const link=document.createElement('a');link.href=ref.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=`${ref.label} · ${ref.year}年`;get('benchmark-source-links').append(link);
 }
 const bar=(box,label,value,max,own=false,badge='')=>{
  const row=document.createElement('div');row.className='wage-chart-row'+(own?' is-you':'');
  const heading=document.createElement('div');heading.className='wage-row-label';
  const name=document.createElement('span');name.textContent=label;
  const amount=document.createElement('strong');amount.textContent=value===null?'—':`¥${value.toFixed(2)}`;heading.append(name,amount);
  const track=document.createElement('div');track.className='wage-track';const fill=document.createElement('div');fill.className='wage-fill';fill.style.width=value===null?'0%':`${Math.max(0,Math.min(100,value/max*100))}%`;track.append(fill);row.append(heading,track);
  if(badge){const tag=document.createElement('span');tag.className='wage-difference';tag.textContent=badge;row.append(tag);}box.append(row);
 };
 const update=rate=>{
  for(const id of ['benchmark-self','benchmark-nation','benchmark-local'])get(id).replaceChildren();
  get('benchmark-own').textContent=rate===null?'—':(rate/100).toFixed(2);
  const max=Math.max(rate===null?0:rate/100,...refs.map(([r])=>r.annualYuan/ASSUMED_ANNUAL_HOURS))*1.08;
  bar(get('benchmark-self'),'你 · 本节课',rate===null?null:rate/100,max,true);
  for(const [ref,label] of refs){const r=relativeWage(rate,ref.annualYuan);bar(get(ref===wageReferences.tieling?'benchmark-local':'benchmark-nation'),label,ref.annualYuan/ASSUMED_ANNUAL_HOURS,max,false,rate===null?'':r.direction==='相当'?'你与参考相当':`你${r.direction} ${Math.abs(r.percent).toFixed(1)}%`);}
  const graduate=relativeWage(rate,wageReferences.graduate.annualYuan);get('benchmark-graduate').textContent=rate===null?'记录后显示近龄样本参考。':`毕业生样本：¥${graduate.reference.toFixed(2)}/小时 · ${graduate.direction} ${Math.abs(graduate.percent).toFixed(1)}%（非23岁均值）`;
  get('benchmark-quantile').textContent=rate===null?'记录课时收入后显示。':quantileReference(rate);
  const comparisons=rate===null?[]:[relativeWage(rate,wageReferences.nationalPrivate.annualYuan),relativeWage(rate,wageReferences.nationalNonPrivate.annualYuan),relativeWage(rate,wageReferences.tieling.annualYuan)];
  get('benchmark-feedback').textContent=rate===null?'记下一节课，点亮你的时薪图。':comparisons.every(r=>r.percent>0)?'✦ 高于三条参考线，你的专业正在创造价值。':comparisons.some(r=>r.percent>0)?'✦ 每一节认真上的课，都是新的积累。':'本节已记录，按自己的节奏积累。';
 };
 update(null);return update;
}
