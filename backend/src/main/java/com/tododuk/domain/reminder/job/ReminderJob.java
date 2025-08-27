package com.tododuk.domain.reminder.job;

import com.tododuk.domain.notification.service.NotificationService;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class ReminderJob implements Job {

    @Autowired
    private NotificationService notificationService;

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {
        try {
            int reminderId = context.getMergedJobDataMap().getInt("reminderId");
            System.out.println("ReminderJob executed for reminderId: " + reminderId);

            notificationService.CreateNotificationByReminder(reminderId);

        } catch (Exception e) {
            System.err.println("ReminderJob 실행 중 예외 발생:");
            e.printStackTrace();  // 콘솔에 자세한 에러 출력

            // Quartz에게 실패 알리기
            throw new JobExecutionException(e);
        }
    }
}