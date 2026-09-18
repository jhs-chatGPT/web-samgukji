WEB SAMGUKJI - v69-19 NEW GAME SELECTION UI
Date: 2026-09-19

Applied changes
1. New game progress strip
   - Center aligned: 01 시대 선택 / 02 장수 선택 / 03 도시 선택.

2. Era selection
   - Era-list body and rows now use the same opaque navy-black surface as the era-list title area.
   - The description panel directly below the scenario image is fully opaque.
   - Existing reusable ornate frame assets remain in use.

3. Officer selection
   - Removed the visual separation of the former officer-image area.
   - Left side is now one ornate frame containing fixed-width officer artwork + fluid officer information.
   - Officer artwork width stays fixed on normal desktop widths; information takes remaining space.
   - Right officer roster resizes with browser width.
   - Officer roster title, search field, and count are arranged on a single line.
   - Existing reusable frame-panel asset is used for both the main officer panel and roster panel.
   - Responsive fallbacks are included for narrower screens.

Source changed
- src/menu.css
