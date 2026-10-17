const knownNameCorrections={'王祉茂':'王祎茁','王视茂':'王祎茁','王祯茂':'王祎茁','王祎茂':'王祎茁','王祎卓':'王祎茁'};
export function cleanName(s){const name=s.trim().replace(/^2028\s*/, '').replace(/\d+$/, '').trim();return knownNameCorrections[name]||name;}
export const classNames=['李京洋班','赵泳贺班','李明哲班','杨清惠班'];
export function matchClass(attendees,rosterText){
 const present=new Set(attendees.map(cleanName));
 const arrived=classNames.filter(c=>present.has(c.slice(0,-1)));
 if(arrived.length)return {candidates:arrived,source:'到课名单'};
 const normalized=rosterText.replace(/(?<=[\u4e00-\u9fff]) +(?=[\u4e00-\u9fff])/g,'');
 const leaveStart=normalized.search(/请\s*假|假/);
 const leave=leaveStart<0?'':normalized.slice(leaveStart).split(/缺\s*勤/)[0];
 const names=new Set([...leave.matchAll(/2028\s*([\u4e00-\u9fff·]{2,8})\d*/g)].map(m=>m[1]));
 return {candidates:classNames.filter(c=>names.has(c.slice(0,-1))),source:'请假名单'};
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
 const names=[...area.matchAll(/2028\s*([\u4e00-\u9fff·]{2,8})\d*/g)].map(m=>m[1]);
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
 if(!className.trim()||!date||!names.length||!chapters.length)throw Error('请填写班级、日期、到课学生，并选择章节。');
 const [,month,day]=date.split('-');
 const content=chapters.join('、');
 const praise=randomPraise(names.length>5);
 const intro=`${names.join('、')}${names.length}名同学本节课${mode}了${content}的相关内容。`;
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
