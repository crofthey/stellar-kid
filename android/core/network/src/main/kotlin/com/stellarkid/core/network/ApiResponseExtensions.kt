package com.stellarkid.core.network

import com.stellarkid.core.model.ApiResponse

class ApiException(message: String) : RuntimeException(message)

fun <T> ApiResponse<T>.requireData(): T {
    if (!success) {
        throw ApiException(error ?: "Request failed")
    }
    return data ?: throw ApiException(error ?: "Missing response body")
}

fun ApiResponse<Unit>.validate() {
    if (success) return
    throw ApiException(error ?: "Request failed")
}
