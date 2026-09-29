// Sortie rapide : quitte immédiatement le site (bouton ou double Échap)
(function(){
  var SAFE='https://www.meteosuisse.admin.ch/';
  function leave(){ try{ sessionStorage.clear(); }catch(e){} window.location.replace(SAFE); }
  document.querySelectorAll('[data-quick-exit]').forEach(function(b){ b.addEventListener('click', leave); });
  var last=0;
  document.addEventListener('keydown', function(e){
    if(e.key!=='Escape') return;
    var now=Date.now(); if(now-last<600) leave(); last=now;
  });
  // Filtres : un seul actif par groupe
  document.querySelectorAll('[data-chips]').forEach(function(g){
    g.addEventListener('click', function(e){
      var b=e.target.closest('.chip'); if(!b) return;
      g.querySelectorAll('.chip').forEach(function(c){ c.setAttribute('aria-pressed', c===b ? 'true' : 'false'); });
    });
  });
})();
