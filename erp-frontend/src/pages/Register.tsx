import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { API_ENDPOINTS } from "../config/api";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

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
      await axios.post(API_ENDPOINTS.AUTH.REGISTER, form);
      toast.success("✅ Registration successful!", { id: loadingToast });
      navigate("/login");
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

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className={`w-full p-2 border rounded focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
            errors.password
              ? "border-red-500 focus:ring-red-400"
              : "border-gray-300 focus:ring-green-400"
          }`}
        />

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
          <option value="storekeeper">Storekeeper</option>

        </select>

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
