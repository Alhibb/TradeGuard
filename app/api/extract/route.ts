import {bindings,owner,responseError,sameOrigin} from '@/lib/tradeguard/server';
import {extractAgreement} from '@/lib/tradeguard/extraction';
export async function POST(req:Request){try{
 sameOrigin(req);await owner();
 const {source}=await req.json() as {source:string};
 return Response.json(await extractAgreement(source,bindings()));
}catch(e){return responseError(e);}}
