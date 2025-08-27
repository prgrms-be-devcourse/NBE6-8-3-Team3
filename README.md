# devcourse-NBE6-8-2-Team03 - TodoDuk
NBE6-8-2-Team03 사이보이즈

## 📋 프로젝트 개요

**TodoDuk**은 개인 및 팀 할일 관리를 위한 웹 애플리케이션입니다. Spring Boot를 기반으로 한 REST API 백엔드로 구성되어 있으며, 할일 관리, 팀 협업, 라벨링, 알림 등의 기능을 제공합니다.

### 🛠 주요 기술 스택
- **Backend**: Spring Boot 3.5.4, JPA/Hibernate, Spring Security
- **Database**: H2 (개발환경)
- **Authentication**: JWT + API Key
- **Scheduler**: Quartz
- **API Documentation**: Swagger/OpenAPI 3

---

### Backend (Spring Boot)
- **Framework**: Spring Boot 3.5.3
- **Language**: Java 21
- **Database**: H2 (개발), MySQL (운영 지원)
- **Cache**: Redis (토큰 저장소)
- **Security**: Spring Security + JWT
- **Documentation**: SpringDoc OpenAPI 3.x (Swagger)
- **Build Tool**: Gradle 8.14.3 (Kotlin DSL)

### Frontend (Next.js)
- **Framework**: Next.js 15.4.1
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **State Management**: Zustand
- **HTTP Client**: Axios
- **UI Components**: Radix UI, Lucide React
- **Dev Tools**: ESLint, Prettier

### DevOps & Tools
- **CI/CD**: GitHub Actions
- **API Generation**: swagger-typescript-api
- **Development**: Docker (Redis)

## 🏗️ 프로젝트 구조

### 시스템 아키텍처 다이어그램 
---
```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Browser/Frontend]
    end
    
    subgraph "API Gateway"
        CORS[CORS Handler]
        AUTH[Authentication Filter]
        CTRL[Spring Controllers]
    end
    
    subgraph "Business Logic Layer"
        US[User Service]
        TS[Team Service]
        TMS[TeamMember Service]
        TLS[TodoList Service]
        TOS[Todo Service]
        LS[Label Service]
        TLS2[TodoLabel Service]
        RS[Reminder Service]
        NS[Notification Service]
    end
    
    subgraph "Data Access Layer"
        UR[User Repository]
        TR[Team Repository]
        TMR[TeamMember Repository]
        TLR[TodoList Repository]
        TOR[Todo Repository]
        LR[Label Repository]
        TLSR[TodoLabel Repository]
        RR[Reminder Repository]
        NR[Notification Repository]
        TAR[TodoAssignment Repository]
    end
    
    subgraph "External Systems"
        QUARTZ[Quartz Scheduler]
        JWT[JWT Token Service]
        FILE[File Upload Service]
    end
    
    subgraph "Database"
        H2[(H2 Database)]
    end
    
    WEB --> CORS
    CORS --> AUTH
    AUTH --> CTRL
    
    CTRL --> US
    CTRL --> TS
    CTRL --> TMS
    CTRL --> TLS
    CTRL --> TOS
    CTRL --> LS
    CTRL --> TLS2
    CTRL --> RS
    CTRL --> NS
    
    US --> UR
    TS --> TR
    TMS --> TMR
    TLS --> TLR
    TOS --> TOR
    LS --> LR
    TLS2 --> TLSR
    RS --> RR
    NS --> NR
    TS --> TAR
    
    UR --> H2
    TR --> H2
    TMR --> H2
    TLR --> H2
    TOR --> H2
    LR --> H2
    TLSR --> H2
    RR --> H2
    NR --> H2
    TAR --> H2
    
    RS --> QUARTZ
    US --> JWT
    US --> FILE
```
---

### 📊 데이터베이스 ERD

