---
name: ui-design-system
description: Modern UI development with Tailwind CSS v4, shadcn/ui components, and Framer Motion animations. Use when building user interfaces, implementing design systems, adding animations, or ensuring accessibility. Triggers on tasks involving Tailwind v4 @theme directive, shadcn/ui components, Framer Motion animations, responsive design, dark mode, loading states, or accessibility (a11y).
---

# UI/UX Best Practices

## Stack: Tailwind CSS v4 + shadcn/ui + Framer Motion

The modern UI stack for React 19 applications. Tailwind v4 for CSS-first styling, shadcn/ui for accessible components (built on Radix UI), and Framer Motion for animations.

### Tailwind v4 Configuration (CSS-First)

Tailwind v4 uses CSS-first configuration with `@theme` directive. No more `tailwind.config.js`.

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Colors using oklch for vivid P3 display support */
  --color-background: oklch(100% 0 0);
  --color-foreground: oklch(14.9% 0.02 254.6);

  --color-primary: oklch(54.6% 0.245 262.9);
  --color-primary-foreground: oklch(98.5% 0.002 247.8);

  --color-secondary: oklch(96.5% 0.005 247.8);
  --color-secondary-foreground: oklch(20.8% 0.032 265.8);

  --color-muted: oklch(96.5% 0.005 247.8);
  --color-muted-foreground: oklch(55.6% 0.016 264.3);

  --color-accent: oklch(96.5% 0.005 247.8);
  --color-accent-foreground: oklch(20.8% 0.032 265.8);

  --color-destructive: oklch(57.7% 0.215 27.3);
  --color-destructive-foreground: oklch(98.5% 0.002 247.8);

  --color-border: oklch(91.4% 0.008 264.5);
  --color-input: oklch(91.4% 0.008 264.5);
  --color-ring: oklch(54.6% 0.245 262.9);

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;

  /* Animations */
  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;
}

/* Dark mode */
.dark {
  --color-background: oklch(14.9% 0.02 254.6);
  --color-foreground: oklch(98.5% 0.002 247.8);
  --color-primary: oklch(62.3% 0.214 259.1);
  --color-primary-foreground: oklch(20.8% 0.032 265.8);
  --color-secondary: oklch(22.8% 0.033 264.2);
  --color-secondary-foreground: oklch(98.5% 0.002 247.8);
  --color-muted: oklch(22.8% 0.033 264.2);
  --color-muted-foreground: oklch(71.2% 0.02 255.7);
  --color-accent: oklch(22.8% 0.033 264.2);
  --color-accent-foreground: oklch(98.5% 0.002 247.8);
  --color-destructive: oklch(42.3% 0.152 28.2);
  --color-destructive-foreground: oklch(98.5% 0.002 247.8);
  --color-border: oklch(22.8% 0.033 264.2);
  --color-input: oklch(22.8% 0.033 264.2);
  --color-ring: oklch(52.7% 0.186 255.7);
}

@keyframes accordion-down {
  from {
    height: 0;
  }
  to {
    height: var(--radix-accordion-content-height);
  }
}

@keyframes accordion-up {
  from {
    height: var(--radix-accordion-content-height);
  }
  to {
    height: 0;
  }
}
```

### PostCSS Config

```js
// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### Tailwind v4 Key Changes

- **No config file** - Use `@theme` in CSS instead of `tailwind.config.js`
- **oklch colors** - Vivid P3 display support
- **Arbitrary values on-demand** - `h-[100px]` generated without safelist or JIT config
- **Auto content detection** - No need to configure content paths
- **5x faster builds** - Incremental builds in microseconds

---

## shadcn/ui Components

### Button Component

```tsx
// Add components via shadcn CLI — don't handwrite them
// pnpm dlx shadcn@latest add button dialog card input label

// Then import and use:
import { Button } from "@/components/ui/button";
// variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
// size: "default" | "sm" | "lg" | "icon"
<Button variant="outline" size="sm">
  Click me
</Button>;
```

