extends Node3D
# Future Code AI Studio — Tea Shop Rush Crew
# Original cooperative game. Server owns mission state, inventory, and rewards.

const PORT = 24582
const MAX_PLAYERS = 5
const MOVE_SPEED = 5.0
const SAVE_FILE = "user://futurecode_teashop_v1.json"
const ROLES = ["Cashier", "Tea Brewer", "Snack Cook", "Table Server", "Stock Keeper"]
const COLORS = [Color("#f4ba55"), Color("#55c6d5"), Color("#ed7c71"), Color("#91cb7b"), Color("#ba9ce9")]
const STATIONS = {
	"cash": Vector3(-10, 0, 3),
	"brew": Vector3(-5, 0, -5),
	"cook": Vector3(0, 0, -5),
	"serve": Vector3(8, 0, 3),
	"stock": Vector3(10, 0, -5),
	"clean": Vector3(5, 0, -5)
}
const TEAS = ["Milk Tea", "Sweet Tea", "Plain Tea", "Strong Tea"]
const SNACKS = ["Samosa", "Nan Bread", "Steamed Bun", "Fried Bread"]

var world: Node3D
var ui: Control
var ui_layer: CanvasLayer
var player_meshes: Dictionary = {}
var players: Dictionary = {}
var inputs: Dictionary = {}
var last_actions: Dictionary = {}
var departed: Dictionary = {}
var state: Dictionary = {}
var local_name = "Future Code Player"
var local_role = 1
var join_address = "192.168.1.2"
var hosting = false
var online = false
var screen = "menu"
var touch_dir = Vector2.ZERO
var move_timer = 0.0
var snapshot_timer = 0.0
var hud_timer = 0.0
var effect_timer = 0.0
var toast = ""
var toast_timer = 0.0
var save = {"unlocked": 1, "coins": 0, "wins": 0, "sound": true}
var selected_level = 1
var name_edit: LineEdit
var ip_edit: LineEdit
var role_select: OptionButton
var lobby_label: Label
var hud_label: Label
var order_label: Label
var toast_label: Label
var sound_player: AudioStreamPlayer

func _ready() -> void:
	_load_save()
	selected_level = int(save.get("unlocked", 1))
	_input_setup()
	_world_setup()
	_audio_setup()
	ui_layer = CanvasLayer.new()
	add_child(ui_layer)
	ui = Control.new()
	ui.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ui_layer.add_child(ui)
	_show_menu()
	multiplayer.peer_connected.connect(_peer_joined)
	multiplayer.peer_disconnected.connect(_peer_left)
	multiplayer.connected_to_server.connect(_connected)
	multiplayer.connection_failed.connect(_connection_failed)
	multiplayer.server_disconnected.connect(_server_disconnected)

func _input_setup() -> void:
	for name in ["left", "right", "up", "down", "interact"]:
		if not InputMap.has_action(name):
			InputMap.add_action(name)
	var keys = {"left": [KEY_A, KEY_LEFT], "right": [KEY_D, KEY_RIGHT], "up": [KEY_W, KEY_UP], "down": [KEY_S, KEY_DOWN], "interact": [KEY_E, KEY_SPACE]}
	for name in keys:
		for key in keys[name]:
			var ev = InputEventKey.new()
			ev.physical_keycode = key
			InputMap.action_add_event(name, ev)

