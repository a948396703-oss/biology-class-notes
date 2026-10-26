const knownNameCorrections={'王祉茂':'王祎茁','王视茂':'王祎茁','王祯茂':'王祎茁','王祎茂':'王祎茁','王祎卓':'王祎茁','李泽鉴':'李泽崟','李泽金':'李泽崟','李泽银':'李泽崟','李泽烨':'李泽崟','李玖':'李玟','褚泊妃':'褚泊妤','褚泗妤':'褚泊妤'};
let rememberedNames={};
knownNameCorrections['孙个盛']='孙偲盛';
Object.assign(knownNameCorrections,{'孙借盛':'孙偲盛','吕晚硕':'吕晨硕','刘纯瑗':'刘纯瑞'});
try{const saved=JSON.parse(localStorage.getItem('bio-name-corrections')||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))rememberedNames=saved;}catch{}
export function isConfirmedName(name){return Object.values(knownNameCorrections).includes(name)||Object.values(classRosters).some(roster=>roster.includes(name));}
export function cleanName(s){
 const name=s.trim().replace(/^20\d{2}\s*/, '').replace(/\d+$/, '').trim();
 // 已核准的名单和纠错优先；旧本机记忆不能反向改坏正确姓名。
 let current=name;const seen=new Set();
 for(let i=0;i<32;i++){
  if(knownNameCorrections[current])return knownNameCorrections[current];
  if(isConfirmedName(current))return current;
  if(seen.has(current))return name;
  seen.add(current);const remembered=rememberedNames[current];
  if(typeof remembered!=='string'||!/^[\u4e00-\u9fff]{2,8}$/.test(remembered))return current;
  current=remembered;
 }
 return name;
}
export function confirmedNameChange(before,after){
 if(before.length!==after.length||new Set(before).size!==before.length||new Set(after).size!==after.length)return null;
 const changed=before.map((name,i)=>name===after[i]?null:[name,after[i]]).filter(Boolean);
 if(changed.length!==1)return null;
 const [from,to]=changed[0];
 if(!/^[\u4e00-\u9fff]{2,8}$/.test(from)||!/^[\u4e00-\u9fff]{2,8}$/.test(to)||from.length!==to.length||from[0]!==to[0])return null;
 return [...from].filter((c,i)=>c!==to[i]).length===1?[from,to]:null;
}
export function rememberNameCorrection(from,to){
 if(!confirmedNameChange([from],[to])||isConfirmedName(from)||knownNameCorrections[from])return false;
 const next={...rememberedNames,[from]:to};localStorage.setItem('bio-name-corrections',JSON.stringify(next));rememberedNames=next;return true;
}
export function forgetNameCorrection(from){const next={...rememberedNames};delete next[from];localStorage.setItem('bio-name-corrections',JSON.stringify(next));rememberedNames=next;}
export const classNames=['李京洋班','赵泳贺班','李明哲班','杨清惠班','杨棣班'];
export const classRosters={'杨棣班':['孙偲盛','姚婷岚','杨棣','吕晨硕','刘纯瑞']};
export function reconcileClassRoster(names,className,roster=classRosters[className]){
 const normalized=names.map(cleanName),corrections=[];
 if(!roster)return {names:normalized,corrections,unknown:[]};
 const used=new Set(normalized.filter(name=>roster.includes(name)));
 const resolved=normalized.map(name=>{
  if(roster.includes(name))return name;
  const candidates=roster.filter(candidate=>!used.has(candidate)&&candidate.length===name.length&&candidate[0]===name[0]&&[...candidate].filter((c,i)=>c!==name[i]).length===1);
  if(candidates.length!==1)return name;
  const to=candidates[0];used.add(to);corrections.push({from:name,to});return to;
 });
 return {names:resolved,corrections,unknown:resolved.filter(name=>!roster.includes(name))};
}
export function validateClassRoster(names,className){
 const roster=names.length>1?classRosters[className]:null;
 return {hasRoster:Boolean(roster),unknown:roster?[...new Set(names.map(cleanName).filter(name=>!roster.includes(name)))]:[]};
}
export function matchClass(attendees,rosterText){
 const present=new Set(attendees.map(cleanName));
 const arrived=classNames.filter(c=>present.has(c.slice(0,-1)));
 if(arrived.length)return {candidates:arrived,source:'到课名单'};
 const normalized=rosterText.replace(/(?<=[\u4e00-\u9fff]) +(?=[\u4e00-\u9fff])/g,'');
 const leaveStart=normalized.search(/请\s*假|假/);
 const leave=leaveStart<0?'':normalized.slice(leaveStart).split(/缺\s*勤/)[0];
 const names=new Set([...leave.matchAll(/20\d{2}\s*([\u4e00-\u9fff·]{2,8})\d*/g)].map(m=>m[1]));
 const absent=classNames.filter(c=>names.has(c.slice(0,-1)));
 if(absent.length)return {candidates:absent,source:'请假名单'};
 // OCR可能漏掉竖排“请假”二字，但页头班级标题仍保留班主任名。
 const dateStart=normalized.search(/20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}/);
 const header=dateStart<0?'':normalized.slice(0,dateStart);
 const titled=classNames.filter(c=>header.includes(c.slice(0,-1)));
 if(titled.length)return {candidates:titled,source:'截图班级标题'};
 const rosterMatches=Object.entries(classRosters).filter(([,roster])=>present.size>=2&&[...present].every(name=>roster.includes(name))).map(([name])=>name);
 return {candidates:rosterMatches,source:'已确认班级名单'};
}
export function namesFrom(s){return [...new Set(s.split(/[\s,，、;；]+/).map(cleanName).filter(Boolean))];}
export function positionedNames(blocks,top,bottom){
 const lines=(blocks||[]).flatMap(b=>(b.paragraphs||[]).flatMap(p=>p.lines||[]))
  .filter(l=>l.bbox.y0>=top&&l.bbox.y1<=bottom)
  .sort((a,b)=>Math.abs(a.bbox.y0-b.bbox.y0)<15?a.bbox.x0-b.bbox.x0:a.bbox.y0-b.bbox.y0);
 return parseAttendance('到课\n'+lines.map(l=>l.text).join('\n')).names;
}
export function countWarning(expected,actual){return expected!==null&&expected!==actual?`人数不一致：截图到课 ${expected} 人，当前名单 ${actual} 人。请对照截图补齐或修改后再确认。`:'';}
export function parseAttendance(text){
 text=text.replace(/(?<=[\u4e00-\u9fff]) +(?=[\u4e00-\u9fff])/g,'');
 const date=text.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
 const start=text.search(/到\s*课/); const tail=start<0?'':text.slice(start);
 const stop=tail.search(/请\s*假|假|缺\s*勤/);const area=stop<0?tail:tail.slice(0,stop);
 const count=area.match(/到\s*课\s*(\d+)/);
 const names=[...area.matchAll(/20\d{2}\s*([\u4e00-\u9fff·]{2,8})\d*/g)].map(m=>m[1]);
 return {names:[...new Set(names)],count:count?Number(count[1]):null,date:date?`${date[1]}-${date[2].padStart(2,'0')}-${date[3].padStart(2,'0')}`:'',found:start>=0};
}
export const praisePool=['听课比较专注','参与课堂交流的态度积极','思考问题比较主动','学习态度认真踏实','梳理知识的思路比较清晰','面对新知识愿意尝试','学习过程中有耐心','对知识之间的联系比较留心'];
export const homeworkOptions=['复习错题','背笔记','做习题'];
export function randomHomework(random=Math.random){return homeworkOptions[Math.floor(random()*homeworkOptions.length)];}
export function randomPraise(grouped,random=Math.random){
 const pool=[...praisePool];
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 const first=random()<.5?1:2;
 return grouped?[pool.slice(0,first),pool.slice(first,3)]:[pool.slice(0,first)];
}
export function makeReport({className,date,teacher,names,chapters,homework,mode,knowledge,note}){
 if((names.length>1&&!className.trim())||!date||!names.length||!chapters.length)throw Error('请填写班级、日期、到课学生，并选择章节。');
 if(validateClassRoster(names,className).unknown.length)throw Error('班级名单中有待确认姓名，请先对照原图修正。');
 const [,month,day]=date.split('-');
 const content=chapters.join('、');
 const praise=randomPraise(names.length>5);
 const intro=names.length===1?`本节课围绕${content}进行了${mode}，学习了相关内容。`:`${names.join('、')}${names.length}名同学本节课${mode}了${content}的相关内容。`;
 let feedback;
 if(names.length<=5){
  feedback=[intro,`课堂上${praise[0].join('，')}，值得表扬。`,knowledge,note.trim(), '课后结合今天的作业再巩固一下，继续加油！'].filter(Boolean).join('');
 }else{
  const middle=Math.ceil(names.length/2),first=names.slice(0,middle),second=names.slice(middle);
  const paragraph1=[`${first.join('、')}这${first.length}名同学本节课${mode}了${content}的相关内容。`,`课堂上${praise[0].join('，')}，值得表扬。`,knowledge,'课后结合今天的作业再巩固一下，继续加油！'].filter(Boolean).join('');
  const paragraph2=[`${second.join('、')}这${second.length}名同学本节课也围绕${content}进行了${mode}。`,`这几名同学${praise[1].join('，')}，这些表现值得肯定。`,'课后可以把本节课的知识点再梳理一遍，做题时注意看清题目要求，把思路理顺，继续努力！'].filter(Boolean).join('');
  feedback=paragraph1+'\n\n'+paragraph2+(note.trim()?'\n补充反馈：'+note.trim():'');
 }
 const displayClass=names.length===1?names[0]:className.trim();
 return `◆学生：${displayClass}\n◆时间：${Number(month)}.${Number(day)}\n◆科目：生物\n◆教师：${teacher.trim()}\n◆内容：${content}\n———————\n📝今天作业：${randomHomework()}\n———————\n◆课堂反馈：\n${feedback}`;
}
