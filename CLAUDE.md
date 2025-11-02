# Mantine Developer Guide

## Project Stack

- **Mantine 8** (@mantine/core, @mantine/dates, @mantine/dropzone, @mantine/hooks, @mantine/notifications)
- **React 19**
- **TailwindCSS 4**
- **TanStack Query 5** (server state management)
- **Zustand 5** (UI state management)
- **React Router 7**
- **ws** (WebSocket for real-time updates)
- **Tabler Icons 3**
- **postcss-preset-mantine**

> **Note**: For exact dependency versions, refer to `package.json`.

---

## Code Standards & Architecture

### Component Export Pattern

**ALWAYS use named exports with React.FC annotation:**

```tsx
// ✓ CORRECT
import React from 'react';

export const MyComponent: React.FC = () => {
  return <div>Content</div>;
};

// With props
interface MyComponentProps {
  title: string;
  count: number;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, count }) => {
  return <div>{title}: {count}</div>;
};

// ✗ WRONG - Don't use default exports
const MyComponent = () => { ... };
export default MyComponent;
```

**Rationale:**

- Named exports enforce consistent naming across imports
- Better for tree-shaking and refactoring tools
- Prevents import renaming inconsistencies
- React.FC provides explicit typing for component props and return type

### Function Declaration Pattern

**ALWAYS use const arrow functions:**

```tsx
// ✓ CORRECT
const handleClick = () => {
  // logic
};

const handleSubmit = (values: FormValues) => {
  // logic
};

// ✗ WRONG
function handleClick() {}
function handleSubmit(values: FormValues) {}
```

### Import Path Convention

**NEVER use the '@' path alias. ALWAYS use literal relative paths:**

```tsx
// ✓ CORRECT - Use relative paths
import { ContinueReadingCard } from "../components/home/ContinueReadingCard";
import { useLibrary } from "../../hooks/queries/useLibraryQueries";
import { ENDPOINTS } from "../constants/api";
import type { Manga } from "../types";

// ✗ WRONG - Do not use @ alias
import { ContinueReadingCard } from "@/components/home/ContinueReadingCard";
import { useLibrary } from "@/hooks/queries/useLibraryQueries";
import { ENDPOINTS } from "@/constants/api";
import type { Manga } from "@/types";
```

**Rationale:**

- Path aliases require build tool configuration that breaks with external dependency changes
- Too much maintenance overhead
- Relative paths are explicit and always work
- Better IDE support without configuration

### API Endpoint Constants

**Use centralized ENDPOINTS for multi-use API routes:**

```tsx
// ✓ CORRECT - Import from constants
import { ENDPOINTS } from "../constants/api";

const { data } = useQuery({
  queryKey: ["library"],
  queryFn: () => apiClient.get(ENDPOINTS.LIBRARY),
});

// ✗ WRONG - Hardcoded strings (only acceptable for single-use endpoints)
const { data } = useQuery({
  queryKey: ["library"],
  queryFn: () => apiClient.get("/library"),
});
```

**Rule of Thumb:** If an endpoint is used in 2+ places, add it to `src/constants/api.ts`

### State Management Architecture

#### Server State: TanStack Query

**Use TanStack Query for ALL server data:**

```tsx
import { useLibrary } from "../../hooks/queries/useLibraryQueries";

const MyComponent: React.FC = () => {
  const { data: library, isLoading, error } = useLibrary();

  if (isLoading) return <Loader />;
  if (error) return <ErrorMessage error={error} />;

  return <div>{library.map(item => ...)}</div>;
};
```

**Benefits:**

- Automatic caching and cache invalidation
- Built-in loading and error states
- Automatic refetching (window focus, reconnect, intervals)
- Request deduplication
- Optimistic updates
- Stale-while-revalidate pattern

#### UI State: Zustand

**Use Zustand ONLY for UI-specific state:**

```tsx
import { useUIStore } from "../store/useUIStore";

const MyComponent: React.FC = () => {
  const { isModalOpen, openModal, closeModal } = useUIStore();

  return <Button onClick={openModal}>Open Modal</Button>;
};
```

**Appropriate Zustand Use Cases:**

- Modal open/closed state
- Sidebar collapsed/expanded
- Theme preferences
- Reading mode (page fit, direction)
- Current page in reader

**❌ NEVER use Zustand for server data** (downloads, manga, chapters, library)

### Real-Time Updates: WebSocket

