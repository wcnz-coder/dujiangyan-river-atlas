'use strict';
const $=x=>document.querySelector(x), sheet=$('#sheet'),panel=$('#panel');
const sites=[['Fish Mouth','A stone divider splits the Min River. One channel leads toward the farms; the other carries water downstream.'],['Flying Sand Weir','When the inner river rises, extra water and sand can flow over this low wall and back into the outer river.'],['Bottle Neck','A narrow opening limits how much water enters the canals. They carry it across the Chengdu Plain.']];
const namesCN=['鱼嘴','飞沙堰','宝瓶口'];
function view(map){$('#paper').classList.toggle('diagram',map);document.body.classList.toggle('diagram',map);$('.mapplate').hidden=!map;$('#land').setAttribute('aria-pressed',!map);$('#mapmode').setAttribute('aria-pressed',map);if(!map)document.querySelectorAll('#stops button,.pin').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false')})}
function select(i){view(true);for(const sel of ['#stops button','.pin'])document.querySelectorAll(sel).forEach((b,n)=>{b.classList.toggle('active',n===i);b.setAttribute('aria-pressed',n===i)});}
$('#land').onclick=()=>view(false);$('#mapmode').onclick=()=>select(0);
sites.forEach(([name,desc],i)=>{let b=document.createElement('button');b.innerHTML='<span class="stitle"><i class="num">0'+(i+1)+'</i><b>'+name+'</b><span class="cn" lang="zh">'+namesCN[i]+'</span></span><span class="desc">'+desc+'</span>';b.setAttribute('aria-label',name+'. '+desc+' Show on the flow diagram.');b.onclick=()=>select(i);$('#stops').append(b);let pin=document.querySelectorAll('.pin')[i];pin.setAttribute('role','button');pin.setAttribute('tabindex','0');pin.setAttribute('aria-label',name);pin.onclick=b.onclick;pin.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(i)}}});view(false);
$('#project').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{alert('Use your browser’s full-screen command.')}};document.onfullscreenchange=()=>$('#project').textContent=document.fullscreenElement?'Exit full screen':'Full screen ↗';
$('#notes').onclick=()=>{panel.replaceChildren($('#script').content.cloneNode(true));sheet.showModal()};
const def='101001100',valid=x=>/^[01]{8}[012]$/.test(x||'');let fromLink=new URLSearchParams(location.hash.slice(1)).get('score'),saved='';try{saved=localStorage.getItem('riverScore')}catch{}let score=valid(fromLink)?fromLink:valid(saved)?saved:def;
function save(){try{localStorage.setItem('riverScore',score)}catch{}try{history.replaceState(null,'','#score='+score)}catch{}}
let ctx,timer,start;
function stop(){clearInterval(timer);if(ctx){ctx.close();ctx=null}$('#play').textContent='▶';$('#play').setAttribute('aria-label','Play the 16-second group score');document.body.style.setProperty('--progress','0%');$('#clock').textContent='0:00 / 0:16'}
function queueScore(ac,start,arrangement){
 // Two pitched attacks, plus a quieter decaying overtone. No external recording.
 function note(t,f,vol,len,type){
  const melody=f>300,tail=melody?.96:Math.min(.76,len*1.55);
  for(const [ratio,level,decay] of [[1,.82,tail],[2.004,.24,tail*.43],[3.008,.095,tail*.25]]){
   const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.setValueAtTime(f*ratio*1.003,t);o.frequency.exponentialRampToValueAtTime(f*ratio,t+.08);
   g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol*level,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+decay);
   o.connect(g).connect(ac.destination);o.start(t);o.stop(t+decay+.02);
  }
 }
 for(let i=0;i<24;i++){let t=start+i*2/3,k=i%4;if(i>=21)continue;if(arrangement[k]==='1'||i===20)note(t,146.83,.21,.43,'sine');if(i>=8&&(arrangement[4+k]==='1'||i===20))note(t,293.66,.11,.26,'triangle');if(i===11||i===15||i===19)note(t,587.3,.08,.13,'triangle');if(i===16||i===18||i===20)note(t,[329.63,392,440][+arrangement[8]]*(i===18?1.125:1),.09,.55,'sine')}
}
async function play(){
 if(ctx){stop();return}
 const ac=new AudioContext();ctx=ac;await ac.resume();if(ctx!==ac)return;
 start=ac.currentTime+.08;queueScore(ac,start,score);
 $('#play').textContent='■';$('#play').setAttribute('aria-label','Stop music');timer=setInterval(()=>{let n=Math.max(0,Math.floor(ac.currentTime-start));document.body.style.setProperty('--progress',Math.min(100,Math.max(0,(ac.currentTime-start)*6.25))+'%');if(n>=16){stop();document.body.style.setProperty('--progress','100%');$('#clock').textContent='0:16 / 0:16'}else $('#clock').textContent='0:'+String(n).padStart(2,'0')+' / 0:16'},100)}
