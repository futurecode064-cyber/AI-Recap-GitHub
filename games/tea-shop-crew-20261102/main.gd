extends Node3D
## Future Code AI Studio — Tea Shop Morning Crew
## Original Godot 4 LAN co-op. Host is authoritative for jobs, positions and rewards.

const PORT := 24618
const MAX_CLIENTS := 4
const ROLES := ["Waiter", "Tea Maker", "Cook", "Cleaner", "Stock Keeper"]
const TYPES := ["Tea", "Snack", "Mohinga"]
const SAVE_FILE := "user://tea_shop_crew_v1.json"
const MOVE_SPEED := 5.2

var players: Dictionary = {}
var avatars: Dictionary = {}
var stations: Dictionary = {}
var tickets: Array = []
var running := false
var ended := false
var result_text := ""
var level := 1
var coins := 0
var wins := 0
var target := 6
var completed := 0
var spawned := 0
var ticket_seq := 0
var time_left := 180.0
var satisfaction := 100.0
var stock: Dictionary = {"tea": 6, "food": 6, "soap": 6}
var spawn_clock := 0.0
var sync_clock := 0.0
var input_clock := 0.0
var touch_dir := Vector2.ZERO
var role_choice: OptionButton
var menu: PanelContainer
var hud: Label
var ticket_label: Label
var message_label: Label
var ip_input: LineEdit
var name_input: LineEdit
var start_button: Button
var work_button: Button
var sound_on := true
var session_token := ""
var local_name := "Player"
var event_log := ""
var audio_player: AudioStreamPlayer
var last_action: Dictionary = {}
var reconnect_roles: Dictionary = {}

func _ready() -> void:
	randomize()
	_load_progress()
	_make_world()
	_make_ui()
	_make_audio()
	multiplayer.peer_connected.connect(_on_peer_connected)
	multiplayer.peer_disconnected.connect(_on_peer_disconnected)
	multiplayer.connected_to_server.connect(_on_connected)
	multiplayer.connection_failed.connect(_on_connection_failed)
	multiplayer.server_disconnected.connect(_on_server_disconnected)
	_set_message("Create a LAN room or join a friend on the same Wi-Fi.")
	_refresh_ui()

