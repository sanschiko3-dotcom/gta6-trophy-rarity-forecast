import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
const logit=r=>Math.log(Math.max(.01,Math.min(99.99,r))/(100-Math.max(.01,Math.min(99.99,r))));
const inv=x=>100/(1+Math.exp(-x));
const median=a=>a.slice().sort((a,b)=>a-b)[Math.floor(a.length/2)]||0;
function slope(rows){
 if(rows.length<2)return 0;
 const end=rows.at(-1)[0]; let sw=0,sx=0,sy=0;
 for(const [x,y] of rows){const w=Math.exp((x-end)*Math.log(2)/.5);sw+=w;sx+=w*x;sy+=w*y;}
 let num=0,den=0;for(const [x,y] of rows){const w=Math.exp((x-end)*Math.log(2)/.5);num+=w*(x-sx/sw)*(y-sy/sw);den+=w*(x-sx/sw)**2;}
 return den>1e-12?num/den:0;
}
function forecast(c){
 const d=c.horizon_minutes/1440, origin=Date.parse(c.history[0].at), span=(Date.parse(c.history.at(-1).at)-origin)/86400000;
 const models=c.trophies.map((t,i)=>{
 const rows=c.history.filter(h=>Number.isFinite(h.rates[i])&&h.players_tracked>0).map(h=>[(Date.parse(h.at)-origin)/86400000,h.rates[i],h.players_tracked]);
 const last=rows.at(-1)||[0,.01,1];
 const population=slope(rows.map(([x,r,p])=>[x,Math.log(p)]));
 const earned=slope(rows.map(([x,r,p])=>[x,Math.log(Math.max(.01,r)*p/100)]));
 return {r:last[1],drift:(earned-population)/Math.max(.05,1-last[1]/100),tier:t.tier};
 });
 return {trophies:models.map((m,i)=>{
 const peers=models.filter(v=>v.tier===m.tier).map(v=>v.drift);
 const drift=.85*m.drift+.15*median(peers);
 const delta=Math.max(-3,Math.min(3,drift*2*(1-Math.exp(-d/2))));
 const center=logit(m.r)+delta;
 const sigma=Math.sqrt(.012+.14*d);
 // Stale short histories conceal refreshes: uncertainty grows below the median.
 const tail=span<.25&&d>=.25?Math.min(4,d*5):0;
 return {id:c.trophies[i].id,q:[-1.645,-.674,0,.674,1.645].map(z=>z===1.645&&m.r===100?100:+inv(center+z*sigma+(z<0?z*tail:0)).toFixed(4))};
 })};
}
const input=process.env.MAKEFUN_INPUT_DIR||'/input',output=process.env.MAKEFUN_OUTPUT_DIR||'/output';mkdirSync(output,{recursive:true});
for(const f of readdirSync(input).filter(f=>f.endsWith('.in')).sort())writeFileSync(join(output,f.replace(/\.in$/,'.out')),JSON.stringify(forecast(JSON.parse(readFileSync(join(input,f),'utf8'))))+'\n');
