import {
    FaFacebookF,
    FaInstagram,
    FaYoutube,
} from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";
import { FaArrowRightLong  } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { useAuth } from "../src/auth/AuthContext";


const Footer = () => {
    const { user } = useAuth();

    const primaryLinks = [
        { label: "Home", to: "/" },
        { label: "Hostels", to: "/hostels" },
        { label: "Rooms", to: "/rooms" },
        { label: "Contact", to: "/contact" },
    ];

    const dashboardLink = user?._id
        ? {
            label: user?.role === "owner" ? "Owner Dashboard" : "Student Dashboard",
            to: user?.role === "owner" ? "/dashboard/owner" : "/dashboard/user",
        }
        : { label: "Login / Register", to: "/login" };

    const accountLinks = [
        { label: "Become Owner", to: "/become-owner" },
        dashboardLink,
        { label: "Book a Room", to: "/rooms" },
    ];

    return (
        <footer className="relative text-white min-h-[750px] overflow-hidden">
            {/* Background */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage:
                        "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c')",
                }}
            ></div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/100 via-black/90 to-transparent"></div>

            {/* Content flex container for min height */}
            <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-28 md:pt-20 md:pb-40 flex flex-col justify-between h-full">

                {/* TOP ROW (Newsletter LEFT + Links RIGHT) */}
                <div className="flex flex-col lg:flex-row justify-between items-start gap-12">

                    {/* LEFT → Newsletter */}
                    <div className="max-w-xl w-full">
                        <h2 className="!text-4xl md:!text-5xl font-bold mb-6 leading-tight">
                            Stay Updated! Subscribe To Our Newsletter
                        </h2>

                        <div className="flex items-center bg-white rounded-full p-2">
                            <input
                                type="email"
                                placeholder="Your email"
                                className="flex-1 px-3 py-1 text-black outline-none bg-transparent"
                            />

                            {/* PERFECT CIRCLE BUTTON */}
                            <button className="bg-[#2b5a84] w-12 h-12 flex items-center justify-center text-white !text-2xl !font-bold shrink-0" style={{ borderRadius: '50%' }}>
                                <FaArrowRightLong />
                            </button>
                        </div>
                    </div>

                    {/* RIGHT → Project Links */}
                    <div className="flex flex-col sm:flex-row gap-10 sm:gap-16">
                        <div>
                            <h4 className="font-semibold mb-4">Explore</h4>
                            <ul className="space-y-2 text-gray-300 p-0 m-0 list-none">
                                {primaryLinks.map((link) => (
                                    <li key={link.to} className="mb-4">
                                        <Link
                                            to={link.to}
                                            className="!no-underline visited:!no-underline hover:!no-underline"
                                            style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none" }}
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4">Account</h4>
                            <ul className="space-y-2 text-gray-300 p-0 m-0 list-none">
                                {accountLinks.map((link) => (
                                    <li key={link.to} className="mb-4">
                                        <Link
                                            to={link.to}
                                            className="!no-underline visited:!no-underline hover:!no-underline"
                                            style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none" }}
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* BOTTOM ROW */}
                <div className="mt-16 md:mt-20 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-lg text-white font-semibold">
                        © 2026 Intellistay. All Rights Reserved.
                    </div>

                    <div className="flex items-center gap-10 text-4xl">
                        <FaFacebookF className="cursor-pointer hover:text-gray-300" />
                        <FaYoutube className="cursor-pointer hover:text-gray-300" />
                        <BsTwitterX className="cursor-pointer hover:text-gray-300" />
                        <FaInstagram className="cursor-pointer hover:text-gray-300" />
                    </div>
                </div>

            </div>

            {/* Full-width bottom watermark */}
            <div className="absolute bottom-0 left-0 w-full pointer-events-none overflow-hidden h-[120px] md:h-[175px] lg:h-[220px]">
                <svg width="100%" height="100%" viewBox="0 0 1000 240" preserveAspectRatio="none">
                    <text
                        x="50%"
                        y="30%"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="rgba(176, 176, 176, 0.78)"
                        fontSize="100"
                        fontWeight="600"
                        fontFamily="sans-serif"
                        textLength="1000"
                        lengthAdjust="spacingAndGlyphs"
                    >
                        INTELLISTAY
                    </text>
                </svg>
            </div>
        </footer>
    );
};

export default Footer;