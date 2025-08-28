package com.tododuk.domain.label.repository

import com.tododuk.domain.label.entity.Label
import org.springframework.data.jpa.repository.JpaRepository

interface LabelRepository : JpaRepository<Label, Int> {

    fun findByName(name: String): Label?
}