```mermaid
erDiagram
    Users ||--o{ TodoLists : has
    Users ||--o{ TeamMembers : belongs_to
    Users ||--o{ Labels : owns
    Users ||--o{ Notifications : receives
    
    Teams ||--o{ TeamMembers : has
    Teams ||--o{ TodoLists : contains
    Teams ||--o{ TodoAssignments : manages
    
    TodoLists ||--o{ Todos : contains
    
    Todos ||--o{ TodoLabels : has
    Todos ||--o{ Reminders : scheduled
    Todos ||--o{ TodoAssignments : assigned_to
    
    Labels ||--o{ TodoLabels : applied_to
    
    Users {
        int id PK
        string userEmail UK
        string password
        string nickName
        boolean isAdmin
        string profileImgUrl
        string apiKey UK
        datetime createDate
        datetime modifyDate
    }
    
    Teams {
        int id PK
        string teamName
        string description
        datetime createDate
        datetime modifyDate
    }
    
    TeamMembers {
        int id PK
        int user_id FK
        int team_id FK
        enum role
        datetime joinedAt
        datetime createDate
        datetime modifyDate
    }
    
    TodoLists {
        int id PK
        string name
        string description
        int user_id FK
        int team_id FK
        datetime createDate
        datetime modifyDate
    }
    
    Todos {
        int id PK
        string title
        string description
        boolean isCompleted
        int priority
        datetime startDate
        datetime dueDate
        int todoList_id FK
        datetime createDate
        datetime modifyDate
    }
    
    Labels {
        int id PK
        string name
        string color
        datetime createDate
        datetime modifyDate
    }
    
    TodoLabels {
        int id PK
        int todo_id FK
        int label_id FK
        datetime createDate
        datetime modifyDate
    }
    
    Reminders {
        int id PK
        int todo_id FK
        datetime remindAt
        string method
        datetime createDate
        datetime modifyDate
    }
    
    Notifications {
        int id PK
        int user_id FK
        string title
        string description
        string url
        boolean isRead
        datetime createDate
        datetime modifyDate
    }
    
    TodoAssignments {
        int id PK
        int todo_id FK
        int assigned_user_id FK
        int team_id FK
        datetime assignedAt
        enum status
        datetime createDate
        datetime modifyDate
    }
```
---
### 🔄 시스템 플로우차트

#### 사용자 인증 플로우 
```mermaid
flowchart TD
    START([시작]) --> LOGIN{로그인 요청}
    LOGIN -->|회원가입| REGISTER[회원가입 처리]
    LOGIN -->|로그인| AUTH[인증 처리]
    
    REGISTER --> SAVE_USER[사용자 정보 저장]
    SAVE_USER --> GEN_API[API Key 생성]
    GEN_API --> SUCCESS_REG[회원가입 성공]
    
    AUTH --> CHECK_USER{사용자 존재 확인}
    CHECK_USER -->|없음| FAIL[로그인 실패]
    CHECK_USER -->|존재| CHECK_PWD{비밀번호 확인}
    
    CHECK_PWD -->|틀림| FAIL
    CHECK_PWD -->|맞음| GEN_TOKEN[Access Token 생성]
    GEN_TOKEN --> SET_COOKIE[쿠키 설정]
    SET_COOKIE --> SUCCESS_LOGIN[로그인 성공]
    
    SUCCESS_REG --> END([종료])
    SUCCESS_LOGIN --> END
    FAIL --> END
```

