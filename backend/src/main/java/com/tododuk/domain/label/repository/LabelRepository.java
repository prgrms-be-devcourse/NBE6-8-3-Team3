package com.tododuk.domain.label.repository;

import com.tododuk.domain.label.entity.Label;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabelRepository extends JpaRepository<Label, Integer> {
    boolean existsByName(String name);

    Label findByName(String name);
}
