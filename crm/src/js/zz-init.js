window.__crm={buildReport:function(){return buildReport()},renderHtmlReport:renderHtmlReport,pfCalc:pfCalc,pfBruecke:pfBruecke,pfHeimJahre:pfHeimJahre,renderPdf:renderPdf,bsOf:bsOf,REGEL:REGEL,adv:function(){return adv}};
try{var thm=localStorage.getItem('crm.theme');if(thm==='dark'||thm==='light')document.documentElement.setAttribute('data-theme',thm)}catch(e){}
load();
navBuild();
render();
try{
  if(window.claude&&typeof window.claude.use==='function'){
    window.claude.use('downloads').then(function(n){dl=n||null},function(){dl=null});
  }
}catch(e){dl=null}
