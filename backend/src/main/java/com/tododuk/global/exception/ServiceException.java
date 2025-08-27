package com.tododuk.global.exception;

import com.tododuk.global.rsData.RsData;
import lombok.Getter;

@Getter
public class ServiceException extends RuntimeException {
    private final String resultCode;
    private final String msg;

    public ServiceException(String resultCode, String msg) {
        super(resultCode + ": " + msg);
        this.resultCode = resultCode;
        this.msg = msg;
    }
    public RsData<Void> getRsData() {
        return new RsData<>(resultCode, msg, null);
    }
}
