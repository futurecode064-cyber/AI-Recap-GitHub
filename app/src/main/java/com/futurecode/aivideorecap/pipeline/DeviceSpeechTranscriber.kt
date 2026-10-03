package com.futurecode.aivideorecap.pipeline

import android.content.Context
import android.content.Intent
import android.media.AudioFormat
import android.os.Bundle
import android.os.ParcelFileDescriptor
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.futurecode.aivideorecap.model.RecapLanguage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Uses Android's device speech recognizer with injected 16 kHz mono PCM.
 * On-device recognition is preferred. If the device has no offline recognizer,
 * Android's default recognizer is used; that provider may require connectivity.
 */
class DeviceSpeechTranscriber(private val context: Context) {
    val mode: String
        get() = if (SpeechRecognizer.isOnDeviceRecognitionAvailable(context)) "On-device speech recognition" else "System speech recognition"

    suspend fun transcribe(chunk: PcmChunkFile, language: RecapLanguage): String = withContext(Dispatchers.Main) {
        suspendCancellableCoroutine { cont ->
            val recognizer = try {
                if (SpeechRecognizer.isOnDeviceRecognitionAvailable(context)) {
                    SpeechRecognizer.createOnDeviceSpeechRecognizer(context)
                } else {
                    SpeechRecognizer.createSpeechRecognizer(context)
                }
            } catch (e: Exception) {
                cont.resumeWithException(e)
                return@suspendCancellableCoroutine
            }

            val pfd = ParcelFileDescriptor.open(chunk.file, ParcelFileDescriptor.MODE_READ_ONLY)
            var finished = false
            fun finish(block: () -> Unit) {
                if (finished) return
                finished = true
                try { pfd.close() } catch (_: Exception) {}
                try { recognizer.destroy() } catch (_: Exception) {}
                block()
            }

            recognizer.setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) = Unit
                override fun onBeginningOfSpeech() = Unit
                override fun onRmsChanged(rmsdB: Float) = Unit
                override fun onBufferReceived(buffer: ByteArray?) = Unit
                override fun onEndOfSpeech() = Unit
                override fun onPartialResults(partialResults: Bundle?) = Unit
                override fun onEvent(eventType: Int, params: Bundle?) = Unit
                override fun onError(error: Int) {
                    if (error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                        finish { if (cont.isActive) cont.resume("") }
                    } else {
                        finish { if (cont.isActive) cont.resumeWithException(IllegalStateException("Speech recognizer error $error")) }
                    }
                }
                override fun onResults(results: Bundle?) {
                    val best = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull().orEmpty()
                    finish { if (cont.isActive) cont.resume(best.trim()) }
                }
            })

            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, language.tag)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE, pfd)
                putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_CHANNEL_COUNT, 1)
                putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_ENCODING, AudioFormat.ENCODING_PCM_16BIT)
                putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_SAMPLING_RATE, 16_000)
            }
            cont.invokeOnCancellation { finish {} }
            recognizer.startListening(intent)
        }
    }
}
