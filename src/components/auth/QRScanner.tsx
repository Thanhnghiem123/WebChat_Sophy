import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { generateQRToken } from "../../api/API";
import io from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:3000";

const QRScanner: React.FC = () => {
  const navigate = useNavigate();
  const [qrToken, setQRToken] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isNearExpiration, setIsNearExpiration] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<{
    fullname: string;
    urlavatar: string | null;
  } | null>(null);

  // Khởi tạo QR Token
  useEffect(() => {
    const generateQR = async () => {
      try {
        setIsLoading(true);
        const response = await generateQRToken();
        setQRToken(response.qrToken);
        setExpiresAt(new Date(response.expiresAt));
        setStatus("waiting");
        setIsExpired(false);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tạo mã QR. Vui lòng thử lại."
        );
      } finally {
        setIsLoading(false);
      }
    };

    generateQR();
  }, []);

  // Cập nhật thời gian còn lại
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const timeRemaining = Math.max(
        0,
        expiresAt.getTime() - new Date().getTime()
      );
      setTimeLeft(timeRemaining);
      if (timeRemaining === 0) {
        setIsExpired(true);
      } else if (timeRemaining <= 30000) {
        setIsNearExpiration(true);
      } else {
        setIsNearExpiration(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Kết nối WebSocket
  useEffect(() => {
    if (!qrToken || status !== "waiting") return;

    const socketIo = io(SOCKET_SERVER_URL, {
      query: { qrToken },
    });

    socketIo.emit("initQrLogin", qrToken);

    socketIo.on("qrScanned", (data) => {
      console.log("QR scanned by mobile app:", data);
      setStatus("scanned");
      setUserInfo({
        fullname: data.fullname,
        urlavatar: data.urlavatar,
      });
    });

    socketIo.on("qrLoginConfirmed", (data) => {
      console.log("QR login confirmed:", data);
      setStatus("authenticated");

      // Lưu thông tin vào localStorage
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("token", data.token);

      // Chuyển hướng ngay lập tức tới trang /main
      navigate("/main");
    });

    socketIo.on("qrLoginRejected", (data) => {
      setError(data.message || "Đăng nhập QR bị từ chối.");
      setStatus("rejected");
    });

    socketIo.on("qrError", (data) => {
      setError(data.message || "Lỗi không xác định.");
      setStatus("error");
    });

    return () => {
      socketIo.disconnect();
    };
  }, [qrToken, status, navigate]);

  const handleRegenerateQR = async () => {
    setIsExpired(false);
    setTimeLeft(0);
    setQRToken("");
    setExpiresAt(null);
    setStatus("waiting");
    setUserInfo(null);

    try {
      const response = await generateQRToken();
      setQRToken(response.qrToken);
      setExpiresAt(new Date(response.expiresAt));
      setStatus("waiting");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tạo mã QR. Vui lòng thử lại."
      );
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-blue-100 p-6">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-lg">
        <div className="flex flex-col items-center">
          <img
            src="/images/logo.png"
            alt="Logo"
            className="h-20 w-20 rounded-full"
          />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Đăng nhập bằng QR Code
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Quét mã QR bằng ứng dụng trên điện thoại để đăng nhập
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500">{error}</div>
          ) : status === "scanned" && userInfo ? (
            // Hiển thị thông tin người dùng khi QR được quét
            <div className="text-center">
              <img
                src={userInfo.urlavatar || "/images/default-avatar.png"}
                alt="User avatar"
                className="h-24 w-24 rounded-full mx-auto"
                onError={(e) => {
                  e.currentTarget.src = "/images/default-avatar.png";
                }}
              />
              <p className="mt-2 text-lg font-semibold">{userInfo.fullname}</p>
              <p className="text-sm text-gray-600">
                Đã quét QR, đang chờ xác nhận...
              </p>
            </div>
          ) : isExpired ? (
            <div className="text-center text-gray-500">
              <p>Mã QR đã hết hạn!</p>
              <button
                onClick={handleRegenerateQR}
                className="mt-4 text-blue-500"
              >
                Tạo lại mã QR
              </button>
            </div>
          ) : (
            <div className="p-4 border-2 border-gray-200 rounded-lg">
              <QRCodeSVG
                value={JSON.stringify({
                  token: qrToken,
                  expiresAt: expiresAt?.toISOString(),
                  type: "sophy_auth",
                })}
                size={200}
              />
              <p
                className={`font-bold text-xl text-center mt-2 ${
                  isNearExpiration ? "text-red-500" : "text-black"
                }`}
              >
                {Math.ceil(timeLeft / 1000)} giây còn lại
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-sm text-blue-500 transition-colors duration-200 hover:text-blue-600 underline hover:no-underline"
          >
            Đăng nhập bằng mật khẩu
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
