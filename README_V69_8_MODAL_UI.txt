웹삼국지 v69-8 · 지도 고정 모달 UI

[적용 내용]
- 천하 지도를 게임 메인 바닥 화면으로 항상 유지
- 왼쪽 메뉴 클릭 시 페이지 전환 대신 지도 위 공통 모달 표시
- 같은 메뉴 재클릭 / 배경 클릭 / ESC / X 버튼으로 모달 닫기
- 도시 상세 및 오른쪽 도시 바로가기 버튼도 같은 모달 방식으로 연결
- 사용자 제작 남색·금색 프레임을 실제 모달 외곽/헤더에 적용
- 원본 UI 이미지의 검은 캔버스를 투명 처리한 게임용 PNG 추가
- 모바일에서는 프레임 장식을 단순화하여 콘텐츠 가독성 우선
- 기존 지도 로그 오버레이와 왼쪽 메뉴 접기/펼치기 유지

[GitHub 업로드 위치]
1) src/
   App.tsx
   index.css
   familySystem.ts
   historicalData.ts

2) public/resources/ui/
   modal-frame.png
   modal-title.png

[검증]
- v69-7 기준 TypeScript 프로젝트 진단과 동일: 새 진단 0개
- 별도 syntax 검사에서 JSX/TS 구문 오류 없음
- npm production build는 현재 작업 컨테이너의 node_modules가 불완전하여 vite 실행 파일을 찾지 못해 수행하지 못함

[UI 완료 후 다음 작업]
상점 실기능 확장으로 복귀:
1. 소모품 실제 사용
2. 책을 통한 능력 성장/학습
3. 장신구·장식품 실제 효과
4. 도시별 가격·재고 차이