func _world_setup() -> void:
	world = Node3D.new()
	world.name = "TeaShopWorld"
	add_child(world)
	_box("Ground", Vector3(0,-0.22,0), Vector3(32,0.4,24), Color("#b9b2a2"))
	_box("Floor", Vector3(0,0,0), Vector3(28,0.12,20), Color("#d6b48a"))
	for x in range(-13,14,2):
		_box("FloorJoint", Vector3(x,0.07,0), Vector3(0.025,0.01,20), Color("#a78059"))
	for z in range(-9,10,2):
		_box("FloorJoint", Vector3(0,0.07,z), Vector3(28,0.01,0.025), Color("#a78059"))
	_box("RearWall", Vector3(0,2.0,-10.1), Vector3(28,4,0.3), Color("#f2dfb8"))
	_box("LeftWall", Vector3(-14,2,-2), Vector3(0.3,4,16), Color("#ebd5ac"))
	_box("RightWall", Vector3(14,2,-2), Vector3(0.3,4,16), Color("#ebd5ac"))
	_box("RoofBeam", Vector3(0,4.0,-6), Vector3(28,0.25,0.3), Color("#70452d"))
	_box("RoofBeam", Vector3(0,4.0,1), Vector3(28,0.25,0.3), Color("#70452d"))
	for x in [-11,11]:
		_box("Pillar", Vector3(x,2,8), Vector3(0.38,4,0.38), Color("#855233"))
	for x in [-10,-5,0,5,10]:
		_box("RearShelf", Vector3(x,1.3,-9.6), Vector3(3.6,0.16,0.7), Color("#825238"))
	_box("Counter", Vector3(-5,0.9,-3.2), Vector3(10,1.6,1.5), Color("#92583a"))
	_box("CounterTop", Vector3(-5,1.75,-3.2), Vector3(10.3,0.16,1.8), Color("#c68e56"))
	_box("KitchenBench", Vector3(1.5,0.75,-7), Vector3(6,1.45,1.4), Color("#72777c"))
	_box("StoreShelf", Vector3(10,1.3,-8), Vector3(4,2.6,0.7), Color("#926c4b"))
	_box("CashRegister", Vector3(-10,1.9,-3.3), Vector3(0.8,0.4,0.7), Color("#384b52"))
	_box("RegisterScreen", Vector3(-10,2.17,-3.3), Vector3(0.65,0.13,0.5), Color("#8bd0bb"))
	_cylinder("TeaBoiler", Vector3(-5,2.2,-3.3), 0.48,0.95,Color("#a9b4b8"))
	_cylinder("KettleLid", Vector3(-5,2.75,-3.3), 0.51,0.1,Color("#e6d4b2"))
	_box("Stove", Vector3(0,1.6,-6.7), Vector3(2,0.2,1.3), Color("#30363a"))
	for i in range(3):
		_cylinder("Pan", Vector3(-0.7+i*0.7,1.75,-6.7),0.28,0.12,Color("#c2c3bd"))
	for i in range(5):
		_box("StockCrate", Vector3(9+(i%2)*1.2,0.35,-7.8+int(i/2)*1.1), Vector3(1.0,0.7,0.9),Color("#b88949"))
	_box("Sink", Vector3(5,1.25,-7),Vector3(1.9,0.35,1.4),Color("#b4c2c5"))
	_box("SinkWater", Vector3(5,1.45,-7),Vector3(1.3,0.03,0.9),Color("#7db6c5"))
	for x in [-9,-3,3,9]:
		_box("Table", Vector3(x,0.9,5),Vector3(2.3,0.16,2.0),Color("#97653f"))
		for sx in [-0.85,0.85]:
			for sz in [-0.65,0.65]:
				_box("TableLeg",Vector3(x+sx,0.45,5+sz),Vector3(0.14,0.9,0.14),Color("#6c462d"))
		for side in [-1,1]:
			_box("Stool",Vector3(x+side*1.7,0.5,5),Vector3(0.75,0.16,0.75),Color("#bb854c"))
			_box("StoolLeg",Vector3(x+side*1.7,0.24,5),Vector3(0.16,0.48,0.16),Color("#70503c"))
	for x in [-11,-7,-3,1,5,9]:
		_cylinder("Cup",Vector3(x,1.85,-3.2),0.13,0.24,Color("#f5eee0"))
	for name in STATIONS:
		var pos: Vector3 = STATIONS[name]
		_cylinder(name+"Marker",pos+Vector3(0,0.025,0),1.05,0.035,Color("#e2b04e") if name != "clean" else Color("#79d3d0"))
		_sign(name.to_upper(),pos+Vector3(0,2.7,0),Color("#fff4d2"))
	_sign("FUTURE CODE  •  TEA SHOP RUSH",Vector3(0,3.5,-9.8),Color("#68442c"))
	var sun = DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-52,-35,0)
	sun.light_energy = 1.25
	world.add_child(sun)
	var ambient = WorldEnvironment.new()
	var env = Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("#93bfd2")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("#fff1d8")
	env.ambient_light_energy = 0.75
	ambient.environment = env
	world.add_child(ambient)
	var cam = Camera3D.new()
	cam.position = Vector3(0,25,25)
	world.add_child(cam)
	cam.look_at(Vector3(0,0,0),Vector3.UP)
	cam.current = true

