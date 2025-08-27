package com.tododuk.domain.user.dto;

import com.tododuk.domain.user.entity.User;

import java.time.LocalDateTime;

public record UserDto(
    int id,
    String nickname,
    String email,
    String profileImageUrl,
    LocalDateTime createDate,
    LocalDateTime modifyDate
){
    public UserDto(User user) {
        this(
            user.getId(),
            user.getNickName(),
            user.getUserEmail(),
            user.getProfileImgUrl(),
            user.getCreateDate(),
            user.getModifyDate()
        );
    }
}



