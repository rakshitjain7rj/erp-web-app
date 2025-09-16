import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // retained for potential future direct calls
import toast from "react-hot-toast";
import { API_ENDPOINTS } from "../config/api";
import { registerUser } from "../api/auth";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState({
    name: false,
    email: false,
    password: false,
    role: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, password, role } = form;

    const newErrors = {
      name: name.trim() === "",
      email: email.trim() === "",
      password: password.trim() === "",
      role: role.trim() === "",
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some((e) => e)) {
      toast.error("⚠️ All fields are required.");
      return;
    }

    const loadingToast = toast.loading("🔄 Registering...");
    try {
      // Debug: show fully-resolved endpoint actually being called
      // eslint-disable-next-line no-console
      console.log('🛰 Register endpoint (resolved):', API_ENDPOINTS.AUTH.REGISTER);
      const resp = await registerUser(form as any);
      if (resp?.pending) {
        toast.success("✅ Request submitted for approval", { id: loadingToast });
        setPendingNotice('Your account is pending approval. You will be able to login once an administrator activates it.');
        // Clear sensitive fields
        setForm(prev => ({ ...prev, password: '' }));
      } else {
        toast.success("✅ Registration successful!", { id: loadingToast });
        navigate("/login");
      }
    } catch (err) {
      toast.error("❌ Registration failed. Email may already be in use.", {
        id: loadingToast,
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 shadow-lg p-8 rounded-xl w-80 space-y-4"
      >
        <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-white">
          Register
        </h2>

        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className={`w-full p-2 border rounded focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
            errors.name
              ? "border-red-500 focus:ring-red-400"
              : "border-gray-300 focus:ring-green-400"
          }`}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className={`w-full p-2 border rounded focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
            errors.email
              ? "border-red-500 focus:ring-red-400"
              : "border-gray-300 focus:ring-green-400"
          }`}
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className={`w-full p-2 pr-10 border rounded focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
              errors.password
                ? "border-red-500 focus:ring-red-400"
                : "border-gray-300 focus:ring-green-400"
            }`}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((p) => !p)}
            className="absolute inset-y-0 right-0 flex items-center justify-center px-2 text-blue-700 transition rounded-r focus:outline-none hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5 text-blue-700 dark:text-blue-300" strokeWidth={1.9} />
            ) : (
              <Eye className="w-5 h-5 text-blue-700 dark:text-blue-300" strokeWidth={1.9} />
            )}
          </button>
        </div>

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className={`w-full p-2 border rounded focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-black dark:text-white ${
            errors.role
              ? "border-red-500 focus:ring-red-400"
              : "border-gray-300 focus:ring-green-400"
          }`}
        >
          <option value="">Select Role</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>

        </select>
        {pendingNotice && (
          <div className="text-xs rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 p-2 border border-amber-300 dark:border-amber-700">
            {pendingNotice}
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 transition"
        >
          Register
        </button>

        <p className="text-sm text-center text-gray-700 dark:text-gray-300">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-blue-500 cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
};

export default Register;
