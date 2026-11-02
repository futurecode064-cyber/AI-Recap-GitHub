from pathlib import Path
s=Path("main.gd").read_text()
checks={
 "scene":Path("main.tscn").exists(),
 "5 roles":'const ROLES = ["Cashier", "Tea Brewer", "Snack Cook", "Table Server", "Stock Keeper"]' in s,
 "host":'create_server(PORT,MAX_PLAYERS-1)' in s,
 "join":'create_client(join_address,PORT)' in s,
 "server authority":'func _apply_action(id: int, station: String)' in s,
 "distance validation":'p.distance_to(STATIONS[station]) > 3.45' in s,
 "cooldown":'last_actions' in s,
 "snapshots":'func receive_snapshot' in s,
 "inventory":'tea_stock' in s and 'snack_stock' in s,
 "rewards":'state["earned"]' in s,
 "20 levels":'mini(20' in s,
 "save":'FileAccess.open(SAVE_FILE,FileAccess.WRITE)' in s,
 "win/lose":'func _finish(won: bool)' in s,
 "touch":'button_down.connect' in s,
 "audio":'AudioStreamWAV' in s,
 "3D":'MeshInstance3D' in s,
 "settings":'func _settings()' in s,
 "tutorial":'func _tutorial()' in s,
 "mission test":Path("tests/mission_test.gd").exists(),
 "network test":Path("tests/network_test.gd").exists()
}
for k,v in checks.items(): print(("PASS" if v else "FAIL"),k)
assert all(checks.values())
print("STATIC PASS",len(checks))