func _material(c: Color) -> StandardMaterial3D:
	var m = StandardMaterial3D.new()
	m.albedo_color = c
	m.roughness = 0.78
	return m

func _box(n: String, pos: Vector3, size: Vector3, color: Color) -> void:
	var mesh = MeshInstance3D.new()
	var b = BoxMesh.new()
	b.size = size
	mesh.mesh = b
	mesh.material_override = _material(color)
	mesh.position = pos
	mesh.name = n
	world.add_child(mesh)

func _cylinder(n: String, pos: Vector3, radius: float, height: float, color: Color) -> void:
	var mesh = MeshInstance3D.new()
	var c = CylinderMesh.new()
	c.top_radius = radius
	c.bottom_radius = radius
	c.height = height
	mesh.mesh = c
	mesh.material_override = _material(color)
	mesh.position = pos
	mesh.name = n
	world.add_child(mesh)

func _sign(t: String, pos: Vector3, color: Color) -> void:
	var label = Label3D.new()
	label.text = t
	label.font_size = 54
	label.pixel_size = 0.006
	label.modulate = color
	label.outline_size = 7
	label.position = pos
	world.add_child(label)

func _avatar(id: int, role: int) -> Node3D:
	var root = Node3D.new()
	root.name = "Player"+str(id)
	world.add_child(root)
	var body = MeshInstance3D.new()
	var capsule = CapsuleMesh.new()
	capsule.radius = 0.42
	capsule.height = 1.55
	body.mesh = capsule
	body.material_override = _material(COLORS[clampi(role,0,4)])
	body.position.y = 0.94
	root.add_child(body)
	var head = MeshInstance3D.new()
	var sphere = SphereMesh.new()
	sphere.radius = 0.36
	sphere.height = 0.72
	head.mesh = sphere
	head.material_override = _material(Color("#c88e67"))
	head.position.y = 1.93
	root.add_child(head)
	var name_tag = Label3D.new()
	name_tag.text = ROLES[clampi(role,0,4)]
	name_tag.font_size = 42
	name_tag.pixel_size = 0.005
	name_tag.position.y = 2.6
	root.add_child(name_tag)
	return root

func _audio_setup() -> void:
	sound_player = AudioStreamPlayer.new()
	add_child(sound_player)

func _beep(frequency: float = 680.0, duration: float = 0.10) -> void:
	if not bool(save.get("sound",true)):
		return
	var wav = AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = 22050
	wav.stereo = false
	var count = int(22050.0 * duration)
	var data = PackedByteArray()
	data.resize(count*2)
	for i in range(count):
		var envelope = minf(1.0,float(i)/200.0) * minf(1.0,float(count-i)/500.0)
		var sample = int(sin(float(i)*TAU*frequency/22050.0)*7000.0*envelope)
		data.encode_s16(i*2,sample)
	wav.data = data
	sound_player.stream = wav
	sound_player.play()

func _load_save() -> void:
	if not FileAccess.file_exists(SAVE_FILE):
		return
	var f = FileAccess.open(SAVE_FILE,FileAccess.READ)
	if f == null:
		return
	var data = JSON.parse_string(f.get_as_text())
	if data is Dictionary:
		for key in save:
			if data.has(key):
				save[key] = data[key]

func _write_save() -> void:
	var f = FileAccess.open(SAVE_FILE,FileAccess.WRITE)
	if f != null:
		f.store_string(JSON.stringify(save))

func _clear_ui() -> void:
	for child in ui.get_children():
		child.queue_free()
	hud_label = null
	order_label = null
	toast_label = null

func _panel() -> VBoxContainer:
	_clear_ui()
	var background = ColorRect.new()
	background.color = Color(0.035,0.065,0.07,0.72)
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ui.add_child(background)
	var outer = CenterContainer.new()
	outer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	ui.add_child(outer)
	var panel = PanelContainer.new()
	panel.custom_minimum_size = Vector2(600,0)
	outer.add_child(panel)
	var margin = MarginContainer.new()
	margin.add_theme_constant_override("margin_left",24)
	margin.add_theme_constant_override("margin_right",24)
	margin.add_theme_constant_override("margin_top",20)
	margin.add_theme_constant_override("margin_bottom",20)
	panel.add_child(margin)
	var col = VBoxContainer.new()
	col.add_theme_constant_override("separation",12)
	margin.add_child(col)
	return col

