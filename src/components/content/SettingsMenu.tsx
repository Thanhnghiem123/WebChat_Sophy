import React, { useEffect } from "react";
import { logout } from "../../api/API";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDatabase,
  faFileAlt,
  faGear,
  faHeadset,
  faLanguage,
  faUser,
} from "@fortawesome/free-solid-svg-icons";

import { Menu } from "antd";
import type { MenuProps } from "antd";

interface SettingsMenuProps {
  onClose: () => void;
  onOpenModal: () => void; // Prop to open the modal
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  onClose,
  onOpenModal,
}) => {
  useEffect(() => {
    console.log("SettingsMenu mounted");
    return () => console.log("SettingsMenu unmounted");
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      alert("Đăng xuất thành công!");
      window.location.href = "/"; // Redirect to login page after logout
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message || "Đăng xuất thất bại, vui lòng thử lại.");
      } else {
        alert("Đăng xuất thất bại, vui lòng thử lại.");
      }
    }
  };

  // Define menu items
  const items: MenuProps["items"] = [
    {
      key: "1",
      icon: <FontAwesomeIcon icon={faUser} />,
      label: "Thông tin tài khoản",
      onClick: onOpenModal, // Open modal on click
    },
    {
      key: "2",
      icon: <FontAwesomeIcon icon={faGear} />,
      label: "Cài đặt",
      onClick: onClose, // Close menu on click
    },
    {
      type: "divider", // Divider between sections
    },
    {
      key: "3",
      icon: <FontAwesomeIcon icon={faDatabase} />,
      label: "Dữ liệu",
      children: [
        {
          key: "3-1",
          icon: <FontAwesomeIcon icon={faFileAlt} />,
          label: "Quản lý file",
          onClick: () => {
            console.log("Quản lý file clicked");
          },
        },
      ],
    },
    {
      key: "4",
      icon: <FontAwesomeIcon icon={faLanguage} />,
      label: "Ngôn ngữ",
      children: [
        {
          key: "4-1",
          label: (
            <div className="flex items-center">
              <img
                src="https://flagcdn.com/w40/vn.png"
                alt="Vietnam Flag"
                className="w-6 h-4 mr-2 object-cover"
              />
              Tiếng Việt
            </div>
          ),
          onClick: () => {
            onClose();
          },
        },
        {
          key: "4-2",
          label: (
            <div className="flex items-center">
              <img
                src="https://flagcdn.com/w40/gb.png"
                alt="English Flag"
                className="w-6 h-4 mr-2 object-cover"
              />
              English
            </div>
          ),
          onClick: () => {
            onClose();
          },
        },
      ],
    },
    {
      key: "5",
      icon: <FontAwesomeIcon icon={faHeadset} />,
      label: "Hỗ trợ",
      onClick: onClose, // Close menu on click
    },
    {
      type: "divider", // Divider before logout
    },
    {
      key: "6",
      icon: <i className="fa fa-sign-out-alt text-lg"></i>,
      label: <span className="text-red-500">Đăng xuất</span>,
      onClick: () => {
        onClose();
        handleLogout(); // Log out and close menu
      },
    },
  ];

  return (
    <div className="absolute left-42 bottom-1 transform translate-x-[-100%] ml-3 w-58 p-2 bg-white ">
      <Menu
        items={items}
        mode="vertical"
        theme="light"
        className="rounded-lg"
      />
    </div>
  );
};

export default SettingsMenu;
