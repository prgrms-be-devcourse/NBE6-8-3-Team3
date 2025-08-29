package com.tododuk.domain.team.dto

import com.tododuk.domain.team.constant.TeamRoleType
import com.tododuk.domain.team.entity.TeamMember
import java.time.LocalDateTime

data class TeamMemberResponseDto(
    val id: Int,
    val userId: Int, // 기존 호환성을 위해 유지
    val userEmail: String, // 이메일 기반으로 추가
    val userNickname: String,
    val teamId: Int,
    val role: TeamRoleType,
    val joinedAt: LocalDateTime,
    val createDate: LocalDateTime,
    val modifyDate: LocalDateTime
) {
    companion object {
        @JvmStatic
        fun from(teamMember: TeamMember): TeamMemberResponseDto {
            return TeamMemberResponseDto(
                id = teamMember.id,
                userId = teamMember.user?.id ?: 0,
                userEmail = teamMember.user?.userEmail ?: "",
                userNickname = teamMember.user?.nickName ?: "",
                teamId = teamMember.team?.id ?: 0,
                role = teamMember.role,
                joinedAt = teamMember.joinedAt,
                createDate = teamMember.createDate,
                modifyDate = teamMember.modifyDate
            )
        }
    }
}