**Use WebSocket for real-time server events instead of polling:**

```tsx
import { useWebSocket } from "../hooks/useWebSocket";
import { useDownloadQueue } from "../hooks/queries/useDownloadQueries";
import { WS_EVENTS } from "../constants/websocket";
import type { DownloadProgressPayload } from "../types";

const DownloadsPage: React.FC = () => {
  // Get initial data from TanStack Query
  const { data: queue } = useDownloadQueue();

  // Subscribe to real-time updates
  const progressUpdate = useWebSocket<DownloadProgressPayload>(
    WS_EVENTS.DOWNLOAD_PROGRESS,
  );

  // Invalidate cache when WebSocket event received
  const queryClient = useQueryClient();
  useEffect(() => {
    if (progressUpdate) {
      queryClient.invalidateQueries({ queryKey: downloadKeys.queue });
    }
  }, [progressUpdate, queryClient]);

  return <DownloadQueue items={queue} />;
};
```

**WebSocket Events Available:**

- `WS_EVENTS.DOWNLOAD_STARTED`
- `WS_EVENTS.DOWNLOAD_PROGRESS`
- `WS_EVENTS.DOWNLOAD_PAGE_COMPLETE`
- `WS_EVENTS.DOWNLOAD_CHAPTER_COMPLETE`
- `WS_EVENTS.DOWNLOAD_FAILED`
- `WS_EVENTS.DOWNLOAD_CANCELLED`

**Connection Management:**

- Auto-connects on app start
- Auto-reconnects with exponential backoff
- Max 10 reconnection attempts
- Access via `wsClient` singleton from `../lib/websocket-client`

### Constants Organization

All magic numbers and reusable values live in `src/constants/`:

```
src/constants/
├── api.ts          # API_BASE_URL, ENDPOINTS
├── query.ts        # TanStack Query config (staleTime, gcTime, etc.)
├── websocket.ts    # WebSocket events, connection config
├── ui.ts           # UI constants (pagination, timeouts, etc.)
└── index.ts        # Re-exports all constants
```

**Usage:**

```tsx
import { ENDPOINTS, WS_EVENTS, STALE_TIME } from "../constants";
```

---

## Core Import Structure

All Mantine components use standard npm imports:

```tsx
import { Button, TextInput, Modal } from "@mantine/core";
import { useDisclosure, useCounter } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { DatePicker } from "@mantine/dates";
import { Dropzone } from "@mantine/dropzone";
```

---

## Styling Philosophy: Mantine + TailwindCSS Coexistence

### Primary Rule

**Always use TailwindCSS for custom styling** as per project guidelines. Use Mantine's styling system only when:

- Customizing Mantine component internals via Styles API
- Using Mantine's CSS Variables for theming
- Applying data attributes for state-based styling

### Mantine's Three Styling Approaches

1. **CSS Modules** (for component internals)

```tsx
// Static selectors: .mantine-Button-root, .mantine-Modal-header
<Button classNames={{ root: "custom-class" }} />
```

2. **CSS Variables** (for dynamic theming)

```css
/* Mantine theme variables */
var(--mantine-color-blue-6)
var(--mantine-spacing-md)
var(--mantine-radius-sm)
```

3. **Data Attributes** (for conditional states)

```tsx
/* Use in CSS/Tailwind */
[data-disabled] { opacity: 0.5; }
[data-active] { background: var(--mantine-color-blue-light); }
```

### Integration Pattern

```tsx
// Good: TailwindCSS for layout, Mantine props for component behavior
<Button className="mt-4 w-full" size="lg" variant="filled">
  Submit
</Button>

// Avoid: Mixing approaches unnecessarily
<Button styles={{ root: { marginTop: '1rem' } }} className="mt-4">
  Submit
</Button>
```

---

## Design System

### Color Palette

**Core Colors (General UI):**

- Neutrals: Black, white, and gray shades for backgrounds, text, and standard UI elements
- Use neutral colors for content areas, cards, text, and standard interactive elements

**Navigation Accent:**

- Blue-to-indigo gradient (`bg-linear-to-r from-blue-600 to-indigo-700`) for navigation elements only
- Currently applied to: AppShell.Header and AppShell.Navbar
- White text for contrast on gradient backgrounds

### Inverted Corner Radius Pattern

The AppLayout implements a 24px inverted corner radius at the top-left of the main content area, creating a visual "scoop" effect where the gradient navigation flows into the white content area.

