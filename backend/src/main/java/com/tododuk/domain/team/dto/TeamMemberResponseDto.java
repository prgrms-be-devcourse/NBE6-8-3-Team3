package com.tododuk.domain.team.dto;

import com.tododuk.domain.team.constant.TeamRoleType;
import com.tododuk.domain.team.entity.TeamMember;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMemberResponseDto {
    private int id;
    private int userId; // 기존 호환성을 위해 유지
    private String userEmail; // 이메일 기반으로 추가
    private String userNickname;
    private int teamId;
    private TeamRoleType role;
    private LocalDateTime joinedAt;
    private LocalDateTime createDate;
    private LocalDateTime modifyDate;

    public static TeamMemberResponseDto from(TeamMember teamMember) {
        return TeamMemberResponseDto.builder()
                .id(teamMember.getId())
                .userId(teamMember.getUser().getId())
                .userEmail(teamMember.getUser().getUserEmail()) // 이메일 추가
                .userNickname(teamMember.getUser().getNickName())
                .teamId(teamMember.getTeam().getId())
                .role(teamMember.getRole())
                .joinedAt(teamMember.getJoinedAt())
                .createDate(teamMember.getCreateDate())
                .modifyDate(teamMember.getModifyDate())
                .build();
    }
}