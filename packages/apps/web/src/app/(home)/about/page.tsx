export default function AboutPage() {
  return (
    <div className="py-24 px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">About Us</h1>
      <div className="prose prose-lg dark:prose-invert">
        <p>
          Welcome to our application. We are dedicated to providing the best service to our users.
        </p>
        <p>
          Our team consists of experienced professionals who are passionate about what they do.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
        <p>
          Our mission is to create innovative solutions that improve people's lives and make technology accessible to everyone.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4">Our Values</h2>
        <ul>
          <li>Innovation: We constantly strive to improve and innovate</li>
          <li>Integrity: We conduct business ethically and transparently</li>
          <li>Customer Focus: Our customers are at the heart of everything we do</li>
          <li>Teamwork: We believe in collaboration and mutual respect</li>
        </ul>
      </div>
    </div>
  );
}