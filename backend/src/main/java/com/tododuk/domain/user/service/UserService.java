package com.tododuk.domain.user.service;

import com.tododuk.domain.user.dto.UserDto;
import com.tododuk.domain.user.entity.User;
import com.tododuk.domain.user.repository.UserRepository;
import com.tododuk.global.exception.ServiceException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    private final UserRepository userRepository;
    private final AuthTokenService authTokenService;
    private final PasswordEncoder passwordEncoder;

    public Optional<User> findById(int id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByUserEmail(String email) {
        return userRepository.findByUserEmail(email);
    }

    public User join(String email,String password, String nickname) {
        userRepository
                .findByUserEmail(email)
                .ifPresent(_user -> {
                    throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
                });

        password = passwordEncoder.encode(password);
        User user = new User(email, password, nickname);
        return userRepository.save(user);
    }

    public Optional<User> findByApiKey(String apiKey) {
        return userRepository.findByApiKey(apiKey);
    }

    public void updateUserInfo(User user, UserDto reqBody) {
        user.updateUserInfo(
                reqBody.nickname(),
                reqBody.profileImageUrl()
        );
    }

    public String genAccessToken(User user) {
        return authTokenService.genAccessToken(user);
    }

    public Map<String, Object> payload(String accessToken) {
        return  authTokenService.payload(accessToken);
    }

    public void checkPassword(User user,String password) {
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new ServiceException("400-1","비밀번호가 일치하지 않습니다.");
        }
    }
}
