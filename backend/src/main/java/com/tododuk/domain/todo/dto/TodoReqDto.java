package com.tododuk.domain.todo.dto;

import com.tododuk.domain.todo.entity.Todo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TodoReqDto {
    @NotBlank(message = "제목은 필수 입니다.")
    String title;

    String description;

    @NotNull
    int priority;

    boolean isCompleted;
    int todoListId;

    LocalDateTime startDate;
    LocalDateTime dueDate;
    LocalDateTime createdAt;
    LocalDateTime modifyedAt;

    public Todo toEntity() {
        return new Todo(title, description, priority,isCompleted,todoListId,startDate,dueDate);
    }
}
