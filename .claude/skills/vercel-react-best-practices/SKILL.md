---
name: vercel-react-best-practices
description: React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tasks involving React components, Next.js pages, data fetching, bundle optimization, or performance improvements.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# Vercel React Best Practices

Comprehensive performance optimization guide for React and Next.js applications, maintained by Vercel. Contains 57 rules across 8 categories, prioritized by impact to guide automated refactoring and code generation.

## When to Apply

Reference these guidelines when:
- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React/Next.js code
- Optimizing bundle size or load times

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Server-Side Performance | HIGH | `server-` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` |
| 5 | Re-render Optimization | MEDIUM | `rerender-` |
| 6 | Rendering Performance | MEDIUM | `rendering-` |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` |
| 8 | Advanced Patterns | LOW | `advanced-` |

---

## 1. Eliminating Waterfalls (CRITICAL)

### async-defer-await
Move `await` into branches where actually used.

**Bad:**
```tsx
async function getData() {
  const data = await fetchData(); // Always awaits
  if (condition) {
    return data;
  }
  return null;
}
```

**Good:**
```tsx
async function getData() {
  if (condition) {
    return await fetchData(); // Only awaits when needed
  }
  return null;
}
```

### async-parallel
Use `Promise.all()` for independent operations.

**Bad:**
```tsx
const user = await getUser(id);
const posts = await getPosts(id);
const comments = await getComments(id);
```

**Good:**
```tsx
const [user, posts, comments] = await Promise.all([
  getUser(id),
  getPosts(id),
  getComments(id),
]);
```

### async-suspense-boundaries
Use Suspense to stream content progressively.

**Good:**
```tsx
<Suspense fallback={<Skeleton />}>
  <SlowComponent />
</Suspense>
```

---

## 2. Bundle Size Optimization (CRITICAL)

### bundle-barrel-imports
Import directly, avoid barrel files.

**Bad:**
```tsx
import { Button } from '@/components'; // Imports everything
```

**Good:**
```tsx
import { Button } from '@/components/Button'; // Direct import
```

### bundle-dynamic-imports
Use `next/dynamic` for heavy components.

**Good:**
```tsx
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./Chart'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

### bundle-defer-third-party
Load analytics/logging after hydration.

**Good:**
```tsx
useEffect(() => {
  import('analytics').then((analytics) => analytics.init());
}, []);
```

### bundle-preload
Preload on hover/focus for perceived speed.

**Good:**
```tsx
<Link
  href="/dashboard"
  onMouseEnter={() => router.prefetch('/dashboard')}
>
  Dashboard
</Link>
```

---

## 3. Server-Side Performance (HIGH)

### server-cache-react
Use `React.cache()` for per-request deduplication.

**Good:**
```tsx
import { cache } from 'react';

export const getUser = cache(async (id: string) => {
  return await db.user.findUnique({ where: { id } });
});
```

### server-parallel-fetching
Restructure components to parallelize fetches.

**Bad:**
```tsx
// Sequential - each awaits before next
export default async function Page() {
  const user = await getUser();
  const posts = await getPosts(user.id); // Waits for user
}
```

**Good:**
```tsx
// Parallel - both start immediately
export default async function Page() {
  const userPromise = getUser();
  const postsPromise = getPosts();
  const [user, posts] = await Promise.all([userPromise, postsPromise]);
}
```

### server-serialization
Minimize data passed to client components.

**Bad:**
```tsx
// Passes entire user object to client
<ClientComponent user={user} />
```

**Good:**
```tsx
// Only pass what's needed
<ClientComponent userName={user.name} userAvatar={user.avatar} />
```

### server-after-nonblocking
Use `after()` for non-blocking operations.

**Good:**
```tsx
import { after } from 'next/server';

export async function POST(request: Request) {
  const data = await request.json();
  await saveToDatabase(data);

  after(async () => {
    await sendAnalytics(data);
    await notifySlack(data);
  });

  return Response.json({ success: true });
}
```

---

## 4. Client-Side Data Fetching (MEDIUM-HIGH)

### client-swr-dedup
Use SWR for automatic request deduplication.

**Good:**
```tsx
import useSWR from 'swr';

