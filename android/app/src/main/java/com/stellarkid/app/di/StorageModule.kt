package com.stellarkid.app.di

import com.stellarkid.app.data.datastore.DataStoreAuthTokenStore
import com.stellarkid.core.datastore.AuthTokenStore
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
interface StorageModule {

    @Binds
    @Singleton
    fun bindAuthTokenStore(impl: DataStoreAuthTokenStore): AuthTokenStore
}
