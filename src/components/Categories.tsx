import React from 'react';
import { Eye, Sun, Circle, Glasses } from 'lucide-react';
import { Link } from 'react-router-dom';

const Categories = () => {
  const categories = [
    {
      id: 1,
      name: 'Spectacles',
      to: '/spectacles',
      icon: <Glasses className="h-12 w-12 mb-4" />,
      description: 'Prescription eyewear for all ages',
      subcategories: ['Men', 'Women', 'Kids'],
      image: 'https://images.pexels.com/photos/1627639/pexels-photo-1627639.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
    },
    {
      id: 2,
      name: 'Sunglasses',
      to: '/sunglasses',
      icon: <Sun className="h-12 w-12 mb-4" />,
      description: 'UV protection & style combined',
      subcategories: ['Polarized', 'Non-polarized', 'Sports'],
      image: 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200'
    },
    {
      id: 3,
      name: 'Contact Lenses',
      to: '/contact-lenses',
      icon: <Circle className="h-12 w-12 mb-4" />,
      description: 'Comfortable vision correction',
      subcategories: ['Daily', 'Monthly', 'Colored'],
      image: 'https://images.pexels.com/photos/5752330/pexels-photo-5752330.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      color: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
    },
    {
      id: 4,
      name: 'Frames',
      to: '/frames',
      icon: <Eye className="h-12 w-12 mb-4" />,
      description: 'Designer frames without lenses',
      subcategories: ['Metal', 'Plastic', 'Rimless'],
      image: 'https://images.pexels.com/photos/947885/pexels-photo-947885.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
    },
    {
      id: 5,
      name: 'Solutions',
      to: '/solutions',
      icon: <Circle className="h-12 w-12 mb-4" />,
      description: 'Eye care solutions & accessories',
      subcategories: ['Cleaning', 'Storage', 'Protection', 'Maintenance'],
      image: 'https://images.pexels.com/photos/5752330/pexels-photo-5752330.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop',
      color: 'bg-teal-50 hover:bg-teal-100 border-teal-200'
    }
  ];

  return (
    <section id="categories" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Shop by Category
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our comprehensive range of eyewear solutions for every need and style
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              className={`relative group cursor-pointer rounded-2xl border-2 ${category.color} p-6 transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}
              to={category.to}
            >
              <div className="text-center">
                <div className="text-gray-700 mb-4 flex justify-center">
                  {category.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {category.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {category.description}
                </p>
                
                {/* Subcategories */}
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {category.subcategories.map((sub, index) => (
                    <span
                      key={index}
                      className="bg-white text-gray-700 text-xs px-3 py-1 rounded-full border"
                    >
                      {sub}
                    </span>
                  ))}
                </div>

                {/* Category Image */}
                <div className="mb-4 overflow-hidden rounded-lg">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                <button className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors">
                  Explore {category.name}
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;