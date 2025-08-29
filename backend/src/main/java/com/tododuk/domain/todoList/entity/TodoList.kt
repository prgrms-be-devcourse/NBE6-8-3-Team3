package com.tododuk.domain.todoList.entity

import com.tododuk.domain.team.entity.Team
import com.tododuk.domain.todo.entity.Todo
import com.tododuk.domain.user.entity.User
import com.tododuk.global.entity.BaseEntity
import jakarta.persistence.*
import lombok.NoArgsConstructor
import lombok.Setter

@Entity
@Setter
@NoArgsConstructor
open class TodoList(
    val name: String,
    val description: String,
    @field:JoinColumn(name = "user_id") @field:ManyToOne val user: User,
    @field:JoinColumn(
        name = "team_id"
    ) @field:ManyToOne val team: Team
) :
    BaseEntity() {
    @OneToMany(mappedBy = "todoList", fetch = FetchType.LAZY, cascade = [CascadeType.REMOVE])
    val todo: List<Todo> = ArrayList()
}
