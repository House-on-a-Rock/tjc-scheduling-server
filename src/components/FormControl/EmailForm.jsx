import React from 'react';
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';

const EmailForm = ({ name, label, email, handleEmail }) => (
  <TextField
    variant="outlined"
    margin="normal"
    required
    fullWidth
    id={name}
    label={label}
    name={name}
    value={email.value}
    onChange={(event) => handleEmail({ ...email, value: event.target.value })}
    autoComplete="email"
    autoFocus
    helperText={email.valid ? '' : email.message}
    error={!email.valid}
  />
);

EmailForm.propTypes = {
  name: PropTypes.string,
  label: PropTypes.string,
  email: PropTypes.object,
  handleEmail: PropTypes.func,
};

export default EmailForm;
