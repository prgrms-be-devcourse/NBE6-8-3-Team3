package com.tododuk.domain.team.dto

import com.tododuk.domain.team.constant.TeamRoleType
import jakarta.validation.constraints.NotNull

data class TeamMemberUpdateRequestDto(
    @field:NotNull(message = "역할은 필수입니다.")
    val role: TeamRoleType // ex) leader, member
)