func _label(parent: Node, text: String, size: int = 24) -> Label:
	var l = Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size",size)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	parent.add_child(l)
	return l

func _button(parent: Node, title: String, fn: Callable) -> Button:
	var b = Button.new()
	b.text = title
	b.custom_minimum_size = Vector2(190,52)
	b.add_theme_font_size_override("font_size",23)
	parent.add_child(b)
	b.pressed.connect(fn)
	return b

func _show_menu() -> void:
	screen = "menu"
	var col = _panel()
	_label(col,"FUTURE CODE  |  TEA SHOP RUSH",34)
	_label(col,"Cooperative Myanmar Tea Shop • 2–5 Players",21)
	_label(col,"Career: Level %d / 20     Coins: %d" % [int(save["unlocked"]),int(save["coins"])],20)
	name_edit = LineEdit.new()
	name_edit.text = local_name
	name_edit.placeholder_text = "Player name"
	name_edit.custom_minimum_size.y = 48
	col.add_child(name_edit)
	_button(col,"HOST LAN GAME",func(): _host())
	ip_edit = LineEdit.new()
	ip_edit.text = join_address
	ip_edit.placeholder_text = "Host IPv4 e.g. 192.168.1.2"
	ip_edit.custom_minimum_size.y = 46
	col.add_child(ip_edit)
	_button(col,"JOIN LAN GAME",func(): _join())
	_button(col,"HOW TO PLAY",func(): _tutorial())
	_button(col,"SETTINGS",func(): _settings())

func _tutorial() -> void:
	var col = _panel()
	_label(col,"HOW TO PLAY",34)
	_label(col,"Work together: STOCK -> BREW -> COOK -> SERVE -> CASH.\nCLEAN the sink when dirty cups block serving.\nMove with WASD / arrows or touch arrows. Press E / ACTION near a station.\nRoles give a station bonus; every role can help anywhere.\nHost starts a shift after 2–5 players join.\nFinish all orders before time or customer mood runs out.",22)
	_button(col,"BACK",func(): _show_menu())

func _settings() -> void:
	var col = _panel()
	_label(col,"SETTINGS",34)
	_button(col,"SOUND: "+("ON" if bool(save["sound"]) else "OFF"),func(): _toggle_sound())
	_button(col,"BACK",func(): _show_menu())

func _toggle_sound() -> void:
	save["sound"] = not bool(save["sound"])
	_write_save()
	_settings()

func _host() -> void:
	local_name = name_edit.text.strip_edges().substr(0,18)
	if local_name.is_empty():
		local_name = "Host"
	var peer = ENetMultiplayerPeer.new()
	var err = peer.create_server(PORT,MAX_PLAYERS-1)
	if err != OK:
		_alert("Cannot host on UDP "+str(PORT)+" (error "+str(err)+")")
		return
	multiplayer.multiplayer_peer = peer
	hosting = true
	online = true
	players.clear()
	players[1] = {"name":local_name,"role":local_role,"pos":Vector3(0,0,7)}
	inputs[1] = Vector2.ZERO
	_show_lobby()

func _join() -> void:
	local_name = name_edit.text.strip_edges().substr(0,18)
	if local_name.is_empty():
		local_name = "Guest"
	join_address = ip_edit.text.strip_edges()
	var peer = ENetMultiplayerPeer.new()
	var err = peer.create_client(join_address,PORT)
	if err != OK:
		_alert("Cannot connect: "+str(err))
		return
	multiplayer.multiplayer_peer = peer
	hosting = false
	online = true
	_show_lobby()

func _connected() -> void:
	request_role.rpc_id(1,local_role,local_name)

func _connection_failed() -> void:
	_shutdown()
	_alert("LAN connection failed. Check same Wi-Fi, IP, and UDP port.")

func _server_disconnected() -> void:
	_shutdown()
	_alert("Host disconnected. Your local career save remains intact.")

func _shutdown() -> void:
	multiplayer.multiplayer_peer = OfflineMultiplayerPeer.new()
	players.clear()
	inputs.clear()
	online = false
	hosting = false
	state.clear()
	_remove_avatars()

