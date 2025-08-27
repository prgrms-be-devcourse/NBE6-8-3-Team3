package com.tododuk.domain.notification.dto;

import com.tododuk.domain.notification.entity.Notification;
import com.tododuk.domain.user.entity.User;
import lombok.NonNull;

public record NotificationDto(
        @NonNull int id,
        @NonNull User user,
        @NonNull String title,
        @NonNull String description,
        @NonNull String url,
        @NonNull boolean isRead
) {

    public NotificationDto(int id ,User user,String title, String description, String url, boolean isRead) {
        this.id = id;
        this.user = user;
        this.title = title;
        this.description = description;
        this.url = url;
        this.isRead = isRead;
    }

    public NotificationDto(Notification notification) {

        this(
                notification.getId(),
                notification.getUser(),
                notification.getTitle(),
                notification.getDescription(),
                notification.getUrl(),
                notification.isRead()
        );
    }

}
