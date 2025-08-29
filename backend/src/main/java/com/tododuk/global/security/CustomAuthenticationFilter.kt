package com.tododuk.global.security

import com.fasterxml.jackson.databind.ObjectMapper
import com.tododuk.domain.user.entity.User
import com.tododuk.domain.user.service.UserService
import com.tododuk.global.exception.ServiceException
import com.tododuk.global.rq.Rq
import jakarta.servlet.FilterChain
import jakarta.servlet.ServletException
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.stereotype.Component
import org.springframework.util.AntPathMatcher
import org.springframework.web.filter.OncePerRequestFilter
import java.io.IOException
import java.util.logging.Logger

@Component
class CustomAuthenticationFilter(
    private val rq: Rq,
    private val userService: UserService,
    private val objectMapper: ObjectMapper
) : OncePerRequestFilter() {

    private val logger = Logger.getLogger(CustomAuthenticationFilter::class.java.name)

    @Throws(ServletException::class, IOException::class)
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {

        val path = request.requestURI

        // PERMIT_ALL_PATHS 경로면 인증 로직 건너뛰기
        if (isPermitAllPath(path)) {
            filterChain.doFilter(request, response)
            return
        }

        try {
            work(request, response, filterChain)
        } catch (e: ServiceException) {
            val rsData = e.rsData
            response.contentType = "application/json"
            response.status = rsData.statusCode

            response.writer.write(
                objectMapper.writeValueAsString(rsData)
            )
        } catch (e: Exception) {
            throw e
        }
    }

    // 인증, 인가가 필요 없는 경로인지 확인
    private fun isPermitAllPath(path: String): Boolean {
        return SecurityConfig.PERMIT_ALL_PATHS.any { pattern ->
            AntPathMatcher().match(pattern, path)
        }
    }

    @Throws(ServletException::class, IOException::class)
    private fun work(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        // api요청이 아니면 패스
        if (!request.requestURI.startsWith("/api/")) {
            filterChain.doFilter(request, response)
            return
        }

        // 인증,인가가 필요 없는 요청이면 패스
        if (isPermitAllPath(request.requestURI)) {
            filterChain.doFilter(request, response)
            return
        }

        // 인증, 인가가 필요한 요청인 경우
        val headerAuthorization = rq.getHeader("Authorization", "")

        val (apiKey, accessToken) = if (!headerAuthorization.isNullOrBlank()) {
            // Authentication 헤더에서 조회 시도
            if (!headerAuthorization.startsWith("Bearer ")) {
                throw IllegalArgumentException("Authorization 헤더가 올바르지 않습니다.")
            }
            // Bearer 토큰에서 apiKey, accessToken 추출 (Authorization = Bearer apiKey accessToken)
            val headerParts = headerAuthorization.split(" ", limit = 3)
            val apiKey = headerParts[1]
            val accessToken = if (headerParts.size == 3) headerParts[2] else ""
            Pair(apiKey, accessToken)
        } else {
            // Authentication 헤더가 없는 경우 쿠키에서 조회
            val apiKey = rq.getCookieValue("apiKey", "")
            val accessToken = rq.getCookieValue("accessToken", "")
            Pair(apiKey, accessToken)
        }

        // apiKey와 accessToken이 모두 비어있으면 그냥 통과 (인증, 인가가 필요 없는 요청)
        val isApiKeyExists = apiKey.isNotBlank()
        val isAccessTokenExists = accessToken.isNotBlank()

        if (!isApiKeyExists && !isAccessTokenExists) {
            filterChain.doFilter(request, response)
            return
        }

        // 개선된 사용자 조회 로직 - 항상 실제 DB에서 최신 데이터 조회
        var user: User? = null
        var isAccessTokenValid = false

        if (isAccessTokenExists) {
            val payload = userService.payload(accessToken)

            if (payload != null) {
                val userIdNum = payload["id"] as Number
                val userId = userIdNum.toInt()

                // Optional을 사용하여 사용자 조회
                val userOptional = userService.findById(userId)
                if (!userOptional.isPresent) {
                    throw ServiceException("404-1", "존재하지 않는 사용자입니다.")
                }
                user = userOptional.get()
                isAccessTokenValid = true
            }
        }

        // accessToken이 없거나 유효하지 않은 경우 apiKey로 조회
        if (user == null) {
            val userOptional = userService.findByApiKey(apiKey)
            if (!userOptional.isPresent) {
                throw ServiceException("404-2", "존재하지 않는 Api키입니다.")
            }
            user = userOptional.get()
        }

        // accessToken이 존재했지만 유효하지 않은 경우 새로운 토큰 생성
        if (isAccessTokenExists && !isAccessTokenValid) {
            val actorAccessToken = userService.genAccessToken(user)
            rq.setCookie("accessToken", actorAccessToken)
            rq.setHeader("Authorization", actorAccessToken)
        }

        // isAdmin이면 관리자 권한 부여 (이제 실제 DB 데이터 사용)
        val authorities: Collection<GrantedAuthority> = if (user.isAdmin) {
            listOf(SimpleGrantedAuthority("ROLE_ADMIN"))
        } else {
            emptyList()
        }

        // 스프링 시큐리티에 사용자 정보를 담아 인증 객체 생성
        val springUser: UserDetails = SecurityUser(
            user.id,
            user.userEmail,
            "blank", // 이미 인증된 사용자므로 비밀번호는 빈 문자열로
            authorities
        )

        val authentication: Authentication = UsernamePasswordAuthenticationToken(
            springUser,
            springUser.password,
            springUser.authorities
        )

        // 이 시점 이후부터는 시큐리티가 이 요청을 인증된 사용자의 요청으로 인식합니다. (시큐리티 컨텍스트에 저장)
        SecurityContextHolder.getContext().authentication = authentication

        // 다음 필터로 요청을 전달
        filterChain.doFilter(request, response)
    }

    @Throws(IOException::class)
    private fun sendErrorJson(response: HttpServletResponse, status: Int, message: String) {
        response.status = status
        response.contentType = "application/json; charset=UTF-8"
        val body = """
        {
            "resultCode": "$status",
            "msg": "$message"
        }
        """.trimIndent()
        response.writer.write(body)
    }
}