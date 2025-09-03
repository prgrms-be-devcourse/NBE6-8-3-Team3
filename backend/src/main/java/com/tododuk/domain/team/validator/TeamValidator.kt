package com.tododuk.domain.team.validator

import com.tododuk.domain.team.entity.Team
import com.tododuk.domain.team.repository.TeamRepository
import com.tododuk.domain.todo.entity.Todo
import com.tododuk.domain.todo.repository.TodoRepository
import com.tododuk.domain.todoList.entity.TodoList
import com.tododuk.domain.todoList.repository.TodoListRepository
import com.tododuk.domain.user.entity.User
import com.tododuk.domain.user.repository.UserRepository
import com.tododuk.global.exception.ServiceException
import org.springframework.stereotype.Component

@Component
class TeamValidator(
    private val teamRepository: TeamRepository,
    private val userRepository: UserRepository,
    private val todoRepository: TodoRepository,
    private val todoListRepository: TodoListRepository
) {

    /**
     * 팀 존재 여부 확인 및 반환
     */
    fun validateAndGetTeam(teamId: Int): Team {
        return teamRepository.findById(teamId)
            .orElseThrow { ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다. ID: $teamId") }
    }

    /**
     * 사용자 존재 여부 확인 및 반환
     */
    fun validateAndGetUser(userId: Int): User {
        return userRepository.findById(userId)
            .orElseThrow { ServiceException("404-USER_NOT_FOUND", "사용자를 찾을 수 없습니다. ID: $userId") }
    }

    /**
     * 이메일로 사용자 존재 여부 확인 및 반환
     */
    fun validateAndGetUserByEmail(email: String): User {
        return userRepository.findByUserEmail(email)
            .orElseThrow { ServiceException("404-USER_NOT_FOUND", "해당 이메일의 사용자를 찾을 수 없습니다: $email") }
    }

    /**
     * Todo 존재 여부 확인 및 반환
     */
    fun validateAndGetTodo(todoId: Int): Todo {
        return todoRepository.findById(todoId)
            .orElseThrow { ServiceException("404-TODO_NOT_FOUND", "할일을 찾을 수 없습니다. ID: $todoId") }
    }

    /**
     * TodoList 존재 여부 확인 및 반환
     */
    fun validateAndGetTodoList(todoListId: Int): TodoList {
        return todoListRepository.findById(todoListId)
            .orElseThrow { ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다. ID: $todoListId") }
    }

    /**
     * Todo가 특정 팀에 속하는지 확인
     */
    fun validateTodoBelongsToTeam(todo: Todo, teamId: Int) {
        if (todo.todoList?.team == null || todo.todoList?.team?.id != teamId) {
            throw ServiceException("403-FORBIDDEN", "해당 팀의 할일이 아닙니다.")
        }
    }

    /**
     * TodoList가 특정 팀에 속하는지 확인
     */
    fun validateTodoListBelongsToTeam(todoList: TodoList, teamId: Int) {
        if (todoList.team == null || todoList.team?.id != teamId) {
            throw ServiceException("403-FORBIDDEN", "해당 팀의 할일 목록이 아닙니다.")
        }
    }

    /**
     * 개인 할일 요청 거부 (팀 서비스에서)
     */
    fun validateNotPersonalTodo(teamId: Int) {
        if (teamId == 0) {
            throw ServiceException("400-BAD_REQUEST", "개인 할일은 지원하지 않습니다.")
        }
    }

    /**
     * 이미 팀 멤버인지 확인
     */
    fun validateNotAlreadyMember(team: Team, userEmail: String) {
        val isAlreadyMember = team.members.any { it.user?.userEmail == userEmail }
        if (isAlreadyMember) {
            throw ServiceException("409-ALREADY_MEMBER", "이미 해당 팀의 멤버입니다. Email: $userEmail")
        }
    }

    /**
     * 필수 파라미터 검증
     */
    fun validateRequiredParameter(value: Any?, paramName: String) {
        if (value == null) {
            throw ServiceException("400-BAD_REQUEST", "$paramName 는 필수입니다.")
        }
    }

    /**
     * 할일 담당자 변경에 필요한 모든 검증
     */
    fun validateTodoAssignmentChange(teamId: Int, todoId: Int): Todo {
        val todo = validateAndGetTodo(todoId)
        
        // TodoList가 null인지 확인
        if (todo.todoList == null) {
            throw ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다.")
        }
        
        validateTodoBelongsToTeam(todo, teamId)
        return todo
    }
}