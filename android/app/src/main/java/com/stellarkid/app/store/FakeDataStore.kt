package com.stellarkid.app.store

import com.stellarkid.core.model.ChartWeek
import com.stellarkid.core.model.Child
import com.stellarkid.core.model.CreateChildResponse
import com.stellarkid.core.model.PrizeMode
import com.stellarkid.core.model.PrizeTarget
import com.stellarkid.core.model.PrizeTargetMutation
import com.stellarkid.core.model.PrizeTargetType
import com.stellarkid.core.model.ResetChartResponse
import com.stellarkid.core.model.SlotState
import com.stellarkid.core.model.UpdateChildSettingsRequest
import com.stellarkid.core.model.UpdateSlotRequest
import com.stellarkid.core.model.UpdateSlotResponse
import com.stellarkid.core.model.User
import java.util.UUID
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

/**
 * Extremely lightweight in-memory store to keep the Compose demo running without
 * network, datastore, or DI wiring. Everything resets with process death.
 */
object FakeDataStore {

    data class AuthState(
        val user: User? = null,
        val token: String? = null,
        val isInitialized: Boolean = false,
        val isLoading: Boolean = false,
    )

    private val demoUserEmail = "demo@example.com"
    private val demoUser: User = User(
        id = UUID.nameUUIDFromBytes(demoUserEmail.toByteArray()).toString(),
        email = demoUserEmail,
    )

    private val _authState = MutableStateFlow(AuthState())
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    val children = MutableStateFlow(createInitialChildren())
    private val chartWeeks = mutableMapOf<String, MutableMap<String, ChartWeek>>()

    fun initializeAuth() {
        _authState.update { it.copy(isInitialized = true, isLoading = false) }
    }

    fun login(email: String, password: String): Result<Unit> {
        if (password.length < 4) {
            return Result.failure(IllegalArgumentException("Password must be at least 4 characters"))
        }
        _authState.value = AuthState(
            user = createUser(email),
            token = UUID.randomUUID().toString(),
            isInitialized = true,
            isLoading = false,
        )
        return Result.success(Unit)
    }

    fun register(email: String, password: String): Result<Unit> = login(email, password)

    fun logout() {
        _authState.value = AuthState(isInitialized = true)
    }

    fun forgotPassword(email: String): Result<String?> {
        if (email.isBlank()) return Result.failure(IllegalArgumentException("Email required"))
        return Result.success("reset-${UUID.randomUUID().toString().take(6)}")
    }

    fun resetPassword(token: String, password: String): Result<Unit> {
        if (token.isBlank() || password.length < 4) {
            return Result.failure(IllegalArgumentException("Invalid reset details"))
        }
        return Result.success(Unit)
    }

    fun changePassword(currentPassword: String, newPassword: String): Result<Unit> {
        if (currentPassword.length < 4 || newPassword.length < 4) {
            return Result.failure(IllegalArgumentException("Password must be at least 4 characters"))
        }
        return Result.success(Unit)
    }

    fun submitFeedback(message: String): Result<Unit> {
        return if (message.length < 5) {
            Result.failure(IllegalArgumentException("Message too short"))
        } else {
            Result.success(Unit)
        }
    }

    fun getChildren(): Result<List<Child>> = Result.success(children.value)

    fun createChild(name: String): Result<CreateChildResponse> {
        if (name.isBlank()) return Result.failure(IllegalArgumentException("Name required"))
        val child = Child(
            id = UUID.randomUUID().toString(),
            parentId = currentUser().id,
            name = name,
            prizeCount = 0,
            prizeMode = PrizeMode.DAILY,
        )
        children.update { (it + child).sortedBy { existing -> existing.name.lowercase() } }
        return Result.success(CreateChildResponse(child = child, user = currentUser()))
    }

    fun deleteChild(childId: String): Result<Unit> {
        children.update { list -> list.filterNot { it.id == childId } }
        chartWeeks.remove(childId)
        return Result.success(Unit)
    }

