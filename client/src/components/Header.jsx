import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
function Header() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  return (
    <header className="bg-gray-800 text-white p-4 xl:px-28 flex justify-between items-center">
      <h1 className="text-xl font-semibold">Impressio</h1>

      <div>
        {token ? (
          <button
            onClick={() => handleLogout()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
          >
            Logout
          </button>
        ) : (
          <Link to="/register">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
              Login/Signup
            </button>
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;
