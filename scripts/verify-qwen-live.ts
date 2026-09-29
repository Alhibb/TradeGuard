import {readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {extractAgreement} from '../lib/tradeguard/extraction';
import {sampleSource,sampleTerms} from '../lib/tradeguard/domain';
const env=parseEnv(readFileSync('.env','utf8'));
if(!env.QWEN_API_KEY?.trim()){console.log(JSON.stringify({ok:false,reason:'QWEN_API_KEY is empty in .env'}));process.exit(1);}
const started=Date.now();
let providerStatus:number|undefined;
let providerError:unknown;
try {
 const result=await extractAgreement(sampleSource,{...env,QWEN_ENABLED:'true'},async(input,init)=>{
  const response=await fetch(input,init);providerStatus=response.status;
  if(!response.ok){try{const body=await response.clone().json() as {error?:{code?:string;type?:string}};providerError={code:body.error?.code,type:body.error?.type};}catch{providerError='Non-JSON error response';}}
  return response;
 });
 const mismatches=Object.entries(sampleTerms).filter(([key,value])=>result.fields[key]!==value).map(([field,expected])=>({field,expected,actual:result.fields[field]}));
 console.log(JSON.stringify({ok:true,httpStatus:providerStatus,provider:result.provider,elapsedMs:Date.now()-started,fieldsMatched:Object.keys(sampleTerms).length-mismatches.length,totalFields:Object.keys(sampleTerms).length,mismatches,verifiedQuotes:result.sources.length,warnings:result.warnings,configuredEnabled:env.QWEN_ENABLED==='true'},null,2));
}catch(error){console.log(JSON.stringify({ok:false,httpStatus:providerStatus,providerError,elapsedMs:Date.now()-started,error:error instanceof Error?error.message:'Request failed'},null,2));process.exitCode=1;}
