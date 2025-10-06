@file:OptIn(ExperimentalStdlibApi::class)

package com.stellarkid.app.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.stellarkid.app.data.auth.AuthRepository
import com.stellarkid.app.data.children.ChildrenRepository
import com.stellarkid.app.data.feedback.FeedbackRepository
import com.stellarkid.core.model.Child
import com.stellarkid.core.model.UpdateChildSettingsRequest
import com.stellarkid.feature.dashboard.DashboardUiState
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlin.ExperimentalStdlibApi

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val childrenRepository: ChildrenRepository,
    private val feedbackRepository: FeedbackRepository,
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState(isLoading = true))
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    private val _events = Channel<DashboardEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    init {
        viewModelScope.launch {
            authRepository.authState.collect { state ->
                if (state.user != null && state.isInitialized) {
                    refreshChildren()
                } else if (state.user == null && state.isInitialized) {
                    _uiState.value = DashboardUiState()
                }
            }
        }
    }

    fun refreshChildren() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, message = null, errorMessage = null) }
            val result = childrenRepository.getChildren()
            _uiState.update { current ->
                result.fold(
                    onSuccess = { children ->
                        current.copy(children = children, isLoading = false, message = null, errorMessage = null)
                    },
                    onFailure = { error ->
                        current.copy(isLoading = false, errorMessage = error.message ?: "Unable to load children")
                    }
                )
            }
        }
    }

    fun createChild(name: String) {
        if (name.isBlank()) return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, message = null, errorMessage = null) }
            val result = childrenRepository.createChild(name)
            _uiState.update { current ->
                result.fold(
                    onSuccess = { response ->
                        val updatedChildren = (current.children + response.child)
                            .sortedBy { it.name.lowercase() }
                        current.copy(
                            children = updatedChildren,
                            isLoading = false,
                            message = "${response.child.name} added!",
                            errorMessage = null,
                        )
                    },
                    onFailure = { error ->
                        current.copy(isLoading = false, errorMessage = error.message)
                    }
                )
            }
        }
    }

    fun deleteChild(child: Child) {
        viewModelScope.launch {
            val result = childrenRepository.deleteChild(child.id)
            _uiState.update { current ->
                result.fold(
                    onSuccess = {
                        current.copy(
                            children = current.children.filterNot { it.id == child.id },
                            message = "${child.name} removed",
                            errorMessage = null,
                        )
                    },
                    onFailure = { error ->
                        current.copy(errorMessage = error.message)
                    }
                )
            }
        }
    }

    fun selectChild(child: Child) {
        viewModelScope.launch {
            _events.send(DashboardEvent.NavigateToChild(child.id))
        }
    }

    fun submitFeedback(message: String) {
        if (message.length < 5) return
        viewModelScope.launch {
            val result = feedbackRepository.submitFeedback(message)
            _uiState.update { current ->
                result.fold(
                    onSuccess = { current.copy(message = "Feedback sent. Thank you!", errorMessage = null) },
                    onFailure = { current.copy(errorMessage = it.message) }
                )
            }
        }
    }

    fun changePassword(currentPassword: String, newPassword: String) {
        viewModelScope.launch {
            val result = authRepository.changePassword(currentPassword, newPassword)
            _uiState.update { current ->
                result.fold(
                    onSuccess = { current.copy(message = "Password updated", errorMessage = null) },
                    onFailure = { current.copy(errorMessage = it.message) }
                )
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            authRepository.logout()
        }
    }

    fun clearMessages() {
        _uiState.update { it.copy(message = null, errorMessage = null) }
    }
}

sealed interface DashboardEvent {
    data class NavigateToChild(val childId: String) : DashboardEvent
}
