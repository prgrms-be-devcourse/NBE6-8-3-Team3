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
      profileImgUrl: '',
      uploadFile: null // 선택된 파일 저장
    });
  
    const [isEditing, setIsEditing] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // API 기본 설정
    const API_BASE_URL = 'http://localhost:8080';

    // 상대 경로를 절대 URL로 변환 (표시용)
    const getDisplayImageUrl = (imageUrl) => {
      // 빈 값이거나 null이면 기본 이미지 없음 표시
      if (!imageUrl || imageUrl.trim() === '') {
        return null; // null을 반환하여 "이미지 없음" 표시하도록 함
      }
      
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      
      return `${API_BASE_URL}${imageUrl}`;
    };

    // 절대 URL을 상대 경로로 변환 (저장용)
    const getRelativePath = (imageUrl) => {
      if (!imageUrl) return '';
      
      if (imageUrl.startsWith(API_BASE_URL)) {
        return imageUrl.replace(API_BASE_URL, '');
      }
      
      return imageUrl;
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
        const response = await fetch(`${API_BASE_URL}${url}`, {
          ...defaultOptions,
          ...options
        });

        if (!response.ok) {
          let errorData;
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              errorData = await response.json();
            } catch (jsonError) {
              errorData = { message: `HTTP ${response.status} - ${response.statusText}` };
            }
          } else {
            const textResponse = await response.text();
            errorData = { message: `HTTP ${response.status} - ${response.statusText}` };
          }
          
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data;
        
      } catch (error) {
        if (error instanceof TypeError) {
          throw new Error('서버에 연결할 수 없습니다. 네트워크 연결과 CORS 설정을 확인해주세요.');
        }
        
        throw error;
      }
    };

    // 내 정보 조회
    const fetchMyInfo = async () => {
      try {
        setLoading(true);
        
        const result = await apiRequest('/api/v1/user/me');
        
        if (result.resultCode && result.resultCode.startsWith('200')) {
          const userData = result.data;
          
          const profileInfo = {
            id: userData.id || 0,
            nickname: userData.nickname || '',
            email: userData.email || '',
            profileImgUrl: getRelativePath(userData.profileImageUrl || ''),
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
          
          setProfileData(profileInfo);
          setFormData({
            nickname: profileInfo.nickname,
            profileImgUrl: profileInfo.profileImgUrl,
            uploadFile: null
          });
          setPreviewImage(getDisplayImageUrl(profileInfo.profileImgUrl));
          
        } else {
          throw new Error(result.msg || '사용자 정보를 불러올 수 없습니다.');
        }
      } catch (error) {
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

    useEffect(() => {
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
  
    // 이미지 로드 성공/실패 핸들러
    const handleImageLoad = () => {
      setImageLoading(false);
      setImageError(false);
    };
  
    const handleImageError = () => {
      setImageLoading(false);
      setImageError(true);
    };
  
    // 파일 선택 - 미리보기만 표시
    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (!file) return;
  
      // 파일 크기 및 타입 체크
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }
  
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 선택 가능합니다.');
        return;
      }

      // 파일을 formData에 저장하고 미리보기 설정
      const previewUrl = URL.createObjectURL(file);
      setFormData({
        ...formData,
        uploadFile: file,
        profileImgUrl: '' // 새 파일 선택 시 기존 URL은 비워둠
      });
      setPreviewImage(previewUrl);
      setImageError(false);
    };

    // 이미지 삭제 기능
    const handleImageDelete = () => {
      // 확인 대화상자
      if (!confirm('프로필 이미지를 삭제하시겠습니까?')) {
        return;
      }

      // 미리보기 URL 정리
      if (formData.uploadFile && previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
      
      // 폼 데이터 초기화
      setFormData({
        ...formData,
        profileImgUrl: '', // 빈 값으로 설정
        uploadFile: null
      });
      
      setPreviewImage(null); // 이미지 없음 상태로 설정
      setImageError(false);
    };
  
    const handleEdit = () => {
      setIsEditing(true);
    };
  
    const handleCancel = () => {
      // 미리보기 URL 정리
      if (formData.uploadFile && previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
      }
      
      setFormData({
        nickname: profileData.nickname,
        profileImgUrl: profileData.profileImgUrl,
        uploadFile: null
      });
      setPreviewImage(getDisplayImageUrl(profileData.profileImgUrl));
      setIsEditing(false);
    };
  
    // 저장 - 파일 업로드와 프로필 수정을 함께 처리
    const handleSave = async () => {
      try {
        // 입력값 검증
        if (!formData.nickname.trim()) {
          alert('닉네임을 입력해주세요.');
          return;
        }

        setSaving(true);
        
        let finalImageUrl = formData.profileImgUrl;

    // 이미지 관련 작업이 있으면 profile-image API 호출
    if (formData.uploadFile || (formData.profileImgUrl === '' && profileData.profileImgUrl !== '')) {
        const formDataForImage = new FormData();
        
        if (formData.uploadFile) {
            formDataForImage.append('profileImage', formData.uploadFile);
        } else {
            formDataForImage.append('deleteImage', 'true');
        }

        const imageResponse = await fetch(`${API_BASE_URL}/api/v1/user/profile-image`, {
            method: 'POST',
            credentials: 'include',
            body: formDataForImage
        });

        if (imageResponse.ok) {
            const imageResult = await imageResponse.json();
            finalImageUrl = getRelativePath(imageResult.data.imageUrl);
        }
    }

    // 그 다음 프로필 정보 업데이트
    const updateData = {
        nickname: formData.nickname.trim(),
        profileImageUrl: finalImageUrl
    };

    const result = await apiRequest('/api/v1/user/me', {
        method: 'POST',
        body: JSON.stringify(updateData)
    });
        
        if (result.resultCode && result.resultCode.startsWith('200')) {
          // 미리보기 URL 정리
          if (formData.uploadFile && previewImage && previewImage.startsWith('blob:')) {
            URL.revokeObjectURL(previewImage);
          }
          
          // 성공 시 데이터 업데이트
          const updatedData = result.data;
          
          setProfileData({
            ...profileData,
            nickname: updatedData.nickname || profileData.nickname,
            profileImgUrl: getRelativePath(updatedData.profileImageUrl || ''),
            updatedAt: new Date().toLocaleString('ko-KR', {
              year: 'numeric',
              month: '2-digit', 
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }).replace(/\. /g, '-').replace('.', '')
          });
          
          setFormData({
            nickname: updatedData.nickname || profileData.nickname,
            profileImgUrl: getRelativePath(updatedData.profileImageUrl || ''),
            uploadFile: null
          });
          
          // 미리보기 이미지도 업데이트
          setPreviewImage(getDisplayImageUrl(getRelativePath(updatedData.profileImageUrl)));
          
          setIsEditing(false);
          alert(result.msg || '프로필이 성공적으로 업데이트되었습니다.');
        } else {
          throw new Error(result.msg || '프로필 업데이트에 실패했습니다.');
        }
      } catch (error) {
        let errorMessage = '프로필 업데이트에 실패했습니다.';
        if (error.message.includes('401') || error.message.includes('인증')) {
          errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.';
        } else if (error.message.includes('403')) {
          errorMessage = '접근 권한이 없습니다.';
        } else if (error.message.includes('이미지 업로드')) {
          errorMessage = error.message;
        }
        
        alert(errorMessage);
      } finally {
        setSaving(false);
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
                  <button 
                    style={styles.cancelButton} 
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    취소
                  </button>
                  <button 
                    style={{
                      ...styles.saveButton,
                      opacity: saving ? 0.6 : 1,
                      cursor: saving ? 'not-allowed' : 'pointer'
                    }} 
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? '저장 중...' : '저장'}
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
                  {previewImage ? (
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
                  ) : (
                    /* 이미지 없음 표시 */
                    <div style={styles.noImagePlaceholder}>
                      <div style={styles.noImageIcon}>👤</div>
                      <div style={styles.noImageText}>이미지 없음</div>
                    </div>
                  )}
                  
                  {/* 이미지 크기 정보 */}
                  {isEditing && (
                    <div style={styles.imageMeta}>
                      <span style={styles.imageSize}>권장: 500×500px</span>
                    </div>
                  )}
                </div>
                
                {/* 이미지 컨트롤 영역 */}
                <div style={{
                  ...styles.imageControls,
                  visibility: isEditing ? 'visible' : 'hidden',
                  opacity: isEditing ? 1 : 0
                }}>
                  {/* 파일 선택 및 삭제 버튼 */}
                  <div style={styles.uploadSection}>
                    <div style={styles.buttonGroup}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        style={styles.fileInput}
                        id="profileImageSelect"
                        disabled={!isEditing || saving}
                      />
                      <label htmlFor="profileImageSelect" style={{
                        ...styles.uploadButton,
                        opacity: (isEditing && !saving) ? 1 : 0.5,
                        cursor: (isEditing && !saving) ? 'pointer' : 'not-allowed'
                      }}>
                        📷 이미지 선택
                      </label>
                      
                      {/* 이미지 삭제 버튼 */}
                      <button 
                        type="button"
                        onClick={handleImageDelete}
                        style={{
                          ...styles.deleteButton,
                          opacity: (isEditing && !saving) ? 1 : 0.5,
                          cursor: (isEditing && !saving) ? 'pointer' : 'not-allowed'
                        }}
                        disabled={!isEditing || saving}
                      >
                        🗑️ 이미지 삭제
                      </button>
                    </div>
                    
                    {formData.uploadFile && (
                      <span style={styles.selectedFileInfo}>
                        선택된 파일: {formData.uploadFile.name}
                      </span>
                    )}
                  </div>
                  
                  <div style={styles.imageHints}>
                    <p style={styles.hint}>• 파일 크기: 최대 5MB</p>
                    <p style={styles.hint}>• 지원 형식: JPG, PNG, GIF, WEBP</p>
                    <p style={styles.hint}>• 권장 크기: 500x500px</p>
                    <p style={styles.hint}>• 이미지 삭제 시 기본 이미지로 표시됩니다</p>
                    {formData.uploadFile && (
                      <p style={styles.hintHighlight}>• 저장을 눌러야 실제 업로드됩니다</p>
                    )}
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
                  disabled={saving}
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
    noImagePlaceholder: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      border: '3px solid #e9ecef',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      color: '#6c757d'
    },
    noImageIcon: {
      fontSize: '40px',
      marginBottom: '8px',
      opacity: 0.6
    },
    noImageText: {
      fontSize: '12px',
      fontWeight: '500',
      textAlign: 'center'
    },
    imageError: {
      opacity: '0.5',
      filter: 'grayscale(100%)'
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
      flexDirection: 'column',
      gap: '10px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap'
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
      border: 'none',
      width: 'fit-content'
    },
    deleteButton: {
      display: 'inline-block',
      padding: '10px 20px',
      backgroundColor: '#dc3545',
      color: 'white',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.2s ease',
      border: 'none',
      width: 'fit-content'
    },
    selectedFileInfo: {
      fontSize: '12px',
      color: '#28a745',
      fontWeight: '500',
      marginTop: '5px'
    },
    imageHints: {
      marginTop: '10px'
    },
    hint: {
      margin: '2px 0',
      fontSize: '12px',
      color: '#6c757d'
    },
    hintHighlight: {
      margin: '2px 0',
      fontSize: '12px',
      color: '#007bff',
      fontWeight: '500'
    }
  };
  
  export default ProfileEditPage;