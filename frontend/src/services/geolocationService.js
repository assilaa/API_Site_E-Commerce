import axios from "axios";

const API_URL = "http://localhost:3000/api/geo";

export default {
  searchAddress(query) {
    return axios.get(`${API_URL}/search`, { params: { query } });
  },

  getPickupPoints(lat, lon) {
    return axios.get(`${API_URL}/pickup`, { params: { lat, lon } });
  }
};
