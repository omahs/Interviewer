import axios from 'axios';

export const API_URL = 'http://localhost:8080/api/';

export const login = (username, password) => axios
  .post(`${API_URL}auth/signin`, {
    username,
    password,
  })
  .then((response) => {
    if (response.data.accessToken) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
  });

export const logout = () => {
  localStorage.removeItem('user');
};
