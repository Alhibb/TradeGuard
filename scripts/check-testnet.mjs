import {createPublicClient,defineChain,http,formatEther,isAddress} from 'viem';
const rpc=process.env.MONAD_RPC_URL||'https://testnet-rpc.monad.xyz';
const chain=defineChain({id:10143,name:'Monad Testnet',nativeCurrency:{name:'MON',symbol:'MON',decimals:18},rpcUrls:{default:{http:[rpc]}}});
const client=createPublicClient({chain,transport:http(rpc,{timeout:15000,retryCount:1})});
const chainId=await client.getChainId();if(chainId!==10143)throw new Error('Wrong network: expected Monad testnet 10143.');
const address=process.argv[2];
if(address&&!isAddress(address))throw new Error('Supply a valid public testnet wallet address.');
const balance=address?await client.getBalance({address}):null;
console.log(JSON.stringify({chainId,rpc,wallet:address||null,testnetMON:balance===null?null:formatEther(balance),deploymentReady:balance===null?false:balance>0n,reason:!address?'Awaiting funded testnet wallet address':balance===0n?'Testnet MON needed for gas':'Balance is nonzero; estimate deployment gas before signing'},null,2));
