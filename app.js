import {books,pickKnowledge} from './catalog.js?v=20261029.1';
import {mountIncome,readPriceRows} from './income.js?v=20261029.1';
const incomeStyle=document.createElement('link');incomeStyle.rel='stylesheet';incomeStyle.href='./income.css?v=20261029.1';document.head.append(incomeStyle);
import {cleanName,namesFrom,parseAttendance,makeReport,positionedNames,countWarning,matchClass,classNames,validateClassRoster,reconcileClassRoster,confirmedNameChange,rememberNameCorrection,forgetNameCorrection} from './core.js?v=20261029.1';
const buildLabel=document.createElement('p');buildLabel.id='build-version';buildLabel.textContent='版本 10.29.1 · 完整到课截图识别';document.querySelector('footer').append(buildLabel);
const $=id=>document.getElementById(id);let chosen=[],history=[],expectedCount=null;
const fields=['teacher','book'];
$('className').replaceChildren(new Option('请选择班级',''),...classNames.map(name=>new Option(name,name)));
const income=mountIncome();
const nameHelp=$('names').closest('label').nextElementSibling;
const rosterStatus=document.createElement('p');rosterStatus.id='roster-validation';rosterStatus.setAttribute('role','status');rosterStatus.hidden=true;$('names').closest('label').after(rosterStatus);
function refreshRosterValidation(){
 const resolved=reconcileClassRoster(namesFrom($('names').value),$('className').value);
 const rawTokens=$('names').value.split(/[\s,，、;；]+/).filter(Boolean);
 if(resolved.corrections.length||rawTokens.some(name=>cleanName(name)!==name)){$('names').value=resolved.names.join('、');for(const change of resolved.corrections)income.rename(change.from,change.to);$('confirmed').checked=false;}
 const result=validateClassRoster(resolved.names,$('className').value);
 rosterStatus.hidden=!result.hasRoster;
 rosterStatus.className=result.unknown.length?'name-roster-warning':'hint';
 rosterStatus.textContent=result.unknown.length?`待确认姓名：${result.unknown.join('、')}。这些名字不在已确认的${$('className').value}名单中，请对照原图修改；暂不生成报告或记账。`:result.hasRoster?`已按${$('className').value}的已确认名单校验姓名。`:'';
 $('names').classList.toggle('name-roster-invalid',result.unknown.length>0);
 return result.unknown.length===0;
}
$('className').addEventListener('change',refreshRosterValidation);
let recognizedBaseline=[];
const correctionNote=document.createElement('p');correctionNote.className='hint';correctionNote.setAttribute('role','status');$('names').closest('label').after(correctionNote);
const undoCorrection=document.createElement('button');undoCorrection.textContent='撤销本次姓名记忆';undoCorrection.className='quiet';undoCorrection.hidden=true;correctionNote.after(undoCorrection);
 let lastCorrection=null;
