'use strict';
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
function closeMenu(){nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Abrir menú');}
toggle.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('is-open')){closeMenu();toggle.focus();}});
if('IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('pending');observer.unobserve(entry.target);}}),{threshold:0.08});
  document.querySelectorAll('.section-head,.project,.service,.step,.price,.about-card,.about-copy').forEach(el=>{el.classList.add('reveal','pending');el.style.setProperty('--reveal-delay',`${Math.min([...el.parentElement.children].indexOf(el),3)*80}ms`);observer.observe(el);});
  document.body.classList.add('motion-ready');
}
const form=document.querySelector('form');
form.addEventListener('submit',e=>{if(location.protocol==='file:'||['localhost','127.0.0.1'].includes(location.hostname)){e.preventDefault();document.querySelector('#form-status').textContent='Esta es una vista previa: el formulario se activa al publicar en Netlify con Forms habilitado. Puedes escribirnos por WhatsApp.';}});

// Geometric connections inspired by the reference, with no copied assets.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const pauseButton=document.querySelector('.motion-toggle');
const hero=document.querySelector('.hero');
const canvas=document.querySelector('#connection-field');
const ctx=canvas.getContext('2d');
let paused=false, visible=true, frame=0, last=0, width=1,height=1,nodes=[];
const pointer={x:-1000,y:-1000};
let stains=[],lastStamp=0;
function active(){return !paused&&!reduced.matches&&visible&&!document.hidden;}
function draw(dt=0){
  if(!ctx)return;
  ctx.clearRect(0,0,width,height);
  // Translucent circles expand and dissolve behind the page content.
  stains=stains.filter(s=>s.life>0);
  for(const s of stains){
    s.life=Math.max(0,s.life-dt);s.radius+=(s.target-s.radius)*Math.min(1,dt*6);
    const opacity=.18*Math.pow(s.life/s.duration,1.4);
    ctx.beginPath();ctx.arc(s.x,s.y,s.radius,0,Math.PI*2);
    ctx.fillStyle=`rgba(161,217,108,${opacity})`;ctx.fill();
  }
  for(const p of nodes){
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    if(p.x<0||p.x>width){p.vx*=-1;p.x=Math.max(0,Math.min(width,p.x));}
    if(p.y<0||p.y>height){p.vy*=-1;p.y=Math.max(0,Math.min(height,p.y));}
  }
  const distance=width<600?125:180;
  for(let i=0;i<nodes.length;i++){
    const p=nodes[i];
    for(let j=i+1;j<nodes.length;j++){
      const q=nodes[j],d=Math.hypot(p.x-q.x,p.y-q.y);
      if(d<distance){ctx.strokeStyle=`rgba(197,237,150,${(1-d/distance)*.26})`;ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
    }
    const proximity=Math.max(0,1-Math.hypot(p.x-pointer.x,p.y-pointer.y)/240);
    const target=p.r+(active()?proximity*proximity*115:0);
    p.bubble+=(target-p.bubble)*Math.min(1,dt*7);
    ctx.beginPath();ctx.arc(p.x,p.y,p.bubble,0,Math.PI*2);
    ctx.fillStyle=p.bubble>8?'rgba(173,225,123,.22)':'rgba(197,237,150,.55)';ctx.fill();
  }
}
function tick(now){
  frame=0;if(!active())return;
  if(now-last>=32){const dt=last?Math.min((now-last)/1000,.06):0;last=now;draw(dt);}
  frame=requestAnimationFrame(tick);
}
function syncMotion(){
  cancelAnimationFrame(frame);frame=0;last=0;
  const stopped=paused||reduced.matches;
  if(stopped||!visible||document.hidden){stains=[];pointer.x=pointer.y=-1000;nodes.forEach(p=>p.bubble=p.r);}
  document.body.classList.toggle('motion-paused',stopped);
  pauseButton.textContent=stopped?'Activar animaciones':'Pausar animaciones';
  pauseButton.setAttribute('aria-pressed',String(stopped));
  pauseButton.disabled=reduced.matches;
  if(reduced.matches)pauseButton.textContent='Movimiento reducido';
  draw();if(ctx&&active())frame=requestAnimationFrame(tick);
}
function resizeField(){
  width=hero.clientWidth;height=hero.clientHeight;
  const dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  if(ctx)ctx.setTransform(dpr,0,0,dpr,0,0);
  stains=[];
  nodes=Array.from({length:width<600?26:55},()=>{const r=1+Math.random()*1.8;return {x:Math.random()*width,y:Math.random()*height,vx:(Math.random()-.5)*14,vy:(Math.random()-.5)*14,r,bubble:r};});
  draw();
}
pauseButton.hidden=false;
pauseButton.addEventListener('click',()=>{paused=!paused;syncMotion();});
hero.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse'||!active())return;
  const rect=hero.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
  const travelled=Math.hypot(x-pointer.x,y-pointer.y),now=performance.now();
  pointer.x=x;pointer.y=y;
  if(now-lastStamp>55&&travelled>3){
    lastStamp=now;
    stains.push({x,y,radius:14,target:65+Math.random()*65,life:1.35,duration:1.35});
    if(stains.length>16)stains.shift();
  }
},{passive:true});
hero.addEventListener('pointerleave',()=>{pointer.x=pointer.y=-1000;});
document.addEventListener('visibilitychange',syncMotion);
reduced.addEventListener('change',syncMotion);
if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;syncMotion();}).observe(hero);
if('ResizeObserver' in window)new ResizeObserver(resizeField).observe(hero);else window.addEventListener('resize',resizeField,{passive:true});
if(!reduced.matches)document.body.classList.add('entry-ready');
resizeField();syncMotion();
const header=document.querySelector('header');
function updateHeader(){header.classList.toggle('scrolled',scrollY>30);}
window.addEventListener('scroll',updateHeader,{passive:true});updateHeader();
