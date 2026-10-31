package com.futurecode.stockguard

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import java.io.File

class DownloadReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != DownloadManager.ACTION_DOWNLOAD_COMPLETE) return
        val prefs = context.getSharedPreferences("stockguard_update", Context.MODE_PRIVATE)
        val expectedId = prefs.getLong("download_id", -1)
        val completedId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -2)
        if (expectedId <= 0 || completedId != expectedId) return

        val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        dm.query(DownloadManager.Query().setFilterById(completedId)).use { c ->
            if (!c.moveToFirst()) return
            val status = c.getInt(c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
            if (status != DownloadManager.STATUS_SUCCESSFUL) {
                NotificationHelper.postUpdateError(context, "Download failed")
                prefs.edit().remove("download_id").apply()
                return
            }
        }

        val path = prefs.getString("download_path", "").orEmpty()
        val expectedHash = prefs.getString("download_sha256", "").orEmpty()
        val versionName = prefs.getString("download_version_name", "new version").orEmpty()
        val file = File(path)
        if (!UpdateService.verify(file, expectedHash)) {
            file.delete()
            NotificationHelper.postUpdateError(context, "APK verification failed. File removed.")
            prefs.edit().remove("download_id").apply()
            return
        }

        prefs.edit().putBoolean("download_verified", true).apply()
        NotificationHelper.postUpdateReady(context, file.absolutePath, expectedHash, versionName)
    }
}
