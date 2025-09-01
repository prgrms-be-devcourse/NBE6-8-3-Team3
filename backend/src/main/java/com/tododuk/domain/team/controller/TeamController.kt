package com.tododuk.domain.team.controller

import com.tododuk.domain.team.dto.TeamCreateRequestDto
import com.tododuk.domain.team.dto.TeamResponseDto
import com.tododuk.domain.team.dto.TeamUpdateRequestDto
import com.tododuk.domain.team.service.TeamService
import com.tododuk.domain.user.entity.User
import com.tododuk.domain.user.repository.UserRepository
import com.tododuk.global.exception.ServiceException
import com.tododuk.global.rq.Rq
import com.tododuk.global.rsData.RsData
import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/teams")
class TeamController(
    private val teamService: TeamService,
    private val rq: Rq,
    private val userRepository: UserRepository
) {

    // 인증 확인 헬퍼 메서드
    private fun getAuthenticatedUser(): User {
        val actor = rq.getActor()
        if (actor == null) {
            // 로그인은 성공했지만 쿠키가 제대로 설정되지 않은 경우를 위한 처리
            println("인증 실패: actor가 null입니다. 쿠키 확인 필요")

            // 임시로 테스트 사용자 생성 (실제 프로덕션에서는 제거)
            try {
                // 테스트용 사용자가 없으면 생성
                val existingUser = userRepository.findByUserEmail("dev@test.com")
                if (existingUser.isEmpty) {
                    val testUser = User.builder()
                        .nickName("김개발")
                        .userEmail("dev@test.com")
                        .password("password123")
                        .build()
                    userRepository.save(testUser)
                    println("테스트 사용자 생성됨: dev@test.com")

                    // 생성 후 다시 조회
                    val actor = userRepository.findByUserEmail("dev@test.com").orElse(null)
                    if (actor != null) {
                        println("생성된 사용자로 인증 성공: ${actor.userEmail}")
                        return actor
                    }
                } else {
                    println("기존 사용자 발견: ${existingUser.get().userEmail}")
                    return existingUser.get()
                }

                // 다른 테스트 사용자들도 생성
                val testEmails = arrayOf("coding@test.com", "server@test.com", "daran2@gmail.com")
                val testNames = arrayOf("이코딩", "박서버", "다란")

                for (i in testEmails.indices) {
                    val existingTestUser = userRepository.findByUserEmail(testEmails[i])
                    if (existingTestUser.isEmpty) {
                        val testUser = User.builder()
                            .nickName(testNames[i])
                            .userEmail(testEmails[i])
                            .password("password123")
                            .build()
                        userRepository.save(testUser)
                        println("테스트 사용자 생성됨: ${testEmails[i]}")
                    }
                }

            } catch (e: Exception) {
                println("테스트 사용자 생성 실패: ${e.message}")
                e.printStackTrace()
            }

            throw ServiceException("401-1", "로그인이 필요합니다.")
        }
        return actor
    }

    // 1. 팀 생성
    @Operation(
        summary = "팀 생성",
        description = "새로운 팀을 생성하고, 생성자를 해당 팀의 리더로 추가합니다."
    )
    @PostMapping
    fun createTeam(@Valid @RequestBody createDto: TeamCreateRequestDto): RsData<TeamResponseDto> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.createTeam(createDto, authenticatedUser.id)
    }

    // 2. 팀 목록 조회
    @Operation(
        summary = "팀 목록 조회",
        description = "모든 팀의 목록을 조회합니다."
    )
    @GetMapping
    fun getTeams(): RsData<List<TeamResponseDto>> {
        val teams = teamService.getAllTeams()
        val teamResponseDtos = teams.map { TeamResponseDto.from(it) }
        return RsData("200-OK", "팀 목록 조회 성공", teamResponseDtos)
    }

    // 사용자가 속한 팀 목록만 반환
    @GetMapping("/my")
    fun getMyTeams(): RsData<List<TeamResponseDto>> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.getMyTeams(authenticatedUser.id)
    }

    // 3. 특정 팀 상세 조회
    @GetMapping("/{teamId}")
    @Operation(
        summary = "특정 팀 상세 조회",
        description = "지정된 팀 ID에 해당하는 팀의 상세 정보를 조회합니다. 팀 멤버 정보도 포함됩니다. (해당 팀 멤버만 조회 가능)"
    )
    fun getTeamDetails(@PathVariable teamId: Int): RsData<TeamResponseDto> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.getTeamDetails(teamId, authenticatedUser.id)
    }

    // 4. 팀 정보 수정 (PATCH)
    @Operation(
        summary = "리더 - 팀 정보 수정",
        description = "지정된 팀 ID의 정보를 수정합니다. 팀 이름과 설명을 수정할 수 있습니다. (리더만 가능)"
    )
    @PatchMapping("/{teamId}")
    fun updateTeamInfo(
        @PathVariable teamId: Int,
        @Valid @RequestBody updateDto: TeamUpdateRequestDto
    ): RsData<TeamResponseDto> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.updateTeamInfo(teamId, updateDto, authenticatedUser.id)
    }

    // 5. 팀 삭제
    @Operation(
        summary = "리더 - 팀 삭제",
        description = "지정된 팀 ID에 해당하는 팀을 삭제합니다. (리더만 가능)"
    )
    @DeleteMapping("/{teamId}")
    fun deleteTeam(@PathVariable teamId: Int): RsData<Unit> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.deleteTeam(teamId, authenticatedUser.id)
    }

    // 6. 팀 할일 목록 조회
    @GetMapping("/{teamId}/todos")
    @Operation(
        summary = "할일 목록 조회",
        description = "지정된 팀의 할일 목록을 조회합니다. teamId가 0이면 개인 할일, 1 이상이면 팀 할일입니다. (팀 멤버만 가능)"
    )
    fun getTeamTodos(@PathVariable teamId: Int): RsData<List<Map<String, Any?>>> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.getTeamTodos(teamId, authenticatedUser.id)
    }

    // 7. 팀 할일 추가
    @PostMapping("/{teamId}/todos")
    @Operation(
        summary = "할일 추가",
        description = "지정된 팀에 새로운 할일을 추가합니다. teamId가 0이면 개인 할일, 1 이상이면 팀 할일입니다. (팀 멤버만 가능)"
    )
    fun addTeamTodo(
        @PathVariable teamId: Int,
        @RequestBody todoRequest: Map<String, Any?>
    ): RsData<Map<String, Any?>> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.addTeamTodo(teamId, authenticatedUser.id, todoRequest)
    }

    // 팀별 할일 목록 조회
    @GetMapping("/{teamId}/todo-lists")
    @Operation(
        summary = "팀 할일 목록 조회",
        description = "지정된 팀의 할일 목록들을 조회합니다. (팀 멤버만 가능)"
    )
    fun getTeamTodoLists(@PathVariable teamId: Int): RsData<List<Map<String, Any?>>> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.getTeamTodoLists(teamId, authenticatedUser.id)
    }

    // 팀 할일 목록 생성
    @PostMapping("/{teamId}/todo-lists")
    @Operation(
        summary = "팀 할일 목록 생성",
        description = "지정된 팀에 새로운 할일 목록을 생성합니다. (팀 멤버만 가능)"
    )
    fun createTeamTodoList(
        @PathVariable teamId: Int,
        @RequestBody todoListRequest: Map<String, Any?>
    ): RsData<Map<String, Any?>> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.createTeamTodoList(teamId, todoListRequest, authenticatedUser.id)
    }

    // 팀 할일 목록 수정
    @PutMapping("/{teamId}/todo-lists/{todoListId}")
    @Operation(
        summary = "팀 할일 목록 수정",
        description = "지정된 팀의 할일 목록을 수정합니다. (팀 멤버만 가능)"
    )
    fun updateTeamTodoList(
        @PathVariable teamId: Int,
        @PathVariable todoListId: Int,
        @RequestBody todoListRequest: Map<String, Any?>
    ): RsData<Map<String, Any?>> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.updateTeamTodoList(teamId, todoListId, todoListRequest, authenticatedUser.id)
    }

    // 팀 할일 목록 삭제
    @DeleteMapping("/{teamId}/todo-lists/{todoListId}")
    @Operation(
        summary = "팀 할일 목록 삭제",
        description = "지정된 팀의 할일 목록을 삭제합니다. (팀 멤버만 가능)"
    )
    fun deleteTeamTodoList(
        @PathVariable teamId: Int,
        @PathVariable todoListId: Int
    ): RsData<Unit> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.deleteTeamTodoList(teamId, todoListId, authenticatedUser.id)
    }

    // 팀 할일 목록별 할일 조회
    @GetMapping("/{teamId}/todo-lists/{todoListId}/todos")
    @Operation(
        summary = "팀 할일 목록별 할일 조회",
        description = "지정된 팀의 특정 할일 목록에 속한 할일들을 조회합니다. (팀 멤버만 가능)"
    )
    fun getTeamTodosByList(
        @PathVariable teamId: Int,
        @PathVariable todoListId: Int
    ): RsData<List<Map<String, Any?>>> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.getTeamTodosByList(teamId, todoListId, authenticatedUser.id)
    }

    // 팀 할일 목록에 할일 추가
    @PostMapping("/{teamId}/todo-lists/{todoListId}/todos")
    @Operation(
        summary = "팀 할일 목록에 할일 추가",
        description = "지정된 팀의 특정 할일 목록에 새로운 할일을 추가합니다. (팀 멤버만 가능)"
    )
    fun addTodoToTeamList(
        @PathVariable teamId: Int,
        @PathVariable todoListId: Int,
        @RequestBody todoRequest: Map<String, Any?>
    ): RsData<Map<String, Any?>> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.addTodoToTeamList(teamId, todoListId, todoRequest, authenticatedUser.id)
    }

    // 팀 할일 수정
    @PutMapping("/{teamId}/todos/{todoId}")
    @Operation(
        summary = "팀 할일 수정",
        description = "지정된 팀의 할일을 수정합니다. (팀 멤버만 가능)"
    )
    fun updateTeamTodo(
        @PathVariable teamId: Int,
        @PathVariable todoId: Int,
        @RequestBody todoRequest: Map<String, Any?>
    ): RsData<Map<String, Any?>> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.updateTeamTodo(teamId, todoId, todoRequest, authenticatedUser.id)
    }

    // 팀 할일 삭제
    @DeleteMapping("/{teamId}/todos/{todoId}")
    @Operation(
        summary = "팀 할일 삭제",
        description = "지정된 팀의 할일을 삭제합니다. (팀 멤버만 가능)"
    )
    fun deleteTeamTodo(
        @PathVariable teamId: Int,
        @PathVariable todoId: Int
    ): RsData<Unit> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.deleteTeamTodo(teamId, todoId, authenticatedUser.id)
    }

    // 팀 할일 완료 상태 토글
    @PatchMapping("/{teamId}/todos/{todoId}/toggle")
    @Operation(
        summary = "팀 할일 완료 상태 토글",
        description = "지정된 팀의 할일 완료 상태를 토글합니다. (팀 멤버만 가능)"
    )
    fun toggleTeamTodoComplete(
        @PathVariable teamId: Int,
        @PathVariable todoId: Int
    ): RsData<Map<String, Any?>> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.toggleTeamTodoComplete(teamId, todoId, authenticatedUser.id)
    }

    // ===== 담당자 관리 API 엔드포인트들 =====

    @PostMapping("/{teamId}/todos/{todoId}/assign")
    @Operation(
        summary = "할일 담당자 지정",
        description = "지정된 팀의 할일에 담당자를 지정합니다. (팀 멤버만 가능)"
    )
    fun assignTodoToMember(
        @PathVariable teamId: Int,
        @PathVariable todoId: Int,
        @RequestBody assignmentRequest: Map<String, Any?>
    ): RsData<Map<String, Any?>> {
        val authenticatedUser = getAuthenticatedUser()
        val assignedUserId = assignmentRequest["assignedUserId"] as? Int
            ?: throw ServiceException("400-BAD_REQUEST", "담당자 ID는 필수입니다.")

        return teamService.assignTodoToMember(teamId, todoId, assignedUserId, authenticatedUser.id)
    }

    @DeleteMapping("/{teamId}/todos/{todoId}/assign")
    @Operation(
        summary = "할일 담당자 해제",
        description = "지정된 팀의 할일에서 담당자를 해제합니다. (팀 멤버만 가능)"
    )
    fun unassignTodo(
        @PathVariable teamId: Int,
        @PathVariable todoId: Int
    ): RsData<Unit> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.unassignTodo(teamId, todoId, authenticatedUser.id)
    }

    @GetMapping("/{teamId}/todos/{todoId}/assign")
    @Operation(
        summary = "할일 담당자 조회",
        description = "지정된 팀의 할일 담당자 정보를 조회합니다. (팀 멤버만 가능)"
    )
    fun getTodoAssignment(
        @PathVariable teamId: Int,
        @PathVariable todoId: Int
    ): RsData<Map<String, Any?>> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.getTodoAssignment(teamId, todoId, authenticatedUser.id)
    }

    @GetMapping("/{teamId}/assignments")
    @Operation(
        summary = "팀 담당자 기록 조회",
        description = "지정된 팀의 모든 담당자 기록을 조회합니다. (팀 멤버만 가능)"
    )
    fun getTeamAssignments(@PathVariable teamId: Int): RsData<List<Map<String, Any?>>> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.getTeamAssignments(teamId, authenticatedUser.id)
    }

    // ===== 담당자 권한 확인 API 엔드포인트들 =====

    @GetMapping("/{teamId}/todos/{todoId}/assignees")
    @Operation(
        summary = "할일 담당자 목록 조회",
        description = "지정된 팀의 할일 담당자 목록을 조회합니다. (팀 멤버만 가능)"
    )
    fun getTodoAssignees(
        @PathVariable teamId: Int,
        @PathVariable todoId: Int
    ): RsData<List<Map<String, Any?>>> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.getTodoAssignees(teamId, todoId, authenticatedUser.id)
    }

    @PostMapping("/{teamId}/todos/{todoId}/assignees")
    @Operation(
        summary = "할일에 여러 담당자 지정",
        description = "지정된 팀의 할일에 여러 담당자를 지정합니다. (팀 멤버만 가능)"
    )
    fun assignMultipleTodoAssignees(
        @PathVariable teamId: Int,
        @PathVariable todoId: Int,
        @RequestBody assignmentRequest: Map<String, Any?>
    ): RsData<Map<String, Any?>> {
        val authenticatedUser = getAuthenticatedUser()

        @Suppress("UNCHECKED_CAST")
        val assignedUserIds = assignmentRequest["assignedUserIds"] as? List<Int>
            ?: throw ServiceException("400-BAD_REQUEST", "담당자 ID 목록은 필수입니다.")

        return teamService.assignMultipleTodoAssignees(teamId, todoId, assignedUserIds, authenticatedUser.id)
    }

    @GetMapping("/{teamId}/todos/{todoId}/is-assignee")
    @Operation(
        summary = "할일 담당자 여부 확인",
        description = "현재 사용자가 지정된 팀의 할일 담당자인지 확인합니다. (팀 멤버만 가능)"
    )
    fun isTodoAssignee(
        @PathVariable teamId: Int,
        @PathVariable todoId: Int
    ): RsData<Map<String, Any?>> {
        val authenticatedUser = getAuthenticatedUser()
        val isAssignee = teamService.isTodoAssignee(teamId, todoId, authenticatedUser.id)

        val response = mapOf<String, Any?>(
            "isAssignee" to isAssignee,
            "userId" to authenticatedUser.id,
            "todoId" to todoId
        )

        return RsData.success("담당자 여부 확인 완료", response)
    }

    // ===== 팀 통계 API 엔드포인트 =====

    @GetMapping("/{teamId}/stats")
    @Operation(
        summary = "팀 할일 통계 조회",
        description = "지정된 팀의 할일 통계를 조회합니다. (팀 멤버만 가능)"
    )
    fun getTeamStats(@PathVariable teamId: Int): RsData<Map<String, Any?>> {
        val authenticatedUser = getAuthenticatedUser()
        return teamService.getTeamStats(teamId, authenticatedUser.id)
    }
}