function useUser(id: string) {
  return useSWR(`/api/user/${id}`, fetcher);
}
```

### client-passive-event-listeners
Use passive listeners for scroll.

**Good:**
```tsx
element.addEventListener('scroll', handler, { passive: true });
```

---

## 5. Re-render Optimization (MEDIUM)

### rerender-memo
Extract expensive work into memoized components.

**Good:**
```tsx
const ExpensiveList = memo(function ExpensiveList({ items }) {
  return items.map(item => <ExpensiveItem key={item.id} item={item} />);
});
```

### rerender-dependencies
Use primitive dependencies in effects.

**Bad:**
```tsx
useEffect(() => {
  // Runs on every render because `options` is new object
}, [options]);
```

**Good:**
```tsx
useEffect(() => {
  // Only runs when actual values change
}, [options.page, options.limit]);
```

### rerender-derived-state-no-effect
Derive state during render, not in effects.

**Bad:**
```tsx
const [filteredItems, setFilteredItems] = useState([]);
useEffect(() => {
  setFilteredItems(items.filter(i => i.active));
}, [items]);
```

**Good:**
```tsx
const filteredItems = useMemo(
  () => items.filter(i => i.active),
  [items]
);
```

### rerender-functional-setstate
Use functional setState for stable callbacks.

**Good:**
```tsx
const increment = useCallback(() => {
  setCount(prev => prev + 1); // No dependency on count
}, []);
```

### rerender-lazy-state-init
Pass function to useState for expensive values.

**Good:**
```tsx
const [data] = useState(() => expensiveComputation());
```

---

## 6. Rendering Performance (MEDIUM)

### rendering-content-visibility
Use `content-visibility` for long lists.

**Good:**
```css
.list-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 50px;
}
```

### rendering-hoist-jsx
Extract static JSX outside components.

**Good:**
```tsx
const staticIcon = <Icon name="check" />;

function Component() {
  return <div>{staticIcon}</div>; // No recreation
}
```

### rendering-conditional-render
Use ternary, not `&&` for conditionals.

**Bad:**
```tsx
{count && <span>{count}</span>} // Renders "0" when count is 0
```

**Good:**
```tsx
{count > 0 ? <span>{count}</span> : null}
```

---

## 7. JavaScript Performance (LOW-MEDIUM)

### js-index-maps
Build Map for repeated lookups.

**Good:**
```tsx
const userMap = new Map(users.map(u => [u.id, u]));
// O(1) lookups
const user = userMap.get(id);
```

### js-combine-iterations
Combine multiple filter/map into one loop.

**Bad:**
```tsx
items.filter(x => x.active).map(x => x.name).filter(Boolean);
```

**Good:**
```tsx
items.reduce((acc, x) => {
  if (x.active && x.name) acc.push(x.name);
  return acc;
}, []);
```

### js-set-map-lookups
Use Set/Map for O(1) lookups.

**Good:**
```tsx
const selectedIds = new Set(selected.map(s => s.id));
const isSelected = selectedIds.has(item.id); // O(1)
```

### js-early-exit
Return early from functions.

**Good:**
```tsx
function process(item) {
  if (!item) return null;
  if (!item.active) return null;
  // Main logic
}
```

---

## 8. Advanced Patterns (LOW)

### advanced-use-latest
`useLatest` for stable callback refs.

**Good:**
```tsx
function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

const latestCallback = useLatest(callback);
// Use latestCallback.current in effects
```

---

## Quick Checklist

When reviewing React/Next.js code:

- [ ] Are independent async operations running in parallel?
- [ ] Are imports direct (not through barrel files)?
- [ ] Are heavy components dynamically imported?
- [ ] Is data fetching deduplicated (SWR, React.cache)?
- [ ] Are effect dependencies primitives?
- [ ] Is derived state computed in render, not effects?
- [ ] Are expensive components memoized?
- [ ] Are large lists virtualized?
- [ ] Are Maps/Sets used for lookups?
