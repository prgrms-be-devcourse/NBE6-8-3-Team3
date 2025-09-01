
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
import java.util.*

@Entity
@Table(name = "users")
open class User : BaseEntity {

    @Column(nullable = false, unique = true)
    var userEmail: String = ""

    var password: String = ""

    var nickName: String = ""

    @Column(nullable = false)
    var isAdmin: Boolean = false

    var profileImgUrl: String = ""

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
        profileImgUrl: String,
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
        profileImgUrl = "",
        apiKey = UUID.randomUUID().toString()
    )

    // Rq.getActor()에서 사용하는 생성자 (폐기 고려 중)
    constructor(id: Int, email: String) : super() {
        this.id = id
        this.userEmail = email
        this.password = ""
        this.nickName = ""
        this.apiKey = ""
    }

    fun updateUserInfo(nickName: String, profileImgUrl: String) {
        this.nickName = nickName
        this.profileImgUrl = profileImgUrl
    }

    // Java 코드와의 호환성을 위한 Builder 패턴
    companion object {
        @JvmStatic
        fun builder(): UserBuilder = UserBuilder()
    }

    class UserBuilder {
        private var userEmail: String = ""
        private var password: String = ""
        private var nickName: String = ""
        private var isAdmin: Boolean = false
        private var profileImgUrl: String = ""
        private var apiKey: String = UUID.randomUUID().toString()

        fun userEmail(email: String): UserBuilder {
            this.userEmail = email
            return this
        }

        fun password(password: String): UserBuilder {
            this.password = password
            return this
        }

        fun nickName(nickName: String): UserBuilder {
            this.nickName = nickName
            return this
        }

        fun isAdmin(isAdmin: Boolean): UserBuilder {
            this.isAdmin = isAdmin
            return this
        }

        fun profileImgUrl(url: String): UserBuilder {
            this.profileImgUrl = url
            return this
        }

        fun apiKey(key: String): UserBuilder {
            this.apiKey = key
            return this
        }

        fun build(): User {
            return User(userEmail, password, nickName, isAdmin, profileImgUrl, apiKey)
        }
    }
}