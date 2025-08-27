// project-root/backend/src/main/java/com/tododuk/domain/team/repository/TeamMemberRepository.java
package com.tododuk.domain.team.repository;

import com.tododuk.domain.team.constant.TeamRoleType;
import com.tododuk.domain.team.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Integer> {

    List<TeamMember> findByTeam_Id(int teamId);

    // 기존 userId 기반 메서드들 (호환성 유지)
    Optional<TeamMember> findByTeam_IdAndUser_Id(int teamId, int userId);
    boolean existsByTeam_IdAndUser_IdAndRole(int teamId, int userId, TeamRoleType role);
    boolean existsByTeam_IdAndUser_Id(int teamId, int userId);

    // 이메일 기반 메서드들 (새로 추가)
    Optional<TeamMember> findByTeam_IdAndUser_UserEmail(int teamId, String userEmail);
    boolean existsByTeam_IdAndUser_UserEmailAndRole(int teamId, String userEmail, TeamRoleType role);
    boolean existsByTeam_IdAndUser_UserEmail(int teamId, String userEmail);

    long countByTeam_IdAndRole(int teamId, TeamRoleType role);
}