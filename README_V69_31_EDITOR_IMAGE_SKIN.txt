v69-31 EDITOR IMAGE-SKIN PASS

기준: v69-30

핵심 변경
- 아이템 에디터/신무장 에디터를 CSS 장식 위주 방식에서 전용 PNG 프레임/버튼/행/입력창 이미지 스킨 방식으로 전환.
- 신규 UI 에셋: public/resources/ui/editor-v2/
  - frame-panel.png, frame-modal.png, frame-portrait.png
  - frame-title.png, frame-title-active.png
  - button.png, button-active.png, button-danger.png
  - row.png, row-selected.png, input.png
  - 카테고리/행동/능력 아이콘 PNG 20종 이상
- 시작 메뉴의 '신무장 에디터'는 목록 화면을 거치지 않고 곧바로 편집 화면으로 진입.
- 아이템 에디터 3단 배치 재정렬: 카테고리+목록 / 상세정보 / 편집.
- 아이템 상세 이미지 프레임, 카테고리 버튼, 목록 행, 입력창, 하단 액션 버튼을 전용 이미지 에셋으로 교체.
- 신무장 에디터 3단 배치 재정렬: 장수목록 / 초상 / 정보·능력·특성 편집.
- 신무장 목록행, 초상 프레임, 능력 카드, 탭, 특성/성향 모달도 동일한 전용 이미지 스킨 적용.
- 작은 화면에서는 세로 배치로 폴백.

검증
- App.tsx TSX 파싱 오류 0건.
- menu.css 중괄호 수 일치.
