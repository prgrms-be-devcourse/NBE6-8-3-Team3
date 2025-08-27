package com.tododuk.domain.user.entity

import com.tododuk.domain.label.entity.Label
import com.tododuk.domain.notification.entity.Notification
import com.tododuk.domain.team.entity.TeamMember
import com.tododuk.domain.todoList.entity.TodoList
import com.tododuk.global.entity.BaseEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import lombok.AllArgsConstructor
import lombok.Builder
import lombok.Getter
import lombok.NoArgsConstructor
import java.util.*

@Entity
@Table(name = "users")
class User(
    @Column(nullable = false, unique = true)
    var userEmail: String,

    var password: String? = null,
    var nickName: String? = null,

    @Column(nullable = false)
    var isAdmin: Boolean = false,

    var profileImgUrl: String? = null,

    @Column(unique = true)
    var apiKey: String? = null,

    @OneToMany(mappedBy = "user")
    var todoLists: MutableList<TodoList?>? = mutableListOf(),

    @OneToMany(mappedBy = "user")
    var teamMember: MutableList<TeamMember?>? = mutableListOf(),

    @OneToMany
    var labels: MutableList<Label?>? = mutableListOf(),

    @OneToMany
    var notifications: MutableList<Notification?>? = mutableListOf()
) : BaseEntity() {

    constructor(email: String, password: String?, nickName: String?) : this(
        userEmail = email,
        password = password,
        nickName = nickName,
        apiKey = UUID.randomUUID().toString()
    )

    fun updateUserInfo(nickName: String?, profileImgUrl: String?) {
        this.nickName = nickName
        this.profileImgUrl = profileImgUrl
    }
}
