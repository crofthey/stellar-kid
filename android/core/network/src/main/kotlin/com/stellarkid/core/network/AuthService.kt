package com.stellarkid.core.network

import com.stellarkid.core.model.ApiResponse
import com.stellarkid.core.model.AuthResponse
import com.stellarkid.core.model.ChangePasswordRequest
import com.stellarkid.core.model.ForgotPasswordRequest
import com.stellarkid.core.model.ForgotPasswordResponse
import com.stellarkid.core.model.LoginRequest
import com.stellarkid.core.model.RegisterRequest
import com.stellarkid.core.model.ResetPasswordRequest
import retrofit2.http.Body
import retrofit2.http.POST

interface AuthService {
    @POST("/api/auth/login")
    suspend fun login(@Body request: LoginRequest): ApiResponse<AuthResponse>

    @POST("/api/auth/register")
    suspend fun register(@Body request: RegisterRequest): ApiResponse<AuthResponse>

    @POST("/api/auth/forgot-password")
    suspend fun forgotPassword(@Body request: ForgotPasswordRequest): ApiResponse<ForgotPasswordResponse>

    @POST("/api/auth/reset-password")
    suspend fun resetPassword(@Body request: ResetPasswordRequest): ApiResponse<Unit>

    @POST("/api/auth/change-password")
    suspend fun changePassword(@Body request: ChangePasswordRequest): ApiResponse<Unit>
}
