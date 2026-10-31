package com.futurecode.stockguard

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteConstraintException
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate
import java.time.ZoneId

data class Product(
    val id: Long,
    val name: String,
    val barcode: String,
    val category: String,
    val buyPrice: Long,
    val sellPrice: Long,
    val stock: Int,
    val lowStock: Int
)

data class DashboardStats(
    val revenue: Long,
    val cost: Long,
    val profit: Long,
    val salesCount: Int,
    val lowStockCount: Int
)

data class CheckoutResult(val ok: Boolean, val message: String, val saleId: Long = -1)

class DatabaseHelper(context: Context) : SQLiteOpenHelper(context, "stockguard.db", null, 1) {
    override fun onConfigure(db: SQLiteDatabase) {
        super.onConfigure(db)
        db.setForeignKeyConstraintsEnabled(true)
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL("""
            CREATE TABLE products(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                barcode TEXT UNIQUE,
                category TEXT NOT NULL DEFAULT '',
                buy_price INTEGER NOT NULL CHECK(buy_price >= 0),
                sell_price INTEGER NOT NULL CHECK(sell_price >= 0),
                stock INTEGER NOT NULL CHECK(stock >= 0),
                low_stock INTEGER NOT NULL DEFAULT 5 CHECK(low_stock >= 0)
            )
        """.trimIndent())
        db.execSQL("""
            CREATE TABLE sales(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at INTEGER NOT NULL,
                total_revenue INTEGER NOT NULL CHECK(total_revenue >= 0),
                total_cost INTEGER NOT NULL CHECK(total_cost >= 0)
            )
        """.trimIndent())
        db.execSQL("""
            CREATE TABLE sale_items(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sale_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                product_name TEXT NOT NULL,
                qty INTEGER NOT NULL CHECK(qty > 0),
                buy_price INTEGER NOT NULL CHECK(buy_price >= 0),
                sell_price INTEGER NOT NULL CHECK(sell_price >= 0),
                FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE
            )
        """.trimIndent())
        db.execSQL("CREATE INDEX idx_products_name ON products(name)")
        db.execSQL("CREATE INDEX idx_sales_created ON sales(created_at)")
        db.execSQL("CREATE INDEX idx_sale_items_sale ON sale_items(sale_id)")
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) = Unit

    private fun productFromCursor(c: Cursor): Product = Product(
        id = c.getLong(c.getColumnIndexOrThrow("id")),
        name = c.getString(c.getColumnIndexOrThrow("name")),
        barcode = c.getString(c.getColumnIndexOrThrow("barcode")) ?: "",
        category = c.getString(c.getColumnIndexOrThrow("category")) ?: "",
        buyPrice = c.getLong(c.getColumnIndexOrThrow("buy_price")),
        sellPrice = c.getLong(c.getColumnIndexOrThrow("sell_price")),
        stock = c.getInt(c.getColumnIndexOrThrow("stock")),
        lowStock = c.getInt(c.getColumnIndexOrThrow("low_stock"))
    )

    fun allProducts(): List<Product> {
        val result = mutableListOf<Product>()
        readableDatabase.rawQuery("""
            SELECT id,name,barcode,category,buy_price,sell_price,stock,low_stock
            FROM products ORDER BY name COLLATE NOCASE
        """.trimIndent(), null).use { c ->
            while (c.moveToNext()) result += productFromCursor(c)
        }
        return result
    }

    fun lowStockProducts(): List<Product> {
        val result = mutableListOf<Product>()
        readableDatabase.rawQuery("""
            SELECT id,name,barcode,category,buy_price,sell_price,stock,low_stock
            FROM products WHERE stock <= low_stock ORDER BY stock ASC, name COLLATE NOCASE
        """.trimIndent(), null).use { c ->
            while (c.moveToNext()) result += productFromCursor(c)
        }
        return result
    }

    fun productById(id: Long): Product? =
        readableDatabase.rawQuery("""
            SELECT id,name,barcode,category,buy_price,sell_price,stock,low_stock
            FROM products WHERE id=?
        """.trimIndent(), arrayOf(id.toString())).use { c ->
            if (c.moveToFirst()) productFromCursor(c) else null
        }

    fun productByBarcode(barcode: String): Product? {
        val b = barcode.trim()
        if (b.isEmpty()) return null
        return readableDatabase.rawQuery("""
            SELECT id,name,barcode,category,buy_price,sell_price,stock,low_stock
            FROM products WHERE barcode=?
        """.trimIndent(), arrayOf(b)).use { c ->
            if (c.moveToFirst()) productFromCursor(c) else null
        }
    }

    private fun valuesForProduct(
        name: String, barcode: String, category: String,
        buyPrice: Long, sellPrice: Long, stock: Int, lowStock: Int
    ): ContentValues = ContentValues().apply {
        put("name", name.trim())
        if (barcode.trim().isBlank()) putNull("barcode") else put("barcode", barcode.trim())
        put("category", category.trim())
        put("buy_price", buyPrice)
        put("sell_price", sellPrice)
        put("stock", stock)
        put("low_stock", lowStock)
    }

