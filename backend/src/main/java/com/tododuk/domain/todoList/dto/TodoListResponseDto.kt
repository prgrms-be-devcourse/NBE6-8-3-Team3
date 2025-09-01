package com.tododuk.domain.todoList.dto

import com.tododuk.domain.todo.dto.TodoResponseDto
import com.tododuk.domain.todoList.entity.TodoList
import lombok.AllArgsConstructor
import lombok.NoArgsConstructor
import java.time.LocalDateTime
import java.util.stream.Collectors

@NoArgsConstructor
@AllArgsConstructor
class TodoListResponseDto private constructor(
    val id : Int = 0,
    val name: String? = null,
    val description: String? = null,
    val userId : Int = 0,
    val teamId : Int = 0,
    val createDate: LocalDateTime? = null,
    val modifyDate: LocalDateTime? = null,
    val todo: List<TodoResponseDto>? = null // 투두 리스트 안에 포함된 투두들
){

    companion object {
        fun from(todoList: TodoList): TodoListResponseDto {
            val todos = todoList.todo
                .stream()
                .map<Any>(TodoResponseDto::from)
                .collect(Collectors.toList<Any>())

            return TodoListResponseDto(
                id = todoList.id,
                name = todoList.name,
                description = todoList.description,
                userId = todoList.user.id,
                teamId = todoList.team.id,
                createDate = todoList.createDate,
                modifyDate = todoList.modifyDate
            )
        }
    }

    constructor(todoList: TodoList) : this (
        id = todoList.id,
        name = todoList.name,
        description = todoList.description,
        userId = todoList.user.id,
        teamId = todoList.team.id,
        createDate = todoList.createDate,
        modifyDate = todoList.modifyDate
    )
}
