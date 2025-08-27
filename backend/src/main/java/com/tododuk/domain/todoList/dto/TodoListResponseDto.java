package com.tododuk.domain.todoList.dto;

import com.tododuk.domain.todo.dto.TodoResponseDto;
import com.tododuk.domain.todoList.entity.TodoList;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class TodoListResponseDto {
    private int id;
    private String name;
    private String description;
    private int userId;
    private int teamId;
    private LocalDateTime createDate;
    private LocalDateTime modifyDate;
    private List<TodoResponseDto> todo;  // 투두 리스트 안에 포함된 투두들

    public static TodoListResponseDto from(TodoList todoList) {

        List<TodoResponseDto> todos = todoList.getTodo()
                .stream()
                .map(TodoResponseDto::from)
                .collect(Collectors.toList());

        return new TodoListResponseDto(
                todoList.getId(),
                todoList.getName(),
                todoList.getDescription(),
                todoList.getUser().getId(),
                todoList.getTeam().getId(),
                todoList.getCreateDate(),
                todoList.getModifyDate(),
                todos
        );
    }

}
