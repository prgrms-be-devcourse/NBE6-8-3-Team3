package com.tododuk.domain.todoList.controller;


import com.tododuk.domain.todoList.dto.TodoListReqDto;
import com.tododuk.domain.todoList.dto.TodoListResponseDto;
import com.tododuk.domain.todoList.entity.TodoList;
import com.tododuk.domain.todoList.service.TodoListService;
import com.tododuk.domain.user.entity.User;
import com.tododuk.domain.user.service.UserService;
import com.tododuk.global.exception.ServiceException;
import com.tododuk.global.rsData.RsData;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/todo-lists")
@RequiredArgsConstructor
@Tag(name = "todoLists")
@CrossOrigin(origins = "http://localhost:3000")
public class TodoListController {

    private final TodoListService todoListService;
    private final UserService userService;

    @GetMapping
    @Transactional
    @Operation(summary = "전체 todolist 조회")
    public ResponseEntity<RsData<List<TodoListResponseDto>>> getAllTodoLists() {
        List<TodoListResponseDto> todolist = todoListService.getAllTodoLists();
        return ResponseEntity.ok(RsData.success("전체 todolist 조회 성공", todolist));
    }

    @GetMapping("/{list_id}")
    @Transactional
    @Operation(summary = "개별 todoList 조회")
    public ResponseEntity<RsData<TodoListResponseDto>> getTodoListById(@PathVariable Integer list_id){
        TodoListResponseDto list = todoListService.getTodoList(list_id);
        return ResponseEntity.ok(RsData.success("todolist 조회 성공", list));
    }

    @PostMapping
    @Transactional
    @Operation(summary = "todolist 생성")
    public ResponseEntity<RsData<TodoListResponseDto>> addTodoList(
            @RequestBody TodoListReqDto reqDto
    ) {
        TodoList saveList = todoListService.addTodoList(reqDto);
        return ResponseEntity.ok(RsData.success("새로운 todo 생성 성공", TodoListResponseDto.from(saveList)));
    }

    @PutMapping(value = "/{list_id}")
    @Transactional
    @Operation(summary = "todolist 수정")
    public ResponseEntity<RsData<TodoListResponseDto>> updateTodoList(
            @PathVariable Integer list_id,
            @RequestBody TodoListReqDto reqDto
    ) {
        try {
            TodoList todoList = todoListService.updateTodoList(list_id, reqDto);
            return ResponseEntity.ok(RsData.success("todolist 수정 성공", TodoListResponseDto.from(todoList)));
        } catch (Exception e) {
            throw new ServiceException("400-1", "수정에 실패하였습니다.");
        }
    }

    @DeleteMapping("/{list_id}")
    @Transactional
    @Operation(summary = "todolist 삭제")
    public ResponseEntity<RsData<Void>> deleteTodoList(
            @PathVariable Integer list_id
    ) {
        try {
            todoListService.deleteTodoList(list_id);
            return ResponseEntity.ok(RsData.success("todolist 삭제성공"));
        } catch (Exception e) {
            throw new ServiceException("400-1", "삭제에 실패하였습니다.");
        }
    }

    @GetMapping("/user/{user_id}")
    @Transactional
    @Operation(summary = "유저 아이디 별 todo list 조회")
    public ResponseEntity<RsData<List<TodoListResponseDto>>> getUserTodoList(
            @PathVariable Integer user_id
    ) {
        List<TodoListResponseDto> todoLists = todoListService.getUserTodoList(user_id);
        return ResponseEntity.ok(RsData.success("유저의 todo list 조회 성공", todoLists));
    }

    @GetMapping("/me")
    @Transactional
    @Operation(summary = "사용자의 투두리스트 조회")
    public ResponseEntity<RsData<List<TodoListResponseDto>>> getMyTodoList(
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(new RsData<>("401-1", "인증이 필요합니다."));
        }
        String username = authentication.getName();
        System.out.println("Authenticated Username: " + username);
        User user = userService.findByUserEmail(username)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        try {
            List<TodoListResponseDto> todoLists = todoListService.getUserTodoList(user.getId());
            return ResponseEntity.ok(RsData.success("유저의 todo list 조회 성공", todoLists));
        } catch (Exception e) {
            throw new ServiceException("400-1", "list가 존재하지 않습니다.");
        }
    }
}
