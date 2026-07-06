// Parse a GitHub unified-diff `patch` string into renderable lines with
// old/new line numbers (GitHub-style). Pure so it can be unit-tested.

export type DiffLine = {
  type: "hunk" | "add" | "del" | "context";
  text: string;
  oldNo: number | null;
  newNo: number | null;
};

const HUNK = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

export function parsePatch(patch: string): DiffLine[] {
  const out: DiffLine[] = [];
  let oldNo = 0;
  let newNo = 0;
  for (const raw of patch.split("\n")) {
    const m = raw.match(HUNK);
    if (m) {
      oldNo = Number(m[1]);
      newNo = Number(m[2]);
      out.push({ type: "hunk", text: raw, oldNo: null, newNo: null });
      continue;
    }
    if (raw.startsWith("+")) {
      out.push({ type: "add", text: raw.slice(1), oldNo: null, newNo: newNo++ });
    } else if (raw.startsWith("-")) {
      out.push({ type: "del", text: raw.slice(1), oldNo: oldNo++, newNo: null });
    } else {
      // context line (leading space) or empty
      out.push({ type: "context", text: raw.startsWith(" ") ? raw.slice(1) : raw, oldNo: oldNo++, newNo: newNo++ });
    }
  }
  return out;
}
