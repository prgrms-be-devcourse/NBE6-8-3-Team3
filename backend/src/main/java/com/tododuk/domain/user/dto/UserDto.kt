package com.tododuk.domain.user.dto

import com.tododuk.domain.user.entity.User
import java.time.LocalDateTime

@JvmRecord
data class UserDto(
    val id: Int,
    val nickname: String?,
    val email: String?,
    val profileImageUrl: String?,
    val createDate: LocalDateTime?,
    val modifyDate: LocalDateTime?
) {
    constructor(user: User) : this(
        user.getId(),
        user.getNickName(),
        user.getUserEmail(),
        user.getProfileImgUrl(),
        user.getCreateDate(),
        user.getModifyDate()
    )
}



