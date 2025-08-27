package com.tododuk.domain.team.entity;

import com.tododuk.domain.todo.entity.Todo;
import com.tododuk.domain.user.entity.User;
import com.tododuk.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "todo_assignment")
public class TodoAssignment extends BaseEntity {
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "todo_id")
    private Todo todo;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_user_id")
    private User assignedUser;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;
    
    // 담당자 지정일
    private LocalDateTime assignedAt;
    
    // 담당자 상태 (ACTIVE, INACTIVE)
    @Enumerated(EnumType.STRING)
    private AssignmentStatus status;
    
    public enum AssignmentStatus {
        ACTIVE, INACTIVE
    }
    
    @PrePersist
    protected void onCreate() {
        this.assignedAt = LocalDateTime.now();
        this.status = AssignmentStatus.ACTIVE;
    }
} 