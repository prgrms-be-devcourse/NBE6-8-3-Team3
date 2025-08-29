package com.tododuk.domain.notification.dto


import com.tododuk.domain.notification.entity.Notification
import com.tododuk.domain.user.entity.User

data class NotificationDto(
    val id: Int,
    val user: User,  // Optional 대신 Kotlin nullable 타입 사용
    val title: String,
    val description: String,
    val url: String,
    val isRead: Boolean
) {
    companion object {
        fun from(notification: NotificationDto): NotificationDto {
            return NotificationDto(
                id = notification.id,
                user = notification.user,
                title = notification.title,
                description = notification.description,
                url = notification.url,
                isRead = notification.isRead
            )
        }
    }
    constructor(notification: Notification) : this(
        id = notification.id,
        user = notification.user,
        title = notification.title, // title이 null일 경우 기본값 설정
        description = notification.description,
        url = notification.url,
        isRead = notification.isRead
    )
}