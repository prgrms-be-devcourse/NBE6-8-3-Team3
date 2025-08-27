package com.tododuk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class TododukApplication {

    public static void main(String[] args) {
        SpringApplication.run(TododukApplication.class, args);
    }

}
