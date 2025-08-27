package com.tododuk.domain.user.repository;

import com.tododuk.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByApiKey(String apiKey);

    Optional<User> findByUserEmail(String email);
}
