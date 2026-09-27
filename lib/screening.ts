export const SCREENING_VERSION='2026-09-27.v1';

export type ScreeningDimension='off_plan'|'client_advisory'|'deal_execution'|'international'|'compliance'|'operating_discipline';
export type ScreeningChoice={id:string;label:string;points:number};
export type ScreeningQuestion={id:string;stage:'property'|'judgment'|'operations';dimension:ScreeningDimension;prompt:string;choices:ScreeningChoice[]};

const scale=(labels:[string,string,string,string]):ScreeningChoice[]=>labels.map((label,points)=>({id:String(points),label,points}));

export const SCREENING_QUESTIONS:ScreeningQuestion[]=[
  {id:'offplan_value',stage:'property',dimension:'off_plan',prompt:'A buyer asks why they should consider an off-plan property rather than a completed unit. What is your first move?',choices:scale([
    'Lead with urgency and expected price growth.',
    'List project amenities and ask whether they like the design.',
    'Clarify the buyer’s objective and compare delivery risk, payment structure, product fit and alternatives.',
    'Start with objectives, then evidence-test developer, delivery, contract, payment, exit and suitability before discussing upside.'
  ])},
  {id:'offplan_terms',stage:'property',dimension:'off_plan',prompt:'A payment plan has changed since the last brochure. How do you present it?',choices:scale([
    'Use the brochure because it is what the client first saw.',
    'Present the old plan but warn it may have changed.',
    'Confirm the latest terms with the office/developer before quoting them.',
    'Confirm current terms from an authoritative source, date the confirmation, explain what changed and avoid carrying forward stale figures.'
  ])},
  {id:'discovery',stage:'property',dimension:'client_advisory',prompt:'A high-net-worth client asks for “the best villa”. What do you do first?',choices:scale([
    'Show the most expensive option.',
    'Show three popular options and let them choose.',
    'Ask about budget, use, time horizon and location preferences.',
    'Build a decision frame covering use case, capital constraints, residency/tax context where relevant, privacy, horizon, risk tolerance and decision process before narrowing options.'
  ])},
  {id:'objection',stage:'property',dimension:'client_advisory',prompt:'A client says the project feels overpriced compared with another development.',choices:scale([
    'Defend the price and explain that luxury always costs more.',
    'Offer a discount or incentive immediately.',
    'Ask what comparison they are using and explain material differences.',
    'Reconstruct the comparison on like-for-like terms, surface missing assumptions, separate facts from positioning and only then discuss value or alternatives.'
  ])},
  {id:'execution',stage:'property',dimension:'deal_execution',prompt:'A qualified buyer verbally agrees to proceed after a viewing. What should happen next?',choices:scale([
    'Wait for the buyer to come back with documents.',
    'Send a thank-you message and ask if they need anything.',
    'Confirm next steps, documents, commercial terms and a follow-up time.',
    'Create a written action path: decision owner, reservation/EOI requirement, KYC/documents, verified commercial terms, dependencies, deadlines and named follow-up.'
  ])},
  {id:'stalled',stage:'operations',dimension:'deal_execution',prompt:'A serious prospect becomes unresponsive after requesting final numbers.',choices:scale([
    'Send repeated “just checking in” messages.',
    'Wait several days and call again.',
    'Follow up with the requested information and a clear question.',
    'Re-enter with decision-useful information, a low-friction next step, a specific question and a defined close-the-loop cadence while respecting silence.'
  ])},
  {id:'crossborder',stage:'property',dimension:'international',prompt:'A buyer in another country asks whether the purchase will definitely improve their residency or tax position.',choices:scale([
    'Say yes if buyers commonly use the project for that reason.',
    'Explain what you have heard from previous buyers.',
    'State that legal/tax outcomes need specialist confirmation.',
    'Separate property facts from legal/tax advice, explain the limits of your role and coordinate the appropriate qualified adviser before the client relies on the claim.'
  ])},
  {id:'remote',stage:'operations',dimension:'international',prompt:'A remote buyer cannot inspect the property in person before making a decision.',choices:scale([
    'Tell them the renders are accurate enough.',
    'Send more marketing images.',
    'Arrange a video call and answer their questions.',
    'Build an evidence pack: verified plans/media, live walkthrough where possible, source-dated facts, unresolved items and an explicit record of what has and has not been independently verified.'
  ])},
  {id:'confidentiality',stage:'judgment',dimension:'compliance',prompt:'A colleague asks you to forward a private client’s documents because they may know a useful contact.',choices:scale([
    'Forward them because they are on the same team.',
    'Remove the client’s name and forward the rest.',
    'Ask the client before sharing.',
    'Do not share beyond the authorised purpose; confirm consent, necessity and secure channel before any disclosure, and record the handoff where required.'
  ])},
  {id:'source_truth',stage:'judgment',dimension:'compliance',prompt:'A seller/developer contact gives you an attractive claim that is not in current official material.',choices:scale([
    'Use it if the contact is senior.',
    'Use it verbally but not in writing.',
    'Tell the client it is unverified.',
    'Treat it as an unverified claim, seek authoritative confirmation, preserve the distinction between source fact and sales assertion, and do not present it as established.'
  ])},
  {id:'crm',stage:'operations',dimension:'operating_discipline',prompt:'After a client meeting, what should be recorded?',choices:scale([
    'Only whether the client seemed interested.',
    'A short note and the next follow-up date.',
    'Needs, objections, agreed actions and next contact.',
    'Decision criteria, verified facts shared, unresolved questions, objections, commitments, owners, deadlines, permissions and the next decision-triggering action.'
  ])},
  {id:'visit_prep',stage:'operations',dimension:'operating_discipline',prompt:'You have an important private appointment tomorrow.',choices:scale([
    'Review the brochure on the way.',
    'Confirm the time and location.',
    'Review client notes, project facts and logistics.',
    'Rehearse the client objective, verify current commercial facts, prepare evidence/answers, confirm logistics and privacy constraints, and define the intended next decision step.'
  ])}
];

