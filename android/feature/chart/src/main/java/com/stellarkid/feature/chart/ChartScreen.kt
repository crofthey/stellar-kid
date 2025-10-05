package com.stellarkid.feature.chart

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardActions
import androidx.compose.ui.text.input.KeyboardOptions
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.stellarkid.core.model.ChartWeek
import com.stellarkid.core.model.Child
import com.stellarkid.core.model.PrizeMode
import com.stellarkid.core.model.SlotState

@Composable
fun ChartScreen(
    state: ChartUiState,
    onBack: () -> Unit,
    onPreviousWeek: () -> Unit,
    onNextWeek: () -> Unit,
    onToggleSlot: (dayIndex: Int, slotIndex: Int, currentState: SlotState) -> Unit,
    onRenameChild: (String) -> Unit,
    onChangePrizeMode: (PrizeMode) -> Unit,
    onResetChart: () -> Unit,
    onClearMessages: () -> Unit,
) {
    val child = state.child
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(state.message, state.errorMessage) {
        var consumed = false
        state.message?.let {
            consumed = true
            snackbarHostState.showSnackbar(it)
        }
        state.errorMessage?.let {
            consumed = true
            snackbarHostState.showSnackbar(it)
        }
        if (consumed) {
            onClearMessages()
        }
    }

    Surface(modifier = Modifier.fillMaxSize()) {
        Box(modifier = Modifier.fillMaxSize()) {
            when {
                state.isLoading && child == null -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                child == null -> EmptyState(onBack = onBack)
                else -> ChartContent(
                    child = child,
                    chartWeek = state.chartWeek,
                    weekTitle = state.weekLabel,
                    dayLabels = state.dayLabels,
                    onBack = onBack,
                    onPreviousWeek = onPreviousWeek,
                    onNextWeek = onNextWeek,
                    onToggleSlot = onToggleSlot,
                    onRenameChild = onRenameChild,
                    onChangePrizeMode = onChangePrizeMode,
                    onResetChart = onResetChart,
                    isLoading = state.isLoading,
                    prizeMode = state.prizeMode,
                )
            }

            SnackbarHost(
                hostState = snackbarHostState,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(16.dp)
            )
        }
    }
}

@Composable
private fun ChartContent(
    child: Child,
    chartWeek: ChartWeek?,
    weekTitle: String,
    dayLabels: List<String>,
    onBack: () -> Unit,
    onPreviousWeek: () -> Unit,
    onNextWeek: () -> Unit,
    onToggleSlot: (dayIndex: Int, slotIndex: Int, currentState: SlotState) -> Unit,
    onRenameChild: (String) -> Unit,
    onChangePrizeMode: (PrizeMode) -> Unit,
    onResetChart: () -> Unit,
    isLoading: Boolean,
    prizeMode: PrizeMode,
) {
    var renameValue by remember(child.id) { mutableStateOf(child.name) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = onBack) {
                Text("Back")
            }
            Column(modifier = Modifier.weight(1f)) {
                OutlinedTextField(
                    value = renameValue,
                    onValueChange = { renameValue = it },
                    label = { Text("Child name") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = {
                        if (renameValue.isNotBlank()) {
                            onRenameChild(renameValue.trim())
                        }
                    })
                )
            }
            Button(
                onClick = { onRenameChild(renameValue.trim()) },
                enabled = renameValue.isNotBlank() && renameValue != child.name,
            ) {
                Text("Save")
            }
        }

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Prize box", style = MaterialTheme.typography.titleMedium)
                Text("Prizes earned: ${child.prizeCount}")
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    PrizeModeOption(
                        title = "Daily",
                        selected = prizeMode == PrizeMode.DAILY,
                        onClick = { onChangePrizeMode(PrizeMode.DAILY) }
                    )
                    PrizeModeOption(
                        title = "Weekly",
                        selected = prizeMode == PrizeMode.WEEKLY,
                        onClick = { onChangePrizeMode(PrizeMode.WEEKLY) }
                    )
                }
            }
        }

        WeekNavigator(weekTitle = weekTitle, onPrevious = onPreviousWeek, onNext = onNextWeek)

        Divider()

        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            dayLabels.forEachIndexed { index, label ->
                val dayState = chartWeek?.data?.get(index) ?: listOf(SlotState.EMPTY, SlotState.EMPTY, SlotState.EMPTY)
                DayRow(
                    label = label,
                    dayState = dayState,
                    onToggleSlot = { slotIndex, currentState ->
                        onToggleSlot(index, slotIndex, currentState)
                    }
                )
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        Row(horizontalArrangement = Arrangement.End, modifier = Modifier.fillMaxWidth()) {
            TextButton(onClick = onResetChart) {
                Text("Reset chart")
            }
        }
    }

    if (isLoading) {
        Box(
            modifier = Modifier
                .fillMaxSize(),
            contentAlignment = Alignment.Center,
        ) {
            CircularProgressIndicator()
        }
    }
}

@Composable
private fun PrizeModeOption(title: String, selected: Boolean, onClick: () -> Unit) {
    Button(onClick = onClick, enabled = !selected) {
        Text(title)
    }
}

@Composable
private fun WeekNavigator(weekTitle: String, onPrevious: () -> Unit, onNext: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        TextButton(onClick = onPrevious) { Text("Previous") }
        Text(weekTitle, style = MaterialTheme.typography.titleMedium, textAlign = TextAlign.Center)
        TextButton(onClick = onNext) { Text("Next") }
    }
}

private val timeSlotLabels = listOf("Morning", "Afternoon", "Evening")

@Composable
private fun DayRow(
    label: String,
    dayState: List<SlotState>,
    onToggleSlot: (slotIndex: Int, currentState: SlotState) -> Unit,
) {
    Card {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(label, style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                dayState.forEachIndexed { index, slot ->
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(timeSlotLabels.getOrElse(index) { "" }, style = MaterialTheme.typography.bodySmall)
                        Spacer(modifier = Modifier.height(4.dp))
                        SlotButton(slotState = slot) {
                            onToggleSlot(index, slot)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SlotButton(slotState: SlotState, onClick: () -> Unit) {
    val (label, container, content) = when (slotState) {
        SlotState.EMPTY -> Triple("-", MaterialTheme.colorScheme.surfaceVariant, MaterialTheme.colorScheme.onSurfaceVariant)
        SlotState.STAR -> Triple("★", MaterialTheme.colorScheme.primary, MaterialTheme.colorScheme.onPrimary)
        SlotState.CROSS -> Triple("✕", MaterialTheme.colorScheme.error, MaterialTheme.colorScheme.onError)
    }
    Button(
        onClick = onClick,
        shape = CircleShape,
        colors = ButtonDefaults.buttonColors(
            containerColor = container,
            contentColor = content,
        ),
        modifier = Modifier.height(48.dp)
    ) {
        Text(label, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun EmptyState(onBack: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("Unable to load chart.", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onBack) {
            Text("Back to dashboard")
        }
    }
}

data class ChartUiState(
    val child: Child? = null,
    val chartWeek: ChartWeek? = null,
    val weekLabel: String = "",
    val dayLabels: List<String> = emptyList(),
    val isLoading: Boolean = false,
    val prizeMode: PrizeMode = PrizeMode.DAILY,
    val message: String? = null,
    val errorMessage: String? = null,
)
