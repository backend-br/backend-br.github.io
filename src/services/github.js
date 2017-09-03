import Axios from 'axios';

export const getRepositories = org => {
    return Axios.get(`https://api.github.com/orgs/${ org }/repos?per_page=100&page=1`)
        .then(response => response.data.filter(repo => repo.name !== 'backend-br.github.io'))
};

export const getMembers = org => {
    return Axios.get(`https://api.github.com/orgs/${ org }/public_members?page=1&per_page=100`)
        .then(response => response.data);
};


export const filterRepositoriesByName = (a, b) => {
    if(a.name > b.name) return 1; 
    if(a.name < b.name) return -1;
    return 0;
};

export const filterRepositoriesByStars = (a, b) => {
    return b.stargazers_count - a.stargazers_count;
};