func _make_world() -> void:
	var sky_floor := Color(0.72, 0.64, 0.47)
	_box("Ground", Vector3(0, -0.25, 0), Vector3(34, 0.5, 26), sky_floor)
	_box("Tea shop floor", Vector3(0, 0.03, -1), Vector3(22, 0.13, 17), Color(0.74, 0.59, 0.41))
	_box("Back wall", Vector3(0, 1.8, -9.5), Vector3(23, 3.6, 0.45), Color(0.88, 0.79, 0.60))
	_box("Left wall", Vector3(-11.4, 1.8, -1), Vector3(0.45, 3.6, 17), Color(0.84, 0.72, 0.54))
	_box("Right wall", Vector3(11.4, 1.8, -1), Vector3(0.45, 3.6, 17), Color(0.84, 0.72, 0.54))
	_box("Roof edge", Vector3(0, 3.8, -1), Vector3(23, 0.4, 18), Color(0.33, 0.18, 0.13))
	_box("Serving counter", Vector3(0, 0.65, -4.2), Vector3(7.0, 1.3, 1.0), Color(0.44, 0.27, 0.16))
	_box("Tea kettle", Vector3(-5.8, 0.85, -6.2), Vector3(2.0, 1.6, 1.7), Color(0.42, 0.48, 0.49))
	_box("Kitchen range", Vector3(5.7, 0.85, -6.2), Vector3(2.3, 1.6, 1.7), Color(0.28, 0.30, 0.32))
	_box("Washing sink", Vector3(8.5, 0.7, 2.3), Vector3(2.2, 1.4, 1.8), Color(0.54, 0.62, 0.64))
	_box("Stock shelves", Vector3(-8.4, 1.2, 1.5), Vector3(2.0, 2.4, 3.2), Color(0.44, 0.31, 0.22))
	for i in range(3):
		var x := -5.0 + float(i) * 5.0
		_box("Customer table %d" % i, Vector3(x, 0.65, 3.8), Vector3(2.3, 0.2, 1.4), Color(0.46, 0.28, 0.15))
		for side in [-1, 1]:
			_box("Bench", Vector3(x, 0.37, 3.8 + side * 1.3), Vector3(2.1, 0.24, 0.65), Color(0.29, 0.20, 0.12))
	stations = {
		"order": Vector3(0, 0, -2.8),
		"tea": Vector3(-5.8, 0, -4.5),
		"kitchen": Vector3(5.7, 0, -4.5),
		"serve": Vector3(0, 0, 2.3),
		"wash": Vector3(8.5, 0, 4.1),
		"stock": Vector3(-8.4, 0, 3.7)
	}
	var station_colors := {
		"order": Color(0.99, 0.76, 0.28),
		"tea": Color(0.62, 0.85, 0.43),
		"kitchen": Color(0.94, 0.48, 0.32),
		"serve": Color(0.45, 0.79, 0.92),
		"wash": Color(0.45, 0.65, 0.98),
		"stock": Color(0.80, 0.55, 0.93)
	}
	for key in stations:
		var p: Vector3 = stations[key]
		_box("Station " + key, p + Vector3(0, 0.08, 0), Vector3(2.1, 0.15, 2.1), station_colors[key])
		var tag := Label3D.new()
		tag.text = key.to_upper()
		tag.font_size = 50
		tag.pixel_size = 0.008
		tag.position = p + Vector3(0, 2.0, 0)
		tag.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		add_child(tag)
	var sunlight := DirectionalLight3D.new()
	sunlight.rotation_degrees = Vector3(-48, -28, 0)
	sunlight.light_energy = 1.15
	add_child(sunlight)
	var lamp := OmniLight3D.new()
	lamp.position = Vector3(0, 5.0, 0)
	lamp.light_energy = 1.3
	lamp.omni_range = 22
	add_child(lamp)
	var camera := Camera3D.new()
	camera.position = Vector3(0, 23, 23)
	add_child(camera)
	camera.look_at(Vector3(0, 0, -1), Vector3.UP)
	camera.current = true

func _box(label: String, pos: Vector3, size: Vector3, color: Color) -> void:
	var mesh := BoxMesh.new()
	mesh.size = size
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.8
	mesh.material = material
	var node := MeshInstance3D.new()
	node.name = label
	node.mesh = mesh
	node.position = pos
	add_child(node)

