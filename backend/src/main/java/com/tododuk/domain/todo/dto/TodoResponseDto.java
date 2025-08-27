package com.tododuk.domain.todo.dto;

import com.tododuk.domain.todo.entity.Todo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TodoResponseDto {
    private int id;
    private String title;
    private String description;
    private boolean isCompleted;
    private int priority;
    private LocalDateTime startDate;
    private LocalDateTime dueDate;
    private int todoList;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TodoResponseDto from(Todo todo) {
        return new TodoResponseDto(
                todo.getId(),
                todo.getTitle(),
                todo.getDescription(),
                todo.isCompleted(),
                todo.getPriority(),
                todo.getStartDate(),
                todo.getDueDate(),
                todo.getTodoList().getId(),
                todo.getCreateDate(),
                todo.getModifyDate()
        );
    }

}
