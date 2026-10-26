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
 section.innerHTML=`<div class="section-title"><h2>看看你的这一小时</h2><span class="pill">23岁 · 辽宁铁岭</span></div>
 <p class="hint">23岁 · 辽宁铁岭 · 数据核查于2026-10-26。参考值由税前年工资按2080工时估算；你的47%分成后授课时薪未计备课等时间，不是同口径净收入或全年综合时薪比较。</p>
 <div id="benchmark-nation" class="wage-reference"></div><div id="benchmark-local" class="wage-reference"></div>
 <div class="wage-reference"><strong>23岁同龄人</strong><p>暂未取得可靠的全国23岁平均时薪及收入分布，暂不计算同龄差额或排名。</p><details><summary>查看近龄补充参考（非23岁均值）</summary><div id="benchmark-graduate"></div></details></div>
 <div class="wage-reference"><strong>分位线参考 · 非全国个人排名</strong><p id="benchmark-quantile">记录课时收入后显示。</p><p class="hint">全国、铁岭、23岁人群的前X%排名：暂无匹配分布数据。下列教学岗位分位线仅作量级参照。</p><a href="https://www.mohrss.gov.cn/SYrlzyhshbzb/laodongguanxi_/fwyd/202607/t20260708_579822.html" target="_blank" rel="noopener noreferrer">人社部2025年企业薪酬调查 · 企业教学人员</a></div>
 <p id="benchmark-feedback" role="status"></p><details><summary>数据来源与比较口径</summary><p class="hint">参考时薪=年工资÷2080（假设每周40小时、每年52周，并非统计的实际工时）。全国数据覆盖城镇单位就业人员，不包含所有中国人；私营与非私营不混合成一个均值。你的47%分成后授课时薪，与官方税前年工资折算值口径不同；备课、批改、通勤和空档未计入，不能代表全年实际综合时薪。分位线来自企业教学人员税前年工资，使用同一假设折算，并不据此宣称你的全年收入属于前X%。铁岭2024年数据为公告转载，尚未核验原文。本功能未假定所得税或社保扣除额。</p></details>`;
 parent.querySelector('#income-status').before(section);
 const get=id=>section.querySelector('#'+id);
 const appendRef=(box,ref,rate)=>{
  const block=document.createElement('div');const label=document.createElement('strong');label.textContent=`${ref.label} · ${ref.year}年`;
  const p=document.createElement('p'),result=relativeWage(rate,ref.annualYuan);
  p.textContent=rate===null?'生成报告并记账后显示比较。':`参考 ¥${result.reference.toFixed(2)}/小时 · ${result.direction==='相当'?'与该口径均值相当':`${result.direction}该口径均值 ${Math.abs(result.percent).toFixed(1)}%`}`;
  p.className=result?.percent>0?'wage-above':'wage-neutral';
  const link=document.createElement('a');link.href=ref.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=ref.note?'来源与样本说明':'国家统计局数据';
  block.append(label,p,link);if(ref.note){const note=document.createElement('p');note.className='hint';note.textContent=ref.note;block.append(note);}box.append(block);
 };
 const update=rate=>{
  for(const id of ['benchmark-nation','benchmark-local','benchmark-graduate'])get(id).replaceChildren();
  appendRef(get('benchmark-nation'),wageReferences.nationalPrivate,rate);appendRef(get('benchmark-nation'),wageReferences.nationalNonPrivate,rate);
  appendRef(get('benchmark-local'),wageReferences.tieling,rate);appendRef(get('benchmark-graduate'),wageReferences.graduate,rate);
  get('benchmark-quantile').textContent=rate===null?'记录课时收入后显示。':quantileReference(rate);
  const comparisons=rate===null?[]:[relativeWage(rate,wageReferences.nationalPrivate.annualYuan),relativeWage(rate,wageReferences.nationalNonPrivate.annualYuan),relativeWage(rate,wageReferences.tieling.annualYuan)];
  get('benchmark-feedback').textContent=rate===null?'':comparisons.every(r=>r.percent>0)?'这节课的分成后授课时薪，高于以上三条工资折算参考线。专注教学的这一小时，展现了你的价值。':comparisons.some(r=>r.percent>0)?'这节课已高于部分参考线，每一节课的积累都在向前。':'本节时薪已如实记录，继续按自己的节奏积累。';
 };
 update(null);return update;
}
