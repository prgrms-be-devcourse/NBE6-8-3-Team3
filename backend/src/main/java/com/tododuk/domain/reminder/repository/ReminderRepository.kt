package com.tododuk.domain.reminder.repository

import com.tododuk.domain.reminder.entity.Reminder
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ReminderRepository: JpaRepository<Reminder, Int> {
}