#### TODO 관리 플로우
```mermaid
flowchart TD
    START([Todo 관리 시작]) --> ACTION{액션 선택}
    
    ACTION -->|Todo 생성| CREATE_TODO[Todo 생성]
    ACTION -->|Todo 수정| UPDATE_TODO[Todo 수정]
    ACTION -->|Todo 삭제| DELETE_TODO[Todo 삭제]
    ACTION -->|완료 처리| TOGGLE_TODO[완료 상태 토글]
    ACTION -->|담당자 지정| ASSIGN_TODO[담당자 지정]
    
    CREATE_TODO --> GET_TODOLIST{TodoList 확인}
    GET_TODOLIST -->|없음| CREATE_TODOLIST[TodoList 생성]
    GET_TODOLIST -->|있음| SAVE_TODO[Todo 저장]
    CREATE_TODOLIST --> SAVE_TODO
    SAVE_TODO --> SUCCESS1[Todo 생성 성공]
    
    UPDATE_TODO --> FIND_TODO{Todo 존재 확인}
    FIND_TODO -->|없음| NOT_FOUND[Todo 없음]
    FIND_TODO -->|있음| CHECK_PERMISSION{수정 권한 확인}
    CHECK_PERMISSION -->|권한 없음| PERM_FAIL[권한 실패]
    CHECK_PERMISSION -->|권한 있음| UPDATE_DATA[Todo 데이터 업데이트]
    UPDATE_DATA --> SUCCESS2[Todo 수정 성공]
    
    DELETE_TODO --> FIND_TODO2{Todo 존재 확인}
    FIND_TODO2 -->|없음| NOT_FOUND
    FIND_TODO2 -->|있음| CHECK_DELETE_PERM{삭제 권한 확인}
    CHECK_DELETE_PERM -->|권한 없음| PERM_FAIL
    CHECK_DELETE_PERM -->|권한 있음| DELETE_LABELS[연관 라벨 삭제]
    DELETE_LABELS --> DELETE_ASSIGNMENTS[담당자 정보 삭제]
    DELETE_ASSIGNMENTS --> DELETE_TODO_DATA[Todo 데이터 삭제]
    DELETE_TODO_DATA --> SUCCESS3[Todo 삭제 성공]
    
    ASSIGN_TODO --> CHECK_TEAM_MEMBER{팀 멤버 확인}
    CHECK_TEAM_MEMBER -->|아님| TEAM_FAIL[팀 멤버 아님]
    CHECK_TEAM_MEMBER -->|맞음| CREATE_ASSIGNMENT[담당자 지정]
    CREATE_ASSIGNMENT --> SUCCESS4[담당자 지정 성공]
    
    SUCCESS1 --> END([종료])
    SUCCESS2 --> END
    SUCCESS3 --> END
    SUCCESS4 --> END
    NOT_FOUND --> END
    PERM_FAIL --> END
    TEAM_FAIL --> END
```

#### 팀팀 관리 플로우
```mermaid
flowchart TD
    START([팀 관리 시작]) --> AUTH_CHECK{인증 확인}
    AUTH_CHECK -->|실패| AUTH_FAIL[인증 실패]
    AUTH_CHECK -->|성공| ACTION{액션 선택}
    
    ACTION -->|팀 생성| CREATE_TEAM[팀 생성]
    ACTION -->|팀 수정| MODIFY_TEAM[팀 정보 수정]
    ACTION -->|멤버 관리| MEMBER_MGMT[멤버 관리]
    ACTION -->|팀 삭제| DELETE_TEAM[팀 삭제]
    
    CREATE_TEAM --> SAVE_TEAM[팀 정보 저장]
    SAVE_TEAM --> CREATE_LEADER[생성자를 리더로 추가]
    CREATE_LEADER --> SUCCESS1[팀 생성 성공]
    
    MODIFY_TEAM --> CHECK_LEADER{리더 권한 확인}
    CHECK_LEADER -->|권한 없음| PERM_FAIL[권한 실패]
    CHECK_LEADER -->|권한 있음| UPDATE_TEAM[팀 정보 업데이트]
    UPDATE_TEAM --> SUCCESS2[수정 성공]
    
    MEMBER_MGMT --> MEMBER_ACTION{멤버 액션}
    MEMBER_ACTION -->|멤버 추가| ADD_MEMBER[멤버 추가]
    MEMBER_ACTION -->|역할 변경| CHANGE_ROLE[역할 변경]
    MEMBER_ACTION -->|멤버 제거| REMOVE_MEMBER[멤버 제거]
    
    ADD_MEMBER --> CHECK_EMAIL{이메일 존재 확인}
    CHECK_EMAIL -->|없음| EMAIL_FAIL[사용자 없음]
    CHECK_EMAIL -->|있음| ADD_TO_TEAM[팀에 추가]
    ADD_TO_TEAM --> SUCCESS3[멤버 추가 성공]
    
    DELETE_TEAM --> CHECK_DELETE_AUTH{삭제 권한 확인}
    CHECK_DELETE_AUTH -->|권한 없음| PERM_FAIL
    CHECK_DELETE_AUTH -->|권한 있음| REMOVE_ASSIGNMENTS[담당자 정보 삭제]
    REMOVE_ASSIGNMENTS --> REMOVE_TODOLISTS[팀 할일목록 삭제]
    REMOVE_TODOLISTS --> REMOVE_TEAM_DATA[팀 데이터 삭제]
    REMOVE_TEAM_DATA --> SUCCESS4[팀 삭제 성공]
    
    SUCCESS1 --> END([종료])
    SUCCESS2 --> END
    SUCCESS3 --> END
    SUCCESS4 --> END
    AUTH_FAIL --> END
    PERM_FAIL --> END
    EMAIL_FAIL --> END
```

