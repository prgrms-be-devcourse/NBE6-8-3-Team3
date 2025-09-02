package com.tododuk.global.security

import jakarta.servlet.http.HttpServletResponse
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
class SecurityConfig(
    private val customAuthenticationFilter: CustomAuthenticationFilter
) {
    companion object {
        // 인증 인가 필요 없는 API 경로 목록
        val PERMIT_ALL_PATHS = arrayOf(
            "/api/v1/user/login",
            "/api/v1/user/logout",
            "/api/v1/user/register",
            "oauth2/authorization/kakao"
        )
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration().apply {
            allowedOrigins = listOf("http://localhost:3000", "https://cdpn.io")
            allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
            allowedHeaders = listOf("*")
            allowCredentials = true
            maxAge = 3600L
        }

        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/api/**", configuration)
        }
    }

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        return http
            // CORS 설정 추가
            .cors { cors -> cors.configurationSource(corsConfigurationSource()) }

            .authorizeHttpRequests { auth ->
                auth
                    // 웹 아이콘 접근 허용
                    .requestMatchers("/favicon.ico").permitAll()
                    // H2 콘솔 접근 허용
                    .requestMatchers("/h2-console/**").permitAll()
                    // 접근 허용 목록들 허용 선언
                    .requestMatchers(*PERMIT_ALL_PATHS).permitAll()
                    // 업로드된 파일 접근 허용
                    .requestMatchers("/uploads/**").permitAll()
                    // 위 요청 제외 나머지는 로그인 요구
                    .requestMatchers("/api/*/**").authenticated()
                    .anyRequest().authenticated()
            }
            .headers { headers ->
                headers.frameOptions { frameOptions ->
                    frameOptions.sameOrigin()
                }
            }
            // csrf 설정 끔 (rest api에서는 csrf를 사용하지 않음)
            .csrf { csrf -> csrf.disable() }
            .oauth2Login { oauth2 -> }

            // Spring Security에서 인증/인가 실패 시 커스텀 JSON 응답 로직
            .addFilterBefore(customAuthenticationFilter, UsernamePasswordAuthenticationFilter::class.java)
            .exceptionHandling { exceptionHandling ->
                exceptionHandling
                    .authenticationEntryPoint { _, response, _ ->
                        response.contentType = "application/json;charset=UTF-8"
                        // CORS 헤더 추가
                        response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000")
                        response.setHeader("Access-Control-Allow-Credentials", "true")

                        response.status = HttpServletResponse.SC_UNAUTHORIZED
                        response.writer.write("""
                            {
                                 "resultCode": "401-1",
                                 "msg": "로그인 후 이용해주세요."
                            }
                        """.trimIndent())
                    }
                    .accessDeniedHandler { _, response, _ ->
                        // 인가 실패 (403)
                        response.contentType = "application/json;charset=UTF-8"
                        response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000")
                        response.setHeader("Access-Control-Allow-Credentials", "true")
                        response.status = HttpServletResponse.SC_FORBIDDEN
                        response.writer.write("""
                            {
                                 "resultCode": "403-1",
                                 "msg": "권한이 없습니다."
                            }
                        """.trimIndent())
                    }
            }
            .build()
    }
}