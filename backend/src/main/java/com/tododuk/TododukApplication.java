package com.tododuk;

import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.security.Security;

@SpringBootApplication
@EnableJpaAuditing
public class TododukApplication {

    public static void main(String[] args) {
        // Bouncy Castle 프로바이더 등록
        Security.addProvider(new BouncyCastleProvider());

        SpringApplication.run(TododukApplication.class, args);
    }
}