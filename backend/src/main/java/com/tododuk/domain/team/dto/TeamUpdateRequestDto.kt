package com.tododuk.domain.team.dto

import jakarta.validation.constraints.Size

data class TeamUpdateRequestDto(
    @field:Size(max = 255, message = "팀 이름은 255자를 초과할 수 없습니다.")
    val teamName: String?, // 필드명 변경: name -> teamName

    @field:Size(max = 1000, message = "팀 설명은 1000자를 초과할 수 없습니다.")
    val description: String?
)