### Dialog Component

```tsx
// Usage with shadcn/ui Dialog
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function ConfirmDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>
            Are you sure you want to proceed? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Card Component

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function FeatureCard() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Feature Title</CardTitle>
        <CardDescription>A brief description of the feature.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Main content goes here with details about the feature.</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Continue</Button>
      </CardFooter>
    </Card>
  );
}
```

### Form with TanStack Form + Zod

```bash
pnpm add @tanstack/react-form @tanstack/zod-form-adapter zod
```

```tsx
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
});

function TransferForm() {
  const form = useForm({
    defaultValues: {
      email: "",
      amount: "",
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: formSchema,
    },
    onSubmit: async ({ value }) => {
      console.log(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <form.Field name="email">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Recipient Email</Label>
            <Input
              id={field.name}
              placeholder="recipient@example.com"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Enter the recipient's email address.
            </p>
            {field.state.meta.isTouched &&
              field.state.meta.errors.length > 0 && (
                <p className="text-sm text-destructive">
                  {field.state.meta.errors.join(", ")}
                </p>
              )}
          </div>
        )}
      </form.Field>

      <form.Field name="amount">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Amount</Label>
            <Input
              id={field.name}
              placeholder="0.00"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.isTouched &&
              field.state.meta.errors.length > 0 && (
                <p className="text-sm text-destructive">
                  {field.state.meta.errors.join(", ")}
                </p>
              )}
          </div>
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {isSubmitting ? "Sending..." : "Send"}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
```

### TanStack Form Key Patterns

```tsx
// Async validation — asyncDebounceMs is a field-level prop, not inside validators
<form.Field
  name="email"
  asyncDebounceMs={500}
  validators={{
    onChangeAsync: async ({ value }) => {
      const exists = await checkEmailExists(value);
      return exists ? "Email already registered" : undefined;
    },
  }}
/>

// Field-level validation
<form.Field
  name="username"
  validators={{
    onChange: ({ value }) => value.length < 3 ? "Min 3 characters" : undefined,
  }}
/>

// Array fields
<form.Field name="items" mode="array">
  {(field) => field.state.value.map((_, i) => (
    <form.Field key={i} name={`items[${i}].name`} />
  ))}
</form.Field>
```

### Toast Notifications

```tsx
// Current shadcn/ui default (sonner)
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function ToastExample() {
  return (
    <Button
      onClick={() => {
        toast.success("Transaction submitted");
        // With action:
        toast("Transaction submitted", {
          action: { label: "View", onClick: () => window.open(txUrl) },
        });
      }}
    >
      Submit
    </Button>
  );
}

// Success toast (Sonner API)
toast.success("Success!", { description: "Your changes have been saved." });

// Error toast
toast.error("Error", {
  description: "Something went wrong. Please try again.",
});
```

---

## Framer Motion Animations

### Basic Animations

```tsx
import { motion } from "framer-motion";

// Fade in on mount
function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

// Slide up on mount
function SlideUp({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Scale on hover
function ScaleOnHover({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.div>
  );
}
```

### Page Transitions

```tsx
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

const pageVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### Staggered List Animation

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

function AnimatedList({ items }: { items: Item[] }) {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-2"
    >
      {items.map((item) => (
        <motion.li
          key={item.id}
          variants={itemVariants}
          className="p-4 bg-white rounded-lg shadow"
        >
          {item.name}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### Modal Animation

```tsx
import { motion, AnimatePresence } from "framer-motion";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.2 },
  },
};

