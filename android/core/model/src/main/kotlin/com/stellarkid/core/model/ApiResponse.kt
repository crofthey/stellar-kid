package com.stellarkid.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ApiResponse<T>(
    @SerialName("success") val success: Boolean,
    @SerialName("data") val data: T? = null,
    @SerialName("error") val error: String? = null,
)
