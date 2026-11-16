/* STONE — Ashfall | Original browser action RPG. No build step or runtime dependencies. */
(function () {
'use strict';
const $ = id => document.getElementById(id);
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const rnd = (a,b) => a + Math.random()*(b-a);
const choose = a => a[Math.floor(Math.random()*a.length)];
const escapeHTML = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let seed=73417;
function srnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
const CLASSES={
 vanguard:{name:'Vanguard',glyph:'⚔',range:75,base:11,hp:132,mana:75,speed:185,skills:[['Cleave','✥',22,5],['Iron Rush','➤',18,8],['War Cry','☼',30,24]],desc:'An unbreakable blade in a broken world.'},
 wayfinder:{name:'Wayfinder',glyph:'➶',range:285,base:9,hp:102,mana:95,speed:206,skills:[['Splitshot','➶',22,5],['Shadowstep','➤',17,7],['Arrow Rain','✷',33,19]],desc:'Strike from the shadows. Never stand still.'},
 arcanist:{name:'Arcanist',glyph:'✦',range:265,base:12,hp:89,mana:128,speed:190,skills:[['Rune Burst','✧',25,5],['Phase Shift','◇',19,7],['Starfall','✺',37,21]],desc:'The old magic has not forgotten its name.'}
};
const SLOTS=['weapon','armor','helm','boots','ring'];
const SLOT_ICONS={weapon:'⚔',armor:'♜',helm:'♛',boots:'⬖',ring:'◈'};
const RARITIES=['common','magic','rare','epic','legendary'];
const RARITY_MULT=[1,1.35,1.9,2.75,4.1];
const PREFIX={common:['Worn','Old','Traveler\'s','Rough','Rustmarked'],magic:['Glimmering','Enchanted','Seeker\'s','Frostbound','Stalwart'],rare:['Runecarved','Sunforged','Duskcaller\'s','Stormborn','Hollowbane'],epic:['Eclipse','Kingslayer\'s','Fatesworn','Dreadfire','Moonshattered'],legendary:['Ashbringer','Oathkeeper','Soulwake','Worldshard','The Last Dawn']};
const BASES={weapon:{vanguard:['Longsword','Waraxe','Greatblade'],wayfinder:['Hunting Bow','Longbow','Recurve'],arcanist:['Runestaff','Spellbranch','Wand']},armor:['Cuirass','Vestment','Mail','Coat'],helm:['Visage','Hood','Helm','Cowl'],boots:['Greaves','Treads','Boots'],ring:['Band','Signet','Loop']};
const TALENTS=[
 {id:'fury',icon:'⚔',title:'Unrelenting',desc:'Increase all damage by 6% per rank.',max:5},
 {id:'bulwark',icon:'♜',title:'Stoneheart',desc:'Increase maximum health by 7% per rank.',max:5},
 {id:'haste',icon:'➶',title:'Quick Hands',desc:'Attack 7% faster per rank.',max:5},
 {id:'arcana',icon:'✧',title:'Deep Wells',desc:'Increase mana regeneration by 15% per rank.',max:5},
 {id:'fortune',icon:'◈',title:'Treasure Hunter',desc:'Improve the chance of rare equipment drops.',max:5}
];
const MAPS={wild:{w:2600,h:1740,label:'Hollowvale',subtitle:'THE LAST LIGHT BEFORE THE WILDS'},crypt:{w:1750,h:1220,label:'The Weeping Crypt',subtitle:'BENEATH THE BROKEN EARTH'}};
const NPCS=[
 {id:'warden',x:394,y:708,name:'Warden Kael',role:'KEEPER OF HOLLOWVALE',icon:'♜',color:'#c8aa77'},
 {id:'smith',x:605,y:918,name:'Master Orin',role:'WEAPONSMITH & TRADER',icon:'⚒',color:'#d2a471'},
 {id:'healer',x:233,y:935,name:'Sister Anwen',role:'WARDEN OF THE FLAME',icon:'✚',color:'#8fcbb3'}
];
const PORTALS={wild:{x:2056,y:313,name:'CRYPT ENTRANCE',to:'crypt'},crypt:{x:157,y:1025,name:'HOLLOWVALE GATE',to:'wild'}};
const MOB={
 wolf:{name:'Ash Wolf',hp:47,dmg:7,speed:92,radius:18,xp:21,color:'#b7a58c',reach:28},
 skeleton:{name:'Bonewalker',hp:59,dmg:8,speed:69,radius:20,xp:27,color:'#c6c1a3',reach:29},
 cultist:{name:'Hollow Cultist',hp:72,dmg:10,speed:78,radius:20,xp:32,color:'#a882b3',reach:31},
 brute:{name:'Stone Ravager',hp:122,dmg:13,speed:61,radius:27,xp:50,color:'#c69070',reach:40},
 boss:{name:'Varrik, the Ashbound',hp:730,dmg:18,speed:67,radius:41,xp:380,color:'#e6a66b',reach:53},
 wraith:{name:'Crypt Wraith',hp:90,dmg:12,speed:100,radius:20,xp:40,color:'#8bbdbe',reach:34},
 guardian:{name:'Grave Sentinel',hp:144,dmg:14,speed:66,radius:26,xp:55,color:'#b1b2be',reach:38},
 cryptBoss:{name:'The Hollow King',hp:1070,dmg:25,speed:77,radius:46,xp:580,color:'#bf94dd',reach:60}
};
let hero=null,zone='wild',selectedClass='vanguard',selectedColor='#5fae98',panel=null,selectedItem=0,selectedEquip=null;
let enemies=[],drops=[],particles=[],floats=[],effects=[],decors={},spawns={},camera={x:0,y:0},mouse={x:0,y:0,worldX:0,worldY:0,down:false},keys={},targetId=null,moveTo=null;
let now=0,last=0,nextId=1,saveTimer=0,uiTimer=0,minimapTimer=0,zoneTitleUntil=0,attackTimer=0,skillCd={q:0,e:0,r:0,potion:0},buffUntil=0,dodgeUntil=0,interactQueued=null,feed=[],audioCtx=null,appStarted=false;
const canvas=$('scene'),ctx=canvas.getContext('2d'),minimap=$('minimap'),mctx=minimap.getContext('2d');
let view={w:1100,h:750},dpr=1;
function log(msg,type='normal'){feed.unshift({msg,time:now,type});feed=feed.slice(0,5);$('eventFeed').innerHTML=feed.map(f=>'<div class="feed-line '+f.type+'">'+escapeHTML(f.msg)+'</div>').join('');}
function toast(msg){const el=document.createElement('div');el.className='toast';el.textContent=msg;$('toasts').prepend(el);setTimeout(()=>el.remove(),3400);}
function tone(freq=440,vol=.022,duration=.09){
 if(!hero || !hero.settings.sound)return;
 try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioCtx=audioCtx||new AC();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='triangle';o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(80,freq*.55),audioCtx.currentTime+duration);g.gain.setValueAtTime(vol,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);}catch(e){}
}
function makeItem(level,rarity,slot,starter=false){
 level=Math.max(1,Math.floor(level));slot=slot||choose(SLOTS);
 if(!rarity){let n=rnd(0,100)-(hero?hero.talents.fortune*2.4:0);rarity=n<1.8?'legendary':n<8?'epic':n<24?'rare':n<53?'magic':'common';}
 const t=RARITIES.indexOf(rarity),mult=RARITY_MULT[t],base=slot==='weapon'?choose(BASES.weapon[hero?hero.cls:'vanguard']):choose(BASES[slot]);
 const name=choose(PREFIX[rarity])+' '+base;
 const stats={attack:0,armor:0,hp:0,crit:0,haste:0};
 if(slot==='weapon')stats.attack=Math.round((5+level*2.9)*mult*rnd(.88,1.13));
 if(slot==='armor') {stats.armor=Math.round((3+level*1.7)*mult);stats.hp=Math.round((7+level*3)*mult);}
 if(slot==='helm'){stats.armor=Math.round((2+level*1.2)*mult);stats.hp=Math.round((3+level*2)*mult);}
 if(slot==='boots'){stats.armor=Math.round((1+level*.95)*mult);stats.haste=Math.round((1+level*.45)*mult);}
 if(slot==='ring'){stats.crit=Math.round((1+level*.7)*mult);stats.attack=Math.round((1+level*.8)*mult);}
 if(t>=2){const bonuses=['attack','armor','hp','crit','haste'];const b=choose(bonuses);stats[b]+=Math.round((b==='hp'?6:2)*mult+level*(b==='hp'?2:.6));}
 if(t===4){stats.hp+=18+level*4;stats.attack+=5+level;stats.crit+=4;}
 return {id:Math.floor(rnd(1,1e9)),slot,rarity,level,name,stats,icon:slot==='weapon'?(hero&&hero.cls==='wayfinder'?'➶':hero&&hero.cls==='arcanist'?'⚚':'⚔'):SLOT_ICONS[slot],value:Math.round((8+level*7)*mult*mult),starter};
}
function baseSave(name,cls,tint){
 const p={name,cls,tint,zone:'wild',x:432,y:844,level:1,xp:0,gold:80,attr:{might:4,vitality:4,agility:4,spirit:4},attrPoints:0,talentPoints:0,talents:{fury:0,bulwark:0,haste:0,arcana:0,fortune:0},inventory:[],equip:{weapon:null,armor:null,helm:null,boots:null,ring:null},potions:5,quest:{stage:0,kills:0,shards:0,cryptKills:0},settings:{sound:true,damage:true,autoAttack:true,shake:true},kills:0};
 hero=p;p.equip.weapon=makeItem(1,'common','weapon',true);p.equip.armor=makeItem(1,'common','armor',true);p.inventory.push(makeItem(1,'magic','ring'));
 const st=stats();p.hp=st.hp;p.mana=st.mana;return p;
}
function stats(){
 const h=hero;let gear={attack:0,armor:0,hp:0,crit:0,haste:0};
 for(const s of SLOTS){const item=h.equip[s];if(item)for(const k of Object.keys(gear))gear[k]+=(item.stats[k]||0);}
 const c=CLASSES[h.cls];
 return {attack:c.base+h.attr.might*1.8+gear.attack+h.level*1.65,armor:Math.round(h.attr.vitality*.7+gear.armor),hp:Math.round((c.hp+h.level*10+h.attr.vitality*12+gear.hp)*(1+h.talents.bulwark*.07)),mana:Math.round(c.mana+h.level*4+h.attr.spirit*9),crit:clamp(5+h.attr.agility*.6+gear.crit,5,65),haste:1+gear.haste*.012+h.talents.haste*.07,speed:c.speed+h.attr.agility*1.7};
}
function needXp(){return Math.round(60+hero.level*47+hero.level*hero.level*9);}
function awardXp(amount){hero.xp+=amount;while(hero.xp>=needXp()){hero.xp-=needXp();hero.level++;hero.attrPoints+=3;hero.talentPoints++;const st=stats();hero.hp=st.hp;hero.mana=st.mana;toast('LEVEL '+hero.level+' — YOUR POWER GROWS');log('Level '+hero.level+' reached! +3 attributes, +1 talent','quest');tone(680,.05,.27);}refreshHUD();save();}
function load(){try{const s=JSON.parse(localStorage.getItem('stone-save-v1'));if(s&&CLASSES[s.cls]&&s.attr&&s.quest&&s.equip){s.settings=Object.assign({sound:true,damage:true,autoAttack:true,shake:true},s.settings||{});s.talents=Object.assign({fury:0,bulwark:0,haste:0,arcana:0,fortune:0},s.talents||{});s.inventory=Array.isArray(s.inventory)?s.inventory:[];s.potions=s.potions??5;hero=s;zone=s.zone==='crypt'?'crypt':'wild';return true;}}catch(e){}return false;}
function save(){if(!hero)return;try{localStorage.setItem('stone-save-v1',JSON.stringify(hero));$('saveStatus').textContent='● PROGRESS SAVED LOCALLY';}catch(e){$('saveStatus').textContent='⚠ SAVING BLOCKED';}}
function start(){if(!hero)return;appStarted=true;$('splash').classList.add('hidden');$('game').classList.remove('hidden');zone=hero.zone||'wild';$('hudName').textContent=hero.name;$('hudClass').textContent=CLASSES[hero.cls].name.toUpperCase()+' · LV '+hero.level;$('heroPortrait').textContent=CLASSES[hero.cls].glyph;$('basicIcon').textContent=CLASSES[hero.cls].glyph;
 const skills=CLASSES[hero.cls].skills;for(let i=0;i<3;i++){const k=['q','e','r'][i];$(k+'Name').textContent=skills[i][0];$(k+'Icon').textContent=skills[i][1];}
 resize();loadZone(zone,true);refreshHUD();requestAnimationFrame(loop);save();
}
function createDecor(){
 seed=124988;decors.wild=[];decors.crypt=[];
 for(let i=0;i<640;i++){
  const x=55+srnd()*2490,y=35+srnd()*1660;
  if(Math.hypot(x-425,y-847)<345)continue;
  if(x>1850&&x<2190&&y<440)continue;
  const roadY=820+Math.sin(x*.005)*130;
  if(Math.abs(y-roadY)<70&&x<2300)continue;
  let kind='tree';const type=srnd();
  if(x>1640){kind=type<.35?'dead':type<.62?'rock':type<.8?'crystal':'bush';}
  else{kind=type<.52?'tree':type<.67?'bush':type<.84?'rock':type<.95?'flower':'dead';}
  decors.wild.push({x,y,kind,s:.7+srnd()*.8,v:srnd()});
 }
 for(let i=0;i<165;i++){let x=80+srnd()*1590,y=55+srnd()*1080;const type=srnd();decors.crypt.push({x,y,kind:type<.37?'pillar':type<.65?'rubble':type<.86?'crystal':'bones',s:.7+srnd()*.65,v:srnd()});}
}
function createSpawns(){
 seed=982711;
 spawns.wild=[];spawns.crypt=[];
 for(let col=0;col<6;col++)for(let row=0;row<5;row++){
  const x=830+col*270+(srnd()-.5)*125,y=160+row*325+(srnd()-.5)*105;
  const type=col<2?(srnd()<.7?'wolf':'skeleton'):col<4?(srnd()<.5?'cultist':'skeleton'):(srnd()<.55?'brute':'cultist');
  spawns.wild.push({x,y,type,level:Math.max(1,Math.min(8,col+1+Math.floor(row*.2))),enemy:null,respawnAt:0});
 }
 spawns.wild.push({x:2260,y:895,type:'boss',level:5,enemy:null,respawnAt:0});
 for(let col=0;col<7;col++)for(let row=0;row<3;row++){
  const x=335+col*170+(srnd()-.5)*75,y=195+row*290+(srnd()-.5)*85;
  spawns.crypt.push({x,y,type:srnd()<.55?'wraith':'guardian',level:5+Math.floor(col*.65),enemy:null,respawnAt:0});
 }
 spawns.crypt.push({x:1545,y:635,type:'cryptBoss',level:9,enemy:null,respawnAt:0});
}
function loadZone(next,initial=false){
 zone=next;hero.zone=next;enemies=[];drops=[];effects=[];particles=[];floats=[];targetId=null;moveTo=null;interactQueued=null;
 for(const sp of spawns[next])sp.enemy=null;
 hero.moving=false;hero.swingUntil=0;
 if(!initial){if(next==='crypt'){hero.x=230;hero.y=1009;}else{hero.x=1970;hero.y=380;}hero.hp=Math.max(1,hero.hp);save();}
 const projected=StoneVisual.project(hero.x,hero.y);camera.x=projected.x-view.w*.5;camera.y=projected.y-view.h*.5;
 $('areaName').textContent=MAPS[zone].label.toUpperCase();$('zoneCaption').innerHTML='<span>THE ASHEN REACH</span><strong>'+MAPS[zone].label+'</strong><small>'+MAPS[zone].subtitle+'</small>';$('zoneCaption').style.opacity='1';zoneTitleUntil=now+3.7;
 log('Entered '+MAPS[zone].label,'quest');refreshQuest();refreshPanel();
}
function spawnEnemy(sp){
 const d=MOB[sp.type],scale=1+(sp.level-1)*.21;
 const en={id:nextId++,sp,type:sp.type,x:sp.x,y:sp.y,homeX:sp.x,homeY:sp.y,level:sp.level,radius:d.radius,hp:Math.round(d.hp*scale),maxHp:Math.round(d.hp*scale),dmg:Math.round(d.dmg*(1+(sp.level-1)*.15)),speed:d.speed,aggro:330,attackCD:rnd(0,1),movePhase:rnd(0,6),flash:0};
 sp.enemy=en;enemies.push(en);
}
function updateSpawns(){
 for(const sp of spawns[zone]){if(!sp.enemy&&now>=sp.respawnAt&&Math.hypot(hero.x-sp.x,hero.y-sp.y)<1150)spawnEnemy(sp);}
}
function burst(x,y,color,count=9,size=3){
 const n=hero&&hero.settings.shake===false?Math.ceil(count*.6):count;
 for(let i=0;i<n;i++){const a=rnd(0,Math.PI*2),sp=rnd(25,170),life=rnd(.2,.72);particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-25,life,max:life,color,size:rnd(1,size),grav:rnd(0,60)});}
 if(particles.length>350)particles.splice(0,particles.length-350);
}
function floatText(text,x,y,color){if(hero.settings.damage)floats.push({text:String(text),x,y,vy:-38,life:.85,color});}
function dmgEnemy(en,amount,color='#f1dcac'){
 if(!en||en.hp<=0)return;
 const st=stats(),crit=Math.random()*100<st.crit,damage=Math.max(1,Math.round((amount-en.level*.65)*(crit?1.65:1)));
 en.hp-=damage;en.flash=.13;burst(en.x,en.y-10,crit?'#f6ce77':color,crit?10:4,3);floatText((crit?'✦ ':'')+damage,en.x+rnd(-8,8),en.y-32,crit?'#ffd783':color);if(crit)tone(370,.018,.1);
 if(en.hp<=0)killEnemy(en);
}
function dmgHero(amount){
 if(now<dodgeUntil)return;
 const st=stats(),reduction=st.armor*.24+(now<buffUntil&&hero.cls==='vanguard'?9:0),d=Math.max(1,Math.round(amount-reduction));hero.hp=Math.max(0,hero.hp-d);hero.hurtStart=now;hero.hurtUntil=now+.28;floatText('-'+d,hero.x,hero.y-35,'#ff8d7f');burst(hero.x,hero.y,'#b65a55',3,2);
 if(hero.hp<=0){hero.deathStart=now;$('deathScreen').classList.remove('hidden');targetId=null;moveTo=null;tone(130,.06,.55);save();}
}
function killEnemy(en){
 en.hp=0;const idx=enemies.indexOf(en);if(idx>=0)enemies.splice(idx,1);en.sp.enemy=null;en.sp.respawnAt=now+((en.type==='boss'||en.type==='cryptBoss')?75:24+rnd(0,12));
 burst(en.x,en.y,MOB[en.type].color,24,4);hero.kills=(hero.kills||0)+1;
 const boss=en.type==='boss'||en.type==='cryptBoss';
 let xp=Math.round(MOB[en.type].xp*(1+en.level*.15));awardXp(xp);
 const gold=Math.round(rnd(4,13)*(1+en.level*.27)*(boss?8:1));drops.push({id:nextId++,x:en.x+rnd(-12,12),y:en.y+rnd(-12,12),kind:'gold',amount:gold,born:now});
 if(Math.random()<(boss?1:.58)){
  const rarity=boss?choose(['rare','rare','epic','epic','legendary']):null;
  const item=makeItem(Math.max(1,en.level+(Math.random()<.17?1:0)),rarity);
  drops.push({id:nextId++,x:en.x+rnd(-20,20),y:en.y+rnd(-16,16),kind:'item',item,born:now});if(boss)toast('BOSS DEFEATED — RELIC DROPPED');
 }
 if(hero.quest.stage===1&&zone==='wild'&&!boss){hero.quest.kills++;if(hero.quest.kills>=8)advance(2);}
 else if(hero.quest.stage===2&&zone==='wild'&&!boss&&Math.random()<.8){drops.push({id:nextId++,x:en.x+12,y:en.y-15,kind:'shard',born:now});}
 if(hero.quest.stage===3&&en.type==='boss')advance(4);
 if(hero.quest.stage===5&&zone==='crypt'&&!boss){hero.quest.cryptKills++;if(hero.quest.cryptKills>=10)advance(6);}
 if(hero.quest.stage===6&&en.type==='cryptBoss')advance(7);
 if(boss)tone(480,.04,.33);
 refreshQuest();refreshPanel();save();
}
function advance(stage){
 hero.quest.stage=stage;refreshQuest();refreshPanel();save();
 const words={1:'THE HUNT BEGINS',2:'THE ASHEN SHARDS',3:'THE ASHBOUND WARDEN',4:'RETURN TO HOLLOWVALE',5:'CHAPTER II — INTO THE DEEP',6:'THE HOLLOW KING AWAITS',7:'RETURN TO THE WARDEN',8:'THE CRYPT IS CLEARED'};
 toast(words[stage]||'QUEST UPDATED');log(words[stage]||'Quest updated','quest');tone(590,.04,.2);
}
function pickup(){
 for(let i=drops.length-1;i>=0;i--){const d=drops[i];if(now-d.born>240){drops.splice(i,1);continue;}if(Math.hypot(hero.x-d.x,hero.y-d.y)>43)continue;
  if(d.kind==='gold'){hero.gold+=d.amount;floatText('+'+d.amount+' gold',d.x,d.y-20,'#f7d77e');}
  else if(d.kind==='shard'){if(hero.quest.stage===2){hero.quest.shards++;log('Recovered an Ashen Shard ('+hero.quest.shards+'/3)','quest');if(hero.quest.shards>=3)advance(3);}}
  else if(d.kind==='item'){if(hero.inventory.length>=25){if(now-d.born<3)toast('INVENTORY FULL');continue;}hero.inventory.push(d.item);log(d.item.name+' acquired','loot');if(d.item.rarity==='epic'||d.item.rarity==='legendary')toast(d.item.rarity.toUpperCase()+' LOOT — '+d.item.name);tone(600+RARITIES.indexOf(d.item.rarity)*130,.023,.14);}
  drops.splice(i,1);refreshPanel();refreshHUD();save();
 }
}
function nearestEnemy(max=999,at=hero){let best=null,min=max;for(const en of enemies){const d=dist(at,en);if(d<min){best=en;min=d;}}return best;}
function enemyById(id){return enemies.find(e=>e.id===id);}
function basicAttack(){
 if(!hero||hero.hp<=0||attackTimer>0)return;
 const cfg=CLASSES[hero.cls],st=stats();let en=enemyById(targetId);
 if(!en){if(hero.settings.autoAttack)en=nearestEnemy(cfg.range+16);else return;}
 if(!en||dist(en,hero)>cfg.range+en.radius)return;
 attackTimer=(hero.cls==='vanguard'?.69:hero.cls==='wayfinder'?.6:.75)/st.haste;
 hero.attackStart=now;hero.swingUntil=now+(hero.cls==='vanguard'?.50:hero.cls==='wayfinder'?.58:.50);
 const faceD=dist(hero,en)||1;hero.faceX=(en.x-hero.x)/faceD;hero.faceY=(en.y-hero.y)/faceD;
 let amount=st.attack*(now<buffUntil&&hero.cls==='vanguard'?1.34:1);
 dmgEnemy(en,amount,hero.cls==='arcanist'?'#b5cfff':'#e5dfc3');
 effects.push({type:hero.cls==='vanguard'?'slash':'bolt',x:hero.x,y:hero.y-8,tx:en.x,ty:en.y-10,life:.2,max:.2,color:hero.cls==='arcanist'?'#a4bef7':hero.cls==='wayfinder'?'#e9d6a0':'#f5e7c5'});
 tone(hero.cls==='arcanist'?540:hero.cls==='wayfinder'?390:245,.015,.07);
}
function manaCheck(cost){if(hero.mana<cost){log('Not enough energy');return false;}hero.mana-=cost;return true;}
function castSkill(key){
 if(!hero||hero.hp<=0||panel||!$('dialogue').classList.contains('hidden'))return;
 if(key==='potion'){if(skillCd.potion>0||hero.potions<=0||hero.hp>=stats().hp)return;hero.potions--;hero.hp=Math.min(stats().hp,hero.hp+Math.round(stats().hp*.55));skillCd.potion=12;burst(hero.x,hero.y,'#ed7872',18,4);floatText('HEALED',hero.x,hero.y-40,'#b4ebbd');tone(650,.045,.15);save();return;}
 const idx={q:0,e:1,r:2}[key];if(idx===undefined||skillCd[key]>0)return;
 const [name,icon,cost,cd]=CLASSES[hero.cls].skills[idx];
 if(!manaCheck(cost))return;hero.castStart=now;hero.castUntil=now+.48;
 const facingX=(mouse.worldX||hero.x+50)-hero.x,facingY=(mouse.worldY||hero.y)-hero.y,angle=Math.hypot(facingX,facingY);
 if(angle>10){hero.faceX=facingX/angle;hero.faceY=facingY/angle;}
 skillCd[key]=cd;const st=stats(),c=hero.cls,tx=mouse.worldX||hero.x+85,ty=mouse.worldY||hero.y,dir=Math.atan2(ty-hero.y,tx-hero.x);
 if(key==='q'){
  const center=c==='arcanist'?{x:clamp(tx,hero.x-285,hero.x+285),y:clamp(ty,hero.y-285,hero.y+285)}:{x:hero.x,y:hero.y};
  const range=c==='vanguard'?123:c==='wayfinder'?335:115;
  effects.push({type:'pulse',x:center.x,y:center.y,life:.42,max:.42,radius:range,color:c==='arcanist'?'#9aabf2':c==='wayfinder'?'#d9ce8c':'#dec193'});
  for(const en of [...enemies]){const d=dist(center,en);if(d<range+en.radius){if(c==='wayfinder'&&Math.abs(Math.atan2(en.y-hero.y,en.x-hero.x)-dir)>1.1&&d>85)continue;dmgEnemy(en,st.attack*(c==='wayfinder'?1.4:c==='arcanist'?1.75:1.65),'#f6d79b');}}
  burst(center.x,center.y,c==='arcanist'?'#8faaf6':'#e6c993',25,4);tone(410,.05,.3);
 } else if(key==='e'){
  const distance=c==='arcanist'?195:c==='wayfinder'?175:160;let x=clamp(hero.x+Math.cos(dir)*distance,35,MAPS[zone].w-35),y=clamp(hero.y+Math.sin(dir)*distance,35,MAPS[zone].h-35);
  burst(hero.x,hero.y,hero.tint,14,3);effects.push({type:'dash',x:hero.x,y:hero.y,tx:x,ty:y,life:.28,max:.28,color:hero.tint});hero.x=x;hero.y=y;moveTo=null;targetId=null;dodgeUntil=now+.38;
  if(c==='vanguard')for(const en of [...enemies])if(dist(hero,en)<95)dmgEnemy(en,st.attack*1.45,'#f1b88a');
  if(c==='wayfinder')hero.hp=Math.min(st.hp,hero.hp+st.hp*.045);
  burst(x,y,c==='arcanist'?'#a7b7ff':hero.tint,16,3);tone(540,.035,.2);
 } else if(key==='r'){
  if(c==='vanguard'){buffUntil=now+9;hero.hp=Math.min(st.hp,hero.hp+st.hp*.17);burst(hero.x,hero.y,'#edc47f',35,5);effects.push({type:'pulse',x:hero.x,y:hero.y,life:.7,max:.7,radius:155,color:'#e6ba79'});toast('WAR CRY — DAMAGE & DEFENSE INCREASED');}
  else {const x=clamp(tx,hero.x-345,hero.x+345),y=clamp(ty,hero.y-345,hero.y+345);effects.push({type:c==='arcanist'?'meteor':'storm',x,y,life:c==='arcanist'?1.1:4.2,max:c==='arcanist'?1.1:4.2,radius:c==='arcanist'?150:175,tick:0,color:c==='arcanist'?'#caa4ff':'#d5c690'});toast(c==='arcanist'?'STARFALL INCOMING':'ARROW RAIN UNLEASHED');}
  tone(280,.055,.35);
 }
 refreshHUD();save();
}
function dodge(){if(!hero||hero.hp<=0||now<dodgeUntil||panel)return;const ix=(keys.d?1:0)-(keys.a?1:0),iy=(keys.s?1:0)-(keys.w?1:0),dx=ix/.88+iy/.46,dy=iy/.46-ix/.88;let a=(dx||dy)?Math.atan2(dy,dx):Math.atan2(mouse.worldY-hero.y,mouse.worldX-hero.x);burst(hero.x,hero.y,hero.tint,8,3);hero.x=clamp(hero.x+Math.cos(a)*100,28,MAPS[zone].w-28);hero.y=clamp(hero.y+Math.sin(a)*100,28,MAPS[zone].h-28);dodgeUntil=now+.7;moveTo=null;targetId=null;tone(200,.013,.08);}
function talk(npcId){
 if(zone!=='wild')return;
 panel&&setPanel(null);const q=hero.quest;let line='',actions=[];
 if(npcId==='warden'){
  if(q.stage===0){line='The old stones have begun to whisper again. Our scouts vanished in the eastern wilds, and the Ashbound are gathering. We need someone brave enough to find out why.';actions=[['I will help.','questStart'],['Not yet.','close']];}
  else if(q.stage===1)line='Drive back eight creatures from the wilderness to the east. We cannot let them reach our gates.';
  else if(q.stage===2)line='The fallen carry fragments of an ancient seal. Recover three Ashen Shards from their remains.';
  else if(q.stage===3)line='The shards answer to Varrik, the Ashbound. He lurks in the eastern wasteland. End his command.';
  else if(q.stage===4){line='Varrik has fallen? Then the first seal is broken. Take this reward. Beneath the northern ruins lies the Weeping Crypt. Find what is waking the dead.';actions=[['Claim reward.','questChapter2'],['Later.','close']];}
  else if(q.stage===5)line='Go through the violet portal to the northeast. Destroy ten of the restless dead within the Weeping Crypt.';
  else if(q.stage===6)line='The Hollow King waits in the deepest part of the crypt. Do not let him leave that place.';
  else if(q.stage===7){line='You have done what our finest could not. The Hollow King is gone, and the reach has one more dawn. Take this relic as our thanks.';actions=[['Claim the relic.','questFinish']];}
  else line='The Reach is safer for your deeds. The crypt will stir again in time; hunt its guardians and grow stronger. More of this world is waiting beyond the horizon.';
 } else if(npcId==='smith'){line='Every legend needs steel. Bring me gold and I will outfit you. I also buy anything you salvage from your pack.';actions=[['Buy healing flask · 25g','buyFlask'],['Buy rare cache · '+(120+hero.level*35)+'g','buyCache'],['Close','close']];}
 else {line='The flame survives because we tend it. Rest here, weary traveler. Your wounds will mend, and your spirit will be renewed.';actions=[['Restore health and energy','heal'],['Buy healing flask · 25g','buyFlask'],['Close','close']];}
 if(!actions.length)actions=[['Continue','close']];
 const npc=NPCS.find(n=>n.id===npcId);$('dialogueName').textContent=npc.name;$('dialogueRole').textContent=npc.role;$('dialogueIcon').textContent=npc.icon;$('dialogueLine').textContent=line;
 $('dialogueActions').innerHTML=actions.map(a=>'<button class="small-btn '+(a[1]==='close'?'':'accent')+'" data-dialog="'+a[1]+'">'+escapeHTML(a[0])+'</button>').join('');
 $('dialogue').classList.remove('hidden');moveTo=null;targetId=null;
}
function dialogAction(action){
 if(action==='questStart')advance(1);
 if(action==='questChapter2'){hero.gold+=180;const reward=makeItem(Math.max(2,hero.level),'rare','weapon');if(hero.inventory.length<25)hero.inventory.push(reward);else drops.push({id:nextId++,x:hero.x+20,y:hero.y,kind:'item',item:reward,born:now});advance(5);toast('REWARD — 180 GOLD + RARE WEAPON');}
 if(action==='questFinish'){hero.gold+=450;if(hero.inventory.length<25)hero.inventory.push(makeItem(Math.max(6,hero.level),'epic'));advance(8);toast('CHAPTER COMPLETE — RELIC OF THE HOLLOW');}
 if(action==='buyFlask'){if(hero.gold<25){toast('NOT ENOUGH GOLD');return;}hero.gold-=25;hero.potions++;tone(700,.028,.1);toast('HEALING FLASK PURCHASED');}
 if(action==='buyCache'){const price=120+hero.level*35;if(hero.gold<price){toast('NOT ENOUGH GOLD');return;}if(hero.inventory.length>=25){toast('INVENTORY FULL');return;}hero.gold-=price;const item=makeItem(hero.level,Math.random()<.2?'epic':'rare');hero.inventory.push(item);toast('RECEIVED '+item.name.toUpperCase());tone(780,.026,.2);}
 if(action==='heal'){hero.hp=stats().hp;hero.mana=stats().mana;toast('RESTORED BY THE FLAME');burst(hero.x,hero.y,'#9bcdb9',18,4);}
 $('dialogue').classList.add('hidden');refreshHUD();refreshPanel();save();
}
function interactPortal(){const dest=PORTALS[zone].to;loadZone(dest);tone(300,.04,.5);toast('TRAVELED TO '+MAPS[dest].label.toUpperCase());}
function interactNear(){
 let interact=null,best=108;
 if(zone==='wild')for(const npc of NPCS){let d=dist(hero,npc);if(d<best){interact={type:'npc',id:npc.id};best=d;}}
 const portal=PORTALS[zone],d=dist(hero,portal);if(d<best)interact={type:'portal'};
 if(interact){if(interact.type==='npc')talk(interact.id);else interactPortal();}else log('Move closer to a character or portal, then press F.');
}
function update(dt){
 now+=dt;saveTimer+=dt;uiTimer+=dt;minimapTimer+=dt;attackTimer=Math.max(0,attackTimer-dt);
 for(const k of Object.keys(skillCd))skillCd[k]=Math.max(0,skillCd[k]-dt);
 if(zoneTitleUntil<now)$('zoneCaption').style.opacity='0';
 const st=stats();hero.hp=clamp(hero.hp+dt*(hero.hp<st.hp?0.6:0),0,st.hp);hero.mana=clamp(hero.mana+dt*(4.7+hero.attr.spirit*.35)*(1+hero.talents.arcana*.15),0,st.mana);
 const previousX=hero.x,previousY=hero.y;
 const inputX=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),inputY=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
 // Keys are screen-relative; invert the world projection to steer intuitively.
 const dx=inputX/.88+inputY/.46,dy=inputY/.46-inputX/.88;
 if(dx||dy){const m=Math.hypot(dx,dy);hero.x+=dx/m*st.speed*dt;hero.y+=dy/m*st.speed*dt;moveTo=null;targetId=null;interactQueued=null;}
 else if(targetId){const en=enemyById(targetId);if(en){const cfg=CLASSES[hero.cls];if(dist(hero,en)>cfg.range+en.radius-8){const d=dist(hero,en)||1;hero.x+=(en.x-hero.x)/d*st.speed*dt;hero.y+=(en.y-hero.y)/d*st.speed*dt;}}else targetId=null;}
 else if(moveTo){const distance=dist(hero,moveTo);if(distance>8){const step=Math.min(st.speed*dt,distance);hero.x+=(moveTo.x-hero.x)/distance*step;hero.y+=(moveTo.y-hero.y)/distance*step;}else{moveTo=null;}}
 hero.x=clamp(hero.x,24,MAPS[zone].w-24);hero.y=clamp(hero.y,24,MAPS[zone].h-24);
 // Buildings are physical structures, not decorations you can walk through.
 if(zone==='wild'){
  for(const b of [{x:220,y:635,w:180,h:135},{x:575,y:1000,w:190,h:160},{x:571,y:687,w:185,h:145}]){
   const hw=b.w/2+14,hh=b.h/2+14;
   if(Math.abs(hero.x-b.x)<hw&&Math.abs(hero.y-b.y)<hh){
    const horizontal=hw-Math.abs(hero.x-b.x),vertical=hh-Math.abs(hero.y-b.y);
    if(horizontal<vertical)hero.x=b.x+(hero.x>=b.x?hw:-hw);
    else hero.y=b.y+(hero.y>=b.y?hh:-hh);
   }
  }
 }
 const movement=Math.hypot(hero.x-previousX,hero.y-previousY);hero.moving=movement>dt*18;
 if(hero.moving){hero.faceX=(hero.x-previousX)/movement;hero.faceY=(hero.y-previousY)/movement;}
 if(interactQueued&&dist(hero,interactQueued.pos)<95){const obj=interactQueued;interactQueued=null;moveTo=null;if(obj.type==='npc')talk(obj.id);else interactPortal();}
 updateSpawns();basicAttack();
 for(const en of [...enemies]){
  if(en.hp<=0)continue;en.flash=Math.max(0,en.flash-dt);en.attackCD-=dt;en.movePhase+=dt;
  const d=dist(en,hero);
  // Hollowvale is a sanctuary: creatures disengage at the village boundary.
  if(zone==='wild'&&Math.hypot(hero.x-425,hero.y-842)<295){
   const home=Math.hypot(en.homeX-en.x,en.homeY-en.y);
   if(home>8){en.x+=(en.homeX-en.x)/home*en.speed*dt;en.y+=(en.homeY-en.y)/home*en.speed*dt;}
   continue;
  }
  if(d<en.aggro&&d>MOB[en.type].reach+18){const s=en.speed*dt;en.x+=(hero.x-en.x)/d*s;en.y+=(hero.y-en.y)/d*s;}
  else if(d>en.aggro&&Math.hypot(en.x-en.homeX,en.y-en.homeY)>42){const home=Math.hypot(en.homeX-en.x,en.homeY-en.y)||1;en.x+=(en.homeX-en.x)/home*en.speed*.45*dt;en.y+=(en.homeY-en.y)/home*en.speed*.45*dt;}
  if(d<MOB[en.type].reach+20&&en.attackCD<=0){en.swingUntil=now+.28;en.attackCD=en.type==='boss'||en.type==='cryptBoss'?1.55:1.15+rnd(-.1,.25);dmgHero(en.dmg);burst(hero.x,hero.y,'#e7a099',2,2);}
 }
 for(let i=effects.length-1;i>=0;i--){
  const e=effects[i];e.life-=dt;
  if(e.type==='storm'&&e.life>0){e.tick-=dt;if(e.tick<=0){e.tick=.35;for(const en of [...enemies])if(dist(en,e)<e.radius)dmgEnemy(en,st.attack*.44,'#e9dcaa');burst(e.x+rnd(-90,90),e.y+rnd(-80,80),'#e5d3a4',6,2);}}
  if(e.type==='meteor'&&e.life<=0){for(const en of [...enemies])if(dist(en,e)<e.radius)dmgEnemy(en,st.attack*4.4,'#ffc68e');burst(e.x,e.y,'#e8a8fc',60,7);tone(155,.07,.5);}
  if(e.life<=0)effects.splice(i,1);
 }
 for(let i=particles.length-1;i>=0;i--){const q=particles[i];q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=q.grav*dt;q.vx*=.98;if(q.life<=0)particles.splice(i,1);}
 for(let i=floats.length-1;i>=0;i--){floats[i].life-=dt;floats[i].y+=floats[i].vy*dt;if(floats[i].life<=0)floats.splice(i,1);}
 pickup();
 const projected=StoneVisual.project(hero.x,hero.y),mx=projected.x-view.w*.5,my=projected.y-view.h*.5;
 camera.x+=(mx-camera.x)*Math.min(1,dt*8);camera.y+=(my-camera.y)*Math.min(1,dt*8);
 if(saveTimer>16){saveTimer=0;save();}
 if(uiTimer>.1){uiTimer=0;refreshHUD();}
 if(minimapTimer>.25){minimapTimer=0;drawMinimap();}
 feed=feed.filter(f=>now-f.time<6);$('eventFeed').innerHTML=feed.map(f=>'<div class="feed-line '+f.type+'">'+escapeHTML(f.msg)+'</div>').join('');
}
function resize(){const r=canvas.getBoundingClientRect();view.w=Math.max(300,r.width);view.h=Math.max(250,r.height);dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(view.w*dpr);canvas.height=Math.round(view.h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
function loop(t){
 if(!appStarted)return;
 const dt=Math.min(.045,(t-(last||t))/1000);last=t;
 const paused=panel!==null||!$('dialogue').classList.contains('hidden')||!$('deathScreen').classList.contains('hidden');
 if(!paused)update(dt);else{const p=StoneVisual.project(hero.x,hero.y);camera.x+=(p.x-view.w*.5-camera.x)*Math.min(1,dt*7);camera.y+=(p.y-view.h*.5-camera.y)*Math.min(1,dt*7);}
 draw();requestAnimationFrame(loop);
}
function patchNoise(a,b){let k=Math.sin(a*127.1+b*311.7)*43758.5453123;return k-Math.floor(k);}
function draw(){
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,view.w,view.h);
 StoneVisual.render({ctx,zone,camera,view,hero,enemies,drops,decors:decors[zone],effects,particles,floats,npcs:NPCS,portal:PORTALS[zone],maps:MAPS,now,targetId,moveTo,stats:stats(),buffUntil,dodgeUntil});
 drawBossBar();
}
function visible(p,pad){return p.x>camera.x-pad&&p.x<camera.x+view.w+pad&&p.y>camera.y-pad&&p.y<camera.y+view.h+pad;}
function ellipse(x,y,rx,ry,c){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function roundBox(x,y,w,h,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function poly(pts,c){ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath();ctx.fill();}
function drawWild(){
 const m=MAPS.wild;ctx.fillStyle='#345044';ctx.fillRect(camera.x-2,camera.y-2,view.w+4,view.h+4);
 const sz=85,sx=Math.floor(camera.x/sz)-1,ex=Math.ceil((camera.x+view.w)/sz)+1,sy=Math.floor(camera.y/sz)-1,ey=Math.ceil((camera.y+view.h)/sz)+1;
 for(let y=sy;y<=ey;y++)for(let x=sx;x<=ex;x++){
  const px=x*sz,py=y*sz,n=patchNoise(x,y);
  const ash=px>1620, c=ash?(n>.55?'#4a4c42':n>.24?'#4c5147':'#444941'):(n>.72?'#3f5a4b':n>.35?'#385246':'#345044');
  ctx.fillStyle=c;ctx.fillRect(px,py,sz+1,sz+1);
  const n2=patchNoise(y+43,x+10);ctx.fillStyle=ash?'#68635055':'#70876648';
  for(let j=0;j<6;j++){const xx=px+((n2*89+j*31)%sz),yy=py+((n*68+j*23)%sz);ctx.fillRect(xx,yy,1.5+(j%2),1+(j%3));}
  if(n>.69){ellipse(px+sz*.47,py+sz*.65,22,12,ash?'#675f4e40':'#60785a32');}
 }
 const road=(x)=>830+Math.sin(x*.005)*130;
 ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(390,860);for(let x=440;x<2450;x+=30)ctx.lineTo(x,road(x));ctx.strokeStyle='#182c2860';ctx.lineWidth=108;ctx.stroke();ctx.strokeStyle='#766d565e';ctx.lineWidth=92;ctx.stroke();ctx.strokeStyle='#8d806054';ctx.lineWidth=75;ctx.stroke();ctx.strokeStyle='#a6997550';ctx.lineWidth=2;ctx.setLineDash([4,17]);ctx.stroke();ctx.setLineDash([]);
 ellipse(425,842,310,270,'#647158');ellipse(425,842,290,251,'#63725a');
 for(let i=0;i<75;i++){let a=i*2.399,r=Math.sqrt(i/75)*267;const x=425+Math.cos(a)*r,y=842+Math.sin(a)*r*.85;ellipse(x,y,3+(i%5),2,'#a5a38344');}
 // Town cobblestone lanes and protective rune circle
 ctx.beginPath();ctx.arc(425,842,238,0,Math.PI*2);ctx.strokeStyle='#b9b09244';ctx.lineWidth=5;ctx.stroke();
 for(let i=0;i<25;i++){const x=247+(i%6)*68,y=714+Math.floor(i/6)*67;roundBox(x,y,51,28,5,'#9b9a7b18');}
 drawBuilding(220,635,154,100,'#624d45','#ae8666');drawBuilding(575,1000,176,111,'#4e514e','#8a8774');drawBuilding(571,687,151,97,'#585a53','#a29b7b');
 // Broken arch ruins to the east
 for(const pos of [[2120,755],[2180,739],[2310,978],[2370,971]]){roundBox(pos[0],pos[1]-34,25,54,3,'#7d7760');ellipse(pos[0]+13,pos[1]+21,22,7,'#1c302b66');}
}
function drawBuilding(x,y,w,h,wall,roof){
 ellipse(x,y+h*.65,w*.65,35,'#14251d66');roundBox(x-w/2,y-h*.5,w,h*.82,8,wall);poly([[x-w*.63,y-h*.47],[x,y-h*.98],[x+w*.64,y-h*.47],[x+w*.46,y-h*.26],[x-w*.47,y-h*.26]],roof);
 ctx.strokeStyle='#281e22a3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-w*.48,y-h*.45);ctx.lineTo(x,y-h*.91);ctx.lineTo(x+w*.49,y-h*.45);ctx.stroke();
 roundBox(x-10,y-h*.2,24,38,2,'#28312c');roundBox(x-w*.33,y-h*.32,17,22,2,'#d0b781');ctx.fillStyle='#e5c57b66';ctx.fillRect(x-w*.31,y-h*.29,13,16);
}
function drawCrypt(){
 ctx.fillStyle='#222c32';ctx.fillRect(camera.x-3,camera.y-3,view.w+6,view.h+6);
 const sz=70;for(let y=Math.floor(camera.y/sz)-1;y<=Math.ceil((camera.y+view.h)/sz)+1;y++)for(let x=Math.floor(camera.x/sz)-1;x<=Math.ceil((camera.x+view.w)/sz)+1;x++){
  const n=patchNoise(x+88,y+22),px=x*sz,py=y*sz;ctx.fillStyle=n>.5?'#303c40':'#29353b';ctx.fillRect(px+2,py+2,sz-4,sz-4);ctx.strokeStyle='#182a30';ctx.strokeRect(px+1,py+1,sz-2,sz-2);
  if(n>.75){ctx.strokeStyle='#53626266';ctx.beginPath();ctx.moveTo(px+10,py+15);ctx.lineTo(px+25,py+26);ctx.lineTo(px+14,py+43);ctx.stroke();}
 }
 ctx.strokeStyle='#71958b24';ctx.lineWidth=24;ctx.strokeRect(20,20,1710,1180);ctx.lineWidth=2;ctx.strokeStyle='#8d9d8966';ctx.strokeRect(37,37,1676,1146);
 for(let i=0;i<6;i++){const x=335+i*224;ctx.fillStyle='#7c628b22';ctx.fillRect(x,52,5,1110);}
 for(const [x,y] of [[1200,170],[910,900],[1550,300],[680,520]]){ellipse(x,y,85,46,'#6c3a7735');ctx.strokeStyle='#8e6da377';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,54,31,0,0,Math.PI*2);ctx.stroke();}
}
function drawDecor(p){
 const {x,y,s,v,kind}=p;ctx.save();ctx.translate(x,y);ctx.scale(s,s);
 if(kind==='tree'){
  ellipse(0,10,27,10,'#12251b77');ctx.fillStyle='#443d30';ctx.fillRect(-5,-43,10,56);poly([[-36,-27],[-14,-71],[-22,-57],[0,-103],[20,-58],[13,-70],[38,-27]],v>.5?'#315247':'#294a3e');poly([[-30,-48],[0,-108],[30,-48]],v>.5?'#47725b':'#3e6854');poly([[-21,-69],[0,-120],[21,-69]],'#4f7b61');poly([[-11,-90],[0,-124],[12,-90]],'#6a9074');
 }else if(kind==='dead'){
  ellipse(0,8,19,7,'#14241f88');ctx.strokeStyle='#4d473c';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,4);ctx.lineTo(0,-55);ctx.lineTo(-20,-80);ctx.moveTo(1,-42);ctx.lineTo(23,-70);ctx.lineTo(31,-81);ctx.moveTo(-7,-59);ctx.lineTo(-23,-47);ctx.stroke();ctx.strokeStyle='#716455';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(3,-16);ctx.lineTo(2,-50);ctx.stroke();
 }else if(kind==='rock'||kind==='rubble'){
  ellipse(0,9,27,8,'#101f21a1');poly([[-26,6],[-16,-18],[8,-24],[29,-12],[21,7]],v>.5?'#65685d':'#70736a');poly([[-26,6],[-16,-18],[1,-11],[2,8]],'#555f58');poly([[8,-24],[29,-12],[21,7],[2,8]],'#85877a');
 }else if(kind==='crystal'){
  ellipse(0,6,23,8,'#142a2890');const color=zone==='crypt'?'#a790cf':'#9b7c9e';poly([[-12,2],[-7,-39],[0,-57],[11,-29],[11,4]],color);poly([[0,-57],[11,-29],[11,4],[1,-10]],'#685c87');poly([[-18,8],[-20,-18],[-12,-29],[-5,0]],'#6f9daa');ctx.shadowBlur=14;ctx.shadowColor=color;ellipse(0,-19,3,8,'#ddd4ff');ctx.shadowBlur=0;
 }else if(kind==='bush'){ellipse(0,5,25,11,'#162a2366');ellipse(-12,-3,16,14,'#41634d');ellipse(7,-10,19,17,'#4e775a');ellipse(22,-1,14,12,'#375a46');ellipse(-4,-20,10,7,'#608365');}
 else if(kind==='pillar'){ellipse(0,13,29,11,'#0a171e99');roundBox(-17,-64,34,76,4,'#53565c');roundBox(-24,-66,48,15,2,'#767a7d');roundBox(-21,0,43,13,2,'#6c7373');ctx.fillStyle='#31383d';ctx.fillRect(-4,-52,6,45);}
 else if(kind==='bones'){ellipse(0,4,22,8,'#131e2480');ctx.strokeStyle='#c0bca7';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-16,-4);ctx.lineTo(14,7);ctx.moveTo(-7,8);ctx.lineTo(17,-9);ctx.stroke();ellipse(8,-5,6,5,'#b1b0a2');}
 else {ellipse(0,3,13,6,'#274d3c');for(let i=0;i<7;i++)ellipse(Math.cos(i*2.4)*12,Math.sin(i*2.4)*7,2,2,v>.5?'#d6bd87':'#9fbd8f');}
 ctx.restore();
}
function drawPortal(portal){
 const {x,y}=portal,t=now;ctx.save();ctx.translate(x,y);
 ellipse(0,14,59,23,'#101b2a99');ctx.strokeStyle='#7f7096';ctx.lineWidth=9;ctx.beginPath();ctx.arc(0,-20,43,Math.PI,0);ctx.stroke();
 for(let i=0;i<7;i++){const a=Math.PI+i*Math.PI/6;ellipse(Math.cos(a)*43,-20+Math.sin(a)*43,7,7,'#a4999d');}
 ctx.strokeStyle='#ad9be8';ctx.shadowColor='#ad96ee';ctx.shadowBlur=18;ctx.lineWidth=3.5;ctx.beginPath();ctx.ellipse(0,-18,30+Math.sin(t*2)*2,44,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#9a80d44d';ctx.beginPath();ctx.ellipse(0,-18,26,41,0,0,Math.PI*2);ctx.fill();
 for(let i=0;i<6;i++){const yy=-55+((i*19+t*27)%80);ellipse(Math.sin(t*1.4+i*2)*17,yy,2.5,5,'#b6a6ee');}
 ctx.shadowBlur=0;ctx.fillStyle='#d4c2ef';ctx.font='bold 10px "DM Sans",sans-serif';ctx.textAlign='center';ctx.fillText(portal.name,0,-84);ctx.restore();
}
function drawNPC(n){
 const x=n.x,y=n.y;ellipse(x,y+14,22,9,'#102321aa');ctx.save();ctx.translate(x,y);
 poly([[-16,3],[-11,-35],[10,-35],[17,4]],n.id==='warden'?'#68695e':n.id==='smith'?'#716358':'#748d86');roundBox(-12,-34,24,24,5,n.id==='warden'?'#b1ad88':'#a5b2a4');ellipse(0,-43,12,14,'#d4b393');ellipse(0,-51,13,6,'#4c493e');
 if(n.id==='warden'){poly([[-20,-34],[-11,-39],[-5,-29],[-12,-20]],'#a88b61');roundBox(-16,-31,9,15,2,'#8a7e68');}else if(n.id==='smith'){roundBox(9,-22,7,24,2,'#6c5d52');}else{ctx.strokeStyle='#c4dcc3';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-4,-24);ctx.lineTo(7,-24);ctx.moveTo(2,-31);ctx.lineTo(2,-18);ctx.stroke();}
 ctx.restore();
 ellipse(x,y-66,17,17,'#193333');ctx.strokeStyle='#b69a6b';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y-66,17,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#e6c887';ctx.font='bold 15px Arial';ctx.textAlign='center';ctx.fillText(n.icon,x,y-60);
 ctx.font='600 11px "DM Sans",sans-serif';ctx.fillStyle='#e4d9bb';ctx.shadowColor='#000';ctx.shadowBlur=5;ctx.fillText(n.name,x,y-89);ctx.shadowBlur=0;
 if(dist(hero,n)<115){ctx.fillStyle='#e8c488';ctx.font='bold 9px "DM Sans",sans-serif';ctx.fillText('[ F ] TALK',x,y-103);}
}
function drawEnemy(en){
 const d=MOB[en.type],x=en.x,y=en.y,scale=en.radius/20;ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ellipse(0,11,21,8,'#0b171b99');
 if(en.type==='wolf'){
  ellipse(0,-7,22,13,'#665b54');ellipse(-13,-7,13,10,'#9a8978');poly([[-21,-12],[-16,-31],[-7,-16]],'#b8a58b');poly([[-9,-14],[-3,-31],[1,-11]],'#9e8e76');roundBox(-16,-1,7,20,3,'#574c47');roundBox(10,0,7,18,3,'#574c47');ellipse(-16,-12,2.5,2,'#f0b783');
 }else if(en.type==='skeleton'||en.type==='guardian'){
  poly([[-16,5],[-13,-29],[10,-30],[17,7]],en.type==='guardian'?'#4c555e':'#555f5b');roundBox(-8,-30,17,28,2,en.type==='guardian'?'#77828d':'#9b9883');ellipse(0,-43,12,13,'#c7c5ae');ellipse(-5,-44,3,4,'#253b3a');ellipse(5,-44,3,4,'#253b3a');ctx.strokeStyle='#d6cdb6';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(14,-25);ctx.lineTo(27,-41);ctx.stroke();
 }else if(en.type==='cultist'||en.type==='wraith'){
  poly([[-18,7],[-15,-28],[-8,-44],[10,-44],[17,-28],[21,7]],en.type==='wraith'?'#567c8cbd':'#523e58');ellipse(0,-32,13,16,en.type==='wraith'?'#7291a799':'#292533');ellipse(-5,-33,2,2,'#d1a6da');ellipse(5,-33,2,2,'#d1a6da');ctx.strokeStyle='#977aa8';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(16,-19);ctx.lineTo(26,4);ctx.stroke();
 }else{
  poly([[-25,10],[-24,-46],[-10,-56],[12,-56],[25,-43],[28,10]],en.type==='cryptBoss'?'#423a5c':'#655448');
  roundBox(-19,-42,38,38,7,en.type==='cryptBoss'?'#79699a':'#a77f5c');
  ellipse(0,-56,19,19,'#b0a08b');poly([[-17,-60],[-25,-84],[-11,-68]],'#c2af8f');poly([[13,-69],[25,-84],[17,-56]],'#c2af8f');
  ellipse(-7,-56,3,3,'#ecad8f');ellipse(8,-56,3,3,'#ecad8f');ctx.strokeStyle='#d7a77e';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(25,-32);ctx.lineTo(36,6);ctx.stroke();
 }
 if(en.flash>0){ctx.globalAlpha=en.flash*3;ellipse(0,-19,28,36,'#fff2e1');ctx.globalAlpha=1;}
 ctx.restore();
 const w=en.type==='boss'||en.type==='cryptBoss'?105:45;if(en.hp<en.maxHp||en.type==='boss'||en.type==='cryptBoss'){
  ctx.fillStyle='#0c1b1e';ctx.fillRect(x-w/2,y-en.radius*2.6-16,w,5);ctx.fillStyle=en.type==='boss'||en.type==='cryptBoss'?'#bb7c69':'#b95d58';ctx.fillRect(x-w/2,y-en.radius*2.6-16,w*clamp(en.hp/en.maxHp,0,1),5);
 }
 if(targetId===en.id){ctx.strokeStyle='#e3c384';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+6,en.radius+10,en.radius*.48,0,0,Math.PI*2);ctx.stroke();}
 if(en.type==='boss'||en.type==='cryptBoss'){ctx.fillStyle='#f0c690';ctx.font='bold 11px "DM Sans",sans-serif';ctx.textAlign='center';ctx.fillText(d.name,x,y-en.radius*2.6-24);}
}
function drawHero(){
 const x=hero.x,y=hero.y,t=now,st=stats(),color=hero.tint;ctx.save();ctx.translate(x,y);
 const walking=keys.w||keys.a||keys.s||keys.d||moveTo||targetId,osc=walking?Math.sin(t*13)*3:Math.sin(t*2)*1.5;
 ellipse(0,16,21,9,'#0b1c1a99');if(now<buffUntil){ctx.strokeStyle='#e5c17c77';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-20,34+Math.sin(t*4)*3,0,Math.PI*2);ctx.stroke();}
 poly([[-15,13],[-15,-29],[16,-29],[21,14]],color);poly([[7,-26],[17,-22],[24,14],[5,14]],'#162c3388');
 roundBox(-12,-2,9,17+osc,2,'#454342');roundBox(5,-2,9,17-osc,2,'#454342');
 roundBox(-14,-35,28,29,4,hero.equip.armor&&RARITIES.indexOf(hero.equip.armor.rarity)>1?'#9ca79d':'#777f76');
 poly([[-14,-36],[-22,-27],[-12,-17],[-6,-28]],color);poly([[14,-36],[22,-27],[12,-17],[6,-28]],color);
 ellipse(0,-44,12,15,'#d8ae8a');poly([[-12,-51],[-10,-61],[3,-64],[12,-55],[11,-48],[2,-56],[-8,-50]],'#463c37');
 ellipse(-5,-43,1.5,1.6,'#2a3030');ellipse(5,-43,1.5,1.6,'#2a3030');
 if(hero.equip.helm){poly([[-14,-54],[-9,-66],[9,-66],[14,-54]],RARITIES.indexOf(hero.equip.helm.rarity)>1?'#bfb5a0':'#7e8c82');}
 if(hero.cls==='vanguard'){ctx.strokeStyle=hero.equip.weapon&&hero.equip.weapon.rarity==='legendary'?'#e7b870':'#d8d5c6';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(20,-21);ctx.lineTo(28,-59);ctx.stroke();ctx.strokeStyle='#6e6049';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(17,-33);ctx.lineTo(31,-32);ctx.stroke();ellipse(-23,-24,12,16,'#8a7863');ellipse(-23,-24,7,11,'#b6a27c');}
 else if(hero.cls==='wayfinder'){ctx.strokeStyle='#c99f6b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(17,-30,20,-1.3,1.3);ctx.stroke();ctx.strokeStyle='#e7d5b1';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(22,-49);ctx.lineTo(22,-11);ctx.stroke();}
 else {ctx.strokeStyle='#8a749a';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(19,8);ctx.lineTo(22,-58);ctx.stroke();ctx.fillStyle='#b6a6ec';ctx.shadowColor='#b6a6ec';ctx.shadowBlur=13;ctx.beginPath();ctx.arc(22,-61,7+Math.sin(t*5),0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
 if(now<dodgeUntil){ctx.globalAlpha=.25;ellipse(0,-20,29,38,color);}
 ctx.restore();
 ctx.font='bold 11px "DM Sans",sans-serif';ctx.textAlign='center';ctx.fillStyle='#f6e9cb';ctx.shadowColor='#000';ctx.shadowBlur=7;ctx.fillText(hero.name,x,y-77);ctx.shadowBlur=0;
}
function drawDrop(d){
 const pulse=1+Math.sin(now*5+d.id)*.16;ellipse(d.x,d.y+6,16,5,'#10191da0');
 if(d.kind==='gold'){ctx.fillStyle='#ebc67a';ctx.beginPath();ctx.arc(d.x,d.y-2,5*pulse,0,Math.PI*2);ctx.fill();}
 else if(d.kind==='shard'){ctx.fillStyle='#b1adef';poly([[d.x,d.y-25],[d.x+8,d.y-7],[d.x,d.y+3],[d.x-8,d.y-7]],'#b4a0ea');ctx.shadowColor='#a995ef';ctx.shadowBlur=20;ellipse(d.x,d.y-7,3,5,'#f7e8ff');ctx.shadowBlur=0;}
 else {const col={common:'#bac5bf',magic:'#73b9ec',rare:'#f3d376',epic:'#c99beb',legendary:'#ff9e5d'}[d.item.rarity];ctx.shadowBlur=18;ctx.shadowColor=col;ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(d.x,d.y-24);ctx.lineTo(d.x+8,d.y-13);ctx.lineTo(d.x,d.y-2);ctx.lineTo(d.x-8,d.y-13);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=col;ctx.globalAlpha=.6;ctx.beginPath();ctx.arc(d.x,d.y-12,12*pulse,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
}
function drawEffect(e){
 ctx.save();ctx.globalAlpha=clamp(e.life/e.max,0,1);
 if(e.type==='bolt'||e.type==='dash'){ctx.strokeStyle=e.color;ctx.shadowColor=e.color;ctx.shadowBlur=12;ctx.lineWidth=e.type==='dash'?8:4;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.tx,e.ty);ctx.stroke();}
 if(e.type==='slash'){ctx.strokeStyle='#f0d3a5';ctx.lineWidth=6;ctx.shadowBlur=12;ctx.shadowColor='#e3c5aa';ctx.beginPath();ctx.arc(e.tx,e.ty,31,-2.6,.9);ctx.stroke();}
 if(e.type==='pulse'){ctx.strokeStyle=e.color;ctx.lineWidth=4;ctx.shadowColor=e.color;ctx.shadowBlur=16;ctx.beginPath();ctx.arc(e.x,e.y,e.radius*(1-e.life/e.max),0,Math.PI*2);ctx.stroke();}
 if(e.type==='storm'){ctx.strokeStyle=e.color;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(e.x,e.y,e.radius,e.radius*.55,0,0,Math.PI*2);ctx.stroke();for(let i=0;i<7;i++){const a=now*3+i*2.39;ellipse(e.x+Math.cos(a)*e.radius*.74,e.y+Math.sin(a)*e.radius*.45-20,4,10,e.color);}}
 if(e.type==='meteor'){ctx.strokeStyle=e.color;ctx.lineWidth=4;ctx.shadowColor=e.color;ctx.shadowBlur=20;ctx.beginPath();ctx.ellipse(e.x,e.y,e.radius,e.radius*.55,0,0,Math.PI*2);ctx.stroke();const progress=1-e.life/e.max;ellipse(e.x+75*(1-progress),e.y-210*(1-progress),19,23,'#e6b2fd');}
 ctx.restore();
}
function drawBossBar(){
 const en=enemies.find(e=>(e.type==='boss'||e.type==='cryptBoss')&&dist(hero,e)<560);if(!en)return;
 const w=Math.min(380,view.w*.44),x=view.w/2-w/2;ctx.fillStyle='#0b1319d9';ctx.fillRect(x,16,w,42);ctx.strokeStyle='#8f6a6e';ctx.strokeRect(x,16,w,42);ctx.fillStyle='#6d2e37';ctx.fillRect(x+7,42,(w-14)*en.hp/en.maxHp,8);ctx.textAlign='center';ctx.font='600 12px "Cinzel",serif';ctx.fillStyle='#ecd2bc';ctx.fillText(MOB[en.type].name.toUpperCase()+' · LV '+en.level,view.w/2,33);
}
function drawMinimap(){
 if(!hero)return;const w=minimap.width,h=minimap.height,m=MAPS[zone],sx=w/m.w,sy=h/m.h;
 mctx.clearRect(0,0,w,h);mctx.fillStyle=zone==='wild'?'#283e36':'#263239';mctx.fillRect(0,0,w,h);
 if(zone==='wild'){mctx.fillStyle='#3d5141';mctx.beginPath();mctx.ellipse(430*sx,845*sy,300*sx,270*sy,0,0,Math.PI*2);mctx.fill();mctx.strokeStyle='#8d7e56';mctx.lineWidth=3;mctx.beginPath();mctx.moveTo(425*sx,845*sy);for(let x=440;x<2500;x+=30)mctx.lineTo(x*sx,(830+Math.sin(x*.005)*130)*sy);mctx.stroke();}else{mctx.strokeStyle='#6c677a';mctx.lineWidth=3;mctx.strokeRect(5,5,w-10,h-10);}
 for(const en of enemies){mctx.fillStyle=en.type==='boss'||en.type==='cryptBoss'?'#dc8b88':'#a06765';mctx.fillRect(en.x*sx,en.y*sy,2,2);}
 const pt=PORTALS[zone];mctx.fillStyle='#c0a4f4';mctx.beginPath();mctx.arc(pt.x*sx,pt.y*sy,4,0,Math.PI*2);mctx.fill();
 if(zone==='wild'){for(const n of NPCS){mctx.fillStyle='#e6cf8e';mctx.fillRect(n.x*sx-2,n.y*sy-2,4,4);}}
 const q=hero.quest;let objective=null;if(zone==='wild'&&(q.stage===0||q.stage===4||q.stage===7))objective=NPCS[0];else if(zone==='wild'&&q.stage===3)objective={x:2260,y:895};else if(zone==='crypt'&&q.stage===6)objective={x:1545,y:635};else if(q.stage>=5&&q.stage<=6&&zone==='wild')objective=PORTALS.wild;
 if(objective){mctx.strokeStyle='#eac17c';mctx.lineWidth=2;mctx.beginPath();mctx.arc(objective.x*sx,objective.y*sy,6,0,Math.PI*2);mctx.stroke();}
 mctx.strokeStyle='#b7e4ce';mctx.lineWidth=1;
 const cornerPts=[[camera.x,camera.y],[camera.x+view.w,camera.y],[camera.x+view.w,camera.y+view.h],[camera.x,camera.y+view.h]].map(c=>StoneVisual.unproject(c[0],c[1]));
 mctx.beginPath();mctx.moveTo(cornerPts[0].x*sx,cornerPts[0].y*sy);
 for(let i=1;i<cornerPts.length;i++)mctx.lineTo(cornerPts[i].x*sx,cornerPts[i].y*sy);mctx.closePath();mctx.stroke();
 mctx.fillStyle='#e6f6d8';mctx.beginPath();mctx.arc(hero.x*sx,hero.y*sy,3.6,0,Math.PI*2);mctx.fill();
 $('mapCoords').textContent=Math.round(hero.x)+' / '+Math.round(hero.y);
}
function refreshHUD(){
 if(!hero)return;const st=stats();$('hudName').textContent=hero.name;$('hudClass').textContent=CLASSES[hero.cls].name.toUpperCase()+' · LV '+hero.level;$('hudLevel').textContent=String(hero.level).padStart(2,'0');
 $('hpFill').style.width=(clamp(hero.hp/st.hp,0,1)*100)+'%';$('manaFill').style.width=(clamp(hero.mana/st.mana,0,1)*100)+'%';$('xpFill').style.width=(clamp(hero.xp/needXp(),0,1)*100)+'%';
 $('hpText').textContent=Math.ceil(hero.hp)+' / '+st.hp;$('manaText').textContent=Math.ceil(hero.mana)+' / '+st.mana;$('goldCount').textContent=hero.gold.toLocaleString();$('potionCount').textContent=hero.potions;
 for(const key of ['q','e','r','potion']){const el=$(key==='potion'?'potionCool':key+'Cool');el.style.opacity=skillCd[key]>0?'.9':'0';el.dataset.time=skillCd[key]>0?Math.ceil(skillCd[key]):'';}
}
function questData(){
 const q=hero.quest;
 const a=[
 ['The First Whisper','Speak with Warden Kael in Hollowvale.',0,1],
 ['Trouble in the Wilds','Defeat the Ashbound creatures roaming east of Hollowvale.',q.kills,8],
 ['Fragments of a Seal','Recover Ashen Shards from defeated enemies.',q.shards,3],
 ['The Ashbound Commander','Defeat Varrik in the eastern wastes.',0,1],
 ['What the Stones Remember','Return to Warden Kael for your reward.',0,1],
 ['Beneath the Ash','Defeat restless guardians inside the Weeping Crypt.',q.cryptKills,10],
 ['The Hollow King','Defeat the king at the heart of the crypt.',0,1],
 ['A Brighter Dawn','Return to Warden Kael with news of victory.',0,1],
 ['The Road Goes On','Chapter complete. Repeat the crypt for greater treasures, or explore the Reach.',1,1]
 ];return {title:a[q.stage][0],desc:a[q.stage][1],count:a[q.stage][2],max:a[q.stage][3]};
}
function refreshQuest(){
 if(!hero)return;const q=questData();$('questTracker').innerHTML='<small>✦ ACTIVE QUEST · '+(hero.quest.stage<5?'CHAPTER I':'CHAPTER II')+'</small><h4>'+escapeHTML(q.title)+'</h4><p>'+escapeHTML(q.desc)+'</p><div class="quest-progress"><div style="width:'+(q.count/q.max*100)+'%"></div></div><div class="quest-count"><span>OBJECTIVE</span><span>'+q.count+' / '+q.max+'</span></div>';
}
function slotHTML(item,i,kind){
 if(!item)return '<button class="item-slot" data-'+kind+'="'+i+'" title="Empty slot">+</button>';
 return '<button class="item-slot '+((kind==='inv'&&selectedEquip===null&&selectedItem===i)||(kind==='equip'&&selectedEquip===i)?'selected':'')+'" data-'+kind+'="'+i+'" data-rarity="'+item.rarity+'" title="'+escapeHTML(item.name)+'"><span class="item-glyph">'+item.icon+'</span><small class="tier">'+item.level+'</small></button>';
}
function itemDetail(item,equipped){
 if(!item)return '<div class="item-detail"><p class="panel-subtitle">Select a piece of gear to inspect its attributes and equip it. Better equipment drops from powerful monsters.</p></div>';
 let statsHTML=Object.entries(item.stats).filter(a=>a[1]).map(a=>'<span>+'+a[1]+' '+(a[0]==='hp'?'Max Health':a[0]==='attack'?'Attack':a[0]==='armor'?'Armor':a[0]==='crit'?'Crit Chance':'Haste')+'</span>').join('');
 return '<div class="item-detail"><h4 class="rarity-'+item.rarity+'">'+escapeHTML(item.name)+'</h4><div class="item-meta">'+item.rarity.toUpperCase()+' · LV '+item.level+' · '+item.slot.toUpperCase()+'</div><div class="item-stats">'+statsHTML+'</div><div class="item-actions"><button class="small-btn accent" data-action="'+(equipped?'unequip':'equip')+'">'+(equipped?'UNEQUIP':'EQUIP')+'</button>'+(!equipped?'<button class="small-btn" data-action="salvage">SALVAGE · '+Math.round(item.value*.45)+'g</button>':'')+'</div></div>';
}
function renderInventory(){
 const eq='<div class="section-label">EQUIPPED GEAR <span>5 SLOTS</span></div><div class="equipment-grid">'+SLOTS.map(s=>'<div class="equip-cell">'+slotHTML(hero.equip[s],s,'equip')+'<small>'+s.toUpperCase()+'</small></div>').join('')+'</div>';
 const inv='<div class="section-label">BACKPACK <span>'+hero.inventory.length+' / 25</span></div><div class="item-grid">'+Array.from({length:25},(_,i)=>slotHTML(hero.inventory[i],i,'inv')).join('')+'</div>';
 const item=selectedEquip!==null?hero.equip[selectedEquip]:hero.inventory[selectedItem];return eq+inv+itemDetail(item,selectedEquip!==null);
}
function renderCharacter(){
 const s=stats(),fields=[['ATTACK',Math.round(s.attack)],['ARMOR',s.armor],['MAX HEALTH',s.hp],['MAX ENERGY',s.mana],['CRITICAL CHANCE',s.crit.toFixed(1)+'%'],['ATTACK SPEED',s.haste.toFixed(2)+'x'],['MONSTERS SLAIN',hero.kills||0]];
 return '<p class="panel-subtitle">'+CLASSES[hero.cls].desc+'</p><div class="section-label">ATTRIBUTES <span>'+hero.attrPoints+' POINTS AVAILABLE</span></div>'+
 [['might','Might','Increases damage dealt'],['vitality','Vitality','Increases life and armor'],['agility','Agility','Increases speed and critical chance'],['spirit','Spirit','Increases energy pool and regen']].map(a=>'<div class="stat-point"><div><strong>'+a[1]+'</strong><p>'+a[2]+'</p></div><div class="stat-value"><b>'+hero.attr[a[0]]+'</b><button data-attr="'+a[0]+'" '+(!hero.attrPoints?'disabled':'')+'>+</button></div></div>').join('')+
 '<div class="section-label" style="margin-top:22px">COMBAT POWER</div>'+fields.map(a=>'<div class="number-row"><span>'+a[0]+'</span><strong>'+a[1]+'</strong></div>').join('')+
 '<div class="separator"></div><div class="section-label">CLOAK APPEARANCE</div><div class="color-choices in-panel">'+['#5fae98','#cd7766','#889bd8','#b08bd6','#d6b574'].map(c=>'<button data-tint="'+c+'" class="color '+(hero.tint===c?'selected':'')+'" style="--swatch:'+c+'" aria-label="Change cloak color"></button>').join('')+'</div>'+
 '<button class="small-btn" data-action="respec">RESET ATTRIBUTES & TALENTS · 200g</button>';
}
function renderTalents(){
 return '<div class="panel-note">SPECIALIZATION · <strong>'+hero.talentPoints+' UNSPENT TALENT POINTS</strong><br>Earn one point each level. Stack ranks to define your build.</div>'+
 TALENTS.map(t=>'<div class="talent-card"><div class="talent-icon">'+t.icon+'</div><div class="talent-content"><strong>'+t.title+'</strong><p>'+t.desc+'</p><div class="talent-bottom"><div class="talent-dots">'+Array.from({length:t.max},(_,i)=>'<i class="'+(i<hero.talents[t.id]?'on':'')+'"></i>').join('')+'</div><button class="small-btn" data-talent="'+t.id+'" '+(!hero.talentPoints||hero.talents[t.id]>=t.max?'disabled':'')+'>+ RANK</button></div></div></div>').join('');
}
function renderJournal(){
 const q=questData();return '<div class="section-label">MAIN STORY <span>ACT '+(hero.quest.stage<5?'I':'II')+'</span></div>'+
 '<div class="journal-entry"><h4>'+escapeHTML(q.title)+'</h4><p>'+escapeHTML(q.desc)+'<br>Progress: '+q.count+' / '+q.max+'</p></div>'+
 '<div class="section-label" style="margin-top:25px">THE WORLD</div>'+
 '<div class="journal-entry"><h4>Hollowvale</h4><p>The last settlement at the edge of the Ashen Reach. Warden Kael, weaponsmith Orin and Sister Anwen offer quests, supplies and safety.</p></div>'+
 '<div class="journal-entry"><h4>The Eastern Wastes</h4><p>Beyond the forest, Varrik commands cultists, ravagers and creatures born of the broken seal.</p></div>'+
 '<div class="journal-entry"><h4>The Weeping Crypt</h4><p>Enter the violet portal to the northeast. Stronger enemies and a repeatable boss guard valuable treasures.</p></div>'+
 '<div class="panel-note">The world persists on this browser. Enemies respawn; character levels, quests, inventory and equipment save automatically.</div>';
}
function renderSettings(){
 return '<div class="section-label">PIXEL ART · GRIDWRIGHT SAMPLE</div>'+
 '<p class="panel-subtitle">The free sample adds 8-direction sprite animations for the Vanguard (Knight) and Wayfinder (Huntress). The Arcanist temporarily uses the Knight sprite. The ZIP remains on this device.</p>'+
 '<div class="panel-note" id="spritePanelStatus">'+escapeHTML(window.StoneGridwright?.status()||'Pixel sprite importer unavailable')+'</div>'+
 '<div class="item-actions"><button class="small-btn accent" data-action="importSprites">IMPORT / REPLACE ZIP</button>'+
 '<button class="small-btn" data-action="removeSprites">USE ORIGINAL ART</button></div>'+
 '<div class="separator"></div><div class="section-label">PREFERENCES</div>'+
 [['sound','Combat sound effects'],['damage','Floating damage numbers'],['autoAttack','Automatically attack nearby enemies'],['shake','Full combat particles']].map(a=>'<label class="settings-row"><span><strong>'+a[1]+'</strong><small>'+({sound:'Generated sounds; no external music',damage:'See each hit and critical strike',autoAttack:'Attacks creatures within weapon reach',shake:'Extra glow and combat particles'}[a[0]])+'</small></span><input type="checkbox" data-setting="'+a[0]+'" '+(hero.settings[a[0]]?'checked':'')+'></label>').join('')+
 '<div class="section-label" style="margin-top:24px">CONTROLS</div><div class="panel-note">LEFT CLICK: move / attack / interact<br>WASD: direct movement<br>RIGHT CLICK / Q: primary ability<br>E / R: class abilities<br>4: healing flask<br>SPACE: evade<br>F: nearby interaction<br>I / C / T / J: panels</div>'+
 '<button class="small-btn" data-action="save">SAVE NOW</button> <button class="small-btn" data-action="newGame">DELETE SAVE & RESTART</button>';
}
function setPanel(name){if(!hero)return;panel=panel===name?null:name;const el=$('sidepanel');$('dialogue').classList.add('hidden');el.classList.toggle('hidden',!panel);for(const b of document.querySelectorAll('.nav [data-panel]'))b.classList.toggle('active',b.dataset.panel===panel);if(panel){moveTo=null;targetId=null;renderPanel();}}
function renderPanel(){
 if(!hero||!panel)return;const title={inventory:'Inventory',character:'Character',talents:'Talent Tree',journal:'Quest Journal',settings:'Settings'}[panel];$('panelTitle').textContent=title;$('panelEyebrow').textContent=panel==='inventory'?'THE RELIC VAULT':panel==='character'?'YOUR ADVENTURER':panel==='talents'?'SHAPE YOUR DESTINY':panel==='journal'?'THE ASHEN REACH':'GAME OPTIONS';
 const body={inventory:renderInventory,character:renderCharacter,talents:renderTalents,journal:renderJournal,settings:renderSettings};$('panelBody').innerHTML=body[panel]();
}
function refreshPanel(){if(panel)renderPanel();}
function equipItem(){
 if(selectedEquip!==null){const old=hero.equip[selectedEquip];if(!old)return;if(hero.inventory.length>=25){toast('INVENTORY FULL');return;}hero.inventory.push(old);hero.equip[selectedEquip]=null;selectedEquip=null;}
 else {const item=hero.inventory[selectedItem];if(!item)return;if(item.level>hero.level){toast('REQUIRES LEVEL '+item.level);return;}const old=hero.equip[item.slot];hero.equip[item.slot]=item;hero.inventory.splice(selectedItem,1);if(old)hero.inventory.push(old);selectedItem=clamp(selectedItem,0,Math.max(0,hero.inventory.length-1));}
 const s=stats();hero.hp=Math.min(hero.hp,s.hp);hero.mana=Math.min(hero.mana,s.mana);tone(560,.03,.15);refreshPanel();refreshHUD();save();
}
function salvage(){const item=hero.inventory[selectedItem];if(!item)return;const gold=Math.round(item.value*.45);hero.gold+=gold;hero.inventory.splice(selectedItem,1);selectedItem=clamp(selectedItem,0,Math.max(0,hero.inventory.length-1));log('Salvaged '+item.name+' for '+gold+' gold','loot');refreshPanel();refreshHUD();save();}
function screenPoint(event){const rect=canvas.getBoundingClientRect();return StoneVisual.unproject((event.clientX-rect.left)+camera.x,(event.clientY-rect.top)+camera.y);}
function selectWorldPoint(pos){
 if(!hero||hero.hp<=0||panel||!$('dialogue').classList.contains('hidden'))return;
 mouse.worldX=pos.x;mouse.worldY=pos.y;
 const click=StoneVisual.project(pos.x,pos.y);
 let pick=null,best=Infinity;
 for(const en of enemies){
  const p=StoneVisual.project(en.x,en.y),dx=Math.abs(click.x-p.x),dy=click.y-p.y;
  const h=(en.type==='boss'||en.type==='cryptBoss')?155:en.type==='brute'?120:100;
  const inside=dx<(en.radius*1.25+15)&&dy<18&&dy>-h;
  if(inside){const weight=dx+Math.abs(dy+h*.38)*.35;if(weight<best){pick=en;best=weight;}}
 }
 if(pick){targetId=pick.id;moveTo=null;interactQueued=null;return;}
 if(zone==='wild'){for(const npc of NPCS){const p=StoneVisual.project(npc.x,npc.y);
 if(Math.abs(click.x-p.x)<32&&click.y-p.y<17&&click.y-p.y>-148){targetId=null;interactQueued={type:'npc',id:npc.id,pos:npc};moveTo={x:npc.x,y:npc.y+45};if(dist(hero,npc)<95){const id=npc.id;interactQueued=null;talk(id);}return;}}}
 const portal=PORTALS[zone],portalP=StoneVisual.project(portal.x,portal.y);
 if(Math.abs(click.x-portalP.x)<55&&click.y-portalP.y<25&&click.y-portalP.y>-145){targetId=null;interactQueued={type:'portal',pos:portal};moveTo={x:portal.x,y:portal.y+48};if(dist(hero,portal)<95){interactQueued=null;interactPortal();}return;}
 targetId=null;interactQueued=null;moveTo={x:clamp(pos.x,20,MAPS[zone].w-20),y:clamp(pos.y,20,MAPS[zone].h-20)};
}
function wire(){
 window.addEventListener('resize',()=>{if(appStarted)resize();});
 window.addEventListener('beforeunload',save);
 $('classChoices').addEventListener('click',e=>{const b=e.target.closest('[data-class]');if(!b)return;selectedClass=b.dataset.class;document.querySelectorAll('[data-class]').forEach(el=>el.classList.toggle('selected',el===b));});
 $('creationColors').addEventListener('click',e=>{const b=e.target.closest('[data-color]');if(!b)return;selectedColor=b.dataset.color;document.querySelectorAll('[data-color]').forEach(el=>el.classList.toggle('selected',el===b));});
 window.StoneGridwright?.init();
 const updateSpriteStatus=()=>{const el=$('spriteStatus');if(el)el.textContent=window.StoneGridwright?.status()||'Pixel art pack unavailable';if(panel==='settings')refreshPanel();};
 window.addEventListener('stone-sprites-status',updateSpriteStatus);
 updateSpriteStatus();
 $('spriteInstall').addEventListener('click',()=>$('spriteZip').click());
 $('spriteZip').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  $('spriteInstall').disabled=true;$('spriteInstall').textContent='IMPORTING PIXEL ART…';
  try{
   await window.StoneGridwright.install(file);
   if(hero)toast('GRIDWRIGHT KNIGHT & HUNTRESS SPRITES ACTIVATED');
   $('spriteInstall').textContent='✓ GRIDWRIGHT ART ACTIVE';
  }catch(err){
   $('spriteInstall').textContent='✦ RETRY GRIDWRIGHT IMPORT';
   if(hero)toast('SPRITE IMPORT FAILED');
   window.alert('Unable to load this pack: '+(err?.message||String(err)));
  }finally{$('spriteInstall').disabled=false;$('spriteZip').value='';updateSpriteStatus();}
 });
 $('startGame').addEventListener('click',()=>{let name=$('heroName').value.trim().slice(0,18)||'Wanderer';hero=baseSave(name,selectedClass,selectedColor);start();toast('WELCOME TO HOLLOWVALE');});
 $('heroName').addEventListener('keydown',e=>{if(e.key==='Enter')$('startGame').click();});
 document.querySelectorAll('.nav [data-panel]').forEach(b=>b.addEventListener('click',()=>setPanel(b.dataset.panel)));
 $('closePanel').addEventListener('click',()=>setPanel(null));$('closeDialogue').addEventListener('click',()=>$('dialogue').classList.add('hidden'));
 $('dialogueActions').addEventListener('click',e=>{const b=e.target.closest('[data-dialog]');if(b)dialogAction(b.dataset.dialog);});
 $('hotbar').addEventListener('click',e=>{const b=e.target.closest('[data-skill]');if(!b)return;if(b.dataset.skill==='basic'){const en=nearestEnemy(490);if(en)targetId=en.id;}else castSkill(b.dataset.skill==='potion'?'potion':b.dataset.skill);});
 $('panelBody').addEventListener('click',e=>{
  let b=e.target.closest('[data-inv]');if(b){selectedItem=Number(b.dataset.inv);selectedEquip=null;refreshPanel();return;}
  b=e.target.closest('[data-equip]');if(b){selectedEquip=b.dataset.equip;refreshPanel();return;}
  b=e.target.closest('[data-attr]');if(b&&hero.attrPoints>0){hero.attr[b.dataset.attr]++;hero.attrPoints--;const s=stats();hero.hp=Math.min(s.hp,hero.hp+7);hero.mana=Math.min(s.mana,hero.mana+5);refreshPanel();refreshHUD();save();return;}
  b=e.target.closest('[data-talent]');if(b&&hero.talentPoints>0&&hero.talents[b.dataset.talent]<5){hero.talents[b.dataset.talent]++;hero.talentPoints--;refreshPanel();save();tone(750,.03,.2);return;}
  b=e.target.closest('[data-tint]');if(b){hero.tint=b.dataset.tint;refreshPanel();save();return;}
  b=e.target.closest('[data-action]');if(!b)return;const action=b.dataset.action;
  if(action==='importSprites'){$('spriteZip').click();return;}
  if(action==='removeSprites'){window.StoneGridwright?.remove().then(()=>{refreshPanel();toast('PROCEDURAL ART ACTIVE')});return;}
  if(action==='equip'||action==='unequip')equipItem();
  if(action==='salvage')salvage();
  if(action==='respec'){if(hero.gold<200){toast('NEED 200 GOLD TO RESPEC');return;}hero.gold-=200;hero.attrPoints+=Object.values(hero.attr).reduce((a,v)=>a+v,0)-16;hero.attr={might:4,vitality:4,agility:4,spirit:4};hero.talentPoints+=Object.values(hero.talents).reduce((a,v)=>a+v,0);for(const t of Object.keys(hero.talents))hero.talents[t]=0;hero.hp=Math.min(hero.hp,stats().hp);refreshPanel();save();toast('ATTRIBUTES & TALENTS RESET');}
  if(action==='save'){save();toast('YOUR ADVENTURE IS SAVED');}
  if(action==='newGame'){if(window.confirm('Delete your local character, equipment and progress? This cannot be undone.')){localStorage.removeItem('stone-save-v1');window.location.reload();}}
 });
 $('panelBody').addEventListener('change',e=>{const a=e.target;if(a.dataset.setting){hero.settings[a.dataset.setting]=a.checked;save();}});
 canvas.addEventListener('contextmenu',e=>{e.preventDefault();if(!hero)return;const p=screenPoint(e);mouse.worldX=p.x;mouse.worldY=p.y;castSkill('q');});
 canvas.addEventListener('mousedown',e=>{if(e.button!==0)return;mouse.down=true;selectWorldPoint(screenPoint(e));});
 window.addEventListener('mouseup',()=>mouse.down=false);
 canvas.addEventListener('mousemove',e=>{const pos=screenPoint(e);mouse.worldX=pos.x;mouse.worldY=pos.y;mouse.x=e.clientX;mouse.y=e.clientY;if(mouse.down&&!targetId&&!interactQueued)selectWorldPoint(pos);});
 canvas.addEventListener('mouseleave',()=>mouse.down=false);
 window.addEventListener('keydown',e=>{
  if(!appStarted&&['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;
  const k=e.key.toLowerCase();keys[k]=true;
  if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
  if(k==='escape'){if(panel)setPanel(null);else $('dialogue').classList.add('hidden');return;}
  if(!appStarted||e.repeat)return;
  if(k==='i')setPanel('inventory');if(k==='c')setPanel('character');if(k==='t')setPanel('talents');if(k==='j')setPanel('journal');
  if(k==='f')interactNear();if(k==='q'||k==='e'||k==='r')castSkill(k);if(k==='4')castSkill('potion');if(k===' ')dodge();
 });
 window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
 window.addEventListener('blur',()=>{keys={};mouse.down=false;});
 $('revive').addEventListener('click',()=>{hero.zone='wild';hero.x=428;hero.y=850;hero.hp=stats().hp;hero.mana=stats().mana;hero.gold=Math.round(hero.gold*.92);$('deathScreen').classList.add('hidden');loadZone('wild',true);save();toast('A SECOND CHANCE — 8% GOLD LOST');});
}
createDecor();createSpawns();wire();
if(load())start();
})();