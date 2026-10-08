package com.futurecode.aivideorecap.pipeline

import java.io.File
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import java.nio.ByteOrder

/**
 * Concatenates the PCM WAV utterances produced by Android TextToSpeech.
 * Rejects mismatched audio formats rather than producing corrupt audio.
 */
object WavJoiner {
    private data class Part(val format: ByteArray, val data: ByteArray)

    fun join(files: List<File>, result: File) {
        require(files.isNotEmpty()) { "No voice clips were generated." }
        val parts = files.map(::readPart)
        val format = parts.first().format
        require(parts.all { it.format.contentEquals(format) }) {
            "TTS returned incompatible audio formats between scenes."
        }
        val dataSize = parts.sumOf { it.data.size.toLong() }
        require(dataSize in 1..(Int.MAX_VALUE - 60).toLong()) { "Narration is too long for a WAV file." }
        result.parentFile?.mkdirs()
        RandomAccessFile(result, "rw").use { out ->
            out.setLength(0)
            out.write("RIFF".toByteArray(Charsets.US_ASCII))
            out.write(i32((20 + format.size + (format.size % 2) + dataSize).toInt()))
            out.write("WAVEfmt ".toByteArray(Charsets.US_ASCII))
            out.write(i32(format.size))
            out.write(format)
            if (format.size % 2 == 1) out.write(0)
            out.write("data".toByteArray(Charsets.US_ASCII))
            out.write(i32(dataSize.toInt()))
            parts.forEach { out.write(it.data) }
        }
    }

    private fun readPart(file: File): Part {
        val bytes = file.readBytes()
        require(bytes.size > 44 && String(bytes, 0, 4, Charsets.US_ASCII) == "RIFF" &&
            String(bytes, 8, 4, Charsets.US_ASCII) == "WAVE") {
            "The phone's TTS engine did not produce a WAV file."
        }
        var offset = 12
        var format: ByteArray? = null
        var audio: ByteArray? = null
        while (offset + 8 <= bytes.size) {
            val id = String(bytes, offset, 4, Charsets.US_ASCII)
            val size = int32(bytes, offset + 4)
            require(size >= 0 && offset + 8L + size <= bytes.size) { "Malformed WAV audio." }
            val begin = offset + 8
            when (id) {
                "fmt " -> format = bytes.copyOfRange(begin, begin + size)
                "data" -> audio = bytes.copyOfRange(begin, begin + size)
            }
            offset = begin + size + (size % 2)
        }
        val fmt = requireNotNull(format) { "Missing WAV format." }
        require(fmt.size >= 16 && int16(fmt, 0) == 1) {
            "The phone's TTS voice is not available in PCM audio format."
        }
        return Part(fmt, requireNotNull(audio) { "Missing speech audio." })
    }

    private fun int16(bytes: ByteArray, offset: Int): Int =
        ByteBuffer.wrap(bytes, offset, 2).order(ByteOrder.LITTLE_ENDIAN).short.toInt() and 65535
    private fun int32(bytes: ByteArray, offset: Int): Int =
        ByteBuffer.wrap(bytes, offset, 4).order(ByteOrder.LITTLE_ENDIAN).int
    private fun i32(value: Int): ByteArray =
        ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(value).array()
}
