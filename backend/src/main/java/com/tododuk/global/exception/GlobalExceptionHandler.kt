package com.tododuk.global.exception

import com.tododuk.global.rsData.RsData
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {
    //결과 코드를 resultCode에 맞게 반환
    @ExceptionHandler(ServiceException::class)
    fun handleServiceException(ex: ServiceException): ResponseEntity<RsData<Void>> {
        val statusCode = extractHttpStatus(ex.resultCode)
        return ResponseEntity
            .status(statusCode)
            .body(ex.rsData)
    }

    // NPE 처리 추가
    @ExceptionHandler(NullPointerException::class)
    fun handleNullPointerException(ex: NullPointerException): ResponseEntity<RsData<Void>> {
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(RsData("500-1", "서버 내부 오류가 발생했습니다.", null))
    }

    // IllegalArgumentException 처리 추가
    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgumentException(ex: IllegalArgumentException): ResponseEntity<RsData<Void>> {
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(RsData("400-", "잘못된 요청입니다: " + ex.message, null))
    }

    // 기타 모든 예외 처리
    @ExceptionHandler(Exception::class)
    fun handleGenericException(ex: Exception?): ResponseEntity<RsData<Void>> {
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(RsData("500-2", "예상치 못한 오류가 발생했습니다.", null))
    }

    // resultCode에서 상태코드 추출 (예: "401-2" → 401)
    private fun extractHttpStatus(resultCode: String): Int {
        try {
            return resultCode.split("-".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()[0].toInt()
        } catch (e: Exception) {
            return HttpStatus.BAD_REQUEST.value()
        }
    }
}
