import axios, { AxiosError } from "axios";
import {
  Conversation,
  Message,
} from "../features/chat/types/conversationTypes";
// import bcrypt from "bcryptjs";

// Khai báo URL API chính
const API_BASE_URL = "http://localhost:3000";

// Tạo instance Axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
//update tên người dùng
export const updateUserName = async (userId: string, fullname: string) => {
  try {
    const response = await apiClient.put("/api/users/update-user/name", {
      userId,
      fullname,
    });
    return response.data;
  } catch (error: unknown) {
    const apiError = error as AxiosError<{ message?: string }>;
    if (apiError.response?.status === 404) {
      throw new Error("Không tìm thấy người dùng");
    }
    throw new Error(apiError.response?.data?.message || "Lỗi không xác định");
  }
};
//update thông tin người dùng
export const updateUserInfo = async (
  userId: string,
  data: { isMale: boolean; birthday: string; [key: string]: any }
) => {
  try {
    const response = await apiClient.put("/api/users/update-user/info", {
      userId,
      ...data, // Truyền các thông tin cần cập nhật
    });
    return response.data;
  } catch (error: unknown) {
    const apiError = error as AxiosError<{ message?: string }>;
    if (apiError.response?.status === 404) {
      throw new Error("Không tìm thấy người dùng");
    }
    throw new Error(apiError.response?.data?.message || "Lỗi không xác định");
  }
};
//update avatar người dùng
export const updateUserAvatar = async (imageFile: File): Promise<void> => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Không có token xác thực");
    }

    const formData = new FormData();
    formData.append("avatar", imageFile);

    const response = await fetch(
      `${API_BASE_URL}/api/users/update-user/avatar`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Cập nhật avatar thất bại");
    }

    const updatedUser = await response.json();

    // Cập nhật thông tin người dùng vào localStorage
    localStorage.setItem("user", JSON.stringify(updatedUser));
    console.log("Avatar updated successfully:", updatedUser);
  } catch (error: unknown) {
    console.error("Error updating avatar:", error);
    throw new Error(
      error instanceof Error ? error.message : "Lỗi không xác định"
    );
  }
};

export const generateQRToken = async () => {
  try {
    const response = await apiClient.post("/api/auth/generate-qr-token");
    return {
      qrToken: response.data.qrToken,
      expiresAt: response.data.expiresAt,
    };
  } catch (error) {
    throw new Error("Không thể tạo mã QR");
  }
};

export const verifyQRToken = async (qrToken: string) => {
  try {
    const response = await apiClient.post("/api/auth/verify-qr-token", {
      qrToken,
    });
    return {
      message: response.data.message,
    };
  } catch (error: unknown) {
    const apiError = error as AxiosError<{ message?: string }>;
    if (apiError.response?.status === 404) {
      throw new Error("QR token không tồn tại hoặc đã hết hạn");
    }
    if (apiError.response?.status === 400) {
      throw new Error("QR token đã hết hạn");
    }
    throw new Error("Xác thực mã QR thất bại");
  }
};

export const checkQRStatus = async (qrToken: string) => {
  try {
    const response = await apiClient.post(
      `/api/auth/check-qr-status/${qrToken}`
    );
    return {
      status: response.data.status,
      message: response.data.message,
      userId: response.data.userId,
      accessToken: response.data.accessToken,
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error("QR token không tồn tại hoặc đã hết hạn");
    }
    if (error.response?.status === 400) {
      throw new Error("QR token đã hết hạn");
    }
    throw new Error("Kiểm tra trạng thái QR thất bại");
  }
};

