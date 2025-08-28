package com.tododuk.domain.notification.entity;

import com.tododuk.domain.user.entity.User;
import com.tododuk.global.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Entity
@Getter
@NoArgsConstructor
public class Notification extends BaseEntity {
    @ManyToOne
    private User user;

    private String title;
    private String description;
    private String url;
    private boolean isRead;

    public void setIsRead(@NonNull boolean read) {
        this.isRead =true;
    }

    public Notification(User user, String title, String description, String url) {
        this.user = user;
        this.title = title;
        this.description = description;
        this.url = url;
        this.isRead = false; // 기본값은 읽지 않음

    }

}
