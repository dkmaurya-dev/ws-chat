'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import JoinScreen from '@/components/JoinScreen';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';
import MessageInput from '@/components/MessageInput';
import { useWebRTC } from '@/hooks/useWebRTC';
import VideoCall from '@/components/VideoCall';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import AuthScreen from '@/components/AuthScreen';

export default function Home() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const {
    isConnected,
    messages,
    roomUsers,
    typingUsers,
    currentRoom,
    currentUser,
    joinRoom,
    sendMessage,
    emitTyping,
    leaveRoom,
    onlineUsers,
    socket,
  } = useSocket(user?.token || null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.username?.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  // Main chat area
  const {
    callState,
    startCall,
    acceptCall,
    endCall,
    rejectCall
  } = useWebRTC(socket);

  // Handler for switching rooms from Sidebar
  const handleSwitchRoom = useCallback(
    async (room: string) => {
      if (!user) return { error: 'No user' };
      return joinRoom(room);
    },
    [user, joinRoom]
  );

  // Loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Auth screen if not logged in
  if (!user) {
    return <AuthScreen />;
  }

  // Show join screen if not in a room
  if (!currentRoom) {
    return (
      <JoinScreen
        onJoin={joinRoom}
        isConnected={isConnected}
        username={user.username}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex h-screen bg-[#0a0e1a] overflow-hidden noise-overlay"
    >
      {/* Video Call Overlay */}
      <VideoCall
        callState={callState}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEnd={endCall}
      />

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed lg:relative z-30 h-full"
          >
            <Sidebar
              currentUser={currentUser}
              currentRoom={currentRoom}
              roomUsers={roomUsers}
              isConnected={isConnected}
              onLeave={leaveRoom}
              typingUsers={typingUsers}
              onlineUsers={onlineUsers}
              onClose={() => setSidebarOpen(false)}
              onSwitchRoom={handleSwitchRoom}
              onCall={(user) => startCall(user.id, user.username)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <ChatArea
          messages={filteredMessages}
          allMessagesCount={messages.length}
          currentUser={currentUser}
          currentRoom={currentRoom}
          typingUsers={typingUsers}
          onLeave={leaveRoom}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          roomUsersCount={roomUsers.length}
        />
        <MessageInput
          onSend={sendMessage}
          onTyping={emitTyping}
          disabled={!isConnected}
        />
      </div>
    </motion.div>
  );
}
