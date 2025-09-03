package com.tododuk.domain.team.initData

import com.tododuk.domain.team.constant.TeamRoleType
import com.tododuk.domain.team.entity.Team
import com.tododuk.domain.team.entity.TeamMember
import com.tododuk.domain.team.repository.TeamMemberRepository
import com.tododuk.domain.team.repository.TeamRepository
import com.tododuk.domain.user.entity.User
import com.tododuk.domain.user.repository.UserRepository
import org.springframework.stereotype.Component
import java.time.LocalDateTime
import java.util.*

@Component
class TeamTestInitData(
    private val userRepository: UserRepository,
    private val teamRepository: TeamRepository,
    private val teamMemberRepository: TeamMemberRepository
) {

    /**
     * 테스트에 필요한 사용자 데이터를 생성합니다.
     * userEmail과 nickName은 항상 고유하게 생성됩니다.
     * 이 메서드는 @Transactional이 적용된 테스트 메서드 내에서 호출되어야 합니다.
     * @param baseIdentifier 사용자 식별을 위한 기본 문자열 (예: "leader", "member")
     * @return 생성된 User 엔티티
     */
    fun createUser(baseIdentifier: String): User {
        val uniqueId = UUID.randomUUID().toString().substring(0, 8) // 고유한 짧은 문자열 생성
        val userEmail = "${baseIdentifier.lowercase()}_${uniqueId}@test.com" // 이메일을 고유하게
        val nickName = "${baseIdentifier}_$uniqueId" // 닉네임도 고유하게

        // User 엔티티의 편의 생성자 활용 (코틀린스러운 방식)
        return userRepository.save(
            User(
                email = userEmail,
                password = "testpass",
                nickName = nickName
            ).apply {
                isAdmin = false
                profileImgUrl = "http://example.com/profile/$uniqueId.jpg"
                apiKey = UUID.randomUUID().toString()
            }
        )
    }

    /**
     * 테스트 팀을 생성합니다.
     * @param teamName 팀 이름
     * @param description 팀 설명
     * @return 생성된 Team 엔티티
     */
    fun createTeam(teamName: String, description: String): Team {
        return teamRepository.save(
            Team().apply {
                this.teamName = teamName
                this.description = description
            }
        )
    }

    /**
     * 팀 멤버를 생성합니다.
     * @param user 팀 멤버가 될 사용자
     * @param team 소속될 팀
     * @param role 팀에서의 역할 (LEADER, MEMBER)
     * @return 생성된 TeamMember 엔티티
     */
    fun createTeamMember(user: User, team: Team, role: TeamRoleType): TeamMember {
        return teamMemberRepository.save(
            TeamMember(
                user = user,
                team = team,
                role = role,
                joinedAt = LocalDateTime.now()
            )
        )
    }

    /**
     * 모든 팀 관련 데이터 (팀 멤버, 팀) 및 사용자 데이터를 삭제합니다.
     * 각 테스트 메서드 실행 전 데이터 독립성을 위해 사용될 수 있습니다.
     */
    fun clearTeamRelatedData() {
        teamMemberRepository.deleteAllInBatch()
        teamRepository.deleteAllInBatch()
        userRepository.deleteAllInBatch()
    }

    /**
     * 특정 팀 멤버를 삭제합니다. (테스트 시나리오별로 필요할 때 호출)
     */
    fun deleteTeamMember(teamMemberId: Int) {
        teamMemberRepository.deleteById(teamMemberId)
    }
}