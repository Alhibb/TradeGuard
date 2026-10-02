// Read-only verification. No signing key or transaction is required.
import {readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {createPublicClient,http,erc20Abi,isAddress} from 'viem';
const env=parseEnv(readFileSync('.env','utf8'));
const token=env.TOKEN_ADDRESS,escrow=env.ESCROW_ADDRESS;
if(!isAddress(token||'')||!isAddress(escrow||''))throw Error('Configure TOKEN_ADDRESS and ESCROW_ADDRESS in .env.');
const client=createPublicClient({transport:http(env.MONAD_RPC_URL||'https://testnet-rpc.monad.xyz',{timeout:15000})});
const abi=JSON.parse(readFileSync('lib/tradeguard/abi.json','utf8'));
const [chainId,tokenCode,escrowCode,linkedToken,decimals,symbol,owner,nextId]=await Promise.all([
 client.getChainId(),client.getCode({address:token}),client.getCode({address:escrow}),
 client.readContract({address:escrow,abi,functionName:'token'}),
 client.readContract({address:token,abi:erc20Abi,functionName:'decimals'}),
 client.readContract({address:token,abi:erc20Abi,functionName:'symbol'}),
 client.readContract({address:escrow,abi,functionName:'owner'}),
 client.readContract({address:escrow,abi,functionName:'nextId'})
]);
if(chainId!==10143||!tokenCode||tokenCode==='0x'||!escrowCode||escrowCode==='0x'||linkedToken.toLowerCase()!==token.toLowerCase()||decimals!==6||symbol!=='TGT')throw Error('Deployment verification failed. Check chain, code, token linkage and decimals.');
console.log(JSON.stringify({result:'PASS',chainId,token,escrow,symbol,decimals,owner,nextTradeId:String(nextId),scope:'Read-only deployment checks; no wallet workflow transactions sent.'},null,2));
