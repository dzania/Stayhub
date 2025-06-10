import React from 'react';
import { Controller, Control, FieldError } from 'react-hook-form';
import { TextField } from '@mui/material';

interface FormFieldProps {
  name: string;
  control: Control<any>;
  label: string;
  error?: FieldError;
  [key: string]: any;
}

const FormField: React.FC<FormFieldProps> = ({
  name,
  control,
  label,
  error,
  ...rest
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          {...rest}
          label={label}
          fullWidth
          variant="outlined"
          error={!!error}
          helperText={error ? error.message : null}
          value={field.value ?? ''}
        />
      )}
    />
  );
};

export default FormField; 