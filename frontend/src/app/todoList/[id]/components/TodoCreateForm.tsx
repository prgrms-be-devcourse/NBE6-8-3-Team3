'use client';

import React, { useState, useEffect } from 'react';

interface Label {
    id: number;
    name: string;
    color: string;
}

interface NewTodo {
    title: string;
    description: string;
    priority: number;
    startDate: string;
    dueDate: string;
    isNotificationEnabled?: boolean;
}

interface TodoCreateFormProps {
    newTodo: NewTodo;
    formErrors: {[key: string]: string};
    onFormChange: (field: string, value: string | number | boolean) => void;
    onSubmit: (selectedLabels: number[]) => void;
    onCancel: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

// Base64를 Uint8Array로 변환하는 유틸리티 함수
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

// DER 형식 공개키를 Raw 형식으로 변환하는 함수
const convertDerToRaw = (derKey: string): Uint8Array => {
    try {
        // DER 인코딩된 키를 디코딩
        const derBuffer = urlBase64ToUint8Array(derKey);

        // P-256 곡선의 경우, Raw 공개키는 마지막 65바이트입니다
        // DER 헤더를 제거하고 순수한 공개키만 추출
        if (derBuffer.length === 91) {
            // 표준 DER 형식: 26바이트 헤더 + 65바이트 공개키
            return derBuffer.slice(26, 91);
        } else if (derBuffer.length === 65) {
            // 이미 Raw 형식
            return derBuffer;
        } else {
            console.error('예상되지 않은 키 길이:', derBuffer.length);
            throw new Error(`Invalid key length: ${derBuffer.length}`);
        }
    } catch (error) {
        console.error('DER to Raw 변환 실패:', error);
        throw error;
    }
};

const TodoCreateForm: React.FC<TodoCreateFormProps> = ({
                                                           newTodo,
                                                           formErrors,
                                                           onFormChange,
                                                           onSubmit,
                                                           onCancel
                                                       }) => {
    const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
    const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
    const [showLabelModal, setShowLabelModal] = useState(false);
    const [labelsLoading, setLabelsLoading] = useState(false);
    const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
    const [subscriptionStatus, setSubscriptionStatus] = useState<'unknown' | 'subscribed' | 'not-subscribed' | 'error'>('unknown');

    // 라벨 목록 불러오기
    useEffect(() => {
        const fetchLabels = async () => {
            try {
                setLabelsLoading(true);
                const response = await fetch(`${API_BASE}/api/labels`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (response.ok) {
                    const result = await response.json();
                    const labels = result.data?.labels || [];
                    setAvailableLabels(labels);
                } else {
                    console.warn('라벨 목록 불러오기 실패:', response.status);
                }
            } catch (error) {
                console.error('라벨 목록 불러오기 실패:', error);
            } finally {
                setLabelsLoading(false);
            }
        };

        fetchLabels();
    }, []);

    // 초기 구독 상태 확인
    useEffect(() => {
        checkInitialSubscriptionStatus();
    }, []);

    // 초기 구독 상태 확인
    const checkInitialSubscriptionStatus = async () => {
        try {
            const isSubscribed = await checkSubscriptionStatus();
            if (isSubscribed) {
                setSubscriptionStatus('subscribed');
                // 이미 구독되어 있으면 알림 옵션을 기본적으로 켜둠
                onFormChange('isNotificationEnabled', true);
            } else {
                setSubscriptionStatus('not-subscribed');
            }
        } catch (error) {
            console.error('초기 구독 상태 확인 실패:', error);
            setSubscriptionStatus('error');
        }
    };

    // VAPID 공개키 가져오기 함수
    const getVapidPublicKey = async (): Promise<string | null> => {
        try {
            const response = await fetch(`${API_BASE}/api/v1/notifications/webpush/vapid-public-key`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                return result.data;
            } else {
                console.error('VAPID 공개키 가져오기 실패:', response.status);
                return null;
            }
        } catch (error) {
            console.error('VAPID 공개키 가져오기 실패:', error);
            return null;
        }
    };

    // 구독 상태 확인 함수
    const checkSubscriptionStatus = async (): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE}/api/v1/notifications/webpush`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                return result.data || false;
            } else {
                console.warn('구독 상태 확인 실패:', response.status);
                return false;
            }
        } catch (error) {
            console.error('구독 상태 확인 실패:', error);
            return false;
        }
    };

    // 웹 푸시 구독 함수 (Chrome localhost 최적화)
    const subscribeToWebPush = async (): Promise<boolean> => {
        try {
            // Chrome localhost 환경 감지
            const isLocalhost = window.location.hostname === 'localhost' ||
                window.location.hostname === '127.0.0.1';
            const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

            console.log('환경 정보:', { isLocalhost, isChrome, userAgent: navigator.userAgent });

            // 1. 브라우저 지원 확인
            if (!('serviceWorker' in navigator)) {
                alert('이 브라우저는 서비스 워커를 지원하지 않습니다.');
                return false;
            }

            if (!('PushManager' in window)) {
                alert('이 브라우저는 푸시 알림을 지원하지 않습니다.');
                return false;
            }

            // 2. 알림 권한 처리 (Chrome localhost용 최적화)
            let permission = Notification.permission;
            console.log('현재 알림 권한:', permission);

            if (permission === 'default') {
                if (isLocalhost && isChrome) {
                    console.log('Chrome localhost 환경에서 권한 요청');
                    // Chrome localhost에서는 더 적극적으로 권한 요청
                    try {
                        permission = await Notification.requestPermission();
                        console.log('권한 요청 결과:', permission);

                        // Chrome에서 권한 요청 후 잠시 대기
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (permError) {
                        console.error('권한 요청 실패:', permError);
                        permission = 'denied';
                    }
                } else {
                    const shouldRequest = confirm(
                        '할일 마감일 알림을 받으시겠습니까?\n\n' +
                        '• 마감일이 다가올 때 데스크톱 알림을 받을 수 있습니다.\n' +
                        '• 브라우저에서 알림 허용을 선택해주세요.'
                    );

                    if (!shouldRequest) return false;

                    permission = await Notification.requestPermission();
                }
            }

            if (permission !== 'granted') {
                if (isLocalhost) {
                    alert(
                        'Chrome에서 localhost 알림 권한이 필요합니다.\n\n' +
                        '해결 방법:\n' +
                        '1. 주소창 왼쪽 자물쇠/정보 아이콘 클릭\n' +
                        '2. "알림" 설정을 "허용"으로 변경\n' +
                        '3. 페이지 새로고침 후 다시 시도'
                    );
                } else {
                    alert('알림 권한이 필요합니다. 브라우저에서 알림을 허용해주세요.');
                }
                return false;
            }

            // 3. 테스트 알림으로 권한 확인 (Chrome localhost용)
            if (isLocalhost && isChrome && permission === 'granted') {
                try {
                    console.log('테스트 알림 표시');
                    const testNotif = new Notification('권한 테스트', {
                        body: '알림 권한이 정상적으로 작동합니다.',
                        icon: '/favicon.ico',
                        silent: true,
                        requireInteraction: false
                    });

                    // 1초 후 자동 닫기
                    setTimeout(() => testNotif.close(), 1000);
                    console.log('테스트 알림 성공');
                } catch (testError) {
                    console.warn('테스트 알림 실패 (계속 진행):', testError);
                }
            }

            // 4. VAPID 키 가져오기
            console.log('VAPID 키 요청 중...');
            const vapidPublicKey = await getVapidPublicKey();
            if (!vapidPublicKey) {
                alert('서버 연결 오류입니다. 서버가 실행 중인지 확인해주세요.');
                return false;
            }
            console.log('VAPID 키 받음:', vapidPublicKey.substring(0, 20) + '...');

            // 5. 서비스 워커 등록 (Chrome localhost 최적화)
            let registration;
            try {
                console.log('서비스 워커 등록 시도...');

                // Chrome localhost에서 서비스 워커 강제 업데이트
                if (isLocalhost && isChrome) {
                    // 기존 등록 삭제
                    const existingRegistrations = await navigator.serviceWorker.getRegistrations();
                    for (let reg of existingRegistrations) {
                        console.log('기존 서비스 워커 해제:', reg.scope);
                        await reg.unregister();
                    }

                    // 새로 등록
                    registration = await navigator.serviceWorker.register('/sw.js', {
                        scope: '/',
                        updateViaCache: 'none' // 캐시 비활성화
                    });
                } else {
                    registration = await navigator.serviceWorker.register('/sw.js');
                }

                console.log('서비스 워커 등록 성공:', registration.scope);

                // 서비스 워커 준비 대기
                if (registration.installing) {
                    console.log('서비스 워커 설치 중...');
                    await new Promise((resolve) => {
                        registration.installing.addEventListener('statechange', (e) => {
                            if (e.target.state === 'installed') {
                                resolve();
                            }
                        });
                    });
                }

                await navigator.serviceWorker.ready;
                console.log('서비스 워커 준비 완료');

                // Chrome localhost에서 추가 안정화 대기
                if (isLocalhost && isChrome) {
                    console.log('Chrome localhost 안정화 대기...');
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }

            } catch (swError) {
                console.error('서비스 워커 등록 실패:', swError);

                if (isLocalhost) {
                    alert(
                        'localhost에서 서비스 워커 등록 실패\n\n' +
                        '해결 방법:\n' +
                        '1. public/sw.js 파일 생성 확인\n' +
                        '2. F12 → Application → Service Workers에서 기존 워커 삭제\n' +
                        '3. 하드 새로고침 (Ctrl+Shift+R)\n' +
                        '4. 다시 시도'
                    );
                } else {
                    alert('서비스 워커 등록 실패. 페이지를 새로고침하고 다시 시도해주세요.');
                }
                return false;
            }

            // 6. 푸시 매니저 확인
            if (!registration.pushManager) {
                alert('푸시 매니저를 사용할 수 없습니다.');
                return false;
            }

            // 7. 기존 구독 확인 및 정리
            let subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                console.log('기존 구독 발견, 해제 후 새로 생성');
                try {
                    await subscription.unsubscribe();
                    subscription = null;
                } catch (unsubError) {
                    console.warn('기존 구독 해제 실패:', unsubError);
                }
            }

            // 8. 새 구독 생성 (Chrome localhost 최적화)
            if (!subscription) {
                try {
                    console.log('새 푸시 구독 생성 중...');

                    let applicationServerKey;

                    if (isLocalhost && isChrome) {
                        // Chrome localhost에서는 더 단순한 접근
                        console.log('Chrome localhost: 직접 Base64 변환 사용');
                        applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
                    } else {
                        // 프로덕션에서는 DER to Raw 변환
                        console.log('프로덕션: DER to Raw 변환 사용');
                        applicationServerKey = convertDerToRaw(vapidPublicKey);
                    }

                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: applicationServerKey
                    });

                    console.log('푸시 구독 생성 성공!');
                    console.log('구독 엔드포인트:', subscription.endpoint.substring(0, 50) + '...');

                } catch (subscribeError) {
                    console.error('구독 생성 실패:', subscribeError);

                    // Chrome localhost에서 다양한 방법 시도
                    if (isLocalhost && isChrome) {
                        console.log('Chrome localhost 대안 방법들 시도...');

                        const methods = [
                            // 방법 1: 원본 키 그대로 사용
                            () => urlBase64ToUint8Array(vapidPublicKey),
                            // 방법 2: DER 변환
                            () => convertDerToRaw(vapidPublicKey),
                            // 방법 3: 키 없이 구독 (일부 환경에서 가능)
                            () => null
                        ];

                        for (let i = 0; i < methods.length; i++) {
                            try {
                                console.log(`대안 방법 ${i + 1} 시도...`);
                                const key = methods[i]();
                                const subscribeOptions = { userVisibleOnly: true };
                                if (key) subscribeOptions.applicationServerKey = key;

                                subscription = await registration.pushManager.subscribe(subscribeOptions);
                                console.log(`대안 방법 ${i + 1} 성공!`);
                                break;
                            } catch (altError) {
                                console.error(`대안 방법 ${i + 1} 실패:`, altError);
                                if (i === methods.length - 1) {
                                    throw subscribeError;
                                }
                            }
                        }
                    } else {
                        throw subscribeError;
                    }

                    if (!subscription) {
                        if (subscribeError.name === 'InvalidAccessError') {
                            alert('VAPID 키 형식 오류입니다. 서버 설정을 확인해주세요.');
                        } else if (subscribeError.name === 'NotAllowedError') {
                            alert('알림 권한이 거부되었습니다.');
                        } else {
                            alert(`구독 생성 실패: ${subscribeError.message}`);
                        }
                        return false;
                    }
                }
            }

            // 9. 서버로 구독 정보 전송
            console.log('서버로 구독 정보 전송 중...');

            const subscriptionData = {
                endPointBrowser: subscription.endpoint,
                p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
                auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
            };

            console.log('전송할 구독 데이터:', {
                endpoint: subscription.endpoint.substring(0, 50) + '...',
                p256dh: subscriptionData.p256dh.substring(0, 20) + '...',
                auth: subscriptionData.auth.substring(0, 20) + '...'
            });

            const response = await fetch(`${API_BASE}/api/v1/notifications/webpush`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscriptionData)
            });

            if (response.ok) {
                console.log('서버에 구독 정보 저장 완료!');

                // 성공 알림 (Chrome localhost에서도 표시)
                try {
                    const successNotif = new Notification('알림 설정 완료!', {
                        body: isLocalhost ?
                            '할일 알림을 받을 준비가 완료되었습니다. (로컬 테스트)' :
                            '할일 알림을 받을 준비가 완료되었습니다.',
                        icon: '/favicon.ico',
                        requireInteraction: false,
                        silent: false
                    });

                    setTimeout(() => successNotif.close(), 4000);

                    console.log('성공 알림 표시 완료');
                } catch (notifError) {
                    console.warn('성공 알림 표시 실패:', notifError);
                }

                return true;

            } else {
                console.error('서버 저장 실패:', response.status);
                const errorText = await response.text();
                console.error('오류 응답:', errorText);

                alert('서버에 구독 정보 저장 실패. 서버 로그를 확인해주세요.');
                return false;
            }

        } catch (error) {
            console.error('전체 프로세스 오류:', error);

            if (error instanceof Error) {
                if (error.name === 'NotAllowedError') {
                    alert('알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
                } else if (error.name === 'NotSupportedError') {
                    alert('이 브라우저에서는 푸시 알림을 지원하지 않습니다.');
                } else {
                    alert(`알림 설정 오류: ${error.message}`);
                }
            } else {
                alert('알 수 없는 오류가 발생했습니다.');
            }

            return false;
        }
    };

    // 알림 체크박스 변경 핸들러
    const handleNotificationToggle = async (checked: boolean) => {
        if (checked) {
            setIsCheckingSubscription(true);

            try {
                // 1. 먼저 구독 상태 확인
                const isSubscribed = await checkSubscriptionStatus();

                if (isSubscribed) {
                    // 이미 구독되어 있으면 바로 활성화
                    setSubscriptionStatus('subscribed');
                    onFormChange('isNotificationEnabled', true);
                } else {
                    // 구독되어 있지 않으면 새로 구독
                    setSubscriptionStatus('not-subscribed');

                    const subscribeSuccess = await subscribeToWebPush();

                    if (subscribeSuccess) {
                        setSubscriptionStatus('subscribed');
                        onFormChange('isNotificationEnabled', true);
                    } else {
                        setSubscriptionStatus('error');
                        onFormChange('isNotificationEnabled', false);
                    }
                }
            } catch (error) {
                console.error('알림 설정 중 오류:', error);
                setSubscriptionStatus('error');
                onFormChange('isNotificationEnabled', false);
            } finally {
                setIsCheckingSubscription(false);
            }
        } else {
            // 체크 해제 시
            onFormChange('isNotificationEnabled', false);
        }
    };

    const handleLabelToggle = (labelId: number) => {
        setSelectedLabels(prev =>
            prev.includes(labelId)
                ? prev.filter(id => id !== labelId)
                : [...prev, labelId]
        );
    };

    const handleLabelModalSave = () => {
        setShowLabelModal(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(selectedLabels);
    };

    // 알림 상태에 따른 UI 메시지와 스타일
    const getNotificationStatusMessage = () => {
        if (isCheckingSubscription) {
            return {
                message: '설정 중...',
                color: 'var(--text-light)',
                icon: '⏳'
            };
        }

        switch (subscriptionStatus) {
            case 'subscribed':
                return {
                    message: '푸시 알림이 활성화되었습니다.',
                    color: '#059669',
                    icon: '✅'
                };
            case 'error':
                return {
                    message: '푸시 알림 설정에 실패했습니다. 다시 시도해주세요.',
                    color: '#dc2626',
                    icon: '❌'
                };
            case 'not-subscribed':
                return newTodo.isNotificationEnabled ? {
                    message: '푸시 알림 설정 중입니다...',
                    color: '#f59e0b',
                    icon: '⚠️'
                } : {
                    message: '체크하면 마감일 알림을 받을 수 있습니다.',
                    color: 'var(--text-light)',
                    icon: '💡'
                };
            default:
                return {
                    message: '알림 상태를 확인하는 중입니다...',
                    color: 'var(--text-light)',
                    icon: '🔍'
                };
        }
    };

    const statusInfo = getNotificationStatusMessage();

    return (
        <div style={{
            background: 'var(--bg-white)',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 12px var(--shadow-md)',
            border: '1px solid var(--border-light)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <div style={{
                paddingBottom: '1.5rem',
                marginBottom: '2rem',
                borderBottom: '2px solid var(--border-light)'
            }}>
                <h2 style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    ✨ 새 할일 추가
                </h2>
            </div>

            <form onSubmit={handleSubmit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                flex: 1,
                overflowY: 'auto'
            }}>
                {/* 제목 */}
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.75rem'
                    }}>
                        📝 제목 <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                        type="text"
                        value={newTodo.title}
                        onChange={(e) => onFormChange('title', e.target.value)}
                        placeholder="할 일의 제목을 입력하세요"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            border: formErrors.title ? '2px solid #dc2626' : '1px solid var(--border-light)',
                            borderRadius: '10px',
                            fontSize: '1.1rem',
                            boxSizing: 'border-box'
                        }}
                    />
                    {formErrors.title && (
                        <p style={{ color: '#dc2626', fontSize: '1rem', marginTop: '0.5rem' }}>
                            {formErrors.title}
                        </p>
                    )}
                </div>

                {/* 설명 */}
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.75rem'
                    }}>
                        📄 설명
                    </label>
                    <textarea
                        value={newTodo.description}
                        onChange={(e) => onFormChange('description', e.target.value)}
                        placeholder="할 일에 대한 자세한 설명을 입력하세요 (선택사항)"
                        rows={5}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            border: '1px solid var(--border-light)',
                            borderRadius: '10px',
                            fontSize: '1.1rem',
                            boxSizing: 'border-box',
                            resize: 'vertical',
                            minHeight: '120px'
                        }}
                    />
                </div>

                {/* 우선순위 */}
                <div>
                    <label style={{
                        display: 'block',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.75rem'
                    }}>
                        🎯 우선순위
                    </label>
                    <select
                        value={newTodo.priority}
                        onChange={(e) => onFormChange('priority', parseInt(e.target.value))}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            border: '1px solid var(--border-light)',
                            borderRadius: '10px',
                            fontSize: '1.1rem',
                            boxSizing: 'border-box',
                            background: 'white'
                        }}
                    >
                        <option value={3}>높음</option>
                        <option value={2}>중간</option>
                        <option value={1}>낮음</option>
                    </select>
                </div>

                {/* 개선된 알림 설정 */}
                <div>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        cursor: isCheckingSubscription ? 'not-allowed' : 'pointer',
                        padding: '1rem',
                        background: newTodo.isNotificationEnabled ? '#f0f9ff' : 'var(--bg-main)',
                        border: newTodo.isNotificationEnabled ? '2px solid var(--primary-color)' : '1px solid var(--border-light)',
                        borderRadius: '10px',
                        transition: 'all 0.2s ease',
                        opacity: isCheckingSubscription ? 0.7 : 1
                    }}
                           onMouseEnter={(e) => {
                               if (!isCheckingSubscription) {
                                   e.currentTarget.style.background = newTodo.isNotificationEnabled ? '#e0f2fe' : '#f0f9ff';
                                   e.currentTarget.style.borderColor = 'var(--primary-color)';
                               }
                           }}
                           onMouseLeave={(e) => {
                               if (!isCheckingSubscription) {
                                   e.currentTarget.style.background = newTodo.isNotificationEnabled ? '#f0f9ff' : 'var(--bg-main)';
                                   e.currentTarget.style.borderColor = newTodo.isNotificationEnabled ? 'var(--primary-color)' : 'var(--border-light)';
                               }
                           }}
                    >
                        <input
                            type="checkbox"
                            checked={newTodo.isNotificationEnabled || false}
                            onChange={(e) => handleNotificationToggle(e.target.checked)}
                            disabled={isCheckingSubscription}
                            style={{
                                width: '20px',
                                height: '20px',
                                accentColor: 'var(--primary-color)',
                                cursor: isCheckingSubscription ? 'not-allowed' : 'pointer'
                            }}
                        />
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                            <span>{isCheckingSubscription ? '⏳' : '🔔'}</span>
                            <span>알림 받기</span>
                            {isCheckingSubscription && (
                                <span style={{
                                    fontSize: '0.9rem',
                                    color: 'var(--text-light)',
                                    fontWeight: '400'
                                }}>
                                    (설정 중...)
                                </span>
                            )}
                        </span>
                    </label>

                    {/* 상태 메시지 */}
                    <div style={{
                        fontSize: '0.9rem',
                        marginTop: '0.5rem',
                        paddingLeft: '1rem'
                    }}>
                        <p style={{
                            margin: '0 0 0.5rem 0',
                            color: 'var(--text-light)'
                        }}>
                            마감일이 다가오거나 중요한 업데이트가 있을 때 알림을 받습니다.
                        </p>
                        <p style={{
                            margin: 0,
                            color: statusInfo.color,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontWeight: '500'
                        }}>
                            <span>{statusInfo.icon}</span>
                            <span>{statusInfo.message}</span>
                        </p>
                    </div>
                </div>

                {/* 시작일 & 마감일 */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '2rem'
                }}>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            marginBottom: '0.75rem'
                        }}>
                            🚀 시작일 <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={newTodo.startDate}
                            onChange={(e) => onFormChange('startDate', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                border: formErrors.startDate ? '2px solid #dc2626' : '1px solid var(--border-light)',
                                borderRadius: '10px',
                                fontSize: '1.1rem',
                                boxSizing: 'border-box'
                            }}
                        />
                        {formErrors.startDate && (
                            <p style={{ color: '#dc2626', fontSize: '1rem', marginTop: '0.5rem' }}>
                                {formErrors.startDate}
                            </p>
                        )}
                    </div>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: 'var(--text-secondary)',
                            marginBottom: '0.75rem'
                        }}>
                            📅 마감일 <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={newTodo.dueDate}
                            onChange={(e) => onFormChange('dueDate', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                border: formErrors.dueDate ? '2px solid #dc2626' : '1px solid var(--border-light)',
                                borderRadius: '10px',
                                fontSize: '1.1rem',
                                boxSizing: 'border-box'
                            }}
                        />
                        {formErrors.dueDate && (
                            <p style={{ color: '#dc2626', fontSize: '1rem', marginTop: '0.5rem' }}>
                                {formErrors.dueDate}
                            </p>
                        )}
                    </div>
                </div>

                {/* 라벨 선택 */}
                <div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem'
                    }}>
                        <label style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            color: 'var(--text-secondary)'
                        }}>
                            🏷️ 라벨 ({selectedLabels.length}개 선택됨)
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowLabelModal(true)}
                            style={{
                                padding: '0.5rem 1rem',
                                background: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            라벨 선택
                        </button>
                    </div>
                    {selectedLabels.length > 0 && (
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            padding: '1rem',
                            background: 'var(--bg-main)',
                            borderRadius: '10px',
                            border: '1px solid var(--border-light)'
                        }}>
                            {selectedLabels.map(labelId => {
                                const label = availableLabels.find(l => l.id === labelId);
                                return label ? (
                                    <span
                                        key={labelId}
                                        style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '15px',
                                            fontSize: '0.85rem',
                                            fontWeight: '500',
                                            background: label.color || '#e2e8f0',
                                            color: label.color ?
                                                (parseInt(label.color.slice(1), 16) > 0x888888 ? '#000' : '#fff')
                                                : '#334155'
                                        }}
                                    >
                                        {label.name}
                                    </span>
                                ) : null;
                            })}
                        </div>
                    )}
                </div>

                {/* 버튼들 */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: 'auto',
                    paddingTop: '2rem'
                }}>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '1rem',
                            background: 'white',
                            color: 'var(--text-secondary)',
                            border: '2px solid var(--border-medium)',
                            borderRadius: '10px',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        취소
                    </button>
                    <button
                        type="submit"
                        style={{
                            flex: 1,
                            padding: '1rem',
                            background: 'var(--primary-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        ✨ 추가하기
                    </button>
                </div>
            </form>

            {/* 라벨 선택 모달 */}
            {showLabelModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '70vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        {/* 모달 헤더 */}
                        <div style={{
                            padding: '1.5rem',
                            borderBottom: '1px solid var(--border-light)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>
                                🏷️ 라벨 선택
                            </h3>
                            <button
                                onClick={() => setShowLabelModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: 'var(--text-secondary)'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* 라벨 목록 */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '1.5rem'
                        }}>
                            <div style={{
                                display: 'grid',
                                gap: '0.75rem'
                            }}>
                                {availableLabels.map(label => (
                                    <label
                                        key={label.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '0.75rem',
                                            border: '1px solid var(--border-light)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            background: selectedLabels.includes(label.id) ? '#f0f9ff' : 'white'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedLabels.includes(label.id)}
                                            onChange={() => handleLabelToggle(label.id)}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                accentColor: 'var(--primary-color)'
                                            }}
                                        />
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '15px',
                                            fontSize: '0.85rem',
                                            fontWeight: '500',
                                            background: label.color || '#e2e8f0',
                                            color: label.color ?
                                                (parseInt(label.color.slice(1), 16) > 0x888888 ? '#000' : '#fff')
                                                : '#334155'
                                        }}>
                                            {label.name}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            {availableLabels.length === 0 && (
                                <div style={{
                                    textAlign: 'center',
                                    color: 'var(--text-secondary)',
                                    fontSize: '1rem',
                                    padding: '3rem 2rem'
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏷️</div>
                                    <p style={{ margin: 0 }}>사용 가능한 라벨이 없습니다.</p>
                                </div>
                            )}
                        </div>

                        {/* 모달 버튼 */}
                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            padding: '1.5rem',
                            borderTop: '1px solid var(--border-light)',
                            backgroundColor: '#f8fafc'
                        }}>
                            <button
                                onClick={() => setShowLabelModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    border: '1px solid var(--border-medium)',
                                    borderRadius: '8px',
                                    background: 'white',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleLabelModalSave}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                적용 ({selectedLabels.length}개 선택)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TodoCreateForm;