package com.tododuk.domain.team.constant

enum class TeamRoleType(val description: String) {
    LEADER("리더"),
    MEMBER("멤버");

    companion object {
        @JvmStatic
        fun fromString(roleName: String): TeamRoleType {
            return values().find {
                it.name.equals(roleName, ignoreCase = true)
            } ?: throw IllegalArgumentException("Invalid TeamRoleType: $roleName")
        }
    }
}