undoCorrection.onclick=()=>{if(!lastCorrection)return;try{forgetNameCorrection(lastCorrection[0]);correctionNote.textContent='本次姓名记忆已撤销。';undoCorrection.hidden=true;lastCorrection=null;}catch{correctionNote.textContent='姓名记忆撤销失败，请重试。';}};
$('confirmed').addEventListener('change',()=>{
 if(!$('confirmed').checked)return;
 const after=namesFrom($('names').value),change=confirmedNameChange(recognizedBaseline,after);
 if(!change)return;
 try{if(rememberNameCorrection(...change)){lastCorrection=change;income.rename(...change);correctionNote.textContent=`已记住：${change[0]} → ${change[1]}，之后在此浏览器自动纠正。`;undoCorrection.hidden=false;recognizedBaseline=after;}}catch{correctionNote.textContent='本次报告使用你核对的姓名，但浏览器未能保存姓名记忆。';}
});
$('screens').addEventListener('change',()=>{if($('screens').files.length){recognizedBaseline=[];correctionNote.textContent='';undoCorrection.hidden=true;}});
const singleClassHint=document.createElement('p');singleClassHint.className='hint';singleClassHint.hidden=true;$('className').closest('label').before(singleClassHint);
nameHelp.textContent='自动去掉姓名前的年份和末尾数字。请核对姓名、生僻字和人数；单个错字修改后勾选核对，会记住本次纠正。';
$('screens').addEventListener('change',()=>{if($('screens').files.length)income.reset();});
function applyClass(rosterText){const {candidates,source}=matchClass(namesFrom($('names').value),rosterText);$('className').value=candidates.length===1?candidates[0]:'';status('class-hint',candidates.length===1?`根据${source}匹配：${candidates[0]}（可修改）`:candidates.length>1?`匹配到多个班级：${candidates.join('、')}，请手动选择。`:'未能确定班级，请从班级列表中选择。');}
$('className').onchange=()=>status('class-hint','已手动选择班级。');
function status(id,s){$(id).textContent=s;}
function persist(){try{localStorage.setItem('bio-settings',JSON.stringify(Object.fromEntries(fields.map(k=>[k,$(k).value]))));localStorage.setItem('bio-chapters',JSON.stringify(chosen));}catch{status('form-status','浏览器未允许本地保存，仍可生成和复制。');}}
books.forEach((b,i)=>$('book').add(new Option(b[0],i)));
try{const saved=JSON.parse(localStorage.getItem('bio-settings')||'{}');fields.forEach(k=>{if(saved[k]!=null)$(k).value=saved[k]});if(!$('book').value)$('book').value='0';history=JSON.parse(localStorage.getItem('bio-history')||'[]');chosen=JSON.parse(localStorage.getItem('bio-chapters')||'[]');}catch{}
const now=new Date();$('date').value=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
function chapterOptions(){const b=books[Number($('book').value)];$('chapter').replaceChildren(new Option('请选择章节',''));b[1].forEach((c,i)=>$('chapter').add(new Option(`第${i+1}章 ${c[0]}`,i)));chosen=chosen.filter(i=>b[1][i]);renderChapters();}
function renderChapters(){$('chapters').replaceChildren();chosen.forEach(i=>{const b=document.createElement('button');b.textContent=`第${i+1}章 ${books[+$('book').value][1][i][0]} ×`;b.onclick=()=>{chosen=chosen.filter(x=>x!==i);renderChapters();persist()};$('chapters').append(b)});}
chapterOptions();$('book').onchange=()=>{chosen=[];chapterOptions();persist()};$('chapter').onchange=()=>{if($('chapter').value==='')return;const n=+$('chapter').value;if(!chosen.includes(n))chosen.push(n);chosen.sort((a,b)=>a-b);renderChapters();persist();$('chapter').value=''};
function updateCount(){const names=namesFrom($('names').value),n=names.length;status('count',`${n} 人`);$('confirmed').checked=false;const warning=countWarning(expectedCount,n);status('attendance-warning',warning);$('attendance-warning').hidden=!warning;$('className').closest('label').hidden=n===1;singleClassHint.hidden=n!==1;singleClassHint.textContent=n===1?`单人课 · ${names[0]}，无需选择班级。`:'';refreshRosterValidation();}
$('names').oninput=updateCount;$('names').onblur=()=>{$('names').value=namesFrom($('names').value).join('、')};fields.filter(x=>x!=='book').forEach(k=>$(k).onchange=persist);
$('parse').onclick=()=>{const r=parseAttendance($('ocr-text').value);expectedCount=r.count;$('names').value=r.names.join('、');applyClass($('ocr-text').value);if(r.date)$('date').value=r.date;updateCount();status('ocr-status',r.names.length?`提取到 ${r.names.length} 位学生${r.count!==null?`，截图标记到课 ${r.count} 人`:''}。请逐一核对。`:'未能可靠提取到课名单，请在“到课学生”中手动填写。');};
async function loadOCR(){if(window.Tesseract)return;await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='vendor/tesseract.min.js';s.onload=resolve;s.onerror=()=>reject(Error('识别资源加载失败，请检查网络或粘贴截图文字。'));document.head.append(s)});}
async function imageCanvas(file){
 const img=new Image(),url=URL.createObjectURL(file);
 try{
  await new Promise((r,j)=>{img.onload=r;img.onerror=j;img.src=url});
  const source=document.createElement('canvas');source.width=img.width;source.height=img.height;const ctx=source.getContext('2d');ctx.drawImage(img,0,0);
  // 转发或标注的截图常有左右留白，先根据蓝色页头去掉边框。
  const pixels=ctx.getImageData(0,Math.floor(img.height*.15),img.width,1).data;let left=img.width,right=-1;
  for(let x=0;x<img.width;x++){const i=x*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];if(b>120&&b>r*1.4&&g>r*1.2){left=Math.min(left,x);right=x;}}
  if(right-left<img.width*.45){left=0;right=img.width-1;}
  const width=right-left+1,c=document.createElement('canvas'),scale=width<1000?1280/width:Math.min(1,1600/width);
  c.width=Math.round(width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(source,left,0,width,img.height,0,0,c.width,c.height);return c;
 }finally{URL.revokeObjectURL(url)}
}
function attendanceCrop(c){const ctx=c.getContext('2d'),p=ctx.getImageData(0,0,c.width,c.height).data;let start=-1,end=-1,run=0,tagBottom=-1;for(let y=Math.floor(c.height*.12);y<c.height;y++){let blue=0,purple=0;for(let x=Math.floor(c.width*.04);x<c.width*.13;x++){const i=(y*c.width+x)*4,r=p[i],g=p[i+1],b=p[i+2];if(b>120&&b>r*1.4&&g>r*1.2)blue++;if(b>150&&r>90&&r>g*1.2)purple++;}const width=c.width*.09;const right=(y*c.width+Math.floor(c.width*.9))*4;const white=p[right]>225&&p[right+1]>225&&p[right+2]>225;if(blue>width*.6&&white){run++;if(run>15&&start<0)start=y-run;if(start>=0)tagBottom=y;}else run=0;if(start>=0&&y>start+50&&purple>width*.6){end=y;break;}}
 // 截图可能只包含到课卡片，没有下一张紫色请假卡片；此时到课区域延伸至图底。
 if(start<0)return null;const openEnded=end<0;if(openEnded)end=c.height;const out=document.createElement('canvas');out.width=c.width;out.height=end-start;out.getContext('2d').drawImage(c,0,start,c.width,end-start,0,0,c.width,end-start);return {canvas:out,top:start,bottom:end,tagBottom,openEnded};}
