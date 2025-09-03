package com.tododuk.domain.todo.service

import com.tododuk.domain.todo.dto.TodoReqDto
import com.tododuk.domain.todo.dto.TodoResponseDto
import com.tododuk.domain.todo.entity.Todo
import com.tododuk.domain.todo.repository.TodoRepository
import com.tododuk.domain.todoLabel.service.TodoLabelService
import com.tododuk.domain.todoList.repository.TodoListRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.stream.Collectors

@Service
class TodoService (
    private val todoRepository: TodoRepository,
    private val todoListRepository: TodoListRepository,
    private val todoLabelService: TodoLabelService
){


    fun save(todo: Todo): Todo {
        return todoRepository.save(todo)
    }

    fun createTodo(title: String?, description: String?, completed: Boolean): Todo {
        val todo = Todo(title, description, completed)
        return todoRepository.save(todo)
    }


    fun getTodoById(id: Int): Todo {
        return todoRepository.findById(id).orElseThrow {
            IllegalArgumentException(
                "Todo not found with id: $id"
            )
        }
    }

    fun getAllTodos() : MutableList<TodoResponseDto> =
        todoRepository.findAll().stream()
            .map(TodoResponseDto::from)
            .toList()



    fun getTodo(id: Int): TodoResponseDto {
        val todo = todoRepository.findById(id)
            .orElseThrow { IllegalArgumentException("해당 todo는 존재하지 않습니다.") }
        return TodoResponseDto.from(todo)
    }

    @Transactional
    fun addTodo(reqDto: TodoReqDto): Todo {
        val todoList = todoListRepository.findById(reqDto.todoListId)
            .orElseThrow { IllegalArgumentException("해당 todo_list_id는 존재하지 않습니다.") }
        val todo = reqDto.toEntity()
        todo.todoList = todoList
        return todoRepository.save(todo)
    }

    @Transactional
    fun updateTodo(id: Int, reqDto: TodoReqDto): Todo {
        val todo = todoRepository.findById(id)
            .orElseThrow { IllegalArgumentException("해당 todo는 존재하지 않습니다.") }
        val todoList = todoListRepository.findById(reqDto.todoListId)
            .orElseThrow { IllegalArgumentException("해당 todo_list_id는 존재하지 않습니다.") }
        todo.todoList = todoList
        todo.update(reqDto)
        return todo
    }

    @Transactional
    fun deleteTodo(todoId: Int) {
        // 1. Todo 존재 확인
        val todo = todoRepository.findById(todoId)
            .orElseThrow { IllegalArgumentException("해당 Todo를 찾을 수 없습니다.") }

        // 2. 연관된 TodoLabel들 먼저 전체 삭제 (todoLabel 자체를 제거)
        todoLabelService.deleteAllTodoLabelsByTodoId(todoId)

        // 3. Todo 삭제
        todoRepository.delete(todo)
    }

    @Transactional
    fun isComplete(todoId: Int): TodoResponseDto {
        val todo = todoRepository.findById(todoId)
            .orElseThrow { IllegalArgumentException("해당 todo는 존재하지 않습니다.") }
        todo.isCompleted = !todo.isCompleted

        return TodoResponseDto.from(todoRepository.save(todo))
    }

    fun getUserTodo(userId: Int?): List<TodoResponseDto> {
        val todos = todoRepository.findAllByTodoListUserId(userId)
        return todos.stream()
            .map(TodoResponseDto::from)
            .collect(Collectors.toList())
    }


    fun getTodoByTodoListId(id: Int?): List<TodoResponseDto> {
        val todos = todoRepository.findAllByTodoListId(id)
        return todos.stream()
            .map(TodoResponseDto::from)
            .collect(Collectors.toList())
    }
}