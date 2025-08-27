package com.tododuk.domain.todoLabel.entity;

import com.tododuk.domain.label.entity.Label;
import com.tododuk.domain.todo.entity.Todo;
import com.tododuk.global.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Builder
@AllArgsConstructor
public class TodoLabel extends BaseEntity {

    @ManyToOne
    private Todo todo;

    @ManyToOne
    private Label label;
}
