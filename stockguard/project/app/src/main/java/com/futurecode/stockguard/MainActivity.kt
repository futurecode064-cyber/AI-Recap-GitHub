package com.futurecode.stockguard

import android.Manifest
import android.app.AlertDialog
import android.content.Intent
import android.content.pm.PackageManager
import android.database.sqlite.SQLiteConstraintException
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.view.Gravity
import android.view.View
import android.widget.*
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import java.text.DateFormat
import java.text.NumberFormat
import java.util.Date
import java.util.Locale

class MainActivity : ComponentActivity() {
    private lateinit var db: DatabaseHelper
    private lateinit var contentBox: FrameLayout
    private val cart = linkedMapOf<Long, Int>()
    private var pendingBarcodeTarget: EditText? = null

    private val notificationPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            if (!granted) toast("Notification ပိတ်ထားပါတယ်။ Update/Stock alert မပေါ်နိုင်ပါ")
        }

    private val scanLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val code = result.data?.getStringExtra("BARCODE")?.trim().orEmpty()
        if (result.resultCode != RESULT_OK || code.isBlank()) return@registerForActivityResult
        val target = pendingBarcodeTarget
        if (target != null) {
            target.setText(code)
            pendingBarcodeTarget = null
            return@registerForActivityResult
        }
        val product = db.productByBarcode(code)
        if (product == null) toast("ဒီ Barcode နဲ့ ကုန်ပစ္စည်း မတွေ့ပါ")
        else {
            addToCart(product.id)
            showSale()
        }
    }

    private val csvLauncher = registerForActivityResult(
        ActivityResultContracts.CreateDocument("text/csv")
    ) { uri ->
        if (uri != null) runCatching {
            contentResolver.openOutputStream(uri)?.use { it.write(db.salesCsv().toByteArray(Charsets.UTF_8)) }
        }.onSuccess { toast("CSV Export ပြီးပါပြီ") }
            .onFailure { toast("CSV Export မအောင်မြင်ပါ: ${it.message}") }
    }

    private val backupLauncher = registerForActivityResult(
        ActivityResultContracts.CreateDocument("application/json")
    ) { uri ->
        if (uri != null) runCatching {
            contentResolver.openOutputStream(uri)?.use { it.write(db.backupJson().toByteArray(Charsets.UTF_8)) }
        }.onSuccess { toast("Full Backup သိမ်းပြီးပါပြီ") }
            .onFailure { toast("Backup မအောင်မြင်ပါ: ${it.message}") }
    }

    private val restoreLauncher = registerForActivityResult(
        ActivityResultContracts.OpenDocument()
    ) { uri ->
        if (uri != null) runCatching {
            val raw = contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
                ?: error("Cannot read file")
            db.restoreJson(raw)
            cart.clear()
        }.onSuccess {
            toast("Restore ပြီးပါပြီ")
            showDashboard()
        }.onFailure { toast("Restore မအောင်မြင်ပါ: ${it.message}") }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        db = DatabaseHelper(this)
        NotificationHelper.createChannels(this)
        requestNotificationPermissionIfNeeded()
        SyncWorker.schedule(this)
        SyncWorker.runNow(this)
        setContentView(buildRoot())
        if (intent.getBooleanExtra("OPEN_UPDATE", false)) showUpdateCenter() else showDashboard()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        if (intent.getBooleanExtra("OPEN_UPDATE", false)) showUpdateCenter()
    }

    override fun onDestroy() {
        db.close()
        super.onDestroy()
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
    }

    private fun buildRoot(): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.rgb(241, 245, 249))
        }

        root.addView(LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(16), dp(14), dp(16), dp(14))
            setBackgroundColor(Color.rgb(7, 25, 48))
            addView(ImageView(this@MainActivity).apply {
                setImageResource(R.drawable.ic_stockguard)
                scaleType = ImageView.ScaleType.CENTER_CROP
            }, LinearLayout.LayoutParams(dp(58), dp(58)).apply { marginEnd = dp(12) })
            addView(LinearLayout(this@MainActivity).apply {
                orientation = LinearLayout.VERTICAL
                addView(tv("Future Code StockGuard", 24, true, Color.WHITE))
                addView(tv("Professional Inventory & Sales · v${BuildConfig.VERSION_NAME}", 12, false, Color.rgb(186, 230, 253)))
            }, LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f))
        })

        val navScroll = HorizontalScrollView(this).apply {
            isHorizontalScrollBarEnabled = false
            setBackgroundColor(Color.rgb(226, 232, 240))
        }
        val nav = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(dp(6), dp(6), dp(6), dp(6))
        }
        nav.addView(navButton("Dashboard") { showDashboard() })
        nav.addView(navButton("ကုန်ပစ္စည်း") { showProducts() })
        nav.addView(navButton("အရောင်း") { showSale() })
        nav.addView(navButton("History") { showHistory() })
        nav.addView(navButton("Backup") { showBackup() })
        nav.addView(navButton("Update & Noti") { showUpdateCenter() })
        navScroll.addView(nav)
        root.addView(navScroll)

        contentBox = FrameLayout(this)
        root.addView(contentBox, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f
        ))
        return root
    }

    private fun showDashboard() {
        val stats = db.dashboardToday()
        val body = page()
        body.addView(title("ယနေ့ Dashboard"))
        body.addView(statPanel("ယနေ့ ရောင်းရငွေ", money(stats.revenue), "#0F766E"))
        body.addView(statPanel("ယနေ့ အကြမ်းအမြတ်", money(stats.profit), "#2563EB"))
        body.addView(statPanel("ယနေ့ အရောင်းအကြိမ်", stats.salesCount.toString(), "#7C3AED"))
        body.addView(statPanel("လက်ရှိ Stock တန်ဖိုး (ဝယ်ဈေး)", money(db.inventoryCostValue()), "#0369A1"))
        body.addView(statPanel("Stock နည်းနေသော ပစ္စည်း", stats.lowStockCount.toString(), "#B45309"))

        body.addView(sectionTitle("Low Stock"))
        val low = db.lowStockProducts()
        if (low.isEmpty()) body.addView(note("Low-stock သတိပေးချက် မရှိသေးပါ"))
        else low.forEach { p ->
            body.addView(rowPanel(
                p.name,
                "လက်ကျန် ${p.stock} · သတိပေးအဆင့် ${p.lowStock}" +
                    if (p.barcode.isNotBlank()) "\nBarcode: ${p.barcode}" else ""
            ))
        }
        setPage(body)
    }

    private fun showProducts() {
        val body = page()
        body.addView(title("ကုန်ပစ္စည်း စီမံခန့်ခွဲမှု"))
        body.addView(primaryButton("+ ကုန်ပစ္စည်း အသစ်ထည့်") { productDialog(null) })

        val search = field("အမည် / Barcode / Category ရှာရန်", false, "")
        body.addView(search)
        val resultBox = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        body.addView(resultBox)

        fun render(query: String) {
            resultBox.removeAllViews()
            val products = db.searchProducts(query)
            if (products.isEmpty()) {
                resultBox.addView(note("ကုန်ပစ္စည်း မတွေ့ပါ"))
                return
            }
            products.forEach { p ->
                val panel = rowPanel(
                    p.name,
                    listOfNotNull(
                        p.category.takeIf { it.isNotBlank() },
                        "Stock: ${p.stock}",
                        "ဝယ်ဈေး: ${money(p.buyPrice)}",
                        "ရောင်းဈေး: ${money(p.sellPrice)}",
                        p.barcode.takeIf { it.isNotBlank() }?.let { "Barcode: $it" }
                    ).joinToString(" · ")
                ) as LinearLayout
                val actions = LinearLayout(this).apply {
                    orientation = LinearLayout.HORIZONTAL
                    addView(smallButton("ပြင်") { productDialog(p) })
                    addView(smallButton("Stock +/-") { stockAdjustDialog(p) })
                    addView(smallButton("ဖျက်") { confirmDelete(p) })
                }
                panel.addView(actions)
                resultBox.addView(panel)
            }
        }

        search.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) = Unit
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) = render(s?.toString().orEmpty())
            override fun afterTextChanged(s: Editable?) = Unit
        })
        render("")
        setPage(body)
    }

    private fun confirmDelete(p: Product) {
        AlertDialog.Builder(this)
            .setTitle("ကုန်ပစ္စည်းဖျက်မလား?")
            .setMessage(p.name)
            .setNegativeButton("မဖျက်ပါ", null)
            .setPositiveButton("ဖျက်မယ်") { _, _ ->
                if (db.deleteProduct(p.id)) {
                    cart.remove(p.id)
                    showProducts()
                }
            }.show()
    }

    private fun stockAdjustDialog(p: Product) {
        val wrap = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(18), dp(8), dp(18), dp(8))
        }
        wrap.addView(note("လက်ရှိ Stock: ${p.stock}"))
        val delta = field("ပေါင်းရန် +10 / နုတ်ရန် -3", false, "")
        delta.inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_SIGNED
        val noteText = field("မှတ်ချက် (ဥပမာ: New stock / Damaged)", false, "")
        wrap.addView(delta)
        wrap.addView(noteText)
        val dialog = AlertDialog.Builder(this)
            .setTitle("Stock In / Out — ${p.name}")
            .setView(wrap)
            .setNegativeButton("ပယ်ဖျက်", null)
            .setPositiveButton("သိမ်းမယ်", null)
            .create()
        dialog.setOnShowListener {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                val d = delta.text.toString().trim().toIntOrNull()
                if (d == null || d == 0 || p.stock + d < 0) {
                    toast("Stock ပမာဏ မမှန်ပါ")
                    return@setOnClickListener
                }
                if (db.adjustStock(p.id, d, noteText.text.toString())) {
                    dialog.dismiss()
                    NotificationHelper.postLowStock(this, db.lowStockProducts())
                    showProducts()
                } else toast("Stock ပြင်မရပါ")
            }
        }
        dialog.show()
    }

    private fun productDialog(existing: Product?) {
        val wrap = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(18), dp(8), dp(18), dp(8))
        }
        val name = field("ကုန်ပစ္စည်းအမည်", false, existing?.name.orEmpty())
        val category = field("Category", false, existing?.category.orEmpty())
        val barcode = field("Barcode (မရှိရင် ချန်ထားနိုင်)", false, existing?.barcode.orEmpty())
        val buy = field("ဝယ်ဈေး (ကျပ်)", true, existing?.buyPrice?.toString().orEmpty())
        val sell = field("ရောင်းဈေး (ကျပ်)", true, existing?.sellPrice?.toString().orEmpty())
        val stock = field("လက်ကျန်အရေအတွက်", true, existing?.stock?.toString() ?: "0")
        val low = field("Low-stock သတိပေးအဆင့်", true, existing?.lowStock?.toString() ?: "5")
        listOf(name, category, barcode).forEach { wrap.addView(it) }
        wrap.addView(secondaryButton("📷 Barcode Scan") {
            pendingBarcodeTarget = barcode
            scanLauncher.launch(Intent(this, BarcodeScannerActivity::class.java))
        })
        listOf(buy, sell, stock, low).forEach { wrap.addView(it) }

        val dialog = AlertDialog.Builder(this)
            .setTitle(if (existing == null) "ကုန်ပစ္စည်း အသစ်" else "ကုန်ပစ္စည်း ပြင်ရန်")
            .setView(ScrollView(this).apply { addView(wrap) })
            .setNegativeButton("ပယ်ဖျက်", null)
            .setPositiveButton("သိမ်းမယ်", null)
            .create()

        dialog.setOnDismissListener { if (pendingBarcodeTarget === barcode) pendingBarcodeTarget = null }
        dialog.setOnShowListener {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                val n = name.text.toString().trim()
                val b = buy.text.toString().trim().toLongOrNull()
                val s = sell.text.toString().trim().toLongOrNull()
                val q = stock.text.toString().trim().toIntOrNull()
                val l = low.text.toString().trim().toIntOrNull()
                if (n.isBlank() || b == null || s == null || q == null || l == null ||
                    b < 0 || s < 0 || q < 0 || l < 0
                ) {
                    toast("အချက်အလက်တွေကို မှန်ကန်စွာ ဖြည့်ပါ")
                    return@setOnClickListener
                }
                runCatching {
                    if (existing == null) db.insertProduct(
                        n, barcode.text.toString(), category.text.toString(), b, s, q, l
                    ) else db.updateProduct(
                        existing.id, n, barcode.text.toString(), category.text.toString(), b, s, q, l
                    )
                }.onSuccess {
                    dialog.dismiss()
                    NotificationHelper.postLowStock(this, db.lowStockProducts())
                    showProducts()
                }.onFailure { e ->
                    if (e is SQLiteConstraintException) toast("Barcode တူပြီးသားရှိနေပါတယ်")
                    else toast("မသိမ်းနိုင်ပါ: ${e.message}")
                }
            }
        }
        dialog.show()
    }

    private fun showSale() {
        val body = page()
        body.addView(title("အရောင်းအသစ်"))
        val products = db.allProducts()
        if (products.isEmpty()) {
            body.addView(note("အရင်ဆုံး ကုန်ပစ္စည်း ထည့်ပါ"))
            setPage(body)
            return
        }

        body.addView(primaryButton("📷 Barcode Scan နဲ့ ထည့်") {
            pendingBarcodeTarget = null
            scanLauncher.launch(Intent(this, BarcodeScannerActivity::class.java))
        })
        val spinner = Spinner(this).apply {
            adapter = ArrayAdapter(
                this@MainActivity,
                android.R.layout.simple_spinner_dropdown_item,
                products.map { "${it.name} | Stock ${it.stock} | ${money(it.sellPrice)}" }
            )
            setBackgroundColor(Color.WHITE)
        }
        body.addView(spinner, spaced())
        body.addView(secondaryButton("+ ရွေးထားသောပစ္စည်း ၁ ခုထည့်") {
            val index = spinner.selectedItemPosition
            if (index in products.indices) {
                addToCart(products[index].id)
                showSale()
            }
        })

        body.addView(sectionTitle("Cart"))
        if (cart.isEmpty()) body.addView(note("Cart ထဲမှာ ပစ္စည်းမရှိသေးပါ"))
        else {
            var total = 0L
            cart.toMap().forEach { (id, qty) ->
                val p = db.productById(id)
                if (p == null) cart.remove(id)
                else {
                    total += p.sellPrice * qty
                    val panel = rowPanel(
                        p.name,
                        "Qty: $qty · ${money(p.sellPrice)} / ခု · စုစုပေါင်း ${money(p.sellPrice * qty)}"
                    ) as LinearLayout
                    panel.addView(LinearLayout(this).apply {
                        orientation = LinearLayout.HORIZONTAL
                        addView(smallButton("−") {
                            val now = (cart[id] ?: 1) - 1
                            if (now <= 0) cart.remove(id) else cart[id] = now
                            showSale()
                        })
                        addView(smallButton("+") { addToCart(id); showSale() })
                        addView(smallButton("ဖယ်") { cart.remove(id); showSale() })
                    })
                    body.addView(panel)
                }
            }
            body.addView(statPanel("ကျသင့်ငွေ", money(total), "#0F766E"))
            body.addView(primaryButton("အရောင်း အတည်ပြုမယ်") {
                val result = db.checkout(cart.toMap())
                if (result.ok) {
                    cart.clear()
                    NotificationHelper.postLowStock(this, db.lowStockProducts())
                    toast("အရောင်း #${result.saleId} သိမ်းပြီး Stock နုတ်ပြီးပါပြီ")
                    showSale()
                } else {
                    toast(result.message)
                    showSale()
                }
            })
            body.addView(secondaryButton("Cart ရှင်းမယ်") { cart.clear(); showSale() })
        }
        setPage(body)
    }

    private fun addToCart(productId: Long) {
        val p = db.productById(productId) ?: return
        val current = cart[productId] ?: 0
        if (current >= p.stock) toast("${p.name}: Stock ${p.stock} ပဲရှိပါတယ်")
        else cart[productId] = current + 1
    }

    private fun showHistory() {
        val body = page()
        body.addView(title("Sales & Stock History"))
        body.addView(sectionTitle("နောက်ဆုံး အရောင်းများ"))
        val sales = db.recentSales(40)
        if (sales.isEmpty()) body.addView(note("အရောင်းမှတ်တမ်း မရှိသေးပါ"))
        sales.forEach { s ->
            val p = rowPanel(
                "Sale #${s.id} · ${date(s.createdAt)}",
                "ရောင်းရငွေ ${money(s.revenue)} · အကြမ်းအမြတ် ${money(s.revenue - s.cost)}"
            )
            p.setOnClickListener {
                AlertDialog.Builder(this)
                    .setTitle("Sale #${s.id}")
                    .setMessage(db.saleItemsText(s.id))
                    .setPositiveButton("OK", null)
                    .show()
            }
            body.addView(p)
        }

        body.addView(sectionTitle("Stock Movement"))
        val moves = db.recentMovements(60)
        if (moves.isEmpty()) body.addView(note("Stock movement မရှိသေးပါ"))
        moves.forEach { m ->
            body.addView(rowPanel(
                m.productName,
                "${if (m.delta > 0) "+" else ""}${m.delta} · ${m.note} · ${date(m.createdAt)}"
            ))
        }
        setPage(body)
    }

    private fun showBackup() {
        val body = page()
        body.addView(title("Backup & Reports"))
        body.addView(note("Sales, Products နဲ့ Stock Movement အားလုံးကို Backup ထဲ သိမ်းပါတယ်။"))
        body.addView(primaryButton("Sales CSV Export") { csvLauncher.launch("StockGuard-Sales.csv") })
        body.addView(primaryButton("Full JSON Backup") { backupLauncher.launch("StockGuard-Backup-v2.json") })
        body.addView(secondaryButton("JSON Backup Restore") {
            AlertDialog.Builder(this)
                .setTitle("Restore လုပ်မလား?")
                .setMessage("လက်ရှိ StockGuard Data ကို Backup ဖိုင်ထဲက Data နဲ့ အစားထိုးမှာဖြစ်ပါတယ်။")
                .setNegativeButton("မလုပ်ပါ", null)
                .setPositiveButton("Backup ရွေးမယ်") { _, _ ->
                    restoreLauncher.launch(arrayOf("application/json", "text/plain"))
                }.show()
        })
        body.addView(sectionTitle("Data Safety"))
        body.addView(note("Update မတင်ခင် Full Backup ထုတ်ထားနိုင်ပါတယ်။ v1.0 Backup ကိုလည်း v1.1 က Restore လုပ်နိုင်ပါတယ်။"))
        setPage(body)
    }

    private fun showUpdateCenter() {
        val body = page()
        body.addView(title("Update & Notifications"))
        body.addView(rowPanel(
            "Current Version",
            "v${BuildConfig.VERSION_NAME} · versionCode ${BuildConfig.VERSION_CODE}"
        ))

        val prefs = getSharedPreferences("stockguard_sync", MODE_PRIVATE)
        val auto = Switch(this).apply {
            text = "Wi-Fi မှာ Update APK ကို Auto Download လုပ်ရန်"
            isChecked = prefs.getBoolean("auto_download_updates", true)
            setOnCheckedChangeListener { _, checked ->
                prefs.edit().putBoolean("auto_download_updates", checked).apply()
            }
        }
        body.addView(auto, spaced())

        val status = note("Update status စစ်ရန် အောက်ကခလုတ်ကို နှိပ်ပါ")
        body.addView(status)
        body.addView(primaryButton("Update အခုစစ်မယ်") {
            status.text = "စစ်ဆေးနေပါတယ်…"
            Thread {
                runCatching { UpdateService.checkLatest() }
                    .onSuccess { info ->
                        runOnUiThread {
                            if (info.versionCode > BuildConfig.VERSION_CODE) {
                                status.text = "Version ${info.versionName} ရပါပြီ\n${info.notes}"
                                showUpdateDialog(info)
                            } else status.text = "လက်ရှိ version က အသစ်ဆုံးဖြစ်ပါတယ်"
                        }
                    }
                    .onFailure { e -> runOnUiThread { status.text = "Update စစ်မရပါ: ${e.message}" } }
            }.start()
        })

        body.addView(sectionTitle("Notification System"))
        body.addView(note(
            "Future Code remote notices ကို background မှာ အလိုအလျောက် sync လုပ်ပါတယ်။ " +
                "Low-stock alert နဲ့ Update alert လည်း notification အဖြစ်ပေါ်ပါတယ်။"
        ))
        body.addView(secondaryButton("Background Sync အခုလုပ်မယ်") {
            SyncWorker.runNow(this)
            toast("Notification / Update sync စတင်ပြီးပါပြီ")
        })
        body.addView(secondaryButton("Notification Permission") {
            requestNotificationPermissionIfNeeded()
            if (Build.VERSION.SDK_INT < 33 ||
                ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
            ) toast("Notification permission ဖွင့်ထားပါတယ်")
        })

        body.addView(sectionTitle("Update Safety"))
        body.addView(note(
            "Update APK ကို SHA-256 စစ်ပြီးမှ Install လုပ်ခွင့်ပေးပါတယ်။ " +
                "Android လုံခြုံရေးကြောင့် silent install မလုပ်ဘဲ နောက်ဆုံး Install ကို user က အတည်ပြုရပါတယ်။"
        ))
        setPage(body)
    }

    private fun showUpdateDialog(info: ReleaseInfo) {
        AlertDialog.Builder(this)
            .setTitle("StockGuard ${info.versionName}")
            .setMessage(info.notes.ifBlank { "Update အသစ် ရပါပြီ" })
            .setNegativeButton("နောက်မှ", null)
            .setPositiveButton("Download Update") { _, _ ->
                runCatching { UpdateService.enqueueDownload(this, info) }
                    .onSuccess { toast("Update download စတင်ပါပြီ") }
                    .onFailure { toast("Download မစနိုင်ပါ: ${it.message}") }
            }.show()
    }

    private fun setPage(content: View) {
        contentBox.removeAllViews()
        contentBox.addView(ScrollView(this).apply { addView(content) })
    }

    private fun page() = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(14), dp(14), dp(14), dp(30))
    }

    private fun title(s: String) = tv(s, 22, true, Color.rgb(15, 23, 42)).apply {
        setPadding(0, dp(4), 0, dp(12))
    }

    private fun sectionTitle(s: String) = tv(s, 17, true, Color.rgb(15, 23, 42)).apply {
        setPadding(0, dp(18), 0, dp(8))
    }

    private fun statPanel(label: String, value: String, hex: String): View =
        LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(13), dp(16), dp(13))
            background = rounded(Color.parseColor(hex), 14f)
            addView(tv(label, 13, false, Color.WHITE))
            addView(tv(value, 24, true, Color.WHITE))
            layoutParams = spaced()
        }

    private fun rowPanel(name: String, detail: String): View =
        LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(14), dp(12), dp(14), dp(12))
            background = rounded(Color.WHITE, 12f)
            addView(tv(name, 17, true, Color.rgb(15, 23, 42)))
            addView(tv(detail, 13, false, Color.rgb(71, 85, 105)))
            layoutParams = spaced()
        }

    private fun note(s: String) = tv(s, 14, false, Color.rgb(71, 85, 105)).apply {
        setPadding(dp(4), dp(8), dp(4), dp(8))
    }

    private fun field(hintText: String, numeric: Boolean, initial: String): EditText =
        EditText(this).apply {
            hint = hintText
            setText(initial)
            setTextColor(Color.rgb(15, 23, 42))
            setHintTextColor(Color.rgb(100, 116, 139))
            setBackgroundColor(Color.rgb(248, 250, 252))
            setPadding(dp(12), dp(10), dp(12), dp(10))
            inputType = if (numeric) InputType.TYPE_CLASS_NUMBER else InputType.TYPE_CLASS_TEXT
            layoutParams = spaced()
        }

    private fun navButton(label: String, action: () -> Unit) = Button(this).apply {
        text = label
        isAllCaps = false
        setOnClickListener { action() }
    }

    private fun primaryButton(label: String, action: () -> Unit) = Button(this).apply {
        text = label
        isAllCaps = false
        setTextColor(Color.WHITE)
        background = rounded(Color.rgb(15, 118, 110), 10f)
        setOnClickListener { action() }
        layoutParams = spaced()
    }

    private fun secondaryButton(label: String, action: () -> Unit) = Button(this).apply {
        text = label
        isAllCaps = false
        setTextColor(Color.rgb(15, 23, 42))
        background = rounded(Color.rgb(226, 232, 240), 10f)
        setOnClickListener { action() }
        layoutParams = spaced()
    }

    private fun smallButton(label: String, action: () -> Unit) = Button(this).apply {
        text = label
        textSize = 11f
        isAllCaps = false
        setOnClickListener { action() }
        layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
    }

    private fun tv(s: String, size: Int, bold: Boolean, color: Int) = TextView(this).apply {
        text = s
        textSize = size.toFloat()
        setTextColor(color)
        gravity = Gravity.START
        if (bold) setTypeface(typeface, Typeface.BOLD)
    }

    private fun rounded(color: Int, radius: Float) = GradientDrawable().apply {
        setColor(color)
        cornerRadius = dp(radius.toInt()).toFloat()
    }

    private fun spaced() = LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT
    ).apply { bottomMargin = dp(10) }

    private fun money(value: Long): String =
        NumberFormat.getIntegerInstance(Locale.US).format(value) + " ကျပ်"

    private fun date(ms: Long): String =
        DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT).format(Date(ms))

    private fun toast(message: String) =
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()

    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()
}
