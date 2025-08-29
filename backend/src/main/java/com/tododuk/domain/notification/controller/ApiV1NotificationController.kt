package com.tododuk.domain.notification.controller

import com.tododuk.domain.notification.dto.NotificationDto
import com.tododuk.domain.notification.service.NotificationService
import com.tododuk.domain.user.service.UserService
import com.tododuk.global.rsData.RsData
import io.swagger.v3.oas.annotations.Operation
import jakarta.validation.Valid
import lombok.RequiredArgsConstructor
import org.springframework.security.core.Authentication
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("api/v1/notifications")
@RequiredArgsConstructor
class ApiV1NotificationController {
    private val notificationService: NotificationService? = null
    private val userService: UserService? = null

    @JvmRecord
    data class CreateNotificationReqBody(
        val userEmail: String,
        val title: String,
        val description: String,
        val url: String
    )

    @PostMapping
    @Transactional
    @Operation(summary = "알림 생성")
    fun createNotification(@RequestBody @Valid createNotificationReqBody: CreateNotificationReqBody): RsData<Any?> {
        // 사용자 조회 (Kotlin 스타일)
        val user = userService?.findByUserEmail(createNotificationReqBody.userEmail)
            ?.orElseThrow { IllegalArgumentException("User not found with email") }!!

        // 알림 생성
        val notificationDto = notificationService?.createNotification(
            user,
            createNotificationReqBody.title,
            createNotificationReqBody.description,
            createNotificationReqBody.url
        ) ?: throw RuntimeException("알림 생성 실패")

        return RsData("200-1", "알림이 생성되었습니다.", notificationDto)
    }

    @DeleteMapping("/{id}")
    @Transactional
    @Operation(summary = "알림 삭제")
    fun deleteNotification(@PathVariable id: Int): RsData<NotificationDto?> {
        val noti: NotificationDto? = notificationService!!.findById(id)
        if (noti == null) {
            return RsData<NotificationDto?>("400-1", "알림이 존재하지 않습니다.")
        }
        notificationService.deleteNotification(noti.id)
        return RsData<NotificationDto?>("200-1", "알림이 삭제되었습니다.", noti)
    }
    @Operation(summary = "알람 다건 조회")
    @Transactional
    @GetMapping
    fun getNotifications(): RsData<List<NotificationDto>> {
        return try {
            val notifications = notificationService?.getAllNotifications()

            RsData(
                "200-1",
                "알림이 조회되었습니다.",
                notifications // 변환 로직이 필요하다면
            )
        } catch (e: IllegalArgumentException) {
            RsData(
                "400-1",
                "알림이 존재하지 않습니다.",
                emptyList()
            )
        }
    }
    @GetMapping("/{id}")
    @Transactional
    @Operation(summary = "알람 단건 조회")
    fun getNotificationById(@PathVariable id: Int): RsData<NotificationDto?> {
        try {
            val notification: NotificationDto? = notificationService?.findById(id)
            return RsData<NotificationDto?>("200-1", "알림이 조회되었습니다.",notification)
        } catch (e: IllegalArgumentException) {
            return RsData<NotificationDto?>("400-1", "알림이 존재하지 않습니다.")
        }
    }

    @PutMapping("/setStatus/{id}")
    @Transactional
    @Operation(summary = "알림 상태 변경")
    fun updateNotificationStatus(@PathVariable id: Int): RsData<NotificationDto?> {

        val notification: NotificationDto = notificationService!!.updateNotificationStatus(id)
        if (notification == null) {
            return RsData<NotificationDto?>("400-1", "알림 상태 변경 실패")
        }
        return RsData<NotificationDto?>("200-1", "알림 상태가 변경되었습니다.", notification)
    }


    // 옵션 4: Spring Security의 Authentication 사용 (권장)
    @GetMapping("/me")
    @Transactional
    @Operation(summary = "내 알림 조회")
    fun getNotificationByAuth(authentication: Authentication?): RsData<List<NotificationDto?>?> {
        if (authentication == null || !authentication.isAuthenticated()) {
            return RsData<List<NotificationDto?>?>("401-1", "인증이 필요합니다.")
        }

        // 현재 인증된 사용자 정보 가져오기
        val username = authentication.getName()
        println("Authenticated Username: " + username)
        val user = userService!!.findByUserEmail(username)

        val notifications: List<NotificationDto?> = notificationService!!.getNotificationsByUserId(1)
        if (notifications.isEmpty()) {
            return RsData<List<NotificationDto?>?>("404-1", "알림이 존재하지 않습니다.")
        }

        return RsData<List<NotificationDto?>?>("200-1", "알림이 조회되었습니다.", notifications)
    }
}