import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const useTasksAutocompleteHooks = (dataId, roleId, dataSet) => {
  const [initialData] = useState({
    dataId,
    roleId,
    dataSet,
  });
  const [isCellModified, setIsCellModified] = useState(false);
  const [isCellWarning, setIsCellWarning] = useState(false);

  const [managedDataSet, setManagedDataSet] = useState(dataSet);
  const [prevRole, setPrevRole] = useState(roleId);
  const [prevDetails, setPrevDetails] = useState(createDetails()); // stores info of prev selected, needed because when dataset changes, details are lost

  // TODO In next PR, when db updates with saved data, will have to see if initialData will re-initiate properly.

  // colors
  useEffect(() => {
    // options logic
    if (roleId !== prevRole) setManagedDataSet(createDataSet());
    if (roleId === prevRole && dataId !== prevDetails?.userId) setManagedDataSet(dataSet);

    // colors logic
    setIsCellModified(dataId !== initialData.dataId);
    setIsCellWarning(false);

    const isInList = dataSet.filter((user) => user.userId === dataId).length > 0;

    if (roleId !== prevRole) {
      setIsCellWarning(true);
      if (roleId === initialData.roleId)
        setIsCellWarning(dataId !== initialData.dataId && !isInList);
      else if (isInList) {
        // if assignee is already in the list of roles
        setIsCellModified(true);
        setIsCellWarning(false);
      }
      setPrevRole(roleId);
    }
  }, [roleId, dataId]);

  useEffect(() => {
    setPrevDetails(createDetails());
  }, [dataId]);

  return [isCellModified, isCellWarning, managedDataSet, initialData];

  function createDataSet() {
    const managedDataClone = [...dataSet];
    const preExisting =
      managedDataClone.filter((user) => user.userId === prevDetails.userId).length > 0;
    if (!preExisting) managedDataClone.unshift(prevDetails); // adds prev selected guy to top of list of options
    return managedDataClone;
  }

  function createDetails() {
    return dataSet.filter((user) => user.userId === dataId)[0] || { userId: -1 };
  }
};

useTasksAutocompleteHooks.PropTypes = {
  dataId: PropTypes.number,
  roleId: PropTypes.number,
  dataSet: PropTypes.array,
};

export default useTasksAutocompleteHooks;
