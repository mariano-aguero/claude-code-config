---
name: javascript-patterns
description: Modern JavaScript patterns including ES6+ features, async/await, functional programming, and best practices. Use when writing vanilla JavaScript, refactoring legacy code, or implementing modern patterns. Triggers on destructuring, spread operators, promises, array methods, and ES modules.
---

# Modern JavaScript Patterns

## Destructuring

### Object Destructuring

```javascript
const user = { name: "John", email: "john@example.com", age: 30 };

// Basic
const { name, email } = user;

// With rename
const { name: userName, email: userEmail } = user;

// With defaults
const { name, role = "user" } = user;

// Nested
const response = {
  data: {
    user: { id: 1, name: "John" },
  },
};
const {
  data: {
    user: { id, name },
  },
} = response;

// In function parameters
function createUser({ name, email, role = "user" }) {
  return { name, email, role };
}
```

### Array Destructuring

```javascript
const colors = ["red", "green", "blue"];

// Basic
const [first, second] = colors;

// Skip elements
const [, , third] = colors;

// Rest pattern
const [primary, ...rest] = colors;

// Swap variables
let a = 1,
  b = 2;
[a, b] = [b, a];

// With defaults
const [first = "default"] = [];
```

## Spread & Rest Operators

```javascript
// Spread arrays
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5]; // [1, 2, 3, 4, 5]

// Spread objects
const base = { a: 1, b: 2 };
const extended = { ...base, c: 3 }; // { a: 1, b: 2, c: 3 }

// Override properties
const updated = { ...user, name: "Jane" };

// Rest in functions
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}

// Rest in destructuring
const { id, ...rest } = user;
```

## Arrow Functions

```javascript
// Basic
const add = (a, b) => a + b;

// With block body
const process = (data) => {
  const result = transform(data);
  return result;
};

// Returning objects (wrap in parentheses)
const createUser = (name) => ({ name, createdAt: new Date() });

// Lexical this
class Counter {
  count = 0;
  increment = () => {
    this.count++; // `this` is always the Counter instance
  };
}
```

## Async/Await

### Basic Patterns

```javascript
// Async function
async function fetchUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error("Failed to fetch");
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// Arrow function
const fetchUsers = async () => {
  const response = await fetch("/api/users");
  return response.json();
};
```

### Parallel Execution

```javascript
// Promise.all - fail fast
const [users, posts] = await Promise.all([fetchUsers(), fetchPosts()]);

// Promise.allSettled - wait for all
const results = await Promise.allSettled([fetchUsers(), fetchPosts()]);
results.forEach((result) => {
  if (result.status === "fulfilled") {
    console.log(result.value);
  } else {
    console.error(result.reason);
  }
});

// Promise.race - first to complete
const result = await Promise.race([fetchFromPrimary(), fetchFromBackup()]);

// Promise.any - first to succeed
const result = await Promise.any([fetchFromA(), fetchFromB(), fetchFromC()]);
```

### Sequential Execution

```javascript
// Process array sequentially
async function processSequentially(items) {
  const results = [];
  for (const item of items) {
    const result = await processItem(item);
    results.push(result);
  }
  return results;
}

// With reduce
async function processWithReduce(items) {
  return items.reduce(async (accPromise, item) => {
    const acc = await accPromise;
    const result = await processItem(item);
    return [...acc, result];
  }, Promise.resolve([]));
}
```

## Array Methods

### Transform

```javascript
const users = [
  { id: 1, name: "John", age: 30 },
  { id: 2, name: "Jane", age: 25 },
  { id: 3, name: "Bob", age: 35 },
];

// map - transform each element
const names = users.map((user) => user.name);

// filter - keep matching elements
const adults = users.filter((user) => user.age >= 30);

// find - get first match
const john = users.find((user) => user.name === "John");

// findIndex - get index of first match
const johnIndex = users.findIndex((user) => user.name === "John");

// some - check if any match
const hasAdults = users.some((user) => user.age >= 18);

// every - check if all match
const allAdults = users.every((user) => user.age >= 18);

// includes - check if array contains value
const hasJohn = names.includes("John");
```

### Reduce

```javascript
// Sum
const total = numbers.reduce((sum, n) => sum + n, 0);

// Group by
const byAge = users.reduce((groups, user) => {
  const key = user.age >= 30 ? "senior" : "junior";
  return {
    ...groups,
    [key]: [...(groups[key] || []), user],
  };
}, {});

// Object from array
const userMap = users.reduce((map, user) => {
  map[user.id] = user;
  return map;
}, {});

// Flatten
const nested = [[1, 2], [3, 4], [5]];
const flat = nested.reduce((acc, arr) => [...acc, ...arr], []);
// Or: nested.flat()

// Count occurrences
const counts = items.reduce((acc, item) => {
  acc[item] = (acc[item] || 0) + 1;
  return acc;
}, {});
```

