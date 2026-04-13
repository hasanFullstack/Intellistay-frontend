import {
    FaFacebookF,
    FaInstagram,
    FaYoutube,
} from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";


const Footer = () => {
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
            <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-40 md:py-20 md:pb-48 flex flex-col justify-between h-full">

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
                            <button className="bg-[var(--primary-color)] w-12 h-12 flex items-center justify-center !rounded-full bg-blue-500 text-white !text-2xl !font-bold shrink-0" style={{ borderRadius: '50%' }}>
                                →
                            </button>
                        </div>
                    </div>

                    {/* RIGHT → Pages + Resources */}
                    <div className="flex flex-col sm:flex-row gap-10 sm:gap-16">
                        <div>
                            <h4 className="font-semibold mb-4">Pages</h4>
                            <ul className="space-y-2 text-gray-1000 p-0 m-0 list-none">
                                <li className="hover:text-white cursor-pointer mb-4">Home</li>
                                <li className="hover:text-white cursor-pointer mb-4">About-Us</li>
                                <li className="hover:text-white cursor-pointer mb-4">Contact-Us</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-4">Resources</h4>
                            <ul className="space-y-2 text-gray-300 p-0 m-0 list-none">
                                <li className="hover:text-white cursor-pointer mb-4">FAQS</li>
                                <li className="hover:text-white cursor-pointer mb-4">Privacy Policy</li>
                                <li className="hover:text-white cursor-pointer mb-4">Terms & Conditions</li>
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

            {/* BIG TEXT (STRETCHED EDGE-TO-EDGE) */}
            <div className="absolute bottom-0 left-0 w-full pointer-events-none overflow-hidden h-[80px] md:h-[140px] lg:h-[180px]">
                <svg width="100%" height="100%" viewBox="0 0 1000 200" preserveAspectRatio="none">
                    <text
                        x="50%"
                        y="80%"
                        textAnchor="middle"
                        fill="rgba(176, 176, 176, 0.79)"
                        fontSize="210"
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