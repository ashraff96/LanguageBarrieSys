import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Mic, 
  BookOpen, 
  Clock, 
  Users, 
  Download,
  Brain,
  Lock
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: FileText,
      title: "Document Translation",
      description: "Upload and translate documents in multiple formats including PDF, Word, and text files with preserved formatting."
    },
    {
      icon: Mic,
      title: "Voice Translation",
      description: "Real-time voice translation for instant communication across language barriers with high accuracy."
    },
    {
      icon: Brain,
      title: "AI-Powered Accuracy",
      description: "Advanced neural networks ensure contextually accurate translations that understand nuance and meaning."
    },
    {
      icon: Clock,
      title: "Instant Results",
      description: "Get translations in seconds, not hours. Our optimized system delivers fast, reliable results every time."
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share translations with team members, track revision history, and collaborate on projects seamlessly."
    },
    {
      icon: Lock,
      title: "Enterprise Security",
      description: "Bank-level encryption and compliance with international data protection standards keep your documents safe."
    },
    {
      icon: BookOpen,
      title: "Language Learning",
      description: "Interactive practice sessions and grammar tools to help improve your language skills alongside translation."
    },
    {
      icon: Download,
      title: "Multiple Formats",
      description: "Export translations in various formats while maintaining original document structure and styling."
    }
  ];

  return (
    <section className="py-20 bg-feature-bg">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Core Features
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Comprehensive translation tools designed to break down language barriers 
            and enhance global communication
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-hero-gradient-start to-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white text-lg">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;