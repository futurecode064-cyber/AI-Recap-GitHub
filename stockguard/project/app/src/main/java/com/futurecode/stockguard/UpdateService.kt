package com.futurecode.stockguard

import android.app.DownloadManager
import android.content.Context
import android.net.ConnectivityManager
import android.net.Uri
import android.os.Environment
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest

data class ReleaseInfo(
    val versionCode: Int,
    val versionName: String,
    val apkUrl: String,
    val sha256: String,
    val notes: String
)

data class RemoteNotice(
    val key: String,
    val title: String,
    val body: String,
    val createdMs: Long,
    val minVersionCode: Int
)

object UpdateService {
    const val LATEST_URL =
        "https://raw.githubusercontent.com/futurecode064-cyber/AI-Recap-GitHub/main/stockguard/latest.json"
    const val NOTICE_URL =
        "https://mxwervqihaqlxybghdak.supabase.co/functions/v1/fc-stockguard-notices"

    private fun get(url: String): String {
        val c = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 12000
            readTimeout = 15000
            setRequestProperty("Accept", "application/json")
            setRequestProperty("User-Agent", "FutureCode-StockGuard/${BuildConfig.VERSION_NAME}")
        }
        return try {
            val code = c.responseCode
            val stream = if (code in 200..299) c.inputStream else c.errorStream
            val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
            if (code !in 200..299) error("HTTP $code")
            text
        } finally {
            c.disconnect()
        }
    }

    fun checkLatest(): ReleaseInfo {
        val j = JSONObject(get(LATEST_URL))
        return ReleaseInfo(
            versionCode = j.getInt("versionCode"),
            versionName = j.getString("versionName"),
            apkUrl = j.getString("apkUrl"),
            sha256 = j.getString("sha256").lowercase(),
            notes = j.optString("notes")
        )
    }

    fun fetchNotices(): List<RemoteNotice> {
        val root = JSONObject(get(NOTICE_URL))
        val a = root.optJSONArray("notices") ?: return emptyList()
        val result = mutableListOf<RemoteNotice>()
        for (i in 0 until a.length()) {
            val o = a.getJSONObject(i)
            result += RemoteNotice(
                key = o.getString("notice_key"),
                title = o.getString("title"),
                body = o.getString("body"),
                createdMs = o.optDouble("created_ms", 0.0).toLong(),
                minVersionCode = o.optInt("min_version_code", 1)
            )
        }
        return result
    }

    fun isUnmetered(context: Context): Boolean {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        return !cm.isActiveNetworkMetered
    }

    fun enqueueDownload(context: Context, info: ReleaseInfo): Long {
        val prefs = context.getSharedPreferences("stockguard_update", Context.MODE_PRIVATE)
        val existingVersion = prefs.getInt("download_version", 0)
        val existingId = prefs.getLong("download_id", -1)
        if (existingVersion == info.versionCode && existingId > 0) return existingId

        val dir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
            ?: error("Download folder unavailable")
        val file = File(dir, "FutureCodeStockGuard-v${info.versionName}.apk")
        if (file.exists()) file.delete()

        val request = DownloadManager.Request(Uri.parse(info.apkUrl))
            .setTitle("Future Code StockGuard ${info.versionName}")
            .setDescription("Update download")
            .setMimeType("application/vnd.android.package-archive")
            .setAllowedOverMetered(false)
            .setAllowedOverRoaming(false)
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE)
            .setDestinationUri(Uri.fromFile(file))

        val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val id = dm.enqueue(request)
        prefs.edit()
            .putLong("download_id", id)
            .putInt("download_version", info.versionCode)
            .putString("download_version_name", info.versionName)
            .putString("download_path", file.absolutePath)
            .putString("download_sha256", info.sha256)
            .apply()
        return id
    }

    fun sha256(file: File): String {
        val md = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { input ->
            val buffer = ByteArray(1024 * 64)
            while (true) {
                val n = input.read(buffer)
                if (n <= 0) break
                md.update(buffer, 0, n)
            }
        }
        return md.digest().joinToString("") { "%02x".format(it) }
    }

    fun verify(file: File, expected: String): Boolean =
        file.isFile && file.length() > 0 && sha256(file).equals(expected.trim(), ignoreCase = true)
}
