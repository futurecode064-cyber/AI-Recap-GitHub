package com.futurecode.stockguard

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File

class InstallActivity : Activity() {
    private var waitingPermission = false
    private var path: String = ""
    private var expectedHash: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        path = intent.getStringExtra("apk_path").orEmpty()
        expectedHash = intent.getStringExtra("sha256").orEmpty()
        continueInstall()
    }

    override fun onResume() {
        super.onResume()
        if (waitingPermission && (Build.VERSION.SDK_INT < 26 || packageManager.canRequestPackageInstalls())) {
            waitingPermission = false
            continueInstall()
        }
    }

    private fun continueInstall() {
        val file = File(path)
        if (!UpdateService.verify(file, expectedHash)) {
            Toast.makeText(this, "Update APK verification failed", Toast.LENGTH_LONG).show()
            finish()
            return
        }

        if (Build.VERSION.SDK_INT >= 26 && !packageManager.canRequestPackageInstalls()) {
            waitingPermission = true
            startActivity(Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:$packageName")
            ))
            return
        }

        val uri = FileProvider.getUriForFile(this, "$packageName.fileprovider", file)
        val installIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        startActivity(installIntent)
        finish()
    }
}
