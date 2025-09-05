import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { API_ENDPOINTS } from "../config/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: false, password: false });
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const validate = () => {
    const emailValid = email.trim() !== "";
    const passwordValid = password.trim() !== "";
    setErrors({
      email: !emailValid,
      password: !passwordValid,
    });

    if (!emailValid || !passwordValid) {
      toast.error("⚠️ Please fill in both fields.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const loading = toast.loading("🔐 Logging in...");

    try {
      const res = await axios.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });

      const { token, user } = res.data;

      // Use AuthContext login method instead of direct localStorage
      login({
        token,
        role: user.role,
        name: user.name,
        email: user.email,
      });

      toast.success("✅ Login successful", { id: loading });

      // Redirect to the dashboard
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast.error("❌ Invalid email or password", { id: loading });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8 transition-colors bg-white dark:bg-gray-900">
      <div className="w-full max-w-sm p-6 transition-colors bg-gray-100 shadow-xl dark:bg-gray-800 rounded-2xl sm:p-8">
        <h2 className="mb-6 text-2xl font-bold text-center text-blue-600 sm:text-3xl dark:text-white">
          Login to ERP
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: false }));
              }}
              className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${
                errors.email
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-300 dark:border-gray-600 focus:ring-blue-400"
              }`}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: false }));
                }}
                className={`w-full px-4 py-2 pr-12 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${
                  errors.password
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300 dark:border-gray-600 focus:ring-blue-400"
                }`}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex items-center justify-center px-3 text-blue-700 transition rounded-r focus:outline-none hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-blue-700 dark:text-blue-300" strokeWidth={1.9} />
                ) : (
                  <Eye className="w-5 h-5 text-blue-700 dark:text-blue-300" strokeWidth={1.9} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 font-semibold text-white transition bg-blue-600 rounded-lg shadow hover:bg-blue-700"
          >
            🔐 Login
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            New here? Create an account to get started.
          </p>
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="w-full py-2 text-sm font-semibold text-blue-600 transition bg-white border border-blue-600 rounded-lg shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:border-blue-400 dark:text-blue-300 dark:hover:bg-gray-600"
          >
            ✨ Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
