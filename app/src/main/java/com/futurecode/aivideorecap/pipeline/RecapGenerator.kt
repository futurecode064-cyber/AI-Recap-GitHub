package com.futurecode.aivideorecap.pipeline

import com.futurecode.aivideorecap.model.RecapLength
import com.futurecode.aivideorecap.model.RecapScene
import com.futurecode.aivideorecap.model.RecapStyle
import com.futurecode.aivideorecap.model.TranscriptChunk
import kotlin.math.max

/** Zero-cost extractive recap generator. It never invents plot facts. */
object RecapGenerator {
    data class Result(val scenes: List<RecapScene>, val script: String)

    fun generate(chunks: List<TranscriptChunk>, length: RecapLength, style: RecapStyle): Result {
        val useful = chunks.filter { it.text.length >= 8 }
        if (useful.isEmpty()) return Result(emptyList(), "")
        val desiredScenes = max(1, (length.seconds / 9.0).toInt()).coerceAtMost(useful.size)
        val frequencies = tokenFrequencies(useful.joinToString(" ") { it.text })

        val scored = useful.mapIndexed { index, chunk ->
            val words = tokens(chunk.text)
            val lexical = words.sumOf { frequencies[it] ?: 0 }.toDouble() / max(1, words.size)
            val diversity = words.distinct().size.toDouble() / max(1, words.size)
            val positionBonus = when {
                index == 0 -> 1.8
                index == useful.lastIndex -> 1.5
                index < useful.size / 8 -> 0.8
                else -> 0.0
            }
            chunk to (lexical + diversity * 3.0 + positionBonus)
        }

        val picked = scored.sortedByDescending { it.second }
            .take(desiredScenes)
            .map { it.first }
            .sortedBy { it.startMs }

        val scenes = picked.map { chunk ->
            val caption = styleLine(shorten(chunk.text, if (style == RecapStyle.SHORT_FAST) 95 else 150), style)
            RecapScene(chunk.startMs, chunk.endMs, caption)
        }
        return Result(scenes, scenes.joinToString("\n") { it.caption })
    }

    private fun tokenFrequencies(text: String): Map<String, Int> {
        val stop = setOf("the","a","an","and","or","to","of","is","are","was","were","in","on","at","for","it","this","that")
        return tokens(text).filterNot { it in stop }.groupingBy { it }.eachCount()
    }

    private fun tokens(text: String): List<String> = text.lowercase()
        .split(Regex("[^\\p{L}\\p{N}]+"))
        .filter { it.length > 1 }

    private fun shorten(text: String, max: Int): String {
        val cleaned = text.replace(Regex("\\s+"), " ").trim()
        if (cleaned.length <= max) return cleaned
        val cut = cleaned.take(max)
        val boundary = cut.lastIndexOfAny(charArrayOf('.', '!', '?', '။'))
        return (if (boundary > max / 2) cut.take(boundary + 1) else cut.substringBeforeLast(' ', cut)).trim()
    }

    private fun styleLine(text: String, style: RecapStyle): String = when (style) {
        RecapStyle.STORYTELLING -> text
        RecapStyle.SHORT_FAST -> text.removeSuffix(".") + "."
        RecapStyle.DRAMATIC -> text.removeSuffix(".") + "…"
        RecapStyle.FUNNY -> text // Do not fabricate jokes or events not present in the transcript.
    }
}