func _peer_joined(id: int) -> void:
	if not hosting:
		return
	if players.size() >= MAX_PLAYERS:
		multiplayer.multiplayer_peer.disconnect_peer(id)
		return
	players[id] = {"name":"Player "+str(id),"role":1,"pos":Vector3(0,0,7)}
	inputs[id] = Vector2.ZERO
	_broadcast()

func _peer_left(id: int) -> void:
	if not hosting:
		return
	if players.has(id):
		var info: Dictionary = players[id]
		departed[str(info.get("name",""))] = {"role":info.get("role",1),"time":Time.get_ticks_msec()}
		players.erase(id)
	inputs.erase(id)
	last_actions.erase(id)
	_broadcast()

@rpc("any_peer","reliable")
func request_role(role: int, new_name: String) -> void:
	if not hosting:
		return
	var id = multiplayer.get_remote_sender_id()
	if not players.has(id):
		return
	var n = new_name.strip_edges().substr(0,18)
	if n.is_empty():
		n = "Player "+str(id)
	var role_id = clampi(role,0,4)
	if departed.has(n):
		var old: Dictionary = departed[n]
		if Time.get_ticks_msec()-int(old.get("time",0)) < 30000:
			role_id = clampi(int(old.get("role",role_id)),0,4)
		departed.erase(n)
	players[id]["name"] = n
	players[id]["role"] = role_id
	_broadcast()

func _show_lobby() -> void:
	screen = "lobby"
	var col = _panel()
	_label(col,"LAN TEAM LOBBY",34)
	_label(col,"UDP 24582 • Same Wi-Fi • 2–5 players",20)
	if hosting:
		_label(col,"Host IP: "+_local_ip(),22)
	else:
		_label(col,"Connecting to "+join_address,22)
	role_select = OptionButton.new()
	for r in ROLES:
		role_select.add_item(r)
	role_select.select(local_role)
	role_select.custom_minimum_size.y = 50
	col.add_child(role_select)
	role_select.item_selected.connect(func(i: int): _change_role(i))
	lobby_label = _label(col,"Waiting for team...",22)
	if hosting:
		_button(col,"START SHIFT",func(): _start_shift())
		_button(col,"LEVEL -",func(): _change_level(-1))
		_button(col,"LEVEL +",func(): _change_level(1))
	_button(col,"LEAVE",func(): _shutdown(); _show_menu())
	_update_lobby()

func _change_role(role: int) -> void:
	local_role = clampi(role,0,4)
	if hosting and players.has(1):
		players[1]["role"] = local_role
		_broadcast()
	elif online and multiplayer.multiplayer_peer.get_connection_status() == MultiplayerPeer.CONNECTION_CONNECTED:
		request_role.rpc_id(1,local_role,local_name)

func _change_level(amount: int) -> void:
	selected_level = clampi(selected_level+amount,1,int(save.get("unlocked",1)))
	_update_lobby()

func _local_ip() -> String:
	for ip in IP.get_local_addresses():
		if ip.contains(".") and not ip.begins_with("127.") and not ip.begins_with("169.254."):
			return ip
	return "Check device Wi-Fi IP"

func _update_lobby() -> void:
	if not is_instance_valid(lobby_label):
		return
	var line = "Level %d / %d unlocked\n" % [selected_level,int(save.get("unlocked",1))]
	for id in players:
		var p: Dictionary = players[id]
		line += "%s  •  %s\n" % [str(p.get("name","Player")),ROLES[clampi(int(p.get("role",1)),0,4)]]
	if hosting and players.size() < 2:
		line += "Need at least 2 players to start."
	lobby_label.text = line

func _start_shift() -> void:
	if not hosting or players.size() < 2:
		_alert("2–5 players required. Ask a friend to join over Wi-Fi.")
		return
	var level = selected_level
	var target = 3 + int(floor(float(level-1)*0.55))
	state = {
		"phase":"playing", "level":level, "target":target, "done":0,
		"time":190.0+float(level)*7.0, "mood":100.0,
		"tea_stock":8, "snack_stock":8, "dirty":0,
		"orders":[], "earned":0, "next_id":1, "event":""
	}
	for id in players:
		players[id]["pos"] = Vector3(float((int(id)%5)-2)*1.1,0,7)
		inputs[id] = Vector2.ZERO
	for i in range(mini(1+int(level/6),3)):
		_add_order()
	_broadcast()
	_show_hud()

