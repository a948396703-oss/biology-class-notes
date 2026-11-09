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
 学习:['这一节主要学的是{章}。','本节课把{章}的内容过了一遍。','这节课的主题是{章}。','今天把学习重点放在了{章}。'],
 预习:['这一节先预习了{章}。','今天先看了{章}的基本内容。','这节课先从{章}入手。','今天的安排是提前熟悉{章}。'],
 复习:['这一节回顾了{章}。','今天把{章}的重点重新捋了一遍。','这节课的任务是复习{章}。','今天主要在巩固{章}。'],
 练习:['这一节做了{章}的相关练习。','今天围绕{章}做了练习。','这节课把{章}放到题目里练了一遍。','今天的练习集中在{章}。']
};
const groupLead=['{名}这{数}名同学，','{名}共{数}名同学，','{名}这组一共{数}名同学，'];
const secondLead=['再说{名}这{数}名同学。','另一组是{名}，共{数}名同学。','也说说{名}这{数}名同学的表现。','接着看{名}这组，一共{数}名同学。'];
const praiseLines=['课堂上{点}。','课堂表现里，比较好的是{点}。','有个表现挺好：{点}。','课堂上的表现值得肯定，{点}。','说到课堂表现，{点}。','课上的表现有亮点：{点}。','这节课比较值得一提的是，{点}。','课堂上能看出来，{点}。'];
const endings={
 common:[
  '回去花两分钟用自己的话讲一遍。讲着讲着停住的地方，就是最该回看的地方。',
  '不用把整页都重抄一遍，挑一两个还说不清的地方弄明白就行。',
  '今天先记住这条思路。下次碰到类似的题，先想它在问哪个环节。',
  '复习时不妨先把书合上：能顺着讲下来，比看着眼熟更管用。',
  '课后先挑一个最容易混的点，写下它和另一个概念到底差在哪。',
  '如果题目一换说法就卡住，先回到课本找对应的概念，别急着背答案。',
  '看到图时先别急着往下做，指一指每条线、每个箭头分别代表什么。',
  '哪儿还有点绕，就在笔记旁边打个问号；下次我们先从那儿说起。',
  '记关键词就好，别一开始就追着标准答案背。能把前因后果说顺，更重要。',
  '做题前先停一下：题目给了什么，又让你说什么？这一步想明白了，再往下写。',
  '有空找一道同类型题试试，不看笔记做一遍，就知道哪一步还不稳。',
  '先把最容易写反的那一步圈出来。下次再遇到，提醒自己多看一眼。',
  '回头看笔记时，试着给今天的内容取个小标题，看看能不能一句话抓住重点。',
  '复习不必从第一页翻起。挑一道题倒着找：它用到的知识点在哪儿？',
  '写完答案后多问自己一句：“题干里哪条信息能支持我这么写？”',
  '今天的内容分开记反而容易乱。先抓住一条主线，再把细节往上放。'
 ],
 学习:[
  '新知识不用一口气记全，先把几个概念摆在一起，看看它们是怎么接上的。',
  '可以给今天最难懂的概念配个简单例子。例子举得出来，这个词就没那么抽象了。',
  '如果只记得结论，回头补问一个“为什么”，把中间那一步也想清楚。',
  '下次翻开这页，先试着复述一遍，再看看漏的是条件、过程，还是结果。'
 ],
 预习:[
  '预习不用把每句话背下来。先认得几个关键词，再带着一个问题来上课就够了。',
  '读到没看懂的地方先别耗太久，圈出来，等下次把前后两步接上。',
  '先看小标题和图，猜一猜这节要解决什么问题。等正式学的时候，再来对照。',
  '预习到能说清“我大概看懂了哪部分，哪部分还没懂”，就已经有收获了。'
 ],
 复习:[
  '先别顺着答案看，把错题遮住重想一次。想法还跟原来一样，就找到该补的地方了。',
  '错题不必全抄，把“当时漏看了哪个条件”写在题边，比只抄正确选项更有用。',
  '复习的时候把两个容易混的说法放一块儿对照，别分开背，免得见了题还是认错。',
  '再回顾这章时，可以先写个小提纲。哪个标题底下写不出内容，就先补哪一块。'
 ],
 练习:[
  '订正时别只改选项，顺手给自己写一句：这道题的坑藏在哪儿？',
  '如果是步骤题，先把推理顺序写下来，不急着套完整答案。',
  '题量先不用加。找一道做错的，换个条件再想想，看看答案是不是也要变。',
  '题干长就分段看，把能用的信息划出来。找到关键条件后再动笔，省得返工。'
 ]
};
const endingPool=Object.entries(endings).flatMap(([kind,lines])=>lines.map(text=>({kind,text})));
const fill=(text,names)=>text.replace('{名}',names.join('、')).replace('{数}',names.length);
export function composeFeedback({names,content,mode,knowledge,note,praisePool},pick){
 const grouped=names.length>5, split=Math.ceil(names.length/2);
 const groups=grouped?[names.slice(0,split),names.slice(split)]:[names];
 const [opening]=pick('opening:'+mode,openings[mode]||openings.学习);
 const firstCount=pick('praise-count',[1,2])[0];
 const points=pick('praise-points',praisePool,grouped?3:firstCount);
 const forms=pick('praise-form',praiseLines,groups.length);
 const praise=(i,items)=>forms[i].replace('{点}',items.join('，'));
 const start=opening.replace('{章}',content);
 const first=groups[0].length===1?start:fill(pick('group-lead',groupLead)[0],groups[0])+start;
 const paragraphs=[[first,praise(0,points.slice(0,firstCount)),knowledge].filter(Boolean).join('')];
 if(grouped)paragraphs.push(fill(pick('second-lead',secondLead)[0],groups[1])+praise(1,points.slice(firstCount)));
 if(note.trim())paragraphs.push(note.trim());
 paragraphs.push(pick('ending',endingPool,1,entry=>entry.kind==='common'||entry.kind===mode)[0].text);
 return paragraphs.join('\n\n');
}
