package com.tododuk.domain.todoLabel.service

import com.tododuk.domain.label.dto.LabelDto
import com.tododuk.domain.label.repository.LabelRepository
import com.tododuk.domain.todo.repository.TodoRepository
import com.tododuk.domain.todoLabel.entity.TodoLabel
import com.tododuk.domain.todoLabel.repository.TodoLabelRepository
import lombok.RequiredArgsConstructor
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.function.Supplier
import java.util.stream.Collectors

@RequiredArgsConstructor
@Service
class TodoLabelService(
    private val todoLabelRepository: TodoLabelRepository,
    private val todoRepository: TodoRepository,
    private val labelRepository: LabelRepository
) {
    // 기존 메서드 유지 (다른 곳에서 사용할 수도 있으므로)
    @Transactional(readOnly = true)
    fun getTodoLabelIdsByTodoIds(todoId: Int): MutableList<Int?> {
        return todoLabelRepository!!.findByTodoId(todoId).stream()
            .map<Int?> { todoLabel: TodoLabel? -> todoLabel!!.label!!.id }
            .collect(Collectors.toList())
    }

    // 새로 추가: LabelDto 객체들을 반환하는 메서드
    @Transactional(readOnly = true)
    fun getTodoLabelsByTodoId(todoId: Int): MutableList<LabelDto?> {
        return todoLabelRepository!!.findByTodoId(todoId).stream()
            .map<LabelDto?> { todoLabel: TodoLabel? ->
                LabelDto(
                    todoLabel!!.label!!.id,
                    todoLabel.label!!.name,
                    todoLabel.label!!.color
                )
            }
            .collect(Collectors.toList())
    }

    @Transactional
    fun createTodoLabel(todoId: Int, labelId: Int): TodoLabel {
        val todo = todoRepository!!.findById(todoId)
            .orElseThrow<IllegalArgumentException?>(Supplier { IllegalArgumentException("Todo not found") })

        val label = labelRepository!!.findById(labelId)
            .orElseThrow<IllegalArgumentException?>(Supplier { IllegalArgumentException("Label not found") })

        val todoLabel = TodoLabel(todo, label)
        return todoLabelRepository!!.save<TodoLabel>(todoLabel)
    }

    @Transactional
    fun createTodoLabels(todoId: Int, labelIds: MutableList<Int>): MutableList<TodoLabel?> {
        val result: MutableList<TodoLabel?> = ArrayList<TodoLabel?>()

        for (labelId in labelIds) {
            val exists = todoLabelRepository!!.existsByTodoIdAndLabelId(todoId, labelId)

            if (exists) {
                continue
            }

            val todoLabel = createTodoLabel(todoId, labelId)
            result.add(todoLabel)
        }

        return result
    }

    @Transactional
    fun updateTodoLabels(todoId: Int, labelIds: MutableList<Int>): MutableList<TodoLabel?> {
        val result: MutableList<TodoLabel?> = ArrayList<TodoLabel?>()
        val savedLabelIds = getTodoLabelIdsByTodoIds(todoId)

        // 기존 라벨들 모두 제거
        deleteAllTodoLabelsByTodoId(todoId)

        // 새로운 라벨들 추가
        val todoLabels = createTodoLabels(todoId, labelIds)
        result.addAll(todoLabels)

        return result
    }

    //기존 전체 삭제 (비효율적이므로, 일괄 삭제로 변경)
    @Transactional
    fun removeTodoLabelFromTodo(todoId: Int, labelId: Int) {
        val todoLabel = todoLabelRepository!!.findByTodoIdAndLabelId(todoId, labelId)
            .orElseThrow<IllegalArgumentException?>(Supplier { IllegalArgumentException("todoLabel not found") })

        todoLabelRepository.delete(todoLabel)
    }

    // 일괄 삭제
    @Transactional
    fun deleteAllTodoLabelsByTodoId(todoId: Int) {
        val todoLabels: MutableList<TodoLabel> = todoLabelRepository!!.findByTodoId(todoId)
        if (!todoLabels.isEmpty()) {
            todoLabelRepository.deleteAll(todoLabels) // 일괄 삭제
        }
    }
}