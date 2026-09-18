Web Samgukji v69-22 - City Select UI

Base: v69-21 full

Changes
- Rebuilt the city-selection screen around the approved reference UI.
- Expanded the setup body to use the browser width instead of a narrow centered column.
- Centered 01 / 02 / 03 setup-step labels.
- Added ornate reusable UI-frame treatment to the map panel and selected-city panel.
- Kept the world-map image, city marker JSX, marker coordinates, marker icons and marker rendering rules unchanged.
  Only the containing map area is allowed to resize with the browser.
- Selected-city panel now shows: city name, region, ruler, population, security, commerce, agriculture, defense, and city trait/description.
- Changed the final start button label to "시작" and aligned Back / Start beneath the right detail panel.
- Custom-force color / starting custom-officer options remain available inside the right panel.

Validation
- App.tsx was syntax-checked with TypeScript transpileModule.
- Full npm build was not completed because npm dependency installation stalled in the current sandbox.
