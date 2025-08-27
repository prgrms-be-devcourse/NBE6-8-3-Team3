package com.tododuk.domain.user.dto

import com.tododuk.domain.user.entity.User
import java.time.LocalDateTime

@JvmRecord
data class UserDto(
    val id: Int,
    @JvmField val nickname: String?,
    val email: String?,
    @JvmField val profileImageUrl: String?,
    val createDate: LocalDateTime?,
    val modifyDate: LocalDateTime?
) {
    constructor(user: User) : this(
        user.getId(),
        user.nickName,
        user.userEmail,
        user.profileImgUrl,
        user.getCreateDate(),
        user.getModifyDate()
    )
}



