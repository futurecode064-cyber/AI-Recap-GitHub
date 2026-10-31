package com.futurecode.pushdesk

import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.text.InputType
import android.view.Gravity
import android.view.View
import android.widget.*
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant

class MainActivity : Activity() {
    private val backendDefault = "https://mxwervqihaqlxybghdak.supabase.co/functions/v1/fc-pushdesk-send"
    private lateinit var tokenStore: SecureTokenStore
    private lateinit var backend: EditText
    private lateinit var token: EditText
    private lateinit var targetType: Spinner
    private lateinit var target: Spinner
    private lateinit var customTarget: EditText
    private lateinit var titleBox: EditText
    private lateinit var bodyBox: EditText
    private lateinit var deepLinkBox: EditText
    private lateinit var status: TextView
    private lateinit var history: TextView

    private val topics = listOf(
        "all-future-code", "football-main", "goal-zone", "ykz-family",
        "bw-sport", "ko-thet-family", "kmm-sport-hub", "bcf-bet-city-family",
        "training", "language", "pushdesk-test"
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        tokenStore = SecureTokenStore(this)
        setContentView(buildUi())
        loadSaved()
        refreshHistory()
    }

    private fun buildUi(): View {
        val scroll = ScrollView(this).apply { setBackgroundColor(Color.rgb(11,18,32)) }
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(18), dp(22), dp(18), dp(32))
        }
        scroll.addView(root)

        root.addView(text("Future Code PushDesk", 28, true, Color.WHITE))
        root.addView(text("Central Push Notification Admin · v1.0.0", 14, false, Color.rgb(148,163,184)))
        root.addView(space(14))

        backend = input("Backend URL", false)
        token = input("Admin API Token", true)
        root.addView(label("Secure Backend"))
        root.addView(backend)
        root.addView(token)
        root.addView(button("Save Secure Settings") { saveSettings() })
        root.addView(button("Check Backend Status") { callApi(JSONObject().put("action", "status"), false) })

        root.addView(sectionGap())
        root.addView(label("Target"))
        target = Spinner(this).apply {
            adapter = ArrayAdapter(this@MainActivity, android.R.layout.simple_spinner_dropdown_item, topics)
            setBackgroundColor(Color.WHITE)
        }
        customTarget = input("FCM device token", false).apply { visibility = View.GONE }
        targetType = Spinner(this).apply {
            adapter = ArrayAdapter(this@MainActivity, android.R.layout.simple_spinner_dropdown_item, listOf("Topic", "Device Token"))
            setBackgroundColor(Color.WHITE)
        }
        targetType.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                val topicMode = position == 0
                target.visibility = if (topicMode) View.VISIBLE else View.GONE
                customTarget.visibility = if (topicMode) View.GONE else View.VISIBLE
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
        root.addView(targetType)
        root.addView(space(8))
        root.addView(target)
        root.addView(customTarget)

        root.addView(sectionGap())
        root.addView(label("Notification"))
        titleBox = input("Title", false)
        bodyBox = input("Message", false).apply { minLines = 4; gravity = Gravity.TOP }
        deepLinkBox = input("Deep link (optional)", false)
        root.addView(titleBox)
        root.addView(bodyBox)
        root.addView(deepLinkBox)
        root.addView(button("Send Notification") { sendNotification() })

        status = text("Ready", 14, false, Color.rgb(203,213,225))
        root.addView(space(12))
        root.addView(status)

        root.addView(sectionGap())
        root.addView(label("Recent Send History"))
        history = text("No sends yet", 13, false, Color.rgb(203,213,225))
        root.addView(history)
        return scroll
    }

    private fun sendNotification() {
        val isTopic = targetType.selectedItemPosition == 0
        val selected = if (isTopic) target.selectedItem.toString() else customTarget.text.toString().trim()
        val notificationTitle = titleBox.text.toString().trim()
        val notificationBody = bodyBox.text.toString().trim()
        if (selected.isBlank() || notificationTitle.isBlank() || notificationBody.isBlank()) {
            status.text = "Target, title and message are required."
            return
        }
        val json = JSONObject()
            .put("action", "send")
            .put("targetType", if (isTopic) "topic" else "token")
            .put("target", selected)
            .put("title", notificationTitle)
            .put("body", notificationBody)
            .put("deepLink", deepLinkBox.text.toString().trim())
        callApi(json, true)
    }

    private fun callApi(payload: JSONObject, requiresAuth: Boolean) {
        val endpoint = backend.text.toString().trim()
        if (!endpoint.startsWith("https://")) {
            status.text = "HTTPS backend URL required."
            return
        }
        val auth = tokenStore.load().ifBlank { token.text.toString().trim() }
        if (requiresAuth && auth.isBlank()) {
            status.text = "Admin API token is required."
            return
        }
        status.text = "Connecting…"
        Thread {
            try {
                val conn = (URL(endpoint).openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 12000
                    readTimeout = 20000
                    doOutput = true
                    setRequestProperty("Content-Type", "application/json; charset=utf-8")
                    setRequestProperty("Accept", "application/json")
                    if (auth.isNotBlank()) setRequestProperty("Authorization", "Bearer $auth")
                }
                conn.outputStream.use { it.write(payload.toString().toByteArray(Charsets.UTF_8)) }
                val code = conn.responseCode
                val stream = if (code in 200..299) conn.inputStream else conn.errorStream
                val response = stream?.bufferedReader()?.use { it.readText() } ?: ""
                runOnUiThread {
                    status.text = "HTTP $code\n$response"
                    if (payload.optString("action") == "send" && code in 200..299) {
                        addHistory(payload)
                        refreshHistory()
                    }
                }
            } catch (e: Exception) {
                runOnUiThread { status.text = "Network error: ${e.message ?: e.javaClass.simpleName}" }
            }
        }.start()
    }

    private fun saveSettings() {
        val endpoint = backend.text.toString().trim()
        if (!endpoint.startsWith("https://")) {
            status.text = "HTTPS backend URL required."
            return
        }
        getSharedPreferences("pushdesk", MODE_PRIVATE).edit().putString("backend", endpoint).apply()
        tokenStore.save(token.text.toString().trim())
        token.setText("")
        token.hint = if (tokenStore.load().isNotBlank()) "Admin token saved securely" else "Admin API Token"
        status.text = "Settings saved. Token is encrypted with Android Keystore."
    }

    private fun loadSaved() {
        val prefs = getSharedPreferences("pushdesk", MODE_PRIVATE)
        backend.setText(prefs.getString("backend", backendDefault))
        token.setText("")
        if (tokenStore.load().isNotBlank()) token.hint = "Admin token saved securely"
    }

    private fun addHistory(payload: JSONObject) {
        val prefs = getSharedPreferences("pushdesk", MODE_PRIVATE)
        val old = prefs.getString("history", "").orEmpty().lines().filter { it.isNotBlank() }
        val line = "${Instant.now()} | ${payload.optString("target")} | ${payload.optString("title")}"
        prefs.edit().putString("history", (listOf(line) + old).take(20).joinToString("\n")).apply()
    }

    private fun refreshHistory() {
        val s = getSharedPreferences("pushdesk", MODE_PRIVATE).getString("history", "").orEmpty()
        history.text = if (s.isBlank()) "No successful sends yet." else s
    }

    private fun label(s: String) = text(s, 16, true, Color.WHITE)
    private fun text(s: String, sp: Int, bold: Boolean, color: Int) = TextView(this).apply {
        text = s
        textSize = sp.toFloat()
        setTextColor(color)
        if (bold) setTypeface(typeface, android.graphics.Typeface.BOLD)
        setPadding(0, dp(4), 0, dp(4))
    }
    private fun input(hintText: String, password: Boolean) = EditText(this).apply {
        hint = hintText
        setHintTextColor(Color.rgb(100,116,139))
        setTextColor(Color.rgb(15,23,42))
        setBackgroundColor(Color.WHITE)
        setPadding(dp(12), dp(10), dp(12), dp(10))
        inputType = if (password) InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD else InputType.TYPE_CLASS_TEXT
        layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { bottomMargin = dp(8) }
    }
    private fun button(label: String, action: () -> Unit) = Button(this).apply {
        text = label
        setOnClickListener { action() }
        isAllCaps = false
        layoutParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT).apply { bottomMargin = dp(8) }
    }
    private fun space(h: Int) = Space(this).apply { layoutParams = LinearLayout.LayoutParams(1, dp(h)) }
    private fun sectionGap() = space(18)
    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()
}
