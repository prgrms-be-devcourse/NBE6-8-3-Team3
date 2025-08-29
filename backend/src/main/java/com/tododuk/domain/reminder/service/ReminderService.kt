package com.tododuk.domain.reminder.service

import com.tododuk.domain.reminder.dto.ReminderDto
import com.tododuk.domain.reminder.entity.Reminder
import com.tododuk.domain.reminder.job.ReminderJob
import com.tododuk.domain.reminder.repository.ReminderRepository
import com.tododuk.domain.todo.service.TodoService
import com.tododuk.global.rsData.RsData
import lombok.RequiredArgsConstructor
import org.quartz.JobBuilder
import org.quartz.Scheduler
import org.quartz.SchedulerException
import org.quartz.TriggerBuilder
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.time.ZoneId
import java.util.*
import java.util.stream.Collectors

@Service
@RequiredArgsConstructor
class ReminderService(

    private val reminderRepository: ReminderRepository,
    private val todoService: TodoService,
    private val scheduler: Scheduler

) {
    fun createReminder(todoId: Int, remindDateTime: LocalDateTime, method: String): Reminder {
        val todo = todoService!!.getTodoById(todoId)
        val reminder = Reminder(todo, remindDateTime, method)
        reminderRepository!!.save<Reminder?>(reminder)
        scheduleReminderJob(reminder)
        return reminder
    }


    fun findById(id: Int): Reminder? {
        return reminderRepository!!.findById(id).orElse(null)
    }

    fun deleteReminder(id: Int): RsData<Void?> {
        reminderRepository!!.deleteById(id)
        return RsData<Void?>("200-1", "Reminder deleted successfully")
    }

    fun getReminder(): RsData<MutableList<ReminderDto?>?>
    {
        val reminders = reminderRepository.findAll()
        val reminderDto: MutableList<ReminderDto?> = reminders.stream()
            .map { reminder: Reminder -> ReminderDto(reminder) }
            .collect(Collectors.toList())
        return RsData<MutableList<ReminderDto?>?>("200-1", "Reminders retrieved successfully", reminderDto)
    }

    fun getReminderById(id: Int): RsData<ReminderDto?> {
        val reminders = reminderRepository.findById(id)
       val reminderDto: ReminderDto? = if (reminders.isPresent) {
            ReminderDto(reminders.get())
        } else {
            null
        }

        return if (reminderDto != null) {
            RsData<ReminderDto?>("200-1", "Reminder retrieved successfully", reminderDto)
        } else {
            RsData<ReminderDto?>("400-1", "Reminder not found", null)
        }
    }



    fun updateReminder(id: Int, remindDateTime: LocalDateTime?, method: String?): RsData<ReminderDto?> {
        val existingReminder = reminderRepository!!.findById(id)
        if (existingReminder.isEmpty) {
            return RsData("400-1", "Reminder not found", null)
        }

        val reminder = existingReminder.get()

        // Kotlin 스타일로 프로퍼티 직접 수정
        if (remindDateTime != null) {
            reminder.remindAt = remindDateTime
        }
        if (method != null) {
            reminder.method = method
        }

        reminderRepository.save(reminder)

        return RsData("200-1", "Reminder updated successfully", ReminderDto(reminder))
    }

    fun scheduleReminderJob(reminder: Reminder) {
        try {
            val jobDetail = JobBuilder.newJob(ReminderJob::class.java)
                .withIdentity("reminderJob-${reminder.id}")
                .usingJobData("reminderId", reminder.id)
                .build()

            println("스케줄러 작동")

            val trigger = TriggerBuilder.newTrigger()
                .startAt(Date.from(reminder.remindAt.atZone(ZoneId.systemDefault()).toInstant()))
                .build()

            scheduler!!.scheduleJob(jobDetail, trigger)
        } catch (e: SchedulerException) {
            throw RuntimeException("Failed to schedule job", e)
        }
    }

}