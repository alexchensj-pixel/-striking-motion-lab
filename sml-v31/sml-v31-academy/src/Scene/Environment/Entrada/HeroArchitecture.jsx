import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { site } from '../../../Data/Content.js';
const ORANGE = '#f15a24';
function makeSignTexture(kind, selected = false, title = '', detail = '') {
  const canvas=document.createElement('canvas'); canvas.width=1024; canvas.height=kind==='hero'?640:256;
  const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height);
  if(kind==='hero'){
    ctx.fillStyle=ORANGE; ctx.font='700 25px Arial'; ctx.fillText('MADRID  /  MUAY THAI  /  BOXEO  /  K1',58,74);
    ctx.fillStyle='#f4f4f2'; ctx.font='900 90px Arial'; ctx.fillText('TÉCNICA DE',54,205); ctx.fillText('COMPETICIÓN.',54,302);
    ctx.fillStyle=ORANGE; ctx.fillText('A TU MEDIDA.',54,399);
    ctx.fillStyle='#c8cbd0'; ctx.font='32px Arial'; ctx.fillText('Entrenamiento personal y grupos reducidos.',58,465); ctx.fillText('Empieza desde cero. Entrena con criterio.',58,510);
    ctx.fillStyle='rgba(241,90,36,.18)'; ctx.fillRect(56,548,500,66); ctx.strokeStyle=ORANGE; ctx.lineWidth=3; ctx.strokeRect(56,548,500,66);
    ctx.fillStyle='#fff'; ctx.font='bold 27px Arial'; ctx.fillText('RESERVAR EVALUACIÓN  ·  30 €   ↗',78,591);
  } else {
    ctx.fillStyle=selected?ORANGE:'#d8dce1'; ctx.font='700 25px Arial'; ctx.fillText('SML  /  FORMATO DE ENTRENAMIENTO',34,52);
    ctx.fillStyle='#f5f5f3'; ctx.font='900 72px Arial'; ctx.fillText(title,34,154);
    ctx.fillStyle='#aeb5bf'; ctx.font='29px Arial'; ctx.fillText(detail,36,213);
    ctx.fillStyle=selected?ORANGE:'#c5cbd2'; ctx.font='bold 42px Arial'; ctx.fillText(selected?'✓':'↗',925,160);
  }
  const texture=new CanvasTexture(canvas); texture.colorSpace=SRGBColorSpace; texture.anisotropy=8; return texture;
}
function HeroWallSign({position,size,onClick}){
 const texture=useMemo(()=>makeSignTexture('hero'),[]);
 return <group position={position}>
  <mesh castShadow receiveShadow position={[0,0,-0.075]}><boxGeometry args={[size[0]+0.18,size[1]+0.18,0.16]}/><meshStandardMaterial color="#171b20" metalness={0.82} roughness={0.34}/></mesh>
  <mesh position={[0,0,0.09]} onClick={onClick} onPointerOver={()=>{document.body.style.cursor='pointer';}} onPointerOut={()=>{document.body.style.cursor='auto';}}><planeGeometry args={size}/><meshBasicMaterial map={texture} transparent toneMapped={false}/></mesh>
  <mesh position={[0,-size[1]/2-0.12,0.10]}><boxGeometry args={[size[0]+0.2,0.045,0.06]}/><meshBasicMaterial color={ORANGE}/></mesh>
  <pointLight position={[0,0,0.45]} color={ORANGE} intensity={1.8} distance={4}/>
 </group>;
}
function ServicePlate({position,width,title,detail,selected,onClick}){
 const texture=useMemo(()=>makeSignTexture('service',selected,title,detail),[selected,title,detail]);
 return <group position={position}>
  <mesh castShadow receiveShadow><boxGeometry args={[width,0.68,0.22]}/><meshStandardMaterial color={selected?'#3a2119':'#20262d'} metalness={0.76} roughness={0.3} emissive={selected?'#4b1c0d':'#090d12'} emissiveIntensity={selected?0.7:0.18}/></mesh>
  <mesh position={[0,0,0.116]} onClick={onClick} onPointerOver={()=>{document.body.style.cursor='pointer';}} onPointerOut={()=>{document.body.style.cursor='auto';}}><planeGeometry args={[width-0.08,0.60]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>
  <mesh position={[-width/2+0.045,0,0.13]}><boxGeometry args={[0.035,0.68,0.045]}/><meshBasicMaterial color={selected?ORANGE:'#66717c'}/></mesh>
  <pointLight position={[0,0,0.42]} color={ORANGE} intensity={selected?1.3:0.18} distance={2.1}/>
 </group>;
}
export default function HeroArchitecture(){
 const {size}=useThree(); const portrait=size.width/Math.max(1,size.height)<0.72;
 const choose=(service)=>{window.location.hash=service;window.dispatchEvent(new CustomEvent('sml:navigate',{detail:{id:'entrenamiento'}}));};
 const book=()=>window.open(site.calendly,'_blank','noopener,noreferrer');
 return <group position={[0,0,10]}>
  {/* Sala de entrada: suelo continuo, muros laterales y cerchas portantes. */}
  <mesh position={[0,0.08,-11]} receiveShadow><boxGeometry args={[11.7,0.16,20]}/><meshStandardMaterial color="#252b32" metalness={0.42} roughness={0.48}/></mesh>
  {[-5.7,5.7].map(x=><group key={x} position={[x,0,-10]}><mesh position={[0,3.1,0]} castShadow receiveShadow><boxGeometry args={[0.22,6.2,20]}/><meshStandardMaterial color="#303740" metalness={0.7} roughness={0.42}/></mesh>{[-2,2].map(z=><mesh key={z} position={[-Math.sign(x)*0.18,3.1,z]}><boxGeometry args={[0.08,5.9,0.12]}/><meshStandardMaterial color="#77818d" metalness={0.8} roughness={0.3}/></mesh>)}</group>)}
  {[-3.5,0,3.5].map(z=><group key={z} position={[0,0,z-8]}>{[-5.6,5.6].map(x=><mesh key={x} position={[x,3.05,0]} castShadow><boxGeometry args={[0.42,6.1,0.5]}/><meshStandardMaterial color="#3a414a" metalness={0.72} roughness={0.34}/></mesh>)}<mesh position={[0,6,0]} castShadow><boxGeometry args={[11.5,0.32,0.5]}/><meshStandardMaterial color="#3b424b" metalness={0.8} roughness={0.32}/></mesh><mesh position={[0,5.78,0.27]}><boxGeometry args={[10.6,0.045,0.06]}/><meshBasicMaterial color={ORANGE}/></mesh></group>)}
  {/* Muro posterior real: los rótulos y controles están anclados a su superficie. */}
  <mesh position={[0,3.1,-20.8]} receiveShadow><boxGeometry args={[11.5,6.2,0.32]}/><meshStandardMaterial color="#171c22" metalness={0.55} roughness={0.62}/></mesh>
  <mesh position={[0,1.1,-20.58]}><boxGeometry args={[11.4,0.035,0.05]}/><meshBasicMaterial color="#69737e"/></mesh>
  <mesh position={[0,5.3,-20.58]}><boxGeometry args={[11.4,0.035,0.05]}/><meshBasicMaterial color={ORANGE}/></mesh>
  {/* Ring de boxeo al fondo, dentro de la misma nave. */}
  <group position={[0,0,-16]}>
   <mesh position={[0,0.72,0]} castShadow receiveShadow><boxGeometry args={[4.2,0.28,3.2]}/><meshStandardMaterial color="#1c222a" metalness={0.45} roughness={0.5}/></mesh>
   <mesh position={[0,0.88,0]}><boxGeometry args={[4.05,0.035,3.05]}/><meshStandardMaterial color="#4a515a" roughness={0.72}/></mesh>
   {[-2,2].flatMap(x=>[-1.5,1.5].map(z=><mesh key={`${x}-${z}`} position={[x,1.45,z]} castShadow><cylinderGeometry args={[0.055,0.055,1.25,12]}/><meshStandardMaterial color="#89929b" metalness={0.8} roughness={0.25}/></mesh>))}
   {[1.2,1.55,1.9].map(y=><group key={y}><mesh position={[0,y,-1.5]}><boxGeometry args={[4,0.035,0.035]}/><meshStandardMaterial color={y===1.55?ORANGE:'#d5d8dc'}/></mesh><mesh position={[0,y,1.5]}><boxGeometry args={[4,0.035,0.035]}/><meshStandardMaterial color={y===1.55?ORANGE:'#d5d8dc'}/></mesh><mesh position={[-2,y,0]}><boxGeometry args={[0.035,0.035,3]}/><meshStandardMaterial color={y===1.55?ORANGE:'#d5d8dc'}/></mesh><mesh position={[2,y,0]}><boxGeometry args={[0.035,0.035,3]}/><meshStandardMaterial color={y===1.55?ORANGE:'#d5d8dc'}/></mesh></group>)}
  </group>
  <HeroWallSign position={portrait?[0,3.0,-20.58]:[-2.05,3.95,-20.58]} size={portrait?[3.6,2.25]:[6.4,4.0]} onClick={book}/>
  {(portrait?[
   {x:0,y:1.32,w:3.45,title:'1:1',detail:'ENTRENAMIENTO INDIVIDUAL',service:'individual'},
   {x:0,y:0.52,w:3.45,title:'PAREJAS',detail:'ENTRENA CON ALGUIEN MÁS',service:'parejas'},
   {x:0,y:-0.28,w:3.45,title:'GRUPOS',detail:'MÁXIMO 4 PERSONAS',service:'grupos'},
  ]:[
   {x:4.05,y:3.95,w:2.55,title:'1:1',detail:'INDIVIDUAL',service:'individual'},
   {x:4.05,y:3.02,w:2.55,title:'PAREJAS',detail:'DOS PERSONAS',service:'parejas'},
   {x:4.05,y:2.09,w:2.55,title:'GRUPOS',detail:'MÁXIMO 4',service:'grupos'},
  ]).map(item=><ServicePlate key={item.service} position={[item.x,item.y,-20.42]} width={item.w} title={item.title} detail={item.detail} selected={item.service==='grupos'} onClick={()=>choose(item.service)}/>)}
  {/* Saco suspendido y luz cenital, ambos integrados en la nave. */}
  <group position={[-4.35,2.35,-9.4]}><mesh position={[0,1.2,0]}><cylinderGeometry args={[0.045,0.045,2.2,12]}/><meshStandardMaterial color="#929aa3" metalness={0.8}/></mesh><mesh castShadow receiveShadow><cylinderGeometry args={[0.42,0.48,1.65,24]}/><meshStandardMaterial color="#17191c" roughness={0.72} metalness={0.18}/></mesh><mesh position={[0,-0.12,0.01]}><torusGeometry args={[0.43,0.035,8,32]}/><meshStandardMaterial color={ORANGE} metalness={0.45}/></mesh></group>
  <mesh position={[0,5.72,-10]}><boxGeometry args={[2.8,0.045,1]}/><meshBasicMaterial color="#d8e4ee"/></mesh>
  <spotLight position={[0,5.5,-9]} angle={0.58} penumbra={0.7} intensity={38} color="#dce8f5" distance={18}/>
  <pointLight position={[-4,3.7,-15]} color={ORANGE} intensity={3.5} distance={8}/><pointLight position={[4,3.7,-15]} color="#d8e4f4" intensity={2.2} distance={8}/>
 </group>;
}
