package com.pharmadesk.backend.exception;

import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        System.err.println("Unhandled Exception: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.status(500).body(ApiResponse.error("Internal Server Error: " + e.getMessage()));
    }
}
