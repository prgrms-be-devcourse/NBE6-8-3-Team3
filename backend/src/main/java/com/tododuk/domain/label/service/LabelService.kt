package com.tododuk.domain.label.service

import com.tododuk.domain.label.entity.Label
import com.tododuk.domain.label.repository.LabelRepository
import lombok.RequiredArgsConstructor
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@RequiredArgsConstructor
@Service
class LabelService(private val labelRepository: LabelRepository) {

    @Transactional(readOnly = true)
    fun countLabels(): Long {
        return labelRepository.count()
    }

    @get:Transactional(readOnly = true)
    val labels: MutableList<Label?>
        get() = labelRepository.findAll()

    @Transactional
    fun createLabel(label: Label): Label {
        labelRepository.save<Label?>(label)
        return label
    }

    @Transactional
    fun createLabelIfNotExists(name: String, color: String): Label {
        return labelRepository.findByName(name)
            ?: createLabel(Label(name=name, color=color))
    }
}