func _make_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var root := Control.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layer.add_child(root)
	var top := PanelContainer.new()
	top.position = Vector2(12, 10)
	top.custom_minimum_size = Vector2(830, 65)
	root.add_child(top)
	hud = Label.new()
	hud.add_theme_font_size_override("font_size", 20)
	top.add_child(hud)
	var orders := PanelContainer.new()
	orders.position = Vector2(12, 84)
	orders.custom_minimum_size = Vector2(310, 230)
	root.add_child(orders)
	ticket_label = Label.new()
	ticket_label.add_theme_font_size_override("font_size", 18)
	orders.add_child(ticket_label)
	message_label = Label.new()
	message_label.position = Vector2(340, 95)
	message_label.custom_minimum_size = Vector2(550, 45)
	message_label.add_theme_font_size_override("font_size", 19)
	root.add_child(message_label)
	menu = PanelContainer.new()
	menu.position = Vector2(375, 140)
	menu.custom_minimum_size = Vector2(530, 435)
	root.add_child(menu)
	var stack := VBoxContainer.new()
	stack.add_theme_constant_override("separation", 8)
	menu.add_child(stack)
	var title := Label.new()
	title.text = "FUTURE CODE | TEA SHOP MORNING CREW"
	title.add_theme_font_size_override("font_size", 23)
	stack.add_child(title)
	var info := Label.new()
	info.text = "2-5 Players • Same Wi-Fi • Port 24618\nHost starts a shift when at least two players join."
	stack.add_child(info)
	name_input = LineEdit.new()
	name_input.placeholder_text = "Your nickname"
	name_input.text = local_name
	stack.add_child(name_input)
	ip_input = LineEdit.new()
	ip_input.placeholder_text = "Host LAN IP, e.g. 192.168.1.12"
	stack.add_child(ip_input)
	var row := HBoxContainer.new()
	stack.add_child(row)
	var host_button := Button.new()
	host_button.text = "HOST ROOM"
	host_button.pressed.connect(_host_room)
	row.add_child(host_button)
	var join_button := Button.new()
	join_button.text = "JOIN ROOM"
	join_button.pressed.connect(_join_room)
	row.add_child(join_button)
	role_choice = OptionButton.new()
	for role in ROLES:
		role_choice.add_item(role)
	role_choice.item_selected.connect(_select_role)
	stack.add_child(role_choice)
	start_button = Button.new()
	start_button.text = "START SHIFT (HOST)"
	start_button.pressed.connect(_start_shift)
	stack.add_child(start_button)
	var settings_button := Button.new()
	settings_button.text = "SOUND ON / OFF"
	settings_button.pressed.connect(_toggle_sound)
	stack.add_child(settings_button)
	var help := Label.new()
	help.text = "HOW TO PLAY\nOrder → Brew/Cook → Serve → Wash.\nRestock at the purple shelf. Keep customers happy.\nMove: WASD / arrows / touch. Work: E / WORK."
	stack.add_child(help)
	var menu_toggle := Button.new()
	menu_toggle.text = "MENU"
	menu_toggle.position = Vector2(1120, 12)
	menu_toggle.custom_minimum_size = Vector2(130, 55)
	menu_toggle.pressed.connect(func(): menu.visible = not menu.visible)
	root.add_child(menu_toggle)
	_touch_button(root, "◀", Vector2(30, 610), Vector2(-1, 0))
	_touch_button(root, "▶", Vector2(176, 610), Vector2(1, 0))
	_touch_button(root, "▲", Vector2(104, 540), Vector2(0, -1))
	_touch_button(root, "▼", Vector2(104, 645), Vector2(0, 1))
	work_button = Button.new()
	work_button.text = "WORK (E)"
	work_button.position = Vector2(1040, 590)
	work_button.custom_minimum_size = Vector2(190, 90)
	work_button.add_theme_font_size_override("font_size", 25)
	work_button.pressed.connect(_try_work)
	root.add_child(work_button)

func _touch_button(root: Control, label: String, pos: Vector2, direction: Vector2) -> void:
	var button := Button.new()
	button.text = label
	button.position = pos
	button.custom_minimum_size = Vector2(68, 68)
	button.add_theme_font_size_override("font_size", 26)
	button.button_down.connect(_touch_down.bind(direction))
	button.button_up.connect(_touch_up.bind(direction))
	root.add_child(button)

func _touch_down(direction: Vector2) -> void:
	touch_dir += direction
	touch_dir = touch_dir.limit_length()

func _touch_up(direction: Vector2) -> void:
	touch_dir -= direction
	touch_dir = touch_dir.limit_length()

func _make_audio() -> void:
	audio_player = AudioStreamPlayer.new()
	add_child(audio_player)
	var sample := AudioStreamWAV.new()
	sample.mix_rate = 22050
	sample.format = AudioStreamWAV.FORMAT_16_BITS
	var pcm := PackedByteArray()
	for i in range(2600):
		var envelope := 1.0 - float(i) / 2600.0
		var value := int(sin(float(i) * TAU * 660.0 / 22050.0) * 10000.0 * envelope)
		pcm.append(value & 255)
		pcm.append((value >> 8) & 255)
	sample.data = pcm
	audio_player.stream = sample
	audio_player.volume_db = -14.0

func _play_feedback() -> void:
	if sound_on:
		audio_player.play()