$('screens').onchange=async()=>{const files=[...$('screens').files];if(!files.length)return;$('screens').disabled=true;$('generate').disabled=true;$('previews').replaceChildren();$('names').value='';$('className').value='';status('class-hint','识别完成后自动匹配班级。');expectedCount=null;updateCount();let worker;let recognized=[];try{status('ocr-status','正在准备本机文字识别，首次加载可能需要一些时间…');await loadOCR();worker=await Tesseract.createWorker('chi_sim',1,{workerPath:'vendor/worker.min.js',corePath:'vendor/core',langPath:'https://cdn.jsdelivr.net/npm/@tesseract.js-data/chi_sim@1.0.0/4.0.0',logger:m=>{if(m.status==='recognizing text')status('ocr-status',`正在识别文字 ${Math.round(m.progress*100)}%…`);}});await worker.setParameters({tessedit_pageseg_mode:'11'});
 let allText=[],counts=[],classTexts=[],priceRows=[];for(let i=0;i<files.length;i++){
 const c=await imageCanvas(files[i]),img=new Image();img.src=c.toDataURL('image/jpeg',.6);img.alt=`点名截图 ${i+1}`;$('previews').append(img);
 await worker.setParameters({tessedit_pageseg_mode:'11',tessedit_char_whitelist:''});
 const full=await worker.recognize(c,{}, {text:true,blocks:true});classTexts.push(full.data.text);const meta=parseAttendance(full.data.text);if(meta.date&&i===0)$('date').value=meta.date;
 const crop=attendanceCrop(c);let result={names:[]},count=meta.count;
 if(crop){
   priceRows.push(...readPriceRows(full.data.blocks,crop.top,crop.bottom));
   result.names=positionedNames(full.data.blocks,crop.top,crop.bottom);
   if(!result.names.length){const r=await worker.recognize(crop.canvas);result=parseAttendance('到课\n'+r.data.text);}
   const badge=document.createElement('canvas'),height=crop.tagBottom-crop.top;badge.width=Math.round(c.width*.09)*3;badge.height=Math.round(height*.3)*3;
   // 只取蓝色标签内部，避免右侧白色卡片边缘被数字识别成额外的“1”。
   badge.getContext('2d').drawImage(c,c.width*(crop.openEnded?.048:.04),crop.top+height*.58,c.width*(crop.openEnded?.07:.09),height*.3,0,0,badge.width,badge.height);
   const ctx=badge.getContext('2d'),pixels=ctx.getImageData(0,0,badge.width,badge.height);for(let j=0;j<pixels.data.length;j+=4){const white=pixels.data[j]>170&&pixels.data[j+1]>190;pixels.data[j]=pixels.data[j+1]=pixels.data[j+2]=white?0:255;}ctx.putImageData(pixels,0,0);
   await worker.setParameters({tessedit_pageseg_mode:'7',tessedit_char_whitelist:'0123456789'});const number=await worker.recognize(badge);let digits=number.data.text.trim();
   if(!/^\d{1,3}$/.test(digits)){
    // 小尺寸或带标注截图中的数字可能更靠左；窄框没有结果时保留旧宽框识别。
    ctx.drawImage(c,c.width*.04,crop.top+height*.58,c.width*.09,height*.3,0,0,badge.width,badge.height);
    const fallback=ctx.getImageData(0,0,badge.width,badge.height);for(let j=0;j<fallback.data.length;j+=4){const white=fallback.data[j]>170&&fallback.data[j+1]>190;fallback.data[j]=fallback.data[j+1]=fallback.data[j+2]=white?0:255;}ctx.putImageData(fallback,0,0);
    digits=(await worker.recognize(badge)).data.text.trim();
   }
   if(/^\d{1,3}$/.test(digits))count=Number(digits);
 }else if(meta.found&&/假|缺\s*勤/.test(full.data.text)){result=meta;}
 counts.push(count);recognized.push(...result.names);allText.push('到课'+(count??'')+'\n'+result.names.map(n=>'2028'+n).join('\n')+'\n请假\n【原始识别文字】\n'+full.data.text);
 }
 expectedCount=counts.length===1?counts[0]:(counts.every(n=>n!==null)&&new Set(counts).size===1?counts[0]:null);
 $('ocr-text').value=allText.join('\n');$('names').value=[...new Set(recognized.map(cleanName))].join('、');applyClass(classTexts.join('\n'));updateCount();status('ocr-status',recognized.length?`识别完成：当前 ${namesFrom($('names').value).length} 人${expectedCount!==null?`，截图标记到课 ${expectedCount} 人`:''}。请核对姓名与人数。`:'没有可靠识别出姓名，请用实况文本粘贴，或手动填写到课学生。');
 income.recognize(priceRows.map(row=>({...row,name:reconcileClassRoster([row.name],$('className').value).names[0]})),classTexts.join('\n'));recognizedBaseline=namesFrom($('names').value);
 }catch(e){status('ocr-status',`识别未完成：${e.message||'图片无法读取'}。可手动填写到课名单。`);}finally{if(worker)await worker.terminate();$('screens').disabled=false;$('generate').disabled=false;}};
