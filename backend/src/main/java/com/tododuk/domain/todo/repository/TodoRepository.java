package com.tododuk.domain.todo.repository;

import com.tododuk.domain.todo.entity.Todo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TodoRepository extends JpaRepository <Todo, Integer> {
    List<Todo> findAllByTodoListUserId(Integer userId);

    List<Todo> findAllByTodoListId(Integer id);

    // 할일 목록 ID로 할일 조회
    List<Todo> findByTodoListId(Integer todoListId);
}