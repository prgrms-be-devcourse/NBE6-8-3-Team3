
package com.tododuk.domain.team.entity

import com.tododuk.domain.todo.entity.Todo
import com.tododuk.domain.user.entity.User
import com.tododuk.global.entity.BaseEntity
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "todo_assignment")
class TodoAssignment(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "todo_id")
    var todo: Todo? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_user_id")
    var assignedUser: User? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    var team: Team? = null,

    // 담당자 지정일
    var assignedAt: LocalDateTime = LocalDateTime.now(),

    // 담당자 상태 (ACTIVE, INACTIVE)
    @Enumerated(EnumType.STRING)
    var status: AssignmentStatus = AssignmentStatus.ACTIVE
) : BaseEntity() {

    enum class AssignmentStatus {
        ACTIVE, INACTIVE
    }

    // JPA를 위한 기본 생성자
    constructor() : this(null, null, null, LocalDateTime.now(), AssignmentStatus.ACTIVE)

    @PrePersist
    protected fun onCreate() {
        assignedAt = LocalDateTime.now()
        status = AssignmentStatus.ACTIVE
    }

    // Builder 패턴 (Java 호환성을 위해)
    companion object {
        @JvmStatic
        fun builder(): Builder = Builder()

        class Builder {
            private var todo: Todo? = null
            private var assignedUser: User? = null
            private var team: Team? = null

            fun todo(todo: Todo?): Builder {
                this.todo = todo
                return this
            }

            fun assignedUser(assignedUser: User?): Builder {
                this.assignedUser = assignedUser
                return this
            }

            fun team(team: Team?): Builder {
                this.team = team
                return this
            }

            fun build(): TodoAssignment {
                return TodoAssignment(todo, assignedUser, team)
            }
        }
    }
}