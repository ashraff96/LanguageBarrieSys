import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAdminAccess = () => {
    if (isAuthenticated) {
      navigate("/admin");
    } else {
      navigate("/signin");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection onGetStarted={handleAdminAccess} />
      <FeaturesSection />
    </div>
  );
};

export default Index;