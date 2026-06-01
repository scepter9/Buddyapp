// socket.js
import { io } from "socket.io-client";

const API_BASE_URL = "https://buddyapp-1ib3.onrender.com";

const socket = io(API_BASE_URL, {
  transports: ['websocket'],
  
  withCredentials: true,
  autoConnect: true, // important
});

export default socket;
