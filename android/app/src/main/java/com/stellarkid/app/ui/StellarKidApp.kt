package com.stellarkid.app.ui

import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.stellarkid.feature.auth.AuthPlaceholderScreen
import com.stellarkid.feature.chart.ChartPlaceholderScreen
import com.stellarkid.feature.dashboard.DashboardPlaceholderScreen
import com.stellarkid.feature.settings.SettingsPlaceholderScreen
import com.stellarkid.app.ui.theme.StellarKidTheme

@Composable
fun StellarKidApp() {
    StellarKidTheme {
        Surface {
            val navController = rememberNavController()
            NavHost(
                navController = navController,
                startDestination = Destinations.Auth.route,
            ) {
                composable(Destinations.Auth.route) {
                    AuthPlaceholderScreen()
                }
                composable(Destinations.Dashboard.route) {
                    DashboardPlaceholderScreen()
                }
                composable(Destinations.Chart.route) {
                    ChartPlaceholderScreen()
                }
                composable(Destinations.Settings.route) {
                    SettingsPlaceholderScreen()
                }
            }
        }
    }
}

private enum class Destinations(val route: String) {
    Auth("auth"),
    Dashboard("dashboard"),
    Chart("chart"),
    Settings("settings")
}
