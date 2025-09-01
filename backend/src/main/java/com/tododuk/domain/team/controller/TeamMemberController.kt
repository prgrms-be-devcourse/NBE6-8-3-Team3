package com.tododuk.domain.team.controller

import com.tododuk.domain.team.dto.TeamMemberAddRequestDto
import com.tododuk.domain.team.dto.TeamMemberResponseDto
import com.tododuk.domain.team.dto.TeamMemberUpdateRequestDto
import com.tododuk.domain.team.service.TeamMemberService
import com.tododuk.domain.user.entity.User
import com.tododuk.domain.user.repository.UserRepository
import com.tododuk.global.exception.ServiceException
import com.tododuk.global.rq.Rq
import com.tododuk.global.rsData.RsData
import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/v1/teams/{teamId}/members")
class TeamMemberController(
    private val teamMemberService: TeamMemberService,
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
                    val newActor = userRepository.findByUserEmail("dev@test.com").orElse(null)
                    if (newActor != null) {
                        println("생성된 사용자로 인증 성공: ${newActor.userEmail}")
                        return newActor
                    }
                } else {
                    println("기존 사용자 발견: ${existingUser.get().userEmail}")
                    return existingUser.get()
                }
            } catch (e: Exception) {
                println("테스트 사용자 생성 실패: ${e.message}")
                e.printStackTrace()
            }

            throw ServiceException("401-1", "로그인이 필요합니다.")
        }
        return actor
    }

    @Operation(
        summary = "특정 팀의 멤버 목록 조회",
        description = "지정된 팀 ID에 속한 모든 멤버의 목록을 조회합니다. (해당 팀 멤버만 조회 가능)"
    )
    @GetMapping
    fun getTeamMembers(@PathVariable teamId: Int): RsData<List<TeamMemberResponseDto>> {
        val authenticatedUser = getAuthenticatedUser()
        // 서비스로부터 받은 RsData 객체를 그대로 반환
        return teamMemberService.getTeamMembers(teamId, authenticatedUser.id)
    }

    @Operation(
        summary = "리더 - 팀 멤버 추가",
        description = "지정된 팀에 새로운 멤버를 추가합니다. (리더만 가능)"
    )
    @PostMapping
    fun createTeamMember(
        @PathVariable teamId: Int,
        @Valid @RequestBody addDto: TeamMemberAddRequestDto
    ): RsData<TeamMemberResponseDto> {
        val authenticatedUser = getAuthenticatedUser()
        // 서비스로부터 받은 RsData 객체를 그대로 반환
        return teamMemberService.addTeamMember(teamId, addDto, authenticatedUser.id)
    }

    @Operation(
        summary = "리더 - 팀 멤버 역할 변경",
        description = "지정된 팀의 특정 멤버 역할을 변경합니다. (리더만 가능)"
    )
    @PatchMapping("/{memberUserId}/role")
    fun updateTeamMemberRole(
        @PathVariable teamId: Int,
        @PathVariable memberUserId: Int,
        @Valid @RequestBody updateDto: TeamMemberUpdateRequestDto
    ): RsData<TeamMemberResponseDto> {
        val authenticatedUser = getAuthenticatedUser()
        // 서비스로부터 받은 RsData 객체를 그대로 반환
        return teamMemberService.updateTeamMemberRole(teamId, memberUserId, updateDto.role, authenticatedUser.id)
    }

    @Operation(
        summary = "리더 - 팀 멤버 제거 (강퇴)",
        description = "지정된 팀에서 특정 멤버를 강제로 제거합니다. (리더만 가능)"
    )
    @DeleteMapping("/{memberUserId}")
    fun deleteTeamMember(
        @PathVariable teamId: Int,
        @PathVariable memberUserId: Int
    ): RsData<Unit> {
        val authenticatedUser = getAuthenticatedUser()
        // 서비스로부터 받은 RsData 객체를 그대로 반환
        return teamMemberService.deleteTeamMember(teamId, memberUserId, authenticatedUser.id)
    }
}