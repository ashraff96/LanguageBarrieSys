import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Zap, Shield } from "lucide-react";

interface HeroSectionProps {
  onGetStarted?: () => void;
}

const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-hero-gradient-start via-primary to-hero-gradient-end">
      <div className="absolute inset-0 bg-black/10"></div>
      
      <div className="relative container mx-auto px-6 py-20 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            DocuTranslate
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white/90 font-light">
            Document Translation System
          </p>
          
          <p className="text-lg md:text-xl mb-12 text-white/80 max-w-3xl mx-auto leading-relaxed">
Language barriers in Sri Lanka shouldn't put you off, but should be seen as part of the adventure. With a smile, a few simple terms and the help of apps, communication will be child's play. Sri Lanka welcomes you - and you will see that words are often only half of the communication.
          </p>
          
          <Button 
            size="lg" 
            className="bg-white/20 text-white border border-white/30 hover:bg-white/30 backdrop-blur-sm text-lg px-8 py-6 rounded-xl transition-all duration-300 hover:scale-105"
            onClick={onGetStarted}
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Globe className="w-6 h-6" />
              </div>
              <span className="text-white/90">3 Languages</span>
            </div>
            
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Zap className="w-6 h-6" />
              </div>
              <span className="text-white/90">Lightning Fast</span>
            </div>
            
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-6 h-6" />
              </div>
              <span className="text-white/90">Secure & Private</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;