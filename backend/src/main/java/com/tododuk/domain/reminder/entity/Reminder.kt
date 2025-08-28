package com.tododuk.domain.reminder.entity;

import com.tododuk.domain.todo.entity.Todo;
import com.tododuk.global.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Reminder extends BaseEntity {
    @ManyToOne
    private Todo todo;
    private LocalDateTime remindAt;
    private String method; //알림 내용? 알림 방법?

    public Reminder(Todo todo, LocalDateTime remindAt, String method) {
        this.todo = todo;
        this.remindAt = remindAt;
        this.method = method;
    }

}