### Chaining

```javascript
const result = users
  .filter((user) => user.age >= 18)
  .map((user) => ({ ...user, isAdult: true }))
  .sort((a, b) => a.name.localeCompare(b.name))
  .slice(0, 10);
```

## Modern Operators

### Optional Chaining

```javascript
// Property access
const street = user?.address?.street;

// Method calls
const result = obj?.method?.();

// Array access
const first = arr?.[0];

// With nullish coalescing
const name = user?.name ?? "Anonymous";
```

### Nullish Coalescing

```javascript
// Only null/undefined trigger fallback
const value = null ?? "default"; // "default"
const value2 = 0 ?? "default"; // 0
const value3 = "" ?? "default"; // ""

// Compare with ||
const value4 = 0 || "default"; // "default" (0 is falsy)
```

### Logical Assignment

```javascript
// ||= assigns if falsy
user.name ||= "Anonymous";

// ??= assigns if null/undefined
user.settings ??= {};

// &&= assigns if truthy
user.isActive &&= checkStatus();
```

## ES Modules

```javascript
// Named exports
export const API_URL = "/api";
export function fetchData() {}
export class UserService {}

// Default export
export default class App {}

// Named imports
import { API_URL, fetchData } from "./api.js";

// Default import
import App from "./App.js";

// Mixed
import App, { API_URL } from "./app.js";

// Rename
import { fetchData as getData } from "./api.js";

// Import all
import * as api from "./api.js";

// Dynamic import
const module = await import("./heavy-module.js");
```

## Classes

```javascript
class User {
  // Public field
  name;

  // Private field
  #password;

  // Static field
  static count = 0;

  constructor(name, password) {
    this.name = name;
    this.#password = password;
    User.count++;
  }

  // Getter
  get displayName() {
    return this.name.toUpperCase();
  }

  // Setter
  set displayName(value) {
    this.name = value.toLowerCase();
  }

  // Public method
  greet() {
    return `Hello, ${this.name}`;
  }

  // Private method
  #hashPassword() {
    return hash(this.#password);
  }

  // Static method
  static create(name, password) {
    return new User(name, password);
  }
}

// Inheritance
class Admin extends User {
  constructor(name, password, role) {
    super(name, password);
    this.role = role;
  }

  greet() {
    return `${super.greet()} (${this.role})`;
  }
}
```

## Functional Patterns

### Higher-Order Functions

```javascript
// Function returning function
const multiply = (a) => (b) => a * b;
const double = multiply(2);
console.log(double(5)); // 10

// Currying
const curry =
  (fn) =>
  (...args) =>
    args.length >= fn.length ? fn(...args) : curry(fn.bind(null, ...args));

const add = (a, b, c) => a + b + c;
const curriedAdd = curry(add);
curriedAdd(1)(2)(3); // 6
curriedAdd(1, 2)(3); // 6
```

### Composition

```javascript
// Pipe (left to right)
const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((acc, fn) => fn(acc), x);

// Compose (right to left)
const compose =
  (...fns) =>
  (x) =>
    fns.reduceRight((acc, fn) => fn(acc), x);

// Usage
const addOne = (x) => x + 1;
const double = (x) => x * 2;
const square = (x) => x * x;

const process = pipe(addOne, double, square);
process(2); // ((2 + 1) * 2)² = 36
```

### Memoization

```javascript
function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

const expensiveCalc = memoize((n) => {
  console.log("Computing...");
  return n * n;
});

expensiveCalc(5); // Computing... 25
expensiveCalc(5); // 25 (cached)
```

## Utility Patterns

### Debounce

```javascript
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

const handleSearch = debounce((query) => {
  fetch(`/search?q=${query}`);
}, 300);
```

### Throttle

```javascript
function throttle(fn, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

const handleScroll = throttle(() => {
  console.log("Scroll position:", window.scrollY);
}, 100);
```

### Deep Clone

```javascript
// Using structuredClone (modern)
const clone = structuredClone(original);

// Manual deep clone
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, deepClone(v)]));
}
```

## Best Practices

1. **Use `const` by default**, `let` when reassignment needed, never `var`
2. **Prefer arrow functions** for callbacks and short functions
3. **Use destructuring** for cleaner variable assignment
4. **Prefer `async/await`** over `.then()` chains
5. **Use optional chaining** to avoid null checks
6. **Use nullish coalescing** for default values
7. **Prefer array methods** over `for` loops
8. **Use template literals** for string interpolation
9. **Use ES modules** for code organization
10. **Avoid mutating data** - prefer spread and array methods
