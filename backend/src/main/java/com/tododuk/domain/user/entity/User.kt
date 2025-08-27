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
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "users")
class User : BaseEntity {
    private var userEmail: String?

    private var password: String? = null
    private var nickName: String? = null

    @Column(nullable = false)
    private var isAdmin = false
    private var profileImgUrl: String? = null

    @Column(unique = true)
    private var apiKey: String? = null

    @OneToMany(mappedBy = "user")
    private var todoLists: MutableList<TodoList?>? = null

    @OneToMany(mappedBy = "user")
    private var teamMember: MutableList<TeamMember?>? = null

    @OneToMany
    private var labels: MutableList<Label?>? = null

    @OneToMany
    private var notifications: MutableList<Notification?>? = null

    constructor(email: String?, password: String?, nickName: String?) {
        this.userEmail = email
        this.password = password
        this.nickName = nickName
        this.apiKey = UUID.randomUUID().toString()
    }

    constructor(id: Int, userEmail: String?) {
        this.id = id
        this.userEmail = userEmail
    }

    fun updateUserInfo(nickName: String?, profileImgUrl: String?) {
        this.nickName = nickName
        this.profileImgUrl = profileImgUrl
    }
}
