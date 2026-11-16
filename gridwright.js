/* STONE / Gridwright sample adapter.
 * The player imports their own ZIP; artwork is never uploaded to our servers.
 * Original sprite assets © Gridwright; governed by the pack's LICENSE.txt.
 * Ready-made 2x characters are decoded in-browser, then cached in IndexedDB.
 */
(function(){
'use strict';
const ROWS=['s','sw','w','nw','n','ne','e','se'];
const ACTIONS={
 idle:{frames:4,fps:6,loop:true},
 ready:{frames:4,fps:6,loop:true},
 walk:{frames:8,fps:10,loop:true},
 run:{frames:6,fps:12,loop:true},
 slash:{frames:7,fps:14,loop:false},
 thrust:{frames:6,fps:12,loop:false},
 shoot:{frames:7,fps:12,loop:false},
 cast:{frames:7,fps:12,loop:false},
 block:{frames:4,fps:10,loop:false},
 hurt:{frames:3,fps:10,loop:false},
 death:{frames:7,fps:10,loop:false}
};
const EXPECT=['knight','huntress'],DB_NAME='stone-sprite-packs-v1',STORE='packs';
const state={ready:false,loading:false,message:'Original game artwork active',images:{},urls:[],installed:false,scale:2};
function post(msg){state.message=msg;window.dispatchEvent(new CustomEvent('stone-sprites-status',{detail:{ready:state.ready,loading:state.loading,message:msg}}));}
function openDB(){
 return new Promise((resolve,reject)=>{
  if(!('indexedDB' in window)){reject(new Error('Local browser storage is unavailable'));return;}
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||new Error('Unable to open local storage'));
 });
}
async function readDB(){
 const db=await openDB();
 return await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get('gridwright');
  r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();
 });
}
async function writeDB(blob){
 const db=await openDB();
 return await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');
  tx.objectStore(STORE).put(blob,'gridwright');
  tx.oncomplete=()=>{db.close();resolve();};
  tx.onerror=()=>{db.close();reject(tx.error||new Error('Could not save sprite pack'));};
 });
}
async function removeDB(){
 const db=await openDB();
 return await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete('gridwright');
  tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)};
 });
}
function zipEntries(data){
 const bytes=new Uint8Array(data),v=new DataView(data),max=Math.max(0,bytes.length-65557);
 let pos=-1;
 for(let i=bytes.length-22;i>=max;i--){if(v.getUint32(i,true)===0x06054b50){pos=i;break;}}
 if(pos===-1)throw new Error('This is not a valid ZIP archive.');
 let offset=v.getUint32(pos+16,true),count=v.getUint16(pos+10,true);
 if(count>10000)throw new Error('The archive has too many files.');
 const entries=new Map(),decoder=new TextDecoder();
 for(let i=0;i<count;i++){
  if(offset+46>bytes.length||v.getUint32(offset,true)!==0x02014b50)throw new Error('ZIP directory is damaged.');
  const method=v.getUint16(offset+10,true),packed=v.getUint32(offset+20,true),size=v.getUint32(offset+24,true);
  const n=v.getUint16(offset+28,true),extra=v.getUint16(offset+30,true),comment=v.getUint16(offset+32,true);
  const name=decoder.decode(bytes.subarray(offset+46,offset+46+n)),local=v.getUint32(offset+42,true);
  if(local+30>bytes.length||v.getUint32(local,true)!==0x04034b50)throw new Error('ZIP file header is damaged.');
  const start=local+30+v.getUint16(local+26,true)+v.getUint16(local+28,true);
  if(start+packed>bytes.length||size>12*1024*1024)throw new Error('Invalid sprite file size.');
  entries.set(name,{method,packed,size,start});
  offset+=46+n+extra+comment;
 }
 return {bytes,entries};
}
async function inflate(zip,entry){
 const data=zip.bytes.subarray(entry.start,entry.start+entry.packed);
 if(entry.method===0)return new Uint8Array(data);
 if(entry.method!==8)throw new Error('Unsupported ZIP compression method.');
 if(!window.DecompressionStream)throw new Error('This browser does not support native ZIP decompression. Try a recent Chrome or Edge.');
 const stream=new Blob([new Uint8Array(data)]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
 const result=new Uint8Array(await new Response(stream).arrayBuffer());
 if(result.length!==entry.size)throw new Error('Decompressed sprite size does not match the ZIP index.');
 return result;
}
function imageFromBytes(bytes){
 return new Promise((resolve,reject)=>{
  if(bytes.length<8||bytes[0]!==137||bytes[1]!==80||bytes[2]!==78||bytes[3]!==71){reject(new Error('Invalid PNG in archive.'));return;}
  const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'})),img=new Image();
  img.onload=()=>resolve({img,url});img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Unable to decode sprite sheet.'));};img.src=url;
 });
}
async function extract(blob){
 if(!blob||blob.size>55*1024*1024)throw new Error('Expected the Gridwright Free Sample ZIP (under 55 MB).');
 const zip=zipEntries(await blob.arrayBuffer());
 const filenames=[...zip.entries.keys()];
 if(!filenames.some(n=>n.endsWith('/Gridwright Isometric Hero Creator - Free Sample/README.txt')||n.endsWith('Gridwright Isometric Hero Creator - Free Sample/README.txt'))){
  throw new Error('Select the original Gridwright Isometric Hero Creator Free Sample ZIP.');
 }
 const sheets={},urls=[];
 try{
  for(const char of EXPECT){
   sheets[char]={};
   for(const animation of Object.keys(ACTIONS)){
    let name=filenames.find(n=>n.endsWith('/Characters/2x/'+char+'/'+char+'_'+animation+'.png'));
    let scale=2;
    if(!name){name=filenames.find(n=>n.endsWith('/Characters/1x/'+char+'/'+char+'_'+animation+'.png'));scale=1;}
    if(!name)throw new Error('The '+char+' '+animation+' spritesheet is missing.');
    const entry=zip.entries.get(name),bytes=await inflate(zip,entry),out=await imageFromBytes(bytes);
    const cell=64*scale;
    if(out.img.width!==ACTIONS[animation].frames*cell||out.img.height!==8*cell){
     URL.revokeObjectURL(out.url);throw new Error('Unexpected sprite dimensions for '+char+' '+animation+'.');
    }
    sheets[char][animation]={image:out.img,scale,cell,...ACTIONS[animation]};
    urls.push(out.url);
   }
  }
 }catch(error){for(const url of urls)URL.revokeObjectURL(url);throw error;}
 return {sheets,urls};
}
async function activate(blob,persist=true){
 if(state.loading)return false;
 state.loading=true;post('Reading Gridwright artwork…');
 try{
  const result=await extract(blob);
  if(persist){try{await writeDB(blob);state.installed=true;}catch(e){state.installed=false;}}
  for(const url of state.urls)URL.revokeObjectURL(url);
  state.images=result.sheets;state.urls=result.urls;state.ready=true;state.loading=false;
  post(state.installed?'Gridwright sample active · saved on this device':'Gridwright sample active · browser storage unavailable');
  return true;
 }catch(e){state.loading=false;post('Import failed: '+(e.message||String(e)));throw e;}
}
async function init(){
 if(state.loading||state.ready)return;
 try{
  const blob=await readDB();
  if(blob){await activate(blob,false);state.installed=true;post('Gridwright sample active · saved on this device');}
  else post('Procedural preview art · import Gridwright ZIP for pixel sprites');
 }catch(e){post('Procedural preview art · choose the Gridwright ZIP to import');}
}
async function remove(){
 for(const url of state.urls)URL.revokeObjectURL(url);
 state.urls=[];state.images={};state.ready=false;state.installed=false;
 try{await removeDB();}catch(e){}
 post('Gridwright sample removed. Using procedural art.');
}
function direction(dx,dy){
 // The 8 rows are directions on screen, not logical-world x/y.
 const sx=(dx-dy)*.88,sy=(dx+dy)*.46;
 if(Math.abs(sx)+Math.abs(sy)<.001)return 0;
 const segment=Math.round(Math.atan2(sy,sx)/(Math.PI/4));
 return [6,7,0,1,2,3,4,5][(segment+8)%8];
}
function frameFor(action,t,started){
 const spec=ACTIONS[action]||ACTIONS.idle;
 const elapsed=Math.max(0,t-(started||0));
 return spec.loop?Math.floor(elapsed*spec.fps)%spec.frames:Math.min(spec.frames-1,Math.floor(elapsed*spec.fps));
}
function drawCharacter(ctx,x,y,character,animation,dx,dy,time,start=0,opts={}){
 if(!state.ready)return false;
 const sheet=state.images[character]?.[animation];if(!sheet)return false;
 const dir=direction(dx,dy),frame=frameFor(animation,time,start);
 const size=sheet.cell; // Gridwright's documented anchor: (32,46) at 1×.
 const drawSize=opts.drawSize||128;
 const ratio=drawSize/size;
 const ox=32*sheet.scale*ratio,oy=46*sheet.scale*ratio;
 ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.drawImage(sheet.image,frame*size,dir*size,size,size,Math.round(x-ox),Math.round(y-oy),drawSize,drawSize);
 ctx.restore();
 return true;
}
function drawHero(ctx,x,y,H,game){
 let animation=H.moving?'walk':'idle',start=H.moving?0:0;
 if(H.hp<=0){animation='death';start=H.deathStart||game.now;}
 else if(game.now<(H.hurtUntil||0)){animation='hurt';start=H.hurtStart||game.now;}
 else if(game.now<(H.castUntil||0)){animation='cast';start=H.castStart||game.now;}
 else if(game.now<(H.swingUntil||0)){
  animation=H.cls==='vanguard'?'slash':H.cls==='wayfinder'?'shoot':'cast';
  start=H.attackStart||game.now;
 }
 const char=H.cls==='wayfinder'?'huntress':'knight';
 return drawCharacter(ctx,x,y,char,animation,H.faceX??1,H.faceY??0,game.now,start,{drawSize:128});
}
window.StoneGridwright={init,install:async file=>activate(file,true),remove,ready:()=>state.ready,status:()=>state.message,draw:drawHero,drawCharacter,ACTIONS,ROWS};
})();