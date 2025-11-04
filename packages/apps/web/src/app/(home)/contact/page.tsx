export default function ContactPage() {
  return (
    <div className="py-24 px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      <div className="prose prose-lg dark:prose-invert">
        <p>
          We'd love to hear from you! Reach out to us using the information below.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Get In Touch</h2>
            <ul className="space-y-3">
              <li>
                <strong>Email:</strong> support@example.com
              </li>
              <li>
                <strong>Phone:</strong> +1 (555) 123-4567
              </li>
              <li>
                <strong>Address:</strong> 123 Main Street, City, Country
              </li>
            </ul>
          </div>
          
          <div>
            <h2 className="text-2xl font-semibold mb-4">Business Hours</h2>
            <ul className="space-y-2">
              <li>Monday - Friday: 9:00 AM - 6:00 PM</li>
              <li>Saturday: 10:00 AM - 4:00 PM</li>
              <li>Sunday: Closed</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Send Us a Message</h2>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
              <input 
                type="text" 
                id="name" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600" 
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <input 
                type="email" 
                id="email" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600" 
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
              <textarea 
                id="message" 
                rows={4} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600" 
                placeholder="Your message here..."
              ></textarea>
            </div>
            <button 
              type="submit" 
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}