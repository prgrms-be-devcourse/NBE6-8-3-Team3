package com.tododuk.global.security

import lombok.Getter
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.userdetails.User

class SecurityUser(
    val id: Int,
    val email: String,
    password: String,
    authorities: Collection<out GrantedAuthority>
) : User(email, password, authorities)
