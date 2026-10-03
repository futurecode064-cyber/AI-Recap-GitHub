package com.futurecode.aivideorecap.pipeline

import android.content.Context
import android.media.AudioFormat
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.net.Uri
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.roundToInt

/** Decodes a video's first audio track to raw PCM 16-bit, mono, 16 kHz. */
class AudioDecoder(private val context: Context) {
    fun decode16kMono(uri: Uri, output: File) {
        val extractor = MediaExtractor()
        context.contentResolver.openAssetFileDescriptor(uri, "r")!!.use { afd ->
            if (afd.length >= 0) extractor.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
            else extractor.setDataSource(afd.fileDescriptor)
        }
        var trackIndex = -1
        var inputFormat: MediaFormat? = null
        for (i in 0 until extractor.trackCount) {
            val f = extractor.getTrackFormat(i)
            val mime = f.getString(MediaFormat.KEY_MIME).orEmpty()
            if (mime.startsWith("audio/")) {
                trackIndex = i
                inputFormat = f
                break
            }
        }
        require(trackIndex >= 0 && inputFormat != null) { "No audio track found in this video." }
        extractor.selectTrack(trackIndex)

        val mime = inputFormat!!.getString(MediaFormat.KEY_MIME)!!
        val codec = MediaCodec.createDecoderByType(mime)
        codec.configure(inputFormat, null, null, 0)
        codec.start()

        FileOutputStream(output).use { out ->
            val info = MediaCodec.BufferInfo()
            var inputDone = false
            var outputDone = false
            var sampleRate = inputFormat!!.getInteger(MediaFormat.KEY_SAMPLE_RATE)
            var channels = inputFormat!!.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
            var pcmEncoding = AudioFormat.ENCODING_PCM_16BIT

            while (!outputDone) {
                if (!inputDone) {
                    val inIndex = codec.dequeueInputBuffer(10_000)
                    if (inIndex >= 0) {
                        val inBuf = codec.getInputBuffer(inIndex)!!
                        val size = extractor.readSampleData(inBuf, 0)
                        if (size < 0) {
                            codec.queueInputBuffer(inIndex, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                            inputDone = true
                        } else {
                            codec.queueInputBuffer(inIndex, 0, size, extractor.sampleTime, 0)
                            extractor.advance()
                        }
                    }
                }

                when (val outIndex = codec.dequeueOutputBuffer(info, 10_000)) {
                    MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                        val f = codec.outputFormat
                        sampleRate = f.getInteger(MediaFormat.KEY_SAMPLE_RATE)
                        channels = f.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
                        if (f.containsKey(MediaFormat.KEY_PCM_ENCODING)) {
                            pcmEncoding = f.getInteger(MediaFormat.KEY_PCM_ENCODING)
                        }
                    }
                    MediaCodec.INFO_TRY_AGAIN_LATER -> Unit
                    else -> if (outIndex >= 0) {
                        val outBuf = codec.getOutputBuffer(outIndex)!!
                        outBuf.position(info.offset)
                        outBuf.limit(info.offset + info.size)
                        if (info.size > 0) {
                            when (pcmEncoding) {
                                AudioFormat.ENCODING_PCM_16BIT -> writePcm16Resampled(outBuf, sampleRate, channels, out)
                                AudioFormat.ENCODING_PCM_FLOAT -> writePcmFloatResampled(outBuf, sampleRate, channels, out)
                                else -> error("Unsupported decoded PCM encoding: $pcmEncoding")
                            }
                        }
                        outputDone = info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0
                        codec.releaseOutputBuffer(outIndex, false)
                    }
                }
            }
        }
        codec.stop()
        codec.release()
        extractor.release()
    }

    private fun writePcm16Resampled(buffer: ByteBuffer, sourceRate: Int, channels: Int, out: FileOutputStream) {
        buffer.order(ByteOrder.LITTLE_ENDIAN)
        val frameCount = buffer.remaining() / 2 / channels
        if (frameCount <= 0) return
        val mono = ShortArray(frameCount)
        for (i in 0 until frameCount) {
            var sum = 0
            repeat(channels) { sum += buffer.short.toInt() }
            mono[i] = (sum / channels).coerceIn(Short.MIN_VALUE.toInt(), Short.MAX_VALUE.toInt()).toShort()
        }
        writeResampledShorts(mono, sourceRate, out)
    }

    private fun writePcmFloatResampled(buffer: ByteBuffer, sourceRate: Int, channels: Int, out: FileOutputStream) {
        buffer.order(ByteOrder.LITTLE_ENDIAN)
        val frameCount = buffer.remaining() / 4 / channels
        if (frameCount <= 0) return
        val mono = ShortArray(frameCount)
        for (i in 0 until frameCount) {
            var sum = 0f
            repeat(channels) { sum += buffer.float }
            val v = (sum / channels).coerceIn(-1f, 1f)
            mono[i] = (v * Short.MAX_VALUE).roundToInt().toShort()
        }
        writeResampledShorts(mono, sourceRate, out)
    }

    private fun writeResampledShorts(input: ShortArray, sourceRate: Int, out: FileOutputStream) {
        val targetRate = 16_000
        val outputFrames = ((input.size.toLong() * targetRate) / sourceRate).toInt().coerceAtLeast(1)
        val bytes = ByteArray(outputFrames * 2)
        var p = 0
        for (i in 0 until outputFrames) {
            val src = ((i.toLong() * sourceRate) / targetRate).toInt().coerceIn(0, input.lastIndex)
            val s = input[src].toInt()
            bytes[p++] = (s and 0xff).toByte()
            bytes[p++] = ((s ushr 8) and 0xff).toByte()
        }
        out.write(bytes)
    }
}