export const login = async (phone: string, password: string) => {
  try {
    const response = await apiClient.post("/api/auth/login", {
      phone: phone.replace(/\+84/g, "0"),
      password,
    });

    const { token, user } = response.data;

    if (!token?.accessToken || !token?.refreshToken || !user || !user.userId) {
      throw new Error("Dữ liệu đăng nhập không hợp lệ");
    }

    // Lưu userId, accessToken và refreshToken vào localStorage
    localStorage.setItem("userId", user.userId);
    localStorage.setItem("token", token.accessToken);
    localStorage.setItem("refreshToken", token.refreshToken);

    return {
      userId: user.userId,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      fullname: user.fullname,
    };
  } catch (error: any) {
    // Log chi tiết về lỗi cho debugging
    console.log("=== Chi tiết lỗi đăng nhập ===");
    console.log("Status:", error.response?.status);
    console.log("Response data:", error.response?.data);
    console.log("Error message:", error.message);

    // Xử lý các trường hợp lỗi cụ thể mà không gây reload trang
    if (error.response?.status === 401) {
      // Check if the error message from the server indicates wrong password
      if (error.response.data?.message?.toLowerCase().includes("mật khẩu")) {
        throw new Error("Sai mật khẩu");
      }
      throw new Error("Sai mật khẩu");
    }
    if (error.response?.status === 404) {
      throw new Error("Tài khoản không tồn tại");
    }
    if (error.response?.status === 400) {
      throw new Error(
        error.response.data.message || "Thông tin đăng nhập không hợp lệ"
      );
    }

    // Nếu không phải các lỗi trên, trả về thông báo lỗi chung
    throw new Error(
      error.response?.data?.message || "Đăng nhập thất bại, vui lòng thử lại"
    );
  }
};

// Sửa lại endpoint và xử lý lỗi cho fetchUserData
export const fetchUserData = async (userId: string) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Không có token xác thực");
    }

    const response = await apiClient.get(`/api/users/get-user-by-id/${userId}`);

    console.log("Fetch user data response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw new Error("Không tìm thấy người dùng!");
  }
};

// Hàm kiểm tra thông tin đăng nhập
export const checkLogin = async (phone: string, password: string) => {
  try {
    const response = await apiClient.get("/api/users");
    const users = response.data;
    console.log("Users:", users);

    const user = users.find((user: any) => user.phone_number === phone);

    if (user && password === user.hash_password) {
      // Simulate generating an access token (replace with actual token logic if available)
      const accessToken = `access-token-for-${user._id}`;
      console.log("User found:", user);
      return { userId: user._id, accessToken };
    }

    throw new Error("Sai số điện thoại hoặc mật khẩu");
  } catch (error: any) {
    console.error(
      "Error in checkLogin:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Đăng nhập thất bại, vui lòng thử lại"
    );
  }
};

const getAuthToken = () => localStorage.getItem("token");

