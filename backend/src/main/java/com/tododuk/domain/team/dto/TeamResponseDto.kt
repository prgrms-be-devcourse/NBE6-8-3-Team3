package com.tododuk.domain.team.dto

import com.tododuk.domain.team.entity.Team
import java.time.LocalDateTime

data class TeamResponseDto(
    val id: Int,
    val teamName: String, // 필드명 변경: name -> teamName
    val description: String?,
    val createDate: LocalDateTime,
    val modifyDate: LocalDateTime,
    val members: List<TeamMemberResponseDto>
) {
    companion object {
        @JvmStatic
        fun from(team: Team): TeamResponseDto {
            val memberDtos = team.members.map { TeamMemberResponseDto.from(it) }

            return TeamResponseDto(
                id = team.id,
                teamName = team.teamName,
                description = team.description,
                createDate = team.createDate,
                modifyDate = team.modifyDate,
                members = memberDtos
            )
        }
    }
}