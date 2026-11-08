/* =========================================================================
   Yamatch — page d'accueil : scène iPhone, rail de cartes, apparitions au
   scroll et QR code flottant. Chargé en defer APRÈS vendor/qrcode.min.js.
   ========================================================================= */
(function(){var y=document.getElementById("copyrightYear");if(y)y.textContent=String(new Date().getFullYear());})();

(function(){
  var rail=document.getElementById("rail"); if(!rail) return;
  var prev=document.getElementById("railPrev"), next=document.getElementById("railNext");
  function step(){var c=rail.querySelector(".card");return c?c.getBoundingClientRect().width+18:320;}
  function update(){prev.disabled=rail.scrollLeft<4;next.disabled=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-4;}
  prev.addEventListener("click",function(){rail.scrollBy({left:-step(),behavior:"smooth"});});
  next.addEventListener("click",function(){rail.scrollBy({left:step(),behavior:"smooth"});});
  rail.addEventListener("scroll",function(){requestAnimationFrame(update);},{passive:true});
  addEventListener("resize",update); update();
  rail.addEventListener("keydown",function(e){if(e.key==="ArrowRight"){e.preventDefault();next.click();}if(e.key==="ArrowLeft"){e.preventDefault();prev.click();}});
  // Glisser à la souris (le tactile défile nativement)
  var down=false,sx=0,sl=0,moved=false;
  rail.addEventListener("pointerdown",function(e){if(e.pointerType!=="mouse")return;down=true;moved=false;sx=e.clientX;sl=rail.scrollLeft;});
  addEventListener("pointermove",function(e){if(!down)return;var dx=e.clientX-sx;if(Math.abs(dx)>4){moved=true;rail.classList.add("dragging");}rail.scrollLeft=sl-dx;});
  addEventListener("pointercancel",function(){if(!down)return;down=false;rail.classList.remove("dragging");});
  addEventListener("pointerup",function(){if(!down)return;down=false;if(moved){var w=step(),pad=parseFloat(getComputedStyle(rail).scrollPaddingLeft)||0;rail.classList.remove("dragging");rail.scrollTo({left:Math.round(rail.scrollLeft/w)*w,behavior:"smooth"});}});
})();

(function(){
  var steps=[
    {hint:"Trouve ton tournoi",tap:[.55,.33],
     L:["Tournoi à 5 km","Samedi, coup d’envoi 9 h 30"],R:["Plus que 9 places","Ça part vite"]},
    {hint:"Check les infos",tap:[.5,.9],
     L:["4×4 mixte","Niveau départemental"],R:["Coup d’envoi 13 h 38","Indoor, gymnase couvert"]},
    {hint:"Place réservée !",tap:[.5,.94],
     L:["Paiement validé","Apple Pay, deux tapes"],R:["Invite ta team","Un lien et c’est réglé"]},
    {hint:"Classement en direct",tap:[.83,.2],
     L:["Terrain 2 · En cours","Beach Boys 21–17"],R:["+1 place","Tu remontes 4ᵉ"]},
    {hint:"Le tableau se remplit",tap:null,
     L:["Quarts de finale","Beach Boys qualifiés"],R:["Finale à 17 h 30","Terrain central"]}
  ];
  var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  var imgs=[].slice.call(document.querySelectorAll("#screen img"));
  var tap=document.getElementById("tap"), hint=document.getElementById("hint");
  var dots=[].slice.call(document.querySelectorAll("#dots i"));
  var fL=document.getElementById("floatL"), fR=document.getElementById("floatR");
  var i=0, timers=[], visible=true, auto=!reduce;

  function setFloat(el,d){
    el.classList.add("swap");
    setTimeout(function(){el.querySelector("b").textContent=d[0];el.querySelector("span:not(.float-ico)").textContent=d[1];el.classList.remove("swap");},260);
  }
  function show(n,dir){
    var prev=i; i=(n+steps.length)%steps.length;
    imgs.forEach(function(im,k){
      im.classList.remove("is-reset");
      if(k===i){ if(dir<0){im.classList.add("is-reset");im.classList.remove("is-on");im.classList.add("is-past");void im.offsetWidth;im.classList.remove("is-reset");}
        im.classList.remove("is-past");im.classList.add("is-on"); }
      else if(k===prev){ im.classList.remove("is-on"); if(dir>0) im.classList.add("is-past"); else im.classList.remove("is-past"); }
      else { im.classList.add("is-reset"); im.classList.remove("is-on","is-past"); }
    });
    // Empilement : l'écran qui glisse par-dessus doit toujours être au premier plan
    // (sinon, en revenant du dernier au premier écran, l'entrant passait sous le sortant).
    imgs.forEach(function(im,k){im.style.zIndex=k===i?(dir<0?"2":"3"):k===prev?(dir<0?"3":"2"):"1";});
    hint.textContent=steps[i].hint;
    dots.forEach(function(d,k){d.classList.toggle("on",k===i);});
    setFloat(fL,steps[i].L); setFloat(fR,steps[i].R);
  }
  function clear(){timers.forEach(clearTimeout);timers=[];}
  function cycle(){
    clear(); if(!auto||!visible||document.hidden) return;
    var s=steps[i];
    timers.push(setTimeout(function(){
      if(s.tap){tap.style.left=(s.tap[0]*100)+"%";tap.style.top=(s.tap[1]*100)+"%";tap.classList.remove("go");void tap.offsetWidth;tap.classList.add("go");}
      timers.push(setTimeout(function(){show(i+1,1);cycle();}, s.tap?650:0));
    }, 2600));
  }
  document.getElementById("next").addEventListener("click",function(){show(i+1,1);cycle();});
  document.getElementById("prev").addEventListener("click",function(){show(i-1,-1);cycle();});
  document.addEventListener("visibilitychange",cycle);
  if("IntersectionObserver" in window){
    new IntersectionObserver(function(e){visible=e[0].isIntersecting;cycle();},{threshold:.25}).observe(document.getElementById("stage"));
  }
  cycle();

  if(reduce) return;
  var stage=document.getElementById("stage"), tilt=document.getElementById("tilt"), bg=document.getElementById("stageBg"), ticking=false, hover=false;
  tilt.addEventListener("pointerenter",function(e){if(e.pointerType==="mouse"){hover=true;onScroll();}});
  tilt.addEventListener("pointerleave",function(){hover=false;onScroll();});
  addEventListener("resize",function(){requestAnimationFrame(onScroll);});
  function onScroll(){
    ticking=false;
    var r=stage.getBoundingClientRect(), vh=innerHeight;
    var lay=hover?0:Math.min(1,Math.max(0,(r.top-.1*vh)/(.5*vh)));
    tilt.style.setProperty("--lay",lay.toFixed(3));
    var p=Math.min(1,Math.max(-1,(vh/2-(r.top+r.height/2))/vh));
    bg.style.transform="translateY("+(p*6).toFixed(2)+"%) scale(1.04)";
  }
  addEventListener("scroll",function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll);}},{passive:true});
  onScroll();
})();

