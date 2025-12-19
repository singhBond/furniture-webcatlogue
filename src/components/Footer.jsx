"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Facebook, Twitter, Instagram } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Footer() {
  const [footerData, setFooterData] = useState({
    contact: { phone: "", email: "", storesLink: "" },
    sections: [],
    // Firestore: social will be an array like:
    // [ { icon: "facebook", href: "https://facebook.com/yourpage" },
    //   { icon: "instagram", href: "https://instagram.com/yourpage" } ]
    social: [],
  });

  // fetch footer data from Firestore
  useEffect(() => {
    const fetchFooter = async () => {
      const snap = await getDoc(doc(db, "adminData", "footer"));
      if (snap.exists()) {
        // Ensure we always have an array with facebook & instagram if saved individually
        const data = snap.data();
        const socialArr = Array.isArray(data.social)
          ? data.social
          : [
              { icon: "facebook", href: data.social?.facebook || "" },
              { icon: "instagram", href: data.social?.instagram || "" },
            ];
        setFooterData({ ...data, social: socialArr });
      }
    };
    fetchFooter();
  }, []);

  const { contact, sections, social } = footerData;

  // map Firestore icon name -> Lucide component
  const iconMap = {
    facebook: Facebook,
    twitter: Twitter,
    instagram: Instagram,
  };

  return (
    <footer className="bg-[#a16b1e] text-gray-300">
      {/* Top section */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-4">
        {/* Contact info */}
        <div>
          {/* <p className="mb-2">
            Find a location nearest you. See{" "}
            <Link href={contact.storesLink || "#"} className="underline">
              Our Stores
            </Link>
          </p> */}
          <p className="mb-1">T: + {contact.phone}</p>
          <p className="mb-4">E: {contact.email}</p>

          {/* Social icons fetched from Firestore */}
          <div className="flex space-x-3">
            {(social.length
              ? social
              : [
                  { icon: "facebook", href: "https://facebook.com" },
                  { icon: "instagram", href: "https://instagram.com" },
                ]
            ).map((s, i) => {
              const Icon = iconMap[s.icon?.toLowerCase()] || null;
              return (
                <Link
                  key={i}
                  href={s.href || "#"}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-ayellow-700 hover:bg-yellow-700"
                >
                  {Icon && <Icon size={18} />}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Dynamic link sections */}
        {(sections.length
          ? sections
          : [
              {
                title: "Account",
                links: [" Order", "Shipping",   "Exchange"],
              },
              {
                title: "Information",
                links: ["Term & Policy",  "Delivery", "Services"],
              },
              {
                title: "Store",
                links: [
                  
                  "Best Sellers",
                  "Discount",
                  "Latest Products",
                  
                ],
              },
            ]
        ).map((sec) => (
          <div key={sec.title}>
            <h4 className="mb-4 font-semibold text-amber-400">{sec.title}</h4>
            <ul className="space-y-2">
              {sec.links.map((l) => (
                <li key={l}>
                  <Link
                    href={`/${l.toLowerCase().replace(/\s+/g, "-")}`}
                    className="hover:underline"
                  >
                    {l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-yellow-700">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-4 md:flex-row">
          <p className="text-sm">
            © {new Date().getFullYear()}, Furnitures-CatWeb.
          </p>
        </div>
      </div>

      {/* Scroll-to-top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-700 text-white hover:bg-yellow-700"
        aria-label="Scroll to top"
      >
        ↑
      </button>
    </footer>
  );
}
