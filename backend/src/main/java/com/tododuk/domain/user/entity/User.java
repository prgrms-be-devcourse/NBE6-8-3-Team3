package com.tododuk.domain.user.entity;

import com.tododuk.domain.label.entity.Label;
import com.tododuk.domain.notification.entity.Notification;
import com.tododuk.domain.team.entity.TeamMember;
import com.tododuk.domain.todoList.entity.TodoList;
import com.tododuk.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Entity
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name="users")
public class User extends BaseEntity {

    private String userEmail;

    private String password;
    private String nickName;
    @Column(nullable = false)
    private boolean isAdmin = false;
    private String profileImgUrl;

    @Column(unique = true)
    private String apiKey;

    @OneToMany(mappedBy = "user")
    private List<TodoList> todoLists;

    @OneToMany(mappedBy = "user")
    private List<TeamMember> teamMember;

    @OneToMany
    private List<Label> labels;
    @OneToMany
    private List<Notification> notifications;

    public User(String email, String password, String nickName) {
        this.userEmail = email;
        this.password = password;
        this.nickName = nickName;
        this.apiKey = UUID.randomUUID().toString();
    }

    public User(int id, String userEmail) {
        this.id = id;
        this.userEmail = userEmail;
    }

    public void updateUserInfo(String nickName, String profileImgUrl) {
        this.nickName = nickName;
        this.profileImgUrl = profileImgUrl;
    }
}
