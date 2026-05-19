type Sprite = { min: number; w: number; h: number; rows: string[] };

const CHAR_SPRITES: Sprite[] = [
  { min: 1, w: 5, h: 4, rows: [".XXX.", "XX.XX", "XXXXX", ".X.X."] },
  { min: 3, w: 7, h: 6, rows: ["..X.X..", ".XXXXX.", "XX.X.XX", "XXXXXXX", ".X.X.X.", "X.....X"] },
  { min: 5, w: 9, h: 7, rows: ["...X.X...", "..XXXXX..", ".XX.X.XX.", "XXXXXXXXX", "X.XXXXX.X", ".X.....X.", "X.X...X.X"] },
  { min: 7, w: 11, h: 8, rows: ["..X.....X..", "...X...X...", "..XXXXXXX..", ".XX.XXX.XX.", "XXXXXXXXXXX", "X.XXXXXXX.X", "X.X.....X.X", "..XX...XX.."] },
  { min: 10, w: 13, h: 9, rows: ["X...........X", ".X.........X.", "..XXXXXXXXX..", ".XX..XXX..XX.", "XXXXXXXXXXXXX", "X..XXXXXXX..X", "X.XX.....XX.X", "..X.X...X.X..", ".X.........X."] },
  { min: 15, w: 15, h: 10, rows: ["X.............X", ".X...........X.", "..XXXXXXXXXXX..", ".XXX..XXX..XXX.", "XXXXXXXXXXXXXXX", "XX.XXXXXXXXX.XX", "X.XX.......XX.X", "..X.XX...XX.X..", ".X...........X.", "X.X.........X.X"] },
  { min: 20, w: 17, h: 11, rows: ["X...............X", ".X.............X.", "..X...........X..", "...XXXXXXXXXXX...", "..XXX..XXX..XXX..", ".XXXXXXXXXXXXXXX.", "XXXXXXXXXXXXXXXXX", "XX.XXXXXXXXXXX.XX", "X.XXX.......XXX.X", "..X..XX...XX..X..", "X.X...........X.X"] },
  { min: 30, w: 19, h: 12, rows: ["X.................X", ".X...............X.", "..X.............X..", "...X...........X...", "....XXXXXXXXXXX....", "...XXX..XXX..XXX...", "..XXXXXXXXXXXXXXX..", ".XXXXXXXXXXXXXXXXX.", "XXXXXXXXXXXXXXXXXXX", "XXX.XXXXXXXXXXX.XXX", "X.XXXX.......XXXX.X", "..XX..XX...XX..XX.."] },
  { min: 50, w: 21, h: 13, rows: ["X...................X", ".X.................X.", "..X...............X..", "...X.............X...", "....XXXXXXXXXXXXX....", "...XXXX..XXX..XXXX...", "..XXXXXXXXXXXXXXXXX..", ".XXXXXXXXXXXXXXXXXXX.", "XXXXXXXXXXXXXXXXXXXXX", "XX..XXXXXXXXXXXXX..XX", "X.XXXXX.......XXXXX.X", "..XX..XXX...XXX..XX..", "X..X.............X..X"] },
  { min: 75, w: 23, h: 15, rows: ["X.....................X", ".X...................X.", "..X.................X..", "...X...............X...", "....X.............X....", ".....XXXXXXXXXXXXX.....", "....XXXXX..X..XXXXX....", "...XXXXXXXXXXXXXXXXX...", "..XXXXXXXXXXXXXXXXXXX..", ".XXXXXXXXXXXXXXXXXXXXX.", "XXXXXXXXXXXXXXXXXXXXXXX", "XXX..XXXXXXXXXXXXX..XXX", "X.XXXXXX.......XXXXXX.X", "..XXX..XXX...XXX..XXX..", "X...X.............X...X"] },
];

export type SpriteData = {
  w: number;
  h: number;
  rects: { x: number; y: number; w: number }[];
};

export function getSpriteData(level: number): SpriteData {
  let sprite = CHAR_SPRITES[0];
  for (let i = CHAR_SPRITES.length - 1; i >= 0; i--) {
    if (level >= CHAR_SPRITES[i].min) {
      sprite = CHAR_SPRITES[i];
      break;
    }
  }
  const rects: { x: number; y: number; w: number }[] = [];
  for (let y = 0; y < sprite.rows.length; y++) {
    const row = sprite.rows[y];
    let x = 0;
    while (x < row.length) {
      if (row[x] === "X") {
        let runLen = 1;
        while (x + runLen < row.length && row[x + runLen] === "X") runLen++;
        rects.push({ x, y, w: runLen });
        x += runLen;
      } else {
        x++;
      }
    }
  }
  return { w: sprite.w, h: sprite.h, rects };
}
