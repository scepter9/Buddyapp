// socket.js
import { io } from "socket.io-client";

const API_BASE_URL = "http://192.168.0.136:3000";

const socket = io(API_BASE_URL, {
  transports: ['websocket'],
  
  withCredentials: true,
  autoConnect: true, // important
});

export default socket;
