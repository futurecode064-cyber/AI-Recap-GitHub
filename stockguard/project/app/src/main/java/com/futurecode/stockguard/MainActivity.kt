package com.futurecode.stockguard

import android.app.AlertDialog
import android.content.Intent
import android.database.sqlite.SQLiteConstraintException
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.widget.*
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import java.text.NumberFormat
import java.util.Locale

class MainActivity : ComponentActivity() {
    private lateinit var db: DatabaseHelper
    private lateinit var contentBox: FrameLayout
    private var activePage = "dashboard"
    private val cart = linkedMapOf<Long, Int>()
    private var pendingBarcodeTarget: EditText? = null

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
        if (product == null) {
            toast("ဒီ Barcode နဲ့ ကုန်ပစ္စည်း မတွေ့ပါ")
        } else {
            addToCart(product.id)
            activePage = "sale"
            showSale()
        }
    }

    private val csvLauncher = registerForActivityResult(
        ActivityResultContracts.CreateDocument("text/csv")
    ) { uri ->
        if (uri != null) {
            runCatching {
                contentResolver.openOutputStream(uri)?.use { it.write(db.salesCsv().toByteArray(Charsets.UTF_8)) }
            }.onSuccess { toast("CSV Export ပြီးပါပြီ") }
                .onFailure { toast("CSV Export မအောင်မြင်ပါ: ${it.message}") }
        }
    }

    private val backupLauncher = registerForActivityResult(
        ActivityResultContracts.CreateDocument("application/json")
    ) { uri ->
        if (uri != null) {
            runCatching {
                contentResolver.openOutputStream(uri)?.use { it.write(db.backupJson().toByteArray(Charsets.UTF_8)) }
            }.onSuccess { toast("Backup သိမ်းပြီးပါပြီ") }
                .onFailure { toast("Backup မအောင်မြင်ပါ: ${it.message}") }
        }
    }

    private val restoreLauncher = registerForActivityResult(
        ActivityResultContracts.OpenDocument()
    ) { uri ->
        if (uri != null) {
            runCatching {
                val raw = contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
                    ?: error("Cannot read file")
                db.restoreJson(raw)
                cart.clear()
            }.onSuccess {
                toast("Restore ပြီးပါပြီ")
                showDashboard()
            }.onFailure { toast("Restore မအောင်မြင်ပါ: ${it.message}") }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        db = DatabaseHelper(this)
        setContentView(buildRoot())
        showDashboard()
    }

    override fun onDestroy() {
        db.close()
        super.onDestroy()
    }

    private fun buildRoot(): View {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.rgb(241, 245, 249))
        }

        root.addView(LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(18), dp(18), dp(18), dp(14))
            setBackgroundColor(Color.rgb(16, 42, 67))
            addView(tv("Future Code StockGuard", 25, true, Color.WHITE))
            addView(tv("Offline Stock · Sales · Profit · Barcode", 13, false, Color.rgb(203, 213, 225)))
        })

        val navScroll = HorizontalScrollView(this).apply {
            isHorizontalScrollBarEnabled = false
            setBackgroundColor(Color.rgb(226, 232, 240))
        }
        val nav = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(dp(8), dp(8), dp(8), dp(8))
        }
        nav.addView(navButton("Dashboard") { activePage = "dashboard"; showDashboard() })
        nav.addView(navButton("ကုန်ပစ္စည်း") { activePage = "products"; showProducts() })
        nav.addView(navButton("အရောင်း") { activePage = "sale"; showSale() })
        nav.addView(navButton("Backup / CSV") { activePage = "backup"; showBackup() })
        navScroll.addView(nav)
        root.addView(navScroll)

        contentBox = FrameLayout(this)
        root.addView(contentBox, LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f
        ))
        return root
    }

    private fun showDashboard() {
        activePage = "dashboard"
        val stats = db.dashboardToday()
        val body = page()
        body.addView(title("ယနေ့ Dashboard"))
        body.addView(statPanel("ယနေ့ ရောင်းရငွေ", money(stats.revenue), "#0F766E"))
        body.addView(statPanel("ယနေ့ အကြမ်းအမြတ်", money(stats.profit), "#2563EB"))
        body.addView(statPanel("ယနေ့ အရောင်းအကြိမ်", stats.salesCount.toString(), "#7C3AED"))
        body.addView(statPanel("Stock နည်းနေသော ပစ္စည်း", stats.lowStockCount.toString(), "#B45309"))

        body.addView(sectionTitle("Low Stock"))
        val low = db.lowStockProducts()
        if (low.isEmpty()) {
            body.addView(note("Low-stock သတိပေးချက် မရှိသေးပါ"))
        } else {
            low.forEach { p ->
                body.addView(rowPanel(
                    p.name,
                    "လက်ကျန် ${p.stock} · သတိပေးအဆင့် ${p.lowStock}" +
                        if (p.barcode.isNotBlank()) "\nBarcode: ${p.barcode}" else ""
                ))
            }
        }
        setPage(body)
    }

    private fun showProducts() {
        activePage = "products"
        val body = page()
        body.addView(title("ကုန်ပစ္စည်း စာရင်း"))
        body.addView(primaryButton("+ ကုန်ပစ္စည်း အသစ်ထည့်") { productDialog(null) })
        body.addView(note("ပစ္စည်းတစ်ခုကို နှိပ်ရင် ပြင်နိုင်ပါတယ်။ ဖိထားရင် ဖျက်နိုင်ပါတယ်။"))

        val products = db.allProducts()
        if (products.isEmpty()) {
            body.addView(note("ကုန်ပစ္စည်း မရှိသေးပါ"))
        } else {
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
                )
                panel.setOnClickListener { productDialog(p) }
                panel.setOnLongClickListener {
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
                    true
                }
                body.addView(panel)
            }
        }
        setPage(body)
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

        wrap.addView(name)
        wrap.addView(category)
        wrap.addView(barcode)
        wrap.addView(secondaryButton("📷 Barcode Scan") {
            pendingBarcodeTarget = barcode
            scanLauncher.launch(Intent(this, BarcodeScannerActivity::class.java))
        })
        wrap.addView(buy)
        wrap.addView(sell)
        wrap.addView(stock)
        wrap.addView(low)

        val scroll = ScrollView(this).apply { addView(wrap) }
        val dialog = AlertDialog.Builder(this)
            .setTitle(if (existing == null) "ကုန်ပစ္စည်း အသစ်" else "ကုန်ပစ္စည်း ပြင်ရန်")
            .setView(scroll)
            .setNegativeButton("ပယ်ဖျက်", null)
            .setPositiveButton("သိမ်းမယ်", null)
            .create()

        dialog.setOnDismissListener {
            if (pendingBarcodeTarget === barcode) pendingBarcodeTarget = null
        }

        dialog.setOnShowListener {
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                val n = name.text.toString().trim()
                val b = buy.text.toString().trim().toLongOrNull()
                val s = sell.text.toString().trim().toLongOrNull()
                val q = stock.text.toString().trim().toIntOrNull()
                val l = low.text.toString().trim().toIntOrNull()
                if (n.isBlank() || b == null || s == null || q == null || l == null ||
                    b < 0 || s < 0 || q < 0 || l < 0) {
                    toast("အချက်အလက်တွေကို မှန်ကန်စွာ ဖြည့်ပါ")
                    return@setOnClickListener
                }

                runCatching {
                    if (existing == null) {
                        db.insertProduct(n, barcode.text.toString(), category.text.toString(), b, s, q, l)
                    } else {
                        db.updateProduct(existing.id, n, barcode.text.toString(), category.text.toString(), b, s, q, l)
                    }
                }.onSuccess {
                    dialog.dismiss()
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
        activePage = "sale"
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
        if (cart.isEmpty()) {
            body.addView(note("Cart ထဲမှာ ပစ္စည်းမရှိသေးပါ"))
        } else {
            var total = 0L
            cart.toMap().forEach { (id, qty) ->
                val p = db.productById(id)
                if (p == null) {
                    cart.remove(id)
                } else {
                    total += p.sellPrice * qty
                    val panel = rowPanel(
                        p.name,
                        "Qty: $qty · ${money(p.sellPrice)} / ခု · စုစုပေါင်း ${money(p.sellPrice * qty)}"
                    )
                    val actions = LinearLayout(this).apply {
                        orientation = LinearLayout.HORIZONTAL
                        addView(smallButton("−") {
                            val now = (cart[id] ?: 1) - 1
                            if (now <= 0) cart.remove(id) else cart[id] = now
                            showSale()
                        })
                        addView(smallButton("+") {
                            addToCart(id)
                            showSale()
                        })
                        addView(smallButton("ဖယ်") {
                            cart.remove(id)
                            showSale()
                        })
                    }
                    (panel as LinearLayout).addView(actions)
                    body.addView(panel)
                }
            }
            body.addView(statPanel("ကျသင့်ငွေ", money(total), "#0F766E"))
            body.addView(primaryButton("အရောင်း အတည်ပြုမယ်") {
                val result = db.checkout(cart.toMap())
                if (result.ok) {
                    cart.clear()
                    toast("အရောင်း #${result.saleId} သိမ်းပြီး Stock နုတ်ပြီးပါပြီ")
                    showSale()
                } else {
                    toast(result.message)
                    showSale()
                }
            })
            body.addView(secondaryButton("Cart ရှင်းမယ်") {
                cart.clear()
                showSale()
            })
        }
        setPage(body)
    }

    private fun addToCart(productId: Long) {
        val p = db.productById(productId) ?: return
        val current = cart[productId] ?: 0
        if (current >= p.stock) {
            toast("${p.name}: Stock ${p.stock} ပဲရှိပါတယ်")
            return
        }
        cart[productId] = current + 1
    }

    private fun showBackup() {
        activePage = "backup"
        val body = page()
        body.addView(title("Backup & Reports"))
        body.addView(note("အင်တာနက်မလိုပါ။ ဖိုင်တွေကို ကိုယ်ရွေးတဲ့ Folder ထဲ သိမ်းပေးပါတယ်။"))
        body.addView(primaryButton("Sales CSV Export") {
            csvLauncher.launch("StockGuard-Sales.csv")
        })
        body.addView(primaryButton("Full JSON Backup") {
            backupLauncher.launch("StockGuard-Backup.json")
        })
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
        body.addView(note("APK update မလုပ်ခင် Full JSON Backup တစ်စောင် ထုတ်ထားဖို့ အကြံပြုပါတယ်။"))
        setPage(body)
    }

    private fun setPage(view: View) {
        contentBox.removeAllViews()
        contentBox.addView(view)
    }

    private fun page(): LinearLayout {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(14), dp(14), dp(14), dp(30))
        }
        val scroll = ScrollView(this)
        scroll.addView(root)
        contentBox.removeAllViews()
        contentBox.addView(scroll)
        return root
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
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { bottomMargin = dp(9) }
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

    private fun toast(message: String) =
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()

    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()
}
