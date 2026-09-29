export const stages = [
  {id:'background',title:'Identity & background',assesses:'Professional background, relevant experience and references. Our team confirms identity and agreement details separately.',questions:[{id:'experience',label:'Describe your real estate background, responsibilities and completed transactions.'},{id:'references',label:'Give a professional reference or explain how the office can verify your experience. Do not enter identity-document numbers.'}]},
  {id:'expertise',title:'Off-plan expertise',assesses:'Your understanding of project information, payment plans, delivery risk and buyer due diligence.',questions:[{id:'dueDiligence',label:'Before presenting an off-plan development, what documents and commercial facts would you verify, and with whom?'},{id:'risk',label:'A buyer asks you to guarantee completion dates and investment returns. How do you respond?'}]},
  {id:'service',title:'Service & discretion',assesses:'Confidentiality, clear communication and attentive client service.',questions:[{id:'discretion',label:'How would you protect a client’s identity, financial information and viewing arrangements?'},{id:'service',label:'Describe how you prepare for a private client appointment and follow up afterwards.'}]},
  {id:'judgment',title:'Professional judgment',assesses:'Sound professional judgment, conflict disclosure and knowing when to involve the team.',questions:[{id:'scenario',label:'A developer requests a deposit before supplying the promised documentation. The client wants to proceed immediately. What do you do?'},{id:'conflict',label:'You discover a commission incentive that could affect your recommendation. How do you handle it?'}]},
  {id:'territory',title:'Territory & availability',assesses:'Practical assignment fit. Availability and territory help with assignment fit; they do not define professional ability.',questions:[{id:'territory',label:'Which locations, markets and languages can you confidently support?'},{id:'availability',label:'Describe your availability, travel constraints and preferred appointment notice.'}]},
] as const;
export const profileKeys=['preferredName','phone','base','languages'] as const;
export const answerKeys=stages.flatMap(s=>s.questions.map(q=>q.id));
export type ScreeningData={profile:Record<string,string>;answers:Record<string,string>;acknowledged:boolean};
export const emptyScreening:ScreeningData={profile:{},answers:{},acknowledged:false};
export const rubric=[{id:'expertise',label:'Off-plan knowledge'},{id:'service',label:'Client service & discretion'},{id:'judgment',label:'Professional judgment'}] as const;
export type Rating=0|1|2|3;
export const ratingLabels=['Not yet clear','Developing — benefits from support','Practitioner — ready for independent work','Specialist — strong demonstrated depth'];
export function completeness(data:ScreeningData){return [...profileKeys.map(k=>data.profile[k]),...answerKeys.map(k=>data.answers[k])].filter(v=>typeof v==='string'&&v.trim().length>0).length+(data.acknowledged?1:0)}
export const requiredCount=profileKeys.length+answerKeys.length+1;
export function classification(scores:Record<string,number>){const values=rubric.map(r=>scores[r.id]??0);return values.some(v=>v===0)?'More information needed':values.every(v=>v===3)?'Specialist':values.every(v=>v>=2)?'Practitioner':'Developing'}