// Update apiClient to include auth token in headers when available
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and it's not a retry and it's not a login request
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/api/auth/login")
    ) {
      if (originalRequest.url.includes("/api/auth/change-password")) {
        // Nếu là yêu cầu đổi mật khẩu, không logout mà để hàm gọi xử lý lỗi
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("Refresh token not available");
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem("token", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        apiClient.defaults.headers.common["Authorization"] =
          `Bearer ${accessToken}`;
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userId");
        window.location.href = "/";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const getUserByPhone = async (phone: string) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Không có token xác thực");
    }

    const response = await apiClient.get(`/api/users/get-user/${phone}`);
    console.log("Get user by phone response:", response.data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      await apiClient.patch("/api/auth/refresh");
    }
    if (error.response?.status === 404) {
      throw new Error("Không tìm thấy người dùng");
    }
    console.error("Error fetching user by phone:", error);
    throw new Error("Lỗi khi lấy thông tin người dùng");
  }
};
//Đăng xuất
export const logout = async () => {
  try {
    const response = await apiClient.post("/api/auth/logout");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userId");
    
    apiClient.defaults.headers.common["Authorization"] = "";
    console.log("Đăng xuất thành công:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Lỗi khi đăng xuất:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || "Đăng xuất thất bại, vui lòng thử lại"
    );
  }
};
//Thay đổi mật khẩu
export const changePassword = async (
  oldPassword: string,
  newPassword: string
): Promise<{ accessToken: string; refreshToken: string; userId: string }> => {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      throw new Error("Không tìm thấy thông tin người dùng");
    }

    const response = await apiClient.put("/api/auth/change-password", {
      userId,
      oldPassword,
      newPassword,
    });

    console.log("Response from changePassword API:", response.data);

    const { token, user } = response.data;

    if (!token?.accessToken || !token?.refreshToken || !user || !user.userId) {
      throw new Error("Dữ liệu không hợp lệ");
    }

    localStorage.setItem("token", token.accessToken);
    localStorage.setItem("refreshToken", token.refreshToken);
    apiClient.defaults.headers.common["Authorization"] =
      `Bearer ${token.accessToken}`;

    return {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      userId: user.userId,
    };
  } catch (error) {
    const apiError = error as AxiosError<{ message?: string }>;
    if (apiError.response) {
      const { status, data } = apiError.response;
      switch (status) {
        case 404:
          throw new Error("Không tìm thấy thông tin người dùng");
        case 401:
          throw new Error("Mật khẩu cũ không đúng");
        case 400:
          if (
            data?.message ===
            "Password must be at least 6 characters and contain both letters and numbers"
          ) {
            throw new Error(
              "Mật khẩu mới phải có ít nhất 6 ký tự và chứa cả chữ và số"
            );
          }
          throw new Error(data?.message || "Yêu cầu không hợp lệ");
        case 500:
          throw new Error("Lỗi server, vui lòng thử lại sau");
        default:
          throw new Error(data?.message || "Đổi mật khẩu thất bại, vui lòng thử lại");
      }
    }
    throw new Error("Đổi mật khẩu thất bại, vui lòng thử lại");
  }
};

//Hàm lấy user theo userId
export const getUserById = async (userId: string): Promise<any> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Không có token xác thực");
    }

    const response = await apiClient.get(`/api/users/get-user-by-id/${userId}`);
    console.log("Get user by ID response:", response.data);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error("Không có quyền truy cập");
    }
    if (error.response?.status === 404) {
      throw new Error("Không tìm thấy người dùng");
    }
    console.error("Error fetching user by ID:", error);
    throw new Error("Lỗi khi lấy thông tin người dùng");
  }
};

// Hàm lấy danh sách hội thoại
export const fetchConversations = async (): Promise<Conversation[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Không có token xác thực");
    }

    const response = await apiClient.get("/api/conversations");

    if (!Array.isArray(response.data)) {
      console.error("Invalid conversations data format:", response.data);
      return [];
    }

    // Transform and validate conversations
    const validConversations = response.data;

    console.log("Processed conversations:", validConversations);
    return validConversations;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách hội thoại:", error);
    return []; // Return empty array instead of throwing
  }
};

// Lấy tin nhắn của một cuộc trò chuyện
export const getMessages = async (
  conversationId: string,
  page: number = 1,
  limit: number = 20
): Promise<Message[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Không có token xác thực");
    }

    const response = await apiClient.get(
      `/api/conversations/${conversationId}/messages`,
      {
        params: {
          page,
          limit,
        },
      }
    );

    if (!Array.isArray(response.data)) {
      console.error("Invalid messages data format:", response.data);
      return [];
    }

    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy tin nhắn:", error);
    return [];
  }
};

// Gửi tin nhắn mới
export const sendMessage = async (
  conversationId: string,
  content: string,
  type: string = "text"
): Promise<Message> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Không có token xác thực");
    }

    const response = await apiClient.post(
      `/api/conversations/${conversationId}/messages`,
      {
        content,
        type,
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Lỗi khi gửi tin nhắn:", error);
    throw new Error(error.response?.data?.message || "Không thể gửi tin nhắn");
  }
};

