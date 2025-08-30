package com.tododuk.domain.todo.controller

import com.tododuk.domain.todo.dto.TodoReqDto
import com.tododuk.domain.todo.dto.TodoResponseDto
import com.tododuk.domain.todo.entity.Todo
import com.tododuk.domain.todo.service.TodoService
import com.tododuk.domain.todoLabel.service.TodoLabelService
import com.tododuk.domain.todoList.service.TodoListService
import com.tododuk.domain.user.entity.User
import com.tododuk.domain.user.service.UserService
import com.tododuk.global.exception.ServiceException
import com.tododuk.global.rsData.RsData
import com.tododuk.global.rsData.RsData.Companion.success
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import lombok.RequiredArgsConstructor
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.util.function.Supplier

@RestController
@RequestMapping("/api/todo")
@RequiredArgsConstructor
@Tag(name = "todo")
@CrossOrigin(origins = ["http://localhost:3000"])
class TodoController (
    private val todoService: TodoService,
    private val userService: UserService,
    private val todoListService: TodoListService,
    private val todoLabelService: TodoLabelService
) {

    @GetMapping
    @Transactional
    @Operation(summary = "전체 todo 조회")
    fun getAllTodos(): ResponseEntity<RsData<List<TodoResponseDto>>> {
        val todos: List<TodoResponseDto> = todoService.getAllTodos()
        return ResponseEntity.ok(RsData.success("전체 todo 조회 성공", todos))
    }

    @GetMapping("/{todoId}")
    @Transactional
    @Operation(summary = "개별 todo 조회")
    fun getTodoById(@PathVariable todoId: Int): ResponseEntity<RsData<TodoResponseDto>> {
        val todo: TodoResponseDto = todoService.getTodo(todoId)
        return ResponseEntity.ok(success("todo 조회 성공", todo))
    }

    @PostMapping
    @Transactional
    @Operation(summary = "새로운 todo 생성")
    fun addTodo(
        @Valid @RequestBody reqDto: TodoReqDto
    ): ResponseEntity<RsData<TodoResponseDto>> {
        val saveTodo: Todo = todoService.addTodo(reqDto)
        return ResponseEntity.ok(success("새로운 todo 생성 성공", TodoResponseDto.from(saveTodo)))
    }

    @PutMapping(value = ["/{todoId}"])
    @Transactional
    @Operation(summary = "todo 수정")
    fun updateTodo(
        @PathVariable todoId: Int,
        @Valid @RequestBody reqDto: TodoReqDto
    ): ResponseEntity<RsData<TodoResponseDto>> {
        try {
            val todo: Todo = todoService.updateTodo(todoId, reqDto)
            return ResponseEntity.ok(success("todo 수정 성공", TodoResponseDto.from(todo)))
        } catch (e: Exception) {
            throw ServiceException("400-1", "수정에 실패하였습니다.")
        }
    }

    @DeleteMapping(value = ["/{todoId}"])
    @Transactional
    @Operation(summary = "todo 삭제")
    fun deleteTodo(
        @PathVariable todoId: Int
    ): ResponseEntity<RsData<Void>> {
        try {
            todoService.deleteTodo(todoId)
            return ResponseEntity.ok(success("todo 삭제 성공"))
        } catch (e: Exception) {
            throw ServiceException("400-1", "삭제에 실패하였습니다.")
        }
    }

    @PatchMapping(value = ["/{todoId}/complete"])
    @Transactional
    @Operation(summary = "todo 상태표시")
    fun isComplete(
        @PathVariable todoId: Int
    ): ResponseEntity<RsData<TodoResponseDto>> {
        val todoComplete: TodoResponseDto = todoService.isComplete(todoId)
        return ResponseEntity.ok(success("todo 상태변경 성공", todoComplete))
    }

    // 유저 아이디로 조회하기
    @GetMapping("/user/{userId}")
    @Transactional
    @Operation(summary = "유저 아이디로 조회하기")
    fun getUserTodo(
        @PathVariable userId: Int?
    ): ResponseEntity<RsData<List<TodoResponseDto>>> {
        val todos: List<TodoResponseDto> = todoService.getUserTodo(userId)
        return ResponseEntity.ok(success("유저의 todo 조회 성공", todos))
    }

    @GetMapping("/me")
    @Transactional
    @Operation(summary = "사용자의 투두 조회")
    fun getMyTodo(
        authentication: Authentication?
    ): ResponseEntity<RsData<List<TodoResponseDto>>> {
        if (authentication == null || !authentication.isAuthenticated) {
            return ResponseEntity.status(401).body(RsData("401-1", "인증이 필요합니다."))
        }
        val username = authentication.name
        println("Authenticated Username: $username")
        val user: User = userService.findByUserEmail(username)
            .orElseThrow<IllegalArgumentException>(Supplier<IllegalArgumentException> { IllegalArgumentException("존재하지 않는 사용자입니다.") })

        try {
            val todos: List<TodoResponseDto> = todoService.getUserTodo(user.id)
            return ResponseEntity.ok(success("유저의 todo list 조회 성공", todos))
        } catch (e: Exception) {
            throw ServiceException("400-1", "todo가 존재하지 않습니다.")
        }
    }

    //충돌의 위험있으므로 주
    @GetMapping("/list/{id}")
    @Transactional
    @Operation(summary = "리스트 기반 투두 조회")
    fun getMyTodo(
        @PathVariable id: Int?
    ): ResponseEntity<RsData<List<TodoResponseDto>>> {
        try {
            val todos: List<TodoResponseDto> = todoService.getTodoByTodoListId(id)
            return ResponseEntity.ok(success("리스트 기반 투두 조회 성공", todos))
        } catch (e: Exception) {
            throw ServiceException("400-1", "해당 리스트의 투두가 존재하지 않습니다.")
        }
    }
}


