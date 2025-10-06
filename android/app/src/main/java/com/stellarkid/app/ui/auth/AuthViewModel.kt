@file:OptIn(ExperimentalStdlibApi::class)

package com.stellarkid.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.stellarkid.app.data.auth.AuthRepository
import com.stellarkid.feature.auth.AuthUiState
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlin.ExperimentalStdlibApi

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    val authState = authRepository.authState

    init {
        viewModelScope.launch {
            authRepository.initialize()
        }
        viewModelScope.launch {
            authRepository.authState.collect { state ->
                _uiState.update { current ->
                    current.copy(
                        isInitialized = state.isInitialized,
                        isLoading = state.isLoading,
                    )
                }
            }
        }
    }

    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) return
        _uiState.update { it.copy(errorMessage = null) }
        viewModelScope.launch {
            val result = authRepository.login(email, password)
            handleResult(result)
        }
    }

    fun register(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) return
        _uiState.update { it.copy(errorMessage = null) }
        viewModelScope.launch {
            val result = authRepository.register(email, password)
            handleResult(result)
        }
    }

    fun forgotPassword(email: String) {
        if (email.isBlank()) return
        viewModelScope.launch {
            val result = authRepository.forgotPassword(email)
            _uiState.update { current ->
                current.copy(
                    errorMessage = result.exceptionOrNull()?.message,
                    resetToken = result.getOrNull(),
                    isLoading = false,
                )
            }
        }
    }

    fun resetPassword(token: String, password: String) {
        if (token.isBlank() || password.isBlank()) return
        viewModelScope.launch {
            val result = authRepository.resetPassword(token, password)
            handleResult(result)
        }
    }

    private fun handleResult(result: Result<Unit>) {
        _uiState.update { current ->
            current.copy(
                errorMessage = result.exceptionOrNull()?.message,
                resetToken = null,
                isLoading = false,
            )
        }
    }
}
