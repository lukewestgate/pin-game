import { describe, expect, it } from 'vitest';
import { parseModel } from '../src/content/loader';
import { rayCheck } from '../src/dev/ray-check';

const box = (position: number[], size: number[] = [1, 1, 1]) => ({
  kind: 'box',
  size,
  position,
  colour: '#8fa7c4',
});

/** A floor box at the origin with a Socket on top, and a lid box floating 2 above it. */
function stack(coveredBy: string[], lidPosition = [0, 2, 0]) {
  return parseModel(
    {
      id: 'stack',
      formatVersion: 1,
      parts: [
        {
          id: 'floor',
          shapes: [box([0, 0, 0])],
          sockets: [{ id: 'bolt', position: [0, 0.5, 0], direction: [0, 1, 0], coveredBy }],
        },
        { id: 'lid', shapes: [box(lidPosition)], sockets: [] },
      ],
    },
    'stack.json',
  );
}

describe('ray check', () => {
  it('stays quiet when the Parts hit are exactly the coveredBy list', () => {
    expect(rayCheck(stack(['lid']))).toEqual([]);
  });

  it('warns about a Part the ray hits that coveredBy omits', () => {
    const [w, ...rest] = rayCheck(stack([]));
    expect(rest).toEqual([]);
    expect(w).toMatchObject({ socket: 'bolt', part: 'floor', missing: [], extra: ['lid'] });
    expect(w?.message).toContain('bolt');
    expect(w?.message).toContain('lid');
  });

  it('warns about a listed Part the ray misses', () => {
    const [w] = rayCheck(stack(['lid'], [5, 2, 0]));
    expect(w).toMatchObject({ socket: 'bolt', missing: ['lid'], extra: [] });
  });

  it('follows the Part transform: a rotated Part turns the pull-out axis', () => {
    const model = parseModel(
      {
        id: 'turned',
        formatVersion: 1,
        parts: [
          {
            id: 'side',
            rotation: [0, 0, -Math.PI / 2], // local +Y now points along world +X
            shapes: [box([0, 0, 0])],
            sockets: [
              { id: 'peg', position: [0, 0.5, 0], direction: [0, 1, 0], coveredBy: ['cap'] },
            ],
          },
          { id: 'cap', shapes: [box([3, 0, 0])], sockets: [] },
        ],
      },
      'turned.json',
    );
    expect(rayCheck(model)).toEqual([]);
  });

  it('never hits behind the Socket', () => {
    const model = parseModel(
      {
        id: 'behind',
        formatVersion: 1,
        parts: [
          {
            id: 'floor',
            shapes: [box([0, 0, 0])],
            sockets: [{ id: 'bolt', position: [0, 0.5, 0], direction: [0, 1, 0], coveredBy: [] }],
          },
          { id: 'under', shapes: [box([0, -3, 0])], sockets: [] },
        ],
      },
      'behind.json',
    );
    expect(rayCheck(model)).toEqual([]);
  });
});
