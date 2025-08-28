package com.tododuk.domain.team.entity

import com.tododuk.domain.team.constant.TeamRoleType
import com.tododuk.domain.user.entity.User
import com.tododuk.global.entity.BaseEntity
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "team_members",
    uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "team_id"])]
)
class TeamMember(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    var team: Team? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 50)
    var role: TeamRoleType = TeamRoleType.MEMBER,

    @Column(name = "joined_at", nullable = false)
    var joinedAt: LocalDateTime = LocalDateTime.now()
) : BaseEntity() {

    // JPA를 위한 기본 생성자
    constructor() : this(null, null, TeamRoleType.MEMBER, LocalDateTime.now())

    fun updateRole(role: TeamRoleType) {
        this.role = role
    }

    @PrePersist
    protected fun onCreate() {
        if (joinedAt == null) {
            joinedAt = LocalDateTime.now()
        }
    }

    // Builder 패턴 (Java 호환성을 위해)
    companion object {
        @JvmStatic
        fun builder(): Builder = Builder()

        class Builder {
            private var user: User? = null
            private var team: Team? = null
            private var role: TeamRoleType = TeamRoleType.MEMBER

            fun user(user: User?): Builder {
                this.user = user
                return this
            }

            fun team(team: Team?): Builder {
                this.team = team
                return this
            }

            fun role(role: TeamRoleType): Builder {
                this.role = role
                return this
            }

            fun build(): TeamMember {
                return TeamMember(user, team, role, LocalDateTime.now())
            }
        }
    }
}
// ❌ 이 부분들을 제거! (var로 선언했으므로 자동 생성되기 때문에 필요가 없음 )
// fun setUser(user: User?) { ... }
// fun setTeam(team: Team?) { ... }