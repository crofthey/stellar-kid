package com.stellarkid.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class SlotState {
    @SerialName("empty") EMPTY,
    @SerialName("star") STAR,
    @SerialName("cross") CROSS,
}

@Serializable
data class ChartWeek(
    @SerialName("id") val id: String,
    @SerialName("data") val data: WeekData,
)

@Serializable
data class UpdateSlotRequest(
    @SerialName("dayIndex") val dayIndex: Int,
    @SerialName("slotIndex") val slotIndex: Int,
    @SerialName("state") val state: SlotState,
)

@Serializable
data class UpdateSlotResponse(
    @SerialName("chartWeek") val chartWeek: ChartWeek,
    @SerialName("child") val child: Child? = null,
)

@Serializable
data class ResetChartResponse(
    @SerialName("chartWeek") val chartWeek: ChartWeek,
    @SerialName("child") val child: Child,
)

typealias DayState = List<SlotState>
typealias WeekData = Map<Int, DayState>