func _add_order() -> void:
	var orders: Array = state["orders"]
	if int(state["done"])+orders.size() >= int(state["target"]):
		return
	var order_id = int(state["next_id"])
	state["next_id"] = order_id+1
	orders.append({"id":order_id,"tea":TEAS[(order_id+int(state["level"]))%TEAS.size()],"snack":SNACKS[(order_id*3+int(state["level"]))%SNACKS.size()],"step":0,"age":0.0})
	state["orders"] = orders

func _physics_process(delta: float) -> void:
	if not online or str(state.get("phase","")) != "playing":
		return
	var v = _input_vector()
	if hosting:
		inputs[1] = v
		for id in players:
			var direction: Vector2 = inputs.get(id,Vector2.ZERO)
			var p: Vector3 = players[id]["pos"]
			var next = p+Vector3(direction.x,0,direction.y)*MOVE_SPEED*delta
			next.x = clampf(next.x,-12.6,12.6)
			next.z = clampf(next.z,-8.6,8.6)
			players[id]["pos"] = next
		_tick_game(delta)
		snapshot_timer += delta
		if snapshot_timer >= 0.12:
			snapshot_timer = 0
			_broadcast()
	else:
		move_timer += delta
		if move_timer >= 0.065 and multiplayer.multiplayer_peer.get_connection_status() == MultiplayerPeer.CONNECTION_CONNECTED:
			move_timer = 0
			submit_move.rpc_id(1,v)

func _input_vector() -> Vector2:
	var x = Input.get_action_strength("right")-Input.get_action_strength("left")
	var y = Input.get_action_strength("down")-Input.get_action_strength("up")
	var v = Vector2(x,y)+touch_dir
	if v.length()>1.0:
		v = v.normalized()
	return v

@rpc("any_peer","unreliable")
func submit_move(v: Vector2) -> void:
	if not hosting:
		return
	var id = multiplayer.get_remote_sender_id()
	if players.has(id):
		inputs[id] = v.limit_length(1.0)

func _tick_game(delta: float) -> void:
	state["time"] = maxf(0.0,float(state["time"])-delta)
	var orders: Array = state["orders"]
	for i in range(orders.size()):
		var o: Dictionary = orders[i]
		o["age"] = float(o["age"])+delta
		if float(o["age"])>float(maxi(24,46-int(state["level"]))):
			state["mood"] = maxf(0.0,float(state["mood"])-8.0)
			o["age"] = 0.0
		orders[i] = o
	state["orders"] = orders
	if float(state["time"]) <= 0.0 or float(state["mood"]) <= 0.0:
		_finish(false)

func _action() -> void:
	if str(state.get("phase","")) != "playing":
		return
	if not players.has(multiplayer.get_unique_id()):
		return
	var p: Vector3 = players[multiplayer.get_unique_id()]["pos"]
	var nearest = ""
	var dist = 3.25
	for s in STATIONS:
		var d = p.distance_to(STATIONS[s])
		if d < dist:
			nearest = s
			dist = d
	if nearest.is_empty():
		_toast("Move near a glowing station")
		return
	if hosting:
		_apply_action(1,nearest)
	else:
		request_action.rpc_id(1,nearest)

@rpc("any_peer","reliable")
func request_action(station: String) -> void:
	if hosting:
		_apply_action(multiplayer.get_remote_sender_id(),station)

