export const config={api:{bodyParser:{sizeLimit:"50mb"}}};
export default async function handler(req,res){
  if(req.headers["x-admin-pw"]!==(process.env.ADMIN_PW||"sex"))return res.status(401).json({error:"unauth"});
  if(req.method!=="POST")return res.status(405).end();
  const {path,contentBase64}=req.body||{};
  if(!path||!contentBase64)return res.status(400).json({error:"path+contentBase64 required"});
  const REPO=process.env.GH_REPO||"mxhiraz/meltweb";
  const TOKEN=process.env.GH_TOKEN;
  const H={Authorization:`Bearer ${TOKEN}`,Accept:"application/vnd.github+json","Content-Type":"application/json"};
  // size estimate: base64 -> raw bytes = b64length * 0.75
  const rawSize=Math.floor(contentBase64.length*0.75);
  // For files <800KB use Contents API (simple, atomic)
  if(rawSize<800000){
    let sha;
    const probe=await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`,{headers:H});
    if(probe.ok){const pd=await probe.json();sha=pd.sha}
    const r=await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`,{method:"PUT",headers:H,body:JSON.stringify({message:`admin: upload ${path}`,content:contentBase64,sha,branch:"main"})});
    const d=await r.json();
    if(!r.ok)return res.status(500).json({error:d.message});
    return res.json({ok:true,sha:d.content?.sha,commit:d.commit?.sha,via:"contents"});
  }
  // Large file: use git blob + tree + commit (handles up to 100MB)
  try{
    // 1) create blob
    const blob=await(await fetch(`https://api.github.com/repos/${REPO}/git/blobs`,{method:"POST",headers:H,body:JSON.stringify({content:contentBase64,encoding:"base64"})})).json();
    if(!blob.sha)return res.status(500).json({error:"blob creation failed",detail:blob});
    // 2) get current commit + tree
    const ref=await(await fetch(`https://api.github.com/repos/${REPO}/git/refs/heads/main`,{headers:H})).json();
    const commitSha=ref.object.sha;
    const commit=await(await fetch(`https://api.github.com/repos/${REPO}/git/commits/${commitSha}`,{headers:H})).json();
    const baseTree=commit.tree.sha;
    // 3) create new tree with this blob at path
    const newTree=await(await fetch(`https://api.github.com/repos/${REPO}/git/trees`,{method:"POST",headers:H,body:JSON.stringify({base_tree:baseTree,tree:[{path,mode:"100644",type:"blob",sha:blob.sha}]})})).json();
    if(!newTree.sha)return res.status(500).json({error:"tree failed",detail:newTree});
    // 4) commit
    const newCommit=await(await fetch(`https://api.github.com/repos/${REPO}/git/commits`,{method:"POST",headers:H,body:JSON.stringify({message:`admin: upload ${path} (${(rawSize/1024).toFixed(0)}KB via blob)`,tree:newTree.sha,parents:[commitSha]})})).json();
    if(!newCommit.sha)return res.status(500).json({error:"commit failed",detail:newCommit});
    // 5) update ref
    await fetch(`https://api.github.com/repos/${REPO}/git/refs/heads/main`,{method:"PATCH",headers:H,body:JSON.stringify({sha:newCommit.sha})});
    res.json({ok:true,sha:blob.sha,commit:newCommit.sha,via:"blob"});
  }catch(e){res.status(500).json({error:e.message})}
}
