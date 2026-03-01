'use client';

import { forwardRef, useMemo } from 'react';
import ReactSelect, { components, type GroupBase, type Props, type SelectInstance } from 'react-select';
import { useTheme } from '@/components/providers/ThemeProvider';
import styles from './Select.module.scss';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<Props<SelectOption, false, GroupBase<SelectOption>>, 'onChange' | 'value' | 'classNames'> {
  options: SelectOption[];
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string | null;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
  /** Alias for isDisabled to match native select API */
  disabled?: boolean;
}

export const Select = forwardRef<SelectInstance<SelectOption, false, GroupBase<SelectOption>>, SelectProps>(
  function Select(
    {
      options,
      label,
      error,
      placeholder = 'Select…',
      onChange,
      value: valueProp,
      id: idProp,
      className = '',
      style: styleProp,
      isDisabled,
      disabled,
      ...rest
    },
    ref
  ) {
    const id = idProp ?? `select-${Math.random().toString(36).slice(2, 9)}`;
    const { theme: currentTheme } = useTheme();

    const selectedOption = useMemo(() => {
      if (valueProp == null || valueProp === '') return null;
      return options.find((opt) => opt.value === valueProp) ?? null;
    }, [options, valueProp]);

    const handleChange = (option: SelectOption | null) => {
      onChange?.(option?.value ?? '');
    };

    const MenuPortalWithTheme = useMemo(
      () =>
        function ThemedMenuPortal(
          props: React.ComponentProps<typeof components.MenuPortal>
        ) {
          return (
            <components.MenuPortal
              {...props}
              innerProps={{
                ...props.innerProps,
                ...({ 'data-theme': currentTheme } as React.HTMLAttributes<HTMLDivElement>),
              }}
            />
          );
        },
      [currentTheme]
    );

    return (
      <div className={`${styles.wrapper} ${className}`.trim()} style={styleProp}>
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
        )}
        <ReactSelect
          ref={ref}
          inputId={id}
          options={options}
          value={selectedOption}
          onChange={handleChange}
          placeholder={placeholder}
          isDisabled={isDisabled ?? disabled}
          isClearable={false}
          aria-invalid={!!error}
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
          menuPosition="fixed"
          menuPlacement="auto"
          styles={{
            control: (base, state) => ({
              ...base,
              backgroundColor: 'var(--theme-content1)',
              borderColor: error
                ? 'var(--theme-danger)'
                : state.isFocused
                  ? 'var(--theme-focus)'
                  : 'var(--theme-divider)',
              boxShadow: state.isFocused && !error ? '0 0 0 3px var(--theme-focus)' : 'none',
            }),
            singleValue: (base) => ({
              ...base,
              color: 'var(--theme-foreground)',
            }),
            input: (base) => ({
              ...base,
              color: 'var(--theme-foreground)',
            }),
            placeholder: (base) => ({
              ...base,
              color: 'var(--theme-default-500)',
            }),
            dropdownIndicator: (base) => ({
              ...base,
              color: 'var(--theme-default-500)',
            }),
            menu: (base) => ({
              ...base,
              backgroundColor: 'var(--theme-content1)',
              border: '1px solid var(--theme-divider)',
            }),
            option: (base, state) => ({
              ...base,
              color: state.isSelected ? 'var(--theme-primary-900)' : 'var(--theme-foreground)',
              backgroundColor: state.isSelected
                ? 'var(--theme-primary-200)'
                : state.isFocused
                  ? 'var(--theme-default-200)'
                  : 'transparent',
            }),
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          }}
          components={{ MenuPortal: MenuPortalWithTheme as typeof components.MenuPortal }}
          classNamePrefix="react-select"
          classNames={{
            control: () => `${styles.control} ${error ? styles.error : ''}`.trim(),
            valueContainer: () => styles.valueContainer,
            singleValue: () => styles.singleValue,
            input: () => styles.input,
            placeholder: () => styles.placeholder,
            indicatorSeparator: () => styles.indicatorSeparator,
            dropdownIndicator: () => styles.dropdownIndicator,
            menu: () => styles.menu,
            menuList: () => styles.menuList,
            option: (state) =>
              [styles.option, state.isSelected ? styles.optionSelected : '', state.isFocused ? styles.optionFocused : '']
                .filter(Boolean)
                .join(' '),
          }}
          {...rest}
        />
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    );
  }
);
