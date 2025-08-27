package com.tododuk.domain.todoList.repository;

import com.tododuk.domain.todoList.entity.TodoList;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TodoListRepository extends JpaRepository<TodoList, Integer> {
    List<TodoList> findAllByUserId(Integer userId);
    
    // 팀과 사용자로 할일 목록 조회
    Optional<TodoList> findByTeamIdAndUserId(Integer teamId, Integer userId);
    
    // 팀이 null인 개인 할일 목록 조회
    List<TodoList> findByTeamIdIsNullAndUserId(Integer userId);
    
    // 팀의 모든 할일 목록 조회
    List<TodoList> findByTeamId(Integer teamId);
}
