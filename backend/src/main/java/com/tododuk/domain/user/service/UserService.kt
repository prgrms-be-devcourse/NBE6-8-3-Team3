package com.tododuk.domain.user.service

import com.tododuk.domain.user.dto.UserDto
import com.tododuk.domain.user.entity.User
import com.tododuk.domain.user.repository.UserRepository
import com.tododuk.global.exception.ServiceException
import lombok.RequiredArgsConstructor
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*
import java.util.function.Consumer

@Service
@RequiredArgsConstructor
@Transactional
class UserService(
    private val userRepository: UserRepository,
    private val authTokenService: AuthTokenService,
    private val passwordEncoder: PasswordEncoder
) {

    fun findById(id: Int): User? {
        return userRepository.findById(id).orElse(null)
    }

    fun findByUserEmail(email: String): User? {
        return userRepository.findByUserEmail(email)
    }

    fun join(email: String, password: String, nickname: String): User {
        if (userRepository.findByUserEmail(email) != null) {
            throw ServiceException("409-1", "이미 존재하는 이메일입니다.")
        }

        val encodedPassword = passwordEncoder.encode(password)
        val user = User(email, encodedPassword, nickname)
        return userRepository.save(user)
    }

    fun findByApiKey(apiKey: String): User? {
        return userRepository.findByApiKey(apiKey)
    }

    fun updateUserInfo(user: User, reqBody: UserDto) {
        user.updateUserInfo(
            reqBody.nickname,
            reqBody.profileImageUrl
        )
    }

    fun genAccessToken(user: User): String? {
        return authTokenService.genAccessToken(user)
    }

    fun payload(accessToken: String?): MutableMap<String?, Any?>? {
        return authTokenService.payload(accessToken)
    }

    fun checkPassword(user: User, password: String?) {
        if (password == null || !passwordEncoder.matches(password, user.password)) {
            throw ServiceException("400-1", "비밀번호가 일치하지 않습니다.")
        }
    }
}