// Lấy chi tiết một cuộc trò chuyện
export const getConversationDetail = async (
  conversationId: string
): Promise<Conversation> => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Không có token xác thực");
    }

    const response = await apiClient.get(
      `/api/conversations/${conversationId}`
    );
    return response.data;
  } catch (error: any) {
    console.error("Lỗi khi lấy chi tiết cuộc trò chuyện:", error);
    throw new Error(
      error.response?.data?.message || "Không thể lấy chi tiết cuộc trò chuyện"
    );
  }
};

// Kiểm tra số điện thoại đã được sử dụng chưa
export const checkUsedPhone = async (
  phone: string
): Promise<{ otpId: string; otp: string }> => {
  try {
    const response = await apiClient.post(
      `/api/auth/check-used-phone/${phone}`
    );
    return {
      otpId: response.data.otpId,
      otp: response.data.otp,
    };
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error(
        error.response.data.message || "Số điện thoại không hợp lệ"
      );
    }
    throw new Error("Không thể kiểm tra số điện thoại");
  }
};
// Gửi mã Xác thực OTP
export const sendOTPForgotPassword = async (
  phone: string
): Promise<{ otpId: string }> => {
  try {
    const response = await apiClient.post(
      "/api/auth/send-otp-forgot-password",
      {
        phone,
      }
    );

    return {
      otpId: response.data.otpId,
    };
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 404) {
        throw new Error("Không tìm thấy tài khoản với số điện thoại này");
      }
      throw new Error(error.response?.data?.message || "Không thể gửi mã OTP");
    }
    throw new Error("Không thể gửi mã OTP");
  }
};
//Xác thực OTP
export const verifyOTPForgotPassword = async (
  phone: string,
  otp: string,
  otpId: string
): Promise<void> => {
  try {
    const response = await apiClient.post("/api/auth/verify-otp-forgot-password", {
      phone,
      otp,
      otpId,
    });

    if (response.status !== 200) {
      throw new Error("Xác thực OTP thất bại");
    }
  } catch (error: unknown) {
    const apiError = error as AxiosError<{ message?: string }>;
    if (apiError.response) {
      const { status, data } = apiError.response;
      switch (status) {
        case 400:
          throw new Error(data?.message || "Xác thực OTP thất bại");
        case 404:
          throw new Error("Không tìm thấy mã OTP hợp lệ");
        case 429: // Thêm xử lý lỗi 429
          throw new Error("Quá nhiều lần xác thực. Vui lòng thử lại sau.");
        default:
          throw new Error(data?.message || "Xác thực OTP thất bại");
      }
    }
    throw new Error("Xác thực OTP thất bại");
  }
};

//Quên mật khẩu
export const forgotPassword = async (
  phone: string,
  newPassword: string
): Promise<void> => {
  try {
    const response = await apiClient.put("/api/auth/forgot-password", {
      phone,
      newPassword,
    });

    if (response.status !== 200) {
      throw new Error("Không thể đặt lại mật khẩu");
    }
  } catch (error: unknown) {
    const apiError = error as AxiosError<{ message?: string }>;
    if (apiError.response) {
      const { status, data } = apiError.response;
      switch (status) {
        case 400:
          if (
            data?.message ===
            "Password must be at least 6 characters and contain both letters and numbers"
          ) {
            throw new Error(
              "Mật khẩu mới phải có ít nhất 6 ký tự và chứa cả chữ và số"
            );
          }
          throw new Error(data?.message || "Thông tin không hợp lệ");
        case 404:
          if (data?.message === "User not found") {
            throw new Error("Không tìm thấy tài khoản với số điện thoại này");
          }
          throw new Error(data?.message || "Không tìm thấy người dùng");
        case 500:
          throw new Error(data?.message || "Lỗi server, vui lòng thử lại sau");
        default:
          throw new Error(data?.message || "Không thể đặt lại mật khẩu");
      }
    }
    throw new Error("Không thể đặt lại mật khẩu");
  }
};

