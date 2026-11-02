extends SceneTree
var game
func _initialize() -> void:
	call_deferred("_run")
func _run() -> void:
	var host := "--host" in OS.get_cmdline_user_args()
	var expected := 5 if "--five" in OS.get_cmdline_user_args() else 2
	game = load("res://main.tscn").instantiate()
	root.add_child(game)
	await process_frame
	if host:
		game._host_room()
	else:
		game.ip_input.text = "127.0.0.1"
		game._join_room()
	await create_timer(3.0).timeout
	if host:
		if game.players.size() != expected:
			printerr("HOST_FAIL no join, count=",game.players.size())
			quit(2)
			return
		game._start_shift()
		for n in range(150):
			if game.ended:
				break
			if game.tickets.is_empty():
				await process_frame
				continue
			var t = game.tickets[0]
			var stage: int = t["stage"]
			var station := ""
			if stage == 0:
				station = "order"
			elif stage == 1:
				station = "tea" if t["type"] == "Tea" else "kitchen"
			elif stage == 2:
				station = "serve"
			else:
				station = "wash"
			var p: Dictionary = game.players[1]
			p["pos"] = game.stations[station]
			game.players[1] = p
			game.last_action[1] = 0
			game._do_work(1)
			await process_frame
		await create_timer(1.0).timeout
		if not game.ended or game.completed != game.target or game.wins < 1:
			printerr("HOST_FAIL finish=",game.ended," completed=",game.completed," target=",game.target)
			quit(3)
			return
		print("HOST_PASS connected=", expected, " completed=",game.completed," coins=",game.coins," level=",game.level)
		quit(0)
	else:
		var ok := false
		for i in range(120):
			if game.ended and game.completed == game.target and game.players.size() == expected:
				ok = true
				break
			await create_timer(0.1).timeout
		if not ok:
			printerr("CLIENT_FAIL connected=",game.players.size()," completed=",game.completed," ended=",game.ended)
			quit(4)
			return
		print("CLIENT_PASS connected=", expected, " completed=",game.completed," result=",game.result_text)
		quit(0)
