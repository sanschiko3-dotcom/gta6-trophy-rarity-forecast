export const levels=[.05,.25,.5,.75,.95];
export const logit=r=>{r=Math.max(.01,Math.min(99.99,r));return Math.log(r/(100-r));};
export function score(out,truth){let loss=0,covered=0;out.trophies.forEach((t,i)=>{const y=logit(truth[i]);covered+=truth[i]>=t.q[0]&&truth[i]<=t.q[4];t.q.forEach((q,j)=>{const e=y-logit(q);loss+=2*Math.max(levels[j]*e,(levels[j]-1)*e);});});return {loss:+(loss/(truth.length*5)).toFixed(6),covered};}
