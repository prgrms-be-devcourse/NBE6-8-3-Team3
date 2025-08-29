package com.tododuk.domain.team.repository

import com.tododuk.domain.team.entity.TodoAssignment
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface TodoAssignmentRepository : JpaRepository<TodoAssignment, Int> {

    // 특정 Todo의 활성 담당자 조회
    fun findByTodo_IdAndStatus(todoId: Int, status: TodoAssignment.AssignmentStatus): Optional<TodoAssignment>

    // 특정 Todo의 모든 담당자 기록 조회
    fun findByTodo_IdOrderByAssignedAtDesc(todoId: Int): List<TodoAssignment>

    // 특정 팀의 모든 담당자 기록 조회
    fun findByTeam_IdOrderByAssignedAtDesc(teamId: Int): List<TodoAssignment>

    // 특정 사용자가 담당자인 Todo 목록 조회
    fun findByAssignedUser_IdAndStatusOrderByAssignedAtDesc(
        userId: Int,
        status: TodoAssignment.AssignmentStatus
    ): List<TodoAssignment>

    // 특정 팀에서 특정 사용자가 담당자인 Todo 목록 조회
    fun findByTeam_IdAndAssignedUser_IdAndStatusOrderByAssignedAtDesc(
        teamId: Int,
        userId: Int,
        status: TodoAssignment.AssignmentStatus
    ): List<TodoAssignment>

    // 특정 Todo의 모든 담당자 기록 삭제
    fun deleteByTodo_Id(todoId: Int)

    // 특정 팀에서 특정 사용자의 모든 담당자 기록 삭제
    fun deleteByTeam_IdAndAssignedUser_Id(teamId: Int, userId: Int)

    // 특정 팀의 모든 담당자 기록 삭제
    fun deleteByTeam_Id(teamId: Int)
}