import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function UserLayout({ children }) {
  return (
    <>
      {/* <Header /> */}
      <main>{children}</main>
      {/* <Footer /> */}
    </>
  );
}
