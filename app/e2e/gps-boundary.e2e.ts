import { expect, test } from '@playwright/test';

test.describe('Field GPS boundary workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const position = {
        coords: {
          latitude: 26.463704,
          longitude: 87.274993,
          accuracy: 91,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({}),
        },
        timestamp: Date.now(),
        toJSON: () => ({}),
      };
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          watchPosition(success: PositionCallback) {
            window.setTimeout(() => success(position as GeolocationPosition), 20);
            return 1;
          },
          clearWatch() {},
          getCurrentPosition(success: PositionCallback) {
            window.setTimeout(() => success(position as GeolocationPosition), 20);
          },
        },
      });
    });
    await page.goto('/#gps');
  });

  test('recovers from poor GPS by drawing, panning and editing the boundary', async ({ page }) => {
    await page.getByRole('button', { name: 'Start precise location' }).click();
    await expect(page.getByText('±91 m', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Record GPS corner 1/ })).toBeDisabled();
    await expect(page.getByText(/GPS capture is paused because ±91 m exceeds/)).toBeVisible();

    await page.getByRole('button', { name: 'Draw corners', exact: true }).click();
    const canvas = page.getByTestId('gps-map-canvas');
    await canvas.click({ position: { x: 420, y: 260 } });
    await canvas.click({ position: { x: 580, y: 270 } });
    await canvas.click({ position: { x: 540, y: 420 } });

    await expect(page.getByTestId('gps-corner-1')).toBeVisible();
    await expect(page.getByTestId('gps-corner-2')).toBeVisible();
    await expect(page.getByTestId('gps-corner-3')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save project' })).toBeEnabled();

    const areaCard = page.getByText('Estimated area', { exact: true }).locator('..');
    const areaText = await areaCard.textContent();
    const area = Number(areaText?.match(/([\d,.]+) ft²/)?.[1].replaceAll(',', '') ?? 0);
    expect(area).toBeGreaterThan(1);
    expect(area).toBeLessThan(1_000_000);

    const firstMarker = page.getByTestId('gps-corner-1');
    const markerBeforePan = await firstMarker.getAttribute('style');
    await page.getByRole('button', { name: 'Move', exact: true }).click();
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    if (!canvasBox) return;
    await page.mouse.move(canvasBox.x + 600, canvasBox.y + 330);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + 380, canvasBox.y + 330, { steps: 5 });
    await page.mouse.up();
    await expect.poll(() => firstMarker.getAttribute('style')).not.toBe(markerBeforePan);

    const markerBox = await firstMarker.boundingBox();
    expect(markerBox).not.toBeNull();
    if (!markerBox) return;
    await page.mouse.move(markerBox.x + markerBox.width / 2, markerBox.y + markerBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(markerBox.x + markerBox.width / 2 + 45, markerBox.y + markerBox.height / 2 + 30, { steps: 4 });
    await page.mouse.up();
    await expect(page.getByText('Corner 1 moved.')).toBeVisible();
    await expect(page.getByTestId('gps-corner-3')).toBeVisible();
  });

  test('can zoom and recenter without losing drawn corners', async ({ page }) => {
    await page.getByRole('button', { name: 'Draw corners', exact: true }).click();
    const canvas = page.getByTestId('gps-map-canvas');
    await canvas.click({ position: { x: 450, y: 260 } });
    await canvas.click({ position: { x: 570, y: 280 } });
    await canvas.click({ position: { x: 520, y: 410 } });
    await page.getByRole('button', { name: 'Zoom map in' }).click();
    await page.getByRole('button', { name: 'Recenter map' }).click();
    await expect(page.getByTestId('gps-corner-1')).toBeVisible();
    await expect(page.getByTestId('gps-corner-2')).toBeVisible();
    await expect(page.getByTestId('gps-corner-3')).toBeVisible();
  });
});