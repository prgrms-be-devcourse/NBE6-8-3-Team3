package com.tododuk.domain.todoLabel.repository;

import com.tododuk.domain.todoLabel.entity.TodoLabel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TodoLabelRepository extends JpaRepository<TodoLabel, Integer> {

    List<TodoLabel> findByTodoId(int todoId);

    Optional<TodoLabel> findByTodoIdAndLabelId(int todoId, int labelId);

    boolean existsByTodoIdAndLabelId(int todoId, int labelId);
}