// CubIQ · Motor del cubo (módulo ES). Lo usa el worker de análisis; index.html lleva una copia idéntica del bloque
// delimitado por los marcadores ENGINE (npm test comprueba que ambas copias no se desvían).
export const FACES={U:[0,1,0],D:[0,-1,0],F:[0,0,1],B:[0,0,-1],R:[1,0,0],L:[-1,0,0]};
export const NAME={};for(const f in FACES)NAME[FACES[f]]=f;
export const solvedCube=()=>{const s=[];for(const f in FACES){const n=FACES[f];for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)
  s.push({p:n[1]?[a,n[1],b]:n[0]?[n[0],a,b]:[a,b,n[2]],n:[...n],c:f})}return s};
/*ENGINE-START*/
// Motor del cubo optimizado (v1.27.0): misma representación (54 pegatinas {p,n,c}), sin cadenas ni ordenaciones en el camino caliente.
const ENG_ROT=[ // giro antihorario (regla mano derecha) por eje y número de cuartos de vuelta: 0 = nada
  [null,v=>[v[0],-v[2],v[1]],v=>[v[0],-v[1],-v[2]],v=>[v[0],v[2],-v[1]]],
  [null,v=>[v[2],v[1],-v[0]],v=>[-v[0],v[1],-v[2]],v=>[-v[2],v[1],v[0]]],
  [null,v=>[-v[1],v[0],v[2]],v=>[-v[0],-v[1],v[2]],v=>[v[1],-v[0],v[2]]]];
const mv=(cube,m)=>{
  const f=m[0],q=m.endsWith("'")?3:m.endsWith('2')?2:1,n=FACES[f],ax=n.findIndex(x=>x),sg=n[ax];
  // horario visto desde la cara = antihorario si el eje es negativo, 3 giros antihorarios si es positivo; se reduce a 1-3 cuartos de vuelta de una sola vez
  const r=(sg>0?3*q:q)&3;if(!r)return;
  const R=ENG_ROT[ax][r];
  for(const s of cube)if(s.p[ax]===sg){s.p=R(s.p);s.n=R(s.n)}
};
const ENG_BUF=new Uint8Array(189); // 27 posiciones × 7 códigos de normal; la firma no depende del orden de las pegatinas ni necesita ordenar
const sig=c=>{ENG_BUF.fill(0);for(const s of c){const p=s.p,n=s.n;ENG_BUF[((p[0]+1)*9+(p[1]+1)*3+p[2]+1)*7+n[0]+2*n[1]+3*n[2]+3]=s.c.charCodeAt(0)}return String.fromCharCode.apply(null,ENG_BUF)};
const ENG_NAME=[];for(const f in FACES){const n=FACES[f];ENG_NAME[n[0]+2*n[1]+3*n[2]+3]=f}
const isSolved=c=>{for(const s of c){const n=s.n;if(s.c!==ENG_NAME[n[0]+2*n[1]+3*n[2]+3])return false}return true};
const clone=c=>{const o=new Array(c.length);for(let i=0;i<c.length;i++){const s=c[i],p=s.p,n=s.n;o[i]={p:[p[0],p[1],p[2]],n:[n[0],n[1],n[2]],c:s.c}}return o};
// Facelets (URFDLB): la tabla de índices se calcula una vez; antes cada pegatina se buscaba con find() y cadenas.
const FP={U:(r,k)=>[-1+k,1,-1+r],R:(r,k)=>[1,1-r,1-k],F:(r,k)=>[-1+k,1-r,1],D:(r,k)=>[-1+k,-1,1-r],L:(r,k)=>[-1,1-r,-1+k],B:(r,k)=>[1-k,1-r,-1]};
const FEXP=[],FIDX=(()=>{const base=solvedCube(),out=[];'URFDLB'.split('').forEach(f=>{for(let i=0;i<9;i++){const p=FP[f](i/3|0,i%3),n=FACES[f];FEXP.push([p,n]);out.push(base.findIndex(x=>x.n+''===n+''&&x.p+''===p+''))}});return out})();
const stickerAtK=(c,k)=>{const s=c[FIDX[k]],[p,n]=FEXP[k];
  return s&&s.p[0]===p[0]&&s.p[1]===p[1]&&s.p[2]===p[2]&&s.n[0]===n[0]&&s.n[1]===n[1]&&s.n[2]===n[2]?s:c.find(x=>x.p[0]===p[0]&&x.p[1]===p[1]&&x.p[2]===p[2]&&x.n[0]===n[0]&&x.n[1]===n[1]&&x.n[2]===n[2])};
function fromFacelets(str){const c=solvedCube();for(let k=0;k<54;k++)stickerAtK(c,k).c=str[k];return c}
function toFacelets(c){let o='';for(let k=0;k<54;k++)o+=stickerAtK(c,k).c;return o}
/*ENGINE-END*/
export{mv,sig,isSolved,clone,fromFacelets,toFacelets};
