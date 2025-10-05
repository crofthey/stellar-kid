package com.stellarkid.app.di

import com.stellarkid.app.data.auth.AuthRepository
import com.stellarkid.app.data.auth.DefaultAuthRepository
import com.stellarkid.app.data.children.ChildrenRepository
import com.stellarkid.app.data.children.DefaultChildrenRepository
import com.stellarkid.app.data.feedback.DefaultFeedbackRepository
import com.stellarkid.app.data.feedback.FeedbackRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
interface RepositoryModule {

    @Binds
    @Singleton
    fun bindAuthRepository(impl: DefaultAuthRepository): AuthRepository

    @Binds
    @Singleton
    fun bindChildrenRepository(impl: DefaultChildrenRepository): ChildrenRepository

    @Binds
    @Singleton
    fun bindFeedbackRepository(impl: DefaultFeedbackRepository): FeedbackRepository
}
