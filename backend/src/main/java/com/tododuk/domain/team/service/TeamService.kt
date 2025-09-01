package com.tododuk.domain.team.service

import com.tododuk.domain.team.constant.TeamRoleType
import com.tododuk.domain.team.dto.TeamCreateRequestDto
import com.tododuk.domain.team.dto.TeamResponseDto
import com.tododuk.domain.team.dto.TeamUpdateRequestDto
import com.tododuk.domain.team.entity.Team
import com.tododuk.domain.team.entity.TodoAssignment
import com.tododuk.domain.team.repository.TeamMemberRepository
import com.tododuk.domain.team.repository.TeamRepository
import com.tododuk.domain.team.repository.TodoAssignmentRepository
import com.tododuk.domain.todo.entity.Todo
import com.tododuk.domain.todo.repository.TodoRepository
import com.tododuk.domain.todoList.entity.TodoList
import com.tododuk.domain.todoList.repository.TodoListRepository
import com.tododuk.domain.user.repository.UserRepository
import com.tododuk.global.exception.ServiceException
import com.tododuk.global.rsData.RsData
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional(readOnly = true)
class TeamService(
    private val teamRepository: TeamRepository,
    private val teamMemberRepository: TeamMemberRepository,
    private val userRepository: UserRepository,
    private val teamMemberService: TeamMemberService,
    private val todoRepository: TodoRepository,
    private val todoListRepository: TodoListRepository,
    private val todoAssignmentRepository: TodoAssignmentRepository
) {

    // 1. 팀 생성
    @Transactional
    fun createTeam(dto: TeamCreateRequestDto, creatorUserId: Int): RsData<TeamResponseDto> {
        println("=== 팀 생성 시작 ===")
        println("생성자 ID: $creatorUserId")

        val creatorUser = userRepository.findById(creatorUserId)
            .orElseThrow { ServiceException("404-USER_NOT_FOUND", "사용자를 찾을 수 없습니다. ID: $creatorUserId") }

        println("생성자 정보: ${creatorUser.userEmail}")

        val team = Team().apply {
            teamName = dto.teamName
            description = dto.description
        }
        teamRepository.save(team)
        println("팀 생성 완료, 팀 ID: ${team.id}")

        val leaderMember = teamMemberService.createLeaderMember(team, creatorUser)
        println("리더 멤버 생성 완료, 멤버 ID: ${leaderMember.id}")

        // 멤버가 실제로 추가되었는지 확인
        val isMemberExists = teamMemberRepository.existsByTeam_IdAndUser_Id(team.id, creatorUserId)
        println("멤버 존재 확인: $isMemberExists")

        return RsData.success("팀이 성공적으로 생성되었습니다.", TeamResponseDto.from(team))
    }

    // 2. 사용자가 속한 팀 목록 조회
    fun getMyTeams(userId: Int): RsData<List<TeamResponseDto>> {
        val teams = teamRepository.findTeamsByUserId(userId)

        if (teams.isEmpty()) {
            return RsData.success("속한 팀이 없습니다.", emptyList())
        }

        // 각 팀의 멤버 정보를 명시적으로 로드
        val teamResponseDtos = teams.map { team ->
            // 팀의 멤버 정보를 명시적으로 로드
            val teamWithMembers = teamRepository.findByIdWithMembers(team.id).orElse(team)
            TeamResponseDto.from(teamWithMembers)
        }

        return RsData.success("팀 목록 조회 성공", teamResponseDtos)
    }

    // 사용자 ID로 팀 목록 조회 (컨트롤러에서 사용)
    fun getTeamsByUserId(userId: Int): List<Team> {
        return teamRepository.findTeamsByUserId(userId)
    }

    // 모든 팀 목록 조회 (관리자용)
    fun getAllTeams(): List<Team> {
        return teamRepository.findAll()
    }

    // 3. 특정 팀 상세 조회
    fun getTeamDetails(teamId: Int, viewerUserId: Int): RsData<TeamResponseDto> {
        println("=== 팀 상세 조회 시작 ===")
        println("팀 ID: $teamId")
        println("조회자 ID: $viewerUserId")

        val team = teamRepository.findById(teamId)
            .orElseThrow { ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다. ID: $teamId") }

        val isMember = teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, viewerUserId)
        println("멤버 여부 확인: $isMember")

        if (!isMember) {
            println("멤버가 아님 - 권한 없음")
            throw ServiceException("403-NO_PERMISSION", "해당 팀의 정보를 조회할 권한이 없습니다.")
        }

        println("멤버 확인됨 - 상세 정보 반환")
        return RsData.success("팀 상세 정보 조회 성공", TeamResponseDto.from(team))
    }

    // 4. 팀 정보 수정 (PATCH)
    @Transactional
    fun updateTeamInfo(teamId: Int, dto: TeamUpdateRequestDto, modifierUserId: Int): RsData<TeamResponseDto> {
        val team = teamRepository.findById(teamId)
            .orElseThrow { ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다. ID: $teamId") }

        if (!teamMemberRepository.existsByTeam_IdAndUser_IdAndRole(teamId, modifierUserId, TeamRoleType.LEADER)) {
            throw ServiceException("403-NO_PERMISSION", "팀 정보를 수정할 권한이 없습니다.")
        }

        team.updateTeam(dto.teamName, dto.description)
        teamRepository.save(team)
        return RsData.success("팀 정보가 성공적으로 수정되었습니다.", TeamResponseDto.from(team))
    }

    // 5. 팀 삭제
    @Transactional
    fun deleteTeam(teamId: Int, deleterUserId: Int): RsData<Unit> {
        val team = teamRepository.findById(teamId)
            .orElseThrow { ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다. ID: $teamId") }

        if (!teamMemberRepository.existsByTeam_IdAndUser_IdAndRole(teamId, deleterUserId, TeamRoleType.LEADER)) {
            throw ServiceException("403-NO_PERMISSION", "팀을 삭제할 권한이 없습니다.")
        }

        // 팀과 관련된 모든 TodoAssignment 레코드 삭제
        todoAssignmentRepository.deleteByTeam_Id(teamId)

        // 팀과 관련된 모든 TodoList 삭제 (Todo는 cascade로 자동 삭제됨)
        val teamTodoLists = todoListRepository.findByTeamId(teamId)
        for (todoList in teamTodoLists) {
            // 각 TodoList의 Todo들에 대한 TodoAssignment 레코드들 삭제
            val todos = todoRepository.findByTodoListId(todoList.id)
            for (todo in todos) {
                todoAssignmentRepository.deleteByTodo_Id(todo.id)
            }
            // TodoList 삭제 (Todo는 cascade로 자동 삭제됨)
            todoListRepository.delete(todoList)
        }

        // 팀 삭제 (TeamMember는 cascade로 자동 삭제됨)
        teamRepository.delete(team)

        return RsData.success("팀이 성공적으로 삭제되었습니다.")
    }

    // 6. 팀 할일 목록 조회
    fun getTeamTodos(teamId: Int, userId: Int): RsData<List<Map<String, Any?>>> {
        // 팀 멤버 권한 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, userId)) {
            throw ServiceException("403-NO_PERMISSION", "해당 팀의 할일 목록을 조회할 권한이 없습니다.")
        }

        // 팀 할일만 처리 (개인 할일 teamId=0은 제외)
        if (teamId == 0) {
            throw ServiceException("400-BAD_REQUEST", "개인 할일은 지원하지 않습니다.")
        }

        // TodoList 조회 또는 생성
        val todoList = todoListRepository.findByTeamIdAndUserId(teamId, userId)
            .orElseGet {
                // 없으면 새로 생성
                val user = userRepository.findById(userId)
                    .orElseThrow { ServiceException("404-USER_NOT_FOUND", "사용자를 찾을 수 없습니다.") }
                val team = teamRepository.findById(teamId)
                    .orElseThrow { ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다.") }

                // TodoList 생성자에 직접 파라미터 전달
                val newList = TodoList(
                    "${team.teamName} 할일 목록",
                    "팀원들과 함께 관리하는 할일들",
                    user,
                    team
                )

                todoListRepository.save(newList)
            }

        // DB에서 해당 TodoList의 할일 목록 조회
        val todos = todoRepository.findAllByTodoListId(todoList.id)

        // Map 형태로 변환
        val todoMaps = todos.map { todo ->
            mapOf<String, Any?>(
                "id" to todo.id,
                "title" to todo.title,
                "description" to todo.description,
                "isCompleted" to todo.isCompleted,
                "priority" to todo.priority,
                "dueDate" to todo.dueDate,
                "assignedMemberId" to null, // Todo 엔티티에는 assignedMemberId가 없으므로 null
                "type" to if (teamId == 0) "personal" else "team",
                "createdAt" to todo.createDate
            )
        }

        return RsData.success("할일 목록 조회 성공", todoMaps)
    }

    // 7. 팀 할일 추가
    @Transactional
    fun addTeamTodo(teamId: Int, userId: Int, todoRequest: Map<String, Any?>): RsData<Map<String, Any?>> {
        // 팀 멤버 권한 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, userId)) {
            throw ServiceException("403-NO_PERMISSION", "해당 팀에 할일을 추가할 권한이 없습니다.")
        }

        // 팀 할일만 처리 (개인 할일 teamId=0은 제외)
        if (teamId == 0) {
            throw ServiceException("400-BAD_REQUEST", "개인 할일은 지원하지 않습니다.")
        }

        // TodoList 조회 또는 생성
        val todoList = todoListRepository.findByTeamIdAndUserId(teamId, userId)
            .orElseGet {
                // 없으면 새로 생성
                val user = userRepository.findById(userId)
                    .orElseThrow { ServiceException("404-USER_NOT_FOUND", "사용자를 찾을 수 없습니다.") }
                val team = teamRepository.findById(teamId)
                    .orElseThrow { ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다.") }

                // TodoList 생성자에 직접 파라미터 전달
                val newList = TodoList(
                    "${team.teamName} 할일 목록",
                    "팀원들과 함께 관리하는 할일들",
                    user,
                    team
                )

                todoListRepository.save(newList)
            }

        // Todo 엔티티 생성 (BaseInitData.kt와 동일한 방식)
        val todo = Todo(
            todoRequest["title"] as? String,
            todoRequest["description"] as? String,
            false, // isCompleted
            (todoRequest["priority"] as? Int) ?: 1, // priority
            LocalDateTime.now(), // startDate
            todoRequest["dueDate"]?.let {
                LocalDateTime.parse((it as String).replace("Z", ""))
            }, // dueDate
            todoList // TodoList 객체 직접 전달
        )

        // DB에 저장
        val savedTodo = todoRepository.save(todo)

        // Map 형태로 변환하여 반환
        val newTodo = mapOf<String, Any?>(
            "id" to savedTodo.id,
            "title" to savedTodo.title,
            "description" to savedTodo.description,
            "isCompleted" to savedTodo.isCompleted,
            "priority" to savedTodo.priority,
            "dueDate" to savedTodo.dueDate,
            "assignedMemberId" to null, // Todo 엔티티에는 assignedMemberId가 없으므로 null
            "type" to if (teamId == 0) "personal" else "team",
            "createdAt" to savedTodo.createDate
        )

        return RsData.success("할일 추가 성공", newTodo)
    }

    // 팀별 할일 목록 조회
    fun getTeamTodoLists(teamId: Int, userId: Int): RsData<List<Map<String, Any?>>> {
        // 팀 멤버 확인
        val member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
            .orElseThrow { ServiceException("403-FORBIDDEN", "해당 팀의 멤버가 아닙니다.") }

        // 팀 객체 조회
        val team = teamRepository.findById(teamId)
            .orElseThrow { ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다.") }

        // 해당 팀의 할일 목록 조회 (TodoList 엔티티에서 team 필드로 조회)
        val todoLists = todoListRepository.findAll()
            .filter { todoList -> todoList.team?.id == teamId }

        val response = todoLists.map { todoList ->
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

        return RsData.success("팀 할일 목록 조회 성공", response)
    }

    // 팀 할일 목록 생성
    @Transactional
    fun createTeamTodoList(teamId: Int, todoListRequest: Map<String, Any?>, userId: Int): RsData<Map<String, Any?>> {
        // 팀 멤버 확인
        val member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
            .orElseThrow { ServiceException("403-FORBIDDEN", "해당 팀의 멤버가 아닙니다.") }

        // 사용자와 팀 객체 조회
        val user = userRepository.findById(userId)
            .orElseThrow { ServiceException("404-USER_NOT_FOUND", "사용자를 찾을 수 없습니다.") }
        val team = teamRepository.findById(teamId)
            .orElseThrow { ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다.") }

        val todoList = TodoList(
            todoListRequest["name"] as? String,
            todoListRequest["description"] as? String,
            user,
            team
        )
        todoListRepository.save(todoList)

        val response = mapOf<String, Any?>(
            "id" to todoList.id,
            "name" to todoList.name,
            "description" to todoList.description,
            "userId" to todoList.user.id,
            "teamId" to todoList.team?.id,
            "createDate" to todoList.createDate,
            "modifyDate" to todoList.modifyDate
        )

        return RsData.success("할일 목록이 성공적으로 생성되었습니다.", response)
    }

    // 팀 할일 목록 수정
    @Transactional
    fun updateTeamTodoList(teamId: Int, todoListId: Int, todoListRequest: Map<String, Any?>, userId: Int): RsData<Map<String, Any?>> {
        // 팀 멤버 확인
        val member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
            .orElseThrow { ServiceException("403-FORBIDDEN", "해당 팀의 멤버가 아닙니다.") }

        val todoList = todoListRepository.findById(todoListId)
            .orElseThrow { ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다.") }

        // 할일 목록이 해당 팀에 속하는지 확인
        if (todoList.team == null || todoList.team?.id != teamId) {
            throw ServiceException("403-FORBIDDEN", "해당 팀의 할일 목록이 아닙니다.")
        }

        todoList.apply {
            name = todoListRequest["name"] as? String
            description = todoListRequest["description"] as? String
        }
        todoListRepository.save(todoList)

        val response = mapOf<String, Any?>(
            "id" to todoList.id,
            "name" to todoList.name,
            "description" to todoList.description,
            "userId" to todoList.user?.id,
            "teamId" to todoList.team?.id,
            "createDate" to todoList.createDate,
            "modifyDate" to todoList.modifyDate
        )

        return RsData.success("할일 목록이 성공적으로 수정되었습니다.", response)
    }

    // 팀 할일 목록 삭제
    @Transactional
    fun deleteTeamTodoList(teamId: Int, todoListId: Int, userId: Int): RsData<Unit> {
        // 팀 멤버 확인
        val member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
            .orElseThrow { ServiceException("403-FORBIDDEN", "해당 팀의 멤버가 아닙니다.") }

        val todoList = todoListRepository.findById(todoListId)
            .orElseThrow { ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다.") }

        // 할일 목록이 해당 팀에 속하는지 확인
        if (todoList.team == null || todoList.team?.id != teamId) {
            throw ServiceException("403-FORBIDDEN", "해당 팀의 할일 목록이 아닙니다.")
        }

        // TodoList 삭제 전에 관련된 모든 Todo의 TodoAssignment 레코드들 삭제
        val todos = todoRepository.findByTodoListId(todoListId)
        todos.forEach { todo ->
            todoAssignmentRepository.deleteByTodo_Id(todo.id)
        }

        todoListRepository.delete(todoList)
        return RsData.success("할일 목록이 성공적으로 삭제되었습니다.")
    }

    // 팀 할일 목록별 할일 조회
    fun getTeamTodosByList(teamId: Int, todoListId: Int, userId: Int): RsData<List<Map<String, Any?>>> {
        // 팀 멤버 확인
        val member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
            .orElseThrow { ServiceException("403-FORBIDDEN", "해당 팀의 멤버가 아닙니다.") }

        val todoList = todoListRepository.findById(todoListId)
            .orElseThrow { ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다.") }

        // 할일 목록이 해당 팀에 속하는지 확인
        if (todoList.team == null || todoList.team?.id != teamId) {
            throw ServiceException("403-FORBIDDEN", "해당 팀의 할일 목록이 아닙니다.")
        }

        val todos = todoRepository.findByTodoListId(todoListId)
        val response = todos.map { todo ->
            mapOf<String, Any?>(
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

        return RsData.success("할일 목록별 할일 조회 성공", response)
    }

    // 팀 할일 목록에 할일 추가
    @Transactional
    fun addTodoToTeamList(teamId: Int, todoListId: Int, todoRequest: Map<String, Any?>, userId: Int): RsData<Map<String, Any?>> {
        // 팀 멤버 확인
        val member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
            .orElseThrow { ServiceException("403-FORBIDDEN", "해당 팀의 멤버가 아닙니다.") }

        val todoList = todoListRepository.findById(todoListId)
            .orElseThrow { ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다.") }

        // 할일 목록이 해당 팀에 속하는지 확인
        if (todoList.team == null || todoList.team?.id != teamId) {
            throw ServiceException("403-FORBIDDEN", "해당 팀의 할일 목록이 아닙니다.")
        }

        // Todo 생성 (BaseInitData.kt와 동일한 방식)
        val todo = Todo(
            todoRequest["title"] as? String,
            todoRequest["description"] as? String,
            false, // isCompleted
            todoRequest["priority"] as? Int ?: 1, // priority
            LocalDateTime.now(), // startDate
            todoRequest["dueDate"]?.let { dueDateValue ->
                if (dueDateValue is String && dueDateValue.isNotEmpty()) {
                    try {
                        LocalDateTime.parse(dueDateValue.replace("Z", ""))
                    } catch (e: Exception) {
                        null
                    }
                } else null
            }, // dueDate
            todoList // TodoList 객체 직접 전달
        )

        todoRepository.save(todo)

        val response = mapOf<String, Any?>(
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

        return RsData.success("할일이 성공적으로 추가되었습니다.", response)
    }

    // 팀 할일 수정
    @Transactional
    fun updateTeamTodo(teamId: Int, todoId: Int, todoRequest: Map<String, Any?>, userId: Int): RsData<Map<String, Any?>> {
        // 팀 멤버 확인
        val member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
            .orElseThrow { ServiceException("403-FORBIDDEN", "해당 팀의 멤버가 아닙니다.") }

        val todo = todoRepository.findById(todoId)
            .orElseThrow { ServiceException("404-TODO_NOT_FOUND", "할일을 찾을 수 없습니다.") }

        // 할일이 해당 팀에 속하는지 확인
        if (todo.todoList?.team == null || todo.todoList?.team?.id != teamId) {
            throw ServiceException("403-FORBIDDEN", "해당 팀의 할일이 아닙니다.")
        }

        todo.apply {
            title = todoRequest["title"] as? String
            description = todoRequest["description"] as? String
            priority = todoRequest["priority"] as? Int ?: priority

            // 마감기한 설정
            dueDate = todoRequest["dueDate"]?.let { dueDateValue ->
                if (dueDateValue is String && dueDateValue.isNotEmpty()) {
                    try {
                        LocalDateTime.parse(dueDateValue.replace("Z", ""))
                    } catch (e: Exception) {
                        null
                    }
                } else null
            }
        }

        todoRepository.save(todo)

        val response = mapOf<String, Any?>(
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

        return RsData.success("할일이 성공적으로 수정되었습니다.", response)
    }

    // 팀 할일 삭제
    @Transactional
    fun deleteTeamTodo(teamId: Int, todoId: Int, userId: Int): RsData<Unit> {
        try {
            println("=== 할일 삭제 시작 ===")
            println("teamId: $teamId, todoId: $todoId, userId: $userId")

            // 팀 멤버 확인
            val member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
                .orElseThrow { ServiceException("403-FORBIDDEN", "해당 팀의 멤버가 아닙니다.") }
            println("팀 멤버 확인 완료: ${member.user?.nickName}")

            val todo = todoRepository.findById(todoId)
                .orElseThrow { ServiceException("404-TODO_NOT_FOUND", "할일을 찾을 수 없습니다.") }
            println("할일 찾기 완료: ${todo.title}")

            // TodoList가 null인지 확인
            if (todo.todoList == null) {
                println("ERROR: TodoList가 null입니다.")
                throw ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다.")
            }
            println("TodoList 확인 완료: ${todo.todoList?.name}")

            // 할일이 해당 팀에 속하는지 확인
            val todoList = todo.todoList!!
            if (todoList.team == null) {
                println("ERROR: TodoList의 Team이 null입니다.")
                throw ServiceException("403-FORBIDDEN", "할일 목록이 팀에 속하지 않습니다.")
            }

            if (todoList.team?.id != teamId) {
                println("ERROR: 팀 ID 불일치. 요청된 팀: $teamId, 실제 팀: ${todoList.team?.id}")
                throw ServiceException("403-FORBIDDEN", "해당 팀의 할일이 아닙니다.")
            }
            println("팀 확인 완료: ${todoList.team?.teamName}")

            // 할일 삭제 전에 관련된 TodoAssignment 레코드들 먼저 삭제
            println("TodoAssignment 레코드 삭제 시작")
            todoAssignmentRepository.deleteByTodo_Id(todoId)
            println("TodoAssignment 레코드 삭제 완료")

            todoRepository.delete(todo)
            println("할일 삭제 완료")
            return RsData.success("할일이 성공적으로 삭제되었습니다.")
        } catch (e: ServiceException) {
            println("ServiceException 발생: ${e.message}")
            throw e
        } catch (e: Exception) {
            println("할일 삭제 중 예상치 못한 오류 발생: ${e.message}")
            e.printStackTrace()
            throw ServiceException("500-2", "할일 삭제 중 오류가 발생했습니다: ${e.message}")
        }
    }

    // 팀 할일 완료 상태 토글
    @Transactional
    fun toggleTeamTodoComplete(teamId: Int, todoId: Int, userId: Int): RsData<Map<String, Any?>> {
        // 팀 멤버 확인
        val member = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
            .orElseThrow { ServiceException("403-FORBIDDEN", "해당 팀의 멤버가 아닙니다.") }

        val todo = todoRepository.findById(todoId)
            .orElseThrow { ServiceException("404-TODO_NOT_FOUND", "할일을 찾을 수 없습니다.") }

        // 할일이 해당 팀에 속하는지 확인
        if (todo.todoList?.team == null || todo.todoList?.team?.id != teamId) {
            throw ServiceException("403-FORBIDDEN", "해당 팀의 할일이 아닙니다.")
        }

        todo.isCompleted = !todo.isCompleted
        todoRepository.save(todo)

        val response = mapOf<String, Any?>(
            "id" to todo.id,
            "title" to todo.title,
            "description" to todo.description,
            "priority" to todo.priority,
            "completed" to todo.isCompleted,
            "todoListId" to todo.todoList?.id,
            "createdAt" to todo.createDate,
            "updatedAt" to todo.modifyDate
        )

        return RsData.success("할일 완료 상태가 변경되었습니다.", response)
    }

    // ===== 담당자 관리 메서드들 =====

    // 담당자 지정
    @Transactional
    fun assignTodoToMember(teamId: Int, todoId: Int, assignedUserId: Int, assignerUserId: Int): RsData<Map<String, Any?>> {
        // 권한 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, assignerUserId)) {
            throw ServiceException("403-FORBIDDEN", "팀 멤버만 접근할 수 있습니다.")
        }

        // 담당자가 팀 멤버인지 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, assignedUserId)) {
            throw ServiceException("403-FORBIDDEN", "담당자는 팀 멤버여야 합니다.")
        }

        val todo = todoRepository.findById(todoId)
            .orElseThrow { ServiceException("404-TODO_NOT_FOUND", "할일을 찾을 수 없습니다.") }

        // Todo가 해당 팀의 TodoList에 속하는지 확인
        val todoList = todoListRepository.findById(todo.todoList?.id ?: 0)
            .orElseThrow { ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다.") }

        if (todoList.team?.id != teamId) {
            throw ServiceException("403-FORBIDDEN", "해당 팀의 할일이 아닙니다.")
        }

        val assignedUser = userRepository.findById(assignedUserId)
            .orElseThrow { ServiceException("404-USER_NOT_FOUND", "담당자로 지정할 사용자를 찾을 수 없습니다.") }

        val team = teamRepository.findById(teamId)
            .orElseThrow { ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다.") }

        // 기존 활성 담당자 비활성화
        todoAssignmentRepository.findByTodo_IdAndStatus(todoId, TodoAssignment.AssignmentStatus.ACTIVE)
            .ifPresent { existingAssignment ->
                existingAssignment.status = TodoAssignment.AssignmentStatus.INACTIVE
                todoAssignmentRepository.save(existingAssignment)
            }

        // 새로운 담당자 지정 (생성자에 직접 파라미터 전달)
        val newAssignment = TodoAssignment(
            todo,
            assignedUser,
            team,
            LocalDateTime.now(),
            TodoAssignment.AssignmentStatus.ACTIVE
        )

        todoAssignmentRepository.save(newAssignment)

        val response = mapOf<String, Any?>(
            "todoId" to todoId,
            "assignedUserId" to assignedUserId,
            "assignedUserNickname" to assignedUser.nickName,
            "assignedAt" to newAssignment.assignedAt
        )

        return RsData.success("담당자가 성공적으로 지정되었습니다.", response)
    }

    // 담당자 해제
    @Transactional
    fun unassignTodo(teamId: Int, todoId: Int, unassignerUserId: Int): RsData<Unit> {
        // 권한 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, unassignerUserId)) {
            throw ServiceException("403-FORBIDDEN", "팀 멤버만 접근할 수 있습니다.")
        }

        val todo = todoRepository.findById(todoId)
            .orElseThrow { ServiceException("404-TODO_NOT_FOUND", "할일을 찾을 수 없습니다.") }

        // Todo가 해당 팀의 TodoList에 속하는지 확인
        val todoList = todoListRepository.findById(todo.todoList?.id ?: 0)
            .orElseThrow { ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다.") }

        if (todoList.team?.id != teamId) {
            throw ServiceException("403-FORBIDDEN", "해당 팀의 할일이 아닙니다.")
        }

        // 활성 담당자 비활성화
        todoAssignmentRepository.findByTodo_IdAndStatus(todoId, TodoAssignment.AssignmentStatus.ACTIVE)
            .ifPresent { existingAssignment ->
                existingAssignment.status = TodoAssignment.AssignmentStatus.INACTIVE
                todoAssignmentRepository.save(existingAssignment)
            }

        return RsData.success("담당자가 해제되었습니다.")
    }

    // Todo의 담당자 조회
    fun getTodoAssignment(teamId: Int, todoId: Int, userId: Int): RsData<Map<String, Any?>> {
        // 권한 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, userId)) {
            throw ServiceException("403-FORBIDDEN", "팀 멤버만 접근할 수 있습니다.")
        }

        val todo = todoRepository.findById(todoId)
            .orElseThrow { ServiceException("404-TODO_NOT_FOUND", "할일을 찾을 수 없습니다.") }

        // Todo가 해당 팀의 TodoList에 속하는지 확인
        val todoList = todoListRepository.findById(todo.todoList?.id ?: 0)
            .orElseThrow { ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다.") }

        if (todoList.team?.id != teamId) {
            throw ServiceException("403-FORBIDDEN", "해당 팀의 할일이 아닙니다.")
        }

        // 활성 담당자 조회
        val assignment = todoAssignmentRepository.findByTodo_IdAndStatus(todoId, TodoAssignment.AssignmentStatus.ACTIVE)

        val response = if (assignment.isPresent) {
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

        return RsData.success("담당자 정보 조회 성공", response)
    }

    // 팀의 모든 담당자 기록 조회
    fun getTeamAssignments(teamId: Int, userId: Int): RsData<List<Map<String, Any?>>> {
        // 권한 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, userId)) {
            throw ServiceException("403-FORBIDDEN", "팀 멤버만 접근할 수 있습니다.")
        }

        val assignments = todoAssignmentRepository.findByTeam_IdOrderByAssignedAtDesc(teamId)

        val response = assignments.map { assignment ->
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

        return RsData.success("팀 담당자 기록 조회 성공", response)
    }

    // ===== 담당자 권한 확인 메서드들 =====

    // 특정 할일의 담당자인지 확인
    fun isTodoAssignee(teamId: Int, todoId: Int, userId: Int): Boolean {
        // 팀 멤버인지 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, userId)) {
            return false
        }

        // 활성 담당자인지 확인 (여러 담당자 지원)
        val activeAssignments = todoAssignmentRepository.findByTodo_IdOrderByAssignedAtDesc(todoId)
        return activeAssignments.any { assignment ->
            assignment.status == TodoAssignment.AssignmentStatus.ACTIVE &&
                    assignment.assignedUser?.id == userId
        }
    }

    // 특정 할일의 담당자 목록 조회 (여러 담당자 지원)
    fun getTodoAssignees(teamId: Int, todoId: Int, userId: Int): RsData<List<Map<String, Any?>>> {
        // 권한 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, userId)) {
            throw ServiceException("403-FORBIDDEN", "팀 멤버만 접근할 수 있습니다.")
        }

        val todo = todoRepository.findById(todoId)
            .orElseThrow { ServiceException("404-TODO_NOT_FOUND", "할일을 찾을 수 없습니다.") }

        // Todo가 해당 팀의 TodoList에 속하는지 확인
        val todoList = todoListRepository.findById(todo.todoList?.id ?: 0)
            .orElseThrow { ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다.") }

        if (todoList.team?.id != teamId) {
            throw ServiceException("403-FORBIDDEN", "해당 팀의 할일이 아닙니다.")
        }

        // 활성 담당자들 조회
        val assignments = todoAssignmentRepository.findByTodo_IdOrderByAssignedAtDesc(todoId)
        val activeAssignments = assignments.filter { assignment ->
            assignment.status == TodoAssignment.AssignmentStatus.ACTIVE
        }

        val response = activeAssignments.map { assignment ->
            mapOf<String, Any?>(
                "assignedUserId" to assignment.assignedUser?.id,
                "assignedUserNickname" to assignment.assignedUser?.nickName,
                "assignedUserEmail" to assignment.assignedUser?.userEmail,
                "assignedAt" to assignment.assignedAt
            )
        }

        return RsData.success("담당자 목록 조회 성공", response)
    }

    // 여러 담당자 지정 (기존 담당자 중 유지할 것은 그대로 두고, 제거할 것만 비활성화, 새로 추가할 것만 생성)
    @Transactional
    fun assignMultipleTodoAssignees(teamId: Int, todoId: Int, assignedUserIds: List<Int>, assignerUserId: Int): RsData<Map<String, Any?>> {
        // 권한 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, assignerUserId)) {
            throw ServiceException("403-FORBIDDEN", "팀 멤버만 접근할 수 있습니다.")
        }

        // 모든 담당자가 팀 멤버인지 확인
        assignedUserIds.forEach { assignedUserId ->
            if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, assignedUserId)) {
                throw ServiceException("403-FORBIDDEN", "담당자는 팀 멤버여야 합니다.")
            }
        }

        val todo = todoRepository.findById(todoId)
            .orElseThrow { ServiceException("404-TODO_NOT_FOUND", "할일을 찾을 수 없습니다.") }

        // Todo가 해당 팀의 TodoList에 속하는지 확인
        val todoList = todoListRepository.findById(todo.todoList?.id ?: 0)
            .orElseThrow { ServiceException("404-TODO_LIST_NOT_FOUND", "할일 목록을 찾을 수 없습니다.") }

        if (todoList.team?.id != teamId) {
            throw ServiceException("403-FORBIDDEN", "해당 팀의 할일이 아닙니다.")
        }

        val team = teamRepository.findById(teamId)
            .orElseThrow { ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다.") }

        // 기존 활성 담당자들 조회
        val existingAssignments = todoAssignmentRepository.findByTodo_IdOrderByAssignedAtDesc(todoId)
        val activeAssignments = existingAssignments.filter { assignment ->
            assignment.status == TodoAssignment.AssignmentStatus.ACTIVE
        }

        // 기존 담당자 ID 목록
        val existingAssigneeIds = activeAssignments.map { it.assignedUser?.id }.filterNotNull().toSet()

        // 새로 지정할 담당자 ID 목록
        val newAssigneeIds = assignedUserIds.toSet()

        // 제거할 담당자들 (기존에 있지만 새 목록에 없는 것들)
        val toRemoveIds = existingAssigneeIds.filter { id -> !newAssigneeIds.contains(id) }.toSet()

        // 새로 추가할 담당자들 (새 목록에 있지만 기존에 없는 것들)
        val toAddIds = newAssigneeIds.filter { id -> !existingAssigneeIds.contains(id) }.toSet()

        // 디버깅 로그 추가
        println("=== 담당자 지정 디버깅 ===")
        println("요청된 담당자 IDs: $assignedUserIds")
        println("기존 활성 담당자 IDs: $existingAssigneeIds")
        println("제거할 담당자 IDs: $toRemoveIds")
        println("추가할 담당자 IDs: $toAddIds")

        // 제거할 담당자들 비활성화
        activeAssignments.forEach { assignment ->
            if (toRemoveIds.contains(assignment.assignedUser?.id)) {
                assignment.status = TodoAssignment.AssignmentStatus.INACTIVE
                todoAssignmentRepository.save(assignment)
            }
        }

        // 새로 추가할 담당자들 처리 (기존 INACTIVE 레코드 재활용 또는 새로 생성)
        val newAssignments = mutableListOf<TodoAssignment>()
        toAddIds.forEach { assignedUserId ->
            val assignedUser = userRepository.findById(assignedUserId)
                .orElseThrow { ServiceException("404-USER_NOT_FOUND", "담당자로 지정할 사용자를 찾을 수 없습니다.") }

            // 기존 INACTIVE 레코드가 있는지 확인
            val existingInactive = existingAssignments
                .firstOrNull { assignment ->
                    assignment.assignedUser?.id == assignedUserId &&
                            assignment.status == TodoAssignment.AssignmentStatus.INACTIVE
                }

            if (existingInactive != null) {
                // 기존 INACTIVE 레코드를 ACTIVE로 변경
                existingInactive.status = TodoAssignment.AssignmentStatus.ACTIVE
                existingInactive.assignedAt = LocalDateTime.now()
                newAssignments.add(todoAssignmentRepository.save(existingInactive))
                println("기존 INACTIVE 레코드 재활용: User ID $assignedUserId")
            } else {
                // 새로운 레코드 생성
                val newAssignment = TodoAssignment(
                    todo,
                    assignedUser,
                    team,
                    LocalDateTime.now(),
                    TodoAssignment.AssignmentStatus.ACTIVE
                )

                newAssignments.add(todoAssignmentRepository.save(newAssignment))
                println("새로운 레코드 생성: User ID $assignedUserId")
            }
        }

        val response = mapOf<String, Any?>(
            "todoId" to todoId,
            "assignedUserIds" to assignedUserIds,
            "assignedCount" to assignedUserIds.size,
            "removedCount" to toRemoveIds.size,
            "addedCount" to toAddIds.size,
            "assignedAt" to LocalDateTime.now()
        )

        return RsData.success("담당자들이 성공적으로 지정되었습니다.", response)
    }

    // 팀 할일 통계 조회
    fun getTeamStats(teamId: Int, userId: Int): RsData<Map<String, Any?>> {
        // 권한 확인
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, userId)) {
            throw ServiceException("403-FORBIDDEN", "팀 멤버만 접근할 수 있습니다.")
        }

        // 팀 존재 확인
        val team = teamRepository.findById(teamId)
            .orElseThrow { ServiceException("404-TEAM_NOT_FOUND", "팀을 찾을 수 없습니다.") }

        // 팀의 모든 TodoList 조회 (팀 ID로 조회하는 메서드가 없으므로 모든 TodoList를 가져와서 필터링)
        val allTodoLists = todoListRepository.findAll()
        val teamTodoLists = allTodoLists.filter { todoList ->
            todoList.team != null && todoList.team?.id == teamId
        }

        var totalTodos = 0
        var completedTodos = 0
        var overdueTodos = 0

        // 각 TodoList의 할일들 조회하여 통계 계산
        teamTodoLists.forEach { todoList ->
            val todos = todoRepository.findByTodoListId(todoList.id)

            todos.forEach { todo ->
                totalTodos++

                if (todo.isCompleted) {
                    completedTodos++
                }

                // 마감기한이 지난 미완료 할일 체크
                if (!todo.isCompleted && todo.dueDate != null) {
                    val now = LocalDateTime.now()
                    if (todo.dueDate!!.isBefore(now)) {
                        overdueTodos++
                    }
                }
            }
        }

        val stats = mapOf<String, Any?>(
            "total" to totalTodos,
            "completed" to completedTodos,
            "overdue" to overdueTodos,
            "inProgress" to (totalTodos - completedTodos - overdueTodos),
            "completionRate" to if (totalTodos > 0) Math.round((completedTodos.toDouble() / totalTodos * 100)) else 0
        )

        return RsData.success("팀 통계 조회 성공", stats)
    }
}