    fun insertProduct(
        name: String, barcode: String, category: String,
        buyPrice: Long, sellPrice: Long, stock: Int, lowStock: Int
    ): Long {
        require(name.isNotBlank())
        require(buyPrice >= 0 && sellPrice >= 0 && stock >= 0 && lowStock >= 0)
        return writableDatabase.insertOrThrow(
            "products", null,
            valuesForProduct(name, barcode, category, buyPrice, sellPrice, stock, lowStock)
        )
    }

    fun updateProduct(
        id: Long, name: String, barcode: String, category: String,
        buyPrice: Long, sellPrice: Long, stock: Int, lowStock: Int
    ): Boolean {
        require(name.isNotBlank())
        require(buyPrice >= 0 && sellPrice >= 0 && stock >= 0 && lowStock >= 0)
        return writableDatabase.update(
            "products",
            valuesForProduct(name, barcode, category, buyPrice, sellPrice, stock, lowStock),
            "id=?", arrayOf(id.toString())
        ) == 1
    }

    fun deleteProduct(id: Long): Boolean =
        writableDatabase.delete("products", "id=?", arrayOf(id.toString())) == 1

    fun checkout(cart: Map<Long, Int>): CheckoutResult {
        if (cart.isEmpty()) return CheckoutResult(false, "Cart is empty")
        val db = writableDatabase
        db.beginTransaction()
        return try {
            val lines = mutableListOf<Pair<Product, Int>>()
            var revenue = 0L
            var cost = 0L

            for ((id, qty) in cart) {
                if (qty <= 0) return CheckoutResult(false, "Invalid quantity")
                val p = db.rawQuery("""
                    SELECT id,name,barcode,category,buy_price,sell_price,stock,low_stock
                    FROM products WHERE id=?
                """.trimIndent(), arrayOf(id.toString())).use { c ->
                    if (c.moveToFirst()) productFromCursor(c) else null
                } ?: return CheckoutResult(false, "Product not found")
                if (p.stock < qty) return CheckoutResult(false, "${p.name}: stock is only ${p.stock}")
                lines += p to qty
                revenue += p.sellPrice * qty
                cost += p.buyPrice * qty
            }

            val saleId = db.insertOrThrow("sales", null, ContentValues().apply {
                put("created_at", System.currentTimeMillis())
                put("total_revenue", revenue)
                put("total_cost", cost)
            })

            for ((p, qty) in lines) {
                db.insertOrThrow("sale_items", null, ContentValues().apply {
                    put("sale_id", saleId)
                    put("product_id", p.id)
                    put("product_name", p.name)
                    put("qty", qty)
                    put("buy_price", p.buyPrice)
                    put("sell_price", p.sellPrice)
                })
                val changed = db.execUpdate(
                    "UPDATE products SET stock=stock-? WHERE id=? AND stock>=?",
                    arrayOf(qty, p.id, qty)
                )
                if (changed != 1) return CheckoutResult(false, "${p.name}: stock changed; retry")
            }

            db.setTransactionSuccessful()
            CheckoutResult(true, "Sale saved", saleId)
        } catch (e: Exception) {
            CheckoutResult(false, e.message ?: "Checkout failed")
        } finally {
            db.endTransaction()
        }
    }

    private fun SQLiteDatabase.execUpdate(sql: String, args: Array<Any>): Int {
        compileStatement(sql).use { statement ->
            args.forEachIndexed { index, value ->
                val i = index + 1
                when (value) {
                    is Int -> statement.bindLong(i, value.toLong())
                    is Long -> statement.bindLong(i, value)
                    else -> statement.bindString(i, value.toString())
                }
            }
            return statement.executeUpdateDelete()
        }
    }

    fun dashboardToday(): DashboardStats {
        val start = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
        val end = LocalDate.now().plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli()
        var revenue = 0L
        var cost = 0L
        var count = 0
        readableDatabase.rawQuery("""
            SELECT COALESCE(SUM(total_revenue),0), COALESCE(SUM(total_cost),0), COUNT(*)
            FROM sales WHERE created_at>=? AND created_at<?
        """.trimIndent(), arrayOf(start.toString(), end.toString())).use { c ->
            if (c.moveToFirst()) {
                revenue = c.getLong(0)
                cost = c.getLong(1)
                count = c.getInt(2)
            }
        }
        val low = readableDatabase.rawQuery(
            "SELECT COUNT(*) FROM products WHERE stock<=low_stock", null
        ).use { c -> if (c.moveToFirst()) c.getInt(0) else 0 }
        return DashboardStats(revenue, cost, revenue - cost, count, low)
    }

