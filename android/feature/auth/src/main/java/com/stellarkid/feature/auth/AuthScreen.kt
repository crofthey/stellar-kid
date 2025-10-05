package com.stellarkid.feature.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch

@Composable
fun AuthScreen(
    state: AuthUiState,
    onLogin: (email: String, password: String) -> Unit,
    onRegister: (email: String, password: String) -> Unit,
    onForgotPassword: (email: String) -> Unit,
) {
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    LaunchedEffect(state.errorMessage) {
        val message = state.errorMessage
        if (!message.isNullOrBlank()) {
            scope.launch { snackbarHostState.showSnackbar(message) }
        }
    }

    var selectedTab by remember { mutableIntStateOf(0) }
    var loginEmail by remember { mutableStateOf("") }
    var loginPassword by remember { mutableStateOf("") }
    var registerEmail by remember { mutableStateOf("") }
    var registerPassword by remember { mutableStateOf("") }
    var forgotEmail by remember { mutableStateOf("") }
    var isForgotDialogOpen by remember { mutableStateOf(false) }

    LaunchedEffect(state.resetToken) {
        val token = state.resetToken
        if (!token.isNullOrBlank()) {
            scope.launch {
                snackbarHostState.showSnackbar("Reset token: $token")
            }
        }
    }

    Surface(modifier = Modifier.fillMaxSize()) {
        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 24.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Text(
                    text = "StellarKid",
                    style = MaterialTheme.typography.headlineMedium,
                    textAlign = TextAlign.Center,
                )
                Spacer(modifier = Modifier.height(16.dp))
                TabRow(selectedTabIndex = selectedTab) {
                    Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }) {
                        Text(
                            text = "Login",
                            modifier = Modifier.padding(vertical = 12.dp, horizontal = 24.dp)
                        )
                    }
                    Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }) {
                        Text(
                            text = "Register",
                            modifier = Modifier.padding(vertical = 12.dp, horizontal = 24.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(24.dp))
                if (selectedTab == 0) {
                    AuthForm(
                        email = loginEmail,
                        password = loginPassword,
                        onEmailChange = { loginEmail = it },
                        onPasswordChange = { loginPassword = it },
                        primaryButtonLabel = "Sign In",
                        onPrimaryAction = { onLogin(loginEmail.trim(), loginPassword.trim()) },
                        isLoading = state.isLoading,
                    )
                    TextButton(onClick = { isForgotDialogOpen = true }) {
                        Text("Forgot password?")
                    }
                } else {
                    AuthForm(
                        email = registerEmail,
                        password = registerPassword,
                        onEmailChange = { registerEmail = it },
                        onPasswordChange = { registerPassword = it },
                        primaryButtonLabel = "Create Account",
                        onPrimaryAction = { onRegister(registerEmail.trim(), registerPassword.trim()) },
                        isLoading = state.isLoading,
                    )
                }
            }

            SnackbarHost(
                hostState = snackbarHostState,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(16.dp)
            )

            if (state.isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
        }
    }

    if (isForgotDialogOpen) {
        ForgotPasswordDialog(
            email = forgotEmail,
            onEmailChange = { forgotEmail = it },
            onDismiss = { isForgotDialogOpen = false },
            onSubmit = {
                onForgotPassword(forgotEmail.trim())
                isForgotDialogOpen = false
            }
        )
    }
}

@Composable
private fun AuthForm(
    email: String,
    password: String,
    onEmailChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    primaryButtonLabel: String,
    onPrimaryAction: () -> Unit,
    isLoading: Boolean,
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = email,
            onValueChange = onEmailChange,
            label = { Text("Email") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Email,
                imeAction = ImeAction.Next,
            ),
        )
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(
            value = password,
            onValueChange = onPasswordChange,
            label = { Text("Password") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done,
            ),
            keyboardActions = KeyboardActions(onDone = { onPrimaryAction() }),
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = onPrimaryAction,
            enabled = !isLoading && email.isNotBlank() && password.length >= 6,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(primaryButtonLabel)
        }
    }
}

@Composable
private fun ForgotPasswordDialog(
    email: String,
    onEmailChange: (String) -> Unit,
    onDismiss: () -> Unit,
    onSubmit: () -> Unit,
) {
    var localEmail by remember(email) { mutableStateOf(email) }
    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            Button(
                onClick = {
                    onEmailChange(localEmail)
                    onSubmit()
                },
                enabled = localEmail.isNotBlank(),
            ) {
                Text("Send reset link")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        },
        title = { Text("Forgot password") },
        text = {
            Column {
                Text("Enter the email associated with your account.")
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedTextField(
                    value = localEmail,
                    onValueChange = { localEmail = it },
                    label = { Text("Email") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    )
}

data class AuthUiState(
    val isInitialized: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val resetToken: String? = null,
)
