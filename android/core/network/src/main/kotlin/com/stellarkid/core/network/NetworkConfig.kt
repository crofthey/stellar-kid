package com.stellarkid.core.network

import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import kotlinx.serialization.ExperimentalSerializationApi
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType

@OptIn(ExperimentalSerializationApi::class)
object NetworkConfig {
    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
    }

    fun defaultOkHttpClient(authInterceptor: Interceptor? = null): OkHttpClient {
        val builder = OkHttpClient.Builder()
        if (authInterceptor != null) {
            builder.addInterceptor(authInterceptor)
        }
        builder.addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        })
        return builder.build()
    }

    fun retrofit(baseUrl: String, client: OkHttpClient): Retrofit {
        val contentType = "application/json".toMediaType()
        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(client)
            .addConverterFactory(json.asConverterFactory(contentType))
            .build()
    }
}
