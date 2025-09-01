package com.tododuk.domain.todoList.service

import com.tododuk.domain.team.repository.TeamRepository
import com.tododuk.domain.todoList.dto.TodoListReqDto
import com.tododuk.domain.todoList.dto.TodoListResponseDto
import com.tododuk.domain.todoList.entity.TodoList
import com.tododuk.domain.todoList.repository.TodoListRepository
import com.tododuk.domain.user.repository.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class TodoListService(
    private val todoListRepository: TodoListRepository,
    private val userRepository: UserRepository,
    private val teamRepository: TeamRepository
) {

    fun allTodoLists(): List<TodoListResponseDto> =
        todoListRepository.findAll()
            .map { TodoListResponseDto.from(it) }

    fun getTodoList(id: Int): TodoListResponseDto {
        val todoList = todoListRepository.findById(id)
            .orElseThrow { IllegalArgumentException("해당 todolistid는 존재하지 않습니다.") }
        return TodoListResponseDto.from(todoList)
    }

    @Transactional
    fun addTodoList(reqDto: TodoListReqDto): TodoList {
        val user = userRepository.findById(reqDto.userId)
            .orElseThrow { IllegalArgumentException("해당 유저가 없습니다.") }

        val team = teamRepository.findById(reqDto.teamId)
            .orElseThrow { IllegalArgumentException("해당 팀이 없습니다.") }

        val todoList = TodoList(
            reqDto.name,
            reqDto.description,
            user,
            team
        )
        return todoListRepository.save(todoList)
    }

    @Transactional
    fun updateTodoList(listId: Int, reqDto: TodoListReqDto): TodoList {
        val todoList = todoListRepository.findById(listId)
            .orElseThrow { IllegalArgumentException("해당 todolist가 존재하지 않습니다.") }

        val user = userRepository.findById(reqDto.userId)
            .orElseThrow { IllegalArgumentException("해당 유저가 없습니다.") }

        val team = teamRepository.findById(reqDto.teamId)
            .orElseThrow { IllegalArgumentException("해당 팀이 없습니다.") }

        todoList.name = reqDto.name
        todoList.description = reqDto.description
        todoList.user = user
        todoList.team = team

        return todoListRepository.save(todoList)
    }

    @Transactional
    fun deleteTodoList(listId: Int) {
        val todoList = todoListRepository.findById(listId)
            .orElseThrow { IllegalArgumentException("해당 todolist는 존재하지 않습니다.") }
        todoListRepository.delete(todoList)
    }

    fun getUserTodoList(userId: Int?): List<TodoListResponseDto> =
        todoListRepository.findAllByUserId(userId)
            .map { TodoListResponseDto.from(it) }
}