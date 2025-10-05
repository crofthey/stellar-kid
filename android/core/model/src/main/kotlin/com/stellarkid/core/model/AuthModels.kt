package com.stellarkid.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class AuthResponse(
    @SerialName("token") val token: String,
    @SerialName("user") val user: User,
)

@Serializable
data class LoginRequest(
    @SerialName("email") val email: String,
    @SerialName("password") val password: String,
)

@Serializable
data class RegisterRequest(
    @SerialName("email") val email: String,
    @SerialName("password") val password: String,
)

@Serializable
data class ForgotPasswordRequest(
    @SerialName("email") val email: String,
)

@Serializable
data class ForgotPasswordResponse(
    @SerialName("resetToken") val resetToken: String? = null,
)

@Serializable
data class ResetPasswordRequest(
    @SerialName("token") val token: String,
    @SerialName("password") val password: String,
)

@Serializable
data class ChangePasswordRequest(
    @SerialName("currentPassword") val currentPassword: String,
    @SerialName("newPassword") val newPassword: String,
)
