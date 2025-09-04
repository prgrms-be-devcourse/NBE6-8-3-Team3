package com.tododuk.domain.user.service

import com.tododuk.standard.util.Ut.jwt.isValid
import com.tododuk.standard.util.Ut.jwt.toString
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.assertj.core.api.Assertions
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.nio.charset.StandardCharsets
import java.util.*
import java.util.Map

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AutoTokenServiceTest {
    @Autowired
    private val userService: UserService? = null

    @Autowired
    private val authTokenService: AuthTokenService? = null
    private val expireSeconds = 60 * 60 * 24 * 365
    private val secret = "abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz0123456789"

    @Test
    @DisplayName("authTokenService 서비스가 존재한다.")
    fun t1() {
        Assertions.assertThat<AuthTokenService?>(authTokenService).isNotNull()
    }

    @Test
    @DisplayName("jjwt 최신 방식으로 JWT 생성, {name=\"Paul\", age=23}")
    fun t2() {
        // 토큰 만료기간: 1년
        val expireMillis = 1000L * expireSeconds

        val keyBytes = secret.toByteArray(StandardCharsets.UTF_8)
        val secretKey = Keys.hmacShaKeyFor(keyBytes)

        // 발행 시간과 만료 시간 설정
        val issuedAt = Date()
        val expiration = Date(issuedAt.getTime() + expireMillis)

        val jwt = Jwts.builder()
            .claims(Map.of("name", "Paul", "age", 23)) // 내용
            .issuedAt(issuedAt) // 생성날짜
            .expiration(expiration) // 만료날짜
            .signWith(secretKey) // 키 서명
            .compact()

        Assertions.assertThat(jwt).isNotBlank()

        Assertions.assertThat(
            isValid(secret, jwt)
        )
            .isTrue()
    }

    @Test
    @DisplayName("Ut.jwt.toString 를 통해서 JWT 생성, {name=\"Paul\", age=23}")
    fun t3() {
        val jwt = toString(
            secret,
            expireSeconds,
            Map.of<String, Any?>("name", "Paul", "age", 23)
        )

        Assertions.assertThat(jwt).isNotBlank()

        println("jwt = " + jwt)
    }

    @Test
    @DisplayName("유저 액세스 토큰 생성")
    fun t4() {
        val user = userService!!.findByUserEmail("dev@test.com").get()
        val accessToken = authTokenService!!.genAccessToken(user)
        Assertions.assertThat(accessToken).isNotBlank()

        println("accessToken = " + accessToken)
    }
}
