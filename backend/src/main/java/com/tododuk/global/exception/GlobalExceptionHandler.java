package com.tododuk.global.exception;

import com.tododuk.global.rsData.RsData;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    //결과 코드를 resultCode에 맞게 반환하게 해줌
    @ExceptionHandler(ServiceException.class)
    public ResponseEntity<RsData<Void>> handleServiceException(ServiceException ex) {
        int statusCode = extractHttpStatus(ex.getResultCode());
        return ResponseEntity
                .status(statusCode)
                .body(ex.getRsData());
    }
    // NPE 처리 추가
    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<RsData<Void>> handleNullPointerException(NullPointerException ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new RsData<>("500-1", "서버 내부 오류가 발생했습니다.", null));
    }

    // IllegalArgumentException 처리 추가
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<RsData<Void>> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new RsData<>("400-1", "잘못된 요청입니다: " + ex.getMessage(), null));
    }

    // 기타 모든 예외 처리
    @ExceptionHandler(Exception.class)
    public ResponseEntity<RsData<Void>> handleGenericException(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new RsData<>("500-2", "예상치 못한 오류가 발생했습니다.", null));
    }

    // resultCode에서 상태코드 추출 (예: "401-2" → 401)
    private int extractHttpStatus(String resultCode) {
        try {
            return Integer.parseInt(resultCode.split("-")[0]);
        } catch (Exception e) {
            return HttpStatus.BAD_REQUEST.value();
        }
    }
}
