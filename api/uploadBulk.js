export const config={api:{bodyParser:{sizeLimit:"50mb"}}};
export default async function handler(req,res){
  if(req.headers["x-admin-pw"]!==(process.env.ADMIN_PW||"sex"))return res.status(401).json({error:"unauth"});
  if(req.method!=="POST")return res.status(405).end();
  const {files,message}=req.body||{};
  if(!Array.isArray(files)||!files.length)return res.status(400).json({error:"files[] required"});
  const REPO=process.env.GH_REPO||"mxhiraz/meltweb";
  const TOKEN=process.env.GH_TOKEN;
  const H={Authorization:`Bearer ${TOKEN}`,Accept:"application/vnd.github+json","Content-Type":"application/json"};
  try{
    // 1) get current commit + tree
    const ref=await(await fetch(`https://api.github.com/repos/${REPO}/git/refs/heads/main`,{headers:H})).json();
    const commitSha=ref.object.sha;
    const commit=await(await fetch(`https://api.github.com/repos/${REPO}/git/commits/${commitSha}`,{headers:H})).json();
    const baseTree=commit.tree.sha;
    // 2) create blobs in parallel
    const blobResults=await Promise.all(files.map(async f=>{
      const blob=await(await fetch(`https://api.github.com/repos/${REPO}/git/blobs`,{method:"POST",headers:H,body:JSON.stringify({content:f.contentBase64,encoding:"base64"})})).json();
      return {path:f.path,sha:blob.sha,mode:"100644",type:"blob"};
    }));
    if(blobResults.some(b=>!b.sha))return res.status(500).json({error:"blob creation failed",detail:blobResults});
    // 3) create new tree with all blobs
    const newTree=await(await fetch(`https://api.github.com/repos/${REPO}/git/trees`,{method:"POST",headers:H,body:JSON.stringify({base_tree:baseTree,tree:blobResults})})).json();
    if(!newTree.sha)return res.status(500).json({error:"tree failed",detail:newTree});
    // 4) commit
    const msg=message||`admin: bulk upload ${files.length} files`;
    const newCommit=await(await fetch(`https://api.github.com/repos/${REPO}/git/commits`,{method:"POST",headers:H,body:JSON.stringify({message:msg,tree:newTree.sha,parents:[commitSha]})})).json();
    if(!newCommit.sha)return res.status(500).json({error:"commit failed",detail:newCommit});
    // 5) update ref
    await fetch(`https://api.github.com/repos/${REPO}/git/refs/heads/main`,{method:"PATCH",headers:H,body:JSON.stringify({sha:newCommit.sha})});
    res.json({ok:true,uploaded:files.length,commit:newCommit.sha});
  }catch(e){res.status(500).json({error:e.message})}
}
