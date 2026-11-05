/* CubIQ · motor de idiomas. Español es el idioma base (sin traducir); el resto se aplica
   traduciendo en el navegador cada texto que aparece en pantalla con el diccionario de lang/<código>.js */
(function(){
  var LOC={es:'es',en:'en',fr:'fr',de:'de','zh-TW':'zh-TW'},lang='';
  try{lang=(JSON.parse(localStorage.getItem('cfg')||'{}')||{}).lang||''}catch(e){}
  if(!LOC[lang]){var n=(navigator.language||'es').toLowerCase();lang=n.indexOf('es')===0?'es':n.indexOf('fr')===0?'fr':n.indexOf('de')===0?'de':n.indexOf('zh')===0?'zh-TW':n.indexOf('en')===0?'en':'es'}
  var I=window.I18N={lang:lang,loc:LOC[lang],D:{},P:[],add:function(o){for(var k in o.D)this.D[k]=o.D[k];for(var i=0;i<o.P.length;i++)this.P.push([new RegExp(o.P[i][0]),o.P[i][1]])},tr:function(s){return s}};
  document.documentElement.lang=LOC[lang];
  if(lang==='es')return;
  document.write('<script src="./lang/'+lang+'.js"><\/script>');           // diccionario del idioma (bloquea un instante para no ver español)
  var cache=new Map(),LET=/[A-Za-zÀ-ÿ¿¡]/;
  function core(k){
    var v=I.D[k];if(v!==undefined)return v;
    for(var i=0;i<I.P.length;i++){var m=I.P[i][0].exec(k);if(m)return I.P[i][1].replace(/([$%])(\d)/g,function(_,t,n){var g=m[n]===undefined?'':m[n];return t==='%'?core(g.trim()):g})}
    if(k.indexOf(' · ')>0){var parts=k.split(' · '),out=parts.map(core);for(var j=0;j<parts.length;j++)if(out[j]!==parts[j])return out.join(' · ')}
    return k}
  function tr(s){
    if(typeof s!=='string')return s;var k=s.trim();if(!k||!LET.test(k))return s;
    var r=cache.get(k);if(r===undefined){r=core(k);cache.set(k,r)}
    return r===k?s:s.replace(k,r)}
  I.tr=tr;
  var ATTR=['title','aria-label','placeholder','alt','data-h'],SKIP={SCRIPT:1,STYLE:1,CODE:1,TEXTAREA:1};
  function node(n){
    if(n.nodeType===3){var p=n.parentNode;if(p&&SKIP[p.nodeName])return;var t=tr(n.data);if(t!==n.data)n.data=t;return}
    if(n.nodeType!==1||SKIP[n.nodeName])return;
    for(var i=0;i<ATTR.length;i++){var v=n.getAttribute(ATTR[i]);if(v){var t2=tr(v);if(t2!==v)n.setAttribute(ATTR[i],t2)}}
    for(var c=n.firstChild;c;c=c.nextSibling)node(c)}
  var mo=new MutationObserver(function(ms){
    for(var i=0;i<ms.length;i++){var m=ms[i];
      if(m.type==='childList'){for(var j=0;j<m.addedNodes.length;j++)node(m.addedNodes[j])}
      else if(m.type==='characterData')node(m.target);
      else if(m.type==='attributes'){var v=m.target.getAttribute(m.attributeName);var t=tr(v);if(v&&t!==v)m.target.setAttribute(m.attributeName,t)}}});
  mo.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTR});
  document.addEventListener('DOMContentLoaded',function(){node(document.body)});
  // diálogos nativos
  ['alert','confirm','prompt'].forEach(function(f){var o=window[f];window[f]=function(m,d){return o.call(window,String(m).split('\n').map(tr).join('\n'),d)}}); // diálogos nativos: se traduce línea a línea
  document.title=tr(document.title);
})();
