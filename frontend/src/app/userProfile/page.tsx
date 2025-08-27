"use client";
import React, { useState, useEffect } from 'react';
import TodoListTemplate from "../_components/TodoList/TodoListTemplate";

const ProfileEditPage = () => {
    // 프로필 수정 상태
    const [profileData, setProfileData] = useState({
      id: null,
      nickname: '',
      email: '',
      profileImgUrl: '',
      createdAt: '',
      updatedAt: ''
    });
  
    const [formData, setFormData] = useState({
      nickname: '',
      profileImgUrl: ''
    });
  
    const [isEditing, setIsEditing] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [loading, setLoading] = useState(true);

    // API 기본 설정
    const API_BASE_URL = 'http://localhost:8080';

    // 이미지 URL 처리 헬퍼 함수
    const processImageUrl = (imageUrl) => {
      console.log('processImageUrl 호출됨, 입력값:', imageUrl);
      
      if (!imageUrl) {
        console.log('이미지 URL이 null/undefined, null 반환');
        return null;
      }
      
      // 이미 완전한 URL인 경우 (http:// 또는 https://로 시작)
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        console.log('완전한 URL로 판단, 그대로 반환:', imageUrl);
        return imageUrl;
      }
      
      // 상대 경로인 경우 API_BASE_URL을 앞에 붙임
      if (imageUrl.startsWith('/')) {
        const result = `${API_BASE_URL}${imageUrl}`;
        console.log('상대 경로로 판단, 변환된 URL:', result);
        return result;
      }
      
      // 기타 경우 API_BASE_URL과 조합
      const result = `${API_BASE_URL}/${imageUrl}`;
      console.log('기타 경우, 변환된 URL:', result);
      return result;
    };

    // 이미지 URL을 표시용으로 변환 (프리뷰용)
    const getDisplayImageUrl = (imageUrl) => {
      console.log('getDisplayImageUrl 호출됨, 입력값:', imageUrl);
      const processedUrl = processImageUrl(imageUrl);
      const result = processedUrl || 'https://via.placeholder.com/150';
      console.log('getDisplayImageUrl 결과:', result);
      return result;
    };

    // API 요청 헬퍼 함수
    const apiRequest = async (url, options = {}) => {
      const defaultOptions = {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

      try {
        console.log(`API 요청 시작: ${API_BASE_URL}${url}`);
        console.log('요청 옵션:', { ...defaultOptions, ...options });
        
        const response = await fetch(`${API_BASE_URL}${url}`, {
          ...defaultOptions,
          ...options
        });

        console.log(`API 응답 상태: ${response.status} ${response.statusText}`);
        console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          console.error(`HTTP 에러: ${response.status}`);
          
          // 응답 내용 읽기 시도
          let errorData;
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              errorData = await response.json();
            } catch (jsonError) {
              console.error('JSON 파싱 실패:', jsonError);
              errorData = { message: `HTTP ${response.status} - ${response.statusText}` };
            }
          } else {
            const textResponse = await response.text();
            console.error('응답 내용:', textResponse);
            errorData = { message: `HTTP ${response.status} - ${response.statusText}` };
          }
          
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('응답 데이터:', data);
        return data;
        
      } catch (error) {
        console.error('API 요청 중 에러 발생:', error);
        console.error('에러 타입:', error.constructor.name);
        console.error('에러 메시지:', error.message);
        
        // fetch 자체가 실패한 경우 (네트워크 오류, CORS 등)
        if (error instanceof TypeError) {
          console.error('네트워크 에러 또는 CORS 에러일 가능성');
          throw new Error('서버에 연결할 수 없습니다. 네트워크 연결과 CORS 설정을 확인해주세요.');
        }
        
        throw error;
      }
    };

    // 내 정보 조회
    const fetchMyInfo = async () => {
      try {
        setLoading(true);
        console.log('사용자 정보 조회 시작...');
        
        const result = await apiRequest('/api/v1/user/me');
        console.log('API 응답 데이터:', result);
        
        if (result.resultCode && result.resultCode.startsWith('200')) {
          const userData = result.data;
          console.log('사용자 데이터:', userData);
          
          // 프로필 이미지 URL 처리
          const processedImageUrl = processImageUrl(userData.profileImageUrl);
          
          console.log('원본 이미지 URL:', userData.profileImageUrl);
          console.log('처리된 이미지 URL:', processedImageUrl);
          
          // null 값 안전 처리 - modifyDate 필드명 맞춤
          const profileInfo = {
            id: userData.id || 0,
            nickname: userData.nickname || '',
            email: userData.email || '',
            profileImgUrl: processedImageUrl, // 처리된 URL 사용
            createdAt: userData.createDate 
              ? new Date(userData.createDate).toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                }).replace(/\. /g, '-').replace('.', '')
              : '정보 없음',
            updatedAt: userData.modifyDate 
              ? new Date(userData.modifyDate).toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                }).replace(/\. /g, '-').replace('.', '')
              : '정보 없음'
          };
          
          console.log('처리된 프로필 정보:', profileInfo);
          
          setProfileData(profileInfo);
          setFormData({
            nickname: profileInfo.nickname,
            profileImgUrl: profileInfo.profileImgUrl || '' // 처리된 URL 사용
          });
          setPreviewImage(getDisplayImageUrl(profileInfo.profileImgUrl)); // 표시용 URL 사용
          
          console.log('설정된 미리보기 이미지 URL:', getDisplayImageUrl(profileInfo.profileImgUrl));
          
        } else {
          throw new Error(result.msg || '사용자 정보를 불러올 수 없습니다.');
        }
      } catch (error) {
        console.error('사용자 정보 조회 실패:', error);
        
        // 구체적인 에러 메시지 제공
        let errorMessage = '사용자 정보를 불러오는데 실패했습니다.';
        if (error.message.includes('연결할 수 없습니다')) {
          errorMessage = '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
        } else if (error.message.includes('401') || error.message.includes('인증')) {
          errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.';
        } else if (error.message.includes('403')) {
          errorMessage = '접근 권한이 없습니다.';
        }
        
        alert(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    // 컴포넌트 마운트 시 사용자 정보 조회
    useEffect(() => {
      // 개발용 테스트 함수들을 window에 추가
      if (typeof window !== 'undefined') {
        window.testDirectFetch = async () => {
          try {
            console.log('=== 직접 fetch 테스트 ===');
            console.log('요청 URL:', 'http://localhost:8080/api/v1/user/me');
            
            const response = await fetch('http://localhost:8080/api/v1/user/me', {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            console.log('응답 객체:', response);
            console.log('응답 상태:', response.status);
            console.log('응답 상태 텍스트:', response.statusText);
            console.log('응답 ok:', response.ok);
            console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));
            
            if (response.ok) {
              const data = await response.json();
              console.log('JSON 파싱 성공:', data);
              return data;
            } else {
              console.error('응답 실패:', response.status, response.statusText);
              const errorText = await response.text();
              console.error('에러 내용:', errorText);
              return { error: true, status: response.status, message: errorText };
            }
          } catch (error) {
            console.error('fetch 에러 발생:', error);
            console.error('에러 타입:', error.constructor.name);
            console.error('에러 메시지:', error.message);
            console.error('에러 스택:', error.stack);
            return { error: true, message: error.message, type: error.constructor.name };
          }
        };
        
        window.testWithTimeout = async () => {
          console.log('=== 타임아웃 테스트 ===');
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
          
          try {
            const response = await fetch('http://localhost:8080/api/v1/user/me', {
              method: 'GET',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              },
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            console.log('타임아웃 테스트 응답:', response.status);
            const data = await response.json();
            console.log('타임아웃 테스트 데이터:', data);
            return data;
          } catch (error) {
            clearTimeout(timeoutId);
            console.error('타임아웃 테스트 에러:', error);
            if (error.name === 'AbortError') {
              console.error('요청이 타임아웃되었습니다.');
            }
            return { error: true, message: error.message };
          }
        };
        
        window.checkCookies = () => {
          console.log('=== 쿠키 확인 ===');
          console.log('모든 쿠키:', document.cookie);
          const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            if (key) acc[key] = value;
            return acc;
          }, {});
          console.log('파싱된 쿠키:', cookies);
          console.log('apiKey 쿠키:', cookies.apiKey || '없음');
          console.log('accessToken 쿠키:', cookies.accessToken || '없음');
          return cookies;
        };
        
        console.log('=== 디버깅 함수들이 추가되었습니다 ===');
        console.log('사용 가능한 함수:');
        console.log('1. testDirectFetch() - 직접 fetch 테스트');
        console.log('2. testWithTimeout() - 타임아웃 테스트');
        console.log('3. checkCookies() - 쿠키 확인');
      }
      
      fetchMyInfo();
    }, []);
  
    // 화면 크기 감지
    useEffect(() => {
      const checkScreenSize = () => {
        setIsMobile(window.innerWidth <= 768);
      };
      
      checkScreenSize();
      window.addEventListener('resize', checkScreenSize);
      
      return () => window.removeEventListener('resize', checkScreenSize);
    }, []);
  
    // 프로필 수정 함수들
    const handleInputChange = (field, value) => {
      setFormData({
        ...formData,
        [field]: value
      });
    };
  
    const handleImageUrlChange = (value) => {
      setFormData({
        ...formData,
        profileImgUrl: value
      });
      // URL 변경 시 미리보기도 즉시 업데이트
      setPreviewImage(getDisplayImageUrl(value));
      setImageError(false);
    };
  
    // 이미지 로드 성공/실패 핸들러
    const handleImageLoad = () => {
      setImageLoading(false);
      setImageError(false);
    };
  
    const handleImageError = () => {
      setImageLoading(false);
      setImageError(true);
    };
  
    // 프로필 이미지 업로드
    const handleFileUploadToServer = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
  
      // 파일 크기 및 타입 체크
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }
  
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
  
      try {
        const formDataForUpload = new FormData();
        formDataForUpload.append('profileImage', file);
  
        setImageLoading(true);

        // 프로필 이미지 업로드 API 호출
        const response = await fetch(`${API_BASE_URL}/api/v1/user/profile-image`, {
          method: 'POST',
          credentials: 'include',
          body: formDataForUpload
        });

        if (response.ok) {
          const result = await response.json();
          const rawImageUrl = result.data.imageUrl;
          
          // 서버에서 받은 이미지 URL을 처리
          const processedImageUrl = processImageUrl(rawImageUrl);
          
          console.log('원본 이미지 URL:', rawImageUrl);
          console.log('처리된 이미지 URL:', processedImageUrl);
          
          setFormData({
            ...formData,
            profileImgUrl: processedImageUrl
          });
          setPreviewImage(getDisplayImageUrl(processedImageUrl));
          setImageLoading(false);
          
          alert('이미지가 성공적으로 업로드되었습니다.');
        } else {
          throw new Error('이미지 업로드 실패');
        }
        
      } catch (error) {
        console.error('이미지 업로드 오류:', error);
        setImageLoading(false);
        alert('이미지 업로드에 실패했습니다.');
      }
    };
  
    const handleEdit = () => {
      setIsEditing(true);
    };
  
    const handleCancel = () => {
      setFormData({
        nickname: profileData.nickname,
        profileImgUrl: profileData.profileImgUrl
      });
      setPreviewImage(getDisplayImageUrl(profileData.profileImgUrl));
      setIsEditing(false);
    };
  
    const handleSave = async () => {
      try {
        // 입력값 검증
        if (!formData.nickname.trim()) {
          alert('닉네임을 입력해주세요.');
          return;
        }

        console.log('프로필 업데이트 시작:', formData);

        const updateData = {
          nickname: formData.nickname,
          profileImageUrl: formData.profileImgUrl || null // 빈 문자열인 경우 null로 전송
        };

        // Authorization 헤더 방식 대신 쿠키 인증 사용
        const result = await apiRequest('/api/v1/user/me', {
          method: 'POST',
          body: JSON.stringify(updateData)
        });
        
        console.log('프로필 업데이트 응답:', result);
        
        if (result.resultCode && result.resultCode.startsWith('200')) {
          // 성공 시 데이터 업데이트
          const updatedData = result.data;
          const processedImageUrl = processImageUrl(updatedData.profileImageUrl);
          
          setProfileData({
            ...profileData,
            nickname: updatedData.nickname || profileData.nickname,
            profileImgUrl: processedImageUrl, // 처리된 URL 사용
            updatedAt: new Date().toLocaleString('ko-KR', {
              year: 'numeric',
              month: '2-digit', 
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }).replace(/\. /g, '-').replace('.', '')
          });
          
          // 미리보기 이미지도 업데이트
          setPreviewImage(getDisplayImageUrl(processedImageUrl));
          
          setIsEditing(false);
          alert(result.msg || '프로필이 성공적으로 업데이트되었습니다.');
        } else {
          throw new Error(result.msg || '프로필 업데이트에 실패했습니다.');
        }
      } catch (error) {
        console.error('프로필 업데이트 실패:', error);
        
        let errorMessage = '프로필 업데이트에 실패했습니다.';
        if (error.message.includes('401') || error.message.includes('인증')) {
          errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.';
        } else if (error.message.includes('403')) {
          errorMessage = '접근 권한이 없습니다.';
        }
        
        alert(errorMessage);
      }
    };

    // 로딩 중일 때
    if (loading) {
      return (
        <TodoListTemplate contentClassName="profile-content">
          <div style={styles.loadingWrapper}>
            <div style={styles.loadingSpinner}>⏳</div>
            <p>프로필 정보를 불러오는 중...</p>
          </div>
        </TodoListTemplate>
      );
    }
  
    return (
      <TodoListTemplate contentClassName="profile-content">
        <div style={styles.profileWrapper}>
          <div style={{
            ...styles.profileContainer,
            padding: isMobile ? '20px' : '30px',
            margin: isMobile ? '10px' : '20px',
            maxWidth: isMobile ? '95%' : '900px',
            width: '100%'
          }}>
          <div style={styles.profileHeader}>
            <h1 style={styles.profileTitle}>프로필 설정</h1>
            <div style={styles.profileActions}>
              {!isEditing ? (
                <button style={styles.editButton} onClick={handleEdit}>
                  수정하기
                </button>
              ) : (
                <div style={styles.actionButtons}>
                  <button style={styles.cancelButton} onClick={handleCancel}>
                    취소
                  </button>
                  <button style={styles.saveButton} onClick={handleSave}>
                    저장
                  </button>
                </div>
              )}
            </div>
          </div>
  
          <div style={styles.profileForm}>
            {/* 프로필 이미지 */}
            <div style={styles.formGroup}>
              <label style={styles.label}>프로필 이미지</label>
              <div style={styles.imageSection}>
                <div style={styles.imagePreview}>
                  {/* 로딩 스피너 */}
                  {imageLoading && (
                    <div style={styles.imageLoading}>
                      <div style={styles.spinner}>⏳</div>
                      <span style={styles.loadingText}>업로드 중...</span>
                    </div>
                  )}
                  
                  {/* 프로필 이미지 */}
                  {!imageLoading && (
                    <>
                      <img 
                        src={previewImage} 
                        alt="프로필 이미지" 
                        style={{
                          ...styles.profileImage,
                          ...(imageError ? styles.imageError : {})
                        }}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                      />
                      
                      {/* 이미지 에러 시 오버레이 */}
                      {imageError && (
                        <div style={styles.errorOverlay}>
                          <span style={styles.errorIcon}>❌</span>
                          <span style={styles.errorText}>이미지 로드 실패</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* 이미지 크기 정보 */}
                  {isEditing && !imageLoading && (
                    <div style={styles.imageMeta}>
                      <span style={styles.imageSize}>권장: 500×500px</span>
                    </div>
                  )}
                </div>
                {/* 이미지 컨트롤 영역 - 항상 렌더링하되 편집 모드에 따라 보이기/숨기기 */}
                <div style={{
                  ...styles.imageControls,
                  visibility: isEditing ? 'visible' : 'hidden',
                  opacity: isEditing ? 1 : 0
                }}>
                  {/* 파일 업로드 */}
                  <div style={styles.uploadSection}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUploadToServer}
                      style={styles.fileInput}
                      id="profileImageUpload"
                      disabled={!isEditing}
                    />
                    <label htmlFor="profileImageUpload" style={{
                      ...styles.uploadButton,
                      opacity: isEditing ? 1 : 0.5,
                      cursor: isEditing ? 'pointer' : 'not-allowed'
                    }}>
                      📁 파일 선택
                    </label>
                    <span style={styles.uploadHint}>또는</span>
                  </div>
                  
                  {/* URL 입력 */}
                  <div style={styles.urlSection}>
                    <input
                      type="url"
                      placeholder="이미지 URL을 입력하세요 (선택사항)"
                      value={formData.profileImgUrl || ''} // null인 경우 빈 문자열로 표시
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                      style={styles.input}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div style={styles.imageHints}>
                    <p style={styles.hint}>• 파일 크기: 최대 5MB</p>
                    <p style={styles.hint}>• 지원 형식: JPG, PNG, GIF</p>
                    <p style={styles.hint}>• 권장 크기: 500x500px</p>
                  </div>
                </div>
              </div>
            </div>
  
            {/* 닉네임 */}
            <div style={styles.formGroup}>
              <label style={styles.label}>닉네임</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                  style={styles.input}
                  placeholder="닉네임을 입력하세요"
                />
              ) : (
                <div style={styles.displayValue}>{profileData.nickname}</div>
              )}
            </div>
  
            {/* 이메일 (항상 읽기 전용) */}
            <div style={styles.formGroup}>
              <label style={styles.label}>이메일</label>
              <div style={styles.displayValue}>{profileData.email}</div>
            </div>
  
            {/* 생성일 (읽기 전용) */}
            <div style={styles.formGroup}>
              <label style={styles.label}>가입일</label>
              <div style={styles.displayValue}>{profileData.createdAt}</div>
            </div>
  
            {/* 수정일 (읽기 전용) */}
            <div style={styles.formGroup}>
              <label style={styles.label}>최근 수정일</label>
              <div style={styles.displayValue}>{profileData.updatedAt}</div>
            </div>
          </div>
          </div>
        </div>
      </TodoListTemplate>
    );
  };
  
  const styles = {
    profileWrapper: {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      backgroundColor: 'transparent',
      minHeight: 'calc(100vh - 150px)',
      paddingTop: '20px'
    },
    profileContainer: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      minHeight: '600px'
    },
    loadingWrapper: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '20px'
    },
    loadingSpinner: {
      fontSize: '48px',
      animation: 'spin 1s linear infinite'
    },
    profileHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px',
      borderBottom: '1px solid #e1e5e9',
      paddingBottom: '20px'
    },
    profileTitle: {
      fontSize: '28px',
      fontWeight: '600',
      color: '#2c3e50',
      margin: 0
    },
    profileActions: {},
    editButton: {
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease'
    },
    actionButtons: {
      display: 'flex',
      gap: '10px'
    },
    cancelButton: {
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease'
    },
    saveButton: {
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease'
    },
    profileForm: {
      display: 'flex',
      flexDirection: 'column',
      gap: '25px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#495057',
      marginBottom: '5px'
    },
    input: {
      padding: '12px 16px',
      border: '1px solid #ced4da',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#495057',
      backgroundColor: '#ffffff',
      transition: 'border-color 0.2s ease',
      outline: 'none'
    },
    displayValue: {
      padding: '12px 16px',
      backgroundColor: '#f8f9fa',
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      fontSize: '14px',
      color: '#495057'
    },
    imageSection: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '25px',
      flexWrap: 'wrap',
      minHeight: '200px'
    },
    imagePreview: {
      flexShrink: 0,
      position: 'relative',
      display: 'inline-block'
    },
    profileImage: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '3px solid #e9ecef',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease',
      display: 'block'
    },
    imageError: {
      opacity: '0.5',
      filter: 'grayscale(100%)'
    },
    imageLoading: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      border: '3px solid #e9ecef',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      gap: '8px'
    },
    spinner: {
      fontSize: '24px',
      animation: 'spin 1s linear infinite'
    },
    loadingText: {
      fontSize: '12px',
      color: '#6c757d',
      fontWeight: '500'
    },
    errorOverlay: {
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      borderRadius: '50%',
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px'
    },
    errorIcon: {
      fontSize: '24px'
    },
    errorText: {
      fontSize: '10px',
      color: 'white',
      fontWeight: '500'
    },
    imageMeta: {
      position: 'absolute',
      bottom: '-25px',
      left: '50%',
      transform: 'translateX(-50%)',
      whiteSpace: 'nowrap'
    },
    imageSize: {
      fontSize: '11px',
      color: '#6c757d',
      backgroundColor: '#f8f9fa',
      padding: '2px 8px',
      borderRadius: '12px',
      border: '1px solid #e9ecef'
    },
    imageControls: {
      flex: 1,
      minWidth: '300px',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      minHeight: '180px',
      transition: 'opacity 0.3s ease'
    },
    uploadSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    fileInput: {
      display: 'none'
    },
    uploadButton: {
      display: 'inline-block',
      padding: '10px 20px',
      backgroundColor: '#007bff',
      color: 'white',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.2s ease',
      border: 'none'
    },
    uploadHint: {
      color: '#6c757d',
      fontSize: '14px',
      fontStyle: 'italic'
    },
    urlSection: {
      width: '100%'
    },
    imageHints: {
      marginTop: '5px'
    },
    hint: {
      margin: '2px 0',
      fontSize: '12px',
      color: '#6c757d'
    }
  };
  
  export default ProfileEditPage;