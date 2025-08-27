package com.tododuk.domain.todoList.entity;

import com.tododuk.domain.team.entity.Team;
import com.tododuk.domain.todo.entity.Todo;
import com.tododuk.domain.user.entity.User;
import com.tododuk.global.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

import static jakarta.persistence.CascadeType.REMOVE;
import static jakarta.persistence.FetchType.LAZY;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class TodoList extends BaseEntity {

    private String name;
    private String description;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;

    @OneToMany(mappedBy = "todoList", fetch = LAZY, cascade = REMOVE)

    private List<Todo> todo =new ArrayList<>();

    public TodoList(String name, String description, User user, Team team){
        this.name = name;
        this.description = description;
        this.user = user;
        this.team = team;
    }
}
