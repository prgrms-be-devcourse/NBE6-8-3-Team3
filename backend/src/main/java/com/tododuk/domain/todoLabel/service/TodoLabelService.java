package com.tododuk.domain.todoLabel.service;

import com.tododuk.domain.label.dto.LabelDto;
import com.tododuk.domain.label.entity.Label;
import com.tododuk.domain.label.repository.LabelRepository;
import com.tododuk.domain.todo.entity.Todo;
import com.tododuk.domain.todo.repository.TodoRepository;
import com.tododuk.domain.todoLabel.entity.TodoLabel;
import com.tododuk.domain.todoLabel.repository.TodoLabelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class TodoLabelService {

    private final TodoLabelRepository todoLabelRepository;
    private final TodoRepository todoRepository;
    private final LabelRepository labelRepository;

    // 기존 메서드 유지 (다른 곳에서 사용할 수도 있으므로)
    @Transactional(readOnly = true)
    public List<Integer> getTodoLabelIdsByTodoIds(int todoId) {
        return todoLabelRepository.findByTodoId(todoId).stream()
                .map(todoLabel -> todoLabel.getLabel().getId())
                .collect(Collectors.toList());
    }

    // 새로 추가: LabelDto 객체들을 반환하는 메서드
    @Transactional(readOnly = true)
    public List<LabelDto> getTodoLabelsByTodoId(int todoId) {
        return todoLabelRepository.findByTodoId(todoId).stream()
                .map(todoLabel -> new LabelDto(
                        todoLabel.getLabel().getId(),
                        todoLabel.getLabel().getName(),
                        todoLabel.getLabel().getColor()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public TodoLabel createTodoLabel(int todoId, int labelId) {
        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new IllegalArgumentException("Todo not found"));

        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new IllegalArgumentException("Label not found"));

        TodoLabel todoLabel = new TodoLabel(todo, label);
        return todoLabelRepository.save(todoLabel);
    }

    @Transactional
    public List<TodoLabel> createTodoLabels(int todoId, List<Integer> labelIds) {
        List<TodoLabel> result = new ArrayList<>();

        for (Integer labelId : labelIds) {
            boolean exists = todoLabelRepository.existsByTodoIdAndLabelId(todoId, labelId);

            if (exists) {
                continue;
            }

            TodoLabel todoLabel = createTodoLabel(todoId, labelId);
            result.add(todoLabel);
        }

        return result;
    }

    @Transactional
    public List<TodoLabel> updateTodoLabels(int todoId, List<Integer> labelIds) {
        List<TodoLabel> result = new ArrayList<>();
        List<Integer> savedLabelIds = getTodoLabelIdsByTodoIds(todoId);

        // 기존 라벨들 모두 제거
        deleteAllTodoLabelsByTodoId(todoId);
        //기존 삭제 코드
//        for (Integer labelId : savedLabelIds) {
//            removeTodoLabelFromTodo(todoId, labelId);
//        }

        // 새로운 라벨들 추가
        List<TodoLabel> todoLabels = createTodoLabels(todoId, labelIds);
        result.addAll(todoLabels);

        return result;
    }
    //기존 전체 삭제 (비효율적이므로, 일괄 삭제로 변경)
    @Transactional
    public void removeTodoLabelFromTodo(int todoId, int labelId) {
        TodoLabel todoLabel = todoLabelRepository.findByTodoIdAndLabelId(todoId, labelId)
                .orElseThrow(() -> new IllegalArgumentException("todoLabel not found"));

        todoLabelRepository.delete(todoLabel);
    }

    // 일괄 삭제
    @Transactional
    public void deleteAllTodoLabelsByTodoId(int todoId) {
        List<TodoLabel> todoLabels = todoLabelRepository.findByTodoId(todoId);
        if (!todoLabels.isEmpty()) {
            todoLabelRepository.deleteAll(todoLabels); // 일괄 삭제
        }
    }
}