package com.tododuk.domain.user.entity

import com.tododuk.domain.label.entity.Label
import com.tododuk.domain.notification.entity.Notification
import com.tododuk.domain.team.entity.TeamMember
import com.tododuk.domain.todoList.entity.TodoList
import com.tododuk.global.entity.BaseEntity
import jakarta.persistence.*
import lombok.Builder
import java.util.*

@Entity
@Table(name = "users")
class User : BaseEntity {

    @Column(nullable = false, unique = true)
    var userEmail: String = ""

    var password: String = ""

    var nickName: String = ""

    @Column(nullable = false)
    var isAdmin: Boolean = false

    var profileImgUrl: String? = null

    @Column(unique = true)
    var apiKey: String = ""

    @OneToMany(mappedBy = "user")
    var todoLists: MutableList<TodoList> = mutableListOf()

    @OneToMany(mappedBy = "user")
    var teamMembers: MutableList<TeamMember> = mutableListOf()

    @OneToMany
    var labels: MutableList<Label> = mutableListOf()

    @OneToMany
    var notifications: MutableList<Notification> = mutableListOf()

    // JPA 기본 생성자
    protected constructor() : super() {
        this.userEmail = ""
        this.password = ""
        this.nickName = ""
        this.apiKey = ""
    }

    // 일반적인 사용자 생성 생성자
    constructor(
        userEmail: String,
        password: String,
        nickName: String,
        isAdmin: Boolean = false,
        profileImgUrl: String? = null,
        apiKey: String
    ) : super() {
        this.userEmail = userEmail
        this.password = password
        this.nickName = nickName
        this.isAdmin = isAdmin
        this.profileImgUrl = profileImgUrl
        this.apiKey = apiKey
    }

    // 새 사용자 생성용 편의 생성자
    constructor(email: String, password: String, nickName: String) : this(
        userEmail = email,
        password = password,
        nickName = nickName,
        apiKey = UUID.randomUUID().toString()
    )

    // Rq.getActor()에서 사용하는 생성자
    constructor(id: Int, email: String) : super() {
        this.id = id  // BaseEntity의 int id 설정
        this.userEmail = email
        this.password = ""  // 임시값
        this.nickName = ""  // 임시값
        this.apiKey = ""    // 임시값
    }

    fun updateUserInfo(nickName: String, profileImgUrl: String?) {
        this.nickName = nickName  // 원본과 동일하게 null 체크 없이 할당
        this.profileImgUrl = profileImgUrl
    }
}