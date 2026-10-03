@file:OptIn(androidx.media3.common.util.UnstableApi::class)

package com.futurecode.aivideorecap.ui

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.futurecode.aivideorecap.RecapViewModel
import com.futurecode.aivideorecap.model.*
import java.io.File

@Composable
fun RecapApp(vm: RecapViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri -> uri?.let(vm::selectVideo) }

    MaterialTheme {
        Surface(Modifier.fillMaxSize()) {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(horizontal = 18.dp),
                contentPadding = PaddingValues(top = 22.dp, bottom = 48.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    Text("AI Video Recap Maker", style = MaterialTheme.typography.headlineMedium)
                    Text("Private, local-first recap creation for videos you own or may use.", style = MaterialTheme.typography.bodyMedium)
                }

                item {
                    Card(shape = RoundedCornerShape(24.dp), modifier = Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text(state.video?.name ?: "No video selected", style = MaterialTheme.typography.titleMedium)
                            state.video?.let { Text("Duration: ${formatTime(it.durationMs)}") }
                            Button(onClick = { picker.launch(arrayOf("video/*")) }, modifier = Modifier.fillMaxWidth()) {
                                Text(if (state.video == null) "Select Video" else "Choose Another Video")
                            }
                        }
                    }
                }

                if (state.outputPath == null) {
                    item { Selector("Recap Length", RecapLength.entries, state.recapLength, { it.label }, vm::setLength) }
                    item { Selector("Language", RecapLanguage.entries, state.language, { it.label }, vm::setLanguage) }
                    item { Selector("Style", RecapStyle.entries, state.style, { it.label }, vm::setStyle) }
                    item {
                        Button(
                            onClick = vm::createRecap,
                            enabled = state.video != null && state.stage !in setOf(PipelineStage.PREPARING, PipelineStage.TRANSCRIBING, PipelineStage.UNDERSTANDING, PipelineStage.SELECTING, PipelineStage.NARRATING, PipelineStage.SUBTITLES, PipelineStage.RENDERING),
                            modifier = Modifier.fillMaxWidth().height(56.dp)
                        ) { Text("✨ Create Recap") }
                    }
                }

                if (state.stage != PipelineStage.IDLE) {
                    item {
                        Card(modifier = Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Text(state.stage.label, style = MaterialTheme.typography.titleMedium)
                                LinearProgressIndicator(progress = { state.progress }, modifier = Modifier.fillMaxWidth())
                                Text(state.status)
                                if (state.recognizerMode.isNotBlank()) Text(state.recognizerMode, style = MaterialTheme.typography.bodySmall)
                                state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                            }
                        }
                    }
                }

                state.outputPath?.let { output ->
                    item { VideoPreview(Uri.fromFile(File(output))) }
                    item {
                        Text("Edit Script", style = MaterialTheme.typography.titleLarge)
                        OutlinedTextField(
                            value = state.script,
                            onValueChange = vm::updateScript,
                            modifier = Modifier.fillMaxWidth().heightIn(min = 160.dp),
                            supportingText = { Text("One line is mapped to one selected scene. Edit and re-render locally.") }
                        )
                    }
                    item { Text("Edit Clips", style = MaterialTheme.typography.titleLarge) }
                    itemsIndexed(state.scenes) { index, scene ->
                        Card(Modifier.fillMaxWidth()) {
                            Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Checkbox(checked = scene.enabled, onCheckedChange = { vm.toggleScene(index) })
                                Column(Modifier.weight(1f)) {
                                    Text("${formatTime(scene.startMs)} – ${formatTime(scene.endMs)}")
                                    Text(scene.caption, style = MaterialTheme.typography.bodySmall)
                                }
                            }
                        }
                    }
                    item {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            OutlinedButton(onClick = vm::rerender, modifier = Modifier.weight(1f)) { Text("Re-render") }
                            Button(
                                onClick = { vm.shareIntent()?.let { context.startActivity(android.content.Intent.createChooser(it, "Share recap")) } },
                                modifier = Modifier.weight(1f)
                            ) { Text("Share MP4") }
                        }
                    }
                }

                item {
                    Text(
                        "No paid API or backend is required. Auto transcription uses Android speech recognition and prefers an on-device recognizer. Availability and Burmese TTS quality depend on the phone's installed speech/TTS engine.",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }
    }
}

@Composable
private fun <T> Selector(title: String, values: List<T>, selected: T, label: (T) -> String, select: (T) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(title, style = MaterialTheme.typography.titleMedium)
        FlowRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            values.forEach { value ->
                FilterChip(selected = value == selected, onClick = { select(value) }, label = { Text(label(value)) })
            }
        }
    }
}

@Composable
private fun VideoPreview(uri: Uri) {
    val context = LocalContext.current
    val player = remember(uri) {
        ExoPlayer.Builder(context).build().apply {
            setMediaItem(MediaItem.fromUri(uri)); prepare()
        }
    }
    DisposableEffect(player) { onDispose { player.release() } }
    Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp)) {
        AndroidView(factory = { PlayerView(it).apply { this.player = player } }, modifier = Modifier.fillMaxWidth().aspectRatio(16f / 9f))
    }
}

private fun formatTime(ms: Long): String {
    val sec = ms / 1000
    val h = sec / 3600
    val m = (sec % 3600) / 60
    val s = sec % 60
    return if (h > 0) "%d:%02d:%02d".format(h, m, s) else "%02d:%02d".format(m, s)
}
