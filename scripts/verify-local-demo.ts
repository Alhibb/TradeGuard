import assert from 'node:assert/strict';
import {sampleSource,sampleTerms} from '../lib/tradeguard/domain';
const base='http://127.0.0.1:5173';
const signIn=await fetch(base+'/signin-with-chatgpt?return_to=%2F',{redirect:'manual'});
assert.equal(signIn.status,302);
const cookie=signIn.headers.get('set-cookie')?.split(';')[0];assert.ok(cookie);
async function call(path:string,body?:unknown,status=200){
 const response=await fetch(base+path,{method:body?'POST':'GET',headers:{Cookie:cookie!,Origin:base,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json() as any;assert.equal(response.status,status,JSON.stringify(data));return data;
}
assert.equal((await fetch(base+'/api/orders')).status,401);
assert.equal((await fetch(base+'/api/orders',{headers:{'oai-authenticated-user-id':'forged','oai-authenticated-user-email':'forged@example.com'}})).status,401);
const extracted=await call('/api/extract',{source:sampleSource});assert.deepEqual(extracted.fields,sampleTerms);
let {order}=await call('/api/orders',{source:sampleSource,terms:extracted.fields},201);
const stale=order.version;
async function act(action:string,role:string,payload={}){({order}=await call('/api/orders/'+order.id,{version:order.version,action,role,payload}));}
await act('accept','buyer');await call('/api/orders/'+order.id,{version:stale,action:'accept',role:'seller'},409);
await act('accept','seller');await act('fund','buyer');
const evidence='Synthetic delivery receipt: 90 of 100 maize bags received; 10 missing.';
const form=new FormData();form.append('file',new File([evidence],'demo-delivery.txt',{type:'text/plain'}));
const upload=await fetch(base+'/api/files',{method:'POST',headers:{Cookie:cookie!,Origin:base},body:form});assert.equal(upload.status,200);const file=await upload.json() as any;
await act('delivery','seller',{quantity:90,note:evidence,fileId:file.id,name:file.name});
const download=await fetch(base+'/api/files/'+file.id,{headers:{Cookie:cookie!}});assert.equal(download.status,200);assert.equal(await download.text(),evidence);
assert.equal((await fetch(base+'/api/files/'+file.id)).status,401);
await act('dispute','buyer',{reason:'Ten of the agreed 100 bags are missing.'});
await call('/api/orders/'+order.id,{version:order.version,action:'release',role:'buyer'},400);
await act('resolve','arbitrator',{sellerPercent:90,reason:'Pay for the 90 bags delivered and refund the ten missing.'});
assert.equal(order.allocation.seller,2250e6);assert.equal(order.allocation.buyer,250e6);
await act('withdraw','buyer');await act('withdraw','seller');
assert.deepEqual((await call('/api/orders')).orders.find((o:any)=>o.id===order.id),order);
const cross=await fetch(base+'/api/orders',{method:'POST',headers:{Cookie:cookie!,Origin:'https://untrusted.example','Content-Type':'application/json'},body:JSON.stringify({terms:sampleTerms})});assert.ok([400,403].includes(cross.status));
console.log(JSON.stringify({result:'PASS',provider:extracted.provider,reference:order.reference,status:order.status,sellerTGT:2250,buyerTGT:250,withdrawn:order.withdrawn,evidenceDownload:true,persistence:true,unauthenticatedDenied:true,spoofedHeadersDenied:true,staleVersionDenied:true,crossOriginDenied:true},null,2));

