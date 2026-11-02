# Future Code AI Studio — 2026-11-02 Multiplayer Game Concepts (Myanmar)

**Scope:** Original 2–5 player Android-first co-op, one small map per game. Godot 4.5.1, LAN ENet first; online relay later. Every title targets 30 FPS on a midrange Android device and 60 FPS where practical, subject to real hardware tests. All 3D styles below are art targets, not certified finished assets.

## 1. Tea Shop Morning Crew — selected
**Hook:** ရပ်ကွက်လက်ဖက်ရည်ဆိုင် မနက်ခင်း Rush Hour မှာ အော်ဒါတင်၊ ဖျော်၊ ချက်၊ ပို့၊ ပန်းကန်ဆေး၊ Stock ဖြည့်ပြီး ဖောက်သည်မစိတ်ပျက်အောင် အဖွဲ့လိုက် ထိန်းပါ။
**Map:** 34 × 26 m plot; playable interior 22 × 17 m. **Players:** 2–5. **Roles:** Waiter, Tea Maker, Cook, Cleaner, Stock Keeper.
**Missions:** L1 — tea/snack orders 6; L8 — orders 20 with shorter patience and 3 parallel tickets; L20 — orders 44 with 5 concurrent tickets and reduced patience. **Win:** all tickets cleared within time and satisfaction above zero. **Lose:** timer expires, satisfaction reaches zero, or too few players remain. **Replay:** random tea/snack/mohinga ticket order, assigned roles, supply pressure. **Co-op:** order→brew/cook→serve→wash pipeline, stock runs; any player can help, role bonus. **3D:** semi-realistic timber counter, stainless kettle, tiled floor, tea cups, morning sunlight, optimized GL Compatibility. **Difficulty:** Medium. **Performance:** 30–60 FPS target, 1080p-capable UI.

## 2. Village Water Pipeline Crew
**Hook:** ရွာတစ်ရွာရဲ့ ရေတိုင်ကီနဲ့ ပိုက်လိုင်းကို မိုးရာသီမတိုင်ခင် အဖွဲ့လိုက် ဆက်၊ ယိုစိမ့်မှုစစ်၊ Valve ချိန်ပြီး ရေပေးဝေပါ။
**Map:** 42 × 28 m pump compound. **Players:** 2–5. **Roles:** Pipe Fitter, Valve Operator, Leak Inspector, Pump Mechanic, Dispatcher.
**Missions:** L1 — 3 pipe joints and one valve; L9 — 8 joints, 2 leaks, pump pressure balance; L20 — 15 joints, 4 leaks, emergency pressure fluctuation. **Win:** all 3 delivery points receive safe pressure; **Lose:** tank empties or pressure damage reaches limit. **Replay:** randomized leak locations and valve order. **Co-op:** one player holds joint, another bolts; pressure changes synchronized. **3D:** damp concrete, metal valves, flowing water indicators. **Difficulty:** Medium–High. **Performance:** 30–60 FPS target.

## 3. Wedding Kitchen Banquet Crew
**Hook:** မင်္ဂလာဆောင်အတွက် မီးဖိုချောင်လေးတစ်ခုမှာ စားပွဲဝိုင်းအလိုက် ဟင်းချက်၊ ထမင်းပြင်၊ ဧည့်ခံပို့ဆောင်ရမယ်။
**Map:** 30 × 24 m banquet kitchen and serving yard. **Players:** 2–5. **Roles:** Rice Cook, Curry Cook, Plater, Server, Supply Runner.
**Missions:** L1 — 2 tables; L10 — 6 tables and two menu combinations; L20 — 12 tables, urgent vegetarian order and fuel management. **Win:** meals served hot and complete; **Lose:** food burns or guests wait too long. **Replay:** changing guest count, menu and order timing. **Co-op:** coordinated cooking timer and tray handoff. **3D:** large cooking pots, steam, banquet tablecloths, warm light. **Difficulty:** Medium. **Performance:** 30–60 FPS target.

## 4. Small Town Bus Terminal Dispatch
**Hook:** ဘတ်စ်ကားဂိတ်သေးသေးတစ်ခုမှာ လက်မှတ်စစ်၊ ခရီးဆောင်အိတ်စီ၊ ကားထွက်ချိန်ညှိပြီး အဖွဲ့လိုက် ဘတ်စ်ကားထွက်ခွာအောင်လုပ်ပါ။
**Map:** 46 × 32 m terminal bay. **Players:** 2–5. **Roles:** Ticket Clerk, Baggage Handler, Boarding Marshal, Mechanic, Dispatcher.
**Missions:** L1 — board 8 passengers; L10 — 2 buses, 30 passengers, luggage limits; L20 — 3 bus departures with late arrivals and equipment faults. **Win:** correct passengers and bags leave on time; **Lose:** mismatched baggage or missed departures. **Replay:** passenger arrivals, luggage labels, departure schedules. **Co-op:** ticket validation + baggage routing + departure signal. **3D:** detailed parked bus, terminal signs, shaded concrete, realistic luggage. **Difficulty:** High. **Performance:** 30–60 FPS target.

## 5. Village Pottery Firing Crew
**Hook:** အိုးလုပ်ငန်းရုံတစ်ခုမှာ ရွှံ့နယ်၊ အိုးပုံဖော်၊ အခြောက်ခံ၊ မီးဖုတ်၊ အရည်အသွေးစစ်ပြီး အော်ဒါပို့ပါ။
**Map:** 28 × 20 m pottery yard. **Players:** 2–5. **Roles:** Clay Mixer, Wheel Shaper, Dryer, Kiln Keeper, Quality Inspector.
**Missions:** L1 — 4 bowls; L10 — 12 pots with moisture targets; L20 — 25 mixed items with kiln temperature control. **Win:** quality threshold and order count reached; **Lose:** excessive cracks or kiln fuel runs out. **Replay:** pottery shapes, clay moisture and firing schedule. **Co-op:** staged handoff and synchronized kiln heat management. **3D:** pottery wheel, textured clay, wood kiln, dust and warm shadows. **Difficulty:** Medium–High. **Performance:** 30–60 FPS target.

## Shared multiplayer production rules
LAN first: Godot ENet host authoritative for job state, scores and timers; up to 4 clients. Lobby, player roles, player state snapshots, distance/cooldown checks. A stable player token may be used for casual reconnect, but no secure account authentication. Disconnect policy and progression must be tested on real Android devices. Internet NAT traversal/relay is not included in these MVPs. Anti-griefing is limited to server-side job validation, distance and action cooldown. Each map stays small; never modify Mandalay City Helper.
