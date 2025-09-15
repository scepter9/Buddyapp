import React, { createContext, useState, useEffect, useContext ,useCallback} from 'react';
import { io } from 'socket.io-client';
import { Alert } from 'react-native';
import { AuthorContext } from './AuthorContext'; // Assuming AuthorContext provides user.id

const API_BASE_URL = 'http://172.20.10.4:3000'; // Ensure this matches your backend URL

export const UnreadMessagesContext = createContext(); 

export const UnreadMessagesProvider = ({ children }) => {
  const { user } = useContext(AuthorContext);
  const myUserId = user?.id; // Get the logged-in user's ID
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!myUserId) {
      console.log('UnreadMessagesContext: User ID not available, skipping socket connection.');
      if (socket) socket.disconnect();
      return;
    }

    console.log(`UnreadMessagesContext: Attempting to connect socket for userId: ${myUserId}`);
    const newSocket = io(API_BASE_URL, {
      query: { userId: myUserId },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('UnreadMessagesContext: Socket connected!');
    });

    newSocket.on('disconnect', () => {
      console.log('UnreadMessagesContext: Socket disconnected.');
    });

    // Listen for new messages
    newSocket.on('newMessage', (message) => {
      console.log('UnreadMessagesContext: Received new message:', message);
      // Check if the message is for the current user AND if it's not from the current user
      // Also, we assume here that all `newMessage` events represent potentially unread messages
      // This will increment the badge count regardless of which chat screen is open
      if (message.receiverId === myUserId && message.senderId !== myUserId) {
        console.log('UnreadMessagesContext: Incrementing unread count.');
        setUnreadCount(prevCount => prevCount + 1);
      }
    });

    // Handle initial fetch of unread count when component mounts or user logs in
    const fetchInitialUnreadCount = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/unread-messages-count?userId=${myUserId}`);
        if (!response.ok) throw new Error('Failed to fetch initial unread count');
        const data = await response.json();
        setUnreadCount(data.count);
        console.log('UnreadMessagesContext: Initial unread count fetched:', data.count);
      } catch (error) {
        console.error('UnreadMessagesContext: Error fetching initial unread count:', error);
        // Alert.alert('Error', 'Failed to load unread messages count.');
      }
    };

    fetchInitialUnreadCount();
    setSocket(newSocket); // Store the socket instance

    return () => {
      console.log('UnreadMessagesContext: Disconnecting socket on cleanup.');
      newSocket.disconnect();
    };
  }, [myUserId]); // Re-run effect if myUserId changes (e.g., user logs in/out)

  // Function to manually reset unread count (e.g., when user enters a specific chat)
  const resetUnreadCountForConversation = useCallback(async (senderId, receiverId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/mark-as-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId, receiverId }),
      });
      if (!response.ok) throw new Error('Failed to mark messages as read');
      const data = await response.json();
      setUnreadCount(data.newUnreadCount); // Backend sends back the updated total unread count
      console.log(`Unread count reset for conversation with ${senderId}. New total: ${data.newUnreadCount}`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      Alert.alert('Error', 'Failed to update message read status.');
    }
  }, []);


  return (
    <UnreadMessagesContext.Provider value={{ unreadCount, setUnreadCount, resetUnreadCountForConversation }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};