package com.tododuk.domain.user.service;

import com.tododuk.global.exception.ServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileUploadService {
    @Value("${file.upload.path:uploads/profiles/}")
    private String uploadPath;

    @Value("${file.upload.max-size:5242880}") // 5MB
    private long maxFileSize;

    public String uploadProfileImage(MultipartFile file, Long userId) {
        try {
            // 파일 검증
            validateFile(file);

            // 절대 경로로 업로드 디렉토리 생성
            Path uploadDir = Paths.get(System.getProperty("user.dir"), uploadPath);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
                log.info("업로드 디렉토리 생성: {}", uploadDir.toAbsolutePath());
            }

            // 파일명 생성 (중복 방지)
            String originalFilename = file.getOriginalFilename();
            String extension = getFileExtension(originalFilename);
            String filename = "profile_" + userId + "_" + System.currentTimeMillis() + extension;

            // 파일 저장
            Path filePath = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            log.info("파일 업로드 성공: {}", filePath.toAbsolutePath());

            // 웹에서 접근 가능한 URL 반환
            return "/uploads/profiles/" + filename;

        } catch (IOException e) {
            log.error("파일 업로드 실패", e);
            throw new ServiceException("500-1", "파일 업로드에 실패했습니다.");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ServiceException("400-1", "파일이 비어있습니다.");
        }

        if (file.getSize() > maxFileSize) {
            throw new ServiceException("400-2", "파일 크기가 너무 큽니다. (최대 5MB)");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ServiceException("400-3", "이미지 파일만 업로드 가능합니다.");
        }

        // 허용된 확장자 체크
        String filename = file.getOriginalFilename();
        if (filename == null || !isAllowedExtension(filename)) {
            throw new ServiceException("400-4", "지원하지 않는 파일 형식입니다. (jpg, jpeg, png, gif, webp만 허용)");
        }
    }

    private boolean isAllowedExtension(String filename) {
        String extension = getFileExtension(filename).toLowerCase();
        return extension.matches("\\.(jpg|jpeg|png|gif|webp)$");
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }

    // 기존 파일 삭제
    public void deleteProfileImage(String imageUrl) {
        try {
            if (imageUrl != null && imageUrl.startsWith("/uploads/profiles/")) {
                String filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
                Path filePath = Paths.get(System.getProperty("user.dir"), uploadPath, filename);
                boolean deleted = Files.deleteIfExists(filePath);
                if (deleted) {
                    log.info("기존 파일 삭제 성공: {}", filePath.toAbsolutePath());
                } else {
                    log.warn("삭제할 파일이 존재하지 않음: {}", filePath.toAbsolutePath());
                }
            }
        } catch (IOException e) {
            log.warn("기존 파일 삭제 실패: {}", imageUrl, e);
        }
    }
}