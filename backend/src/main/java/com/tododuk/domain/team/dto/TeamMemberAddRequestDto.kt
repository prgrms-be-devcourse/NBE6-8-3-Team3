package com.tododuk.domain.team.dto

import com.tododuk.domain.team.constant.TeamRoleType
import jakarta.validation.constraints.NotNull

data class TeamMemberAddRequestDto(
    @field:NotNull(message = "이메일은 필수입니다.")
    val email: String, // 이메일로 사용자 찾기

    @field:NotNull(message = "역할은 필수입니다.")
    val role: TeamRoleType // ex) leader, member
)