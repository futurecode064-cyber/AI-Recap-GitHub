@file:OptIn(androidx.media3.common.util.UnstableApi::class)

package com.futurecode.aivideorecap.ui

import android.content.Intent
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.PasswordVisualTransformation
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

private val gold = Color(0xFFD9B868)
private val appColors = darkColorScheme(
    primary = gold,
    onPrimary = Color(0xFF1B1915),
    background = Color(0xFF101216),
    surface = Color(0xFF1B1E24),
    onSurface = Color(0xFFF4F1EA),
    secondary = Color(0xFF92CEB2)
)

@Composable
fun RecapApp(vm: RecapViewModel = viewModel()) {
    val state by vm.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        uri?.let(vm::selectVideo)
    }
    var apiKey by remember { mutableStateOf(vm.savedApiKey()) }
    var showKey by remember { mutableStateOf(false) }
    val busy = state.stage in setOf(
        PipelineStage.PREPARING, PipelineStage.TRANSCRIBING,
        PipelineStage.UNDERSTANDING, PipelineStage.SELECTING,
        PipelineStage.NARRATING, PipelineStage.SUBTITLES, PipelineStage.RENDERING
    )
    MaterialTheme(colorScheme = appColors) {
        Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
                contentPadding = PaddingValues(top = 24.dp, bottom = 64.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    Text("FUTURE CODE  /  AI STUDIO", color = gold,
                        style = MaterialTheme.typography.labelLarge)
                    Spacer(Modifier.height(6.dp))
                    Text("Movie Recap Maker", style = MaterialTheme.typography.headlineMedium)
                    Text("Real AI video analysis • Burmese storytelling • Editable scenes",
                        style = MaterialTheme.typography.bodyMedium)
                }
                item {
                    Card(shape = RoundedCornerShape(20.dp), modifier = Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text("01  •  Analyze a video link", style = MaterialTheme.typography.titleLarge)
                            OutlinedTextField(
                                value = state.youtubeUrl,
                                onValueChange = vm::setYoutubeUrl,
                                label = { Text("Public YouTube link") },
                                placeholder = { Text("https://www.youtube.com/watch?v=…") },
                                modifier = Modifier.fillMaxWidth(), singleLine = true
                            )
                            OutlinedTextField(
                                value = apiKey,
                                onValueChange = { apiKey = it; vm.setApiKey(it) },
                                label = { Text("Your Gemini API key (kept on this device)") },
                                visualTransformation = if (showKey) androidx.compose.ui.text.input.VisualTransformation.None
                                    else PasswordVisualTransformation(),
                                modifier = Modifier.fillMaxWidth(), singleLine = true
                            )
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Checkbox(checked = showKey, onCheckedChange = { showKey = it })
                                Text("Show key", style = MaterialTheme.typography.bodySmall)
                                Spacer(Modifier.weight(1f))
                                TextButton(onClick = {
                                    context.startActivity(Intent(Intent.ACTION_VIEW,
                                        Uri.parse("https://aistudio.google.com/apikey")))
                                }) { Text("Get API key") }
                            }
                            Text("Supports public YouTube links only. Google analyzes the supplied link using your key. Free quotas and eligibility can change.",
                                style = MaterialTheme.typography.bodySmall)
                            Button(
                                onClick = vm::createLinkRecap,
                                modifier = Modifier.fillMaxWidth().height(52.dp),
                                enabled = !busy && state.youtubeUrl.isNotBlank() && apiKey.isNotBlank()
                            ) { Text("✦ Analyze & write Burmese recap") }
                        }
                    }
                }
                item {
                    Selector("02  •  Recap duration", RecapLength.entries,
                        state.recapLength, { it.label }, vm::setLength)
                }
                item {
                    Selector("03  •  Storytelling style", RecapStyle.entries,
                        state.style, { it.label }, vm::setStyle)
                }
                item {
                    Card(shape = RoundedCornerShape(20.dp), modifier = Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text("04  •  Optional video file for MP4",
                                style = MaterialTheme.typography.titleLarge)
                            Text(state.video?.name ?: "No local video selected")
                            state.video?.let { Text("Duration: ${formatTime(it.durationMs)}") }
                            OutlinedButton(onClick = { picker.launch(arrayOf("video/*")) },
                                modifier = Modifier.fillMaxWidth(), enabled = !busy) {
                                Text(if (state.video == null) "Choose a video you may use"
                                    else "Choose another video")
                            }
                            Text("To put movie footage into an exported MP4, select the corresponding video file you own or have permission to edit. The app does not download YouTube videos.",
                                style = MaterialTheme.typography.bodySmall)
                            HorizontalDivider()
                            Text("Offline fallback", style = MaterialTheme.typography.titleMedium)
                            Selector("Spoken source language", RecapLanguage.entries,
                                state.language, { it.label }, vm::setLanguage)
                            OutlinedButton(onClick = vm::createRecap,
                                enabled = !busy && state.video != null,
                                modifier = Modifier.fillMaxWidth()) {
                                Text("Create transcript-based recap from local video")
                            }
                            Text("Offline mode extracts important spoken moments; it is NOT the same as AI story understanding.",
                                style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
                if (state.stage != PipelineStage.IDLE) {
                    item {
                        Card(Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Text(state.stage.label, style = MaterialTheme.typography.titleMedium)
                                LinearProgressIndicator(progress = { state.progress },
                                    modifier = Modifier.fillMaxWidth())
                                Text(state.status)
                                if (state.recognizerMode.isNotBlank()) {
                                    Text(state.recognizerMode, style = MaterialTheme.typography.bodySmall)
                                }
                                state.error?.let {
                                    Text(it, color = MaterialTheme.colorScheme.error)
                                }
                            }
                        }
                    }
                }
                if (state.scenes.isNotEmpty()) {
                    item {
                        Text("05  •  Edit narration script",
                            style = MaterialTheme.typography.titleLarge)
                        Text("One line corresponds to one scene. Fix names, storytelling and pronunciation before export.",
                            style = MaterialTheme.typography.bodySmall)
                        OutlinedTextField(
                            value = state.script,
                            onValueChange = vm::updateScript,
                            modifier = Modifier.fillMaxWidth().heightIn(min = 200.dp),
                            enabled = !busy,
                            minLines = 7
                        )
                    }
                    item { Text("06  •  Choose & trim scenes",
                        style = MaterialTheme.typography.titleLarge) }
                    itemsIndexed(state.scenes) { index, scene ->
                        Card(Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(12.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Checkbox(checked = scene.enabled,
                                        onCheckedChange = { vm.toggleScene(index) }, enabled = !busy)
                                    Text("Scene ${index + 1}  •  ${formatTime(scene.startMs)} – ${formatTime(scene.endMs)}",
                                        style = MaterialTheme.typography.labelLarge)
                                }
                                Text(scene.caption, style = MaterialTheme.typography.bodySmall)
                                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    TextButton(onClick = { vm.shiftSceneEdge(index, true, -5000L) },
                                        enabled = !busy) { Text("Start −5s") }
                                    TextButton(onClick = { vm.shiftSceneEdge(index, true, 5000L) },
                                        enabled = !busy) { Text("Start +5s") }
                                    TextButton(onClick = { vm.shiftSceneEdge(index, false, -5000L) },
                                        enabled = !busy) { Text("End −5s") }
                                }
                                TextButton(onClick = { vm.shiftSceneEdge(index, false, 5000L) },
                                    enabled = !busy) { Text("Extend end +5s") }
                            }
                        }
                    }
                    item {
                        Card(Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                Text("07  •  Export", style = MaterialTheme.typography.titleLarge)
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Checkbox(checked = state.cloudVoiceEnabled,
                                        onCheckedChange = vm::setCloudVoiceEnabled, enabled = !busy)
                                    Column {
                                        Text("Use Gemini Cloud Burmese voice")
                                        Text("Optional • real Burmese AI voice • uses your API key and may consume paid/free quota",
                                            style = MaterialTheme.typography.bodySmall)
                                    }
                                }
                                Button(onClick = vm::exportVoiceover, modifier = Modifier.fillMaxWidth(),
                                    enabled = !busy) { Text("Generate Burmese voiceover WAV") }
                                OutlinedButton(onClick = vm::exportEdited, modifier = Modifier.fillMaxWidth(),
                                    enabled = !busy && state.video != null) {
                                    Text("Render edited MP4 with matching footage")
                                }
                                if (state.video == null) Text(
                                    "Choose the matching video file above to enable MP4 export. Voice-only WAV export does not need the movie file.",
                                    style = MaterialTheme.typography.bodySmall)
                                state.narrationPath?.let {
                                    Button(onClick = {
                                        vm.shareVoiceIntent()?.let { intent ->
                                            context.startActivity(Intent.createChooser(intent, "Share narration WAV"))
                                        }
                                    }, modifier = Modifier.fillMaxWidth()) {
                                        Text("Share voiceover WAV")
                                    }
                                }
                            }
                        }
                    }
                }
                state.outputPath?.let { file ->
                    item { VideoPreview(Uri.fromFile(File(file))) }
                    item {
                        Button(onClick = {
                            vm.shareIntent()?.let { intent ->
                                context.startActivity(Intent.createChooser(intent, "Share recap MP4"))
                            }
                        }, modifier = Modifier.fillMaxWidth()) { Text("Share exported MP4") }
                    }
                }
                item {
                    Text("Quality note: Myanmar TTS depends on available Android voices. If no compatible my-MM engine exists, the app will tell you; never treat original movie audio as a Burmese narrator. AI output may make mistakes: review the recap, timestamps and rights before publishing.",
                        style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}

@Composable
private fun <T> Selector(
    title: String, values: List<T>, selected: T,
    label: (T) -> String, select: (T) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(title, style = MaterialTheme.typography.titleMedium)
        FlowRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            values.forEach { value ->
                FilterChip(selected = value == selected,
                    onClick = { select(value) }, label = { Text(label(value)) })
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
        AndroidView(factory = { PlayerView(it).apply { this.player = player } },
            modifier = Modifier.fillMaxWidth().aspectRatio(16f / 9f))
    }
}
private fun formatTime(ms: Long): String {
    val sec = ms / 1000
    val h = sec / 3600
    val m = (sec % 3600) / 60
    val s = sec % 60
    return if (h > 0) "%d:%02d:%02d".format(h, m, s) else "%02d:%02d".format(m, s)
}
