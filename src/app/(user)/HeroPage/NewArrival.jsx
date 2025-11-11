"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function NewArrivalsCarousel() {
  const [latestProducts, setLatestProducts] = useState([]);   // latest 5
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [imageIdx, setImageIdx] = useState({});               // per product
  const [cardIdx, setCardIdx] = useState(0);                  // carousel position
  const imageInterval = useRef({});
  const cardInterval = useRef(null);
  const visible = 5;                                          // max cards on lg

  // ---------- RESPONSIVE ----------
  const [cardsVisible, setCardsVisible] = useState(visible);
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w < 640) setCardsVisible(1);
      else if (w < 1024) setCardsVisible(2);
      else setCardsVisible(visible);
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // ---------- VALID IMAGE ----------
  const validImageUrl = (url) => {
    if (!url || typeof url !== "string") return "/placeholder.png";
    const t = url.trim();
    if (!t) return "/placeholder.png";
    if (t.startsWith("data:") || /^https?:\/\//i.test(t) || t.startsWith("/")) return t;
    return "/placeholder.png";
  };

  // ---------- FETCH LATEST 5 ----------
  useEffect(() => {
    const map = new Map(); // key = `${cat}-${id}`
    const unsubs = [];

    const refresh = () => {
      const sorted = Array.from(map.values())
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .slice(0, 5);
      setLatestProducts(sorted);
    };

    const process = (prods = [], cat) => {
      prods.forEach((p) => {
        const ts = p.updatedAt?.toMillis?.() ?? 0;
        map.set(`${cat}-${p.id}`, { ...p, category: cat, updatedAt: ts });
      });
      refresh();
    };

    const mainUnsub = onSnapshot(collection(db, "categories"), (snap) => {
      // reset listeners except the main one
      unsubs.slice(1).forEach((u) => u());
      unsubs.length = 1;
      map.clear();

      snap.forEach((catDoc) => {
        const cat = catDoc.id;
        process(catDoc.data()?.products || [], cat);

        const catUnsub = onSnapshot(doc(db, "categories", cat), (upd) => {
          process(upd.data()?.products || [], cat);
        });
        unsubs.push(catUnsub);
      });
    });
    unsubs.push(mainUnsub);
    return () => unsubs.forEach((u) => u());
  }, []);

  // ---------- PHONE ----------
  useEffect(() => {
    const u = onSnapshot(doc(db, "settings", "contact"), (s) => {
      setPhoneNumber(s.exists() ? s.data()?.phoneNumber || "" : "");
    });
    return u;
  }, []);

  // ---------- PER-PRODUCT IMAGE SLIDE ----------
  useEffect(() => {
    // clear old
    Object.values(imageInterval.current).forEach(clearInterval);
    imageInterval.current = {};

    latestProducts.forEach((p) => {
      if (!p.images || p.images.length <= 1) return;

      imageInterval.current[p.id] = setInterval(() => {
        setImageIdx((prev) => ({
          ...prev,
          [p.id]: ((prev[p.id] ?? 0) + 1) % p.images.length,
        }));
      }, 3000);
    });

    return () => Object.values(imageInterval.current).forEach(clearInterval);
  }, [latestProducts]);

  // ---------- CARD AUTO-SLIDE (NO DUPLICATES) ----------
  useEffect(() => {
    if (latestProducts.length <= cardsVisible) return;

    cardInterval.current = setInterval(() => {
      setCardIdx((i) => (i + 1) % latestProducts.length);
    }, 4000);

    return () => clearInterval(cardInterval.current);
  }, [latestProducts.length, cardsVisible]);

  const prevCard = () => {
    setCardIdx((i) => (i - 1 + latestProducts.length) % latestProducts.length);
  };
  const nextCard = () => {
    setCardIdx((i) => (i + 1) % latestProducts.length);
  };

  const prevImg = (id, imgs) => {
    setImageIdx((prev) => ({
      ...prev,
      [id]: ((prev[id] ?? 0) - 1 + imgs.length) % imgs.length,
    }));
  };
  const nextImg = (id, imgs) => {
    setImageIdx((prev) => ({
      ...prev,
      [id]: ((prev[id] ?? 0) + 1) % imgs.length,
    }));
  };

  const handleContact = (p) => {
    if (!phoneNumber) return;
    const msg = encodeURIComponent(`Hi, I am interested in ${p.name} (ID: ${p.id})`);
    window.open(`https://wa.me/${918210936795}?text=${msg}`, "_blank");
  };

  if (!latestProducts.length) {
    return (
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="mb-12 text-3xl font-bold">New Arrivals</h2>
          <p className="text-gray-500">No products yet.</p>
        </div>
      </section>
    );
  }

  // ---- RENDER ----
  return (
    <section className="bg-white py-16 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-12 text-3xl font-bold text-center">New Arrivals</h2>

        <div className="relative">
          <div className="overflow-hidden">
            <div
              className="flex gap-6 transition-transform duration-700 ease-in-out"
              style={{
                transform: `translateX(-${(cardIdx * 100) / cardsVisible}%)`,
              }}
            >
              {latestProducts.map((product, idx) => {
                const imgs = product.images || [];
                const imgIdx = imageIdx[product.id] ?? 0;
                const curImg = validImageUrl(imgs[imgIdx] ?? imgs[0]);

                return (
                  <div
                    key={product.id}
                    className={`flex-shrink-0 w-[calc(100%/${cardsVisible})] flex justify-center`}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <Card className="group relative h-80 w-full max-w-[294px] overflow-hidden rounded-xl shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:scale-105">
                      <img
                        src={curImg}
                        alt={product.name}
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                      />

                      {/* Hover overlay */}
                      <div
                        className={`absolute inset-0 flex flex-col justify-center items-center bg-black/60 text-white text-center p-4 transition-opacity duration-300 ${
                          hoveredIndex === idx ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <h3 className="text-lg font-bold">{product.name}</h3>
                        <p className="mb-1">Price: ₹{product.mrp}</p>
                        <p className="text-sm mb-3">
                          {product.dimension} {product.units}
                        </p>
                        <Button
                          variant="default"
                          onClick={() => handleContact(product)}
                          className="w-full max-w-xs"
                        >
                          Contact
                        </Button>
                      </div>

                      {/* Image nav (per card) */}
                      {/* {imgs.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              prevImg(product.id, imgs);
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full shadow hover:bg-white"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              nextImg(product.id, imgs);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full shadow hover:bg-white"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </>
                      )} */}
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card navigation */}
          {latestProducts.length > cardsVisible && (
            <>
              <button
                onClick={prevCard}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow hover:bg-white z-10"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextCard}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow hover:bg-white z-10"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {latestProducts.length > cardsVisible && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: Math.ceil(latestProducts.length / cardsVisible) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCardIdx(i * cardsVisible)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  Math.floor(cardIdx / cardsVisible) === i ? "bg-amber-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}