func _load_progress() -> void:
	if FileAccess.file_exists(SAVE_FILE):
		var file := FileAccess.open(SAVE_FILE, FileAccess.READ)
		if file != null:
			var data = JSON.parse_string(file.get_as_text())
			if typeof(data) == TYPE_DICTIONARY:
				level = clampi(int(data.get("level", 1)), 1, 20)
				coins = maxi(0, int(data.get("coins", 0)))
				wins = maxi(0, int(data.get("wins", 0)))
				sound_on = bool(data.get("sound", true))
				session_token = str(data.get("token", ""))
				local_name = str(data.get("name", "Player")).substr(0, 18)
	if session_token.is_empty():
		session_token = "%d-%d" % [Time.get_unix_time_from_system(), randi()]
		_save_progress()

func _save_progress() -> void:
	var file := FileAccess.open(SAVE_FILE, FileAccess.WRITE)
	if file != null:
		file.store_string(JSON.stringify({"level":level, "coins":coins, "wins":wins, "sound":sound_on, "token":session_token, "name":local_name}))

func _host_room() -> void:
	if multiplayer.multiplayer_peer != null:
		multiplayer.multiplayer_peer.close()
		multiplayer.multiplayer_peer = null
	players.clear()
	_clear_avatars()
	running = false
	ended = false
	var peer := ENetMultiplayerPeer.new()
	var error := peer.create_server(PORT, MAX_CLIENTS)
	if error != OK:
		_set_message("Host error: %s" % error_string(error))
		return
	multiplayer.multiplayer_peer = peer
	local_name = name_input.text.strip_edges().substr(0, 18)
	if local_name.is_empty():
		local_name = "Host"
	players[1] = _new_player(local_name, session_token, 1)
	_save_progress()
	_set_message("HOST READY • Share your Wi-Fi IP • Port %d" % PORT)
	_refresh_ui()

func _join_room() -> void:
	if multiplayer.multiplayer_peer != null:
		multiplayer.multiplayer_peer.close()
		multiplayer.multiplayer_peer = null
	players.clear()
	_clear_avatars()
	running = false
	ended = false
	var ip := ip_input.text.strip_edges()
	if ip.is_empty():
		_set_message("Enter the host Wi-Fi IP.")
		return
	var peer := ENetMultiplayerPeer.new()
	var error := peer.create_client(ip, PORT)
	if error != OK:
		_set_message("Join error: %s" % error_string(error))
		return
	multiplayer.multiplayer_peer = peer
	local_name = name_input.text.strip_edges().substr(0, 18)
	if local_name.is_empty():
		local_name = "Guest"
	_save_progress()
	_set_message("Connecting to %s:%d..." % [ip, PORT])

func _new_player(nickname: String, token: String, id: int) -> Dictionary:
	var spawn_pos := Vector3(-3 + (id % 4) * 1.6, 0, 6)
	return {"name": nickname, "token": token, "role": ROLES[0], "pos": spawn_pos, "input": Vector2.ZERO}

func _on_connected() -> void:
	_rpc_join.rpc_id(1, local_name, session_token)
	_set_message("Connected. Choose a role, then wait for host.")

func _on_connection_failed() -> void:
	_set_message("Could not connect. Check Wi-Fi, host IP and firewall.")

func _on_server_disconnected() -> void:
	running = false
	menu.visible = true
	_set_message("Host disconnected. Your saved career remains on this device.")

func _on_peer_connected(_id: int) -> void:
	if multiplayer.is_server():
		_broadcast()

func _on_peer_disconnected(id: int) -> void:
	if multiplayer.is_server() and players.has(id):
		var p: Dictionary = players[id]
		reconnect_roles[str(p.get("token", ""))] = str(p.get("role", ROLES[0]))
		players.erase(id)
		if running and players.size() < 2:
			_finish(false, "A teammate disconnected.")
		_broadcast()
	_refresh_ui()