    fun salesCsv(): String {
        val out = StringBuilder()
        out.append("sale_id,created_at,product,qty,buy_price,sell_price,line_revenue,line_cost\n")
        readableDatabase.rawQuery("""
            SELECT s.id,s.created_at,i.product_name,i.qty,i.buy_price,i.sell_price
            FROM sales s JOIN sale_items i ON i.sale_id=s.id
            ORDER BY s.created_at DESC,s.id DESC,i.id ASC
        """.trimIndent(), null).use { c ->
            while (c.moveToNext()) {
                val qty = c.getInt(3)
                val buy = c.getLong(4)
                val sell = c.getLong(5)
                val cols = listOf(
                    c.getLong(0).toString(),
                    c.getLong(1).toString(),
                    c.getString(2),
                    qty.toString(),
                    buy.toString(),
                    sell.toString(),
                    (sell * qty).toString(),
                    (buy * qty).toString()
                )
                out.append(cols.joinToString(",") { csv(it) }).append('\n')
            }
        }
        return out.toString()
    }

    private fun csv(value: String): String =
        """ + value.replace(""", """") + """

    fun backupJson(): String {
        val root = JSONObject()
        root.put("format", "future-code-stockguard")
        root.put("version", 1)

        val products = JSONArray()
        readableDatabase.rawQuery("""
            SELECT id,name,barcode,category,buy_price,sell_price,stock,low_stock FROM products ORDER BY id
        """.trimIndent(), null).use { c ->
            while (c.moveToNext()) {
                products.put(JSONObject().apply {
                    put("id", c.getLong(0))
                    put("name", c.getString(1))
                    put("barcode", c.getString(2) ?: "")
                    put("category", c.getString(3) ?: "")
                    put("buy_price", c.getLong(4))
                    put("sell_price", c.getLong(5))
                    put("stock", c.getInt(6))
                    put("low_stock", c.getInt(7))
                })
            }
        }

        val sales = JSONArray()
        readableDatabase.rawQuery("""
            SELECT id,created_at,total_revenue,total_cost FROM sales ORDER BY id
        """.trimIndent(), null).use { c ->
            while (c.moveToNext()) {
                sales.put(JSONObject().apply {
                    put("id", c.getLong(0))
                    put("created_at", c.getLong(1))
                    put("total_revenue", c.getLong(2))
                    put("total_cost", c.getLong(3))
                })
            }
        }

        val items = JSONArray()
        readableDatabase.rawQuery("""
            SELECT id,sale_id,product_id,product_name,qty,buy_price,sell_price FROM sale_items ORDER BY id
        """.trimIndent(), null).use { c ->
            while (c.moveToNext()) {
                items.put(JSONObject().apply {
                    put("id", c.getLong(0))
                    put("sale_id", c.getLong(1))
                    put("product_id", c.getLong(2))
                    put("product_name", c.getString(3))
                    put("qty", c.getInt(4))
                    put("buy_price", c.getLong(5))
                    put("sell_price", c.getLong(6))
                })
            }
        }

        root.put("products", products)
        root.put("sales", sales)
        root.put("sale_items", items)
        return root.toString(2)
    }

    fun restoreJson(raw: String) {
        val root = JSONObject(raw)
        require(root.optString("format") == "future-code-stockguard") { "Not a StockGuard backup" }
        require(root.optInt("version") == 1) { "Unsupported backup version" }
        val products = root.getJSONArray("products")
        val sales = root.getJSONArray("sales")
        val items = root.getJSONArray("sale_items")

        val db = writableDatabase
        db.beginTransaction()
        try {
            db.delete("sale_items", null, null)
            db.delete("sales", null, null)
            db.delete("products", null, null)

            for (i in 0 until products.length()) {
                val o = products.getJSONObject(i)
                db.insertOrThrow("products", null, ContentValues().apply {
                    put("id", o.getLong("id"))
                    put("name", o.getString("name"))
                    val b = o.optString("barcode")
                    if (b.isBlank()) putNull("barcode") else put("barcode", b)
                    put("category", o.optString("category"))
                    put("buy_price", o.getLong("buy_price"))
                    put("sell_price", o.getLong("sell_price"))
                    put("stock", o.getInt("stock"))
                    put("low_stock", o.getInt("low_stock"))
                })
            }
            for (i in 0 until sales.length()) {
                val o = sales.getJSONObject(i)
                db.insertOrThrow("sales", null, ContentValues().apply {
                    put("id", o.getLong("id"))
                    put("created_at", o.getLong("created_at"))
                    put("total_revenue", o.getLong("total_revenue"))
                    put("total_cost", o.getLong("total_cost"))
                })
            }
            for (i in 0 until items.length()) {
                val o = items.getJSONObject(i)
                db.insertOrThrow("sale_items", null, ContentValues().apply {
                    put("id", o.getLong("id"))
                    put("sale_id", o.getLong("sale_id"))
                    put("product_id", o.getLong("product_id"))
                    put("product_name", o.getString("product_name"))
                    put("qty", o.getInt("qty"))
                    put("buy_price", o.getLong("buy_price"))
                    put("sell_price", o.getLong("sell_price"))
                })
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }
}
