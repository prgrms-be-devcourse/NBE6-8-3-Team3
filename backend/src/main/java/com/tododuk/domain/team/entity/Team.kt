package com.tododuk.domain.team.entity

import com.tododuk.global.entity.BaseEntity
import jakarta.persistence.CascadeType
import jakarta.persistence.Entity
import jakarta.persistence.OneToMany

@Entity
class Team(
    var teamName: String = "",
    var description: String? = null
) : BaseEntity() {

    @OneToMany(mappedBy = "team", cascade = [CascadeType.ALL], orphanRemoval = true)
    val members: MutableList<TeamMember> = mutableListOf()

    // JPA를 위한 기본 생성자
    constructor() : this("", null)

    fun updateTeam(teamName: String?, description: String?) {
        teamName?.takeIf { it.isNotBlank() }?.let { this.teamName = it }
        description?.let { this.description = it }
    }

    fun addMember(teamMember: TeamMember) {
        members.add(teamMember)
        teamMember.setTeam(this)  // Java TeamMember와 호환
    }

    fun removeMember(teamMember: TeamMember) {
        members.remove(teamMember)
        teamMember.setTeam(null)  // Java TeamMember와 호환
    }

    // Builder 패턴 추가 (Java 호환성을 위해)
    companion object {
        @JvmStatic
        fun builder(): Builder = Builder()

        class Builder {
            private var teamName: String = ""
            private var description: String? = null

            fun teamName(teamName: String): Builder {
                this.teamName = teamName
                return this
            }

            fun description(description: String?): Builder {
                this.description = description
                return this
            }

            fun build(): Team {
                return Team(teamName, description)
            }
        }
    }
}