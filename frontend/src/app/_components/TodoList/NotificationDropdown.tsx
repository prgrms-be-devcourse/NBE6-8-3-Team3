"use client";
import React, { useState, useEffect } from 'react';

interface NotificationItem {
  id: number;
  userId: number;  // user 객체에서 userId로 변경
  title: string | null;
  description: string | null;
  url: string | null;
  isRead: boolean;
}

interface ApiResponse {
  resultCode: string;
  msg: string;
  data: NotificationItem[] | null;
}

type NotificationFilter = 'all' | 'unread';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationFilter, setNotificationFilter] = useState<NotificationFilter>('unread');
  const [isLoadingNotifications, setIsLoadingNotifications] = useState<boolean>(false);

  // 알림 데이터 가져오기 - 쿠키 인증 사용
  const fetchNotifications = async () => {
    setIsLoadingNotifications(true);

    try {
      const response = await fetch('http://localhost:8080/api/notifications/notime', {
        method: 'GET',
        credentials: 'include', // JWT 토큰 대신 쿠키 인증 사용
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // HTTP 상태 코드 대신 JSON 응답의 resultCode로 판단
      const result: ApiResponse = await response.json();

      if (result.resultCode === '200-1') {
        setNotifications(result.data || []);
      } else {
        console.error('API 오류:', result.msg, '(코드:', result.resultCode + ')');
        setNotifications([]);

        if (result.resultCode.startsWith('404')) {
          console.error('404 에러: API 엔드포인트를 찾을 수 없습니다.');
        }
      }

    } catch (error) {
      console.error('알림을 가져오는데 실패했습니다:', error);
      setNotifications([]);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // 컴포넌트 마운트 시 알림 데이터 가져오기
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // 필터된 알림 목록 계산
  const filteredNotifications = notifications.filter(notification => {
    if (notificationFilter === 'unread') {
      return !notification.isRead;
    }
    return true;
  });

  // 읽지 않은 알림 개수 계산
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // 알림 읽음 상태 변경 처리 - 쿠키 인증 사용
  const handleNotificationReadToggle = async (notification: NotificationItem) => {
    if (notification.isRead) {
      return;
    }

    try {
      const response = await fetch(
          `http://localhost:8080/api/notifications/setStatus/${notification.id}`,
          {
            method: 'PUT',
            credentials: 'include', // 쿠키 인증 사용
            headers: {
              'Content-Type': 'application/json'
            }
          }
      );

      const result = await response.json();

      // resultCode로 성공 여부 판단
      if (result.resultCode === '200-1') {
        setNotifications(prev =>
            prev.map(n =>
                n.id === notification.id
                    ? {...n, isRead: true}
                    : n
            )
        );
        console.log('알림 읽음 처리 완료:', notification.id);
      } else {
        console.error('읽음 처리 실패:', result.msg);
      }
    } catch (error) {
      console.error('읽음 처리 API 호출 오류:', error);
    }
  };

  // 페이지 이동 처리
  const handleNotificationNavigate = (notification: NotificationItem) => {
    if (notification.url) {
      window.open(notification.url, '_blank');
    } else {
      alert('이동할 URL이 없습니다.');
    }
  };

  // 더블클릭 처리
  const handleNotificationDoubleClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await handleNotificationReadToggle(notification);
    }
  };

  if (!isOpen) return null;

  return (
      <>
        <button
            className="header-btn notification-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="알림"
        >
          🔔
          {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
          )}
        </button>
        <div className="dropdown-content notification-dropdown show">
          <div className="dropdown-header">
            <span>알림</span>
            <button
                className="refresh-btn"
                onClick={fetchNotifications}
                disabled={isLoadingNotifications}
                title="새로고침"
            >
              🔄
            </button>
          </div>

          {/* 필터 버튼들 */}
          <div className="notification-filters">
            <button
                className={`filter-btn ${notificationFilter === 'unread' ? 'active' : ''}`}
                onClick={() => setNotificationFilter('unread')}
            >
              읽지 않음 ({unreadCount})
            </button>
            <button
                className={`filter-btn ${notificationFilter === 'all' ? 'active' : ''}`}
                onClick={() => setNotificationFilter('all')}
            >
              전체 ({notifications.length})
            </button>
          </div>

          {/* 알림 목록 */}
          <div className="notification-list">
            {isLoadingNotifications ? (
                <div className="notification-loading">로딩 중...</div>
            ) : filteredNotifications.length === 0 ? (
                <div className="notification-empty">
                  {notificationFilter === 'unread' ? '읽지 않은 알림이 없습니다.' : '알림이 없습니다.'}
                </div>
            ) : (
                filteredNotifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                        onClick={() => handleNotificationReadToggle(notification)}
                        onDoubleClick={() => handleNotificationDoubleClick(notification)}
                        style={{ cursor: 'pointer' }}
                    >
                      <div className="notification-header">
                        <div className="notification-title">
                          {notification.title || '제목 없음'}
                          {!notification.isRead && <span className="unread-dot">●</span>}
                        </div>
                        <div className="notification-actions">
                          {notification.url && (
                              <button
                                  className="navigate-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationNavigate(notification);
                                  }}
                                  title="페이지로 이동"
                              >
                                🔗
                              </button>
                          )}
                          {!notification.isRead && (
                              <button
                                  className="read-toggle-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationReadToggle(notification);
                                  }}
                                  title="읽음으로 표시"
                              >
                                📧
                              </button>
                          )}
                        </div>
                      </div>
                      <div className="notification-text">
                        {notification.description || '내용 없음'}
                      </div>
                      <div className="notification-meta">
                        <span className="notification-id">ID: {notification.id}</span>
                        <span className="notification-hint">
                    더블클릭하여 읽음 처리
                  </span>
                      </div>
                    </div>
                ))
            )}
          </div>
        </div>
      </>
  );
};

// 알림 버튼 컴포넌트
export const NotificationButton: React.FC<{ unreadCount: number; onClick: () => void }> = ({
                                                                                             unreadCount,
                                                                                             onClick
                                                                                           }) => {
  return (
      <button
          className="header-btn notification-btn"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          title="알림"
      >
        🔔
        {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
        )}
      </button>
  );
};

export default NotificationDropdown;