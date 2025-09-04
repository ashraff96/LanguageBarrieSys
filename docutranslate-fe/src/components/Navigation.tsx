
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Languages } from "lucide-react";

const Navigation = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      navigate("/admin");
    } else {
      navigate("/signin");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
              <Languages className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">DocuTranslate</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
           
            {isAuthenticated && (
              <>
                <button className="text-gray-700 hover:text-blue-600 transition-colors" onClick={() => navigate("/voice-translator")}>
                  Voice Translator
                </button>
                <button className="text-gray-700 hover:text-blue-600 transition-colors" onClick={() => navigate("/language-practice")}>
                  Language Practice
                </button>
                <button className="text-gray-700 hover:text-blue-600 transition-colors" onClick={() => navigate("/rajabasha")}>
                  Rajabasha
                </button>
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
             
                <Button
                  variant="outline"
                  onClick={() => navigate("/document-translator")}
                >
                  Translate Document
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate("/document-translator")}
                >
                  Translate Document
                </Button>
                <Button
                  onClick={handleAuthAction}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;