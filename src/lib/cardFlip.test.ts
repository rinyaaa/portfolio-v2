import { describe, it, expect } from "vitest";
import {
  normalizeRotation,
  rotationFromDrag,
  snapToNearestFace,
  isBackFace,
  toggleRotation,
  FRONT_ROTATION,
  BACK_ROTATION,
} from "./cardFlip";

describe("normalizeRotation", () => {
  it("0〜360未満はそのまま", () => {
    expect(normalizeRotation(90)).toBe(90);
  });

  it("360以上は折り返す", () => {
    expect(normalizeRotation(450)).toBe(90);
  });

  it("負の値も0〜360に収める", () => {
    expect(normalizeRotation(-90)).toBe(270);
  });
});

describe("rotationFromDrag", () => {
  it("開始角にドラッグ量×感度を足す", () => {
    expect(rotationFromDrag(0, 100, 0.5)).toBe(50);
  });

  it("逆方向のドラッグはマイナス", () => {
    expect(rotationFromDrag(180, -100, 0.5)).toBe(130);
  });
});

describe("snapToNearestFace", () => {
  it("表に近ければ0へ", () => {
    expect(snapToNearestFace(20)).toBe(0);
  });

  it("裏に近ければ180へ", () => {
    expect(snapToNearestFace(160)).toBe(180);
  });

  it("何周しても同じ向きの倍数に丸める", () => {
    expect(snapToNearestFace(460)).toBe(540);
    expect(snapToNearestFace(-460)).toBe(-540);
  });

  it("ちょうど中間は裏側に倒す（Math.roundの仕様）", () => {
    expect(snapToNearestFace(90)).toBe(180);
  });
});

describe("isBackFace", () => {
  it("0度は表", () => {
    expect(isBackFace(FRONT_ROTATION)).toBe(false);
  });

  it("180度は裏", () => {
    expect(isBackFace(BACK_ROTATION)).toBe(true);
  });

  it("360度周期で判定する", () => {
    expect(isBackFace(540)).toBe(true);
    expect(isBackFace(720)).toBe(false);
  });

  it("負の回転でも判定できる", () => {
    expect(isBackFace(-180)).toBe(true);
    expect(isBackFace(-360)).toBe(false);
  });
});

describe("toggleRotation", () => {
  it("表から裏へ180度進む", () => {
    expect(toggleRotation(0)).toBe(180);
  });

  it("裏から表へさらに180度進む（同じ向きに回り続ける）", () => {
    expect(toggleRotation(180)).toBe(360);
  });

  it("ドラッグ中の半端な角度から呼んでも吸着してからトグルする", () => {
    expect(toggleRotation(20)).toBe(180);
  });
});
