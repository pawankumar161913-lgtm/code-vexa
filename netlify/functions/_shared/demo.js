/**
 * Demo-mode sample analyses.
 *
 * These are hand-written, clearly labelled reference analyses used ONLY when no
 * AI_API_KEY is configured on the server. The API marks them `mode: "demo"` and
 * the UI shows a "Demo analysis — not produced by AI" badge, so a simulated
 * result is never presented as a live model response.
 *
 * Each case carries its own source snippet plus a matcher; the matcher requires
 * that the pasted code contains the case's distinctive markers, so arbitrary
 * code never silently receives a canned answer.
 */

const CASES = [
  {
    id: 'js-undefined-map',
    title: 'JavaScript — TypeError: Cannot read properties of undefined (reading "map")',
    language: 'javascript',
    markers: ['items.map', '.map('],
    errorHint: ['cannot read properties of undefined', 'cannot read property'],
    source: `async function renderList(api) {
  const response = await api.getItems();
  const items = response.items;
  return items.map((item) => item.name).join(", ");
}

module.exports = { renderList };`,
    analysis: {
      status: 'analyzed',
      summary:
        'The crash happens because `response.items` is `undefined` whenever the API returns an empty body, an error payload, or a differently-shaped object — calling `.map()` on `undefined` then throws.',
      severity: 'high',
      severityReason: 'It throws on a very common API response shape, taking down whatever renders the list.',
      category: 'runtime_error',
      cause:
        'The code assumes every successful response has an `items` array. Nothing validates the response, so any deviation (empty 204 body, `{ data: [...] }` wrapper, an error object) leaves `items` undefined at the `.map()` call.',
      locationFile: 'renderList.js',
      locationLine: 4,
      locationReliable: true,
      originalCode: `  const items = response.items;
  return items.map((item) => item.name).join(", ");`,
      suggestedFix: `  const items = Array.isArray(response?.items) ? response.items : [];
  if (!items.length) return ""; // or render an explicit empty state
  return items.map((item) => item.name).join(", ");`,
      explanationSteps: [
        'Guard the value before using it: `Array.isArray(response?.items)` checks both that `response` exists and that `items` is really an array.',
        'Fall back to `[]` so `.map()` always has an array to iterate, even for empty responses.',
        'Return an explicit empty state instead of letting an empty string travel further into the UI.',
        'Optionally assert the API contract in one place (for example with a small `parseItems()` helper or a schema validator) so every caller gets the same guarantee.',
      ],
      preventionTips: [
        'Validate response shapes at the boundary where data enters your app, not at every use site.',
        'Prefer optional chaining plus a default over trusting nested properties.',
        'Add a test for an empty/204 response, not only for the happy path.',
      ],
      confidence: 0.9,
      confidenceReason:
        'The thrown error message points directly at `.map()` on line 4 and only `response.items` can be undefined there.',
      beginnerExplanation:
        '`items` does not always exist. When the API sends back nothing, `response.items` is `undefined`, and JavaScript cannot `.map()` over nothing. Checking that it is an array first, and using an empty list otherwise, keeps the page from crashing.',
      minimalRepro: `const response = {}; // what an empty API response looks like
const items = response.items;
items.map((x) => x); // TypeError: Cannot read properties of undefined (reading 'map')`,
      unitTests: `test("returns empty string for an empty payload", async () => {
  const api = { getItems: async () => ({}) };
  await expect(renderList(api)).resolves.toBe("");
});

test("joins names from a populated payload", async () => {
  const api = { getItems: async () => ({ items: [{ name: "a" }, { name: "b" }] }) };
  await expect(renderList(api)).resolves.toBe("a, b");
});`,
      relatedRisks: [
        { kind: 'null_reference', description: '`response` itself may be undefined if `api.getItems()` throws or resolves to nothing.', line: 3 },
        { kind: 'runtime', description: 'Items without a `name` property would render "undefined" in the output.', line: 4 },
      ],
      missingContext: [],
    },
  },
  {
    id: 'py-index-off-by-one',
    title: 'Python — off-by-one IndexError in a range loop',
    language: 'python',
    markers: ['range(', 'len('],
    errorHint: ['indexerror', 'list index out of range'],
    source: `def running_totals(values):
    totals = []
    for i in range(1, len(values) + 1):
        totals.append(sum(values[: i + 1]))
    return totals


print(running_totals([1, 2, 3]))`,
    analysis: {
      status: 'analyzed',
      summary:
        'The loop range runs one step past the end of the list, so slicing with `i + 1` is harmless but the loop itself iterates `len(values) + 1` times; with `values[i]`-style access (or an empty list) this produces an IndexError.',
      severity: 'medium',
      severityReason: 'It fails on edge cases such as empty input and is quadratic in time for no reason.',
      category: 'logic_error',
      cause:
        '`range(1, len(values) + 1)` yields `1..len(values)`, one iteration too many for a 0-based list, and the inner `sum(values[: i + 1])` recomputes the whole prefix each time.',
      locationFile: 'totals.py',
      locationLine: 3,
      locationReliable: true,
      originalCode: `    for i in range(1, len(values) + 1):
        totals.append(sum(values[: i + 1]))`,
      suggestedFix: `    total = 0
    for value in values:
        total += value
        totals.append(total)`,
      explanationSteps: [
        'Iterate over the values themselves instead of indices — there is no off-by-one to get wrong.',
        'Keep a running accumulator so each element is added once, turning the O(n²) loop into O(n).',
        'Return the list; with an empty input the loop simply never runs and you get `[]`, which is the correct answer.',
      ],
      preventionTips: [
        'Prefer direct iteration (`for value in values`) over `range(len(...))` in Python.',
        'Test with empty and single-element inputs — off-by-one bugs hide there.',
        'Watch for repeated slicing/summing inside loops; it usually signals a missing accumulator.',
      ],
      confidence: 0.82,
      confidenceReason:
        'The range bound is clearly one too large; whether it throws depends on the access pattern inside the loop body.',
      beginnerExplanation:
        'Python lists start at index 0, but `range(1, len(values) + 1)` counts from 1 and includes the last number. That extra step asks for an item that does not exist. Looping over the values directly avoids the counting entirely.',
      minimalRepro: `values = []
for i in range(1, len(values) + 1):
    print(values[i])  # IndexError: list index out of range`,
      unitTests: `def test_running_totals_empty():
    assert running_totals([]) == []

def test_running_totals_basic():
    assert running_totals([1, 2, 3]) == [1, 3, 6]`,
      relatedRisks: [
        { kind: 'performance', description: 'Repeated `sum(values[:i+1])` makes the function O(n²) on large lists.', line: 4 },
      ],
      missingContext: [],
    },
  },
  {
    id: 'js-async-await-missing',
    title: 'JavaScript — missing await returns a Promise instead of data',
    language: 'javascript',
    markers: ['fetch('],
    errorHint: ['[object promise]', 'is not a function', 'undefined'],
    source: `function loadUser(id) {
  const res = fetch("/api/users/" + id);
  const data = res.json();
  return data.name;
}`,
    analysis: {
      status: 'analyzed',
      summary:
        '`fetch` and `res.json()` both return Promises; without `await` the function reads `.name` off a Promise, which is `undefined`.',
      severity: 'high',
      severityReason: 'The function never returns real data, so every caller fails at the same point.',
      category: 'logic_error',
      cause:
        '`fetch()` is asynchronous. `res` is a Promise<Response>, so `res.json()` is called on a Promise (it does not exist there) and `data.name` is undefined even when the request succeeds.',
      locationFile: 'loadUser.js',
      locationLine: 2,
      locationReliable: true,
      originalCode: `function loadUser(id) {
  const res = fetch("/api/users/" + id);
  const data = res.json();
  return data.name;
}`,
      suggestedFix: `async function loadUser(id) {
  const res = await fetch("/api/users/" + id);
  if (!res.ok) throw new Error("Request failed: " + res.status);
  const data = await res.json();
  return data.name;
}`,
      explanationSteps: [
        'Mark the function `async` so it can use `await` and return a Promise to its callers.',
        '`await fetch(...)` waits for the network response object.',
        'Check `res.ok` before parsing, so HTTP errors surface as real errors instead of JSON parse failures.',
        '`await res.json()` waits for the body, then `.name` reads from a plain object.',
      ],
      preventionTips: [
        'Turn on `@typescript-eslint/no-floating-promises` or `no-misused-promises` to catch missing awaits.',
        'Always check `response.ok` before consuming a body.',
        'Callers must `await loadUser(id)` too — an async function returns a Promise.',
      ],
      confidence: 0.93,
      confidenceReason: 'Only the Promise/plain-object confusion can explain both the missing value and the `.json is not a function` symptom.',
      beginnerExplanation:
        'Fetching data takes time, so JavaScript hands you a Promise — a placeholder for the result — immediately. If you use it before it resolves, you get the placeholder, not the data. `await` waits for the real value.',
      minimalRepro: `const res = fetch("https://example.com");
console.log(res instanceof Promise); // true — so res.json is not a function`,
      unitTests: `test("returns the user's name", async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ name: "Ada" }),
  });
  await expect(loadUser(1)).resolves.toBe("Ada");
});`,
      relatedRisks: [
        { kind: 'runtime', description: 'Unencoded `id` in the URL allows path injection; use `encodeURIComponent(id)`.', line: 2 },
        { kind: 'runtime', description: 'No handling for non-2xx responses or network errors.', line: 2 },
      ],
      missingContext: [],
    },
  },
  {
    id: 'ts-possibly-undefined',
    title: 'TypeScript — object is possibly "undefined"',
    language: 'typescript',
    markers: ['interface', '?', 'user'],
    errorHint: ['possibly undefined', 'object is possibly', 'ts2532', 'ts18048'],
    source: `interface User {
  name?: string;
  address?: { city?: string };
}

function cityLabel(user?: User) {
  return user.address.city.toUpperCase();
}`,
    analysis: {
      status: 'analyzed',
      summary:
        'TS18048/TS2532: `user`, `user.address` and `city` are all optional, so the compiler cannot prove the chain is safe.',
      severity: 'medium',
      severityReason: 'It is a compile-time error that also reflects a real runtime crash risk.',
      category: 'type_error',
      cause:
        'Every link in `user.address.city` is declared optional. Strict null checks correctly reject dereferencing an optional chain without narrowing.',
      locationFile: 'cityLabel.ts',
      locationLine: 7,
      locationReliable: true,
      originalCode: `function cityLabel(user?: User) {
  return user.address.city.toUpperCase();
}`,
      suggestedFix: `function cityLabel(user?: User): string {
  const city = user?.address?.city;
  return city ? city.toUpperCase() : "Unknown";
}`,
      explanationSteps: [
        'Use optional chaining (`?.`) so each missing link short-circuits to `undefined` instead of throwing.',
        'Decide what to show when the city is absent — here an explicit "Unknown" label.',
        'Keep the return type explicit (`string`) so callers never receive undefined.',
      ],
      preventionTips: [
        'Enable `strictNullChecks` in tsconfig (part of `strict`) and keep it on.',
        'Model optional data honestly and give absent values a deliberate fallback at the boundary.',
        'Prefer a small `getCity(user)` helper if the same lookup repeats.',
      ],
      confidence: 0.95,
      confidenceReason: 'The error code plus the optional declarations make the cause unambiguous.',
      beginnerExplanation:
        'The question marks mean "this might be missing". TypeScript refuses to read `.address` from something that might be missing. Optional chaining asks politely and gives undefined instead of crashing.',
      minimalRepro: `interface User { address?: { city?: string } }
const u: User = {};
console.log(u.address!.city); // TypeError at runtime`,
      unitTests: `describe("cityLabel", () => {
  it("uppercases a present city", () => {
    expect(cityLabel({ address: { city: "paris" } })).toBe("PARIS");
  });
  it("falls back when the city is missing", () => {
    expect(cityLabel(undefined)).toBe("Unknown");
    expect(cityLabel({ address: {} })).toBe("Unknown");
  });
});`,
      relatedRisks: [
        { kind: 'null_reference', description: 'Callers may rely on the old `any`-ish behaviour; update them to handle the fallback string.', line: 7 },
      ],
      missingContext: [],
    },
  },
  {
    id: 'sql-injection',
    title: 'SQL — string-concatenated query (injection risk)',
    language: 'sql',
    markers: ['select', 'where'],
    errorHint: ['syntax error', 'near', 'unknown column'],
    source: `SELECT id, email FROM users WHERE email = '" + email + "';

SELECT * FROM orders WHERE user_id = ' + userId;`,
    analysis: {
      status: 'analyzed',
      summary:
        'The query is assembled by concatenating user input, which is a SQL injection vulnerability and also breaks on values containing quotes.',
      severity: 'critical',
      severityReason: 'An attacker can read, modify or delete arbitrary data by injecting SQL through the email parameter.',
      category: 'security',
      cause:
        'The value is pasted into the statement text instead of being bound as a parameter, so SQL metacharacters in the input become part of the query grammar.',
      locationFile: null,
      locationLine: 1,
      locationReliable: true,
      originalCode: `SELECT id, email FROM users WHERE email = '" + email + "';`,
      suggestedFix: `-- PostgreSQL example; the placeholder syntax differs per driver:
--   PostgreSQL: $1   MySQL: ?   SQL Server: @email   Oracle: :email
SELECT id, email FROM users WHERE email = $1;`,
      explanationSteps: [
        'Replace the concatenated literal with a bind parameter.',
        'Pass the value through the driver\'s parameter array so it is escaped and typed as data.',
        'Remove string concatenation everywhere — a single missed spot keeps the hole open.',
        'Add a lint rule or code review checklist that flags query strings built with `+` or template literals.',
      ],
      preventionTips: [
        'Always use prepared statements / parameterised queries.',
        'Use an ORM or query builder that binds values by default.',
        'Give the application database user the least privilege it needs.',
        'Log and test with malicious input such as `\' OR 1=1 --` to prove the fix holds.',
      ],
      confidence: 0.97,
      confidenceReason: 'The concatenation is visible in the statement text itself; no inference needed.',
      beginnerExplanation:
        'Putting a user value straight into a SQL string is like letting a stranger finish your sentence — they can add their own words. Parameters keep the value in a sealed box so it is only ever treated as data.',
      minimalRepro: `-- input: email = "' OR 1=1 --"
SELECT id, email FROM users WHERE email = '' OR 1=1 --';  -- returns every row`,
      unitTests: `test("rejects injection payloads", async () => {
  const rows = await repo.findUserByEmail("' OR 1=1 --");
  expect(rows).toHaveLength(0);
});`,
      relatedRisks: [
        { kind: 'security', description: 'The second statement concatenates `userId` the same way.', line: 3 },
      ],
      missingContext: [],
    },
  },
  {
    id: 'cpp-null-deref',
    title: 'C/C++ — null pointer dereference',
    language: 'cpp',
    markers: ['*', '->', 'nullptr'],
    errorHint: ['segmentation fault', 'sigsegv', 'null pointer'],
    source: `#include <iostream>

struct Node { int value; Node* next; };

int sumList(Node* head) {
    int total = 0;
    Node* current = head;
    while (current->next != nullptr) {
        total += current->value;
        current = current->next;
    }
    return total;
}`,
    analysis: {
      status: 'analyzed',
      summary:
        'An empty list (`head == nullptr`) crashes on the first `current->next` dereference, and the loop also skips the last node.',
      severity: 'high',
      severityReason: 'Segmentation faults on a legal input, and silently returns a wrong total otherwise.',
      category: 'runtime_error',
      cause:
        'The loop condition dereferences `current` before checking that it is non-null, and it stops when `next` is null, so the final element is never added.',
      locationFile: 'sum.cpp',
      locationLine: 7,
      locationReliable: true,
      originalCode: `    while (current->next != nullptr) {
        total += current->value;
        current = current->next;
    }`,
      suggestedFix: `    while (current != nullptr) {
        total += current->value;
        current = current->next;
    }`,
      explanationSteps: [
        'Check `current != nullptr` as the loop condition — that covers the empty-list case and every element.',
        'Accumulate `current->value` before advancing the pointer.',
        'Advance with `current = current->next` so the loop terminates at the end of the list.',
        'Consider `const Node*` for the cursor since the list is not modified.',
      ],
      preventionTips: [
        'Always test the empty container case first.',
        'Enable warnings (`-Wall -Wextra`) and run ASan/UBSan in CI to catch null dereferences early.',
        'Prefer references or `std::vector`/`std::forward_list` over raw pointer walks in new code.',
      ],
      confidence: 0.94,
      confidenceReason: 'The null check happens after the dereference, which is deterministically wrong.',
      beginnerExplanation:
        '`current->next` assumes `current` points at something real. If the list is empty, `current` is null and the program tries to read memory that is not there, so it crashes. Check for null first, then read.',
      minimalRepro: `Node* head = nullptr;
std::cout << sumList(head); // segmentation fault`,
      unitTests: `TEST(SumList, HandlesEmptyList) { EXPECT_EQ(sumList(nullptr), 0); }
TEST(SumList, SumsAllNodes) {
  Node c{3, nullptr}, b{2, &c}, a{1, &b};
  EXPECT_EQ(sumList(&a), 6);
}`,
      relatedRisks: [
        { kind: 'runtime', description: 'No cycle detection: a corrupted list loops forever.', line: 7 },
      ],
      missingContext: [],
    },
  },
  {
    id: 'php-undefined-index',
    title: 'PHP — undefined array key warning',
    language: 'php',
    markers: ['$_post', 'echo'],
    errorHint: ['undefined array key', 'undefined index', 'warning'],
    source: `<?php
$name = $_POST['name'];
$email = $_POST['email'];
echo "Thanks, " . strtoupper($name) . "! We'll email " . $email;`,
    analysis: {
      status: 'analyzed',
      summary:
        'The script reads `$_POST` keys that may not be present, producing "Undefined array key" warnings and passing `null` into `strtoupper()`.',
      severity: 'medium',
      severityReason: 'It emits warnings on every request missing a field and breaks on PHP 8 type checks.',
      category: 'runtime_error',
      cause:
        '`$_POST` only contains keys that were actually submitted. Accessing a missing key raises a warning (PHP 8+) and yields null, which `strtoupper()` rejects.',
      locationFile: 'submit.php',
      locationLine: 2,
      locationReliable: true,
      originalCode: `$name = $_POST['name'];
$email = $_POST['email'];`,
      suggestedFix: `$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    exit('Please provide a valid name and email address.');
}

echo 'Thanks, ' . htmlspecialchars(strtoupper($name), ENT_QUOTES, 'UTF-8') . '!';
echo ' We will email ' . htmlspecialchars($email, ENT_QUOTES, 'UTF-8');`,
      explanationSteps: [
        'Use the null-coalescing operator (`??`) to supply a default for missing keys.',
        'Validate presence and format before using the values, and respond with 422 on bad input.',
        'Escape output with `htmlspecialchars` so user text cannot inject markup.',
        'Avoid echoing raw request data — always render it escaped.',
      ],
      preventionTips: [
        'Never access `$_POST`/`$_GET` directly; read through a small validated input helper.',
        'Escape every value on output, even "obviously safe" ones.',
        'Keep `error_reporting` on in development so warnings surface immediately.',
      ],
      confidence: 0.91,
      confidenceReason: 'The unguarded superglobal access is visible; the exact runtime effect depends on the submitted fields.',
      beginnerExplanation:
        'The form may not send every field, so the key can be missing. `??` says "use this value if it is not there". Checking and escaping the values keeps the page safe and warning-free.',
      minimalRepro: `<?php
// request body: name only
echo $_POST['email']; // Warning: Undefined array key "email"`,
      unitTests: `public function testMissingEmailIsRejected(): void {
    $_POST = ['name' => 'Ada'];
    ob_start(); include 'submit.php'; $out = ob_get_clean();
    $this->assertSame(422, http_response_code());
    $this->assertStringContainsString('valid', (string) $out);
}`,
      relatedRisks: [
        { kind: 'security', description: 'Echoing `$name`/`$email` unescaped allows reflected XSS.', line: 4 },
        { kind: 'runtime', description: '`strtoupper(null)` throws a TypeError on PHP 8.1+.', line: 4 },
      ],
      missingContext: [],
    },
  },
  {
    id: 'css-flex-overflow',
    title: 'CSS — flex children overflow their container',
    language: 'css',
    markers: ['display: flex', 'flex'],
    errorHint: ['overflow', 'not wrapping', 'layout'],
    source: `.row {
  display: flex;
  gap: 16px;
}
.row .card {
  width: 320px;
  padding: 16px;
}`,
    analysis: {
      status: 'analyzed',
      summary:
        'Flex items default to `flex-shrink: 1` with `min-width: auto`, so long content refuses to shrink below its content width and the row overflows on narrow screens.',
      severity: 'low',
      severityReason: 'Visual only, but it causes horizontal scrolling on mobile.',
      category: 'improvement',
      cause:
        'A fixed `width` plus the automatic minimum size of flex items prevents shrinking; the container never wraps because `flex-wrap` is `nowrap` by default.',
      locationFile: null,
      locationLine: 1,
      locationReliable: true,
      originalCode: `.row {
  display: flex;
  gap: 16px;
}
.row .card {
  width: 320px;
  padding: 16px;
}`,
      suggestedFix: `.row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.row .card {
  flex: 1 1 280px;
  min-width: 0;      /* lets the item shrink below its content width */
  max-width: 100%;
  box-sizing: border-box;
  padding: 16px;
}`,
      explanationSteps: [
        'Allow wrapping so items move to a new line instead of overflowing.',
        'Use a flex basis with growth and shrink (`flex: 1 1 280px`) instead of a hard `width`.',
        'Set `min-width: 0` so long words or wide children cannot force the item wider than its share.',
        'Add `box-sizing: border-box` so padding counts inside the declared width.',
      ],
      preventionTips: [
        'Prefer `flex`/`grid` sizing over fixed pixel widths for content that varies.',
        'Test at 320px width — the smallest common phone viewport.',
        'Remember `min-width: auto` on flex items; `min-width: 0` is the usual fix for overflow.',
      ],
      confidence: 0.72,
      confidenceReason: 'The overflow pattern is clear, but the exact container widths were not supplied.',
      beginnerExplanation:
        'Flexbox tries to keep items at their natural size. Three 320px cards cannot fit on a phone, and without wrapping they spill out sideways. Letting them wrap and shrink fixes it.',
      minimalRepro: `<div class="row">
  <div class="card">A</div><div class="card">B</div><div class="card">C</div>
</div>
<!-- viewport under 1000px: horizontal scrollbar appears -->`,
      unitTests: '',
      relatedRisks: [
        { kind: 'style', description: 'The fixed `width` also fights any future responsive breakpoints.', line: 5 },
      ],
      missingContext: [],
    },
  },
]

function normalise(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/**
 * Finds a demo case matching the submitted input.
 * Matching requires: same language, code containing the case's markers, and
 * (when an error message was supplied) a hint that matches it.
 */
export function findDemoAnalysis({ language, code, errorMessage }) {
  const haystack = normalise(code)
  const errorHay = normalise(errorMessage)

  const candidates = CASES.filter((c) => c.language === language)
  for (const candidate of candidates) {
    const hasMarkers = candidate.markers.every((m) => haystack.includes(normalise(m)))
    if (!hasMarkers) continue
    if (errorHay && candidate.errorHint.length) {
      const hintMatch = candidate.errorHint.some((h) => errorHay.includes(normalise(h)))
      if (!hintMatch) continue
    }
    return candidate
  }
  return null
}

export function listDemoCases() {
  return CASES.map(({ id, title, language, source }) => ({ id, title, language, source }))
}
