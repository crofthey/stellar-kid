package com.stellarkid.core.datastore

import kotlinx.coroutines.flow.Flow

interface AuthTokenStore {
    val token: Flow<String?>
    suspend fun save(token: String)
    suspend fun clear()
}
