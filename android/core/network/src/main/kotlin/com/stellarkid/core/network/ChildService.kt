package com.stellarkid.core.network

import com.stellarkid.core.model.ApiResponse
import com.stellarkid.core.model.ChartWeek
import com.stellarkid.core.model.Child
import com.stellarkid.core.model.CreateChildRequest
import com.stellarkid.core.model.CreateChildResponse
import com.stellarkid.core.model.PrizeTargetMutation
import com.stellarkid.core.model.ResetChartResponse
import com.stellarkid.core.model.UpdateChildSettingsRequest
import com.stellarkid.core.model.UpdateSlotRequest
import com.stellarkid.core.model.UpdateSlotResponse
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path

interface ChildService {
    @GET("/api/children")
    suspend fun getChildren(): ApiResponse<List<Child>>

    @POST("/api/children")
    suspend fun createChild(@Body request: CreateChildRequest): ApiResponse<CreateChildResponse>

    @DELETE("/api/children/{childId}")
    suspend fun deleteChild(@Path("childId") childId: String): ApiResponse<Unit>

    @POST("/api/children/{childId}/settings")
    suspend fun updateChildSettings(
        @Path("childId") childId: String,
        @Body request: UpdateChildSettingsRequest,
    ): ApiResponse<Child>

    @POST("/api/children/{childId}/prizes/increment")
    suspend fun incrementPrizes(@Path("childId") childId: String): ApiResponse<Child>

    @POST("/api/children/{childId}/prizes/decrement")
    suspend fun decrementPrizes(@Path("childId") childId: String): ApiResponse<Child>

    @POST("/api/children/{childId}/targets")
    suspend fun addPrizeTarget(
        @Path("childId") childId: String,
        @Body request: PrizeTargetMutation,
    ): ApiResponse<Child>

    @PUT("/api/children/{childId}/targets/{targetId}")
    suspend fun updatePrizeTarget(
        @Path("childId") childId: String,
        @Path("targetId") targetId: String,
        @Body request: PrizeTargetMutation,
    ): ApiResponse<Child>

    @DELETE("/api/children/{childId}/targets/{targetId}")
    suspend fun deletePrizeTarget(
        @Path("childId") childId: String,
        @Path("targetId") targetId: String,
    ): ApiResponse<Child>

    @GET("/api/children/{childId}/chart/{year}/{week}")
    suspend fun getChartWeek(
        @Path("childId") childId: String,
        @Path("year") year: Int,
        @Path("week") week: Int,
    ): ApiResponse<ChartWeek>

    @POST("/api/children/{childId}/chart/{year}/{week}")
    suspend fun updateSlot(
        @Path("childId") childId: String,
        @Path("year") year: Int,
        @Path("week") week: Int,
        @Body request: UpdateSlotRequest,
    ): ApiResponse<UpdateSlotResponse>

    @POST("/api/children/{childId}/chart/{year}/{week}/reset")
    suspend fun resetChart(
        @Path("childId") childId: String,
        @Path("year") year: Int,
        @Path("week") week: Int,
    ): ApiResponse<ResetChartResponse>
}
