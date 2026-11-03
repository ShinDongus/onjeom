import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root=process.cwd();
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=createServer(async (req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const pathname=decodeURIComponent(url.pathname);
  const p=resolve(root,`.${pathname==='/'?'/index.html':pathname}`);
  if(p!==root&&!p.startsWith(root+sep)){res.writeHead(403).end();return;}
  const fs=await stat(p);if(!fs.isFile())throw new Error('not file');
  res.writeHead(200,{'Content-Type':(mime[extname(p)]||'application/octet-stream')+'; charset=utf-8','Cache-Control':'no-store'});res.end(await readFile(p));
 }catch{res.writeHead(404).end('Not found');}
});
const port=Number(process.env.PORT||4173);
server.listen(port,'0.0.0.0',()=>console.log(`온점. 미리보기: http://localhost:${port}`));
