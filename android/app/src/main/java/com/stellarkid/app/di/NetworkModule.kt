package com.stellarkid.app.di

import com.stellarkid.app.BuildConfig
import com.stellarkid.core.datastore.AuthTokenStore
import com.stellarkid.core.network.AuthInterceptor
import com.stellarkid.core.network.ChildService
import com.stellarkid.core.network.FeedbackService
import com.stellarkid.core.network.NetworkConfig
import com.stellarkid.core.network.AuthService
import com.stellarkid.core.network.UserService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import retrofit2.Retrofit

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideBaseUrl(): String = BuildConfig.API_BASE_URL

    @Provides
    fun provideAuthInterceptor(store: AuthTokenStore): Interceptor = AuthInterceptor {
        runBlocking { store.current() }
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(authInterceptor: Interceptor): OkHttpClient {
        return NetworkConfig.okHttpClient(authInterceptor)
    }

    @Provides
    @Singleton
    fun provideRetrofit(baseUrl: String, client: OkHttpClient): Retrofit {
        return NetworkConfig.retrofit(baseUrl, client)
    }

    @Provides
    @Singleton
    fun provideAuthService(retrofit: Retrofit): AuthService = retrofit.create(AuthService::class.java)

    @Provides
    @Singleton
    fun provideUserService(retrofit: Retrofit): UserService = retrofit.create(UserService::class.java)

    @Provides
    @Singleton
    fun provideChildService(retrofit: Retrofit): ChildService = retrofit.create(ChildService::class.java)

    @Provides
    @Singleton
    fun provideFeedbackService(retrofit: Retrofit): FeedbackService = retrofit.create(FeedbackService::class.java)
}