@rpc("any_peer", "call_remote", "reliable")
func _rpc_join(nickname: String, token: String) -> void:
	if not multiplayer.is_server() or running:
		return
	var id := multiplayer.get_remote_sender_id()
	if id < 2 or players.size() >= 5:
		return
	var p := _new_player(nickname.substr(0, 18), token.substr(0, 70), id)
	if reconnect_roles.has(token):
		p["role"] = reconnect_roles[token]
	players[id] = p
	_broadcast()

func _select_role(index: int) -> void:
	var role := ROLES[clampi(index, 0, ROLES.size() - 1)]
	if multiplayer.is_server():
		_assign_role(1, role)
	elif multiplayer.multiplayer_peer != null:
		_rpc_role.rpc_id(1, role)

@rpc("any_peer", "call_remote", "reliable")
func _rpc_role(role: String) -> void:
	if multiplayer.is_server():
		_assign_role(multiplayer.get_remote_sender_id(), role)

func _assign_role(id: int, role: String) -> void:
	if not players.has(id) or not ROLES.has(role):
		return
	var p: Dictionary = players[id]
	p["role"] = role
	players[id] = p
	_broadcast()

func _start_shift() -> void:
	if not multiplayer.is_server():
		_set_message("Only the host can start.")
		return
	if players.size() < 2:
		_set_message("Waiting for at least 2 players. Current: %d" % players.size())
		return
	running = true
	ended = false
	result_text = ""
	target = 4 + level * 2
	completed = 0
	spawned = 0
	ticket_seq = 0
	tickets.clear()
	time_left = 180.0 + float(level) * 5.0
	satisfaction = 100.0
	stock = {"tea": 6, "food": 6, "soap": 6}
	spawn_clock = 0.0
	for i in range(2):
		_spawn_ticket()
	menu.visible = false
	_broadcast()
	_set_message("Shift started! Take orders, prepare, serve and wash.")

func _spawn_ticket() -> void:
	if spawned >= target or tickets.size() >= mini(5, 2 + int(level / 5)):
		return
	var kind := TYPES[randi_range(0, TYPES.size() - 1)]
	ticket_seq += 1
	tickets.append({"id":ticket_seq, "type":kind, "stage":0, "age":0.0})
	spawned += 1

func _physics_process(delta: float) -> void:
	if not running or ended:
		return
	var movement := _movement()
	if multiplayer.is_server():
		_set_input(1, movement)
		for id in players.keys():
			var p: Dictionary = players[id]
			var direction: Vector2 = p.get("input", Vector2.ZERO)
			var position: Vector3 = p.get("pos", Vector3.ZERO)
			position += Vector3(direction.x, 0, direction.y) * MOVE_SPEED * delta
			position.x = clampf(position.x, -9.8, 9.8)
			position.z = clampf(position.z, -7.7, 6.8)
			p["pos"] = position
			players[id] = p
		time_left -= delta
		spawn_clock += delta
		var interval := maxf(3.0, 8.0 - level * 0.22)
		if spawn_clock >= interval:
			spawn_clock = 0.0
			_spawn_ticket()
		for i in range(tickets.size()):
			var ticket: Dictionary = tickets[i]
			ticket["age"] = float(ticket["age"]) + delta
			tickets[i] = ticket
			if float(ticket["age"]) > maxf(12.0, 34.0 - level * 0.7):
				satisfaction -= delta * (0.65 + level * 0.04)
		if time_left <= 0:
			_finish(false, "Time ran out.")
		elif satisfaction <= 0:
			_finish(false, "Customers left unhappy.")
		sync_clock += delta
		if sync_clock >= 0.12:
			sync_clock = 0.0
			_broadcast()
	else:
		input_clock += delta
		if input_clock >= 0.1:
			input_clock = 0.0
			_rpc_input.rpc_id(1, movement.x, movement.y)
	_render_players()

func _movement() -> Vector2:
	var x := float(Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT)) - float(Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT))
	var y := float(Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN)) - float(Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP))
	return (Vector2(x, y) + touch_dir).limit_length()

func _unhandled_key_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_E:
		_try_work()

