import { analyze } from './insight.js';

const FACES={U:[0,1,0],D:[0,-1,0],F:[0,0,1],B:[0,0,-1],R:[1,0,0],L:[-1,0,0]};
const NAME={}; for(const f in FACES) NAME[FACES[f]]=f;
const ROT={
  0:v=>[v[0],-v[2],v[1]],
  1:v=>[v[2],v[1],-v[0]],
  2:v=>[-v[1],v[0],v[2]]
};
const solvedCube=()=>{const s=[];for(const f in FACES){const n=FACES[f];for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)
  s.push({p:n[1]?[a,n[1],b]:n[0]?[n[0],a,b]:[a,b,n[2]],n:[...n],c:f});}return s};
const mv=(cube,m)=>{
  const f=m[0],q=m.endsWith("'")?3:m.endsWith("2")?2:1,n=FACES[f],ax=n.findIndex(x=>x),sg=n[ax],times=sg>0?3*q:q;
  for(const st of cube) if(st.p[ax]===sg) for(let i=0;i<times;i++){st.p=ROT[ax](st.p);st.n=ROT[ax](st.n);}
};
const clone=c=>c.map(s=>({p:[...s.p],n:[...s.n],c:s.c}));
const sig=c=>c.map(s=>s.p+'|'+s.n+'|'+s.c).sort().join();
const isSolved=c=>c.every(s=>s.c===NAME[s.n]);
globalThis.CM={solvedCube,mv,sig,isSolved,clone,FACES,COL:{},NAME};

self.onmessage=({data})=>{
  const {id,snap,moves}=data;
  try {
    const result=analyze(snap,moves);
    self.postMessage({id,result});
  } catch(error) {
    self.postMessage({id,error:String(error?.message||error)});
  }
};