function AnimatedModal({ isOpen, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-xl p-6"
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

### Loading Spinner

```tsx
function LoadingSpinner() {
  return (
    <motion.div
      className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
}

// Pulsing dots
function LoadingDots() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-primary rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}
```

### Skeleton Loading

```tsx
function Skeleton({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("bg-muted rounded-md", className)}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
```

### Number Counter Animation

```tsx
// Framer Motion: useMotionValue + useTransform + animate
import { useMotionValue, useTransform, animate, motion } from "framer-motion";

function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const formatted = useTransform(count, (v) =>
    v.toLocaleString(undefined, { maximumFractionDigits: 2 }),
  );

  useEffect(() => {
    const controls = animate(count, value, { duration: 0.5, ease: "easeOut" });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{formatted}</motion.span>;
}
```

### Gesture Animations

```tsx
// Drag to dismiss
function DraggableCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 100) {
          onDismiss();
        }
      }}
      className="p-4 bg-white rounded-lg shadow cursor-grab active:cursor-grabbing"
    >
      Swipe to dismiss
    </motion.div>
  );
}
```

---

## Design Principles

### Visual Hierarchy

```
1. Size - Larger elements draw attention first
2. Color - High contrast and vibrant colors stand out
3. Position - Top-left (LTR) gets read first
4. Spacing - Isolated elements get more focus
5. Typography - Bold, larger fonts for headings
```

### Spacing Scale (Tailwind)

```
space-0.5  = 0.125rem (2px)
space-1    = 0.25rem  (4px)
space-2    = 0.5rem   (8px)
space-3    = 0.75rem  (12px)
space-4    = 1rem     (16px)
space-5    = 1.25rem  (20px)
space-6    = 1.5rem   (24px)
space-8    = 2rem     (32px)
space-10   = 2.5rem   (40px)
space-12   = 3rem     (48px)
space-16   = 4rem     (64px)
```

### Typography Scale

```
text-xs    = 0.75rem  (12px)
text-sm    = 0.875rem (14px)
text-base  = 1rem     (16px)
text-lg    = 1.125rem (18px)
text-xl    = 1.25rem  (20px)
text-2xl   = 1.5rem   (24px)
text-3xl   = 1.875rem (30px)
text-4xl   = 2.25rem  (36px)
text-5xl   = 3rem     (48px)
```

---

## Responsive Design

### Tailwind Breakpoints

```tsx
// Mobile-first approach
<div className="
  p-4              // Base (mobile)
  md:p-6           // >= 768px
  lg:p-8           // >= 1024px
  xl:p-10          // >= 1280px
">

// Responsive grid
<div className="
  grid
  grid-cols-1      // Mobile: 1 column
  sm:grid-cols-2   // >= 640px: 2 columns
  lg:grid-cols-3   // >= 1024px: 3 columns
  xl:grid-cols-4   // >= 1280px: 4 columns
  gap-4
">
```

### Container Queries

```tsx
// Tailwind v4: container queries are built-in — no plugin or config needed.
// In Tailwind v3, add the @tailwindcss/container-queries plugin.
<div className="@container">
  <div className="@lg:flex @lg:gap-4">
    {/* Responds to container width, not viewport */}
  </div>
</div>
```

---

## Accessibility

### Focus Management

```tsx
// Visible focus rings (Tailwind)
<button className="
  focus:outline-none
  focus-visible:ring-2
  focus-visible:ring-ring
  focus-visible:ring-offset-2
">

// Skip link
<a
  href="#main-content"
  className="
    sr-only
    focus:not-sr-only
    focus:absolute
    focus:top-4
    focus:left-4
    focus:z-50
    focus:px-4
    focus:py-2
    focus:bg-primary
    focus:text-primary-foreground
    focus:rounded-md
  "
>
  Skip to main content
</a>
```

### Screen Reader Utilities

```tsx
// Visually hidden but accessible
<span className="sr-only">Close menu</span>

// Announce dynamic content
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {announcement}
</div>
```

### Reduced Motion

```tsx
// CSS
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

// Framer Motion
import { useReducedMotion } from "framer-motion";

function AnimatedComponent() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ x: 100 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
    />
  );
}
```