func _apply_action(id: int, station: String) -> void:
	if not hosting or str(state.get("phase","")) != "playing":
		return
	if not players.has(id) or not STATIONS.has(station):
		return
	var p: Vector3 = players[id]["pos"]
	if p.distance_to(STATIONS[station]) > 3.45:
		return
	var now = Time.get_ticks_msec()
	if now-int(last_actions.get(id,0)) < 420:
		return
	last_actions[id] = now
	var role = int(players[id].get("role",1))
	var orders: Array = state["orders"]
	var changed = false
	if station == "stock":
		state["tea_stock"] = mini(15,int(state["tea_stock"])+5)
		state["snack_stock"] = mini(15,int(state["snack_stock"])+5)
		state["event"] = "Stock Keeper restocked tea and snacks"
		changed = true
	elif station == "clean":
		state["dirty"] = maxi(0,int(state["dirty"])-(4 if role==4 else 2))
		state["event"] = "Clean cups ready"
		changed = true
	else:
		var wanted = {"brew":0,"cook":1,"serve":2,"cash":3}
		if wanted.has(station):
			for i in range(orders.size()):
				var o: Dictionary = orders[i]
				if int(o["step"]) != int(wanted[station]):
					continue
				if station == "brew" and int(state["tea_stock"]) <= 0:
					state["event"] = "Tea empty! Restock first"
					break
				if station == "cook" and int(state["snack_stock"]) <= 0:
					state["event"] = "Snacks empty! Restock first"
					break
				if station == "serve" and int(state["dirty"]) >= 5:
					state["event"] = "Dirty cups! Clean sink first"
					break
				if station == "brew":
					state["tea_stock"] = int(state["tea_stock"])-1
				if station == "cook":
					state["snack_stock"] = int(state["snack_stock"])-1
				if station == "cash":
					state["done"] = int(state["done"])+1
					state["dirty"] = int(state["dirty"])+1
					var reward = 80+int(state["level"])*8+(20 if role==0 else 0)
					state["earned"] = int(state["earned"])+reward
					orders.remove_at(i)
					changed = true
					state["event"] = "Order complete! +%d coins" % reward
				else:
					o["step"] = int(o["step"])+1
					o["age"] = maxf(0.0,float(o["age"])-6.0 if role==int(wanted[station])+1 else float(o["age"]))
					orders[i] = o
					changed = true
					state["event"] = station.to_upper()+" completed"
				break
	state["orders"] = orders
	if changed:
		if int(state["done"])>=int(state["target"]):
			_finish(true)
			return
		var desired = mini(1+int(int(state["level"])/6),3)
		while state["orders"].size() < desired and int(state["done"])+state["orders"].size()<int(state["target"]):
			_add_order()
		_broadcast()
		_beep(760,0.09)
	else:
		_broadcast()

func _finish(won: bool) -> void:
	if str(state.get("phase","")) != "playing":
		return
	state["phase"] = "won" if won else "lost"
	if won:
		save["coins"] = int(save["coins"])+int(state["earned"])
		save["wins"] = int(save["wins"])+1
		save["unlocked"] = maxi(int(save["unlocked"]),mini(20,int(state["level"])+1))
		_write_save()
	_broadcast()
	_show_results()

func _broadcast() -> void:
	if not hosting:
		return
	if online:
		receive_snapshot.rpc(state,players)
	_apply_snapshot(state,players)

@rpc("authority","unreliable")
func receive_snapshot(new_state: Dictionary, new_players: Dictionary) -> void:
	if hosting:
		return
	_apply_snapshot(new_state,new_players)

func _apply_snapshot(new_state: Dictionary, new_players: Dictionary) -> void:
	var old_phase = str(state.get("phase",""))
	state = new_state.duplicate(true)
	players = new_players.duplicate(true)
	_refresh_avatars()
	if screen == "lobby":
		_update_lobby()
	if str(state.get("phase","")) == "playing" and old_phase != "playing":
		_show_hud()
	if str(state.get("phase","")) in ["won","lost"] and old_phase == "playing":
		if str(state["phase"])=="won" and not hosting:
			save["unlocked"] = maxi(int(save["unlocked"]),mini(20,int(state["level"])+1))
			save["coins"] = int(save["coins"])+int(state["earned"])
			_write_save()
		_show_results()

func _refresh_avatars() -> void:
	for id in player_meshes.keys():
		if not players.has(id):
			player_meshes[id].queue_free()
			player_meshes.erase(id)
	for id in players:
		var p: Dictionary = players[id]
		var role = clampi(int(p.get("role",1)),0,4)
		if not player_meshes.has(id):
			player_meshes[id] = _avatar(int(id),role)
		var node: Node3D = player_meshes[id]
		node.position = p.get("pos",Vector3.ZERO)
		var body: MeshInstance3D = node.get_child(0)
		body.material_override = _material(COLORS[role])
		var tag: Label3D = node.get_child(2)
		tag.text = str(p.get("name","Player"))

func _remove_avatars() -> void:
	for id in player_meshes:
		player_meshes[id].queue_free()
	player_meshes.clear()

