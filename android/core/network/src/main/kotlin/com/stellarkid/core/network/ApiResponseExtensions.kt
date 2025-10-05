package com.stellarkid.core.network

import com.stellarkid.core.model.ApiResponse

class ApiException(message: String) : RuntimeException(message)

fun <T> ApiResponse<T>.requireData(): T {
    if (success && data != null) {
        return data
    }
    throw ApiException(error ?: "Request failed")
}

fun ApiResponse<Unit>.validate() {
    if (success) return
    throw ApiException(error ?: "Request failed")
}
