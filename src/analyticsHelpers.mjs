// Helpers for Question analytics. They only LABEL answers for admins; they never decide marks.
// Levenshtein distance, stopping early once it exceeds max. Used only to LABEL rejected answers as
// spelling mistakes in analytics — never for marking.
export function editDistanceWithin(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, k) => k);
  for (let x = 1; x <= a.length; x += 1) {
    const cur = [x];
    let rowMin = cur[0];
    for (let y = 1; y <= b.length; y += 1) {
      cur[y] = Math.min(prev[y] + 1, cur[y - 1] + 1, prev[y - 1] + (a[x - 1] === b[y - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[y]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

// How a rejected answer relates to the key, for review only:
//   "variant:<kind>"  differs only by article, spacing, plural ending or one extra/missing word — could be
//                     acceptable; an admin decides via Fix key.
//   "spelling"        a misspelling of an accepted answer (1–2 letters) — stays wrong under IELTS rules.
//   ""                anything else.
export function classifyRejectedAnswer(wrongCanon, acceptedList) {
  if (!wrongCanon) return "";
  const strip = (v) => v.replace(/^(the|a|an) /, "");
  const words = (v) => v.split(" ").filter(Boolean);
  for (const acc of acceptedList) {
    if (!acc || acc === wrongCanon) continue;
    if (strip(acc) === strip(wrongCanon)) return "variant:article";
    if (acc.replace(/ /g, "") === wrongCanon.replace(/ /g, "")) return "variant:spacing";
    if (acc.replace(/(es|s)$/, "") === wrongCanon.replace(/(es|s)$/, "")) return "variant:plural";
    const a = words(acc);
    const w = words(wrongCanon);
    if (Math.abs(a.length - w.length) === 1) {
      const [shorter, longer] = a.length < w.length ? [a, w] : [w, a];
      if (shorter.length && shorter.every((x) => longer.includes(x))) return "variant:extra-or-missing-word";
    }
  }
  for (const acc of acceptedList) {
    if (!acc || acc.length < 4 || /^\d/.test(acc)) continue;
    const max = acc.length <= 6 ? 1 : 2;
    const d = editDistanceWithin(wrongCanon, acc, max);
    if (d >= 1 && d <= max) return "spelling";
  }
  return "";
}