(function(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches||!("IntersectionObserver" in window)) return;
  var groups=[
    [".showcase .chip, .card .chip, .facts li, .score, .orga-list small, .ticket, .poster","pop",110],
    [".section-head .display .hl, .feature-copy .display .hl, .rail-head .hl, .final .hl","stamp",0],
    [".step, .shot, .price, .faq-list details, .swap-row, .orga-list li, .card, .orga-photo, .final, .showcase .iphone, .jump a","rise",90]
  ];
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting) return;
      var el=e.target; el.classList.remove("reveal-pre"); el.classList.add("reveal-in"); io.unobserve(el);
      el.addEventListener("animationend",function(){el.classList.remove("reveal-in",el.dataset.rv);el.style.removeProperty("--d");},{once:true});
    });
  },{threshold:.18,rootMargin:"0px 0px -6% 0px"});
  var seen=new Set();
  groups.forEach(function(g){
    var els=[].slice.call(document.querySelectorAll(g[0]));
    var count=new Map();
    els.forEach(function(el){
      if(seen.has(el)) return; seen.add(el);
      if(el.getBoundingClientRect().top<innerHeight*.92) return;   // déjà visible au chargement : on n'y touche pas
      var k=count.get(el.parentNode)||0; count.set(el.parentNode,k+1);
      el.style.setProperty("--d",(Math.min(k,6)*g[2])+"ms");
      el.dataset.rv=g[1]; el.classList.add("reveal-pre",g[1]); io.observe(el);
    });
  });
})();

(function(){
  var QR_VALUE="https://appyamatch.fr/download/",QR_SIZE=268,QR_FG="#101828",QR_BG="#FFFFFF";
  var LOGO_HREF="assets/wordmark.svg",LOGO_ASPECT=1067.73/206.13,LOGO_WIDTH_RATIO=.42;
  var container=document.getElementById("qrWidgetCode"); if(!container) return;
  var widget=container.closest(".qr-widget");
  if(typeof window.qrcode!=="function"){widget.style.display="none";return;}
  var qr; try{qr=window.qrcode(0,"Q");qr.addData(QR_VALUE);qr.make();}catch(e){widget.style.display="none";return;}
  var n=qr.getModuleCount(),m=QR_SIZE/n,NS="http://www.w3.org/2000/svg";
  function el(tag,a){var e=document.createElementNS(NS,tag);for(var k in a)e.setAttribute(k,String(a[k]));return e;}
  var svg=el("svg",{viewBox:"0 0 "+QR_SIZE+" "+QR_SIZE,xmlns:NS});
  svg.appendChild(el("rect",{width:QR_SIZE,height:QR_SIZE,fill:QR_BG,rx:12,ry:12}));
  [[0,0],[0,n-7],[n-7,0]].forEach(function(p){
    var x=p[1]*m,y=p[0]*m;
    svg.appendChild(el("rect",{x:x,y:y,width:7*m,height:7*m,fill:QR_FG,rx:12,ry:12}));
    svg.appendChild(el("rect",{x:x+m,y:y+m,width:5*m,height:5*m,fill:QR_BG,rx:8,ry:8}));
    svg.appendChild(el("rect",{x:x+2*m,y:y+2*m,width:3*m,height:3*m,fill:QR_FG,rx:3,ry:3}));
  });
  function finder(r,c){return (r<7&&c<7)||(r<7&&c>=n-7)||(r>=n-7&&c<7);}
  for(var r=0;r<n;r++)for(var c=0;c<n;c++) if(qr.isDark(r,c)&&!finder(r,c)) svg.appendChild(el("circle",{cx:(c+.5)*m,cy:(r+.5)*m,r:m/3,fill:QR_FG}));
  var lw=QR_SIZE*LOGO_WIDTH_RATIO,lh=lw/LOGO_ASPECT,lx=(QR_SIZE-lw)/2,ly=(QR_SIZE-lh)/2,pp=m*1.5;
  svg.appendChild(el("rect",{x:lx-pp,y:ly-pp,width:lw+2*pp,height:lh+2*pp,rx:m*2,ry:m*2,fill:QR_BG}));
  svg.appendChild(el("image",{href:LOGO_HREF,x:lx,y:ly,width:lw,height:lh,preserveAspectRatio:"xMidYMid meet"}));
  container.innerHTML="";container.appendChild(svg);
})();
