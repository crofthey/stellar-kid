package com.stellarkid.app.ui.chart

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.stellarkid.app.data.children.ChildrenRepository
import com.stellarkid.app.util.weekDayLabels
import com.stellarkid.app.util.weekLabel
import com.stellarkid.app.util.toWeekInfo
import com.stellarkid.core.model.ChartWeek
import com.stellarkid.core.model.Child
import com.stellarkid.core.model.PrizeMode
import com.stellarkid.core.model.SlotState
import com.stellarkid.core.model.UpdateChildSettingsRequest
import com.stellarkid.core.model.UpdateSlotRequest
import com.stellarkid.feature.chart.ChartUiState
import dagger.hilt.android.lifecycle.HiltViewModel
import java.time.LocalDate
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

@HiltViewModel
class ChartViewModel @Inject constructor(
    private val savedStateHandle: SavedStateHandle,
    private val childrenRepository: ChildrenRepository,
) : ViewModel() {

    private val childId: String = requireNotNull(savedStateHandle.get<String>("childId"))
    private val _uiState = MutableStateFlow(ChartUiState(isLoading = true))
    val uiState: StateFlow<ChartUiState> = _uiState.asStateFlow()

    private var currentDate: LocalDate = LocalDate.now()
    private var currentChild: Child? = null

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, message = null, errorMessage = null) }
            val childrenResult = childrenRepository.getChildren()
            childrenResult.onFailure { error ->
                _uiState.update { it.copy(isLoading = false, errorMessage = error.message ?: "Unable to load child") }
            }
            childrenResult.onSuccess { children ->
                val child = children.firstOrNull { it.id == childId }
                if (child == null) {
                    _uiState.update { it.copy(isLoading = false, errorMessage = "Child not found") }
                } else {
                    currentChild = child
                    loadWeek(child)
                }
            }
        }
    }

    fun previousWeek() {
        currentDate = currentDate.minusWeeks(1)
        currentChild?.let { loadWeek(it) }
    }

    fun nextWeek() {
        currentDate = currentDate.plusWeeks(1)
        currentChild?.let { loadWeek(it) }
    }

    fun renameChild(name: String) {
        val child = currentChild ?: return
        if (name.isBlank() || name == child.name) return
        viewModelScope.launch {
            val result = childrenRepository.updateChildSettings(child.id, UpdateChildSettingsRequest(name = name))
            _uiState.update { current ->
                result.fold(
                    onSuccess = { updatedChild ->
                        currentChild = updatedChild
                        current.copy(child = updatedChild, message = "Name updated", errorMessage = null)
                    },
                    onFailure = { error ->
                        current.copy(errorMessage = error.message)
                    }
                )
            }
        }
    }

    fun changePrizeMode(mode: PrizeMode) {
        val child = currentChild ?: return
        if (mode == child.prizeMode) return
        viewModelScope.launch {
            val result = childrenRepository.updateChildSettings(child.id, UpdateChildSettingsRequest(prizeMode = mode))
            _uiState.update { current ->
                result.fold(
                    onSuccess = { updatedChild ->
                        currentChild = updatedChild
                        current.copy(child = updatedChild, prizeMode = updatedChild.prizeMode, message = "Prize mode updated", errorMessage = null)
                    },
                    onFailure = { error ->
                        current.copy(errorMessage = error.message)
                    }
                )
            }
        }
    }

    fun resetChart() {
        val child = currentChild ?: return
        val info = currentDate.toWeekInfo()
        viewModelScope.launch {
            val result = childrenRepository.resetChart(child.id, info.year, info.week)
            _uiState.update { current ->
                result.fold(
                    onSuccess = { response ->
                        currentChild = response.child
                        current.copy(
                            child = response.child,
                            chartWeek = response.chartWeek,
                            message = "Chart reset",
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

    fun clearMessages() {
        _uiState.update { it.copy(message = null, errorMessage = null) }
    }

    fun toggleSlot(dayIndex: Int, slotIndex: Int, currentState: SlotState) {
        val child = currentChild ?: return
        val info = currentDate.toWeekInfo()
        val nextState = when (currentState) {
            SlotState.EMPTY -> SlotState.STAR
            SlotState.STAR -> SlotState.CROSS
            SlotState.CROSS -> SlotState.EMPTY
        }
        viewModelScope.launch {
            val result = childrenRepository.updateSlot(
                childId = child.id,
                year = info.year,
                week = info.week,
                request = UpdateSlotRequest(dayIndex, slotIndex, nextState)
            )
            _uiState.update { current ->
                result.fold(
                    onSuccess = { response ->
                        val updatedChild = response.child ?: currentChild
                        if (updatedChild != null) currentChild = updatedChild
                        current.copy(
                            chartWeek = response.chartWeek,
                            child = updatedChild,
                            prizeMode = updatedChild?.prizeMode ?: current.prizeMode,
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

    private fun loadWeek(child: Child) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, message = null, errorMessage = null) }
            val info = currentDate.toWeekInfo()
            val result = childrenRepository.getChartWeek(child.id, info.year, info.week)
            _uiState.update { current ->
                result.fold(
                    onSuccess = { chartWeek ->
                        current.copy(
                            child = child,
                            chartWeek = chartWeek,
                            weekLabel = currentDate.weekLabel(),
                            dayLabels = currentDate.weekDayLabels(),
                            prizeMode = child.prizeMode,
                            isLoading = false,
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
}
