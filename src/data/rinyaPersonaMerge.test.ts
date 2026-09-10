import { describe, it, expect } from "vitest";
import { RINYA_PERSONA, withCmsPersona } from "./rinya-persona";

describe("withCmsPersona", () => {
  it("CMS の口調ルールを反映する", () => {
    const merged = withCmsPersona(RINYA_PERSONA, { toneRules: ["ルールA"], privateFacts: [] });
    expect(merged.toneRules).toEqual(["ルールA"]);
  });

  it("非公開の事実は既定の facts の後ろに足す（表示済みの事実を消さない）", () => {
    const merged = withCmsPersona(RINYA_PERSONA, { toneRules: [], privateFacts: ["好きな食べ物は二郎"] });
    expect(merged.facts.slice(0, RINYA_PERSONA.facts.length)).toEqual(RINYA_PERSONA.facts);
    expect(merged.facts.at(-1)).toBe("好きな食べ物は二郎");
  });

  it("CMS が空なら既定値のまま（＝口調を装わない中立的な回答になる）", () => {
    const merged = withCmsPersona(RINYA_PERSONA, { toneRules: [], privateFacts: [] });
    expect(merged).toEqual({ ...RINYA_PERSONA, examples: [] });
  });

  it("発言例を渡すと few-shot に載る", () => {
    const merged = withCmsPersona(RINYA_PERSONA, { toneRules: [], privateFacts: [] }, [
      { question: "好きな食べ物は？", answer: "回答A" },
    ]);
    expect(merged.examples).toEqual([{ question: "好きな食べ物は？", answer: "回答A" }]);
  });

  it("元のオブジェクトを書き換えない", () => {
    const before = [...RINYA_PERSONA.facts];
    withCmsPersona(RINYA_PERSONA, { toneRules: ["x"], privateFacts: ["y"] });
    expect(RINYA_PERSONA.facts).toEqual(before);
  });
});
