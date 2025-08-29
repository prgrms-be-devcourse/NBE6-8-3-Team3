package com.tododuk.domain.user.service

import com.tododuk.domain.user.entity.User
import com.tododuk.standard.util.Ut
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.util.Map

@Service
class AuthTokenService {
    //yml 파일에서 설정값을 불러옴
    @Value("\${custom.jwt.secretKey}")
    private val jwtSecretKey: String? = null

    @Value("\${custom.accessToken.expirationSeconds}")
    private val accessTokenExpirationSeconds = 0

    //액세스 토큰 생성
    fun genAccessToken(user: User): String {
        val id = user.id.toLong()
        val email = user.userEmail

        return Ut.jwt.toString(
            jwtSecretKey,
            accessTokenExpirationSeconds,
            Map.of<String?, Any?>("id", id, "email", email)
        )
    }

    // 액세스 토큰에서 페이로드 추출 => (단순 토큰에서 값을 추출)
    fun payload(accessToken: String): kotlin.collections.Map<String, Any>? {
        val parsedPayload = Ut.jwt.payload(jwtSecretKey, accessToken)
            ?: return null

        return mapOf(
            "id" to parsedPayload["id"] as Int,
            "email" to parsedPayload["email"] as String
        )
    }
}
