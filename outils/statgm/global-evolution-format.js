/* French words keep large totals readable; exact values stay in the table. */
(() => {
  const s=window.StatGMPlayerStats;
  const scales=[{amount:1e12,name:"billion"},{amount:1e9,name:"milliard"},{amount:1e6,name:"million"},{amount:1e3,name:"millier"}];
  const scaleFor=value=>scales.find(scale=>Math.abs(value)>=scale.amount);
  function format(value,unit,scale=scaleFor(value),digits=2){
    if(value===null||!Number.isFinite(value))return "Non renseigné";
    const suffix=unit==="money"?" $":"";
    if(!scale)return s.number(value,digits)+suffix;
    const amount=value/scale.amount,plural=Math.abs(Number(amount.toFixed(digits)))>=2?"s":"";
    return `${s.number(amount,digits)} ${scale.name}${plural}${suffix}`;
  }
  function delta(value,unit){return value===null?"Non comparable":`${value>0?"+":value<0?"−":""}${format(Math.abs(value),unit)}`;}
  function percentage(before,after){
    if(!Number.isFinite(before)||!Number.isFinite(after))return "Non comparable";
    if(before===0)return after===0?"0 %":"Non calculable : base à 0";
    if(before<0)return "Non calculable : base négative";
    const difference=after-before,rate=(Number.isFinite(difference)?difference/before:after/before-1)*100;
    if(!Number.isFinite(rate))return "Non calculable";
    if(rate!==0&&Math.abs(rate)<.01)return `< 0,01 % de ${rate>0?"hausse":"baisse"}`;
    return `${rate>0?"+":rate<0?"−":""}${s.number(Math.abs(rate),2)} %`;
  }
  function comparison(value,unit,point,previous){
    const amount=delta(value,unit);
    return value===null?amount:`${amount} (${percentage(previous?.value,point?.value)})`;
  }
  function tick(value,unit,maximum,spacing){
    const scale=scaleFor(maximum),divisor=scale?.amount||1,digits=Math.min(12,Math.max(2,Math.ceil(-Math.log10(spacing/divisor))+1));
    return format(value,unit,scale,digits);
  }
  window.StatGMGlobalEvolutionFormat={value:format,delta,tick,percentage,comparison};
})();
