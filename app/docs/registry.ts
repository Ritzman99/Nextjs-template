/**
 * Component documentation registry.
 * Each entry drives the docs overview and the per-component page (examples, variants, API).
 */

export interface PropRow {
  name: string;
  type: string;
  default: string;
  description: string;
}

export interface DocExample {
  title: string;
  description?: string;
  code: string;
  /** Props passed to the component for live preview. Use `children` for node content when needed. */
  props?: Record<string, unknown>;
}

export interface DocVariant {
  label: string;
  code?: string;
  props?: Record<string, unknown>;
}

export interface ComponentDoc {
  slug: string;
  name: string;
  description: string;
  examples: DocExample[];
  variants?: DocVariant[];
  propsTable?: PropRow[];
  /** When true, show an interactive playground section. */
  playground?: boolean;
}

export const COMPONENT_DOCS: ComponentDoc[] = [
  {
    slug: 'accordion',
    name: 'Accordion',
    description: 'Collapsible content panels for organizing information.',
    examples: [
      {
        title: 'Basic',
        code: `<Accordion items={[
  { id: '1', title: 'Item 1', content: 'Content for item 1.' },
  { id: '2', title: 'Item 2', content: 'Content for item 2.' },
]} />`,
        props: {
          items: [
            { id: '1', title: 'Item 1', content: 'Content for item 1.' },
            { id: '2', title: 'Item 2', content: 'Content for item 2.' },
          ],
        },
      },
      {
        title: 'Default',
        code: `<Accordion style="default" items={[
  { id: '1', title: 'Title', content: 'Content.' },
  { id: '2', title: 'Title', content: 'Content.' },
]} />`,
        props: {
          style: 'default',
          items: [
            { id: '1', title: 'Title', content: 'Content.' },
            { id: '2', title: 'Title', content: 'Content.' },
          ],
        },
      },
      {
        title: 'Shadow',
        code: `<Accordion style="shadow" items={[
  { id: '1', title: 'Title', content: 'Content.' },
  { id: '2', title: 'Title', content: 'Content.' },
]} />`,
        props: {
          style: 'shadow',
          items: [
            { id: '1', title: 'Title', content: 'Content.' },
            { id: '2', title: 'Title', content: 'Content.' },
          ],
        },
      },
      {
        title: 'Bordered',
        code: `<Accordion style="bordered" items={[
  { id: '1', title: 'Title', content: 'Content.' },
  { id: '2', title: 'Title', content: 'Content.' },
]} />`,
        props: {
          style: 'bordered',
          items: [
            { id: '1', title: 'Title', content: 'Content.' },
            { id: '2', title: 'Title', content: 'Content.' },
          ],
        },
      },
      {
        title: 'Splitted',
        code: `<Accordion style="splitted" items={[
  { id: '1', title: 'Title', content: 'Content.' },
  { id: '2', title: 'Title', content: 'Content.' },
]} />`,
        props: {
          style: 'splitted',
          items: [
            { id: '1', title: 'Title', content: 'Content.' },
            { id: '2', title: 'Title', content: 'Content.' },
          ],
        },
      },
    ],
  },
  {
    slug: 'alert',
    name: 'Alert',
    description: 'Contextual feedback messages for user actions or system states.',
    examples: [
      {
        title: 'Basic',
        code: `<Alert color="primary">A simple primary alert.</Alert>`,
        props: { color: 'primary', children: 'A simple primary alert.' },
      },
      {
        title: 'With dismiss',
        description: 'Use dismissible and onDismiss for closeable alerts.',
        code: `<Alert color="warning" dismissible onDismiss={() => {}}>Dismiss me.</Alert>`,
        props: { color: 'warning', dismissible: true, children: 'Dismiss me.' },
      },
    ],
    variants: [
      { label: 'Primary', props: { color: 'primary', children: 'Primary' } },
      { label: 'Success', props: { color: 'success', children: 'Success' } },
      { label: 'Warning', props: { color: 'warning', children: 'Warning' } },
      { label: 'Danger', props: { color: 'danger', children: 'Danger' } },
    ],
    propsTable: [
      { name: 'color', type: "'primary' | 'success' | 'warning' | 'danger'", default: "'primary'", description: 'Alert color.' },
      { name: 'variant', type: "'solid' | 'outline' | 'soft'", default: "'soft'", description: 'Visual style.' },
      { name: 'dismissible', type: 'boolean', default: 'false', description: 'Show dismiss button.' },
      { name: 'onDismiss', type: '() => void', default: '-', description: 'Called when dismiss is clicked.' },
    ],
    playground: true,
  },
  {
    slug: 'avatar',
    name: 'Avatar',
    description: 'User profile image or fallback initial.',
    examples: [
      {
        title: 'With image',
        code: `<Avatar src="/placeholder.svg" alt="User" />`,
        props: { src: '/placeholder.svg', alt: 'User' },
      },
      {
        title: 'Fallback',
        code: `<Avatar name="Jane Doe" />`,
        props: { name: 'Jane Doe' },
      },
    ],
  },
  {
    slug: 'avatar-group',
    name: 'Avatar Group',
    description: 'Stack or overlap multiple avatars.',
    examples: [
      {
        title: 'Basic',
        code: `<AvatarGroup avatars={[
  { name: 'Alice' },
  { name: 'Bob' },
  { name: 'Carol' },
]} />`,
        props: {
          avatars: [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Carol' }],
        },
      },
    ],
  },
  {
    slug: 'badge',
    name: 'Badge',
    description: 'Small count or label for status and counts.',
    examples: [
      {
        title: 'Solid',
        code: `<Badge color="primary">Primary</Badge>`,
        props: { color: 'primary', children: 'Primary' },
      },
      {
        title: 'Outline',
        code: `<Badge variant="outline" color="danger">Danger</Badge>`,
        props: { variant: 'outline', color: 'danger', children: 'Danger' },
      },
      {
        title: 'With dot',
        code: `<Badge dot color="success">Online</Badge>`,
        props: { dot: true, color: 'success', children: 'Online' },
      },
    ],
    variants: [
      { label: 'Primary', props: { color: 'primary', children: 'Primary' } },
      { label: 'Secondary', props: { color: 'secondary', children: 'Secondary' } },
      { label: 'Success', props: { color: 'success', children: 'Success' } },
      { label: 'Warning', props: { color: 'warning', children: 'Warning' } },
      { label: 'Danger', props: { color: 'danger', children: 'Danger' } },
    ],
    propsTable: [
      { name: 'color', type: "'primary' | 'secondary' | 'success' | 'warning' | 'danger'", default: "'primary'", description: 'Badge color.' },
      { name: 'variant', type: "'solid' | 'outline' | 'soft'", default: "'solid'", description: 'Visual style.' },
      { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Badge size.' },
      { name: 'dot', type: 'boolean', default: 'false', description: 'Show status dot.' },
    ],
    playground: true,
  },
  {
    slug: 'button',
    name: 'Button',
    description: 'Actions and form submission triggers.',
    examples: [
      {
        title: 'Solid',
        code: `<Button color="primary">Primary</Button>`,
        props: { color: 'primary', children: 'Primary' },
      },
      {
        title: 'Outline',
        code: `<Button variant="outline" color="primary">Outline</Button>`,
        props: { variant: 'outline', color: 'primary', children: 'Outline' },
      },
      {
        title: 'Sizes',
        code: `<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>`,
        props: { children: 'Sizes demo' },
      },
      {
        title: 'Disabled',
        code: `<Button disabled>Disabled</Button>`,
        props: { disabled: true, children: 'Disabled' },
      },
    ],
    variants: [
      { label: 'Solid primary', props: { color: 'primary', children: 'Primary' } },
      { label: 'Solid danger', props: { color: 'danger', children: 'Danger' } },
      { label: 'Outline', props: { variant: 'outline', color: 'primary', children: 'Outline' } },
      { label: 'Ghost', props: { variant: 'ghost', color: 'primary', children: 'Ghost' } },
      { label: 'Link', props: { variant: 'link', color: 'primary', children: 'Link' } },
    ],
    propsTable: [
      { name: 'color', type: "'primary' | 'secondary' | 'success' | 'warning' | 'danger'", default: "'primary'", description: 'Button color.' },
      { name: 'variant', type: "'solid' | 'outline' | 'ghost' | 'link'", default: "'solid'", description: 'Visual style.' },
      { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Button size.' },
      { name: 'radius', type: "'none' | 'sm' | 'md' | 'lg' | 'full'", default: "'md'", description: 'Border radius.' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the button.' },
    ],
    playground: true,
  },
  {
    slug: 'button-group',
    name: 'Button Group',
    description: 'Group related buttons together.',
    examples: [
      {
        title: 'Basic',
        code: `<ButtonGroup>
  <Button>Left</Button>
  <Button>Middle</Button>
  <Button>Right</Button>
</ButtonGroup>`,
        props: { children: 'Button group demo' },
      },
    ],
  },
  {
    slug: 'calendar',
    name: 'Calendar',
    description: 'Date picker and calendar view.',
    examples: [
      {
        title: 'Basic',
        code: `<Calendar value={new Date()} onChange={() => {}} />`,
        props: {},
      },
    ],
  },
  {
    slug: 'card',
    name: 'Card',
    description: 'Container for content with optional header and footer.',
    examples: [
      {
        title: 'With title and description',
        code: `<Card
  title="Card title"
  description="Supporting description text."
>
  Body content here.
</Card>`,
        props: {
          title: 'Card title',
          description: 'Supporting description text.',
          children: 'Body content here.',
        },
      },
      {
        title: 'With footer',
        code: `<Card title="Title" footer={<Button size="sm">Action</Button>}>
  Card body.
</Card>`,
        props: {
          title: 'Title',
          children: 'Card body.',
        },
      },
    ],
    propsTable: [
      { name: 'title', type: 'ReactNode', default: '-', description: 'Header title.' },
      { name: 'description', type: 'ReactNode', default: '-', description: 'Header description.' },
      { name: 'header', type: 'ReactNode', default: '-', description: 'Custom header (overrides title/description).' },
      { name: 'footer', type: 'ReactNode', default: '-', description: 'Footer content.' },
    ],
  },
  {
    slug: 'carousel',
    name: 'Carousel',
    description: 'Sliding content or image gallery.',
    examples: [
      {
        title: 'Basic',
        code: `<Carousel items={['Slide 1', 'Slide 2', 'Slide 3']} />`,
        props: { items: ['Slide 1', 'Slide 2', 'Slide 3'] },
      },
    ],
  },
  {
    slug: 'checkbox',
    name: 'Checkbox',
    description: 'Single checkbox for boolean input.',
    examples: [
      {
        title: 'Basic',
        code: `<Checkbox label="Accept terms" checked={false} onChange={() => {}} />`,
        props: { label: 'Accept terms', checked: false },
      },
    ],
    playground: true,
  },
  {
    slug: 'checkbox-group',
    name: 'Checkbox Group',
    description: 'Group of checkboxes with a shared name.',
    examples: [
      {
        title: 'Basic',
        code: `<CheckboxGroup
  label="Toppings"
  options={[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]}
  value={[]}
  onChange={() => {}}
/>`,
        props: {},
      },
    ],
  },
  {
    slug: 'chip',
    name: 'Chip',
    description: 'Compact label or filter tag, often removable.',
    examples: [
      {
        title: 'Basic',
        code: `<Chip onRemove={() => {}}>Chip</Chip>`,
        props: { children: 'Chip' },
      },
    ],
  },
  {
    slug: 'code',
    name: 'Code',
    description: 'Inline or block code snippet styling.',
    examples: [
      {
        title: 'Inline',
        code: `<Code>const x = 1;</Code>`,
        props: { children: 'const x = 1;' },
      },
      {
        title: 'Block',
        code: `<Code block>{\`function hello() {
  return 'world';
}\`}</Code>`,
        props: { block: true, children: "function hello() {\n  return 'world';\n}" },
      },
    ],
  },
  {
    slug: 'divider',
    name: 'Divider',
    description: 'Horizontal or vertical separator line.',
    examples: [
      {
        title: 'Horizontal',
        code: `<Divider />`,
        props: {},
      },
    ],
  },
  {
    slug: 'input',
    name: 'Input',
    description: 'Text input with optional label and error.',
    examples: [
      {
        title: 'Basic',
        code: `<Input placeholder="Enter text" />`,
        props: { placeholder: 'Enter text' },
      },
      {
        title: 'With label',
        code: `<Input label="Email" type="email" placeholder="you@example.com" />`,
        props: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
      },
      {
        title: 'With error',
        code: `<Input label="Email" error="Invalid email" />`,
        props: { label: 'Email', error: 'Invalid email' },
      },
    ],
    propsTable: [
      { name: 'label', type: 'string', default: '-', description: 'Label text.' },
      { name: 'error', type: 'string', default: '-', description: 'Error message (shows below input).' },
    ],
    playground: true,
  },
  {
    slug: 'input-otp',
    name: 'Input OTP',
    description: 'One-time code or PIN input with separate cells.',
    examples: [
      {
        title: 'Basic',
        code: `<InputOTP length={6} value="" onChange={() => {}} />`,
        props: { length: 6, value: '' },
      },
    ],
  },
  {
    slug: 'kbd',
    name: 'Kbd',
    description: 'Keyboard key styling for shortcuts.',
    examples: [
      {
        title: 'Basic',
        code: `<Kbd>Ctrl</Kbd> + <Kbd>S</Kbd>`,
        props: { children: 'Ctrl' },
      },
    ],
  },
  {
    slug: 'link',
    name: 'Link',
    description: 'Styled anchor or Next.js Link.',
    examples: [
      {
        title: 'Basic',
        code: `<Link href="#">Go somewhere</Link>`,
        props: { href: '#', children: 'Go somewhere' },
      },
    ],
  },
  {
    slug: 'number-input',
    name: 'Number Input',
    description: 'Numeric input with optional stepper.',
    examples: [
      {
        title: 'Basic',
        code: `<NumberInput value={0} onChange={() => {}} min={0} max={10} />`,
        props: { value: 0, min: 0, max: 10 },
      },
    ],
    playground: true,
  },
  {
    slug: 'progress',
    name: 'Progress',
    description: 'Progress bar for completion or loading.',
    examples: [
      {
        title: 'Basic',
        code: `<Progress value={60} max={100} />`,
        props: { value: 60, max: 100 },
      },
    ],
  },
  {
    slug: 'radio',
    name: 'Radio',
    description: 'Single selection from a list of options.',
    examples: [
      {
        title: 'Basic',
        code: `<Radio name="choice" label="Option A" checked={false} onChange={() => {}} />`,
        props: { name: 'choice', label: 'Option A', checked: false },
      },
    ],
  },
  {
    slug: 'select',
    name: 'Select',
    description: 'Dropdown for choosing one or more options.',
    examples: [
      {
        title: 'Basic',
        code: `<Select
  options={[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]}
  value="a"
  onChange={() => {}}
/>`,
        props: {
          options: [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }],
          value: 'a',
        },
      },
    ],
    playground: true,
  },
  {
    slug: 'slider',
    name: 'Slider',
    description: 'Range input for numeric values.',
    examples: [
      {
        title: 'Basic',
        code: `<Slider value={50} min={0} max={100} onChange={() => {}} />`,
        props: { value: 50, min: 0, max: 100 },
      },
    ],
    playground: true,
  },
  {
    slug: 'spinner',
    name: 'Spinner',
    description: 'Loading indicator.',
    examples: [
      {
        title: 'Basic',
        code: `<Spinner />`,
        props: {},
      },
    ],
  },
  {
    slug: 'switch',
    name: 'Switch',
    description: 'Toggle for boolean settings.',
    examples: [
      {
        title: 'Basic',
        code: `<Switch checked={false} onChange={() => {}} />`,
        props: { checked: false },
      },
    ],
    playground: true,
  },
  {
    slug: 'table',
    name: 'Table',
    description: 'Data table with headers and rows.',
    examples: [
      {
        title: 'Basic',
        code: `<Table
  columns={[{ key: 'name', header: 'Name' }, { key: 'age', header: 'Age' }]}
  rows={[{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }]}
/>`,
        props: {
          columns: [{ key: 'name', header: 'Name' }, { key: 'age', header: 'Age' }],
          rows: [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }],
        },
      },
    ],
  },
  {
    slug: 'tabs',
    name: 'Tabs',
    description: 'Tabbed navigation for switching content.',
    examples: [
      {
        title: 'Basic',
        code: `<Tabs
  tabs={[{ id: '1', label: 'Tab 1', content: 'Content 1' }, { id: '2', label: 'Tab 2', content: 'Content 2' }]}
  activeId="1"
  onChange={() => {}}
/>`,
        props: {
          tabs: [
            { id: '1', label: 'Tab 1', content: 'Content 1' },
            { id: '2', label: 'Tab 2', content: 'Content 2' },
          ],
          activeId: '1',
        },
      },
    ],
    playground: true,
  },
  {
    slug: 'top-nav',
    name: 'Top Nav',
    description: 'Main navigation bar with brand and links; highlights the active route.',
    examples: [
      {
        title: 'Basic',
        code: `<TopNav
  brand="My App"
  items={[
    { href: '/', label: 'Home' },
    { href: '/docs', label: 'Components' },
  ]}
/>`,
        props: {
          brand: 'My App',
          items: [
            { href: '/', label: 'Home' },
            { href: '/docs', label: 'Components' },
          ],
        },
      },
      {
        title: 'With more links',
        code: `<TopNav
  brand="Dashboard"
  items={[
    { href: '/', label: 'Home' },
    { href: '/docs', label: 'Docs' },
    { href: '/about', label: 'About' },
  ]}
/>`,
        props: {
          brand: 'Dashboard',
          items: [
            { href: '/', label: 'Home' },
            { href: '/docs', label: 'Docs' },
            { href: '/about', label: 'About' },
          ],
        },
      },
    ],
    propsTable: [
      { name: 'brand', type: 'ReactNode', default: "'App'", description: 'Brand text or node (links to /).' },
      { name: 'items', type: 'TopNavItem[]', default: '-', description: 'Navigation links: { href, label }.' },
    ],
  },
  {
    slug: 'toast',
    name: 'Toast',
    description: 'Temporary notification messages via ToastProvider and useToast.',
    examples: [
      {
        title: 'Usage',
        code: `// Wrap app with <ToastProvider>
// In a component: const { toast } = useToast();
// toast({ title: 'Saved', description: 'Your changes were saved.' });`,
        props: {},
      },
    ],
  },
  {
    slug: 'tooltip',
    name: 'Tooltip',
    description: 'Short hint on hover or focus.',
    examples: [
      {
        title: 'Basic',
        code: `<Tooltip content="Help text"><Button>Hover me</Button></Tooltip>`,
        props: { content: 'Help text', children: null },
      },
    ],
  },
  {
    slug: 'user',
    name: 'User',
    description: 'Display user name, avatar, and optional meta.',
    examples: [
      {
        title: 'Basic',
        code: `<User name="Jane Doe" description="jane@example.com" />`,
        props: { name: 'Jane Doe', description: 'jane@example.com' },
      },
    ],
  },
];

export function getDocBySlug(slug: string): ComponentDoc | undefined {
  return COMPONENT_DOCS.find((d) => d.slug === slug);
}

export function getAllSlugs(): string[] {
  return COMPONENT_DOCS.map((d) => d.slug);
}
