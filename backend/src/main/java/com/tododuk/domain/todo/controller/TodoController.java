package com.tododuk.domain.todo.controller;

import com.tododuk.domain.todo.dto.TodoReqDto;
import com.tododuk.domain.todo.dto.TodoResponseDto;
import com.tododuk.domain.todo.entity.Todo;
import com.tododuk.domain.todo.service.TodoService;
import com.tododuk.domain.todoLabel.service.TodoLabelService;
import com.tododuk.domain.todoList.dto.TodoListResponseDto;
import com.tododuk.domain.todoList.entity.TodoList;
import com.tododuk.domain.todoList.service.TodoListService;

import com.tododuk.domain.user.entity.User;
import com.tododuk.domain.user.service.UserService;
import com.tododuk.global.exception.ServiceException;
import com.tododuk.global.rsData.RsData;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/todo")
@RequiredArgsConstructor
@Tag(name = "todo")
@CrossOrigin(origins = "http://localhost:3000")
public class TodoController {

    private final TodoService todoService;
    private final UserService userService;
  private final TodoListService todoListService;
    private final TodoLabelService todoLabelService;

    @GetMapping // 메인에서 todo버튼 클릭시 이동하는 처음 화면
    @Transactional
    @Operation(summary = "전체 todo 조회")
    public ResponseEntity<RsData<List<TodoResponseDto>>> getAllTodos() {
        List<TodoResponseDto> todos = todoService.getAllTodos();
        return ResponseEntity.ok(RsData.success("전체 todo 조회 성공", todos));
    }

    @GetMapping("/{todo_id}")
    @Transactional
    @Operation(summary = "개별 todo 조회")
    public ResponseEntity<RsData<TodoResponseDto>> getTodoById(@PathVariable Integer todo_id) {
        TodoResponseDto todo = todoService.getTodo(todo_id);
        return ResponseEntity.ok(RsData.success("todo 조회 성공", todo));
    }

    @PostMapping
    @Transactional
    @Operation(summary = "새로운 todo 생성")
    public ResponseEntity<RsData<TodoResponseDto>> addTodo(
            @Valid @RequestBody TodoReqDto reqDto
    ) {
        Todo saveTodo = todoService.addTodo(reqDto);
        return ResponseEntity.ok(RsData.success("새로운 todo 생성 성공", TodoResponseDto.from(saveTodo)));
    }

    @PutMapping(value = "/{todo_id}")
    @Transactional
    @Operation(summary = "todo 수정")
    public ResponseEntity<RsData<TodoResponseDto>> updateTodo (
            @PathVariable Integer todo_id,
            @Valid @RequestBody TodoReqDto reqDto
    ) {
       try {
           Todo todo = todoService.updateTodo(todo_id, reqDto);
           return ResponseEntity.ok(RsData.success("todo 수정 성공",TodoResponseDto.from(todo)));
       } catch (Exception e) {
           throw new ServiceException("400-1", "수정에 실패하였습니다.");
       }
    }

    @DeleteMapping(value = "/{todo_id}")
    @Transactional
    @Operation(summary = "todo 삭제")
    public ResponseEntity<RsData<Void>> deleteTodo(
            @PathVariable Integer todo_id
    ) {
        try{
            todoService.deleteTodo(todo_id);
            return ResponseEntity.ok(RsData.success("todo 삭제 성공"));
        } catch (Exception e) {
            throw new ServiceException("400-1", "삭제에 실패하였습니다.");
        }
    }

    @PatchMapping(value = "/{todo_id}/complete")
    @Transactional
    @Operation(summary = "todo 상태표시")
    public ResponseEntity<RsData<TodoResponseDto>> isComplete(
            @PathVariable Integer todo_id
    )  {
        TodoResponseDto todoComplete = todoService.isComplete(todo_id);
        return ResponseEntity.ok(RsData.success("todo 상태변경 성공", todoComplete));
    }

    // 유저 아이디로 조회하기
    @GetMapping("/user/{user_id}")
    @Transactional
    @Operation(summary = "유저 아이디로 조회하기")
    public ResponseEntity<RsData<List<TodoResponseDto>>> getUserTodo(
            @PathVariable Integer user_id
    ) {
        List<TodoResponseDto> todos = todoService.getUserTodo(user_id);
        return ResponseEntity.ok(RsData.success("유저의 todo 조회 성공", todos));
    }

    @GetMapping("/me")
    @Transactional
    @Operation(summary = "사용자의 투두 조회")
    public ResponseEntity<RsData<List<TodoResponseDto>>> getMyTodo(
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
            List<TodoResponseDto> todos = todoService.getUserTodo(user.getId());
            return ResponseEntity.ok(RsData.success("유저의 todo list 조회 성공", todos));
        } catch (Exception e) {
            throw new ServiceException("400-1", "todo가 존재하지 않습니다.");
        }
    }
//충돌의 위험있으므로 주
    @GetMapping("/list/{id}")
    @Transactional
    @Operation(summary = "리스트 기반 투두 조회")
    public ResponseEntity<RsData<List<TodoResponseDto>>> getMyTodo(
            @PathVariable Integer id
    )
    {
        try {
            List<TodoResponseDto> todos = todoService.getTodoByTodoListId(id);
            return ResponseEntity.ok(RsData.success("리스트 기반 투두 조회 성공", todos));
        } catch (Exception e) {
            throw new ServiceException("400-1", "해당 리스트의 투두가 존재하지 않습니다.");
        }
    }

}
