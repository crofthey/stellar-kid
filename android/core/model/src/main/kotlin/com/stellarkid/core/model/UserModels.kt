package com.stellarkid.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class User(
    @SerialName("id") val id: String,
    @SerialName("email") val email: String,
    @SerialName("childIds") val childIds: List<String> = emptyList(),
    @SerialName("lastLoginAt") val lastLoginAt: Long? = null,
    @SerialName("loginCount") val loginCount: Int? = null,
    @SerialName("lastInteractionAt") val lastInteractionAt: Long? = null,
)
