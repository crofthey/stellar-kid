package com.stellarkid.app.util

import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.WeekFields
import java.util.Locale

private val weekFields: WeekFields = WeekFields.ISO
private val locale: Locale = Locale.getDefault()
private val dayFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("EEE", locale)
private val startFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("MMM d", locale)
private val endFormatterSameMonth: DateTimeFormatter = DateTimeFormatter.ofPattern("d, yyyy", locale)
private val endFormatterFull: DateTimeFormatter = DateTimeFormatter.ofPattern("MMM d, yyyy", locale)

data class WeekInfo(
    val year: Int,
    val week: Int,
    val startOfWeek: LocalDate,
)

fun LocalDate.toWeekInfo(): WeekInfo {
    val startOfWeek = with(weekFields.dayOfWeek(), 1)
    val year = get(weekFields.weekBasedYear())
    val week = get(weekFields.weekOfWeekBasedYear())
    return WeekInfo(year, week, startOfWeek)
}

fun LocalDate.weekLabel(): String {
    val start = with(weekFields.dayOfWeek(), 1)
    val end = with(weekFields.dayOfWeek(), 7)
    return if (start.month == end.month) {
        "${start.format(startFormatter)} - ${end.format(endFormatterSameMonth)}"
    } else {
        "${start.format(startFormatter)} - ${end.format(endFormatterFull)}"
    }
}

fun LocalDate.weekDayLabels(): List<String> {
    val start = with(weekFields.dayOfWeek(), 1)
    return (0 until 7).map { offset ->
        val date = start.plusDays(offset.toLong())
        date.format(dayFormatter)
    }
}