**Implementation:**

```tsx
<AppShell.Main className="relative">
  <div className="pointer-events-none absolute top-0 left-0 z-10 h-6 w-6 bg-white">
    <div className="absolute top-0 left-0 h-6 w-6 rounded-tl-3xl bg-linear-to-br from-blue-600 to-indigo-700" />
  </div>
  <Outlet />
</AppShell.Main>
```

**How it works:**

1. Outer div: 24px × 24px positioned at top-left with content background color
2. Inner div: 24px × 24px with navigation gradient background and rounded top-left corner
3. The rounded corner creates the "inverted" or "scooped" visual effect

**Important Notes:**

- Before implementing new color schemes, always analyze existing design patterns in the codebase
- The blue gradient is currently limited to navigation elements only
- Future design expansions should maintain visual consistency with established patterns

---

## Component Categories

### Layout & Shell

- **AppShell**: Responsive app layout (header, navbar, aside, footer)
- **AspectRatio**: Maintains width/height ratios
- **Affix**: Fixed-position elements via Portal

### Interactive Components

- **Accordion**: Collapsible sections with keyboard nav
- **ActionIcon**: Icon-only buttons (requires aria-label)
- **Autocomplete**: Text input with suggestions (not enforced select)
- **Button**: Primary interaction element
- **Modal**: Overlay dialogs
- **Tabs**: Content switching interface

### Form Components

- **TextInput**, **NumberInput**, **Textarea**
- **Select**, **MultiSelect**, **Checkbox**, **Radio**
- **DatePicker** (from @mantine/dates)
- **Dropzone** (from @mantine/dropzone)

### Data Display

- **Table**, **Card**, **Badge**, **Avatar**
- **Progress**, **Loader**, **Skeleton**

---

## Key Component Patterns

### 1. Polymorphic Components

Components can change their root element via `component` prop:

```tsx
// ActionIcon as link
<ActionIcon component="a" href="/" aria-label="Home">
  <IconHome />
</ActionIcon>

// Button as React Router Link
<Button component={Link} to="/dashboard">
  Dashboard
</Button>
```

**TypeScript Note**: Polymorphic props differ from standard component props.

### 2. Controlled vs Uncontrolled

```tsx
// Uncontrolled (initial state only)
<TextInput defaultValue="initial" />
<Accordion defaultValue="item-1" />

// Controlled (state management)
const [value, setValue] = useState('');
<TextInput value={value} onChange={(e) => setValue(e.currentTarget.value)} />

const [activeItem, setActiveItem] = useState<string | null>(null);
<Accordion value={activeItem} onChange={setActiveItem} />
```

**Follow Project Guidelines**: Use `const` instead of `function`, name handlers with "handle" prefix:

```tsx
const handleChange = (value: string) => {
  setValue(value);
};
```

### 3. Responsive Configuration

Multiple patterns for breakpoint-based values:

```tsx
// Object syntax
<Button size={{ base: 'sm', md: 'md', lg: 'lg' }}>Responsive</Button>

// Numbers convert to rem automatically
<Box p={{ base: 16, md: 32 }} />

// Reference theme spacing
<Stack gap="md" /> // Uses theme.spacing.md
```

---

## Accessibility Requirements

### Critical: Icon-Only Components

**Always provide aria-label for icon-only buttons**:

```tsx
// Required
<ActionIcon aria-label="Settings">
  <IconSettings />
</ActionIcon>

// Will fail accessibility audit
<ActionIcon>
  <IconSettings />
</ActionIcon>
```

### Keyboard Support

Mantine handles automatically:

- Arrow keys for navigation (Accordion, Tabs, Select)
- Enter/Space for activation
- Escape for closing modals/dropdowns

### Screen Reader Labels

```tsx
<Modal closeButtonLabel="Close modal">{/* content */}</Modal>
```

### Follow Project Guidelines

Implement full accessibility as specified:

- tabindex="0" for custom interactive elements
- aria-label for all icon-only elements
- onClick + onKeyDown handlers
- Descriptive variable names

---

## Common Props Across Components

| Prop       | Purpose              | Example Values                          |
| ---------- | -------------------- | --------------------------------------- |
| `size`     | Controls dimensions  | 'xs', 'sm', 'md', 'lg', 'xl'            |
| `radius`   | Border-radius        | 'xs', 'sm', 'md', 'lg', 'xl', CSS value |
| `variant`  | Predefined style     | 'filled', 'outline', 'light', 'subtle'  |
| `color`    | Theme color          | 'blue', 'red', 'green', CSS value       |
| `disabled` | Prevents interaction | boolean                                 |
| `loading`  | Shows loader         | boolean                                 |

