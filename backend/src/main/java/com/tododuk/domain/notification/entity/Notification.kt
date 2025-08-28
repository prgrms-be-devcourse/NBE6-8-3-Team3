package com.tododuk.domain.notification.entity

import com.tododuk.domain.user.entity.User
import com.tododuk.global.entity.BaseEntity
import jakarta.persistence.Entity
import jakarta.persistence.ManyToOne

@Entity
open class Notification : BaseEntity {

    @ManyToOne
    lateinit var user: User
    var title: String = ""
    var description: String = ""
    var url: String = ""
    var isRead: Boolean = false

    // JPA 기본 생성자
    protected constructor() : super()

    // 사용자 정의 생성자
    constructor(
        user: User,
        title: String,
        description: String,
        url: String
    ) : super() {
        this.user = user
        this.title = title
        this.description = description
        this.url = url
        this.isRead = false
    }

    // 읽음 상태로 변경하는 메서드
    fun markAsRead() {
        this.isRead = true
    }

    // Java 호환성을 위한 isRead setter (다른 이름으로)
    fun setIsRead(read: Boolean) {
        this.isRead = read
    }
}