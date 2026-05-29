export default async function handler(req,res){
  if(req.headers["x-admin-pw"]!==(process.env.ADMIN_PW||"sex"))return res.status(401).json({error:"unauth"});
  const path=req.query.path;if(!path)return res.status(400).json({error:"path required"});
  const REPO=process.env.GH_REPO||"mxhiraz/meltweb";
  const TOKEN=process.env.GH_TOKEN;
  // Contents API first (works for <1MB files)
  const r=await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`,{headers:{Authorization:`Bearer ${TOKEN}`,Accept:"application/vnd.github+json"}});
  const d=await r.json();
  if(!r.ok)return res.status(500).json({error:d.message});
  let content=d.content?Buffer.from(d.content,"base64").toString("utf8"):"";
  // GitHub returns empty content for files >1MB - fallback to blob API or download_url
  if(!content&&d.size>0){
    if(d.download_url){
      const raw=await fetch(d.download_url,{headers:{Authorization:`Bearer ${TOKEN}`}});
      content=await raw.text();
    }else if(d.sha){
      const blob=await fetch(`https://api.github.com/repos/${REPO}/git/blobs/${d.sha}`,{headers:{Authorization:`Bearer ${TOKEN}`,Accept:"application/vnd.github+json"}});
      const bd=await blob.json();
      if(bd.content)content=Buffer.from(bd.content,"base64").toString("utf8");
    }
  }
  res.json({content,sha:d.sha,size:d.size});
}