// Xác thực mã OTP
export const verifyPhoneOTP = async (
  phone: string,
  otp: string,
  otpId: string
): Promise<void> => {
  try {
    const response = await apiClient.post("/api/auth/verify-phone-otp", {
      phone,
      otp,
      otpId,
    });
    console.log("Verify phone OTP response:", response.data);
    if (response.data.message !== "Phone verified successfully") {
      throw new Error(response.data.message || "Xác thực OTP thất bại");
    }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Xác thực OTP thất bại");
  }
};

// Upload avatar cho người dùng
export const uploadAvatar = async (imageFile: File): Promise<string> => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Không có token xác thực");
    }

    const formData = new FormData();
    formData.append("avatar", imageFile);

    // Sử dụng fetch API thay vì axios để xử lý tốt hơn với FormData
    const response = await fetch(`${API_BASE_URL}/api/users/update-user/avatar`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Cập nhật avatar thất bại");
    }

    const data = await response.json();
    console.log("Avatar uploaded successfully:", data);
    
    // Trả về URL của avatar mới
    return data.user.urlavatar;
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw new Error(error instanceof Error ? error.message : "Lỗi không xác định khi tải ảnh");
  }
};

// Đăng ký tài khoản mới
export const register = async (
  phone: string,
  password: string,
  fullname: string,
  isMale: boolean,
  birthday: string
) => {
  try {
    // Kiểm tra định dạng mật khẩu
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!passwordRegex.test(password)) {
      throw new Error("Mật khẩu phải có ít nhất 6 ký tự và chứa cả chữ và số");
    }

    const response = await apiClient.post("/api/auth/register", {
      phone,
      password,
      fullname,
      isMale,
      birthday,
    });

    const { token, user } = response.data;
    if (!token?.accessToken || !token?.refreshToken || !user?.userId) {
      throw new Error("Dữ liệu đăng ký không hợp lệ");
    }

    // Lưu thông tin người dùng và token vào localStorage
    localStorage.setItem("userId", user.userId);
    localStorage.setItem("token", token.accessToken);
    localStorage.setItem("refreshToken", token.refreshToken);

    return {
      userId: user.userId,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      fullname: user.fullname,
    };
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error(
        error.response.data.message || "Thông tin đăng ký không hợp lệ"
      );
    }
    throw new Error("Đăng ký thất bại, vui lòng thử lại");
  }
};

// Đăng ký tài khoản mới với avatar
export const registerWithAvatar = async (
  phone: string,
  password: string,
  fullname: string,
  isMale: boolean,
  birthday: string,
  avatarFile: File | null
) => {
  try {
    // Kiểm tra định dạng mật khẩu
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!passwordRegex.test(password)) {
      throw new Error("Mật khẩu phải có ít nhất 6 ký tự và chứa cả chữ và số");
    }

    // Đăng ký tài khoản cơ bản
    const response = await apiClient.post("/api/auth/register", {
      phone,
      password,
      fullname,
      isMale,
      birthday,
    });

    const { token, user } = response.data;
    if (!token?.accessToken || !token?.refreshToken || !user?.userId) {
      throw new Error("Dữ liệu đăng ký không hợp lệ");
    }

    // Lưu thông tin người dùng và token vào localStorage
    localStorage.setItem("userId", user.userId);
    localStorage.setItem("token", token.accessToken);
    localStorage.setItem("refreshToken", token.refreshToken);

    // Nếu có file avatar, tiến hành upload
    let avatarUrl = null;
    if (avatarFile) {
      try {
        avatarUrl = await uploadAvatar(avatarFile);
      } catch (avatarError) {
        console.error("Lỗi khi tải ảnh đại diện:", avatarError);
        // Vẫn tiếp tục mà không dừng quá trình đăng ký
      }
    }

    return {
      userId: user.userId,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      fullname: user.fullname,
      avatarUrl
    };
  } catch (error: any) {
    if (error.response?.status === 400) {
      throw new Error(
        error.response.data.message || "Thông tin đăng ký không hợp lệ"
      );
    }
    throw new Error("Đăng ký thất bại, vui lòng thử lại");
  }
};
