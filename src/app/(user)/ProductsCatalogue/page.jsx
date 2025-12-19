"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

// === Furniture Icons for Loader ===
import { Sofa, Armchair, BedDouble, Table } from "lucide-react"; // Added these

// === Read More Component ===
const DescriptionWithReadMore = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 120;

  if (!text || text.length <= maxLength) {
    return <p className="text-sm text-gray-700">{text}</p>;
  }

  return (
    <div>
      <p className={`text-sm text-gray-700 ${isExpanded ? "" : "line-clamp-3"}`}>
        {isExpanded ? text : `${text.slice(0, maxLength)}...`}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-teal-600 font-medium text-sm mt-1 hover:underline"
      >
        {isExpanded ? "Read less" : "Read more"}
      </button>
    </div>
  );
};

// === Furniture Loader Component ===
const FurnitureLoader = () => {
  const icons = [Sofa, Armchair, BedDouble, Table];
  const colors = ["text-amber-600", "text-teal-600", "text-orange-600", "text-emerald-600"];

  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative w-48 h-48">
        <div className="absolute inset-0 animate-ping">
          <div className="w-full h-full rounded-full border-4 border-amber-200 opacity-20" />
        </div>

        {icons.map((Icon, i) => {
          const angle = (i * 90) - 90; // 4 icons → 90° apart
          const x = 50 + 40 * Math.cos((angle * Math.PI) / 180);
          const y = 50 + 40 * Math.sin((angle * Math.PI) / 180);

          return (
            <div
              key={i}
              className="absolute animate-spin-slow"
              style={{
                top: `${y}%`,
                left: `${x}%`,
                transform: "translate(-50%, -50%)",
                animationDelay: `${i * 0.2}s`,
              }}
            >
              <Icon size={36} className={`${colors[i]} opacity-80 drop-shadow-lg`} />
            </div>
          );
        })}

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="text-xl font-bold text-amber-700">Loading...</p>
          <p className="text-sm text-gray-600 mt-1"> Get Ready to Explore premium Furniture</p>
        </div>
      </div>
    </div>
  );
};

