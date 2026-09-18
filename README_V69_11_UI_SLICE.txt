웹삼국지 v69-11 UI 프레임 재적용

문제 원인
- v69-10에서 큰 UI 원본 이미지를 각 박스에 background-size:100% 100%로 늘려 사용해 모서리/금색 테두리가 찌그러졌음.

수정 방식
- 공통 프레임: CSS border-image 9-slice 적용
- 왼쪽 메뉴: 8640 아이콘 시트에서 개별 아이콘 분리
- 속도 버튼: 8641의 1X/2X/4X를 개별 자산으로 분리
- 상단 HUD: 원본 가로 비율을 유지한 전용 프레임
- 오른쪽 도시 패널: 세로 전용 프레임 사용
- 지도/로그/공통 카드: 모서리 고정 프레임 적용
- 모달: 모달 전용 프레임 유지

GitHub 업로드
1. src/App.tsx 덮어쓰기
2. src/index.css 덮어쓰기
3. netlify.toml 덮어쓰기
4. public/resources/ui/에 이 ZIP의 PNG 파일들을 업로드
5. Commit changes -> Netlify 자동배포

참고
- 기존 public/resources/ui의 이전 PNG는 삭제하지 않아도 동작에 영향 없음.
- TypeScript 전체 검사는 현재 환경에서 React 타입 패키지가 없어 실행 불가했으나, 이번 App.tsx 변경은 sidebar button에 data-tab 속성 1개를 추가한 것뿐임.
