package com.tododuk.domain.team.validator

import com.tododuk.domain.team.constant.TeamRoleType
import com.tododuk.domain.team.repository.TeamMemberRepository
import com.tododuk.global.exception.ServiceException
import org.springframework.stereotype.Component

@Component
class TeamPermissionValidator(
    private val teamMemberRepository: TeamMemberRepository
) {

    /**
     * 팀 멤버 권한 확인
     */
    fun validateTeamMember(teamId: Int, userId: Int, errorMessage: String = "해당 팀의 멤버가 아닙니다.") {
        if (!teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, userId)) {
            throw ServiceException("403-NO_PERMISSION", errorMessage)
        }
    }

    /**
     * 팀 리더 권한 확인
     */
    fun validateTeamLeader(teamId: Int, userId: Int, errorMessage: String = "팀 리더만 수행할 수 있습니다.") {
        if (!teamMemberRepository.existsByTeam_IdAndUser_IdAndRole(teamId, userId, TeamRoleType.LEADER)) {
            throw ServiceException("403-NO_PERMISSION", errorMessage)
        }
    }

    /**
     * 팀 멤버 여부 반환 (예외 없이)
     */
    fun isTeamMember(teamId: Int, userId: Int): Boolean {
        return teamMemberRepository.existsByTeam_IdAndUser_Id(teamId, userId)
    }

    /**
     * 팀 리더 여부 반환 (예외 없이)
     */
    fun isTeamLeader(teamId: Int, userId: Int): Boolean {
        return teamMemberRepository.existsByTeam_IdAndUser_IdAndRole(teamId, userId, TeamRoleType.LEADER)
    }

    /**
     * 여러 사용자가 모두 팀 멤버인지 확인
     */
    fun validateAllAreTeamMembers(teamId: Int, userIds: List<Int>) {
        userIds.forEach { userId ->
            validateTeamMember(teamId, userId, "사용자 ID $userId 는 해당 팀의 멤버가 아닙니다.")
        }
    }

    /**
     * 리더 삭제 가능 여부 확인 (마지막 리더인지 체크)
     */
    fun validateLeaderRemoval(teamId: Int, memberToRemoveId: Int) {
        val memberToRemove = teamMemberRepository.findByTeam_IdAndUser_Id(teamId, memberToRemoveId)
            .orElseThrow { ServiceException("404-MEMBER_NOT_FOUND", "해당 팀의 멤버를 찾을 수 없습니다.") }

        if (memberToRemove.role == TeamRoleType.LEADER) {
            val leaderCount = teamMemberRepository.countByTeam_IdAndRole(teamId, TeamRoleType.LEADER)
            if (leaderCount == 1L) {
                throw ServiceException("409-LAST_LEADER_CANNOT_BE_REMOVED", "팀의 마지막 리더는 제거할 수 없습니다.")
            }
        }
    }
}