package com.tododuk.global.rq

import com.tododuk.domain.user.entity.User
import com.tododuk.domain.user.service.UserService
import com.tododuk.global.security.SecurityUser
import jakarta.servlet.http.Cookie
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.Authentication
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component

@Component
class Rq(
    private val userService: UserService,
    private val req: HttpServletRequest,
    private val resp: HttpServletResponse
) {

    // Spring Security에서 현재 인증된 사용자(Principal)를 꺼내서,
    // User 엔티티 객체로 복원
    // 시큐리티 표준 방법 (SecurityContext 안에서 추출하는 방식)
    fun getActor(): User? {
        return SecurityContextHolder.getContext()
            .authentication
            ?.principal
            ?.takeIf { it is SecurityUser }
            ?.let { it as SecurityUser }
            ?.let { User(it.id, it.email) }
    }
    //로그인 사용자의 id만 반환하는 방식
    fun getActorId(): Int? {
        return (SecurityContextHolder.getContext().authentication?.principal as? SecurityUser)?.id
    }

    fun getHeader(name: String, defaultValue: String): String {
        return req.getHeader(name)
            ?.takeIf { it.isNotBlank() }
            ?: defaultValue
    }

    fun setHeader(name: String, value: String?) {
        val v = value ?: ""
        if (v.isBlank()) {
            req.getHeader(name) // 원본 Java 코드와 동일한 로직 (실제로는 아무것도 하지 않음)
        } else {
            resp.setHeader(name, v)
        }
    }

    fun getCookieValue(name: String, defaultValue: String): String {
        return req.cookies
            ?.firstOrNull { cookie -> cookie.name == name }
            ?.value
            ?.takeIf { it.isNotBlank() }
            ?: defaultValue
    }

    // apiKey 쿠키 설정
    fun setCookie(name: String, value: String?) {
        val cookie = Cookie(name, value)
        cookie.path = "/"
        cookie.isHttpOnly = true

        if (value.isNullOrBlank()) {
            cookie.maxAge = 0
        }

        resp.addCookie(cookie)
    }

    // apiKey가 삭제되는 쿠키 생성
    fun deleteCookie(name: String) {
        setCookie(name, null)
    }
}