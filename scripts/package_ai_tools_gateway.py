#!/usr/bin/env python3
"""Prepare a self-contained VPN-free gateway payload for the existing owner site.
No GitHub Pages, Pages.dev or workers.dev runtime redirects. Deploy assets under
the *existing* chatgpt.site host at /ai-tools/; this command does NOT publish it.
"""
from pathlib import Path
import json, shutil, zipfile
root=Path(__file__).resolve().parents[1]
source=root/"portal"/"ai-tools"
out=root/"build"/"ai-tools-gateway"
if out.exists(): shutil.rmtree(out)
out.mkdir(parents=True)
required=("index.html","app-v2.js","styles.css","styles-v2.css","tools.json",
          "updates.json","link-health.json","manifest.json","icon.svg","android-version.json")
for name in required:
    origin=source/name
    if not origin.is_file(): raise SystemExit(f"Missing {origin}")
    shutil.copy2(origin,out/name)
catalog=json.loads((out/"tools.json").read_text(encoding="utf-8"))
news=json.loads((out/"updates.json").read_text(encoding="utf-8"))
if len(catalog["tools"])<1000 or len(catalog["categories"])!=31:
    raise SystemExit("Safety: expected AI Tools v2.0 catalog with 30 categories")
if catalog["revision"]!=news["revision"]:
    raise SystemExit("Safety: catalog/news revision mismatch")
page=(out/"index.html").read_text(encoding="utf-8")
if "./app-v2.js" not in page:raise SystemExit("V2 page script missing")
if any(x in page for x in ("http-equiv=\"refresh\"","window.location.href=")):
    raise SystemExit("Refuse a cross-host redirect instead of native gateway")
(out/"gateway-info.json").write_text(json.dumps({
    "name":"Future Code AI Tools existing gateway mirror",
    "expectedPath":"/ai-tools/",
    "catalogRevision":catalog["revision"],
    "tools":len(catalog["tools"]),
    "categories":len(catalog["categories"])-1,
    "status":"PACKAGE_ONLY_NOT_LIVE",
    "ownership":"Deploy into the owner's existing future-code-app-downloads-064.chatgpt.site project",
    "important":"Do not replace existing /myanmar-kyar/; add this route only."
},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
zipPath=root/"build"/"future-code-ai-tools-gateway.zip"
with zipfile.ZipFile(zipPath,"w",zipfile.ZIP_DEFLATED,compresslevel=7) as z:
    for f in sorted(out.iterdir()):
        z.write(f,arcname="ai-tools/"+f.name)
print(f"PACKAGE OK: {catalog['revision']} tools={len(catalog['tools'])} categories={len(catalog['categories'])-1}")
print(f"ZIP: {zipPath}")
print("No change to existing chatgpt.site gateway; upload/deploy remains pending.")
