package com.stellarkid.core.network

import com.stellarkid.core.model.ApiResponse
import com.stellarkid.core.model.User
import retrofit2.http.GET

interface UserService {
    @GET("/api/users/me")
    suspend fun me(): ApiResponse<User>
}
