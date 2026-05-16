import React from 'react';
import { Truck, Shield, HeadphonesIcon, RefreshCw, Award, CreditCard } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Truck className="h-8 w-8" />,
      title: 'Free Delivery',
      description: 'Free home delivery on orders above ₹500 across India',
      color: 'text-blue-600'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: '2 Year Warranty',
      description: 'Comprehensive warranty on all frames and prescription lenses',
      color: 'text-emerald-600'
    },
    {
      icon: <RefreshCw className="h-8 w-8" />,
      title: 'Easy Returns',
      description: '30-day hassle-free return policy with full refund',
      color: 'text-orange-600'
    },
    {
      icon: <HeadphonesIcon className="h-8 w-8" />,
      title: '24/7 Support',
      description: 'Round-the-clock customer support via phone, chat, and email',
      color: 'text-purple-600'
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: 'Certified Products',
      description: 'All products are certified by optical industry standards',
      color: 'text-red-600'
    },
    {
      icon: <CreditCard className="h-8 w-8" />,
      title: 'Secure Payments',
      description: 'Multiple payment options with SSL encryption and GST compliance',
      color: 'text-indigo-600'
    }
  ];

  return (
    <section id="features" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Why Choose Nayan Eye Care?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're committed to providing the best eyewear shopping experience with premium quality and service
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <div className={`${feature.color} mb-4 flex justify-center`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;