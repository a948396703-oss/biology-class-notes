// 同一浏览器的各班共享选句记录；仅记自动句库编号，不记录学生信息。
const KEY='bio-feedback-rotation-v1';
export function createFeedbackPicker(storage,random=Math.random){
 let recent={};
 try{const data=JSON.parse(storage?.getItem(KEY)||'{}');if(data&&typeof data==='object'&&!Array.isArray(data))recent=data;}catch{}
 function pick(scope,pool,count=1,eligible=()=>true){
  const all=pool.map((_,i)=>i),ids=all.filter(i=>eligible(pool[i]));
  const used=Object.hasOwn(recent,scope)&&Array.isArray(recent[scope])?[...new Set(recent[scope].filter(i=>all.includes(i)))]:[];
  const result=[];
  while(ids.length&&result.length<count){
   const fresh=ids.filter(i=>!used.includes(i));
   const id=fresh.length?fresh[Math.floor(random()*fresh.length)]:used.find(i=>ids.includes(i));
   ids.splice(ids.indexOf(id),1);
   if(used.includes(id))used.splice(used.indexOf(id),1);
   used.push(id);
   result.push(pool[id]);
  }
  recent[scope]=used;
  return result;
 }
 return {pick,save(){try{storage?.setItem(KEY,JSON.stringify(recent));}catch{}}};
}

const openings={
 学习:['{人}本节课学习了{章}。','{人}本节课主要学习{章}的内容。','{人}本节课围绕{章}展开学习。'],
 预习:['{人}本节课预习了{章}。','{人}本节课初步了解了{章}的内容。','{人}本节课先熟悉了{章}的基本概念。'],
 复习:['{人}本节课回顾了{章}的重点。','{人}本节课复习了{章}。','{人}本节课重新梳理了{章}的内容。'],
 练习:['{人}本节课做了{章}的相关练习。','{人}本节课围绕{章}做了练习。','{人}本节课练习了{章}的相关题目。']
};
// 按课型筛选，预习不评价做题或订正；轮换仍以原池的稳定序号为准。
const practicePraise=new Set([9,10,11,12,13,14]);
const previewExcluded=new Set([...practicePraise,15]);
const canPraise=(mode,index)=>mode==='预习'?!previewExcluded.has(index):mode==='学习'?!practicePraise.has(index):true;
export const summaryLeads=[
 '这一章里，',
 '本章可以留意这样一个细节：',
 '具体到本章的内容，',
 '梳理本章时，有一点值得留意：',
 '这部分还有一个值得关注的知识点：'
];
const neutralLead=lead=>lead==='这一章里，'||lead.startsWith('梳理本章');
function addSummaryLead(summary,pick){
 // 部分小结已有章内承接，避免“这一章里……这一章”或重复提示难点。
 if(/^(?:这一章|本章|这部分)|^[^。！？]{0,20}这一章/.test(summary))return summary;
 const neutral=/难点|容易混|容易写反|不容易|关键|值得|小关口|小难关/.test(summary.split('。',1)[0]);
 return pick('summary-lead-v2',summaryLeads,1,lead=>!neutral||neutralLead(lead))[0]+summary;
}
const groupLabel=names=>names.join('、')+'这'+names.length+'名同学';
export function composeFeedback({names,content,mode,knowledge,note,summary,praisePool},pick){
 const grouped=names.length>5, split=Math.ceil(names.length/2);
 const groups=grouped?[names.slice(0,split),names.slice(split)]:[names];
 const [opening]=pick('opening:'+mode,openings[mode]||openings.学习);
 const firstCount=pick('praise-count',[1,2])[0];
 const points=pick('praise-points-v2',praisePool,grouped?3:firstCount,point=>canPraise(mode,praisePool.indexOf(point)));
 const first=opening.replace('{人}',names.length===1?'':groupLabel(groups[0])).replace('{章}',content);
 const paragraphs=[first.slice(0,-1)+'，'+points.slice(0,firstCount).join('，')+'。'];
 if(grouped)paragraphs.push(groupLabel(groups[1])+points.slice(firstCount).join('，')+'。');
 if(knowledge?.trim())paragraphs.push('本节重点：'+knowledge.trim());
 if(note.trim())paragraphs.push(note.trim());
 if(summary)paragraphs.push(addSummaryLead(summary,pick));
 return paragraphs.join('\n\n');
}
