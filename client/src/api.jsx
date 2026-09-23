import axios from "axios";


// ======================================================
// AXIOS INSTANCE
// ======================================================

const api = axios.create({
  baseURL:
    "http://localhost:5000/api",

  timeout: 10000,

  headers: {
    "Content-Type":
      "application/json",
  },
});


// ======================================================
// REQUEST INTERCEPTOR
// ======================================================

api.interceptors.request.use(
  (config) => {

    const storedToken =
      localStorage.getItem(
        "token"
      );


    console.log(
      "[API REQUEST]",
      config.method?.toUpperCase(),
      `${config.baseURL}${config.url}`
    );


    if (storedToken) {

      let token =
        storedToken.trim();


      // Prevent:
      // Bearer Bearer eyJ...

      if (
        token.startsWith(
          "Bearer "
        )
      ) {
        token =
          token.substring(7).trim();
      }


      config.headers =
        config.headers || {};


      config.headers.Authorization =
        `Bearer ${token}`;


      console.log(
        "[API AUTH] Token attached"
      );

    } else {

      console.warn(
        "[API AUTH] No token found"
      );
    }


    return config;
  },

  (error) => {

    console.error(
      "[API REQUEST ERROR]",
      error
    );

    return Promise.reject(
      error
    );
  }
);


// ======================================================
// RESPONSE INTERCEPTOR
// ======================================================

api.interceptors.response.use(

  (response) => {

    console.log(
      "[API RESPONSE]",
      response.status,
      response.config.url,
      response.data
    );

    return response;
  },


  (error) => {

    console.error(
      "================================="
    );

    console.error(
      "[API RESPONSE ERROR]"
    );

    console.error(
      "Message:",
      error?.message
    );

    console.error(
      "Code:",
      error?.code
    );

    console.error(
      "URL:",
      error?.config?.url
    );

    console.error(
      "Base URL:",
      error?.config?.baseURL
    );

    console.error(
      "Status:",
      error?.response?.status
    );

    console.error(
      "Response:",
      error?.response?.data
    );

    console.error(
      "================================="
    );


    return Promise.reject(
      error
    );
  }
);


export default api;