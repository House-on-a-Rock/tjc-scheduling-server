import React from 'react';
import PropTypes from 'prop-types';

import { MenuItem, Button } from '@material-ui/core/';
import { makeStyles, createStyles } from '@material-ui/core/styles';

import { ValidatedSelect, ValidatedTextField } from '../FormControl';
import { useValidatedField } from '../../hooks';

import { buttonTheme, tooltipContainer } from '../../shared/styles/theme';
import { stringLengthCheck } from '../../shared/utilities';

const daysOfWeek = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const NewServiceForm = ({ onSubmit, onClose, error }) => {
  const [
    serviceName,
    setServiceName,
    setServiceNameError,
    resetServiceNameError,
  ] = useValidatedField('', 'Must have a name that is less than 32 characters');
  const [dayOfWeek, setDayOfWeek, setDayWeekError, resetDayWeekError] = useValidatedField(
    -1,
    'Must select a day of the week',
  );

  const classes = useStyles();

  function onSubmitForm() {
    resetServiceNameError();
    resetDayWeekError();

    if (
      serviceName.value.length > 0 &&
      serviceName.value.length < 32 &&
      dayOfWeek.value >= 0
    )
      onSubmit({
        name: serviceName.value,
        dayOfWeek: dayOfWeek.value,
      });
    setServiceNameError(stringLengthCheck(serviceName.value));
    setDayWeekError(dayOfWeek.value < 0);
  }

  return (
    <div className={classes.newServiceForm}>
      <h2>Add A New Event</h2>
      {error && (
        <div style={{ color: 'red' }}>
          {`Status code ${error.response.status}: ${error.response.statusText}`}
        </div>
      )}
      <form>
        <ValidatedTextField
          name="Service Name"
          label="Service Name"
          input={serviceName}
          handleChange={setServiceName}
          autoFocus
        />
        <div className={classes.tooltipContainer}>
          <ValidatedSelect
            input={dayOfWeek}
            onChange={setDayOfWeek}
            toolTip={{
              id: 'Day of Week',
              text: 'Select the day of the week this schedule is for',
            }}
            label="Day of Week"
            className={classes.selectContainer}
          >
            <MenuItem value={-1}>
              Select which day of the week this schedule is for
            </MenuItem>
            {daysOfWeek.map((day, index) => (
              <MenuItem key={index.toString()} value={index}>
                {day}
              </MenuItem>
            ))}
          </ValidatedSelect>
        </div>
      </form>

      <div className={classes.buttonBottomBar}>
        <Button onClick={onSubmitForm} className={classes.submitButton}>
          Create new service
        </Button>
        <Button onClick={onClose} className={classes.button}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

const useStyles = makeStyles(() =>
  createStyles({
    newServiceForm: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width: 'max-content',
      margin: 'auto',
      textAlign: 'center',
      padding: 20,
    },
    selectContainer: {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      minWidth: 400,
    },
    tooltipContainer: {
      '&': {
        ...tooltipContainer,
      },
    },
    buttonBottomBar: {
      minHeight: 'unset',
      flexWrap: 'wrap',
      alignSelf: 'end',
    },
    submitButton: {
      padding: '10px',
      borderRadius: '5px',
      border: 'none',
      margin: '5px',
      ...buttonTheme.filled,
    },
    button: {
      padding: '10px',
      borderRadius: '5px',
      border: 'none',
      margin: '5px',
      '&:hover, &:focus': {
        ...buttonTheme.filled.hover,
      },
    },
  }),
);

NewServiceForm.propTypes = {
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  error: PropTypes.string,
};

export default NewServiceForm;
