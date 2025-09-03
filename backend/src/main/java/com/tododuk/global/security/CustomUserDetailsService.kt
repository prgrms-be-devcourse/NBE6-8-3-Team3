package com.tododuk.global.security

import com.tododuk.domain.user.service.UserService
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.core.userdetails.UsernameNotFoundException
import org.springframework.stereotype.Service

@Service
class CustomUserDetailsService(
    private val userService: UserService
) : UserDetailsService {

    override fun loadUserByUsername(useremail: String): UserDetails {
        val member = userService.findByUserEmail(useremail).get()
            ?: throw UsernameNotFoundException("사용자를 찾을 수 없습니다.")

        return SecurityUser(
            member.id,
            member.userEmail,
            member.password ?: "",
            member.authorities
        )
    }
}