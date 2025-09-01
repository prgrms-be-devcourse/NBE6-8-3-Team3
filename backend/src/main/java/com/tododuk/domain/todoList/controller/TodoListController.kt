package com.tododuk.domain.todoList.controller

import com.tododuk.domain.todoList.dto.TodoListReqDto
import com.tododuk.domain.todoList.dto.TodoListResponseDto
import com.tododuk.domain.todoList.service.TodoListService
import com.tododuk.domain.user.service.UserService
import com.tododuk.global.exception.ServiceException
import com.tododuk.global.rsData.RsData
import com.tododuk.global.rsData.RsData.Companion.success
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import lombok.RequiredArgsConstructor
import org.springframework.http.ResponseEntity
import org.springframework.security.core.Authentication
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*


@RestController
@RequestMapping("/api/todo-lists")
@RequiredArgsConstructor
@Tag(name = "todoLists")
@CrossOrigin(origins = ["http://localhost:3000"])
class TodoListController (
    private val todoListService: TodoListService,
    private val userService: UserService
){

    @GetMapping
    @Transactional
    @Operation(summary = "전체 todolist 조회")
    fun allTodoLists(): ResponseEntity<RsData<List<TodoListResponseDto>>> {
            val todolist = todoListService.allTodoLists()
            return ResponseEntity.ok(success("전체 todolist 조회 성공",todolist))
        }

    @GetMapping("/{listId}")
    @Transactional
    @Operation(summary = "개별 todoList 조회")
    fun getTodoListById(@PathVariable listId: Int): ResponseEntity<RsData<TodoListResponseDto>> {
        val list = todoListService.getTodoList(listId)
        return ResponseEntity.ok(success("todolist 조회 성공", list))
    }

    @PostMapping
    @Transactional
    @Operation(summary = "todolist 생성")
    fun addTodoList(
        @RequestBody reqDto: TodoListReqDto
    ): ResponseEntity<RsData<TodoListResponseDto>> {
        val saveList = todoListService.addTodoList(reqDto)
        return ResponseEntity.ok(success("새로운 todo 생성 성공", TodoListResponseDto.from(saveList)))
    }

    @PutMapping(value = ["/{listId}"])
    @Transactional
    @Operation(summary = "todolist 수정")
    fun updateTodoList(
        @PathVariable listId: Int,
        @RequestBody reqDto: TodoListReqDto
    ): ResponseEntity<RsData<TodoListResponseDto>> {
        try {
            val todoList = todoListService.updateTodoList(listId, reqDto)
            return ResponseEntity.ok(success("todolist 수정 성공", TodoListResponseDto.from(todoList)))
        } catch (e: Exception) {
            throw ServiceException("400-1", "수정에 실패하였습니다.")
        }
    }

    @DeleteMapping("/{listId}")
    @Transactional
    @Operation(summary = "todolist 삭제")
    fun deleteTodoList(
        @PathVariable listId: Int
    ): ResponseEntity<RsData<Void>> {
        try {
            todoListService.deleteTodoList(listId)
            return ResponseEntity.ok(success("todolist 삭제성공"))
        } catch (e: Exception) {
            throw ServiceException("400-1", "삭제에 실패하였습니다.")
        }
    }

    @GetMapping("/user/{userId}")
    @Transactional
    @Operation(summary = "유저 아이디 별 todo list 조회")
    fun getUserTodoList(
        @PathVariable userId: Int?
    ): ResponseEntity<RsData<List<TodoListResponseDto>>> {
        val todoLists = todoListService.getUserTodoList(userId)
        return ResponseEntity.ok(success("유저의 todo list 조회 성공", todoLists))
    }

    @GetMapping("/me")
    @Transactional
    @Operation(summary = "사용자의 투두리스트 조회")
    fun getMyTodoList(
        authentication: Authentication?
    ): ResponseEntity<RsData<List<TodoListResponseDto>>> {
        if (authentication == null || !authentication.isAuthenticated) {
            return ResponseEntity.status(401).body(RsData("401-1", "인증이 필요합니다."))
        }
        val username = authentication.name
        println("Authenticated Username: $username")
        val user = userService.findByUserEmail(username)
            .orElseThrow { IllegalArgumentException("존재하지 않는 사용자입니다.") }

        try {
            val todoLists = todoListService.getUserTodoList(user.id)
            return ResponseEntity.ok(success("유저의 todo list 조회 성공", todoLists))
        } catch (e: Exception) {
            throw ServiceException("400-1", "list가 존재하지 않습니다.")
        }
    }
}
