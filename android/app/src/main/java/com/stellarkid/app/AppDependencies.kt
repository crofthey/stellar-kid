package com.stellarkid.app

import com.stellarkid.app.data.auth.AuthRepository
import com.stellarkid.app.data.auth.DefaultAuthRepository
import com.stellarkid.app.data.children.ChildrenRepository
import com.stellarkid.app.data.children.DefaultChildrenRepository
import com.stellarkid.app.data.feedback.DefaultFeedbackRepository
import com.stellarkid.app.data.feedback.FeedbackRepository

object AppDependencies {
    val authRepository: AuthRepository by lazy { DefaultAuthRepository() }
    val childrenRepository: ChildrenRepository by lazy { DefaultChildrenRepository() }
    val feedbackRepository: FeedbackRepository by lazy { DefaultFeedbackRepository() }
}
