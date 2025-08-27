"use client";
import React, { useState, useEffect } from 'react';

interface UserInfo {
  name: string;
  email: string;
  joinDate: string;
  role?: string;
  department?: string;
}

interface UserProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userInfo?: UserInfo;
}

// 유저 프로필 버튼 컴포넌트 (드롭다운이 닫혀있을 때 사용)
const UserProfileButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button 
      className="header-btn"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title="프로필"
    >
      👤
    </button>
  );
};

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ 
  isOpen, 
  onClose, 
  userName = "개발자님",
  userInfo = {
    name: "개발자님",
    email: "developer@example.com",
    joinDate: "2024.01.15",
    role: "Frontend Developer",
    department: "개발팀"
  }
}) => {
  
  const [showProfileDetail, setShowProfileDetail] = useState<boolean>(false);
  const [userProfileData, setUserProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 유저 프로필 데이터 가져오기
  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/v1/user/me', {
        method: 'GET',
        credentials: 'include' // 쿠키 포함
      });

      const result = await response.json();
      
      if (result.resultCode === "200-1") {
        setUserProfileData(result.data);
      }
    } catch (error) {
      console.error('프로필 정보 가져오기 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 프로필 데이터 가져오기
  useEffect(() => {
    if (isOpen) {
      fetchUserProfile();
    }
  }, [isOpen]);

  const showProfileSummary = () => {
    setShowProfileDetail(true);
  };

  const hideProfileDetail = () => {
    setShowProfileDetail(false);
  };

  const goToProfileEdit = () => {
    window.location.href = '/userProfile';
    onClose();
  };

  const logout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      try {
        // 로그아웃 API 호출
        const response = await fetch('http://localhost:8080/api/v1/user/logout', {
          method: 'POST',
          credentials: 'include', // 쿠키 포함해서 요청
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        
        // API 응답과 관계없이 프론트엔드에서 정리 작업 수행
        // 로컬 스토리지에서 토큰 제거
        localStorage.removeItem('accessToken');
        localStorage.removeItem('apiKey');
        
        // 세션 스토리지도 정리 (혹시 사용 중이라면)
        sessionStorage.clear();
        
        if (result.resultCode === "200-1") {
          console.log('로그아웃 성공:', result.msg);
        } else {
          console.warn('로그아웃 API 응답 이상:', result);
        }
        
        // 강제로 쿠키 삭제 시도 (클라이언트 사이드에서 가능한 범위)
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        alert('로그아웃 되었습니다.');
        
        // 약간의 지연 후 로그인 페이지로 이동 (쿠키 삭제 완료 대기)
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
        
      } catch (error) {
        console.error('로그아웃 오류:', error);
        
        // API 호출이 실패해도 프론트엔드에서 로그아웃 처리
        localStorage.removeItem('accessToken');
        localStorage.removeItem('apiKey');
        sessionStorage.clear();
        
        // 강제로 쿠키 삭제
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        alert('로그아웃 되었습니다.');
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <button 
        className="header-btn"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        title="프로필"
      >
        👤
      </button>
      <div className="dropdown-content user-profile-dropdown show">
        {!showProfileDetail ? (
          <>
            <div className="dropdown-header">
              <div className="user-header-info">
                <div className="user-avatar">👤</div>
                <div className="user-basic-info">
                  <div className="user-name">{userProfileData?.nickname || userName}</div>
                  <div className="user-role">{userProfileData?.email || userInfo.email}</div>
                </div>
              </div>
            </div>
            <button className="dropdown-item" onClick={showProfileSummary}>
              <span className="item-icon">📋</span>
              프로필 상세보기
            </button>
            <button className="dropdown-item" onClick={goToProfileEdit}>
              <span className="item-icon">✏️</span>
              프로필 수정
            </button>
            <button className="dropdown-item logout" onClick={logout}>
              <span className="item-icon">🚪</span>
              로그아웃
            </button>
          </>
        ) : (
          <>
            <div className="dropdown-header profile-detail-header">
              <button 
                className="back-btn"
                onClick={hideProfileDetail}
                title="뒤로가기"
              >
                ←
              </button>
              <span>프로필 상세정보</span>
            </div>
            <div className="profile-detail-content">
              <div className="profile-avatar-large">
                👤
              </div>
              <div className="profile-info-section">
                <div className="info-item">
                  <span className="info-label">닉네임</span>
                  <span className="info-value">{userProfileData?.nickname || userInfo.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">이메일</span>
                  <span className="info-value">{userProfileData?.email || userInfo.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">가입일</span>
                  <span className="info-value">{userProfileData?.CreateDate ? new Date(userProfileData.createDate).toLocaleDateString('ko-KR') : userInfo.joinDate}</span>
                </div>
              </div>
              <div className="profile-actions">
                <button className="profile-action-btn edit-btn" onClick={goToProfileEdit}>
                  ✏️ 프로필 수정
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export { UserProfileButton };
export default UserProfileDropdown;