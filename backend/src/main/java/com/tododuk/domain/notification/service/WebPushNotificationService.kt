package com.tododuk.domain.notification.service

import com.tododuk.domain.notification.dto.NotificationPayLoadDto
import com.tododuk.domain.notification.entity.WebPushNotification
import com.tododuk.domain.notification.repository.WebPushNotificationRepository
import com.tododuk.domain.reminder.service.ReminderService
import com.tododuk.domain.todo.service.TodoService
import com.tododuk.domain.todoList.service.TodoListService
import com.tododuk.domain.user.repository.UserRepository
import com.tododuk.domain.user.service.UserService
import nl.martijndwars.webpush.PushService
import nl.martijndwars.webpush.Subscription
import org.apache.http.HttpResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.util.*

@Service
class WebPushNotificationService(
    private val webPushNotificationRepository: WebPushNotificationRepository,
    private val userService: UserService,
    private val todoService : TodoService,
    private val todoListService : TodoListService,
    private val reminderService : ReminderService,
    private val userRepository: UserRepository,
    @Value("\${push.vapid.publicKey}") private val vapidPublicKey: String,
    @Value("\${push.vapid.privateKey}") private val vapidPrivateKey: String
) {

    fun createWebPushNotification(
        userId: Int,
        endPointBrowser: String,
        p256dh: String,
        auth: String
    ) {
        val webPushNotification = WebPushNotification(
            userId,
            endPointBrowser,
            p256dh,
            auth
        )
        webPushNotificationRepository.save(webPushNotification)
    }

    fun sendWebPushNotification(notification: NotificationPayLoadDto, userId: Int) {
        val webPushNotification = webPushNotificationRepository.findByUserId(userId)
        if (webPushNotification != null) {
            try {
                val keys = Subscription.Keys(webPushNotification.p256dh, webPushNotification.auth)
                val subscription = Subscription(webPushNotification.endPointBrowser, keys)

                // DTO의 toString() 메서드 사용
                val payloadJson = notification.toString()
                println("보내는 페이로드: $payloadJson")

                val noti = nl.martijndwars.webpush.Notification(subscription, payloadJson)

                val pushService = PushService()
                    .setSubject("mailto:moon4720907@gmail.com")  // mailto: 추가
                    .setPublicKey(vapidPublicKey)
                    .setPrivateKey(vapidPrivateKey)

                val response: HttpResponse = pushService.send(noti)
                println("Response: ${response.statusLine.statusCode}")

                if (response.statusLine.statusCode == 410) {
                    // 만료된 구독 삭제
                    webPushNotificationRepository.delete(webPushNotification)
                    println("만료된 구독 삭제됨: $userId")
                }

            } catch (e: Exception) {
                println("웹 푸시 알림 전송 실패: ${e.message}")
                e.printStackTrace()
            }
        } else {
            println("웹 푸시 알림 인증 정보가 없습니다. 사용자 ID: $userId")
        }
    }
    fun isSubscribed(userName: String): Boolean? {
        val user = userRepository.findByUserEmail(userName)
        val isExist = webPushNotificationRepository.findByUserId(user.get().id)
        if (isExist != null) {
            return true
        }
        return false
    }

    // 클라이언트에게 Raw 형식의 공개키 반환
    fun getVapidPublicKeyForClient(): String {
        return convertDerToRaw(vapidPublicKey)
    }
    // DER 형식을 Raw 형식으로 변환하는 함수
    private fun convertDerToRaw(derKey: String): String {
        try {
            // URL-safe Base64 디코딩 사용 (- 와 _ 문자 처리)
            val derBytes = Base64.getUrlDecoder().decode(derKey)

            // DER 인코딩된 키에서 Raw 공개키 추출 (P-256 곡선의 경우 마지막 65바이트)
            val rawBytes = if (derBytes.size == 91) {
                // 표준 DER 형식: 26바이트 헤더 + 65바이트 공개키
                derBytes.sliceArray(26..90)
            } else if (derBytes.size == 65) {
                // 이미 Raw 형식
                derBytes
            } else {
                throw IllegalArgumentException("예상되지 않은 키 길이: ${derBytes.size}")
            }

            // URL-safe Base64로 인코딩하여 반환
            return Base64.getUrlEncoder().withoutPadding().encodeToString(rawBytes)
        } catch (e: Exception) {
            println("DER to Raw 변환 실패: ${e.message}")
            println("원본 키: $derKey")
            throw e
        }
    }
    fun sendWebPushNotificationByReminder(reminderId: Int)
    {
        println("bbbb")
        val reminder = reminderService.getReminderById(reminderId)
        val notificationPayLoadDto = NotificationPayLoadDto(reminder.data!!.method,reminder.data.method+"종료5분전입니다")
        val userId = todoService.getTodoById(reminderService.getReminderById(reminderId).data!!.todoId!!).todoList!!.user.id
        println("userId : "+userId)
        println("title : " + notificationPayLoadDto)
        sendWebPushNotification(notificationPayLoadDto,userId)
    }
}