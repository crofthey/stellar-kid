package com.stellarkid.core.network

import com.stellarkid.core.model.ApiResponse
import com.stellarkid.core.model.FeedbackRequest
import retrofit2.http.Body
import retrofit2.http.POST

interface FeedbackService {
    @POST("/api/feedback")
    suspend fun submitFeedback(@Body request: FeedbackRequest): ApiResponse<Unit>
}
