import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Canvas API for happy-dom
HTMLCanvasElement.prototype.getContext = function() {
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    roundRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    measureText: vi.fn((text: string) => ({
      width: text.length * 7,
      height: 14,
      actualBoundingBoxAscent: 7,
      actualBoundingBoxDescent: 7,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: text.length * 7,
      fontBoundingBoxAscent: 7,
      fontBoundingBoxDescent: 7,
    })),
    font: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  } as any
}