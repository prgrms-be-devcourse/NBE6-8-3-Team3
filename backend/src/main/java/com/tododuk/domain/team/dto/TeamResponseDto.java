package com.tododuk.domain.team.dto;

import com.tododuk.domain.team.entity.Team;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamResponseDto {
    private int id;
    private String teamName; // 필드명 변경: name -> teamName
    private String description;
    private LocalDateTime createDate;
    private LocalDateTime modifyDate;
    private List<TeamMemberResponseDto> members;

    public static TeamResponseDto from(Team team) {
        List<TeamMemberResponseDto> memberDtos = team.getMembers().stream()
                .map(TeamMemberResponseDto::from)
                .collect(Collectors.toList());

        return TeamResponseDto.builder()
                .id(team.getId())
                .teamName(team.getTeamName())
                .description(team.getDescription())
                .createDate(team.getCreateDate())
                .modifyDate(team.getModifyDate())
                .members(memberDtos)
                .build();
    }
}