// public/sw.js
console.log('Service Worker 로딩됨');

self.addEventListener('install', (event) => {
    console.log('Service Worker 설치 중...');
    self.skipWaiting(); // 즉시 활성화
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker 활성화됨');
    event.waitUntil(
        self.clients.claim() // 모든 클라이언트 제어
    );
});

self.addEventListener('push', (event) => {
    console.log('Push 이벤트 수신:', event);

    let notificationData = {
        title: '할일 알림',
        body: '새로운 알림이 있습니다!',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [100, 50, 100],
        requireInteraction: false,
        silent: false
    };

    // 서버에서 보낸 데이터가 있다면 사용
    if (event.data) {
        try {
            const serverData = event.data.json();
            console.log('서버 데이터:', serverData);

            // 서버 데이터로 덮어쓰기
            if (serverData.title) notificationData.title = serverData.title;
            if (serverData.body) notificationData.body = serverData.body;
            if (serverData.icon) notificationData.icon = serverData.icon;
            if (serverData.data) notificationData.data = serverData.data;
        } catch (e) {
            console.error('Push 데이터 파싱 오류:', e);
        }
    }

    // 실제 알림 표시
    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            vibrate: notificationData.vibrate,
            requireInteraction: notificationData.requireInteraction,
            silent: notificationData.silent,
            data: notificationData.data
        })
    );
});
self.addEventListener('notificationclick', (event) => {
    console.log('알림 클릭됨:', event);

    event.notification.close();

    if (event.action === 'view') {
        // 할일 페이지로 이동
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // 단순히 닫기만 함
        console.log('알림 닫힘');
    } else {
        // 기본 클릭 - 앱으로 이동
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

self.addEventListener('notificationclose', (event) => {
    console.log('알림 닫힘:', event);
});

// Chrome localhost에서 서비스 워커 즉시 활성화
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});


console.log('Service Worker 등록 완료');