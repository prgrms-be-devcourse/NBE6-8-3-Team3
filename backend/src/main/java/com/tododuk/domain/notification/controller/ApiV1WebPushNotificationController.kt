package com.tododuk.domain.notification.controller

import com.tododuk.domain.notification.service.WebPushNotificationService
import com.tododuk.domain.user.service.UserService
import com.tododuk.global.rsData.RsData
import io.swagger.v3.oas.annotations.Operation
import jakarta.transaction.Transactional
import jakarta.validation.Valid
import lombok.RequiredArgsConstructor
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("api/v1/notifications/webpush")
@RequiredArgsConstructor
class ApiV1WebPushNotificationController(
    private val webPushNotificationService: WebPushNotificationService,
    private val userService: UserService,
    @Value("\${push.vapid.publicKey}") private val vapidPublicKey: String
) {
    @JvmRecord
    data class CreateWebPushNotificationReqBody(
        val endPointBrowser: String,
        val p256dh: String,
        val auth: String
    )

    @GetMapping("/vapid-public-key")
    @Operation(summary = "VAPID 공개키 조회")
    fun getVapidPublicKey(): RsData<String> {
        return try {
            // 클라이언트용 Raw 형식으로 변환해서 반환
            val clientKey = webPushNotificationService.getVapidPublicKeyForClient()
            RsData<String>("200-1", "VAPID 공개키 조회 완료", clientKey)
        } catch (e: Exception) {
            println("VAPID 공개키 조회 실패: ${e.message}")
            RsData<String>("500-1", "VAPID 공개키 조회 중 오류가 발생했습니다.", null)
        }
    }

    @PostMapping()
    @Transactional
    @Operation(summary = "웹푸쉬 알림을 위한 인증 정보 저장")
    fun createWebPushNotification(
        @RequestBody @Valid createWebPushNotificationReqBody: CreateWebPushNotificationReqBody,
        authentication: Authentication?
    ): RsData<String> {
        if (authentication == null || !authentication.isAuthenticated()) {
            return RsData<String>("401-1", "인증되지 않은 사용자입니다.", null)
        }

        return try {
            val userName = authentication.name
            val user = userService!!.findByUserEmail(userName)

            webPushNotificationService?.createWebPushNotification(
                user.get().id,
                createWebPushNotificationReqBody.endPointBrowser,
                createWebPushNotificationReqBody.p256dh,
                createWebPushNotificationReqBody.auth
            )

            println("웹 푸쉬 알림 인증 정보 저장 완료 - 사용자: ${user.get().id}")
            RsData<String>("200-1", "웹 푸쉬 알림 인증 정보 저장 완료", "success")
        } catch (e: Exception) {
            println("웹 푸쉬 알림 인증 정보 저장 실패: ${e.message}")
            RsData<String>("500-1", "웹 푸쉬 알림 인증 정보 저장 중 오류가 발생했습니다.", null)
        }
    }

    @GetMapping
    @Transactional
    @Operation(summary = "인증정보 전송")
    fun getWebPushNotification(authentication: Authentication?): RsData<Boolean?> {
        if (authentication == null || !authentication.isAuthenticated()) {
            return RsData<Boolean?>("401-1", "인증되지 않은 사용자입니다.", null)
        }

        return try {
            val userName = authentication.name
            val isSubscribed = webPushNotificationService!!.isSubscribed(userName)
            RsData<Boolean?>("200-1", "인증정보 전송 완료", isSubscribed)
        } catch (e: Exception) {
            println("인증정보 확인 실패: ${e.message}")
            RsData<Boolean?>("500-1", "인증정보 확인 중 오류가 발생했습니다.", null)
        }
    }

}