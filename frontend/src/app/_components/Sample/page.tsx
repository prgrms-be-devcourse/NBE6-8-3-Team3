
import TodoListTemplate from '../TodoList/TodoListTemplate';
import './_components/TodoList/TodoListTemplate.css';

export default function Home() {
  return (
    <TodoListTemplate>
      <div style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#1e293b' }}>
          대시보드
        </h1>
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>
          오늘의 할 일을 확인하고 관리하세요.
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '1rem' 
        }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>오늘의 할 일</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>5개 남음</p>
          </div>
          
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>진행중인 프로젝트</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>3개 진행중</p>
          </div>
        </div>
      </div>
    </TodoListTemplate>
  );
}