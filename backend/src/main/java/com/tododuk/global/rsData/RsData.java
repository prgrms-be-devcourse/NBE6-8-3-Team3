package com.tododuk.global.rsData;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.lang.NonNull;

public record RsData<T>(
        @NonNull String resultCode,
        @JsonIgnore int statusCode,
        @NonNull String msg,
        @NonNull T data
) {
    public RsData(String resultCode, String msg) {
        this(resultCode, msg, null);
    }

    public RsData(String resultCode, String msg, T data) {
        this(resultCode, Integer.parseInt(resultCode.split("-", 2)[0]), msg, data);
    }

    public static <T> RsData<T> success(String msg) {
        return new RsData<>("200-OK", msg);
    }

    public static <T> RsData<T> success(String msg, T data) {
        return new RsData<>("200-OK", msg, data);
    }
}