export type ScreeningClassification={
  version:string;
  dimensions:Record<ScreeningDimension,{score:number;level:'foundation'|'practiced'|'advanced'}>;
  primary_strengths:ScreeningDimension[];
  interview_focus:ScreeningDimension[];
  archetype:string;
  generated_at:number;
};

const DIMENSIONS:ScreeningDimension[]=['off_plan','client_advisory','deal_execution','international','compliance','operating_discipline'];
function level(score:number):'foundation'|'practiced'|'advanced'{return score>=75?'advanced':score>=50?'practiced':'foundation'}

export function classifyScreening(answers:Record<string,string>,now=Date.now()):ScreeningClassification{
  const totals=Object.fromEntries(DIMENSIONS.map(d=>[d,{points:0,max:0}])) as Record<ScreeningDimension,{points:number;max:number}>;
  for(const q of SCREENING_QUESTIONS){
    const c=q.choices.find(x=>x.id===String(answers[q.id]));
    totals[q.dimension].max+=Math.max(...q.choices.map(x=>x.points));
    if(c)totals[q.dimension].points+=c.points;
  }
  const dimensions=Object.fromEntries(DIMENSIONS.map(d=>{
    const score=totals[d].max?Math.round(totals[d].points/totals[d].max*100):0;
    return [d,{score,level:level(score)}];
  })) as ScreeningClassification['dimensions'];
  const ordered=[...DIMENSIONS].sort((a,b)=>dimensions[b].score-dimensions[a].score);
  const primary=ordered.filter(d=>dimensions[d].score>=67).slice(0,3);
  const focus=ordered.filter(d=>dimensions[d].score<67).reverse().slice(0,3);
  const top=ordered[0],second=ordered[1];
  let archetype='Developing Generalist';
  if((top==='client_advisory'||second==='client_advisory')&&dimensions.client_advisory.score>=67)archetype='Private Client Adviser';
  if((top==='off_plan'||second==='off_plan')&&dimensions.off_plan.score>=67)archetype='Off-plan Deal Builder';
  if((top==='international'||second==='international')&&dimensions.international.score>=67)archetype='International Property Adviser';
  if((top==='deal_execution'||top==='operating_discipline')&&dimensions[top].score>=67)archetype='Execution & Follow-through Specialist';
  return {version:SCREENING_VERSION,dimensions,primary_strengths:primary,interview_focus:focus,archetype,generated_at:now};
}

export function screeningComplete(answers:Record<string,string>){return SCREENING_QUESTIONS.every(q=>q.choices.some(c=>c.id===String(answers[q.id])))}
export function publicScreening(){return {version:SCREENING_VERSION,questions:SCREENING_QUESTIONS.map(q=>({id:q.id,stage:q.stage,prompt:q.prompt,choices:q.choices.map(({id,label})=>({id,label}))}))}}
