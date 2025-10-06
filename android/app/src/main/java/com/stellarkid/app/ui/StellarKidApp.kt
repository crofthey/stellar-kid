package com.stellarkid.app.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.stellarkid.app.ui.auth.AuthViewModel
import com.stellarkid.app.ui.chart.ChartViewModel
import com.stellarkid.app.ui.dashboard.DashboardEvent
import com.stellarkid.app.ui.dashboard.DashboardViewModel
import com.stellarkid.feature.auth.AuthScreen
import com.stellarkid.feature.chart.ChartScreen
import com.stellarkid.feature.dashboard.DashboardScreen
import com.stellarkid.app.ui.theme.StellarKidTheme
import kotlinx.coroutines.flow.collectLatest

@Composable
fun StellarKidApp() {
    StellarKidTheme {
        val navController = rememberNavController()
        val authViewModel: AuthViewModel = viewModel()
        val authUiState by authViewModel.uiState.collectAsStateWithLifecycle()
        val authState by authViewModel.authState.collectAsStateWithLifecycle()

        LaunchedEffect(authState.user, authState.isInitialized) {
            if (!authState.isInitialized) return@LaunchedEffect
            if (authState.user != null) {
                navController.navigate(Routes.DASHBOARD) {
                    popUpTo(Routes.AUTH) { inclusive = true }
                }
            } else {
                navController.navigate(Routes.AUTH) {
                    popUpTo(navController.graph.startDestinationId) { inclusive = true }
                }
            }
        }

        NavHost(
            navController = navController,
            startDestination = Routes.AUTH,
        ) {
            composable(Routes.AUTH) {
                AuthScreen(
                    state = authUiState,
                    onLogin = authViewModel::login,
                    onRegister = authViewModel::register,
                    onForgotPassword = authViewModel::forgotPassword,
                )
            }
            composable(Routes.DASHBOARD) {
                val dashboardViewModel: DashboardViewModel = viewModel()
                val dashboardState by dashboardViewModel.uiState.collectAsStateWithLifecycle()

                LaunchedEffect(dashboardViewModel) {
                    dashboardViewModel.events.collectLatest { event ->
                        when (event) {
                            is DashboardEvent.NavigateToChild -> {
                                navController.navigate(Routes.chart(event.childId))
                            }
                        }
                    }
                }

                DashboardScreen(
                    state = dashboardState,
                    onCreateChild = dashboardViewModel::createChild,
                    onDeleteChild = dashboardViewModel::deleteChild,
                    onSelectChild = dashboardViewModel::selectChild,
                    onSubmitFeedback = dashboardViewModel::submitFeedback,
                    onChangePassword = dashboardViewModel::changePassword,
                    onLogout = dashboardViewModel::logout,
                    onClearMessages = dashboardViewModel::clearMessages,
                )
            }
            composable(
                route = Routes.CHART,
                arguments = listOf(navArgument("childId") { type = NavType.StringType })
            ) { backStackEntry ->
                val chartViewModel: ChartViewModel = viewModel(backStackEntry)
                val chartState by chartViewModel.uiState.collectAsStateWithLifecycle()
                val dashboardEntry = remember(navController) { navController.getBackStackEntry(Routes.DASHBOARD) }
                val dashboardViewModel: DashboardViewModel = viewModel(dashboardEntry)
                ChartScreen(
                    state = chartState,
                    onBack = {
                        dashboardViewModel.refreshChildren()
                        navController.popBackStack()
                    },
                    onPreviousWeek = chartViewModel::previousWeek,
                    onNextWeek = chartViewModel::nextWeek,
                    onToggleSlot = chartViewModel::toggleSlot,
                    onRenameChild = chartViewModel::renameChild,
                    onChangePrizeMode = chartViewModel::changePrizeMode,
                    onResetChart = chartViewModel::resetChart,
                    onClearMessages = chartViewModel::clearMessages,
                )
            }
        }
    }
}

private object Routes {
    const val AUTH = "auth"
    const val DASHBOARD = "dashboard"
    const val CHART = "chart/{childId}"

    fun chart(childId: String): String = "chart/$childId"
}
