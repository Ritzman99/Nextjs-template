'use client';

import type { ReactNode } from 'react';
import {
  Accordion,
  Alert,
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  ButtonGroup,
  Card,
  Carousel,
  Checkbox,
  Chip,
  Code,
  Divider,
  Input,
  Kbd,
  Link,
  Progress,
  Spinner,
  Table,
  TopNav,
  User,
} from '@/components/ui';
import type { DocVariant } from '../registry';

// Components that need wrapper or different API for docs (e.g. Tabs with items/value)
import { Tabs } from '@/components/ui/Tabs';
import { Calendar } from '@/components/ui/Calendar';
import { CheckboxGroup } from '@/components/ui/CheckboxGroup';
import { InputOTP } from '@/components/ui/InputOTP';
import { NumberInput } from '@/components/ui/NumberInput';
import { Radio } from '@/components/ui/Radio';
import { Select } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { Switch } from '@/components/ui/Switch';
import { Tooltip } from '@/components/ui/Tooltip';
import { ToastProvider, useToast } from '@/components/ui/Toast';

function asDocComponent<T>(C: React.ComponentType<T>): React.ComponentType<Record<string, unknown>> {
  return C as unknown as React.ComponentType<Record<string, unknown>>;
}

const COMPONENT_MAP: Record<string, React.ComponentType<Record<string, unknown>>> = {
  accordion: asDocComponent(Accordion),
  alert: asDocComponent(Alert),
  avatar: asDocComponent(Avatar),
  'avatar-group': asDocComponent(AvatarGroup),
  badge: asDocComponent(Badge),
  button: asDocComponent(Button),
  'button-group': asDocComponent(ButtonGroup),
  calendar: asDocComponent(Calendar),
  card: asDocComponent(Card),
  carousel: asDocComponent(Carousel),
  checkbox: asDocComponent(Checkbox),
  'checkbox-group': asDocComponent(CheckboxGroup),
  chip: asDocComponent(Chip),
  code: asDocComponent(Code),
  divider: asDocComponent(Divider),
  input: asDocComponent(Input),
  'input-otp': asDocComponent(InputOTP),
  kbd: asDocComponent(Kbd),
  link: asDocComponent(Link),
  'number-input': asDocComponent(NumberInput),
  progress: asDocComponent(Progress),
  radio: asDocComponent(Radio),
  select: asDocComponent(Select),
  slider: asDocComponent(Slider),
  spinner: asDocComponent(Spinner),
  switch: asDocComponent(Switch),
  table: asDocComponent(Table),
  tabs: asDocComponent(Tabs),
  'top-nav': asDocComponent(TopNav),
  tooltip: asDocComponent(Tooltip),
  user: asDocComponent(User),
};

function getComponent(slug: string): React.ComponentType<Record<string, unknown>> | null {
  return COMPONENT_MAP[slug] ?? null;
}

interface ExampleRendererProps {
  slug: string;
  props?: Record<string, unknown>;
}

