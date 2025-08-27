package com.tododuk.global.initData;

import com.tododuk.domain.label.service.LabelService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class LabelInitData {

    private final LabelService labelService;

    @PostConstruct
    @Transactional
    public void init() {
        labelService.createLabelIfNotExists("공부", "#FF4D4F");   // 빨강
        labelService.createLabelIfNotExists("운동", "#1890FF");   // 파랑
        labelService.createLabelIfNotExists("휴식", "#52C41A");   // 초록
        labelService.createLabelIfNotExists("독서", "#722ED1");   // 보라
        labelService.createLabelIfNotExists("영화", "#FA8C16");   // 주황
        labelService.createLabelIfNotExists("음악", "#2F54EB");   // 남색
        labelService.createLabelIfNotExists("일", "#8C8C8C");     // 회색
        labelService.createLabelIfNotExists("코딩", "#000000");   // 검정
        labelService.createLabelIfNotExists("여행", "#13C2C2");   // 청록
        labelService.createLabelIfNotExists("요리", "#FFBB96");   // 살구
        labelService.createLabelIfNotExists("사진", "#FADB14");   // 노랑
        labelService.createLabelIfNotExists("글쓰기", "#D3ADF7"); // 연보라
        labelService.createLabelIfNotExists("명상", "#69C0FF");   // 하늘
        labelService.createLabelIfNotExists("게임", "#FF6F61");   // 다홍
        labelService.createLabelIfNotExists("친구", "#7B1E3A");   // 와인
        labelService.createLabelIfNotExists("가족", "#A0D911");   // 연두
        labelService.createLabelIfNotExists("데이트", "#FF85C0"); // 핑크
        labelService.createLabelIfNotExists("쇼핑", "#FFF1B8");   // 크림
        labelService.createLabelIfNotExists("운전", "#36CFC9");   // 청록
        labelService.createLabelIfNotExists("봉사", "#A9A9A9");   // 카키
        labelService.createLabelIfNotExists("청소", "#B7EB8F");   // 민트
        labelService.createLabelIfNotExists("설거지", "#531DAB"); // 진보라
        labelService.createLabelIfNotExists("세탁", "#237804");   // 진초록
        labelService.createLabelIfNotExists("산책", "#808000");   // 올리브
        labelService.createLabelIfNotExists("재테크", "#A0522D"); // 갈색
        labelService.createLabelIfNotExists("취업준비", "#FA8C16"); // 주황 (중복)
        labelService.createLabelIfNotExists("자기계발", "#5941A9"); // 남보라
        labelService.createLabelIfNotExists("스터디", "#2F54EB");   // 남색 (중복)
        labelService.createLabelIfNotExists("모임", "#800020");     // 버건디
        labelService.createLabelIfNotExists("휴가계획", "#A0D911");  // 라임
    }
}