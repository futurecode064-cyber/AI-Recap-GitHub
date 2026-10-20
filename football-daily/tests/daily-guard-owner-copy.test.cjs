"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const {execFileSync}=require("node:child_process");
const path=require("node:path");
test("publication guard accepts exact owner copies and rejects altered text, wrong dates and forged source paths",()=>{
 const result=execFileSync("python3",["-c",String.raw`
import copy, importlib.util, json
from pathlib import Path
spec=importlib.util.spec_from_file_location('guard','football-daily/scripts/daily_guard.py')
g=importlib.util.module_from_spec(spec); spec.loader.exec_module(g)
d=json.loads(g.REPORT.read_text()); day=d['reportDate']
for m in d['matches']:
 if (m.get('userPreviewVerbatim') or {}).get('exactCopy'):
  assert g.owner_preview_matches_source(m,day)
  bad=copy.deepcopy(m); bad['dailyPreviewText']+=' altered'; assert not g.owner_preview_matches_source(bad,day)
  assert not g.owner_preview_matches_source(m,'2000-01-01')
 if (m.get('specialUserVerbatim') or {}).get('exactCopy'):
  assert g.owner_special_matches_source(m,day)
  bad=copy.deepcopy(m); bad['specialAnalysisParagraphs'][0]+=' altered'; assert not g.owner_special_matches_source(bad,day)
  bad=copy.deepcopy(m); bad['specialUserVerbatim']['sourceFile']='../today.json'; assert not g.owner_special_matches_source(bad,day)
print('owner-copy guards passed')
`],{cwd:path.resolve(__dirname,"../.."),encoding:"utf8"});
 assert.match(result,/owner-copy guards passed/);
});
