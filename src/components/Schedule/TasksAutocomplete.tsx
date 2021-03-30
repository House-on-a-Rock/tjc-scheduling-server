import React from 'react';
import { TaskDataContext } from '../../container/Schedules/ScheduleContainer';

// mat ui
import TableCell from '@material-ui/core/TableCell';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';

import { typographyTheme } from '../../shared/styles/theme.js';

import { useTasksAutocompleteHooks } from './useTasksAutocompleteHooks';

import {
  extractTeammateIds,
  getUserOptionLabel,
} from '../../container/Schedules/utilities';

/*
  Props explanation

  dataId:             userId/roleId assigned 
  extractOptionId?:   function to extract ids from dataset, needed for mat ui autocomplete
  dataSet:            dataset from which to display autocomplete options, contains all the other info 
  onChange:           onChangeHandler
  dataContext:        contains info like rowIndex/serviceIndex/roleId, used by onChange callback. 
  getOptionLabel:     string that shows in autocomplete
  renderOption?:      basically just adds an icon to indicate which was the previously saved option, may be used to add more stuff
  isSaved: boolean;   if initialData should update to the latest dataId
*/

interface AutocompleteCellProps {
  dataId: number;
  options: any;
  roleId: number;
  onChange: (dataContext: any, newValue: number) => void;
  dataContext: TaskDataContext;
  renderOption?: (display: string, isIconVisible: boolean) => JSX.Element;
  isSaved?: boolean;
}

export const TasksAutocomplete = React.memo((props: AutocompleteCellProps) => {
  const { dataId, options, roleId, dataContext, isSaved, onChange, renderOption } = props;
  const classes = useStyles();

  const [
    isCellModified,
    isCellWarning,
    managedDataSet,
    initialData,
  ] = useTasksAutocompleteHooks(dataId, roleId, options);

  const tableCellClass = isCellWarning
    ? classes.warning
    : isCellModified
    ? classes.modified
    : classes.cell;

  function onCellModify(isChanged: boolean, newValue: number) {
    onChange(dataContext, newValue);
  }

  return (
    <TableCell className={tableCellClass}>
      <Autocomplete
        id="combo-box"
        options={extractTeammateIds(managedDataSet)}
        renderInput={(params: any) => (
          <TextField
            {...params}
            inputProps={{
              ...params.inputProps,
              style: { fontSize: 14 },
            }}
          />
        )}
        getOptionLabel={(option: number) => getUserOptionLabel(option, managedDataSet)}
        getOptionDisabled={(option) => option === dataId}
        renderOption={(option) =>
          renderOption(
            getUserOptionLabel(option, managedDataSet),
            option === initialData.dataId,
          )
        }
        value={dataId}
        onChange={(event, newValue: number) =>
          onCellModify(newValue !== initialData.dataId, newValue)
        }
        disableClearable
        fullWidth
        clearOnBlur
        openOnFocus
        forcePopupIcon={false}
        autoHighlight={true}
      />
    </TableCell>
  );
}, arePropsEqual);

function arePropsEqual(
  prevProps: AutocompleteCellProps,
  nextProps: AutocompleteCellProps,
) {
  return (
    prevProps.dataId === nextProps.dataId &&
    prevProps.dataContext.roleId === nextProps.dataContext.roleId
  );
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    cell: {
      color: typographyTheme.common.color,
      textAlign: 'center',
      '&:focus': {
        outline: 'none',
      },
      'user-select': 'none',
      padding: '1px 0px 2px 0px',
      height: 20,
      width: 100,
    },
    modified: {
      color: typographyTheme.common.color,
      textAlign: 'center',
      '&:focus': {
        outline: 'none',
      },
      'user-select': 'none',
      padding: '1px 0px 2px 0px',
      height: 20,
      width: 100,
      backgroundColor: 'rgb(125, 226, 226)',
    },
    warning: {
      color: typographyTheme.common.color,
      textAlign: 'center',
      '&:focus': {
        outline: 'none',
      },
      'user-select': 'none',
      padding: '1px 0px 2px 0px',
      height: 20,
      width: 100,
      backgroundColor: 'rgb(250, 20, 20)',
    },
    input: {
      fontSize: 50,
    },
  }),
);
