import { Outlet } from "react-router-dom";
import Header from "../Components/Header";
import BottomNavbar from "./BottomNavbar";

const PhoneLayout = () => {
  return (
    <div className="min-h-screen w-full flex justify-center bg-gray-600">
      <div
        className="
          w-full
          max-w-[490px]
          min-h-screen
          relative
          shadow-2xl
          phone-scroll
          overflow-y-auto
        "
      >
        <Header />

        <main className="">
          <Outlet />
        </main>

        <BottomNavbar />
      </div>
    </div>
  );
};

export default PhoneLayout;
