// app/page.jsx
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-orange-500 to-amber-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="md:flex md:items-center md:space-x-8">
            <div className="md:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Delicious Food, Delivered Fast
              </h1>
              <p className="text-lg md:text-xl max-w-2xl">
                Order your favorite meals from local restaurants and get them
                delivered right to your doorstep.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-orange-600 bg-white hover:bg-gray-100 transition-colors duration-300"
                >
                  Sign Up Now
                </Link>
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md shadow-sm text-white hover:bg-orange-600 transition-colors duration-300"
                >
                  Browse Menu
                </Link>
              </div>
            </div>
            <div className="mt-10 md:mt-0 md:w-1/2 relative">
              <div className="aspect-w-5 aspect-h-3 rounded-lg shadow-xl overflow-hidden">
                <Image
                  src="/food.jpg"
                  alt="Delicious food platter"
                  width={600}
                  height={400}
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            className="w-full h-16 md:h-24 fill-gray-50"
          >
            <path d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,138.7C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform makes food ordering simple, secure, and enjoyable
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-lg shadow-md p-6 transition-transform hover:scale-105 duration-300">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Create an Account
            </h3>
            <p className="text-gray-600">
              Sign up securely with your email and password. Manage your profile
              and track your orders easily.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-lg shadow-md p-6 transition-transform hover:scale-105 duration-300">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Add to Cart
            </h3>
            <p className="text-gray-600">
              Browse our delicious menu, filter by category, and add your
              favorite items to your cart.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-lg shadow-md p-6 transition-transform hover:scale-105 duration-300">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Checkout & Enjoy
            </h3>
            <p className="text-gray-600">
              Complete your order with our secure payment system, track
              delivery, and enjoy your meal!
            </p>
          </div>
        </div>
      </div>

      {/* Popular Categories */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
            Popular Categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {["Pizza", "Burgers", "Sushi", "Desserts", "Healthy", "Drinks"].map(
              (category) => (
                <div
                  key={category}
                  className="bg-white rounded-lg shadow-md p-4 text-center hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                >
                  <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <span className="text-orange-600 text-xl font-bold">
                      {category.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900">{category}</h3>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl shadow-xl overflow-hidden">
            <div className="md:flex">
              <div className="px-6 py-12 md:p-12 md:w-1/2">
                <h2 className="text-3xl font-bold text-white">
                  Ready to order?
                </h2>
                <p className="mt-4 text-lg text-orange-100">
                  Sign up today and get 20% off your first order!
                </p>
                <div className="mt-8">
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-orange-600 bg-white hover:bg-gray-100 transition-colors duration-300"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
              <div className="md:w-1/2 relative">
                <Image
                  src="/food2.jpg"
                  alt="Delicious BiteRush meal"
                  width={500}
                  height={300}
                  className="object-cover h-full w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            What Our Customers Say
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Sarah T.",
                text: "The ordering process is so smooth and the food always arrives hot and fresh!",
              },
              {
                name: "Michael K.",
                text: "Great variety of restaurants and the delivery is always on time. Highly recommend!",
              },
              {
                name: "Jessica M.",
                text: "The app is intuitive and I love getting notifications about my order status. 5 stars!",
              },
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600 font-bold">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <div className="flex text-orange-500">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">BiteRush</h3>
              <p className="text-gray-400">
                Connecting hungry customers with delicious meals fast & fresh.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Menu</h4>
              <ul className="space-y-2">
                {[
                  "Home",
                  "Browse Menu",
                  "How It Works",
                  "Promotions",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="/menu"
                      className="text-gray-400 hover:text-white transition-colors duration-300"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                {["About Us", "Careers", "Partner With Us", "Contact"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors duration-300"
                      >
                        {item}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect With Us</h4>
              <div className="flex space-x-4">
                {["facebook", "twitter", "instagram", "youtube"].map(
                  (social) => (
                    <a
                      key={social}
                      href="#"
                      className="text-gray-400 hover:text-white transition-colors duration-300"
                    >
                      <span className="sr-only">{social}</span>
                      <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
                        <span className="font-bold text-sm">
                          {social.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </a>
                  )
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} BiteRush. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
