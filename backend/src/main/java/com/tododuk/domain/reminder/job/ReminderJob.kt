package com.tododuk.domain.reminder.job

import com.tododuk.domain.notification.service.NotificationService
import org.quartz.Job
import org.quartz.JobExecutionContext
import org.quartz.JobExecutionException
import org.springframework.stereotype.Component

@Component
class ReminderJob(
    val notificationService: NotificationService
) : Job {


    @Throws(JobExecutionException::class)
    override fun execute(context: JobExecutionContext) {
        try {
            val reminderId = context.getMergedJobDataMap().getInt("reminderId")
            println("ReminderJob executed for reminderId: " + reminderId)

            notificationService.createNotificationByReminder(reminderId)
        } catch (e: Exception) {
            System.err.println("ReminderJob 실행 중 예외 발생:")
            e.printStackTrace() // 콘솔에 자세한 에러 출력

            // Quartz에게 실패 알리기
            throw JobExecutionException(e)
        }
    }
}