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

export type DocCategory = 'layout' | 'components';

export interface ComponentDoc {
  slug: string;
  name: string;
  description: string;
  /** When set to 'layout', appears in the Layout section; otherwise Components. */
  category?: DocCategory;
  examples: DocExample[];
  variants?: DocVariant[];
  propsTable?: PropRow[];
  /** When true, show an interactive playground section. */
  playground?: boolean;
}

export const COMPONENT_DOCS: ComponentDoc[] = [
  // Layout
  {
    slug: 'sidebar',
    name: 'Sidebar',
    category: 'layout',
    description: 'Fixed or static sidebar navigation with optional overview link and link groups.',
    examples: [
      {
        title: 'Basic',
        code: `<Sidebar
  overviewLink={{ href: '/docs', label: 'Overview' }}
  groupLabel="Components"
  links={[
    { href: '/docs/components/button', label: 'Button' },
    { href: '/docs/components/card', label: 'Card' },
  ]}
/>`,
        props: {
          overviewLink: { href: '/docs', label: 'Overview' },
          groupLabel: 'Components',
          links: [
            { href: '/docs/components/button', label: 'Button' },
            { href: '/docs/components/card', label: 'Card' },
          ],
        },
      },
    ],
    propsTable: [
      { name: 'overviewLink', type: 'SidebarLink | undefined', default: '-', description: 'Optional first link (e.g. Overview).' },
      { name: 'groupLabel', type: 'string', default: "'Components'", description: 'Label for the link group.' },
      { name: 'links', type: 'SidebarLink[]', default: '-', description: 'Navigation links: { href, label }.' },
      { name: 'ariaLabel', type: 'string', default: "'Sidebar navigation'", description: 'Accessible label for the nav.' },
    ],
  },
  {
    slug: 'stack',
    name: 'Stack',
    category: 'layout',
    description: 'Flex container for vertical or horizontal stacking with consistent gap.',
    examples: [
      {
        title: 'Vertical',
        code: `<Stack gap={2}>
  <span>Item 1</span>
  <span>Item 2</span>
  <span>Item 3</span>
</Stack>`,
        props: { gap: 2, children: null },
      },
      {
        title: 'Horizontal',
        code: `<Stack direction="row" gap={3} align="center">
  <span>One</span>
  <span>Two</span>
  <span>Three</span>
</Stack>`,
        props: { direction: 'row', gap: 3, align: 'center', children: null },
      },
    ],
    propsTable: [
      { name: 'direction', type: "'row' | 'column'", default: "'column'", description: 'Flex direction.' },
      { name: 'gap', type: 'number | string', default: '-', description: 'Gap (number → var(--unit-n), or CSS value).' },
      { name: 'align', type: "'start' | 'center' | 'end' | 'stretch' | 'baseline'", default: '-', description: 'Align items.' },
      { name: 'justify', type: "'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'", default: '-', description: 'Justify content.' },
      { name: 'wrap', type: 'boolean', default: 'false', description: 'Allow wrapping.' },
    ],
  },
  {
    slug: 'cluster',
    name: 'Cluster',
    category: 'layout',
    description: 'Inline flex wrap with gap for tags, chips, or button groups.',
    examples: [
      {
        title: 'Basic',
        code: `<Cluster gap={2}>
  <span>Tag 1</span>
  <span>Tag 2</span>
  <span>Tag 3</span>
</Cluster>`,
        props: { gap: 2, children: null },
      },
    ],
    propsTable: [
      { name: 'gap', type: 'number | string', default: '2', description: 'Gap between items.' },
      { name: 'justify', type: "'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'", default: '-', description: 'Justify content.' },
    ],
  },
  {
    slug: 'container',
    name: 'Container',
    category: 'layout',
    description: 'Max-width centering with horizontal padding for page content.',
    examples: [
      {
        title: 'Basic',
        code: `<Container maxWidth="lg">Centered content</Container>`,
        props: { maxWidth: 'lg', children: 'Centered content' },
      },
      {
        title: 'Sizes',
        code: `<Container maxWidth="md" padding={4}>Medium width</Container>`,
        props: { maxWidth: 'md', padding: 4, children: 'Medium width' },
      },
    ],
    propsTable: [
      { name: 'maxWidth', type: "'sm' | 'md' | 'lg' | 'xl' | 'full'", default: "'lg'", description: 'Max width preset.' },
      { name: 'padding', type: 'number | string', default: '-', description: 'Horizontal padding.' },
    ],
  },
  {
    slug: 'grid',
    name: 'Grid',
    category: 'layout',
    description: 'CSS Grid wrapper with configurable columns and gap.',
    examples: [
      {
        title: 'Basic',
        code: `<Grid columns={3} gap={4}>
  <div>1</div>
  <div>2</div>
  <div>3</div>
</Grid>`,
        props: { columns: 3, gap: 4, children: null },
      },
      {
        title: 'Auto-fill',
        code: `<Grid minChildWidth="200px" gap={3}>...</Grid>`,
        props: { minChildWidth: '200px', gap: 3, children: null },
      },
    ],
    propsTable: [
      { name: 'columns', type: 'number | string', default: '3', description: 'Column count or grid template.' },
      { name: 'gap', type: 'number | string', default: '4', description: 'Gap between cells.' },
      { name: 'minChildWidth', type: 'string', default: '-', description: 'Min width per child for auto-fill.' },
    ],
  },
  {
    slug: 'split',
    name: 'Split',
    category: 'layout',
    description: 'Two-pane layout with optional sidebar and main content area.',
    examples: [
      {
        title: 'Sidebar left',
        code: `<Split
  sidebar={<aside>Sidebar</aside>}
  main={<main>Main content</main>}
/>`,
        props: { sidebar: null, main: null },
      },
      {
        title: 'With side width',
        code: `<Split side="right" sideWidth="240px" sidebar={...} main={...} />`,
        props: { side: 'right', sideWidth: '240px' },
      },
    ],
    propsTable: [
      { name: 'side', type: "'left' | 'right'", default: "'left'", description: 'Which side the sidebar is on.' },
      { name: 'sideWidth', type: 'string', default: 'var(--sidebar-width)', description: 'Width of the sidebar.' },
      { name: 'sidebar', type: 'ReactNode', default: '-', description: 'Sidebar content.' },
      { name: 'main', type: 'ReactNode', default: '-', description: 'Main content.' },
    ],
  },
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
        code: `<Accordion variant="default" items={[
  { id: '1', title: 'Title', content: 'Content.' },
  { id: '2', title: 'Title', content: 'Content.' },
]} />`,
        props: {
          variant: 'default',
          items: [
            { id: '1', title: 'Title', content: 'Content.' },
            { id: '2', title: 'Title', content: 'Content.' },
          ],
        },
      },
      {
        title: 'Shadow',
        code: `<Accordion variant="shadow" items={[
  { id: '1', title: 'Title', content: 'Content.' },
  { id: '2', title: 'Title', content: 'Content.' },
]} />`,
        props: {
          variant: 'shadow',
          items: [
            { id: '1', title: 'Title', content: 'Content.' },
            { id: '2', title: 'Title', content: 'Content.' },
          ],
        },
      },
      {
        title: 'Bordered',
        code: `<Accordion variant="bordered" items={[
  { id: '1', title: 'Title', content: 'Content.' },
  { id: '2', title: 'Title', content: 'Content.' },
]} />`,
        props: {
          variant: 'bordered',
          items: [
            { id: '1', title: 'Title', content: 'Content.' },
            { id: '2', title: 'Title', content: 'Content.' },
          ],
        },
      },
      {
        title: 'Splitted',
        code: `<Accordion variant="splitted" items={[
  { id: '1', title: 'Title', content: 'Content.' },
  { id: '2', title: 'Title', content: 'Content.' },
]} />`,
        props: {
          variant: 'splitted',
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
        title: 'With sub content',
        description: 'Use subContent for secondary text below the main message.',
        code: `<Alert color="primary" subContent="You will get a reply soon.">Email sent.</Alert>`,
        props: { color: 'primary', children: 'Email sent.', subContent: 'You will get a reply soon.' },
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
      { name: 'color', type: "'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'", default: "'primary'", description: 'Alert color.' },
      { name: 'variant', type: "'solid' | 'outline' | 'soft'", default: "'soft'", description: 'Visual style.' },
      { name: 'icon', type: 'ReactNode', default: '-', description: 'Optional leading icon.' },
      { name: 'subContent', type: 'ReactNode', default: '-', description: 'Optional secondary content below the main message.' },
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
        code: `<Avatar src="/avatar/00012-profile-man.webp" alt="User" />`,
        props: { src: '/avatar/00012-profile-man.webp', alt: 'User' },
      },
      {
        title: 'Fallback',
        code: `<Avatar name="Jane Doe" />`,
        props: { name: 'Jane Doe' },
      },
      {
        title: 'Colors',
        description: 'default, primary, secondary, success, warning, danger.',
        code: `<Avatar color="default" fallback="A" />
<Avatar color="primary" fallback="A" />
<Avatar color="secondary" fallback="A" />
<Avatar color="success" fallback="A" />
<Avatar color="warning" fallback="A" />
<Avatar color="danger" fallback="A" />`,
        props: { _exampleMode: 'colors' },
      },
      {
        title: 'Sizes',
        description: 'sm, md, lg.',
        code: `<Avatar size="sm" fallback="A" />
<Avatar size="md" fallback="A" />
<Avatar size="lg" fallback="A" />`,
        props: { _exampleMode: 'sizes' },
      },
      {
        title: 'Radius',
        description: 'none, sm, md, lg, full.',
        code: `<Avatar radius="none" fallback="A" />
<Avatar radius="sm" fallback="A" />
<Avatar radius="md" fallback="A" />
<Avatar radius="lg" fallback="A" />
<Avatar radius="full" fallback="A" />`,
        props: { _exampleMode: 'radius' },
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
      {
        title: 'Shadow',
        code: `<Button variant="shadow" color="primary">Shadow</Button>`,
        props: { variant: 'shadow', color: 'primary', children: 'Shadow' },
      },
      {
        title: 'Default color',
        code: `<Button color="default">Default</Button>`,
        props: { color: 'default', children: 'Default' },
      },
    ],
    variants: [
      { label: 'Solid primary', props: { color: 'primary', children: 'Primary' } },
      { label: 'Solid danger', props: { color: 'danger', children: 'Danger' } },
      { label: 'Outline', props: { variant: 'outline', color: 'primary', children: 'Outline' } },
      { label: 'Ghost', props: { variant: 'ghost', color: 'primary', children: 'Ghost' } },
      { label: 'Shadow', props: { variant: 'shadow', color: 'primary', children: 'Shadow' } },
      { label: 'Link', props: { variant: 'link', color: 'primary', children: 'Link' } },
    ],
    propsTable: [
      { name: 'color', type: "'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'", default: "'primary'", description: 'Button color.' },
      { name: 'variant', type: "'solid' | 'outline' | 'ghost' | 'shadow' | 'link'", default: "'solid'", description: 'Visual style.' },
      { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Button size.' },
      { name: 'radius', type: "'none' | 'sm' | 'md' | 'lg' | 'full'", default: "'md'", description: 'Border radius.' },
      { name: 'disabled', type: 'boolean', default: 'false', description: 'Disable the button.' },
    ],
    playground: true,
  },
  {
    slug: 'button-group',
    name: 'Button Group',
    description: 'Group related buttons together. Pass variant, color, radius, and size to style all child buttons from the group.',
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
      {
        title: 'Variants (solid, outline, ghost, shadow)',
        code: `<>
  <ButtonGroup variant="solid" color="primary"><Button>Solid</Button><Button>Primary</Button></ButtonGroup>
  <ButtonGroup variant="outline" color="primary"><Button>Outline</Button><Button>Primary</Button></ButtonGroup>
  <ButtonGroup variant="ghost" color="primary"><Button>Ghost</Button><Button>Primary</Button></ButtonGroup>
  <ButtonGroup variant="shadow" color="primary"><Button>Shadow</Button><Button>Primary</Button></ButtonGroup>
</>`,
        props: { _exampleMode: 'variants' },
      },
      {
        title: 'Colors (6 base colors)',
        code: `<>
  <ButtonGroup variant="outline" color="default"><Button>Default</Button></ButtonGroup>
  <ButtonGroup variant="outline" color="primary"><Button>Primary</Button></ButtonGroup>
  <ButtonGroup variant="outline" color="secondary"><Button>Secondary</Button></ButtonGroup>
  <ButtonGroup variant="outline" color="success"><Button>Success</Button></ButtonGroup>
  <ButtonGroup variant="outline" color="warning"><Button>Warning</Button></ButtonGroup>
  <ButtonGroup variant="outline" color="danger"><Button>Danger</Button></ButtonGroup>
</>`,
        props: { _exampleMode: 'colors' },
      },
      {
        title: 'Radius (none, sm, md, lg, full)',
        code: `<>
  <ButtonGroup variant="solid" color="primary" radius="none"><Button>None</Button></ButtonGroup>
  <ButtonGroup variant="solid" color="primary" radius="sm"><Button>Sm</Button></ButtonGroup>
  <ButtonGroup variant="solid" color="primary" radius="md"><Button>Md</Button></ButtonGroup>
  <ButtonGroup variant="solid" color="primary" radius="lg"><Button>Lg</Button></ButtonGroup>
  <ButtonGroup variant="solid" color="primary" radius="full"><Button>Full</Button></ButtonGroup>
</>`,
        props: { _exampleMode: 'radius' },
      },
      {
        title: 'Sizes (sm, md, lg)',
        code: `<>
  <ButtonGroup variant="outline" color="primary" size="sm"><Button>Small</Button><Button>Group</Button></ButtonGroup>
  <ButtonGroup variant="outline" color="primary" size="md"><Button>Medium</Button><Button>Group</Button></ButtonGroup>
  <ButtonGroup variant="outline" color="primary" size="lg"><Button>Large</Button><Button>Group</Button></ButtonGroup>
</>`,
        props: { _exampleMode: 'sizes' },
      },
      {
        title: 'With group props',
        code: `<ButtonGroup variant="outline" color="primary" size="md" radius="md">
  <Button>Left</Button>
  <Button>Middle</Button>
  <Button>Right</Button>
</ButtonGroup>`,
        props: { variant: 'outline', color: 'primary', size: 'md', radius: 'md', children: 'Button group demo' },
      },
      {
        title: 'Attached (no gap)',
        code: `<ButtonGroup variant="shadow" color="primary" attached>
  <Button>One</Button>
  <Button>Two</Button>
  <Button>Three</Button>
</ButtonGroup>`,
        props: { variant: 'shadow', color: 'primary', attached: true, children: 'Button group demo' },
      },
      {
        title: 'Vertical',
        code: `<ButtonGroup variant="outline" color="secondary" orientation="vertical">
  <Button>First</Button>
  <Button>Second</Button>
  <Button>Third</Button>
</ButtonGroup>`,
        props: { variant: 'outline', color: 'secondary', orientation: 'vertical', children: 'Button group demo' },
      },
    ],
    propsTable: [
      { name: 'variant', type: "'solid' | 'outline' | 'ghost' | 'shadow' | 'link'", default: '-', description: 'Default variant for child buttons.' },
      { name: 'color', type: "'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'", default: '-', description: 'Default color for child buttons.' },
      { name: 'size', type: "'sm' | 'md' | 'lg'", default: '-', description: 'Default size for child buttons.' },
      { name: 'radius', type: "'none' | 'sm' | 'md' | 'lg' | 'full'", default: '-', description: 'Default radius for child buttons.' },
      { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Layout direction.' },
      { name: 'attached', type: 'boolean', default: 'false', description: 'Remove gap between buttons.' },
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
    category: 'layout',
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
