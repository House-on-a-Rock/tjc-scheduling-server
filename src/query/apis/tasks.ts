import axios, { AxiosResponse } from 'axios';
// import { secretIp } from '../../../secrets/secretStuff';
import { getLocalStorageItem } from '../../shared/utilities';

const secretIp = process.env.BASE_URL;

export function getUserTasks(userId: number): Promise<AxiosResponse> {
  const token = getLocalStorageItem('access_token')?.token;
  axios.defaults.headers.common.authorization = token;
  return axios.get(`${secretIp}/api/tasks?userId=${userId}`);
}