---

## State Management Patterns

### With Redux Toolkit (Project Setup)

```tsx
import { useAppDispatch, useAppSelector } from "./store/hooks";

const MyComponent = () => {
  const dispatch = useAppDispatch();
  const data = useAppSelector((state) => state.mySlice.data);

  const handleSubmit = (values: FormValues) => {
    dispatch(updateData(values));
  };

  return <Button onClick={handleSubmit}>Submit</Button>;
};
```

### With Mantine Hooks

```tsx
import { useDisclosure, useCounter, useToggle } from "@mantine/hooks";

// Modal state
const [opened, { open, close }] = useDisclosure(false);

// Counter
const [count, handlers] = useCounter(0, { min: 0, max: 10 });

// Toggle
const [value, toggle] = useToggle(["light", "dark"]);
```

---

## Performance Optimization

### Large Datasets

```tsx
// Limit displayed options
<Autocomplete data={hugeArray} limit={50} />

// Use virtualization for 1000+ items
<Select
  data={Array(10000).fill(0).map((_, i) => ({ value: String(i), label: `Item ${i}` }))}
  limit={100}
  searchable
/>
```

### Early Returns (Project Guidelines)

```tsx
const MyComponent = ({ data }: Props) => {
  // Early return for loading/error states
  if (!data) return <Loader />;
  if (data.error) return <Text c="red">Error: {data.error}</Text>;

  return <div>{/* main content */}</div>;
};
```

---

## Ref Access Pattern

```tsx
import { useRef } from "react";

const MyComponent = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    inputRef.current?.focus();
  };

  return (
    <>
      <TextInput ref={inputRef} />
      <Button onClick={handleFocus}>Focus Input</Button>
    </>
  );
};
```

---

## Notifications System

```tsx
import { notifications } from "@mantine/notifications";

// Success notification
notifications.show({
  title: "Success",
  message: "Operation completed",
  color: "green",
});

// Error notification
notifications.show({
  title: "Error",
  message: "Something went wrong",
  color: "red",
});

// Custom notification
notifications.show({
  id: "load-data",
  loading: true,
  title: "Loading data",
  message: "Please wait...",
  autoClose: false,
});

// Update notification
notifications.update({
  id: "load-data",
  color: "teal",
  title: "Success",
  message: "Data loaded",
  loading: false,
  autoClose: 2000,
});
```

---

## Best Practices

### ✓ DO

1. **Use TailwindCSS for custom styling** (project standard)

```tsx
<Button className="mt-4 w-full">Submit</Button>
```

2. **Use const over function** (project standard)

```tsx
const handleClick = () => {
  // logic
};
```

3. **Name event handlers with "handle" prefix** (project standard)

```tsx
const handleSubmit = (values: FormValues) => {};
const handleChange = (value: string) => {};
const handleKeyDown = (e: KeyboardEvent) => {};
```

4. **Provide aria-labels for icon-only components**

```tsx
<ActionIcon aria-label="Close">
  <IconX />
</ActionIcon>
```

5. **Use early returns for readability** (project standard)

```tsx
if (!data) return <Loader />;
if (error) return <ErrorMessage error={error} />;
```

6. **Use controlled components with state management**

```tsx
const [value, setValue] = useState("");
<TextInput value={value} onChange={(e) => setValue(e.currentTarget.value)} />;
```

### ✗ AVOID

1. **Don't nest interactive elements**

```tsx
// Bad: Button inside Accordion.Control
<Accordion.Control>
  <Button>Click me</Button> {/* DOM validation error */}
</Accordion.Control>
```

2. **Don't mix styling approaches unnecessarily**

```tsx
// Bad: Mixing inline styles with TailwindCSS
<Button styles={{ root: { padding: '1rem' } }} className="p-4">
  Submit
</Button>

// Good: Use one approach
<Button className="p-4">Submit</Button>
```

3. **Don't forget accessibility**

```tsx
// Bad: No aria-label
<ActionIcon><IconSettings /></ActionIcon>

// Good
<ActionIcon aria-label="Open settings"><IconSettings /></ActionIcon>
```

4. **Don't use function declarations** (project standard)

