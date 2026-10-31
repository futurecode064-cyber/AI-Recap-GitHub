package com.futurecode.stockguard

import android.content.Context
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

class SyncWorker(appContext: Context, params: WorkerParameters) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        NotificationHelper.createChannels(applicationContext)
        val prefs = applicationContext.getSharedPreferences("stockguard_sync", Context.MODE_PRIVATE)
        var networkWorked = false

        runCatching {
            val latest = UpdateService.checkLatest()
            networkWorked = true
            if (latest.versionCode > BuildConfig.VERSION_CODE) {
                val already = prefs.getInt("update_notified_version", 0)
                if (already != latest.versionCode) {
                    NotificationHelper.postUpdateAvailable(applicationContext, latest)
                    prefs.edit().putInt("update_notified_version", latest.versionCode).apply()
                }
                val auto = prefs.getBoolean("auto_download_updates", true)
                if (auto && UpdateService.isUnmetered(applicationContext)) {
                    runCatching { UpdateService.enqueueDownload(applicationContext, latest) }
                }
            }
        }

        runCatching {
            val notices = UpdateService.fetchNotices()
            networkWorked = true
            val seen = prefs.getStringSet("seen_notices", emptySet())?.toMutableSet() ?: mutableSetOf()
            var changed = false
            notices.sortedBy { it.createdMs }.forEach { n ->
                if (n.minVersionCode <= BuildConfig.VERSION_CODE && n.key !in seen) {
                    NotificationHelper.postRemote(applicationContext, n.key, n.title, n.body)
                    seen += n.key
                    changed = true
                }
            }
            if (changed) {
                val compact = seen.toList().takeLast(100).toSet()
                prefs.edit().putStringSet("seen_notices", compact).apply()
            }
        }

        runCatching {
            val localDb = DatabaseHelper(applicationContext)
            try {
                NotificationHelper.postLowStock(applicationContext, localDb.lowStockProducts())
            } finally {
                localDb.close()
            }
        }

        if (networkWorked) Result.success() else Result.retry()
    }

    companion object {
        private const val PERIODIC = "stockguard-periodic-sync"

        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            val periodic = PeriodicWorkRequestBuilder<SyncWorker>(1, TimeUnit.HOURS)
                .setConstraints(constraints)
                .build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                PERIODIC, ExistingPeriodicWorkPolicy.KEEP, periodic
            )
        }

        fun runNow(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            WorkManager.getInstance(context).enqueue(
                OneTimeWorkRequestBuilder<SyncWorker>().setConstraints(constraints).build()
            )
        }
    }
}
