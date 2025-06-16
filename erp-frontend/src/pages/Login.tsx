import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: false, password: false });

  const navigate = useNavigate();

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

    try {
      if (email === "admin@example.com" && password === "admin") {
        toast.success("✅ Login successful");
        navigate("/dashboard");
      } else {
        toast.error("❌ Invalid email or password");
      }
    } catch (err) {
      toast.error("⚠️ An unexpected error occurred.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-8">
      <div className="bg-gray-100 shadow-xl rounded-2xl p-6 sm:p-8 w-full max-w-sm">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-blue-600">
          Login to ERP
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: false }));
              }}
              className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                errors.email
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-300 focus:ring-blue-400"
              }`}
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: false }));
              }}
              className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                errors.password
                  ? "border-red-500 focus:ring-red-400"
                  : "border-gray-300 focus:ring-blue-400"
              }`}
              placeholder="admin"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow transition"
          >
            🔐 Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
