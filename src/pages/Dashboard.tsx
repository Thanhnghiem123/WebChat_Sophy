import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import ChatList from "../components/chat/ChatList";
import ChatHeader from "../components/chat/ChatHeader";
import SettingsMenu from "../components/content/SettingsMenu";
import UserModal from "../components/content/modal/UserModal";
import SettingsModal from "../components/content/modal/SettingsModal";
import MainContent from "../components/content/MainContent";
import { Conversation } from "../features/chat/types/conversationTypes";
// Remove the unused import
// import { useLanguage } from "../features/auth/context/LanguageContext"; 

const Dashboard: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  
  // Remove the unused variable
  // const { t } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node) &&
        !document.querySelector(".settings-modal")?.contains(event.target as Node)
      ) {
        console.log("Click outside SettingsMenu detected");
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setIsSettingsOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleToggleSettings = () => {
    setIsSettingsOpen((prev) => !prev);
  };

  const handleOpenSettingsModal = () => {
    console.log("Opening SettingsModal from Dashboard");
    setIsSettingsModalOpen(true);
    setIsSettingsOpen(false);
  };

  const handleCloseSettingsModal = () => {
    console.log("Closing SettingsModal from Dashboard");
    setIsSettingsModalOpen(false);
  };

  return (
    <div className="flex h-screen relative">
      <Sidebar
        onSettingsClick={handleToggleSettings}
        onOpenModal={handleOpenModal}
        openSettingsModal={handleOpenSettingsModal}
      />
      <ChatList onSelectConversation={setSelectedConversation} />
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <ChatHeader
              conversation={selectedConversation}
              isGroup={selectedConversation.isGroup}
              groupName={
                selectedConversation.isGroup
                  ? selectedConversation.groupName
                  : selectedConversation.receiverId
              }
              groupAvatarUrl={
                selectedConversation.isGroup
                  ? selectedConversation.groupAvatarUrl || "/images/group-avatar.png"
                  : "/images/default-avatar.png"
              }
              groupMembers={selectedConversation.groupMembers}
            />
            <div className="flex-1 bg-gray-50">
              {/* Ví dụ thêm văn bản dịch */}
              {/* <p>{t.chat_placeholder || "Chưa có tin nhắn nào"}</p> */}
            </div>
          </>
        ) : (
          <MainContent />
        )}
      </div>

      {isSettingsOpen && (
        <div ref={settingsRef}>
          <SettingsMenu
            openSettingsModal={handleOpenSettingsModal}
            onClose={() => setIsSettingsOpen(false)}
            onOpenModal={handleOpenModal}
          />
        </div>
      )}

      <UserModal isOpen={isModalOpen} onClose={handleCloseModal} />
      <SettingsModal visible={isSettingsModalOpen} onClose={handleCloseSettingsModal} />
    </div>
  );
};

export default Dashboard;