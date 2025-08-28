package com.tododuk.domain.user.repository

import com.tododuk.domain.user.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface UserRepository : JpaRepository<User, Int> {
    fun findByApiKey(apiKey: String): Optional<User>
    fun findByUserEmail(email: String): Optional<User>
}
