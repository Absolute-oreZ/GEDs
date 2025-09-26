export function extractCallIdFromCid(cid: string){
    return cid.split(":")[1];
}