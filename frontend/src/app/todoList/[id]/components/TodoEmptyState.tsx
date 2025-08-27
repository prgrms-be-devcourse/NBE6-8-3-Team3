import React from 'react';

const TodoEmptyState: React.FC = () => {
  return (
    <div style={{
      background: 'var(--bg-white)',
      borderRadius: '12px',
      padding: '3rem',
      boxShadow: '0 4px 12px var(--shadow-md)',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px dashed var(--border-medium)'
    }}>
      <div style={{ textAlign: 'center', color: 'var(--text-light)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📝</div>
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: '600', 
          marginBottom: '0.5rem',
          color: 'var(--text-secondary)'
        }}>
          할 일을 선택해주세요
        </h3>
        <p style={{ fontSize: '1rem' }}>
          왼쪽에서 할 일을 클릭하면 상세 정보가 표시됩니다.
        </p>
      </div>  
    </div>
  );
};


export default TodoEmptyState;