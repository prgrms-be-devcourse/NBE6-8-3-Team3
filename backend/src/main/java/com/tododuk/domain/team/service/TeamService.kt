package com.tododuk.domain.team.service

import com.tododuk.domain.team.dto.TeamCreateRequestDto
import com.tododuk.domain.team.dto.TeamResponseDto
import com.tododuk.domain.team.dto.TeamUpdateRequestDto
import com.tododuk.domain.team.entity.Team
import com.tododuk.domain.team.entity.TodoAssignment
import com.tododuk.domain.team.repository.TeamMemberRepository
import com.tododuk.domain.team.repository.TeamRepository
import com.tododuk.domain.team.repository.TodoAssignmentRepository
import com.tododuk.domain.team.validator.TeamPermissionValidator
import com.tododuk.domain.team.validator.TeamValidator
import com.tododuk.domain.todo.entity.Todo
import com.tododuk.domain.todo.repository.TodoRepository
import com.tododuk.domain.todoList.entity.TodoList
import com.tododuk.domain.todoList.repository.TodoListRepository
import com.tododuk.domain.user.entity.User
import com.tododuk.global.exception.ServiceException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional(readOnly = true)
class TeamService(
    private val teamRepository: TeamRepository,
    private val teamMemberRepository: TeamMemberRepository,
    private val teamMemberService: TeamMemberService,
    private val todoRepository: TodoRepository,
    private val todoListRepository: TodoListRepository,
    private val todoAssignmentRepository: TodoAssignmentRepository,
    private val teamPermissionValidator: TeamPermissionValidator,
    private val teamValidator: TeamValidator
) {

    // ===== 팀 기본 CRUD =====

    @Transactional
    fun createTeam(dto: TeamCreateRequestDto, creatorUserId: Int): TeamResponseDto {
        println("=== 팀 생성 시작 ===")
        println("생성자 ID: $creatorUserId")

        val creatorUser = teamValidator.validateAndGetUser(creatorUserId)
        println("생성자 정보: ${creatorUser.userEmail}")

        val team = Team().apply {
            teamName = dto.teamName
            description = dto.description
        }
        teamRepository.save(team)
        println("팀 생성 완료, 팀 ID: ${team.id}")

        val leaderMember = teamMemberService.createLeaderMember(team, creatorUser)
        println("리더 멤버 생성 완료, 멤버 ID: ${leaderMember.id}")

        return TeamResponseDto.from(team)
    }

    fun getMyTeams(userId: Int): List<TeamResponseDto> {
        val teams = teamRepository.findTeamsByUserId(userId)

        if (teams.isEmpty()) {
            return emptyList()
        }

        return teams.map { team ->
            val teamWithMembers = teamRepository.findByIdWithMembers(team.id).orElse(team)
            TeamResponseDto.from(teamWithMembers)
        }
    }

    fun getTeamsByUserId(userId: Int): List<Team> {
        return teamRepository.findTeamsByUserId(userId)
    }

    fun getAllTeams(): List<Team> {
        return teamRepository.findAll()
    }

    fun getTeamDetails(teamId: Int, viewerUserId: Int): TeamResponseDto {
        println("=== 팀 상세 조회 시작 ===")
        println("팀 ID: $teamId, 조회자 ID: $viewerUserId")

        val team = teamValidator.validateAndGetTeam(teamId)
        teamPermissionValidator.validateTeamMember(teamId, viewerUserId, "해당 팀의 정보를 조회할 권한이 없습니다.")

        println("멤버 확인됨 - 상세 정보 반환")
        return TeamResponseDto.from(team)
    }

    @Transactional
    fun updateTeamInfo(teamId: Int, dto: TeamUpdateRequestDto, modifierUserId: Int): TeamResponseDto {
        val team = teamValidator.validateAndGetTeam(teamId)
        teamPermissionValidator.validateTeamLeader(teamId, modifierUserId, "팀 정보를 수정할 권한이 없습니다.")

        team.updateTeam(dto.teamName, dto.description)
        teamRepository.save(team)
        return TeamResponseDto.from(team)
    }

    @Transactional
    fun deleteTeam(teamId: Int, deleterUserId: Int) {
        val team = teamValidator.validateAndGetTeam(teamId)
        teamPermissionValidator.validateTeamLeader(teamId, deleterUserId, "팀을 삭제할 권한이 없습니다.")

        // 관련 데이터 정리
        cleanupTeamData(teamId)
        teamRepository.delete(team)
    }

    // ===== 팀 할일 관리 =====

    fun getTeamTodos(teamId: Int, userId: Int): List<Map<String, Any?>> {
        teamPermissionValidator.validateTeamMember(teamId, userId, "해당 팀의 할일 목록을 조회할 권한이 없습니다.")
        teamValidator.validateNotPersonalTodo(teamId)

        val todoList = getOrCreateTeamTodoList(teamId, userId)
        return mapTodosToResponse(todoRepository.findAllByTodoListId(todoList.id), teamId)
    }

    @Transactional
    fun addTeamTodo(teamId: Int, userId: Int, todoRequest: Map<String, Any?>): Map<String, Any?> {
        teamPermissionValidator.validateTeamMember(teamId, userId, "해당 팀에 할일을 추가할 권한이 없습니다.")
        teamValidator.validateNotPersonalTodo(teamId)

        val todoList = getOrCreateTeamTodoList(teamId, userId)
        val savedTodo = createTodoFromRequest(todoRequest, todoList)

        return mapTodoToResponse(savedTodo, teamId)
    }

    fun getTeamTodoLists(teamId: Int, userId: Int): List<Map<String, Any?>> {
        teamPermissionValidator.validateTeamMember(teamId, userId)

        val todoLists = todoListRepository.findAll()
            .filter { it.team?.id == teamId }

        return todoLists.map { todoList ->
            mapOf<String, Any?>(
                "id" to todoList.id,
                "name" to todoList.name,
                "description" to todoList.description,
                "userId" to todoList.user.id,
                "teamId" to todoList.team?.id,
                "createDate" to todoList.createDate,
                "modifyDate" to todoList.modifyDate
            )
        }
    }

    @Transactional
    fun createTeamTodoList(teamId: Int, todoListRequest: Map<String, Any?>, userId: Int): Map<String, Any?> {
        teamPermissionValidator.validateTeamMember(teamId, userId)

        val user = teamValidator.validateAndGetUser(userId)
        val team = teamValidator.validateAndGetTeam(teamId)

        val todoList = TodoList(
            todoListRequest["name"] as? String,
            todoListRequest["description"] as? String,
            user,
            team
        )
        todoListRepository.save(todoList)

        return mapTodoListToResponse(todoList)
    }

    @Transactional
    fun updateTeamTodoList(teamId: Int, todoListId: Int, todoListRequest: Map<String, Any?>, userId: Int): Map<String, Any?> {
        teamPermissionValidator.validateTeamMember(teamId, userId)

        val todoList = teamValidator.validateAndGetTodoList(todoListId)
        teamValidator.validateTodoListBelongsToTeam(todoList, teamId)

        todoList.apply {
            name = todoListRequest["name"] as? String
            description = todoListRequest["description"] as? String
        }
        todoListRepository.save(todoList)

        return mapTodoListToResponse(todoList)
    }

    @Transactional
    fun deleteTeamTodoList(teamId: Int, todoListId: Int, userId: Int) {
        teamPermissionValidator.validateTeamMember(teamId, userId)

        val todoList = teamValidator.validateAndGetTodoList(todoListId)
        teamValidator.validateTodoListBelongsToTeam(todoList, teamId)

        // 관련 할일들의 담당자 정보 삭제
        cleanupTodoListAssignments(todoListId)
        todoListRepository.delete(todoList)
    }

    fun getTeamTodosByList(teamId: Int, todoListId: Int, userId: Int): List<Map<String, Any?>> {
        teamPermissionValidator.validateTeamMember(teamId, userId)

        val todoList = teamValidator.validateAndGetTodoList(todoListId)
        teamValidator.validateTodoListBelongsToTeam(todoList, teamId)

        val todos = todoRepository.findByTodoListId(todoListId)
        return todos.map { mapTodoToDetailResponse(it) }
    }

    @Transactional
    fun addTodoToTeamList(teamId: Int, todoListId: Int, todoRequest: Map<String, Any?>, userId: Int): Map<String, Any?> {
        teamPermissionValidator.validateTeamMember(teamId, userId)

        val todoList = teamValidator.validateAndGetTodoList(todoListId)
        teamValidator.validateTodoListBelongsToTeam(todoList, teamId)

        val savedTodo = createTodoFromRequest(todoRequest, todoList)
        return mapTodoToDetailResponse(savedTodo)
    }

    @Transactional
    fun updateTeamTodo(teamId: Int, todoId: Int, todoRequest: Map<String, Any?>, userId: Int): Map<String, Any?> {
        teamPermissionValidator.validateTeamMember(teamId, userId)

        val todo = teamValidator.validateTodoAssignmentChange(teamId, todoId)
        updateTodoFromRequest(todo, todoRequest)
        todoRepository.save(todo)

        return mapTodoToDetailResponse(todo)
    }

    @Transactional
    fun deleteTeamTodo(teamId: Int, todoId: Int, userId: Int) {
        try {
            println("=== 할일 삭제 시작 ===")
            println("teamId: $teamId, todoId: $todoId, userId: $userId")

            teamPermissionValidator.validateTeamMember(teamId, userId)
            val todo = teamValidator.validateTodoAssignmentChange(teamId, todoId)

            println("할일 삭제 전 담당자 정보 삭제")
            todoAssignmentRepository.deleteByTodo_Id(todoId)

            todoRepository.delete(todo)
            println("할일 삭제 완료")
        } catch (e: Exception) {
            println("할일 삭제 중 예상치 못한 오류 발생: ${e.message}")
            e.printStackTrace()
            throw ServiceException("500-2", "할일 삭제 중 오류가 발생했습니다: ${e.message}")
        }
    }

    @Transactional
    fun toggleTeamTodoComplete(teamId: Int, todoId: Int, userId: Int): Map<String, Any?> {
        teamPermissionValidator.validateTeamMember(teamId, userId)

        val todo = teamValidator.validateTodoAssignmentChange(teamId, todoId)
        todo.isCompleted = !todo.isCompleted
        todoRepository.save(todo)

        return mapTodoToDetailResponse(todo)
    }

    // ===== 담당자 관리 =====

    @Transactional
    fun assignTodoToMember(teamId: Int, todoId: Int, assignedUserId: Int, assignerUserId: Int): Map<String, Any?> {
        teamPermissionValidator.validateTeamMember(teamId, assignerUserId, "팀 멤버만 접근할 수 있습니다.")
        teamPermissionValidator.validateTeamMember(teamId, assignedUserId, "담당자는 팀 멤버여야 합니다.")

        val todo = teamValidator.validateTodoAssignmentChange(teamId, todoId)
        val assignedUser = teamValidator.validateAndGetUser(assignedUserId)
        val team = teamValidator.validateAndGetTeam(teamId)

        // 기존 활성 담당자 비활성화
        deactivateExistingAssignments(todoId)

        // 새로운 담당자 지정
        val newAssignment = createNewAssignment(todo, assignedUser, team)

        return mapOf<String, Any?>(
            "todoId" to todoId,
            "assignedUserId" to assignedUserId,
            "assignedUserNickname" to assignedUser.nickName,
            "assignedAt" to newAssignment.assignedAt
        )
    }

    @Transactional
    fun unassignTodo(teamId: Int, todoId: Int, unassignerUserId: Int) {
        teamPermissionValidator.validateTeamMember(teamId, unassignerUserId, "팀 멤버만 접근할 수 있습니다.")
        teamValidator.validateTodoAssignmentChange(teamId, todoId)

        deactivateExistingAssignments(todoId)
    }

    fun getTodoAssignment(teamId: Int, todoId: Int, userId: Int): Map<String, Any?> {
        teamPermissionValidator.validateTeamMember(teamId, userId, "팀 멤버만 접근할 수 있습니다.")
        teamValidator.validateTodoAssignmentChange(teamId, todoId)

        val assignment = todoAssignmentRepository.findByTodo_IdAndStatus(todoId, TodoAssignment.AssignmentStatus.ACTIVE)

        return if (assignment.isPresent) {
            val activeAssignment = assignment.get()
            mapOf<String, Any?>(
                "assignedUserId" to activeAssignment.assignedUser?.id,
                "assignedUserNickname" to activeAssignment.assignedUser?.nickName,
                "assignedUserEmail" to activeAssignment.assignedUser?.userEmail,
                "assignedAt" to activeAssignment.assignedAt
            )
        } else {
            mapOf<String, Any?>(
                "assignedUserId" to null,
                "assignedUserNickname" to null,
                "assignedUserEmail" to null,
                "assignedAt" to null
            )
        }
    }

    fun getTeamAssignments(teamId: Int, userId: Int): List<Map<String, Any?>> {
        teamPermissionValidator.validateTeamMember(teamId, userId, "팀 멤버만 접근할 수 있습니다.")

        val assignments = todoAssignmentRepository.findByTeam_IdOrderByAssignedAtDesc(teamId)
        return assignments.map { assignment ->
            mapOf<String, Any?>(
                "id" to assignment.id,
                "todoId" to assignment.todo?.id,
                "todoTitle" to assignment.todo?.title,
                "assignedUserId" to assignment.assignedUser?.id,
                "assignedUserNickname" to assignment.assignedUser?.nickName,
                "assignedUserEmail" to assignment.assignedUser?.userEmail,
                "assignedAt" to assignment.assignedAt,
                "status" to assignment.status
            )
        }
    }

    fun getTodoAssignees(teamId: Int, todoId: Int, userId: Int): List<Map<String, Any?>> {
        teamPermissionValidator.validateTeamMember(teamId, userId, "팀 멤버만 접근할 수 있습니다.")
        teamValidator.validateTodoAssignmentChange(teamId, todoId)

        val assignments = todoAssignmentRepository.findByTodo_IdOrderByAssignedAtDesc(todoId)
        val activeAssignments = assignments.filter { it.status == TodoAssignment.AssignmentStatus.ACTIVE }

        return activeAssignments.map { assignment ->
            mapOf<String, Any?>(
                "assignedUserId" to assignment.assignedUser?.id,
                "assignedUserNickname" to assignment.assignedUser?.nickName,
                "assignedUserEmail" to assignment.assignedUser?.userEmail,
                "assignedAt" to assignment.assignedAt
            )
        }
    }

    @Transactional
    fun assignMultipleTodoAssignees(teamId: Int, todoId: Int, assignedUserIds: List<Int>, assignerUserId: Int): Map<String, Any?> {
        teamPermissionValidator.validateTeamMember(teamId, assignerUserId, "팀 멤버만 접근할 수 있습니다.")
        teamPermissionValidator.validateAllAreTeamMembers(teamId, assignedUserIds)

        val todo = teamValidator.validateTodoAssignmentChange(teamId, todoId)
        val team = teamValidator.validateAndGetTeam(teamId)

        val (toRemoveIds, toAddIds) = calculateAssignmentChanges(todoId, assignedUserIds.toSet())

        // 제거할 담당자들 비활성화
        deactivateAssignments(todoId, toRemoveIds)

        // 새로 추가할 담당자들 처리
        val newAssignmentsCount = addNewAssignments(todo, team, toAddIds)

        return mapOf<String, Any?>(
            "todoId" to todoId,
            "assignedUserIds" to assignedUserIds,
            "assignedCount" to assignedUserIds.size,
            "removedCount" to toRemoveIds.size,
            "addedCount" to newAssignmentsCount,
            "assignedAt" to LocalDateTime.now()
        )
    }

    fun isTodoAssignee(teamId: Int, todoId: Int, userId: Int): Boolean {
        if (!teamPermissionValidator.isTeamMember(teamId, userId)) {
            return false
        }

        val activeAssignments = todoAssignmentRepository.findByTodo_IdOrderByAssignedAtDesc(todoId)
        return activeAssignments.any { assignment ->
            assignment.status == TodoAssignment.AssignmentStatus.ACTIVE &&
                    assignment.assignedUser?.id == userId
        }
    }

    fun getTeamStats(teamId: Int, userId: Int): Map<String, Any?> {
        teamPermissionValidator.validateTeamMember(teamId, userId, "팀 멤버만 접근할 수 있습니다.")

        val team = teamValidator.validateAndGetTeam(teamId)
        val teamTodoLists = getAllTodoLists().filter { it.team?.id == teamId }

        val (totalTodos, completedTodos, overdueTodos) = calculateTeamStats(teamTodoLists)

        return mapOf<String, Any?>(
            "total" to totalTodos,
            "completed" to completedTodos,
            "overdue" to overdueTodos,
            "inProgress" to (totalTodos - completedTodos - overdueTodos),
            "completionRate" to if (totalTodos > 0) Math.round((completedTodos.toDouble() / totalTodos * 100)) else 0
        )
    }

    // ===== Private Helper Methods =====

    private fun cleanupTeamData(teamId: Int) {
        todoAssignmentRepository.deleteByTeam_Id(teamId)

        val teamTodoLists = todoListRepository.findByTeamId(teamId)
        teamTodoLists.forEach { todoList ->
            val todos = todoRepository.findByTodoListId(todoList.id)
            todos.forEach { todo ->
                todoAssignmentRepository.deleteByTodo_Id(todo.id)
            }
            todoListRepository.delete(todoList)
        }
    }

    private fun cleanupTodoListAssignments(todoListId: Int) {
        val todos = todoRepository.findByTodoListId(todoListId)
        todos.forEach { todo ->
            todoAssignmentRepository.deleteByTodo_Id(todo.id)
        }
    }

    private fun getOrCreateTeamTodoList(teamId: Int, userId: Int): TodoList {
        return todoListRepository.findByTeamIdAndUserId(teamId, userId)
            .orElseGet {
                val user = teamValidator.validateAndGetUser(userId)
                val team = teamValidator.validateAndGetTeam(teamId)

                val newList = TodoList(
                    "${team.teamName} 할일 목록",
                    "팀원들과 함께 관리하는 할일들",
                    user,
                    team
                )
                todoListRepository.save(newList)
            }
    }

    private fun createTodoFromRequest(todoRequest: Map<String, Any?>, todoList: TodoList): Todo {
        val todo = Todo(
            todoRequest["title"] as? String,
            todoRequest["description"] as? String,
            false,
            (todoRequest["priority"] as? Int) ?: 1,
            LocalDateTime.now(),
            todoRequest["dueDate"]?.let {
                LocalDateTime.parse((it as String).replace("Z", ""))
            },
            todoList
        )
        return todoRepository.save(todo)
    }

    private fun updateTodoFromRequest(todo: Todo, todoRequest: Map<String, Any?>) {
        todo.apply {
            title = todoRequest["title"] as? String
            description = todoRequest["description"] as? String
            priority = todoRequest["priority"] as? Int ?: priority
            dueDate = todoRequest["dueDate"]?.let { dueDateValue ->
                if (dueDateValue is String && dueDateValue.isNotEmpty()) {
                    try {
                        LocalDateTime.parse(dueDateValue.replace("Z", ""))
                    } catch (e: Exception) { null }
                } else null
            }
        }
    }

    private fun mapTodosToResponse(todos: List<Todo>, teamId: Int): List<Map<String, Any?>> {
        return todos.map { todo ->
            mapOf<String, Any?>(
                "id" to todo.id,
                "title" to todo.title,
                "description" to todo.description,
                "isCompleted" to todo.isCompleted,
                "priority" to todo.priority,
                "dueDate" to todo.dueDate,
                "assignedMemberId" to null,
                "type" to if (teamId == 0) "personal" else "team",
                "createdAt" to todo.createDate
            )
        }
    }

    private fun mapTodoToResponse(todo: Todo, teamId: Int): Map<String, Any?> {
        return mapOf<String, Any?>(
            "id" to todo.id,
            "title" to todo.title,
            "description" to todo.description,
            "isCompleted" to todo.isCompleted,
            "priority" to todo.priority,
            "dueDate" to todo.dueDate,
            "assignedMemberId" to null,
            "type" to if (teamId == 0) "personal" else "team",
            "createdAt" to todo.createDate
        )
    }

    private fun mapTodoToDetailResponse(todo: Todo): Map<String, Any?> {
        return mapOf<String, Any?>(
            "id" to todo.id,
            "title" to todo.title,
            "description" to todo.description,
            "priority" to todo.priority,
            "completed" to todo.isCompleted,
            "todoListId" to todo.todoList?.id,
            "createdAt" to todo.createDate,
            "updatedAt" to todo.modifyDate,
            "startDate" to todo.startDate,
            "dueDate" to todo.dueDate
        )
    }

    private fun mapTodoListToResponse(todoList: TodoList): Map<String, Any?> {
        return mapOf<String, Any?>(
            "id" to todoList.id,
            "name" to todoList.name,
            "description" to todoList.description,
            "userId" to todoList.user.id,
            "teamId" to todoList.team?.id,
            "createDate" to todoList.createDate,
            "modifyDate" to todoList.modifyDate
        )
    }

    private fun deactivateExistingAssignments(todoId: Int) {
        todoAssignmentRepository.findByTodo_IdAndStatus(todoId, TodoAssignment.AssignmentStatus.ACTIVE)
            .ifPresent { existingAssignment ->
                existingAssignment.status = TodoAssignment.AssignmentStatus.INACTIVE
                todoAssignmentRepository.save(existingAssignment)
            }
    }

    private fun createNewAssignment(todo: Todo, assignedUser: User, team: Team): TodoAssignment {
        val newAssignment = TodoAssignment(todo, assignedUser, team, LocalDateTime.now(), TodoAssignment.AssignmentStatus.ACTIVE)
        return todoAssignmentRepository.save(newAssignment)
    }

    private fun calculateAssignmentChanges(todoId: Int, newAssigneeIds: Set<Int>): Pair<Set<Int>, Set<Int>> {
        val existingAssignments = todoAssignmentRepository.findByTodo_IdOrderByAssignedAtDesc(todoId)
        val activeAssignments = existingAssignments.filter { it.status == TodoAssignment.AssignmentStatus.ACTIVE }
        val existingAssigneeIds = activeAssignments.map { it.assignedUser?.id }.filterNotNull().toSet()

        val toRemoveIds = existingAssigneeIds.filter { !newAssigneeIds.contains(it) }.toSet()
        val toAddIds = newAssigneeIds.filter { !existingAssigneeIds.contains(it) }.toSet()

        return Pair(toRemoveIds, toAddIds)
    }

    private fun deactivateAssignments(todoId: Int, toRemoveIds: Set<Int>) {
        val existingAssignments = todoAssignmentRepository.findByTodo_IdOrderByAssignedAtDesc(todoId)
        val activeAssignments = existingAssignments.filter { it.status == TodoAssignment.AssignmentStatus.ACTIVE }

        activeAssignments.forEach { assignment ->
            if (toRemoveIds.contains(assignment.assignedUser?.id)) {
                assignment.status = TodoAssignment.AssignmentStatus.INACTIVE
                todoAssignmentRepository.save(assignment)
            }
        }
    }

    private fun addNewAssignments(todo: Todo, team: Team, toAddIds: Set<Int>): Int {
        var newAssignmentsCount = 0
        val existingAssignments = todoAssignmentRepository.findByTodo_IdOrderByAssignedAtDesc(todo.id)

        toAddIds.forEach { assignedUserId ->
            val assignedUser = teamValidator.validateAndGetUser(assignedUserId)

            val existingInactive = existingAssignments
                .firstOrNull { assignment ->
                    assignment.assignedUser?.id == assignedUserId &&
                            assignment.status == TodoAssignment.AssignmentStatus.INACTIVE
                }

            if (existingInactive != null) {
                existingInactive.status = TodoAssignment.AssignmentStatus.ACTIVE
                existingInactive.assignedAt = LocalDateTime.now()
                todoAssignmentRepository.save(existingInactive)
            } else {
                val newAssignment = TodoAssignment(todo, assignedUser, team, LocalDateTime.now(), TodoAssignment.AssignmentStatus.ACTIVE)
                todoAssignmentRepository.save(newAssignment)
            }
            newAssignmentsCount++
        }

        return newAssignmentsCount
    }

    private fun getAllTodoLists(): List<TodoList> = todoListRepository.findAll()

    private fun calculateTeamStats(teamTodoLists: List<TodoList>): Triple<Int, Int, Int> {
        var totalTodos = 0
        var completedTodos = 0
        var overdueTodos = 0

        teamTodoLists.forEach { todoList ->
            val todos = todoRepository.findByTodoListId(todoList.id)

            todos.forEach { todo ->
                totalTodos++
                if (todo.isCompleted) {
                    completedTodos++
                }
                if (!todo.isCompleted && todo.dueDate != null && todo.dueDate!!.isBefore(LocalDateTime.now())) {
                    overdueTodos++
                }
            }
        }

        return Triple(totalTodos, completedTodos, overdueTodos)
    }
}