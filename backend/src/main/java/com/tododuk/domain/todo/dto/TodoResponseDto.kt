package com.tododuk.domain.todo.dto

import com.tododuk.domain.todo.entity.Todo
import lombok.AllArgsConstructor
import lombok.Builder
import lombok.NoArgsConstructor
import java.time.LocalDateTime


@NoArgsConstructor
@AllArgsConstructor
@Builder
class TodoResponseDto private constructor(
    val id : Int = 0,
    val title: String? = null,
    val description: String? = null,
    val isCompleted : Boolean = false,
    val priority: Int = 0,
    val startDate: LocalDateTime? = null,
    val dueDate: LocalDateTime? = null,
    val todoList : Int = 0,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime? = null
){
    companion object {
        fun from(todo: Todo): TodoResponseDto {
            return TodoResponseDto(
                id = todo.id,
                title = todo.title,
                description = todo.description,
                isCompleted = todo.isCompleted,
                priority = todo.priority,
                startDate = todo.startDate,
                dueDate = todo.dueDate,
                todoList = todo.todoList?.id ?:0,
                createdAt = todo.createDate,
                updatedAt = todo.modifyDate
            )
        }
    }
    constructor(todo: Todo) : this(
        id = todo.id,
        title = todo.title,
        description = todo.description,
        isCompleted = todo.isCompleted,
        priority = todo.priority,
        startDate = todo.startDate,
        dueDate = todo.dueDate,
        todoList = todo.todoList?.id ?:0,
        createdAt = todo.createDate,
        updatedAt = todo.modifyDate
    )
}
