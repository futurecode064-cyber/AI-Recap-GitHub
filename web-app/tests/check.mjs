import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const html=readFileSync("web-app/index.html","utf8");
const js=readFileSync("web-app/app.js","utf8");
const css=readFileSync("web-app/styles.css","utf8");
const ids=[...js.matchAll(/\$\("([a-zA-Z][\w]*)"\)/g)].map(m=>m[1]);
const missing=[...new Set(ids)].filter(id=>!html.includes('id="'+id+'"'));
assert.deepEqual(missing,[],"JavaScript controls missing from HTML: "+missing.join(", "));
for(const id of ["apiKey","youtube","videoFile","analyzeBtn","ttsBtn","exportVideo","sceneList","fullScript","voicePlayer","renderStatus"]){
  assert.ok(html.includes('id="'+id+'"'),"Missing required UI control: "+id);
}
for(const fragment of ["generativelanguage.googleapis.com","gemini-3.8-flash","gemini-3.8-flash-tts","background:true","MediaRecorder","captureStream","output_audio","speech_metadata"]){
  assert.ok(js.includes(fragment),"Missing real workflow: "+fragment);
}
assert.ok(!/setInterval\s*\([^]*?Preview ready/.test(js),"Fake demo flow must not exist");
assert.ok(css.includes("@media"),"Responsive CSS expected");
assert.ok(!/apiKey\s*:\s*["']AIza/.test(js),"Do not include hardcoded Gemini API keys");
console.log("PASS: "+new Set(ids).size+" UI control references found in HTML");
console.log("PASS: Gemini video/TTS, editing and browser recording code present");
console.log("PASS: Responsive styles, no embedded Gemini API key");
