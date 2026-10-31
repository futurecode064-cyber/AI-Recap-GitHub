"use strict";
const assert=require("node:assert/strict");
const test=require("node:test");
const {time}=require("../football-data-client.js");
const pairs=[
 ["00:00","12:00 AM"],["01:30","1:30 AM"],["02:30","2:30 AM"],
 ["07:00","7:00 AM"],["11:59","11:59 AM"],["12:00","12:00 PM"],
 ["19:00","7:00 PM"],["21:30","9:30 PM"],["23:59","11:59 PM"],
 ["7:00 PM","7:00 PM"],["1:30 Am","1:30 AM"],
 ["2026-11-01 02:30 MMT","2:30 AM"],["၀၂:၃၀","2:30 AM"]
];
test("12-hour clock converts every boundary and handles rerendering",()=>{
 for(const [input,expected] of pairs)assert.equal(time.clock(input),expected,input);
});
test("The midnight following editorial night preserves actual fixture date",()=>{
 const m={nightEditorialDate:"2026-10-31",kickoffCalendarDate:"2026-11-01",
  kickoff:"02:30",kickoffYangon:"2026-11-01 02:30 MMT"};
 assert.equal(time.clock(m),"2:30 AM");
 assert.equal(time.date(m),"2026-11-01");
 assert.equal(time.full(m),"2026-11-01 2:30 AM MMT");
});
test("Mismatched or unparseable source clocks are not invented",()=>{
 assert.equal(time.clock({kickoff:"unknown"}),"—");
 assert.equal(time.clock("25:00"),"—");
});
