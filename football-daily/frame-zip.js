"use strict";
/* ZIP STORE: PNG is already compressed. Sequential CRC work keeps memory bounded. */
(function(){
 const table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;}
 function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
 const u16=(v,p,n)=>v.setUint16(p,n,true),u32=(v,p,n)=>v.setUint32(p,n,true);
 class Archive{
  constructor(){this.parts=[];this.entries=[];this.offset=0;const d=new Date();this.time=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1);this.date=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();}
  async add(name,blob){if(this.entries.length>=65535||this.offset+blob.size>0xffffffff)throw Error('ZIP အရွယ်အစား ကန့်သတ်ချက် ကျော်လွန်ပါသည်');const filename=new TextEncoder().encode(name);const crc=crc32(new Uint8Array(await blob.arrayBuffer()));const h=new Uint8Array(30+filename.length),v=new DataView(h.buffer);u32(v,0,0x04034b50);u16(v,4,20);u16(v,6,0x800);u16(v,10,this.time);u16(v,12,this.date);u32(v,14,crc);u32(v,18,blob.size);u32(v,22,blob.size);u16(v,26,filename.length);h.set(filename,30);this.entries.push({filename,crc,size:blob.size,offset:this.offset});this.parts.push(h,blob);this.offset+=h.length+blob.size;}
  finish(){let size=0;const central=[];for(const e of this.entries){const h=new Uint8Array(46+e.filename.length),v=new DataView(h.buffer);u32(v,0,0x02014b50);u16(v,4,20);u16(v,6,20);u16(v,8,0x800);u16(v,12,this.time);u16(v,14,this.date);u32(v,16,e.crc);u32(v,20,e.size);u32(v,24,e.size);u16(v,28,e.filename.length);u32(v,42,e.offset);h.set(e.filename,46);central.push(h);size+=h.length;}const end=new Uint8Array(22),v=new DataView(end.buffer);u32(v,0,0x06054b50);u16(v,8,this.entries.length);u16(v,10,this.entries.length);u32(v,12,size);u32(v,16,this.offset);return new Blob([...this.parts,...central,end],{type:'application/zip'});}
 }
 window.FutureCodeFrameZip={Archive,crc32};
})();
