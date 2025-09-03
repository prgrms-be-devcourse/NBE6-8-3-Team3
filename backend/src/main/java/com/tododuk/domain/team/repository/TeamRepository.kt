// project-root/backend/src/main/java/com/tododuk/domain/team/repository/TeamRepository.java
package com.tododuk.domain.team.repository

import com.tododuk.domain.team.entity.Team
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface TeamRepository : JpaRepository<Team, Int> {

    @Query("""
        SELECT DISTINCT t FROM Team t 
        JOIN FETCH t.members tm 
        JOIN FETCH tm.user 
        WHERE tm.user.id = :userId
    """)
    fun findTeamsByUserId(@Param("userId") userId: Int): List<Team>

    @Query("""
        SELECT t FROM Team t 
        JOIN FETCH t.members tm 
        JOIN FETCH tm.user 
        WHERE t.id = :teamId
    """)
    fun findByIdWithMembers(@Param("teamId") teamId: Int): Optional<Team>

    fun existsByIdAndMembers_UserId(teamId: Int, userId: Int): Boolean
}