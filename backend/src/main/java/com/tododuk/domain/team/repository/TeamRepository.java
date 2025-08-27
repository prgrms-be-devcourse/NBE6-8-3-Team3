// project-root/backend/src/main/java/com/tododuk/domain/team/repository/TeamRepository.java
package com.tododuk.domain.team.repository;

import com.tododuk.domain.team.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Integer> {

    @Query("SELECT DISTINCT t FROM Team t JOIN FETCH t.members tm JOIN FETCH tm.user WHERE tm.user.id = :userId")
    List<Team> findTeamsByUserId(@Param("userId") int userId);

    @Query("SELECT t FROM Team t JOIN FETCH t.members tm JOIN FETCH tm.user WHERE t.id = :teamId")
    Optional<Team> findByIdWithMembers(@Param("teamId") int teamId);

    boolean existsByIdAndMembers_UserId(int teamId, int userId);
}