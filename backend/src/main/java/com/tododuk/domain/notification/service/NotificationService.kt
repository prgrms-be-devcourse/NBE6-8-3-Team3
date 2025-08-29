package com.tododuk.domain.notification.service

import com.tododuk.domain.notification.dto.NotificationDto
import com.tododuk.domain.notification.entity.Notification
import com.tododuk.domain.notification.repository.NotificationRepository
import com.tododuk.domain.reminder.service.ReminderService
import com.tododuk.domain.user.entity.User
import com.tododuk.domain.user.service.UserService
import org.springframework.stereotype.Service

@Service
class NotificationService(
    val notificationRepository: NotificationRepository,
    val reminderService: ReminderService,
    val userService: UserService
) {

    fun createNotification(user: User, title: String, description: String, url: String): NotificationDto {
        val notification = Notification(user, title, description, url)
        val savedNotification = notificationRepository.save(notification)
        return NotificationDto(savedNotification)
    }

    fun findById(id: Int): NotificationDto? {
        val notification = notificationRepository.findById(id)
        return if (notification.isPresent) {
            NotificationDto(notification.get())
        } else {
            null
        }
    }


    fun findByIdImproved(id: Int): NotificationDto? {
        return notificationRepository.findById(id)
            .map { NotificationDto(it) }
            .orElse(null)
    }

    fun deleteNotification(notificationId: Int) {
        val notification = notificationRepository.findById(notificationId)
            .orElseThrow { IllegalArgumentException("Notification not found with id: $notificationId") }
        notificationRepository.delete(notification)
    }

    // Entity 대신 DTO 반환 (더 나은 방법)
    fun getAllNotifications(): List<NotificationDto> {
        return notificationRepository.findAll()
            .map { NotificationDto(it) }
    }


    fun createNotificationByReminder(reminderId: Int): NotificationDto {
        val reminder = reminderService.findById(reminderId)
            ?: throw IllegalArgumentException("Reminder not found with id $reminderId")

        val userId = 1 // TODO: reminder와 연동된 userId 사용
        val user: User = userService.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found with id $userId") }!!

        val title = "Reminder: ${reminder.method ?: "No Title"}"
        val description = "Your reminder is scheduled for ${reminder.remindAt}."
        val url = "/reminders/${reminder.id}"

        return createNotification(user, title, description, url)
    }

    fun updateNotificationStatus(notificationId : Int): NotificationDto {
        val existingNotification = notificationRepository.findById(notificationId)
            .orElseThrow { IllegalArgumentException("Notification not found with id: ${notificationId}") }

        if (existingNotification.isRead) {
            existingNotification.markAsRead()
        }

        val updatedNotification = notificationRepository.save(existingNotification)
        return NotificationDto(updatedNotification) // DTO로 반환
    }

    fun getNotificationsByUserId(userId: Int): List<NotificationDto> {
        return notificationRepository.findByUserId(userId)
            .map { NotificationDto(it) }
    }

}