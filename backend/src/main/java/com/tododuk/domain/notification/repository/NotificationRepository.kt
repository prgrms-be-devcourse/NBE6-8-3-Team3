package com.tododuk.domain.notification.repository


import com.tododuk.domain.notification.entity.Notification
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository


@Repository
interface NotificationRepository: JpaRepository<Notification, Int> {
    fun findByUserId(userId : Int): List<Notification>
}