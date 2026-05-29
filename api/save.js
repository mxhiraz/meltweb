export default async function handler(req,res){
  if(req.headers["x-admin-pw"]!==(process.env.ADMIN_PW||"sex"))return res.status(401).json({error:"unauth"});
  if(req.method!=="POST")return res.status(405).end();
  const {path,sha,content}=req.body;
  if(!path||!content)return res.status(400).json({error:"path+content required"});
  const REPO=process.env.GH_REPO||"mxhiraz/meltweb";
  const TOKEN=process.env.GH_TOKEN;
  const r=await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`,{method:"PUT",headers:{Authorization:`Bearer ${TOKEN}`,Accept:"application/vnd.github+json","Content-Type":"application/json"},body:JSON.stringify({message:`admin: edit ${path}`,content:Buffer.from(content,"utf8").toString("base64"),sha,branch:"main"})});
  const d=await r.json();
  if(!r.ok)return res.status(500).json({error:d.message});
  res.json({sha:d.content.sha,commit:d.commit.sha});
}
