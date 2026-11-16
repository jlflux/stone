/* STONE: Ashfall — 2.5D isometric visual engine.
   Gameplay uses an orthogonal logical world. Projection only affects rendering,
   picking and screen-relative keyboard directions. This preserves old saves. */
(function(){
'use strict';
const PX=.88,PY=.46,TILE=96,PI=Math.PI;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hash=(a,b)=>{const x=Math.sin(a*127.13+b*311.77+19.9)*43758.545;return x-Math.floor(x);};
const lerp=(a,b,t)=>a+(b-a)*t;
const iso=(x,y)=>({x:(x-y)*PX,y:(x+y)*PY});
const inv=(x,y)=>({x:(x/PX+y/PY)*.5,y:(y/PY-x/PX)*.5});
const visible=(x,y,w,h,pad=120)=>x>-pad&&x<w+pad&&y>-pad&&y<h+pad;
let C=null,V=null,cam=null,tm=0,zone=null;
const coord=(x,y)=>{const p=iso(x,y);return {x:p.x-cam.x,y:p.y-cam.y};};
function polygon(points,color,stroke){
 C.beginPath();C.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)C.lineTo(points[i][0],points[i][1]);C.closePath();
 C.fillStyle=color;C.fill();if(stroke){C.strokeStyle=stroke;C.lineWidth=1;C.stroke();}
}
function ell(x,y,rx,ry,color){C.fillStyle=color;C.beginPath();C.ellipse(x,y,rx,ry,0,0,PI*2);C.fill();}
function line(points,color,width=1){C.strokeStyle=color;C.lineWidth=width;C.lineCap='round';C.lineJoin='round';C.beginPath();C.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)C.lineTo(points[i][0],points[i][1]);C.stroke();}
function round(x,y,w,h,r,color){C.fillStyle=color;C.beginPath();C.roundRect(x,y,w,h,r);C.fill();}
function grad(x,y,r,inner,outer){const g=C.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,inner);g.addColorStop(1,outer);return g;}
function label(text,x,y,color='#efdfc2',size=11){
 C.textAlign='center';C.textBaseline='middle';C.font='700 '+size+'px "DM Sans",sans-serif';C.shadowColor='#071012';C.shadowBlur=7;C.fillStyle=color;C.fillText(text,x,y);C.shadowBlur=0;
}
function tile(x,y,n,i,j,kind){
 const a=coord(x,y),b=coord(x+TILE,y),d=coord(x,y+TILE),c=coord(x+TILE,y+TILE);
 const ash=x>1600,roadY=830+Math.sin(x*.005)*130,road=Math.abs(y-roadY)<68&&x>355;
 const town=Math.hypot(x-425,y-842)<298;
 const crypt=kind==='crypt';
 let base;
 if(crypt){base=n>.69?'#34434c':n>.41?'#2e3d44':'#29373f';}
 else if(town){base=n>.72?'#79785e':n>.44?'#6c7159':'#69765c';}
 else if(road){base=n>.55?'#817559':'#756f55';}
 else if(ash){base=n>.69?'#56544c':n>.38?'#555b4f':'#4d554d';}
 else {base=n>.82?'#4e7058':n>.53?'#45664f':n>.21?'#40604b':'#3d5c47';}
 polygon([[a.x,a.y],[b.x,b.y],[c.x,c.y],[d.x,d.y]],base,crypt?'#15252b42':n>.86?'#334c3c30':null);
 // Texture stays in the actual tile shape. Ground details are anchored to its interior.
 const k=hash(i*4+31,j*7-19),h=hash(i+197,j+34);
 if(crypt||town||road){
  for(let m=0;m<3;m++){
   const fx=(.15+m*.34+(k-.5)*.1),fy=.15+((m*2+h)%3)*.28;
   const p=coord(x+fx*TILE,y+fy*TILE);
   line([[p.x-9,p.y-2],[p.x,p.y+3],[p.x+8,p.y-1]],crypt?'#121f2866':town?'#4a5a4359':'#574c4159',1);
  }
  if(crypt&&k>.76){const p=coord(x+TILE*.47,y+TILE*.55);
   line([[p.x-20,p.y-6],[p.x-6,p.y+1],[p.x+9,p.y-3],[p.x+14,p.y+9]],'#172630',2);
   line([[p.x-6,p.y+1],[p.x-2,p.y+10]],'#15242e',1);
  }
 }else{
  for(let m=0;m<5;m++){const xx=(k*(m+2)*23)%1, yy=(h*(m+4)*19)%1,p=coord(x+xx*TILE,y+yy*TILE);
   C.strokeStyle=ash?'#9f9b7770':'#829e7379';C.lineWidth=.8;C.beginPath();C.moveTo(p.x,p.y);C.lineTo(p.x-2,p.y-4-(m%3));C.moveTo(p.x,p.y);C.lineTo(p.x+2,p.y-3);C.stroke();
  }
  if(k>.86){const p=coord(x+TILE*.61,y+TILE*.37);ell(p.x,p.y,3,1.6,ash?'#c1a37e':'#a6ac7c');}
 }
 if(town&&k>.82){const p=coord(x+TILE*.3,y+TILE*.7);ell(p.x,p.y,6,3,'#a9a48860');}
}
function drawGround(W){
 const bounds=[inv(cam.x-160,cam.y-140),inv(cam.x+V.w+160,cam.y-140),inv(cam.x+V.w+160,cam.y+V.h+140),inv(cam.x-160,cam.y+V.h+140)];
 const xs=bounds.map(v=>v.x),ys=bounds.map(v=>v.y);
 const minx=Math.floor(Math.min(...xs)/TILE)-1,maxx=Math.ceil(Math.max(...xs)/TILE)+1;
 const miny=Math.floor(Math.min(...ys)/TILE)-1,maxy=Math.ceil(Math.max(...ys)/TILE)+1;
 C.fillStyle=zone==='crypt'?'#121e28':'#1d322b';C.fillRect(0,0,V.w,V.h);
 for(let i=minx;i<=maxx;i++)for(let j=miny;j<=maxy;j++){
  const x=i*TILE,y=j*TILE;
  const center=coord(x+TILE*.5,y+TILE*.5);
  if(!visible(center.x,center.y,V.w,V.h,TILE*1.4))continue;
  tile(x,y,hash(i+125,j+175),i,j,zone);
 }
 drawWorldDetails();
}
function drawWorldDetails(){
 const town=coord(425,842);
 if(visible(town.x,town.y,V.w,V.h,400)){
  C.save();C.translate(town.x,town.y);
  C.strokeStyle='#d8c6953d';C.lineWidth=3;C.beginPath();C.ellipse(0,0,244,120,0,0,PI*2);C.stroke();
  for(let i=0;i<24;i++){let a=i*PI/12;const x=Math.cos(a)*233,y=Math.sin(a)*114;ell(x,y,3,2,'#d8c6956e');}
  C.restore();
 }
 // Spellwork on old crypt floor.
 if(zone==='crypt'){
  for(const [xx,yy,r] of [[1200,170,58],[910,900,75],[1545,635,100],[680,520,61]]){
   const p=coord(xx,yy);if(!visible(p.x,p.y,V.w,V.h,130))continue;
   C.save();C.translate(p.x,p.y);
   C.strokeStyle='#b09bd54a';C.lineWidth=2;C.beginPath();C.ellipse(0,0,r,r*.51,0,0,PI*2);C.stroke();
   C.beginPath();C.ellipse(0,0,r*.78,r*.39,0,0,PI*2);C.stroke();
   for(let i=0;i<8;i++){const a=i*PI/4;ell(Math.cos(a)*r,Math.sin(a)*r*.51,3,3,'#cdb2dfb0');}
   C.restore();
  }
 }
}
function wallBox(q,height,stone,side){
 const pts=q.map(v=>coord(v[0],v[1])),top=pts.map(v=>[v.x,v.y-height]);
 polygon([top[0],top[1],[pts[1].x,pts[1].y],[pts[0].x,pts[0].y]],side);
 polygon([top[1],top[2],[pts[2].x,pts[2].y],[pts[1].x,pts[1].y]],stone);
 polygon([top[2],top[3],[pts[3].x,pts[3].y],[pts[2].x,pts[2].y]],side);
 polygon([top[3],top[0],[pts[0].x,pts[0].y],[pts[3].x,pts[3].y]],stone);
 return {pts,top};
}
function building(x,y,w,h,type){
 const p=coord(x,y);if(!visible(p.x,p.y,V.w,V.h,250))return;
 const q=[[x-w/2,y-h/2],[x+w/2,y-h/2],[x+w/2,y+h/2],[x-w/2,y+h/2]];
 const isForge=type==='forge',isChapel=type==='chapel';
 const height=isChapel?98:76,colors=isForge?['#776c5f','#554b46','#b18b6a']:isChapel?['#82877a','#62675b','#aaa48b']:['#887965','#625a4e','#a56e50'];
 const wb=wallBox(q,height,colors[0],colors[1]),t=wb.top.map(a=>({x:a[0],y:a[1]}));
 const ridgeA=coord(x-w/2,y),ridgeB=coord(x+w/2,y),lift=isChapel?45:39;
 polygon([[t[0].x-9,t[0].y+2],[t[1].x+7,t[1].y+3],[ridgeB.x,ridgeB.y-height-lift],[ridgeA.x,ridgeA.y-height-lift]],'#ad795d','#59483d');
 polygon([[ridgeA.x,ridgeA.y-height-lift],[ridgeB.x,ridgeB.y-height-lift],[t[2].x+8,t[2].y+3],[t[3].x-9,t[3].y+2]],isChapel?'#747b70':isForge?'#8d6451':'#855e4b','#51463f');
 line([[ridgeA.x,ridgeA.y-height-lift],[ridgeB.x,ridgeB.y-height-lift]],'#dfbb8b',3);
 // Roof tile seams
 for(let i=1;i<6;i++){
  const u=i/6,a=[lerp(ridgeA.x,t[3].x,u),lerp(ridgeA.y-height-lift,t[3].y,u)];
  const b=[lerp(ridgeB.x,t[2].x,u),lerp(ridgeB.y-height-lift,t[2].y,u)];
  line([a,b],'#5d4b4266',1.5);
 }
 // Door is painted onto the right facing wall in this camera.
 const center=[(t[2].x+t[3].x)*.5,(t[2].y+t[3].y)*.5+height*.65];
 polygon([[center[0]-13,center[1]-27],[center[0]+7,center[1]-22],[center[0]+7,center[1]+8],[center[0]-13,center[1]+3]],'#3b332e');
 ell(center[0]+2,center[1]-8,1.5,1.5,'#dac183');
 const win=[(t[1].x+t[2].x)*.5,(t[1].y+t[2].y)*.5+36];
 polygon([[win[0]-7,win[1]-13],[win[0]+8,win[1]-6],[win[0]+8,win[1]+6],[win[0]-7,win[1]-1]],'#e7b56f','#50473a');
 line([[win[0],win[1]-11],[win[0],win[1]+3]],'#745f44',2);
 if(isForge){const smoke=coord(x+60,y-32);round(smoke.x-8,smoke.y-height-lift-20,17,31,2,'#695f53');for(let i=0;i<4;i++){ell(smoke.x+Math.sin(tm*1.5+i)*8,smoke.y-height-lift-29-i*12,7+i*2,4+i,'#aab5aa'+(i%2?'19':'26'));}}
 if(isChapel){const topP=coord(x,y-8);round(topP.x-4,topP.y-height-lift-28,8,35,1,'#ddd1ad');round(topP.x-13,topP.y-height-lift-21,26,7,1,'#ddd1ad');}
 // Pale windows throw a small cone of light onto cobbles.
 C.fillStyle=grad(win[0],win[1]+10,68,'#ffd08821','#ffd08800');C.fillRect(win[0]-70,win[1]-55,140,120);
}
function props(){
 if(zone==='wild'){
  building(220,635,180,135,'chapel');building(575,1000,190,160,'forge');building(571,687,185,145,'tavern');
  const lamps=[[343,648],[610,822],[258,1000]];
  for(const [x,y] of lamps){const p=coord(x,y);if(!visible(p.x,p.y,V.w,V.h,130))continue;line([[p.x,p.y],[p.x,p.y-49]],'#303d3b',7);polygon([[p.x-9,p.y-58],[p.x+8,p.y-58],[p.x+11,p.y-42],[p.x-10,p.y-42]],'#d5a764','#9c7b4b');C.fillStyle=grad(p.x,p.y-49,95,'#f4c77f4f','#f4c77f00');C.fillRect(p.x-95,p.y-144,190,190);}
  for(const [x,y] of [[2120,755],[2180,739],[2310,978],[2370,971]]){const p=coord(x,y);if(!visible(p.x,p.y,V.w,V.h,100))continue;stonePillar(p.x,p.y,64,.9);}
 }else{
  // Tall crypt architecture built into the playable floor.
  for(let i=0;i<8;i++){
   const p=coord(130+i*203,72),q=coord(130+i*203,1118);
   if(visible(p.x,p.y,V.w,V.h,120))stonePillar(p.x,p.y,110,1);
   if(visible(q.x,q.y,V.w,V.h,120))stonePillar(q.x,q.y,110,1);
  }
  for(let i=0;i<6;i++){
   const p=coord(80,165+i*184),q=coord(1650,165+i*184);
   if(visible(p.x,p.y,V.w,V.h,120))stonePillar(p.x,p.y,86,.85);
   if(visible(q.x,q.y,V.w,V.h,120))stonePillar(q.x,q.y,86,.85);
  }
 }
}
function stonePillar(x,y,height,s){
 C.save();C.translate(x,y);C.scale(s,s);ell(0,7,22,10,'#08131890');
 polygon([[-16,3],[16,3],[16,-height],[0,-height-9],[-16,-height]],'#575e60');
 polygon([[16,3],[25,-3],[25,-height+2],[16,-height]],'#343c44');
 round(-21,-height-13,46,13,1,'#89908b');round(-26,-height-18,56,7,1,'#afb1a2');
 round(-19,-2,43,8,1,'#6b7776');line([[0,-height],[0,-10]],'#abb0a24c',2);C.restore();
}
function decor(a){
 const p=coord(a.x,a.y);if(!visible(p.x,p.y,V.w,V.h,165))return;
 const kind=a.kind,s=a.s||1,alt=a.v||0;C.save();C.translate(p.x,p.y);C.scale(s,s);
 if(kind==='tree'){
  ell(2,10,29,11,'#0b261b66');
  round(-7,-60,14,69,2,'#3b3c2b');round(-4,-57,6,63,2,'#67603a');
  for(let i=0;i<4;i++){
   const top=-138+i*29,r=26+i*10,green=alt>.45?['#56755e','#416a53','#3b604d','#315843'][i]:['#5d7660','#4b6b54','#3d5d4c','#315443'][i];
   polygon([[0,top],[-r,top+53],[0,top+38],[r,top+53]],green);
   polygon([[0,top],[-r,top+53],[0,top+38]],'#243f33a6');
   line([[-r*.8,top+47],[0,top+37],[r*.7,top+47]],'#a0b38a26',2);
  }
  ell(-7,-114,9,3,'#9baf8555');
 }else if(kind==='dead'){
  ell(0,7,26,10,'#10231f70');
  line([[0,6],[0,-84],[-13,-105]],'#544a3f',13);line([[0,-64],[33,-92],[36,-108]],'#645547',8);line([[-1,-43],[-26,-58],[-38,-85]],'#685e4c',8);line([[0,-60],[-12,-93]],'#7f6c58',3);
 }else if(kind==='rock'||kind==='rubble'){
  ell(1,10,30,10,'#101d2095');
  polygon([[-26,5],[-18,-16],[3,-28],[23,-17],[30,4]],alt>.5?'#9a9b8a':'#7c8581','#3e4b4d');
  polygon([[-26,5],[-18,-16],[3,-28],[0,4]],'#4c5e59a3');
  polygon([[3,-28],[23,-17],[30,4],[0,4]],'#a0a397');
  line([[-12,-15],[0,-10],[11,-20]],'#cad0b44f',2);
 }else if(kind==='bush'){
  ell(0,5,27,11,'#142b208c');
  ell(-16,-6,16,16,'#375943');ell(5,-14,22,22,'#4a7658');ell(18,-4,16,16,'#315940');ell(-4,-28,11,7,'#72916b');ell(10,-27,7,5,'#88a57a');
 }else if(kind==='crystal'){
  ell(0,9,20,7,'#15212699');const c=zone==='crypt'?'#a790da':'#7ebdb3';C.shadowBlur=13;C.shadowColor=c;
  polygon([[-15,5],[-9,-51],[-2,-64],[10,-33],[7,5]],c);polygon([[-2,-64],[10,-33],[7,5],[0,-8]],'#4c6782');
  polygon([[4,7],[14,-34],[22,-44],[26,7]],'#7b9baa');
  polygon([[-17,7],[-25,-14],[-15,-30],[-8,7]],'#5c8896');C.shadowBlur=0;
 }else if(kind==='pillar'){stonePillar(0,0,82,1);}
 else if(kind==='bones'){ell(0,5,20,6,'#16202466');line([[-16,1],[18,-12]],'#b1ad9b',4);line([[-8,-14],[16,9]],'#c9c6b6',3);ell(9,-10,8,6,'#bbb4a2');}
 else if(kind==='flower'){ell(-1,4,12,5,'#284d3c');for(let i=0;i<5;i++){const a=i*PI*2/5;ell(Math.cos(a)*8,Math.sin(a)*6-5,2.5,3.5,i%2?'#c7a875':'#b5caa0');}}
 C.restore();
}
function humanoid(p,skin,cloth,weapon,options={}){
 const x=p.x,y=p.y,scale=options.scale||1,walk=options.walk||0,attack=options.attack||0;
 const facing=options.facing||{x:1,y:0};
 const fx=(facing.x-facing.y)*PX,fy=(facing.x+facing.y)*PY;
 const back=fy<-.22,flip=fx<0;
 C.save();C.translate(x,y);C.scale(flip?-scale:scale,scale);
 const bob=Math.abs(Math.sin(walk))*2.2;
 ell(0,5,19,8,'#07191883');
 const legSwing=Math.sin(walk)*7;
 // Draw moving shadow and separate foot silhouettes for a true walk cycle.
 polygon([[-11,-8],[-4+legSwing*.5,-7],[0+legSwing,8],[-12+legSwing*.65,9]],'#303b40');
 polygon([[3-legSwing*.5,-9],[11,-8],[13-legSwing*.65,7],[2-legSwing,7]],'#232d32');
 ell(-7+legSwing*.65,7,7,3,'#1b262a');ell(8-legSwing*.65,7,7,3,'#1a292f');
 // The cloth cape ripples in a direction-dependent arc.
 polygon([[-16,-37-bob],[15,-37-bob],[17+Math.sin(tm*2+walk)*4,2],[1,10],[-19,4]],cloth);
 polygon([[-15,-34-bob],[-1,-28-bob],[1,7],[-18,1]],'#17272957');
 if(back){polygon([[-11,-49-bob],[13,-49-bob],[17,-27-bob],[-15,-25-bob]],options.armor||'#768981');}
 else {
  polygon([[-14,-44-bob],[13,-44-bob],[17,-25-bob],[10,-14-bob],[-11,-17-bob],[-18,-30-bob]],options.armor||'#677a75');
  polygon([[-10,-41-bob],[-1,-43-bob],[-4,-22-bob],[-12,-27-bob]],'#e0cf9c28');
  line([[-5,-22-bob],[8,-22-bob]],'#e4d0a15c',2);
 }
 // Armor at shoulders.
 ell(-14,-39-bob,8,9,options.shoulder||'#a3a48d');ell(13,-38-bob,8,9,options.shoulder||'#848f8a');
 // Hands move while running; attacking overrides movement.
 const handSwing=attack*12;
 ell(-16,-21-bob+legSwing*.17,5,6,skin);ell(19,-23-bob-legSwing*.18-handSwing,5,6,skin);
 ell(0,-55-bob,13,16,skin);
 if(!back){ell(-5,-54-bob,1.5,2,'#283238');ell(5,-54-bob,1.5,2,'#283238');}
 if(options.hood){
  polygon([[-15,-58-bob],[-11,-72-bob],[9,-73-bob],[16,-55-bob],[9,-48-bob]],options.hood);
  if(!back)ell(0,-55-bob,10,10,'#262f35');
  if(!back){ell(-5,-55-bob,2,1,'#dfa77f');ell(5,-55-bob,2,1,'#dfa77f');}
 }else{
  polygon([[-14,-62-bob],[-8,-74-bob],[6,-71-bob],[13,-60-bob],[9,-65-bob],[-7,-63-bob]],options.helm||'#524a40');
  if(options.helmet)polygon([[-14,-64-bob],[-9,-75-bob],[10,-75-bob],[15,-64-bob]],'#b0b3aa');
 }
 if(weapon==='sword'){
  ell(-23,-25-bob,13,15,'#82745d');ell(-23,-25-bob,8,11,'#b9a27b');ell(-23,-25-bob,3,5,'#d7caa5');
  C.save();C.translate(19,-29-bob-handSwing);C.rotate(-.12-attack*.95);
  line([[0,11],[4,-36]],options.gold?'#f2bc75':'#d4d7cb',5);
  polygon([[4,-43],[0,-31],[9,-31]],options.gold?'#ffe2a4':'#e5e6d9');
  line([[-7,-14],[13,-14]],'#a58c5d',4);C.restore();
 }else if(weapon==='bow'){
  C.save();C.translate(19,-28-bob-handSwing);
  C.strokeStyle='#d4a46e';C.lineWidth=4;C.beginPath();C.arc(0,0,23,-1.4,1.4);C.stroke();line([[3,-23],[3,23]],'#ece2c1',1.5);
  if(attack>0)line([[3,0],[-25,-12]],'#f4e8c7',3);
  C.restore();
 }else if(weapon==='staff'){
  line([[21,-8],[24,-86]],'#9f8ebc',5);ell(24,-88,8+Math.sin(tm*5)*1.5,10,'#b3a9ff');
  C.fillStyle=grad(24,-88,26,'#cbbcffb3','#cbbcff00');C.fillRect(0,-112,50,49);
  polygon([[17,-89],[24,-100],[31,-89],[24,-79]],'#efe1ff');
 }else if(weapon==='spear'){line([[23,3],[30,-66]],'#b9ada1',5);polygon([[30,-82],[23,-63],[36,-63]],'#e1d2b6');}
 C.restore();
}
function heroDraw(H){
 const p=coord(H.x,H.y);if(!visible(p.x,p.y,V.w,V.h,100))return;
 const st=V.stats,gear=H.equip,rare=gear.armor&&['rare','epic','legendary'].includes(gear.armor.rarity);
 const face={x:H.faceX??1,y:H.faceY??0};
 const moving=H.moving||false;
 const walk=moving?tm*11.5:0;
 const attack=tm<(H.swingUntil||0)?Math.sin((H.swingUntil-tm)/.23*PI):0;
 if(V.now<V.buffUntil){C.strokeStyle='#f7c7809c';C.lineWidth=3;C.beginPath();C.ellipse(p.x,p.y,29,14,0,0,PI*2);C.stroke();}
 humanoid(p,'#d7ae8a',H.tint,H.cls==='vanguard'?'sword':H.cls==='wayfinder'?'bow':'staff',{
  facing:face,walk,attack,armor:rare?'#acb1a5':'#727f75',
  shoulder:rare?'#bdad92':'#8d9e91',helm:gear.helm?'#a8a99a':'#4e453d',
  helmet:!!gear.helm,hood:H.cls==='arcanist'?'#343851':null,gold:gear.weapon&&gear.weapon.rarity==='legendary'
 });
 if(V.now<V.dodgeUntil){ell(p.x,p.y-27,20,37,'#dcead620');}
 label(H.name,p.x,p.y-91,'#f4e5c7',11);
}
function npcDraw(n){
 const p=coord(n.x,n.y);if(!visible(p.x,p.y,V.w,V.h,110))return;
 humanoid(p,n.id==='smith'?'#bc9879':'#d1ac89',n.id==='healer'?'#b2aa90':n.id==='smith'?'#8b7969':'#62776d',
  n.id==='smith'?'spear':n.id==='healer'?'staff':'sword',{walk:0,facing:{x:-1,y:1},
   hood:n.id==='healer'?'#738e7d':null,armor:n.id==='warden'?'#9a9b89':'#7e8175',scale:.94});
 ell(p.x,p.y-106,15,14,'#132522d9');C.strokeStyle='#c1a470';C.lineWidth=1.3;C.beginPath();C.ellipse(p.x,p.y-106,15,14,0,0,PI*2);C.stroke();
 label(n.icon,p.x,p.y-106,'#f5d6a0',14);label(n.name,p.x,p.y-130,'#f4e6c9',10);
 if(Math.hypot(V.hero.x-n.x,V.hero.y-n.y)<140)label('[ F ] TALK',p.x,p.y-150,'#e6c382',9);
}
function enemyDraw(E){
 const p=coord(E.x,E.y);if(!visible(p.x,p.y,V.w,V.h,140))return;
 const boss=E.type==='boss'||E.type==='cryptBoss',scale=boss?1.3:E.type==='brute'||E.type==='guardian'?1.13:1;
 const walk=(Math.hypot(E.x-E.homeX,E.y-E.homeY)<3&&Math.hypot(V.hero.x-E.x,V.hero.y-E.y)>E.aggro)?0:tm*6+(E.id*.53);
 const face={x:V.hero.x-E.x,y:V.hero.y-E.y};
 if(E.type==='wolf'){
  C.save();C.translate(p.x,p.y);C.scale(scale,scale);
  ell(0,4,32,9,'#07182199');const t=Math.sin(walk)*3;
  ell(0,-15,30,17,'#6c6560');ell(13,-18,19,15,'#81756a');
  polygon([[12,-26],[13,-51],[25,-31]],'#b3a38d');polygon([[30,-28],[40,-48],[37,-21]],'#b6a694');
  ell(26,-24,11,11,'#8d8171');ell(33,-27,2.5,2,'#f2a37d');
  line([[-11,-9],[-14+t,7]],'#61564e',8);line([[9,-8],[8-t,7]],'#514b46',8);
  line([[-24,-17],[-38,-32]],'#685e53',6);C.restore();
 }else if(E.type==='skeleton'||E.type==='guardian'){
  humanoid(p,'#c7c4ad',E.type==='guardian'?'#67727e':'#5f695f','spear',{walk,attack:tm<(E.swingUntil||0)?1:0,scale:scale*.92,
   facing:face,armor:E.type==='guardian'?'#a5acb8':'#8c968e',helmet:E.type==='guardian',helm:'#b8b5a4'});
  const head=coord(E.x,E.y);ell(head.x-4,head.y-55,2,3,'#18272c');ell(head.x+5,head.y-55,2,3,'#18272c');
 }else if(E.type==='cultist'||E.type==='wraith'){
  humanoid(p,E.type==='wraith'?'#9bbcca':'#a48ba6',E.type==='wraith'?'#547f87':'#654a72',
   'staff',{walk:E.type==='wraith'?Math.sin(tm*3)*.5:walk,scale:.9,
   facing:face,hood:E.type==='wraith'?'#476979':'#4d395f',armor:'#4e5265'});
  if(E.type==='wraith'){ell(p.x,p.y-22,28,38,'#7ea6c015');}
 }else{
  humanoid(p,'#a58d85',E.type==='cryptBoss'?'#74568f':'#79604a','sword',{walk,attack:tm<(E.swingUntil||0)?Math.sin((E.swingUntil-tm)/.28*PI):0,scale:1.48,
    facing:face,hood:E.type==='cryptBoss'?'#695183':'#70604d',armor:E.type==='cryptBoss'?'#87729b':'#b2936c',
    shoulder:'#b9a080',gold:boss});
  const a=Math.sin(tm*3)*3;
  polygon([[p.x-31,p.y-81+a],[p.x-35,p.y-113+a],[p.x-16,p.y-96+a]],'#c3a287');
  polygon([[p.x+18,p.y-95+a],[p.x+36,p.y-118+a],[p.x+29,p.y-78+a]],'#c3a287');
 }
 if(E.flash>0){C.globalAlpha=clamp(E.flash*3,0,.8);ell(p.x,p.y-31,20*scale,38*scale,'#fff5e9');C.globalAlpha=1;}
 if(V.targetId===E.id){C.strokeStyle='#e9b67f';C.lineWidth=2.5;C.beginPath();C.ellipse(p.x,p.y,E.radius*PX+12,E.radius*PY+9,0,0,PI*2);C.stroke();}
 if(E.hp<E.maxHp||boss){
  const w=boss?110:45,y=p.y-(boss?116:93);
  round(p.x-w/2-1,y-1,w+2,8,2,'#17262b');
  round(p.x-w/2,y,w*clamp(E.hp/E.maxHp,0,1),5,1,boss?'#b97669':'#c37c70');
 }
 if(boss)label((E.type==='boss'?'VARRIK, THE ASHBOUND':'THE HOLLOW KING'),p.x,p.y-142,'#e8be96',10);
}
function dropDraw(D){
 const p=coord(D.x,D.y);if(!visible(p.x,p.y,V.w,V.h,60))return;
 const y=p.y-11-Math.sin(tm*5+D.id)*3;ell(p.x,p.y,16,6,'#09181e84');
 let color=D.kind==='gold'?'#efd283':D.kind==='shard'?'#b8a5f0':({common:'#d5d5c9',magic:'#80c5ed',rare:'#f4cf74',epic:'#c4a0ea',legendary:'#ffa763'}[D.item.rarity]);
 C.shadowColor=color;C.shadowBlur=15;polygon([[p.x,y-13],[p.x+9,y],[p.x,y+10],[p.x-9,y]],color);
 polygon([[p.x,y-13],[p.x+9,y],[p.x,y+10]],'#00000044');C.shadowBlur=0;
 if(D.kind==='item'&&D.item.rarity!=='common'){
  C.strokeStyle=color;C.lineWidth=1.2;C.globalAlpha=.75;
  C.beginPath();C.ellipse(p.x,p.y,17,8,0,0,PI*2);C.stroke();C.globalAlpha=1;
 }
}
function portalDraw(P){
 const p=coord(P.x,P.y);if(!visible(p.x,p.y,V.w,V.h,170))return;
 C.save();C.translate(p.x,p.y);
 ell(0,3,60,27,'#0b1725aa');C.strokeStyle='#aaa0bf';C.lineWidth=11;
 C.beginPath();C.ellipse(0,-40,43,74,0,PI,0);C.stroke();
 for(let i=0;i<7;i++){
  const a=PI+i*PI/6;const x=Math.cos(a)*43,y=-40+Math.sin(a)*74;
  ell(x,y,8,9,'#7f8397');
 }
 C.shadowColor='#af88f1';C.shadowBlur=30;
 C.fillStyle=grad(0,-47,90,'#b397e6b2','#8b66cb00');
 C.fillRect(-87,-139,174,173);
 C.strokeStyle='#d5bfff';C.lineWidth=4;
 C.beginPath();C.ellipse(0,-44,29+Math.sin(tm*3)*2,62,0,0,PI*2);C.stroke();
 for(let i=0;i<9;i++){const yy=-107+(i*21+tm*27)%118;ell(Math.sin(tm*1.7+i)*19,yy,3,5,'#d9c4ff');}
 C.shadowBlur=0;C.restore();label(P.name,p.x,p.y-141,'#e1c9ff',9);
}
function effectDraw(E){
 const p=coord(E.x,E.y);C.save();C.globalAlpha=clamp(E.life/E.max,0,1);
 if(E.type==='bolt'||E.type==='slash'||E.type==='dash'){
  const q=coord(E.tx,E.ty);C.strokeStyle=E.color;C.shadowColor=E.color;C.shadowBlur=15;
  C.lineWidth=E.type==='dash'?9:E.type==='slash'?6:4;
  C.beginPath();if(E.type==='slash'){C.ellipse(q.x,q.y-31,33,16,0,-PI*.8,PI*.4);}
  else {C.moveTo(p.x,p.y-36);C.lineTo(q.x,q.y-30);}C.stroke();
 }
 if(E.type==='pulse'||E.type==='storm'||E.type==='meteor'){
  const r=E.type==='pulse'?E.radius*(1-E.life/E.max):E.radius;
  C.strokeStyle=E.color;C.shadowColor=E.color;C.shadowBlur=18;C.lineWidth=4;
  C.beginPath();C.ellipse(p.x,p.y,r*PX,r*PY,0,0,PI*2);C.stroke();
  if(E.type==='storm')for(let i=0;i<10;i++){let a=tm*2+i*PI/5;ell(p.x+Math.cos(a)*r*PX*.75,p.y+Math.sin(a)*r*PY*.75-20,4,11,'#e1d59a');}
  if(E.type==='meteor')ell(p.x+(E.life/E.max)*74,p.y-260*(E.life/E.max),18,24,'#dbb5ff');
 }
 C.restore();
}
function terrainLights(){
 const lights=zone==='wild'?[[425,842,230,'#eec28d13'],[2056,313,190,'#b090f01e']]:[[157,1025,160,'#b090f021'],[1545,635,260,'#a07cdf22']];
 for(const [x,y,r,col] of lights){const p=coord(x,y);if(!visible(p.x,p.y,V.w,V.h,r))continue;
  C.fillStyle=grad(p.x,p.y-42,r,col,'#00000000');C.fillRect(p.x-r,p.y-42-r,r*2,r*2);
 }
 const hero=coord(V.hero.x,V.hero.y);
 C.fillStyle=grad(hero.x,hero.y-35,145,zone==='wild'?'#f5e3be0b':'#cdd8ff10','#00000000');C.fillRect(hero.x-145,hero.y-180,290,290);
}
function visualFX(){
 for(const E of V.effects)effectDraw(E);
 for(const p of V.particles){
  const q=coord(p.x,p.y);C.globalAlpha=clamp(p.life/p.max,0,1);C.fillStyle=p.color;C.fillRect(q.x,q.y-28,p.size,p.size);C.globalAlpha=1;
 }
 for(const f of V.floats){const p=coord(f.x,f.y);C.globalAlpha=clamp(f.life/.65,0,1);label(f.text,p.x,p.y-22,f.color,13);C.globalAlpha=1;}
 if(V.moveTo){const p=coord(V.moveTo.x,V.moveTo.y);C.strokeStyle='#e9c383a8';C.lineWidth=1.5;
  C.beginPath();C.ellipse(p.x,p.y,13+Math.sin(tm*7)*2,7,0,0,PI*2);C.stroke();
  line([[p.x-7,p.y],[p.x+7,p.y]],'#dec58b82');}
}
function render(state){
 V={...state,w:state.view.w,h:state.view.h};C=state.ctx;cam=state.camera;zone=state.zone;tm=state.now;
 const W=state.maps[zone];
 drawGround(W);
 // Flattened architecture before characters (cabins & high towers draw behind their occupants).
 props();
 const actors=[];
 for(const a of state.decors)actors.push({y:iso(a.x,a.y).y,draw:()=>decor(a)});
 if(zone==='wild')for(const n of state.npcs)actors.push({y:iso(n.x,n.y).y,draw:()=>npcDraw(n)});
 for(const e of state.enemies)actors.push({y:iso(e.x,e.y).y,draw:()=>enemyDraw(e)});
 for(const d of state.drops)actors.push({y:iso(d.x,d.y).y,draw:()=>dropDraw(d)});
 actors.push({y:iso(state.hero.x,state.hero.y).y,draw:()=>heroDraw(state.hero)});
 actors.push({y:iso(state.portal.x,state.portal.y).y,draw:()=>portalDraw(state.portal)});
 actors.sort((a,b)=>a.y-b.y);
 for(const a of actors)a.draw();
 terrainLights();visualFX();
}
window.StoneVisual={project:iso,unproject:inv,render};
})();