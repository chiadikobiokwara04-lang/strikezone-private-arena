import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
(() => {
  const socket = io();
  const params = new URLSearchParams(location.search);
  const roomCode = (params.get('room') || '').toUpperCase();
  const playerName = sessionStorage.getItem('strikezoneName') || 'Operator';
  const $ = id => document.getElementById(id);
  $('roomCodeDisplay').textContent = roomCode || '----'; $('overlayCode').textContent = roomCode || '----';
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x79b9f3);
  scene.fog = new THREE.Fog(0xb6d5ee, 65, 155);
  const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, .1, 260);
  camera.position.set(0, 4.4, 9);
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.22; renderer.domElement.className = 'arena-canvas'; document.body.prepend(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xd9edff, 0x564a38, 2.2));
  const keyLight = new THREE.DirectionalLight(0xffe4bd, 3.0); keyLight.position.set(-18, 28, 12); scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0x9bcfff, 1.1); fillLight.position.set(20, 12, -20); scene.add(fillLight);
  const mat = (color, metalness=.2, roughness=.7, emissive=0x000000) => new THREE.MeshStandardMaterial({ color, metalness, roughness, emissive });
  function box(x,y,z,w,h,d,color,metal=.25,rough=.65){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,metal,rough));m.position.set(x,y,z);scene.add(m);return m;}
  // Vast open shipyard floor: weathered concrete, puddles, rails and scattered weeds.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), mat(0x686b63, .12, .94)); floor.rotation.x=-Math.PI/2; floor.position.y=-.03; scene.add(floor);
  const groundGrid = new THREE.GridHelper(100, 50, 0x777c78, 0x5d625e); groundGrid.position.y=.008; groundGrid.material.transparent=true; groundGrid.material.opacity=.18; scene.add(groundGrid);
  // Puddles catch the blue sky and warm late-afternoon light.
  for(const [x,z,w,d] of [[-5,2,5,2],[4,-5,4,2],[-12,-12,3,5],[13,8,5,2],[1,14,3,2],[-18,8,3,2]]){const puddle=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshStandardMaterial({color:0x456e83,metalness:.55,roughness:.17,transparent:true,opacity:.78}));puddle.rotation.x=-Math.PI/2;puddle.position.set(x,.018,z);scene.add(puddle);}
  // Shipping containers with ribbed sides, warning stripes and weathered colours.
  function container(x,y,z,w,h,d,color){box(x,y,z,w,h,d,color,.42,.78);const rib=mat(0x252f35,.45,.65);for(let i=1;i<Math.floor(w/.42);i++){const bar=new THREE.Mesh(new THREE.BoxGeometry(.045,h*.94,d+.025),rib);bar.position.set(x-w/2+i*.42,y,z);scene.add(bar);}box(x,y+h*.42,z-d/2-.02,w*.94,.07,.035,0xb28b4f,.3,.7);}
  container(-15,1.35,-8,9,2.7,2.7,0x294d5a);container(-15,1.35,-5,9,2.7,2.7,0x7b4935);container(15,1.35,-12,9,2.7,2.7,0x3c5860);container(15,1.35,-9,9,2.7,2.7,0x7c603e);container(-18,1.35,11,7,2.7,2.7,0x3c4d5b);container(18,1.35,13,8,2.7,2.7,0x704735);container(-4,1.35,-19,8,2.7,2.7,0x53615b);container(7,1.35,18,8,2.7,2.7,0x354f61);
  // The abandoned cargo ship dominates the horizon: hull, deck, bridge and masts.
  const hull=box(0,3.1,-34,37,6,10,0x293d43,.65,.83);hull.rotation.y=-.035;
  box(0,6.25,-34,32,.45,8,0x604c3b,.6,.8);box(-2,8.4,-37,10,4.5,5,0x68716c,.45,.8);box(-2,10.8,-37,8,.25,4,0x343e40,.65,.65);
  for(let i=0;i<6;i++){box(-13+i*4.5,6.6,-28,3.4,1.3,2.4,[0x6b4936,0x314e59,0x6d6552][i%3],.45,.8);}
  const mast=box(3,13,-35,.28,10,.28,0x3a4444,.7,.55);for(let y=10;y<17;y+=2)box(3,y,-35,4,.12,.12,0x3a4444,.7,.55);
  // Towering dock cranes frame the sky and cast long industrial silhouettes.
  function crane(x,z,scale=1){const steel=mat(0x303c3d,.72,.58);const beam=(a,b,c,w,h,d)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),steel);o.position.set(a,b,c);scene.add(o);return o;};beam(x,5*scale,z,.65*scale,10*scale,.65*scale);beam(x+4*scale,5*scale,z,.55*scale,10*scale,.55*scale);beam(x+2*scale,10*scale,z,5*scale,.55*scale,.55*scale);beam(x+5*scale,12*scale,z,13*scale,.4*scale,.45*scale);const brace=new THREE.Mesh(new THREE.CylinderGeometry(.09*scale,.09*scale,Math.hypot(5*scale,7*scale),8),steel);brace.position.set(x+2.5*scale,7*scale,z);brace.rotation.z=-.62;scene.add(brace);const cable=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,5*scale,6),mat(0x202728,.5,.5));cable.position.set(x+7*scale,9*scale,z);scene.add(cable);box(x+7*scale,6.4*scale,z,.7*scale,.6*scale,.7*scale,0x6d573a,.5,.7);}
  crane(-27,-15,1.25);crane(24,-19,1.05);crane(-24,17,.75);
  // Dock rails, bollards, scrap and broken timber make the ground feel lived-in.
  for(const z of [-2,1]){const rail=new THREE.Mesh(new THREE.BoxGeometry(48,.09,.11),mat(0x424746,.8,.45));rail.position.set(0,.07,z);scene.add(rail);for(let x=-23;x<24;x+=2)box(x,.045,z,.12,.08,.7,0x4b4b43,.55,.7);}
  for(let i=0;i<38;i++){const x=Math.sin(i*12.37)*23,z=Math.cos(i*7.13)*24;const weed=new THREE.Mesh(new THREE.ConeGeometry(.07+(i%3)*.025,.25+(i%4)*.08,5),mat(i%2?0x56683c:0x75804a,.05,.95));weed.position.set(x,.12,z);scene.add(weed);}
  // Shipyard realism: mooring ropes, stacked pallets, drums, safety barriers and cable reels.
  for(const [x,z] of [[-11,-2],[12,-7],[21,11],[-22,7]]){
    const drum=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.9,14),mat(0x6a4937,.42,.75));drum.position.set(x,.45,z);scene.add(drum);
    for(const yy of [.2,.68]){const hoop=new THREE.Mesh(new THREE.TorusGeometry(.42,.035,6,18),mat(0x9b8d70,.65,.5));hoop.rotation.x=Math.PI/2;hoop.position.set(x,yy,z);scene.add(hoop);}
  }
  for(const [x,z] of [[-8,9],[9,10],[20,-2],[-21,-14]]){
    for(let i=0;i<3;i++){const pallet=box(x,0.12+i*.18,z,1.7,.16,1.05,0x65523c,.08,.96);}
    const reel=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.22,18),mat(0x493a2b,.18,.85));reel.rotation.z=Math.PI/2;reel.position.set(x+1.3,.65,z);scene.add(reel);
  }
  // Yellow-black hazard markings at dock edges and red rust streaks on the old ship.
  for(let i=0;i<14;i++){const stripe=box(-22+i*1.1,.025,22,.55,.035,.22,i%2?0xe0b64b:0x222726,.08,.8);}
  for(let i=0;i<16;i++){const streak=box(-17+(i%8)*4.4,3.3+(i%3)*.55,-28,.09,1.8+(i%4)*.3,.035,0x7b402e,.12,.96);}
  // Dockside bollard chains and scattered metal beams.
  for(const [x,z] of [[-14,4],[-10,4],[14,2],[18,2]]){const post=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,.72,10),mat(0x4a504c,.7,.55));post.position.set(x,.36,z);scene.add(post);}
  for(const [x,z,rot] of [[-4,12,.3],[5,7,-.4],[17,-1,.8],[-18,-4,-.2]]){const scrap=box(x,.09,z,2.4,.12,.18,0x555b57,.72,.72);scrap.rotation.y=rot;}
  for(const [x,z,r] of [[-9,0,.5],[11,4,.65],[-19,-1,.35],[7,-16,.5],[20,5,.4]]){const bollard=new THREE.Mesh(new THREE.CylinderGeometry(r*.7,r,.8,8),mat(0x5b5d55,.6,.75));bollard.position.set(x,.4,z);scene.add(bollard);}
  // Low perimeter structures keep the playable space bounded without a boxed-in arena look.
  for(const x of [-42,42]){box(x,2,0,1,4,82,0x3d4847,.5,.8);}
  // Clouds are represented by soft layered forms against the blue sky.
  const cloudMat=new THREE.MeshStandardMaterial({color:0xf4f8ff,roughness:1,transparent:true,opacity:.78});
  for(const [x,y,z,s] of [[-24,25,-42,5],[-8,29,-50,4],[17,24,-45,6],[34,27,-36,4],[-37,22,-22,4]]){const cloud=new THREE.Group();for(let i=0;i<5;i++){const puff=new THREE.Mesh(new THREE.SphereGeometry(s*(.45+(i%3)*.1),12,8),cloudMat);puff.position.set((i-2)*s*.45,(i%2)*s*.08,0);cloud.add(puff);}cloud.position.set(x,y,z);scene.add(cloud);}
  // Camera follows a visible third-person operator, with a slight over-the-shoulder offset.
  const operatorRoot = new THREE.Group(); scene.add(operatorRoot);
  function makeOperator(team='BLUE', isLocal=false){const g=new THREE.Group();const uniform=mat(0x5b6650,.12,.88), vest=mat(0x30382e,.18,.92), dark=mat(0x202622,.25,.78), skin=mat(0x98765c,.02,.9), helmet=mat(0x3f4b3c,.2,.8), teamMark=mat(team==='RED'?0x9f3436:0x2f79b8,.15,.8);const part=(geo,m,x,y,z,rx=0,ry=0,rz=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);g.add(o);return o;};
    part(new THREE.BoxGeometry(.66,.83,.34),uniform,0,1.15,0);part(new THREE.BoxGeometry(.7,.52,.39),vest,0,1.2,-.015);part(new THREE.BoxGeometry(.3,.12,.4),dark,0,1.51,-.01);for(let i=-1;i<=1;i++)part(new THREE.BoxGeometry(.12,.16,.045),mat(0x9b8a63,.05,.9),i*.18,1.27,-.225);part(new THREE.BoxGeometry(.2,.11,.04),teamMark,0,1.05,-.22);
    part(new THREE.SphereGeometry(.205,14,12),skin,0,1.78,0);part(new THREE.SphereGeometry(.235,14,10),helmet,0,1.91,-.015);part(new THREE.BoxGeometry(.43,.07,.3),helmet,0,1.83,-.055);part(new THREE.BoxGeometry(.19,.12,.025),dark,0,1.76,-.2);
    // American flag shoulder patch.
    const flag=part(new THREE.BoxGeometry(.16,.095,.025),mat(0xd6d9d4,.05,.8),-.345,1.36,-.02,0,0,-.1);part(new THREE.BoxGeometry(.075,.095,.028),mat(0x9e3338,.05,.8),-.36,1.36,-.035,0,0,-.1);part(new THREE.BoxGeometry(.075,.095,.03),mat(0x31527a,.05,.8),-.315,1.36,-.04,0,0,-.1);
    const legs=[];const arms=[];
    for(const side of [-1,1]){
      const shoulder=part(new THREE.SphereGeometry(.13,10,8),uniform,side*.36,1.42,-.005);
      const upper=part(new THREE.CapsuleGeometry(.105,.32,4,8),uniform,side*.39,1.23,-.035,0,0,side*-.24);
      const fore=part(new THREE.CapsuleGeometry(.085,.31,4,8),uniform,side*.34,1.02,-.19,side*.15,0,side*-.28);arms.push({upper,fore,side});
      part(new THREE.BoxGeometry(.16,.13,.18),skin,side*.32,.91,-.29);
      const thigh=part(new THREE.CapsuleGeometry(.13,.32,4,8),uniform,side*.17,.53,0,0,0,0);
      const shin=part(new THREE.CapsuleGeometry(.095,.31,4,8),dark,side*.17,.22,0,0,0,0);
      const boot=part(new THREE.BoxGeometry(.24,.12,.38),dark,side*.17,.075,-.075);
      legs.push({thigh,shin,boot,side});
    }
    // Visible AK-style rifle: stock, receiver, curved magazine, handguard, sights and barrel.
    const rifle=new THREE.Group();rifle.position.set(.25,1.14,-.42);rifle.rotation.x=-.12;rifle.rotation.y=-.08;g.add(rifle);
    const gunMat=mat(0x202522,.7,.42), gunMetal=mat(0x69716b,.82,.34), wood=mat(0x5b3d28,.15,.72);
    const gb=(w,h,d,x,y,z,m=gunMat)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);rifle.add(o);return o;};
    gb(.15,.14,.48,0,0,.03,wood);gb(.17,.15,.42,0,0,-.29);gb(.11,.1,.42,0,.015,-.68,gunMetal);gb(.1,.18,.14,0,-.15,-.29);gb(.11,.22,.12,0,-.13,.22);gb(.13,.07,.42,0,.105,-.53);gb(.075,.1,.13,0,.13,-.32);gb(.055,.08,.08,0,.12,-.77,gunMetal);
    const mag=new THREE.Mesh(new THREE.CapsuleGeometry(.055,.22,4,8),gunMat);mag.position.set(0,-.2,-.28);mag.rotation.x=-.22;rifle.add(mag);
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.027,.032,.62,10),gunMetal);barrel.rotation.x=Math.PI/2;barrel.position.set(0,.025,-.98);rifle.add(barrel);
    g.userData.animation={legs,arms,rifle};g.userData.weapon='ak47';
    return g;}
  const localOperator=makeOperator('BLUE',true);operatorRoot.add(localOperator);
  const weaponSpecs={ak47:{name:'AK-47',ammo:30,damage:34,rate:220,color:0x202522},m4:{name:'M4A1',ammo:30,damage:28,rate:150,color:0x252b2b},smg:{name:'MP5',ammo:30,damage:19,rate:85,color:0x242a2a},sniper:{name:'DMR',ammo:10,damage:70,rate:650,color:0x1b2224}};let selectedWeapon='ak47';let weaponLastShot=0;
  function equipWeapon(type){if(!weaponSpecs[type])return;selectedWeapon=type;const spec=weaponSpecs[type];ammo=spec.ammo;localOperator.userData.weapon=type;const rig=localOperator.userData.animation?.rifle;if(rig){rig.children.forEach(o=>{if(o.material?.color)o.material.color.setHex(spec.color);});if(type==='sniper'){rig.scale.set(1.28,1.05,1.35);}else if(type==='smg'){rig.scale.set(.82,.88,.82);}else{rig.scale.set(1,1,1);}}$('weaponNameHud').textContent=spec.name;$('ammoValue').textContent=ammo;$('ammoCapacity').textContent=`/ ${spec.ammo} ROUNDS`;tone(420,.06,'triangle',.018);}
  $('weaponSelect').addEventListener('change',e=>equipWeapon(e.target.value));
  // Muzzle flash is attached to the carried rifle on the visible operator.
  const muzzleFlash = new THREE.Mesh(new THREE.ConeGeometry(.1,.28,8),new THREE.MeshBasicMaterial({color:0xffd28a,transparent:true,opacity:0}));
  muzzleFlash.rotation.x=-Math.PI/2; muzzleFlash.position.set(.22,1.14,-1.28); localOperator.add(muzzleFlash);
  const keys = {}; let yaw=0,pitch=0,playerX=0,playerZ=5,health=100,ammo=30,reloading=false,recoil=0,lastSent=0,matchEndsAt=null,gameState=null,myId=null,hasStarted=false; const remotePlayers=new Map(); const clock=new THREE.Clock(); let audioCtx=null;
  function tone(freq,duration,type='square',volume=.035){try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.35),audioCtx.currentTime+duration);g.gain.setValueAtTime(volume,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration);}catch{}}
  function message(text,ms=2200){$('arenaMessage').textContent=text;$('arenaMessage').style.display='block';clearTimeout(message.timer);if(ms>0)message.timer=setTimeout(()=>{$('arenaMessage').style.display='none';},ms);}
  function makePlayer(p){const group=makeOperator(p.team,false);scene.add(group);return {group,team:p.team,name:p.name,health:p.health};}
  function updatePlayers(state){const wasPlaying=hasStarted;gameState=state;myId ||= socket.id;const me=state.players.find(p=>p.id===socket.id);if(me){if(state.status==='playing'&&!wasPlaying){playerX=me.x;playerZ=me.z;yaw=me.yaw;pitch=me.pitch;camera.position.set(playerX+Math.sin(yaw)*5,4.3,playerZ+Math.cos(yaw)*5);}health=me.health;$('healthNumber').innerHTML=`${health} <span style="font-size:11px;color:#8795a8">/ 100 HP</span>`;$('healthFill').style.width=`${health}%`;$('healthFill').style.background=health<=30?'#ff5148':'#49e59b';} $('redCount').textContent=state.red;$('blueCount').textContent=state.blue;$('redCountOverlay').textContent=state.red;$('blueCountOverlay').textContent=state.blue;
    for(const p of state.players){if(p.id===socket.id)continue;let item=remotePlayers.get(p.id);if(!item){item=makePlayer(p);remotePlayers.set(p.id,item);}item.name=p.name;item.team=p.team;item.health=p.health;item.group.position.set(p.x,0,p.z);item.group.rotation.y=p.yaw;item.group.visible=state.status==='playing';}
    for(const [id,item] of remotePlayers){if(!state.players.some(p=>p.id===id)){scene.remove(item.group);remotePlayers.delete(id);}}
    $('redPlayers').innerHTML=state.players.filter(p=>p.team==='RED').map(p=>`<div class="player-row"><span>${escapeHtml(p.name)}${p.id===socket.id?' (YOU)':''}</span><small>${p.score} PTS</small></div>`).join('')||'<div class="player-row"><small>Waiting for players</small></div>';
    $('bluePlayers').innerHTML=state.players.filter(p=>p.team==='BLUE').map(p=>`<div class="player-row"><span>${escapeHtml(p.name)}${p.id===socket.id?' (YOU)':''}</span><small>${p.score} PTS</small></div>`).join('')||'<div class="player-row"><small>Waiting for players</small></div>';
    $('startBtn').style.display=state.status==='waiting'?'':'none';$('overlayMessage').textContent=state.status==='playing'?'Match in progress — good hunting.':state.status==='finished'?'Match finished.':'Invite a friend. The room creator can start when at least two operators are ready.';
    if(state.status==='playing'){hasStarted=true;$('lobbyOverlay').classList.add('hidden');$('arenaMessage').style.display='none';} }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function addFeed(text){const node=document.createElement('div');node.className='kill-item';node.textContent=text;$('killFeed').prepend(node);while($('killFeed').children.length>4)$('killFeed').lastChild.remove();setTimeout(()=>node.remove(),5000);}
  function tryJoin(){socket.emit('joinRoom',{code:roomCode,name:playerName});}
  socket.on('connect',()=>{if(!roomCode){message('No room code found. Returning to the lobby.');setTimeout(()=>location.href='/',1200);return;}tryJoin();});
  socket.on('joinedRoom',data=>{myId=data.playerId;updatePlayers(data.state);message(`ROOM ${data.code} READY — share the code with your squad.`);});
  socket.on('roomState',state=>{updatePlayers(state);});
  socket.on('gameError',text=>{message(text,0);$('lobbyOverlay').classList.remove('hidden');$('overlayMessage').textContent=text;});
  socket.on('matchStarted',({endsAt})=>{matchEndsAt=endsAt;hasStarted=true;$('lobbyOverlay').classList.add('hidden');message('MATCH LIVE — ELIMINATE THE OPPOSITION!',2500);});
  socket.on('playerMoved',p=>{const item=remotePlayers.get(p.id);if(item){item.group.position.set(p.x,0,p.z);item.group.rotation.y=p.yaw;}});
  socket.on('hitConfirmed',({shooterId,targetId,health:targetHealth})=>{if(shooterId===socket.id){message('TARGET HIT',700);tone(650,.07,'sine',.025);}if(targetId===socket.id){health=targetHealth;$('healthNumber').innerHTML=`${health} <span style="font-size:11px;color:#8795a8">/ 100 HP</span>`;$('healthFill').style.width=`${health}%`;document.body.style.boxShadow='inset 0 0 100px #ff000077';setTimeout(()=>document.body.style.boxShadow='',140);tone(95,.12,'sawtooth',.05);}});
  socket.on('playerRespawned',p=>{if(p.id===socket.id){health=100;playerX=p.x;playerZ=p.z;yaw=p.yaw;pitch=p.pitch;camera.position.set(playerX+Math.sin(yaw)*5,4.3,playerZ+Math.cos(yaw)*5);message(`ELIMINATED BY ${p.by.toUpperCase()} — RESPAWNED`,2300);}else addFeed(`${p.by} eliminated ${remotePlayers.get(p.id)?.name||'an operator'}`);});
  socket.on('matchEnded',state=>{matchEndsAt=null;$('endOverlay').classList.remove('hidden');const sorted=[...state.players].sort((a,b)=>b.score-a.score);$('endSummary').textContent=`Room ${state.code} · ${state.players.length} operators · Match clock reached zero.`;$('finalScores').innerHTML=sorted.map((p,i)=>`<div class="player-row"><span>${i+1}. ${escapeHtml(p.name)} <small>· ${p.team}</small></span><strong>${p.score} PTS · ${p.kills} K</strong></div>`).join('')||'No score recorded.';});
  $('startBtn').addEventListener('click',()=>socket.emit('startMatch'));
  $('copyBtn').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(roomCode);$('copyBtn').textContent='COPIED ✓';setTimeout(()=>$('copyBtn').textContent='COPY CODE',1600);}catch{$('overlayMessage').textContent=`Share this code with friends: ${roomCode}`;}});
  $('backLobbyBtn').addEventListener('click',()=>{$('endOverlay').classList.add('hidden');$('lobbyOverlay').classList.remove('hidden');});
  $('arenaMessage').addEventListener('click',()=>renderer.domElement.requestPointerLock?.());
  document.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==='r')reload();});document.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
  document.addEventListener('mousemove',e=>{if(document.pointerLockElement!==renderer.domElement)return;yaw-=e.movementX*.0022;pitch-=e.movementY*.0022;pitch=Math.max(-1.25,Math.min(1.25,pitch));});
  renderer.domElement.addEventListener('click',()=>{if(!hasStarted){renderer.domElement.requestPointerLock?.();return;}if(document.pointerLockElement!==renderer.domElement){renderer.domElement.requestPointerLock?.();return;}fire();});
  document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==renderer.domElement&&hasStarted)message('Click the arena to resume aiming.',0);else if(document.pointerLockElement===renderer.domElement)$('arenaMessage').style.display='none';});
  // Solid collision volumes: players must go around containers, the ship hull, barriers and dock equipment.
  const solids=[[-20,-10,-9.5,-6.5],[-20,-10,-6.5,-3.5],[10,20,-13.5,-10.5],[10,20,-10.5,-7.5],[-21.5,-14.5,9.5,12.5],[14,22,11.5,14.5],[-8,0,-20.5,-17.5],[3,11,16.5,19.5],[-19,19,-39,-29],[-28,-25,-18,-12],[23,31,-22,-16]];
  function blocked(x,z){if(Math.abs(x)>40||Math.abs(z)>39)return true;for(const [minX,maxX,minZ,maxZ] of solids){if(x>minX-.48&&x<maxX+.48&&z>minZ-.48&&z<maxZ+.48)return true;}return false;}
  let verticalVelocity=0,jumpHeight=0,crouched=false,walkPhase=0;
  function reload(){const capacity=weaponSpecs[selectedWeapon].ammo;if(reloading||ammo===capacity)return;reloading=true;message('RELOADING…',1200);tone(300,.1,'triangle',.02);setTimeout(()=>{ammo=weaponSpecs[selectedWeapon].ammo;reloading=false;$('ammoValue').textContent=ammo;tone(450,.08,'triangle',.02);},1100);}
  function fire(){if(reloading)return;const spec=weaponSpecs[selectedWeapon];if(performance.now()-weaponLastShot<spec.rate)return;weaponLastShot=performance.now();if(ammo<=0){message('MAGAZINE EMPTY — PRESS R TO RELOAD');tone(120,.06);return;}ammo--;$('ammoValue').textContent=ammo;recoil=.09;muzzleFlash.material.opacity=1;setTimeout(()=>muzzleFlash.material.opacity=0,55);tone(125,.09,'square',.045);const origin=camera.position.clone();const dir=new THREE.Vector3();camera.getWorldDirection(dir);const ray=new THREE.Raycaster(origin,dir,0,55);let closest=null,closestDist=Infinity;for(const [id,item] of remotePlayers){if(item.team===gameState?.players.find(p=>p.id===socket.id)?.team)continue;const parts=item.group.children;const hits=ray.intersectObjects(parts,false);if(hits.length&&hits[0].distance<closestDist){closest={id};closestDist=hits[0].distance;}}if(closest){socket.emit('hitPlayer',{targetId:closest.id,weapon:selectedWeapon});} }
  function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);if(hasStarted&&document.pointerLockElement===renderer.domElement){const forward=(keys.w?1:0)-(keys.s?1:0),strafe=(keys.d?1:0)-(keys.a?1:0);const len=Math.hypot(forward,strafe)||1;const crouchKey=!!keys.control; crouched=crouchKey;const speed=(crouched?2.5:7)*dt;const nx=playerX+(-Math.sin(yaw)*forward+Math.cos(yaw)*strafe)/len*speed;const nz=playerZ+(-Math.cos(yaw)*forward-Math.sin(yaw)*strafe)/len*speed;if(!blocked(nx,playerZ))playerX=nx;if(!blocked(playerX,nz))playerZ=nz;if(keys[' ']&&jumpHeight<=.001){verticalVelocity=5.2;keys[' ']=false;}const now=performance.now();if(now-lastSent>55){lastSent=now;socket.emit('playerMove',{x:playerX,y:1.7+jumpHeight,z:playerZ,yaw,pitch});}}verticalVelocity-=12*dt;jumpHeight=Math.max(0,jumpHeight+verticalVelocity*dt);if(jumpHeight===0)verticalVelocity=0;localOperator.position.set(playerX,jumpHeight+(crouched?-.25:0),playerZ);localOperator.rotation.y=yaw;const moving=hasStarted&&(keys.w||keys.a||keys.s||keys.d);walkPhase+=moving?dt*11:dt*2;const anim=localOperator.userData.animation;if(anim){for(const leg of anim.legs){const swing=moving?Math.sin(walkPhase)*.48:0;leg.thigh.rotation.x=swing*leg.side;leg.shin.rotation.x=Math.max(0,-swing)*.65;leg.boot.rotation.x=leg.shin.rotation.x;}for(const arm of anim.arms){arm.upper.rotation.x=moving?-.12:0;arm.fore.rotation.x=moving?-.22:0;}localOperator.scale.y=crouched?.82:1;}camera.position.set(playerX+Math.sin(yaw)*5,3.6+(crouched?-.35:0)+jumpHeight+Math.max(-.3,pitch*.3),playerZ+Math.cos(yaw)*5);const look=new THREE.Vector3(playerX-Math.sin(yaw)*7,1.45+(crouched?-.25:0)+jumpHeight-pitch*4,playerZ-Math.cos(yaw)*7);camera.lookAt(look);if(matchEndsAt){const left=Math.max(0,Math.ceil((matchEndsAt-Date.now())/1000));$('timerValue').textContent=`${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;}renderer.render(scene,camera);}
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
  addEventListener('beforeunload',()=>socket.emit('leaveRoom'));
  animate();
})();
