import Link from 'next/link';
import { 
  MapIcon, 
  SparklesIcon, 
  GlobeAltIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

export default function HomePage() {
  const features = [
    {
      icon: SparklesIcon,
      title: 'AI-Powered Planning',
      description: 'Let our AI create personalized itineraries based on your preferences and budget.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: GlobeAltIcon,
      title: 'Global Destinations',
      description: 'Explore destinations worldwide with comprehensive travel information.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: CreditCardIcon,
      title: 'Easy Booking',
      description: 'Book flights, hotels, and activities all in one place with secure payments.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Reliable',
      description: 'Your data and payments are protected with enterprise-grade security.',
      gradient: 'from-red-500 to-orange-500'
    },
    {
      icon: ClockIcon,
      title: '24/7 Support',
      description: 'Get help whenever you need it with our round-the-clock customer support.',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: MapIcon,
      title: 'Smart Optimization',
      description: 'Optimize your budget and schedule with intelligent recommendations.',
      gradient: 'from-teal-500 to-blue-500'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      location: 'San Francisco, CA',
      text: 'TravelAI planned our perfect honeymoon to Japan! The AI suggestions were spot-on and saved us hours of research.',
      avatar: '👩‍💼'
    },
    {
      name: 'Michael Rodriguez',
      location: 'Austin, TX',
      text: 'As a busy entrepreneur, TravelAI is a game-changer. Quick, efficient, and the itineraries are always amazing.',
      avatar: '👨‍💻'
    },
    {
      name: 'Emma Thompson',
      location: 'London, UK',
      text: 'Family trips are complicated, but TravelAI made it easy. The kids loved every activity it suggested!',
      avatar: '👩‍👧‍👦'
    }
  ];

  return (
    <div className="bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative gradient-bg text-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute top-32 right-20 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-pink-400/20 rounded-full blur-xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <div className="mb-8">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium">
                ✨ AI-Powered Travel Planning
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Plan Your Perfect Trip with{' '}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                AI Magic
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 text-primary-100 max-w-4xl mx-auto leading-relaxed">
              Create personalized travel itineraries, book everything you need, 
              and explore the world with confidence. Let AI handle the planning while you focus on the adventure.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/register"
                className="bg-gradient-to-r from-yellow-400 to-orange-400 text-primary-900 px-8 py-4 rounded-xl text-lg font-semibold hover:from-yellow-300 hover:to-orange-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Start Planning Free
              </Link>
              <Link
                href="/auth/login"
                className="glass-effect text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/20 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>
            
            <div className="mt-12 text-sm text-primary-200">
              ⭐⭐⭐⭐⭐ Trusted by 10,000+ travelers worldwide
            </div>
          </div>
        </div>
        
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" className="w-full h-12 fill-current text-gray-50">
            <path d="M1200 120L0 16.48V120h1200z" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose TravelAI?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of travel planning with our intelligent platform designed for modern travelers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200 transform hover:-translate-y-2"
                >
                  <div className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to your perfect vacation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: '01',
                title: 'Tell Us Your Dreams',
                description: 'Share your destination, dates, budget, and travel style. Our AI listens to every detail.',
                icon: '💭'
              },
              {
                step: '02',
                title: 'AI Creates Magic',
                description: 'Our intelligent system analyzes thousands of options to craft your perfect personalized itinerary.',
                icon: '✨'
              },
              {
                step: '03',
                title: 'Book & Explore',
                description: 'Review, customize, and book your trip with one click. Then pack your bags for adventure!',
                icon: '🎒'
              }
            ].map((item, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                    {item.step}
                  </div>
                  <div className="absolute -top-2 -right-2 text-3xl">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Loved by Travelers
            </h2>
            <p className="text-xl text-gray-600">
              See what our community says about their TravelAI experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center mb-6">
                  <div className="text-4xl mr-4">{testimonial.avatar}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.location}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div className="flex text-yellow-400 mt-4">
                  ⭐⭐⭐⭐⭐
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="gradient-bg text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Start Your Next Adventure?
          </h2>
          <p className="text-xl text-primary-100 mb-10 leading-relaxed">
            Join thousands of smart travelers who trust TravelAI for their perfect trips. 
            Your dream vacation is just one click away.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="bg-gradient-to-r from-yellow-400 to-orange-400 text-primary-900 px-8 py-4 rounded-xl text-lg font-semibold hover:from-yellow-300 hover:to-orange-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Get Started Free
            </Link>
            <Link
              href="/auth/login"
              className="glass-effect text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/20 transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
          <p className="text-sm text-primary-200 mt-6">
            No credit card required • Start planning in seconds
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}