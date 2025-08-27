package com.tododuk.domain.todo.service;

import com.tododuk.domain.todo.dto.TodoReqDto;
import com.tododuk.domain.todo.dto.TodoResponseDto;
import com.tododuk.domain.todo.entity.Todo;
import com.tododuk.domain.todo.repository.TodoRepository;
import com.tododuk.domain.todoLabel.service.TodoLabelService;
import com.tododuk.domain.todoList.entity.TodoList;
import com.tododuk.domain.todoList.repository.TodoListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TodoService {
    private final  TodoRepository todoRepository;
    private final TodoListRepository todoListRepository;
    private final TodoLabelService todoLabelService;

    public Todo save(Todo todo) {
        return todoRepository.save(todo);
    }
    public Todo createTodo(String title, String description, boolean completed) {
        Todo todo = new Todo(title, description, completed);
        return todoRepository.save(todo);
    }


    public Todo getTodoById(int id) {
     return  todoRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Todo not found with id: " + id));
    }

    public List<TodoResponseDto> getAllTodos() {
        return todoRepository.findAll().stream()
                .map(TodoResponseDto::from)
                .toList();
    }

    public TodoResponseDto getTodo(int id){
        Todo todo = todoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 todo는 존재하지 않습니다."));
        return TodoResponseDto.from(todo);
    }

    @Transactional
    public Todo addTodo(TodoReqDto reqDto){
        TodoList todoList = todoListRepository.findById(reqDto.getTodoListId())
                .orElseThrow(() -> new IllegalArgumentException("해당 todo_list_id는 존재하지 않습니다."));
        Todo todo = reqDto.toEntity();
        todo.setTodoList(todoList);
        return todoRepository.save(todo);
    }

    @Transactional
    public Todo updateTodo(int id, TodoReqDto reqDto){
        Todo todo = todoRepository.findById(id)
                .orElseThrow(()-> new IllegalArgumentException("해당 todo는 존재하지 않습니다."));
        TodoList todoList = todoListRepository.findById(reqDto.getTodoListId())
                .orElseThrow(() -> new IllegalArgumentException("해당 todo_list_id는 존재하지 않습니다."));
        todo.setTodoList(todoList);
        todo.update(reqDto);
        return todo;
    }

    @Transactional
    public void deleteTodo(Integer todoId) {
        // 1. Todo 존재 확인
        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new IllegalArgumentException("해당 Todo를 찾을 수 없습니다."));

        // 2. 연관된 TodoLabel들 먼저 전체 삭제 (todoLabel 자체를 제거)
        todoLabelService.deleteAllTodoLabelsByTodoId(todoId);

        // 3. Todo 삭제
        todoRepository.delete(todo);
    }

    @Transactional
    public TodoResponseDto isComplete(Integer todoId) {
        Todo todo = todoRepository.findById(todoId)
                .orElseThrow(()-> new IllegalArgumentException("해당 todo는 존재하지 않습니다."));
        todo.setCompleted(!todo.isCompleted());

        return TodoResponseDto.from(todoRepository.save(todo));
    }

    public List<TodoResponseDto> getUserTodo(Integer userId) {
        List<Todo> todos = todoRepository.findAllByTodoListUserId(userId);
        return todos.stream()
                .map(TodoResponseDto::from)
                .collect(Collectors.toList());
    }


    public List<TodoResponseDto> getTodoByTodoListId(Integer id) {
        List<Todo> todos = todoRepository.findAllByTodoListId(id);
        return todos.stream()
                .map(TodoResponseDto::from)
                .collect(Collectors.toList());

    }

}