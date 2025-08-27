package com.tododuk.domain.team.entity;

import com.tododuk.domain.team.constant.TeamRoleType;
import com.tododuk.domain.team.entity.TeamMember;
import com.tododuk.domain.user.entity.User;
import com.tododuk.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Team extends BaseEntity {
    private String teamName;
    private String description;

    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TeamMember> members = new ArrayList<>();

    public void updateTeam(String teamName, String description) { // 메서드 파라미터 변경: name -> teamName
        if (teamName != null && !teamName.isBlank()) {
            this.teamName = teamName; // 필드명 변경 반영
        }
        if (description != null) {
            this.description = description;
        }
    }

    public void addMember(TeamMember teamMember) {
        this.members.add(teamMember);
        teamMember.setTeam(this);
    }

    public void removeMember(TeamMember teamMember) {
        this.members.remove(teamMember);
        teamMember.setTeam(null);
    }
}