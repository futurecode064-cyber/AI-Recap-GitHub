extends SceneTree
var game
func _initialize() -> void:
	call_deferred("_run")
func _run() -> void:
	game = load("res://main.tscn").instantiate()
	root.add_child(game)
	await process_frame
	game._host_room()
	game.players[2] = game._new_player("QA Partner", "qa-token", 2)
	game._start_shift()
	if not game.running or game.target != 4 + game.level * 2:
		printerr("RULE_FAIL start")
		quit(2)
		return
	var before_coins: int = game.coins
	var before_level: int = game.level
	game.time_left = 0.01
	await create_timer(0.3).timeout
	if not game.ended or not game.result_text.begins_with("SHIFT LOST"):
		printerr("RULE_FAIL loss")
		quit(3)
		return
	if game.coins != before_coins or game.level != before_level:
		printerr("RULE_FAIL loss reward")
		quit(4)
		return
	game.level = 4
	game.coins = 777
	game._save_progress()
	game.queue_free()
	await process_frame
	var fresh = load("res://main.tscn").instantiate()
	root.add_child(fresh)
	await process_frame
	if fresh.level != 4 or fresh.coins != 777:
		printerr("RULE_FAIL persistence ",fresh.level," ",fresh.coins)
		quit(5)
		return
	print("RULE_PASS timer_loss=true no_loss_reward=true save_load=true level=",fresh.level," coins=",fresh.coins)
	quit(0)
