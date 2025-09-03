package com.tododuk.domain.team.service

import com.tododuk.domain.team.constant.TeamRoleType
import com.tododuk.domain.team.dto.TeamMemberAddRequestDto
import com.tododuk.domain.team.dto.TeamMemberResponseDto
import com.tododuk.domain.team.entity.Team
import com.tododuk.domain.team.entity.TeamMember
import com.tododuk.domain.team.repository.TeamMemberRepository
import com.tododuk.domain.team.repository.TodoAssignmentRepository
import com.tododuk.domain.team.validator.TeamPermissionValidator
import com.tododuk.domain.team.validator.TeamValidator
import com.tododuk.domain.user.entity.User
import com.tododuk.global.exception.ServiceException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
@Transactional(readOnly = true)
class TeamMemberService(
    private val teamMemberRepository: TeamMemberRepository,
    private val todoAssignmentRepository: TodoAssignmentRepository,
    private val teamPermissionValidator: TeamPermissionValidator,
    private val teamValidator: TeamValidator
) {

    /**
     * 팀 생성 시 초기 리더 멤버 추가 (TeamService에서 호출)
     */
    @Transactional
    fun createLeaderMember(team: Team, leaderUser: User): TeamMember {
        val leaderMember = TeamMember.builder()
            .user(leaderUser)
            .team(team)
            .role(TeamRoleType.LEADER)
            .build()

        team.addMember(leaderMember)
        return teamMemberRepository.save(leaderMember)
    }

    /**
     * 특정 팀의 모든 멤버 조회
     */
    fun getTeamMembers(teamId: Int, requesterUserId: Int): List<TeamMemberResponseDto> {
        teamPermissionValidator.validateTeamMember(teamId, requesterUserId, "해당 팀의 멤버 목록을 조회할 권한이 없습니다.")

        val members = teamMemberRepository.findByTeam_Id(teamId)
        return members.map { TeamMemberResponseDto.from(it) }
    }

    /**
     * 팀 멤버 추가 (이메일 기반)
     */
    @Transactional
    fun addTeamMember(teamId: Int, dto: TeamMemberAddRequestDto, inviterUserId: Int): TeamMemberResponseDto {
        teamPermissionValidator.validateTeamLeader(teamId, inviterUserId, "팀 멤버를 추가할 권한이 없습니다.")

        val team = teamValidator.validateAndGetTeam(teamId)
        val newMemberUser = teamValidator.validateAndGetUserByEmail(dto.email)

        // 이미 팀 멤버인지 확인
        teamValidator.validateNotAlreadyMember(team, newMemberUser.userEmail)

        val teamMember = createTeamMember(team, newMemberUser, dto.role)
        return TeamMemberResponseDto.from(teamMember)
    }

    /**
     * 팀 멤버 역할 변경
     */
    @Transactional
    fun updateTeamMemberRole(
        teamId: Int,
        userId: Int,
        newRole: TeamRoleType,
        requesterUserId: Int
    ): TeamMemberResponseDto {
        teamValidator.validateAndGetTeam(teamId)
        teamPermissionValidator.validateTeamLeader(teamId, requesterUserId, "팀 멤버 역할을 변경할 권한이 없습니다.")

        val teamMember = findTeamMember(teamId, userId)
        teamMember.updateRole(newRole)

        return TeamMemberResponseDto.from(teamMember)
    }

    /**
     * 팀 멤버 삭제
     */
    @Transactional
    fun deleteTeamMember(teamId: Int, memberUserIdToRemove: Int, removerUserId: Int) {
        teamValidator.validateAndGetTeam(teamId)
        teamPermissionValidator.validateTeamLeader(teamId, removerUserId, "팀 멤버를 제거할 권한이 없습니다.")

        val teamMember = findTeamMember(teamId, memberUserIdToRemove)

        // 마지막 리더 삭제 방지
        teamPermissionValidator.validateLeaderRemoval(teamId, memberUserIdToRemove)

        // 해당 멤버의 모든 담당자 정보 삭제
        cleanupMemberAssignments(teamId, memberUserIdToRemove)

        teamMemberRepository.delete(teamMember)
    }

    // ===== Private Helper Methods =====

    private fun createTeamMember(team: Team, user: User, role: TeamRoleType): TeamMember {
        val teamMember = TeamMember(
            user = user,
            team = team,
            role = role,
            joinedAt = LocalDateTime.now()
        )

        team.addMember(teamMember)
        return teamMemberRepository.save(teamMember)
    }

    private fun findTeamMember(teamId: Int, userId: Int): TeamMember {
        return teamMemberRepository.findByTeam_IdAndUser_Id(teamId, userId)
            .orElseThrow {
                ServiceException("404-MEMBER_NOT_FOUND", "해당 팀의 멤버를 찾을 수 없습니다. User ID: $userId")
            }
    }

    private fun cleanupMemberAssignments(teamId: Int, memberUserIdToRemove: Int) {
        println("=== 멤버 제거 시 담당자 정보 삭제 시작 ===")
        println("팀 ID: $teamId, 제거할 멤버 User ID: $memberUserIdToRemove")

        try {
            todoAssignmentRepository.deleteByTeam_IdAndAssignedUser_Id(teamId, memberUserIdToRemove)
            println("담당자 정보 삭제 완료")
        } catch (e: Exception) {
            println("담당자 정보 삭제 실패: ${e.message}")
            e.printStackTrace()
            // 담당자 정보 삭제 실패해도 멤버 삭제는 진행
        }
    }
}