import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extractAgreement} from '../lib/tradeguard/extraction';
import {sampleSource,sampleTerms} from '../lib/tradeguard/domain';
const config={QWEN_ENABLED:'true',QWEN_API_KEY:'test-only',QWEN_MODEL:'qwen-plus',QWEN_BASE_URL:'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'};
const reply=(value:unknown,finish_reason='stop')=>async()=>Response.json({choices:[{finish_reason,message:{content:JSON.stringify(value)}}]});
test('unconfigured extraction never calls provider',async()=>{const r=await extractAgreement(sampleSource,{},async()=>{throw new Error('Unexpected network call')});assert.deepEqual(r.fields,sampleTerms);});
test('Singapore request uses JSON mode and isolates document text',async()=>{
 const r=await extractAgreement(sampleSource,config,async(url,init)=>{assert.equal(url,config.QWEN_BASE_URL+'/chat/completions');const body=JSON.parse(String(init?.body));assert.equal(body.enable_thinking,false);assert.equal(body.response_format.type,'json_object');assert.deepEqual(JSON.parse(body.messages[1].content),{document:sampleSource});return reply({fields:sampleTerms,sources:[{quote:'Quantity: 100 bags'},null,{quote:'invented'}]})();});
 assert.deepEqual(r.fields,sampleTerms);assert.deepEqual(r.sources,[{quote:'Quantity: 100 bags'}]);
});
test('malformed, incomplete and failed provider responses fail clearly',async()=>{for(const mock of [reply(null),reply({fields:[]}),reply({fields:sampleTerms},'length'),async()=>new Response('unavailable',{status:503}),async()=>Response.json({choices:[{message:{content:'not json'}}]})])await assert.rejects(extractAgreement(sampleSource,config,mock),/AI/);});
test('invalid fields abstain and valid fields use normalization',async()=>{const r=await extractAgreement(sampleSource,config,reply({fields:{...sampleTerms,buyer:'  Kano Foods Co.  ',quantity:-1,currency:'BTC'},sources:[null,{},42]}));assert.equal(r.fields.buyer,sampleTerms.buyer);assert.equal(r.fields.quantity,null);assert.equal(r.fields.currency,null);assert.ok(r.warnings.some(w=>w.includes('quantity')));});
test('invalid source and insecure endpoint make no provider call',async()=>{const mock=async()=>{assert.fail('Must not call provider')};await assert.rejects(extractAgreement('short',config,mock));await assert.rejects(extractAgreement(sampleSource,{...config,QWEN_BASE_URL:'http://example.com'},mock));});
