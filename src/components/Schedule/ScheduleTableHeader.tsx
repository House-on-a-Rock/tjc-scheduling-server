/* eslint-disable react/no-array-index-key */
import React from 'react';

// Material UI
import TableCell from '@material-ui/core/TableCell';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';

// Styles
import { typographyTheme } from '../../shared/styles/theme.js';

export const ScheduleTableHeader = ({ header }: any) => {
  const classes = useStyles();
  return <TableCell className={classes.headerCell}>{header}</TableCell>;
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    headerCell: {
      textAlign: 'center',
      padding: '1px 2px',
      color: typographyTheme.common.color,
      border: normalCellBorder,
      fontWeight: 'bold',
    },
  }),
);

const normalCellBorderColor = 'rgba(234, 234, 234, 1)';
const normalCellBorder = `1px solid ${normalCellBorderColor}`;
