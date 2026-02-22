import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  Chip,
  IconButton,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import api from '../../services/api';
import toast from 'react-hot-toast';

const eventCategories = [
  'Technical', 'Cultural', 'Sports', 'Workshop', 'Hackathon', 
  'Seminar', 'Competition', 'Other'
];

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'phone', label: 'Phone' },
  { value: 'select', label: 'Dropdown' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'file', label: 'File Upload' }
];

const CreateEvent = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [eventData, setEventData] = useState({
    name: '',
    description: '',
    category: '',
    venue: '',
    startDate: dayjs().add(1, 'day'),
    endDate: dayjs().add(1, 'day').add(2, 'hour'),
    registrationDeadline: dayjs().add(1, 'day').subtract(1, 'hour'),
    capacity: '',
    isPaid: false,
    price: 0,
    isTeamEvent: false,
    minTeamSize: 2,
    maxTeamSize: 4,
    hasMerchandise: false,
    merchandise: [],
    tags: []
  });

  const [customFields, setCustomFields] = useState([]);
  const [newTag, setNewTag] = useState('');

  const steps = ['Basic Info', 'Schedule & Capacity', 'Custom Form', 'Review'];

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setEventData({ ...eventData, [field]: value });
  };

  const handleDateChange = (field) => (value) => {
    setEventData({ ...eventData, [field]: value });
  };

  const addCustomField = () => {
    setCustomFields([
      ...customFields,
      {
        id: Date.now(),
        label: '',
        type: 'text',
        required: false,
        options: []
      }
    ]);
  };

  const updateCustomField = (id, updates) => {
    setCustomFields(customFields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeCustomField = (id) => {
    setCustomFields(customFields.filter(f => f.id !== id));
  };

  const addTag = () => {
    if (newTag.trim() && !eventData.tags.includes(newTag.trim())) {
      setEventData({ ...eventData, tags: [...eventData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setEventData({ ...eventData, tags: eventData.tags.filter(t => t !== tag) });
  };

  const addMerchandise = () => {
    setEventData({
      ...eventData,
      merchandise: [
        ...eventData.merchandise,
        { name: '', price: 0, description: '', stock: 0 }
      ]
    });
  };

  const updateMerchandise = (index, updates) => {
    const updated = [...eventData.merchandise];
    updated[index] = { ...updated[index], ...updates };
    setEventData({ ...eventData, merchandise: updated });
  };

  const removeMerchandise = (index) => {
    setEventData({
      ...eventData,
      merchandise: eventData.merchandise.filter((_, i) => i !== index)
    });
  };

  const validateStep = () => {
    switch (activeStep) {
      case 0:
        if (!eventData.name || !eventData.description || !eventData.category) {
          toast.error('Please fill in all required fields');
          return false;
        }
        break;
      case 1:
        if (!eventData.venue || !eventData.capacity) {
          toast.error('Please fill in venue and capacity');
          return false;
        }
        if (eventData.startDate.isAfter(eventData.endDate)) {
          toast.error('End date must be after start date');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        ...eventData,
        eventType: eventData.isTeamEvent ? "hackathon" : "normal",
        status: "published",
        startDate: eventData.startDate.toISOString(),
        endDate: eventData.endDate.toISOString(),
        registrationDeadline: eventData.registrationDeadline.toISOString(),
        registrationLimit: eventData.capacity ? Number(eventData.capacity) : null,
        hackathonDetails: eventData.isTeamEvent ? {
          minTeamSize: Number(eventData.minTeamSize) || 2,
          maxTeamSize: Number(eventData.maxTeamSize) || 4,
        } : undefined,
        customFields: customFields.map(({ id, label, type, required, options }) => ({
          fieldName: label.replace(/\s+/g, '').toLowerCase(),
          fieldType: type,
          label,
          required,
          options
        }))
      };

      await api.post('/api/events', payload);
      toast.success('Event created successfully!');
      navigate('/organizer/events');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Event Title"
                value={eventData.name}
                onChange={handleChange('name')}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={eventData.description}
                onChange={handleChange('description')}
                multiline
                rows={4}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={eventData.category}
                  label="Category"
                  onChange={handleChange('category')}
                >
                  {eventCategories.map(cat => (
                    <MenuItem key={cat} value={cat.toLowerCase()}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  label="Add Tags"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button onClick={addTag} variant="outlined">Add</Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                {eventData.tags.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => removeTag(tag)}
                    size="small"
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={eventData.isTeamEvent}
                    onChange={handleChange('isTeamEvent')}
                  />
                }
                label="Team Event (Hackathon)"
              />
              {eventData.isTeamEvent && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Min Team Size"
                      type="number"
                      value={eventData.minTeamSize}
                      onChange={handleChange('minTeamSize')}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Max Team Size"
                      type="number"
                      value={eventData.maxTeamSize}
                      onChange={handleChange('maxTeamSize')}
                    />
                  </Grid>
                </Grid>
              )}
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Venue"
                  value={eventData.venue}
                  onChange={handleChange('venue')}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Start Date & Time"
                  value={eventData.startDate}
                  onChange={handleDateChange('startDate')}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="End Date & Time"
                  value={eventData.endDate}
                  onChange={handleDateChange('endDate')}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Registration Deadline"
                  value={eventData.registrationDeadline}
                  onChange={handleDateChange('registrationDeadline')}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Capacity"
                  type="number"
                  value={eventData.capacity}
                  onChange={handleChange('capacity')}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={eventData.isPaid}
                      onChange={handleChange('isPaid')}
                    />
                  }
                  label="Paid Event"
                />
                {eventData.isPaid && (
                  <TextField
                    fullWidth
                    label="Registration Fee (₹)"
                    type="number"
                    value={eventData.price}
                    onChange={handleChange('price')}
                    sx={{ mt: 2 }}
                  />
                )}
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={eventData.hasMerchandise}
                      onChange={handleChange('hasMerchandise')}
                    />
                  }
                  label="Has Merchandise"
                />
                {eventData.hasMerchandise && (
                  <Box sx={{ mt: 2 }}>
                    {eventData.merchandise.map((item, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                        <TextField
                          label="Item Name"
                          value={item.name}
                          onChange={(e) => updateMerchandise(index, { name: e.target.value })}
                          size="small"
                        />
                        <TextField
                          label="Price"
                          type="number"
                          value={item.price}
                          onChange={(e) => updateMerchandise(index, { price: e.target.value })}
                          size="small"
                          sx={{ width: 100 }}
                        />
                        <TextField
                          label="Stock"
                          type="number"
                          value={item.stock}
                          onChange={(e) => updateMerchandise(index, { stock: e.target.value })}
                          size="small"
                          sx={{ width: 100 }}
                        />
                        <IconButton color="error" onClick={() => removeMerchandise(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                    <Button startIcon={<AddIcon />} onClick={addMerchandise} variant="outlined" size="small">
                      Add Merchandise
                    </Button>
                  </Box>
                )}
              </Grid>
            </Grid>
          </LocalizationProvider>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Custom Registration Fields
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Add additional fields to collect specific information from participants
            </Typography>

            {customFields.map((field, index) => (
              <Card key={field.id} sx={{ mb: 2, p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Field Label"
                      value={field.label}
                      onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={field.type}
                        label="Type"
                        onChange={(e) => updateCustomField(field.id, { type: e.target.value })}
                      >
                        {fieldTypes.map(t => (
                          <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.required}
                          onChange={(e) => updateCustomField(field.id, { required: e.target.checked })}
                        />
                      }
                      label="Required"
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <IconButton color="error" onClick={() => removeCustomField(field.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                  {field.type === 'select' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Options (comma-separated)"
                        value={field.options.join(', ')}
                        onChange={(e) => updateCustomField(field.id, { 
                          options: e.target.value.split(',').map(o => o.trim()) 
                        })}
                        size="small"
                        placeholder="Option 1, Option 2, Option 3"
                      />
                    </Grid>
                  )}
                </Grid>
              </Card>
            ))}

            <Button startIcon={<AddIcon />} onClick={addCustomField} variant="outlined">
              Add Custom Field
            </Button>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Event Details
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Title</Typography>
                  <Typography variant="h6">{eventData.name}</Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Category</Typography>
                  <Chip label={eventData.category} size="small" sx={{ textTransform: 'capitalize' }} />
                  
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Description</Typography>
                  <Typography variant="body2">{eventData.description}</Typography>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">Venue</Typography>
                  <Typography>{eventData.venue}</Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Date & Time</Typography>
                  <Typography variant="body2">
                    {eventData.startDate.format('MMM D, YYYY h:mm A')} - {eventData.endDate.format('MMM D, YYYY h:mm A')}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Capacity</Typography>
                  <Typography>{eventData.capacity} participants</Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Pricing</Typography>
                  <Typography>{eventData.isPaid ? `₹${eventData.price}` : 'Free'}</Typography>
                </Card>
              </Grid>
              
              {customFields.length > 0 && (
                <Grid item xs={12}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Custom Fields</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      {customFields.map(field => (
                        <Chip 
                          key={field.id} 
                          label={`${field.label} (${field.type})`} 
                          size="small" 
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        );
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/organizer/events')}>
          Back to Events
        </Button>
      </Box>

      <Typography variant="h4" fontWeight={700} gutterBottom>
        Create New Event
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card>
        <CardContent sx={{ p: 4 }}>
          {renderStepContent()}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<BackIcon />}
            >
              Back
            </Button>
            
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<NextIcon />}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                startIcon={<SaveIcon />}
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Event'}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default CreateEvent;
