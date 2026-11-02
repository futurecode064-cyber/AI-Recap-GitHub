"use strict";
(function(root){
 const fields={outerBorder:"အပြင်ဘောင် အရင့်",headlineShadow:"သတင်းခေါင်းစဉ် အရိပ်",background:"နောက်ခံ အဓိက",deep:"နောက်ခံ အရင့်",glow:"နောက်ခံ အနု",masthead:"ခေါင်းစည်းစာ",mastheadOutline:"ခေါင်းစည်း အနားသတ်",mastheadShadow:"ခေါင်းစည်း အရိပ်",headline:"သတင်းခေါင်းစဉ်",headlineAccent:"သတင်းခေါင်းစဉ် အထူးစာ",headlineOutline:"သတင်းခေါင်းစဉ် အနားသတ်",bodyText:"သတင်းစာသား",leadPanel:"ပထမစာပိုဒ် နောက်ခံ",articlePanel:"အောက်စာပိုဒ် နောက်ခံ",border:"ဘောင် / အလှဆင်မျဉ်း",photoMat:"ဓာတ်ပုံ နောက်ခံ",divider:"ကော်လံခြား မျဉ်း",texture:"အလှဆင် အလင်းကြောင်း"};
 const valid=x=>/^#[0-9a-f]{6}$/i.test(x||"");
 function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);}
 function hue(hex){const [r,g,b]=rgb(hex),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;if(!d)return 210;return ((max===r?(g-b)/d:max===g?(b-r)/d+2:(r-g)/d+4)*60+360)%360;}
 function hsl(h,s,l){s/=100;l/=100;const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,"0");};return "#"+f(0)+f(8)+f(4);}
 function defaults(theme){let h=hue(valid(theme)?theme:"#16486c");
  // Electric RGB blue has a violet tint when mixed with white. Use sky-blue tints.
  if(h>=225&&h<=255)h=212;
  let bgLight=36;while(contrast("#ffffff",hsl(h,76,bgLight))<4.5&&bgLight>15)bgLight--;
  return {outerBorder:"#071525",headlineShadow:"#142337",background:hsl(h,76,bgLight),deep:hsl(h,72,12),glow:hsl(h,65,95),masthead:"#ffffff",mastheadOutline:hsl(h,68,10),mastheadShadow:"#03101e",headline:"#0b2038",headlineAccent:hsl(h,82,30),headlineOutline:"#ffffff",bodyText:"#142c42",leadPanel:"#ffffff",articlePanel:"#ffffff",border:hsl(h,67,76),photoMat:hsl(h,55,20),divider:hsl(h,42,85),texture:"#ffffff"};
 }
 function resolve(frame){const theme=valid(frame?.color)?frame.color:"#16486c",out=defaults(theme);
  if(frame?.newsPaletteTheme&&frame.newsPaletteTheme.toLowerCase()!==theme.toLowerCase())return out;
  for(const key of Object.keys(fields))if(valid(frame?.newsColors?.[key]))out[key]=frame.newsColors[key];
  return out;
 }
 function contrast(a,b){const lum=c=>rgb(c).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
 const api=Object.freeze({fields,defaults,resolve,contrast});
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.FutureCodeNewsPalette=api;
})(typeof window!=="undefined"?window:null);
