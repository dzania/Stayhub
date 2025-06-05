import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

interface FormFieldProps<T extends FieldValues> extends Omit<TextFieldProps, 'name'> {
  name: Path<T>;
  control: Control<T>;
  rules?: object;
}

const FormField = <T extends FieldValues>({
  name,
  control,
  rules,
  ...textFieldProps
}: FormFieldProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          {...textFieldProps}
          error={!!error}
          helperText={error?.message}
          value={field.value || ''}
        />
      )}
    />
  );
};

export default FormField; 