func _show_hud() -> void:
	screen = "hud"
	_clear_ui()
	var top = PanelContainer.new()
	top.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	top.offset_bottom = 116
	ui.add_child(top)
	var row = HBoxContainer.new()
	row.add_theme_constant_override("separation",16)
	top.add_child(row)
	hud_label = _label(row,"Loading shift...",23)
	hud_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	order_label = _label(row,"Orders...",20)
	order_label.custom_minimum_size.x = 350
	var bottom = HBoxContainer.new()
	bottom.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	bottom.offset_top = -154
	bottom.offset_left = 22
	bottom.offset_right = -22
	ui.add_child(bottom)
	var dpad = GridContainer.new()
	dpad.columns = 3
	bottom.add_child(dpad)
	for d in [Vector2.ZERO,Vector2(0,-1),Vector2.ZERO,Vector2(-1,0),Vector2.ZERO,Vector2(1,0),Vector2.ZERO,Vector2(0,1),Vector2.ZERO]:
		if d == Vector2.ZERO:
			var blank = Control.new()
			blank.custom_minimum_size = Vector2(70,58)
			dpad.add_child(blank)
		else:
			var b = Button.new()
			b.text = "▲" if d.y < 0 else ("▼" if d.y > 0 else ("◀" if d.x < 0 else "▶"))
			b.custom_minimum_size = Vector2(70,58)
			b.add_theme_font_size_override("font_size",28)
			dpad.add_child(b)
			b.button_down.connect(func(): touch_dir = d)
			b.button_up.connect(func(): touch_dir = Vector2.ZERO)
	var space = Control.new()
	space.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bottom.add_child(space)
	var actions = VBoxContainer.new()
	bottom.add_child(actions)
	_button(actions,"ACTION / E",func(): _action())
	_button(actions,"HELP",func(): _toast_help())
	toast_label = _label(actions,"",18)
	_update_hud()

func _toast_help() -> void:
	_toast("STOCK > BREW > COOK > SERVE > CASH • CLEAN when cups are dirty")

func _update_hud() -> void:
	if not is_instance_valid(hud_label) or str(state.get("phase",""))!="playing":
		return
	hud_label.text = "LEVEL %d   %d/%d ORDERS   %ds   MOOD %d%%\nTea %d   Snacks %d   Dirty %d   Earned %d" % [int(state["level"]),int(state["done"]),int(state["target"]),int(state["time"]),int(state["mood"]),int(state["tea_stock"]),int(state["snack_stock"]),int(state["dirty"]),int(state["earned"])]
	var lines = ""
	for o in state["orders"]:
		var step = ["BREW","COOK","SERVE","CASH"][clampi(int(o["step"]),0,3)]
		lines += "#%d %s + %s → %s\n" % [int(o["id"]),str(o["tea"]),str(o["snack"]),step]
	order_label.text = lines+"\n"+str(state.get("event",""))
	if is_instance_valid(toast_label):
		toast_label.text = toast

func _show_results() -> void:
	screen = "results"
	var col = _panel()
	var won = str(state.get("phase",""))=="won"
	_label(col,"SHIFT COMPLETE!" if won else "SHIFT FAILED",36)
	_label(col,"Level %d   Orders %d/%d   Coins earned %d" % [int(state.get("level",1)),int(state.get("done",0)),int(state.get("target",0)),int(state.get("earned",0))],23)
	_label(col,"Teamwork wins! Career progress saved." if won else "Time or customer mood ran out. Try again.",20)
	if hosting:
		_button(col,"BACK TO LOBBY",func(): state["phase"]="lobby"; _broadcast(); _show_lobby())
	_button(col,"LEAVE GAME",func(): _shutdown(); _show_menu())

func _toast(message: String) -> void:
	toast = message
	toast_timer = 3.5
	if is_instance_valid(toast_label):
		toast_label.text = message

func _alert(message: String) -> void:
	_show_menu()
	var popup = AcceptDialog.new()
	popup.dialog_text = message
	ui.add_child(popup)
	popup.popup_centered()

func _process(delta: float) -> void:
	if Input.is_action_just_pressed("interact") and screen=="hud":
		_action()
	if screen=="lobby":
		hud_timer += delta
		if hud_timer>0.5:
			hud_timer = 0
			_update_lobby()
	if screen=="hud":
		hud_timer += delta
		if hud_timer>0.16:
			hud_timer = 0
			_update_hud()
	if toast_timer>0:
		toast_timer -= delta
		if toast_timer<=0:
			toast = ""
