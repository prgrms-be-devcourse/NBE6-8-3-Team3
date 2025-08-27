package com.tododuk.domain.label.service;

import com.tododuk.domain.label.entity.Label;
import com.tododuk.domain.label.repository.LabelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@RequiredArgsConstructor
@Service
public class LabelService {

    private final LabelRepository labelRepository;

    @Transactional(readOnly = true)
    public long countLabels(){
        return labelRepository.count();
    }

    @Transactional(readOnly = true)
    public List<Label> getLabels(){
        return labelRepository.findAll();
    }

    @Transactional
    public Label createLabel(Label label) {
        labelRepository.save(label);
        return label;
    }

    @Transactional
    public Label createLabelIfNotExists(String name, String color) {
        Label label;
        if (!labelRepository.existsByName(name)) {
            label = createLabel(Label.builder()
                    .name(name)
                    .color(color)
                    .build());
        } else {
            label = labelRepository.findByName(name);
        }
        return label;
    }
}
