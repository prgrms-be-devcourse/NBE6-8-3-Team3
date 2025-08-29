package com.tododuk.domain.team.repository

import com.tododuk.domain.team.constant.TeamRoleType
import com.tododuk.domain.team.entity.TeamMember
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface TeamMemberRepository : JpaRepository<TeamMember, Int> {

    fun findByTeam_Id(teamId: Int): List<TeamMember>

    // 기존 userId 기반 메서드들 (호환성 유지)
    fun findByTeam_IdAndUser_Id(teamId: Int, userId: Int): Optional<TeamMember>
    fun existsByTeam_IdAndUser_IdAndRole(teamId: Int, userId: Int, role: TeamRoleType): Boolean
    fun existsByTeam_IdAndUser_Id(teamId: Int, userId: Int): Boolean

    // 이메일 기반 메서드들 (새로 추가)
    fun findByTeam_IdAndUser_UserEmail(teamId: Int, userEmail: String): Optional<TeamMember>
    fun existsByTeam_IdAndUser_UserEmailAndRole(teamId: Int, userEmail: String, role: TeamRoleType): Boolean
    fun existsByTeam_IdAndUser_UserEmail(teamId: Int, userEmail: String): Boolean

    fun countByTeam_IdAndRole(teamId: Int, role: TeamRoleType): Long
}