$('#play').onclick=play;
function editor(){panel.innerHTML='<h2 id="sheetTitle">River in Two</h2><p>Make your group score. Tap beats for each channel and choose the final note. The first rhythm plays alone; the second joins after two bars.</p><p class="muted">小组作曲：点击方格决定两条水道的节奏，选择收尾音。修改自动保存；复制地址到课堂电脑即可使用同一版本。未改编时为示范谱。</p>';['Inner river','Outer river'].forEach((s,j)=>{let row=document.createElement('div');row.className='beats';row.innerHTML='<b>'+s+'</b>';for(let k=0;k<4;k++){let idx=j*4+k,b=document.createElement('button');b.textContent=k+1;b.className=score[idx]==='1'?'on':'';b.setAttribute('aria-pressed',score[idx]==='1');b.onclick=()=>{score=score.slice(0,idx)+(score[idx]==='1'?'0':'1')+score.slice(idx+1);save();editor()};row.append(b)}panel.append(row)});let tail=document.createElement('div');tail.innerHTML='<label>Ending note <select><option>E</option><option>G</option><option>A</option></select></label>　<button>Play this score</button><p class="muted">6 bars · 4 beats per bar · 90 BPM</p>';panel.append(tail);let sel=tail.querySelector('select');sel.selectedIndex=+score[8];sel.onchange=()=>{score=score.slice(0,8)+sel.selectedIndex;save()};tail.querySelector('button').onclick=()=>{sheet.close();if(ctx)stop();play()}}
$('#edit').onclick=()=>{editor();sheet.showModal()};document.addEventListener('keydown',e=>{if(!sheet.open&&!$('#gallery').open&&!$('#recent-photo').open&&['1','2','3'].includes(e.key))select(+e.key-1)});

document.addEventListener('keydown', e=>{if(!sheet.open && !$('#gallery').open&&!$('#recent-photo').open && e.key==='0')view(false)});

const divider=$('#ink-divider'),compare=$('#compare-image');
function setOriginal(value){
 divider.value=value;
 compare.style.setProperty('--original',value+'%');
 compare.classList.toggle('split',value>0&&value<100);
 divider.setAttribute('aria-valuetext',value+'% original photograph');
}
divider.oninput=()=>setOriginal(Number(divider.value));
$('#all-photo').onclick=()=>setOriginal(100);
$('#all-ink').onclick=()=>setOriginal(0);
$('#close-gallery').onclick=()=>$('#gallery').close();
$('#unroll').onclick=()=>{setOriginal(50);$('#gallery').showModal()};

$('#show-recent').onclick=()=>$('#recent-photo').showModal();

async function renderWav(arrangement){
 const rate=44100, count=rate*16, offline=new OfflineAudioContext(1,count,rate);
 queueScore(offline,.08,arrangement);
 const samples=(await offline.startRendering()).getChannelData(0);
 const data=new ArrayBuffer(44+2*count), view=new DataView(data);
 const str=(p,t)=>{for(let i=0;i<t.length;i++)view.setUint8(p+i,t.charCodeAt(i));};
 str(0,'RIFF');view.setUint32(4,data.byteLength-8,true);str(8,'WAVE');str(12,'fmt ');
 view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
 view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);
 view.setUint16(32,2,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,count*2,true);
 for(let i=0;i<count;i++)view.setInt16(44+i*2,Math.round(Math.max(-1,Math.min(1,samples[i]))*32767),true);
 return new Blob([data],{type:'audio/wav'});
}
const exportButton=$('#save-wav');
exportButton.onclick=async()=>{
 exportButton.disabled=true;
 const arrangement=score;
 try{
  const url=URL.createObjectURL(await renderWav(arrangement));
  const link=document.createElement('a');
  link.href=url;link.download=arrangement===def?'River-in-Two-Demo.wav':'River-in-Two-Group.wav';
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
 }catch(e){alert('WAV export did not run in this browser. The demo WAV is in the offline package.');}
 finally{exportButton.disabled=false;}
};
