extends SceneTree

func _initialize() -> void:
	call_deferred("_test")

func _test() -> void:
	var game = load("res://main.tscn").instantiate()
	root.add_child(game)
	await process_frame
	game.local_name = "CI Host"
	game._host()
	if not game.hosting:
		push_error("CI FAIL: hosting")
		quit(1)
		return
	game.players[2] = {"name":"CI Friend","role":2,"pos":Vector3(0,0,7)}
	game.inputs[2] = Vector2.ZERO
	game._start_shift()
	if str(game.state.get("phase",""))!="playing":
		push_error("CI FAIL: start")
		quit(2)
		return
	var positions = {"brew":Vector3(-5,0,-5),"cook":Vector3(0,0,-5),"serve":Vector3(8,0,3),"cash":Vector3(-10,0,3)}
	for _order in range(int(game.state["target"])):
		for station in ["brew","cook","serve","cash"]:
			game.players[1]["pos"] = positions[station]
			game.last_actions[1] = -100000
			game._apply_action(1,station)
	if str(game.state.get("phase",""))!="won":
		push_error("CI FAIL: mission result "+str(game.state))
		quit(3)
		return
	if int(game.save["coins"])<=0 or int(game.save["unlocked"])<2:
		push_error("CI FAIL: rewards or unlock")
		quit(4)
		return
	var old_coins = int(game.save["coins"])
	game._load_save()
	if int(game.save["coins"])!=old_coins:
		push_error("CI FAIL: save/load")
		quit(5)
		return
	print("CI MISSION PASS: orders, actions, rewards, save/load")
	game._shutdown()
	quit(0)
