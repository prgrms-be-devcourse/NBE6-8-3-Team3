package com.tododuk.domain.user.service

import com.tododuk.global.exception.ServiceException
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.io.IOException
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.Paths
import java.nio.file.StandardCopyOption
import kotlin.io.path.exists

@Service
class FileUploadService(
    @Value("\${file.upload.path:uploads/profiles/}")
    private val uploadPath: String,

    @Value("\${file.upload.max-size:5242880}") // 5MB
    private val maxFileSize: Long
) {

    fun uploadProfileImage(file: MultipartFile, userId: Long): String {
        try {
            // 파일 검증
            validateFile(file)

            // 절대 경로로 업로드 디렉토리 생성
            val uploadDir = Paths.get(System.getProperty("user.dir"), uploadPath)
            if (!uploadDir.exists()) {
                Files.createDirectories(uploadDir)
            }

            // 파일명 생성 (중복 방지)
            val originalFilename = file.originalFilename
            val extension = getFileExtension(originalFilename)
            val filename = "profile_${userId}_${System.currentTimeMillis()}$extension"

            // 파일 저장
            val filePath = uploadDir.resolve(filename)
            Files.copy(file.inputStream, filePath, StandardCopyOption.REPLACE_EXISTING)

            // 웹에서 접근 가능한 URL 반환
            return "/uploads/profiles/$filename"

        } catch (e: IOException) {
            throw ServiceException("500-1", "파일 업로드에 실패했습니다.")
        }
    }

    private fun validateFile(file: MultipartFile) {
        if (file.isEmpty) {
            throw ServiceException("400-1", "파일이 비어있습니다.")
        }

        if (file.size > maxFileSize) {
            throw ServiceException("400-2", "파일 크기가 너무 큽니다. (최대 5MB)")
        }

        val contentType = file.contentType
        if (contentType == null || !contentType.startsWith("image/")) {
            throw ServiceException("400-3", "이미지 파일만 업로드 가능합니다.")
        }

        // 허용된 확장자 체크
        val filename = file.originalFilename
        if (filename == null || !isAllowedExtension(filename)) {
            throw ServiceException("400-4", "지원하지 않는 파일 형식입니다. (jpg, jpeg, png, gif, webp만 허용)")
        }
    }

    private fun isAllowedExtension(filename: String): Boolean {
        val extension = getFileExtension(filename).lowercase()
        return extension.matches(Regex("\\.(jpg|jpeg|png|gif|webp)$"))
    }

    private fun getFileExtension(filename: String?): String {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return ""
        }
        return filename.substring(filename.lastIndexOf('.'))
    }

    // 기존 파일 삭제
    fun deleteProfileImage(imageUrl: String) {
        try {
            imageUrl.takeIf { it.startsWith("/uploads/profiles/") }?.let { url ->
                val filename = url.substring(url.lastIndexOf('/') + 1)
                val filePath = Paths.get(System.getProperty("user.dir"), uploadPath, filename)
                Files.deleteIfExists(filePath)
            }
        } catch (e: IOException) {
            ServiceException("500-2", "파일 삭제에 실패했습니다.")
        }
    }
}