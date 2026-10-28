'use strict';
const fs=require('fs');
const path=require('path');
const project=process.argv[2];
function load(p){return fs.readFileSync(path.resolve(p),'utf8')}
function jsonSegment(source,prefix,end) {
 const a=source.indexOf(prefix);
 if(a<0)throw new Error('Audio lesson source missing: '+prefix);
 const start=a+prefix.length;let inside=false,escaped=false,level=0,endIndex=-1;
 for(let i=start;i<source.length;i++){
   const c=source[i];
   if(inside){if(escaped){escaped=false;continue}if(c==='\\'){escaped=true;continue}if(c==='"'){inside=false}continue}
   if(c==='"'){inside=true;continue}
   if(c==='['||c==='{')level++;
   if(c===']'||c==='}') {level--;if(level===0){endIndex=i+1;break}}
 }
 if(endIndex<0)throw new Error('Audio lesson JSON array/object boundary missing');
 return JSON.parse(source.slice(start,endIndex));
}
const output={};
function put(lang,text){
 if(typeof text!=='string'||!text.trim())return;
 (output[lang]??=[]).push(text.trim());
}
if(project==='thai'){
 const course=jsonSegment(load('portal/thai-course/course.js'),'const course=',';const $=');
 for(const level of course)for(const module of level[3])for(const word of module[2])put('th',word[0]);
 const names=jsonSegment(load('portal/thai-course/course.js'),'const letterNames=',';');
 for(const name of Object.values(names))put('th',name);
} else if(project==='chinese'){
 const course=jsonSegment(load('chinese-learning/app/src/main/assets/course.js'),'window.FC_COURSE=',';');
 for(const level of course)for(const unit of level.units)for(const word of unit.words)put('zh',word[0]);
} else if(project==='english'){
 const doc=load('english-academy-android/android/assets/lessons.js');
 const data=jsonSegment(doc,'window.FC_COURSE = ',';');
 for(const lesson of data.lessons){put('en',lesson.target);put('en',lesson.reading);for(const phrase of lesson.phrases)put('en',phrase)}
} else if(project==='academy'){
 const html=load('portal/apps/languages/index.html');
 const languages=jsonSegment(html,'const languages=',';\nconst $=');
 for(const lang of languages)for(const phrase of lang[4])put(lang[0],phrase);
} else {throw new Error('Unsupported app: '+project)}
for(const [lang,texts] of Object.entries(output))output[lang]=[...new Set(texts)];
if(!Object.values(output).length||Object.values(output).some(v=>v.length<10))throw new Error('Too few audio clips to ship');
process.stdout.write(JSON.stringify(output));
