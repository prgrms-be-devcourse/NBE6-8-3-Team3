package com.tododuk.domain.reminder.service;

import com.tododuk.domain.reminder.dto.ReminderDto;
import com.tododuk.domain.reminder.entity.Reminder;
import com.tododuk.domain.reminder.job.ReminderJob;
import com.tododuk.domain.reminder.repository.ReminderRepository;
import com.tododuk.domain.todo.entity.Todo;
import com.tododuk.domain.todo.service.TodoService;
import com.tododuk.global.rsData.RsData;
import lombok.RequiredArgsConstructor;
import org.quartz.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
public class ReminderService {
    private final ReminderRepository reminderRepository;
    private final TodoService todoService;
    private final Scheduler scheduler;

    public Reminder createReminder(int todoId, LocalDateTime remindDateTime, String method) {
        Todo todo = todoService.getTodoById(todoId);
        Reminder reminder = new Reminder(todo, remindDateTime, method);
        reminderRepository.save(reminder);
        scheduleReminderJob(reminder);
        return reminder;
    }

    public RsData<Void> deleteReminder(int id) {

        reminderRepository.deleteById(id);
        return new RsData<>("200-1", "Reminder deleted successfully");
    }

    public RsData<List<ReminderDto>> getReminder() {

        return new RsData<>(
                "200-1",
                "Reminders retrieved successfully",
                reminderRepository.findAll()
                        .stream()
                        .map(ReminderDto::new)
                        .collect(Collectors.toList())
        );
    }

    public RsData<ReminderDto> getReminderById(int id) {

        return reminderRepository.findById(id)
                .map(reminder -> new RsData<>("200-1", "Reminder found", new ReminderDto(reminder)))
                .orElse(new RsData<>("400-1", "Reminder not found"));
    }

    public RsData<ReminderDto> updateReminder(int id, LocalDateTime remindDateTime, String method) {

        return reminderRepository.findById(id)
                .map(reminder -> {
                    reminder.setRemindAt(remindDateTime);
                    reminder.setMethod(method);
                    reminderRepository.save(reminder);
                    return new RsData<>("200-1", "Reminder updated successfully", new ReminderDto(reminder));
                })
                .orElse(new RsData<>("400-1", "Reminder not found", null));
    }

    public void scheduleReminderJob(Reminder reminder) {

        try {
            JobDetail jobDetail = JobBuilder.newJob(ReminderJob.class)
                    .withIdentity("reminderJob-" + reminder.getId())
                    .usingJobData("reminderId", reminder.getId())
                    .build();
            System.out.println("스케줄러 작동");

            Trigger trigger = TriggerBuilder.newTrigger()
                    .startAt(Date.from(reminder.getRemindAt().atZone(ZoneId.systemDefault()).toInstant()))
                    .build();

            scheduler.scheduleJob(jobDetail, trigger);
        } catch (SchedulerException e) {
            throw new RuntimeException("Failed to schedule job", e);
        }
    }


}