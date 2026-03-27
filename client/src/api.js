const config = {
  development: "http://localhost:3000",
  production: "https://librarydatabaseserver-aqbhg6a3gxgsdpge.centralus-01.azurewebsites.net"
};

const API =
  import.meta.env.VITE_API_URL ||
  config[import.meta.env.MODE];

export default API;