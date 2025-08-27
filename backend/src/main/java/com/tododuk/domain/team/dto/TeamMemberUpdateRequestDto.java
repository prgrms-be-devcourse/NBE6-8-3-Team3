package com.tododuk.domain.team.dto;

import com.tododuk.domain.team.constant.TeamRoleType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberUpdateRequestDto {
    @NotNull(message = "역할은 필수입니다.")
    private TeamRoleType role; // ex) leader, member
}