func _set_input(id: int, direction: Vector2) -> void:
	if not players.has(id):
		return
	var p: Dictionary = players[id]
	p["input"] = direction.limit_length()
	players[id] = p

@rpc("any_peer", "call_remote", "unreliable")
func _rpc_input(x: float, y: float) -> void:
	if multiplayer.is_server():
		_set_input(multiplayer.get_remote_sender_id(), Vector2(x, y))

func _nearest_station(id: int) -> String:
	if not players.has(id):
		return ""
	var p: Dictionary = players[id]
	var pos: Vector3 = p.get("pos", Vector3.ZERO)
	var best := ""
	var best_distance := 3.0
	for station in stations:
		var distance := pos.distance_to(stations[station])
		if distance < best_distance:
			best_distance = distance
			best = station
	return best

func _try_work() -> void:
	if not running or ended:
		return
	if multiplayer.is_server():
		_do_work(1)
	elif multiplayer.multiplayer_peer != null:
		_rpc_work.rpc_id(1)

@rpc("any_peer", "call_remote", "reliable")
func _rpc_work() -> void:
	if multiplayer.is_server():
		_do_work(multiplayer.get_remote_sender_id())

func _do_work(id: int) -> void:
	if not running or ended or not players.has(id):
		return
	var now := Time.get_ticks_msec()
	if now - int(last_action.get(id, 0)) < 480:
		return
	last_action[id] = now
	var station := _nearest_station(id)
	if station.is_empty():
		_set_message("Move closer to a colored work station.")
		return
	var p: Dictionary = players[id]
	var role := str(p.get("role", ROLES[0]))
	if station == "stock":
		stock["tea"] = mini(12, int(stock["tea"]) + (5 if role == "Stock Keeper" else 3))
		stock["food"] = mini(12, int(stock["food"]) + (5 if role == "Stock Keeper" else 3))
		stock["soap"] = mini(12, int(stock["soap"]) + 4)
		satisfaction = minf(100.0, satisfaction + 1.0)
		_play_feedback()
		_broadcast()
		return
	for i in range(tickets.size()):
		var ticket: Dictionary = tickets[i]
		var stage := int(ticket["stage"])
		var kind := str(ticket["type"])
		var expected := ""
		if stage == 0:
			expected = "order"
		elif stage == 1:
			expected = "tea" if kind == "Tea" else "kitchen"
		elif stage == 2:
			expected = "serve"
		elif stage == 3:
			expected = "wash"
		if expected != station:
			continue
		if stage == 1:
			var supply := "tea" if kind == "Tea" else "food"
			if int(stock[supply]) <= 0:
				_set_message("Out of supplies. Use the STOCK shelf.")
				return
			stock[supply] = int(stock[supply]) - 1
		if stage == 3:
			if int(stock["soap"]) <= 0:
				_set_message("No soap. Restock first.")
				return
			stock["soap"] = int(stock["soap"]) - 1
		ticket["stage"] = stage + 1
		tickets[i] = ticket
		if stage == 3:
			tickets.remove_at(i)
			completed += 1
			satisfaction = minf(100.0, satisfaction + (6.0 if role == "Cleaner" else 4.0))
			if completed >= target:
				_finish(true, "Every order completed. Great teamwork!")
			else:
				_spawn_ticket()
		else:
			var bonus := 1.8 if ((station == "order" and role == "Waiter") or (station == "tea" and role == "Tea Maker") or (station == "kitchen" and role == "Cook")) else 0.6
			satisfaction = minf(100.0, satisfaction + bonus)
		_play_feedback()
		_broadcast()
		return
	_set_message("No ticket needs this station right now.")

func _finish(success: bool, explanation: String) -> void:
	if ended:
		return
	ended = true
	running = false
	result_text = ("SHIFT WON" if success else "SHIFT LOST") + " • " + explanation
	if success:
		var reward := 100 + level * 35 + int(satisfaction)
		coins += reward
		wins += 1
		level = mini(20, level + 1)
		_save_progress()
	_broadcast()
	menu.visible = true
	_set_message(result_text)