    fun updateChildSettings(childId: String, settings: UpdateChildSettingsRequest): Result<Child> {
        var updated: Child? = null
        children.update { list ->
            list.map { child ->
                if (child.id == childId) {
                    val renamed = settings.name?.let { child.copy(name = it) } ?: child
                    val withMode = settings.prizeMode?.let { renamed.copy(prizeMode = it) } ?: renamed
                    val withPattern = settings.backgroundPattern?.let { withMode.copy(backgroundPattern = it) } ?: withMode
                    updated = withPattern
                    withPattern
                } else child
            }
        }
        return updated?.let { Result.success(it) }
            ?: Result.failure(IllegalArgumentException("Child not found"))
    }

    fun updatePrizeMode(childId: String, mode: PrizeMode): Result<Child> = updateChild(childId) { it.copy(prizeMode = mode) }

    fun getChartWeek(childId: String, year: Int, week: Int): Result<ChartWeek> {
        val chartWeek = fetchOrCreateWeek(childId, year, week)
        return Result.success(chartWeek)
    }

    fun updateSlot(
        childId: String,
        year: Int,
        week: Int,
        request: UpdateSlotRequest,
    ): Result<UpdateSlotResponse> {
        val chartWeek = fetchOrCreateWeek(childId, year, week)
        val updated = chartWeek.copy(
            data = chartWeek.data.mapValues { (day, slots) ->
                if (day == request.dayIndex) {
                    slots.mapIndexed { index, slot -> if (index == request.slotIndex) request.state else slot }
                } else slots
            }
        )
        storeWeek(childId, year, week, updated)
        val child = children.value.firstOrNull { it.id == childId }
        return Result.success(UpdateSlotResponse(chartWeek = updated, child = child))
    }

    fun resetChart(childId: String, year: Int, week: Int): Result<ResetChartResponse> {
        val reset = createEmptyWeek(childId, year, week)
        storeWeek(childId, year, week, reset)
        val child = children.value.firstOrNull { it.id == childId }
            ?: return Result.failure(IllegalArgumentException("Child not found"))
        return Result.success(ResetChartResponse(chartWeek = reset, child = child))
    }

    private fun updateChild(childId: String, transform: (Child) -> Child): Result<Child> {
        var updated: Child? = null
        children.update { list ->
            list.map { child ->
                if (child.id == childId) {
                    val transformed = transform(child)
                    updated = transformed
                    transformed
                } else child
            }
        }
        return updated?.let { Result.success(it) }
            ?: Result.failure(IllegalArgumentException("Child not found"))
    }

    private fun fetchOrCreateWeek(childId: String, year: Int, week: Int): ChartWeek {
        val childWeeks = chartWeeks.getOrPut(childId) { mutableMapOf() }
        val key = weekKey(year, week)
        return childWeeks.getOrPut(key) { createEmptyWeek(childId, year, week) }
    }

    private fun storeWeek(childId: String, year: Int, week: Int, chartWeek: ChartWeek) {
        val childWeeks = chartWeeks.getOrPut(childId) { mutableMapOf() }
        childWeeks[weekKey(year, week)] = chartWeek
    }

    private fun createEmptyWeek(childId: String, year: Int, week: Int): ChartWeek {
        val data = (0 until 7).associateWith { List(3) { SlotState.EMPTY } }
        return ChartWeek(id = "$childId-$year-$week", data = data)
    }

    private fun weekKey(year: Int, week: Int): String = "$year-$week"

    private fun createUser(email: String): User = User(
        id = UUID.nameUUIDFromBytes(email.toByteArray()).toString(),
        email = email,
    )

    private fun currentUser(): User = _authState.value.user ?: demoUser

    private fun createInitialChildren(): List<Child> = listOf(
        Child(
            id = UUID.randomUUID().toString(),
            parentId = demoUser.id,
            name = "Luna",
            prizeCount = 3,
            prizeMode = PrizeMode.DAILY,
            prizeTargets = listOf(
                PrizeTarget(
                    id = UUID.randomUUID().toString(),
                    childId = demoUser.id,
                    name = "Cinema trip",
                    type = PrizeTargetType.STARS,
                    targetCount = 20,
                    isAchieved = false,
                )
            ),
        ),
        Child(
            id = UUID.randomUUID().toString(),
            parentId = demoUser.id,
            name = "Orion",
            prizeCount = 1,
            prizeMode = PrizeMode.WEEKLY,
        ),
    )
}
