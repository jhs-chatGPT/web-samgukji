WEB SAMGUKJI v69-33 - ITEM EDITOR RESTORE / HIGH-RES ITEMS

Purpose
- Correct the v69-32 patch packaging problem that could leave an older Item Editor component on GitHub/deployment.
- Restore the intended 3-column Item Editor UI: category+item list / item detail / item editing.
- Include the real editor-v2 frame/button/input/icon PNG assets required by the UI.
- Keep all 35 high-resolution item images.
- Replace only sky-halberd.png (방천화극) with the newly approved Bangcheonhwageuk artwork.

Important
- No gameplay redesign was intentionally made in this revision.
- App.tsx is included in the patch on purpose so applying the patch to an older GitHub base also restores the correct Item Editor component.
- menu.css is included in full because it contains the editor rebuild and image-skin rules.

Patch contents
- src/App.tsx
- src/menu.css
- public/resources/ui/editor-v2/*
- public/resources/ui/editor/* (compatibility assets)
- public/resources/items/* (35 item images)
- README_V69_33_EDITOR_RESTORE.txt
