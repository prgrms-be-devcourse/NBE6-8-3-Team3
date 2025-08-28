package com.tododuk.domain.reminder.dto;

import com.tododuk.domain.reminder.entity.Reminder;
import com.tododuk.domain.todo.entity.Todo;
import lombok.NonNull;

import java.time.LocalDateTime;

public record ReminderDto(
        @NonNull Todo todo,
        @NonNull LocalDateTime remindAt,
        @NonNull String method,
        @NonNull int id,
        @NonNull LocalDateTime createDate,
        @NonNull LocalDateTime modifyDate
){

    public ReminderDto(Reminder reminder) {
        this(
                reminder.getTodo(),
                reminder.getRemindAt(),
                reminder.getMethod(),
                reminder.getId(),
                reminder.getCreateDate(),
                reminder.getModifyDate()
        );
    }
}