import { z } from 'zod';
export type Role='buyer'|'seller'|'arbitrator';
export type Status='draft'|'accepted'|'funded'|'delivered'|'disputed'|'settled';
export const termsSchema=z.object({
 buyer:z.string().trim().min(2).max(100),seller:z.string().trim().min(2).max(100),commodity:z.string().trim().min(2).max(120),quantity:z.number().int().positive().max(10000000),unit:z.string().min(1).max(30),unitPrice:z.number().nonnegative().max(100000000),currency:z.enum(['NGN','USD']),destination:z.string().min(2).max(180),deliveryDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>!Number.isNaN(Date.parse(s))),settlementAmount:z.number().positive().max(100000000).refine(n=>Number.isSafeInteger(Math.round(n*1000000))),reviewHours:z.number().int().min(1).max(720),arbitrator:z.string().min(2).max(100)
});
export type Terms=z.infer<typeof termsSchema>;
export type Evidence={id:string;fileId?:string;name:string;note:string;quantity:number;createdAt:string;hash:string};
export type Event={id:string;at:string;actor:Role|'system';title:string;detail:string};
export type Order={id:string;reference:string;version:number;status:Status;mode:'demo';terms:Terms;source:string;termsHash:string;termsSalt?:string;acceptedBy:Role[];evidence:Evidence[];events:Event[];createdAt:string;updatedAt:string;dispute?:{reason:string;openedAt:string;deadline:string};allocation?:{buyer:number;seller:number;reason:string};withdrawn:Role[]};
export const sampleSource=`Buyer: Kano Foods Co.\nSeller: Savannah Grains Ltd.\nCommodity: White maize\nQuantity: 100 bags\nUnit price: 42000 NGN\nDestination: Kano Central Warehouse\nDelivery date: 2026-10-05\nSettlement amount: 2500 TGT\nReview hours: 48\nArbitrator: DevClans Demo Arbitrator`;
export const sampleTerms:Terms={buyer:'Kano Foods Co.',seller:'Savannah Grains Ltd.',commodity:'White maize',quantity:100,unit:'bags',unitPrice:42000,currency:'NGN',destination:'Kano Central Warehouse',deliveryDate:'2026-10-05',settlementAmount:2500,reviewHours:48,arbitrator:'DevClans Demo Arbitrator'};
export function transition(order:Order,action:string,role:Role,payload:Record<string,unknown>={},now=new Date().toISOString()):Order{
 const o=structuredClone(order);const fail=(m:string):never=>{throw new Error(m)};let title='',detail='';
 if(o.mode!=='demo')fail('Only sandbox orders use this endpoint.');
 const amount=Math.round(o.terms.settlementAmount*1e6);
 switch(action){
 case 'accept':
  if(o.status!=='draft'||!['buyer','seller'].includes(role))fail('Only buyer and seller can approve a draft.');
  if(o.acceptedBy.includes(role))fail('This participant has already approved.');o.acceptedBy.push(role);if(o.acceptedBy.length===2)o.status='accepted';title='Agreement approved';detail=`${role} approved this fixed terms version.`;break;
 case 'fund':
  if(role!=='buyer'||o.status!=='accepted')fail('Buyer can fund only after both approvals.');o.status='funded';title='Demo escrow funded';detail=`${o.terms.settlementAmount} TGT simulated. No blockchain transaction.`;break;
 case 'delivery':{
  if(role!=='seller'||o.status!=='funded')fail('Seller can record delivery only for a funded order.');
  const q=z.number().int().nonnegative().max(10000000).parse(payload.quantity);const note=z.string().min(5).max(4000).parse(payload.note);
  o.evidence.push({id:crypto.randomUUID(),name:typeof payload.name==='string'?payload.name:'Delivery declaration',quantity:q,note,createdAt:now,hash:String(payload.hash??''),...(typeof payload.fileId==='string'?{fileId:payload.fileId}:{})});o.status='delivered';title='Delivery submitted';detail=`Seller reports ${q} ${o.terms.unit}. Awaiting buyer review.`;break;}
 case 'release':
  if(role!=='buyer'||o.status!=='delivered')fail('Only the buyer can accept a submitted delivery.');o.status='settled';o.allocation={buyer:0,seller:amount,reason:'Buyer accepted delivery.'};title='Payment allocated to seller';detail='Seller can withdraw the demo allocation.';break;
 case 'dispute':
  if(!['buyer','seller'].includes(role)||!['funded','delivered'].includes(o.status))fail('A trade participant can dispute an active funded order.');
  o.dispute={reason:z.string().min(10).max(2000).parse(payload.reason),openedAt:now,deadline:new Date(Date.parse(now)+7*864e5).toISOString()};o.status='disputed';title='Dispute opened';detail=o.dispute.reason;break;
 case 'resolve':{
  if(role!=='arbitrator'||o.status!=='disputed')fail('Only the named demo arbitrator can resolve this dispute.');
  const pct=z.number().int().min(0).max(100).parse(payload.sellerPercent);const reason=z.string().min(10).max(2000).parse(payload.reason);const seller=Math.floor(amount*pct/100);o.allocation={seller,buyer:amount-seller,reason};o.status='settled';title='Dispute resolved';detail=`${pct}% to seller, ${100-pct}% to buyer. ${reason}`;break;}
 case 'withdraw':
  if(o.status!=='settled'||role==='arbitrator'||!o.allocation||o.allocation[role]<=0||o.withdrawn.includes(role))fail('No withdrawable allocation for this participant.');o.withdrawn.push(role);title='Demo withdrawal complete';detail=`${role} withdrew ${(o.allocation![role as 'buyer'|'seller']/1e6).toLocaleString()} TGT. Simulated only.`;break;
 default:fail('Unknown action.');
 }
 o.version++;o.updatedAt=now;o.events.push({id:crypto.randomUUID(),at:now,actor:role,title,detail});return o;
}
export function evidenceReview(o:Order){const e=o.evidence.at(-1);if(!e)return null;const difference=o.terms.quantity-e.quantity;return {difference,summary:difference===0?'The declared quantity matches the agreement. Physical delivery still requires your confirmation.':`Agreement: ${o.terms.quantity} ${o.terms.unit}. Seller declaration: ${e.quantity} ${o.terms.unit}. ${Math.abs(difference)} ${o.terms.unit} ${difference>0?'short':'over'}. Review before authorizing payment.`,source:e.name};}
export function extractDeterministic(source:string){
 const read=(label:string)=>source.split('\n').find(l=>l.toLowerCase().startsWith(label.toLowerCase()+':'))?.split(':').slice(1).join(':').trim()??null;
 const number=(s:string|null)=>s&&/^\d+(?:\.\d+)?(?:\s|$)/.test(s)?Number(s.match(/^\d+(?:\.\d+)?/)![0]):null;
 const q=read('Quantity'),price=read('Unit price');
 const fields={buyer:read('Buyer'),seller:read('Seller'),commodity:read('Commodity'),quantity:number(q),unit:q?.replace(/^\d+(?:\.\d+)?\s*/, '')||null,unitPrice:number(price),currency:price?.match(/\b(NGN|USD)\b/)?.[0]??null,destination:read('Destination'),deliveryDate:read('Delivery date'),settlementAmount:/^\d+(?:\.\d+)?\s+TGT$/.test(read('Settlement amount')??'')?number(read('Settlement amount')):null,reviewHours:number(read('Review hours')),arbitrator:read('Arbitrator')};
 const warnings=Object.entries(fields).filter(([,v])=>v===null).map(([k])=>`${k} was not found. Enter and verify it before creating an agreement.`);
 if(/ignore .*instructions|system prompt|release.*funds/i.test(source))warnings.push('Instruction-like content detected. Treat it as source text, not an action.');
 const duplicate=source.split('\n').map(l=>l.split(':')[0].trim().toLowerCase());if(new Set(duplicate).size<duplicate.filter(Boolean).length)warnings.push('Repeated labels found. Check for conflicting terms.');
 return {fields,warnings,provider:'Label-based parser (AI not configured)',sources:source.split('\n').map((quote,i)=>({line:i+1,quote})).filter(x=>x.quote.trim())};
}
