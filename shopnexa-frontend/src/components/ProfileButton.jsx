import { Link, useLocation } from "react-router-dom";

export default function ProfileButton({ variant = "floating" }) {
  const location = useLocation();
  const hideFloating =
    location.pathname === "/profile" ||
    location.pathname.startsWith("/store") ||
    location.pathname.startsWith("/product") ||
    location.pathname.startsWith("/admin"); // hide on admin pages

  const Button = (
    <Link
      to="/profile"
      className={`group rounded-full shadow flex items-center justify-center hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-pink-300 
        ${variant === 'inline' ? 'w-9 h-9' : 'w-11 h-11 md:w-12 md:h-12'}
        bg-gradient-to-br from-fuchsia-600 via-pink-600 to-purple-600 text-white`}
      aria-label="Profile"
      title="Profile"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`${variant==='inline'?'w-5 h-5':'w-6 h-6'}`} fill="#ffffff">
        <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z"/>
      </svg>
    </Link>
  );

  if (variant === "inline") return Button;
  if (hideFloating) return null;
  return (
    <div className="fixed top-4 right-4 z-50">
      {Button}
    </div>
  );
}
