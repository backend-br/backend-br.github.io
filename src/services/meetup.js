/* eslint-disable import/prefer-default-export */

import Axios from 'axios';

const getMeetup = async (group, endpoint) => {
  const url = `https://zuevcrixk8.execute-api.us-east-1.amazonaws.com/prod/call?group=${group}&endpoint=${endpoint}&photo-host=public&page=20&status=upcoming,past`;
  const response = await Axios.get(url);

  return response.data;
};

export const getEvents = org => getMeetup(org, 'events');
