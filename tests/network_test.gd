extends SceneTree

func _initialize() -> void:
	call_deferred("_test")

func _test() -> void:
	var args = OS.get_cmdline_user_args()
	var is_host = "--host" in args
	var game = load("res://main.tscn").instantiate()
	root.add_child(game)
	await process_frame
	if is_host:
		game.local_name = "CI HOST"
		game._host()
	else:
		game.local_name = "CI CLIENT"
		var peer = ENetMultiplayerPeer.new()
		var err = peer.create_client("127.0.0.1",game.PORT)
		if err!=OK:
			push_error("CI FAIL client create "+str(err))
			quit(2)
			return
		game.multiplayer.multiplayer_peer = peer
		game.online = true
		game.hosting = false
	for i in range(60):
		await create_timer(0.2).timeout
		if is_host and game.players.size()>=2:
			game._start_shift()
			await create_timer(0.5).timeout
			print("CI NETWORK HOST PASS: peer joined, mission started")
			game._shutdown()
			quit(0)
			return
		if not is_host and game.players.size()>=2 and str(game.state.get("phase",""))=="playing":
			print("CI NETWORK CLIENT PASS: peer snapshot and mission")
			game._shutdown()
			quit(0)
			return
	push_error("CI NETWORK FAIL: timeout host="+str(is_host)+" peers="+str(game.players.size())+" state="+str(game.state))
	game._shutdown()
	quit(3)
