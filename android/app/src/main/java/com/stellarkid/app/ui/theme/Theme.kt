package com.stellarkid.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = StellarBlue,
    secondary = StellarYellow,
    tertiary = StellarRed,
)

private val DarkColors = darkColorScheme(
    primary = StellarBlue,
    secondary = StellarYellow,
    tertiary = StellarRed,
)

@Composable
fun StellarKidTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colorScheme: ColorScheme = if (darkTheme) DarkColors else LightColors
    MaterialTheme(
        colorScheme = colorScheme,
        typography = StellarTypography,
        content = content,
    )
}
