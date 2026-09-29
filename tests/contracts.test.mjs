import {privateKeyToAccount} from 'viem/accounts';import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ganache from 'ganache';import {createPublicClient,createWalletClient,custom,parseUnits,keccak256,toBytes} from 'viem';
const provider=ganache.provider({logging:{quiet:true},chain:{hardfork:'shanghai'},wallet:{totalAccounts:5}});const transport=custom(provider);const pub=createPublicClient({transport});const addresses=await provider.request({method:'eth_accounts',params:[]});const clients=addresses.map(address=>createWalletClient({account:privateKeyToAccount(provider.getInitialAccounts()[address].secretKey),transport}));const [buyer,seller,arb,stranger]=clients;const tokenArtifact=JSON.parse(fs.readFileSync('contracts/artifacts/DemoToken.json'));const escrowArtifact=JSON.parse(fs.readFileSync('contracts/artifacts/TradeGuardEscrow.json'));
async function receipt(hash){const r=await pub.waitForTransactionReceipt({hash});assert.equal(r.status,'success');return r;}
const token=(await receipt(await buyer.deployContract({...tokenArtifact,chain:null}))).contractAddress;
const escrow=(await receipt(await buyer.deployContract({...escrowArtifact,args:[token,addresses[0]],chain:null}))).contractAddress;
const hash=keccak256(toBytes('synthetic salted terms'));
async function send(client,functionName,args=[],address=escrow,abi=escrowArtifact.abi){const request=await pub.simulateContract({address,abi,functionName,args,account:client.account});return receipt(await client.writeContract({...request.request,chain:null}));}
async function read(fn,args=[]){return pub.readContract({address:escrow,abi:escrowArtifact.abi,functionName:fn,args});}
await send(buyer,'faucet',[],token,tokenArtifact.abi);
await send(buyer,'approve',[escrow,parseUnits('10000',6)],token,tokenArtifact.abi);
let id=0n;
async function funded(amount=1000000n){id=await read('nextId');const block=await pub.getBlock();await send(buyer,'create',[addresses[1],addresses[2],amount,hash,block.timestamp+86400n,3600]);await send(seller,'accept',[id]);await send(buyer,'fund',[id]);return id;}
async function invariant(){const bal=await pub.readContract({address:token,abi:tokenArtifact.abi,functionName:'balanceOf',args:[escrow]});assert.ok(bal>=await read('liabilities')+await read('creditsTotal'));}
test('on-chain permissions, no double release, and withdrawals',async()=>{const order=await funded();await assert.rejects(send(stranger,'submitDelivery',[order,hash]));await send(seller,'submitDelivery',[order,hash]);await assert.rejects(send(seller,'approveDelivery',[order]));await send(buyer,'approveDelivery',[order]);await assert.rejects(send(buyer,'approveDelivery',[order]));await invariant();await send(seller,'withdraw');await assert.rejects(send(seller,'withdraw'));await invariant();});
test('dispute cannot be bypassed, arbitrator split conserves tokens',async()=>{const order=await funded(101n);await send(buyer,'dispute',[order,hash]);await assert.rejects(send(buyer,'approveDelivery',[order]));await assert.rejects(send(seller,'resolve',[order,90n,hash]));await assert.rejects(send(arb,'resolve',[order,102n,hash]));await send(arb,'resolve',[order,90n,hash]);assert.equal(await read('credits',[addresses[0]]),11n);assert.equal(await read('credits',[addresses[1]]),90n);await invariant();});
test('mutual resolution cannot be signed by one party or stale proposal',async()=>{const order=await funded();await send(seller,'proposeMutual',[order,400000n]);await send(seller,'approveMutual',[order,400000n]);assert.equal((await read('trades',[order]))[9],3);await send(seller,'proposeMutual',[order,600000n]);await assert.rejects(send(buyer,'approveMutual',[order,400000n]));await send(buyer,'approveMutual',[order,600000n]);assert.equal((await read('trades',[order]))[9],6);await invariant();});
test('pause stops new funding but permits disputes and allocated withdrawals',async()=>{const order=await funded();await assert.rejects(send(stranger,'pause'));await send(buyer,'pause');await assert.rejects(send(seller,'submitDelivery',[order,hash]));await send(buyer,'dispute',[order,hash]);await send(arb,'resolve',[order,500000n,hash]);await send(buyer,'withdraw');await send(seller,'withdraw');await invariant();await send(buyer,'unpause');});
test('multiple orders remain isolated over generated splits',async()=>{let expectedBuyer=0n,expectedSeller=0n;for(let i=1;i<=12;i++){const amount=BigInt(i*997);const order=await funded(amount);const split=amount*BigInt((i*37)%101)/100n;await send(seller,'dispute',[order,hash]);await send(arb,'resolve',[order,split,hash]);expectedBuyer+=amount-split;expectedSeller+=split;await invariant();}assert.equal(await read('credits',[addresses[0]]),expectedBuyer);assert.equal(await read('credits',[addresses[1]]),expectedSeller);await send(buyer,'withdraw');await send(seller,'withdraw');assert.equal(await read('liabilities'),0n);assert.equal(await read('creditsTotal'),0n);await invariant();});
test.after(async()=>{await provider.disconnect()});

test('100-bag demo settlement: 2500 TGT funded, 2250/250 withdrawn',async()=>{
 const amount=parseUnits('2500',6),sellerAmount=parseUnits('2250',6),buyerAmount=parseUnits('250',6);
 const balance=address=>pub.readContract({address:token,abi:tokenArtifact.abi,functionName:'balanceOf',args:[address]});
 const buyerBefore=await balance(addresses[0]),sellerBefore=await balance(addresses[1]);
 const order=await funded(amount);await send(seller,'submitDelivery',[order,keccak256(toBytes('90 of 100 bags delivered'))]);
 await send(buyer,'dispute',[order,hash]);await assert.rejects(send(buyer,'approveDelivery',[order]));
 await send(arb,'resolve',[order,sellerAmount,hash]);
 assert.equal(await read('credits',[addresses[0]]),buyerAmount);assert.equal(await read('credits',[addresses[1]]),sellerAmount);
 await send(buyer,'withdraw');await send(seller,'withdraw');
 assert.equal(await balance(addresses[0]),buyerBefore-amount+buyerAmount);assert.equal(await balance(addresses[1]),sellerBefore+sellerAmount);
 assert.equal(await read('liabilities'),0n);assert.equal(await read('creditsTotal'),0n);await invariant();
});

test('dispute revokes old mutual consent and ownership cannot be renounced',async()=>{
 const order=await funded();await send(seller,'proposeMutual',[order,400000n]);await send(buyer,'dispute',[order,hash]);
 await assert.rejects(send(buyer,'approveMutual',[order,400000n]));await assert.rejects(send(buyer,'renounceOwnership'));
 await send(arb,'resolve',[order,400000n,hash]);await send(buyer,'withdraw');await send(seller,'withdraw');await invariant();
});
