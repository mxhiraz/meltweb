export default async function handler(req,res){
  if(req.headers["x-admin-pw"]!==(process.env.ADMIN_PW||"sex"))return res.status(401).json({error:"unauth"});
  if(req.method!=="POST")return res.status(405).end();
  const {prefix}=req.body||{};
  if(!prefix)return res.status(400).json({error:"prefix required"});
  const REPO=process.env.GH_REPO||"mxhiraz/meltweb";
  const TOKEN=process.env.GH_TOKEN;
  const H={Authorization:`Bearer ${TOKEN}`,Accept:"application/vnd.github+json","Content-Type":"application/json"};
  try{
    // get current ref + tree
    const ref=await(await fetch(`https://api.github.com/repos/${REPO}/git/refs/heads/main`,{headers:H})).json();
    const commitSha=ref.object.sha;
    const commit=await(await fetch(`https://api.github.com/repos/${REPO}/git/commits/${commitSha}`,{headers:H})).json();
    const treeSha=commit.tree.sha;
    const tree=await(await fetch(`https://api.github.com/repos/${REPO}/git/trees/${treeSha}?recursive=1`,{headers:H})).json();
    // build new tree omitting blobs under prefix
    const keepFile=req.body.keep||null;
    const keep=tree.tree.filter(t=>{if(t.type!=="blob")return false;if(!t.path.startsWith(prefix))return true;if(keepFile&&t.path===prefix+keepFile)return true;return false});
    const newTree=keep.map(t=>({path:t.path,mode:t.mode,type:t.type,sha:t.sha}));
    const removed=tree.tree.filter(t=>t.type==="blob"&&t.path.startsWith(prefix)).length;
    if(removed===0)return res.json({ok:true,removed:0,message:"nothing to delete"});
    // create new tree
    const newTreeResp=await(await fetch(`https://api.github.com/repos/${REPO}/git/trees`,{method:"POST",headers:H,body:JSON.stringify({tree:newTree})})).json();
    if(!newTreeResp.sha)return res.status(500).json({error:"tree creation failed",detail:newTreeResp});
    // create commit
    const newCommit=await(await fetch(`https://api.github.com/repos/${REPO}/git/commits`,{method:"POST",headers:H,body:JSON.stringify({message:`admin: bulk delete ${prefix} (${removed} files)`,tree:newTreeResp.sha,parents:[commitSha]})})).json();
    if(!newCommit.sha)return res.status(500).json({error:"commit failed",detail:newCommit});
    // update ref
    const upd=await(await fetch(`https://api.github.com/repos/${REPO}/git/refs/heads/main`,{method:"PATCH",headers:H,body:JSON.stringify({sha:newCommit.sha})})).json();
    res.json({ok:true,removed,commit:newCommit.sha});
  }catch(e){res.status(500).json({error:e.message})}
}