#### Use Case 다이어그램
```mermaid
graph LR
    subgraph "Actors"
        U[User]
        TL[Team Leader]
        TM[Team Member]
        SYS[System]
    end
    
    subgraph "Authentication & User Management"
        UC1[Register Account]
        UC2[Login/Logout]
        UC3[View Profile]
        UC4[Update Profile]
        UC5[Upload Profile Image]
    end
    
    subgraph "Todo Management"
        UC6[Create Todo]
        UC7[Update Todo]
        UC8[Delete Todo]
        UC9[Mark Complete]
        UC10[View Todos]
        UC11[Filter Todos]
    end
    
    subgraph "Todo List Management"
        UC12[Create Todo List]
        UC13[Update Todo List]
        UC14[Delete Todo List]
        UC15[View Todo Lists]
    end
    
    subgraph "Label Management"
        UC16[Create Label]
        UC17[Apply Labels to Todo]
        UC18[Remove Labels]
        UC19[View Labels]
    end
    
    subgraph "Team Management"
        UC20[Create Team]
        UC21[Update Team Info]
        UC22[Delete Team]
        UC23[View Team Details]
        UC24[Add Team Member]
        UC25[Remove Team Member]
        UC26[Change Member Role]
        UC27[View Team Stats]
    end
    
    subgraph "Team Todo Management"
        UC28[Create Team Todo]
        UC29[Assign Todo to Member]
        UC30[Unassign Todo]
        UC31[View Team Todos]
        UC32[Track Assignment History]
    end
    
    subgraph "Reminder & Notification"
        UC33[Create Reminder]
        UC34[Delete Reminder]
        UC35[View Reminders]
        UC36[Receive Notifications]
        UC37[Mark Notification Read]
        UC38[Schedule Reminder Job]
    end
    
    %% User relationships
    U --> UC1
    U --> UC2
    U --> UC3
    U --> UC4
    U --> UC5
    U --> UC6
    U --> UC7
    U --> UC8
    U --> UC9
    U --> UC10
    U --> UC11
    U --> UC12
    U --> UC13
    U --> UC14
    U --> UC15
    U --> UC16
    U --> UC17
    U --> UC18
    U --> UC19
    U --> UC33
    U --> UC34
    U --> UC35
    U --> UC36
    U --> UC37
    
    %% Team Leader relationships
    TL --> UC20
    TL --> UC21
    TL --> UC22
    TL --> UC24
    TL --> UC25
    TL --> UC26
    
    %% Team Member relationships
    TM --> UC23
    TM --> UC27
    TM --> UC28
    TM --> UC29
    TM --> UC30
    TM --> UC31
    TM --> UC32
    
    %% System relationships
    SYS --> UC38
```

