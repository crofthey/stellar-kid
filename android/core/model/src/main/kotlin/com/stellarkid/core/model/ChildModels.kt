package com.stellarkid.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class BackgroundPattern {
    @SerialName("confetti") CONFETTI,
    @SerialName("rainbow") RAINBOW,
    @SerialName("meadow") MEADOW,
    @SerialName("ocean") OCEAN,
}

@Serializable
enum class PrizeTargetType {
    @SerialName("stars") STARS,
    @SerialName("days") DAYS,
    @SerialName("weeks") WEEKS,
}

@Serializable
enum class PrizeMode {
    @SerialName("daily") DAILY,
    @SerialName("weekly") WEEKLY,
}

@Serializable
data class PrizeTarget(
    @SerialName("id") val id: String,
    @SerialName("childId") val childId: String,
    @SerialName("name") val name: String,
    @SerialName("type") val type: PrizeTargetType,
    @SerialName("targetCount") val targetCount: Int,
    @SerialName("isAchieved") val isAchieved: Boolean,
    @SerialName("achievedAt") val achievedAt: Long? = null,
)

@Serializable
data class Child(
    @SerialName("id") val id: String,
    @SerialName("parentId") val parentId: String,
    @SerialName("name") val name: String,
    @SerialName("prizeCount") val prizeCount: Int,
    @SerialName("prizeMode") val prizeMode: PrizeMode,
    @SerialName("prizeTargets") val prizeTargets: List<PrizeTarget> = emptyList(),
    @SerialName("totalStars") val totalStars: Int = 0,
    @SerialName("totalPerfectDays") val totalPerfectDays: Int = 0,
    @SerialName("totalPerfectWeeks") val totalPerfectWeeks: Int = 0,
    @SerialName("spentStars") val spentStars: Int = 0,
    @SerialName("spentPerfectDays") val spentPerfectDays: Int = 0,
    @SerialName("spentPerfectWeeks") val spentPerfectWeeks: Int = 0,
    @SerialName("backgroundPattern") val backgroundPattern: BackgroundPattern = BackgroundPattern.CONFETTI,
)

@Serializable
data class CreateChildRequest(
    @SerialName("name") val name: String,
)

@Serializable
data class CreateChildResponse(
    @SerialName("child") val child: Child,
    @SerialName("user") val user: User,
)

@Serializable
data class UpdateChildSettingsRequest(
    @SerialName("name") val name: String? = null,
    @SerialName("prizeMode") val prizeMode: PrizeMode? = null,
    @SerialName("backgroundPattern") val backgroundPattern: BackgroundPattern? = null,
)

@Serializable
data class PrizeTargetMutation(
    @SerialName("name") val name: String? = null,
    @SerialName("type") val type: PrizeTargetType? = null,
    @SerialName("targetCount") val targetCount: Int? = null,
)
