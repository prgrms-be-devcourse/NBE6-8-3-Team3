package com.tododuk.domain.reminder.dto

import com.tododuk.domain.reminder.entity.Reminder
import java.time.LocalDateTime

@JvmRecord
data class ReminderDto(
    val todoId: Int?,
    val remindAt: LocalDateTime,
    val method: String,
    val id: Int,
    val createDate: LocalDateTime,
    val modifyDate: LocalDateTime
) {
    constructor(reminder: Reminder) : this(
        reminder.todoId,
        reminder.remindAt,
        reminder.method,
        reminder.id,
        reminder.createDate,
        reminder.modifyDate
    )
}