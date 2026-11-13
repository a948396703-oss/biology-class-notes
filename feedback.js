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
const praiseLines=['课堂上{点}。','课堂表现方面，{点}。','{点}。','学习过程中，{点}。'];
// 手填课堂内容时，不另猜本节实际讲了哪些小知识点。
const endings=[
 '这个阶段先把主要概念分清就够了。等相似题型多见几次，概念之间的关系也会更熟悉。',
 '这部分真正需要一点时间的，是把会背的定义用到不同材料里。刚开始做得慢一点很正常。',
 '目前更重要的是把思路走完整，暂时不必太看重速度。等判断的依据稳定下来，做题自然会更顺。',
 '这一部分看懂课本和独立分析材料之间有个过渡。多见几种问法以后，通常就更容易认出考的是哪一步。',
 '这类内容开始学时容易觉得细节多，先把几条关键关系理顺，后面复习就不必每次从头记。',
 '能把结论和理由分开说清，是这部分很重要的一步。基础比较稳了，遇到新题也更有把握。',
 '现在的难度主要在条件一变，原来的判断方法还能不能用。这个能力往往是在几次对照练习中慢慢形成的。',
 '有些地方初学时看着相近，做到具体题里差别才明显。把几个常见例子放在一起，理解会逐渐清楚。',
 '这一部分的内容前后联系比较紧。等主要环节连起来，原来零散的知识点就更容易记住。',
 '遇到新材料时能抓到关键信息，比一开始把答案写得很完整更重要。这一点通常会随着练习慢慢改善。',
 '这节内容不必一下子掌握得很细。能先区分主要概念，后面的例题就有地方落脚。',
 '这部分从认识概念到熟练应用需要一个过程。几种常见情形分清以后，再碰到变化也更容易处理。'
];
// 单独轮换导语，保持小结的原文和跨班去重记录不变。
export const summaryLeads=[
 '这一章里，',
 '从本章的内容来看，',
 '这部分有个值得留意的地方：',
 '梳理这一章时，有一点比较关键：',
 '本章有个细节值得单独理一理：'
];
const groupLabel=names=>names.join('、')+'这'+names.length+'名同学';
export function composeFeedback({names,content,mode,knowledge,note,summary,praisePool},pick){
 const grouped=names.length>5, split=Math.ceil(names.length/2);
 const groups=grouped?[names.slice(0,split),names.slice(split)]:[names];
 const [opening]=pick('opening:'+mode,openings[mode]||openings.学习);
 const firstCount=pick('praise-count',[1,2])[0];
 const points=pick('praise-points',praisePool,grouped?3:firstCount);
 const first=opening.replace('{人}',names.length===1?'':groupLabel(groups[0])).replace('{章}',content);
 const [praiseForm]=pick('praise-form-v2',praiseLines);
 const paragraphs=[first+praiseForm.replace('{点}',points.slice(0,firstCount).join('，'))];
 if(grouped)paragraphs.push(groupLabel(groups[1])+points.slice(firstCount).join('，')+'。');
 if(knowledge?.trim())paragraphs.push('本节重点：'+knowledge.trim());
 if(note.trim())paragraphs.push(note.trim());
 paragraphs.push(summary?pick('summary-lead-v1',summaryLeads)[0]+summary:pick('manual-summary',endings)[0]);
 return paragraphs.join('\n\n');
}
