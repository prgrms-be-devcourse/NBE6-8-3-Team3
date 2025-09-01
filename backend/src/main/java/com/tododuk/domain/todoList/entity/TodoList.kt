package com.tododuk.domain.todoList.entity

import com.tododuk.domain.team.entity.Team
import com.tododuk.domain.todo.entity.Todo
import com.tododuk.domain.user.entity.User
import com.tododuk.global.entity.BaseEntity
import jakarta.persistence.*
import lombok.NoArgsConstructor

@Entity
@NoArgsConstructor
open class TodoList(
    var name: String?,
    var description: String?,
    

    @ManyToOne
    @JoinColumn(name = "user_id")
    var user: User,

    @ManyToOne
    @JoinColumn(name = "team_id")
    var team: Team

) : BaseEntity() {
    @OneToMany(mappedBy = "todoList", fetch = FetchType.LAZY, cascade = [CascadeType.REMOVE])
    val todo: List<Todo> = ArrayList()
}
