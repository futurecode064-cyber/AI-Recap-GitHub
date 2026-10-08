package com.futurecode.aivideorecap.pipeline

import com.futurecode.aivideorecap.model.RecapScene
import java.io.File

object SubtitleWriter {
    fun writeSrt(scenes: List<RecapScene>, file: File, narrationDurationsMs: List<Long>? = null) {
        var cursor = 0L
        val enabled = scenes.filter { it.enabled }
        val body = buildString {
            enabled.forEachIndexed { index, scene ->
                val duration = narrationDurationsMs?.getOrNull(index)
                    ?: (scene.endMs - scene.startMs).coerceIn(1500L, 12_000L)
                append(index + 1).append('\n')
                append(time(cursor)).append(" --> ").append(time(cursor + duration)).append('\n')
                append(scene.caption).append("\n\n")
                cursor += duration
            }
        }
        file.writeText(body, Charsets.UTF_8)
    }

    private fun time(ms: Long): String {
        val h = ms / 3_600_000
        val m = (ms % 3_600_000) / 60_000
        val s = (ms % 60_000) / 1000
        val milli = ms % 1000
        return "%02d:%02d:%02d,%03d".format(h, m, s, milli)
    }
}
