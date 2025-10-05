package com.stellarkid.feature.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.rememberTopAppBarState
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import com.stellarkid.core.model.Child
import kotlinx.coroutines.launch

@Composable
fun DashboardScreen(
    state: DashboardUiState,
    onCreateChild: (String) -> Unit,
    onDeleteChild: (Child) -> Unit,
    onSelectChild: (Child) -> Unit,
    onSubmitFeedback: (String) -> Unit,
    onChangePassword: (current: String, new: String) -> Unit,
    onLogout: () -> Unit,
    onClearMessages: () -> Unit,
) {
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    LaunchedEffect(state.message, state.errorMessage) {
        var consumed = false
        state.message?.let { msg ->
            consumed = true
            scope.launch { snackbarHostState.showSnackbar(msg) }
        }
        state.errorMessage?.let { msg ->
            consumed = true
            scope.launch { snackbarHostState.showSnackbar(msg) }
        }
        if (consumed) {
            onClearMessages()
        }
    }

    var newChildName by remember { mutableStateOf("") }
    var feedbackMessage by remember { mutableStateOf("") }
    var showPasswordDialog by remember { mutableStateOf(false) }

    Surface(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Dashboard") },
                    actions = {
                        TextButton(onClick = { showPasswordDialog = true }) {
                            Text("Change password")
                        }
                        IconButton(onClick = onLogout) {
                            Icon(Icons.Default.ExitToApp, contentDescription = "Logout")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(),
                    scrollBehavior = TopAppBarDefaults.pinnedScrollBehavior(rememberTopAppBarState())
                )
            },
            snackbarHost = { SnackbarHost(snackbarHostState) },
        ) { padding ->
            Column(
                modifier = Modifier
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(24.dp),
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Add a new child", style = MaterialTheme.typography.titleMedium)
                    OutlinedTextField(
                        value = newChildName,
                        onValueChange = { newChildName = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Child name") },
                        singleLine = true,
                        imeAction = ImeAction.Done,
                    )
                    Button(
                        onClick = {
                            onCreateChild(newChildName.trim())
                            newChildName = ""
                        },
                        enabled = newChildName.isNotBlank() && !state.isLoading,
                    ) {
                        Text("Create child")
                    }
                }

                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Children", style = MaterialTheme.typography.titleMedium)
                    if (state.children.isEmpty()) {
                        Text("No children yet. Add one to get started.")
                    } else {
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            items(state.children, key = { it.id }) { child ->
                                ChildCard(
                                    child = child,
                                    onView = { onSelectChild(child) },
                                    onDelete = { onDeleteChild(child) },
                                )
                            }
                        }
                    }
                }

                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Share feedback", style = MaterialTheme.typography.titleMedium)
                    OutlinedTextField(
                        value = feedbackMessage,
                        onValueChange = { feedbackMessage = it },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3,
                        maxLines = 5,
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Button(
                            onClick = {
                                onSubmitFeedback(feedbackMessage.trim())
                                feedbackMessage = ""
                            },
                            enabled = feedbackMessage.trim().length >= 5 && !state.isLoading,
                        ) {
                            Text("Send feedback")
                        }
                        TextButton(onClick = { feedbackMessage = "" }) {
                            Text("Clear")
                        }
                    }
                }
            }
        }
    }

    if (state.isLoading) {
        BoxLoading()
    }

    if (showPasswordDialog) {
        ChangePasswordDialog(
            onSubmit = { current, new ->
                onChangePassword(current, new)
                showPasswordDialog = false
            },
            onDismiss = { showPasswordDialog = false }
        )
    }
}

@Composable
private fun ChildCard(
    child: Child,
    onView: () -> Unit,
    onDelete: () -> Unit,
) {
    Surface(tonalElevation = 1.dp) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(child.name, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                Text("Prizes: ${child.prizeCount}")
            }
            Button(onClick = onView) {
                Text("View")
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Default.Delete, contentDescription = "Delete child")
            }
        }
    }
}

@Composable
private fun ChangePasswordDialog(
    onSubmit: (current: String, new: String) -> Unit,
    onDismiss: () -> Unit,
) {
    var currentPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }

    androidx.compose.material3.AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Change password") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = currentPassword,
                    onValueChange = { currentPassword = it },
                    label = { Text("Current password") },
                    singleLine = true,
                )
                OutlinedTextField(
                    value = newPassword,
                    onValueChange = { newPassword = it },
                    label = { Text("New password") },
                    singleLine = true,
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { onSubmit(currentPassword, newPassword) },
                enabled = currentPassword.length >= 6 && newPassword.length >= 6,
            ) {
                Text("Update")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
private fun BoxLoading() {
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.6f)
    ) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
    }
}

data class DashboardUiState(
    val children: List<Child> = emptyList(),
    val isLoading: Boolean = false,
    val message: String? = null,
    val errorMessage: String? = null,
)
