import React from 'react';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import { TableCell, TableRow, TableBody as MuiTableBody } from '@material-ui/core';
import { makeStyles, createStyles } from '@material-ui/core/styles';
import EditIcon from '@material-ui/icons/Edit';
import { days } from './utilities';

// TODO add service-name editing functionality to the edit button here

export const TableBody = ({
  title,
  serviceIndex,
  children,
  providedRef,
  isEdit,
  addEvent,
  deleteService,
  onEditService,
}) => {
  const tooltipId = `${title}_tooltip`;
  const classes = useStyles();
  const [open, setOpen] = React.useState(true);

  return (
    <MuiTableBody ref={providedRef}>
      <TableRow>
        <TableCell className={classes.scheduleTitle}>
          <div data-tip data-for={tooltipId} onClick={() => setOpen(!open)}>
            {title}
          </div>
          {isEdit && (
            <div>
              <EditIcon onClick={() => onEditService(serviceIndex)} />
              <button onClick={deleteService}>Delete Service</button>
              <button onClick={addEvent}>Add Event</button>
            </div>
          )}
          <ReactTooltip id={tooltipId}>
            <span>{`Click to ${open ? 'collapse' : 'expand'}`}</span>
          </ReactTooltip>
        </TableCell>
      </TableRow>
      {open && children}
    </MuiTableBody>
  );
};

const useStyles = makeStyles((theme) =>
  createStyles({
    scheduleTitle: {},
    groupOfRows: {
      transition: 'transform 0.2s, visibility 0.15s',
      transformOrigin: 'top',
      width: '20ch',
    },
    collapsedGroupOfRows: {
      transform: 'scaleY(0)',
      visibility: 'collapse',
      opacity: 0.5,
      pointerEvents: 'none',
    },
    expandedGroupOfRows: {
      animation: `$flashOfColor 0.25s ${theme.transitions.easing.easeInOut}`,
    },
    '@keyframes flashOfColor': {
      '50%': {
        background: '#add8e65e',
      },
    },
  }),
);

TableBody.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node])
    .isRequired,
  providedRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  ]),
  title: PropTypes.string,
  addEvent: PropTypes.func,
  deleteService: PropTypes.func,
  isEdit: PropTypes.bool,
  onEditService: PropTypes.func,
  serviceIndex: PropTypes.number,
};

export default TableBody;
