package com.tododuk.domain.user.dto

import com.tododuk.domain.user.dto.UserDto
import com.tododuk.domain.user.entity.User

data class UserUpdateRequest(
    @JvmField val nickname: String,
    @JvmField val profileImageUrl: String
){
    constructor(user: User) : this(
        user.nickName,
        user.profileImgUrl
    )
}