```tsx
// Bad
function handleClick() {}

// Good
const handleClick = () => {};
```

---

## Integration Notes

### Setup Requirements

1. **MantineProvider** (should be in your app root)

```tsx
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";

const App = () => <MantineProvider>{/* your app */}</MantineProvider>;
```

2. **Notifications Provider**

```tsx
import { Notifications } from "@mantine/notifications";
import "@mantine/notifications/styles.css";

<MantineProvider>
  <Notifications />
  {/* your app */}
</MantineProvider>;
```

3. **Dates (DayJS)**

```tsx
import "@mantine/dates/styles.css";
// DayJS included in dependencies
```

4. **Dropzone**

```tsx
import "@mantine/dropzone/styles.css";
```

### PostCSS Configuration

Project uses `postcss-preset-mantine` for Mantine-specific transformations. This is already configured in your dev dependencies.

---

## Quick Reference: Common Components

### Button

```tsx
<Button
  variant="filled" // 'filled' | 'outline' | 'light' | 'subtle'
  size="md" // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  color="blue"
  loading={isLoading}
  disabled={isDisabled}
  leftSection={<IconCheck />}
  rightSection={<IconArrowRight />}
  onClick={handleClick}
  className="mt-4 w-full" // TailwindCSS
>
  Click Me
</Button>
```

### TextInput

```tsx
<TextInput
  label="Email"
  description="We'll never share your email"
  placeholder="your@email.com"
  value={email}
  onChange={(e) => setEmail(e.currentTarget.value)}
  error={errors.email}
  required
  leftSection={<IconMail />}
  className="w-full"
/>
```

### Modal

```tsx
const [opened, { open, close }] = useDisclosure(false);

<Modal
  opened={opened}
  onClose={close}
  title="Modal Title"
  size="lg"
  centered
  closeButtonLabel="Close modal"
>
  {/* content */}
</Modal>;
```

### Select

```tsx
<Select
  label="Choose option"
  placeholder="Pick one"
  data={["React", "Vue", "Angular"]}
  value={value}
  onChange={setValue}
  searchable
  clearable
/>
```

### Accordion

```tsx
<Accordion variant="separated">
  <Accordion.Item value="item-1">
    <Accordion.Control>Item 1</Accordion.Control>
    <Accordion.Panel>Content 1</Accordion.Panel>
  </Accordion.Item>
  <Accordion.Item value="item-2">
    <Accordion.Control>Item 2</Accordion.Control>
    <Accordion.Panel>Content 2</Accordion.Panel>
  </Accordion.Item>
</Accordion>
```

### DatePicker

```tsx
import { DatePicker } from "@mantine/dates";

<DatePicker
  label="Pick date"
  value={value}
  onChange={setValue}
  minDate={new Date()}
/>;
```

### Dropzone

```tsx
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";

<Dropzone
  onDrop={(files) => console.log("accepted", files)}
  onReject={(files) => console.log("rejected", files)}
  maxSize={5 * 1024 ** 2}
  accept={IMAGE_MIME_TYPE}
>
  <div>
    <Text>Drag images here or click to select</Text>
  </div>
</Dropzone>;
```

---

## Troubleshooting

### Issue: Styles not applying

**Solution**: Ensure CSS imports are present:

```tsx
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/dropzone/styles.css";
```

### Issue: TypeScript errors with polymorphic components

**Solution**: Polymorphic component props differ from standard props. Use proper typing:

```tsx
import { ButtonProps } from "@mantine/core";

type MyButtonProps = ButtonProps & {
  customProp?: string;
};
```

### Issue: Mantine styles conflicting with TailwindCSS

**Solution**: Use `postcss-preset-mantine` (already in dependencies). Mantine uses CSS layers to avoid conflicts.

### Issue: Components not responding to breakpoints

**Solution**: Use object syntax for responsive values:

```tsx
<Button size={{ base: "sm", md: "lg" }}>Responsive</Button>
```

---

## Resources

- **Official Docs**: https://mantine.dev
- **Component Demos**: https://mantine.dev/core/button (replace 'button' with component name)
- **Hooks Reference**: https://mantine.dev/hooks/use-disclosure
- **GitHub**: https://github.com/mantinedev/mantine

---

## Version-Specific Notes

- React 19 compatible
- Full TypeScript support
- CSS Variables for theming
- PostCSS preset for optimal integration
- Tree-shakeable imports
- Server component compatible (Next.js)
