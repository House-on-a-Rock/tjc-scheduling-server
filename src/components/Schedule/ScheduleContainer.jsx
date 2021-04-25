import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { createStyles, makeStyles } from '@material-ui/core';
import ScheduleMain from './ScheduleMain';
import ScheduleTabs from './ScheduleTabs';
import NewScheduleForm from './NewScheduleForm';
import { loadingTheme } from '../../shared/styles/theme';

import useScheduleContainerData from '../../hooks/containerHooks/useScheduleContainerData';
/*
  fetch schedule ids, use those to create tabs
  fetch teams and users since they will be used across every schedule
  
   common state
    - alerts
    - create schedule o7
    - delete schedule

    remain in scheduleMain
    - warning dialog
    - context menu
    - toolbar stuff

  schedule specific stuff goes into schedule main, along with the usequeries
*/

const ScheduleContainer = ({ churchId }) => {
  const classes = useStyles();

  const [
    isTabsLoading,
    tabs,
    isUsersLoading,
    users,
    isTeamsLoading,
    teams,
  ] = useScheduleContainerData(churchId);

  // const schedules = useQuery(
  //   ['schedules', fetchedSchedules],
  //   () => getScheduleData(makeScheduleIdxs(tabs.data)),
  //   {
  //     enabled: !!tabs.data,
  //     refetchOnWindowFocus: false,
  //     staleTime: 100000000000000,
  //     keepPreviousData: true,
  //   },
  // );

  const [tabIndex, setTabIndex] = useState(0);
  const [openedTabs, setOpenedTabs] = useState([0]);
  const [isNewScheduleOpen, setIsNewScheduleOpen] = useState(false);

  console.log(`users`, users);

  const loaded = !isTabsLoading && !isUsersLoading && !isTeamsLoading;

  return (
    <div className={isTabsLoading ? classes.loading : ''}>
      {!isTabsLoading && (
        <div>
          <ScheduleTabs
            tabIndex={tabIndex}
            onTabClick={onTabClick}
            handleAddClicked={() => setIsNewScheduleOpen(true)}
            tabs={tabs.data}
          />
          <NewScheduleForm
            onClose={() => setIsNewScheduleOpen(false)}
            isOpen={isNewScheduleOpen}
            // onSubmit={(newScheduleData) =>
            //   createSchedule.mutate({ ...newScheduleData, churchId: data.churchId })
            // }
            // error={createSchedule.error}
          />
        </div>
      )}
    </div>
  );

  function onTabClick(value) {
    if (value <= tabs.data.length - 1) {
      setTabIndex(value);
      const isOpened = openedTabs.indexOf(value);
      if (isOpened < 0) setOpenedTabs([...openedTabs, value]); // adds unopened tabs to array. need way to handle lots of tabs
    } else setIsNewScheduleOpen(true); // if last tab, open dialog to make new schedule
  }
};

function makeScheduleIdxs(tabsData) {
  const scheduleIdxs = [];
  for (let i = 0; i < tabsData.length && i < 3; i++) {
    scheduleIdxs.push(tabsData[i].id);
  }
  return scheduleIdxs;
}

const useStyles = makeStyles(() =>
  createStyles({
    loading: {
      ...loadingTheme,
    },
  }),
);

ScheduleContainer.propTypes = {
  churchId: PropTypes.number,
};

export default ScheduleContainer;
