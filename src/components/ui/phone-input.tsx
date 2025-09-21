'use client';

import React from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  name?: string;
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}

const CustomPhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder,
  disabled,
  className,
}) => {
  return (
    <div className={cn('relative', className)}>
      <PhoneInput
        country={'pk'}
        value={value}
        onChange={(phone) => onChange?.(phone)}
        placeholder={placeholder}
        disabled={disabled}
        inputClass='max-w-full'
        autocompleteSearch
        />
    </div>
  );
};

export { CustomPhoneInput as PhoneInput };
