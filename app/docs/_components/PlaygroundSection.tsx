'use client';

import { useState, useMemo } from 'react';
import { Button, Badge, Alert, Input, Checkbox, Select, Switch, Slider, NumberInput } from '@/components/ui';
import { Tabs } from '@/components/ui/Tabs';
import { DocPreview } from './DocPreview';
import { CodeExample } from './CodeExample';
import styles from '../docs.module.scss';

type ButtonColor = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';

interface PlaygroundSectionProps {
  slug: string;
  name: string;
}

export function PlaygroundSection({ slug, name }: PlaygroundSectionProps) {
  const [buttonColor, setButtonColor] = useState<ButtonColor>('primary');
  const [buttonSize, setButtonSize] = useState<ButtonSize>('md');
  const [buttonVariant, setButtonVariant] = useState<ButtonVariant>('solid');
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [buttonChildren, setButtonChildren] = useState('Click me');

  const [badgeColor, setBadgeColor] = useState<ButtonColor>('primary');
  const [badgeVariant, setBadgeVariant] = useState<'solid' | 'outline' | 'soft'>('solid');
  const [badgeDot, setBadgeDot] = useState(false);
  const [badgeChildren, setBadgeChildren] = useState('Badge');

  const [alertColor, setAlertColor] = useState<'primary' | 'success' | 'warning' | 'danger'>('primary');
  const [alertVariant, setAlertVariant] = useState<'solid' | 'outline' | 'soft'>('soft');
  const [alertChildren, setAlertChildren] = useState('This is an alert message.');

  const [inputLabel, setInputLabel] = useState('');
  const [inputPlaceholder, setInputPlaceholder] = useState('Placeholder');
  const [inputError, setInputError] = useState('');

  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [checkboxLabel, setCheckboxLabel] = useState('Checkbox label');

  const [selectValue, setSelectValue] = useState('a');
  const selectOptions = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
    { value: 'c', label: 'Option C' },
  ];

  const [switchChecked, setSwitchChecked] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [numberValue, setNumberValue] = useState(5);

  const [tabsActiveId, setTabsActiveId] = useState('1');
  const tabsItems = [
    { id: '1', label: 'Tab 1', content: 'Content for tab 1.' },
    { id: '2', label: 'Tab 2', content: 'Content for tab 2.' },
    { id: '3', label: 'Tab 3', content: 'Content for tab 3.' },
  ];

  const code = useMemo(() => {
    if (slug === 'button') {
      const attrs = [
        `color="${buttonColor}"`,
        `variant="${buttonVariant}"`,
        `size="${buttonSize}"`,
        buttonDisabled && 'disabled',
      ].filter(Boolean);
      return `<Button ${attrs.join(' ')}>\n  ${JSON.stringify(buttonChildren)}\n</Button>`;
    }
    if (slug === 'badge') {
      const attrs = [
        `color="${badgeColor}"`,
        `variant="${badgeVariant}"`,
        badgeDot && 'dot',
      ].filter(Boolean);
      return `<Badge ${attrs.join(' ')}>\n  ${JSON.stringify(badgeChildren)}\n</Badge>`;
    }
    if (slug === 'alert') {
      const attrs = [`color="${alertColor}"`, `variant="${alertVariant}"`].filter(Boolean);
      return `<Alert ${attrs.join(' ')}>\n  ${JSON.stringify(alertChildren)}\n</Alert>`;
    }
    if (slug === 'input') {
      const attrs = [
        inputLabel && `label="${inputLabel}"`,
        `placeholder="${inputPlaceholder}"`,
        inputError && `error="${inputError}"`,
      ].filter(Boolean);
      return `<Input ${attrs.join(' ')} />`;
    }
    if (slug === 'checkbox') {
      return `<Checkbox label="${checkboxLabel}" checked={${checkboxChecked}} onChange={...} />`;
    }
    if (slug === 'select') {
      return `<Select options={[...]} value="${selectValue}" onChange={...} />`;
    }
    if (slug === 'switch') {
      return `<Switch checked={${switchChecked}} onChange={...} />`;
    }
    if (slug === 'slider') {
      return `<Slider value={${sliderValue}} min={0} max={100} onChange={...} />`;
    }
    if (slug === 'number-input') {
      return `<NumberInput value={${numberValue}} min={0} max={10} onChange={...} />`;
    }
    if (slug === 'tabs') {
      return `<Tabs items={[...]} value="${tabsActiveId}" onChange={...} />`;
    }
    return '';
  }, [
    slug,
    buttonColor,
    buttonVariant,
    buttonSize,
    buttonDisabled,
    buttonChildren,
    badgeColor,
    badgeVariant,
    badgeDot,
    badgeChildren,
    alertColor,
    alertVariant,
    alertChildren,
    inputLabel,
    inputPlaceholder,
    inputError,
    checkboxLabel,
    checkboxChecked,
    selectValue,
    switchChecked,
    sliderValue,
    numberValue,
    tabsActiveId,
  ]);

  const controls = (
    <div className={styles.playgroundControls}>
      {slug === 'button' && (
        <>
          <Control label="Variant">
            <select
              value={buttonVariant}
              onChange={(e) => setButtonVariant(e.target.value as ButtonVariant)}
              aria-label="Variant"
            >
              <option value="solid">solid</option>
              <option value="outline">outline</option>
              <option value="ghost">ghost</option>
              <option value="link">link</option>
            </select>
          </Control>
          <Control label="Color">
            <select
              value={buttonColor}
              onChange={(e) => setButtonColor(e.target.value as ButtonColor)}
              aria-label="Color"
            >
              <option value="primary">primary</option>
              <option value="secondary">secondary</option>
              <option value="success">success</option>
              <option value="warning">warning</option>
              <option value="danger">danger</option>
            </select>
          </Control>
          <Control label="Size">
            <select
              value={buttonSize}
              onChange={(e) => setButtonSize(e.target.value as ButtonSize)}
              aria-label="Size"
            >
              <option value="sm">sm</option>
              <option value="md">md</option>
              <option value="lg">lg</option>
            </select>
          </Control>
          <Control label="Disabled">
            <input
              type="checkbox"
              checked={buttonDisabled}
              onChange={(e) => setButtonDisabled(e.target.checked)}
              aria-label="Disabled"
            />
          </Control>
          <Control label="Children">
            <input
              type="text"
              value={buttonChildren}
              onChange={(e) => setButtonChildren(e.target.value)}
              aria-label="Button text"
            />
          </Control>
        </>
      )}
      {slug === 'badge' && (
        <>
          <Control label="Variant">
            <select
              value={badgeVariant}
              onChange={(e) => setBadgeVariant(e.target.value as 'solid' | 'outline' | 'soft')}
              aria-label="Variant"
            >
              <option value="solid">solid</option>
              <option value="outline">outline</option>
              <option value="soft">soft</option>
            </select>
          </Control>
          <Control label="Color">
            <select
              value={badgeColor}
              onChange={(e) => setBadgeColor(e.target.value as ButtonColor)}
              aria-label="Color"
            >
              <option value="primary">primary</option>
              <option value="secondary">secondary</option>
              <option value="success">success</option>
              <option value="warning">warning</option>
              <option value="danger">danger</option>
            </select>
          </Control>
          <Control label="Dot">
            <input
              type="checkbox"
              checked={badgeDot}
              onChange={(e) => setBadgeDot(e.target.checked)}
              aria-label="Show dot"
            />
          </Control>
          <Control label="Children">
            <input
              type="text"
              value={badgeChildren}
              onChange={(e) => setBadgeChildren(e.target.value)}
              aria-label="Badge text"
            />
          </Control>
        </>
      )}
      {slug === 'alert' && (
        <>
          <Control label="Variant">
            <select
              value={alertVariant}
              onChange={(e) => setAlertVariant(e.target.value as 'solid' | 'outline' | 'soft')}
              aria-label="Variant"
            >
              <option value="solid">solid</option>
              <option value="outline">outline</option>
              <option value="soft">soft</option>
            </select>
          </Control>
          <Control label="Color">
            <select
              value={alertColor}
              onChange={(e) => setAlertColor(e.target.value as 'primary' | 'success' | 'warning' | 'danger')}
              aria-label="Color"
            >
              <option value="primary">primary</option>
              <option value="success">success</option>
              <option value="warning">warning</option>
              <option value="danger">danger</option>
            </select>
          </Control>
          <Control label="Message">
            <input
              type="text"
              value={alertChildren}
              onChange={(e) => setAlertChildren(e.target.value)}
              aria-label="Alert message"
            />
          </Control>
        </>
      )}
      {slug === 'input' && (
        <>
          <Control label="Label">
            <input
              type="text"
              value={inputLabel}
              onChange={(e) => setInputLabel(e.target.value)}
              placeholder="Label"
              aria-label="Label"
            />
          </Control>
          <Control label="Placeholder">
            <input
              type="text"
              value={inputPlaceholder}
              onChange={(e) => setInputPlaceholder(e.target.value)}
              aria-label="Placeholder"
            />
          </Control>
          <Control label="Error">
            <input
              type="text"
              value={inputError}
              onChange={(e) => setInputError(e.target.value)}
              placeholder="Error message"
              aria-label="Error"
            />
          </Control>
        </>
      )}
      {slug === 'checkbox' && (
        <>
          <Control label="Label">
            <input
              type="text"
              value={checkboxLabel}
              onChange={(e) => setCheckboxLabel(e.target.value)}
              aria-label="Checkbox label"
            />
          </Control>
          <Control label="Checked">
            <input
              type="checkbox"
              checked={checkboxChecked}
              onChange={(e) => setCheckboxChecked(e.target.checked)}
              aria-label="Checked"
            />
          </Control>
        </>
      )}
      {slug === 'select' && (
        <Control label="Value">
          <select
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
            aria-label="Selected value"
          >
            {selectOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Control>
      )}
      {slug === 'switch' && (
        <Control label="Checked">
          <input
            type="checkbox"
            checked={switchChecked}
            onChange={(e) => setSwitchChecked(e.target.checked)}
            aria-label="Checked"
          />
        </Control>
      )}
      {slug === 'slider' && (
        <Control label="Value">
          <input
            type="range"
            min={0}
            max={100}
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            aria-label="Slider value"
          />
          <span>{sliderValue}</span>
        </Control>
      )}
      {slug === 'number-input' && (
        <Control label="Value">
          <input
            type="number"
            min={0}
            max={10}
            value={numberValue}
            onChange={(e) => setNumberValue(Number(e.target.value) || 0)}
            aria-label="Number value"
          />
        </Control>
      )}
      {slug === 'tabs' && (
        <Control label="Active tab">
          <select
            value={tabsActiveId}
            onChange={(e) => setTabsActiveId(e.target.value)}
            aria-label="Active tab"
          >
            {tabsItems.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </Control>
      )}
    </div>
  );

  const preview = (
    <div className={styles.previewContent}>
      {slug === 'button' && (
        <Button
          color={buttonColor}
          variant={buttonVariant}
          size={buttonSize}
          disabled={buttonDisabled}
        >
          {buttonChildren}
        </Button>
      )}
      {slug === 'badge' && (
        <Badge color={badgeColor} variant={badgeVariant} dot={badgeDot}>
          {badgeChildren}
        </Badge>
      )}
      {slug === 'alert' && (
        <Alert color={alertColor} variant={alertVariant}>
          {alertChildren}
        </Alert>
      )}
      {slug === 'input' && (
        <Input
          label={inputLabel || undefined}
          placeholder={inputPlaceholder}
          error={inputError || undefined}
        />
      )}
      {slug === 'checkbox' && (
        <Checkbox
          label={checkboxLabel}
          checked={checkboxChecked}
          onChange={() => setCheckboxChecked((c) => !c)}
        />
      )}
      {slug === 'select' && (
        <Select
          options={selectOptions}
          value={selectValue}
          onChange={(v) => setSelectValue(v)}
        />
      )}
      {slug === 'switch' && (
        <Switch checked={switchChecked} onChange={() => setSwitchChecked((c) => !c)} />
      )}
      {slug === 'slider' && (
        <Slider
          value={sliderValue}
          min={0}
          max={100}
          onChange={(v) => setSliderValue(v)}
        />
      )}
      {slug === 'number-input' && (
        <NumberInput
          value={numberValue}
          min={0}
          max={10}
          onChange={(v) => setNumberValue(v)}
        />
      )}
      {slug === 'tabs' && (
        <Tabs
          items={tabsItems}
          value={tabsActiveId}
          onChange={(id) => setTabsActiveId(id)}
        />
      )}
    </div>
  );

  const hasPlayground = [
    'button',
    'badge',
    'alert',
    'input',
    'checkbox',
    'select',
    'switch',
    'slider',
    'number-input',
    'tabs',
  ].includes(slug);

  if (!hasPlayground || !code) return null;

  return (
    <>
      <h2 className={styles.sectionTitle}>Playground</h2>
      <p className={styles.exampleDescription}>
        Adjust the controls below to see how {name} updates. The code snippet reflects the current state.
      </p>
      <DocPreview label="Interactive preview">
        <div className={styles.playgroundWrap}>
          {controls}
          {preview}
        </div>
      </DocPreview>
      <CodeExample code={code} />
    </>
  );
}

function Control({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.control}>
      <span className={styles.controlLabel}>{label}</span>
      {children}
    </label>
  );
}
