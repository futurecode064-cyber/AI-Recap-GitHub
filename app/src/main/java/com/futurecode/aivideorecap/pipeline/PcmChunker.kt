package com.futurecode.aivideorecap.pipeline

import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

data class PcmChunkFile(val file: File, val startMs: Long, val endMs: Long)

object PcmChunker {
    private const val SAMPLE_RATE = 16_000
    private const val BYTES_PER_SAMPLE = 2

    fun split(input: File, dir: File, chunkSeconds: Int = 24): List<PcmChunkFile> {
        dir.mkdirs()
        val bytesPerSecond = SAMPLE_RATE * BYTES_PER_SAMPLE
        val chunkBytes = bytesPerSecond * chunkSeconds
        val result = mutableListOf<PcmChunkFile>()
        FileInputStream(input).use { source ->
            var index = 0
            var offsetBytes = 0L
            val buffer = ByteArray(chunkBytes)
            while (true) {
                var read = 0
                while (read < buffer.size) {
                    val n = source.read(buffer, read, buffer.size - read)
                    if (n <= 0) break
                    read += n
                }
                if (read <= 0) break
                val file = File(dir, "chunk_${index.toString().padStart(4, '0')}.pcm")
                FileOutputStream(file).use { it.write(buffer, 0, read) }
                val startMs = offsetBytes * 1000L / bytesPerSecond
                val endMs = (offsetBytes + read) * 1000L / bytesPerSecond
                result += PcmChunkFile(file, startMs, endMs)
                offsetBytes += read
                index++
                if (read < buffer.size) break
            }
        }
        return result
    }
}