#### 보안 아키텍쳐 
```mermaid
flowchart TD
    REQUEST[클라이언트 요청] --> CORS_CHECK[CORS 검증]
    CORS_CHECK --> AUTH_FILTER[인증 필터]
    
    AUTH_FILTER --> PERMIT_CHECK{인증 불필요 경로?}
    PERMIT_CHECK -->|Yes| CONTROLLER[컨트롤러 실행]
    PERMIT_CHECK -->|No| TOKEN_CHECK[토큰 확인]
    
    TOKEN_CHECK --> HEADER_CHECK{Authorization 헤더?}
    HEADER_CHECK -->|Yes| EXTRACT_HEADER[헤더에서 토큰 추출]
    HEADER_CHECK -->|No| COOKIE_CHECK[쿠키에서 토큰 추출]
    
    EXTRACT_HEADER --> VALIDATE_TOKEN{토큰 유효성 검증}
    COOKIE_CHECK --> VALIDATE_TOKEN
    
    VALIDATE_TOKEN -->|Valid AccessToken| SET_AUTH[Security Context 설정]
    VALIDATE_TOKEN -->|Invalid AccessToken| API_KEY_CHECK[API Key로 사용자 조회]
    VALIDATE_TOKEN -->|No Token| UNAUTHORIZED[인증 실패]
    
    API_KEY_CHECK -->|Found| GENERATE_NEW[새 AccessToken 생성]
    API_KEY_CHECK -->|Not Found| UNAUTHORIZED
    
    GENERATE_NEW --> SET_COOKIE[쿠키 설정]
    SET_COOKIE --> SET_AUTH
    
    SET_AUTH --> CONTROLLER
    UNAUTHORIZED --> ERROR_RESPONSE[401 에러 응답]
    
    CONTROLLER --> RESPONSE[응답 반환]
```
---
## 📊 주요 비즈니스 플로우

### 팀 생성 및 관리
1. **팀 생성**: 사용자가 팀을 생성하면 자동으로 리더 권한 부여
2. **멤버 초대**: 리더만 새로운 멤버 추가 가능 (이메일 기반)
3. **권한 관리**: 리더는 멤버 역할 변경 및 제거 가능
4. **팀 삭제**: 마지막 리더는 제거 불가, 팀 삭제 시 관련 데이터 연쇄 삭제

### 할일 할당 시스템
1. **개인 할일**: 사용자 개별 관리
2. **팀 할일**: 팀 멤버만 생성/수정 가능
3. **할일 할당**: 팀 멤버를 할일에 담당자로 지정
4. **할당 기록**: 모든 할당 변경사항 추적 및 이력 관리

### 알림 시스템
1. **리마인더 설정**: 할일에 대한 시간 기반 알림 설정
2. **스케줄링**: Quartz를 통한 백그라운드 작업 실행
3. **알림 생성**: 예정된 시간에 알림 자동 생성
4. **알림 관리**: 사용자별 알림 조회 및 읽음 처리
---
---

## 🚀 주요 기능

### ✨ 핵심 기능
- **사용자 인증**: JWT + API Key 기반 보안 시스템
- **개인 할일 관리**: CRUD, 우선순위, 마감일, 완료 상태 관리
- **팀 협업**: 팀 생성, 멤버 관리, 역할 기반 권한 제어
- **팀 할일 관리**: 팀원 간 할일 공유 및 담당자 지정
- **라벨링**: 색상 기반 라벨로 할일 분류
- **리마인더**: 시간 기반 알림 스케줄링
- **파일 업로드**: 프로필 이미지 관리

### 🔧 기술적 특징
- **RESTful API**: 표준 REST 아키텍처
- **트랜잭션 관리**: Spring의 선언적 트랜잭션
- **예외 처리**: 전역 예외 처리기로 일관된 오류 응답
- **데이터 검증**: Bean Validation을 통한 입력 데이터 검증
- **CORS 지원**: 프론트엔드와의 안전한 통신
- **API 문서화**: Swagger/OpenAPI 3 자동 문서 생성

---


### branch 규칙

