import type { LanguageId } from '../lib/types'

export interface CodeExample {
  id: string
  title: string
  language: LanguageId
  fileName: string
  description: string
  code: string
  errorMessage: string
  expected: string
}

/**
 * Sample bugs users can load to try the product. These are ordinary buggy
 * snippets — the analysis of them is generated live (or, without an API key,
 * answered by the clearly-labelled demo cases on the server).
 */
export const EXAMPLES: CodeExample[] = [
  {
    id: 'js-undefined-map',
    title: 'TypeError on .map()',
    language: 'javascript',
    fileName: 'renderList.js',
    description: 'Crash when the API returns an empty payload',
    code: `async function renderList(api) {
  const response = await api.getItems();
  const items = response.items;
  return items.map((item) => item.name).join(", ");
}

module.exports = { renderList };`,
    errorMessage: `TypeError: Cannot read properties of undefined (reading 'map')
    at renderList (renderList.js:4:16)
    at async main (index.js:12:18)`,
    expected: 'An empty string (or an empty-state message) when there are no items.',
  },
  {
    id: 'js-async-await-missing',
    title: 'Missing await',
    language: 'javascript',
    fileName: 'loadUser.js',
    description: 'User data is undefined after fetching',
    code: `function loadUser(id) {
  const res = fetch("/api/users/" + id);
  const data = res.json();
  return data.name;
}`,
    errorMessage: `TypeError: res.json is not a function
    at loadUser (loadUser.js:3:19)`,
    expected: 'Return the fetched user name as a string.',
  },
  {
    id: 'py-off-by-one',
    title: 'Off-by-one range',
    language: 'python',
    fileName: 'totals.py',
    description: 'Running totals crash on empty lists',
    code: `def running_totals(values):
    totals = []
    for i in range(1, len(values) + 1):
        totals.append(sum(values[: i + 1]))
    return totals


print(running_totals([1, 2, 3]))`,
    errorMessage: `IndexError: list index out of range`,
    expected: 'Return the cumulative sum for each element, and [] for empty input.',
  },
  {
    id: 'ts-possibly-undefined',
    title: 'Possibly undefined',
    language: 'typescript',
    fileName: 'cityLabel.ts',
    description: 'Nested optional properties accessed without checks',
    code: `interface User {
  name?: string;
  address?: { city?: string };
}

function cityLabel(user?: User) {
  return user.address.city.toUpperCase();
}`,
    errorMessage: `error TS18048: 'user' is possibly 'undefined'.
error TS2532: Object is possibly 'undefined'.`,
    expected: 'Return an uppercase city name, or a fallback label when it is missing.',
  },
  {
    id: 'sql-injection',
    title: 'SQL injection',
    language: 'sql',
    fileName: 'queries.sql',
    description: 'User input concatenated into a query',
    code: `SELECT id, email FROM users WHERE email = '" + email + "';

SELECT * FROM orders WHERE user_id = ' + userId;`,
    errorMessage: `PostgresError: syntax error at or near "OR"`,
    expected: 'Look up a single user by email without allowing injected SQL.',
  },
  {
    id: 'cpp-null-deref',
    title: 'Null pointer deref',
    language: 'cpp',
    fileName: 'sum.cpp',
    description: 'Linked-list sum segfaults on an empty list',
    code: `#include <iostream>

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
    errorMessage: `Segmentation fault (core dumped)
Process finished with exit code 139`,
    expected: 'Return 0 for an empty list and the sum of all node values otherwise.',
  },
  {
    id: 'php-undefined-key',
    title: 'Undefined array key',
    language: 'php',
    fileName: 'submit.php',
    description: 'Form handler assumes every field is posted',
    code: `<?php
$name = $_POST['name'];
$email = $_POST['email'];
echo "Thanks, " . strtoupper($name) . "! We'll email " . $email;`,
    errorMessage: `Warning: Undefined array key "email" in submit.php on line 3
Fatal error: Uncaught TypeError: strtoupper(): Argument #1 ($string) must be of type string, null given`,
    expected: 'Thank the user and validate the submitted fields safely.',
  },
  {
    id: 'java-npe',
    title: 'NullPointerException',
    language: 'java',
    fileName: 'OrderService.java',
    description: 'Optional discount code used without a null check',
    code: `public class OrderService {
    public double total(Order order) {
        double sum = 0;
        for (Item item : order.getItems()) {
            sum += item.getPrice();
        }
        return sum - order.getDiscount().getAmount();
    }
}`,
    errorMessage: `Exception in thread "main" java.lang.NullPointerException:
  Cannot invoke "Discount.getAmount()" because the return value of "Order.getDiscount()" is null
    at OrderService.total(OrderService.java:7)`,
    expected: 'Apply a discount only when one exists.',
  },
  {
    id: 'css-flex-overflow',
    title: 'Flex overflow',
    language: 'css',
    fileName: 'layout.css',
    description: 'Cards overflow on small screens',
    code: `.row {
  display: flex;
  gap: 16px;
}
.row .card {
  width: 320px;
  padding: 16px;
}`,
    errorMessage: 'Horizontal scrollbar appears on a 375px viewport.',
    expected: 'Cards wrap onto new lines and never cause horizontal scrolling.',
  },
  {
    id: 'html-unclosed-tag',
    title: 'Unclosed tag',
    language: 'html',
    fileName: 'index.html',
    description: 'Markup nesting breaks the layout',
    code: `<div class="card">
  <h2>Order summary
  <p>Total: <strong>$42.00</p>
</div>
<span class="badge">New</div>`,
    errorMessage: 'Unclosed element: <h2>, mismatched tag: </div>',
    expected: 'Well-formed markup where every element is closed in the right order.',
  },
]
