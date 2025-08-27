package com.tododuk.domain.label.entity;

import com.tododuk.global.entity.BaseEntity;
import jakarta.persistence.Entity;
import lombok.*;


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
public class Label extends BaseEntity {

    private String name;
    private String color;

//    @ManyToOne
//    private TodoLabel todoLabel;

//    @ManyToOne
//    private User user;
}
