웹삼국지 v69-17 최신 통합 수정본

포함 범위
- v69-9 상점 실기능 확장
- 지도 고정 + 메뉴 모달 UI
- 전체 UI 프레임/아이콘 적용
- 시작화면 배경 선명도 수정(그라데이션 제거)
- 시작화면 메뉴 중앙 배치
- 시대 선택 프레임/목록 구조 정리
- 장수 선택 프레임/목록 정렬 및 번호 이미지 경로 준비
- 도시 선택 명칭/단계명 통일, 지도+도시 정보 2열 구조
- 새 게임 헤더 높이 축소, 데스크톱 스크롤 최소화
- 플레이 HUD 이름칸은 플레이 장수 이름만 표시
- 왼쪽 메뉴 PNG 아이콘 연결
- 지도 도시 마커 공통 버튼 배경 제거
- UI 프레임 9-slice 적용
- 시대/장수/도시 이미지 폴더 및 fallback 준비

장수 이미지
- 초상화: public/resources/officers/portraits/0001.png ...
- 전신: public/resources/officers/fullbody/0001.png ...
- 번호표: officer_image_number_mapping.csv

Netlify
- netlify.toml은 GitHub public/resources를 직접 사용합니다.
- /resources/* AppDeploy 프록시는 없습니다.
