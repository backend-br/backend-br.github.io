import Axios from 'axios';

export const getRepositories = org => Axios.get(`https://api.github.com/orgs/${ org }/repos?per_page=100&page=1`);

export const getMembers = org => Axios.get(`https://api.github.com/orgs/${ org }/public_members?page=1&per_page=100`);
