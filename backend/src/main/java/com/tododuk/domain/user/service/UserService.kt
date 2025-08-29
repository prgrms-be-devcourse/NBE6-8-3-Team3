package com.tododuk.domain.user.service

import com.tododuk.domain.user.dto.UserDto
import com.tododuk.domain.user.dto.UserUpdateRequest
import com.tododuk.domain.user.entity.User
import com.tododuk.domain.user.repository.UserRepository
import com.tododuk.global.exception.ServiceException
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
@Transactional
class UserService(
    private val userRepository: UserRepository,
    private val authTokenService: AuthTokenService,
    private val passwordEncoder: PasswordEncoder
) {

    // Java 호환성을 위한 Optional 반환 메서드들 (기본으로 사용)
    fun findByUserEmail(email: String): Optional<User> {
        return userRepository.findByUserEmail(email)
    }

    fun findById(id: Int): Optional<User> {
        return userRepository.findById(id)
    }

    fun findByApiKey(apiKey: String): Optional<User> {
        return userRepository.findByApiKey(apiKey)
    }

    // Kotlin 스타일 nullable 반환 메서드들 (다른 이름 사용)
    fun findByUserEmailOrNull(email: String): User? {
        return userRepository.findByUserEmail(email).orElse(null)
    }

    fun findByIdOrNull(id: Int): User? {
        return userRepository.findById(id).orElse(null)
    }

    fun findByApiKeyOrNull(apiKey: String): User? {
        return userRepository.findByApiKey(apiKey).orElse(null)
    }

    fun join(email: String, password: String, nickname: String): User {
        // 중복 체크 - Optional 스타일 메서드 사용
        if (findByUserEmail(email).isPresent) {
            throw ServiceException("409-1", "이미 존재하는 이메일입니다.")
        }

        val encodedPassword = passwordEncoder.encode(password)
        val user = User(email, encodedPassword, nickname)
        return userRepository.save(user)
    }

    fun updateUserInfo(user: User, reqBody: UserUpdateRequest) {
        user.updateUserInfo(
            reqBody.nickname, // UserDto의 nickname 속성 사용
            reqBody.profileImageUrl // UserDto의 profileImageUrl 속성 사용
        )
        userRepository.save(user) // 저장 추가
    }

    fun genAccessToken(user: User): String {
        return authTokenService.genAccessToken(user)
    }

    fun payload(accessToken: String?): Map<String, Any>? {
        return authTokenService.payload(accessToken ?: "")
    }

    fun checkPassword(user: User, password: String?) {
        if (password == null || !passwordEncoder.matches(password, user.password)) {
            throw ServiceException("400-1", "비밀번호가 일치하지 않습니다.")
        }
    }
}