func _pack_state() -> Dictionary:
	var safe_players := {}
	for id in players:
		var p: Dictionary = players[id]
		safe_players[id] = {"name":p["name"], "role":p["role"], "pos":p["pos"]}
	return {
		"players":safe_players, "tickets":tickets.duplicate(true),
		"running":running, "ended":ended, "result":result_text,
		"level":level, "coins":coins, "target":target,
		"completed":completed, "time":time_left,
		"happy":satisfaction, "stock":stock.duplicate(true)
	}

func _broadcast() -> void:
	_render_players()
	_refresh_ui()
	if multiplayer.is_server() and multiplayer.multiplayer_peer != null:
		_rpc_snapshot.rpc(_pack_state())

@rpc("authority", "call_remote", "reliable")
func _rpc_snapshot(data: Dictionary) -> void:
	if multiplayer.is_server():
		return
	players = data.get("players", {})
	tickets = data.get("tickets", [])
	running = bool(data.get("running", false))
	ended = bool(data.get("ended", false))
	result_text = str(data.get("result", ""))
	level = int(data.get("level", level))
	coins = int(data.get("coins", coins))
	target = int(data.get("target", target))
	completed = int(data.get("completed", completed))
	time_left = float(data.get("time", time_left))
	satisfaction = float(data.get("happy", satisfaction))
	stock = data.get("stock", stock)
	if ended:
		menu.visible = true
	_render_players()
	_refresh_ui()

func _render_players() -> void:
	for id in players:
		var p: Dictionary = players[id]
		if not avatars.has(id):
			var body := MeshInstance3D.new()
			var shape := CapsuleMesh.new()
			shape.radius = 0.38
			shape.height = 1.7
			body.mesh = shape
			var material := StandardMaterial3D.new()
			material.albedo_color = Color.from_hsv(float(int(id) % 7) / 7.0, 0.65, 0.95)
			body.material_override = material
			add_child(body)
			avatars[id] = body
		var avatar: MeshInstance3D = avatars[id]
		var pos: Vector3 = p.get("pos", Vector3.ZERO)
		avatar.position = pos + Vector3(0, 0.9, 0)
	for id in avatars.keys():
		if not players.has(id):
			avatars[id].queue_free()
			avatars.erase(id)

func _clear_avatars() -> void:
	for avatar in avatars.values():
		avatar.queue_free()
	avatars.clear()

func _refresh_ui() -> void:
	if hud == null:
		return
	hud.text = "DAY %d/20  |  %d/%d ORDERS  |  %ds  |  HAPPY %d%%  |  %d COINS  |  %d PLAYERS" % [level, completed, target, maxi(0, int(time_left)), maxi(0, int(satisfaction)), coins, players.size()]
	var lines := "TODAY'S ORDERS\n"
	if tickets.is_empty():
		lines += "Waiting for customers..."
	for ticket in tickets:
		var stages := ["TAKE ORDER", "BREW / COOK", "SERVE", "WASH"]
		var stage := clampi(int(ticket["stage"]), 0, 3)
		lines += "#%d %s → %s\n" % [int(ticket["id"]), str(ticket["type"]), stages[stage]]
	lines += "\nSTOCK Tea:%d Food:%d Soap:%d" % [int(stock["tea"]), int(stock["food"]), int(stock["soap"])]
	ticket_label.text = lines
	if ended:
		message_label.text = result_text
	elif running:
		var local_id := multiplayer.get_unique_id()
		var nearest := _nearest_station(local_id)
		message_label.text = ("Near " + nearest.to_upper() + " • Press WORK" if not nearest.is_empty() else "Move to a colored station")
	start_button.disabled = not multiplayer.is_server() or players.size() < 2 or running
	work_button.disabled = not running

func _set_message(text: String) -> void:
	event_log = text
	if message_label != null:
		message_label.text = text

func _toggle_sound() -> void:
	sound_on = not sound_on
	_save_progress()
	_set_message("Sound " + ("ON" if sound_on else "OFF"))
