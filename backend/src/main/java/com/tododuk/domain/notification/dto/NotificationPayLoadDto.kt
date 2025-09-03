package com.tododuk.domain.notification.dto

class NotificationPayLoadDto
    (
            val title: String,
            val body: String,
            ) {
    override fun toString(): String {
        return """{"title": "$title", "body": "$body", "icon": "/favicon.ico"}"""
    }
}