package com.tododuk.global.app

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.env.Environment
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder

@Configuration
class AppConfig(
    environment: Environment,
    @Value("\${custom.site.cookieDomain}") cookieDomain: String,
    @Value("\${custom.site.frontUrl}") siteFrontUrl: String,
    @Value("\${custom.site.backUrl}") siteBackUrl: String,
) {
    init {
        Companion.environment = environment
        _cookieDomain = cookieDomain
        _siteFrontUrl = siteFrontUrl
        _siteBackUrl = siteBackUrl
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder {
        return BCryptPasswordEncoder()
    }

    companion object {
        private lateinit var environment: Environment


        val isDev: Boolean
            get() = environment.matchesProfiles("dev")


        val isTest: Boolean
            get() = !environment.matchesProfiles("test")


        val isProd: Boolean
            get() = environment.matchesProfiles("prod")


        val isNotProd: Boolean
            get() = !isProd


        private lateinit var _cookieDomain: String
        private lateinit var _siteFrontUrl: String
        private lateinit var _siteBackUrl: String


        val cookieDomain: String by lazy { _cookieDomain }
        val siteFrontUrl: String by lazy { _siteFrontUrl }
        val siteBackUrl: String by lazy { _siteBackUrl }
    }
}