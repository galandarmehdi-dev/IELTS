// Reference data for Academic Writing Task 1 visuals, keyed by the exam id stored with each submission
// (column B of the Writing sheet, e.g. "ielts-full-024"). The grader receives these as the authoritative
// source for figures and key features; the image (when attached) is used for anything not listed here.
//
// Rules for adding an entry:
// - Read every value from the visual itself; give approximate values as "about N" and say how precise the
//   reading is. Never invent a value. A category with no bar/value is "no data", never zero.
// - List only key features that are certain from the visual (rankings, exceptions, directions of change).
// - Record who read the visual and when, and set `status` to "admin_checked" only after a person has
//   compared the entry with the visual.

export const TASK1_FACTS = {
  "ielts-full-024": {
    status: "read_from_image",
    readBy: "Claude (code audit), 27 Nov 2026 — values read by eye, about ±1 percentage point",
    visual: "https://practicepteonline.com/wp-content/uploads/2024/09/test-105-min.png",
    facts: `Visual: one bar chart, "Coffee and tea buying and drinking habits in five cities in Australia". Y-axis: percentage of city residents; the axis starts at 20%, not 0%. Three categories per city: bought fresh coffee in the last 4 weeks; bought instant coffee in the last 4 weeks; went to a café for coffee or tea in the last 4 weeks. One survey, no time series.
Approximate values (fresh / instant / café):
- Sydney: about 44 / about 45-46 / about 61
- Melbourne: about 42 / about 48-49 / about 63-64 (highest café figure)
- Brisbane: about 34-35 (lowest fresh figure) / about 53 / about 55-56
- Adelaide: about 35 / about 50 / about 49-50 (café is the lowest café figure; instant and café are about equal, instant marginally higher)
- Hobart: about 39 / about 54-55 (highest instant figure) / about 63
Key features (certain):
- Going to a café is the most common habit in four cities (Sydney, Melbourne, Brisbane, Hobart); in Adelaide café and instant coffee are about level.
- Buying fresh coffee is the least common habit in all five cities.
- Instant coffee is above fresh coffee in all five cities; in Sydney the two are close (about 1-2 points apart).
- Café figures: Melbourne and Hobart highest (about 63), Sydney about 61, Brisbane about 55-56, Adelaide lowest (about 50).
- Fresh coffee: Sydney and Melbourne highest (about 42-44), Brisbane and Adelaide lowest (about 35).
- The gap between café visits and fresh coffee is largest in Hobart (about 24 points) and smallest in Adelaide (about 15 points).`,
  },
  "ielts-full-025": {
    status: "read_from_image",
    readBy: "Claude (code audit), 27 Nov 2026 — values read by eye, about ±1 hour",
    visual: "https://bgujwyknnszwborgbkxq.supabase.co/storage/v1/object/public/exam-media/ieltsmock/abd4da16-ef99-4b1d-b4e5-2226e79dfd54.png",
    facts: `Visual: one bar chart, "Leisure time in a typical week in hours, by sex and employment status, 1998-99". Y-axis: hours per week (0-100). Five employment categories; male and female bars. One period (1998-99), no time series and no days of the week.
Approximate values (male / female):
- Employed (full time): about 44 / about 37
- Employed (part time): NO DATA for men (no bar; this is missing data, not zero) / about 40
- Unemployed: about 85 / about 78
- Retired: about 83-84 / about 78
- Housewives: NO DATA for men / about 50
Key features (certain):
- Unemployed and retired people have by far the most leisure time (about 78-85 hours), roughly double that of employed people (about 37-44 hours).
- In every category with figures for both sexes (full-time employed, unemployed, retired), men have more leisure time than women (by about 5-7 hours).
- The highest figure is unemployed men (about 85); the lowest is full-time employed women (about 37).
- Part-time employed women (about 40) and housewives (about 50) are shown for women only; housewives have more leisure than employed women but much less than unemployed or retired women.
- Unemployed and retired figures are very similar to each other for each sex.`,
  },
};

/** Reference text for an exam id, or "" when none exists. Accepts "ielts-full-024", "ielts24", "024". */
export function task1FactsFor(examId) {
  const raw = String(examId || "").trim().toLowerCase();
  if (!raw) return "";
  if (TASK1_FACTS[raw]) return TASK1_FACTS[raw].facts;
  // Only plain exam numbers; imported ids ("imp-full-…-a51e4ce4") end in hex and must not match.
  const m = raw.match(/^(?:ielts(?:-full)?-?)?(\d{1,3})$/);
  if (!m) return "";
  const key = `ielts-full-${m[1].padStart(3, "0")}`;
  return TASK1_FACTS[key] ? TASK1_FACTS[key].facts : "";
}
