package com.tododuk.domain.todoLabel.dto;

public record CreateTodoLabelRequestDto(
        int todoId,
        int labelId
) {}