태그 종류
- `feature`: 새로운 기능 추가 (feature)
- `fix`: 버그 수정
- `chore`: 코드 변경이 아닌 빌드, 설정, 문서 수정 등 잡일성 작업
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락 등 코드 스타일 관련 변경
- `refactor`: 리팩토링 (기능 변화 없이 코드 구조 개선)
- `test`: 테스트 추가/수정
- `perf`: 성능 개선
[기술 분야] / [작업 종류] / [이슈넘버]-[구현 기능]
Ex)   `be/feature/1-login`
여기서 이슈 넘버는 **git issue** 등록 시 나오는 숫자로 한다
<img width="995" height="421" alt="image (4)" src="https://github.com/user-attachments/assets/80ed17b7-7218-4241-8df9-35c00a3aa7bf" />
### commit 규칙
앞에 [BE], [FE] 로 구분해주기
```bash
//[**본인 영역**] **commit 종류** : commit 내용
**[FE] feature: 로그인 화면 추가**   //front 영역 feat(새 기능 추가)에서 로그인 기능 추가
**[BE] fix :f**                   //backend 영역 fix(버그 수정)에서 버그를 수정함
//터미널 명령어 예시
git commit -m “[FE] feat: 로그인 화면 추가”
```
### **협업규칙**
1. 작업 전, Issues에 자신의 작업을 등록해주세요. 백엔드 작업의 경우 -> [BE] 이슈이름
2. 작업은 main 브랜치가 아닌 작업용 브랜치를 따로 만들어서 진행해주세요.
3. 작업 진행중 커밋을 진행시, 아래의 Commit Message Convention을 참고하여 진행해주세요.
4. 작업에서 하나의 커밋 진행 후, `git pull origin main --rebase`를 통해 작업 브랜치의 최신화를 유지해주세요.
5. 작업이 끝나면 해당 작업을 브랜치에 push 후 main branch와 Squash merge 해주세요.
6. merge 후에는 브런치를 삭제해주시고, `git fetch --prune`을 통해 로컬에 남아있는 원격 레포지토리를 정리해주세요.
### PR 규칙
1. 기본적으로 구현할 때마다 새 branch 생성 후, 작성하기
2. `main` branch에는 해당 기능 구현 완료되었을 때만 pr을 통한 병합 요청
3. pr을 단순히 코드리뷰 용으로 사용할 경우 `draft pull request 사용`(reviewer가 확인해도 병합 안되니 마음 편히 사용가능)
### 어노테이션 규칙
저희 어노테이션 작성할 때 배치 순서에 대해서 간략하게 얘기하자면 일단 가장 기본적인 틀은 아래 규칙을 지켜주세요
어노테이션 배치 관례 (클래스 레벨)
1. Lombok 어노테이션: @Getter, @Setter, @NoArgsConstructor, @AllArgsConstructor, @Builder 등은 클래스 전체에 영향을 주므로 가장 먼저(맨 위) 작성
2. Spring/Framework 어노테이션: @Component, @Service, @Controller, @RestController 등이 있다면 Lombok 어노테이션 바로 아래에 배치
3. JPA Entity 어노테이션: @Entity, @Table 등은 Lombok, Spring/Framework 다음에 배치
4. 공통 설정 어노테이션: 주로 @RequestMapping처럼 특정 기능에 대한 공통 경로를 지정하는 어노테이션을 둡니다.
5. 문서화/메타데이터 어노테이션: Swagger/OpenAPI의 @Ta...
1. Lombok 어노테이션: @Getter, @Setter, @NoArgsConstructor, @AllArgsConstructor, @Builder 등은 클래스 전체에 영향을 주므로 가장 먼저(맨 위) 작성
2. Spring/Framework 어노테이션: @Component, @Service, @Controller, @RestController 등이 있다면 Lombok 어노테이션 바로 아래에 배치
3. JPA Entity 어노테이션: @Entity, @Table 등은 Lombok, Spring/Framework 다음에 배치
4. 공통 설정 어노테이션: 주로 @RequestMapping처럼 특정 기능에 대한 공통 경로를 지정하는 어노테이션을 둡니다.
5. 문서화/메타데이터 어노테이션: Swagger/OpenAPI의 @Ta...
