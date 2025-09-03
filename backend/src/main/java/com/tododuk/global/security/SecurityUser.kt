package com.tododuk.global.security

import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.userdetails.User
import org.springframework.security.oauth2.core.user.OAuth2User

class SecurityUser(
    val id: Int,
    val email: String,
    password: String,
    authorities: Collection<out GrantedAuthority>
) : User(email, password, authorities), OAuth2User {
    override fun getAttributes(): Map<String, Any> = emptyMap()
    override fun getName(): String = email
}
