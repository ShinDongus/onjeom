/** 온점. v0.1 — pure domain logic; no network, no medical claims */
export const GROWTH_STEPS = 4;
export const FLOWERS = [
  {id:'daisy',name:'데이지',emoji:'🌼',color:'#EBDDB6',quote:'작은 시작도 당신의 하루를 바꿔요.'},
  {id:'tulip',name:'튤립',emoji:'🌷',color:'#EDBBAA',quote:'마음의 속도에 맞춰 피어나도 괜찮아요.'},
  {id:'rose',name:'장미',emoji:'🌹',color:'#C97E82',quote:'오늘의 용기를 오래 기억할게요.'},
  {id:'cosmos',name:'코스모스',emoji:'🌸',color:'#D5ABBB',quote:'흔들리면서도 앞으로 나아갔어요.'},
  {id:'hydrangea',name:'수국',emoji:'🪻',color:'#A8B9D7',quote:'흩어진 마음도 천천히 모양을 찾아요.'},
  {id:'camellia',name:'동백',emoji:'🌺',color:'#DB8A85',quote:'차가운 날에도 온기는 남아 있어요.'},
  {id:'lavender',name:'라벤더',emoji:'🪻',color:'#A99AC5',quote:'조금 느려도 오늘은 충분해요.'},
  {id:'sunflower',name:'해바라기',emoji:'🌻',color:'#E6C572',quote:'빛을 향한 작은 선택이 쌓여요.'},
  {id:'narcissus',name:'수선화',emoji:'🌼',color:'#ECD48A',quote:'다시 시작하는 순간이 봄이에요.'},
  {id:'babybreath',name:'안개꽃',emoji:'💮',color:'#D6D9D3',quote:'작은 것들이 모여 하나의 풍경이 돼요.'},
  {id:'plum',name:'매화',emoji:'🌸',color:'#CFA4AA',quote:'아직 이른 계절에도 꽃은 필 수 있어요.'},
  {id:'peony',name:'작약',emoji:'🌺',color:'#D59BAA',quote:'오늘의 걸음을 다정하게 간직할게요.'}
];
export const SEASONS = [
  {id:'christmas',name:'겨울의 선물',monthDays:[[12,18],[12,26]],flower:{id:'poinsettia',name:'겨울별 포인세티아',emoji:'🌺',color:'#AF4A52',quote:'추운 계절에도 작은 빛이 머물러요.'}},
  {id:'halloween',name:'가을밤의 인사',monthDays:[[10,24],[11,1]],flower:{id:'moonrose',name:'달그림자 장미',emoji:'🥀',color:'#6D5676',quote:'낯선 밤에도 당신의 걸음은 선명해요.'}},
  {id:'newyear',name:'새해 첫걸음',monthDays:[[12,30],[1,3]],flower:{id:'firstlight',name:'첫빛 수선화',emoji:'🌼',color:'#EDC67F',quote:'새로운 날은 언제나 작은 시작에서 와요.'}}
  // 추석은 음력 기반 이동 명절이므로 서버/운영 캘린더에서 매년 날짜를 명시적으로 공급해야 함.
];
export const RARE_VARIANTS=[{id:'moon',name:'달빛',color:'#B8C3DE'},{id:'aurora',name:'오로라',color:'#91C6B4'},{id:'gold',name:'금빛',color:'#DDBF71'}];
const uid=()=>`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
export const todayLocal=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export function createInitialState(){return {version:1,thoughts:[],tasks:[],flowers:[],progress:0,completedTotal:0,premiumDemo:false};}
export function splitThought(input){
  if(typeof input!=='string') return [];
  let s=input.replace(/\r/g,'').trim();
  if(!s) return [];
  s=s.replace(/(해야\s*하고|야\s*하고|해야\s*되고|하고\s*나서|그다음에|그리고|그 다음|또한|\n|[.!?;,])/g,'\n');
  let parts=s.split('\n').map(x=>x.trim().replace(/^(그리고|또|우선|일단)\s*/,'').replace(/(해야\s*해|해야\s*함|해야\s*돼|해야\s*한다)$/,'').trim()).filter(Boolean);
  if(parts.length===1 && s.length>100) parts=s.match(/.{1,55}(?:\s|$)/g)?.map(x=>x.trim())||parts;
  return [...new Set(parts)].slice(0,20);
}
export function addThought(state,input){
 const fragments=splitThought(input);if(!fragments.length) return state;
 const thoughtId=uid(); const nextOrder=Math.max(-1,...state.tasks.map(x=>x.order??0))+1;
 const tasks=fragments.map((title,i)=>({id:uid(),thoughtId,title,createdAt:new Date().toISOString(),status:'active',order:nextOrder+i}));
 return {...state,thoughts:[...state.thoughts,{id:thoughtId,original:input,createdAt:new Date().toISOString()}],tasks:[...state.tasks,...tasks]};
}
export function activeTask(state){return [...state.tasks].filter(t=>t.status==='active').sort((a,b)=>a.order-b.order)[0]||null;}
export function finishTask(state,taskId,random=Math.random,date=new Date()){
 const task=state.tasks.find(t=>t.id===taskId);
 if(!task||task.status!=='active') return state;
 const updated=state.tasks.map(t=>t.id===taskId?{...t,status:'done',finishedAt:date.toISOString()}:t);
 const total=state.completedTotal+1;
 const progress=state.progress+1;
 if(progress<GROWTH_STEPS) return {...state,tasks:updated,completedTotal:total,progress};
 const flower=createBloom(random,date,task.title);
 return {...state,tasks:updated,completedTotal:total,progress:0,flowers:[flower,...state.flowers]};
}
export function postponeTask(state,taskId){return {...state,tasks:state.tasks.map(t=>t.id===taskId&&t.status==='active'?{...t,status:'postponed'}:t)};}
export function restoreTask(state,taskId){return {...state,tasks:state.tasks.map(t=>t.id===taskId&&t.status==='postponed'?{...t,status:'active',order:Math.max(...state.tasks.map(x=>x.order??0),0)+1}:t)};}
export function deleteTask(state,taskId){return {...state,tasks:state.tasks.filter(t=>t.id!==taskId)};}
export function addSmallStep(state,taskId,smallStep){
 const task=state.tasks.find(t=>t.id===taskId);if(!task||!smallStep.trim()) return state;
 return {...state,tasks:state.tasks.map(t=>t.id===taskId?{...t,title:smallStep.trim(),originalTitle:t.originalTitle||t.title}:t)};
}
export function getActiveSeason(date){
 const m=date.getMonth()+1,d=date.getDate(),n=m*100+d;
 return SEASONS.find(s=>{let a=s.monthDays[0][0]*100+s.monthDays[0][1],b=s.monthDays[1][0]*100+s.monthDays[1][1];return a<=b?(n>=a&&n<=b):(n>=a||n<=b);})||null;
}
export function createBloom(random=Math.random,date=new Date(),taskTitle=''){
 const season=getActiveSeason(date);
 const seasonFlower=season&&random()<0.24 ? season.flower : null;
 const base=seasonFlower||FLOWERS[Math.floor(random()*FLOWERS.length)];
 const rate=random();
 const rare=rate<0.005?RARE_VARIANTS[2]:rate<0.035?RARE_VARIANTS[Math.floor(random()*2)]:null;
 return {id:uid(),speciesId:base.id,name:base.name,emoji:base.emoji,baseColor:base.color,quote:base.quote,variantId:rare?.id||'normal',variantName:rare?.name||'기본',color:rare?.color||base.color,seasonId:seasonFlower?season.id:null,createdAt:date.toISOString(),originTask:taskTitle,registeredAt:null};
}
export function flowerKey(f){return `${f.speciesId}:${f.variantId}`;}
export function isNewEntry(state,flower){return !state.flowers.some(f=>f.registeredAt&&flowerKey(f)===flowerKey(flower));}
export function registerFlower(state,flowerId,{rewardVerified=false}={}){
 const f=state.flowers.find(f=>f.id===flowerId);if(!f||f.registeredAt) return state;
 if(isNewEntry(state,f)&&!state.premiumDemo&&!rewardVerified) return state;
 return {...state,flowers:state.flowers.map(x=>x.id===flowerId?{...x,registeredAt:new Date().toISOString()}:x)};
}
export function getCatalog(state){const byKey=new Map(); for(const flower of state.flowers){if(flower.registeredAt&&!byKey.has(flowerKey(flower))) byKey.set(flowerKey(flower),flower);}return [...byKey.values()];}
export function validateState(obj){return obj&&obj.version===1&&Array.isArray(obj.tasks)&&Array.isArray(obj.flowers)&&typeof obj.progress==='number';}
