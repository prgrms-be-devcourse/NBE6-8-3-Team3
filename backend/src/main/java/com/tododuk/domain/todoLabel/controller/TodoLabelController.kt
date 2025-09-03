package com.tododuk.domain.todoLabel.controller

import com.tododuk.domain.label.dto.LabelDto
import com.tododuk.domain.todoLabel.dto.CreateTodoLabelRequestDto
import com.tododuk.domain.todoLabel.dto.CreateTodoLabelResponseDto
import com.tododuk.domain.todoLabel.dto.TodoLabelRequestDto
import com.tododuk.domain.todoLabel.dto.TodoLabelResponseDto
import com.tododuk.domain.todoLabel.entity.TodoLabel
import com.tododuk.domain.todoLabel.service.TodoLabelService
import com.tododuk.global.rsData.RsData
import io.swagger.v3.oas.annotations.tags.Tag
import lombok.RequiredArgsConstructor
import org.springframework.web.bind.annotation.*
import java.util.stream.Collectors

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/todos")
@Tag(name = "Todolabel")
@CrossOrigin(origins = ["http://localhost:3000"])
class TodoLabelController(private val todoLabelService: TodoLabelService) {

    @GetMapping("/{todoId}/labels")
    fun getTodoLabels(@PathVariable todoId: Int): RsData<TodoLabelResponseDto?> {
        // 🔥 수정: LabelDto 객체들을 반환하도록 변경

        val labels = todoLabelService.getTodoLabelsByTodoId(todoId)

        val responseDto = TodoLabelResponseDto(todoId, labels)

        return RsData<TodoLabelResponseDto?>("200-1", "Todo 라벨 목록을 성공적으로 조회했습니다.", responseDto)
    }

    @PostMapping("/{todoId}/label")
    fun createTodoLabel(@RequestBody request: CreateTodoLabelRequestDto): RsData<CreateTodoLabelResponseDto?> {
        val savedTodoLabel = todoLabelService.createTodoLabel(request.todoId, request.labelId)

        val responseDto = CreateTodoLabelResponseDto(
            savedTodoLabel.todo!!.id,
            savedTodoLabel.label!!.id
        )

        return RsData<CreateTodoLabelResponseDto?>("200-1", "Todo에 라벨을 성공적으로 연결했습니다.", responseDto)
    }

    @PostMapping("/{todoId}/labels")
    fun createTodoLabels(@RequestBody request: TodoLabelRequestDto): RsData<TodoLabelResponseDto?> {
        val savedTodoLabels = todoLabelService!!.createTodoLabels(request.todoId, request.labelIds)

        // 🔥 수정: LabelDto 객체들을 반환하도록 변경
        val labels = savedTodoLabels.stream()
            .map<LabelDto?> { todoLabel: TodoLabel? ->
                LabelDto(
                    todoLabel!!.label!!.id,
                    todoLabel.label!!.name,
                    todoLabel.label!!.color
                )
            }
            .collect(Collectors.toList())

        val responseDto = TodoLabelResponseDto(request.todoId, labels)

        return RsData<TodoLabelResponseDto?>("200-1", "라벨들이 성공적으로 연결되었습니다.", responseDto)
    }

    @PutMapping("/{todoId}/labels")
    fun updateTodoLabels(@RequestBody request: TodoLabelRequestDto): RsData<TodoLabelResponseDto?> {
        val savedTodoLabels = todoLabelService!!.updateTodoLabels(request.todoId, request.labelIds)

        // 🔥 수정: LabelDto 객체들을 반환하도록 변경
        val labels = savedTodoLabels.stream()
            .map<LabelDto?> { todoLabel: TodoLabel? ->
                LabelDto(
                    todoLabel!!.label!!.id,
                    todoLabel.label!!.name,
                    todoLabel.label!!.color
                )
            }
            .collect(Collectors.toList())

        val responseDto = TodoLabelResponseDto(request.todoId, labels)

        return RsData<TodoLabelResponseDto?>("200-1", "라벨들이 성공적으로 수정&연결되었습니다.", responseDto)
    }
}