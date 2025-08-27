package com.tododuk.domain.team.repository;

import com.tododuk.domain.team.entity.TodoAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TodoAssignmentRepository extends JpaRepository<TodoAssignment, Integer> {
    
    // 특정 Todo의 활성 담당자 조회
    Optional<TodoAssignment> findByTodo_IdAndStatus(int todoId, TodoAssignment.AssignmentStatus status);
    
    // 특정 Todo의 모든 담당자 기록 조회
    List<TodoAssignment> findByTodo_IdOrderByAssignedAtDesc(int todoId);
    
    // 특정 팀의 모든 담당자 기록 조회
    List<TodoAssignment> findByTeam_IdOrderByAssignedAtDesc(int teamId);
    
    // 특정 사용자가 담당자인 Todo 목록 조회
    List<TodoAssignment> findByAssignedUser_IdAndStatusOrderByAssignedAtDesc(int userId, TodoAssignment.AssignmentStatus status);
    
    // 특정 팀에서 특정 사용자가 담당자인 Todo 목록 조회
    List<TodoAssignment> findByTeam_IdAndAssignedUser_IdAndStatusOrderByAssignedAtDesc(
        int teamId, int userId, TodoAssignment.AssignmentStatus status);
    
    // 특정 Todo의 모든 담당자 기록 삭제
    void deleteByTodo_Id(int todoId);
    
    // 특정 팀에서 특정 사용자의 모든 담당자 기록 삭제
    void deleteByTeam_IdAndAssignedUser_Id(int teamId, int userId);
    
    // 특정 팀의 모든 담당자 기록 삭제
    void deleteByTeam_Id(int teamId);
} 