// === Main Catalog Page ===
export default function CatalogPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState({});
  const [activeCategory, setActiveCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollRef = useRef(null);

  // Reset image index
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedProduct]);

  // === Load Categories & Products ===
  useEffect(() => {
    const q = query(collection(db, "categories"));
    const unsub = onSnapshot(q, (snap) => {
      const cats = [];
      const prods = {};

      snap.forEach((d) => {
        const id = d.id;
        cats.push(id);
        prods[id] = d.data().products || [];
      });

      setCategories(cats);
      setProducts(prods);
      if (cats.length > 0 && !activeCategory) {
        setActiveCategory(cats[0]);
      }
    });

    return () => unsub();
  }, []);

  // === Cart Persistence ===
  useEffect(() => {
    const saved = localStorage.getItem("furniture_cart");
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error("Corrupted cart", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("furniture_cart", JSON.stringify(cart));
  }, [cart]);

  // === Cart Actions ===
  const addToCart = (product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      if (exists) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setSelectedProduct(null);
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  // === WhatsApp Messages ===
  const contactProduct = (product) => {
    const msg = `Hi! I'm interested in:\n\n*${product.name}* (ID: ${product.id})\n₹${product.mrp} ${product.offerPrice ? `(Offer: ₹${product.offerPrice})` : ""}\nSize: ${product.dimension} ${product.units}\n${product.description || ""}\n\nPlease share details.`;
    window.open(`https://wa.me/918210936795?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const proceedToBuy = () => {
    if (cart.length === 0) return;

    const total = cart.reduce((sum, i) => sum + i.mrp * i.quantity, 0);
    const items = cart.map((i) => `*${i.name}* × ${i.quantity} = ₹${i.mrp * i.quantity}`).join("\n");
    const newId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderId(newId);

    const msg = `*New Order*\n\n*Order ID:* ${newId}\n\n${items}\n\n*Total: ₹${total}*\n\nPlease confirm.`;

    window.open(`https://wa.me/918210936795?text=${encodeURIComponent(msg)}`, "_blank");

    setCart([]);
    localStorage.removeItem("furniture_cart");
    setCartOpen(false);
    setSuccessOpen(true);
  };

  // === Image Helpers ===
  const getImages = (p) => p.images && p.images.length > 0 ? p.images.filter(Boolean) : [];
  const navigateImage = (dir) => {
    if (!selectedProduct) return;
    const imgs = getImages(selectedProduct);
    setCurrentImageIndex((i) => dir === "prev" ? (i === 0 ? imgs.length - 1 : i - 1) : (i === imgs.length - 1 ? 0 : i + 1));
  };

  const currentProducts = products[activeCategory] || [];
  const totalAmount = cart.reduce((sum, i) => sum + i.mrp * i.quantity, 0);

  // === Manual Scroll to Category (No Smooth) ===
  const scrollToCategory = (cat) => {
    const el = document.getElementById(`cat-${cat}`);
    if (el && scrollRef.current) {
      el.scrollIntoView({
        behavior: "auto",
        inline: "center",
        block: "nearest",
      });
    }
    setActiveCategory(cat);
  };

  // Show loader only while categories are loading
  if (categories.length === 0) {
    return <FurnitureLoader />;
  }

  return (
    <section className="min-h-screen mt- bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <div className="text-center py-6 bg-gradient-to-r from-orange-100 via-amber-100 to-yellow-50">
        <h2 className="text-2xl md:text-4xl font-bold text-orange-700">Premium Living Spaces</h2>
        <p className="text-gray-600 mt-3 max-w-2xl mx-auto text-sm md:text-lg">
          Handcrafted luxury furnitures products for modern homes.
        </p>
      </div>

      {/* === TOP NAV: Manual Horizontal Scroll with Peek === */}
      <div className="sticky top-[6px] z-40 bg-white shadow-sm overflow-hidden">
        <div
          ref={scrollRef}
          className="flex gap-1 overflow-x-auto scrollbar-hide px-8 py-1 select-none"
          style={{
            scrollSnapType: "none",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-x",
            overscrollBehaviorX: "contain",
            scrollBehavior: "auto",
            maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 5%, black 90%, transparent 100%)",
          }}
        >
          {categories.map((cat) => {
            const firstImg = products[cat]?.[0]?.images?.[0] || "";
            return (
              <div
                key={cat}
                id={`cat-${cat}`}
                onClick={() => scrollToCategory(cat)}
                className={`flex flex-col items-center p-2 rounded-xl cursor-pointer transition-all min-w-[100px] flex-shrink-0 
                  ${activeCategory === cat
                    ? "bg-amber-100 border border-amber-400 shadow-md"
                    : "hover:bg-gray-50"
                  }`}
              >
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-200 shadow-sm">
                  {firstImg ? (
                    <img
                      src={firstImg}
                      alt={cat}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </div>
                <span className="text-xs font-semibold text-center mt-2 uppercase tracking-wider">
                  {cat}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* === Main Content === */}
      <div className="lg:ml-56 max-w-7xl mx-auto px-4 py-6 lg:py-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
          {activeCategory} ({currentProducts.length})
        </h2>

        {currentProducts.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No products in this category.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentProducts.map((p) => {
              const imgs = getImages(p);
              const firstImg = imgs[0] || "";
              return (
                <Card
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="overflow-hidden bg-white rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer border"
                >
                  <div className="relative h-56 bg-gray-100">
                    {firstImg ? (
                      <img
                        src={firstImg}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">
                      ID: {p.id}
                    </div>
                  </div>

                  <div className="p-4 space-y-1">
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{p.name}</h3>
                    <p className="text-sm text-gray-600">{p.dimension} {p.units}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-amber-600">₹{p.mrp}</span>
                      {p.offerPrice && (
                        <span className="text-sm text-gray-400 line-through">₹{p.offerPrice}</span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* === Product Dialog === */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        {selectedProduct && (
          <DialogContent className="max-w-full mt-4 md:max-w-2xl p-2 overflow-hidden rounded-sm md:rounded-2xl">
            <DialogHeader className="p-2 pb-0">
              <DialogTitle className="text-xl pr-8">{selectedProduct.name}</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col md:flex-row gap-2 p-1 pt-0">
              <div className="relative w-full md:w-1/2 h-64 md:h-80 bg-gray-100 rounded-lg overflow-hidden">
                {(() => {
                  const imgs = getImages(selectedProduct);
                  const img = imgs[currentImageIndex] || "";
                  return (
                    <>
                      {img ? (
                        <img src={img} alt="furniture" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                      {imgs.length > 1 && (
                        <>
                          <button
                            onClick={() => navigateImage("prev")}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <button
                            onClick={() => navigateImage("next")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                          >
                            <ChevronRight size={20} />
                          </button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                            {currentImageIndex + 1} / {imgs.length}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="flex-1 space-y-3 px-4">
                <div>
                  <p className="text-md text-gray-600">
                    <strong>Size:</strong> {selectedProduct.dimension} {selectedProduct.units}
                  </p>
                  {selectedProduct.description && (
                    <div className="mt-2">
                      <DescriptionWithReadMore text={selectedProduct.description} />
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-2xl font-bold text-amber-600">
                    ₹{selectedProduct.mrp}
                    <span className="text-sm font-normal text-gray-500 ml-1">/unit</span>
                  </p>
                  {selectedProduct.offerPrice && (
                    <p className="text-sm text-gray-400 line-through">
                      ₹{selectedProduct.offerPrice}/unit
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-amber-500 hover:bg-amber-600"
                    onClick={() => addToCart(selectedProduct)}
                  >
                    Add to Cart
                  </Button>
                  <Button
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                    onClick={() => contactProduct(selectedProduct)}
                  >
                    Contact to Buy
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* === Floating Cart === */}
      <div
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-full shadow-lg cursor-pointer z-50"
      >
        <ShoppingCart size={26} />
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
            {cart.length}
          </span>
        )}
      </div>

      {/* === Cart Dialog === */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle>Your Cart ({cart.length} items)</DialogTitle>
          </DialogHeader>
          {cart.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Your cart is empty.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {cart.map((item) => {
                const img = getImages(item)[0] || "";
                return (
                  <div key={item.id} className="flex items-center gap-3 border-b pb-3">
                    <div className="w-14 h-14 rounded-md overflow-hidden bg-gray-100">
                      {img ? (
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        ₹{item.mrp} × {item.quantity} = ₹{item.mrp * item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(item.id, -1)}>
                        <Minus size={12} />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(item.id, 1)}>
                        <Plus size={12} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removeFromCart(item.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-between font-bold text-lg pt-3 border-t">
                <span>Total:</span>
                <span>₹{totalAmount}</span>
              </div>

              <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={proceedToBuy}>
                Proceed to Buy via WhatsApp
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* === Success Dialog === */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-sm text-center rounded-2xl p-8">
          <CheckCircle className="text-green-500 w-16 h-16 mx-auto mb-3" />
          <DialogTitle className="text-xl font-bold">Order Placed!</DialogTitle>
          <p className="text-gray-600 mt-2">
            Your order <span className="font-semibold text-teal-600">#{orderId}</span> has been sent.
          </p>
          <Button className="mt-5 bg-teal-600 hover:bg-teal-700" onClick={() => setSuccessOpen(false)}>
            Done
          </Button>
        </DialogContent>
      </Dialog>

      {/* === Hide Scrollbar + Fade Effect === */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </section>
  );
}
