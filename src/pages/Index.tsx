
import { motion } from "framer-motion";
import { ArrowRight, LineChart, LogOut, Shield, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen w-full overflow-hidden">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            onClick={() => signOut()}
            className="text-gray-600 hover:text-gray-900"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto space-y-6"
        >
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-gray-200 bg-white/50 backdrop-blur-sm mb-8">
            <span className="text-sm font-medium text-gray-600">
              Introducing something amazing
            </span>
          </div>
          <h1 className="hero-text">
            Create beautiful experiences that inspire
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your ideas into reality with our powerful platform. Build, iterate, and scale with confidence.
          </p>
          <div className="flex items-center justify-center gap-4 pt-8">
            <button className="button-primary">
              Get Started
              <ArrowRight className="ml-2 inline-block w-4 h-4" />
            </button>
            <button className="button-secondary">
              Learn More
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50/50 py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <h2 className="section-text mb-6">
              Crafted for excellence
            </h2>
            <p className="text-lg text-gray-600">
              Every detail has been carefully considered to provide you with the best possible experience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="feature-card"
              >
                <feature.icon className="w-10 h-10 mb-4 text-gray-900" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="section-text mb-6">
            Ready to get started?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of creators who are already building amazing things.
          </p>
          <button className="button-primary">
            Start Building Now
            <ArrowRight className="ml-2 inline-block w-4 h-4" />
          </button>
        </motion.div>
      </section>
    </div>
  );
};

const features = [
  {
    title: "Lightning Fast",
    description: "Experience incredible performance with our optimized platform.",
    icon: Zap,
  },
  {
    title: "Powerful Analytics",
    description: "Gain valuable insights with comprehensive analytics tools.",
    icon: LineChart,
  },
  {
    title: "Enterprise Security",
    description: "Your data is protected with industry-leading security measures.",
    icon: Shield,
  },
];

export default Index;
