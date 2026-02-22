import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  IconButton,
  Button,
  Paper,
  Stack,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'file', label: 'File Upload' },
  { value: 'date', label: 'Date' }
];

const FormBuilder = ({ fields, onChange, disabled = false }) => {
  const [localFields, setLocalFields] = useState(fields || []);

  useEffect(() => {
    setLocalFields(fields || []);
  }, [fields]);

  const handleAddField = () => {
    const newField = {
      fieldName: `field_${Date.now()}`,
      fieldType: 'text',
      label: '',
      placeholder: '',
      required: false,
      options: [],
      order: localFields.length
    };
    const updated = [...localFields, newField];
    setLocalFields(updated);
    onChange(updated);
  };

  const handleRemoveField = (index) => {
    const updated = localFields.filter((_, i) => i !== index);
    setLocalFields(updated);
    onChange(updated);
  };

  const handleFieldChange = (index, key, value) => {
    const updated = localFields.map((field, i) => {
      if (i === index) {
        return { ...field, [key]: value };
      }
      return field;
    });
    setLocalFields(updated);
    onChange(updated);
  };

  const handleAddOption = (index) => {
    const updated = localFields.map((field, i) => {
      if (i === index) {
        return { ...field, options: [...(field.options || []), ''] };
      }
      return field;
    });
    setLocalFields(updated);
    onChange(updated);
  };

  const handleOptionChange = (fieldIndex, optionIndex, value) => {
    const updated = localFields.map((field, i) => {
      if (i === fieldIndex) {
        const newOptions = [...field.options];
        newOptions[optionIndex] = value;
        return { ...field, options: newOptions };
      }
      return field;
    });
    setLocalFields(updated);
    onChange(updated);
  };

  const handleRemoveOption = (fieldIndex, optionIndex) => {
    const updated = localFields.map((field, i) => {
      if (i === fieldIndex) {
        return { ...field, options: field.options.filter((_, j) => j !== optionIndex) };
      }
      return field;
    });
    setLocalFields(updated);
    onChange(updated);
  };

  const needsOptions = (fieldType) => {
    return ['dropdown', 'radio', 'checkbox'].includes(fieldType);
  };

  return (
    <Box>
      <Stack spacing={2}>
        {localFields.map((field, index) => (
          <Paper key={index} sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DragIcon color="action" />
                <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                  Field {index + 1}
                </Typography>
                <IconButton 
                  onClick={() => handleRemoveField(index)} 
                  disabled={disabled}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Field Label"
                  value={field.label}
                  onChange={(e) => handleFieldChange(index, 'label', e.target.value)}
                  disabled={disabled}
                  size="small"
                  sx={{ flex: 1, minWidth: 200 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={field.fieldType}
                    label="Type"
                    onChange={(e) => handleFieldChange(index, 'fieldType', e.target.value)}
                    disabled={disabled}
                  >
                    {FIELD_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <TextField
                label="Placeholder"
                value={field.placeholder || ''}
                onChange={(e) => handleFieldChange(index, 'placeholder', e.target.value)}
                disabled={disabled}
                size="small"
                fullWidth
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.required}
                    onChange={(e) => handleFieldChange(index, 'required', e.target.checked)}
                    disabled={disabled}
                  />
                }
                label="Required"
              />

              {needsOptions(field.fieldType) && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Options
                  </Typography>
                  <Stack spacing={1}>
                    {(field.options || []).map((option, optIndex) => (
                      <Box key={optIndex} sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          value={option}
                          onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                          disabled={disabled}
                          size="small"
                          placeholder={`Option ${optIndex + 1}`}
                          sx={{ flex: 1 }}
                        />
                        <IconButton 
                          onClick={() => handleRemoveOption(index, optIndex)}
                          disabled={disabled}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => handleAddOption(index)}
                      disabled={disabled}
                      size="small"
                      variant="outlined"
                    >
                      Add Option
                    </Button>
                  </Stack>
                </Box>
              )}
            </Stack>
          </Paper>
        ))}
      </Stack>

      <Button
        startIcon={<AddIcon />}
        onClick={handleAddField}
        disabled={disabled}
        variant="outlined"
        sx={{ mt: 2 }}
      >
        Add Field
      </Button>
    </Box>
  );
};

export default FormBuilder;
