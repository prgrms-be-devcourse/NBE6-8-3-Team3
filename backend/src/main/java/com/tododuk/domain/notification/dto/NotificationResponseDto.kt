package com.tododuk.domain.notification.dto

import com.tododuk.domain.notification.entity.Notification

data class NotificationResponseDto(
    val id: Int,
    val userId: Int,
    val title: String,
    val description: String,
    val url: String,
    val isRead: Boolean
) {
    companion object {
        fun from(notification: Notification): NotificationResponseDto {
            return NotificationResponseDto(
                id = notification.id,
                userId = notification.user.id,
                title = notification.title ?: "",
                description = notification.description ?: "",
                url = notification.url ?: "",
                isRead = notification.isRead
            )
        }
    }
}