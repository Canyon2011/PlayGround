(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const starters = [
    {id:'tinwhistle',name:'TIN WHISTLE',type:'POCKET PISTOL',damage:24,rate:58,ammo:12,accuracy:83,color:'#d4fc57',model:0,tag:'SEMI-AUTO'},
    {id:'yardstick',name:'YARDSTICK',type:'PIPE SHOTGUN',damage:48,rate:35,ammo:5,accuracy:62,color:'#ff8a5c',model:1,tag:'SPREAD'},
    {id:'stapler',name:'THE STAPLER',type:'NAIL SMG',damage:13,rate:90,ammo:24,accuracy:74,color:'#77d9cf',model:2,tag:'FULL AUTO'},
    {id:'longboy',name:'LONG BOY',type:'WOBBLY RIFLE',damage:39,rate:43,ammo:8,accuracy:91,color:'#b9a2ff',model:3,tag:'PRECISION'},
    {id:'belcher',name:'BELCHER 3000',type:'JUNK CANNON',damage:62,rate:24,ammo:3,accuracy:57,color:'#ffce5c',model:4,tag:'BIG BOOM'},
    {id:'spoon',name:'SPOON GUN',type:'SUSPICIOUS OBJECT',damage:19,rate:70,ammo:10,accuracy:78,color:'#f783ba',model:5,tag:'UNTESTED'}
  ];
  const adjectives=['UNHOLY','SLIGHTLY DAMP','COSMIC','BADLY SEWN','SENTIENT','OVERCOOKED','HAUNTED','RADIOACTIVE','ILLEGAL','WEEPY','SIDEWAYS','FERAL','UNLICENSED','GLITTERY','ANXIOUS','BEES'];
  const nouns=['WIDOWMAKER','SOUP MAKER','MOON TOASTER','GOBLIN','TROUBLE','BONE HARP','TAX AUDIT','WORMHOLE','BIRD CALLER','PANIC BUTTON','BEEF WIZARD','NIGHT LIGHT','NOODLE','GRIEF MACHINE','MYSTERY','BAD DECISION'];
  const types=['PLASMA TROMBONE','HAUNTED BLUNDERBUSS','WORMHOLE DISPENSER','ANGRY NAIL PRINTER','SOUP-POWERED RIFLE','BEES IN A TUBE','COSMIC POCKET CANNON','UNSTABLE BEAN THROWER','REVERSE SHOTGUN','GHOST-OPERATED MUSKET','TACTICAL BONE HARP','UNLICENSED LASER'];
  const mutations=[
    ['IT hums show tunes when it gets nervous.','Every shot files a small complaint with the moon.','The barrel is technically a wormhole. Nobody knows where the other end is.','A tiny ghost works the safety. It is not very safety-conscious.','It fires bullets with the confidence of much larger bullets.','Smells faintly of wet pennies and destiny.','Makes a noise like a printer jamming in another dimension.','Somewhere inside, a bee has been promoted to captain.'],
    ['Enemies hit by it briefly remember their childhood bedroom.','Recoil can only be described as “emotionally complicated.”','The sights are decorative. The vibes are extremely accurate.','It has more moving parts than a small town.','Its manual is a single damp napkin.','Scientists say it should not work. The gun disagrees.','It becomes slightly warmer when you tell it a secret.','There is a spoon in there. It is load-bearing.']
  ];
  const rarityTable=[{name:'COMMON(ISH)',color:'#d4fc57',weight:53,mult:1},{name:'ODDITY',color:'#67d9c8',weight:28,mult:1.12},{name:'VERY ILLEGAL',color:'#b9a2ff',weight:14,mult:1.28},{name:'WHAT IS THAT',color:'#ff805f',weight:5,mult:1.5}];
  let inventory=[...starters], collection=[], slotA=null, slotB=null, activeGun=inventory[0], pendingResult=null;
  let scrap=240, score=0, ammo=0, reloading=false, lastShot=0, toastTimer, lastFrame=0;
  const canvas=$('#range-canvas'), ctx=canvas.getContext('2d'), targetList=[], particles=[], tracers=[];
  let cw=1,ch=1,dpr=1, pointer={x:-100,y:-100}, lastTimestamp=0, running=true;
  const escapeHtml=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rand=(a)=>a[Math.floor(Math.random()*a.length)];
  const randInt=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function weaponSVG(w){
    const c=w.color || '#d4fc57';
    const base=`<svg viewBox="0 0 140 70" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(w.name)}"><g fill="currentColor" stroke="#141516" stroke-width="2" stroke-linejoin="round">`;
    const forms=[
      '<path d="M22 24h69l10 8v9H70l-3 19H47l2-19H29l-7-7z"/><path d="M40 23l4-9h29l8 9z"/><path d="M88 28h37v8H99z"/><circle cx="30" cy="36" r="3" fill="#222"/><path d="M59 42h6v7h-6z" fill="#f1eddf"/>',
      '<path d="M18 28h62l13 7v9H64l-4 17H41l2-17H25z"/><path d="M25 25h13l-2-12H22zM44 25h13l-1-12H41zM63 25h13l-1-12H60z"/><path d="M81 29h43v9H91z"/><path d="M77 26l8-5h13l-3 8z"/>',
      '<path d="M18 27h83l8 8v10H70l-4 17H44l2-17H25z"/><path d="M29 22h19v6H29zM52 22h18v6H52zM76 22h18v6H76z"/><path d="M99 31h29v8h-25z"/><path d="M92 27l8-9 10 5-6 7z"/>',
      '<path d="M19 24h78v11h-8v11H70l-4 16H43l3-16H25l-8-8z"/><path d="M29 18h61v7H29z"/><path d="M93 27h34v6H96z"/><path d="M53 18h5v7h-5zM67 18h5v7h-5zM81 18h5v7h-5z"/>',
      '<path d="M16 28h77l10 11v9H71l-4 14H43l3-14H25z"/><path d="M28 17h48l12 11H27z"/><path d="M87 31h43v11H99z"/><path d="M40 21l-7-11 13 5 5-11 7 11 12-7-5 13z" fill="#f1eddf"/>',
      '<path d="M21 25h70l7 10v10H68l-3 16H43l3-16H25l-7-9z"/><path d="M28 19q8-11 16 0t16 0t16 0t16 0v7H28z"/><path d="M91 29h39v9H98z"/><path d="M31 34q5-4 10 0M75 34q5-4 10 0" fill="none" stroke="#f1eddf" stroke-width="3"/>'
    ];
    return base+`<g style="color:${c}">${forms[(w.model||0)%forms.length]}</g><circle cx="113" cy="45" r="2" fill="${c}"/><path d="M10 63h120" stroke="#ffffff1b" stroke-width="1"/></g></svg>`;
  }
  function cardMarkup(w){
    return `<div class="weapon-card ${activeGun?.id===w.id?'equipped':''}" data-id="${escapeHtml(w.id)}" style="--weapon:${w.color}" tabindex="0" role="group" aria-label="${escapeHtml(w.name)}. Select test to equip or plus to use in fusion."><span class="gun-icon">${weaponSVG(w)}</span><span class="weapon-copy"><span class="weapon-name">${escapeHtml(w.name)}</span><span class="weapon-type">${escapeHtml(w.type)}</span><span class="weapon-statline"><i style="width:${clamp(w.damage,10,75)/75*100}%"></i></span></span><button class="card-check" type="button" title="Add ${escapeHtml(w.name)} to fusion">+</button></div>`;
  }
  function drawSlots(){
    const draw=(id,w,which)=>{const el=$(id);if(!w){el.classList.remove('filled');el.style.removeProperty('--slot-color');el.innerHTML=`<span class="slot-label">INPUT ${which}</span><span class="slot-plus">+</span><span class="slot-hint">SELECT A GUN</span>`;return}el.classList.add('filled');el.style.setProperty('--slot-color',w.color);el.innerHTML=`<span class="slot-label">INPUT ${which}</span><span class="remove-slot" title="Remove">×</span><span class="slot-gun-name">${escapeHtml(w.name)}</span><span class="slot-gun-type">${escapeHtml(w.type)}</span>`;};
    draw('#slot-a',slotA,'A');draw('#slot-b',slotB,'B');$('#combine-btn').disabled=!(slotA&&slotB);
  }
  function renderInventory(){
    $('#weapon-list').innerHTML=inventory.map(cardMarkup).join('');
    $('#gun-count').textContent=String(inventory.length).padStart(2,'0');
    document.querySelectorAll('.weapon-card').forEach(el=>{
      const w=inventory.find(x=>x.id===el.dataset.id);
      el.addEventListener('click',(e)=>{if(e.target.closest('.card-check'))return;equip(w)});
      el.addEventListener('keydown',(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();equip(w)}});
      el.querySelector('.card-check').addEventListener('click',(e)=>{e.stopPropagation();assignSlot(w)});
    });
    drawSlots();
  }
  function renderCollection(){
    $('#collection-count').textContent=String(collection.length).padStart(2,'0');
    $('#best-rarity').textContent=collection.length?collection.reduce((best,w)=>w.rarityRank>best.rarityRank?w:best,collection[0]).rarity:'NOTHING ILLEGAL (YET)';
    $('#collection-list').innerHTML=collection.length?collection.map(w=>`<div class="collection-card ${activeGun?.id===w.id?'active':''}" data-id="${escapeHtml(w.id)}" style="--weapon:${w.color}" tabindex="0" role="button" title="Click to equip"><span class="gun-icon">${weaponSVG(w)}</span><span><strong>${escapeHtml(w.name)}</strong><small>${escapeHtml(w.type)}</small><span class="saved-tag">✳ ${escapeHtml(w.rarity||'FUSED')}</span></span></div>`).join(''):'<div class="empty-collection"><span>✳</span> NOTHING HERE BUT BAD DECISIONS. MAKE ONE.</div>';
    document.querySelectorAll('.collection-card').forEach(el=>{const w=collection.find(x=>x.id===el.dataset.id);el.addEventListener('click',()=>equip(w));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();equip(w)}})});
  }
  function assignSlot(w){
    if(slotA?.id===w.id){slotA=null;notify('INPUT A CLEARED.');}
    else if(slotB?.id===w.id){slotB=null;notify('INPUT B CLEARED.');}
    else if(!slotA){slotA=w;notify(`${w.name} LOADED INTO INPUT A.`)}
    else if(!slotB){slotB=w;notify(`${w.name} LOADED INTO INPUT B.`)}
    else {slotA=slotB;slotB=w;notify('INPUTS ROTATED. OLDEST GUN EJECTED.')}
    drawSlots();
  }
  function equip(w){
    if(!w)return;activeGun=w;ammo=w.ammo;reloading=false;$('#range-overlay').classList.add('hidden');$('#reload-btn').disabled=false;$('#range-weapon-label').textContent=`${w.name} // ${w.tag||'TESTING'}`;updateHUD();renderInventory();renderCollection();notify(`${w.name} EQUIPPED. GO MAKE A DENT.`);
  }
  function updateHUD(){$('#ammo-value').textContent=activeGun?`${String(ammo).padStart(2,'0')} / ${activeGun.ammo}`:'— / —';$('#score-value').textContent=String(score).padStart(3,'0');$('#scrap-count').textContent=scrap;}
  function notify(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2100)}
  function chooseRarity(){let n=Math.random()*100;for(const r of rarityTable){n-=r.weight;if(n<=0)return r}return rarityTable[0]}
  function combine(){
    if(!slotA||!slotB)return;
    const a=slotA,b=slotB,r=chooseRarity(),rawName=`${rand(adjectives)} ${rand(nouns)}`;
    const damage=clamp(Math.round((a.damage+b.damage)/2*r.mult+randInt(-7,10)),12,82);
    const newGun={id:`fusion-${Date.now()}-${Math.floor(Math.random()*9999)}`,name:rawName,type:rand(types),damage,rate:clamp(Math.round((a.rate+b.rate)/2+randInt(-18,20)),20,100),ammo:clamp(Math.round((a.ammo+b.ammo)/2+randInt(-3,4)),3,30),accuracy:clamp(Math.round((a.accuracy+b.accuracy)/2+randInt(-20,17)),35,98),color:rand([a.color,b.color,'#d4fc57','#ff805f','#b9a2ff','#67d9c8','#f783ba']),model:randInt(0,5),tag:rand(['HYBRID','UNSAFE','LIVE TEST','DO NOT LICK','FUSION CLASS']),rarity:r.name,rarityRank:rarityTable.indexOf(r)+1,description:rand(mutations[0])+' '+rand(mutations[1]),parentNames:[a.name,b.name]};
    pendingResult=newGun;const out=$('#output-slot');out.classList.remove('has-result');out.style.setProperty('--result-color',newGun.color);
    out.innerHTML=`<div class="result-weapon"><span class="gun-icon">${weaponSVG(newGun)}</span><div><div class="result-name">${escapeHtml(newGun.name)}</div><div class="result-type">${escapeHtml(newGun.type)}</div><span class="result-badge" style="color:${newGun.color}">${escapeHtml(r.name)}</span></div></div>`;
    void out.offsetWidth;out.classList.add('has-result');
    $('#modal-art').innerHTML=weaponSVG(newGun);$('#modal-art').style.color=newGun.color;$('#modal-rarity').textContent=r.name;$('#modal-rarity').style.color=r.color;$('#discovery-title').textContent=newGun.name;$('#discovery-title').style.color=newGun.color;$('#modal-description').textContent=`A ${newGun.type.toLowerCase()} assembled from ${a.name} + ${b.name}. ${newGun.description}`;
    $('#modal-stats').innerHTML=[['DAMAGE',newGun.damage],['CAPACITY',newGun.ammo],['ACCURACY',`${newGun.accuracy}%`]].map(([l,v])=>`<div class="modal-stat"><b>${v}</b><small>${l}</small></div>`).join('');
    $('#modal-backdrop').hidden=false;document.body.style.overflow='hidden';
    playFusionSound();
  }
  function keepResult(){
    if(!pendingResult)return;
    const w=pendingResult;collection.unshift(w);inventory.unshift(w);pendingResult=null;$('#modal-backdrop').hidden=true;document.body.style.overflow='';slotA=null;slotB=null;renderInventory();renderCollection();equip(w);notify(`${w.name} ADDED TO THE BONEYARD. SCIENCE!`);
  }
  function resize(){const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;dpr=Math.min(window.devicePixelRatio||1,2);cw=rect.width;ch=rect.height;canvas.width=Math.round(cw*dpr);canvas.height=Math.round(ch*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);if(!targetList.length)spawnTargets();}
  function spawnTargets(){targetList.length=0;for(let i=0;i<3;i++){targetList.push({x:cw*(.2+i*.3),y:ch*(.35+Math.random()*.23),phase:Math.random()*6.2,speed:.45+Math.random()*.7,r:15+Math.random()*5,alive:true});}}
  function background(){
    const grad=ctx.createLinearGradient(0,0,0,ch);grad.addColorStop(0,'#262b2c');grad.addColorStop(.63,'#313536');grad.addColorStop(.64,'#262725');grad.addColorStop(1,'#191a1b');ctx.fillStyle=grad;ctx.fillRect(0,0,cw,ch);
    ctx.fillStyle='#242728';ctx.fillRect(0,ch*.63,cw,ch*.37);
    for(let i=0;i<9;i++){let x=i*cw/7-20, h=20+(i*29%60);ctx.fillStyle=i%2?'#292d2e':'#2b2e2f';ctx.fillRect(x,ch*.63-h,32,h);ctx.fillStyle='#73715c';for(let j=0;j<3;j++)ctx.fillRect(x+6+j*8,ch*.63-h+8,2,2)}
    ctx.strokeStyle='#4b4d43';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,ch*.63);ctx.lineTo(cw,ch*.63);ctx.stroke();
    for(let i=1;i<=5;i++){let y=ch*.63+i*i*ch*.012;ctx.strokeStyle=`rgba(190,190,145,${.11-i*.013})`;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(cw,y);ctx.stroke()}
    ctx.strokeStyle='#70715e';ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(cw*.08,ch*.82);ctx.lineTo(cw*.92,ch*.82);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#8c8a67';ctx.font=`${Math.max(7,cw*.023)}px monospace`;ctx.fillText('KEEP OUT',8,ch*.61);
  }
  function drawTarget(t,now){
    const bob=Math.sin(now*.001*t.speed+t.phase)*5,x=t.x+Math.sin(now*.0005*t.speed+t.phase)*cw*.025,y=t.y+bob,r=t.r;
    ctx.save();ctx.translate(x,y);
    ctx.fillStyle='#454840';ctx.fillRect(-2,r*.65,4,r*1.35);ctx.fillStyle='#626558';ctx.fillRect(-9,r*1.9,18,3);
    ctx.fillStyle='#d4fc57';ctx.strokeStyle='#18201b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#292d29';ctx.beginPath();ctx.arc(-r*.34,-r*.1,r*.14,0,6.3);ctx.arc(r*.34,-r*.1,r*.14,0,6.3);ctx.fill();
    ctx.strokeStyle='#292d29';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,r*.18,r*.25,0,Math.PI);ctx.stroke();
    ctx.strokeStyle='#f7ffae';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,r-2,-Math.PI*.85,-Math.PI*.35);ctx.stroke();ctx.restore();t.drawX=x;t.drawY=y;
  }
  function animate(now){if(!running)return;requestAnimationFrame(animate);if(now-lastFrame<28)return;lastFrame=now;
    if(!cw||!ch)return;ctx.clearRect(0,0,cw,ch);background();
    targetList.forEach(t=>drawTarget(t,now));
    tracers.forEach((tr,i)=>{const life=(now-tr.time)/170;if(life>=1){tracers.splice(i,1);return}ctx.strokeStyle=`rgba(255,${Math.floor(230-life*100)},105,${1-life})`;ctx.lineWidth=2-life;ctx.beginPath();ctx.moveTo(cw*.5,ch+3);ctx.lineTo(tr.x,tr.y);ctx.stroke();ctx.fillStyle=`rgba(255,245,190,${1-life})`;ctx.beginPath();ctx.arc(tr.x,tr.y,3+life*3,0,6.3);ctx.fill()});
    particles.forEach((p,i)=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.12;p.life-=.025;if(p.life<=0){particles.splice(i,1);return}ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3)});ctx.globalAlpha=1;
    if(pointer.x>=0){ctx.strokeStyle='#e7e8d1b0';ctx.lineWidth=1;ctx.beginPath();ctx.arc(pointer.x,pointer.y,7,0,6.3);ctx.moveTo(pointer.x-12,pointer.y);ctx.lineTo(pointer.x-4,pointer.y);ctx.moveTo(pointer.x+4,pointer.y);ctx.lineTo(pointer.x+12,pointer.y);ctx.moveTo(pointer.x,pointer.y-12);ctx.lineTo(pointer.x,pointer.y-4);ctx.moveTo(pointer.x,pointer.y+4);ctx.lineTo(pointer.x,pointer.y+12);ctx.stroke()}
  }
  function shoot(x,y){
    if(!activeGun){notify('NO GUN. THIS IS A VERY POOR TEST.');return}
    const now=performance.now();if(reloading)return;if(now-lastShot<Math.max(100,95000/activeGun.rate))return;lastShot=now;
    if(ammo<=0){notify('CLICK. RELOAD WITH R.');return}ammo--;updateHUD();tracers.push({x,y,time:now});
    const spread=(100-activeGun.accuracy)*.7+5;
    const target=[...targetList].reverse().find(t=>Math.hypot((t.drawX||t.x)-x,(t.drawY||t.y)-y)<t.r+spread);
    if(target){const idx=targetList.indexOf(target), tx=target.drawX||target.x,ty=target.drawY||target.y;for(let i=0;i<11;i++)particles.push({x:tx,y:ty,vx:(Math.random()-.5)*5,vy:(Math.random()-.5)*5-1,life:.7+Math.random()*.3,color:rand(['#d4fc57','#ff805f','#fff2c0'])});
      score+=Math.max(3,Math.round(activeGun.damage/8));scrap+=Math.max(3,Math.round(activeGun.damage/8));updateHUD();targetList.splice(idx,1);targetList.push({x:cw*(.14+Math.random()*.72),y:ch*(.3+Math.random()*.27),phase:Math.random()*6,speed:.5+Math.random(),r:15+Math.random()*6,alive:true});$('#hit-flash').classList.remove('flash');void $('#hit-flash').offsetWidth;$('#hit-flash').classList.add('flash');
    }
  }
  function reload(){if(!activeGun||reloading||ammo===activeGun.ammo)return;reloading=true;$('#reload-btn').disabled=true;$('#range-weapon-label').textContent='RELOADING / STAND BY';notify('RELOADING. TRY NOT TO PANIC.');setTimeout(()=>{if(!activeGun)return;ammo=activeGun.ammo;reloading=false;$('#reload-btn').disabled=false;$('#range-weapon-label').textContent=`${activeGun.name} // ${activeGun.tag||'TESTING'}`;updateHUD()},700+Math.max(0,22-activeGun.ammo)*23)}
  function playFusionSound(){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;const ac=new AC(),osc=ac.createOscillator(),gain=ac.createGain();osc.type='sawtooth';osc.frequency.setValueAtTime(110,ac.currentTime);osc.frequency.exponentialRampToValueAtTime(620,ac.currentTime+.16);osc.frequency.exponentialRampToValueAtTime(190,ac.currentTime+.46);gain.gain.setValueAtTime(.09,ac.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.5);osc.connect(gain);gain.connect(ac.destination);osc.start();osc.stop(ac.currentTime+.5);setTimeout(()=>ac.close(),650)}catch(_){}}
  function setup(){
    activeGun=inventory[0];ammo=activeGun.ammo;$('#range-overlay').classList.add('hidden');$('#reload-btn').disabled=false;$('#range-weapon-label').textContent=`${activeGun.name} // ${activeGun.tag}`;
    renderInventory();renderCollection();updateHUD();resize();requestAnimationFrame(animate);
    $('#weapon-list').addEventListener('click',()=>{});
    $('#slot-a').addEventListener('click',()=>{if(slotA){slotA=null;drawSlots();notify('INPUT A CLEARED.');}});
    $('#slot-b').addEventListener('click',()=>{if(slotB){slotB=null;drawSlots();notify('INPUT B CLEARED.');}});
    $('#combine-btn').addEventListener('click',combine);$('#take-it-btn').addEventListener('click',keepResult);
    $('#modal-close').addEventListener('click',()=>{$('#modal-backdrop').hidden=true;document.body.style.overflow='';});
    $('#modal-backdrop').addEventListener('click',e=>{if(e.target.id==='modal-backdrop'){$('#modal-backdrop').hidden=true;document.body.style.overflow=''}});
    $('#reload-btn').addEventListener('click',reload);
    $('#shuffle-btn').addEventListener('click',()=>{if(collection.length){notify('THE BONEYARD IS FULL OF YOUR QUESTIONABLE WORK.');return}inventory=[...starters];slotA=slotB=null;renderInventory();notify('STARTER STOCK RESTOCKED.')} );
    canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();pointer={x:e.clientX-r.left,y:e.clientY-r.top}});
    canvas.addEventListener('pointerleave',()=>pointer={x:-100,y:-100});
    canvas.addEventListener('pointerdown',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();shoot(e.clientX-r.left,e.clientY-r.top)});
    window.addEventListener('resize',resize);
    window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r'){reload()}if(e.code==='Space'&&!$('#modal-backdrop').hidden){return}if(e.code==='Space'&&activeGun){e.preventDefault();shoot(pointer.x<0?cw*.5:pointer.x,pointer.y<0?ch*.5:pointer.y)}if(e.key==='Escape'&&!$('#modal-backdrop').hidden){$('#modal-backdrop').hidden=true;document.body.style.overflow=''}});
    window.addEventListener('pagehide',()=>{running=false});
    $('#range-screen').addEventListener('touchstart',()=>{}, {passive:true});
  }
  setup();
})();
