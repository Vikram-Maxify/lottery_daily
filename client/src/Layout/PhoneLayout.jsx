import { Outlet } from "react-router-dom";
import Header from "../Components/Header";
import BottomNavbar from "./BottomNavbar";

const PhoneLayout = () => {
  return (
    <div className="min-h-screen w-full bg-gray-300 flex justify-center">
      <div
        className="
          w-full
          max-w-[490px]
          min-h-screen
          bg-neutral-950
          relative
          shadow-2xl
          shadow-black/60
          phone-scroll
          overflow-y-auto
        "
      >
        <Header />

        <main className="pb-[100px]">
          <Outlet />
        </main>

        {/* ❌ WhatsApp yahan se hata diya */}

        <BottomNavbar />
      </div>
    </div>
  );
};

export default PhoneLayout;