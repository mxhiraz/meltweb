export default async function handler(req,res){
  if(req.headers["x-admin-pw"]!==process.env.ADMIN_PW)return res.status(401).json({error:"unauth"});
  const REPO=process.env.GH_REPO||"mxhiraz/meltweb";
  const TOKEN=process.env.GH_TOKEN;
  // get tree recursive from main
  const r=await fetch(`https://api.github.com/repos/${REPO}/git/trees/main?recursive=1`,{headers:{Authorization:`Bearer ${TOKEN}`,Accept:"application/vnd.github+json"}});
  const d=await r.json();
  if(!r.ok)return res.status(500).json({error:d.message});
  const files=(d.tree||[]).filter(t=>t.type==="blob"&&t.path.startsWith("sample/")).map(t=>({path:t.path,sha:t.sha,size:t.size}));
  res.json({files});
}
