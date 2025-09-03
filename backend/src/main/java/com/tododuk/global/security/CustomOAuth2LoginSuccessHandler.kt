package com.tododuk.global.security

import com.tododuk.domain.user.service.UserService
import com.tododuk.global.rq.Rq
import jakarta.servlet.ServletException
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.core.Authentication
import org.springframework.security.web.authentication.AuthenticationSuccessHandler
import org.springframework.stereotype.Component
import java.io.IOException
import java.nio.charset.StandardCharsets
import java.util.*

@Component
class CustomOAuth2LoginSuccessHandler(
    private val userService: UserService,
    private val rq: Rq
) : AuthenticationSuccessHandler {

    @Throws(IOException::class, ServletException::class)
    override fun onAuthenticationSuccess(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authentication: Authentication
    ) {

        val actor = rq.getActorFromDb()
            ?: throw IllegalStateException("로그인한 사용자를 찾을 수 없습니다.")

        val accessToken = userService.genAccessToken(actor)

        rq.setCookie("apiKey", actor.apiKey)
        rq.setCookie("accessToken", accessToken)

        var redirectUrl = "/"

        val stateParam = request.getParameter("state")

        if (stateParam != null) {
            val decodedStateParam = String(
                Base64.getUrlDecoder().decode(stateParam),
                StandardCharsets.UTF_8
            )

            redirectUrl = decodedStateParam.split("#", limit = 2)[0]
        }

        rq.sendRedirect(redirectUrl)
    }
}