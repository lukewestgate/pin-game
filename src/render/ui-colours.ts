// The Workbench colour roles (UI visual style). The CSS in style.css repeats these as custom
// properties; test/ui-contrast.test.ts guards the text pairings.

export const UI = {
  ink: '#13202a',
  surface: '#2c3f49',
  teal: '#129fc0',
  tealEdge: '#0b6f86',
  go: '#3ccf4e',
  goEdge: '#228a31',
  gold: '#ffd60a',
  goldEdge: '#b39300',
  slate: '#5a6b75',
  fail: '#ff3b47',
  amber: '#ffb020',
  bufferMat: '#1b272d',
  bufferSlot: '#0f1a1f',
  greyBox: '#6b7780',
} as const;
