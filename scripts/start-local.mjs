// Local preview only. Production continues to use the trusted Sites ingress.
import './sites-env.mjs';
import {createServer,request as httpRequest} from 'node:http';
import {spawn,spawnSync} from 'node:child_process';
import {existsSync,mkdirSync,readFileSync,writeFileSync,openSync} from 'node:fs';
import path from 'node:path';
const root=process.cwd(),runtime=path.join(root,'.sites-runtime');
if(!existsSync('dist/server/wrangler.json'))throw new Error('Run pnpm build before pnpm local.');
mkdirSync(runtime,{recursive:true});
const cli=path.join(root,'node_modules/wrangler/bin/wrangler.js');
const config=path.join(root,'dist/server/wrangler.json'),state=path.join(root,'.wrangler/state');
const envFile=path.join(root,'.env');
const shared=['--config',config,'--env-file',envFile];
const log=openSync(path.join(runtime,'local-worker.log'),'a');
const schema=readFileSync('drizzle/0000_sturdy_microchip.sql','utf8').replaceAll('CREATE TABLE ','CREATE TABLE IF NOT EXISTS ').replaceAll('CREATE INDEX ','CREATE INDEX IF NOT EXISTS ');
const schemaPath=path.join(runtime,'local-schema.sql');writeFileSync(schemaPath,schema);
const init=spawnSync(process.execPath,[cli,'d1','execute','DB','--local','--persist-to',state,...shared,'--file',schemaPath],{stdio:['ignore',log,log],windowsHide:true});
if(init.status!==0)throw new Error('Local database initialization failed. See .sites-runtime/local-worker.log.');
const worker=spawn(process.execPath,[cli,'dev','--local','--persist-to',state,...shared,'--ip','127.0.0.1','--port','8787','--inspector-port','0'],{stdio:['ignore',log,log],windowsHide:true});
let stopping=false;
const stop=()=>{if(stopping)return;stopping=true;worker.kill();server.close();};
const allowedHosts=new Set(['127.0.0.1:5173','localhost:5173']);
const server=createServer((req,res)=>{
 if(!allowedHosts.has(req.headers.host)||!['127.0.0.1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)){res.writeHead(403);res.end('Local preview only');return;}
 const origin='http://'+req.headers.host,url=new URL(req.url,origin);
 if(req.headers.origin&&req.headers.origin!==origin){res.writeHead(403);res.end('Cross-origin request rejected');return;}
 const signIn=url.pathname==='/signin-with-chatgpt',signOut=url.pathname==='/signout-with-chatgpt';
 if(signIn||signOut){
  if(req.method!=='GET'||req.headers['sec-fetch-site']==='cross-site'){res.writeHead(403);res.end();return;}
  const requested=url.searchParams.get('return_to')||'/';
  let destination='/';try{const target=new URL(requested,origin);if(requested.startsWith('/')&&!requested.startsWith('//')&&target.origin===origin&&!target.pathname.startsWith('/signin')&&!target.pathname.startsWith('/signout'))destination=target.pathname+target.search;}catch{}
  res.writeHead(302,{'Location':destination,'Cache-Control':'no-store','Set-Cookie':`__tradeguard_local=${signIn?'1':''}; Path=/; HttpOnly; SameSite=Strict${signOut?'; Max-Age=0':''}`});res.end();return;
 }
 const headers={...req.headers};
 for(const name of Object.keys(headers))if(name.startsWith('oai-authenticated-')||name.startsWith('x-forwarded-')||name==='forwarded')delete headers[name];
 const cookies=(req.headers.cookie||'').split(';').map(x=>x.trim());
 if(cookies.filter(x=>x==='__tradeguard_local=1').length===1){headers['oai-authenticated-user-id']='local_seedy';headers['oai-authenticated-user-email']='local@tradeguard.test';headers['oai-authenticated-user-full-name']='Local workspace';headers['oai-authenticated-user-full-name-encoding']='percent-encoded-utf-8';}
 headers.cookie=cookies.filter(x=>!x.startsWith('__tradeguard_local=')).join(';');
 const upstream=httpRequest({hostname:'127.0.0.1',port:8787,path:req.url,method:req.method,headers},response=>{res.writeHead(response.statusCode||502,{...response.headers,'Cache-Control':'no-store'});response.pipe(res);});
 upstream.on('error',()=>{if(!res.headersSent)res.writeHead(502);res.end('Local worker is starting. Refresh shortly.');});req.pipe(upstream);
});
worker.on('error',error=>{console.error(error.message);stop();process.exitCode=1;});
worker.on('exit',()=>{if(!stopping){console.error('Local worker stopped. See .sites-runtime/local-worker.log.');stop();process.exitCode=1;}});
process.on('SIGINT',stop);process.on('SIGTERM',stop);
let ready=false;
for(let i=0;i<60&&!stopping;i++){try{const response=await fetch('http://127.0.0.1:8787/api/config',{signal:AbortSignal.timeout(1000)});if(response.status===401){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,1000));}
if(ready)server.listen(5173,'127.0.0.1',()=>console.log('TradeGuard is ready: http://127.0.0.1:5173\nUse Sign in to your workspace for the local demo. Restart after editing .env.'));
else{stop();throw new Error('Worker startup timed out. See .sites-runtime/local-worker.log.');}
