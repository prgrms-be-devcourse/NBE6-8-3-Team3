package com.tododuk.domain.label.entity

import com.tododuk.global.entity.BaseEntity
import jakarta.persistence.Entity

@Entity
class Label (
    var name: String="",
    var color: String="" ): BaseEntity(){
        constructor() : this("", "")
    }