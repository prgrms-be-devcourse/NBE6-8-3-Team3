package com.tododuk.domain.notification.service

import com.tododuk.domain.notification.dto.NotificationDto
import com.tododuk.domain.notification.dto.NotificationResponseDto
import com.tododuk.domain.notification.entity.Notification
import com.tododuk.domain.notification.repository.NotificationRepository
import com.tododuk.domain.reminder.service.ReminderService
import com.tododuk.domain.todo.service.TodoService
import com.tododuk.domain.user.entity.User
import com.tododuk.domain.user.service.UserService
import org.springframework.stereotype.Service

@Service
class NotificationService(
    val notificationRepository: NotificationRepository,
    val reminderService: ReminderService,
    val userService: UserService,
    val todoService: TodoService
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

        val userId = todoService.getTodoById(reminder.todoId!!).todoList!!.user.id
        val user: User = userService.findById(userId)
            .orElseThrow { IllegalArgumentException("User not found with id $userId") }!!

        val title = "Reminder: ${reminder.method ?: "No Title"}"
        val description = "Your reminder is scheduled for ${reminder.remindAt}."
        val todoListId = todoService.getTodoById(reminder.todoId!!).todoList!!.id
        val url = "/todoList/${todoListId}"

        return createNotification(user, title, description, url)
    }

    fun updateNotificationStatus(notificationId: Int): NotificationResponseDto {
        val existingNotification = notificationRepository.findById(notificationId)
            .orElseThrow { IllegalArgumentException("Notification not found with id: $notificationId") }

        // 읽지 않은 상태인 경우에만 읽음으로 변경
        if (!existingNotification.isRead) {
            existingNotification.markAsRead()
        }

        val updatedNotification = notificationRepository.save(existingNotification)
        return NotificationResponseDto.from(updatedNotification) // ResponseDto로 반환
    }

    fun getNotificationsByUserId(userId: Int): List<NotificationResponseDto> {
        return notificationRepository.findByUserId(userId)
            .map { NotificationResponseDto.from(it) }
    }
    }

