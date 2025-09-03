package com.tododuk.domain.notification.repository


import com.tododuk.domain.notification.entity.WebPushNotification
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository


@Repository
interface WebPushNotificationRepository: JpaRepository<WebPushNotification, Int> {
    fun findByUserId(userId : Int): WebPushNotification?
}