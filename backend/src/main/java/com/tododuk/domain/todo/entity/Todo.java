package com.tododuk.domain.todo.entity;

import com.tododuk.domain.todo.dto.TodoReqDto;
import com.tododuk.domain.todoList.entity.TodoList;
import com.tododuk.global.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Todo extends BaseEntity {
    private  String title;
    private String description;
    private boolean isCompleted;
    private int priority; // 1: Low, 2: Medium, 3: High

    private LocalDateTime startDate;
    private LocalDateTime dueDate;

    //initData test를 위해 일시적으로 주석처리
    @ManyToOne
    @JoinColumn(name = "Todo_List_Id")
    private TodoList todoList;

    //업데이트 날짜는 제외 (erd 수정 필요)

    public Todo(String title, String description, boolean completed) {

        this.title = title;
        this.description = description;
        this.isCompleted = completed;
        this.priority = 2; // 기본값은 Medium으로 설정
        this.startDate = LocalDateTime.now(); // 생성 시 현재 시간으로 설정
        this.dueDate = null; // 기본값은 null로 설정
    }

    public Todo(String title, String description, int priority, boolean isCompleted, int todoListId, LocalDateTime startDate, LocalDateTime dueDate){
        this.title = title;
        this.description = description;
        this.isCompleted = isCompleted;
        this.priority = priority;
        this.startDate = startDate;
        this.dueDate = dueDate;
    }

    public void update(TodoReqDto dto){
        this.title = dto.getTitle();
        this.description = dto.getDescription();
        this.priority = dto.getPriority();
        this.isCompleted = dto.isCompleted();
        this.dueDate = dto.getDueDate();
//        this.todoList = dto.toEntity().getTodoList();
    }

    public boolean isCompleted() {return isCompleted;}

}
