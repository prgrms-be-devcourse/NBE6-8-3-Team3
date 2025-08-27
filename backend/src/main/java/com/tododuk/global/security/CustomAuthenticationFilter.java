package com.tododuk.global.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tododuk.domain.user.entity.User;
import com.tododuk.domain.user.service.UserService;
import com.tododuk.global.exception.ServiceException;
import com.tododuk.global.rq.Rq;
import com.tododuk.global.rsData.RsData;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.java.Log;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import com.tododuk.global.rq.Rq;

@Component
@RequiredArgsConstructor
@Log
public class CustomAuthenticationFilter extends OncePerRequestFilter {
    private final Rq rq;
    private  final UserService userService;
    private final ObjectMapper objectMapper;

    //커스텀 인증 필터 (액션 메서드 실행 전 작동)
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        // 로그레벨 디버그인 경우에만 로그 남김
        logger.debug("CustomAuthenticationFilter: processing request for: " + request.getRequestURI());

        String path = request.getRequestURI();

        // PERMIT_ALL_PATHS 경로면 인증 로직 건너뛰기
        if (isPermitAllPath(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            work(request, response, filterChain);
        } catch (ServiceException e) {
            RsData<Void> rsData = e.getRsData();
            response.setContentType("application/json");
            response.setStatus(rsData.statusCode());

            response.getWriter().write(
                    objectMapper.writeValueAsString(rsData)
            );
        } catch (Exception e) {
            throw e;
        }

    }

    // 인증, 인가가 필요 없는 경로인지 확인
    private boolean isPermitAllPath(String path) {
        return Arrays.stream(SecurityConfig.PERMIT_ALL_PATHS)
                .anyMatch(pattern -> new AntPathMatcher().match(pattern, path));
    }

    private void work(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException{
        //api요청이 아니면 패스
        if (!request.getRequestURI().startsWith("/api/")){
            filterChain.doFilter(request, response);
            return;
        }

        // 인증,인가가 필요 없는 요청이면 패스
        if (isPermitAllPath(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        // 인증, 인가가 필요한 요청인 경우
        String apiKey;
        String accessToken;
        String headerAuthorization = rq.getHeader("Authorization", "");

        //Authentication 헤더에서 조회 시도
        if (headerAuthorization != null && !headerAuthorization.isBlank()) {
            if (!headerAuthorization.startsWith("Bearer "))
                throw new IllegalArgumentException("Authorization 헤더가 올바르지 않습니다.");
            // Bearer 토큰에서 apiKey, accessToken 추출 (Authorization = Bearer apiKey accessToken)
            String[] headerParts = headerAuthorization.split(" ",3);
            apiKey = headerParts[1];
            accessToken = headerParts.length == 3 ? headerParts[2] : "";
            //Authentication 헤더가 없는 경우 쿠키에서 조회
        } else {
            apiKey = rq.getCookieValue("apiKey", "");
            accessToken = rq.getCookieValue("accessToken", "");
        }

        logger.debug("apiKey : " + apiKey);
        logger.debug("accessToken : " + accessToken);

        // apiKey와 accessToken이 모두 비어있으면 그냥 통과 (인증, 인가가 필요 없는 요청)
        boolean isApiKeyExists = !apiKey.isBlank();
        boolean isAccessTokenExists = !accessToken.isBlank();

        if (!isApiKeyExists && !isAccessTokenExists) {
            filterChain.doFilter(request, response);
            return;
        }

        //조회 시도
        User user = null;
        boolean isAccessTokenValid = false;

        if (isAccessTokenExists) {
            Map<String, Object> payload = userService.payload(accessToken);

            if (payload != null) {
                Number userIdNum = (Number) payload.get("id");
                int id = userIdNum.intValue();
                String userEmail = (String) payload.get("email");
                user = new User(id, userEmail);

                isAccessTokenValid = true;
            }
        }

        if (user == null) {
            user = userService
                    .findByApiKey(apiKey)
                    .orElseThrow(() -> new ServiceException("404-2","존재하지 않는 Api키 입니다."));
        }

        if (isAccessTokenExists && !isAccessTokenValid) {

            String actorAccessToken = userService.genAccessToken(user);
            rq.setCookie("accessToken", actorAccessToken);
            rq.setHeader("Authorization", actorAccessToken);
        }
        // isAdmin 이면 관리자 권한 부여
        Collection<? extends GrantedAuthority> authorities = user.isAdmin() ?
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")) : List.of();

        // 스프링 시큐리티에 사용자 정보를 담아 인증 객체 생성
        UserDetails springUser = new SecurityUser(
                user.getId(),
                user.getUserEmail(),
                "blank",//이미 인증된 사용자므로 비밀번호는 빈 문자열로
                authorities
        );

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                springUser,
                springUser.getPassword(),
                springUser.getAuthorities()
        );

        // 이 시점 이후부터는 시큐리티가 이 요청을 인증된 사용자의 요청으로 인식합니다.
        SecurityContextHolder
                .getContext()
                .setAuthentication(authentication);

        // 다음 필터로 요청을 전달
        filterChain.doFilter(request, response);
    }

    private void sendErrorJson(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json; charset=UTF-8");
        String body = """
        {
            "resultCode": "%d",
            "msg": "%s"
        }
        """.formatted(status, message);
        response.getWriter().write(body);
    }

}
