package com.pharmadesk.backend.pharmacy.exception;

public class ExpiredStockException extends RuntimeException {
    public ExpiredStockException(String message) {
        super(message);
    }
}
