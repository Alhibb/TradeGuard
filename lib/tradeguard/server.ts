import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export function bindings(){return env as unknown as {DB:D1Database;BUCKET:R2Bucket;QWEN_API_KEY?:string;QWEN_BASE_URL?:string;QWEN_MODEL?:string;QWEN_ENABLED?:string;ESCROW_ADDRESS?:string;TOKEN_ADDRESS?:string;MONAD_RPC_URL?:string;MONAD_CHAIN_ID?:string};}
export async function owner(){const user=await getChatGPTUser();if(!user)throw new Error('AUTH_REQUIRED');return user.userId;}
export function db(){const {DB}=bindings();if(!DB)throw new Error('Storage is temporarily unavailable.');return DB;}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)throw new Error('Cross-origin action rejected.');}
export function responseError(e:unknown){const message=e instanceof Error?e.message:'Request failed';return Response.json({error:message==='AUTH_REQUIRED'?'Sign in to save and manage your trades.':message},{status:message==='AUTH_REQUIRED'?401:message==='NOT_FOUND'?404:400});}
export async function digest(s:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return '0x'+Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,'0')).join('');}