/** Renders the UI component for a given doc slug with the given props. */
export function ExampleRenderer({ slug, props: propsIn = {} }: ExampleRendererProps) {
  const Component = getComponent(slug);
  if (!Component) return <span className="text-muted">Component not found: {slug}</span>;

  const { children, ...rest } = propsIn;
  const resolvedChildren =
    children != null
      ? typeof children === 'string'
        ? children
        : (children as ReactNode)
      : undefined;

  // Component-specific overrides for doc examples
  if (slug === 'avatar' && 'name' in propsIn) {
    return (
      <Avatar
        {...(rest as object)}
        fallback={String((propsIn as { name?: string }).name ?? '')}
      />
    );
  }
  if (slug === 'avatar-group') {
    const items = (propsIn.items ?? propsIn.avatars) as Array<{ name?: string; fallback?: string }> | undefined;
    const list = Array.isArray(items)
      ? items.map((i) => ({ fallback: i?.name ?? i?.fallback ?? '?' }))
      : [];
    return <AvatarGroup items={list} />;
  }
  if (slug === 'carousel') {
    const items = (propsIn.items ?? []) as string[];
    return (
      <Carousel>
        {items.map((item, i) => (
          <div key={i} style={{ padding: 16, minHeight: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {item}
          </div>
        ))}
      </Carousel>
    );
  }
  if (slug === 'chip') {
    return (
      <Chip
        label={resolvedChildren ?? 'Chip'}
        onRemove={() => {}}
        {...(rest as object)}
      />
    );
  }
  if (slug === 'tabs') {
    const tabs = (propsIn.tabs ?? propsIn.items) as Array<{ id: string; label: string; content: string }> | undefined;
    const activeId = (propsIn.activeId ?? propsIn.value ?? tabs?.[0]?.id) as string | undefined;
    const items = Array.isArray(tabs)
      ? tabs.map((t) => ({ id: t.id, label: t.label, content: t.content }))
      : [];
    return <Tabs items={items} value={activeId} onChange={() => {}} />;
  }
  if (slug === 'table') {
    const columns = (propsIn.columns ?? []) as Array<{ key: string; header: string }>;
    const data = (propsIn.data ?? propsIn.rows ?? []) as Record<string, unknown>[];
    return <Table columns={columns} data={data} />;
  }
  if (slug === 'alert' && propsIn.dismissible) {
    return (
      <Alert
        {...(rest as object)}
        dismissible
        onDismiss={() => {}}
      >
        {resolvedChildren}
      </Alert>
    );
  }
  if (slug === 'toast') {
    return (
      <ToastProvider>
        <ToastDemo />
      </ToastProvider>
    );
  }
  if (slug === 'tooltip') {
    return (
      <Tooltip content={(propsIn.content as string) ?? 'Tooltip'}>
        <Button size="sm">Hover me</Button>
      </Tooltip>
    );
  }
  if (slug === 'button-group') {
    return (
      <ButtonGroup>
        <Button size="sm">Left</Button>
        <Button size="sm">Middle</Button>
        <Button size="sm">Right</Button>
      </ButtonGroup>
    );
  }
  if (slug === 'calendar') {
    return <Calendar value={new Date()} onChange={() => {}} />;
  }
  if (slug === 'checkbox') {
    return (
      <Checkbox
        label={(propsIn.label as string) ?? 'Label'}
        checked={propsIn.checked as boolean}
        onChange={() => {}}
      />
    );
  }
  if (slug === 'checkbox-group') {
    return (
      <CheckboxGroup
        label="Toppings"
        options={[
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ]}
        value={[]}
        onChange={() => {}}
      />
    );
  }
  if (slug === 'input-otp') {
    return <InputOTP length={(propsIn.length as number) ?? 6} value="" onChange={() => {}} />;
  }
  if (slug === 'number-input') {
    return (
      <NumberInput
        value={(propsIn.value as number) ?? 0}
        min={(propsIn.min as number) ?? 0}
        max={(propsIn.max as number) ?? 10}
        onChange={() => {}}
      />
    );
  }
  if (slug === 'radio') {
    return (
      <Radio
        name="demo"
        label={(propsIn.label as string) ?? 'Option A'}
        checked={propsIn.checked as boolean}
        onChange={() => {}}
      />
    );
  }
  if (slug === 'select') {
    const options = (propsIn.options ?? []) as Array<{ value: string; label: string }>;
    return (
      <Select
        options={options.length ? options : [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]}
        value={(propsIn.value as string) ?? options[0]?.value}
        onChange={() => {}}
      />
    );
  }
  if (slug === 'slider') {
    return (
      <Slider
        value={(propsIn.value as number) ?? 50}
        min={(propsIn.min as number) ?? 0}
        max={(propsIn.max as number) ?? 100}
        onChange={() => {}}
      />
    );
  }
  if (slug === 'switch') {
    return <Switch checked={(propsIn.checked as boolean) ?? false} onChange={() => {}} />;
  }
  if (slug === 'card' && propsIn.footer !== undefined) {
    return (
      <Card
        title={propsIn.title as string}
        description={propsIn.description as string}
        footer={<Button size="sm">Action</Button>}
      >
        {resolvedChildren}
      </Card>
    );
  }
  if (slug === 'button' && resolvedChildren === 'Sizes demo') {
    return (
      <>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </>
    );
  }

  return (
    <Component {...rest} {...(resolvedChildren !== undefined ? { children: resolvedChildren } : {})}>
      {resolvedChildren}
    </Component>
  );
}

function ToastDemo() {
  const { toast } = useToast();
  return (
    <Button size="sm" onClick={() => toast.success('Your changes were saved.')}>
      Show toast
    </Button>
  );
}

interface VariantRendererProps {
  slug: string;
  variant: DocVariant;
}

export function VariantRenderer({ slug, variant }: VariantRendererProps) {
  return (
    <ExampleRenderer slug={slug} props={variant.props} />
  );
}
