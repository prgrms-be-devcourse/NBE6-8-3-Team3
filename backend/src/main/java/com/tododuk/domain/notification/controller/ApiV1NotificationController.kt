package com.tododuk.domain.notification.controller

import com.tododuk.domain.notification.dto.NotificationDto
import com.tododuk.domain.notification.dto.NotificationResponseDto
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
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = ["http://localhost:3000"])
class ApiV1NotificationController(
    private val notificationService: NotificationService,
    private val userService: UserService
){


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
        val user = userService.findByUserEmail(createNotificationReqBody.userEmail)
            .orElseThrow { IllegalArgumentException("User not found with email") }

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
    fun updateNotificationStatus(@PathVariable id: Int): RsData<NotificationResponseDto?> {
        return try {
            val notification = notificationService.updateNotificationStatus(id)
            RsData("200-1", "알림 상태가 변경되었습니다.", notification)
        } catch (e: IllegalArgumentException) {
            RsData("404-1", "알림을 찾을 수 없습니다.", null)
        } catch (e: Exception) {
            RsData("500-1", "알림 상태 변경 실패: ${e.message}", null)
        }
    }

    @GetMapping("/notime")
    @Transactional
    @Operation(summary = "내 알림 조회")
    fun getNotificationByAuth(authentication: Authentication?): RsData<List<NotificationResponseDto>?> {
        return try {
            if (authentication == null) {
                return RsData("401-1", "인증이 필요합니다.", null)
            }

            val username = authentication.name
            val userOptional = userService.findByUserEmail(username)

            if (!userOptional.isPresent) {
                return RsData("404-1", "사용자를 찾을 수 없습니다.", null)
            }

            val user = userOptional.get()
            val notifications = notificationService.getNotificationsByUserId(user.id)

            RsData("200-1", "알림 조회 성공", notifications)

        } catch (e: Exception) {
            println("알림 조회 중 오류 발생: ${e.message}")
            e.printStackTrace()
            RsData("500-1", "서버 오류: ${e.message}", null)
        }
    }

}