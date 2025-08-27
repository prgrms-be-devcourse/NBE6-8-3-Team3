'use client'; // 클라이언트 컴포넌트임을 명시

import { useEffect, useState } from 'react'; // React 훅 임포트
import LabelSelectorModal from '@/app/_components/Label/LabelSelectorModal';

// --- 인터페이스 정의 ---
// 라벨(Label) 객체의 타입을 정의합니다.
interface Label {
  id: number; // 라벨 고유 ID
  name: string; // 라벨 이름
  color: string; // 라벨 색상 (예: #RRGGBB 형식)
}

// --- TodoLabelPage 컴포넌트 ---
// 이 컴포넌트는 LabelSelectorModal을 사용하는 예시 페이지입니다.
// 현재 `todoId`를 `1`로 고정하여 사용하고 있습니다.
export default function TodoLabelPage() {
  // 예시 Todo ID를 1로 하드코딩했습니다.
  // 실제 애플리케이션에서는 이 ID가 동적으로 결정되어야 합니다 (예: URL 파라미터, 부모 컴포넌트에서 전달 등).
  const exampleTodoId = 1;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Todo 라벨 관리
        </h1>
        {/* LabelSelectorModal 컴포넌트를 렌더링하고 `exampleTodoId`를 `todoId` prop으로 전달합니다. */}
        <LabelSelectorModal todoId={exampleTodoId} />
      </div>
    </div>
  );
}