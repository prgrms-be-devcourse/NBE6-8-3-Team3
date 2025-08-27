package com.tododuk.domain.todoList.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TodoListReqDto {
    @NotBlank
    String name;

    String description;

    int userId;
    int teamId;

    LocalDateTime createdAt;
    LocalDateTime modifiedAt;

//    public TodoList toEntity() {
//        return new TodoList(name, description, userId, teamId);
//    }
}
