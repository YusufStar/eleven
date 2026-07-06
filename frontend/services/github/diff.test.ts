import { test, expect } from "bun:test";
import { parsePatch } from "./diff";

test("parsePatch numbers lines from the hunk header", () => {
  const patch = ["@@ -1,3 +1,4 @@", " context", "-old line", "+new line", "+added", " tail"].join("\n");
  const lines = parsePatch(patch);
  expect(lines[0].type).toBe("hunk");
  // context starts at old 1 / new 1
  expect(lines[1]).toMatchObject({ type: "context", oldNo: 1, newNo: 1, text: "context" });
  // deletion consumes an old line only
  expect(lines[2]).toMatchObject({ type: "del", oldNo: 2, newNo: null, text: "old line" });
  // additions consume new lines only
  expect(lines[3]).toMatchObject({ type: "add", oldNo: null, newNo: 2, text: "new line" });
  expect(lines[4]).toMatchObject({ type: "add", oldNo: null, newNo: 3, text: "added" });
  // tail context: old advanced past the deletion, new past the additions
  expect(lines[5]).toMatchObject({ type: "context", oldNo: 3, newNo: 4, text: "tail" });
});
