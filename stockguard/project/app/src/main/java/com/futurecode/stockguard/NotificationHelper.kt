package com.futurecode.stockguard

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.BitmapFactory
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

object NotificationHelper {
    const val CHANNEL_STOCK = "stock_alerts"
    const val CHANNEL_REMOTE = "future_code_notices"
    const val CHANNEL_UPDATE = "app_updates"

    fun createChannels(context: Context) {
        if (Build.VERSION.SDK_INT < 26) return
        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannels(listOf(
            NotificationChannel(CHANNEL_STOCK, "Stock Alerts", NotificationManager.IMPORTANCE_DEFAULT).apply {
                description = "Low stock and inventory warnings"
            },
            NotificationChannel(CHANNEL_REMOTE, "Future Code Notices", NotificationManager.IMPORTANCE_DEFAULT).apply {
                description = "Remote notices from Future Code"
            },
            NotificationChannel(CHANNEL_UPDATE, "App Updates", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "StockGuard update notifications"
            }
        ))
    }

    private fun allowed(context: Context): Boolean =
        Build.VERSION.SDK_INT < 33 ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

    private fun base(context: Context, channel: String, title: String, body: String): NotificationCompat.Builder {
        val open = PendingIntent.getActivity(
            context,
            100,
            Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(context, channel)
            .setSmallIcon(R.drawable.ic_notification)
            .setLargeIcon(BitmapFactory.decodeResource(context.resources, R.drawable.ic_stockguard))
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setContentIntent(open)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
    }

    fun postLowStock(context: Context, products: List<Product>) {
        if (!allowed(context) || products.isEmpty()) return
        val first = products.take(5).joinToString(", ") { "${it.name} (${it.stock})" }
        val body = if (products.size > 5) "$first နှင့် အခြား ${products.size - 5} မျိုး" else first
        NotificationManagerCompat.from(context).notify(
            301,
            base(context, CHANNEL_STOCK, "Stock နည်းနေပါတယ်", body).build()
        )
    }

    fun postRemote(context: Context, key: String, title: String, body: String) {
        if (!allowed(context)) return
        NotificationManagerCompat.from(context).notify(
            1000 + (key.hashCode() and 0x3fff),
            base(context, CHANNEL_REMOTE, title, body).build()
        )
    }

    fun postUpdateAvailable(context: Context, info: ReleaseInfo) {
        if (!allowed(context)) return
        val intent = Intent(context, MainActivity::class.java)
            .putExtra("OPEN_UPDATE", true)
            .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        val pi = PendingIntent.getActivity(
            context, 201, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val n = base(
            context, CHANNEL_UPDATE,
            "StockGuard ${info.versionName} Update ရပါပြီ",
            info.notes.ifBlank { "Version အသစ်ကို Download လုပ်နိုင်ပါပြီ" }
        ).setContentIntent(pi).setPriority(NotificationCompat.PRIORITY_HIGH).build()
        NotificationManagerCompat.from(context).notify(201, n)
    }

    fun postUpdateReady(context: Context, filePath: String, sha256: String, versionName: String) {
        if (!allowed(context)) return
        val intent = Intent(context, InstallActivity::class.java)
            .putExtra("apk_path", filePath)
            .putExtra("sha256", sha256)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        val pi = PendingIntent.getActivity(
            context, 202, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val n = base(
            context, CHANNEL_UPDATE,
            "StockGuard $versionName Download ပြီးပါပြီ",
            "Install Update ကိုနှိပ်ပြီး version အသစ်တင်နိုင်ပါပြီ"
        )
            .setContentIntent(pi)
            .addAction(R.drawable.ic_notification, "Install Update", pi)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
        NotificationManagerCompat.from(context).notify(202, n)
    }

    fun postUpdateError(context: Context, message: String) {
        if (!allowed(context)) return
        NotificationManagerCompat.from(context).notify(
            203,
            base(context, CHANNEL_UPDATE, "Update မအောင်မြင်ပါ", message).build()
        )
    }
}