$('generate').onclick=()=>{try{if(!$('confirmed').checked)throw Error('请先核对并勾选到课名单。');const b=books[+$('book').value];const numbers=['一','二','三','四','五','六'];const chapters=chosen.map(i=>`第${numbers[i]}章`);const knowledge=$('specific').value.trim()||pickKnowledge(chosen.slice(0,2).map(i=>b[1][i]));$('report').value=makeReport({className:$('className').value,date:$('date').value,teacher:$('teacher').value,names:namesFrom($('names').value),chapters,mode:$('mode').value,knowledge,note:$('note').value});persist();status('form-status','报告已生成，可以编辑后复制。');if(innerWidth<760)$('report').scrollIntoView({behavior:'smooth',block:'center'});}catch(e){status('form-status',e.message)}};
const generateReport=$('generate').onclick;
$('generate').onclick=()=>{status('form-status','');if(!refreshRosterValidation()){status('form-status','班级名单中有待确认姓名，请先对照原图修正。');return;}generateReport();if($('form-status').textContent==='报告已生成，可以编辑后复制。')income.record(expectedCount);};
$('copy').onclick=async()=>{if(!$('report').value)return status('report-status','请先生成报告。');try{await navigator.clipboard.writeText($('report').value);status('report-status','已复制，可以粘贴发送。');}catch{$('report').focus();$('report').select();status('report-status','请长按选中的文字，选择复制。')}};
function renderHistory(){$('history').replaceChildren();if(!history.length){$('history').textContent='保存后的报告会出现在这里。';return;}history.forEach((h,i)=>{const row=document.createElement('div'),b=document.createElement('button'),del=document.createElement('button');b.textContent=h.title;b.onclick=()=>{$('report').value=h.text;status('report-status','已打开历史报告。')};del.textContent='删除';del.setAttribute('aria-label',`删除 ${h.title}`);del.onclick=()=>{if(confirm('删除这份历史报告？')){history.splice(i,1);try{localStorage.setItem('bio-history',JSON.stringify(history));}catch{}renderHistory()}};row.append(b,del);$('history').append(row)})}
$('save').onclick=()=>{if(!$('report').value)return status('report-status','请先生成报告。');const h={title:`${$('date').value} · ${$('className').value||'课后报告'}`,text:$('report').value};const next=[h,...history.filter(x=>x.text!==h.text)].slice(0,30);try{localStorage.setItem('bio-history',JSON.stringify(next));history=next;renderHistory();status('report-status','已保存在本机，最多保留30份。')}catch{status('report-status','本机存储不可用，请复制报告保存。')}};renderHistory();$('install').onclick=()=>$('help').showModal();$('close-help').onclick=()=>$('help').close();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(reg=>reg.update()).catch(()=>{});
